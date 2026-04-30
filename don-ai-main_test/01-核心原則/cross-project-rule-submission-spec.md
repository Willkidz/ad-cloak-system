---
title: "跨專案 AI 規則提交機制指南"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "定義外部專案 AI 發現新規則或最佳實踐時，如何透過標準化 JSON 格式與 Webhook 自動提交至 don-ai 知識庫的完整流程。"
id: "20260329-CROSS-RULE-001"
type: "spec"
tags: [rules, submission, cross-project, webhook, automation]
status: "active"
created: "2026-03-29"
updated: "2026-03-30"
version: "v1.0"
---

> **TL;DR**: 本文件定義了其他專案的 AI Agent 如何將發現的新規則或最佳實踐自動寫回 `don-ai` 知識庫。透過標準化的 JSON 格式提交至 n8n Webhook，系統會自動發起 Pull Request 將規則寫入 `.ai/pending-rules.md` 進入金絲雀試用期，實現跨專案的知識共享與防護型自動學習迴圈。

# 跨專案 AI 規則提交機制指南

為了解決各專案 AI 獨立運作導致的「知識孤島」問題，並將 `don-ai` 打造成真正的共用大腦，本規範定義了一套自動化的「跨專案規則提交機制」。

---

## 1. 提交規則的標準化 JSON 格式

當外部 AI 發現值得全域共享的規則、防錯經驗或最佳實踐時，必須將其整理為以下標準化 JSON 格式，以便自動化工作流解析。

<rule id="rule-submission-format">

```json
{
  "rule_title": "規則簡述（例如：Cloudflare D1 查詢優化規則）",
  "trigger_condition": "在什麼具體情況下適用此規則？（例如：當執行包含多個 JOIN 的 D1 查詢時）",
  "error_symptom": "如果不遵守此規則，會發生什麼錯誤？（例如：查詢超時或消耗過多讀取次數）",
  "correct_practice": "應該如何正確執行？（例如：必須先在子查詢中過濾數據，再進行 JOIN）",
  "source_project": "來源專案名稱（例如：cloak-admin）",
  "confidence_level": "high | medium | low",
  "tags": ["cloudflare", "d1", "optimization"]
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `rule_title` | String | 是 | 規則的簡短標題，將作為 Markdown 標題 |
| `trigger_condition` | String | 是 | 觸發該規則的上下文或條件 |
| `error_symptom` | String | 是 | 錯誤現象或反面教材 |
| `correct_practice` | String | 是 | 正確的處理方式或最佳實踐 |
| `source_project` | String | 是 | 發現此規則的來源專案名稱 |
| `confidence_level` | Enum | 是 | 信心等級：`high` (多次驗證)、`medium` (單次成功)、`low` (理論推測) |
| `tags` | Array | 否 | 相關技術標籤，便於後續檢索 |

</rule>

---

## 2. 提交流程說明

外部 AI 提交規則的流程完全自動化，無需人工介入即可完成初步記錄。

<step id="submission-workflow">

1. **觸發提交**：外部 AI 在其專案的 Offboarding 階段，若判定有新規則產生，主動向 `don-ai` 的 n8n Webhook 發送 POST 請求，Payload 為上述 JSON 格式。
2. **Webhook 接收與驗證**：n8n 接收請求，驗證 JSON 格式與必填欄位。
3. **自動建立分支**：n8n 透過 GitHub API 在 `don-ai` 倉庫建立一個新的分支（例如 `auto-rule/cloak-admin-1711680000`）。
4. **寫入草稿區**：n8n 將 JSON 轉換為 Markdown 格式，並附加到 `.ai/pending-rules.md` 文件的末尾。
5. **發起 Pull Request**：n8n 自動建立一個 Pull Request，標題為 `[Auto Rule] 來自 {source_project} 的新規則提交`。
6. **通知維護者**：透過 Telegram Bot 發送通知，提醒人類維護者有新的規則 PR 等待審核。

</step>

---

## 3. 規則審核與金絲雀試用期

為了確保新規則不會對現有系統造成破壞，所有提交的規則必須經過「金絲雀試用期」。

<rule id="rule-review-process">

1. **進入 Pending 狀態**：PR 合併後，規則正式進入 `.ai/pending-rules.md`，狀態標記為 `[Pending]`。
2. **啟動 Trial（試用期）**：
   - 若 `confidence_level` 為 `high`，AI 在讀取時可自動將其視為 `[Trial: YYYY-MM-DD]` 狀態，開始為期 7 天的試用。
   - 若為 `medium` 或 `low`，需等待人類在文件中手動將其改為 `[Trial]` 狀態。
3. **試用期約束**：處於 Trial 狀態的規則，AI 僅在「低風險任務」中參考，並在決策日誌中註明「基於試用期規則」。
4. **轉正或淘汰**：
   - **Verified**：7 天內無負面反饋，AI 或人類將其移至 `.ai/error-log.md` 的「已驗證規則」區塊。
   - **Rejected**：若導致錯誤，立即標記為 `[Rejected: 原因]` 並保留在 pending 文件中作為反面教材。

</rule>

---

## 4. 與 don-ai `.ai/` 目錄的整合

> **注意**：舊的 `manus-memory-api` 已廢棄（ADR-003, 2026-03-30）。規則提交機制現在直接與 don-ai 倉庫的 `.ai/` 目錄整合。

當 AI 在外部專案中發現新規則時，流程如下：

1. **規則提交**：透過 n8n Webhook 發送標準化 JSON，自動建立 GitHub PR 寫入 `.ai/pending-rules.md`。
2. **規則讀取**：外部 AI 透過 clone don-ai 倉庫或 GitHub API 讀取 `.ai/pending-rules.md` 的最新內容。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `04-資源與參考/cross-project-pr-workflow-design.md` | 本機制的 n8n 自動化 PR 工作流詳細架構設計 |
| `.ai/pending-rules.md` | 規則提交的目標暫存區 |
| ~~`01-核心原則/manus-memory-project-cmd.md`~~ | 已廢棄（ADR-003）— 舊記憶系統 API 規範（歷史參考） |
