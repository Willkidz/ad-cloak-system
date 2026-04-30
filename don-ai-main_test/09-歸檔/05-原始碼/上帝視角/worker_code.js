--1d32f1da626e0f5e1d60f6ed468e6c41a7662c6475d1d995e6a4ce599473
Content-Disposition: form-data; name="index.js"

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
var N8N_WEBHOOK_TOKEN = "https://godview.app.n8n.cloud/webhook/token-mapping";
var cachedConfig = null;
var cacheTime = 0;
var CACHE_TTL = 5 * 60 * 1e3;
var FALLBACK_LINE_MAP = {
  "cx": { line: "@697jsdma", name: "\u7368\u89D2\u4ED9AI\u7B97\u724C\u7CFB\u7D71", who: "C" },
  "jx": { line: "@652ahjmy", name: "\u7368\u89D2\u4ED9AI\u7B97\u724C\u7A0B\u5F0F", who: "J" },
  "lx": { line: "@128hxyvp", name: "\u7368\u89D2\u4ED9AI\u9810\u6E2C\u7A0B\u5F0F", who: "L" },
  "mx": { line: "@525euwsy", name: "\u7368\u89D2\u4ED9AI\u9810\u6E2C\u7CFB\u7D71", who: "M" },
  "cs": { line: "@999hqlmk", name: "\u7206\u5206\u738B-\u96FB\u5B50\u8A0A\u865F\u7A0B\u5F0F", who: "C" },
  "js": { line: "@935bicyi", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u79D8\u7B08", who: "J" },
  "ls": { line: "@849rldxt", name: "\u7206\u5206\u738B-24H\u8A0A\u865F\u6253\u6CD5", who: "L" },
  "ms": { line: "@001qlmgf", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u8A0A\u865F", who: "M" },
  "bf": { line: "@678eohsd", name: "\u535A\u5BCC BOFU", who: "-" },
  "cb": { line: "@bn56", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u6BBA\u624B", who: "C" },
  "jb": { line: "@448nzdkf", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u5C08\u5BB6", who: "J" },
  "lb": { line: "@bn58", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6GPT", who: "L" },
  "mb": { line: "@734xzzse", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u6253\u838A\u59EC", who: "M" },
  "jd": { line: "@520ufhmw", name: "\u5169\u65A4\u70AD\u5409", who: "J" },
  "n14": { line: "@416nbqjl", name: "\u6D2A\u91D1\u8C79", who: "-" },
  "n15": { line: "@745jaffa", name: "\u958B\u7248\u6B6A\u6B6A\u718A", who: "-" },
  "n16": { line: "@751tggmd", name: "\u6674\u5152", who: "-" },
  "n17": { line: "@106tndmh", name: "\u90DD\u58EB\u591A", who: "-" },
  "n18": { line: "@013rgbjl", name: "\u96FB\u5B50\u856D\u7518\u4E39", who: "-" },
  "n19": { line: "@536uhfpf", name: "\u958B\u7248\u6B6A\u718A", who: "-" },
  "n20": { line: "@348ikfwm", name: "\u8607\u4E3B\u91D1", who: "-" },
  "n21": { line: "@075cocov", name: "\u6B66\u72C0\u5143", who: "-" },
  "n22": { line: "@659jgxlp", name: "\u963F\u5947\u8AAA\u7403", who: "-" }
};
var FALLBACK_DEFAULT_MSG = "\u6211\u8981\u9818\u53D6\u5C08\u5C6C\u512A\u60E0 #{token}";
async function getConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }
  try {
    const resp = await fetch(CONFIG_API_URL, {
      headers: { "User-Agent": "CloudflareWorker/1.0" }
    });
    if (resp.ok) {
      const data = await resp.json();
      cachedConfig = data;
      cacheTime = now;
      return data;
    }
  } catch (e) {
  }
  return {
    LINE_MAP: FALLBACK_LINE_MAP,
    AD_MAP: {},
    DEFAULT_MSG: FALLBACK_DEFAULT_MSG
  };
}
__name(getConfig, "getConfig");
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
__name(generateToken, "generateToken");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const tag = hostname.split(".")[0];
    const config = await getConfig();
    const LINE_MAP = config.LINE_MAP || FALLBACK_LINE_MAP;
    const AD_MAP = config.AD_MAP || {};
    const DEFAULT_MSG = config.DEFAULT_MSG || FALLBACK_DEFAULT_MSG;
    const lineInfo = LINE_MAP[tag];
    if (!lineInfo) {
      return new Response("Not Found", { status: 404 });
    }
    const lineId = typeof lineInfo === "string" ? lineInfo : lineInfo.line;
    const lineName = typeof lineInfo === "string" ? "-" : lineInfo.name || "-";
    const lineWho = typeof lineInfo === "string" ? "-" : lineInfo.who || "-";
    const adCode = url.searchParams.get("a") || "";
    const adInfo = adCode ? AD_MAP[adCode] || null : null;
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
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const msgTemplate = typeof lineInfo !== "string" && lineInfo.msg ? lineInfo.msg : DEFAULT_MSG;
    const messageText = msgTemplate.replace("#{token}", token).replace("{token}", token);
    const tokenMappingData = {
      event_type: "token_mapping",
      token,
      tag,
      line_id: lineId,
      line_name: lineName,
      who: lineWho,
      ad_code: adCode,
      ad_name: adInfo ? adInfo.name : "",
      pixel_id: adInfo ? adInfo.pixel : "",
      capi_token: adInfo ? adInfo.token : "",
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
      }).catch(() => {
      })
    );
    const encodedLineId = encodeURIComponent(lineId);
    const encodedMessage = encodeURIComponent(messageText);
    const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;
    return Response.redirect(lineUrl, 302);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map

--1d32f1da626e0f5e1d60f6ed468e6c41a7662c6475d1d995e6a4ce599473--
