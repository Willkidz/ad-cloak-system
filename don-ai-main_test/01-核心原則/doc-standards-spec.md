---
title: "文件標準與命名規範"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "整合 Markdown 文件的 YAML 元數據標準與檔案命名/標籤規範。標籤數量已統一為 2-6 個。"
type: "rule"
tags: [documentation, guidelines, token-saving]
status: "active"
version: "v1.1"
activation_glob: null
---

<!-- Merged from metadata-spec.md -->
> **TL;DR**: 本規範定義所有新建 Markdown 文件的 YAML frontmatter 標準格式，必填欄位包括 `title`、`category`、`priority`、`applicable_tools`、`last_updated`、`summary`、`version`，可選欄位包括 `activation_glob`。現有文件不需回溯修改，但鼓勵在下次編輯時順便補上。`.ai/` 目錄下的內部工作文件可使用簡化格式。本規範與現有的擴展欄位（`id`、`type`、`tags`、`status`、`created` 等）完全相容。

# YAML+Markdown 文檔元數據規範

## 適用範圍

<rule id="metadata-scope">
本規範適用於**所有新建的 Markdown 文件**。現有文件不需要回溯修改，但鼓勵在下次編輯時順便補上。

> **重要**：這是給「新建文件」的規範，不要主動去改現有文件的格式。
</rule>

---

## 標準 YAML Frontmatter 格式

<rule id="metadata-standard">
所有新建的 Markdown 文件必須在文件最頂部包含以下 YAML frontmatter：

```yaml
---
title: "文件標題"
category: principle | sop | reference | project | config
priority: critical | high | medium | low
applicable_tools: manus | cursor | claude | all
last_updated: YYYY-MM-DD
version: "v1.0"
activation_glob: "*.tsx"  # 可選欄位
summary: "一句話摘要，說明這個文件的用途和核心內容。"
---
```
</rule>

---

## 欄位定義

### 必填欄位

| 欄位 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `title` | 字串 | 文件的完整標題，使用雙引號包裹 | `"部署流程規範"` |
| `category` | 枚舉 | 文件的分類，決定文件的性質和用途 | `principle` |
| `priority` | 枚舉 | 文件的優先級，影響 AI 載入順序 | `high` |
| `applicable_tools` | 枚舉 | 適用的 AI 工具，決定哪些工具應讀取此文件 | `all` |
| `last_updated` | 日期 | 最後更新日期，格式為 `YYYY-MM-DD` | `2026-03-27` |
| `summary` | 字串 | 一句話摘要，用於 `_index.md` 索引和快速判斷 | `"Token 優化專用規則..."` |
| `version` | 字串 | 文件版本號，格式為 `vX.Y`，每次更新時必須遞增 | `"v1.0"` |

### 可選欄位

| 欄位 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `activation_glob` | 字串或 null | 啟動條件的 Glob 模式，表示只有操作匹配的文件時才需要載入此規範 | `"*.tsx"`、`null` |

---

## 欄位值說明

### category（分類）

| 值 | 說明 | 對應目錄 |
| :--- | :--- | :--- |
| `principle` | 核心原則、工作規範、品質標準 | `01-核心原則/` |
| `sop` | 標準操作流程、檢查清單 | `06-SOP流程/` |
| `reference` | 外部參考資料、API 文件、技術文件 | `04-資源與參考/` |
| `project` | 專案專屬知識、架構設計、問題排除 | `03-專案/` |
| `config` | 配置文件、環境設定、服務清單 | `07-配置與環境/` |

### priority（優先級）

| 值 | 說明 | AI 行為 |
| :--- | :--- | :--- |
| `critical` | 最高優先級，違反可能導致生產事故 | 每次任務開始時必須載入 |
| `high` | 高優先級，影響代碼品質和工作流程 | 相關任務時必須載入 |
| `medium` | 中優先級，提供有用的參考資訊 | 按需載入 |
| `low` | 低優先級，歷史記錄或備查資料 | 僅在明確需要時載入 |

### applicable_tools（適用工具）

| 值 | 說明 |
| :--- | :--- |
| `manus` | 僅適用於 Manus AI |
| `cursor` | 僅適用於 Cursor IDE |
| `claude` | 僅適用於 Claude（直接對話） |
| `all` | 適用於所有 AI 工具 |

### activation_glob（啟動條件）

此欄位為可選。當設定時，表示此文件只有在 AI 操作匹配 Glob 模式的文件時才需要載入。

