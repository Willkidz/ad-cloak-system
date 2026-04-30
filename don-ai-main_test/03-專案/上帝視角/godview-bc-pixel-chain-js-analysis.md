---
title: "BC 像素鏈 JavaScript (pixel-chain.js) 邏輯分析"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "深度解析 godview-bc-pixel-chain.js 的四階段執行邏輯：(1) 動態像素注入（根據 URL pixel_id 參數載入 Meta SDK）、(2) Cookie 讀取（_fbc/_fbp，不存在時生成臨時標識）、(3) 事件攔截（監聽 data-track 屬性按鈕，阻止默認跳轉）、(4) URL 重組（附加追蹤參數後 window.location.href 跳轉），以及跨域 Cookie 限制與異步加載的技術特性。"
id: "20260328-godview-pixel-js-analysis"
type: analysis
tags: [godview, javascript, pixel]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: `godview-bc-pixel-chain.js`（簡稱 `pixel-chain.js`）是上帝視角前端追蹤的核心腳本，部署於火鳥落地頁。其執行分為四個階段：(1) **動態像素注入**：從 URL 參數中解析 `pixel_id`，動態創建 `<script>` 標籤載入 Meta 官方 Pixel SDK（`fbevents.js`），實現無需硬編碼即可管理多個 Pixel；(2) **Cookie 讀取**：從瀏覽器提取 `_fbc`（Facebook Click ID）與 `_fbp`（Facebook Browser ID），若 Cookie 不存在則生成臨時標識符作為備用；(3) **事件攔截**：監聽所有帶有 `data-track` HTML 屬性的按鈕點擊事件，透過 `event.preventDefault()` 阻止默認跳轉行為；(4) **URL 重組**：將 `ad_code`、`fbclid`、`_fbc`、`_fbp` 等參數附加至目標 URL 後，執行 `window.location.href` 跳轉至 `freshpathlab.com` Worker。腳本採用異步加載，不阻塞頁面首屏渲染。主要限制為受瀏覽器同源策略約束，無法讀取第三方域名的 Cookie。

# BC 像素鏈 JavaScript (pixel-chain.js) 邏輯分析

## 腳本定位

`godview-bc-pixel-chain.js` 是「上帝視角」前端追蹤體系的核心組件。它透過火鳥後台的「自定義 JavaScript」功能注入至落地頁，在不修改落地頁源碼的前提下，實現了 Meta Pixel 動態管理、用戶行為攔截與歸因參數傳遞三大功能。

---

## 四階段執行邏輯

<step id="js-step-1">

**第一階段：動態像素注入**

腳本啟動時，從當前頁面 URL 的查詢參數中解析 `pixel_id`。取得 Pixel ID 後，動態創建一個 `<script>` 標籤，將其 `src` 指向 Meta 官方的 Pixel SDK（`https://connect.facebook.net/en_US/fbevents.js`），並以解析到的 `pixel_id` 呼叫 `fbq('init', pixel_id)`。

這種「動態注入」設計的核心優勢在於：同一份腳本可以服務於不同的廣告帳號，只需在 URL 中傳入不同的 `pixel_id` 即可，無需為每個帳號維護獨立的腳本版本。

</step>

<step id="js-step-2">

**第二階段：Cookie 讀取**

腳本嘗試從瀏覽器的第一方 Cookie 中讀取以下兩個 Meta 設置的值：

| Cookie 名稱 | 用途 | 備用策略 |
| :--- | :--- | :--- |
| `_fbc` | Facebook Click ID，記錄廣告點擊來源 | 若不存在，嘗試從 URL 的 `fbclid` 參數構造 |
| `_fbp` | Facebook Browser ID，標識瀏覽器實例 | 若不存在，生成格式為 `fb.1.{timestamp}.{random}` 的臨時標識 |

</step>

<step id="js-step-3">

**第三階段：事件攔截**

腳本使用 `document.querySelectorAll('[data-track]')` 選取所有帶有 `data-track` HTML 屬性的按鈕元素，並為每個按鈕綁定 `click` 事件監聯器。當用戶點擊時：

1. 呼叫 `event.preventDefault()` 阻止瀏覽器的默認跳轉行為。
2. 觸發 `fbq('track', 'Lead')` 向 Meta Pixel 發送一個 Lead 事件（前端像素事件）。
3. 同時向 Worker 的 `/bc-event` 路由發送一個 GET 請求，記錄 BC 層級的 Lead 事件。
4. 進入第四階段的 URL 重組與跳轉。

</step>

<step id="js-step-4">

**第四階段：URL 重組與跳轉**

腳本將以下參數附加至按鈕原始的目標 URL（即 `https://{tag}.freshpathlab.com/?a={code}`）：

- `fbclid`：從原始 URL 參數中提取。
- `_fbc`：從 Cookie 或備用策略中取得。
- `_fbp`：從 Cookie 或備用策略中取得。

重組完成後，執行 `window.location.href = newUrl` 將瀏覽器導向 CF Worker。

</step>

---

## 技術特性與限制

| 特性 | 說明 | 影響 |
| :--- | :--- | :--- |
| **動態注入** | Pixel ID 從 URL 參數動態取得，無需硬編碼 | 極高的靈活性，支援多帳號管理 |
| **異步加載** | 腳本以 `async` 方式載入，不阻塞頁面渲染 | 用戶體驗良好，但可能導致腳本在按鈕點擊時尚未就緒 |
| **跨域限制** | 受瀏覽器同源策略約束 | 無法讀取火鳥域名以外的 Cookie（如 `freshpathlab.com` 的 Cookie） |
| **預加載風險** | Android 瀏覽器預加載可能觸發非真實點擊 | 需加入 `event.isTrusted` 校驗（參見 [`godview-bc-events-0321.md`](../../09-歸檔/03-專案/上帝視角/godview-bc-events-0321.md)） |

---

## 結論

`pixel-chain.js` 的設計精巧，有效解決了「在第三方落地頁上管理多個 Meta Pixel 並傳遞歸因參數」的核心問題。後續建議加入「執行日誌回傳」功能（透過 `/bc-event` 路由的 POST 方法），以便在前端腳本出錯時能及時感知，而非等到偵測率下降才被動發現。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`firebird-domain-page-notes.md`](firebird-domain-page-notes.md) | 火鳥落地頁整合筆記，腳本的部署環境 |
| [`godview-bc-pixel-events.md`](godview-bc-pixel-events.md) | BC 像素事件定義，腳本觸發的事件規範 |
| [`godview-bc-events-0321.md`](../../09-歸檔/03-專案/上帝視角/godview-bc-events-0321.md) | 壓力測試日誌，記錄 Android 預加載問題（已歸檔） |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | Worker 中繼站邏輯，腳本跳轉後的下一環節 |
