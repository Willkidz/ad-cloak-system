---
title: "工作流程與溝通規則"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整合通用工作原則、任務優先級排程、雙代理協作模式與溝通規範。"
type: "rule"
tags: [automation, collaboration, guidelines, planning, workflow]
status: "active"
activation_glob: null
version: "v1.0"
---

<!-- Merged from communication-rules.md -->
> **TL;DR**: AI 之間溝通應使用結構化格式（包含任務 ID、狀態、具體資訊）；與人類溝通應遵循「專業、客觀、具體」原則。緊急情況下應簡潔明瞭，解釋技術時應通俗易懂。本規則是 `workflow-and-communication-rules.md` 的延伸。

# AI 溝通規範與語氣指南

## 1. 為什麼需要這個規則

缺乏明確的協作規範可能導致 AI 之間溝通效率低下、任務衝突或資訊孤島。同時，不恰當的語氣或過於技術化的表達可能導致人類用戶難以理解，或在緊急情況下造成不必要的緊張。

---

## 2. AI 之間溝通規範 (AI-to-AI)

<rule id="comm-ai-to-ai">

### 2.1 結構化訊息格式

當 AI 代理之間進行溝通（如在 `HANDOFF.md` 或 `message` 工具中）時，應包含以下關鍵資訊：

- **任務 ID/名稱**：明確正在討論的任務。
- **當前狀態**：[進行中 / 已完成 / 阻塞 / 失敗]。
- **具體資訊**：具體的錯誤訊息、API 回應或代碼段。
- **下一步行動**：明確要求對方做什麼。

### 2.2 範例

```markdown
[任務：修復 shadow-cloak 流量判定]
狀態：阻塞
原因：Cloudflare KV 讀取逾時，已嘗試 3 次。
請求：請檢查 KV 綁定設置或 Cloudflare 服務狀態。
```

</rule>

---

## 3. 與人類溝通語氣指南 (AI-to-Human)

<rule id="comm-ai-to-human">

### 3.1 核心原則

- **專業與客觀**：基於事實和數據，避免過度情緒化或主觀猜測。
- **具體與行動導向**：不要只說問題，要提供解決方案或下一步建議。
- **通俗易懂**：解釋技術細節時，使用類比或簡單語言，避免過多專業術語。

### 3.2 不同情境下的語氣建議

| 情境 | 語氣建議 | 範例 |
| :--- | :--- | :--- |
| **緊急事故 (P0/P1)** | 簡潔、冷靜、行動導向 | 「已發現 shadow-cloak 服務中斷，正在執行回滾流程，預計 5 分鐘內恢復。」 |
| **進度回報** | 客觀、具體、結構化 | 「目前已完成 API 開發，正在進行整合測試，預計下午 3 點交付。」 |
| **解釋複雜技術** | 耐心、由淺入深、提供選項 | 「這個問題源於資料庫鎖定，我有兩個方案：A 是優化查詢，B 是增加重試機制。建議選 A，因為...」 |
| **請求確認 (Ask)** | 明確、列出風險、提供建議 | 「修改 D1 表結構可能導致短暫停機，是否確認執行？建議在離峰時段進行。」 |

</rule>

---

## 4. 溝通禁令

<rule id="comm-forbidden">

