// ============================================================
// shadow-cloak Worker v11 (v6.6)
// 新增：功能 1 JWT Token 握手（防重放）
//       功能 2 Meta CAPI 整合
//       功能 3 自動更新 Bot IP 清單（新增資料來源 + 白名單）
// 累計 21 項功能
// ============================================================

const META_ASNS = [32934, 15169, 13335, 8075, 63293];
const ALLOWED_COUNTRIES = ['TW', 'HK', 'MO'];

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /indexer/i,
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /baiduspider/i, /yandexbot/i, /facebookexternalhit/i,
  /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegram/i,
  /skype/i, /viber/i, /line/i, /qq/i, /weibo/i,
  /curl/i, /wget/i, /python/i, /java\/\d/i, /node/i,
  /postman/i, /insomnia/i, /httpie/i, /axios/i
];

const HARDCODED_RESOURCE_FILTER = [
  "google-analytics\\.com", "googletagmanager\\.com",
  "connect\\.facebook\\.net", "facebook\\.com/tr",
  "doubleclick\\.net", "googlesyndication\\.com",
  "adspyglass\\.com", "bigspy\\.com"
];

const REFERER_SPY_KEYWORDS = [
  'adspy','bigspy','adplexity','poweradspy','socialadscout',
  'adbeat','moat.com','spyfu','semrush','similarweb','ahrefs','moz.com'
];

let _flagCache = null;

const DEFAULT_FEATURE_FLAGS = {
  enable_fingerprint: '1',
  enable_action_verify: '1',
  enable_verified_bot_allowlist: '1',
  enable_vpn_check: '1',
  enable_interaction_detect: '1',
  enable_fbclid_check: '1',
  enable_referer_spy_check: '1',
  enable_country_filter: '1',
  enable_os_filter: '1',
  enable_language_filter: '1',
  enable_layered_logging: '1',
  enable_routing_rules: '1',
  maintenance_mode: '0',
  debug_mode: '0'
};

function safeJsonParseValue(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (e) { return fallback; }
}

function buildFlagScope(campaignId) {
  return campaignId ? `campaign:${campaignId}` : 'global';
}

function normalizeFlagRowValue(row) {
  if (!row) return '1';
  if (row.enabled === 0 || row.enabled === false) return '0';
  return row.flag_value === undefined || row.flag_value === null ? '1' : String(row.flag_value);
}

function coerceFlagBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return fallback;
}

async function loadFeatureFlags(env, scope = 'global') {
  if (!_flagCache) _flagCache = {};
  if (_flagCache[scope]) return _flagCache[scope];

  const flags = { ...DEFAULT_FEATURE_FLAGS };

  try {
    const globalRows = await env.DB.prepare(
      `SELECT flag_key, flag_value, enabled FROM feature_flags WHERE scope = ? ORDER BY id ASC`
    ).bind('global').all();

    for (const row of globalRows?.results || []) {
      flags[row.flag_key] = normalizeFlagRowValue(row);
    }

    if (scope !== 'global') {
      const scopedRows = await env.DB.prepare(
        `SELECT flag_key, flag_value, enabled FROM feature_flags WHERE scope = ? ORDER BY id ASC`
      ).bind(scope).all();

      for (const row of scopedRows?.results || []) {
        flags[row.flag_key] = normalizeFlagRowValue(row);
      }
    }
  } catch (e) {
    console.error('loadFeatureFlags error:', e);
  }

  _flagCache[scope] = flags;
  return flags;
}

async function isFeatureEnabled(env, flagKey, fallback = true, scope = 'global') {
  try {
    const flags = await loadFeatureFlags(env, scope);
    return coerceFlagBoolean(flags[flagKey], fallback);
  } catch (e) {
    console.error('isFeatureEnabled error:', e);
    return fallback;
  }
}

async function getFeatureFlagValue(env, flagKey, fallback = null, scope = 'global') {
  try {
    const flags = await loadFeatureFlags(env, scope);
    return flags[flagKey] === undefined ? fallback : flags[flagKey];
  } catch (e) {
    console.error('getFeatureFlagValue error:', e);
    return fallback;
  }
}

function buildCorsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    ...extra
  };
}

function isProtectedAdminPath(pathname) {
  return pathname === '/cloak-flags'
    || pathname === '/cloak-variants'
    || pathname === '/cloak-template-version'
    || pathname === '/cloak-template-rollback'
    || pathname === '/cloak-content'
    || pathname.startsWith('/cloak-content/');
}

function extractAdminApiKey(request) {
  const directKey = (request.headers.get('X-API-Key') || '').trim();
  if (directKey) return directKey;
  const authHeader = (request.headers.get('Authorization') || '').trim();
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch ? bearerMatch[1].trim() : '';
}

async function authenticateAdminRequest(request, env) {
  try {
    const expectedKey = String((await env.CLOAKER_CONFIG.get('admin_api_key')) || '').trim();
    if (!expectedKey) {
      console.error('admin_api_key missing in CLOAKER_CONFIG');
      return false;
    }
    const providedKey = extractAdminApiKey(request);
    return Boolean(providedKey) && providedKey === expectedKey;
  } catch (e) {
    console.error('authenticateAdminRequest error:', e);
    return false;
  }
}

function buildUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
  });
}

async function enforceAdminApiAuth(request, env, pathname) {
  if (request.method === 'OPTIONS') return null;
  if (!isProtectedAdminPath(pathname)) return null;
  const authorized = await authenticateAdminRequest(request, env);
  if (authorized) return null;
  return buildUnauthorizedResponse();
}

