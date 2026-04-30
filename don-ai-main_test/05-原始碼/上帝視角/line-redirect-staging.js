var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src.js
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __defProp22 = Object.defineProperty;
var __name22 = /* @__PURE__ */ __name2((target, value) => __defProp22(target, "name", { value, configurable: true }), "__name");
function parseUserAgent(ua) {
  const result = {
    os: null,
    os_version: null,
    device_model: null,
    device_brand: null,
    browser: null,
    browser_version: null,
    source_app: null
  };
  if (!ua) return result;
  if (ua.includes("FBAN")) {
    result.source_app = "Facebook App";
  } else if (ua.includes("Instagram")) {
    result.source_app = "Instagram";
  } else if (ua.includes("Line")) {
    result.source_app = "LINE App";
  } else {
    result.source_app = "Browser";
  }
  if (ua.includes("iPhone")) {
    result.os = "iOS";
    result.device_model = "iPhone";
    result.device_brand = "Apple";
    const iosMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      result.os_version = `${iosMatch[1]}.${iosMatch[2]}`;
    }
  } else if (ua.includes("iPad")) {
    result.os = "iOS";
    result.device_model = "iPad";
    result.device_brand = "Apple";
    const iosMatch = ua.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      result.os_version = `${iosMatch[1]}.${iosMatch[2]}`;
    }
  } else if (ua.includes("Android")) {
    result.os = "Android";
    const androidMatch = ua.match(/Android ([\d.]+)/);
    if (androidMatch) {
      result.os_version = androidMatch[1];
    }
    if (ua.includes("Samsung")) {
      result.device_brand = "Samsung";
      const samsungMatch = ua.match(/SM-([A-Z0-9]+)/);
      if (samsungMatch) {
        result.device_model = `SM-${samsungMatch[1]}`;
      }
    } else if (ua.includes("OPPO")) {
      result.device_brand = "OPPO";
      const oppoMatch = ua.match(/OPPO ([A-Z0-9]+)/);
      if (oppoMatch) {
        result.device_model = oppoMatch[1];
      }
    } else if (ua.includes("Xiaomi")) {
      result.device_brand = "Xiaomi";
      const xiaomiMatch = ua.match(/Xiaomi ([A-Z0-9]+)/);
      if (xiaomiMatch) {
        result.device_model = xiaomiMatch[1];
      }
    } else if (ua.includes("Huawei")) {
      result.device_brand = "Huawei";
      const huaweiMatch = ua.match(/Huawei ([A-Z0-9]+)/);
      if (huaweiMatch) {
        result.device_model = huaweiMatch[1];
      }
    }
  } else if (ua.includes("Windows")) {
    result.os = "Windows";
    const windowsMatch = ua.match(/Windows NT ([\d.]+)/);
    if (windowsMatch) {
      result.os_version = windowsMatch[1];
    }
  } else if (ua.includes("Macintosh")) {
    result.os = "macOS";
    const macMatch = ua.match(/Mac OS X ([\d_]+)/);
    if (macMatch) {
      result.os_version = macMatch[1].replace(/_/g, ".");
    }
  }
  if (ua.includes("Chrome") && !ua.includes("Chromium")) {
    result.browser = "Chrome";
    const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
    if (chromeMatch) {
      result.browser_version = chromeMatch[1];
    }
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    result.browser = "Safari";
    const safariMatch = ua.match(/Version\/([\d.]+)/);
    if (safariMatch) {
      result.browser_version = safariMatch[1];
    }
  } else if (ua.includes("Firefox")) {
    result.browser = "Firefox";
    const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
    if (firefoxMatch) {
      result.browser_version = firefoxMatch[1];
    }
  } else if (ua.includes("Edge")) {
    result.browser = "Edge";
    const edgeMatch = ua.match(/Edg\/([\d.]+)/);
    if (edgeMatch) {
      result.browser_version = edgeMatch[1];
    }
  }
  return result;
}
__name(parseUserAgent, "parseUserAgent");
__name2(parseUserAgent, "parseUserAgent");
__name22(parseUserAgent, "parseUserAgent");
var __defProp222 = Object.defineProperty;
var __name222 = /* @__PURE__ */ __name22((target, value) => __defProp222(target, "name", { value, configurable: true }), "__name");
var CONFIG_API_URL = "https://n8n.bexnua.store/webhook/get-config";
var CACHE_TTL = 30 * 60 * 1e3;
var LIFF_URL = "https://liff.line.me/2009129136-lUm2n85A";
var LIFF_TAGS = /* @__PURE__ */ new Set(["n21"]);
var TAG_PREFIX_MAP = {
  // AS 系列（爆分王）
  js: "AS",
  cs: "AS",
  ms: "AS",
  ls: "AS",
  // AB 系列（莊家剋星）
  jb: "AB",
  cb: "AB",
  mb: "AB",
  lb: "AB",
  // AX 系列（獨角仙）
  jx: "AX",
  cx: "AX",
  mx: "AX",
  lx: "AX",
  // BF 系列（博富）
  bf: "BF",
  jd: "JD",
  // N 系列（獨立產品）
  n14: "N14",
  n15: "N15",
  n16: "N16",
  n17: "N17",
  n18: "N18",
  n19: "N19",
  n20: "N20",
  n21: "N21",
  n22: "N22"
};
var FALLBACK_LINE_MAP = {
  // --- AS 系列（爆分王）---
  "js": { line: "@935bicyi", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u79D8\u7B08", who: "J", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U94f93d9d3d607c1efe2f4154eccbf332" },
  "cs": { line: "@999hqlmk", name: "\u7206\u5206\u738B-\u96FB\u5B50\u8A0A\u865F\u7A0B\u5F0F", who: "C", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Uba79c3207e5da050001c777c2c5717ca" },
  "ms": { line: "@001qlmgf", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u8A0A\u865F", who: "M", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U7aada3e19a682beaf1d28ecc165b73c6" },
  "ls": { line: "@849rldxt", name: "\u7206\u5206\u738B-24H\u8A0A\u865F\u6253\u6CD5", who: "L", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U09f2161774085c17f2bfe57ef37effb6" },
  // --- AB 系列（莊家剋星）---
  "jb": { line: "@448nzdkf", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u5C08\u5BB6", who: "J", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Ua4b409d9374fcf2a2edeb474983cf3a8" },
  "cb": { line: "@bn56", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u6BBA\u624B", who: "C", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U9eb938b30e48e102e36eff24696832da" },
  "mb": { line: "@734xzzse", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u6253\u838A\u59EC", who: "M", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U0b8cc70ffd50f1644e67d0a6487b0c54" },
  "lb": { line: "@bn58", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6GPT", who: "L", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Uf14f0347a9cc140e441ab83e22847efe" },
  // --- AX 系列（獨角仙）---
  "jx": { line: "@652ahjmy", name: "\u7368\u89D2\u4ED9AI\u7B97\u724C\u7A0B\u5F0F", who: "J", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Ufc7b06eedb75a1fb69a56265f235448e" },
  "cx": { line: "@697jsdma", name: "\u7368\u89D2\u4ED9AI\u7B97\u724C\u7CFB\u7D71", who: "C", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U5717d3ae4604d92bb02671b4323f73ef" },
  "mx": { line: "@525euwsy", name: "\u7368\u89D2\u4ED9AI\u9810\u6E2C\u7CFB\u7D71", who: "M", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Ufef3e77c05a8aa7ecd1d0cce796c3f8c" },
  "lx": { line: "@128hxyvp", name: "\u7368\u89D2\u4ED9AI\u9810\u6E2C\u7A0B\u5F0F", who: "L", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Udc2caab6aa6751d207a8369abc71564f" },
  // --- BF 系列（博富）---
  "bf": { line: "@678eohsd", name: "\u535A\u5BCC BOFU", who: "-", msg: "\u6211\u8981\u958B\u7248", destination: "U0cdeed609619a3ea8f8027b01d216f0f" },
  "jd": { line: "@520ufhmw", name: "\u5169\u65A4\u70AD\u5409", who: "J", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U6400f19a0d56f688b4997c2fffebb7c4" },
  // --- N 系列（獨立產品）---
  "n14": { line: "@416nbqjl", name: "\u6D2A\u91D1\u8C79", who: "M", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U0d18d0ef85a7200968002ad98333feda" },
  "n15": { line: "@745jaffa", name: "N15", who: "J", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U454703dd1ed39d71332747a69a134556" },
  "n16": { line: "@751tggmd", name: "N16", who: "-", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U7a4a33ecbcf38fa50d2d0727ea12ec8a" },
  "n17": { line: "@106tndmh", name: "N17", who: "C", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U3e09fe40176b71674bf5eae8e77a9d2e" },
  "n18": { line: "@013rgbjl", name: "\u96FB\u5B50\u856D\u7518\u4E39", who: "C", msg: "\u6211\u60F3\u4E86\u89E3", destination: "Ud4569f5351c03a556e19729a8a3c2711" },
  "n19": { line: "@536uhfpf", name: "N19", who: "J", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U9aa3a89e3ea6a0af910290e941a1c47d" },
  "n20": { line: "@348ikfwm", name: "\u8607\u4E3B\u91D1", who: "L", msg: "\u6211\u60F3\u4E86\u89E3", destination: "U822bb6807f10db0ec822086078a45fb4" },
  "n21": { line: "@075cocov", name: "\u6B66\u72C0\u5143", who: "M", msg: "\u6211\u60F3\u4E86\u89E3", destination: "Uf5fc4eaa9fbbd5fbdd42ed8102abeba4" },
  "n22": { line: "@659jgxlp", name: "\u963F\u5947\u8AAA\u7403", who: "J", msg: "\u6211\u60F3\u4E86\u89E3", destination: "Uc3278ae505836cfa1d73547f9bdbde15" },
  // --- T 系列（天盈）---
  "ct": { line: "@797ofaxr", name: "\u5929\u76c8\u79d1\u6280-AI\u7e3d\u63a7\u5b98", who: "C", msg: "\u9818\u53d6\u7a0b\u5f0f", destination: "Ud8e300f5a177b33dcedd81f2fe140bf4" },
  "jt": { line: "@738uopih", name: "\u5929\u76c8\u79d1\u6280-\u7ba1\u7406\u54e1", who: "J", msg: "\u9818\u53d6\u7a0b\u5f0f", destination: "Ud8e300f5a177b33dcedd81f2fe140bf4" },
  "lt": { line: "@847wyqlk", name: "\u5929\u76c8AI\u79d1\u6280-\u8ca0\u8cac\u4eba", who: "L", msg: "\u9818\u53d6\u7a0b\u5f0f", destination: "Ud8e300f5a177b33dcedd81f2fe140bf4" },
  "mt": { line: "@846iigey", name: "\u5929\u76c8\u79d1\u6280-\u7a0b\u5f0f\u958b\u901a", who: "M", msg: "\u9818\u53d6\u7a0b\u5f0f", destination: "Ud8e300f5a177b33dcedd81f2fe140bf4" },
  // --- N 系列（新增 fallback）---
  "n23": { line: "@774xejsy", name: "\u3010\u535a\u5bcc\u5a1b\u6a02\u3011\u958b\u7248\u8d082\u842c", who: "-" },
  "n24": { line: "@746byqyc", name: "\u0e2a\u0e39\u0e15\u0e23\u0e25\u0e31\u0e1a\u0e1a\u0e32\u0e04\u0e32\u0e23\u0e48\u0e32", who: "-" },
  "n25": { line: "@939ydchv", name: "\u0e1a\u0e32\u0e04\u0e32\u0e23\u0e48\u0e32\u0e40\u0e17\u0e1e\u0e40\u0e08\u0e49\u0e32", who: "-" },
  "n26": { line: "@090pgzme", name: "\u5c0f\u8cc0", who: "-" },
  "n27": { line: "@208jvuub", name: "\u7206\u70b9\u738b-\u8d85\u901f\u6f14\u7b97", who: "-" },
  "n28": { line: "@264whuaw", name: "\u7206\u70b9\u738b-\u60c5\u5831\u4e2d\u6838", who: "-" },
  "n29": { line: "@942tkadn", name: "\u8607\u4e3b\u91d1\u300a\u53f0\u5927\u96fb\u5b50\u7cfb\u300b", who: "-" },
  "n30": { line: "@678sizez", name: "\u667a\u9078\u5f69-\u795e\u7b97\u6b3d", who: "-" },
  "n31": { line: "@022dcimw", name: "\u5f69\u7968\u65b9\u7a0b\u5f0f-\u7ba1\u7406\u54e1", who: "-" },
  "n32": { line: "@719zxxkf", name: "\u7206\u5206\u738b-\u96fb\u5b50\u7a0b\u5f0f\u6559\u5b78", who: "-" },
  "n33": { line: "@805ayzrc", name: "\u838a\u5bb6\u524b\u661f-\u767e\u5bb6\u6253\u6cd5\u63a8\u85a6", who: "-" },
  "n34": { line: "@551wimwn", name: "\u66ab\u6642\u505c\u7528", who: "-" },
  "n35": { line: "@269gigom", name: "\u5168\u884c\u92b7", who: "-" },
  "n36": { line: "@733mrvoy", name: "\u838a\u5bb6\u524b\u661f-\u7834\u89e3\u7a0b\u5f0f", who: "-" },
  "n37": { line: "@081ibggo", name: "\u7206\u5206\u738b-\u7a0b\u5f0f\u7ba1\u7406\u54e1", who: "-" },
  "n38": { line: "@388gknwi", name: "AI Forecast 24H", who: "-" },
  "n39": { line: "@008nstto", name: "Vivian \u8473\u8473", who: "-" },
  "n40": { line: "@986ktmsk", name: "\ud83d\udca5\u9226\u91d1\u5718\u968a\ud83d\udca5\u5c0f\u5e6b\u624b", who: "-" },
  "n41": { line: "@205casza", name: "\u838a\u5bb6\u524b\u661f\u26a1\u6700\u9ad8\u8ca0\u8cac\u4eba", who: "-" },
  "n42": { line: "@219hmjbj", name: "\u667a\u9078\u5f69-\u8cfd\u8eca\u98db\u8247\u9810\u6e2c", who: "-" },
  // --- 帶數字的舊 ad_code（歷史相容）---
  "js01": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ms01": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ls01": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "cs01": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "js02": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ms02": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ls02": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "cs02": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "js03": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ms03": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ls03": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "cs03": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "js04": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ms04": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ls04": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "cs04": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "js06": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ms06": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "ls06": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" },
  "cs06": { line: "@017dufwi", name: "\u91D1\u5BF601", who: "-" }
};
var FALLBACK_DEFAULT_MSG = "\u6211\u8981\u9818\u53D6\u5C08\u5C6C\u512A\u60E0 #{token}";
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var cachedConfig = null;
var cacheTime = 0;
var FALLBACK_MASTER_PIXEL_MAP = {
  "bf": { pixel: "2153779865162231", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "cb": { pixel: "2030344604527767", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "cs": { pixel: "1296143099239936", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "cx": { pixel: "4353746171539948", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "jb": { pixel: "2030344604527767", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "jd": { pixel: "867887526267694", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "js": { pixel: "1296143099239936", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "jx": { pixel: "4353746171539948", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "lb": { pixel: "2030344604527767", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "ls": { pixel: "1296143099239936", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "lx": { pixel: "4353746171539948", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "mb": { pixel: "2030344604527767", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "ms": { pixel: "1296143099239936", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "mx": { pixel: "4353746171539948", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "n14": { pixel: "3441258769365705", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "n18": { pixel: "735170192897322", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "n20": { pixel: "1339967038176681", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
  "n22": { pixel: "962140406204890", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" },
};
var FALLBACK_BC_PIXEL = { pixel: "940592681819066", token: "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD" };
var FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  MASTER_PIXEL_MAP: FALLBACK_MASTER_PIXEL_MAP,
  DEFAULT_MSG: FALLBACK_DEFAULT_MSG,
  BC_PIXEL: FALLBACK_BC_PIXEL
};
function getConfigSync() {
  if (cachedConfig) return cachedConfig;
  return FALLBACK_CONFIG;
}
__name(getConfigSync, "getConfigSync");
__name2(getConfigSync, "getConfigSync");
__name22(getConfigSync, "getConfigSync");
__name222(getConfigSync, "getConfigSync");
async function refreshConfig() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5e3);
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
  } catch (e) {
  }
}
__name(refreshConfig, "refreshConfig");
__name2(refreshConfig, "refreshConfig");
__name22(refreshConfig, "refreshConfig");
__name222(refreshConfig, "refreshConfig");
function getProductPrefix(tag) {
  if (TAG_PREFIX_MAP[tag]) return TAG_PREFIX_MAP[tag];
  var prefix2 = tag.substring(0, 2);
  if (TAG_PREFIX_MAP[prefix2]) return TAG_PREFIX_MAP[prefix2];
  return null;
}
__name(getProductPrefix, "getProductPrefix");
__name2(getProductPrefix, "getProductPrefix");
__name22(getProductPrefix, "getProductPrefix");
__name222(getProductPrefix, "getProductPrefix");
async function sendBcEvent(eventName, productPrefix, userData, bcPixel) {
  var events = [];
  var baseEvent = {
    action_source: "website",
    event_time: Math.floor(Date.now() / 1e3),
    user_data: {}
  };
  if (userData.ip) baseEvent.user_data.client_ip_address = userData.ip;
  if (userData.ua) baseEvent.user_data.client_user_agent = userData.ua;
  if (userData.fbc) baseEvent.user_data.fbc = userData.fbc;
  if (userData.fbp) baseEvent.user_data.fbp = userData.fbp;
  if (productPrefix) {
    events.push(Object.assign({}, baseEvent, {
      event_name: productPrefix + "_" + eventName,
      event_id: productPrefix + "_" + eventName + "_" + Date.now()
    }));
  }
  events.push(Object.assign({}, baseEvent, {
    event_name: "ALL_" + eventName,
    event_id: "ALL_" + eventName + "_" + Date.now()
  }));
  if (!bcPixel || !bcPixel.pixel || !bcPixel.token) {
    return;
  }
  var url = "https://graph.facebook.com/v25.0/" + bcPixel.pixel + "/events?access_token=" + bcPixel.token;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: events })
    });
  } catch (e) {
  }
}
__name(sendBcEvent, "sendBcEvent");
__name2(sendBcEvent, "sendBcEvent");
__name22(sendBcEvent, "sendBcEvent");
__name222(sendBcEvent, "sendBcEvent");
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
__name2(generateToken, "generateToken");
__name22(generateToken, "generateToken");
__name222(generateToken, "generateToken");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const tag = hostname.split(".")[0];
    const pathname = url.pathname;
    if (pathname === "/test-adcode") {
      const testPath = url.searchParams.get("path") || "/";
      const testQuery = url.searchParams.get("a") || "";
      const testUrl = new URL(`https://test.example.com${testPath}${testQuery ? "?a=" + testQuery : ""}`);
      const testPathname = testUrl.pathname;
      const testPathSegment = testPathname.replace(/^\//, "");
      let testAdCode = "";
      if (testPathSegment && /^[A-Z]{1,6}\d{1,4}$/.test(testPathSegment)) {
        testAdCode = testPathSegment;
      } else {
        testAdCode = testUrl.searchParams.get("a") || "";
      }
      return new Response(JSON.stringify({
        input_path: testPath,
        input_query_a: testQuery,
        resolved_ad_code: testAdCode,
        method: testPathSegment && /^[A-Z]{1,6}\d{1,4}$/.test(testPathSegment) ? "pathname" : testQuery ? "query_string" : "none"
      }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (pathname === "/bc-event") {
      if (!cachedConfig) {
        await refreshConfig();
      }
      const bcConfig = getConfigSync();
      const bcPixelForEvent = bcConfig.BC_PIXEL || FALLBACK_BC_PIXEL;
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }
      if (request.method === "GET") {
        const eventName = url.searchParams.get("e");
        const eventTag = url.searchParams.get("t") || tag;
        if (!eventName) {
          return new Response("missing e param", { status: 400, headers: CORS_HEADERS });
        }
        const productPrefix2 = getProductPrefix(eventTag);
        const rawFbclid = url.searchParams.get("fbclid") || "";
        const userData = {
          ip: request.headers.get("CF-Connecting-IP") || "",
          ua: request.headers.get("User-Agent") || "",
          fbc: url.searchParams.get("fbc") || (rawFbclid ? `fb.1.${Date.now()}.${rawFbclid}` : ""),
          fbp: url.searchParams.get("fbp") || ""
        };
        ctx.waitUntil(sendBcEvent(eventName, productPrefix2, userData, bcPixelForEvent));
        return new Response(Uint8Array.from([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 0, 0, 0, 59]), {
          headers: Object.assign({ "Content-Type": "image/gif", "Cache-Control": "no-store" }, CORS_HEADERS)
        });
      }
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const eventName = body.event_name;
          const eventTag = body.tag || tag;
          if (!eventName) {
            return new Response(JSON.stringify({ error: "missing event_name" }), {
              status: 400,
              headers: Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS)
            });
          }
          const productPrefix2 = getProductPrefix(eventTag);
          const rawFbclidPost = body.fbclid || "";
          const userData = {
            ip: request.headers.get("CF-Connecting-IP") || "",
            ua: request.headers.get("User-Agent") || "",
            fbc: body.fbc || (rawFbclidPost ? `fb.1.${Date.now()}.${rawFbclidPost}` : ""),
            fbp: body.fbp || ""
          };
          ctx.waitUntil(sendBcEvent(eventName, productPrefix2, userData, bcPixelForEvent));
          return new Response(JSON.stringify({ ok: true, product: productPrefix2, event: eventName }), {
            headers: Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS)
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: "invalid request" }), {
            status: 400,
            headers: Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS)
          });
        }
      }
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }
    const now = Date.now();
    if (!cachedConfig) {
      await refreshConfig();
    } else if (now - cacheTime > CACHE_TTL) {
      ctx.waitUntil(refreshConfig());
    }
    const config = getConfigSync();
    const LINE_MAP = { ...FALLBACK_LINE_MAP, ...(config.LINE_MAP || {}) };
    const AD_MAP = config.AD_MAP || {};
    const MASTER_PIXEL_MAP = config.MASTER_PIXEL_MAP || {};
    const DEFAULT_MSG = config.DEFAULT_MSG || FALLBACK_DEFAULT_MSG;
    const BC_PIXEL = config.BC_PIXEL || FALLBACK_BC_PIXEL;
    const lineInfo = LINE_MAP[tag];
    if (!lineInfo) {
      return new Response("Not Found", { status: 404 });
    }
    const lineId = typeof lineInfo === "string" ? lineInfo : lineInfo.line;
    const lineName = typeof lineInfo === "string" ? "-" : lineInfo.name || "-";
    const lineWho = typeof lineInfo === "string" ? "-" : lineInfo.who || "-";
    let adCode = "";
    const pathSegment = pathname.replace(/^\//, "");
    if (pathSegment && /^[A-Z]{1,6}\d{1,4}$/.test(pathSegment)) {
      adCode = pathSegment;
    } else {
      adCode = url.searchParams.get("a") || "";
    }
    const adInfo = adCode ? AD_MAP[adCode] || null : null;
    const fbclid = url.searchParams.get("fbclid") || "";
    const fbc = url.searchParams.get("fbc") || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");
    const fbp = url.searchParams.get("fbp") || "";
    const click_id = url.searchParams.get("click_id") || "";
    const visitorId = url.searchParams.get("vid") || "";
    const clientIp = request.headers.get("CF-Connecting-IP") || "";
    const country = request.headers.get("CF-IPCountry") || "";
    const userAgent = request.headers.get("User-Agent") || "";
    const referer = request.headers.get("Referer") || "";
    const acceptLang = request.headers.get("Accept-Language") || "";
    const token = generateToken();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const msgTemplate = typeof lineInfo !== "string" && lineInfo.msg ? lineInfo.msg : DEFAULT_MSG;
    const messageText = msgTemplate.replace("#{token}", token);
    const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];
    const masterPixel = MASTER_PIXEL_MAP[tag] || null;
    if (masterPixel && masterPixel.pixel) {
      const alreadyExists = adPixels.some((p) => p.pixel === masterPixel.pixel);
      if (!alreadyExists) {
        adPixels.push(masterPixel);
      }
    }
    if (BC_PIXEL && BC_PIXEL.pixel && BC_PIXEL.token) {
      const bcAlreadyExists = adPixels.some((p) => p.pixel === BC_PIXEL.pixel);
      if (!bcAlreadyExists) {
        adPixels.push({ pixel: BC_PIXEL.pixel, token: BC_PIXEL.token, is_bc: true });
      }
    }
    const pixels = adPixels;
    const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: "", token: "" };
    const destination = typeof lineInfo !== "string" && lineInfo.destination ? lineInfo.destination : "";
    const uaData = parseUserAgent(userAgent);
    const screenResolution = new URL(request.url).searchParams.get("sr") || null;
    const clickId = crypto.randomUUID();
    ctx.waitUntil(
      env.DB.prepare(
        "INSERT INTO clicks (click_id,timestamp,tag,ad_code,line_oa_id,ip_address,user_agent,accept_language,ip_country,ip_asn,fbclid,fbc,fbp,pixel_id,capi_token,pixels,destination,cf_colo,tls_version,http_protocol,referer,ip_city,ip_region,ip_region_code,ip_postal_code,ip_timezone,ip_asn_org,latitude,longitude,continent,client_tcp_rtt,os,os_version,device_model,device_brand,browser,browser_version,source_app,screen_resolution,visitor_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(
        clickId,
        timestamp,
        tag,
        adCode,
        lineId,
        clientIp,
        userAgent,
        acceptLang,
        country,
        request.cf?.asn?.toString() || "",
        fbclid,
        fbc,
        fbp,
        firstPixel.pixel,
        firstPixel.token,
        JSON.stringify(pixels),
        destination,
        request.cf?.colo || "",
        request.cf?.tlsVersion || "",
        request.cf?.httpProtocol || "",
        referer,
        request.cf?.city || null,
        request.cf?.region || null,
        request.cf?.regionCode || null,
        request.cf?.postalCode || null,
        request.cf?.timezone || null,
        request.cf?.asOrganization || null,
        request.cf?.latitude || null,
        request.cf?.longitude || null,
        request.cf?.continent || null,
        request.cf?.clientTcpRtt || null,
        uaData.os,
        uaData.os_version,
        uaData.device_model,
        uaData.device_brand,
        uaData.browser,
        uaData.browser_version,
        uaData.source_app,
        screenResolution,
        visitorId
      ).run().catch((e) => console.error("D1_INSERT_ERR:", e.message))
    );
    if (LIFF_TAGS.has(tag)) {
      const liffParams = new URLSearchParams({
        tag,
        a: adCode,
        line_id: lineId,
        token,
        fbclid,
        fbc,
        fbp,
        ts: timestamp,
        msg: messageText
      });
      const liffFullUrl = LIFF_URL + "?" + liffParams.toString();
      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="1;url=${liffFullUrl}">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06C755;font-family:-apple-system,sans-serif;color:#fff;text-align:center}.c{padding:2rem}.btn{display:inline-block;margin-top:20px;padding:14px 40px;background:#fff;color:#06C755;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none}</style>
</head><body><div class="c">
<p>\u6B63\u5728\u524D\u5F80 LINE...</p>
<a class="btn" href="${liffFullUrl}">\u9EDE\u6B64\u958B\u555F LINE</a>
</div>
<script>setTimeout(function(){window.location.href="${liffFullUrl}"},500);<\/script>
</body></html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    const encodedLineId = encodeURIComponent(lineId);
    const encodedMessage = encodeURIComponent(messageText);
    const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;
    return Response.redirect(lineUrl, 302);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=src.js.map

