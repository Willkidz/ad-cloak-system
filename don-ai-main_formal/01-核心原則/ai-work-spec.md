---
title: "AI 工作規範"
category: "principle"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "AI 代理在處理 don-ai 專案時必須遵循的核心行為準則，涵蓋工作哲學、Token 優化、防繞圈機制、技術規範與安全規則。"
type: "spec"
tags: [ai-agent, cloudflare, line, n8n, security, token-saving]
status: "active"
activation_glob: null
version: "v1.0"
---

> **TL;DR**: 本文件是 AI 代理處理 don-ai 專案的最高層級行為準則。核心工作哲學為「少即是多」與「漸進式揭露」；Token 優化要求維持上下文穩定、使用 `.clineignore` 模式、維護 `.ai/active-context.md`；錯誤處理採用五步框架（停止 → 上下文恢復 → 根因分析 → 替代方案 → 清理現場）；技術規範涵蓋 Cloudflare Workers、N8N、LINE Messaging API 三大系統。

# Don-AI 核心原則與工作規範

**專案背景**：Cloudflare Workers + N8N + LINE 廣告追蹤系統
**主要 AI 協作工具**：Manus AI

本文件定義了 AI 代理在處理 `don-ai` 專案時必須遵循的核心原則。這些規則旨在最大化開發效率、極小化 Token 消耗，並確保系統的穩定性與安全性。

---

## 1. 核心工作哲學 (Meta Rules)

<rule id="meta-less-is-more">
**少即是多 (Less is More)**：在提供解決方案時，優先考慮最簡潔、依賴最少的實作方式。更少的程式碼等於更少的技術債。
</rule>

<rule id="meta-progressive-disclosure">
**漸進式揭露 (Progressive Disclosure)**：不要一次性讀取所有專案文件。請根據當前任務，優先讀取相關的特定模組文件或使用 `grep` 搜尋關鍵字，以節省 Token 消耗。詳見 `01-核心原則/cost-performance-optimization-rules.md` 的三層載入架構。
</rule>

<rule id="meta-explicit-declaration">
**明確宣告**：在執行任何重要決策或套用特定規則時，必須在輸出中簡短宣告（例如：「*套用規則：優先使用 Cloudflare 內建 KV*」）。
</rule>

---

## 2. Token 優化與記憶管理規則

> 完整的 Token 優化策略請參照 `01-核心原則/cost-performance-optimization-rules.md`。

為了確保 Manus AI 的高效運作並控制成本，必須嚴格遵守以下上下文管理規則：

<rule id="token-stable-context">
**維持上下文穩定**：在建立系統提示或任務描述時，避免使用動態變數（如精確到秒的時間戳記），以確保快取 (Cache) 能夠被有效利用。
</rule>

<rule id="token-clineignore">
**使用 `.clineignore` 模式**：在掃描目錄或讀取文件時，主動忽略 `node_modules/`、`.wrangler/`、`dist/` 等建置產物與依賴資料夾。
</rule>

<rule id="token-todo">
**維護 `.ai/active-context.md`**：在處理複雜任務時，必須在 `.ai/active-context.md` 中追蹤任務狀態。將大任務拆解為子任務，並在每個步驟完成後更新狀態。這有助於保持專注，防止在長對話中迷失方向。
</rule>

<rule id="token-concise-output">
**精簡輸出**：當被要求提供資料結構或配置檔時，優先輸出 JSON 或 YAML 格式，避免冗長的自然語言解釋，除非用戶特別要求。
</rule>

---

## 3. 防繞圈與錯誤處理機制

AI 在執行任務時若遇到非預期錯誤，必須遵循以下「五步錯誤處理框架」：

> 更深入的除錯方法論請參照 `skills/systematic-debugging.md` 和 `.ai/prompts/debug-prompt.md`。

<step id="error-1-stop">
**步驟 1 — 停止與檢測**：如果同一個錯誤或類似的錯誤連續出現 **兩次**，立即停止當前的嘗試路徑。**絕對禁止**盲目地重複執行相同的指令。
</step>

<step id="error-2-context">
**步驟 2 — 上下文恢復**：回顧最近的三次變更，確認是否遺漏了環境變數、權限設定或依賴關係。
</step>

<step id="error-3-rca">
**步驟 3 — 根本原因分析**：分析錯誤日誌，並在回覆中明確指出可能的原因（例如：「*Cloudflare Worker 記憶體超限*」或「*N8N Webhook 逾時*」）。
</step>

