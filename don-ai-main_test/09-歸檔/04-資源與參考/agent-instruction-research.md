---
title: "AI Agent 指令設計與軟體測試驗證分級框架研究報告"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）AI Agent 指令設計與軟體測試驗證分級框架研究報告"
type: "analysis"
tags: [ai-agent, changelog]
status: "archived"
---
---
title: "AI Agent 指令設計與軟體測試驗證分級框架研究報告"
category: reference
priority: high
applicable_tools: all
last_updated: 2026-03-27
summary: "探討 AI Agent 指令設計最佳實踐與軟體測試驗證分級框架，提供節省 Token、避免多餘動作的策略及具體的指令規則範本。"
id: "20260325-024356"
type: "reference"
tags: ["reference", "research"]
status: archived
created: 2026-03-25
updated: "2026-03-27"

archived_reason: "已整合至 04-資源與參考/AI_Agent開發最佳實踐整合.md"
merged_into: "04-資源與參考/AI_Agent開發最佳實踐整合.md"
archived_date: "2026-03-28"---

# AI Agent 指令設計與軟體測試驗證分級框架研究報告

**摘要**：本報告旨在探討「AI Agent 指令設計最佳實踐」與「軟體測試驗證分級框架」兩大主題，並將其整合成一份實用的參考指南。報告內容涵蓋了如何優化 System Prompt 以節省 Token、避免 AI 執行多餘動作的策略，以及業界成熟的測試分級方法論。最後，我們提供了一套具體的建議與可直接套用的 AI Agent 指令規則範本，特別關注於如何以最少的步驟確認程式碼修改的正確性。

## 主題一：AI Agent 指令設計最佳實踐

在開發基於大型語言模型 (LLM) 的 AI Agent 時，指令設計（Prompt Engineering）的品質直接影響到系統的效能、成本與可靠性。以下是業界在指令設計上的最佳實踐。

### 節省 Token 的 System Prompt 設計

<rule id="token-optimization">
LLM 的計費通常基於處理的 Token 數量，因此優化 System Prompt 是控制成本的關鍵。首先，**精簡工具列表**是一項基本策略。當 Agent 選擇工具時，它會讀取所有可用的選項，即使是未使用的工具也會被標記化並計費。因此，應根據任務的相關性過濾工具列表，僅傳遞必要的工具給模型 [1]。

其次，採用**條件式提示詞**可以有效減少不必要的上下文。System Prompt 中常包含特定工具的詳細說明（例如「當使用電子郵件工具時...」），這些說明應僅在該工具被包含在過濾後的列表中時才動態加入 [1]。此外，**利用提示詞快取 (Prompt Caching)** 也是一項強大的優化技術。將不變的系統提示詞部分移至最前面，模型可以有效地快取這些初始 Token，當後續輸入（如使用者訊息）改變時，只需重新處理變更的部分，這可以大幅降低處理成本 [1]。

最後，使用**結構化輸出**（如 OpenAI 的 Structured Outputs）代替在 System Prompt 中提供冗長的範例回應，不僅能確保格式的一致性、減少幻覺，還能顯著減少輸入 Token 的數量 [1]。
</rule>

### 避免 AI 做多餘的動作

<rule id="avoid-redundant-actions">
為了防止 AI 進行預防性調查、重複搜尋或給出廢話回覆，指令設計必須清晰且具體。**明確的工具描述**是第一步。工具的名稱和描述必須精確，模糊的名稱會混淆模型，導致錯誤的呼叫、浪費 Token 以及較慢的回應速度 [1]。

在錯誤處理方面，應避免**非結構化的錯誤回應**。每次重試都是一次新的請求和計費。與其回傳通用的「400 Bad Request」，不如回傳結構化且有幫助的訊息，說明出了什麼問題、需要什麼資訊以及如何修復。這能減少重試次數，防止 Agent 陷入無止盡的猜測迴圈 [1]。

此外，指令應採用**肯定句表述**。告訴 Agent「要做什麼」而不是「不要做什麼」。雖然防護護欄（Guardrails）對於指定 Agent 絕對不能做的事情很重要，但過多的負面表述會讓 AI 混淆。將指令重寫為可執行的指導，例如將「如果...則不要發送電子郵件」改為「僅在...時發送電子郵件」 [2]。
</rule>

### 優先查已知資料而非重新搜尋

