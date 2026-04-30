---
title: "廣告追蹤數據全鏈路分析報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "審計上帝視角系統的數據流轉全鏈路（落地頁 JS 採集 → CF Worker 中繼 → D1 持久化 → n8n 歸因 → Google Sheets 展示），定義偵測率計算邏輯（系統抓取/實際添加×100%），並規範 Google Sheets 關鍵區域（A2:H2、D4:D7 等）的讀寫路徑。"
id: "20260328-godview-data-analysis"
type: analysis
tags: [attribution, cloaking, data-collection, godview, google-sheets, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告對上帝視角系統的數據流轉進行了全鏈路審計。數據從落地頁 `landing_page_script.js` 採集 `fbclid`/`ad_code`/用戶指紋開始，經 CF Worker 中繼存入 D1 `clicks` 表，再由 n8n 結合 LINE Webhook 的 `follow` 事件進行時間歸因，最終透過 Google Sheets API 將彙總數據寫入「成效」工作表。核心指標「偵測率」的計算公式為 `(系統抓取 / 實際添加) × 100%`，其中「系統抓取」來自 n8n 自動歸因的添加人數，「實際添加」來自 LINE OA 後台的真實數據。報告特別強調 Google Sheets 的 `A2:H2`、`D4:D7` 等區域為 n8n 的讀寫目標，修改 Sheets 結構前必須確認不會破壞這些路徑。

# 廣告追蹤數據全鏈路分析報告

## 數據流轉模型

上帝視角系統的數據流轉遵循「**採集 → 中繼 → 處理 → 展示**」的四階段模型。每個階段都有明確的技術組件負責，數據在各階段之間以結構化的方式傳遞。理解這個模型是排查數據丟失問題的基礎。

---

## 四階段數據節點

<step id="data-step-1">

**第一階段：前端採集**

`landing_page_script.js` 在火鳥落地頁載入時執行，負責採集以下數據：
- `ad_code`：從 URL 參數 `a` 中提取。
- `fbclid`：從 URL 參數中提取（Facebook 自動附加）。
- `_fbc` / `_fbp`：從瀏覽器 Cookie 中讀取（Facebook Pixel 設置的第一方 Cookie）。

這些數據被附加至按鈕的跳轉 URL，傳遞給下一階段。

</step>

<step id="data-step-2">

**第二階段：中繼存儲**

CF Worker（`line-redirect`）接收帶有上述參數的請求後，生成唯一 `click_id`，並將所有採集到的數據（含 IP 位址、User-Agent）非同步 POST 至 n8n 的 `/webhook/click-tracking` 端點。n8n 將數據寫入 D1 資料庫的 `clicks` 表。此階段完成了從「瀏覽器端臨時數據」到「伺服器端持久化數據」的轉換。

</step>

<step id="data-step-3">

**第三階段：後端歸因**

n8n 的 `上帝視角_Time Attribution` Workflow（ID: `dqbdnCN3xdJAahYQ`）在收到 LINE `follow` 事件後，以 `destination`（LINE OA ID）和 45 秒時間窗口為條件，查詢 D1 `clicks` 表中最近的未匹配點擊記錄。匹配成功後，系統計算各 `ad_code` 的轉化數，並透過 Meta CAPI 回傳 `CompleteRegistration` 事件。

</step>

<step id="data-step-4">

**第四階段：前端展示**

n8n 的 `上帝視角_CAPI Health Check` Workflow（ID: `uQFTrGvbMHY1TYUX`）每小時執行一次，統計各 `tag` 的 click 與 matched 數量，按產品線（爆分王、莊家剋星、獨角仙、博富、N系列）分組後推送至 Telegram。歷史數據則透過 Google Sheets API 寫入「成效」工作表。

</step>

---

## 數據鏈路關鍵指標

| 指標 | 數據來源 | 計算邏輯 | 說明 |
| :--- | :--- | :--- | :--- |
| **區間消耗** | Google Sheets（手動輸入） | 根據日期範圍對各 `code` 的廣告花費進行 SUM 運算 | 由投手手動填入 |
| **系統抓取** | D1 `clicks`（自動） | 歸因成功（`matched = 1`）的添加人數總計 | n8n 自動統計 |
| **實際添加** | LINE OA 後台（手動） | LINE 官方帳號後台顯示的真實好友增加數 | 作為校準基準 |
| **偵測率** | 混合計算 | `(系統抓取 / 實際添加) × 100%` | 衡量歸因系統的覆蓋率 |

<boundaries id="detection-rate-limits">

偵測率低於 80% 時，應優先排查以下原因：

1. **時間窗口過短**：用戶從點擊到加好友的時間超過 45 秒（如網路慢、猶豫等）。
2. **腳本未載入**：火鳥落地頁的 `landing_page_script.js` 未正確執行，導致 `ad_code` 未傳遞。
3. **Worker 異常**：CF Worker 未成功將點擊事件 POST 至 n8n。
4. **自然流量**：用戶未經廣告直接搜尋加好友，不在歸因範圍內。

</boundaries>

---

## Google Sheets 讀寫路徑規範

<rule id="sheets-rw-paths">

n8n 透過 Google Sheets API 讀寫以下關鍵區域。修改 Sheets 結構（如插入/刪除欄位、移動工作表）前，**必須**確認不會破壞這些路徑：

| 工作表 | 區域 | 用途 | 操作方式 |
| :--- | :--- | :--- | :--- |
| 成效 | `A2:H2` | 寫入各 code 的每日彙總數據 | n8n 自動寫入 |
| 成效 | `D4:D7` | 讀取偵測率計算的基準值 | n8n 自動讀取 |
| 消耗 | 手動區域 | 投手填入各 code 的廣告花費 | 人工手動 |

</rule>

---

## 結論

數據鏈路的透明化是系統維護的基礎。團隊成員在修改任何環節時，都應意識到數據在上下游的依賴關係。特別是 Google Sheets 的結構變更，由於 n8n 使用固定的儲存格範圍進行讀寫，任何欄位位移都可能導致數據寫入錯誤位置或讀取到空值。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱，定義各組件職責 |
| [`godview-gsheets-ad-tracking-spec.md`](godview-gsheets-ad-tracking-spec.md) | Google Sheets 各分頁功能詳細說明 |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 完整清單與觸發方式 |
| [`godview-time-attr-spec.md`](godview-time-attr-spec.md) | 時間歸因方案設計與 D1 表結構 |