<step id="error-4-alternatives">
**步驟 4 — 提出替代方案**：在再次嘗試之前，必須提出至少 **兩種** 不同的解決方案供用戶選擇，或自行選擇最穩妥的替代方案並說明理由。
</step>

<step id="error-5-cleanup">
**步驟 5 — 清理現場**：如果之前的嘗試產生了暫存檔案或錯誤的配置，必須在嘗試新方案前將其清理乾淨。
</step>

---

## 4. 專案特定技術規範 (Cloudflare + N8N + LINE)

### 4.1 Cloudflare Workers 規範

<rule id="cf-lightweight">
**輕量化**：Workers 程式碼必須保持輕量。避免引入龐大的 npm 套件，優先使用原生 Web APIs（如 `fetch`、`crypto`）。
</rule>

<rule id="cf-state">
**狀態管理**：對於廣告追蹤的點擊資料或短暫狀態，優先使用 Cloudflare KV 或 Durable Objects，避免頻繁呼叫外部資料庫。
</rule>

<rule id="cf-error">
**錯誤捕捉**：所有的 `fetch` 請求與非同步操作都必須包含 `try-catch` 區塊，並確保在發生錯誤時回傳適當的 HTTP 狀態碼（如 500），而不是讓 Worker 崩潰。
</rule>

### 4.2 N8N 工作流規範

<rule id="n8n-modular">
**模組化設計**：將複雜的廣告追蹤邏輯拆分為多個子工作流 (Sub-workflows)，透過 Execute Workflow 節點呼叫，以提高可讀性與重用性。
</rule>

<rule id="n8n-error">
**錯誤節點配置**：每個關鍵工作流都必須配置 Error Trigger 節點，確保在 API 呼叫失敗或資料解析錯誤時，能夠發送通知（例如透過 LINE 傳送錯誤訊息給管理員）。
</rule>

<rule id="n8n-clean">
**資料清洗**：在將資料寫入最終資料庫前，必須使用 Set 節點或 Code 節點進行資料格式化與清洗，確保欄位一致性。
</rule>

### 4.3 LINE Messaging API 規範

<rule id="line-async">
**非同步處理**：處理 LINE Webhook 時，必須在收到請求後立即回傳 `HTTP 200 OK`，將實際的訊息處理邏輯（如廣告追蹤記錄、回覆訊息）放入背景佇列或非同步執行，以避免 LINE 伺服器判定逾時。
</rule>

<rule id="line-verify">
**安全驗證**：所有來自 LINE 的 Webhook 請求，都必須驗證 `x-line-signature` 標頭，確保請求的合法性。
</rule>

---

## 5. 溝通與安全規則

<rule id="safety-confirm">
**破壞性操作確認**：在執行任何可能刪除資料、覆寫重要配置檔（如 `wrangler.toml`）、或重置 N8N 工作流的操作前，**必須**先向用戶發出明確的確認請求。詳見 `01-核心原則/security-and-safety-rules.md`。
</rule>

<rule id="safety-no-hardcode">
**環境變數保護**：絕不在程式碼中硬編碼 (Hardcode) API Keys、Tokens 或資料庫密碼。必須使用 Cloudflare Secrets 或 N8N Credentials 系統進行管理。
</rule>

