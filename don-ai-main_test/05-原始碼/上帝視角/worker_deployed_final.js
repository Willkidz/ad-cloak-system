var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// config.js
var CONFIG_API_URL = "https://godview.app.n8n.cloud/webhook/get-config";
var N8N_WEBHOOK_TOKEN = "https://godview.app.n8n.cloud/webhook/token-mapping-v2";
var CACHE_TTL = 30 * 60 * 1e3;
var LIFF_URL = "https://liff.line.me/2009129136-lUm2n85A";
var LIFF_TAGS = /* @__PURE__ */ new Set(["n21"]);
// BC_PIXEL_ID 和 BC_ACCESS_TOKEN 現在從 config 動態讀取
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
var BOT_UA_PATTERN = /bot|crawl|spider|facebookexternalhit|python-requests|telegrambot|curl|wget/i;
var FALLBACK_LINE_MAP = {
  // --- AS 系列（爆分王）---
  "js": { line: "@935bicyi", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u79D8\u7B08", who: "J", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U94f93d9d3d607c1efe2f4154eccbf332" },
  "cs": { line: "@999hqlmk", name: "\u7206\u5206\u738B-\u96FB\u5B50\u8A0A\u865F\u7A0B\u5F0F", who: "C", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Uba79c3207e5da050001c777c2c5717ca" },
  "ms": { line: "@001qlmgf", name: "\u7206\u5206\u738B-\u96FB\u5B50\u6253\u6CD5\u8A0A\u865F", who: "M", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U7aada3e19a682beaf1d28ecc165b73c6" },
  "ls": { line: "@849rldxt", name: "\u7206\u5206\u738B-24H\u8A0A\u865F\u6253\u6CD5", who: "L", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U09f2161774085c17f2bfe57ef37effb6" },
  // --- AB 系列（莊家剋星）---
  "jb": { line: "@448nzdkf", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u5C08\u5BB6", who: "J", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "Ua4b409d9374fcf2a2edeb474983cf3a8" },
  "cb": { line: "@bn56", name: "\u838A\u5BB6\u524B\u661F-\u767E\u5BB6\u6BBA\u624B", who: "C", msg: "\u6211\u8981\u9818\u53D6\u7A0B\u5F0F", destination: "U9eb938b30e48e102e36eff24696832da" },