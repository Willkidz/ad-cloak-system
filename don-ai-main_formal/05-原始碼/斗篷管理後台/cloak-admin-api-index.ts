import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as fflate from 'fflate';
import domainsRouter from './routes/domains';
import shortlinksRouter from './routes/shortlinks';
import lineConfigRouter from './routes/line-config';
import lineGroupsRouter from './routes/groups';
import pixelGroupsRouter from './routes/pixel-groups';
// import pixelsRouter from './routes/pixels'; // 舊版像素庫已移除
import dashboardRouter from './routes/dashboard';
import groupConfigRouter from './routes/group-config';

type Bindings = {
  DB: D1Database;
  CLOAKER_CONFIG: KVNamespace;
  R2_ASSETS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// 啟用 CORS
app.use('/api/*', cors());

// 錯誤處理
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ success: false, error: err.message }, 500);
});

// 健康檢查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 掛載 domains 路由
app.route('/api/v1/domains', domainsRouter);

// 掛載 shortlinks 路由
app.route('/api/v1/shortlinks', shortlinksRouter);

// 掛載 line_config 路由
app.route('/api/v1/line-config', lineConfigRouter);

// 掛載 line_groups 路由
app.route('/api/v1/line-groups', lineGroupsRouter);

// 掛載 group_config 路由
app.route('/api/v1/group-config', groupConfigRouter);

// 掛載 pixel_groups 路由
app.route('/api/v1/pixel-groups', pixelGroupsRouter);

// 掛載 dashboard 路由
app.route('/api/v1/dashboard', dashboardRouter);

