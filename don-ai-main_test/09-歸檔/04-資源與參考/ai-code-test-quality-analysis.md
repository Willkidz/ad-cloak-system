---
title: "Ai Code Test Quality Analysis"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Ai Code Test Quality Analysis"
type: "analysis"
tags: [analysis, changelog]
status: "archived"
---

## 問題根因分析：為何 AI 會跳過測試？

AI 助手在編寫代碼後忽略實際測試，導致上線後功能失效，其根本原因可以歸結為以下幾個維度：

### 統計模型與推理引擎的本質差異

大型語言模型（LLM）本質上是基於概率的統計模型，而非真正的推理引擎 [1]。它們通過預測「最可能的下一個詞」來生成代碼，而不是通過邏輯推導來構建系統。這導致 AI 傾向於生成「看起來正確」的代碼，但缺乏對代碼在特定系統環境中是否能實際運行的驗證能力。

### 缺乏執行環境與反饋閉環

傳統的 AI 助手通常只在文本層面進行交互，缺乏實際的代碼執行環境（如沙箱或終端）。當 AI 無法運行代碼時，它只能依賴自身的內部知識來「猜測」代碼的正確性。沒有編譯器錯誤、運行時異常或測試失敗的真實反饋，AI 就無法進行自我修正。

### 任務完成標準（Definition of Done）模糊

在提示詞中，如果沒有明確定義「什麼叫做完成」，AI 會傾向於採取最短路徑。對 AI 而言，輸出完代碼塊就等於完成了「寫代碼」的任務。缺乏強制性的測試驅動開發（TDD）流程或明確的驗收標準（Acceptance Criteria），使得 AI 沒有動力去執行額外的驗證步驟。

### 上下文窗口與注意力機制的限制

在複雜的編程任務中，隨著代碼量和對話輪數的增加，AI 的注意力會逐漸分散。當 AI 需要同時關注業務邏輯、語法正確性和測試用例時，它往往會優先保證主邏輯的生成，而「遺忘」或省略測試環節。此外，如果讓 AI 在同一個上下文中既寫代碼又做驗證，它很容易陷入「確認偏誤」，即重複自己之前的邏輯錯誤。

---

## 業界解決方案分類與原理

針對 AI 助手跳過測試的問題，業界和開源社群發展出了多種解決方案，主要可分為以下幾大類：

<rule id="agentic-self-validation">
### 代理自我驗證機制（Agentic Self-Validation）

**原理**：賦予 AI 代理（Agent）執行代碼的權限，並強制其在給出最終答案前，必須先編寫並運行測試用例 [2]。

**代表方案**：Local Operator 等本地代理工具。

**運作方式**：
- AI 接收需求後，同時生成業務代碼和單元測試代碼。
- AI 在沙箱環境中自動執行測試腳本。
- 如果測試失敗，AI 會讀取錯誤日誌（stderr/stdout），分析原因並修改代碼，直到所有測試通過（Return Code: 0）才向用戶報告完成。

**優缺點**：
- *優點*：形成閉環，大幅提高代碼可用性；減少人類開發者的調試時間。
- *缺點*：需要安全的沙箱環境；可能陷入無限修復循環（需要設置最大重試次數）。
</rule>

<rule id="tdd-ai-practice">
### 測試驅動開發（TDD）的 AI 實踐

**原理**：將傳統的 TDD 流程（紅-綠-重構）應用於 AI 提示工程中，強制 AI 先寫測試再寫實現。

**運作方式**：
- **階段一**：要求 AI 僅根據需求編寫測試用例（此時測試會失敗）。
- **階段二**：要求 AI 編寫業務代碼以使測試通過。
- **階段三**：要求 AI 運行測試並驗證結果。

**優缺點**：
- *優點*：確保測試覆蓋率；明確了「完成」的標準（即測試通過）。
- *缺點*：需要多輪對話，消耗更多 Token；對提示詞的結構要求較高。
</rule>

<rule id="chain-of-verification">
### 驗證鏈提示工程（Chain of Verification, CoVe）

**原理**：通過多階段的提示策略，讓 AI 模型自己檢查自己的輸出，減少幻覺和邏輯錯誤 [3]。

