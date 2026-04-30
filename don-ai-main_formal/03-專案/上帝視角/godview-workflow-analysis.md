---
title: "Workflow 分析結果 (Workflow Analysis)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 Token 歸因系統處理 LINE Webhook 事件的內部工作流程，並探討 destination 欄位缺失對系統功能的潛在影響。"
id: "20260325-024356"
type: "analysis"
tags: [attribution, capi, godview, n8n, webhook, workflow]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本分析釐清了 n8n 歸因流程對 `destination` 欄位的依賴關係。核心發現：(1) 歸因流程（`line-follow` Webhook）是從 LINE 請求 body 中即時提取 `destination` (LINE UID)，而非依賴 `line_config` DataTable；(2) `line_config` 中的 `destination` 欄位主要供 Config API 建立 `LINE_MAP`，讓 Worker 進行反向查詢；(3) 因此，`n14-n22` 欄位為空不影響 Webhook 歸因，僅可能影響 Worker 的反查邏輯。系統架構上，所有 LINE OA 共用同一 Webhook 端點，歸因完全依賴即時提取的 `destination` 作為識別 Key。

# Workflow 分析結果

本文分析了 Token 歸因系統處理 LINE Webhook 事件的內部工作流程，並探討了 `destination` 欄位缺失對系統功能的潛在影響。

---

## Token Attribution System 流程

<step id="n8n-attribution-flow">

1.  **接收事件**：系統接收到 LINE Add Friend 事件，此事件由 `/line-follow` Webhook 端點觸發。
2.  **提取數據**：系統處理 LINE 傳送的數據，提取 `line_user_id`, `line_bot_destination`, `line_event_type`, `message_text` 等關鍵資訊。
3.  **事件分流**：系統判斷事件類型是否為訊息事件 (`Message Event`)：
    -   **是 (Message Event):** 進入訊息處理流程（提取 Token → 驗證 → 匹配映射 → 觸發 CAPI → 回覆用戶 → 保存記錄）。
    -   **否 (Follow Event):** 進入關注事件處理流程（直接存入 `godview_events` 資料庫）。

</step>

---

## 關鍵發現

<rule id="attribution-logic-rules">

1.  **共用端點**：所有 LINE 官方帳號共用同一個 Webhook URL：`/line-follow`。
2.  **即時提取**：`line_bot_destination` 與 `line_id` 均是從 Webhook 請求內容的 `$json.body.destination` 中即時提取的，此為 LINE 平台自動提供。
3.  **歸因 Key**：歸因流程使用 `destination` 欄位來識別事件來源於哪個 LINE 官方帳號。

</rule>

---

## `destination` 為空的原因分析

在 `line_config` DataTable 中，`n14` 至 `n22` 的 `destination` 欄位為空。然而，這**不影響歸因功能**，原因如下：

-   **即時提取**：Workflow 歸因流程是從 LINE Webhook 的 `body.destination` 即時提取 `destination`，而非依賴 `line_config` 中的資料。
-   **Config API 用途**：Config API 的 `Build Config` 流程會從 `line_config` 讀取 `destination`，提供給 Worker 使用。
-   **Worker 用途**：Worker 使用 `destination` 來反向查詢對應的 `tag`。

因此，如果 `destination` 為空，僅會導致 Worker 在收到 LINE Webhook 時無法反查 `tag`。但由於 Webhook 是直接傳送到 n8n 服務，不經過 Worker，所以此問題不影響 Webhook 的歸因流程。

實際上，`destination` 欄位只在 Config API 的 `LINE_MAP` 中使用，供 Worker 進行反向查詢。如果 Worker 的業務邏輯不需依賴 `destination` 反查（例如 Worker 是透過 `tag` 子域名來識別），那麼 `destination` 為空則不影響其運作。

---

## 結論

目前的 Token 歸因系統在處理 LINE Webhook 時，其核心歸因邏輯不受 `line_config` 中 `destination` 欄位為空的影響，因為系統能從 Webhook 請求中即時獲取所需資訊。唯一需要釐清的風險點是 Worker 的 `line-redirect` 邏輯是否對此欄位有隱藏的依賴關係。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-worker-analysis.md`](./godview-worker-analysis.md) | Worker 程式碼邏輯分析 |
| [`godview-time-attr-spec.md`](./godview-time-attr-spec.md) | 時間歸因方案設計文件 |
| [`godview-tag-mapping.md`](./godview-tag-mapping.md) | 完整 TAG 對照表 |
| [`godview-n8n-workflow-list.md`](./godview-n8n-workflow-list.md) | n8n 工作流完整清單 |
