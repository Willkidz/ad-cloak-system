---
title: "line-redirect Worker 現有程式碼分析"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析現有的 line-redirect Worker 程式碼邏輯，並規劃為了實現「時間歸因」方案所需進行的 4 項核心修改。"
id: "20260318-worker-analysis"
type: "analysis"
tags: [analysis, attribution, cloaking, cloudflare-workers, godview, n8n]
status: "active"
created: "2026-03-18"
updated: "2026-03-28"
---

> **TL;DR**: 本分析旨在為「時間歸因」方案提供技術路徑。現有 Worker 流程依賴 5 碼隨機 `token` 並跳轉至 `oaMessage` 訊息頁面。為升級至時間歸因，需執行 4 項修改：(1) 移除 `token` 生成與訊息嵌入機制；(2) 將 `token_mapping` Webhook 轉型為純粹的點擊事件記錄器；(3) 跳轉目標從訊息頁面改為直接加好友頁面 (`/ti/p/{id}`)；(4) 確保點擊日誌包含 `tag`, `destination`, `ad_code`, `fbclid` 等 9 項關鍵維度。此修改將歸因重心從「用戶發送 Token」轉移至「點擊與關注的時間差匹配」。

# line-redirect Worker 現有程式碼分析

本文旨在分析現有的 `line-redirect` Cloudflare Worker 腳本的核心流程，並根據新的時間歸因方案，提出需要修改的部分。

---

## 核心流程

<step id="worker-current-flow">

1.  **提取 Tag**：從請求的 `hostname` 中提取 `tag`（例如，從 `n21.freshpathlab.com` 提取出 `n21`）。
2.  **獲取配置**：向 Config API 請求 `LINE_MAP`、`AD_MAP` 和 `MASTER_PIXEL_MAP` 等設定檔。
3.  **生成 Token**：生成一個 5 位數的隨機 `token` 用於點擊追蹤。
4.  **發送 Webhook**：將包含 `tag`、`line_id`、`ad_code`、各種廣告點擊 ID（`fbclid`, `fbc`, `fbp`）、使用者資訊（IP, User-Agent）及時間戳的 `token_mapping` 資料 POST 到 n8n webhook。
5.  **執行跳轉**：將使用者 302 重定向到 LINE OA 的訊息發送頁面 `line.me/R/oaMessage/{lineId}/?{messageText}`，其中 `messageText` 包含先前生成的 `token`。
6.  **LIFF 處理**：對於設定了 `LIFF_TAGS` 的特定 `tag`（如 `n21`），則會導向 LIFF 中間頁進行後續處理。

</step>

---

## 時間歸因方案修改建議

為了實現更精準的時間歸因，現有流程需要進行以下調整：

<step id="worker-rebuild-steps">

1.  **移除 token 訊息機制**：不再於最終跳轉的 `messageText` 中嵌入 `token`，以簡化流程並降低用戶操作門檻。
2.  **保留 token_mapping POST**：此步驟將被保留，但其用途轉變為記錄點擊事件，不再與 `token` 綁定。
3.  **更改跳轉 URL**：目標 URL 從發送訊息頁面 `line.me/R/oaMessage/{lineId}/?{msg}` 更改為直接加好友的頁面 `line.me/R/ti/p/{lineId}`。
4.  **新增 click_log 記錄**：需要建立一個新的日誌系統，專門記錄點擊事件的詳細資料。

</step>

<rule id="click-log-dimensions">
**點擊日誌必須包含以下維度：**
`{tag, line_oa_id(destination), ad_code, IP, UA, fbclid, fbc, fbp, timestamp}`
</rule>

---

## 關鍵 API 端點

| 名稱 | URL | 用途 |
| :--- | :--- | :--- |
| **Config API** | `GET https://godview.app.n8n.cloud/webhook/get-config` | 獲取 LINE 與廣告配置 |
| **Token Mapping** | `POST https://godview.app.n8n.cloud/webhook/token-mapping` | 記錄點擊事件 (舊稱 Token Mapping) |
| **LINE Follow** | `POST https://godview.app.n8n.cloud/webhook/line-follow` | 接收 LINE 關注事件 |

---

## n8n Token Attribution System 節點

目前的 n8n 工作流程中，與歸因系統相關的節點如下：

- **LINE Add Friend Event** (webhook: `line-follow`)
- **Token Mapping Webhook** (webhook: `token-mapping`)
- **Process Token Data** → **Save Token Mapping**
- **Is Message Event?** → **Extract Token** → **Lookup Token Mapping** → **Match Token Data**
- **Prepare Token CAPI Data** → **Send Token CAPI**
- **Save Follow Event**

---

## 結論

本次修改的核心是將原有的「基於訊息 `token`」的歸因模式，轉變為「基於點擊時間」的歸因模式。這需要修改 Worker 的跳轉邏輯，並調整 n8n 的後端資料處理流程，以適應新的歸因方法。建議將 `priority` 提升為 `high`，因為這項修改對歸因準確性至關重要。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-time-attr-spec.md`](./godview-time-attr-spec.md) | 時間歸因方案完整設計文件 |
| [`godview-worker-code-log.md`](./godview-worker-code-log.md) | Worker 程式碼變更日誌 |
| [`godview-workflow-analysis.md`](./godview-workflow-analysis.md) | n8n 工作流歸因邏輯分析 |
| [`godview-system-rebuild-spec.md`](./godview-system-rebuild-spec.md) | 系統改造計畫書 (v5 架構) |
