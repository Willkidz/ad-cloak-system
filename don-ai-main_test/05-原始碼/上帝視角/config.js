/**
 * line-redirect Worker 設定檔
 * 
 * 所有可變設定集中在此，Worker 邏輯（index.js）只 import 這個檔案。
 * 改設定只改這裡，不動 Worker 邏輯。
 * 
 * 最後更新：2026-03-20
 */

// ═══════════════════════════════════════════════════════════
// 1. 遠端 Config API（正式資料來源，Worker 啟動後背景拉取）
// ═══════════════════════════════════════════════════════════
export const CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
export const N8N_WEBHOOK_TOKEN = "https://godview.app.n8n.cloud/webhook/token-mapping-v2";
export const CACHE_TTL = 30 * 60 * 1000; // 30 分鐘

// ═══════════════════════════════════════════════════════════
// 2. LIFF 設定
// ═══════════════════════════════════════════════════════════
export const LIFF_URL = "https://liff.line.me/2009129136-lUm2n85A";
export const LIFF_TAGS = new Set(["n21"]);

// ═══════════════════════════════════════════════════════════
// 3. BC 像素（Business Center 統一像素）
// ═══════════════════════════════════════════════════════════
export const BC_PIXEL_ID = "783186198187359";
export const BC_ACCESS_TOKEN = "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD";

// ═══════════════════════════════════════════════════════════
// 4. 子域名 → 產品代碼對應（用於 BC 像素事件前綴）
// ═══════════════════════════════════════════════════════════
export const TAG_PREFIX_MAP = {
  // AS 系列（爆分王）
  js: "AS", cs: "AS", ms: "AS", ls: "AS",
  // AB 系列（莊家剋星）
  jb: "AB", cb: "AB", mb: "AB", lb: "AB",
  // AX 系列（獨角仙）
  jx: "AX", cx: "AX", mx: "AX", lx: "AX",
  // BF 系列（博富）
  bf: "BF", jd: "JD",
  // N 系列（獨立產品）
  n14: "N14", n15: "N15", n16: "N16", n17: "N17",
  n18: "N18", n19: "N19", n20: "N20", n21: "N21", n22: "N22",
};

