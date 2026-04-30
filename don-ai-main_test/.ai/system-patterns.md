---
title: "系統架構模式 (System Patterns)"
category: "config"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "記錄系統架構模式、技術決策與設計模式，供 AI 助手理解系統全貌與歷史脈絡。v1.2 新增記憶模型概念映射（STM/LTM/Episodic）與載入邊界規則。"
id: "20260327-patterns-001"
type: "memory"
tags: [architecture, memory, planning]
status: "active"
created: "2026-03-27"
updated: "2026-03-30"
version: "v1.2"
---

> **TL;DR**: 本文件記錄系統的技術架構與設計模式。核心架構為 Cloudflare Workers（邊緣計算）+ D1（資料庫）+ React/Vite（前端）+ N8N（自動化）。涵蓋 7 大設計模式：邊緣計算、GitOps 自動化、環境隔離、記憶持久化、防執著偏差、漸進式揭露、防護型自動學習迴圈。末尾的 API 行為備忘記錄了 verdict、templates、reason、ad_code 等關鍵 API 行為。

# 系統架構模式 (System Patterns)

本文件專注於記錄系統的技術架構、設計模式與關鍵技術決策，讓 AI 助手能快速理解「系統是怎麼建構的」與「為什麼這樣設計」。

---

## 1. 整體架構概覽

```
┌─────────────────────────────────────────────────────┐
│                    用戶 / 廣告流量                      │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
       ┌───────▼───────┐      ┌───────▼───────┐
       │  Cloudflare    │      │  admin.bexnua  │
       │  Workers (邊緣) │      │  .store (前端)  │
       │  - line-redirect│      │  React + Vite  │
       │  - shadow-cloak │      │  + TailwindCSS │
       └───────┬───────┘      └───────┬───────┘
               │                      │
       ┌───────▼──────────────────────▼───────┐
       │         Cloudflare D1 (資料庫)         │
       │  - godview-clicks (歸因數據)           │
       │  - godview-clicks-staging (測試環境)   │
       └───────────────┬──────────────────────┘
                       │
               ┌───────▼───────┐
               │   N8N (自動化)  │
               │  - CAPI 回傳    │
               │  - 時間歸因     │
               │  - 健康檢查     │
               └───────────────┘
```

---

## 2. 關鍵架構決策

> 完整的 ADR 記錄請參見 [`.ai/decision-log.md`](./decision-log.md)。

| 決策編號 | 日期 | 決策內容 | 原因 |
| :--- | :--- | :--- | :--- |
| ADR-001 | 2026-03-25 | 用 GitHub 私有 repo 作為 AI 共用知識庫 | 免費、自帶版本控制、跨平台共用，取代 D1 存儲文件 |
| ADR-002 | 2026-03-26 | 引入 `.ai/` 目錄結構 | 實施 AI 記憶持久化與防執著偏差機制 |
| ADR-003 | 2026-03-30 | 廢棄 manus-memory 系統，以 don-ai 倉庫為唯一記憶來源 | 消除雙系統維護負擔，統一 Single Source of Truth |
| — | 2026-03-26 | 採用白色模板設計改版 admin.bexnua.store | 保持現有架構不變，只改視覺風格 |
| — | 2026-03-27 | Staging/Production 使用**完全獨立**的 D1 資料庫 | 確保測試數據不污染正式環境（取代舊的「共用 D1」設計） |
| — | 2026-03-26 | 採集功能使用 Cloudflare 原生 Browser Rendering API | 不依賴第三方庫，BR-first + fetch fallback 策略 |

---

## 3. 設計模式

### 3.1 邊緣計算模式 (Edge Computing)

所有 Worker 部署在 Cloudflare 邊緣節點，實現全球低延遲。Worker 透過 D1 Binding 直接存取資料庫，無需額外的 API 層。

### 3.2 GitOps 自動化模式