<rule id="prioritize-known-data">
要讓 AI 在不確定時優先依賴已知資料，可以透過**分離業務規則與動作**來實現。LLM 在進行精確計算或複雜邏輯判斷時並不總是可靠。任何確定性的規則、計算和資料庫操作都應由系統的 Action（如 API 呼叫或腳本）來處理，而非讓 AI 自行推理或搜尋 [2]。

在多輪對話中，**上下文策略**也至關重要。不需要重播整個對話歷史，可以考慮僅保留最後 N 條訊息、總結舊對話，或僅保留關鍵的決策點和使用者指示。這不僅節省 Token，還能幫助模型聚焦於當前最重要的已知資訊 [1]。
</rule>

### 成熟的 Agent 指令設計框架

業界已發展出多種成熟的框架來指導 AI Agent 的行為，其中最具代表性的是 **ReAct (Reasoning and Acting)**。ReAct 是一個結合推理與行動的通用範式。它促使 LLM 交替生成推理軌跡（Thought）和特定任務的行動（Act）。生成推理軌跡允許模型推導、追蹤和更新行動計畫，甚至處理異常情況；而行動步驟則允許模型與外部來源（如知識庫或環境）互動並收集資訊。這種方法不僅提高了回應的可靠性和事實性，還增強了人類的可解釋性 [3]。

另一個值得注意的框架是 **Skeleton-of-Thought (SoT)**。這是一種旨在減少 LLM 推理延遲的技術。它首先提示 LLM 生成回應的結構化大綱（骨架），然後平行擴展骨架的各個部分，最後合併成最終答案。這種平行生成的方法比傳統的順序解碼快得多 [4]。

### 常見的指令設計錯誤（反模式）

在設計指令時，常見的錯誤會導致 Token 浪費和行為不可預測。**條件不唯一**是一個典型的反模式。如果在指令中提供語義相似的多個條件（例如「如果資料遺失...」和「如果資料不完整...」），AI 會感到混淆，因為它被告知在相同情況下執行不同的指令，這會導致錯誤的選擇 [2]。

另一個錯誤是**在同一步驟中包含矛盾指令**。例如，將「如果是則做 A，如果否則做 B」混在同一指令中。正確的做法是將邏輯拆分，保持每個指令的單一性和一致性 [2]。此外，**缺乏一致的術語**也會造成問題。在指令中交替使用「case」、「ticket」和「issue」來指代同一事物，會讓 AI 在長對話中難以維持邏輯一致性 [2]。

## 主題二：軟體測試驗證分級框架

在軟體開發中，建立有效的測試驗證框架是確保品質和交付速度的關鍵。以下探討業界如何根據修改類型決定測試深度，以及相關的方法論。

### 根據「修改類型」決定「測試深度」

業界廣泛採用**測試影響分析 (Test Impact Analysis, TIA)** 來優化測試流程。TIA 是一種智慧方法，透過識別程式碼變更與驗證這些變更的測試之間的關聯，來決定應該執行哪些測試。當開發人員提交修改時，TIA 會分析哪些部分的程式碼被修改，並確定哪些測試案例（無論是自動化還是手動）與這些更新最相關。這使得團隊能夠專注於實際需要關注的區域，而不是盲目地重新執行整個回歸測試套件 [5]。

此外，**風險基礎測試 (Risk-Based Testing)** 也是一種重要的策略。它根據潛在影響和失敗的可能性來排定測試的優先級。例如，如果修改涉及核心支付邏輯，這屬於高風險區域，需要深度的整合測試和端到端測試；相反，如果只是修改了 CSS 樣式，這通常屬於低風險，可能只需要進行視覺回歸測試或簡單的 UI 測試即可 [6]。

### 測試分級方法論

**測試金字塔 (Test Pyramid)** 是最著名的測試分級隱喻，它建議將軟體測試分為不同粒度的層級，並指導各層級應包含的測試數量 [7]。

| 測試層級 | 描述 | 數量與速度 |
| :--- | :--- | :--- |
| **單元測試 (Unit Tests)** | 測試獨立的程式碼單元（如函數或方法），通常使用 Mock 隔離外部依賴。 | 數量最多，執行速度最快。 |
| **整合測試 (Integration Tests)** | 測試不同模組或服務之間的互動，例如資料庫整合或外部 API 呼叫。 | 數量中等，執行速度中等。 |
| **端到端測試 (E2E Tests)** | 從使用者的角度測試整個應用程式的完整工作流程，通常涉及 UI 互動。 | 數量最少，執行速度最慢，維護成本最高。 |