<rule id="safety-progress">
**主動回報進度**：在執行耗時超過 1 分鐘的任務（如部署 Worker、大規模資料遷移）時，應主動回報當前進度，避免用戶認為系統停滯。
</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/cost-performance-optimization-rules.md` | Token 優化的完整策略（本文第 2 節的擴展） |
| `01-核心原則/security-and-safety-rules.md` | 安全規則的具體攔截條件（本文第 5 節的擴展） |
| `01-核心原則/quality-and-testing-rules.md` | 產出品質的評分標準 |
| `01-核心原則/work-core-principles.md` | 通用工作準則（與本文互補） |
| `skills/systematic-debugging.md` | 系統化除錯方法論（本文第 3 節的擴展） |
| `.ai/prompts/debug-prompt.md` | 除錯提示詞模板 |

---

## 6. 幻覺防護規則（Hallucination Guard）

> **補充說明**：AI 在知識盲區容易「自信地編造」看似合理的答案。本節規則防止 AI 在代碼生成時引入不存在的套件或 API，避免供應鏈攻擊與運行時崩潰。

<rule id="hallucination-1-verify-dependency">
**依賴真實性驗證**：在建議或引入任何第三方套件（npm package、Python library 等）之前，必須確認該套件在官方註冊表中真實存在。優先使用專案 `package.json` 或 `requirements.txt` 中已存在的依賴。若必須引入新依賴，必須單獨向用戶說明原因，徵求明確同意後才加入。
</rule>

<rule id="hallucination-2-api-verification">
**API 與函數驗證**：絕對禁止憑空捏造看似合理的 API 端點或函數名稱。如果對某個 API 的用法或參數不確定，必須先查閱官方文檔確認，或直接告訴用戶「我不確定這個 API 的正確用法，請提供文檔連結」。
</rule>

<rule id="hallucination-3-admit-ignorance">
**主動承認盲區**：當遇到缺乏上下文、不熟悉的技術棧或複雜邏輯時，必須直接告訴用戶「我不確定」，絕對禁止為了給出一個答案而自信地猜測。需要同時說明「我需要哪些具體資訊才能繼續」。
</rule>

---

## 7. 上下文遺失防護規則（Context Loss Guard）

> **補充說明**：隨著對話加深，AI 容易忘記早期的約束條件，或在修改 A 檔案時破壞 B 檔案的依賴。本節規則強制 AI 在修改前先讀取依賴，並使用結構化方式管理任務。

<rule id="context-loss-1-read-dependencies">
**修改前強制讀取依賴**：在開始修改任何代碼檔案之前，必須主動找出並讀取與該檔案有直接依賴關係的其他檔案（被呼叫的模組、共用的型別定義等），確認新的修改不會破壞現有的整合關係。
</rule>

<rule id="context-loss-2-structured-task">
**任務結構化**：處理複雜任務時，必須在 `.ai/active-context.md` 中追蹤任務狀態，將大任務拆分為有明確輸入輸出邊界的子任務。避免在單一超長對話中處理過於龐大的任務。（詳見本文第 2 節 `token-todo` 規則）
</rule>

<rule id="context-loss-3-constraint-check">
**輸出前約束校驗**：在交付最終代碼或方案前，必須回頭確認用戶最初的需求描述與約束條件，對比當前生成的結果，確認沒有遺漏或違反早期的要求。
</rule>

---

## 8. 過度自信防護規則（Overconfidence Guard）

> **補充說明**：AI 幾乎從不主動說「我不確定」，傾向於只給一條「最佳路徑」而不提風險。本節規則強制 AI 在給出技術方案時必須同時揭示缺點與替代方案。

<rule id="overconfidence-1-risk-disclosure">
**強制風險揭示**：在給出任何技術方案、架構決策或複雜的代碼實現時，必須同時列出**至少兩個潛在缺點或風險**（例如：效能瓶頸、擴展性限制、邊界情況下的脆弱性）。禁止只提優點不提代價。
</rule>

<rule id="overconfidence-2-alternatives">
**提供替代方案**：針對核心問題，主動提出至少一種替代方案，並簡要說明不同方案之間的 Trade-offs，讓用戶能基於完整資訊做決策，而不是只接受 AI 的單一建議。
</rule>

<rule id="overconfidence-3-context-request">
**主動索取上下文**：當用戶的問題過於簡略，或缺乏做出最佳決策所需的關鍵資訊時，必須暫停給出最終結論，明確列出「我還需要哪些具體資訊」（例如：預期的併發量、資料庫版本、目標用戶規模）。
</rule>

---

## 9. 一致性防護規則（Consistency Guard）

> **補充說明**：AI 在不同對話中容易給出風格迥異的代碼（命名法混用、架構模式不一）。本節規則強制 AI 在生成代碼前先分析現有風格，確保代碼庫整體一致。

<rule id="consistency-1-analyze-existing">
**修改前風格分析**：在對現有檔案進行任何修改或添加新代碼之前，必須先掃描該檔案中已有的代碼風格：命名習慣（camelCase / snake_case / PascalCase）、縮排格式、語法偏好（箭頭函數 vs 傳統函數等）。新生成的代碼必須與分析結果保持一致。
</rule>

<rule id="consistency-2-follow-spec">
**遵守專案規範**：如果專案中存在 Style Guide 或架構規範（如 `01-核心原則/` 下的相關文件），必須將其視為不可妥協的標準，即使這與 AI 自身的「預設偏好」不同。
</rule>

<rule id="consistency-3-architectural-alignment">
**架構決策一致性**：在實現相似的業務邏輯時，必須參考專案中已有的類似模組，採用相同的設計模式或架構分層，避免在同一個專案中混用多種不同的狀態管理方案或資料獲取模式。
</rule>