function normalizeConditionArray(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function detectOsFromUserAgent(ua) {
  if (!ua) return 'unknown';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
  if (/Linux|CrOS/i.test(ua)) return 'linux';
  return 'other';
}

function extractOsVersionFromUserAgent(ua, detectedOs) {
  if (!ua || !detectedOs) return '';
  const normalizedOs = String(detectedOs).toLowerCase();
  let match = null;

  if (normalizedOs === 'android') {
    match = ua.match(/Android\s+([0-9._]+)/i);
  } else if (normalizedOs === 'ios') {
    match = ua.match(/OS\s+([0-9_]+)/i);
  } else if (normalizedOs === 'windows') {
    match = ua.match(/Windows NT\s+([0-9.]+)/i);
  } else if (normalizedOs === 'macos') {
    match = ua.match(/Mac OS X\s+([0-9_]+)/i);
  } else if (normalizedOs === 'linux') {
    match = ua.match(/(?:Linux|CrOS)[^0-9]*([0-9.]+)/i);
  }

  return match && match[1] ? String(match[1]).replace(/_/g, '.').trim() : '';
}

function compareVersionParts(left, right) {
  const leftParts = String(left || '').split('.').map(v => parseInt(v, 10));
  const rightParts = String(right || '').split('.').map(v => parseInt(v, 10));
  const maxLen = Math.max(leftParts.length, rightParts.length);
  for (let i = 0; i < maxLen; i += 1) {
    const a = Number.isFinite(leftParts[i]) ? leftParts[i] : 0;
    const b = Number.isFinite(rightParts[i]) ? rightParts[i] : 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

function matchOsVersion(actualVersion, expectedVersionConfig) {
  if (!expectedVersionConfig || !String(expectedVersionConfig).trim()) {
    return { matched: true, actualVersion: actualVersion || '' };
  }
  if (!actualVersion) {
    return { matched: false, actualVersion: '' };
  }

  const rawRules = String(expectedVersionConfig)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  if (rawRules.length === 0) {
    return { matched: true, actualVersion };
  }

  const matched = rawRules.some(rule => {
    const opMatch = rule.match(/^(>=|<=|>|<|=)?\s*([0-9][0-9.]*)$/);
    if (!opMatch) {
      return actualVersion.startsWith(rule);
    }
    const operator = opMatch[1] || '=';
    const expectedVersion = opMatch[2];
    const compare = compareVersionParts(actualVersion, expectedVersion);
    if (operator === '>=') return compare >= 0;
    if (operator === '<=') return compare <= 0;
    if (operator === '>') return compare > 0;
    if (operator === '<') return compare < 0;
    return compare === 0 || actualVersion.startsWith(expectedVersion);
  });

  return { matched, actualVersion };
}

function checkRegionWithConfig(requestRegion, cloakRegion) {
  if (!cloakRegion || !String(cloakRegion).trim()) return true;
  if (!requestRegion) return false;
  const allowedRegions = String(cloakRegion)
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);
  if (allowedRegions.length === 0) return true;
  return allowedRegions.includes(String(requestRegion).trim().toLowerCase());
}

function matchHourRange(hourRange, hour) {
  if (!hourRange && hourRange !== 0) return true;
  const range = String(hourRange).trim();
  if (!range.includes('-')) return Number(range) === hour;
  const [rawStart, rawEnd] = range.split('-').map(v => Number(String(v).trim()));
  if (Number.isNaN(rawStart) || Number.isNaN(rawEnd)) return true;
  if (rawStart <= rawEnd) return hour >= rawStart && hour <= rawEnd;
  return hour >= rawStart || hour <= rawEnd;
}

function matchesRoutingConditions(conditions, requestContext = {}) {
  const cond = safeJsonParseValue(conditions, {});
  if (!cond || typeof cond !== 'object') return true;

  const countryList = normalizeConditionArray(cond.country || cond.countries);
  if (countryList.length > 0 && !countryList.map(v => v.toUpperCase()).includes(String(requestContext.country || '').toUpperCase())) return false;

  const osList = normalizeConditionArray(cond.os || cond.oses);
  if (osList.length > 0 && !osList.map(v => v.toLowerCase()).includes(String(requestContext.os || '').toLowerCase())) return false;

  const langList = normalizeConditionArray(cond.language || cond.languages);
  if (langList.length > 0) {
    const requestLang = String(requestContext.acceptLanguage || '').toLowerCase();
    if (!langList.some(lang => requestLang.includes(String(lang).toLowerCase()))) return false;
  }

  const hostnameList = normalizeConditionArray(cond.hostname || cond.hostnames);
  if (hostnameList.length > 0 && !hostnameList.includes(String(requestContext.hostname || ''))) return false;

  const pathIncludes = normalizeConditionArray(cond.path_contains || cond.path_includes);
  if (pathIncludes.length > 0 && !pathIncludes.some(part => String(requestContext.pathname || '').includes(part))) return false;

  const refererIncludes = normalizeConditionArray(cond.referer_contains || cond.referer_includes);
  if (refererIncludes.length > 0) {
    const ref = String(requestContext.referer || '').toLowerCase();
    if (!refererIncludes.some(part => ref.includes(String(part).toLowerCase()))) return false;
  }

  const uaIncludes = normalizeConditionArray(cond.ua_contains || cond.ua_includes);
  if (uaIncludes.length > 0) {
    const requestUa = String(requestContext.ua || '').toLowerCase();
    if (!uaIncludes.some(part => requestUa.includes(String(part).toLowerCase()))) return false;
  }

  if (cond.require_fbclid === true && !requestContext.hasFbclid) return false;
  if (cond.require_fbclid === false && requestContext.hasFbclid) return false;
  if (cond.hour_range !== undefined && !matchHourRange(cond.hour_range, Number(requestContext.hour ?? -1))) return false;

  return true;
}

function applyRoutingRuleToCampaign(campaignConfig, rule) {
  const actionParams = safeJsonParseValue(rule.action_params, {});
  const routed = {
    ...campaignConfig,
    matched_routing_rule: {
      id: rule.id,
      name: rule.name || '',
      action_type: rule.action_type || 'pass',
      action_params: actionParams,
      campaign_id: rule.campaign_id || ''
    }
  };

  if (actionParams.safe_page_id) routed.safe_page_id = actionParams.safe_page_id;
  if (actionParams.safe_page_type) routed.safe_page_type = actionParams.safe_page_type;
  if (actionParams.money_page_id) routed.money_page_id = actionParams.money_page_id;
  if (actionParams.routing_strategy) routed.routing_strategy = actionParams.routing_strategy;

  const ctaLinks = normalizeConditionArray(actionParams.cta_links || actionParams.line_links || actionParams.customer_links);
  if (ctaLinks.length > 0) {
    routed.line_links = ctaLinks;
    routed.customer_links = ctaLinks;
  }

  const forcedTarget = actionParams.cta_link || actionParams.redirect_url || actionParams.target_url || '';
  if (forcedTarget) routed.forced_target_link = forcedTarget;

  const routeTarget = String(actionParams.route || actionParams.page || '').trim().toLowerCase();
  if (rule.action_type === 'block' || routeTarget === 'safe') routed.force_safe_page = true;
  if (routeTarget === 'money') routed.force_money_page = true;
  if (rule.action_type === 'redirect' && forcedTarget) routed.force_redirect = true;

  return routed;
}

async function resolveRoutingConfig(env, campaignConfig, requestContext = {}) {
  if (!campaignConfig || !campaignConfig.id) return campaignConfig;

  const flagScope = buildFlagScope(campaignConfig.id);
  const routingEnabled = await isFeatureEnabled(env, 'enable_routing_rules', true, flagScope);
  if (!routingEnabled) return campaignConfig;

  try {
    const { results: rows } = await env.DB.prepare(
      `SELECT id, name, campaign_id, priority, conditions, action_type, action_params, enabled
       FROM routing_rules
       WHERE enabled = 1 AND (campaign_id = '' OR campaign_id = ?)
       ORDER BY CASE WHEN campaign_id = ? THEN 0 ELSE 1 END, priority ASC, id ASC`
    ).bind(campaignConfig.id, campaignConfig.id).all();

    for (const row of rows || []) {
      if (!matchesRoutingConditions(row.conditions, requestContext)) continue;
      await env.DB.prepare(
        `UPDATE routing_rules SET hit_count = COALESCE(hit_count, 0) + 1, last_hit_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(row.id).run();
      if ((row.action_type || 'pass') === 'pass') continue;
      return applyRoutingRuleToCampaign(campaignConfig, row);
    }
  } catch (e) {
    console.error('resolveRoutingConfig error:', e);
  }

  return campaignConfig;
}

function buildRoutingContext(request, url, extra = {}) {
  return {
    country: extra.country || request.cf?.country || '',
    os: extra.os || detectOsFromUserAgent(extra.ua || request.headers.get('User-Agent') || ''),
    acceptLanguage: extra.acceptLanguage || request.headers.get('Accept-Language') || '',
    referer: extra.referer || request.headers.get('Referer') || '',
    ua: extra.ua || request.headers.get('User-Agent') || '',
    hostname: extra.hostname || url.hostname || '',
    pathname: extra.pathname || url.pathname || '',
    hasFbclid: extra.hasFbclid !== undefined ? extra.hasFbclid : url.searchParams.has('fbclid'),
    hour: extra.hour !== undefined ? extra.hour : Number(new Date().toLocaleString('en-US', { hour12: false, timeZone: 'Asia/Taipei', hour: 'numeric' }))
  };
}

function mergeFeatureFlagsIntoContext(cloakContext = {}) {
  return {
    ...cloakContext,
    featureFlags: cloakContext.featureFlags || {}
  };
}

// ============================================================
// 功能 1：JWT 工具（零依賴，使用 Web Crypto API）
// ============================================================
function base64UrlEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

async function jwtSign(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

async function jwtVerify(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'malformed' };
    const [headerB64, payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signingInput = `${headerB64}.${payloadB64}`;
    const sigBytes = base64UrlDecode(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(signingInput));
    if (!valid) return { valid: false, reason: 'invalid_signature' };
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return { valid: false, reason: 'expired' };
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, reason: 'parse_error' };
  }
}

async function issueJWT(ip, ua, secret) {
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const payload = {
    sub: ip,
    ua_hash: await sha256Short(ua),
    iat: now,
    exp: now + 300, // 5 分鐘
    jti: jti
  };
  const token = await jwtSign(payload, secret);
  return { token, jti };
}

async function sha256Short(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkJtiReplay(env, jti) {
  // 檢查 jti 是否已使用（存在 KV 中，TTL 5 分鐘）
  try {
    const existing = await env.CLOAKER_CONFIG.get(`jti:${jti}`);
    if (existing) return true; // 已使用，是重放
    // 標記為已使用
    await env.CLOAKER_CONFIG.put(`jti:${jti}`, '1', { expirationTtl: 300 });
    return false;
  } catch (e) {
    return false; // KV 失敗時不阻擋
  }
}

// ============================================================
// 功能 2：Meta CAPI 整合
// ============================================================

// ── TAG_PREFIX_MAP：子域名 tag 到產品組 tag 的映射 ──
const TAG_PREFIX_MAP = {
  // AS 系列（爆分王）
  js: 'AS', cs: 'AS', ms: 'AS', ls: 'AS',
  // AB 系列（莊家剋星）
  jb: 'AB', cb: 'AB', mb: 'AB', lb: 'AB',
  // AX 系列（獨角仙）
  jx: 'AX', cx: 'AX', mx: 'AX', lx: 'AX',
  // BF 系列（博富）
  bf: 'BF',
  jd: 'JD',
  // N 系列（獨立產品）
  n14: 'N14', n15: 'N15', n16: 'N16', n17: 'N17',
  n18: 'N18', n19: 'N19', n20: 'N20', n21: 'N21', n22: 'N22'
};

function getProductPrefix(tag) {
  if (!tag) return null;
  // 支援 BF-06、AS-01 這種「分組-編號」格式，取連字號前的部分
  const hyphenPart = tag.split('-')[0];
  const lower = hyphenPart.toLowerCase();
  if (TAG_PREFIX_MAP[lower]) return TAG_PREFIX_MAP[lower];
  // 支援直接大寫 tag（如 BF、AS、AX）
  if (TAG_PREFIX_MAP[lower.substring(0, 2)]) return TAG_PREFIX_MAP[lower.substring(0, 2)];
  // 支援 N 系列（N14、N18 等，取前 3 個字符）
  if (TAG_PREFIX_MAP[lower.substring(0, 3)]) return TAG_PREFIX_MAP[lower.substring(0, 3)];
  return null;
}

// ── 統一 CAPI 像素解析：只從 pixel_groups + pixel_group_ads 讀取 ──
// 回傳格式：[{ groupId, groupName, capiToken, bcPixelId, adPixelId, adPixelName, tag }]
// 去重規則：AD 按 pixel_id 去重，BC 按 bc_pixel_id + capi_token 去重
async function resolvePixelsByTag(env, tag) {
  if (!tag) return [];
  try {
    const { results: rows } = await env.DB.prepare(
      `SELECT g.id as group_id, g.bm_name, g.capi_token, g.bc_pixel_id,
              a.pixel_id as ad_pixel_id, a.pixel_name as ad_pixel_name, a.tag
       FROM pixel_group_ads a
       JOIN pixel_groups g ON a.group_id = g.id
       WHERE a.tag = ? AND g.status = 'active'`
    ).bind(tag).all();
    if (!rows || rows.length === 0) return [];
    return rows.map(r => ({
      groupId: r.group_id,
      groupName: r.bm_name || '',
      capiToken: r.capi_token || '',
      bcPixelId: r.bc_pixel_id || '',
      adPixelId: r.ad_pixel_id || '',
      adPixelName: r.ad_pixel_name || '',
      tag: r.tag || ''
    }));
  } catch (e) {
    console.error('resolvePixelsByTag error:', e);
    return [];
  }
}

async function sendCAPIPageView(env, campaignConfig, clientIP, ua, url, fbp, fbc) {
  try {
    if (!campaignConfig) return;

    // 取得廣告的 tag（用於從 pixel_groups 查詢像素）
    // 優先順序：campaigns.tag > campaigns.ad_code（取連字號前綴如 BF-06→BF）> campaigns.group_name
    const rawTag = campaignConfig.tag || campaignConfig.ad_code || campaignConfig.group_name || '';
    if (!rawTag) return; // 沒有 tag 就不發 CAPI

    // 使用 getProductPrefix 解析 tag：
    // - ad_code 格式 BF-06 → 取 BF → 對應 TAG_PREFIX_MAP → 'BF'
    // - ad_code 格式 AS-01 → 取 AS → 對應 TAG_PREFIX_MAP → 'AS'
    // - group_name 中文（如「博富」）無法解析，fallback 到 rawTag.toUpperCase()
    const productPrefix = getProductPrefix(rawTag);
    const tag = productPrefix || rawTag.toUpperCase();

    // 統一從 pixel_groups + pixel_group_ads 讀取（唯一來源）
    const groupPixels = await resolvePixelsByTag(env, tag);
    if (groupPixels.length === 0) return; // 沒有像素就安靜返回

    // 建立去重後的像素清單
    const pixelList = [];
    const seenAd = new Set();  // AD 按 pixel_id 去重
    const seenBc = new Set();  // BC 按 bc_pixel_id + capi_token 去重

    for (const gp of groupPixels) {
      // AD 像素
      if (gp.adPixelId && gp.capiToken) {
        const adKey = gp.adPixelId;
        if (!seenAd.has(adKey)) {
          seenAd.add(adKey);
          pixelList.push({ pixelId: gp.adPixelId, accessToken: gp.capiToken, groupId: gp.groupId, groupName: gp.groupName, pixelTag: gp.tag });
        }
      }
      // BC 像素
      if (gp.bcPixelId && gp.capiToken) {
        const bcKey = `${gp.bcPixelId}|${gp.capiToken}`;
        if (!seenBc.has(bcKey)) {
          seenBc.add(bcKey);
          pixelList.push({ pixelId: gp.bcPixelId, accessToken: gp.capiToken, groupId: gp.groupId, groupName: gp.groupName, pixelTag: gp.tag });
        }
      }
    }

    if (pixelList.length === 0) return;

    // 對每個像素各自發送一次 PageView，並將結果寫入 capi_logs
    const eventTime = Math.floor(Date.now() / 1000);
    const promises = pixelList.map(async ({ pixelId, accessToken, groupId, groupName, pixelTag }) => {
      let statusCode = 0;
      let success = false;
      let errorMessage = '';
      try {
        const eventData = {
          data: [{
            event_name: 'PageView',
            event_time: eventTime,
            action_source: 'website',
            event_source_url: url,
            user_data: {
              client_ip_address: clientIP,
              client_user_agent: ua,
              fbp: fbp || undefined,
              fbc: fbc || undefined
            }
          }],
          access_token: accessToken
        };
        const resp = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
        statusCode = resp.status;
        success = resp.ok;
        if (!resp.ok) {
          try { errorMessage = (await resp.text()).substring(0, 500); } catch (_) {}
        }
      } catch (e) {
        errorMessage = String(e?.message || e).substring(0, 500);
        console.error(`CAPI error for pixel ${pixelId}:`, e);
      }
      // 寫入 capi_logs
      try {
        await env.DB.prepare(
          `INSERT INTO capi_logs (group_id, group_name, tag, pixel_id, status_code, success, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          groupId || null,
          groupName || '',
          pixelTag || tag,
          pixelId,
          statusCode,
          success ? 1 : 0,
          errorMessage || null
        ).run();
      } catch (logErr) {
        console.error(`capi_logs write error for pixel ${pixelId}:`, logErr);
      }
      return { pixelId, statusCode, success };
    });

    await Promise.allSettled(promises);
  } catch (e) {
    console.error('CAPI error:', e);
  }
}

// ============================================================
// 功能 10：JS 混淆工具
// ============================================================
function obfuscateJS(code) {
  const varMap = {
    'interacted': '_0xa1b2', 'interactionTimer': '_0xc3d4',
    'onInteract': '_0xe5f6', 'hideOverlay': '_0xg7h8',
    'redirectSafe': '_0xi9j0', 'calcScore': '_0xk1l2',
    'runFingerprint': '_0xm3n4', 'canvasFp': '_0xo5p6',
    'webglFp': '_0xq7r8', 'audioFp': '_0xs9t0',
    'safeUrl': '_0xa7b8'
  };
  let out = code;
  for (const [orig, obf] of Object.entries(varMap)) {
    out = out.replace(new RegExp(`\\b${orig}\\b`, 'g'), obf);
  }
  const strMap = {
    "'mousemove'": "atob('bW91c2Vtb3Zl')",
    "'touchstart'": "atob('dG91Y2hzdGFydA==')",
    "'scroll'": "atob('c2Nyb2xs')",
    "'keydown'": "atob('a2V5ZG93bg==')",
    "'/cloak-fingerprint'": "atob('L2Nsb2FrLWZpbmdlcnByaW50')",
    "'/cloak-check'": "atob('L2Nsb2FrLWNoZWNr')",
    "'/cloak-action-verify'": "atob('L2Nsb2FrLWFjdGlvbi12ZXJpZnk=')",
    "'no_interaction_blocked'": "atob('bm9faW50ZXJhY3Rpb25fYmxvY2tlZA==')",
    "'CloakFP'": "atob('Q2xvYWtGUA==')"
  };
  for (const [orig, enc] of Object.entries(strMap)) {
    out = out.replace(new RegExp(orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), enc);
  }
  return out;
}

// ============================================================
// 功能 7+8+9：HTML 後處理
// ============================================================
function injectSafePageMeta(html) {
  const meta = '<meta name="robots" content="noindex, nofollow">\n<meta name="referrer" content="no-referrer">';
  const m = html.match(/<head[^>]*>/i);
  if (m) return html.replace(m[0], m[0] + '\n' + meta);
  return '<head>\n' + meta + '\n</head>\n' + html;
}
function injectNoReferrer(html) {
  const meta = '<meta name="referrer" content="no-referrer">';
  const m = html.match(/<head[^>]*>/i);
  if (m) return html.replace(m[0], m[0] + '\n' + meta);
  return html;
}
function removeCanonicalAndOgUrl(html) {
  let out = html.replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>/gi, '');
  out = out.replace(/<meta[^>]+property=["']og:url["'][^>]*\/?>/gi, '');
  return out;
}

// ============================================================
// 加載動畫 CSS + HTML
// ============================================================
const LOADING_OVERLAY_CSS = `<style id="_0xCSS">
#_0xOVL{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);
display:flex;align-items:center;justify-content:center;z-index:999999;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
#_0xOVL.hidden{display:none;}
._0xSPN{display:flex;flex-direction:column;align-items:center;gap:20px;}
._0xCIR{width:60px;height:60px;border:4px solid rgba(255,255,255,.3);
border-top:4px solid #fff;border-radius:50%;animation:_0xSPN 1s linear infinite;}
._0xTXT{color:#fff;font-size:16px;font-weight:500;letter-spacing:.5px;}
@keyframes _0xSPN{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>`;

const LOADING_OVERLAY_HTML = `<div id="_0xOVL"><div class="_0xSPN"><div class="_0xCIR"></div><div class="_0xTXT">Loading...</div></div></div>`;

// ============================================================
// 客戶端 JS 代碼
// ============================================================
const RAW_CLIENT_JS = `(function(){
  var _safeUrl=window.__CLOAK_SAFE_PAGE_URL__||'';
  var _flags=window.__CLOAK_FLAGS__||{};
  function _flagEnabled(key,fallback){if(_flags[key]===undefined||_flags[key]===null||_flags[key]==='')return fallback;if(typeof _flags[key]==='boolean')return _flags[key];var v=String(_flags[key]).toLowerCase();return ['1','true','yes','on','enabled'].indexOf(v)!==-1;}
  var _fingerprintEnabled=_flagEnabled('enable_fingerprint',true);
  var _interactionEnabled=_flagEnabled('enable_interaction_detect',true);
  window.__CLOAK_REQUEST_ID__=window.__CLOAK_REQUEST_ID__||'';
  window.__CLOAK_VISITOR_ID__=window.__CLOAK_VISITOR_ID__||'';
  window.__CLOAK_FP_SCORE__=window.__CLOAK_FP_SCORE__||0;
  window.__CLOAK_FP_DETAILS__=window.__CLOAK_FP_DETAILS__||{};
  window.__CLOAK_BOT_SCORE__=window.__CLOAK_BOT_SCORE__||0;
  window.__CLOAK_BOT_DETAILS__=window.__CLOAK_BOT_DETAILS__||{};
  window.__CLOAK_SESSION_ID__=window.__CLOAK_SESSION_ID__||((window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():(Date.now()+'-'+Math.random().toString(16).slice(2)));
  function hideOverlay(){var o=document.getElementById('_0xOVL');if(o)o.classList.add('hidden');}
  function redirectSafe(){hideOverlay();if(_safeUrl){window.location.href=_safeUrl;}else{document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh"><h1>Access Denied</h1></div>';}}
  var interacted=false;
  var interactionTimer=null;
  if(_interactionEnabled){interactionTimer=setTimeout(function(){if(!interacted){fetch('/cloak-check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'no_interaction_blocked',request_id:window.__CLOAK_REQUEST_ID__||'',visitor_id:window.__CLOAK_VISITOR_ID__||'',session_id:window.__CLOAK_SESSION_ID__||'',userAgent:navigator.userAgent,time_on_page:3000,url:window.location.href})}).catch(function(){});redirectSafe();}},3000);}
  function onInteract(){if(interacted)return;interacted=true;if(interactionTimer)clearTimeout(interactionTimer);}
  ['mousemove','touchstart','scroll','keydown','click'].forEach(function(e){window.addEventListener(e,onInteract,{once:true,passive:true});});
  async function sha256(str){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');}
  async function canvasFp(){try{var c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.textBaseline='top';ctx.font='14px Arial';ctx.fillText('CloakFP',2,2);return await sha256(c.toDataURL());}catch(e){return null;}}
  function webglFp(){try{var c=document.createElement('canvas');var gl=c.getContext('webgl')||c.getContext('experimental-webgl');if(!gl)return null;var di=gl.getExtension('WEBGL_debug_renderer_info');if(!di)return null;return gl.getParameter(di.UNMASKED_VENDOR_WEBGL)+'|'+gl.getParameter(di.UNMASKED_RENDERER_WEBGL);}catch(e){return null;}}
  async function audioFp(){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;var ctx=new AC(),osc=ctx.createOscillator(),an=ctx.createAnalyser(),gn=ctx.createGain();gn.gain.setValueAtTime(0,ctx.currentTime);osc.connect(an);an.connect(gn);gn.connect(ctx.destination);osc.start(0);var fd=new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(fd);osc.stop();ctx.close();return await sha256(fd.slice(0,30).join(','));}catch(e){return null;}}
  async function detectBotSignals(){var score=0,details={};function ok(k,v,extra){details[k]=Object.assign({score:v?1:0,value:!!v},extra||{});if(v)score+=1;}function fail(k,e){details[k]={score:0,value:false,error:String((e&&e.message)||e||'error')};}function chk(k,fn){try{ok(k,!!fn());}catch(e){fail(k,e);}}chk('webdriver',function(){return navigator.webdriver===true;});chk('headlessUa',function(){var ua=navigator.userAgent||'';return /HeadlessChrome|PhantomJS|SlimerJS|Puppeteer|Playwright|Selenium/i.test(ua);});chk('seleniumGlobals',function(){return !!(window.__webdriver_script_fn||window.__driver_evaluate||window.__selenium_evaluate||window.__webdriver_evaluate||window.__fxdriver_evaluate||window.__driver_unwrapped||window.__webdriver_unwrapped||window.__selenium_unwrapped||window.__fxdriver_unwrapped||window.webdriver||window.driver);});chk('seleniumDocumentAttributes',function(){var de=document.documentElement;return !!(de&&(de.getAttribute('webdriver')||de.getAttribute('driver')||de.getAttribute('selenium')));});chk('chromedriverCdc',function(){var names=[];try{names=Object.getOwnPropertyNames(window);}catch(e){names=[];}for(var i=0;i<names.length;i++){if(/^cdc_[a-zA-Z0-9]+_(Array|Promise|Symbol)$/.test(names[i]))return true;}return false;});chk('playwrightGlobals',function(){return !!(window.__playwright__binding__||window.__pwInitScripts);});chk('puppeteerGlobals',function(){return !!(window.__puppeteer_evaluation_script__||window.__PUPPETEER__);});chk('phantomjsGlobals',function(){return !!(window.callPhantom||window._phantom||window.phantom);});chk('nightmareGlobals',function(){return !!window.__nightmare;});try{if(navigator.permissions&&window.Notification&&navigator.permissions.query){var perm=await navigator.permissions.query({name:'notifications'});ok('notificationPermissionsAnomaly',Notification.permission==='denied'&&perm&&perm.state==='prompt',{state:(perm&&perm.state)||''});}else{ok('notificationPermissionsAnomaly',false);}}catch(e){fail('notificationPermissionsAnomaly',e);}return{score,details};}
  async function calcScore(){var score=0,details={};var cf=await canvasFp();details.canvas={score:cf?1:0};score+=details.canvas.score;var wf=webglFp();details.webgl={score:wf?1:0};score+=details.webgl.score;var af=await audioFp();details.audio={score:af?1:0};score+=details.audio.score;var hc=navigator.hardwareConcurrency||null;details.hardwareConcurrency={score:(hc&&hc>2)?1:0};score+=details.hardwareConcurrency.score;var dm=navigator.deviceMemory||null;details.deviceMemory={score:dm?1:0};score+=details.deviceMemory.score;var sr=screen.width+'x'+screen.height;details.screenResolution={score:sr!=='800x600'?1:0};score+=details.screenResolution.score;var tz=null;try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}details.timezone={score:tz?1:0};score+=details.timezone.score;var lg=navigator.language||navigator.userLanguage||null;details.language={score:lg?1:0};score+=details.language.score;return{score,details};}
  async function runFingerprint(){try{if(!_fingerprintEnabled){hideOverlay();return;}var fp=await calcScore();var bot=await detectBotSignals();var finalScore=fp.score||0;if((bot.score||0)>=2){finalScore=Math.max(0,finalScore-1);}window.__CLOAK_FP_SCORE__=finalScore;window.__CLOAK_FP_DETAILS__=fp.details||{};window.__CLOAK_BOT_SCORE__=bot.score||0;window.__CLOAK_BOT_DETAILS__=bot.details||{};var res=await fetch('/cloak-fingerprint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:window.__CLOAK_REQUEST_ID__||'',visitor_id:window.__CLOAK_VISITOR_ID__||'',session_id:window.__CLOAK_SESSION_ID__||'',score:finalScore,details:fp.details,bot_score:bot.score||0,bot_signals:bot.details||{},userAgent:navigator.userAgent,url:window.location.href})});var j=await res.json();hideOverlay();if(!j.pass)redirectSafe();}catch(e){console.error('FP error',e);hideOverlay();}}
  window.__CLOAK_FP_READY_PROMISE__=runFingerprint();
})();`;

const DISABLE_RIGHTCLICK_JS = `(function(){
  document.addEventListener('contextmenu',function(e){e.preventDefault();});
  document.addEventListener('selectstart',function(e){e.preventDefault();});
  document.addEventListener('copy',function(e){e.preventDefault();});
})();`;

function buildBackRedirectJS(backUrl) {
  if (!backUrl) return '';
  return `(function(){
  history.pushState(null,null,location.href);
  window.addEventListener('popstate',function(){
    history.pushState(null,null,location.href);
    window.location.href='${backUrl.replace(/'/g, "\\'")}';
  });
})();`;
}

function buildExitPopupJS(popupText) {
  if (!popupText) return '';
  return `(function(){
  var _shown=false;
  document.addEventListener('mouseleave',function(e){
    if(e.clientY<0&&!_shown){
      _shown=true;
      var d=document.createElement('div');
      d.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:999998;';
      var b=document.createElement('div');
      b.style.cssText='background:#fff;padding:40px;border-radius:12px;max-width:480px;text-align:center;position:relative;';
      b.innerHTML='<p style="font-size:18px;margin-bottom:20px;">${popupText.replace(/'/g, "\\'").replace(/\n/g, '<br>')}</p><button style="padding:10px 30px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;" onclick="this.closest(\\'div\\').parentElement.remove()">關閉</button>';
      d.appendChild(b);
      document.body.appendChild(d);
    }
  });
})();`;
}

const RAW_FB_VIEWCONTENT_JS = `(function(){
  var _fired=false;
  function _fireVC(){
    if(_fired)return;
    _fired=true;
    try{if(typeof fbq==='function'){fbq('track','ViewContent');}}catch(e){}
  }
  // 停留 30 秒觸發
  setTimeout(function(){_fireVC();},30000);
  // 滾動 50% 觸發
  function _onScroll(){
    var scrollTop=window.pageYOffset||document.documentElement.scrollTop;
    var docHeight=document.documentElement.scrollHeight-document.documentElement.clientHeight;
    if(docHeight>0&&(scrollTop/docHeight)>=0.5){
      _fireVC();
      window.removeEventListener('scroll',_onScroll);
    }
  }
  window.addEventListener('scroll',_onScroll,{passive:true});
})();`;

function buildFbViewContentJS() {
  return RAW_FB_VIEWCONTENT_JS;
}

const PIXEL_ID_JS = `(function(){
  var _params=new URLSearchParams(window.location.search);
  var _pid=_params.get('pixel_id');
  if(!_pid)return;
  var _forms=document.querySelectorAll('form');
  _forms.forEach(function(_f){
    var _inp=document.createElement('input');
    _inp.type='hidden';_inp.name='pixel_id';_inp.value=_pid;
    _f.appendChild(_inp);
  });
})();`;

// ============================================================
// HTML 注入主函數
// ============================================================
function injectMoneyPageCode(html, backUrl, popupText, cloakContext = {}) {
  let out = html;
  out = injectNoReferrer(out);
  out = removeCanonicalAndOgUrl(out);

  cloakContext = mergeFeatureFlagsIntoContext(cloakContext);
  const contextJS = `(function(){window.__CLOAK_REQUEST_ID__=${JSON.stringify(cloakContext.requestId || '')};window.__CLOAK_VISITOR_ID__=${JSON.stringify(cloakContext.visitorId || '')};window.__CLOAK_SESSION_ID__=${JSON.stringify(cloakContext.sessionId || '')};window.__CLOAK_SAFE_PAGE_URL__=${JSON.stringify(cloakContext.safePageUrl || '/')};window.__CLOAK_FLAGS__=${JSON.stringify(cloakContext.featureFlags || {})};window.__CLOAK_FP_SCORE__=window.__CLOAK_FP_SCORE__||0;window.__CLOAK_FP_DETAILS__=window.__CLOAK_FP_DETAILS__||{};window.__CLOAK_BOT_SCORE__=window.__CLOAK_BOT_SCORE__||0;window.__CLOAK_BOT_DETAILS__=window.__CLOAK_BOT_DETAILS__||{};window.__CLOAK_ACTION_INTERACTIONS__=window.__CLOAK_ACTION_INTERACTIONS__||0;window.__CLOAK_PAGE_ENTER_TS__=window.__CLOAK_PAGE_ENTER_TS__||Date.now();})();`;
  const actionVerifyJS = obfuscateJS(`(function(){var actionStart=window.__CLOAK_PAGE_ENTER_TS__||Date.now();var flags=window.__CLOAK_FLAGS__||{};function flagEnabled(key,fallback){if(flags[key]===undefined||flags[key]===null||flags[key]==='')return fallback;if(typeof flags[key]==='boolean')return flags[key];var v=String(flags[key]).toLowerCase();return ['1','true','yes','on','enabled'].indexOf(v)!==-1;}var actionVerifyEnabled=flagEnabled('enable_action_verify',true);function countInteract(){window.__CLOAK_ACTION_INTERACTIONS__=(window.__CLOAK_ACTION_INTERACTIONS__||0)+1;}['click','touchstart','scroll','keydown','mousemove'].forEach(function(e){window.addEventListener(e,countInteract,{capture:true,passive:true});});function redirectSafe(){window.location.href=window.__CLOAK_SAFE_PAGE_URL__||'/';}function getActionType(targetUrl){if(!targetUrl)return 'cta_click';if(targetUrl.indexOf('liff.line.me')!==-1||targetUrl.indexOf('line.me')!==-1)return 'liff_redirect';return 'cta_click';}function verifyAndRedirect(targetUrl){if(!actionVerifyEnabled){window.location.href=targetUrl;return;}Promise.resolve(window.__CLOAK_FP_READY_PROMISE__).catch(function(){}).then(function(){return fetch('/cloak-action-verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:getActionType(targetUrl),request_id:window.__CLOAK_REQUEST_ID__||'',visitor_id:window.__CLOAK_VISITOR_ID__||'',session_id:window.__CLOAK_SESSION_ID__||'',fp_score:window.__CLOAK_FP_SCORE__||0,fp_details:window.__CLOAK_FP_DETAILS__||{},bot_score:window.__CLOAK_BOT_SCORE__||0,bot_signals:window.__CLOAK_BOT_DETAILS__||{},interaction_count:window.__CLOAK_ACTION_INTERACTIONS__||0,time_on_page:Date.now()-actionStart,url:window.location.href,userAgent:navigator.userAgent,target_url:targetUrl})});}).then(function(r){return r.json();}).then(function(j){if(j&&j.verified&&j.target){window.location.href=j.target;}else if(j&&j.target){window.location.href=j.target;}else{redirectSafe();}}).catch(function(){window.location.href=targetUrl;});}window.__CLOAK_ACTION_VERIFY_REDIRECT__=verifyAndRedirect;document.addEventListener('click',function(e){var link=e.target&&e.target.closest?e.target.closest('a[href*="vid="], a[href*="liff.line.me"], a[href*="line.me"], a[data-cta="true"], .cta-button'):null;if(!link)return;var targetUrl=link.href||link.getAttribute('data-href')||link.getAttribute('href')||'';if(!targetUrl)return;countInteract();e.preventDefault();verifyAndRedirect(targetUrl);},true);})();`);

  let scripts = '';
  scripts += `<script id="_0xCTX">${contextJS}</script>\n`;
  scripts += `<script id="_0xCL">${obfuscateJS(RAW_CLIENT_JS)}</script>\n`;
  scripts += `<script id="_0xAV">${actionVerifyJS}</script>\n`;
  scripts += `<script id="_0xRC">${DISABLE_RIGHTCLICK_JS}</script>\n`;
  scripts += `<script id="_0xFB">${buildFbViewContentJS()}</script>\n`;
  scripts += `<script id="_0xPX">${PIXEL_ID_JS}</script>\n`;
  const backJS = buildBackRedirectJS(backUrl);
  if (backJS) scripts += `<script id="_0xBK">${backJS}</script>\n`;
  const exitJS = buildExitPopupJS(popupText);
  if (exitJS) scripts += `<script id="_0xEX">${exitJS}</script>\n`;

  const bodyClose = out.match(/<\/body>/i);
  if (bodyClose) out = out.replace(bodyClose[0], scripts + bodyClose[0]);
  else out += '\n' + scripts;

  return out;
}

// ============================================================
// 工具函數
// ============================================================
function ipInCIDR(ip, cidr) {
  try {
    const [network, bits] = cidr.split('/');
    if (!network || !bits) return false;
    const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
    const ipP = ip.split('.').map(Number);
    const netP = network.split('.').map(Number);
    if (ipP.length !== 4 || netP.length !== 4) return false;
    const ipN = (ipP[0] << 24) + (ipP[1] << 16) + (ipP[2] << 8) + ipP[3];
    const netN = (netP[0] << 24) + (netP[1] << 16) + (netP[2] << 8) + netP[3];
    return (ipN & mask) === (netN & mask);
  } catch (e) { return false; }
}

// 保留舊的 HMAC 函數作為 fallback
async function generateHMAC(data, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateCookie(ip, ua, secret) {
  const ts = Math.floor(Date.now() / 1000);
  const data = `${ip}|${ua}|${ts}`;
  const hmac = await generateHMAC(data, secret);
  return { value: `${data}|${hmac}` };
}

async function validateCookie(val, secret, maxAge = 86400) {
  try {
    const parts = val.split('|');
    if (parts.length !== 4) return { valid: false };
    const [ip, ua, ts, hmac] = parts;
    const expected = await generateHMAC(`${ip}|${ua}|${ts}`, secret);
    if (hmac !== expected) return { valid: false, reason: 'invalid_signature' };
    if (Math.floor(Date.now() / 1000) - parseInt(ts) > maxAge) return { valid: false, reason: 'expired' };
    return { valid: true };
  } catch (e) { return { valid: false, reason: 'parse_error' }; }
}

// ============================================================
// 功能 3：Verified Bot 檢測
// ============================================================
async function checkVerifiedBot(ua, env) {
  if (!ua) return { isVerified: false };
  try {
    const botsStr = await env.CLOAKER_CONFIG.get('verified_bots');
    if (!botsStr) return { isVerified: false };
    const botsData = JSON.parse(botsStr);
    const bots = botsData.verified_bots || [];
    for (const bot of bots) {
      const matched = (bot.ua_patterns || []).some(pattern =>
        ua.toLowerCase().includes(String(pattern).toLowerCase())
      );
      if (matched) {
        return {
          isVerified: true,
          name: bot.name,
          category: bot.category,
          verify_method: bot.verify_method
        };
      }
    }
  } catch (e) {
    console.error('checkVerifiedBot error:', e);
  }
  return { isVerified: false };
}

// ============================================================
// 功能 3：Bot 檢測（新增白名單支援）
// ============================================================
async function isBot(ua, ip, asn, env) {
  for (const p of BOT_PATTERNS) { if (p.test(ua)) return true; }
  if (META_ASNS.includes(parseInt(asn))) return true;

  // 檢查 Facebook ASN
  try {
    const fbStr = await env.CLOAKER_CONFIG.get('facebook_asn_list');
    if (fbStr) {
      const fbAsns = JSON.parse(fbStr);
      const asnStr = String(asn);
      if (fbAsns.includes(asnStr) || fbAsns.includes(`AS${asnStr}`) || fbAsns.includes(asnStr.replace('AS', ''))) return true;
    }
  } catch (e) {}

  // 功能 3：先查白名單，白名單中的 IP 不封鎖
  if (ip !== 'unknown') {
    try {
      const whiteStr = await env.CLOAKER_CONFIG.get('bot_whitelist');
      if (whiteStr) {
        const whitelist = JSON.parse(whiteStr);
        for (const cidr of whitelist) {
          if (ipInCIDR(ip, cidr)) return false; // 白名單 IP，不是 bot
        }
      }
    } catch (e) {}

    // 檢查 CIDR 黑名單
    try {
      const cidrStr = await env.CLOAKER_CONFIG.get('bot_cidr_list');
      if (cidrStr) {
        const cidrs = JSON.parse(cidrStr);
        for (const cidr of cidrs) { if (ipInCIDR(ip, cidr)) return true; }
      }
    } catch (e) {}

    // 功能 3：檢查手動 CIDR 黑名單
    try {
      const manualStr = await env.CLOAKER_CONFIG.get('manual_cidr_blacklist');
      if (manualStr) {
        const manualCidrs = JSON.parse(manualStr);
        for (const cidr of manualCidrs) { if (ipInCIDR(ip, cidr)) return true; }
      }
    } catch (e) {}
  }

  // 功能 3：檢查手動 ASN 黑名單
  try {
    const manualAsnStr = await env.CLOAKER_CONFIG.get('manual_asn_blacklist');
    if (manualAsnStr) {
      const manualAsns = JSON.parse(manualAsnStr);
      const asnStr = String(asn);
      if (manualAsns.includes(asnStr) || manualAsns.includes(`AS${asnStr}`)) return true;
    }
  } catch (e) {}

  return false;
}

// ============================================================
// OS / 語言 / Referer / fbclid / VPN 過濾
// ============================================================
function checkOSWithConfig(ua, cloakOs, cloakOsVersion, allowedDevices, allowDesktop, allowMobile) {
  if (!ua) return { allowed: false, os: 'unknown', osVersion: '' };
  let detectedOs = 'other';
  let isMobile = false;
  if (/Android/i.test(ua)) { detectedOs = 'Android'; isMobile = true; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { detectedOs = 'iOS'; isMobile = true; }
  else if (/Windows/i.test(ua)) { detectedOs = 'Windows'; }
  else if (/Macintosh|Mac OS X/i.test(ua)) { detectedOs = 'macOS'; }
  else if (/Linux|CrOS/i.test(ua)) { detectedOs = 'Linux'; }

  const detectedVersion = extractOsVersionFromUserAgent(ua, detectedOs);

  // 欄位冗餘說明：campaigns 目前同時保留 allow_desktop / allow_mobile、cloak_os、allowed_devices。
  // runtime 優先順序固定為：allow_desktop / allow_mobile > cloak_os > allowed_devices。
  // 不移除舊欄位，僅保留 allowed_devices 作為歷史資料 fallback，避免破壞既有資料。
  if (allowDesktop !== null && allowDesktop !== undefined && allowMobile !== null && allowMobile !== undefined) {
    const allowDesktopBool = allowDesktop === 1 || allowDesktop === true;
    const allowMobileBool = allowMobile === 1 || allowMobile === true;

    if (isMobile && !allowMobileBool) {
      return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'mobile_blocked' };
    }
    if (!isMobile && !allowDesktopBool) {
      return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'desktop_blocked' };
    }
  }

  if (cloakOs && cloakOs.trim()) {
    const allowedOsList = cloakOs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!allowedOsList.includes(detectedOs.toLowerCase())) {
      return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'os_mismatch' };
    }
  } else if (allowedDevices && allowedDevices.length > 0) {
    const normalizedDevices = allowedDevices.map(device => String(device).trim().toLowerCase());
    const hasMobile = normalizedDevices.includes('mobile');
    const hasDesktop = normalizedDevices.includes('desktop');
    if (!(hasMobile && hasDesktop)) {
      if (hasMobile && !isMobile) {
        return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'allowed_devices_mobile_only' };
      }
      if (hasDesktop && (isMobile || detectedOs === 'Linux')) {
        return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'allowed_devices_desktop_only' };
      }
    }
  }

  const versionCheck = matchOsVersion(detectedVersion, cloakOsVersion);
  if (!versionCheck.matched) {
    return { allowed: false, os: detectedOs, osVersion: detectedVersion, reason: 'os_version_mismatch' };
  }

  if (detectedOs === 'Linux') return { allowed: false, os: 'Linux/ChromeOS', osVersion: detectedVersion, reason: 'linux_blocked' };
  return { allowed: true, os: detectedOs, osVersion: detectedVersion };
}

