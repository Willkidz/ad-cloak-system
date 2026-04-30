---
title: "對話精華"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "重要對話結論與決策記錄，記錄每次 AI 協作中產生的關鍵決策和發現，涵蓋知識庫架構選型、斗篷後台 Bug 分析、CI/CD 決策、Facebook CAPI 發現、N8N 配置等主題。"
id: "20260325-100300"
type: "log"
tags: [cloak-admin, planning]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件記錄 AI 協作中的重要決策與發現。主要內容包括：(1) 知識庫架構選型（編號資料夾 + YAML frontmatter + 分層索引）；(2) 斗篷後台 Bug 三大根因分析（指令偏差、API schema 不匹配、缺乏自動化測試）及 CI/CD 決策；(3) D1 vs GitHub 分類原則與五項核心工作原則；(4) Facebook CAPI 發現與 N8N 結構摸清。

# 對話精華

本文件記錄每次 AI 協作中產生的重要結論、決策和發現。每條記錄應包含日期、主題、結論和影響。AI 在開始新任務前應參考此文件，了解用戶的歷史決策脈絡。

---

## 記錄模板

<example type="dialogue-record-template">

```markdown
### YYYY-MM-DD — 主題

**結論**：一句話總結
**詳細說明**：具體內容
**影響**：對專案或後續工作的影響
**相關文件**：指向相關文件的路徑
```

</example>

---

## 2026-03-25 — 建立 don-ai 知識庫的決策過程

### 決策 1：知識庫架構選型

**結論**：採用「編號資料夾 + YAML frontmatter + 分層索引」的架構，融合 PARA 方法、Cline Memory Bank 和 llms.txt 標準。

**詳細說明**：經過對 9 種 AI Agent 框架和 7 種 AI 編程工具的記憶架構進行比較研究後，決定採用以下設計：

- 10 個編號資料夾（00-09）提供清晰的分類
- YAML frontmatter 提供結構化元數據，支持 grep 快速檢索
- 三層索引機制（llms.txt → _index.md → 具體文件）實現漸進式揭露
- 受控標籤詞彙表（tags.yaml）防止標籤混亂

**影響**：所有後續的 AI 協作都將基於此架構進行知識管理，預期可大幅降低 Token 消耗並提升工作效率。

**相關文件**：[`00-系統索引/llms.txt`](../00-系統索引/llms.txt)、[`00-系統索引/tags.yaml`](../00-系統索引/tags.yaml)

---

### 決策 2：從舊架構遷移到新架構

**結論**：完全重建而非漸進式遷移，一次性將所有已有知識整理到新架構中。

**詳細說明**：舊架構（00-核心原則 到 08-評估紀錄）缺乏索引機制和標準化的 frontmatter，且資料夾命名不夠直觀。決定直接刪除舊架構，按新設計重建所有內容，同時將所有附件中的知識整合進來。

**影響**：一次性完成遷移，避免新舊架構並存造成的混亂。

---

### 決策 3：省 Token 策略整合

**結論**：將分散在各處的省 Token 知識整合為獨立的規則文件，共 10 條核心策略。

**詳細說明**：從 CLAUDE.md 最佳實踐、Cline Memory Bank 策略、Manus AI 上下文工程經驗中提煉出 10 條可操作的規則，涵蓋搜索策略、快取優化、上下文管理等方面。

**影響**：AI 在每次任務中都有明確的 Token 優化指引可遵循。

**相關文件**：[`01-核心原則/cost-performance-optimization-rules.md`](../01-核心原則/cost-performance-optimization-rules.md)

---

## 2026-03-25 — 斗篷後台 Bug 原因分析與 CI/CD 決策

### 決策 4：斗篷後台 Bug 根因分析

**結論**：斗篷後台的 Bug 主要源自三個根因：指令理解偏差、API schema 不匹配、缺乏自動化測試。決定建立 CI/CD 流程與驗收 Checklist 來系統性解決。

**詳細說明**：經過分析，過去版本中反覆出現的問題可歸類為以下三個根因：

1. **指令理解偏差**：AI 代理在執行複雜任務時，可能對需求的理解與用戶意圖存在偏差，導致實作結果不符預期。解決方案是建立更明確的驗收標準（Checklist）。
2. **API Schema 不匹配**：前端（React）與後端（Hono）各自維護型別定義，當一方修改後另一方未同步更新，導致執行期錯誤。解決方案是採用 Zod Schema 共用策略，實現單一真實來源。
3. **缺乏自動化測試**：所有變更都依賴手動測試，容易遺漏邊界情況。解決方案是導入 Vitest + @cloudflare/vitest-pool-workers 進行自動化測試。

**影響**：

- 新增 [`06-SOP流程/deploy-sop.md`](../06-SOP流程/deploy-sop.md)：定義了完整的 CI/CD 流程
- 新增 [`06-SOP流程/acceptance-checklist.md`](../06-SOP流程/acceptance-checklist.md)：定義了標準化的部署前後驗收清單
- 新增 [`04-資源與參考/api-schema-sync-spec.md`](../04-資源與參考/api-schema-sync-spec.md)：記錄了 Zod + Hono OpenAPI 的 API Schema 同步方案
- 未來所有部署都應遵循 SOP 流程，先測試後部署，部署後驗收

