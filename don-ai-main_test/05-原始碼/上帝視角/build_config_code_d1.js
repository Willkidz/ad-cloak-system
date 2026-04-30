// ===== Config API — Build Config (D1 版) =====
// 原本從 n8n DataTables 讀取，改為從 Cloudflare D1 讀取
const D1_API = 'https://api.cloudflare.com/client/v4/accounts/61f1eb800e48d2cf41ed9ddacf01581b/d1/database/3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c/query';
const CF_TOKEN = 'Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f';

const adResp = await this.helpers.httpRequest({
  method: 'POST',
  url: D1_API,
  headers: { 'Authorization': CF_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: 'SELECT * FROM ad_config' }),
  json: true
});
const lineResp = await this.helpers.httpRequest({
  method: 'POST',
  url: D1_API,
  headers: { 'Authorization': CF_TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: 'SELECT * FROM line_config' }),
  json: true
});

// D1 回傳格式: { result: [{ results: [...] }] }
const adRows = (adResp.result && adResp.result[0] && adResp.result[0].results) || [];
const lineRows = (lineResp.result && lineResp.result[0] && lineResp.result[0].results) || [];

const LINE_MAP = {};
const AD_MAP = {};
let DEFAULT_MSG = '領取優惠，優惠碼： #{token}';

// ===== v7: MASTER_PIXEL_MAP 從 D1 動態讀取 =====
// type=ads 的 row，相同 code 取最後一筆（最新）
const MASTER_PIXEL_MAP = {};
for (const row of adRows) {
  if (row.type !== 'ads') continue;
  const code = row.code || '';
  if (!code || !row.pixel || !row.token) continue;
  // 後面的覆蓋前面的，相同 code 取最新
  MASTER_PIXEL_MAP[code] = { pixel: row.pixel, token: row.token };
}

// ===== v1: BC_PIXEL 從 D1 動態讀取 =====
// type=bc 的 row，code=all 的資料
let BC_PIXEL = null;
for (const row of adRows) {
  if (row.type !== 'bc') continue;
  if (row.code !== 'all') continue;
  if (!row.pixel || !row.token) continue;
  BC_PIXEL = { pixel: row.pixel, token: row.token };
  break; // 只取第一筆
}

const PIXEL_BLACKLIST = new Set(['1101853092009819']);
const MASTER_PIXEL_IDS = new Set(
  Object.values(MASTER_PIXEL_MAP).map(p => p.pixel)
);

// ===== 組別同步映射 v1 =====
const GROUP_PREFIX_MAP = {
  'AS': ['JS', 'CS', 'MS', 'LS'],
  'AB': ['JB', 'CB', 'MB', 'LB'],
  'AX': ['JX', 'CX', 'MX', 'LX']
};

for (const row of lineRows) {
  const tag = row.tag || '';
  if (tag === '_default_') continue;
  if (!tag) continue;
  LINE_MAP[tag] = {
    line: row.line || '',
    name: row.name || '',
    who: row.who || '-',
    msg: (row.msg || '').replace('#(token)', '#{token}'),
    destination: row.destination || '',
    master_pixel: MASTER_PIXEL_MAP[tag] || null
  };
}

// AD_MAP v7: 支援組別同步 + 動態 master
// 第一步：收集組別 (type=group) 的像素權杖
const groupPixels = {};
for (const row of adRows) {
  const code = row.code || '';
  if (!code || row.type !== 'group') continue;
  if (!row.pixel || !row.token) continue;
  const match = code.match(/^(AS|AB|AX)(\d+)$/i);
  if (match) {
    groupPixels[match[1].toUpperCase() + match[2]] = { pixel: row.pixel, token: row.token };
  }
}

// 第二步：處理 ad 類型，自身沒像素就從組別繼承
for (const row of adRows) {
  const code = row.code || '';
  if (!code || row.type === 'group' || row.type === 'ads' || row.type === 'bc') continue;

  let pixel = row.pixel || '';
  let token = row.token || '';

  // 自身沒像素，嘗試從組別繼承
  if (!pixel) {
    const adMatch = code.match(/^(JS|CS|MS|LS|JB|CB|MB|LB|JX|CX|MX|LX)(\d+)$/i);
    if (adMatch) {
      const adPrefix = adMatch[1].toUpperCase();
      const num = adMatch[2];
      for (const [gp, members] of Object.entries(GROUP_PREFIX_MAP)) {
        if (members.includes(adPrefix)) {
          const gk = gp + num;
          if (groupPixels[gk]) {
            pixel = groupPixels[gk].pixel;
            token = groupPixels[gk].token;
          }
          break;
        }
      }
    }
  }

  if (!AD_MAP[code]) {
    AD_MAP[code] = { pixels: [] };
  }
  if (pixel
      && !PIXEL_BLACKLIST.has(pixel)
      && !MASTER_PIXEL_IDS.has(pixel)) {
    const existIdx = AD_MAP[code].pixels.findIndex(p => p.pixel === pixel);
    if (existIdx >= 0) {
      AD_MAP[code].pixels[existIdx] = { pixel, token };
    } else {
      AD_MAP[code].pixels.push({ pixel, token });
    }
  }
}

return [{ json: { LINE_MAP, AD_MAP, DEFAULT_MSG, MASTER_PIXEL_MAP, BC_PIXEL } }];