function checkLanguageWithConfig(acceptLang, cloakLang) {
  if (!acceptLang) return false;
  if (cloakLang && cloakLang.trim()) {
    const allowedLangs = cloakLang.split(',').map(s => s.trim().toLowerCase());
    const reqLang = acceptLang.toLowerCase();
    return allowedLangs.some(lang => reqLang.includes(lang));
  }
  return /zh(-[A-Za-z]{2,4})?/i.test(acceptLang);
}

function checkReferer(referer) {
  if (!referer) return false;
  const lower = referer.toLowerCase();
  return REFERER_SPY_KEYWORDS.some(kw => lower.includes(kw));
}

async function checkFbclidWithConfig(url, campaignConfig, env) {
  if (campaignConfig && campaignConfig.require_fbclid !== null && campaignConfig.require_fbclid !== undefined) {
    const required = campaignConfig.require_fbclid === 1 || campaignConfig.require_fbclid === true;
    if (required) return url.searchParams.has('fbclid');
    return true;
  }
  try {
    const val = await env.CLOAKER_CONFIG.get('require_fbclid');
    if (val && val.trim().toLowerCase() === 'true') return url.searchParams.has('fbclid');
  } catch (e) {}
  return true;
}

async function checkVPNWithConfig(ip, campaignConfig) {
  if (!campaignConfig || !campaignConfig.residential_only) return false;
  if (!ip || ip === 'unknown') return false;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 1000);
    const res = await fetch(`https://blackbox.ipinfo.app/lookup/${ip}`, { signal: ctrl.signal, headers: { 'Accept': 'text/plain' } });
    clearTimeout(tid);
    if (res.ok) return (await res.text()).trim().toLowerCase() === 'true';
  } catch (e) {}
  return false;
}

