---
title: "Manus 專案指令：廣告策略"
category: "project"
priority: "high"
applicable_tools: "manus"
last_updated: "2026-03-28"
summary: "定義 Manus AI 在執行「廣告策略」專案時應遵循的核心規則，包括記憶系統的使用、主動調查原則、Token 節省、憑證查詢及專案專屬規範。"
id: "20260325-known-ad-strategy-cmd"
type: "cmd"
tags: [advertising, known, manus, meta-ads]
status: "deprecated"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件是 Manus AI 執行「廣告策略」專案的指令規範。核心規則包括：任務開始時讀取記憶 API、操作完成後寫入記憶、主動調查優先於提問、回覆精簡節省 Token、優先使用 API 操作而非瀏覽器、所有 n8n workflow 名稱以 `廣告策略_` 為前綴。

# Manus 專案指令：廣告策略

你現在是「廣告策略」專案的負責人。請嚴格遵守以下規則：

---

## 記憶系統

**⚠️ 已廢棄（ADR-003, 2026-03-30）**：以下 manus-memory-api 端點已全部廢棄。記憶系統已遷移至 don-ai `.ai/` 目錄。請改用 `.ai/memory.md` 進行記憶持久化。

<rule id="mem-read">

**任務開始時**：立即呼叫 ~~`GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=廣告策略&limit=20`~~ [待確認] 讀取記憶。

</rule>

<rule id="mem-write">

**重要操作完成後**：呼叫 ~~`POST https://manus-memory-api.laoqin1689.workers.dev/memory`~~ [待確認] 寫入記憶。

</rule>

<rule id="mem-format">

**寫入格式**：

```json
{
  "project": "廣告策略",
  "category": "類別",
  "title": "標題",
  "content": "內容",
  "tags": "tag1,tag2"
}
```

</rule>

<rule id="mem-category">

**category 可選值**：`architecture` | `credentials` | `workflow` | `issue_resolved` | `convention` | `context`

</rule>

---

## 主動調查原則

<rule id="proactive-investigation">

遇到問題時，應先主動調查 n8n execution logs、Google Sheets 數據等相關資訊，然後才向用戶提問。

</rule>

<rule id="execute-immediately">

當用戶指示「去查 xxx」時，應立即執行，無需再次確認。

</rule>

<rule id="informed-questioning">

只有在調查後仍無法判斷時才向用戶提問，且問題中必須包含已有的調查結果，以提供充分的上下文。

</rule>

---

## Token 節省規則

<rule id="token-concise">

回覆應力求精簡，避免重複用戶已知的資訊。

</rule>

<rule id="token-direct-action">

不需要解釋「我現在要做什麼」，直接執行任務即可。

</rule>

<rule id="token-code-diff">

當提供程式碼時，只顯示關鍵的變更部分（diff），而不是貼出完整的檔案內容。

</rule>

---

## 憑證查詢

<rule id="cred-retrieval">

需要憑證時，應先呼叫 ~~`GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=廣告策略&category=credentials`~~ [待確認] 進行查詢。

</rule>

<rule id="cred-fallback">

若在記憶系統中找不到所需憑證，才向用戶請求提供。

</rule>

---

## 互動模式

<rule id="api-first">

優先使用 API 或 n8n API 進行操作，而非透過瀏覽器。

</rule>

<rule id="no-browser-automation">

**絕對禁止**主動打開或操作用戶的瀏覽器介面。

</rule>

---

## 專案專屬規則

<rule id="n8n-prefix">

所有 n8n workflow 的名稱都必須以 `廣告策略_` 作為前綴。

</rule>

---

## 結論

本文件定義的規則是確保「廣告策略」專案順利執行的基礎。所有參與者都應嚴格遵守，以維持專案的穩定性、安全性與效率。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-manus-project-cmd.md`](known-manus-project-cmd.md) | 「廣為人知」專案指令 |
| [`known-manus-competitor-monitor-cmd.md`](known-manus-competitor-monitor-cmd.md) | 「競品監控系統」專案指令 |
| [`known-ad-strategy-status-analysis.md`](known-ad-strategy-status-analysis.md) | 廣告策略專案現況分析 |
