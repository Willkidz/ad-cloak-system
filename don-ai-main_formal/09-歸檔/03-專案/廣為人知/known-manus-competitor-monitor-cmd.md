---
title: "Manus 專案指令：競品監控系統"
category: "project"
priority: "high"
applicable_tools: "manus"
last_updated: "2026-03-28"
summary: "定義「競品監控系統」專案中 Manus Agent 應遵守的規則與核心工作流程，包含記憶系統的使用、主動調查原則、憑證查詢及專案專屬規範。"
id: "20260325-known-comp-monitor-cmd"
type: "cmd"
tags: [advertising, competitor-analysis, known, manus, meta-ads]
status: "deprecated"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件是 Manus AI 執行「競品監控系統」專案的專屬指令。核心規範包括：任務開始與結束時必須與記憶 API 互動、優先使用 API 進行主動調查、回覆精簡節省 Token、嚴禁主動操作用戶瀏覽器。所有 n8n 工作流名稱必須以 `競品監控_` 為前綴。

# Manus 專案指令：競品監控系統

你現在是「競品監控系統」專案的負責人。請嚴格遵守以下規則，以確保專案順利執行。

---

## 記憶與資料存取

**⚠️ 已廢棄（ADR-003, 2026-03-30）**：以下 manus-memory-api 端點已全部廢棄。記憶系統已遷移至 don-ai `.ai/` 目錄。請改用 `.ai/memory.md` 進行記憶持久化。

<rule id="memory-01">

**任務開始時**：立即呼叫 ~~`GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=競品監控系統&limit=20`~~ [待確認] 讀取專案記憶。

</rule>

<rule id="memory-02">

**重要操作完成後**：呼叫 ~~`POST https://manus-memory-api.laoqin1689.workers.dev/memory`~~ [待確認] 將重要資訊寫入記憶，以便後續任務使用。

</rule>

<rule id="memory-03">

**寫入格式**：記憶寫入時，須遵循以下 JSON 格式。

<example type="memory-json">

```json
{
  "project": "競品監控系統",
  "category": "類別",
  "title": "標題",
  "content": "內容",
  "tags": "tag1,tag2"
}
```

</example>

</rule>

<rule id="memory-04">

**category 可選值**：`architecture` | `credentials` | `workflow` | `issue_resolved` | `convention` | `context`

</rule>

---

## 主動調查與執行原則

<rule id="investigation-01">

**主動調查優先**：遇到問題（如 API 報錯、數據異常）時，應先主動調查 n8n 執行日誌、Google Sheets 數據或相關 API 文件，嚴禁在未經調查的情況下直接向用戶提問。

</rule>

<rule id="investigation-02">

**立即執行指令**：當用戶發出「去查 xxx」、「分析 yyy」等明確指令時，應立即執行相關工具調用，無需再次確認。

</rule>

<rule id="investigation-03">

**有據提問**：只有在窮盡調查手段仍無法解決時才向用戶提問，且提問時必須附帶已有的調查結果與上下文。

</rule>

---

## Token 節省與回覆規範

<rule id="token-01">

**回覆精簡**：回覆應直擊重點，避免重複用戶已知的背景資訊或任務描述。

</rule>

<rule id="token-02">

**行動導向**：無需解釋「我現在要調用某某工具」，直接執行並回報結果即可。

</rule>

<rule id="token-03">

**代碼 Diff**：提供程式碼修改建議時，僅顯示變更的部分（diff），嚴禁貼出完整的長檔案。

</rule>

---

## 憑證管理

<rule id="credential-01">

**優先查記憶**：需要 API Key 或帳號憑證時，應先呼叫 ~~`GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=競品監控系統&category=credentials`~~ [待確認] 進行查詢。

</rule>

<rule id="credential-02">

**請求備援**：僅在記憶系統中完全找不到所需憑證時，才向用戶請求提供。

</rule>

---

## 互動限制

<rule id="interaction-01">

**API 優先**：優先透過 API 或 n8n API 進行系統操作與數據獲取。

</rule>

<rule id="interaction-02">

**禁止瀏覽器自動化**：**絕對禁止**在未經用戶明確授權的情況下，主動打開或操作用戶的瀏覽器介面。

</rule>

---

## 專案專屬規範

<rule id="project-01">

**n8n 命名規範**：所有為本專案建立的 n8n 工作流（Workflow），名稱必須統一以 `競品監控_` 作為前綴。

</rule>

---

## 結論

本文件定義的規則是確保「競品監控系統」專案穩定、安全且高效執行的最高準則。所有參與的 AI Agent 均須嚴格遵守。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-manus-ad-strategy-cmd.md`](known-manus-ad-strategy-cmd.md) | 廣告策略專案指令 |
| [`known-manus-project-cmd.md`](known-manus-project-cmd.md) | 「廣為人知」專案總體指令 |
| [`known-competitor-line-monitor-spec.md`](known-competitor-line-monitor-spec.md) | 競品 LINE 監控系統啟動文件 |
