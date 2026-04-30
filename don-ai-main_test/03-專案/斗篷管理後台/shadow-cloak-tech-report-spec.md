---
title: "隱者斗篷技術組 — 回報規則（精簡版）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "精簡化隱者斗篷技術組的任務回報流程，明確定義回報格式與無需執行的項目，以提升協作效率並減少溝通成本。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloaking, collaboration, reporting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件定義了「隱者斗篷」技術組的精簡回報協議。核心規則為：每次任務完成後僅需回報版本、狀態與測試結果，嚴禁附帶程式碼檔案或冗長的部署報告。此舉旨在最大化減少 Token 消耗，讓技術組專注於執行，規劃組負責記錄與管理。

# 隱者斗篷技術組 — 回報規則（精簡版）

本文檔旨在精簡化隱者斗篷技術組的任務回報流程，以減少不必要的溝通成本並提升協作效率。

---

## 1. 核心回報規則 (Reporting Protocol)

<rule id="report-format">

每次完成任務後，僅需回報以下內容，**不需附帶任何檔案**。

```text
版本：vX.X
狀態：已部署
測試結果：X/X 通過
```

若測試失敗，請在回報中額外附加一行簡要的失敗原因說明。

</rule>

---

## 2. 無需執行的項目 (Exclusions)

為簡化流程，請技術組成員**避免**以下操作：

<rule id="no-extra-actions">

1.  **無需附帶程式碼檔案**：規劃組會負責程式碼的記錄、審核與檢查。若有需要，我們會主動向您索取。
2.  **無需附帶部署報告**：僅需將測試結果直接寫在回報訊息中即可。
3.  **無需重讀協作指令或步驟清單**：您已熟悉流程，未來將只會收到一句話的簡潔任務指令。

</rule>

---

## 3. 結論

本規則的核心目的是最大化地減少 Token 消耗，讓技術組能專注於執行任務，而規劃組則負責所有記錄與管理工作。請確實遵守以上精簡後的回報規則，以確保團隊協作順暢高效。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-tech-collab-cmd.md](shadow-cloak-tech-collab-cmd.md) | 完整協作指令 |
| [shadow-cloak-tech-exec-log.md](shadow-cloak-tech-exec-log.md) | 技術執行記錄 |
| [shadow-cloak-safe-promo-deploy-cmd.md](shadow-cloak-safe-promo-deploy-cmd.md) | 部署指令手冊 |
