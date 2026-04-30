---
title: "廣告代碼 (ad_code) 歸因邏輯與傳遞鏈路分析"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "深度解析 ad_code 從 FB 廣告 URL 參數出發，經落地頁 JS 採集、CF Worker 中繼記錄至 D1 clicks 表，最終在 n8n 時間歸因中與 LINE userId 綁定的完整鏈路，以及 ad_code 格式規範（[導向][項目][序號]，如 AS01）。"
id: "20260328-godview-ad-code-analysis"
type: analysis
tags: [advertising, attribution, cloudflare-d1, cloudflare-workers, data-collection, godview]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: `ad_code` 是連接廣告點擊與 LINE 轉化數據的唯一紐帶。其完整傳遞路徑為：FB 廣告 URL 的 `a` 參數 → 落地頁 `landing_page_script.js` 從 `window.location.search` 提取 → 附加至跳轉 URL → CF Worker 解析並連同 `click_id`、`fbclid`、`fbc`、`fbp` 一起 POST 至 n8n → n8n 寫入 D1 `clicks` 表 → LINE follow 事件觸發時間歸因（45 秒窗口）→ 匹配成功後 `ad_code` 用於查詢 `ad_config` 取得對應的 Pixel ID 與 CAPI Token → 回傳 Meta CAPI `CompleteRegistration` 事件。格式規範為 `[導向][項目][序號]`（如 `AS01`），大寫字母，同項目下必須唯一。

# 廣告代碼 (ad_code) 歸因邏輯與傳遞鏈路分析

## 歸因核心概念

`ad_code` 是整個「上帝視角」歸因系統中最關鍵的標識符。它從廣告投放端一路傳遞至歸因後端，串聯起「哪個廣告帶來了哪個 LINE 好友」的因果關係。一旦 `ad_code` 在任何環節丟失或被篡改，該次轉化將無法正確歸因，直接影響廣告投放的 ROI 計算。

---

## 數據傳遞鏈路 (Data Pipeline)

<step id="code-flow-1">

**1. URL 參數注入**：廣告投手在 FB 廣告後台設定落地頁 URL 時，將 `ad_code` 作為 `a` 參數附加。例如：`https://azmmk.store/page1?a=AS01`。用戶點擊廣告後，瀏覽器帶著此參數抵達火鳥落地頁。

</step>

<step id="code-flow-2">

**2. 落地頁 JS 採集**：`landing_page_script.js` 在頁面載入時執行，從 `window.location.search` 中提取 `a` 參數（即 `ad_code`），同時讀取瀏覽器 Cookie 中的 `_fbc`、`_fbp`，以及 URL 中的 `fbclid`。這些參數被附加至頁面按鈕的跳轉 URL。

</step>

<step id="code-flow-3">

**3. CF Worker 記錄**：用戶點擊「加好友」按鈕後，瀏覽器跳轉至 `https://{tag}.freshpathlab.com/?a={code}`。CF Worker（`line-redirect`）接收請求後，生成唯一 `click_id`，並將 `ad_code`、`fbclid`、`fbc`、`fbp`、IP、User-Agent、`line_oa_id` 等資訊非同步 POST 至 n8n 的 `/webhook/click-tracking` 端點。同時，Worker 回傳 302 重定向至 `https://line.me/R/ti/p/{line_oa_id}`。

</step>

<step id="code-flow-4">

**4. n8n 持久化**：n8n 的 `上帝視角_Click Tracking` Workflow 接收到點擊事件後，將完整資料寫入 D1 資料庫的 `clicks` 表，`matched` 欄位初始值為 `0`。

</step>

<step id="code-flow-5">

**5. 時間歸因匹配**：當用戶在 LINE 中加好友時，LINE Platform 發送 `follow` 事件至 n8n 的 `/webhook/line-follow`。n8n 的 `上帝視角_Time Attribution` Workflow 根據 `destination`（LINE OA ID）與 45 秒時間窗口，在 `clicks` 表中查詢最近的未匹配點擊。匹配成功後，`ad_code` 被用於查詢 `ad_config` 表，取得對應的 Pixel ID 與 CAPI Token，回傳 Meta CAPI 的 `CompleteRegistration` 事件。

</step>

---

## 格式規範與校驗

<rule id="ad-code-format">

`ad_code` 的命名必須遵循以下規範，以確保自動化報表能正確解析與分組：

| 規則 | 說明 | 範例 |
| :--- | :--- | :--- |
| **格式** | `[導向][項目][序號]` | `AS01`、`BK03` |
| **大小寫** | 統一使用大寫字母 | `AS01`（正確）、`as01`（錯誤） |
| **唯一性** | 同一項目下每個 `ad_code` 必須唯一 | — |
| **導向** | 代表流量導向的目標（如 A = LINE OA A） | — |
| **項目** | 代表產品線或素材類型 | — |
| **序號** | 兩位數字，從 01 開始遞增 | — |

</rule>

---

## 結論

`ad_code` 的準確傳遞是整個歸因系統的基石。在廣告上線前，建議使用以下方式驗證歸因鏈路的完整性：

1. 在瀏覽器中模擬點擊落地頁按鈕，確認跳轉 URL 包含正確的 `a` 參數。
2. 檢查 D1 `clicks` 表中是否正確記錄了該 `ad_code`。
3. 確認 `ad_config` 表中存在該 `ad_code` 對應的 Pixel ID 與 CAPI Token 配置。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-code-link-design-spec.md`](godview-code-link-design-spec.md) | 鏈結設計規範，定義 `{tag}` 與 `{code}` 的完整命名體系 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱，定義各組件在歸因流程中的職責 |
| [`godview-time-attr-spec.md`](godview-time-attr-spec.md) | 時間歸因方案設計，定義 `clicks` 表結構與匹配邏輯 |
| [`godview-mapping-spec.md`](godview-mapping-spec.md) | `ad_code` 與 Meta Pixel/CAPI Token 的映射規範 |