**運作方式**：
1.  **起草**：AI 生成初始代碼或方案。
2.  **規劃驗證**：AI 針對初稿提出需要驗證的關鍵問題（例如：「這個函數處理空字符串時會崩潰嗎？」）。
3.  **獨立驗證**：AI 獨立回答這些驗證問題（關鍵在於此步驟不能看到初稿，以避免確認偏誤）。
4.  **最終修訂**：AI 根據驗證結果修改初始代碼。

**優缺點**：
- *優點*：無需外部執行環境即可提高代碼邏輯的嚴謹性；顯著降低邊界條件遺漏。
- *缺點*：無法替代真實的代碼執行測試；增加了推理延遲。
</rule>

<rule id="cicd-agent-integration">
### CI/CD 流水線與 AI 代理整合（Agentic Workflows）

**原理**：將 AI 代理作為 CI/CD 流程中的一個自動化節點，實現「持續 AI（Continuous AI）」 [4]。

**代表方案**：GitHub Agentic Workflows。

**運作方式**：
- 開發者提交代碼後，觸發 GitHub Actions。
- AI 代理在受控環境中運行，自動評估測試覆蓋率、編寫缺失的測試用例，或調查 CI 失敗原因並提出修復 PR。
- 採用「安全輸出（Safe Outputs）」機制，AI 只能執行預先批准的操作（如發表評論、創建 PR），不能直接合併代碼。

**優缺點**：
- *優點*：與現有開發流程無縫結合；安全性高（默認只讀權限）。
- *缺點*：配置較為複雜；依賴特定的代碼託管平台。
</rule>

<rule id="open-source-ai-testing-frameworks">
### 開源 AI 測試框架

**原理**：使用專門為 AI 設計的測試框架，自動化測試用例的生成和執行。

**代表工具**：[待確認]
- **CodeceptJS**：內置 AI 助手的端到端測試框架，能自動修復失敗的測試（Self-Healing）、生成頁面對象，並根據 HTML 上下文編寫測試 [5]。
- **EvoMaster**：開源的 AI 驅動工具，使用進化算法自動生成系統級測試用例（Fuzzing），特別適用於 RESTful API 測試。
- **DeepEval**：類似 pytest 的 LLM 評估框架，用於單元測試 AI 系統本身的輸出質量。
</rule>

---

## AI 代碼品質評分系統設計

為了解決 AI 「自認為完成」的問題，必須建立一套客觀的評分系統（Scoring System）來量化 AI 的工作成果。根據 Runloop 和 Langfuse 等業界實踐，一個完整的評分系統應包含以下維度 [6] [7]：

### 評估維度與指標

| 評估維度 | 說明 | 驗證工具/方法 |
| :--- | :--- | :--- |
| **功能正確性** | 代碼是否通過了所有單元測試和集成測試。這是最基礎的及格線。 | 單元測試框架 (pytest, Jest)、集成測試 |
| **編譯與執行成功率** | 代碼在目標環境中是否能成功編譯並無報錯運行。 | CI/CD 工具 (Jenkins, GitHub Actions) |
| **健壯性與安全性** | 檢查是否存在安全漏洞（如硬編碼密鑰、SQL 注入）或內存洩漏。 | 靜態分析工具 (SonarQube, Bandit)、模糊測試 |
| **語義正確性** | 代碼邏輯是否真正符合業務需求，而不僅僅是通過了測試用例。 | 形式驗證工具 (Z3)、對比已知良好實現 |

### 混合評分機制

- **自動化評分（Automated Scoring）**：
    - 測試覆蓋率（Test Coverage）：要求達到特定閾值（如 80%）。
    - 靜態代碼分析得分：基於代碼複雜度、重複率和潛在 Bug 數量計算。
- **LLM-as-a-Judge（AI 互評）**：
    - 使用另一個獨立的、通常能力更強的 LLM（如 GPT-4o 或 Claude 3.5 Sonnet）作為評委，根據預設的評分標準（Rubric）對生成的代碼進行代碼審查（Code Review）並打分。
- **人工評分（Human-in-the-loop）**：
    - 對於關鍵核心模塊，最終的合併（Merge）決策必須由人類開發者進行審查和評分。

---

## AI 記憶系統中的測試記錄設計