- **自動部署**：push 到 main 或 staging 分支且 `05-原始碼/` 有變更時，GitHub Actions 自動部署對應 Worker。
- **同步檢查**：每日 UTC 00:00 從 Cloudflare API 下載 Worker 源碼，與 Git repo 中的源碼進行 diff 比對。偵測到差異時自動開 PR（包含最新源碼）並發送 Telegram 通知；無差異時更新 deploy-record.json 時間戳。sync-check.yml 是 GitOps 的安全網機制，用於捕捉繞過 Git 直接修改 Cloudflare Dashboard 的情況。
- **Worker 映射表**：`05-原始碼/worker-mapping.md` 記錄 7 個現役 Worker 的 Git 路徑對應（另有 1 個已廢棄的 manus-memory-api）。注意：sync-check 的 Worker 列表是硬編碼在 workflow 中的 **6 個** production Worker（cloak-admin-api, line-redirect, money-page, preview-page, safe-page, shadow-cloak），**不含 line-redirect-staging**。系統共 7 個 Worker，其中 1 個（line-redirect-staging）為 staging 環境專用，不列入 sync-check 範圍。`deploy-record.json` 的角色為「部署時間戳記錄」，不參與源碼比對邏輯。

### 3.3 環境隔離模式 (Environment Isolation)

- **Staging 與 Production 完全獨立**：各自擁有獨立的 D1 資料庫和 KV 命名空間。
- **分支策略**：`staging` 分支對應測試環境，`main` 分支對應正式環境。
- **部署流程**：所有修改必須先在 staging 驗證，再 merge 到 main 部署正式版。

### 3.4 記憶持久化模式 (Memory Persistence)

> **重要**：自 2026-03-30 起，don-ai GitHub 倉庫是唯一的記憶系統（Single Source of Truth）。舊的 `manus-memory-api` Worker 和 `manus-memory` D1 資料庫已廢棄（見 ADR-003）。

- **長期記憶**：[`memory.md`](./memory.md)（全局狀態）、[`decision-log.md`](./decision-log.md)（ADR）、[`error-log.md`](./error-log.md)（錯誤學習）。
- **活躍上下文**：[`active-context.md`](./active-context.md)（當前任務與變更軌跡）。
- **系統模式**：本文件（架構與設計模式）。
- **規則草稿**：[`pending-rules.md`](./pending-rules.md)（待驗證規則，經金絲雀試用後轉正）。
- **短期記憶**：`02-動態記憶/`（對話精華、想法與規劃）、`08-任務追蹤/`（TODO、CHANGELOG）。
- **歸檔機制**：超過 30 天未修改的動態記憶文件移至 `09-歸檔/`。
- **已廢棄**：~~`manus-memory-api` Worker + `manus-memory` D1~~（歷史匯出保留於 `02-動態記憶/d1-kb-export-memory.md`）。

### 3.5 記憶模型概念映射 (Memory Model Mapping)

為了讓 AI 代理在檢索和修改資訊時有更明確的認知邊界，本系統的記憶文件按照認知心理學的記憶分類進行概念映射。AI 代理在操作不同層級的記憶時，必須遵守對應的存取規則。

| 記憶類型 | 對應文件 | 隱喻 | 存取規則 |
| :--- | :--- | :--- | :--- |
| **短期記憶 (STM)** | `.ai/active-context.md` | 草稿紙 | 僅限當前任務使用，任務結束後可歸檔。頻繁讀寫，Append-Only。 |
| **長期記憶 (LTM)** | `00-系統索引/truth-table.md`、`.ai/memory.md`、`01-核心原則/` | 法典 | 全局持久化，以唯讀為主。修改需極度謹慎，必須遞增 version 並評估全局影響。 |
| **情景記憶 (Episodic)** | `.ai/error-log.md`、`.ai/decision-log.md` | 帶時間戳的經驗記錄 | Append-Only 寫入，記錄帶時間戳的錯誤經驗與架構決策。歷史記錄不可刪除。 |

#### 載入邊界規則

AI 代理在不同情境下應讀取不同層級的記憶，以避免不必要的 Token 消耗和上下文污染：