| 範例值 | 含義 |
| :--- | :--- |
| `"*.tsx"` | 只有操作 React 組件時才載入 |
| `"*.sql"` | 只有操作 SQL 文件時才載入 |
| `"*.worker.ts"` | 只有操作 Worker 源碼時才載入 |
| `null` | 無特定啟動條件，按 category 和 priority 決定是否載入 |

---

## 完整範例

<example>
### 範例 1：核心原則文件

```yaml
---
title: "部署流程規範"
category: principle
priority: critical
applicable_tools: all
last_updated: 2026-03-27
activation_glob: null
summary: "定義測試版/正式版分離部署的五項核心原則，確保部署流程的安全性和可追溯性。"
---
```
</example>

<example>
### 範例 2：專案專屬文件

```yaml
---
title: "上帝視角歸因系統架構設計"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-26
activation_glob: null
summary: "上帝視角系統的整體架構、數據流向和核心模組說明。"
---
```
</example>

<example>
### 範例 3：帶啟動條件的參考文件

```yaml
---
title: "Cloudflare D1 SQL 最佳實踐"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-25
activation_glob: "*.sql"
summary: "D1 資料庫的 SQL 查詢優化技巧、索引策略和常見陷阱。"
---
```
</example>

---

## 與現有 YAML frontmatter 的相容性

<rule id="metadata-compat">
don-ai 現有文件使用的 YAML frontmatter 格式（包含 `id`、`type`、`tags`、`status`、`created` 等欄位）仍然有效。本規範定義的是**新建文件的推薦標準格式**。

如果新建文件需要保留與現有格式的相容性，可以同時包含兩套欄位：

```yaml
---
# 新規範欄位
title: "文件標題"
category: principle
priority: high
applicable_tools: all
last_updated: 2026-03-27
version: "v1.0"
summary: "一句話摘要"
# 現有格式欄位（可選保留）
id: 20260327-XXXXXX
type: guide
tags: [相關標籤]
status: active
created: 2026-03-27
updated: 2026-03-27
---
```

