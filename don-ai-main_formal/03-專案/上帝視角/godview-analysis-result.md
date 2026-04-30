---
title: "上帝視角系統分析結果報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "彙整上帝視角系統的深度分析結果：CF Worker 響應 <50ms、歸因匹配率約 94%，但存在跨 App 瀏覽器 Cookie 丟失（_fbc 缺失）、n8n Webhook 高峰期堆積、D1 clicks 表缺乏索引等三大瓶頸，並提出 URL Fragment 備份、Cloudflare Queues 解耦、D1 索引優化等改善方案。"
id: "20260328-godview-analysis-result"
type: analysis
tags: [analysis, attribution, cloudflare-d1, cloudflare-workers, godview, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告總結了上帝視角系統的端到端分析結果。**表現亮點**：CF Worker 響應時間穩定在 50ms 以下，正常情況下歸因匹配率約 94.2%（參見 `godview-current-status.md` 的 24 小時指標）。**三大瓶頸**：(1) 從 FB 內建瀏覽器跳轉至 LINE 時，第三方 Cookie（`_fbc`）可能被清除，導致 CAPI 回傳缺少 `fbc` 參數；(2) 廣告高峰期（每日 20:00-23:00）n8n Webhook 隊列堆積，影響歸因的即時性；(3) D1 `clicks` 表隨數據量增長，未建索引的查詢（特別是時間歸因的 `WHERE timestamp >= datetime('now', '-45 seconds')` ）效能下降。**優化方案**：落地頁腳本加入 URL Fragment 備份機制、引入 Cloudflare Queues 緩衝 n8n 處理壓力、為 `clicks` 的 `line_oa_id` + `timestamp` + `matched` 建立複合索引。

# 上帝視角系統分析結果報告

## 系統表現評估

經過端到端的壓力測試與數據比對，系統各維度的表現如下：

| 維度 | 現狀描述 | 評分 | 具體數據 |
| :--- | :--- | :--- | :--- |
| **歸因精準度** | 正常情況下匹配率高 | ★★★★☆ | 約 94.2%，跨 App 跳轉時偶有丟失 |
| **系統延遲** | CF Worker 響應極快 | ★★★★★ | < 50ms（Worker 端），CAPI 延遲約 1.2s |
| **數據一致性** | D1 與 Sheets 數據基本同步 | ★★★★☆ | 需注意 n8n 寫入衝突與 Sheets 結構變更 |
| **容錯能力** | 具備基礎參數備份機制 | ★★★☆☆ | 異常處理邏輯待加強，錯誤率約 2.1% |

---

## 識別的瓶頸與風險

<boundaries id="bottleneck-analysis">

### 瓶頸一：跨瀏覽器 Cookie 丟失

部分用戶在從 FB 內建瀏覽器（WebView）跳轉至 LINE 時，瀏覽器環境切換導致 Cookie 被清除。具體影響：

- `_fbc`（Facebook Click ID Cookie）丟失率最高，因為它依賴第一方 Cookie 存儲。
- `_fbp`（Facebook Pixel Cookie）同樣受影響，但由於 `fbclid` 作為 URL 參數傳遞，不受 Cookie 限制。
- 後果：CAPI 回傳時缺少 `fbc` 參數，降低 Meta 的事件匹配品質分數（Event Match Quality）。

### 瓶頸二：n8n Webhook 高峰期堆積

廣告高峰期（每日 20:00-23:00），大量 LINE `follow` 事件同時觸發 n8n 的 Time Attribution Workflow。n8n 的單線程處理模型導致 Webhook 隊列堆積，部分歸因請求的處理延遲超過 45 秒的時間窗口，造成歸因失敗。

### 瓶頸三：D1 查詢效能下降

隨著 `clicks` 表數據量持續增長，時間歸因的核心查詢（`WHERE line_oa_id = ? AND timestamp >= datetime('now', '-45 seconds') AND matched = 0`）在無索引的情況下需要全表掃描，查詢時間從初期的 < 10ms 逐漸上升。

</boundaries>

---

## 優化建議

<step id="opt-action-1">

**1. 落地頁腳本升級**：在 `landing_page_script.js` 中加入 URL Fragment（`#` 後的參數）備份機制。當 Cookie 不可用時，將 `_fbc`/`_fbp` 的值編碼至 URL Fragment 中傳遞，確保跨瀏覽器跳轉時參數不丟失。

</step>

<step id="opt-action-2">

**2. 架構解耦（中期）**：引入 Cloudflare Queues 作為 n8n 前的消息緩衝層。Worker 將點擊事件推入 Queue，n8n 以可控的速率消費，避免高峰期的 Webhook 堆積問題。

</step>

<step id="opt-action-3">

**3. D1 索引優化（立即）**：為 `clicks` 表建立複合索引，覆蓋時間歸因查詢的所有條件欄位：

```sql
CREATE INDEX idx_clicks_attribution 
ON clicks (line_oa_id, timestamp, matched);
```

</step>

---

## 結論

「上帝視角」系統已具備大規模投放的基礎能力，CF Worker 的邊緣計算優勢使得前端響應極為迅速。後續應重點關注「歸因穩定性」（解決 Cookie 丟失與高峰期堆積）與「系統擴展性」（D1 索引與架構解耦），目標是將歸因成功率從目前的 94% 提升至 99% 的商用級水平。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱，定義各組件職責 |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 故障診斷指南，排查歸因異常 |
| [`godview-current-status.md`](godview-current-status.md) | 系統即時狀態報告（24 小時指標） |
| [`godview-attr-data-analysis.md`](godview-attr-data-analysis.md) | 歸因數據多維度分析 |