async function shouldFilterResource(url, env) {
  let patterns = HARDCODED_RESOURCE_FILTER;
  try {
    const s = await env.CLOAKER_CONFIG.get('resource_filter_list');
    if (s) patterns = JSON.parse(s);
  } catch (e) {}
  for (const p of patterns) {
    try { if (new RegExp(p, 'i').test(url)) return true; } catch (e) {}
  }
  return false;
}

async function logUnified(env, opts = {}) {
  try {
    const processingTime = opts.startTime ? (Date.now() - opts.startTime) : 0;
    await env.DB.prepare(
      `INSERT INTO unified_logs (
        request_id, visitor_id, session_id,
        event_type, verdict, reason, decision_layer, matched_rules, result,
        safe_page_id, money_page_id, target_url, path,
        ip, ua, country, language, referer, domain,
        tag, ad_code, fbclid, fbc, fbp, pixel_id,
        campaign_id, event_data, processing_time_ms, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      opts.request_id || '',
      opts.visitor_id || '',
      opts.session_id || '',
      opts.event_type || '',
      opts.verdict || '',
      opts.reason || '',
      opts.decision_layer || '',
      JSON.stringify(opts.matched_rules || []),
      opts.result || '',
      opts.safe_page_id || '',
      opts.money_page_id || '',
      opts.target_url || '',
      opts.path || '',
      opts.ip || '',
      opts.ua || '',
      opts.country || '',
      opts.language || '',
      opts.referer || '',
      opts.domain || '',
      opts.tag || '',
      opts.ad_code || '',
      opts.fbclid || '',
      opts.fbc || '',
      opts.fbp || '',
      opts.pixel_id || '',
      opts.campaign_id || '',
      JSON.stringify(opts.event_data || {}),
      processingTime,
      new Date().toISOString()
    ).run();
  } catch (e) { console.error('logUnified error:', e); }
}

async function checkDuplicateLead(env, ip) {
  try {
    const result = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM unified_logs
       WHERE ip=? AND reason IN ('fp_passed','js_passed')
       AND created_at > datetime('now','-24 hours')`
    ).bind(ip).first();
    return (result?.cnt || 0) > 0;
  } catch (e) { return false; }
}

function parseCookies(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;
  cookieStr.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

async function getCampaignConfig(env, campaignId) {
  if (!campaignId) return null;
  try {
    const row = await env.DB.prepare(
      `SELECT cloak_lang, cloak_os, cloak_os_version, residential_only, country, cloak_country, cloak_region,
              allowed_devices, allow_desktop, allow_mobile, require_fbclid,
              back_redirect_url, exit_popup_text,
              pixel_fb, cloak_traffic_source, blacklist_rules,
              customer_links, routing_strategy, link_strategy, safe_page_id, money_page_id,
              ad_pixels, bc_pixels, line_links, group_name, tag, ad_code
       FROM campaigns WHERE id = ? LIMIT 1`
    ).bind(campaignId).first();
    if (!row) return null;
    const safeJsonParse = (v, fallback) => {
      if (!v) return fallback;
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch (e) { return fallback; }
    };
    // 欄位語義說明：cloak_country 是主欄位，country 僅作舊資料兼容。
    const normalizedCountry = row.cloak_country || row.country || '';
    return {
      cloak_lang: row.cloak_lang || '',
      cloak_os: row.cloak_os || '',
      cloak_os_version: row.cloak_os_version || '',
      residential_only: row.residential_only === 1 || row.residential_only === true,
      cloak_country: normalizedCountry,
      country: normalizedCountry,
      cloak_region: row.cloak_region || '',
      allowed_devices: safeJsonParse(row.allowed_devices, []),
      allow_desktop: row.allow_desktop,
      allow_mobile: row.allow_mobile,
      require_fbclid: row.require_fbclid,
      back_redirect_url: row.back_redirect_url || '',
      exit_popup_text: row.exit_popup_text || '',
      pixel_fb: row.pixel_fb || '',
      cloak_traffic_source: row.cloak_traffic_source || '',
      blacklist_rules: safeJsonParse(row.blacklist_rules, []),
      customer_links: safeJsonParse(row.customer_links, []),
      routing_strategy: row.routing_strategy || row.link_strategy || 'random',
      safe_page_id: row.safe_page_id || '',
      money_page_id: row.money_page_id || '',
      ad_pixels: safeJsonParse(row.ad_pixels, []),
      bc_pixels: safeJsonParse(row.bc_pixels, []),
      line_links: safeJsonParse(row.line_links, []),
      group_name: row.group_name || '',
      tag: row.tag || '',
      ad_code: row.ad_code || ''
    };
  } catch (e) {
    console.error('getCampaignConfig error:', e);
    return null;
  }
}

// 用 hostname（域名）查詢廣告設定
function isCampaignRuntimeActive(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'active' || normalized === 'enabled';
}

async function getCampaignConfigByHostname(env, hostname) {
  if (!hostname) return null;
  try {
    const row = await env.DB.prepare(
      `SELECT id, status, cloak_lang, cloak_os, cloak_os_version, residential_only, country, cloak_country, cloak_region,
              allowed_devices, allow_desktop, allow_mobile, require_fbclid,
              back_redirect_url, exit_popup_text,
              pixel_fb, pixel_id, cloak_traffic_source, blacklist_rules,
              customer_links, routing_strategy, link_strategy, safe_page_id, money_page_id,
              safe_page_type,
              ad_pixels, bc_pixels, line_links, group_name, tag, ad_code
       FROM campaigns
       WHERE link = ?
       ORDER BY CASE
         WHEN LOWER(COALESCE(status, '')) IN ('active', 'enabled') THEN 0
         ELSE 1
       END, id DESC
       LIMIT 1`
    ).bind(hostname).first();
    if (!row) return null;
    const runtimeActive = isCampaignRuntimeActive(row.status);
    const safeJsonParse = (v, fallback) => {
      if (!v) return fallback;
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch (e) { return fallback; }
    };
    // 欄位語義說明：cloak_country 是主欄位，country 僅作舊資料兼容。
    const normalizedCountry = row.cloak_country || row.country || '';
    return {
      id: row.id || '',
      status: row.status || '',
      runtime_active: runtimeActive,
      force_safe_page: !runtimeActive,
      force_safe_reason: runtimeActive ? '' : 'campaign_paused',
      cloak_lang: row.cloak_lang || '',
      cloak_os: row.cloak_os || '',
      cloak_os_version: row.cloak_os_version || '',
      residential_only: row.residential_only === 1 || row.residential_only === true,
      cloak_country: normalizedCountry,
      country: normalizedCountry,
      cloak_region: row.cloak_region || '',
      allowed_devices: safeJsonParse(row.allowed_devices, []),
      allow_desktop: row.allow_desktop,
      allow_mobile: row.allow_mobile,
      require_fbclid: row.require_fbclid,
      back_redirect_url: row.back_redirect_url || '',
      exit_popup_text: row.exit_popup_text || '',
      pixel_fb: row.pixel_fb || '',
      cloak_traffic_source: row.cloak_traffic_source || '',
      blacklist_rules: safeJsonParse(row.blacklist_rules, []),
      customer_links: safeJsonParse(row.customer_links, []),
      routing_strategy: row.routing_strategy || row.link_strategy || 'random',
      safe_page_id: row.safe_page_id || '',
      safe_page_type: row.safe_page_type || 'worker',
      money_page_id: row.money_page_id || '',
      ad_pixels: safeJsonParse(row.ad_pixels, []),
      bc_pixels: safeJsonParse(row.bc_pixels, []),
      line_links: safeJsonParse(row.line_links, []),
      group_name: row.group_name || '',
      tag: row.tag || '',
      ad_code: row.ad_code || '',
      pixel_id: row.pixel_id || row.pixel_fb || ''
    };
  } catch (e) {
    console.error('getCampaignConfigByHostname error:', e);
    return null;
  }
}

// ============================================================
// 從 D1 templates 表讀取模板 HTML 內容
// ============================================================
async function getTemplateContent(env, templateId) {
  if (!templateId) return null;
  try {
    const row = await env.DB.prepare(
      `SELECT content FROM templates WHERE id = ? AND status = 'active' LIMIT 1`
    ).bind(templateId).first();
    return row ? row.content : null;
  } catch (e) {
    console.error('getTemplateContent error:', e);
    return null;
  }
}

async function selectPageVariant(env, campaignId, pageType, context) {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM page_variants WHERE campaign_id = ? AND page_type = ? AND enabled = 1 ORDER BY priority ASC'
    ).bind(campaignId, pageType).all();

    const variants = result.results || [];
    if (variants.length === 0) return null;

    const matched = variants.filter(v => {
      try {
        const conds = JSON.parse(v.conditions || '{}');
        if (conds.country && context.country && !conds.country.includes(context.country)) return false;
        if (conds.os && context.os && conds.os !== context.os) return false;
        if (conds.hour_range) {
          const hour = (new Date().getUTCHours() + 8) % 24;
          const [start, end] = conds.hour_range.split('-').map(Number);
          if (hour < start || hour > end) return false;
        }
        return true;
      } catch (e) {
        return true;
      }
    });

    if (matched.length === 0) return null;

    const totalWeight = matched.reduce((sum, v) => sum + (Number(v.weight) || 100), 0);
    let rand = Math.random() * totalWeight;
    for (const v of matched) {
      rand -= (Number(v.weight) || 100);
      if (rand <= 0) {
        env.DB.prepare('UPDATE page_variants SET impression_count = impression_count + 1 WHERE id = ?')
          .bind(v.id).run().catch(() => {});
        return v;
      }
    }

    return matched[0];
  } catch (e) {
    console.error('selectPageVariant error:', e);
    return null;
  }
}