> **例外情況**：`.ai/` 目錄下的文件因為是 AI 內部工作文件，可以使用簡化的 frontmatter（僅包含 `title`、`last_updated`、`summary`、`version`）。
</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/doc-standards-spec.md` | 檔案命名與標籤規範，定義更完整的 frontmatter 模板 |
| `01-核心原則/cost-performance-optimization-rules.md` | 省 Token 規則中的「精簡 frontmatter」建議 |
| `00-系統索引/common-cmd.md` | 通用指令中引用本規範作為文件建立標準 |


<!-- Merged from file-naming-tag-spec.md -->
> **TL;DR**: 本規範統一所有 AI Agent 的檔案命名與標籤規則，核心要求為全小寫英文 kebab-case 命名、語義前置（主題詞在前）、標準類型後綴（`-cmd`、`-spec`、`-analysis` 等）、3-5 個詞段且不超過 40 字元。中文語義保留在 YAML frontmatter 的 `title` 欄位中。經實測可將檔名 Token 消耗降低約 67%。

# Don-AI 檔案命名與標籤規範 (v2 語義優化版)

> **目的**：讓所有 AI Agent 遵守同一套命名與標籤規則，達成「省 Token、好找、不衝突、好同步」四大目標。

本規範基於業界頂級 AI Agent 知識庫（Cline Memory Bank [1]、sammcj/agentic-coding [2]）的命名模式，以及 Google Developer Style Guide [3] 和 Harvard Data Management [4] 的檔案命名最佳實踐制定。經實測量化分析，新規範可將檔名 Token 消耗降低約 **67%**（從平均 22.6 token/檔 降至 7.5 token/檔）。

---

## 第一部分：為什麼要改？—— 現狀問題診斷

### 1.1 Token 浪費嚴重

中文檔名在 LLM tokenizer（如 GPT-4 的 cl100k_base）中，每個漢字平均消耗 1.5~5 個 token，而等義的英文縮寫通常只需 1 個 token。以下是實測對照：

| 中文詞 | Token 數 | 英文縮寫 | Token 數 | 節省 |
| :--- | :---: | :--- | :---: | :---: |
| 規範 | 4 | spec | 1 | 75% |
| 架構 | 5 | arch | 1 | 80% |
| 環境 | 5 | env | 1 | 80% |
| 追蹤 | 5 | tracking | 1 | 80% |
| 對照表 | 5 | compare | 1 | 80% |
| 研究報告 | 7 | analysis | 1 | 86% |
| 工作日誌 | 5 | worklog | 2 | 60% |

以 20 個代表性檔案實測，中文檔名合計消耗 **453 token**，改為英文 kebab-case 後僅需 **150 token**，節省率 **67%**。

### 1.2 命名混亂的六大問題

經掃描全倉庫 345 個 .md 檔案，發現以下問題：

| 問題類型 | 影響檔案數 | 典型案例 |
| :--- | :---: | :--- |
| 冗詞堆砌（完整/深度/最新/總覽） | 38 | `2025-2026年最新、最知名的AI工具完整指南.md` |
| 檔名過長（>30 字元） | 31 | `隱者斗篷（Shadow Cloak）Cloudflare Workers 反向代理斗篷系統 - 部署報告.md`（52 字元） |
| 分隔符混用（空格/—/- /_ 混雜） | 40 | `上帝視角系統 — 工作日誌 2026-03-23.md` |
| 同類文件命名風格不一致 | 42 | 指令類：修復指令/修改指令/通用環境指令/無縫接軌指令/端對端測試指令... |
| 含全形符號或括號 | 25 | `上帝視角｜核心指令（精簡版）.md` |
| 版本號格式不統一 | 28 | v1 / v1.1 / v1.10.1 / (v7) / v1.3 混用 |

---

## 第二部分：核心命名原則

<rule id="naming-kebab-case">
### 原則一：全英文 Kebab-case

統一使用**全小寫英文**與**連字號 `-`** 分隔。中文語義保留在 YAML frontmatter 的 `title` 欄位中。

```
# 舊：隱者斗篷（Shadow Cloak）Cloudflare Workers 反向代理斗篷系統 - 部署報告.md  (36 token)
# 新：shadow-cloak-cf-proxy-deploy.md  (10 token)
```
</rule>

<rule id="naming-semantic-first">
### 原則二：語義前置 (Semantic First)

檔名的第一個詞段必須是**最具區分度的主題詞**，通常是專案名稱或技術名詞。這讓 `find . -name "godview-*"` 或 `ls godview-*` 能立即篩出所有相關文件。

```
# 好：godview-pixel-analysis.md    → find . -name "godview-*" 即可篩出
# 差：pixel-analysis-godview.md    → 混在其他 pixel 文件中
```
</rule>

<rule id="naming-type-suffix">
### 原則三：類型後綴 (Type Suffix)

檔名的最後一個詞段必須是**文件類型標識**，與 frontmatter 的 `type` 欄位呼應。這讓 `find . -name "*-cmd.md"` 能篩出所有指令文件。
</rule>

<rule id="naming-no-fluff">
### 原則四：拒絕冗詞 (No Fluff)

以下修飾詞**嚴禁出現在檔名中**，因為它們不提供任何區分度：

> 完整、深度、最新、全面、詳細、總覽、總整理、研究報告、分析報告、解決方案、實戰指南、最佳實踐
</rule>

<rule id="naming-length">
### 原則五：長度控制

檔名主體控制在 **3~5 個英文詞段**，總長度不超過 **40 字元**（含 `.md`）。
</rule>

<rule id="naming-forbidden-chars">
### 原則六：禁止字元

檔名中**不得出現**以下字元：空格、全形符號（—、：、（）、「」、｜）、底線 `_`（統一用 `-`）。
</rule>

<rule id="naming-auto-translate">
### 原則七：中文對話自動翻譯命名

當用戶以中文對話時，AI 新建文件須自動將中文內容翻譯為符合英文 kebab-case 命名規則的檔名。例如用戶說「建一個廣告策略分析文件」，AI 應自動命名為 `ad-strategy-analysis.md` 而非 `廣告策略分析.md`。此規則確保即使在中文工作流中，所有新建檔案仍然遵循全英文 kebab-case 命名規範。
</rule>

---

## 第三部分：標準化詞彙與縮寫對照表

為避免同義詞混用（如 report/analysis/guide），統一使用以下標準詞彙作為**類型後綴**：

| 類型後綴 | 含義 | 對應中文概念 | grep 指令 |
| :--- | :--- | :--- | :--- |
| `-cmd` | 指令/Prompt | 指令、操作指令、修復指令、修改指令 | `find . -name "*-cmd.md"` |
| `-spec` | 規格/規範 | 規格書、規範、原則、設計文件 | `find . -name "*-spec.md"` |
| `-analysis` | 分析/研究 | 報告、分析、解析、研究、評估 | `find . -name "*-analysis.md"` |
| `-arch` | 架構 | 架構設計、結構、系統設計 | `find . -name "*-arch.md"` |
| `-deploy` | 部署 | 部署報告、部署指令、上線記錄 | `find . -name "*-deploy.md"` |
| `-config` | 配置 | 環境設定、認證、服務清單 | `find . -name "*-config.md"` |
| `-log` | 紀錄 | 日誌、工作紀錄、執行記錄 | `find . -name "*-log.md"` |
| `-changelog` | 版本紀錄 | 版本紀錄、更新紀錄 | `find . -name "*-changelog.md"` |
| `-todo` | 待辦 | 待辦清單、剩餘步驟 | `find . -name "*-todo.md"` |
| `-sop` | 標準流程 | SOP、操作手冊 | `find . -name "*-sop.md"` |
| `-checklist` | 檢查清單 | 自檢清單、驗收清單 | `find . -name "*-checklist.md"` |
| `-verify` | 驗證/測試 | 測試報告、驗證結果 | `find . -name "*-verify.md"` |
| `-mapping` | 對照表 | 對照表、映射表 | `find . -name "*-mapping.md"` |
| `-list` | 清單 | 工具清單、廠商清單、遊戲清單 | `find . -name "*-list.md"` |
| `-plan` | 規劃 | 路線圖、規劃文件 | `find . -name "*-plan.md"` |

### 專案名稱縮寫表

| 中文專案名 | 英文縮寫 | 使用場景 |
| :--- | :--- | :--- |
| 上帝視角 | `godview` | `godview-pixel-analysis.md` |
| 斗篷管理後台 | `cloak-admin` | `cloak-admin-deploy.md` |
| 隱者斗篷 | `shadow-cloak` | `shadow-cloak-cf-proxy-deploy.md` |
| 廣為人知 | `known` | `known-fb-ad-strategy-analysis.md` |
| 火鳥 | `firebird` | `firebird-cloak-mechanism-analysis.md` |

### 技術名詞縮寫表

| 全稱 | 縮寫 | 範例 |
| :--- | :--- | :--- |
| Cloudflare | `cf` | `cf-worker-pixel-analysis.md` |
| Facebook / Meta | `fb` / `meta` | `fb-ad-strategy-analysis.md` |
| attribution (歸因) | `attr` | `godview-tag-attr-analysis.md` |
| environment | `env` | `cloak-admin-env-cmd.md` |
| implementation | `impl` | `manus-memory-impl-analysis.md`（已廢棄） |

---

## 第四部分：各目錄命名模式

### 保留不改的特殊檔案

以下檔案名稱為業界慣例或系統約定，**不需改名**：

- `README.md`、`_index.md`、`CHANGELOG.md`、`TODO.md`、`AGENTS.md`、`HANDOFF.md`
- `.ai/` 目錄下的記憶檔案（`active-context.md`、`memory.md` 等）保持現狀
- `skills/` 目錄下已符合 kebab-case 的檔案

### 00-系統索引

| 命名公式 | 範例 |
| :--- | :--- |
| `[topic]-index.md` | `sys-overview.md`, `tag-integrity-analysis.md` |
| `[topic]-cmd.md` | `common-cmd.md` |

### 01-核心原則

| 命名公式 | 範例 |
| :--- | :--- |
| `[topic]-spec.md` | `ai-work-spec.md`, `quality-and-testing-rules.md`, `doc-standards-spec.md` |
| `[topic]-rules.md` | `cost-performance-optimization-rules.md`, `security-and-safety-rules.md` |

### 02-動態記憶

| 命名公式 | 範例 |
| :--- | :--- |
| `[topic]-memory.md` | `chat-summary-memory.md`, `ideas-plan-memory.md` |

### 03-專案

| 命名公式 | 範例 |
| :--- | :--- |
| `[project]-[feature]-[type].md` | `godview-pixel-analysis.md` |
| `[project]-[version]-[feature]-cmd.md` | `cloak-admin-v1-5-ad-page-cmd.md` |

**版本號格式**：統一使用 `v{major}-{minor}` 格式（用連字號代替點號），例如 `v1-10-2`。

### 04-資源與參考

| 命名公式 | 範例 |
| :--- | :--- |
| `[tech]-[topic]-[type].md` | `ai-agent-pricing-analysis.md` |
| `[tech]-[topic]-list.md` | `fb-ad-tools-list.md` |

### 05-原始碼

| 命名公式 | 範例 |
| :--- | :--- |
| `[module]-mapping.md` | `worker-mapping.md` |
| `[module]-src.md` | `api-schema-src.md` |

### 06-SOP 流程

| 命名公式 | 範例 |
| :--- | :--- |
| `[task]-sop.md` | `deploy-sop.md`, `domain-add-sop.md` |
| `[task]-checklist.md` | `pre-commit-checklist.md`, `acceptance-checklist.md` |

### 07-配置與環境

| 命名公式 | 範例 |
| :--- | :--- |
| `[service]-config.md` | `n8n-workflow-config.md`, `auth-config.md`, `service-list-config.md` |

### 08-任務追蹤

| 命名公式 | 範例 |
| :--- | :--- |
| `[project]-changelog.md` | `project-changelog.md`, `shadow-cloak-changelog.md` |
| `[project]-todo.md` | `project-todo.md` |
| `[topic]-log.md` | `evaluation-log.md` |

### 09-歸檔

歸檔目錄中的檔案按照上述規則改名即可，**不需要**額外加 `-archived` 後綴（因為目錄本身已表達歸檔語義，且 frontmatter 的 `status: archived` 也已標記）。

---

## 第五部分：標籤規範 (YAML Frontmatter)

本規範**完全相容**現有的 `01-核心原則/doc-standards-spec.md` 所定義的 schema。在其基礎上，新增以下要求：

### 5.1 完整的 Frontmatter 模板

```yaml
---
title: "隱者斗篷（Shadow Cloak）Cloudflare Workers 反向代理部署報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
activation_glob: null
summary: "記錄隱者斗篷系統在 CF Workers 上的反向代理部署流程與環境變數配置。"
id: 20260328-shadow-cloak-deploy
type: deploy
tags: [cloudflare, worker, cloaking, proxy, deployment]
status: active
created: 2026-03-28
updated: 2026-03-28
---
```

### 5.2 必填欄位

| 欄位 | 類型 | 說明 |
| :--- | :--- | :--- |
| `title` | string | **中文完整標題**。檔名精簡後，title 承載完整語義 |
| `category` | enum | `core`, `principle`, `sop`, `reference`, `project`, `config`, `tracking`, `archive`, `index`, `memory`, `skill` |
| `priority` | enum | `critical`, `high`, `medium`, `low` |
| `applicable_tools` | enum | `manus`, `cursor`, `claude`, `all` |
| `last_updated` | date | `YYYY-MM-DD` 格式 |
| `summary` | string | 一句話摘要（50 字以內），供 `_index.md` 索引和 RAG 檢索 |
| `type` | enum | 與檔名後綴一致：`cmd`, `spec`, `analysis`, `arch`, `deploy`, `config`, `log`, `changelog`, `todo`, `sop`, `checklist`, `verify`, `mapping`, `list`, `plan`, `rule`, `memory`, `skill` |
| `tags` | array | 全小寫英文標籤陣列，2-6 個 |
| `status` | enum | `active`, `draft`, `deprecated`, `archived` |

### 5.3 選填欄位

| 欄位 | 類型 | 說明 |
| :--- | :--- | :--- |
| `id` | string | 唯一識別碼，格式 `YYYYMMDD-{slug}` |
| `created` | date | 建立日期 |
| `updated` | date | 最後更新日期 |
| `activation_glob` | string/null | 啟動條件 Glob 模式 |
| `project` | string | 所屬專案：`godview`, `cloak-admin`, `shadow-cloak`, `known` |
| `version` | string | 文件版本號，如 `v1.10.2` |
| `supersedes` | string | 本文件取代的舊檔名（用於遷移追蹤） |

### 5.4 Tags 命名規則

<rule id="tags-naming">
1. **全小寫英文**，多詞用連字號連接（如 `token-saving`）
2. **優先使用已存在的 tag**，避免近義詞增生
3. **每個文件 2-6 個 tag**
4. 推薦的核心 tag 列表：

| 領域 | 推薦 Tags |
| :--- | :--- |
| 技術平台 | `cloudflare`, `n8n`, `meta`, `facebook`, `google-sheets`, `line`, `react` |
| 功能模組 | `pixel`, `capi`, `attribution`, `cloaking`, `deployment`, `monitoring` |
| 文件性質 | `instruction`, `analysis`, `architecture`, `configuration`, `troubleshoot` |
| 專案 | `godview`, `cloak-admin`, `shadow-cloak`, `known`, `firebird` |
</rule>

---

## 第六部分：AI Agent 新建/更新文件 Checklist

當 AI Agent 需要新建或更新文件時，依序執行以下檢查：

### 新建文件

- [ ] 檔名是否為全小寫英文 kebab-case？
- [ ] 檔名是否以標準類型後綴結尾（`-cmd`, `-spec`, `-analysis` 等）？
- [ ] 檔名是否在 3~5 個詞段內、不超過 40 字元？
- [ ] 檔名是否移除了所有冗詞（完整/深度/最新/報告/指南）？
- [ ] YAML frontmatter 是否包含所有必填欄位？
- [ ] `title` 是否為中文完整標題？
- [ ] `summary` 是否為一句話摘要（50 字以內）？
- [ ] `type` 是否與檔名後綴一致？
- [ ] `tags` 是否為全小寫英文、2-6 個？
- [ ] 是否已更新所在目錄的 `_index.md`？

### 更新/改名文件

- [ ] 使用 `grep -r "舊檔名" .` 找出所有引用舊檔名的文件
- [ ] 更新所有內部連結
- [ ] 在 frontmatter 中加入 `supersedes: "舊檔名.md"` 欄位
- [ ] 更新 `_index.md` 中的檔案清單
- [ ] 提交時使用語義化 commit message：`rename: old-name.md → new-name.md`

---

## 第七部分：命名遷移指南

### 遷移原則

1. **不要一次全改**：優先改動 `00-系統索引/`、`01-核心原則/`、`06-SOP流程/`、`07-配置與環境/` 這些高頻引用的目錄
2. **09-歸檔/ 最後處理**：歸檔文件改名優先級最低，因為 AI 預設不搜索歸檔目錄
3. **改名後必須更新引用**：使用 `grep -r "舊檔名" .` 找出所有引用並替換
4. **保留 git 歷史**：使用 `git mv` 而非 `mv` 來改名，保留版本追蹤

### 遷移步驟

```bash
# 1. 改名
git mv "舊檔名.md" "新檔名.md"

