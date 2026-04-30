---
title: "系統數據分工與 Code 設計解析"
category: "project"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "闡述 n8n（即時自動化引擎）與 Google Sheets（最終報表倉儲）的數據分工原則，並解釋 code 在源頭可重複但在報表端透過 GROUP BY 匯總確保唯一的設計邏輯。"
id: "20260325-024356"
type: "analysis"
tags: [architecture, attribution, godview, google-sheets, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **注**：本文件提及的 `manus_memory` 記錄已於 2026-03-30 廢棄（ADR-003），記憶系統已遷移至 don-ai `.ai/` 目錄。以下為歷史記錄。

> **TL;DR**: 系統的數據分工原則：n8n 是即時自動化引擎，儲存原始事件（`godview_events`）與組態設定（`ad_config`、`line_config`），數據為機器可讀、過程導向、可隨時變動；Google Sheets 是最終報表倉儲，儲存按 `code` 匯總的聚合結果（`成效分頁`、`消耗分頁`），數據為人類可讀、結果導向、只增不減。`code` 在源頭端允許重複（同一 `code` 可對應多條追蹤鏈結分配給不同負責人 J/C/M/L），但在報表端透過 n8n `Calculate Stats` 節點的 GROUP BY 匯總，確保每個 `code` 在 `成效分頁` 中只佔唯一一列。

# 系統數據分工與 Code 設計解析

**文件作者：** Manus AI
**最後更新：** 2026年3月27日

這份文件旨在解析系統中兩個核心的設計決策：n8n 與 Google Sheets 的數據分工，以及 `code` 參數的唯一性邏輯。

---

## 數據分工原則：n8n vs. Google Sheets

<rule id="data-division-principle">
系統的核心分工原則是：n8n 作為 **即時的自動化引擎與數據處理中心**，而 Google Sheets 則是 **最終的數據倉儲與人工查閱報表**。兩者的角色定位與數據性質截然不同。
</rule>

下表詳細說明了兩者的區別：

| 平台 | 角色定位 | 數據類型 | 範例 | 特性 |
| :--- | :--- | :--- | :--- | :--- |
| **n8n** | 自動化引擎 | 即時、原始、組態設定 | `godview_events` (原始點擊日誌)、`ad_config` (廣告設定)、`line_config` (LINE帳號設定) | **機器可讀**：數據是為了讓工作流程能即時讀取與判斷。**過程導向**：儲存的是過程中的原始事件與執行任務所需的設定。**可隨時變動**：例如 `ad_config` 中的 CAPI token 可能會更新。 |
| **Google Sheets** | 報表與倉儲 | 匯總、聚合、歷史記錄 | `成效分頁` (按 `code` 匯總的每日成效)、`消耗分頁` (從 Meta 拉取的原始花費)、`_每日快照` (歷史備份) | **人類可讀**：數據被整理成易於理解的報表格式。**結果導向**：儲存的是經過計算與匯總後的最終結果。**永久保留**：根據 v2 決策，成效分頁的數據應「只增不減」，作為永久的歷史記錄。 |

> **核心比喻：** n8n 的 DataTable 像是工廠裡的零件與生產線上的半成品，而 Google Sheets 則是最終送到客戶手上的完整產品。我們不應該把零件直接給客戶，同理，也不應該讓 n8n 的原始日誌直接成為最終報表。

---

## `code` 的重複與唯一性設計

<rule id="code-uniqueness-principle">
關於 `code` 的設計結論是：**`code` 在源頭（鏈結）端重複是正常的，但在終點（報表）端必須是唯一的。** 這個概念是理解本系統歸因邏輯的關鍵。
</rule>

### 為何 `code` 在源頭會重複？

根據 `manus_memory` 的記錄 (ID: 15, 18)，系統的業務邏輯允許一個 `code` 代表一檔廣告活動，並為了將流量分配給多位負責人（如 JS, CS, MS, LS），會為 **同一個 `code`** 生成 **多條不同的追蹤鏈結**，每一條鏈結對應一位人員的 LINE 帳號。

<example id="code-duplication-example">
例如，`code = '01'` 可能會產生如下的多條鏈結：

- `https://ls.freshpathlab.com/?code=01` (給 L 人員)
- `https://cs.freshpathlab.com/?code=01` (給 C 人員)
- `https://js.freshpathlab.com/?code=01` (給 J 人員)
</example>

因此，在 `line_config` 或 `project_config` 這些設定檔中，看到同一個 `code` 關聯到不同的 LINE 帳號或子網域，是完全符合設計的，並非錯誤。

### 如何在 Google Sheets 中確保 `code` 的唯一性？

`上帝視角_Sheets Report - Daily Stats` 這個 n8n 工作流程的核心任務就是確保報表端 `code` 的唯一性。其執行步驟如下：

<step id="read-data">
**1. 讀取所有來源數據**：讀取 `godview_events` 中的所有點擊、新增好友事件，以及 `消耗分頁` 中的所有廣告花費。
</step>

<step id="group-and-aggregate">
**2. 分組與匯總 (Group & Aggregate)**：在 `Calculate Stats` 節點中，工作流程會以 `code` 作為 **主要關鍵字 (Primary Key)**，將所有相關的數據（花費、點擊次數、新增好友數等）全部加總在一起。
</step>

<step id="write-unique-row">
**3. 寫入唯一列**：最後，工作流程會拿著匯總後的數據，去 `成效分頁` 中尋找對應的 `code`。如果該 `code` 的列已存在，就更新其數據；如果不存在，就在最下方新增一個代表這個新 `code` 的列。
</step>

> **核心概念：** n8n 的報表流程扮演了數據庫中 `GROUP BY` 的角色。無論來源有多少筆與特定 `code` 相關的零散記錄，最終都會被匯總成 `成效分頁` 中的 **唯一一列**，確保了報表的整潔與可讀性。

---

## 結論

本文件闡明了系統在數據分工和 `code` 設計上的核心邏輯，旨在確保數據流的清晰、高效與最終報表的準確性。理解這些原則對於維護和擴展系統至關重要。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | code 欄位用意與職責劃分的深度解析 |
| [`godview-system-rebuild-spec.md`](./godview-system-rebuild-spec.md) | v5 架構改造計畫，包含 code 格式從數字改為 AS01 的變更 |
| [`data-relation-principles.md`](../../01-核心原則/project-specific-specs.md) | 數據關聯原則 |