在實際應用中，團隊還會結合**冒煙測試 (Smoke Test)** 和**回歸測試 (Regression Test)**。冒煙測試是初步的測試過程，用於檢查軟體的關鍵功能是否正常運作，以決定是否值得進行進一步的深度測試。回歸測試則是確保新的程式碼變更沒有破壞既有功能，通常會結合 TIA 進行選擇性執行 [8]。

### 定義「測試完成」的驗收標準

為了避免只看表面行為就認為測試通過，必須明確定義**驗收標準 (Acceptance Criteria)**。驗收標準是產品、使用者故事或工作增量必須滿足的具體條件，才能被接受 [9]。

驗收測試通常分為幾個類型：
1. **使用者驗收測試 (UAT)**：終端使用者驗證系統是否符合業務需求和預期的使用者體驗。
2. **營運驗收測試 (OAT)**：驗證應用程式的營運準備情況，包括效能、安全性和可用性。
3. **合約與法規驗收測試**：確保系統滿足合約要求（如 SLA）和相關的法律法規 [10]。

一個良好的驗收標準不應僅限於 UI 層面的行為。例如，在測試一個註冊流程時，驗收標準除了「使用者看到成功註冊的提示」外，還必須包含「資料庫中正確建立了包含加密密碼的使用者記錄」以及「系統成功發送了歡迎電子郵件」。這種深度的驗證能確保系統的內部狀態與外部行為一致。

### 數據流系統的測試驗證最佳實踐

<rule id="data-flow-testing">
對於涉及 API 到資料庫的數據流系統，**端到端 API 測試**是確保系統無縫運作的關鍵。它透過串聯多個 API 請求來驗證完整的流程（如使用者註冊或購買流程）[11]。

在驗證 API 回應時，最佳實踐包括：
- **驗證回應資料**：不僅要檢查 HTTP 狀態碼（如 200 OK），還必須驗證回應的結構（Schema）、資料的準確性以及效能指標 [11]。
- **測試資料管理**：使用獨立的測試資料庫，並填充真實但經過清理（Sanitized）的資料，以模擬生產環境同時保持隱私合規。確保測試環境的配置與生產環境一致 [11]。
- **合約測試 (Contract Testing)**：在微服務架構中，合約測試用於驗證服務之間的互動是否遵守共享的協議（合約）。它比傳統的 E2E 測試更輕量、更快速，且能有效減少整合風險 [12]。
</rule>

## 整合建議與規則範本

將 AI Agent 的強大能力與嚴謹的軟體測試框架結合，可以大幅提升自動化驗證的效率。以下是針對「如何用最少的步驟確認修改正確」的具體建議，以及可直接套用的指令規則範本。

### 具體建議

> **整合建議核心**：結合智慧分析與狀態驗證，確保測試的精準度與深度。

<step>
1. **實施智慧測試影響分析**：在 AI Agent 執行任何測試之前，強制其先分析 Git 提交記錄或程式碼差異（Diff）。Agent 應具備判斷修改範圍的能力，並僅挑選與該範圍直接相關的測試案例執行，避免盲目運行全套測試。
</step>
<step>
2. **結合 ReAct 框架與風險評估**：要求 AI Agent 在採取行動前，必須先輸出 `Thought` 進行推理。在推理階段，Agent 需評估修改的風險等級（例如：修改支付核心 vs. 修改按鈕顏色），並據此決定測試的深度（選擇單元測試、API 測試還是 UI 測試）。
</step>
<step>
3. **強制結構化狀態驗證**：對於涉及數據流的修改，AI Agent 的驗收標準必須包含後端狀態的確認。Agent 應優先透過呼叫 API 或直接查詢測試資料庫來驗證最終狀態，而不是依賴緩慢且容易不穩定的 UI 測試來間接推斷。
</step>

### AI Agent 測試驗證指令規則範本

以下範本可直接套用於 AI Agent 的 System Prompt 中，以指導其進行高效的測試驗證：

