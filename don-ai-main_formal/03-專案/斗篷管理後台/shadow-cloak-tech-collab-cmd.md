---
title: "隱者斗篷技術組 — 協作指令"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "定義「隱者斗篷」專案中，規劃組與技術組之間的協作流程、版本號規則及文件交付標準，旨在降低溝通成本並明確交付標準。"
version: "v1.0"
id: "20260325-024356"
type: cmd
tags: [changelog, cloaking, collaboration, reporting, shadow-cloak, workflow]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件規範了「隱者斗篷」專案的協作模式。核心流程包含：1) 規劃組發布指令；2) 技術組回報狀態（格式：版本、狀態、測試結果）；3) 精簡回報內容（不附帶日誌或程式碼）。版本號遵循語意化規則（vX.Y），檔案命名格式統一為 `隱者斗篷—{Worker名稱}_v{版本號}.js`。

# 隱者斗篷技術組 — 協作指令

本文檔旨在規範「隱者斗篷」專案中，規劃組與技術組之間的協作模式，以確保雙方溝通效率並明確交付標準。

---

## 1. 協作流程 (Collaboration Workflow)

<step id="collaboration-flow">

1.  **規劃組發布指令**：每份指令均會標明具體的目標版本號（例如 v1.2），技術組需嚴格按照指令內容執行開發與部署任務。
2.  **技術組回報進度**：完成開發與部署後，技術組僅需依照以下格式回報任務狀態：
    <example>
    ```text
    版本：v1.2
    狀態：已部署
    測試結果：5/5 通過
    ```
    </example>
3.  **精簡回報內容**：除規劃組主動要求外，技術組無需提供完整的部署報告、日誌或程式碼檔案。
4.  **測試失敗處理**：當測試結果包含失敗項目時，應在回報訊息中額外附上該項目的具體錯誤訊息以利排查。

</step>

---

## 2. 版本號規則 (Versioning Rules)

版本號採用語意化版本控制，格式與說明如下：

| 格式 | 說明 | 範例 |
| :--- | :--- | :--- |
| **vX.0** | **主要版本 (Major)**：包含新功能或重大架構變更。 | v1.0、v2.0 |
| **vX.Y** | **次要版本 (Minor)**：包含錯誤修正、功能調整或效能優化。 | v1.1、v1.2 |

### 2.1. 目前版本狀態

| Worker | 目前版本 | 說明 |
| :--- | :--- | :--- |
| **shadow-cloak** | v1.1 | 反向代理主程式。 |
| **safe-page** | v1.0 | 安全頁。 |
| **money-page** | v1.0 | 推廣頁。 |

---

## 3. 檔案交付規則 (Delivery Rules)

<rule id="delivery-rules">

- **避免產出多餘檔案**：為節省資源，請勿產出與核心任務無關的檔案，例如日誌檔或臨時報告。
- **集中交付程式碼**：每次部署僅需回傳一份包含變更的 Worker 程式碼檔案。
- **統一檔案命名**：檔案命名格式應為 `隱者斗篷—{Worker名稱}_v{版本號}.js`。
  <example>
  `隱者斗篷—shadow-cloak_v1.2.js`
  </example>
- **直接回報測試結果**：所有測試結果應直接撰寫於回報訊息中，不得另外建立檔案存放。

</rule>

---

## 4. 結論

本協作指令的核心目的在於**降低溝通成本**與**減少不必要的資源消耗**。透過標準化的版本號與回報格式，團隊能更精準地對齊開發進度，確保專案高效推進。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-tech-report-spec.md](shadow-cloak-tech-report-spec.md) | 回報規則精簡版 |
| [shadow-cloak-safe-promo-deploy-cmd.md](shadow-cloak-safe-promo-deploy-cmd.md) | 部署指令手冊 |
| [shadow-cloak-tech-exec-log.md](shadow-cloak-tech-exec-log.md) | 技術執行記錄 |