1. **任務啟動時（Onboarding）**：必須讀取 STM（`active-context.md`）了解當前狀態，以及 LTM 中的 `memory.md` 獲取全局架構。僅在遇到矛盾時才查閱 `truth-table.md` 作為最終裁定。
2. **Debug 或錯誤排查時**：優先讀取 Episodic 記憶（`error-log.md`），檢查是否有相似的歷史錯誤模式，避免重蹈覆轍。
3. **架構決策時**：讀取 Episodic 記憶（`decision-log.md`）了解歷史決策脈絡，以及 LTM（`01-核心原則/`）確認是否有相關規範約束。
4. **日常代碼修改時**：通常只需讀取 STM，不需要載入完整的 LTM 或 Episodic 記憶。
5. **任務結束時（Offboarding）**：將新知識寫入對應層級——事實性發現寫入 LTM（`memory.md`），錯誤經驗寫入 Episodic（`error-log.md`），當前進度更新 STM（`active-context.md`）。

> **核心原則**：LTM 是「法典」，修改門檻最高；STM 是「草稿紙」，生命週期最短；Episodic 是「日記」，只增不刪。三者的存取頻率和修改權限嚴格遞減。

### 3.6 防執著偏差模式 (Anti-Fixation)

- **多假設推理**：Debug 前強制列出至少 3 個不同方向的潛在原因。
- **反思機制**：連續失敗 3 次強制暫停，輸出自我反思。
- **結構化除錯**：[`prompts/debug-prompt.md`](./prompts/debug-prompt.md) 提供基礎 Debug 模板，`skills/systematic-debugging.md` 提供增強版技能。

### 3.7 漸進式揭露模式 (Progressive Disclosure)

- AI 啟動時先讀 `llms.txt` 了解全局結構（L0 層）。
- 根據任務需求，先讀 `_index.md` 摘要（L1 層），再讀取具體文件（L2 層）。
- 透過 `.clineignore` 排除無關目錄，降低 Token 消耗。
- 詳見 [`01-核心原則/cost-performance-optimization-rules.md`](../01-核心原則/cost-performance-optimization-rules.md) 的「三層載入架構」。

### 3.8 防護型自動學習迴圈 (Protective Auto-Learning Loop)

- **錯誤提煉**：AI 在 Offboarding 階段從 `error-log.md` 提煉規則草稿。
- **金絲雀試用**：規則草稿存入 `pending-rules.md`，經 7 天試用期驗證。
- **轉正機制**：試用通過後轉入 `error-log.md` 的「已驗證規則」區塊。
- **詳見**：[`01-核心原則/quality-and-testing-rules.md`](../01-核心原則/quality-and-testing-rules.md)。

---

## 4. 技術棧詳情

| 層級 | 技術 | 用途 |
| :--- | :--- | :--- |
| 邊緣計算 | Cloudflare Workers | 斗篷過濾、流量重定向、API 端點 |
| 資料庫 | Cloudflare D1 | 廣告配置、點擊數據、模板存儲 |
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui | 管理後台 UI |
| 自動化 | N8N | CAPI 回傳、時間歸因、健康檢查 |
| CI/CD | GitHub Actions | 自動部署 Worker、每日同步檢查 |
| 知識庫 | GitHub 私有 repo (don-ai) | AI 記憶持久化、專案文檔管理 |

---

## 5. 重要的 API 行為備忘

<rule id="api-behavior-memo">

- 後端 API 返回的 `verdict` 值是 `blocked`（非 `safe`），前端必須先確認 API 返回的實際值。
- 後端 templates API 支持 `type` 參數過濾，前端不需要客戶端過濾。
- 後端 API 的 `reason` 字段返回英文值（如 `country_blocked`），前端需要做中英文翻譯映射。
- `ad_code` 讀取邏輯：pathname 優先 → query string fallback（向後兼容）。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/memory.md`](./memory.md) | 專案核心記憶（含完整系統狀態快照） |
| [`.ai/decision-log.md`](./decision-log.md) | 完整版架構決策記錄（ADR） |
| [`00-系統索引/sys-overview.md`](../00-系統索引/sys-overview.md) | 系統全貌與快速上手指南 |
| [`01-核心原則/cost-performance-optimization-rules.md`](../01-核心原則/cost-performance-optimization-rules.md) | 三層載入架構的詳細定義 |