為了讓 AI 記住哪些功能已經測試過，避免重複勞動或遺漏，需要引入持久化記憶系統（Persistent Memory System），如 Mem0 或 Hipocampus [8]。

### 記憶層架構

- **短期記憶（Short-term Memory）**：存在於當前對話上下文中，記錄正在進行的測試步驟、當前報錯信息和臨時修復方案。
- **長期記憶（Long-term Memory）**：存儲在向量數據庫或知識圖譜中，跨會話持久化。記錄已完成的測試用例、歷史 Bug 及其修復方法、項目的特定業務規則。

### 測試記錄追蹤機制

- **狀態標記（State Tracking）**：為每個功能模塊維護一個狀態機（如：`未測試` -> `測試編寫中` -> `測試失敗` -> `測試通過`）。
- **覆蓋率地圖（Coverage Map）**：在記憶系統中維護一個項目結構樹，標記每個文件/函數的測試覆蓋狀態。當 AI 下次接手任務時，首先檢索這個地圖。
- **經驗教訓庫（Lessons Learned）**：當 AI 解決了一個複雜的測試失敗後，強制其總結原因並寫入長期記憶。下次遇到類似報錯時，AI 可以直接檢索歷史解決方案，而不是從頭開始試錯。

---

## 強制 AI 測試的 Prompt Engineering 模板

為了在沒有複雜框架的情況下，僅通過提示詞（Prompt）強制 AI 執行測試，可以採用以下結合了 TDD 和 CoVe（驗證鏈）思想的指令模板。

<example>
### 測試驅動開發（TDD）強制模板

```markdown
你是一個嚴謹的高級軟件工程師。在執行任何代碼編寫任務時，你必須嚴格遵循以下「測試驅動開發（TDD）」流程。不允許跳過任何步驟。

【任務目標】：[在此處填寫具體需求]

【執行步驟】：
1. **編寫測試（Red）**：首先，僅根據需求編寫單元測試代碼。考慮邊界條件、異常輸入和正常路徑。此時不要編寫任何業務實現代碼。
2. **驗證失敗**：在沙箱/終端中運行這些測試，並確認它們如預期般失敗。將錯誤日誌輸出給我看。
3. **編寫實現（Green）**：編寫最簡潔的業務代碼，使其剛好能通過上述測試。
4. **驗證通過**：再次運行測試。如果失敗，分析原因並修改代碼，直到所有測試通過（Return Code: 0）。
5. **重構（Refactor）**：在保證測試通過的前提下，優化代碼結構和可讀性。

【完成標準】：
只有當你向我展示了「所有測試均已通過」的終端輸出截圖或日誌後，你才能報告任務完成。不要用「假設它能運行」來敷衍。
```
</example>

<example>
### 驗證鏈（Chain of Verification）自我檢查模板

```markdown
你是一個具備自我糾錯能力的 AI 助手。在給出最終代碼之前，你必須執行以下驗證鏈（CoVe）步驟：

1. **起草（Draft）**：在內部思考空間中，寫出解決問題的初始代碼草稿。
2. **規劃驗證（Plan Verifications）**：針對你的草稿，列出至少 3 個關鍵的驗證問題。例如：「該函數處理 null 值時會拋出異常嗎？」、「時間複雜度是否符合 O(n) 的要求？」、「是否處理了異步競態條件？」。
3. **獨立執行驗證（Execute Verifications）**：逐一回答上述問題，客觀評估草稿代碼是否存在缺陷。
4. **最終輸出（Final Verified Response）**：根據驗證結果，修改並輸出最終的、經過驗證的代碼。

請在你的回覆中，明確展示上述 4 個步驟的思考過程，讓我看到你是如何自我檢查的。
```
</example>

---

## 針對個人開發者的完整實踐建議

對於資源有限但希望保持高代碼質量的個人開發者，結合 AI 助手和 GitHub，可以構建一套輕量級但高效的自動化測試與驗證工作流。

> **核心建議**：個人開發者應採取漸進式自動化策略，從強制的提示詞模板開始，逐步過渡到具備終端執行權限的 AI 編輯器，最終整合 GitHub Actions，實現從代碼提交、自動測試、AI 失敗分析到自動生成修復 PR 的全自動化閉環。