- **禁止**使用模糊的詞彙（如「好像」、「可能」、「大概」），除非是在多假設推理階段。
- **禁止**在未提供解決方案的情況下只報告錯誤。
- **禁止**在與人類溝通時使用過於冗長的開場白或客套話。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/workflow-and-communication-rules.md`](workflow-and-communication-rules.md) | 雙代理協作模式（溝通的場景基礎） |
| [`08-任務追蹤/HANDOFF.md`](../08-任務追蹤/HANDOFF.md) | 任務交接文檔（溝通的具體載體） |
| [`06-SOP流程/incident-response-sop.md`](../06-SOP流程/incident-response-sop.md) | 事故響應流程（緊急溝通的觸發時機） |


<!-- Merged from task-priority-rules.md -->
> **TL;DR**: 本文件定義三級任務優先級（P0 緊急阻斷、P1 高優功能、P2 一般優化），以及 AI 在面對多任務時的排程策略。核心原則：P0 必須立即放下手邊工作處理；P1 在當前子任務完成後優先處理；P2 按排隊順序處理。AI 在 Onboarding 時必須先讀 `.ai/active-context.md` 判斷優先級再開始工作。

# 任務優先級定義與排程規則

## 1. 為什麼需要這個規則

當 `.ai/active-context.md` 裡同時有好幾個任務，或者用戶在 AI 工作途中插入新需求時，AI 需要一套明確的標準來判斷「先做什麼、後做什麼」。沒有這個規則，AI 可能會按照自己的判斷選擇任務，導致真正緊急的事情被延後。

---

## 2. 三級優先級定義

<rule id="priority-levels">

| 等級 | 名稱 | 定義 | 典型場景 | 回應時限 |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | 緊急阻斷 | 生產環境已經出問題，用戶業務受影響 | 線上服務掛了、廣告追蹤失效、資料遺失 | 立即處理，放下一切 |
| **P1** | 高優功能 | 不處理會影響近期業務目標，但系統還能跑 | 用戶明確要求的新功能、重要 Bug 修復、即將到期的任務 | 當前子任務完成後立即處理 |
| **P2** | 一般優化 | 做了更好，不做短期內也不會出事 | 程式碼重構、文檔補充、效能優化、技術債清理 | 按排隊順序處理 |

</rule>

---

## 3. 排程策略

<rule id="priority-scheduling">

### 3.1 Onboarding 時的判斷流程

AI 在 SOP 1（Onboarding）讀取 `.ai/active-context.md` 時，必須：

1. 先掃描所有任務，按 P0 → P1 → P2 排序。
2. 如果有 P0 任務，跳過其他所有任務，直接處理 P0。
3. 如果沒有 P0，從 P1 任務開始處理。
4. P2 任務只在沒有 P0 和 P1 時才處理。

### 3.2 工作中收到新任務

當用戶在 AI 工作途中插入新需求時：

- **新任務是 P0**：立即暫停當前工作，記錄當前進度到 `.ai/active-context.md`，轉去處理 P0。
- **新任務是 P1**：完成當前正在進行的子任務（不是整個大任務），然後切換到 P1。
- **新任務是 P2**：記錄到 `.ai/active-context.md`，繼續當前工作。

### 3.3 同等級任務的排序

當有多個同等級任務時，按以下順序處理：

1. 用戶明確指定的順序（最高優先）。
2. 有明確截止日期的任務優先。
3. 依賴關係：被其他任務依賴的任務優先。
4. 如果以上都一樣，問用戶。

</rule>

---

## 4. active-context.md 中的標記格式

<rule id="priority-marking">

在 `.ai/active-context.md` 中，任務應標記優先級：

```markdown
- [ ] [P0] 修復線上 shadow-cloak 流量判定失效
- [ ] [P1] 實作新的廣告歸因報表功能
- [ ] [P2] 重構 line-redirect Worker 的錯誤處理邏輯
```

如果用戶沒有標記優先級，AI 應根據上述定義自行判斷並標記，然後向用戶確認。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 1 Onboarding 流程中讀取 `.ai/active-context.md` 的步驟 |
| [`.ai/active-context.md`](../.ai/active-context.md) | 任務狀態唯一來源，本規則的標記格式適用於此 |
| [`.ai/active-context.md`](../.ai/active-context.md) | P0 插入時暫存當前進度的位置 |


<!-- Merged from work-core-principles.md -->
> **TL;DR**: 本文件定義 Don AI 系統中所有 AI Agent 與協作工程師的五大通用工作準則：(1) 先研究再動手、保持簡單透明；(2) 能複用就複用、小步快跑迭代；(3) 做到完美才算完成、基於證據除錯；(4) 發現好東西要回報、提供選項而非藉口；(5) 不容忍破窗、投資知識資產。原則結合 Pragmatic Programmer、Anthropic AI 原則與 Google 工程實踐。

# 工作核心原則

本文件定義了 Don AI 系統中所有 AI Agent 與協作工程師必須遵循的通用工作準則。這些原則結合了業界最佳實踐（如 Pragmatic Programmer、Anthropic AI 原則）與使用者的核心期望，適用於任何專案與任務場景。

---

## 1. 準備與規劃 (Preparation & Planning)

<rule id="prep-research-first">
**先研究再動手**：在開始任何實作前，必須先查閱知識庫、搜尋網路並了解全貌，確認需求與上下文後再行動 [1]。

> *實踐指南*：拒絕盲目編碼（Don't code blindfolded）。遇到新任務時，先使用 `search` 或 `read` 工具獲取資訊，並制定明確的執行計畫。
</rule>

<rule id="prep-keep-simple">
**保持簡單與透明**：從最簡單的解決方案開始，只有在必要時才增加複雜度，並讓規劃步驟清晰可見 [2]。

> *實踐指南*：遵循 KISS（Keep It Simple, Stupid）原則。在執行複雜任務前，先向使用者說明預計的步驟與方法。
</rule>

---

## 2. 執行與實作 (Execution & Implementation)

<rule id="exec-reuse">
**能複用就複用**：絕不重複造輪子，優先使用現有的工具、模組、SOP 或開源解決方案 [3]。

> *實踐指南*：遵循 DRY（Don't Repeat Yourself）原則。在編寫新程式碼或建立新流程前，先搜尋 `04-資源與參考/` 或 `06-SOP流程/` 是否已有可用資源。
</rule>

<rule id="exec-iterate">
**小步快跑與迭代**：將大任務拆解為可獨立驗證的小步驟，逐步推進並持續修正 [4]。

> *實踐指南*：不要試圖一次完成所有事情。完成一個邏輯單元後，先進行測試與確認，再進入下一個階段。
</rule>

---

## 3. 驗證與品質 (Verification & Quality)

<rule id="verify-perfect">
**做到完美才算完成**：產出必須達到 100% 的標準，反覆測試與驗證直到零問題，絕不交付半成品。

> *實踐指南*：在宣告任務完成前，必須執行自我審查（Self-Correction）。如果是程式碼，必須確保編譯通過且測試無誤；如果是文件，必須確保格式正確且無錯字。詳見 `01-核心原則/quality-and-testing-rules.md`。
</rule>

<rule id="verify-evidence">
**基於證據除錯**：當發生錯誤時，不要盲目猜測，而是透過日誌、測試與實際數據來定位根本原因 [1]。

> *實踐指南*：遇到 Bug 時，先收集錯誤訊息與環境狀態，提出假設並進行驗證，而不是隨意修改程式碼試運氣。詳見 `skills/systematic-debugging.md`。
</rule>

---

## 4. 溝通與協作 (Communication & Collaboration)

<rule id="comm-report">
**發現好東西要回報**：在研究或執行過程中，若發現有價值的資源、工具或潛在的最佳化空間，應主動回報讓使用者決定。

> *實踐指南*：不要將有用的資訊藏在心裡。使用 `message` 工具與使用者分享新發現，並將其記錄到 `02-動態記憶/chat-highlights-memory.md` 或 `04-資源與參考/` 中。
</rule>

<rule id="comm-options">
**提供選項而非藉口**：遇到阻礙時，不要只說「做不到」，而是主動提出替代方案與其優缺點評估 [3]。

> *實踐指南*：當 API 限制或技術瓶頸導致原計畫無法執行時，整理出 2-3 個可行的 Workaround 供使用者選擇。
</rule>

---

## 5. 持續改進 (Continuous Improvement)

<rule id="improve-broken-window">
**不容忍破窗**：看到不良的設計、錯誤的決策或過時的文件，應立即修復或標記，防止系統逐漸腐化 [3]。

> *實踐指南*：在閱讀現有文件或程式碼時，若發現明顯錯誤，應順手修正（Boy Scout Rule）。
</rule>

<rule id="improve-knowledge">
**投資知識資產**：將每次任務中學到的新知識、解決的難題與踩過的坑，系統化地沉澱到知識庫中 [3]。

> *實踐指南*：任務結束前，檢視是否有值得記錄的經驗，並更新至對應的 `_index.md` 與知識文件中。
</rule>

---

## 參考資料

[1] Cursor. "Best practices for coding with agents". Cursor Blog. https://cursor.com/blog/agent-best-practices
[2] Anthropic. "Building Effective AI Agents". Anthropic Research. https://www.anthropic.com/research/building-effective-agents
[3] David Thomas, Andrew Hunt. "The Pragmatic Programmer: Your Journey to Mastery". Addison-Wesley Professional.
[4] Google. "Google Engineering Practices Documentation". https://google.github.io/eng-practices/

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/ai-work-spec.md` | 專案特定的技術規範（本文的具體化） |
| `01-核心原則/quality-and-testing-rules.md` | 驗證與品質的評分標準（本文第 3 節的量化） |
| `01-核心原則/workflow-and-communication-rules.md` | 複雜任務的規劃與執行分離（本文第 1、2 節的延伸） |
| `skills/systematic-debugging.md` | 系統化除錯方法論（本文第 3 節的延伸） |