// 路由：獲取分組列表（供廣告編輯頁面的「分組」下拉選單使用）
app.get('/api/v1/groups', async (c) => {
  try {
    // 從 line_groups 表取得主要分組（有 code 的）
    const { results: lineGroups } = await c.env.DB.prepare(
      'SELECT id, name, code, tags FROM line_groups ORDER BY name ASC'
    ).all();

    // 從 line_config 取得所有 distinct group_name（包含 N系列、其他等）
    const { results: configGroups } = await c.env.DB.prepare(
      "SELECT DISTINCT group_name FROM line_config WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name"
    ).all();

    // 組合結果：line_groups 表的分組用 code 作為 prefix
    const groupMap = new Map<string, { prefix: string; name: string; label: string }>();

    // 1. 先加入 line_groups 表的分組（有 code）
    for (const g of lineGroups as any[]) {
      groupMap.set(g.name, {
        prefix: g.code || g.name,
        name: g.name,
        label: g.name,
      });
    }

    // 2. 再加入 line_config 中有但 line_groups 沒有的分組
    for (const g of configGroups as any[]) {
      if (!groupMap.has(g.group_name)) {
        groupMap.set(g.group_name, {
          prefix: g.group_name,
          name: g.group_name,
          label: g.group_name,
        });
      }
    }

    const groups = Array.from(groupMap.values());
    return c.json({ success: true, data: groups });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 路由：獲取 LIFF 選項（供廣告編輯頁面使用）
app.get('/api/v1/liff-options', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, tag, name, liff_id, channel_id AS line_oa_id, group_name FROM line_config WHERE liff_id IS NOT NULL AND liff_id != '' ORDER BY group_name, tag ASC`   ).all();
    const options = (results as any[]).map(r => ({
      id: String(r.id),
      tag: r.tag || '',
      name: r.name || '',
      label: r.tag ? `${r.tag} - ${r.name || ''}` : r.name || '',
      theme: '',
      liff_id: r.liff_id || '',
      line_oa_id: r.line_oa_id || '',
      group_name: r.group_name || '',
    }));
    return c.json({ success: true, data: options });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 路由：獲取廣告列表
app.get('/api/v1/campaigns', async (c) => {
  const { search, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = 'SELECT * FROM campaigns';
  let countQuery = 'SELECT COUNT(*) as total FROM campaigns';
  const params: any[] = [];
  
  if (search) {
    query += ' WHERE name LIKE ?';
    countQuery += ' WHERE name LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const totalResult = await c.env.DB.prepare(countQuery).bind(...(search ? [`%${search}%`] : [])).first();
  
  const items = results.map((row: any) => ({
    ...row,
    customer_links: JSON.parse(row.customer_links || '[]'),
    short_codes: JSON.parse(row.short_codes || '[]'),
    allowed_devices: JSON.parse(row.allowed_devices || '[]'),
    blacklist_rules: JSON.parse(row.blacklist_rules || '[]'),
    line_links: JSON.parse(row.line_links || '[]'),
    whatsapp_links: JSON.parse(row.whatsapp_links || '[]'),
    other_links: JSON.parse(row.other_links || '[]'),
    ad_pixels: JSON.parse(row.ad_pixels || '[]'),
    bc_pixels: JSON.parse(row.bc_pixels || '[]')
  }));

  return c.json({
    success: true,
    data: {
      items,
      total: (totalResult as any)?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// 路由：批次查詢廣告統計數據（瀏覽 + 預估 + 歸因+ + 投放率 + 轉化率）
// ❗ 必須在 /campaigns/:id 之前註冊，否則會被 :id 放行攝截
app.get('/api/v1/campaigns/stats', async (c) => {
  const db = c.env.DB;

  try {
    // 取得 since 參數（可選）
    const since = c.req.query('since') || null;
    const sinceClauseUL = since ? ' AND ul.created_at >= ?' : '';
    const sinceClauseCK = since ? ' AND ck.timestamp >= ?' : '';

    // 1. 取得所有 campaign 的 id, ad_code 和 approved_at
    const campaignsResult = await db.prepare(`
      SELECT id, ad_code, approved_at FROM campaigns
    `).all();
    const campaigns = (campaignsResult.results || []) as any[];

    // 建立映射表
    const adCodeToCampaignId: Record<string, string> = {};
    const campaignIdToAdCode: Record<string, string> = {};
    for (const camp of campaigns) {
      if (camp.ad_code && camp.ad_code !== '') {
        adCodeToCampaignId[camp.ad_code] = camp.id;
      }
      campaignIdToAdCode[camp.id] = camp.ad_code || '';
    }

    // 2. 瀏覽數 (impressions) — unified_logs 中 money_page_served 事件
    const impressionsByCampaignIdStmt = db.prepare(`
      SELECT ul.campaign_id, COUNT(*) as cnt
      FROM unified_logs ul
      JOIN campaigns c ON c.id = ul.campaign_id
      WHERE ul.event_type = 'money_page_served'
        AND ul.campaign_id IS NOT NULL AND ul.campaign_id != ''
        ${sinceClauseUL ? 'AND ul.created_at >= ?' : ''}
        AND (c.approved_at IS NULL OR ul.created_at >= c.approved_at)
      GROUP BY ul.campaign_id
    `);
    const impressionsByCampaignId = since
      ? await impressionsByCampaignIdStmt.bind(since).all()
      : await impressionsByCampaignIdStmt.all();

    // 3. 按鈕點擊數 (clicks) — unified_logs 中 money_page_button 事件
    const clicksByCampaignIdStmt = db.prepare(`
      SELECT ul.campaign_id, COUNT(*) as cnt
      FROM unified_logs ul
      JOIN campaigns c ON c.id = ul.campaign_id
      WHERE ul.event_type = 'money_page_button'
        AND ul.campaign_id IS NOT NULL AND ul.campaign_id != ''
        ${sinceClauseUL ? 'AND ul.created_at >= ?' : ''}
        AND (c.approved_at IS NULL OR ul.created_at >= c.approved_at)
      GROUP BY ul.campaign_id
    `);
    const clicksByCampaignId = since
      ? await clicksByCampaignIdStmt.bind(since).all()
      : await clicksByCampaignIdStmt.all();

    // 4. 歸因數 (attributed) — 動態從 line_groups 建立 tagPrefix→groupCode mapping
    //    line_groups.tags 欄位存逗號分隔的 tag 前綴（如 "CT,LT,MT,JT"）
    //    line_groups.code 欄位存分組代碼（如 "AT"）
    //    clicks.ad_code 格式為 tag前綴+數字（如 "CT05"），需轉換為 campaigns.ad_code 格式（如 "AT-05"）
    //    優點：新增分組只需在 line_groups 表加記錄，無需修改程式碼
    const lineGroupsResult = await db.prepare(`
      SELECT code, tags FROM line_groups WHERE code IS NOT NULL AND code != ''
    `).all();
    const lineGroups = (lineGroupsResult.results || []) as any[];

    // 建立 tagPrefix（大寫）→ groupCode 的 mapping
    // 例如：CT→AT, LT→AT, MT→AT, JT→AT, CS→AS, JS→AS, ...
    const tagPrefixToGroupCode: Record<string, string> = {};
    for (const group of lineGroups) {
      if (!group.tags || group.tags.trim() === '') continue;
      const prefixes = group.tags.split(',').map((t: string) => t.trim().toUpperCase());
      for (const prefix of prefixes) {
        if (prefix) {
          tagPrefixToGroupCode[prefix] = group.code;
        }
      }
    }

    // 查詢 clicks 表所有 matched=1 的記錄，按 ad_code 分組
    const rawClicksStmt = db.prepare(`
      SELECT ck.ad_code, COUNT(*) as cnt
      FROM clicks ck
      WHERE ck.matched = 1
        AND ck.ad_code IS NOT NULL AND ck.ad_code != ''
        ${sinceClauseCK ? 'AND ck.timestamp >= ?' : ''}
      GROUP BY ck.ad_code
    `);
    const rawClicks = since
      ? await rawClicksStmt.bind(since).all()
      : await rawClicksStmt.all();

    // 在 JS 中將 clicks.ad_code 轉換為 campaigns.ad_code 格式
    // 規則：提取 ad_code 的字母前綴部分，查 tagPrefixToGroupCode，加上數字部分（補零）
    // 例如：CT05 → prefix=CT → groupCode=AT → numPart=05 → AT-05
    const attributedByCampaignAdCode: Record<string, number> = {};
    for (const row of (rawClicks.results || []) as any[]) {
      const adCode: string = row.ad_code;
      // 提取字母前綴（連續大寫字母）和數字部分
      const match = adCode.match(/^([A-Za-z]+)(\d+)$/);
      if (!match) continue;
      const prefix = match[1].toUpperCase();
      const numStr = match[2];
      const groupCode = tagPrefixToGroupCode[prefix];
      if (!groupCode) continue;
      // 組成 campaigns.ad_code 格式：groupCode + '-' + 補零數字
      const numPadded = String(parseInt(numStr, 10)).padStart(2, '0');
      const derivedAdCode = `${groupCode}-${numPadded}`;
      attributedByCampaignAdCode[derivedAdCode] = (attributedByCampaignAdCode[derivedAdCode] || 0) + (row.cnt || 0);
    }

    // 5. 組裝統計數據
    const statsMap: Record<string, any> = {};
    for (const camp of campaigns) {
      statsMap[camp.id] = { impressions: 0, clicks: 0, attributed: 0 };
    }
    for (const row of (impressionsByCampaignId.results || []) as any[]) {
      if (statsMap[row.campaign_id] !== undefined) {
        statsMap[row.campaign_id].impressions = row.cnt || 0;
      }
    }
    for (const row of (clicksByCampaignId.results || []) as any[]) {
      if (statsMap[row.campaign_id] !== undefined) {
        statsMap[row.campaign_id].clicks = row.cnt || 0;
      }
    }
    for (const [derivedAdCode, cnt] of Object.entries(attributedByCampaignAdCode)) {
      // 用轉換後的 derivedAdCode 去匹配 campaigns.ad_code
      const cid = adCodeToCampaignId[derivedAdCode];
      if (cid && statsMap[cid] !== undefined) {
        statsMap[cid].attributed = (statsMap[cid].attributed || 0) + cnt;
      }
    }

    // 6. 計算 ctr 和 cvr，組裝最終結果
    const result: Record<string, any> = {};
    for (const [campaignId, stats] of Object.entries(statsMap) as [string, any][]) {
      // 只回傳有數據的 campaign
      if (stats.impressions > 0 || stats.clicks > 0 || stats.attributed > 0) {
        result[campaignId] = {
          ad_code: campaignIdToAdCode[campaignId] || '',
          impressions: stats.impressions,
          clicks: stats.clicks,
          attributed: stats.attributed,
          ctr: stats.impressions > 0 ? Math.round(stats.clicks / stats.impressions * 10000) / 10000 : 0,
          cvr: stats.impressions > 0 ? Math.round(stats.attributed / stats.impressions * 10000) / 10000 : 0,
        };
      }
    }

    return c.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Campaign stats error:', err);
    return c.json({ success: false, error: err.message || 'Failed to fetch stats' }, 500);
  }
});

// 路由：獲取單個廣告
app.get('/api/v1/campaigns/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  
  if (!result) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  const campaign = {
    ...result,
    customer_links: JSON.parse((result as any).customer_links || '[]'),
    short_codes: JSON.parse((result as any).short_codes || '[]'),
    allowed_devices: JSON.parse((result as any).allowed_devices || '[]'),
    blacklist_rules: JSON.parse((result as any).blacklist_rules || '[]'),
    line_links: JSON.parse((result as any).line_links || '[]'),
    whatsapp_links: JSON.parse((result as any).whatsapp_links || '[]'),
    other_links: JSON.parse((result as any).other_links || '[]'),
    ad_pixels: JSON.parse((result as any).ad_pixels || '[]'),
    bc_pixels: JSON.parse((result as any).bc_pixels || '[]')
  };

  return c.json({ success: true, data: campaign });
});

// 路由：新增廣告
app.post('/api/v1/campaigns', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  // 統一 routing_strategy 和 link_strategy
  const strategy = body.routing_strategy || body.link_strategy || 'random';
  // 統一 country 和 cloak_country
  const countryVal = body.country || body.cloak_country || '';

  const result = await c.env.DB.prepare(
    `INSERT INTO campaigns (
      id, name, theme, status, safe_page_id, money_page_id,
      customer_links, short_codes, routing_strategy, link_strategy,
      allowed_devices, require_residential, residential_only,
      pixel_tk, pixel_fb, pixel_ga, pixel_google_ad, pixel_google_conv,
      cloak_lang, cloak_os, cloak_os_version, cloak_country, country,
      cloak_region, cloak_traffic_source,
      safe_page_type, safe_page_action, safe_page_content,
      blacklist_rules, require_fbclid, back_redirect_url, exit_popup_text,
      title, link, template_id,
      line_links, whatsapp_links, other_links,
      allow_desktop, allow_mobile,
      ad_pixels, bc_pixels,
      ad_code, group_name, ip_pinning, tag,
      liff_id, line_oa_id, liff_links,
      details_id, details_url, cloak_province,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.name || '',
    body.theme || '',
    body.status || 'active',
    body.safe_page_id || '',
    body.money_page_id || '',
    JSON.stringify(body.customer_links || []),
    JSON.stringify(body.short_codes || []),
    strategy,
    strategy,
    JSON.stringify(body.allowed_devices || []),
    body.require_residential ? 1 : 0,
    body.residential_only ? 1 : 0,
    body.pixel_tk || '',
    body.pixel_fb || '',
    body.pixel_ga || '',
    body.pixel_google_ad || '',
    body.pixel_google_conv || '',
    body.cloak_lang || body.cloak_language || '',
    body.cloak_os || '',
    body.cloak_os_version || '',
    countryVal,
    countryVal,
    body.cloak_region || '',
    body.cloak_traffic_source || '',
    body.safe_page_type || '',
    body.safe_page_action || '',
    body.safe_page_content || '',
    JSON.stringify(body.blacklist_rules || []),
    body.require_fbclid ? 1 : 0,
    body.back_redirect_url || '',
    body.exit_popup_text || '',
    body.title || '',
    body.link || '',
    body.template_id || '',
    JSON.stringify(body.line_links || []),
    JSON.stringify(body.whatsapp_links || []),
    JSON.stringify(body.other_links || []),
    body.allow_desktop !== undefined ? (body.allow_desktop ? 1 : 0) : 1,
    body.allow_mobile !== undefined ? (body.allow_mobile ? 1 : 0) : 1,
    JSON.stringify(body.ad_pixels || []),
    JSON.stringify(body.bc_pixels || []),
    body.ad_code || '',
    body.group_name || '',
    body.ip_pinning ? 1 : 0,
    body.tag || null,
    body.liff_id || '',
    body.line_oa_id || '',
    JSON.stringify(body.liff_links || []),
    body.details_id || '',
    body.details_url || '',
    body.cloak_province || '',
    now,
    now
  ).run();

  // 清除 KV 快取（cfg:{hostname}），讓 shadow-cloak.js 下次請求時重新從 D1 讀取
  const newLink = body.link || '';
  if (newLink && c.env.CLOAKER_CONFIG) {
    c.executionCtx.waitUntil(
      c.env.CLOAKER_CONFIG.delete(`cfg:${newLink}`).catch(() => {})
    );
  }

  return c.json({ success: true, data: { id } });
});

// 路由：更新廣告
// BUG-001 fix: 先 SELECT 現有資料，merge 後再 UPDATE（只更新 body 有傳的欄位，沒傳的保留原值）
app.put('/api/v1/campaigns/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // 先讀取現有資料
  const existing = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Campaign not found' }, 404);
  }

  // 合併工具函數：只有 body 中明確傳入的欄位才覆寫
  const m = (key: string, fallback: any = '') => body[key] !== undefined ? body[key] : (existing as any)[key] ?? fallback;
  const mJSON = (key: string) => body[key] !== undefined ? JSON.stringify(body[key]) : (existing as any)[key] ?? '[]';
  const mBool = (key: string, def: number = 0) => body[key] !== undefined ? (body[key] ? 1 : 0) : (existing as any)[key] ?? def;

  // 統一 routing_strategy 和 link_strategy
  const strategy = body.routing_strategy !== undefined || body.link_strategy !== undefined
    ? (body.routing_strategy || body.link_strategy || 'random')
    : ((existing as any).routing_strategy || 'random');
  // 統一 country 和 cloak_country
  const countryVal = body.country !== undefined || body.cloak_country !== undefined
    ? (body.country || body.cloak_country || '')
    : ((existing as any).country || '');

  await c.env.DB.prepare(
    `UPDATE campaigns SET 
      name = ?, theme = ?, status = ?, safe_page_id = ?, money_page_id = ?,
      customer_links = ?, short_codes = ?, routing_strategy = ?, link_strategy = ?,
      allowed_devices = ?, require_residential = ?, residential_only = ?,
      pixel_tk = ?, pixel_fb = ?, pixel_ga = ?, pixel_google_ad = ?, pixel_google_conv = ?,
      cloak_lang = ?, cloak_os = ?, cloak_os_version = ?, cloak_country = ?, country = ?,
      cloak_region = ?, cloak_traffic_source = ?,
      safe_page_type = ?, safe_page_action = ?, safe_page_content = ?,
      blacklist_rules = ?, require_fbclid = ?, back_redirect_url = ?, exit_popup_text = ?,
      title = ?, link = ?, template_id = ?,
      line_links = ?, whatsapp_links = ?, other_links = ?,
      allow_desktop = ?, allow_mobile = ?,
      ad_pixels = ?, bc_pixels = ?,
      ad_code = ?, group_name = ?, ip_pinning = ?, tag = ?,
      liff_id = ?, line_oa_id = ?, liff_links = ?,
      details_id = ?, details_url = ?, cloak_province = ?,
      updated_at = ?
    WHERE id = ?`
  ).bind(
    m('name'),
    m('theme'),
    m('status', 'active'),
    m('safe_page_id'),
    m('money_page_id'),
    mJSON('customer_links'),
    mJSON('short_codes'),
    strategy,
    strategy,
    mJSON('allowed_devices'),
    mBool('require_residential'),
    mBool('residential_only'),
    m('pixel_tk'),
    m('pixel_fb'),
    m('pixel_ga'),
    m('pixel_google_ad'),
    m('pixel_google_conv'),
    body.cloak_lang !== undefined ? body.cloak_lang : (body.cloak_language !== undefined ? body.cloak_language : ((existing as any).cloak_lang ?? '')),
    m('cloak_os'),
    m('cloak_os_version'),
    countryVal,
    countryVal,
    m('cloak_region'),
    m('cloak_traffic_source'),
    m('safe_page_type'),
    m('safe_page_action'),
    m('safe_page_content'),
    mJSON('blacklist_rules'),
    mBool('require_fbclid'),
    m('back_redirect_url'),
    m('exit_popup_text'),
    m('title'),
    m('link'),
    m('template_id'),
    mJSON('line_links'),
    mJSON('whatsapp_links'),
    mJSON('other_links'),
    mBool('allow_desktop', 1),
    mBool('allow_mobile', 1),
    mJSON('ad_pixels'),
    mJSON('bc_pixels'),
    m('ad_code'),
    m('group_name'),
    mBool('ip_pinning'),
    m('tag', null),
    m('liff_id'),
    m('line_oa_id'),
    mJSON('liff_links'),
    m('details_id'),
    m('details_url'),
    m('cloak_province'),
    now,
    id
  ).run();

  // 清除 KV 快取（cfg:{hostname}），讓 shadow-cloak.js 下次請求時重新從 D1 讀取
  // 同時清除舊 link 和新 link（如果域名有變更）
  if (c.env.CLOAKER_CONFIG) {
    const oldLink = (existing as any).link || '';
    const newLink = body.link !== undefined ? (body.link || '') : oldLink;
    const kvDeletes: Promise<void>[] = [];
    if (oldLink) kvDeletes.push(c.env.CLOAKER_CONFIG.delete(`cfg:${oldLink}`).catch(() => {}));
    if (newLink && newLink !== oldLink) kvDeletes.push(c.env.CLOAKER_CONFIG.delete(`cfg:${newLink}`).catch(() => {}));
    if (kvDeletes.length > 0) c.executionCtx.waitUntil(Promise.all(kvDeletes));
  }

  return c.json({ success: true });
});

