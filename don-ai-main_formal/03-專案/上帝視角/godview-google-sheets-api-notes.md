---
title: "Google Sheets API 整合開發筆記"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "n8n 調用 Google Sheets API 的技術細節：Service Account 認證、batchUpdate 批量寫入（含範例 JSON）、公式寫入需 USER_ENTERED、範圍精確化以避免限流。"
id: "20260328-godview-gsheets-api"
type: "notes"
tags: [godview, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本筆記記錄了 n8n 透過 Google Service Account 調用 Sheets API 的實作細節。核心技巧：使用 `batchUpdate` 接口一次性更新多個不連續的儲存格（如 `成效!D4:D7` 和 `成效!F2`），避免觸發 Google API 頻率限制。寫入公式時 `valueInputOption` 必須設為 `USER_ENTERED`，否則公式會被當作純文字。性能優化重點：減少調用次數（合併為 batch）、指定精確 A1 範圍（如 `A12:N50` 而非 `A:N`）。

# Google Sheets API 整合開發筆記

---

## 授權與認證

<rule id="auth-method">

系統使用 Google Service Account 進行認證，需確保該帳號具有目標試算表的「編輯者」權限。

</rule>

---

## 核心 API 調用範例

### 1. 批量寫入數據 (Batch Update)

<example id="batch-update-example">

```json
// POST https://sheets.googleapis.com/v4/spreadsheets/{ID}/values:batchUpdate
{
  "valueInputOption": "USER_ENTERED",
  "data": [
    { "range": "成效!D4:D7", "values": [["10"], ["25"], ["5"], ["12"]] },
    { "range": "成效!F2", "values": [["2026-03-28 12:00:00"]] }
  ]
}
```

</example>

### 2. 處理公式寫入

<rule id="formula-write-rule">

寫入公式時，`valueInputOption` 必須設定為 `USER_ENTERED`，否則公式會被當作純文字處理。例如：`=IF(C4="", "", D4/C4)`。

</rule>

---

## 性能優化建議

<step id="gs-api-opt-1">**減少調用次數**：優先使用 `batchUpdate` 而非多次 `update`，以節省網路開銷並降低被限流的風險。</step>

<step id="gs-api-opt-2">**範圍精確化**：儘量指定精確的 A1 範圍（如 `A12:N50`），避免使用模糊範圍（如 `A:N`）導致 API 掃描過多無效單元格。</step>

---

## 結論

熟練掌握 Google Sheets API 的批量操作是構建高效報表系統的關鍵。在處理大規模數據寫入時，應始終關注 API 的 Quota 使用情況。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-gsheets-ad-tracking-spec.md](godview-gsheets-ad-tracking-spec.md) | Sheets 廣告追蹤規格書 |
| [godview-changes-needed.md](godview-changes-needed.md) | n8n 變更需求 |
