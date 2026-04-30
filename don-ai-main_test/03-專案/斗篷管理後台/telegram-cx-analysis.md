---
title: "Telegram 開啟 cx.freshpathlab.com/cx01 失敗深度診斷報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "模擬 Telegram 請求鏈路並分析 tag 傳遞缺口，定位 cx01 無法正確開啟的根因。"
version: "v1.0"
---
# Telegram 開啟 cx.freshpathlab.com/cx01 失敗深度診斷報告

## 1. 完整請求流程模擬與分析

當用戶從 Telegram 點擊 `https://cx.freshpathlab.com/cx01` 時，完整的請求鏈路如下：

### 步驟 1：進入 shadow-cloak.js
1. **讀取基本資訊**：`hostname` 為 `cx.freshpathlab.com`，`tag` 首先嘗試從 `url.searchParams.get("tag")` 讀取（這裡為空）。
2. **獲取配置**：系統會從 D1 資料庫查詢對應的 Campaign 配置。因為路徑是 `/cx01`，它會尋找對應的活動設定。
3. **Bot 過濾 (User-Agent 檢查)**：
   - 檢查 `BOT_PATTERNS`。在 `shadow-cloak.js` 第 9-38 行中，**Telegram 並不在封鎖名單中**（之前已經透過 commit `24c619c` 移除了 `/telegram/i` 和 `/line/i`）。
   - 結論：**Telegram 不會被當成 Bot 封鎖。**
4. **檢查通過後跳轉**：
   - 如果配置中有 `targetLink`（優先讀取 `line_links`，其次 `customer_links`），則直接返回一個 HTML 進行跳轉（延遲 50ms）。
   - 如果沒有 `targetLink`，則進入 `money-page` 邏輯。

### 步驟 2：進入 money-page 邏輯
1. 在 `shadow-cloak.js` 第 1108 行，如果沒有 `targetLink` 但有 `money_page_id`，會構建 `mpUrl`：
   `https://money-page.laoqin1689.workers.dev/?t={moneyPageId}&tag={tag}&vid={visitorId}&fbclid=...`
   **⚠️ 關鍵問題點 1**：此時的 `tag` 是什麼？
   - 回顧 `shadow-cloak.js` 第 856 行：`let tag = url.searchParams.get("tag") || "";`
   - 對於 `https://cx.freshpathlab.com/cx01` 這個 URL，`searchParams` 中**沒有 tag 參數**。
   - 雖然 `hostname` 包含 `cx`，但 `shadow-cloak.js` **並沒有從 hostname 中提取 tag**！
   - 因此，傳給 `money-page` 的 `tag` 參數是**空字串**。

### 步驟 3：money-page.js 處理
1. 在 `money-page.js` 第 10 行：
   `const adTag = request.headers.get('x-ad-tag') || url.searchParams.get('tag') || 'js';`
   因為 `shadow-cloak` 傳來的 `tag` 是空字串，且沒有設定 `x-ad-tag` header，所以 `adTag` 會 fallback 到預設值 **`js`**。
2. 構建 CTA URL（第 18 行）：
   `let ctaBase = 'https://freshpathlab.com/go?tag=' + adTag;`
   結果變成：`https://freshpathlab.com/go?tag=js&vid=...`
   **⚠️ 關鍵問題點 2**：CTA URL 的 tag 變成了錯誤的 `js`（爆分王），而不是正確的 `cx`（財神爺）。

### 步驟 4：點擊 CTA 進入 line-redirect.js
1. 用戶點擊按鈕，請求 `https://freshpathlab.com/go?tag=js&vid=...`。
2. 進入 `line-redirect.js`：
   - 讀取 tag（第 362-363 行）：
     ```javascript
     const hostname = url.hostname; // freshpathlab.com
     const tag = hostname.split(".")[0]; // freshpathlab
     ```
   - **⚠️ 關鍵問題點 3**：`line-redirect.js` 是從 `hostname` 的第一個部分提取 tag。對於 `freshpathlab.com`，提取出來的 tag 是 `freshpathlab`，而不是 `cx` 或 `js`。
   - 檢查 `LIFF_TAGS`（第 557 行）：`LIFF_TAGS.has("freshpathlab")` 結果為 **false**。
   - 執行 fallback 邏輯（第 585-588 行）：直接跳轉到 LINE OA，不走 LIFF。
     ```javascript
     const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;
     return Response.redirect(lineUrl, 302);
     ```
   - **⚠️ 關鍵問題點 4**：因為 tag 解析錯誤，系統根本找不到對應的 `lineInfo`，或者使用了預設的 fallback。更糟的是，這是一個純 `line.me` 跳轉，**完全沒有經過 LIFF，導致無法綁定 `vid`**。

## 2. 為什麼「之前可以，現在不行」？

最近我們對系統做了幾個重大修改（見 Git 歷史）：
1. **動態 LIFF_MAP 導入** (commit `6f9bc1c`)：`line-redirect` 現在依賴正確的 `tag` 來選擇 LIFF ID。
2. **LIFF 參數補齊** (commit `ac35ec9`)：修復了 `liff_id` 和 `vid` 傳遞。

**根本原因**：
過去，所有的流量可能都使用預設的單一 LIFF 應用，或者依賴於某種預設的跳轉行為。現在系統升級為「多 TAG 對應多 LIFF」，對 `tag` 參數的準確性要求變得極高。

目前的系統存在**嚴重的參數傳遞斷層**：
1. `shadow-cloak` 沒有從 hostname 解析 tag 傳給 `money-page`。
2. `money-page` 生成了固定 domain (`freshpathlab.com`) 的 CTA URL。
3. `line-redirect` 期望從 hostname 解析 tag，但收到的卻是 `freshpathlab.com`。

## 3. 修復方案

要徹底解決這個問題，必須修復整個鏈路中的 tag 傳遞機制。

### 修復 1：shadow-cloak.js
必須從 `hostname` 解析出 tag，並傳遞給 `money-page`。
```javascript
// 修改前
let tag = url.searchParams.get("tag") || "";

// 修改後
let tag = url.searchParams.get("tag") || "";
if (!tag) {
  const parts = hostname.split(".");
  if (parts.length >= 3) { // 例如 cx.freshpathlab.com
    tag = parts[0];
  }
}
```

### 修復 2：money-page.js
CTA URL 的生成方式必須改為使用具體的子網域，而不是固定的 `freshpathlab.com/go`，這樣才能配合 `line-redirect` 的解析邏輯。
```javascript
// 修改前
let ctaBase = 'https://freshpathlab.com/go?tag=' + adTag;

// 修改後
let ctaBase = `https://${adTag}.freshpathlab.com/go?tag=` + adTag;
```

### 修復 3：line-redirect.js
雖然 `line-redirect` 從 hostname 讀取 tag 的邏輯（`hostname.split(".")[0]`）在子網域（如 `cx.freshpathlab.com`）時是正確的，但為了增加容錯性，應該優先從 query string 讀取 tag，或者兩者結合。
```javascript
// 修改前
const hostname = url.hostname;
const tag = hostname.split(".")[0];

// 修改後
const hostname = url.hostname;
let tag = url.searchParams.get("tag");
if (!tag) {
  tag = hostname.split(".")[0];
}
```

實施這三個修復後，無論是 Telegram 還是 Facebook 的流量，都能保證 `tag` 參數從入口一路正確傳遞到 LIFF 跳轉，確保綁定成功。