// 路由：删除廣告
app.delete('/api/v1/campaigns/:id', async (c) => {
  const id = c.req.param('id');
  // 先查出要删除的廣告的 link，以便後續清除 KV 快取
  const toDelete = await c.env.DB.prepare('SELECT link FROM campaigns WHERE id = ?').bind(id).first();
  await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
  // 清除 KV 快取（cfg:{hostname}）
  const deletedLink = toDelete ? (toDelete as any).link || '' : '';
  if (deletedLink && c.env.CLOAKER_CONFIG) {
    c.executionCtx.waitUntil(
      c.env.CLOAKER_CONFIG.delete(`cfg:${deletedLink}`).catch(() => {})
    );
  }
  return c.json({ success: true });
});

// 路由：獲取日誌列表
app.get('/api/v1/logs', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const verdict = c.req.query('verdict');
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  let conditions: string[] = [];
  let params: any[] = [];

  if (verdict) {
    conditions.push('verdict = ?');
    params.push(verdict);
  }

  if (search) {
    conditions.push('(ip LIKE ? OR domain LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM cloak_logs ${where}`
  ).bind(...params).first();

  const items = await db.prepare(
    `SELECT * FROM cloak_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      items: items.results,
      total: (countResult as any)?.total || 0,
      page,
      limit,
    },
  });
});

// ─── 訪問日誌 (unified_logs) 路由 ─────────────────────────────────────
// tab 參數對應的 event_type 過濾邏輯：
//   all               → 不過濾（全部日誌）
//   safe_page         → verdict='blocked' 或被攔截的 event_type
//   money_page        → verdict='allowed' 或推廣頁相關 event_type
//   money_page_button → 推廣頁按鈕點擊 event_type
//   safe_page_button  → 安全頁按鈕點擊 event_type
app.get('/api/v1/visit-logs', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const tab = c.req.query('tab') || 'all';
  const search = c.req.query('search');
  const campaignId = c.req.query('campaign_id');
  const campaignIds = c.req.query('campaign_ids'); // comma-separated
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');

  let conditions: string[] = [];
  let params: any[] = [];

  // Tab → event_type / verdict filter
  if (tab === 'safe_page') {
    conditions.push(`(verdict = 'blocked' OR event_type IN ('bot_blocked','country_blocked','verified_bot','cloak_block','rate_limited','ip_reputation','safe_page_served'))`);
  } else if (tab === 'money_page') {
    conditions.push(`(verdict = 'allowed' OR event_type IN ('money_page_served','redirect_to_link','jwt_passed','jwt_expired_reissue'))`);
  } else if (tab === 'money_page_button') {
    conditions.push(`event_type IN ('money_page_button','fp_check','interaction_detect','cta_click')`);
  } else if (tab === 'safe_page_button') {
    conditions.push(`event_type IN ('safe_page_button','form_submit')`);
  }
  // tab = 'all' → no event_type filter

  // Search filter
  if (search) {
    conditions.push('(ip LIKE ? OR domain LIKE ? OR visitor_id LIKE ? OR ad_code LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Campaign filter
  if (campaignId && campaignId !== 'all') {
    conditions.push('campaign_id = ?');
    params.push(campaignId);
  } else if (campaignIds) {
    const ids = (campaignIds as string).split(',').map((id: string) => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      conditions.push(`campaign_id IN (${ids.map(() => '?').join(',')})`);
      params.push(...ids);
    }
  }

  // Date range filter
  if (startDate) {
    conditions.push('created_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('created_at <= ?');
    params.push(endDate + 'T23:59:59.999Z');
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM unified_logs ${where}`
  ).bind(...params).first();

  const items = await db.prepare(
    `SELECT id, request_id, visitor_id, session_id, event_type, verdict, reason,
            decision_layer, result, ip, ua, country, language, referer, domain,
            tag, ad_code, fbclid, pixel_id, campaign_id, event_data,
            processing_time_ms, created_at, asn
     FROM unified_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      items: items.results,
      total: (countResult as any)?.total || 0,
      page,
      limit,
    },
  });
});

// ─── 點擊記錄 (clicks) 路由 ───────────────────────────────────────────
app.get('/api/v1/clicks', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const matched = c.req.query('matched'); // 'all', '0', '1'
  const source = c.req.query('source');   // 'firebird', 'shadow-cloak'
  const tag = c.req.query('tag');
  const search = c.req.query('search');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const offset = (page - 1) * limit;

  let conditions: string[] = [];
  let params: any[] = [];

  // matched filter: 0 or 1 (skip if 'all')
  if (matched && matched !== 'all') {
    conditions.push('matched = ?');
    params.push(parseInt(matched));
  }

  // source filter
  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }

  // tag filter
  if (tag) {
    conditions.push('tag = ?');
    params.push(tag);
  }

  // time range filter
  if (startDate) {
    conditions.push('timestamp >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('timestamp <= ?');
    params.push(endDate);
  }

  // search: visitor_id, fbclid, tag, destination
  if (search) {
    conditions.push('(visitor_id LIKE ? OR fbclid LIKE ? OR tag LIKE ? OR destination LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM clicks ${where}`
  ).bind(...params).first();

  const items = await db.prepare(
    `SELECT * FROM clicks ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      items: items.results,
      total: (countResult as any)?.total || 0,
      page,
      limit,
    },
  });
});

// ─── 採集新增路由 (必須在 /templates/:id 之前) ───────────────────────────

// ─── 自動瘦身：HTML 優化函式 ──────────────────────────────────────────
// 在 scrape/crawl 後自動執行，減少模板體積並提升載入速度
function optimizeHtml(html: string): string {
  // 1. 移除 HTML 註釋（保留 IE 條件註釋）
  html = html.replace(/<!--(?!\[if)(?!\[endif)[\s\S]*?-->/g, '');

  // 2. 移除不需要的 <script> 標籤
  // Chrome 擴充套件腳本
  html = html.replace(/<script[^>]*chrome-extension[^>]*>[\s\S]*?<\/script>/gi, '');
  // Cloudflare Beacon
  html = html.replace(/<script[^>]*beacon\.min\.js[^>]*>[\s\S]*?<\/script>/gi, '');
  // GTM 腳本
  html = html.replace(/<script[^>]*gtm\.js[^>]*>[\s\S]*?<\/script>/gi, '');
  // WP Emoji 腳本
  html = html.replace(/<script[^>]*wp-emoji[^>]*>[\s\S]*?<\/script>/gi, '');
  // 含 _wpemojiSettings 的內聯腳本
  html = html.replace(/<script[^>]*>[\s\S]*?_wpemojiSettings[\s\S]*?<\/script>/gi, '');
  // WP Emoji 內聯 CSS
  html = html.replace(/<style[^>]*id=["']wp-emoji[^"'>]*["'][^>]*>[\s\S]*?<\/style>/gi, '');
  // Angular / application/json 大型 JSON 區塊
  html = html.replace(/<script[^>]*type=["']application\/json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // 3. 移除不需要的 <link> 標籤
  html = html.replace(/<link[^>]*type=["']application\/(rss|atom)\+xml["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*href=["'][^"']*\/feed\/["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*wlwmanifest[^>]*>/gi, '');
  html = html.replace(/<link[^>]*EditURI[^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']shortlink["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']pingback["'][^>]*>/gi, '');

  // 4. 精簡字體引用（保留最多 5 個字體 @font-face）
  const fontFaceBlocks = html.match(/@font-face\s*\{[^}]*fonts\.gstatic\.com[^}]*\}/g) || [];
  if (fontFaceBlocks.length > 5) {
    // 移除超出的 @font-face 區塊
    const toRemove = fontFaceBlocks.slice(5);
    for (const block of toRemove) {
      html = html.replace(block, '');
    }
  }

  // 5. 圖片 URL 替換為 Cloudflare Image Resizing（自動 WebP + 壓縮）
  let imgCount = 0;
  const FIRST_SCREEN_COUNT = 3;
  html = html.replace(
    /(<img[^>]*?)\ssrc=(["'])([^"']+)\2/gi,
    (_match: string, pre: string, q: string, src: string) => {
      imgCount++;
      // 跳過 data URI、SVG、已處理的 URL
      if (src.startsWith('data:') || src.toLowerCase().endsWith('.svg') || src.includes('/cdn-cgi/image/')) {
        // 非首屏仍加 lazy loading
        if (imgCount > FIRST_SCREEN_COUNT && !pre.includes('loading=')) {
          return `${pre} loading="lazy" src=${q}${src}${q}`;
        }
        return _match;
      }
      // 構建 CF Image Resizing URL
      const cfUrl = `/cdn-cgi/image/format=auto,quality=80/${src}`;
      if (imgCount > FIRST_SCREEN_COUNT && !pre.includes('loading=')) {
        return `${pre} loading="lazy" src=${q}${cfUrl}${q}`;
      }
      return `${pre} src=${q}${cfUrl}${q}`;
    }
  );

  // 6. CSS background-image 中的圖片也套用 CF Image Resizing
  html = html.replace(
    /url\(['"]?([^'"\)\s]+)['"]?\)/g,
    (full: string, url: string) => {
      if (url.startsWith('data:') || url.toLowerCase().endsWith('.svg')) return full;
      if (url.includes('/cdn-cgi/image/')) return full;
      // 跳過字體檔案
      if (/fonts\.gstatic\.com|\.(woff2?|ttf|eot)$/i.test(url)) return full;
      // 只處理圖片副檔名
      if (/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url)) {
        return `url('/cdn-cgi/image/format=auto,quality=80/${url}')`;
      }
      return full;
    }
  );

  // 7. 收集外部域名並加入 preconnect / dns-prefetch
  const allUrls = html.match(/https?:\/\/([^\/\s"']+)/g) || [];
  const preconnectDomains = new Set<string>();
  for (const u of allUrls) {
    try {
      const domain = new URL(u).hostname;
      if (/cdx\.lativ|cdnjs\.cloudflare|connect\.facebook/.test(domain)) {
        preconnectDomains.add(domain);
      }
    } catch {}
  }
  if (allUrls.some(u => u.includes('fonts.googleapis.com'))) {
    preconnectDomains.add('fonts.googleapis.com');
    preconnectDomains.add('fonts.gstatic.com');
  }
  // 移除已有的 preconnect/dns-prefetch 避免重複
  html = html.replace(/<link[^>]*rel=["'](?:preconnect|dns-prefetch)["'][^>]*>\s*/gi, '');
  // 注入新的 preconnect 標籤
  if (preconnectDomains.size > 0) {
    let tags = '';
    for (const domain of Array.from(preconnectDomains).sort()) {
      tags += `<link rel="preconnect" href="https://${domain}" crossorigin>\n`;
      tags += `<link rel="dns-prefetch" href="https://${domain}">\n`;
    }
    const headMatch = html.match(/<head[^>]*>/i);
    if (headMatch) {
      html = html.replace(headMatch[0], headMatch[0] + '\n' + tags);
    }
  }

  // 8. 輕量壓縮：合併多餘空白行、移除行首空白
  html = html.replace(/\n\s*\n\s*\n/g, '\n\n');
  html = html.replace(/\n[ \t]+/g, '\n');
  html = html.replace(/[ \t]+\n/g, '\n');

  // 9. 移除空的 style/script 區塊
  html = html.replace(/<style[^>]*>\s*<\/style>/gi, '');
  html = html.replace(/<script[^>]*>\s*<\/script>/gi, '');

  return html;
}

// 共用：建立路徑補全函式（基於給定的 base URL）
function makeToAbsolute(baseUrl: URL) {
  return (href: string): string | null => {
    if (!href || href.startsWith('data:') || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('blob:') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
    try {
      // 協議相對路徑 //example.com/...
      if (href.startsWith('//')) return 'https:' + href;
      // 已是絕對路徑
      if (href.startsWith('http://') || href.startsWith('https://')) return href;
      // 根路徑 /path
      if (href.startsWith('/')) return baseUrl.origin + href;
      // 相對路徑，基於當前頁面目錄
      return new URL(href, baseUrl.href).href;
    } catch { return null; }
  };
}

// 共用：補全 HTML 中所有資源屬性的路徑（不下載，純路徑替換）
function rewriteAllPaths(html: string, toAbsolute: (href: string) => string | null): string {
  // 補全 <img src>, <source src>
  html = html.replace(/(<(?:img|source)[^>]+?)\s(src)=(["'])([^"']+)/gi, (_match: string, pre: string, attr: string, q: string, val: string) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} ${attr}=${q}${abs}${q}` : _match;
  });

  // 補全 srcset（逗號分隔的多個 URL）
  html = html.replace(/(<(?:img|source)[^>]+?)\ssrcset=(["'])([^"']+)/gi, (_match: string, pre: string, q: string, val: string) => {
    const rewritten = val.replace(/([^\s,][^\s,]*?)(\s+\d+(?:\.\d+)?[wx])?(?=\s*,|\s*$)/g, (part: string, url: string, descriptor: string = '') => {
      const trimmed = url.trim();
      if (!trimmed) return part;
      const abs = toAbsolute(trimmed);
      return abs ? abs + descriptor : part;
    });
    return `${pre} srcset=${q}${rewritten}${q}`;
  });

  // 補全 data-src, data-lazy-src, data-original, data-lazy 等 lazy load 屬性
  const lazyAttrs = ['data-src', 'data-lazy-src', 'data-original', 'data-lazy', 'data-bg', 'data-background', 'data-url', 'data-image', 'data-echo', 'data-lazyload'];
  for (const attr of lazyAttrs) {
    const escapedAttr = attr.replace(/-/g, '\-');
    const re = new RegExp(`(${escapedAttr})=(["'])([^"']+)\\2`, 'gi');
    html = html.replace(re, (_match: string, a: string, q: string, val: string) => {
      const abs = toAbsolute(val);
      return abs ? `${a}=${q}${abs}${q}` : _match;
    });
  }

  // 補全 <link href> (CSS, favicon, preload 等)
  html = html.replace(/(<link[^>]+?)\shref=(["'])([^"']+)/gi, (_match: string, pre: string, q: string, val: string) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} href=${q}${abs}${q}` : _match;
  });

  // 補全 <script src>
  html = html.replace(/(<script[^>]+?)\ssrc=(["'])([^"']+)/gi, (_match: string, pre: string, q: string, val: string) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} src=${q}${abs}${q}` : _match;
  });

  // 補全 <video poster>, <video src>, <audio src>
  html = html.replace(/(<(?:video|audio)[^>]+?)\s(src|poster)=(["'])([^"']+)/gi, (_match: string, pre: string, attr: string, q: string, val: string) => {
    const abs = toAbsolute(val);
    return abs ? `${pre} ${attr}=${q}${abs}${q}` : _match;
  });

  // 補全 inline style 中的 background-image: url(...)
  html = html.replace(/style=(["'])[^"']*url\([^)]+\)[^"']*/gi, (match: string) => {
    return match.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (urlMatch: string, p1: string) => {
      const abs = toAbsolute(p1);
      return abs ? `url('${abs}')` : urlMatch;
    });
  });

  return html;
}

// 路由：完整採集（下載並內嵌 CSS/圖片）
app.post('/api/v1/templates/crawl', async (c) => {
  const { url } = await c.req.json();
  if (!url) return c.json({ success: false, error: 'URL 不能為空' }, 400);

  const MAX_RESOURCES = 150; // 增加到 150 個資源
  const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

  let stats = { total: 0, success: 0, failed: 0 };

  try {
    // 1. 抓取 HTML
    const baseUrl = new URL(url);
    const htmlRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (!htmlRes.ok) return c.json({ success: false, error: `無法抓取頁面：HTTP ${htmlRes.status}` }, 400);
    let html = await htmlRes.text();

    // 2. 路徑補全工具
    const toAbsolute = makeToAbsolute(baseUrl);

    // 3. 第一步：先對所有 HTML 屬性路徑進行補全（不下載，確保所有相對路徑都變成絕對路徑）
    html = rewriteAllPaths(html, toAbsolute);

    // 4. 收集需要下載內嵌的資源（CSS 內嵌樣式，圖片嵌入 base64）
    const resources: Array<{ type: 'css' | 'img', original: string, absolute: string }> = [];

    // CSS（收集已補全後的絕對路徑）
    const cssMatches = [
      ...html.matchAll(/<link[^>]+rel=(["'])stylesheet[^>]*href=(["'])([^"']+)[^>]*>/gi),
      ...html.matchAll(/<link[^>]+href=(["'])([^"']+)[^>]*rel=(["'])stylesheet[^>]*>/gi),
    ];
    for (const m of cssMatches) {
      const href = m[3] || m[2];
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        resources.push({ type: 'css', original: href, absolute: href });
      }
    }

    // IMG（收集已補全後的絕對路徑）
    const imgMatches = [...html.matchAll(/<img[^>]+src=(["'])([^"']+)[^>]*/gi)];
    for (const m of imgMatches) {
      const src = m[2];
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        resources.push({ type: 'img', original: src, absolute: src });
      }
    }

    stats.total = resources.length;
    const processedResources = resources.slice(0, MAX_RESOURCES);

    // 5. 下載並替換資源
    for (const res of processedResources) {
      try {
        const r = await fetch(res.absolute, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        if (res.type === 'css') {
          let cssContent = await r.text();
          // 補全 CSS 中的 url() 路徑（使用 CSS 檔案自己的 base URL）
          const cssBaseUrl = new URL(res.absolute);
          const cssToAbsolute = makeToAbsolute(cssBaseUrl);
          cssContent = cssContent.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match: string, p1: string) => {
            const abs = cssToAbsolute(p1);
            return abs ? `url('${abs}')` : match;
          });
          // 將 <link> 替換為內嵌 <style>
          const escapedHref = res.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          html = html.replace(
            new RegExp(`<link[^>]*href=(["'])${escapedHref}\\1[^>]*>`, 'i'),
            `<style>${cssContent}</style>`
          );
          stats.success++;
        } else if (res.type === 'img') {
          const buf = await r.arrayBuffer();
          if (buf.byteLength <= MAX_IMAGE_SIZE) {
            const contentType = r.headers.get('content-type') || 'image/jpeg';
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
            // 替換所有出現此圖片 URL 的 src 屬性（全域替換）
            const escapedSrc = res.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            html = html.replace(
              new RegExp(`src=(["'])${escapedSrc}\\1`, 'gi'),
              `src="data:${contentType};base64,${base64}"`
            );
            stats.success++;
          } else {
            // 圖片太大，保留絕對路徑（已在步驟3補全）
            stats.success++;
          }
        }
      } catch {
        // 下載失敗，路徑已在步驟3補全，不需額外處理
        stats.failed++;
      }
    }

    // 自動瘦身：優化 HTML
    html = optimizeHtml(html);

    const htmlSize = new TextEncoder().encode(html).length;

    return c.json({
      success: true,
      data: {
        html,
        stats: {
          total: stats.total,
          success: stats.success,
          failed: stats.failed,
          htmlSize,
        }
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message || '採集失敗' }, 500);
  }
});

// 路由：快速抓取（路徑補全但不下載內嵌資源）
app.post('/api/v1/templates/scrape', async (c) => {
  const body = await c.req.json();
  const { url, name, country, type, status } = body;
  if (!url || !name) {
    return c.json({ success: false, error: 'URL 和名稱不能為空' }, 400);
  }
  try {
    const baseUrl = new URL(url);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (!response.ok) {
      return c.json({ success: false, error: `無法抓取頁面：HTTP ${response.status}` }, 400);
    }
    let html = await response.text();

    // 路徑補全：將所有相對路徑補全為絕對路徑
    const toAbsolute = makeToAbsolute(baseUrl);
    html = rewriteAllPaths(html, toAbsolute);

    // 同時下載並內嵌 CSS（確保樣式正確）
    const cssMatches = [
      ...html.matchAll(/<link[^>]+rel=(["'])stylesheet[^>]*href=(["'])([^"']+)[^>]*>/gi),
      ...html.matchAll(/<link[^>]+href=(["'])([^"']+)[^>]*rel=(["'])stylesheet[^>]*>/gi),
    ];
    const cssResources: Array<{ original: string }> = [];
    for (const m of cssMatches) {
      const href = m[3] || m[2];
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        cssResources.push({ original: href });
      }
    }
    // 只處理前 30 個 CSS（快速模式）
    for (const res of cssResources.slice(0, 30)) {
      try {
        const r = await fetch(res.original, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (!r.ok) continue;
        let cssContent = await r.text();
        const cssBaseUrl = new URL(res.original);
        const cssToAbsolute = makeToAbsolute(cssBaseUrl);
        cssContent = cssContent.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (match: string, p1: string) => {
          const abs = cssToAbsolute(p1);
          return abs ? `url('${abs}')` : match;
        });
        const escapedHref = res.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(
          new RegExp(`<link[^>]*href=(["'])${escapedHref}\\1[^>]*>`, 'i'),
          `<style>${cssContent}</style>`
        );
      } catch {
        // 忽略 CSS 下載失敗
      }
    }

    // 自動瘦身：優化 HTML
    html = optimizeHtml(html);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO templates (id, type, country, name, identifier, status, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      type || 'safe_page',
      country || 'TW',
      name,
      `TPL-${Date.now()}`,
      status || 'active',
      html,
      now,
      now
    ).run();
    const result = await c.env.DB.prepare(
      'SELECT * FROM templates WHERE id = ?'
    ).bind(id).first();
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || '採集失敗' }, 500);
  }
});


// 路由：獲取素材列表
app.get('/api/v1/templates', async (c) => {
  const { search, type, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM templates';
  let countQuery = 'SELECT COUNT(*) as total FROM templates';
  const params: any[] = [];
  const whereConditions: string[] = [];

  if (search) {
    whereConditions.push('name LIKE ?');
    params.push(`%${search}%`);
  }

  if (type) {
    whereConditions.push('type = ?');
    params.push(type);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
    countQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // 計算總數時需要使用相同的 WHERE 條件
  const countParams = whereConditions.length > 0 ? params.slice(0, params.length - 2) : [];
  const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

  return c.json({
    success: true,
    data: {
      items: results,
      total: (totalResult as any)?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// 路由：ZIP 上傳（接收 multipart/form-data，解壓後取 index.html，並將靜態資源轉 base64 內嵌）
// ❗ 必須在 /templates/:id 之前註冊
app.post('/api/v1/templates/upload-zip', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string) || 'ZIP 上傳';
    const type = (formData.get('type') as string) || 'money_page';
    const country = (formData.get('country') as string) || 'TW';
    const status = (formData.get('status') as string) || 'active';

    if (!file) {
      return c.json({ success: false, error: '請上傳 ZIP 檔案' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: 'ZIP 檔案不能超過 10MB' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decompressed = fflate.unzipSync(uint8);

    // 建立檔案索引（小寫路徑 -> 原始路徑），方便後續查找
    const fileIndex: Record<string, string> = {};
    for (const filePath of Object.keys(decompressed)) {
      // 移除前導目錄（如 folder/index.html -> index.html）
      const normalized = filePath.replace(/^[^/]+\//, '').toLowerCase();
      fileIndex[normalized] = filePath;
    }

    // 找到 index.html
    let htmlContent = '';
    let htmlBasePath = '';
    for (const [filePath, data] of Object.entries(decompressed)) {
      const fileName = filePath.split('/').pop()?.toLowerCase();
      if (fileName === 'index.html' || fileName === 'index.htm') {
        htmlContent = new TextDecoder().decode(data);
        // 取得 HTML 所在的目錄路徑
        const parts = filePath.split('/');
        parts.pop();
        htmlBasePath = parts.length > 0 ? parts.join('/') + '/' : '';
        break;
      }
    }

    if (!htmlContent) {
      return c.json({ success: false, error: 'ZIP 中找不到 index.html' }, 400);
    }

    // MIME 類型映射
    const mimeMap: Record<string, string> = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
      '.ico': 'image/x-icon', '.bmp': 'image/bmp',
      '.css': 'text/css', '.js': 'application/javascript',
      '.woff': 'font/woff', '.woff2': 'font/woff2',
      '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
    };

    // 輔助：將 ZIP 內的檔案轉為 base64 data URI
    function resolveZipAsset(relativePath: string): string | null {
      // 嘗試多種路徑組合
      const candidates = [
        htmlBasePath + relativePath,
        relativePath,
        relativePath.replace(/^\.?\//, ''),
      ];
      for (const candidate of candidates) {
        const normalizedCandidate = candidate.toLowerCase();
        // 直接匹配
        if (decompressed[candidate]) {
          const ext = '.' + candidate.split('.').pop()?.toLowerCase();
          const mime = mimeMap[ext];
          if (!mime) return null;
          const bytes = decompressed[candidate];
          // 限制單個資源 500KB，避免 D1 欄位過大
          if (bytes.length > 500 * 1024) return null;
          // 對 CSS/JS 使用 text，對二進制使用 base64
          if (mime === 'text/css' || mime === 'application/javascript') {
            return null; // CSS/JS 用 inline 方式處理
          }
          // 轉 base64
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return `data:${mime};base64,${btoa(binary)}`;
        }
        // 透過索引匹配
        if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
          const actualPath = fileIndex[normalizedCandidate];
          const ext = '.' + actualPath.split('.').pop()?.toLowerCase();
          const mime = mimeMap[ext];
          if (!mime) return null;
          const bytes = decompressed[actualPath];
          if (bytes.length > 500 * 1024) return null;
          if (mime === 'text/css' || mime === 'application/javascript') {
            return null;
          }
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return `data:${mime};base64,${btoa(binary)}`;
        }
      }
      return null;
    }

    // 替換 HTML 中的圖片引用為 base64
    htmlContent = htmlContent.replace(
      /(<img[^>]+?)\ssrc=(["'])([^"']+)\2/gi,
      (match: string, pre: string, q: string, src: string) => {
        if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return match;
        const dataUri = resolveZipAsset(src);
        return dataUri ? `${pre} src=${q}${dataUri}${q}` : match;
      }
    );

    // 替換 CSS background-image url() 中的引用
    htmlContent = htmlContent.replace(
      /url\(['"]?([^'")\s]+)['"]?\)/g,
      (match: string, src: string) => {
        if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return match;
        const dataUri = resolveZipAsset(src);
        return dataUri ? `url('${dataUri}')` : match;
      }
    );

    // 內嵌 CSS 檔案
    htmlContent = htmlContent.replace(
      /<link[^>]+href=(["'])([^"']+\.css)\1[^>]*>/gi,
      (match: string, q: string, href: string) => {
        if (href.startsWith('http://') || href.startsWith('https://')) return match;
        const candidates = [htmlBasePath + href, href, href.replace(/^\.?\//, '')];
        for (const candidate of candidates) {
          if (decompressed[candidate]) {
            let cssContent = new TextDecoder().decode(decompressed[candidate]);
            // 替換 CSS 中的 url() 引用
            cssContent = cssContent.replace(
              /url\(['"]?([^'")\s]+)['"]?\)/g,
              (m: string, cssSrc: string) => {
                if (cssSrc.startsWith('data:') || cssSrc.startsWith('http://') || cssSrc.startsWith('https://')) return m;
                // CSS 中的相對路徑基於 CSS 檔案所在目錄
                const cssDirParts = candidate.split('/');
                cssDirParts.pop();
                const cssDir = cssDirParts.length > 0 ? cssDirParts.join('/') + '/' : '';
                const resolvedPath = cssDir + cssSrc;
                const dataUri = resolveZipAsset(resolvedPath);
                return dataUri ? `url('${dataUri}')` : m;
              }
            );
            return `<style>/* ${href} */\n${cssContent}</style>`;
          }
          const normalizedCandidate = candidate.toLowerCase();
          if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
            let cssContent = new TextDecoder().decode(decompressed[fileIndex[normalizedCandidate]]);
            return `<style>/* ${href} */\n${cssContent}</style>`;
          }
        }
        return match;
      }
    );

    // 內嵌 JS 檔案
    htmlContent = htmlContent.replace(
      /<script[^>]+src=(["'])([^"']+\.js)\1[^>]*><\/script>/gi,
      (match: string, q: string, src: string) => {
        if (src.startsWith('http://') || src.startsWith('https://')) return match;
        const candidates = [htmlBasePath + src, src, src.replace(/^\.?\//, '')];
        for (const candidate of candidates) {
          if (decompressed[candidate]) {
            const jsContent = new TextDecoder().decode(decompressed[candidate]);
            return `<script>/* ${src} */\n${jsContent}</script>`;
          }
          const normalizedCandidate = candidate.toLowerCase();
          if (fileIndex[normalizedCandidate] && decompressed[fileIndex[normalizedCandidate]]) {
            const jsContent = new TextDecoder().decode(decompressed[fileIndex[normalizedCandidate]]);
            return `<script>/* ${src} */\n${jsContent}</script>`;
          }
        }
        return match;
      }
    );

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO templates (id, type, country, name, identifier, status, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, type, country, name, `ZIP-${Date.now()}`, status, htmlContent, now, now).run();

    const result = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'ZIP 上傳失敗' }, 500);
  }
});

// 路由：系統主題列表
// ❗ 必須在 /templates/:id 之前註冊
app.get('/api/v1/templates/system', async (c) => {
  const systemThemes = [
    {
      id: 'sys-line',
      name: 'LINE 主題推廣頁',
      type: 'money_page',
      country: 'TW',
      description: 'LINE 綺色背景，引導用戶開啟 LINE 加入好友',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzA2Qzc1NSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1zaXplPSIxNiI+TElORSDkuLvpoYw8L3RleHQ+PC9zdmc+',
      identifier: 'sys-line',
    },
    {
      id: 'sys-bf',
      name: 'BF 低調推廣頁',
      type: 'money_page',
      country: 'TW',
      description: '金色深色質感，適合活動推廣使用',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IiNmZmQ3MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE2Ij5CRiDmtLvli5U8L3RleHQ+PC9zdmc+',
      identifier: 'sys-bf',
    },
    {
      id: 'sys-skyai',
      name: 'SKY AI 天盈科技',
      type: 'money_page',
      country: 'TW',
      description: '深色科技風，適合科技類推廣',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzBhMGUyNyIvPjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZpbGw9IiMwMGU1ZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LXNpemU9IjE2Ij5TS1kgQUk8L3RleHQ+PC9zdmc+',
      identifier: 'sys-skyai',
    },
  ];
  return c.json({ success: true, data: systemThemes });
});

// 路由：批量刪除素材（接收 ID 陣列）
// ❗ 必須在 /templates/:id 之前註冊
app.post('/api/v1/templates/batch-delete', async (c) => {
  try {
    const { ids } = await c.req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: '請提供要刪除的 ID 陣列' }, 400);
    }
    if (ids.length > 100) {
      return c.json({ success: false, error: '單次最多刪除 100 筆' }, 400);
    }
    // D1 不支援 IN (?) 綁定陣列，使用 batch 批量執行
    const stmts = ids.map((id: string) =>
      c.env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id)
    );
    await c.env.DB.batch(stmts);
    return c.json({ success: true, data: { deleted: ids.length } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message || '批量刪除失敗' }, 500);
  }
});

// 路由：獲取單個素材
app.get('/api/v1/templates/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();

  if (!result) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  return c.json({ success: true, data: result });
});

// 路由：新增素材
app.post('/api/v1/templates', async (c) => {
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO templates (id, type, country, name, identifier, status, content, thumbnail, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.type || 'safe_page',
    body.country || 'TW',
    body.name || '',
    body.identifier || `TPL-${Date.now()}`,
    body.status || 'active',
    body.content || body.html_content || '',
    body.thumbnail || null,
    now,
    now
  ).run();

  const result = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
  return c.json({ success: true, data: result });
});

// 路由：更新素材（merge 模式：只更新有傳的欄位）
app.put('/api/v1/templates/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();

  // 先讀取現有資料
  const existing = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }

  const m = (key: string, fallback: any = '') => body[key] !== undefined ? body[key] : (existing as any)[key] ?? fallback;

  await c.env.DB.prepare(
    `UPDATE templates SET type = ?, country = ?, name = ?, identifier = ?, status = ?, content = ?, thumbnail = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    m('type', 'safe_page'),
    m('country', 'TW'),
    m('name'),
    m('identifier'),
    m('status', 'active'),
    body.content !== undefined ? body.content : (body.html_content !== undefined ? body.html_content : (existing as any).content || ''),
    m('thumbnail', null),
    now,
    id
  ).run();

  const result = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
  return c.json({ success: true, data: result });
});

// 路由：素材預覽（返回渲染後的 HTML 頁面）
app.get('/api/v1/templates/:id/preview', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
  if (!result) {
    return c.html('<h1>Template not found</h1>', 404);
  }
  const content = (result as any).content || '';
  return c.html(content);
});

// 路由：切換素材狀態
app.put('/api/v1/templates/:id/toggle', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Template not found' }, 404);
  }
  const newStatus = (existing as any).status === 'active' ? 'inactive' : 'active';
  const now = new Date().toISOString();
  await c.env.DB.prepare('UPDATE templates SET status = ?, updated_at = ? WHERE id = ?').bind(newStatus, now, id).run();
  return c.json({ success: true, data: { status: newStatus } });
});

// 路由：刪除素材
app.delete('/api/v1/templates/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});





// ─── 像素庫 CRUD ───────────────────────────────────────────────────

// 列表：獲取所有像素
app.get('/api/v1/pixels', async (c) => {
  const { type } = c.req.query();
  let sql = 'SELECT * FROM pixels_library';
  const params: any[] = [];
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  sql += ' ORDER BY created_at DESC';
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, data: results });
});

// 單筆：獲取單個像素
app.get('/api/v1/pixels/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM pixels_library WHERE id = ?').bind(id).first();
  if (!result) return c.json({ success: false, error: 'Pixel not found' }, 404);
  return c.json({ success: true, data: result });
});

// 新增像素
app.post('/api/v1/pixels', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'INSERT INTO pixels_library (id, name, pixel_id, token, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    body.name || '',
    body.pixel_id || '',
    body.token || '',
    body.type || 'AD',
    body.note || '',
    now
  ).run();
  return c.json({ success: true, data: { id } });
});

// 更新像素
app.put('/api/v1/pixels/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await c.env.DB.prepare(
    'UPDATE pixels_library SET name = ?, pixel_id = ?, token = ?, type = ?, note = ? WHERE id = ?'
  ).bind(
    body.name || '',
    body.pixel_id || '',
    body.token || '',
    body.type || 'AD',
    body.note || '',
    id
  ).run();
  return c.json({ success: true });
});

// 刪除像素
app.delete('/api/v1/pixels/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM pixels_library WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ============================================================
// Media / 素材庫 API
// 用途：前端素材庫從 R2 讀取/上傳圖片
// ============================================================

// 素材列表
app.get('/api/v1/media/list', async (c) => {
  try {
    // 先嘗試從 D1 assets 表讀取
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        content_type TEXT DEFAULT '',
        size_bytes INTEGER DEFAULT 0,
        r2_bucket TEXT DEFAULT 'cloak-assets',
        category TEXT DEFAULT 'general',
        campaign_id TEXT DEFAULT '',
        template_id INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        uploaded_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});
    const category = c.req.query('category') || '';
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params: string[] = [];
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC LIMIT 200';
    const stmt = params.length > 0 ? c.env.DB.prepare(query).bind(...params) : c.env.DB.prepare(query);
    const result = await stmt.all();
    const assets = (result.results || []).map((a: any) => ({
      ...a,
      url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(a.asset_key)}`,
      public_url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(a.asset_key)}`,
    }));
    return c.json({ success: true, assets });
  } catch (e: any) {
    console.error('media list error:', e);
    return c.json({ success: false, error: e.message || 'Failed to list assets' }, 500);
  }
});

// 素材上傳
app.post('/api/v1/media/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const category = String(formData.get('category') || 'general');
    if (!file || typeof file === 'string') {
      return c.json({ success: false, error: 'file is required' }, 400);
    }
    const filename = file.name || 'unnamed';
    const safeFilename = String(filename).replace(/[^a-zA-Z0-9._-]+/g, '-');
    const assetKey = `${category}/${Date.now()}-${safeFilename}`;
    // 上傳到 R2
    if (c.env.R2_ASSETS) {
      await c.env.R2_ASSETS.put(assetKey, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' }
      });
    }
    // 寫入 D1 索引
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        content_type TEXT DEFAULT '',
        size_bytes INTEGER DEFAULT 0,
        r2_bucket TEXT DEFAULT 'cloak-assets',
        category TEXT DEFAULT 'general',
        campaign_id TEXT DEFAULT '',
        template_id INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        uploaded_by TEXT DEFAULT 'system',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});
    await c.env.DB.prepare(
      'INSERT INTO assets (asset_key, filename, content_type, size_bytes, category) VALUES (?,?,?,?,?)'
    ).bind(assetKey, filename, file.type || '', file.size || 0, category).run();
    return c.json({
      success: true,
      asset_key: assetKey,
      url: `https://admin-api.bexnua.store/api/v1/media/file/${encodeURIComponent(assetKey)}`,
    });
  } catch (e: any) {
    console.error('media upload error:', e);
    return c.json({ success: false, error: e.message || 'Upload failed' }, 500);
  }
});

// 素材檔案服務（公開路由，用於圖片顯示）
app.get('/api/v1/media/file/:key{.+}', async (c) => {
  try {
    const key = decodeURIComponent(c.req.param('key'));
    if (!c.env.R2_ASSETS) {
      return c.text('R2 not configured', 500);
    }
    const object = await c.env.R2_ASSETS.get(key);
    if (!object) {
      return c.text('Not found', 404);
    }
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(object.body as ReadableStream, { headers });
  } catch (e: any) {
    console.error('media file error:', e);
    return c.text('Error: ' + (e.message || ''), 500);
  }
});

// 素材刪除
app.delete('/api/v1/media/:key{.+}', async (c) => {
  try {
    const key = decodeURIComponent(c.req.param('key'));
    if (c.env.R2_ASSETS) {
      await c.env.R2_ASSETS.delete(key).catch(() => {});
    }
    await c.env.DB.prepare('DELETE FROM assets WHERE asset_key = ?').bind(key).run();
    return c.json({ success: true });
  } catch (e: any) {
    console.error('media delete error:', e);
    return c.json({ success: false, error: e.message || 'Delete failed' }, 500);
  }
});

// ============================================================
// Details 詳情頁面功能
// 用途：廣告設定中的「安全頁彈出內容」會生成一個獨立的 details 頁面 URL
// 訪客點擊安全頁上的按鈕 → 跳轉到 /details/:id → 渲染富文本內容
// ============================================================

// 建立 details 頁面（需要 API key，由廣告設定保存時呼叫）
app.post('/api/v1/details', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const content = (body as any).content || '';
  const campaign_id = (body as any).campaign_id || '';
  const title = (body as any).title || '詳情頁面';
  if (!content) {
    return c.json({ success: false, error: 'content is required' }, 400);
  }
  const id = Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS details_pages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {});
  await c.env.DB.prepare(
    'INSERT INTO details_pages (id, campaign_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, campaign_id, title, content, now, now).run();
  const detailsUrl = `https://admin-api.bexnua.store/details/${id}`;
  return c.json({ success: true, data: { id, url: detailsUrl } });
});

// 更新 details 頁面（需要 API key）
app.put('/api/v1/details/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const content = (body as any).content || '';
  const title = (body as any).title || '';
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE details_pages SET content = ?, title = ?, updated_at = ? WHERE id = ?'
  ).bind(content, title, now, id).run();
  const detailsUrl = `https://admin-api.bexnua.store/details/${id}`;
  return c.json({ success: true, data: { id, url: detailsUrl } });
});

// 公開路由：渲染 details 頁面 HTML（不需要 API key）
app.get('/details/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS details_pages (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `).run().catch(() => {});
  const row = await c.env.DB.prepare(
    'SELECT * FROM details_pages WHERE id = ?'
  ).bind(id).first() as any;
  if (!row) {
    return c.html(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>頁面不存在</title></head><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>404 - 頁面不存在</h2><p>此詳情頁面不存在或已被刪除。</p></body></html>`, 404);
  }
  const pageHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(row as any).title || '詳情頁面'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Microsoft JhengHei', 'PingFang TC', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      background: #fff;
      min-height: 100vh;
    }
    .content-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px 80px;
    }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; }
    th { background: #f9fafb; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; color: #6b7280; }
    pre { background: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
    h1,h2,h3,h4,h5,h6 { margin: 16px 0 8px; line-height: 1.3; }
    p { margin: 8px 0; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="content-wrapper">
    ${(row as any).content}
  </div>
</body>
</html>`;
  return c.html(pageHtml);
});

export default app;
