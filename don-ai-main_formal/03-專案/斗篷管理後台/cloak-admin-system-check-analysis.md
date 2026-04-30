---
title: "系統修改與驗證報告：TDZ 錯誤、fbclid 歸因與 Time Attribution 優化"
category: project
priority: critical
applicable_tools: all
last_updated: "2026-03-29"
summary: "修復 Cloudflare Worker 中的兩個重大 BUG (TDZ 導致的 ReferenceError 與 fbclid 參數遺漏)，並調整 Time Attribution workflow 以提升 BC 像素數據追蹤準確度。"
version: "v1.0"
id: "20260325-system-check-analysis"
type: analysis
tags: [attribution, capi, cloak-admin, cloudflare-workers, n8n, troubleshooting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告詳述了對 Cloudflare Worker 與 N8N Time Attribution workflow 的重大修復。核心修復：(1) 解決 `/bc-event` 端點因 `BC_PIXEL` 變數在宣告前被調用（TDZ 錯誤）導致的 `ReferenceError`，恢復了 PageView 與 Contact 事件的發送；(2) 增加對 `fbclid` 參數的讀取並自動轉換為標準 `fbc` 格式，解決了 Meta CAPI 歸因資訊丟失問題。架構優化：將 BC 像素加入 D1 `pixels` 陣列，並將 `Lead` 事件發送邏輯從 Worker 遷移至 Time Attribution workflow，確保僅在用戶真正完成 Line 加好友後才觸發事件，顯著提升了數據準確度。

# 系統修改與驗證報告

本報告詳述 Cloudflare Worker 代碼、Time Attribution workflow 的分析與修改，以及落地頁 JS 的邏輯驗證。主要目標是修復重大 BUG，並提升數據追蹤的準確性。

---

## 一、重大 BUG 與修復方案

在代碼分析過程中，發現兩個會導致 BC 像素數據丟失的重大 BUG。

<rule id="tdz-error">
### BUG 1：TDZ 錯誤導致事件丟失

**問題描述**：在原始 Worker 代碼中，`/bc-event` 端點的處理邏輯在 `BC_PIXEL` 變數宣告前就調用了該變數。由於 JavaScript 的 TDZ (Temporal Dead Zone) 特性，此舉會觸發 `ReferenceError`，導致所有 `PageView` 和 `Contact` 事件請求失敗，數據完全丟失。

**修復方案**：調整代碼順序，在 `/bc-event` 路徑處理的開頭提前載入 config 並初始化 `BC_PIXEL` 變數，確保其在被調用時已經可用。
</rule>

<rule id="missing-fbclid">
### BUG 2：忽略 fbclid 參數導致歸因失敗

**問題描述**：落地頁 JS 發送的請求中包含了 `fbclid` 參數，但 Worker 的 `/bc-event` 端點並未讀取此參數，導致發送給 Meta CAPI 的事件缺乏關鍵的點擊歸因資訊。

**修復方案**：在 `/bc-event` 的處理邏輯中增加對 `fbclid` 參數的讀取，並將其轉換為標準的 `fbc` 格式（`fb.1.${Date.now()}.${fbclid}`），與 `handleLineRedirect` 的處理邏輯保持一致。
</rule>

---

## 二、Cloudflare Worker 修改對比

主要進行了三處修改，以修復 BUG 並優化事件發送邏輯。

<step id="worker-fix-tdz-fbclid">
### 1. 修復 TDZ 錯誤並支援 fbclid

此修改解決了 `/bc-event` 端點的變數宣告問題，並增加了對 `fbclid` 的處理。

**修改前**
<example>
```javascript
if (pathname === "/bc-event") {
  if (request.method === "GET") {
    // ...
    const userData = {
      // ...
      fbc: url.searchParams.get("fbc") || "",
      fbp: url.searchParams.get("fbp") || ""
    };
    ctx.waitUntil(sendBcEvent(eventName, productPrefix2, userData, BC_PIXEL));
    // ...
```
</example>

**修改後**
<example>
```javascript
if (pathname === "/bc-event") {
  // [FIX] 修復 TDZ BUG：在 /bc-event 路徑中提前載入 config 以獲取 BC_PIXEL
  if (!cachedConfig) {
    await refreshConfig();
  }
  const bcConfig = getConfigSync();
  const bcPixelForEvent = bcConfig.BC_PIXEL || FALLBACK_BC_PIXEL;
  
  if (request.method === "GET") {
    // ...
    // [FIX] 支援 fbclid 參數，自動轉換為 fbc 格式
    const rawFbclid = url.searchParams.get("fbclid") || "";
    const userData = {
      // ...
      fbc: url.searchParams.get("fbc") || (rawFbclid ? `fb.1.${Date.now()}.${rawFbclid}` : ""),
      fbp: url.searchParams.get("fbp") || ""
    };
    ctx.waitUntil(sendBcEvent(eventName, productPrefix2, userData, bcPixelForEvent));
    // ...
```
</example>
*(註：POST 端點也做了相同的 `fbclid` 支援修改)*
</step>

<step id="worker-add-bc-pixel">
### 2. 將 BC 像素加入 D1 pixels 陣列

為了讓 Time Attribution workflow 能夠回傳 `Lead` 事件給 BC 像素，需要將 BC 像素的資訊加入從 D1 資料庫讀取的 `pixels` 陣列中。

**修改後**
<example>
```javascript
const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];
// ... (masterPixel 邏輯)

// [NEW] 將 BC 像素也加入 pixels 陣列，讓 Time Attribution 能回傳 Lead 給 BC 像素
if (BC_PIXEL && BC_PIXEL.pixel && BC_PIXEL.token) {
  const bcAlreadyExists = adPixels.some((p) => p.pixel === BC_PIXEL.pixel);
  if (!bcAlreadyExists) {
    adPixels.push({ pixel: BC_PIXEL.pixel, token: BC_PIXEL.token, is_bc: true });
  }
}
const pixels = adPixels;
```
</example>
</step>

<step id="worker-remove-lead-event">
### 3. 移除 Worker 中不準確的 Lead 事件發送

原始代碼在用戶點擊連結時就直接發送 `Lead` 事件，數據不準確。此事件應在用戶完成 Line 加好友後，由 Time Attribution workflow 發送。

**修改後**
<example>
```javascript
// [REMOVED] Lead 事件改由 Time Attribution workflow 在用戶真正加好友後回傳
// 不再在點擊時直接發送，避免 Lead 數據不準確
// const productPrefix = getProductPrefix(tag);
// if (productPrefix && !BOT_UA_PATTERN.test(userAgent)) {
//   ctx.waitUntil(sendBcEvent("Lead", productPrefix, {
//     ip: clientIp,
//     ua: userAgent,
//     fbc,
//     fbp
//   }, BC_PIXEL));
// }
```
</example>
</step>

---

## 三、Time Attribution Workflow 修改對比

主要修改 **Prepare CAPI Events** 節點的代碼，以區分處理 BC 像素和官方像素的事件。

<step id="workflow-prepare-capi-events">
### Prepare CAPI Events 節點邏輯修改

在節點代碼中加入了產品前綴邏輯，並根據 `is_bc` 標記決定發送的事件類型。

**核心邏輯修改**
<example>
```javascript
// 引入與 Worker 相同的 TAG_PREFIX_MAP 和 getProductPrefix 函數
const TAG_PREFIX_MAP = { js: "AS", cs: "AS", /* ... */ };
function getProductPrefix(tag) { /* ... */ }

const tag = matchData.tag || '';
const productPrefix = getProductPrefix(tag);

// 在迴圈中區分官方像素和 BC 像素
if (px.is_bc) {
  // BC 像素：發送帶產品前綴的事件（如 AS_Lead）和 ALL_Lead
  const events = [];
  if (productPrefix) {
    events.push({
      event_name: productPrefix + "_Lead",
      // ...
    });
  }
  events.push({
    event_name: "ALL_Lead",
    // ...
  });
  
  results.push({ /* ... is_bc: true ... */ });
} else {
  // 官方像素：發送 event_name = "Lead"（維持不變）
  // ...
}
```
</example>
</step>

---

## 四、落地頁 JS 邏輯驗證結果

對落地頁 JS 進行了完整模擬與驗證，確認其核心邏輯正確，但在與舊版 Worker 互動時存在問題。

- **端點接收**：JS 能正確生成 `/bc-event` 的 PageView 和 Contact 事件 URL。但因舊版 Worker 未讀取 `fbclid`，導致歸因資訊丟失（已在 Worker 端修復）。
- **事件生成**：以 `cs` tag 為例，`getProductPrefix('cs')` 返回 `AS`，Worker 的 `sendBcEvent` 會正確生成 `AS_PageView` + `ALL_PageView` 事件，邏輯正確。
- **`gotolink` 覆寫邏輯**：通過 `Object.defineProperty` 覆寫 `location.href` 的 setter，能成功在跳轉到 `freshpathlab.com` 時自動附加 `fbclid`，確保歸因鏈路完整。
- **點擊事件委派**：使用事件捕獲階段監聽點擊，並向上遍歷 DOM 尋找 `gotolink` 標記，邏輯正確無誤。

---

## 五、結論

本次修改成功修復了兩個導致數據追蹤不準確的重大 BUG，並優化了 Worker 和 Time Attribution workflow 的事件處理邏輯。所有修改均已在本地準備就緒，待確認後即可部署至正式環境，預期將顯著提升 BC 像素的數據準確度。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽（含 N8N 配置） |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構模式 |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