<example>
```markdown
# AI Agent 測試驗證指令範本

## 角色與目標
你是一個專業的軟體測試驗證 Agent。你的目標是根據使用者的程式碼修改類型，以最少的 Token 和執行步驟，精確驗證修改的正確性。

## 核心原則
1. **精準驗證**：僅執行與修改範圍相關的測試，絕不盲目執行全套測試。
2. **深度適配**：根據修改類型決定測試深度：
   - 純 UI/樣式變更 -> 執行視覺回歸或 UI 元件測試。
   - 核心邏輯變更 -> 執行相關的單元測試與整合測試。
   - 架構或數據流變更 -> 執行端到端 API 測試與資料庫狀態驗證。
3. **狀態確認**：對於數據流操作，必須驗證最終狀態（如資料庫記錄、快取更新），不可僅依賴 API 的 HTTP 回應碼或 UI 表面行為。

## 執行框架 (基於 ReAct)
在呼叫任何測試工具或採取行動前，你必須先輸出 `Thought` 進行推理，然後再執行 `Action`。

### 步驟 1: 變更影響分析 (Thought)
- 分析修改了哪些檔案與模組（檢視 Git Diff）。
- 判斷修改類型（樣式、核心邏輯、資料庫結構、API 介面）。
- 評估風險等級（高：支付/身分驗證；中：一般業務邏輯；低：純 UI）。

### 步驟 2: 制定測試策略 (Thought)
- 根據影響分析，選擇最少且最有效的測試工具。
- 如果是 API 修改，優先選擇合約測試或 API 整合測試。
- 如果是 UI 修改，優先選擇元件測試或 DOM 驗證。

### 步驟 3: 執行驗證 (Action)
- 呼叫對應的測試工具或腳本。
- 確保測試涵蓋正向路徑（Happy Path）與關鍵的邊界條件。

### 步驟 4: 驗收標準檢查 (Thought & Action)
- 檢查是否滿足所有預定義的驗收標準（包含後端狀態確認）。
- 如果發生錯誤，不要盲目重試。分析錯誤訊息，並提供結構化的修復建議。

## 限制與防呆 (Guardrails)
- **信心閾值**：如果你對修改範圍的理解或測試策略的信心低於 90%，必須先向使用者詢問澄清，不可自行猜測。
- **工具限制**：僅使用與當前測試層級匹配的工具。不要使用 E2E 工具來測試單一函數的內部邏輯。
- **術語一致性**：在報告測試結果時，統一使用「Pass」、「Fail」、「Blocked」，避免使用模糊詞彙。
```
</example>

## 結論

**結論**：AI Agent 的指令設計與軟體測試驗證框架相輔相成。透過精簡 Token、明確指令與結構化輸出，可以大幅提升 Agent 的執行效率與準確性；而結合測試影響分析、風險評估與狀態驗證的測試框架，則能確保程式碼變更的品質。將兩者結合，不僅能減少不必要的測試開銷，更能建立一套高效、可靠的自動化驗證流程。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/cost-performance-optimization-rules.md` | [待確認] 提供更多關於節省 Token 的具體規則與實踐 |
| `06-SOP流程/pre-commit-checklist.md` | [待確認] 包含提交程式碼前的測試與驗證標準 |

## References

[1] Token Optimization Strategies for AI Agents. [待確認] https://medium.com/elementor-engineers/optimizing-token-usage-in-agent-based-assistants-ffd1822ece9c
[2] Agent Instruction Patterns and Antipatterns: How to Build Smarter Agents. [待確認] https://elements.cloud/blog/agent-instruction-patterns-and-antipatterns-how-to-build-smarter-agents/
[3] ReAct Prompting. [待確認] https://www.promptingguide.ai/techniques/react
[4] How to Optimize Token Efficiency When Prompting. [待確認] https://portkey.ai/blog/optimize-token-efficiency-in-prompts/
[5] Test Impact Analysis: Smarter Manual QA in Changing Codebases. [待確認] https://www.parasoft.com/blog/test-impact-analysis-manual-changing-codebase/
[6] Risk-Based Approach for Regression Testing: A Practical Guide. [待確認] https://katalon.com/resources-center/blog/risk-based-approach-for-regression-testing
[7] The Practical Test Pyramid. [待確認] https://martinfowler.com/articles/practical-test-pyramid.html
[8] What are the differences between unit tests, integration tests, smoke tests, and regression tests? [待確認] https://stackoverflow.com/questions/520064/what-are-the-differences-between-unit-tests-integration-tests-smoke-tests-and
[9] Acceptance Criteria: Everything You Need to Know Plus Examples. [待確認] https://resources.scrumalliance.org/Article/need-know-acceptance-criteria
[10] Acceptance testing explained. [待確認] https://circleci.com/blog/acceptance-testing-explained/
[11] End-to-End API Testing Guide and Best Practices. [待確認] https://zuplo.com/learning-center/end-to-end-api-testing-guide/
[12] Stop Breaking My API: A Practical Guide to Contract Testing with Pact. [待確認] https://medium.com/@mohsenny/stop-breaking-my-api-a-practical-guide-to-contract-testing-with-pact-33858d113386
