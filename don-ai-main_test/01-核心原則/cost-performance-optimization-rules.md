---
title: "成本與效能優化規則"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整合 Token 節省策略、API 成本控制與系統效能優化指南。"
type: "rule"
tags: [analysis, cloudflare, database, n8n, token-saving]
status: "active"
activation_glob: null
version: "v1.0"
---

<!-- Merged from token-saving-rules.md -->
> **TL;DR**: 本文件定義 10 條 Token 優化核心策略與三層遞進載入架構（L0 連結標題 → L1 摘要索引 → L2 完整文件）。核心原則為「先查 repo 再搜索」「搜完必存」「讀摘要不讀全文」「用指針不複製內容」。三層載入可將初始上下文從 200k+ Token 降至 50k 以下。

# 省 Token 規則

本文件專門記錄所有與 Token 優化相關的規則，整合自 CLAUDE.md 最佳實踐、Cline Memory Bank 策略、以及 Manus AI 上下文工程經驗。AI 在每次任務中都應遵守這些規則以控制成本。

---

## 10 條核心策略

<rule id="token-1-repo-first">
### 1. 先查 repo 再搜索

在回答問題或執行任務前，優先搜索 don-ai 知識庫。查到就直接使用，沒查到才進行外部搜索。避免重複搜索已經記錄過的知識。
</rule>

<rule id="token-2-search-save">
### 2. 搜完必存

每次外部搜索獲得有價值的結果後，必須立即將關鍵資訊寫回 don-ai 對應的資料夾（通常是 `04-資源與參考/`），確保下次不需要重複搜索。
</rule>

<rule id="token-3-read-summary">
### 3. 讀摘要不讀全文

進入任何資料夾時，先讀 `_index.md` 摘要索引，根據 `title`、`tags`、`summary` 判斷需要深入讀取哪個文件。不要盲目讀取所有文件。
</rule>

<rule id="token-4-no-repeat">
### 4. 不重複解釋

已經記錄在知識庫中的內容，直接引用文件路徑（如「詳見 `03-專案/斗篷管理後台/systemPatterns.md`」），不要在回覆中重新解釋一遍。
</rule>

<rule id="token-5-precise-locate">
### 5. 精準定位

善用 YAML frontmatter 中的標籤和索引進行精準定位。

<example>
使用 `grep -r "category: principle" 01-核心原則/` 快速找到原則文件，或用 `grep -r "activation_glob" 01-核心原則/` 找到帶啟動條件的文件。
</example>
</rule>

<rule id="token-6-prompt-limit">
### 6. 控制 prompt 在 300 行以內

系統提示詞和任務描述應保持簡潔，建議控制在 300 行以內。LLM 能穩定遵循的指令數量上限約為 150-200 條，超過會降低遵循率。
</rule>

<rule id="token-7-pointer">
### 7. 用指針指向檔案，不複製內容到 prompt

在外部文檔中，偏好使用指向原始碼特定文件和行號的引用（`file:line`），而非直接複製程式碼範例到 prompt 中。將特定主題分散到獨立文件，在主文件中僅提供「指針」。
</rule>

<rule id="token-8-todo">
### 8. 維持 todo.md 追蹤任務目標

在處理複雜任務時，必須維護 `08-任務追蹤/TODO.md`。透過不斷「提醒」自己任務目標，避免在複雜任務中迷失方向。每個步驟完成後更新狀態。
</rule>

<rule id="token-9-stable-prefix">
### 9. 維持提示詞前綴穩定避免快取失效

避免在系統提示詞開頭使用動態內容（如精確到秒的時間戳），以防止快取失效，降低運算成本。盡量讓上下文僅可附加（append-only），保證資料序列化順序確定。
</rule>

<rule id="token-10-clineignore">
### 10. 用 .clineignore 模式排除不需要讀的檔案

在掃描目錄或讀取文件時，主動忽略以下目錄和文件：

- `node_modules/`
- `.wrangler/`
- `dist/`
- `build/`
- `.git/`
- `09-歸檔/`（除非用戶明確要求查找歷史記錄）

這能將初始上下文從 200k+ Token 大幅降低到 50k 以下。
</rule>

---

## 三層載入架構 (Three-tier Loading)

為了在漸進式揭露的基礎上進一步優化 Token 消耗，將知識庫的讀取過程強化為三層遞進載入機制。AI 在每次讀取知識庫時，必須按照 L0 → L1 → L2 的順序遞進深入，而不是一次性讀取全文。

### L0：連結標題層（幾個字，判斷方向）

- **讀取內容**：`00-系統索引/llms.txt` 中的連結標題
- **目的**：快速判斷任務涉及哪些資料夾，排除不相關的目錄
- **Token 消耗**：極低（通常 < 500 Token）
- **決策**：確定哪些資料夾與當前任務相關，只對相關資料夾進入 L1