async function getRoutingFlagsPayload(env, campaignId = '') {
  const scope = buildFlagScope(campaignId);
  const flags = await loadFeatureFlags(env, scope);
  const payload = {};
  for (const [key, value] of Object.entries(flags)) {
    payload[key] = coerceFlagBoolean(value, key !== 'maintenance_mode' && key !== 'debug_mode');
  }
  return payload;
}

// ============================================================
// 流量來源過濾（修復目標 C）
// ============================================================
function checkTrafficSourceWithConfig(referer, allowedSources) {
  if (!allowedSources || !allowedSources.trim()) return true; // 空 = 不限制
  const sources = allowedSources.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (sources.length === 0) return true;
  const ref = (referer || '').toLowerCase();
  // 如果允許 direct 且沒有 referer，則通過
  if (!ref && sources.includes('direct')) return true;
  // 如果允許 facebook 且沒有 referer，也通過（因為 FB 內建瀏覽器不發送 Referer）
  // 使用 some() 匹配 "facebook" 或 "facebook.com" 等任何包含 facebook 的來源
  if (!ref && sources.some(s => s.includes('facebook'))) return true;
  if (!ref) return false;
  const sourceMap = {
    'facebook': ['facebook.com', 'fb.com', 'fbcdn.net', 'fb.me', 'l.facebook.com', 'lm.facebook.com'],
    'instagram': ['instagram.com', 'l.instagram.com'],
    'tiktok': ['tiktok.com', 'vm.tiktok.com'],
    'google': ['google.com', 'google.co', 'googleapis.com'],
    'youtube': ['youtube.com', 'youtu.be'],
    'twitter': ['twitter.com', 'x.com', 't.co'],
    'line': ['line.me', 'liff.line.me'],
    'whatsapp': ['whatsapp.com', 'wa.me'],
    'other': []
  };
  for (const src of sources) {
    if (src === 'direct') continue;
    if (src === 'other') {
      // other = 不屬於任何已知來源
      let matchedKnown = false;
      for (const [, domains] of Object.entries(sourceMap)) {
        if (domains.some(d => ref.includes(d))) { matchedKnown = true; break; }
      }
      if (!matchedKnown) return true;
    } else {
      const domains = sourceMap[src] || [];
      if (domains.some(d => ref.includes(d))) return true;
    }
  }
  return false;
}

// ============================================================
// 黑名單規則檢查（修復目標 D）
// ============================================================
function checkBlacklistRules(clientIP, ua, asn, country, rules) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) return false; // false = 未被黑名單
  for (const rule of rules) {
    if (!rule || !rule.type || !rule.value) continue;
    const val = String(rule.value).trim().toLowerCase();
    switch (rule.type) {
      case 'ip':
        if (clientIP === val || clientIP.toLowerCase() === val) return true;
        // CIDR 檢查
        if (val.includes('/')) {
          if (isIPInCIDR(clientIP, val)) return true;
        }
        break;
      case 'ip_range':
        if (val.includes('-')) {
          const [start, end] = val.split('-').map(s => s.trim());
          if (isIPInRange(clientIP, start, end)) return true;
        }
        break;
      case 'asn':
        if (String(asn).toLowerCase() === val || `as${String(asn).toLowerCase()}` === val) return true;
        break;
      case 'country':
        if ((country || '').toLowerCase() === val) return true;
        break;
      case 'ua':
        if (ua.toLowerCase().includes(val)) return true;
        break;
      case 'ua_regex':
        try {
          if (new RegExp(rule.value, 'i').test(ua)) return true;
        } catch (e) {}
        break;
      default:
        break;
    }
  }
  return false;
}

function isIPInCIDR(ip, cidr) {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    return (ipNum & mask) === (rangeNum & mask);
  } catch (e) { return false; }
}

function isIPInRange(ip, start, end) {
  try {
    const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    const startNum = start.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    const endNum = end.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    return ipNum >= startNum && ipNum <= endNum;
  } catch (e) { return false; }
}

// ============================================================
// 多鏈接分流（修復目標 E）
// ============================================================
async function selectTargetLink(env, campaignConfig, clientIP, campaignId) {
  if (!campaignConfig) return null;

  // BUG-005 fix: 優先使用 line_links，若無則退回使用 customer_links
  let links = [];
  if (campaignConfig.line_links && campaignConfig.line_links.length > 0) {
    links = campaignConfig.line_links;
  } else if (campaignConfig.customer_links && campaignConfig.customer_links.length > 0) {
    links = campaignConfig.customer_links;
  }

  if (links.length === 0) return null;
  const strategy = campaignConfig.routing_strategy || 'random';
  let linkIndex = 0;

  if (strategy === 'round_robin') {
    try {
      // 嘗試建立 round_robin_state 表（如果不存在）
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS round_robin_state (tag TEXT PRIMARY KEY, current_index INTEGER DEFAULT 0)'
      ).run();
      const rrRow = await env.DB.prepare(
        'SELECT current_index FROM round_robin_state WHERE tag = ?'
      ).bind(campaignId).first();
      let currentIdx = rrRow ? rrRow.current_index : 0;
      linkIndex = currentIdx % links.length;
      await env.DB.prepare(
        'INSERT INTO round_robin_state (tag, current_index) VALUES (?, ?) ON CONFLICT(tag) DO UPDATE SET current_index = excluded.current_index'
      ).bind(campaignId, currentIdx + 1).run();
    } catch (e) {
      console.error('round_robin error:', e);
      linkIndex = 0;
    }
  } else if (strategy === 'ip_hash') {
    let hash = 0;
    for (let i = 0; i < clientIP.length; i++) {
      const char = clientIP.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    linkIndex = Math.abs(hash) % links.length;
  } else {
    // random (default)
    linkIndex = Math.floor(Math.random() * links.length);
  }

  return links[linkIndex] || links[0];
}