// ═══════════════════════════════════════════════════════════
// 5. FALLBACK_LINE_MAP（冷啟動備用，Config API 載入前使用）
//    ★ 每次在 Admin 更換 LINE OA 時，必須同步更新這裡
// ═══════════════════════════════════════════════════════════
export const FALLBACK_LINE_MAP = {
  // --- AS 系列（爆分王）---
  "js":   { line: "@935bicyi", name: "爆分王-電子打法秘笈",   who: "J", msg: "我要領取程式", destination: "U94f93d9d3d607c1efe2f4154eccbf332" },
  "cs":   { line: "@999hqlmk", name: "爆分王-電子訊號程式",   who: "C", msg: "我要領取程式", destination: "Uba79c3207e5da050001c777c2c5717ca" },
  "ms":   { line: "@001qlmgf", name: "爆分王-電子打法訊號",   who: "M", msg: "我要領取程式", destination: "U7aada3e19a682beaf1d28ecc165b73c6" },
  "ls":   { line: "@849rldxt", name: "爆分王-24H訊號打法",    who: "L", msg: "我要領取程式", destination: "U09f2161774085c17f2bfe57ef37effb6" },

  // --- AB 系列（莊家剋星）---
  "jb":   { line: "@448nzdkf", name: "莊家剋星-百家專家",     who: "J", msg: "我要領取程式", destination: "Ua4b409d9374fcf2a2edeb474983cf3a8" },
  "cb":   { line: "@bn56",     name: "莊家剋星-百家殺手",     who: "C", msg: "我要領取程式", destination: "U9eb938b30e48e102e36eff24696832da" },
  "mb":   { line: "@734xzzse", name: "莊家剋星-百家打莊姬",   who: "M", msg: "我要領取程式", destination: "U0b8cc70ffd50f1644e67d0a6487b0c54" },
  "lb":   { line: "@bn58",     name: "莊家剋星-百家GPT",      who: "L", msg: "我要領取程式", destination: "Uf14f0347a9cc140e441ab83e22847efe" },

  // --- AX 系列（獨角仙）---
  "jx":   { line: "@652ahjmy", name: "獨角仙AI算牌程式",      who: "J", msg: "我要領取程式", destination: "Ufc7b06eedb75a1fb69a56265f235448e" },
  "cx":   { line: "@697jsdma", name: "獨角仙AI算牌系統",      who: "C", msg: "我要領取程式", destination: "U5717d3ae4604d92bb02671b4323f73ef" },
  "mx":   { line: "@525euwsy", name: "獨角仙AI預測系統",      who: "M", msg: "我要領取程式", destination: "Ufef3e77c05a8aa7ecd1d0cce796c3f8c" },
  "lx":   { line: "@128hxyvp", name: "獨角仙AI預測程式",      who: "L", msg: "我要領取程式", destination: "Udc2caab6aa6751d207a8369abc71564f" },

  // --- BF 系列（博富）---
  "bf":   { line: "@678eohsd", name: "博富 BOFU",             who: "-", msg: "我要開版", destination: "U0cdeed609619a3ea8f8027b01d216f0f" },
  "jd":   { line: "@520ufhmw", name: "兩斤炭吉",             who: "J", msg: "我想了解", destination: "U6400f19a0d56f688b4997c2fffebb7c4" },

  // --- N 系列（獨立產品）---
  "n14":  { line: "@416nbqjl", name: "洪金豹",               who: "M", msg: "我想了解", destination: "U0d18d0ef85a7200968002ad98333feda" },
  "n15":  { line: "@745jaffa", name: "N15",                   who: "J", msg: "我想了解", destination: "U454703dd1ed39d71332747a69a134556" },
  "n16":  { line: "@751tggmd", name: "N16",                   who: "-", msg: "我想了解", destination: "U7a4a33ecbcf38fa50d2d0727ea12ec8a" },
  "n17":  { line: "@106tndmh", name: "N17",                   who: "C", msg: "我想了解", destination: "U3e09fe40176b71674bf5eae8e77a9d2e" },
  "n18":  { line: "@013rgbjl", name: "電子蕭甘丹",           who: "C", msg: "我想了解", destination: "Ud4569f5351c03a556e19729a8a3c2711" },
  "n19":  { line: "@536uhfpf", name: "N19",                   who: "J", msg: "我想了解", destination: "U9aa3a89e3ea6a0af910290e941a1c47d" },
  "n20":  { line: "@348ikfwm", name: "蘇主金",               who: "L", msg: "我想了解", destination: "U822bb6807f10db0ec822086078a45fb4" },
  "n21":  { line: "@075cocov", name: "武狀元",               who: "M", msg: "我想了解", destination: "Uf5fc4eaa9fbbd5fbdd42ed8102abeba4" },
  "n22":  { line: "@659jgxlp", name: "阿奇說球",             who: "J", msg: "我想了解", destination: "Uc3278ae505836cfa1d73547f9bdbde15" },

  // --- 帶數字的舊 ad_code（歷史相容）---
  "js01": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ms01": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ls01": { line: "@017dufwi", name: "金寶01", who: "-" },
  "cs01": { line: "@017dufwi", name: "金寶01", who: "-" },
  "js02": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ms02": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ls02": { line: "@017dufwi", name: "金寶01", who: "-" },
  "cs02": { line: "@017dufwi", name: "金寶01", who: "-" },
  "js03": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ms03": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ls03": { line: "@017dufwi", name: "金寶01", who: "-" },
  "cs03": { line: "@017dufwi", name: "金寶01", who: "-" },
  "js04": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ms04": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ls04": { line: "@017dufwi", name: "金寶01", who: "-" },
  "cs04": { line: "@017dufwi", name: "金寶01", who: "-" },
  "js06": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ms06": { line: "@017dufwi", name: "金寶01", who: "-" },
  "ls06": { line: "@017dufwi", name: "金寶01", who: "-" },
  "cs06": { line: "@017dufwi", name: "金寶01", who: "-" },
};

// ═══════════════════════════════════════════════════════════
// 6. 預設訊息模板
// ═══════════════════════════════════════════════════════════
export const FALLBACK_DEFAULT_MSG = "我要領取專屬優惠 #{token}";

// ═══════════════════════════════════════════════════════════
// 7. CORS headers
// ═══════════════════════════════════════════════════════════
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