---

## 2026-03-25 — 今日重要決策與發現

**結論**：今日對話產生了多項關於知識庫架構、資料分類、API 驗證及 N8N 配置的重要決策與發現，將指導後續 AI 協作與專案開發。

### 知識庫選址決策

決定採用 GitHub 私有 repo（`don-ai`）作為 AI 共用知識庫，主要考量其免費、版本控制、跨平台共用及便捷的存取性。D1 資料庫因其 10GB 容量限制及非檔案系統特性而不適合作為知識庫主體。Contabo VPS 則因資料安全性及外部存取不便而未被選用。

**相關文件**：[`.ai/decision-log.md`](../.ai/decision-log.md)（ADR-001 詳細記錄此決策）

### D1 vs GitHub 分類原則

<rule id="d1-github-classification">

- **D1 資料庫**：專注於儲存系統運行自動產生的資料（如 `cloak_logs`、`clicks`），這些資料需要進行 SQL 查詢。
- **GitHub repo**：用於存放知識文件（如 AI 記憶、核心原則、架設紀錄、原始碼），供人類與 AI 閱讀與協作。

</rule>

### 架構設計策略

- 確立了 10 個頂層資料夾的「大架構」保持穩定不變。
- 子分類初期將透過「一個文件 + YAML 標籤」的方式進行管理。
- 當某個分類下的文件數量超過 10 個時，再考慮拆分為獨立的子資料夾。
- 採用「四層索引」機制：`llms.txt` → `_index.md` → 交叉引用 → `grep YAML`，以實現高效的知識檢索。

### 核心工作原則確立

<rule id="core-work-principles">

確立了五項通用核心工作原則，適用於任何工作場景：

1. **做到完美才算完成**：產出必須 100%，反覆驗證至零問題。
2. **先研究再動手**：查知識庫、搜索網路、了解全貌，準備充分後才開始執行。
3. **能複用就複用**：避免重複造輪子，優先利用現有資源。
4. **發現好東西要回報**：研究過程中發現有用的資源或功能，主動回報給用戶決策。
5. **不確定的事情問用戶**：避免自行猜測，確保與用戶意圖一致。

</rule>

### Facebook CAPI 發現

- [待確認] 測試發現 `n20 Pixel ID (1339967038176681)` 回傳 400 錯誤，需進一步調查原因。
- [已過期] `Offline Conversions API` 已於 2025 年 5 月停用，此資訊已確認。
- [待確認] CAPI 端點可能需要從 `/{pixel_id}/events` 調整為 `/{dataset_id}/events`。
- `CAPI Health Check` 工作流已升級至 v25.0 版本的 Graph API（2026-03-31）。

### N8N 安全確認

N8N 伺服器版本為 2.12.3，遠高於受漏洞影響的 1.122.0 版本，確認不受 `CVE-2025-68613 (CVSS 9.9)` 漏洞影響，安全性無虞。

### N8N 完整結構摸清

- N8N 系統包含 9 個工作流（6 個啟用，3 個停用）。
- 核心工作流為 `Admin API`、`Time Attribution`、`Config API`。
- 輔助工作流包括 `CAPI Health Check`、`系統監控`、`DNS Auto-Sync`。
- 系統配置了 2 個 Credentials：`Cloudflare D1 Auth` 和 `Cloudflare API Token`。

**相關文件**：[`07-配置與環境/n8n-workflow-arch.md`](../07-配置與環境/n8n-workflow-arch.md)

### 通用指令設計

設計了一段通用開場指令，旨在為新的 AI session 提供標準化的操作指引，確保 AI 能有效讀寫 `don-ai` 知識庫，並遵循既定工作流程與原則。

**影響**：這些決策與發現將直接影響 `don-ai` 知識庫的內容組織、未來 AI 任務的執行方式，以及專案的技術選型與風險管理。

**相關文件**：[`00-系統索引/llms.txt`](../00-系統索引/llms.txt)、[`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md)、[`07-配置與環境/n8n-workflow-arch.md`](../07-配置與環境/n8n-workflow-arch.md)、[`07-配置與環境/auth-info-config.md`](../07-配置與環境/auth-info-config.md)、[`.ai/active-context.md`](../.ai/active-context.md)

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [ideas-plan-memory.md](ideas-plan-memory.md) | 用戶的想法和未來方向，與對話決策互補 |
| [d1-kb-export-memory.md](../09-歸檔/02-動態記憶/d1-kb-export-memory.md) | 從 D1 匯出的完整知識記錄，包含更多技術細節（已歸檔） |
| [`.ai/decision-log.md`](../.ai/decision-log.md) | 架構決策日誌，記錄重大技術決策的 MADR 格式記錄 |
| [`03-專案/斗篷管理後台/cloak-admin-feature-gap-analysis.md`](../03-專案/斗篷管理後台/cloak-admin-feature-gap-analysis.md) | 斗篷功能差距分析 |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前任務狀態（任務狀態唯一來源） |