<example>
任務是「修復廣告日誌頁面的排序 Bug」，在 L0 層判斷出需要閱讀 `03-專案/斗篷管理後台/` 和 `01-核心原則/`，不需要讀 `04-資源與參考/` 或 `09-歸檔/`。
</example>

### L1：摘要索引層（一段話，確認是否需要）

- **讀取內容**：目標資料夾的 `_index.md` 摘要
- **目的**：透過每個文件的 `title`、`tags`、`summary` 判斷哪些文件與任務直接相關
- **Token 消耗**：低（通常 < 2000 Token / 每個資料夾）
- **決策**：確定具體需要讀取哪些文件的全文，只對確認需要的文件進入 L2

<example>
在 `03-專案/斗篷管理後台/_index.md` 中看到「廣告日誌頁面」相關的文件摘要，確認需要讀取該文件；而「域名管理」相關的文件與本次任務無關，跳過。
</example>

### L2：完整文件層（全文，實際使用）

- **讀取內容**：確認需要的文件全文
- **目的**：獲取完整的技術細節、代碼範例、配置參數等
- **Token 消耗**：正常（但因為已經過濾，總量可控）
- **決策**：執行任務

### 三層載入流程圖

```
任務開始
  │
  ├─ L0: 讀 llms.txt 標題 → 判斷相關資料夾
  │     │
  │     ├─ 不相關 → 跳過（節省 Token）
  │     └─ 相關 → 進入 L1
  │
  ├─ L1: 讀 _index.md 摘要 → 判斷相關文件
  │     │
  │     ├─ 不相關 → 跳過（節省 Token）
  │     └─ 相關 → 進入 L2
  │
  └─ L2: 讀完整文件 → 執行任務
```

### 與現有策略的關係

三層載入是對現有「策略 3：讀摘要不讀全文」的系統化升級：

- 原有策略 3 是 L1 → L2 的兩層概念
- 三層載入在前面增加了 L0 層，讓 AI 在讀 `_index.md` 之前就先排除不相關的資料夾
- 原有策略 3 的內容不變，三層載入是其上層概念的補充

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/ai-work-spec.md` | 第 2 節「Token 優化與記憶管理規則」為本文的精簡版 |
| `01-核心原則/doc-standards-spec.md` | frontmatter 標準格式，支援精準檢索 |
| `00-系統索引/llms.txt` | L0 層的讀取目標 |
| `00-系統索引/common-cmd.md` | 上下文生命週期中的載入策略 |


<!-- Merged from cost-optimization-rules.md -->
> **TL;DR**: 成本優化應遵循「最小資源消耗」原則。核心策略包括：優化 Cloudflare Workers CPU 時間、減少 D1 資料庫讀寫次數、合併 N8N 工作流節點、精簡 AI Token 消耗。AI 在設計方案時必須考慮成本影響，並在超出預算閾值時發出警報。

# 成本優化規則

## 1. 為什麼需要這個規則

在雲端服務環境中，資源消耗直接轉化為金錢成本。缺乏成本意識可能導致資源浪費，增加營運負擔，特別是在高流量或大規模部署的場景下。這個規則確保系統在高效運行的同時，保持經濟性。

---

## 2. 核心優化策略

<rule id="cost-core-strategies">

### 2.1 Cloudflare 成本優化

- **優化 CPU 時間**：減少不必要的計算和循環，將 CPU 時間控制在免費額度內（通常為 10ms）。
- **減少 D1 讀寫**：優先使用 KV 或 Cache API 減少對 D1 的直接查詢。使用 `D1.batch()` 合併寫入操作。
- **流量過濾**：在 Worker 入口處過濾惡意流量或無效請求，避免觸發後續高成本邏輯。

### 2.2 N8N 成本優化

- **合併節點**：盡可能在單個 Code 節點中完成多個邏輯處理，減少工作流節點總數。
- **減少執行次數**：使用條件判斷（If 節點）過濾不需要處理的數據，避免觸發完整工作流。
- **批量處理**：在可能的情況下，將多條數據合併為一個請求發送給 N8N。

### 2.3 AI Token 成本優化

- **精簡上下文**：遵循 `cost-performance-optimization-rules.md`，僅載入必要的規則和文件。
- **精簡輸出**：優先輸出結構化數據（JSON/YAML），避免冗長的自然語言解釋。
- **緩存利用**：保持上下文穩定，提高 AI 模型的緩存命中率。

</rule>

---

## 3. 成本監控與警報

<rule id="cost-monitoring">

### 3.1 監控指標

AI 應定期關注以下成本相關指標：

- **Cloudflare Workers**：請求數、CPU 時間、KV 讀寫次數。
- **Cloudflare D1**：查詢次數、儲存空間使用量。
- **N8N**：工作流執行次數、單次執行耗時。
- **AI API**：Token 消耗量、API 呼叫次數。

### 3.2 警報機制

當發現以下情況時，AI 必須主動向用戶發出警報：

- 單次任務的 Token 消耗異常增加（如超過預期 2 倍）。
- 某個 Worker 的 CPU 時間持續接近限制。
- D1 資料庫查詢次數突然激增。
- N8N 工作流執行失敗率上升（導致重複執行成本）。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/cost-performance-optimization-rules.md`](cost-performance-optimization-rules.md) | Token 優化的具體實施策略 |
| [`01-核心原則/cost-performance-optimization-rules.md`](cost-performance-optimization-rules.md) | 效能優化通常能直接降低成本 |
| [`01-核心原則/dependency-and-tool-rules.md`](dependency-and-tool-rules.md) | 引入新工具前的成本評估 |