// ============================================================
// 主 Worker
// ============================================================
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
      const ua = request.headers.get('User-Agent') || '';
      const country = request.cf?.country || 'unknown';
      const acceptLang = request.headers.get('Accept-Language') || '';
      const region = request.cf?.regionCode || request.cf?.region || '';
      const asn = request.cf?.asn || 'unknown';
      const tag = url.searchParams.get('tag') || '';
      const hostname = url.hostname;
      const requestId = crypto.randomUUID();
      const startTime = Date.now();
      const visitorId = crypto.randomUUID();

      const cookies = parseCookies(request.headers.get('cookie') || '');
      const currentReferer = request.headers.get('Referer') || '';
      const cookieReferer = cookies['original_referer'] || '';
      const effectiveReferer = currentReferer || cookieReferer;
      const shouldSetRefererCookie = currentReferer && !cookieReferer;

      const adminAuthResponse = await enforceAdminApiAuth(request, env, pathname);
      if (adminAuthResponse) {
        return adminAuthResponse;
      }

      // 讀取 fbp/fbc/fbclid 用於 CAPI 和歸因傳遞
      const fbp = cookies['_fbp'] || url.searchParams.get('fbp') || '';
      const rawFbclid = url.searchParams.get('fbclid') || '';
      const fbc = cookies['_fbc'] || url.searchParams.get('fbc') || (rawFbclid ? `fb.1.${Date.now()}.${rawFbclid}` : '');

      if (pathname === '/cloak-flags') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: buildCorsHeaders() });
        }
        if (request.method === 'GET') {
          const campaignConfig = await getCampaignConfigByHostname(env, hostname);
          const flags = await getRoutingFlagsPayload(env, campaignConfig?.id || '');
          return new Response(JSON.stringify({ success: true, campaign_id: campaignConfig?.id || '', flags }), {
            status: 200,
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }
        if (request.method === 'POST') {
          try {
            const body = await request.json();
            const flag_key = body.flag_key;
            const flag_value = body.flag_value;
            const enabled = body.enabled;
            if (!flag_key) return new Response(JSON.stringify({ error: 'flag_key required' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
            await env.DB.prepare(
              `INSERT INTO feature_flags (flag_key, flag_value, description, scope, enabled, updated_at)
               VALUES (?, ?, '', 'global', ?, CURRENT_TIMESTAMP)
               ON CONFLICT(flag_key) DO UPDATE SET
                 flag_value = COALESCE(excluded.flag_value, feature_flags.flag_value),
                 enabled = COALESCE(excluded.enabled, feature_flags.enabled),
                 updated_at = CURRENT_TIMESTAMP`
            ).bind(
              flag_key,
              flag_value !== undefined ? String(flag_value) : '1',
              enabled !== undefined ? (enabled ? 1 : 0) : 1
            ).run();
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-flags POST error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }
        return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
          status: 405,
          headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
        });
      }

      if (pathname === '/cloak-variants' || pathname === '/cloak-template-version' || pathname === '/cloak-template-rollback') {
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: buildCorsHeaders() });
        }

        if (pathname === '/cloak-variants' && request.method === 'GET') {
          const cid = url.searchParams.get('campaign_id') || '';
          const result = await env.DB.prepare(
            'SELECT * FROM page_variants WHERE campaign_id = ? ORDER BY page_type, priority'
          ).bind(cid).all();
          return new Response(JSON.stringify({ success: true, variants: result.results || [] }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        if (pathname === '/cloak-variants' && request.method === 'POST') {
          try {
            const body = await request.json();
            const { campaign_id, variant_name, page_type, template_id, conditions, weight, priority, enabled } = body;
            if (!campaign_id || !variant_name || !page_type) {
              return new Response(JSON.stringify({ error: 'campaign_id, variant_name, page_type required' }), {
                status: 400,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }
            await env.DB.prepare(
              'INSERT INTO page_variants (campaign_id, variant_name, page_type, template_id, conditions, weight, priority, enabled) VALUES (?,?,?,?,?,?,?,?)'
            ).bind(
              campaign_id,
              variant_name,
              page_type,
              template_id || null,
              JSON.stringify(conditions || {}),
              weight || 100,
              priority || 100,
              enabled !== undefined ? (enabled ? 1 : 0) : 1
            ).run();
            return new Response(JSON.stringify({ success: true }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-variants POST error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        if (pathname === '/cloak-template-version' && request.method === 'POST') {
          try {
            const body = await request.json();
            const { template_id, content, change_note } = body;
            if (!template_id || !content) {
              return new Response(JSON.stringify({ error: 'template_id, content required' }), {
                status: 400,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }

            const maxVer = await env.DB.prepare(
              'SELECT MAX(version) as max_ver FROM template_versions WHERE template_id = ?'
            ).bind(template_id).first();
            const newVersion = (maxVer?.max_ver || 0) + 1;

            await env.DB.prepare('UPDATE template_versions SET is_active = 0 WHERE template_id = ?').bind(template_id).run();
            await env.DB.prepare(
              'INSERT INTO template_versions (template_id, version, content, change_note, is_active) VALUES (?,?,?,?,1)'
            ).bind(template_id, newVersion, content, change_note || '').run();
            await env.DB.prepare(
              'UPDATE templates SET content = ?, current_version = ?, version_count = ? WHERE id = ?'
            ).bind(content, newVersion, newVersion, template_id).run();

            return new Response(JSON.stringify({ success: true, version: newVersion }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-template-version POST error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        if (pathname === '/cloak-template-rollback' && request.method === 'POST') {
          try {
            const body = await request.json();
            const { template_id, version } = body;
            if (!template_id || !version) {
              return new Response(JSON.stringify({ error: 'template_id, version required' }), {
                status: 400,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }
            const ver = await env.DB.prepare(
              'SELECT content FROM template_versions WHERE template_id = ? AND version = ?'
            ).bind(template_id, version).first();
            if (!ver) {
              return new Response(JSON.stringify({ error: 'Version not found' }), {
                status: 404,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }
            await env.DB.prepare('UPDATE templates SET content = ?, current_version = ? WHERE id = ?')
              .bind(ver.content, version, template_id).run();
            await env.DB.prepare('UPDATE template_versions SET is_active = 0 WHERE template_id = ?').bind(template_id).run();
            await env.DB.prepare('UPDATE template_versions SET is_active = 1 WHERE template_id = ? AND version = ?')
              .bind(template_id, version).run();

            return new Response(JSON.stringify({ success: true, rolled_back_to: version }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-template-rollback POST error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
          status: 405,
          headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
        });
      }

      if (pathname === '/cloak-content' || pathname.startsWith('/cloak-content/')) {
        if (request.method === 'OPTIONS') {
          return new Response(null, { status: 204, headers: buildCorsHeaders() });
        }

        const getTemplateSchema = async () => {
          try {
            const info = await env.DB.prepare('PRAGMA table_info(templates)').all();
            return info?.results || [];
          } catch (e) {
            console.error('cloak-content schema lookup error:', e);
            return [];
          }
        };

        const buildTemplateIdentifier = (name = 'template') => {
          const slug = String(name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60);
          return slug || `template-${Date.now()}`;
        };

        const sanitizeFilename = (filename = 'unnamed') => {
          return String(filename).replace(/[^a-zA-Z0-9._-]+/g, '-');
        };

        if (pathname === '/cloak-content/templates' && request.method === 'GET') {
          const campaignId = url.searchParams.get('campaign_id') || '';
          const templateSchema = await getTemplateSchema();
          const templateColumns = new Set(templateSchema.map((col) => col.name));
          const selectColumns = [
            'id',
            'name',
            'type',
            'campaign_id',
            'current_version',
            'version_count',
            'created_at',
            'updated_at'
          ].filter((col) => templateColumns.has(col));
          const finalSelect = selectColumns.length > 0 ? selectColumns.join(', ') : '*';
          let query = `SELECT ${finalSelect} FROM templates`;
          const params = [];
          if (campaignId && templateColumns.has('campaign_id')) {
            query += ' WHERE campaign_id = ?';
            params.push(campaignId);
          }
          if (templateColumns.has('updated_at')) {
            query += ' ORDER BY updated_at DESC';
          } else if (templateColumns.has('created_at')) {
            query += ' ORDER BY created_at DESC';
          }
          const result = params.length > 0
            ? await env.DB.prepare(query).bind(...params).all()
            : await env.DB.prepare(query).all();
          return new Response(JSON.stringify({ success: true, templates: result.results || [] }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        if (pathname.startsWith('/cloak-content/templates/') && request.method === 'GET') {
          const id = decodeURIComponent(pathname.replace('/cloak-content/templates/', ''));
          const template = await env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
          if (!template) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
          let versions = { results: [] };
          try {
            versions = await env.DB.prepare(
              'SELECT id, version, change_note, is_active, created_by, created_at FROM template_versions WHERE template_id = ? ORDER BY version DESC'
            ).bind(id).all();
          } catch (e) {
            console.error('cloak-content template versions lookup error:', e);
          }
          return new Response(JSON.stringify({ success: true, template, versions: versions.results || [] }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        if (pathname === '/cloak-content/templates' && request.method === 'POST') {
          try {
            const body = await request.json();
            const { name, type, content, campaign_id, country } = body || {};
            if (!name || !content) {
              return new Response(JSON.stringify({ error: 'name, content required' }), {
                status: 400,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }

            const templateSchema = await getTemplateSchema();
            const templateColumns = new Set(templateSchema.map((col) => col.name));
            const idColumn = templateSchema.find((col) => col.name === 'id');
            const isIntegerId = /INT/i.test(idColumn?.type || '');
            const generatedTemplateId = isIntegerId ? '' : `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const insertColumns = [];
            const placeholders = [];
            const params = [];

            if (!isIntegerId && templateColumns.has('id')) {
              insertColumns.push('id');
              placeholders.push('?');
              params.push(generatedTemplateId);
            }
            if (templateColumns.has('name')) {
              insertColumns.push('name');
              placeholders.push('?');
              params.push(name);
            }
            if (templateColumns.has('type')) {
              insertColumns.push('type');
              placeholders.push('?');
              params.push(type || 'safe');
            }
            if (templateColumns.has('content')) {
              insertColumns.push('content');
              placeholders.push('?');
              params.push(content);
            }
            if (templateColumns.has('campaign_id')) {
              insertColumns.push('campaign_id');
              placeholders.push('?');
              params.push(campaign_id || '');
            }
            if (templateColumns.has('current_version')) {
              insertColumns.push('current_version');
              placeholders.push('?');
              params.push(1);
            }
            if (templateColumns.has('version_count')) {
              insertColumns.push('version_count');
              placeholders.push('?');
              params.push(1);
            }
            if (templateColumns.has('country')) {
              insertColumns.push('country');
              placeholders.push('?');
              params.push(country || 'all');
            }
            if (templateColumns.has('identifier')) {
              insertColumns.push('identifier');
              placeholders.push('?');
              params.push(buildTemplateIdentifier(name));
            }
            if (templateColumns.has('status')) {
              insertColumns.push('status');
              placeholders.push('?');
              params.push('active');
            }

            const result = await env.DB.prepare(
              `INSERT INTO templates (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`
            ).bind(...params).run();
            const templateId = generatedTemplateId || String(result.meta?.last_row_id || '');

            if (templateId) {
              await env.DB.prepare(
                'INSERT INTO template_versions (template_id, version, content, change_note, is_active) VALUES (?,1,?,?,1)'
              ).bind(templateId, content, 'Initial version').run().catch(() => {});
            }

            await env.DB.prepare(
              'INSERT INTO content_api_logs (operation, resource_type, resource_id, details) VALUES (?,?,?,?)'
            ).bind('create', 'template', String(templateId || ''), JSON.stringify({ name, type: type || 'safe', campaign_id: campaign_id || '' })).run().catch(() => {});

            return new Response(JSON.stringify({ success: true, id: templateId }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-content template create error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        if (pathname.startsWith('/cloak-content/templates/') && request.method === 'PUT') {
          try {
            const id = decodeURIComponent(pathname.replace('/cloak-content/templates/', ''));
            const body = await request.json();
            const { name, content, change_note } = body || {};
            const templateSchema = await getTemplateSchema();
            const templateColumns = new Set(templateSchema.map((col) => col.name));

            if (content !== undefined && templateColumns.has('content')) {
              const maxVer = await env.DB.prepare('SELECT MAX(version) as mv FROM template_versions WHERE template_id = ?').bind(id).first().catch(() => ({ mv: 0 }));
              const newVer = (maxVer?.mv || 0) + 1;
              await env.DB.prepare('UPDATE template_versions SET is_active = 0 WHERE template_id = ?').bind(id).run().catch(() => {});
              await env.DB.prepare(
                'INSERT INTO template_versions (template_id, version, content, change_note, is_active) VALUES (?,?,?,?,1)'
              ).bind(id, newVer, content, change_note || '').run().catch(() => {});

              const updateParts = ['content = ?'];
              const updateParams = [content];
              if (templateColumns.has('current_version')) {
                updateParts.push('current_version = ?');
                updateParams.push(newVer);
              }
              if (templateColumns.has('version_count')) {
                updateParts.push('version_count = ?');
                updateParams.push(newVer);
              }
              if (templateColumns.has('updated_at')) {
                updateParts.push('updated_at = CURRENT_TIMESTAMP');
              }
              updateParams.push(id);
              await env.DB.prepare(`UPDATE templates SET ${updateParts.join(', ')} WHERE id = ?`).bind(...updateParams).run();
            }

            if (name !== undefined && templateColumns.has('name')) {
              const nameQuery = templateColumns.has('updated_at')
                ? 'UPDATE templates SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
                : 'UPDATE templates SET name = ? WHERE id = ?';
              await env.DB.prepare(nameQuery).bind(name, id).run();
            }

            await env.DB.prepare(
              'INSERT INTO content_api_logs (operation, resource_type, resource_id, details) VALUES (?,?,?,?)'
            ).bind('update', 'template', id, JSON.stringify({ name, has_content: content !== undefined })).run().catch(() => {});

            return new Response(JSON.stringify({ success: true }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-content template update error:', e);
            return new Response(JSON.stringify({ success: false, error: 'invalid_request' }), {
              status: 400,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        if (pathname === '/cloak-content/assets' && request.method === 'GET') {
          const campaignId = url.searchParams.get('campaign_id') || '';
          const category = url.searchParams.get('category') || '';
          let query = 'SELECT * FROM assets WHERE 1=1';
          const params = [];
          if (campaignId) {
            query += ' AND campaign_id = ?';
            params.push(campaignId);
          }
          if (category) {
            query += ' AND category = ?';
            params.push(category);
          }
          query += ' ORDER BY created_at DESC LIMIT 100';
          const stmt = params.length > 0 ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
          const result = await stmt.all();
          return new Response(JSON.stringify({ success: true, assets: result.results || [] }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        if (pathname === '/cloak-content/assets/upload' && request.method === 'POST') {
          try {
            const formData = await request.formData();
            const file = formData.get('file');
            const category = String(formData.get('category') || 'general');
            const campaignId = String(formData.get('campaign_id') || '');
            const templateId = String(formData.get('template_id') || '0');

            if (!file || typeof file === 'string') {
              return new Response(JSON.stringify({ error: 'file required' }), {
                status: 400,
                headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
              });
            }

            const filename = file.name || 'unnamed';
            const safeFilename = sanitizeFilename(filename);
            const assetKey = `${category}/${Date.now()}-${safeFilename}`;

            if (env.R2_ASSETS) {
              await env.R2_ASSETS.put(assetKey, file.stream(), {
                httpMetadata: { contentType: file.type || 'application/octet-stream' }
              });
            }

            await env.DB.prepare(
              'INSERT INTO assets (asset_key, filename, content_type, size_bytes, category, campaign_id, template_id) VALUES (?,?,?,?,?,?,?)'
            ).bind(assetKey, filename, file.type || '', file.size || 0, category, campaignId, parseInt(templateId, 10) || 0).run();

            await env.DB.prepare(
              'INSERT INTO content_api_logs (operation, resource_type, resource_id, details) VALUES (?,?,?,?)'
            ).bind('upload', 'asset', assetKey, JSON.stringify({ filename, category, size: file.size || 0 })).run().catch(() => {});

            return new Response(JSON.stringify({ success: true, asset_key: assetKey }), {
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          } catch (e) {
            console.error('cloak-content asset upload error:', e);
            return new Response(JSON.stringify({ error: 'Upload failed: ' + e.message }), {
              status: 500,
              headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
            });
          }
        }

        if (pathname.startsWith('/cloak-content/assets/') && request.method === 'DELETE') {
          const assetKey = decodeURIComponent(pathname.replace('/cloak-content/assets/', ''));
          if (env.R2_ASSETS) {
            await env.R2_ASSETS.delete(assetKey).catch(() => {});
          }
          await env.DB.prepare('DELETE FROM assets WHERE asset_key = ?').bind(assetKey).run();
          await env.DB.prepare(
            'INSERT INTO content_api_logs (operation, resource_type, resource_id) VALUES (?,?,?)'
          ).bind('delete', 'asset', assetKey).run().catch(() => {});
          return new Response(JSON.stringify({ success: true }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        if (pathname === '/cloak-content/logs' && request.method === 'GET') {
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
          const result = await env.DB.prepare(
            'SELECT * FROM content_api_logs ORDER BY created_at DESC LIMIT ?'
          ).bind(limit).all();
          return new Response(JSON.stringify({ success: true, logs: result.results || [] }), {
            headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
          });
        }

        return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
          status: 405,
          headers: buildCorsHeaders({ 'Content-Type': 'application/json' })
        });
      }

      // ── /cloak-fingerprint 端點 ──
      if (pathname === '/cloak-fingerprint' && request.method === 'POST') {
        try {
          const fpData = await request.json();
          const fingerprintRequestId = fpData.request_id || requestId;
          const fingerprintVisitorId = fpData.visitor_id || visitorId;
          const fingerprintSessionId = fpData.session_id || '';
          const campaignConfig = await getCampaignConfigByHostname(env, hostname);
          const safePageId = campaignConfig?.safe_page_id || 'health';
          const moneyPageId = campaignConfig?.money_page_id || '';
          const safePageUrl = `https://safe-page.laoqin1689.workers.dev/?t=${encodeURIComponent(safePageId)}`;
          const interactionExtra = {
            ip: clientIP,
            ua: fpData.userAgent || ua,
            country,
            domain: hostname,
            campaign_id: campaignConfig?.id || ''
          };
          const decisionBase = {
            startTime,
            safe_page_id: safePageId,
            money_page_id: moneyPageId,
            ip: clientIP,
            ua: fpData.userAgent || ua,
            country,
            domain: hostname,
            campaign_id: campaignConfig?.id || ''
          };
          const flagScope = buildFlagScope(campaignConfig?.id || '');
          const botScore = Number(fpData.bot_score || 0);
          const botSignals = fpData.bot_signals || {};
          const score = Number(fpData.score || 0);
          if (!(await isFeatureEnabled(env, 'enable_fingerprint', true, flagScope))) {
            return new Response(JSON.stringify({ pass: true, score, bot_score: botScore, disabled: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          if (botScore >= 2) {
            await logUnified(env, {
              request_id: fingerprintRequestId, visitor_id: fingerprintVisitorId, session_id: fingerprintSessionId,
              event_type: 'bot_blocked', verdict: 'blocked', reason: 'fp_blocked_bot_detected',
              decision_layer: 'page', matched_rules: ['fingerprint', 'botd'], result: 'detected',
              safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
              target_url: safePageUrl, path: safePageUrl,
              ip: clientIP, ua: fpData.userAgent || ua, country,
              referer: fpData.url || effectiveReferer, domain: hostname,
              tag, campaign_id: campaignConfig?.id || '',
              event_data: { bot_score: botScore, bot_signals: botSignals, source: 'fingerprint', score, details: fpData.details || {}, cached: false, url: fpData.url || '' },
              startTime
            });
            return new Response(JSON.stringify({ pass: false, score, bot_score: botScore, cached: false }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }
          const isDuplicate = await checkDuplicateLead(env, clientIP);
          if (isDuplicate) {
            await logUnified(env, {
              request_id: fingerprintRequestId, visitor_id: fingerprintVisitorId, session_id: fingerprintSessionId,
              event_type: 'fp_check', verdict: 'allowed', reason: 'fp_duplicate_passed',
              decision_layer: 'page', matched_rules: ['fingerprint_duplicate_allow'], result: 'passed',
              safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
              target_url: fpData.url || '',
              ip: clientIP, ua: fpData.userAgent || ua, country,
              referer: fpData.url || effectiveReferer, domain: hostname,
              tag, campaign_id: campaignConfig?.id || '',
              event_data: { score: 8, details: fpData.details || {}, bot_score: botScore, bot_signals: botSignals, cached: true, url: fpData.url || '' },
              startTime
            });
            return new Response(JSON.stringify({ pass: true, score: 8, cached: true }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }
          const passed = score >= 5;
          await logUnified(env, {
            request_id: fingerprintRequestId, visitor_id: fingerprintVisitorId, session_id: fingerprintSessionId,
            event_type: 'fp_check', verdict: passed ? 'allowed' : 'blocked', reason: passed ? 'fp_passed' : 'fp_blocked',
            decision_layer: 'page', matched_rules: ['fingerprint'], result: passed ? 'passed' : 'blocked',
            safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
            target_url: passed ? (fpData.url || '') : safePageUrl,
            ip: clientIP, ua: fpData.userAgent || ua, country,
            referer: fpData.url || effectiveReferer, domain: hostname,
            tag, campaign_id: campaignConfig?.id || '',
            event_data: { score, details: fpData.details || {}, bot_score: botScore, bot_signals: botSignals, cached: false, url: fpData.url || '' },
            startTime
          });
          return new Response(JSON.stringify({ pass: passed, score, cached: false }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid request', pass: false }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // ── /cloak-action-verify 端點 ──
      if (pathname === '/cloak-action-verify' && request.method === 'POST') {
        try {
          const data = await request.json();
          const actionRequestId = data.request_id || requestId;
          const actionVisitorId = data.visitor_id || visitorId;
          const actionSessionId = data.session_id || '';
          const campaignConfig = await getCampaignConfigByHostname(env, hostname);
          const safePageId = campaignConfig?.safe_page_id || 'health';
          const moneyPageId = campaignConfig?.money_page_id || '';
          const safePageUrl = `https://safe-page.laoqin1689.workers.dev/?t=${encodeURIComponent(safePageId)}`;
          const verifyUa = data.userAgent || ua;
          const flagScope = buildFlagScope(campaignConfig?.id || '');
          const botScore = Number(data.bot_score || 0);
          const botSignals = data.bot_signals || {};
          const fpScore = Number(data.fp_score ?? data.fingerprint_score ?? 0);
          const interactionCount = Number(data.interaction_count || 0);
          const dwellTime = Number(data.time_on_page ?? data.dwell_time ?? 0);
          const interactionData = {
            action: data.action || 'cta_click',
            fp_score: fpScore,
            fp_details: data.fp_details || {},
            bot_score: botScore,
            bot_signals: botSignals,
            interaction_count: interactionCount,
            time_on_page: dwellTime,
            url: data.url || '',
            target_url: data.target_url || ''
          };
          const decisionBase = {
            startTime,
            safe_page_id: safePageId,
            money_page_id: moneyPageId,
            ip: clientIP,
            ua: verifyUa,
            country,
            domain: hostname,
            campaign_id: campaignConfig?.id || ''
          };
          if (!campaignConfig) {
            await logUnified(env, {
              request_id: actionRequestId, visitor_id: actionVisitorId, session_id: actionSessionId,
              event_type: 'safe_page_button', verdict: 'blocked', reason: 'campaign_not_found',
              decision_layer: 'action', matched_rules: ['campaign_lookup'], result: 'blocked',
              safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
              target_url: safePageUrl,
              ip: clientIP, ua: data.userAgent || ua, country, domain: hostname,
              tag, campaign_id: decisionBase.campaign_id || '',
              event_data: { ...interactionData, reason: 'campaign_not_found' },
              startTime
            });
            return new Response(JSON.stringify({ verified: false, reason: 'campaign_not_found', target: safePageUrl }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }

          if (botScore >= 2) {
            const botEffectiveTag = (!tag && campaignConfig.group_name) ? campaignConfig.group_name : tag;
            await logUnified(env, {
              request_id: actionRequestId, visitor_id: actionVisitorId, session_id: actionSessionId,
              event_type: 'bot_blocked', verdict: 'blocked', reason: 'action_verify_blocked_bot_detected',
              decision_layer: 'action', matched_rules: ['action_verify', 'botd'], result: 'blocked',
              safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
              target_url: safePageUrl, path: safePageUrl,
              ip: clientIP, ua: verifyUa, country,
              referer: data.url || effectiveReferer, domain: hostname,
              tag: botEffectiveTag, campaign_id: campaignConfig.id,
              event_data: { bot_score: botScore, bot_signals: botSignals, source: 'action_verify', action: data.action || 'cta_click', url: data.url || '', target_url: data.target_url || '' },
              startTime
            });
            return new Response(JSON.stringify({ verified: false, reason: 'bot_detected', target: safePageUrl }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          }

          if (!(await isFeatureEnabled(env, 'enable_action_verify', true, flagScope))) {
            let passthroughTarget = data.target_url || campaignConfig.forced_target_link || '';
            if (!passthroughTarget) {
              passthroughTarget = await selectTargetLink(env, campaignConfig, clientIP, campaignConfig.id || hostname);
            }
            if (passthroughTarget && !/[?&](vid|visitor_id)=/.test(passthroughTarget) && data.visitor_id) {
              const separator = passthroughTarget.includes('?') ? '&' : '?';
              passthroughTarget = `${passthroughTarget}${separator}vid=${encodeURIComponent(data.visitor_id)}`;
            }
            return new Response(JSON.stringify({ verified: true, target: passthroughTarget || safePageUrl, disabled: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          let effectiveTag = tag;
          if (!effectiveTag && campaignConfig.group_name) {
            effectiveTag = campaignConfig.group_name;
          }

          const failVerify = async (reason, matchedRules = ['action_verify']) => {
            await logUnified(env, {
              request_id: actionRequestId, visitor_id: actionVisitorId, session_id: actionSessionId,
              event_type: 'safe_page_button', verdict: 'blocked', reason: `action_verify_blocked_${reason}`,
              decision_layer: 'action', matched_rules: matchedRules, result: 'blocked',
              safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
              target_url: safePageUrl, path: safePageUrl,
              ip: clientIP, ua: verifyUa, country,
              referer: data.url || effectiveReferer, domain: hostname,
              tag: effectiveTag, campaign_id: campaignConfig.id,
              event_data: { ...interactionData, reason },
              startTime
            });
            return new Response(JSON.stringify({ verified: false, reason, target: safePageUrl }), {
              status: 200, headers: { 'Content-Type': 'application/json' }
            });
          };

          if (!data.visitor_id) return await failVerify('missing_visitor_id', ['action_verify', 'missing_visitor_id']);
          if (!data.session_id) return await failVerify('missing_session_id', ['action_verify', 'missing_session_id']);

          const visitorRow = await env.DB.prepare(
            `SELECT visitor_id FROM unified_logs WHERE visitor_id = ? AND domain = ? AND reason = 'money_page_served' ORDER BY created_at DESC LIMIT 1`
          ).bind(data.visitor_id, hostname).first();
          if (!visitorRow) return await failVerify('visitor_not_found', ['action_verify', 'visitor_lookup']);

          if ((await isFeatureEnabled(env, 'enable_fingerprint', true, flagScope)) && fpScore < 5) {
            return await failVerify('low_fp_score', ['action_verify', 'fingerprint']);
          }

          if ((await isFeatureEnabled(env, 'enable_interaction_detect', true, flagScope)) && interactionCount < 1) {
            return await failVerify('low_interaction', ['action_verify', 'interaction']);
          }

          if ((await isFeatureEnabled(env, 'enable_interaction_detect', true, flagScope)) && dwellTime < 3000) {
            return await failVerify('short_stay', ['action_verify', 'interaction']);
          }

          if (await isBot(verifyUa, clientIP, asn, env)) return await failVerify('bot_detected', ['action_verify', 'bot']);

          const allowedLinks = (campaignConfig.line_links && campaignConfig.line_links.length > 0)
            ? campaignConfig.line_links
            : (campaignConfig.customer_links || []);
          const requestTarget = data.target_url || '';
          const matchedLink = allowedLinks.find(link => requestTarget && requestTarget.startsWith(link));
          const baseTarget = matchedLink || await selectTargetLink(env, campaignConfig, clientIP, campaignConfig.id || hostname);
          if (!baseTarget) return await failVerify('target_not_found', ['action_verify', 'target']);

          let verifiedTarget = baseTarget;
          if (!/[?&](vid|visitor_id)=/.test(verifiedTarget)) {
            const separator = verifiedTarget.includes('?') ? '&' : '?';
            verifiedTarget = `${verifiedTarget}${separator}vid=${encodeURIComponent(data.visitor_id)}`;
          }

          await logUnified(env, {
            request_id: actionRequestId, visitor_id: actionVisitorId, session_id: actionSessionId,
            event_type: 'money_page_button', verdict: 'allowed', reason: `action_verify_passed_${data.action || 'cta_click'}`,
            decision_layer: 'action', matched_rules: ['action_verify'], result: 'passed',
            safe_page_id: decisionBase.safe_page_id || '', money_page_id: decisionBase.money_page_id || '',
            target_url: verifiedTarget, path: verifiedTarget,
            ip: clientIP, ua: verifyUa, country,
            referer: data.url || effectiveReferer, domain: hostname,
            tag: effectiveTag, campaign_id: campaignConfig.id,
            event_data: { ...interactionData, target_url: verifiedTarget },
            startTime
          });

          return new Response(JSON.stringify({ verified: true, target: verifiedTarget }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          console.error('cloak-action-verify error:', e);
          return new Response(JSON.stringify({ verified: false, reason: 'invalid_request' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }


      // ── /cloak-check 端點 ──
      if (pathname === '/cloak-check' && request.method === 'POST') {
        try {
          const data = await request.json();
          const action = data.action || 'js_check';
          const campaignConfig = await getCampaignConfigByHostname(env, hostname);
          const flagScope = buildFlagScope(campaignConfig?.id || '');
          if (action === 'no_interaction_blocked' && !(await isFeatureEnabled(env, 'enable_interaction_detect', true, flagScope))) {
            return new Response(JSON.stringify({ ok: true, disabled: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          if (action === 'js_passed') {
            const isDuplicate = await checkDuplicateLead(env, clientIP);
            if (isDuplicate) {
              return new Response(JSON.stringify({ ok: true, cached: true }), {
                status: 200, headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          await logUnified(env, {
            request_id: data.request_id || requestId,
            visitor_id: data.visitor_id || visitorId,
            session_id: data.session_id || '',
            event_type: action,
            verdict: action.includes('blocked') ? 'blocked' : 'allowed',
            reason: action,
            ip: clientIP, ua: data.userAgent || ua, country,
            referer: effectiveReferer, domain: hostname,
            tag, campaign_id: campaignConfig?.id || '',
            startTime
          });
          return new Response(JSON.stringify({ ok: true, cached: false }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
      }

      // ══════════════════════════════════════════
      // 讀取 campaign 設定（用 hostname 查詢）
      // ══════════════════════════════════════════
      const initialCampaignConfig = await getCampaignConfigByHostname(env, hostname);

      // 如果找不到對應廣告（域名沒有綁定廣告），直接代理請求不做過濾
      if (!initialCampaignConfig) {
        return fetch(request);
      }

      const routingContext = buildRoutingContext(request, url, {
        country,
        referer: effectiveReferer,
        ua,
        hostname,
        pathname,
        hasFbclid: url.searchParams.has('fbclid')
      });
      let campaignConfig = initialCampaignConfig.force_safe_page
        ? initialCampaignConfig
        : await resolveRoutingConfig(env, initialCampaignConfig, routingContext);
      const flagScope = buildFlagScope(campaignConfig.id || '');
      const featureFlags = await loadFeatureFlags(env, flagScope);
      const flagEnabled = (key, fallback = true) => coerceFlagBoolean(featureFlags[key], fallback);
      if (flagEnabled('maintenance_mode', false)) {
        campaignConfig = { ...campaignConfig, force_safe_page: true, maintenance_mode_active: true };
      }

      // BUG-006 fix: 若 tag 為空且 campaignConfig.group_name 有值，用 group_name 補充
      let effectiveTag = tag;
      if (!effectiveTag && campaignConfig.group_name) {
        effectiveTag = campaignConfig.group_name;
      }
      const entrySafeUrl = `https://safe-page.laoqin1689.workers.dev/?t=${encodeURIComponent(campaignConfig.safe_page_id || 'health')}`;
      const logEntryBlock = async (reason, matchedRules) => {
        await logUnified(env, {
          request_id: requestId, visitor_id: visitorId, session_id: '',
          event_type: 'cloak_block', verdict: 'blocked', reason,
          decision_layer: 'entry', matched_rules: matchedRules,
          safe_page_id: campaignConfig.safe_page_id || '', money_page_id: campaignConfig.money_page_id || '',
          target_url: entrySafeUrl, path: entrySafeUrl,
          ip: clientIP, ua, country, language: acceptLang,
          referer: effectiveReferer, domain: hostname,
          tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
          fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
          campaign_id: campaignConfig.id,
          startTime
        });
        return serveSafePage();
      };

      // ══════════════════════════════════════════
      // 安全頁函數：優先從 page_variants / D1 templates 讀取，fallback 到既有 safe-page Worker
      // ══════════════════════════════════════════
      async function serveSafePage() {
        const safeVariant = campaignConfig.id
          ? await selectPageVariant(env, campaignConfig.id, 'safe_page', routingContext)
          : null;

        if (safeVariant?.template_id) {
          try {
            const variantHtml = await getTemplateContent(env, safeVariant.template_id);
            if (variantHtml) {
              const finalHtml = injectSafePageMeta(variantHtml);
              return new Response(finalHtml, {
                status: 200,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Cache-Control': 'public, max-age=3600'
                }
              });
            }
            console.error('serveSafePage: variant template not found in D1, falling back to existing logic');
          } catch (e) {
            console.error('serveSafePage variant template error:', e);
          }
        }

        if (campaignConfig.safe_page_type === 'template' && campaignConfig.safe_page_id) {
          try {
            const templateHtml = await getTemplateContent(env, campaignConfig.safe_page_id);
            if (templateHtml) {
              const finalHtml = injectSafePageMeta(templateHtml);
              return new Response(finalHtml, {
                status: 200,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Cache-Control': 'public, max-age=3600'
                }
              });
            }
            console.error('serveSafePage: template not found in D1, falling back to safe-page Worker');
          } catch (e) {
            console.error('serveSafePage D1 template error:', e);
          }
        }

        try {
          const safePageTemplate = campaignConfig.safe_page_id || 'health';
          const safePageUrl = `https://safe-page.laoqin1689.workers.dev/?t=${encodeURIComponent(safePageTemplate)}`;
          const safeResp = await fetch(safePageUrl);
          const safeHtml = await safeResp.text();
          return new Response(safeHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        } catch (e) {
          console.error('serveSafePage Worker fallback error:', e);
          return new Response('<html><body><h1>Welcome</h1></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      }

      if (campaignConfig.force_safe_page) {
        const forceSafeReason = campaignConfig.maintenance_mode_active
          ? 'maintenance_mode'
          : (campaignConfig.force_safe_reason || 'routing_rule_safe_page');
        const matchedRules = campaignConfig.maintenance_mode_active
          ? ['routing_rule']
          : (forceSafeReason === 'campaign_paused' ? ['campaign_status'] : ['routing_rule']);
        return await logEntryBlock(forceSafeReason, matchedRules);
      }

      // ══════════════════════════════════════════
      // 伺服器端過濾流程
      // ══════════════════════════════════════════

      // 黑名單規則檢查（最高優先級，優先於所有允許條件）
      // campaign 是 entry 過濾的唯一主來源；舊 rules 表不再參與 runtime 判定。
      if (campaignConfig && checkBlacklistRules(clientIP, ua, asn, country, campaignConfig.blacklist_rules)) {
        return await logEntryBlock('blacklist_blocked', ['blacklist']);
      }

      // Verified Bot Allowlist — 合法爬蟲優先於國家過濾，確保合法爬蟲不會被國家過濾提前攞截
      // 決策依據：合法爬蟲（如 Googlebot、Bingbot）的來源 IP 不一定在允許國家列表中，
      // 但它們應該被正確標記為 verified_bot 而非 country_blocked。
      if (flagEnabled('enable_verified_bot_allowlist', true)) {
        const verifiedBotResult = await checkVerifiedBot(ua, env);
        if (verifiedBotResult.isVerified) {
          await logUnified(env, {
            request_id: requestId, visitor_id: visitorId, session_id: '',
            event_type: 'verified_bot', verdict: 'verified_bot', reason: `verified_bot_${verifiedBotResult.category}`,
            decision_layer: 'entry', matched_rules: ['verified_bot_allowlist'],
            safe_page_id: campaignConfig.safe_page_id || '', money_page_id: campaignConfig.money_page_id || '',
            target_url: entrySafeUrl, path: entrySafeUrl,
            ip: clientIP, ua, country,
            referer: effectiveReferer, domain: hostname,
            tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
            fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
            campaign_id: campaignConfig.id,
            event_data: { bot_name: verifiedBotResult.name, category: verifiedBotResult.category },
            startTime
          });
          return serveSafePage();
        }
      }

      // isBot 檢查 — 已確認非合法爬蟲後，檢查是否為可疑 bot
      if (await isBot(ua, clientIP, asn, env)) {
        return await logEntryBlock('bot_blocked', ['bot']);
      }

      // 國家過濾（以 campaign.cloak_country 為主，country 僅作舊資料兼容）
      const campaignCountries = campaignConfig?.cloak_country || campaignConfig?.country || '';
      const allowedCountries = (campaignCountries && campaignCountries.trim())
        ? campaignCountries.split(',').map(s => s.trim())
        : ALLOWED_COUNTRIES;
      if (flagEnabled('enable_country_filter', true) && !allowedCountries.includes(country)) {
        return await logEntryBlock('country_blocked', ['country']);
      }

      // 地區過濾：cloak_region 為可選精細條件，僅在 campaign 有設定時才檢查。
      if (flagEnabled('enable_country_filter', true) && !checkRegionWithConfig(region, campaignConfig?.cloak_region)) {
        return await logEntryBlock('region_blocked', ['region']);
      }

      // OS 過濾
      const osCheck = checkOSWithConfig(
        ua,
        campaignConfig?.cloak_os,
        campaignConfig?.cloak_os_version,
        campaignConfig?.allowed_devices,
        campaignConfig?.allow_desktop,
        campaignConfig?.allow_mobile
      );
      if (flagEnabled('enable_os_filter', true) && !osCheck.allowed) {
        return await logEntryBlock('os_blocked', ['os']);
      }

      // 語言過濾
      if (flagEnabled('enable_language_filter', true) && !checkLanguageWithConfig(acceptLang, campaignConfig?.cloak_lang)) {
        return await logEntryBlock('lang_blocked', ['language']);
      }

      // Referer 停用詞
      if (flagEnabled('enable_referer_spy_check', true) && checkReferer(effectiveReferer)) {
        return await logEntryBlock('referer_spy_blocked', ['referer']);
      }

      // 流量來源過濾
      const trafficSourceResult = checkTrafficSourceWithConfig(effectiveReferer, campaignConfig?.cloak_traffic_source);
      if (!trafficSourceResult) {
        return await logEntryBlock('traffic_source_blocked', ['traffic_source']);
      }

      // fbclid 過濾
      if (flagEnabled('enable_fbclid_check', true) && !(await checkFbclidWithConfig(url, campaignConfig, env))) {
        return await logEntryBlock('no_fbclid_blocked', ['fbclid']);
      }

      // VPN 過濾
      if (flagEnabled('enable_vpn_check', true) && await checkVPNWithConfig(clientIP, campaignConfig)) {
        return await logEntryBlock('vpn_blocked', ['vpn']);
      }

      // ══════════════════════════════════════════
      // HTTP 版本檢測
      // ══════════════════════════════════════════
      const httpProtocol = request.cf?.httpProtocol || '';
      if (httpProtocol === 'HTTP/1.0') {
        return await logEntryBlock('http_version_blocked', ['http_version']);
      }

      // ══════════════════════════════════════════
      // TLS 指紋檢測（TLS 版本 + JA3 黑名單）
      // ══════════════════════════════════════════
      const tlsVersion = request.cf?.tlsVersion || '';
      if (tlsVersion === 'TLSv1' || tlsVersion === 'TLSv1.1') {
        return await logEntryBlock('tls_version_blocked', ['tls_version']);
      }

      // JA3 指紋黑名單（需要 Enterprise plan 的 Bot Management）
      const ja3Hash = request.cf?.botManagement?.ja3Hash || '';
      if (ja3Hash) {
        try {
          const ja3BlacklistRaw = await env.CLOAKER_CONFIG.get('ja3_blacklist');
          if (ja3BlacklistRaw) {
            const ja3Blacklist = JSON.parse(ja3BlacklistRaw);
            if (Array.isArray(ja3Blacklist) && ja3Blacklist.includes(ja3Hash)) {
              return await logEntryBlock('ja3_blocked', ['ja3']);
            }
          }
        } catch (e) {
          console.error('JA3 blacklist check error:', e);
        }
      }

      // ══════════════════════════════════════════
      // 功能 1：JWT Token 驗證
      // JWT 是「快速通行證」而非「門禁」：
      // - 有效 JWT → 記錄 jwt_passed，繼續
      // - 無效/過期/重放 JWT → 不阻擋，當作新訪客繼續（已通過上面所有過濾）
      // - 無 JWT → 當作新訪客繼續
      // 每次允許的訪問都會簽發新 JWT
      // ══════════════════════════════════════════
      let secret = null;
      try { secret = await env.CLOAKER_CONFIG.get('CLOAK_SECRET'); } catch (e) {}
      if (!secret) return new Response('Configuration error', { status: 500 });

      const existingJwt = cookies['cloak_license'] || '';
      let jwtValid = false;

      if (existingJwt) {
        const jwtResult = await jwtVerify(existingJwt, secret);
        if (jwtResult.valid) {
          const isReplay = await checkJtiReplay(env, jwtResult.payload.jti);
          if (isReplay) {
            // JWT 重放：記錄但不阻擋，當作新訪客（已通過國家/Bot/OS 等過濾）
            await logUnified(env, {
              request_id: requestId, visitor_id: visitorId, session_id: '',
              event_type: 'jwt_passed', verdict: 'allowed', reason: 'jwt_replay_reissue',
              decision_layer: 'entry', matched_rules: ['jwt', 'replay'],
              safe_page_id: campaignConfig.safe_page_id || '', money_page_id: campaignConfig.money_page_id || '',
              target_url: url.toString(),
              ip: clientIP, ua, country,
              referer: effectiveReferer, domain: hostname,
              tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
              fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
              campaign_id: campaignConfig.id,
              startTime
            });
          } else {
            jwtValid = true;
            await logUnified(env, {
              request_id: requestId, visitor_id: visitorId, session_id: '',
              event_type: 'jwt_passed', verdict: 'allowed', reason: 'jwt_passed',
              decision_layer: 'entry', matched_rules: ['jwt'],
              safe_page_id: campaignConfig.safe_page_id || '', money_page_id: campaignConfig.money_page_id || '',
              target_url: url.toString(),
              ip: clientIP, ua, country,
              referer: effectiveReferer, domain: hostname,
              tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
              fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
              campaign_id: campaignConfig.id,
              startTime
            });
          }
        } else {
          // JWT 過期或無效：記錄但不阻擋，當作新訪客重新簽發
          await logUnified(env, {
            request_id: requestId, visitor_id: visitorId, session_id: '',
            event_type: 'jwt_expired', verdict: 'allowed', reason: 'jwt_expired_reissue',
            decision_layer: 'entry', matched_rules: ['jwt', 'expired'],
            safe_page_id: campaignConfig.safe_page_id || '', money_page_id: campaignConfig.money_page_id || '',
            target_url: url.toString(),
            ip: clientIP, ua, country,
            referer: effectiveReferer, domain: hostname,
            tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
            fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
            campaign_id: campaignConfig.id,
            startTime
          });
        }
      }

      // ══════════════════════════════════════════
      // 通過所有過濾 → 顯示推廣頁（money page）
      // ══════════════════════════════════════════

      // ── 讀取動態設定 ──
      const backRedirectUrl = campaignConfig.back_redirect_url || '';
      const exitPopupText = campaignConfig.exit_popup_text || '';
      const sessionId = crypto.randomUUID();
      const actionSafeUrl = entrySafeUrl;

      // ── 多鏈接分流（取得目標連結，但不再直接跳轉）──
      const targetLink = campaignConfig.forced_target_link || await selectTargetLink(env, campaignConfig, clientIP, campaignConfig.id || hostname);

      const moneyVariant = campaignConfig.id
        ? await selectPageVariant(env, campaignConfig.id, 'money_page', routingContext)
        : null;
      const moneyPageId = moneyVariant?.template_id || campaignConfig.money_page_id || '';

      // ── 生成動態 eventID（用於 FB 像素事件去重）──
      const eventID = crypto.randomUUID();

      // ── 優先從 page_variants 或 D1 templates 表讀取推廣頁模板 ──
      let baseHtml = '';
      if (moneyPageId) {
        try {
          const templateContent = await getTemplateContent(env, moneyPageId);
          if (templateContent) {
            baseHtml = templateContent;
          }
        } catch (e) {
          console.error('D1 money page template error:', e);
        }
      }

      // 如果 D1 模板讀取失敗，fallback 到 money-page Worker
      if (!baseHtml && !moneyVariant && moneyPageId) {
        try {
          const mpTag = campaignConfig.tag || effectiveTag || 'js';
          const mpPixelId = campaignConfig.pixel_id || '';
          const mpUrl = `https://money-page.laoqin1689.workers.dev/?t=${encodeURIComponent(moneyPageId)}&tag=${encodeURIComponent(mpTag)}&vid=${encodeURIComponent(visitorId)}&fbclid=${encodeURIComponent(rawFbclid)}&fbc=${encodeURIComponent(fbc)}&fbp=${encodeURIComponent(fbp)}&eventID=${encodeURIComponent(eventID)}&pixel_id=${encodeURIComponent(mpPixelId)}`;
          const mpResp = await fetch(mpUrl);
          if (mpResp.ok) {
            baseHtml = await mpResp.text();
          }
        } catch (e) {
          console.error('Fetch money page Worker fallback error:', e);
        }
      }

      // 如果有 targetLink 但沒有模板，fallback 到直接重定向（與舊行為相同）
      if (!baseHtml && targetLink) {
        await logUnified(env, {
          request_id: requestId, visitor_id: visitorId, session_id: sessionId,
          event_type: 'redirect_to_link', verdict: 'allowed', reason: 'redirect_to_link',
          decision_layer: 'entry', matched_rules: ['money_page_redirect'],
          safe_page_id: campaignConfig.safe_page_id || '', money_page_id: moneyPageId,
          target_url: targetLink, path: targetLink,
          ip: clientIP, ua, country, language: acceptLang,
          referer: effectiveReferer, domain: hostname,
          tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
          fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
          campaign_id: campaignConfig.id,
          startTime
        });
        const { token: newJwt } = await issueJWT(clientIP, ua, secret);
        ctx.waitUntil(sendCAPIPageView(env, campaignConfig, clientIP, ua, url.toString(), fbp, fbc));
        const redirectHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Redirecting...</title>
<style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background:#f5f5f5}p{color:#666;font-size:16px}</style>
</head>
<body>
<p>正在跳轉中...</p>
<script>
(function(){
  var target = ${JSON.stringify(targetLink)};
  var backUrl = ${JSON.stringify(backRedirectUrl)};
  var exitText = ${JSON.stringify(exitPopupText)};
  if (backUrl) {
    try { history.pushState(null, '', location.href); } catch(e) {}
    window.addEventListener('popstate', function() { window.location.href = backUrl; });
  }
  if (exitText) {
    window.addEventListener('beforeunload', function(e) { e.preventDefault(); e.returnValue = exitText; return exitText; });
  }
  setTimeout(function(){ window.location.href = target; }, 50);
})();
</script>
</body>
</html>`;
        const responseHeaders = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
        responseHeaders.append('Set-Cookie', `cloak_license=${encodeURIComponent(newJwt)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`);
        if (shouldSetRefererCookie) {
          responseHeaders.append('Set-Cookie', `original_referer=${encodeURIComponent(currentReferer)}; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax`);
        }
        return new Response(redirectHtml, { status: 200, headers: responseHeaders });
      }

      // 如果什麼模板都沒有，使用預設頁面
      if (!baseHtml) {
        baseHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome</title></head>
<body><h1>Welcome</h1><p>Loading...</p></body>
</html>`;
      }

      // ── 將 targetLink 嵌入到模板中的按鈕 ──
      // 替換模板中的 gotolink() 和 [conftp] 佔位符
      if (targetLink) {
        // 構建 CTA URL：直接使用 targetLink（已從 line_links / customer_links 中選出）
        // 不再自行拼接 freshpathlab 子域名，避免使用不存在的子域名
        const separator = targetLink.includes('?') ? '&' : '?';
        const ctaUrl = `${targetLink}${separator}vid=${encodeURIComponent(visitorId)}`;

        // 替換 gotolink() 為實際跳轉函數
        const gotolinkScript = `
<script>
function gotolink() {
  var targetUrl = ${JSON.stringify(ctaUrl)};
  if (window.__CLOAK_ACTION_VERIFY_REDIRECT__) {
    window.__CLOAK_ACTION_VERIFY_REDIRECT__(targetUrl);
  } else {
    window.location.href = targetUrl;
  }
}
</script>`;

        // 替換 [conftp] 佔位符為 FB 像素追蹤代碼
        const pixelId = campaignConfig.pixel_id || '';
        let conftpCode = '';
        if (pixelId) {
          conftpCode = `
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>`;
        }

        // 在 <head> 中注入 gotolink 函數
        const headMatch = baseHtml.match(/<head[^>]*>/i);
        if (headMatch) {
          baseHtml = baseHtml.replace(headMatch[0], headMatch[0] + gotolinkScript);
        }

        // 替換 [conftp] 佔位符
        baseHtml = baseHtml.replace(/\[conftp\]/g, conftpCode);

        // 替換所有 freshpathlab 連結為實際 CTA URL
        baseHtml = baseHtml.replace(/https?:\/\/[a-z]+\.freshpathlab\.com\/[^"']*/gi, ctaUrl);
      }

      await logUnified(env, {
        request_id: requestId, visitor_id: visitorId, session_id: sessionId,
        event_type: 'money_page_served', verdict: 'allowed', reason: 'money_page_served',
        decision_layer: 'entry', matched_rules: ['money_page'],
        safe_page_id: campaignConfig.safe_page_id || '', money_page_id: moneyPageId,
        target_url: targetLink || url.toString(), path: targetLink || url.toString(),
        ip: clientIP, ua, country, language: acceptLang,
        referer: effectiveReferer, domain: hostname,
        tag: effectiveTag, ad_code: campaignConfig.ad_code || '',
        fbclid: rawFbclid, fbc, fbp, pixel_id: campaignConfig.pixel_id || '',
        campaign_id: campaignConfig.id,
        startTime
      });

      // ── 功能 2：非同步發送 CAPI PageView ──
      ctx.waitUntil(sendCAPIPageView(env, campaignConfig, clientIP, ua, url.toString(), fbp, fbc));

      // 注入返回鍵重定向 + 離開意圖彈窗 + 右鍵禁用 + FB 像素等業務 JS
      // （已移除客戶端 fingerprint check / Loading overlay / Access Denied，伺服器端過濾已足夠）
      const finalHtml = injectMoneyPageCode(baseHtml, backRedirectUrl, exitPopupText, {
        requestId,
        visitorId,
        sessionId,
        safePageUrl: actionSafeUrl,
        featureFlags
      });

      // ── 功能 1：簽發新 JWT ──
      const { token: newJwt, jti: newJti } = await issueJWT(clientIP, ua, secret);

      const responseHeaders = new Headers({
        'Content-Type': 'text/html; charset=utf-8'
      });

      // 設置 JWT Cookie
      responseHeaders.append('Set-Cookie',
        `cloak_license=${encodeURIComponent(newJwt)}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax`
      );

      // 功能 18：original_referer Cookie
      if (shouldSetRefererCookie) {
        responseHeaders.append('Set-Cookie',
          `original_referer=${encodeURIComponent(currentReferer)}; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax`
        );
      }

      return new Response(finalHtml, { status: 200, headers: responseHeaders });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Error', { status: 500 });
    } finally {
      _flagCache = null;
    }
  },

  // ============================================================
  // 功能 3：增強版 Cron Trigger（新增資料來源 + 白名單）
  // ============================================================
  async scheduled(event, env, ctx) {
    const taipeiHour = (new Date().getUTCHours() + 8) % 24;
    if (taipeiHour !== 3) return;
    try {
      let allCidrs = [];

      // 來源 1：YellowCloaker bots.txt
      try {
        const r1 = await fetch('https://raw.githubusercontent.com/dvygolov/YellowCloaker/master/bases/bots.txt');
        if (r1.ok) {
          const lines = (await r1.text()).trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
          allCidrs.push(...lines.map(l => l.trim()));
        }
      } catch (e) { console.error('YellowCloaker fetch error:', e); }

      // 來源 2：stamparm/ipsum（惡意 IP，分數 >= 3）
      try {
        const r2 = await fetch('https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt');
        if (r2.ok) {
          const text = await r2.text();
          const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const ip = parts[0];
              const score = parseInt(parts[1]);
              if (score >= 3 && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
                allCidrs.push(`${ip}/32`);
              }
            }
          }
        }
      } catch (e) { console.error('ipsum fetch error:', e); }

      // 來源 3：avastel-bot-ips-lists
      try {
        const r3 = await fetch('https://raw.githubusercontent.com/antoinevastel/avastel-bot-ips-lists/master/ips_bots.json');
        if (r3.ok) {
          const data = await r3.json();
          if (Array.isArray(data)) {
            for (const entry of data) {
              const ip = entry.ip || entry;
              if (typeof ip === 'string' && /^\d+\.\d+\.\d+\.\d+/.test(ip)) {
                allCidrs.push(ip.includes('/') ? ip : `${ip}/32`);
              }
            }
          }
        }
      } catch (e) { console.error('avastel fetch error:', e); }

      // 合併去重
      const uniqueCidrs = [...new Set(allCidrs)];
      await env.CLOAKER_CONFIG.put('bot_cidr_list', JSON.stringify(uniqueCidrs));

      // 更新 Facebook ASN 清單
      try {
        const r4 = await fetch('https://raw.githubusercontent.com/platformbuilds/FacebookIPLists/master/facebook_asn_list.lst');
        if (r4.ok) {
          const lines = (await r4.text()).trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
          await env.CLOAKER_CONFIG.put('facebook_asn_list', JSON.stringify(lines));
        }
      } catch (e) { console.error('Facebook ASN fetch error:', e); }

      // 功能 3：更新白名單
      try {
        const r5 = await fetch('https://raw.githubusercontent.com/sefinek/known-bots-ip-whitelist/main/data/combined.txt');
        if (r5.ok) {
          const lines = (await r5.text()).trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
          const whiteCidrs = lines.map(l => l.trim()).filter(l => /^\d+\.\d+\.\d+\.\d+/.test(l));
          const normalizedWhite = whiteCidrs.map(ip => ip.includes('/') ? ip : `${ip}/32`);
          await env.CLOAKER_CONFIG.put('bot_whitelist', JSON.stringify(normalizedWhite));
        }
      } catch (e) { console.error('Whitelist fetch error:', e); }

    } catch (e) { console.error('Cron error:', e); }
  }
};