<step>
### 步驟一：建立基於 GitHub Actions 的輕量級 Agentic Workflow
個人開發者不需要部署複雜的本地沙箱，可以直接利用 GitHub Actions 作為 AI 的執行環境。
- **配置持續測試（Continuous Testing）**：編寫一個 `.github/workflows/ai-test.yml`，當代碼推送到特定分支時，觸發 AI 代理（如使用開源的 GitHub Agentic Workflows 腳本）。
- **AI 自動修復 PR**：當常規的單元測試在 CI 中失敗時，配置 AI 讀取失敗日誌，自動生成修復代碼，並提交一個帶有修復建議的 Pull Request，而不是直接合併。
</step>

<step>
### 步驟二：構建個人項目的 AI 知識庫（Knowledge Base）
為了讓 AI 記住項目的特定規則和歷史測試記錄，可以利用 GitHub 倉庫本身作為知識庫。
- **維護 `AI_RULES.md`**：在項目根目錄創建一個專門給 AI 看的 Markdown 文件，定義該項目的架構約定、測試框架選擇（如 pytest 或 Jest）以及「完成標準（Definition of Done）」。每次啟動 AI 助手時，強制其先讀取此文件。
- **測試覆蓋率徽章與記錄**：使用工具（如 Codecov）生成測試覆蓋率報告，並將其保存在倉庫中。要求 AI 在編寫新功能前，先檢查當前的覆蓋率報告，確保新代碼不會降低整體覆蓋率。
</step>

<step>
### 步驟三：實施「雙 Agent」審查機制
在個人開發場景中，可以模擬團隊開發的 Code Review 流程：
- **Agent A（開發者）**：負責根據需求編寫代碼和初步測試。
- **Agent B（審查者）**：使用不同的 LLM 模型（或不同的 Prompt 角色），專門負責審查 Agent A 的代碼。Agent B 的任務是尋找邊界條件漏洞、安全隱患，並給出評分。只有當 Agent B 給出 80 分以上的評價時，開發者才手動將代碼合併到主分支。
</step>

---

## 結論

AI 助手跳過實際測試是其統計模型本質、缺乏執行環境和任務定義模糊共同導致的系統性問題。要解決這一挑戰，不能僅僅依賴於改進提示詞，而需要建立一個包含**自動化驗證、客觀評分和持久化記憶**的綜合性解決方案。從輕量級的 TDD 模板和 CoVe 自我審查，到重量級的 CI/CD 整合與 Agentic Workflow，開發者可以根據自身場景選擇合適的策略。最終目標是將 AI 從一個單純的「代碼生成器」轉變為一個具備質量保證意識的「開發夥伴」，實現真正可靠的 AI 輔助開發。

---

## 相關文件連結

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/通用指令.md` | 通用指令中定義了 AI 必須遵循的測試與驗證流程 |
| `skills/systematic-debugging.md` | 提供了 AI 進行系統性除錯的詳細步驟與方法論 |

---

## 參考文獻

[1] Twendee. "Why Most AI-Generated Code Fails Without Professional Testing." Medium. https://medium.com/@marketing_39301/why-most-ai-generated-code-fails-without-professional-testing-f6bb9430da8d
[2] Damian Tran. "Agentic Self-Validation in Code: Better AI Development with Local Operator and Auto TDD." Medium. https://medium.com/@damianvtran/agentic-self-validation-in-code-better-ai-development-with-local-operator-and-auto-tdd-9caea913dc41
[3] azhar. "Chain of Verification: the prompting pattern that makes LLM answers check themselves." Medium. https://moazharu.medium.com/chain-of-verification-the-prompting-pattern-that-makes-llm-answers-check-themselves-f9563ea9e960
[4] GitHub Blog. "Automate repository tasks with GitHub Agentic Workflows." https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/
[5] CodeceptJS. "Testing with AI." https://codecept.io/ai/
[6] Runloop. "Assessing AI Code Quality: 10 Critical Dimensions for Evaluation." https://runloop.ai/blog/assessing-ai-code-quality-10-critical-dimensions-for-evaluation
[7] Langfuse. "AI Agent Observability, Tracing & Evaluation with Langfuse." https://langfuse.com/blog/2024-07-ai-agent-observability-with-langfuse
[8] Mem0. "Welcome to Mem0." https://docs.mem0.ai/introduction