<!-- Merged from performance-optimization-rules.md -->
> **TL;DR**: 效能優化應遵循「先測量再優化」原則。核心策略包括：Workers 程式碼保持輕量（避免大 npm 套件）、優先使用 Cloudflare KV/Cache、優化 D1 資料庫查詢（索引、批量處理）、異步處理非關鍵路徑。AI 在修改高頻調用代碼後必須進行效能評估。

# 通用效能優化規則

## 1. 為什麼需要這個規則

在廣告追蹤系統中，毫秒級的延遲都可能影響用戶體驗和歸因準確性。缺乏明確的效能優化規則可能導致 AI 在開發過程中不重視效能，或在系統出現效能問題時不知如何著手。

---

## 2. 核心優化策略

<rule id="perf-core-strategies">

### 2.1 Cloudflare Workers 輕量化

- **減少依賴**：避免引入龐大的 npm 套件（如 `moment.js`、`lodash` 全量包），優先使用原生 Web APIs（如 `Intl`、`crypto`）。
- **冷啟動優化**：減少全局作用域的初始化邏輯，將耗時操作延遲到請求處理時執行。
- **Tree Shaking**：確保建置工具（如 `esbuild`）能有效移除未使用的程式碼。

### 2.2 快取策略 (Caching)

- **優先使用 KV/Cache**：對於頻繁讀取且變動不頻繁的數據（如廣告配置、域名設置），優先使用 Cloudflare KV 或 Cache API。
- **設置適當的 TTL**：根據數據的時效性設置合理的快取過期時間，平衡一致性與效能。
- **Stale-While-Revalidate**：在背景更新快取的同時，先返回舊數據以減少延遲。

### 2.3 資料庫 (D1) 查詢優化

- **索引優化**：確保所有 `WHERE`、`JOIN` 和 `ORDER BY` 子句中使用的欄位都有適當的索引。
- **避免全表掃描**：禁止使用 `SELECT *`，只查詢需要的欄位。
- **批量處理**：使用 `D1.batch()` 合併多個寫入操作，減少往返次數。

### 2.4 異步處理 (Asynchronous)

- **非關鍵路徑異步化**：對於不影響請求回應的邏輯（如日誌記錄、數據分析、發送通知），使用 `ctx.waitUntil()` 在背景執行，避免阻塞回應。

</rule>

---

## 3. 效能測試與評估

<rule id="perf-testing">

### 3.1 測試時機

- 修改高頻調用的 API 端點（如 `/redirect`、`/pixel`）。
- 引入新的大型依賴或複雜演算法。
- 發現系統延遲明顯增加時。

### 3.2 評估指標

AI 在進行效能評估時，應關注以下指標：

- **回應時間 (Latency)**：P50、P95、P99 延遲。
- **CPU 時間 (CPU Time)**：Worker 執行的 CPU 消耗（Cloudflare 限制為 10ms/50ms）。
- **記憶體使用量 (Memory Usage)**：Worker 執行的記憶體消耗（Cloudflare 限制為 128MB）。

### 3.3 測試方法

- 使用 `wrangler dev` 模擬本地環境測試。
- 使用 `console.time()` 和 `performance.now()` 測量關鍵代碼段的執行時間。
- 觀察 Cloudflare Dashboard 的實時日誌和指標。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/ai-work-spec.md`](ai-work-spec.md) | 第 4.1 節「Cloudflare Workers 規範」中的輕量化要求 |
| [`01-核心原則/cost-performance-optimization-rules.md`](cost-performance-optimization-rules.md) | 效能優化通常能降低資源消耗和成本 |
| [`06-SOP流程/acceptance-checklist.md`](../06-SOP流程/acceptance-checklist.md) | 部署後驗證中的效能指標檢查 |
