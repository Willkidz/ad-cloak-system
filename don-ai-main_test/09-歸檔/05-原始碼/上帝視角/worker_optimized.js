const CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
const N8N_WEBHOOK_TOKEN = "https://godview.app.n8n.cloud/webhook/token-mapping";
let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (was 5 min)

const FALLBACK_LINE_MAP = {
  "js01": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ms01": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ls01": { line: "@017dufwi", name: "金獅01", who: "-" },
  "cs01": { line: "@017dufwi", name: "金獅01", who: "-" },
  "js02": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ms02": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ls02": { line: "@017dufwi", name: "金獅01", who: "-" },
  "cs02": { line: "@017dufwi", name: "金獅01", who: "-" },
  "js03": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ms03": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ls03": { line: "@017dufwi", name: "金獅01", who: "-" },
  "cs03": { line: "@017dufwi", name: "金獅01", who: "-" },
  "js04": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ms04": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ls04": { line: "@017dufwi", name: "金獅01", who: "-" },
  "cs04": { line: "@017dufwi", name: "金獅01", who: "-" },
  "js06": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ms06": { line: "@017dufwi", name: "金獅01", who: "-" },
  "ls06": { line: "@017dufwi", name: "金獅01", who: "-" },
  "cs06": { line: "@017dufwi", name: "金獅01", who: "-" },
  "bf": { line: "@805kpqfp", name: "博富-信用", who: "-" },
  "jd": { line: "@jade168", name: "翡翠", who: "-" },
  "n20": { line: "@sucking888", name: "蘇主金", who: "-" },
  "cs": { line: "@cs168vip", name: "金好運", who: "-" },
  "cb": { line: "@cb168vip", name: "金好運VIP", who: "-" },
  "cx": { line: "@cx168vip", name: "彩鑫", who: "-" },
  "n18": { line: "@n18vip", name: "N18", who: "-" },
  "n14": { line: "@n14vip", name: "N14", who: "-" },
  "n22": { line: "@659jgxlp", name: "阿奇說球", who: "-" }
};
const FALLBACK_DEFAULT_MSG = "我要領取專屬優惠 #{token}";
const FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  MASTER_PIXEL_MAP: {},
  DEFAULT_MSG: FALLBACK_DEFAULT_MSG
};

// Non-blocking config: always return immediately
function getConfigSync() {
  if (cachedConfig) return cachedConfig;
  return FALLBACK_CONFIG;
}

// Background config refresh
async function refreshConfig() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(CONFIG_API_URL, {
      headers: { "User-Agent": "CloudflareWorker/1.0" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
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

    // === KEY OPTIMIZATION: Never block on config ===
    // Use cached/fallback config synchronously, refresh in background if stale
    const now = Date.now();
    const config = getConfigSync();
    if (!cachedConfig || (now - cacheTime) > CACHE_TTL) {
      ctx.waitUntil(refreshConfig());
    }

    const LINE_MAP = config.LINE_MAP || FALLBACK_LINE_MAP;
    const AD_MAP = config.AD_MAP || {};
    const MASTER_PIXEL_MAP = config.MASTER_PIXEL_MAP || {};
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

    // v5: Merge ad pixels + master pixels
    const adPixels = (adInfo && adInfo.pixels) ? [...adInfo.pixels] : [];
    const masterPixel = MASTER_PIXEL_MAP[tag] || null;
    if (masterPixel && masterPixel.pixel) {
      const alreadyExists = adPixels.some(p => p.pixel === masterPixel.pixel);
      if (!alreadyExists) {
        adPixels.push(masterPixel);
      }
    }
    const pixels = adPixels;
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

    // Non-blocking: send token mapping in background
    ctx.waitUntil(
      fetch(N8N_WEBHOOK_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenMappingData)
      }).catch(() => {})
    );

    // === INSTANT REDIRECT ===
    const encodedLineId = encodeURIComponent(lineId);
    const encodedMessage = encodeURIComponent(messageText);
    const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;
    return Response.redirect(lineUrl, 302);
  }
};