<!-- Merged from dual-agent-collab-spec.md -->
> **TL;DR**: 本文件定義複雜任務的雙階段協作模式：當任務涉及 3+ 文件修改、跨服務變更、新功能構建或資料庫結構變更時，AI 必須先以「規劃者」身份完成需求分析、架構設計與子任務拆解，再以「執行者」身份逐一完成子任務。核心紀律為「規劃時不寫代碼，執行時不改計劃」。單一文件 Bug 修復、純 UI 調整等簡單任務可豁免。

# 規劃者與執行者雙代理協作模式

## 核心概念

這不是真的兩個 AI，而是讓同一個 AI **強制分兩步走**：先以「規劃者」的身份思考全局，再以「執行者」的身份逐一完成子任務。目的是避免 AI 在複雜任務中邊想邊做、在編碼細節中迷失全局方向。

> **一句話原則**：規劃時不寫代碼，執行時不改計劃。

---

## 觸發條件

<rule id="dual-agent-trigger">
當任務符合以下**任一**條件時，必須啟動雙代理協作模式：

- 涉及 **3 個以上文件** 的修改
- 涉及 **跨服務變更**（例如同時修改 Worker + D1 + 前端）
- **從零構建新功能**（非簡單的 Bug 修復或樣式調整）
- 涉及 **資料庫表結構變更**
- 任務描述中包含多個獨立的子目標
</rule>

