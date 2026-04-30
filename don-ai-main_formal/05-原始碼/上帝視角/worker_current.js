--1e80c876f9ce4aedd4e2c5d19a1912ab64a5d046d20e0b66cb3185bbce4d
Content-Disposition: form-data; name="index.js"

// line-redirect Worker v7 - Time Attribution
// 點擊事件直接寫入 D1，不經過 n8n
var CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
var CACHE_KEY = "https://line-redirect-cache.internal/config";
var CACHE_TTL = 1800; // 30 分鐘（秒）
var memConfig = null;

var FALLBACK_LINE_MAP = {
  "js01": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ms01": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ls01": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "cs01": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "js02": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ms02": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ls02": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "cs02": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "js03": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ms03": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ls03": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "cs03": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "js04": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ms04": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ls04": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "cs04": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "js06": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ms06": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "ls06": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "cs06": { line: "@017dufwi", name: "\u91d1\u734501", who: "-" },
  "bf": { line: "@805kpqfp", name: "\u535a\u5bcc-\u4fe1\u7528", who: "-" },
  "jd": { line: "@jade168", name: "\u7fe1\u7fe0", who: "-" },
  "n20": { line: "@sucking888", name: "\u8607\u4e3b\u91d1", who: "-" },
  "cs": { line: "@cs168vip", name: "\u91d1\u597d\u904b", who: "-" },
  "cb": { line: "@cb168vip", name: "\u91d1\u597d\u904bVIP", who: "-" },
  "cx": { line: "@cx168vip", name: "\u5f69\u946b", who: "-" },
  "n18": { line: "@n18vip", name: "N18", who: "-" },
  "n14": { line: "@n14vip", name: "N14", who: "-" },
  "n21": { line: "@075cocov", name: "\u6b66\u72c0\u5143", who: "-" },
  "n22": { line: "@659jgxlp", name: "\u963f\u5947\u8aaa\u7403", who: "-" }
};

var FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  MASTER_PIXEL_MAP: {}
};

async function getConfig() {
  // 1. 記憶體 cache（同一 isolate 內最快）
  if (memConfig) return memConfig;

  // 2. Cloudflare Edge Cache（冷啟動時 < 10ms）
  try {
    const cache = caches.default;
    const cached = await cache.match(CACHE_KEY);
    if (cached) {
      const data = await cached.json();
      memConfig = data;
      return data;
    }
  } catch (e) {}

  // 3. 都沒有，打 Config API 並寫入 Edge Cache
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
      memConfig = data;
      // 寫入 Edge Cache
      const cache = caches.default;
      const cacheResp = new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Cache-Control": `s-maxage=${CACHE_TTL}` }
      });
      await cache.put(CACHE_KEY, cacheResp);
      return data;
    }
  } catch (e) {}

  return FALLBACK_CONFIG;
}

async function refreshConfigBackground() {
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
      memConfig = data;
      const cache = caches.default;
      const cacheResp = new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Cache-Control": `s-maxage=${CACHE_TTL}` }
      });
      await cache.put(CACHE_KEY, cacheResp);
    }
  } catch (e) {}
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const tag = hostname.split(".")[0];
    const now = Date.now();

    // 從 Edge Cache 或記憶體取 config（冷啟動 < 10ms）
    const config = await getConfig();
    // 背景刷新 config
    ctx.waitUntil(refreshConfigBackground());

    const LINE_MAP = config.LINE_MAP || FALLBACK_LINE_MAP;
    const AD_MAP = config.AD_MAP || {};
    const MASTER_PIXEL_MAP = config.MASTER_PIXEL_MAP || {};

    const lineInfo = LINE_MAP[tag];
    if (!lineInfo) {
      return new Response("Not Found", { status: 404 });
    }

    const lineId = typeof lineInfo === "string" ? lineInfo : lineInfo.line;
    const lineName = typeof lineInfo === "string" ? "-" : lineInfo.name || "-";
    const lineWho = typeof lineInfo === "string" ? "-" : lineInfo.who || "-";
    const destination = typeof lineInfo !== "string" ? lineInfo.destination || "" : "";

    const adCode = url.searchParams.get("a") || "";
    const adInfo = adCode ? AD_MAP[adCode] || null : null;
    const fbc = url.searchParams.get("fbc") || "";
    const fbp = url.searchParams.get("fbp") || "";
    const fbclid = url.searchParams.get("fbclid") || "";

    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    const country = request.headers.get("CF-IPCountry") || "";
    const userAgent = request.headers.get("User-Agent") || "";
    const acceptLang = request.headers.get("Accept-Language") || "";
    const asn = (request.cf && request.cf.asn) ? String(request.cf.asn) : "";
    const city = (request.cf && request.cf.city) ? request.cf.city : "";
    const colo = (request.cf && request.cf.colo) ? request.cf.colo : "";
    const tlsVer = (request.cf && request.cf.tlsVersion) ? request.cf.tlsVersion : "";
    const httpProto = (request.cf && request.cf.httpProtocol) ? request.cf.httpProtocol : "";

    const clickId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 組合像素資訊
    const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];
    const masterPixel = MASTER_PIXEL_MAP[tag] || null;
    if (masterPixel && masterPixel.pixel) {
      if (!adPixels.some(p => p.pixel === masterPixel.pixel)) {
        adPixels.push(masterPixel);
      }
    }
    const pixels = adPixels;
    const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: "", token: "" };

    // 直接寫入 D1 (非同步，不阻塞跳轉)
    if (env.CLICKS_DB) {
      ctx.waitUntil(
        env.CLICKS_DB.prepare(
          "INSERT INTO clicks (click_id, timestamp, tag, ad_code, line_oa_id, destination, ip_address, user_agent, accept_language, ip_country, ip_asn, fbclid, fbc, fbp, pixel_id, capi_token, pixels, ip_city, cf_colo, tls_version, http_protocol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          clickId, timestamp, tag, adCode, lineId, destination,
          clientIp, userAgent, acceptLang, country, asn,
          fbclid, fbc, fbp,
          firstPixel.pixel, firstPixel.token, JSON.stringify(pixels),
          city, colo, tlsVer, httpProto
        ).run().catch(() => {})
      );
    }

    // 直接跳轉到 LINE 加好友頁面
    const encodedLineId = encodeURIComponent(lineId);
    const lineUrl = `https://line.me/R/ti/p/${encodedLineId}`;
    return Response.redirect(lineUrl, 302);
  }
};