# 2. 更新 frontmatter（加入 supersedes 欄位）
# 在新檔案的 frontmatter 中加入：
# supersedes: "舊檔名.md"

# 3. 搜索並替換所有引用
grep -r "舊檔名" . --include="*.md" -l

# 4. 更新 _index.md
# 5. 提交
git add -A
git commit -m "rename: 舊檔名.md → 新檔名.md"
git push origin main
```

### 建議的遷移批次順序

| 批次 | 目錄 | 檔案數 | 原因 |
| :---: | :--- | :---: | :--- |
| 1 | `01-核心原則/` | 14 | 被全倉庫引用最多 |
| 2 | `00-系統索引/` | 4 | AI 入口文件 |
| 3 | `06-SOP流程/` | 6 | 高頻操作文件 |
| 4 | `07-配置與環境/` | 4 | 配置類文件 |
| 5 | `08-任務追蹤/` | 7 | 任務管理文件 |
| 6 | `03-專案/上帝視角/` | 85 | 最大專案目錄 |
| 7 | `03-專案/斗篷管理後台/` | 71 | 第二大專案目錄 |
| 8 | `03-專案/廣為人知/` | 37 | 第三大專案目錄 |
| 9 | `04-資源與參考/` | 20 | 參考資料 |
| 10 | `09-歸檔/` | 69 | 最低優先級 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/doc-standards-spec.md` | YAML frontmatter 標準格式（本規範第五部分的基礎） |
| `01-核心原則/cost-performance-optimization-rules.md` | Token 優化策略（本規範的理論基礎） |
| `00-系統索引/common-cmd.md` | 通用指令中的文件建立規範引用 |

---

## 參考來源

[1]: https://tweag.github.io/agentic-coding-handbook/WORKFLOW_MEMORY_BANK/ "Cline Memory Bank Workflow"
[2]: https://github.com/sammcj/agentic-coding "sammcj/agentic-coding - Skills-based naming"
[3]: https://developers.google.com/style/filenames "Google Developer Documentation Style Guide - Filenames"
[4]: https://datamanagement.hms.harvard.edu/plan-design/file-naming-conventions "Harvard Biomedical Data Management - File Naming Conventions"