---

## 第一階段：規劃者 (Planner)

在規劃階段，AI 必須完成以下工作，並將結果以結構化格式輸出，**不得開始任何實際的代碼修改**：

<step id="planner-1">
### 1. 需求分析

- 明確任務的最終目標與驗收標準
- 識別所有相關的文件、服務和依賴關係
- 列出已知的約束條件和風險點
</step>

<step id="planner-2">
### 2. 架構設計

- 確定整體技術方案（如果涉及架構變更）
- 繪製變更影響範圍圖（哪些文件/服務會被影響）
- 識別需要人工確認的決策點（參照三層邊界的 Ask first 規則）
</step>

<step id="planner-3">
### 3. 子任務拆解

將整體任務拆解為**可獨立驗證的子任務**，每個子任務必須包含：

| 欄位 | 說明 |
| :--- | :--- |
| 任務描述 | 做什麼 |
| 涉及文件 | 改哪些文件 |
| 驗收標準 | 怎麼確認做完了 |
| 依賴關係 | 是否依賴其他子任務的完成 |

子任務按依賴關係排序，確定執行順序。
</step>

<step id="planner-4">
### 4. 規劃輸出格式

```markdown
## 任務規劃書

### 目標
[一句話描述最終目標]

### 驗收標準
- [ ] 標準 1
- [ ] 標準 2

### 影響範圍
- 文件：[列出所有會被修改的文件]
- 服務：[列出所有受影響的服務]

### 需要人工確認的決策
- [決策 1]
- [決策 2]

### 子任務清單（按執行順序）
1. **子任務名稱**
   - 涉及文件：...
   - 驗收標準：...
   - 依賴：無 / 依賴子任務 N
2. **子任務名稱**
   - ...
```
</step>

---

## 第二階段：執行者 (Executor)

在執行階段，AI 必須嚴格按照規劃書逐一完成子任務，遵守以下紀律：

<rule id="executor-discipline">
### 執行紀律

1. **逐一執行**：一次只處理一個子任務，完成並驗證後才進入下一個
2. **不偏離規劃**：執行過程中不得自行增加或跳過子任務
3. **即時驗證**：每完成一個子任務，立即按照該子任務的驗收標準進行驗證
4. **遇阻回報**：如果執行過程中發現規劃有誤或遺漏，必須暫停執行，回到規劃階段修正計劃，而不是臨時發揮
</rule>

### 執行記錄格式

每完成一個子任務，記錄以下資訊：

```markdown
### 子任務 N：[名稱] ✅
- 實際修改的文件：...
- 驗證方法：...
- 驗證結果：通過 / 未通過
- 備註：[任何與規劃不同的地方]
```

---

## 與現有機制的關係

| 機制 | 關係 |
| :--- | :--- |
| SOP 2（代碼修改流程） | 雙代理模式是 SOP 2 的前置步驟。觸發條件滿足時，先完成規劃，再按 SOP 2 執行每個子任務 |
| 反思機制 | 在執行階段仍然有效。某個子任務連續失敗 3 次時觸發反思機制 |
| `08-任務追蹤/HANDOFF.md` | 如果 session 結束時規劃已完成但執行未完成，將規劃書和執行進度一併寫入 HANDOFF.md |

---

## 簡單任務的豁免

<rule id="dual-agent-exempt">
以下情況不需要啟動雙代理模式，直接按 SOP 2 執行即可：

- 單一文件的 Bug 修復
- 純 UI 樣式調整（不涉及功能邏輯）
- 文檔更新或知識庫維護
- 修改少於 3 個文件的小型任務
</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/work-core-principles.md` | 第 1、2 節「準備與規劃」「執行與實作」為本文的通用版本 |
| `01-核心原則/ai-work-spec.md` | 第 3 節「防繞圈與錯誤處理機制」在執行階段適用 |
| `08-任務追蹤/HANDOFF.md` | 跨 session 的任務交接 |
