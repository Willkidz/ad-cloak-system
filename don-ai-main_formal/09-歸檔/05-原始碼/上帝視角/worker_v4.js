// line-redirect Worker v4 - 修復冷啟動 config 為空問題
// 變更：第一次請求阻塞等待 Config API，後續用快取 + 背景更新
const CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
const N8N_WEBHOOK_TOKEN = "https://godview.app.n8n.cloud/webhook/token-mapping";

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const FALLBACK_LINE_MAP = {
  "cx": { line: "@697jsdma", name: "獨角仙AI算牌系統", who: "C" },
  "jx": { line: "@652ahjmy", name: "獨角仙AI算牌程式", who: "J" },
  "lx": { line: "@128hxyvp", name: "獨角仙AI預測程式", who: "L" },
  "mx": { line: "@525euwsy", name: "獨角仙AI預測系統", who: "M" },
  "cs": { line: "@999hqlmk", name: "爆分王-電子訊號程式", who: "C" },
  "js": { line: "@935bicyi", name: "爆分王-電子打法秘笈", who: "J" },
  "ls": { line: "@849rldxt", name: "爆分王-24H訊號打法", who: "L" },
  "ms": { line: "@001qlmgf", name: "爆分王-電子打法訊號", who: "M" },
  "bf": { line: "@678eohsd", name: "博富 BOFU", who: "-" },
  "cb": { line: "@bn56", name: "莊家剋星-百家殺手", who: "C" },
  "jb": { line: "@448nzdkf", name: "莊家剋星-百家專家", who: "J" },
  "lb": { line: "@bn58", name: "莊家剋星-百家GPT", who: "L" },
  "mb": { line: "@734xzzse", name: "莊家剋星-百家打莊姬", who: "M" },
  "jd": { line: "@520ufhmw", name: "兩斤炭吉", who: "J" },
  "n14": { line: "@416nbqjl", name: "洪金豹", who: "-" },
  "n15": { line: "@745jaffa", name: "開版歪歪熊", who: "-" },
  "n16": { line: "@751tggmd", name: "晴兒", who: "-" },
  "n17": { line: "@106tndmh", name: "郝士多", who: "-" },
  "n18": { line: "@013rgbjl", name: "電子蕭甘丹", who: "-" },
  "n19": { line: "@536uhfpf", name: "開版歪熊", who: "-" },
  "n20": { line: "@348ikfwm", name: "蘇主金", who: "-" },
  "n21": { line: "@075cocov", name: "武狀元", who: "-" },
  "n22": { line: "@659jgxlp", name: "阿奇說球", who: "-" }
};

const FALLBACK_DEFAULT_MSG = "我要領取專屬優惠 #{token}";
const FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  DEFAULT_MSG: FALLBACK_DEFAULT_MSG
};

// v4: 取得 config — 有快取用快取，沒快取則阻塞載入（確保第一次也有 AD_MAP）
async function getConfig() {
  const now = Date.now();
  if (cachedConfig && (now - cacheTime) < CACHE_TTL) {
    return cachedConfig;
  }
  // 沒有有效快取，阻塞等待 Config API（最多 3 秒）
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(CONFIG_API_URL, {
      headers: { "User-Agent": "CloudflareWorker/1.0" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      cachedConfig = data;
      cacheTime = Date.now();
      return cachedConfig;
    }
  } catch (e) {
    // Config API 超時或失敗，用 fallback
  }
  // 如果有過期快取，還是用過期的（比 fallback 好）
  if (cachedConfig) {
    return cachedConfig;
  }
  return FALLBACK_CONFIG;
}

// 背景更新快取（不阻塞主流程）
async function refreshConfigBackground() {
  try {
    const resp = await fetch(CONFIG_API_URL, {
      headers: { "User-Agent": "CloudflareWorker/1.0" }
    });
    if (resp.ok) {
      const data = await resp.json();
      cachedConfig = data;
      cacheTime = Date.now();
    }
  } catch (e) {}
}

function generateToken() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let token = "";
  const array = new Uint8Array(5);
  crypto.getRandomValues(array);
  for (let i = 0; i < 5; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const tag = hostname.split(".")[0];

    // v4: 阻塞取得 config（確保冷啟動也有 AD_MAP）
    const config = await getConfig();

    // 如果快取即將過期（剩不到 1 分鐘），背景更新
    const now = Date.now();
    if (cachedConfig && (now - cacheTime) > (CACHE_TTL - 60000)) {
      ctx.waitUntil(refreshConfigBackground());
    }

    const LINE_MAP = config.LINE_MAP || FALLBACK_LINE_MAP;
    const AD_MAP = config.AD_MAP || {};
    const DEFAULT_MSG = config.DEFAULT_MSG || FALLBACK_DEFAULT_MSG;

    const lineInfo = LINE_MAP[tag];
    if (!lineInfo) {
      return new Response("Not Found", { status: 404 });
    }

    const lineId = typeof lineInfo === "string" ? lineInfo : lineInfo.line;
    const lineName = typeof lineInfo === "string" ? "-" : (lineInfo.name || "-");
    const lineWho = typeof lineInfo === "string" ? "-" : (lineInfo.who || "-");

    const adCode = url.searchParams.get("a") || "";
    const adInfo = adCode ? (AD_MAP[adCode] || null) : null;

    const fbc = url.searchParams.get("fbc") || "";
    const fbp = url.searchParams.get("fbp") || "";
    const fbclid = url.searchParams.get("fbclid") || "";
    const click_id = url.searchParams.get("click_id") || "";

    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    const country = request.headers.get("CF-IPCountry") || "";
    const userAgent = request.headers.get("User-Agent") || "";
    const referer = request.headers.get("Referer") || "";
    const acceptLang = request.headers.get("Accept-Language") || "";

    const token = generateToken();
    const timestamp = new Date().toISOString();

    const msgTemplate = (typeof lineInfo !== "string" && lineInfo.msg) ? lineInfo.msg : DEFAULT_MSG;
    const messageText = msgTemplate.replace("#{token}", token).replace("{token}", token);

    // v2: 支援多像素
    const pixels = (adInfo && adInfo.pixels) ? adInfo.pixels : [];
    const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: '', token: '' };

    const tokenMappingData = {
      event_type: "token_mapping",
      token,
      tag,
      line_id: lineId,
      line_name: lineName,
      who: lineWho,
      ad_code: adCode,
      ad_name: "",
      pixel_id: firstPixel.pixel,
      capi_token: firstPixel.token,
      pixels: pixels,
      fbc,
      fbp,
      fbclid,
      click_id,
      ip_address: clientIp,
      country,
      user_agent: userAgent,
      referer,
      accept_language: acceptLang,
      timestamp,
      message_text: messageText
    };

    ctx.waitUntil(
      fetch(N8N_WEBHOOK_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenMappingData)
      }).catch(() => {})
    );

    const encodedLineId = encodeURIComponent(lineId);
    const encodedMessage = encodeURIComponent(messageText);
    const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;

    return Response.redirect(lineUrl, 302);
  }
};
