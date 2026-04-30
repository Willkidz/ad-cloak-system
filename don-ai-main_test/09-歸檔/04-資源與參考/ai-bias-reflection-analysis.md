---
title: "AI 錯誤排查與學習日誌"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）AI 錯誤排查與學習日誌"
type: "analysis"
tags: [analysis, changelog]
status: "archived"
---

## 問題根因分析：為何 AI 會「執著於錯誤方向」？

AI 助手在調試過程中表現出的**執著偏差（Fixation Bias）**，並非單一技術缺陷，而是由大型語言模型（LLM）的內在運作機制、認知偏差及現有 Agent 架構的局限性共同造成的。

### LLM 中的認知偏差表現

研究表明，LLM 在處理資訊時會表現出類似人類的認知偏差 [1]。在調試場景中，最顯著的兩種偏差為：

*   **錨定偏差（Anchoring Bias）：** LLM 的推理極易受到初始提示或早期資訊（如第一條錯誤日誌）的影響。一旦模型「錨定」了某個潛在原因（例如語法錯誤），後續推理便會過度依賴此假設，難以跳脫 [2]。
*   **確認偏差（Confirmation Bias）：** AI 形成初步假設後，傾向於尋找支持該假設的資訊，而忽略矛盾證據。這表現為 AI 會不斷修改代碼以試圖讓錯誤的假設成立，而非質疑假設本身 [1]。

此外，AI 還常表現出**過度自信（Overconfidence）**，即高估其解決方案的正確性，進一步阻礙其在失敗後自我糾正的意願 [2]。

### 缺乏有效的反思與自我糾正機制

傳統 LLM 的生成過程是單向的線性推理，缺乏內建的批判性評估機制。

*   **缺乏「系統 2」思維：** 諾貝爾獎得主 Daniel Kahneman 的雙系統理論中，「系統 1」是快速直覺的，而「系統 2」是緩慢且具批判性的。目前的 LLM 主要依賴類似「系統 1」的模式匹配，缺少「系統 2」來評估自身的輸出與推理過程 [3]。
*   **錯誤累積：** 在使用基礎的思維鏈（Chain-of-Thought, CoT）提示時，早期步驟的邏輯錯誤會沿著推理鏈不斷累積，導致最終結果偏離，且模型自身難以察覺 [4]。

### 記憶系統的局限性

許多 AI 助手依賴滑動窗口（Sliding Window）管理上下文，其弱點在於：

*   **任務特定失憶症（Task-specific Amnesia）：** 當對話過長，早期的嘗試記錄會被擠出上下文，導致 AI「忘記」已嘗試過的無效方法，從而重複犯錯 [5]。
*   **缺乏情境記憶（Episodic Memory）：** AI 往往只記住最終代碼狀態，而未記錄「為何修改」及「修改導致何種錯誤」。缺乏結構化的失敗記錄，AI 便無法從錯誤中學習 [6]。

---

## 解決方案與技術原理解析

針對上述問題，學界和業界提出了多種解決方案，主要可分為多假設推理、反思機制、系統化調試策略及分層記憶架構四大類。

### 多假設推理（Multi-hypothesis Reasoning）

為打破 AI 的單一線性思維，研究者提出了允許模型同時探索多個潛在路徑的推理框架。

| 框架名稱 | 核心原理 | 優點 | 缺點/局限性 |
| :--- | :--- | :--- | :--- |
| **Chain-of-Thought (CoT)** | 引導模型生成線性中間推理步驟 [4]。 | 實現簡單，能顯著提升基礎邏輯任務表現。 | 容易產生錯誤累積，無法探索替代路徑。 |
| **Tree of Thoughts (ToT)** | 將問題分解為中間「思想」步驟，構建樹狀結構，允許模型搜索多個並行思考路徑並評估其潛力 [7]。 | 能同時考慮多種可能性，減少錯誤累積，適合複雜決策。 | 計算成本較高，需要設計特定的評估函數。 |
| **Graph of Thoughts (GoT)** | ToT 的泛化，允許推理過程以任意圖結構進行，實現路徑的合併、回溯和重新評估 [8]。 | 處理高度複雜問題能力最強，能綜合多個相互關聯的想法。 | 實現極為複雜，資源消耗巨大。 |

<rule id="multi-hypothesis-debugging">
在 Debug 場景中，不應讓 AI 直接給出修復代碼。應利用 ToT 框架，要求 AI 先生成 3-5 個不同的故障假設（如：A. 依賴版本衝突；B. 網路超時；C. 權限配置錯誤）。接著，針對每個假設提出驗證方法，最後根據證據進行根因仲裁（Root Cause Arbitration），從而避免執著於單一錯誤方向 [9]。
</rule>

### AI Agent 的反思與自我糾正框架

反思機制的核心是讓 AI 具備評估自身行為並從反饋中學習的能力。

*   **Reflexion 框架：**
    此框架透過「語言強化（Verbal Reinforcement）」提升 Agent 性能。它包含三個核心組件：**Actor（執行者）** 生成動作，**Evaluator（評估者）** 根據反饋評分，**Self-Reflection（自我反思）** 根據評估生成自然語言改進建議。這些反思會被存入情景記憶，用於指導後續嘗試，實現迭代優化 [3]。

*   **LATS (Language Agent Tree Search)：**
    LATS 是一個統一框架，結合了 ToT 的樹搜索與 Reflexion 的反思學習能力。它將 LLM 的推理、行動和規劃整合，透過模擬未來狀態和自我反思來優化決策路徑 [10]。

### 系統化的 AI Debug 策略

業界領先的 Coding Agents（如 SWE-agent、Devin）在處理真實世界 Issue 時，採用了更為系統化的策略。

*   **遞歸代理架構（Recursive Agent Architecture）：**
    將複雜調試任務分解給專門的服務代理（如資料庫代理），由協調器（Orchestrator）統籌，規劃器（Planner）提供領域知識，避免單一模型處理過多資訊導致混亂 [11]。

*   **AgentRx 框架：**
    微軟提出的 AgentRx 強調根本原因分析（RCA）。它透過標準化異構日誌，自動生成可執行的約束條件，並結合預定義的「故障分類法（Failure Taxonomy）」來精確定位問題，有效減少 AI 的盲目猜測 [12]。

### 分層記憶系統架構設計

為了解決「任務特定失憶症」並保持跨會話一致性，現代 AI Agent 必須採用分層記憶架構 [13]。

| 記憶層級 | 實現方式 | 核心功能與應用場景 |
| :--- | :--- | :--- |
| **短期記憶 (工作記憶)** | 上下文窗口、滾動緩衝區 | 維護當前對話的即時上下文。容量有限，隨會話結束而清空。 |
| **中期記憶 (情境記憶)** | 向量資料庫、檢索增強生成 (RAG) | 記錄特定事件、歷史對話和錯誤排查過程。透過語義搜索檢索相關經驗。 |
| **長期記憶 (語義/程序記憶)** | 關係型資料庫、NoSQL、Markdown 文件 (Git) | 儲存結構化事實、用戶偏好、系統架構決策和標準操作流程 (SOP)。 |

<rule id="memory-pointer-pattern">
**記憶指針模式（Memory Pointer Pattern）：** 當工具返回大量數據時，不直接塞入上下文，而是將數據存儲在外部，僅返回一個簡短的「指針」給 LLM。LLM 需要時再透過特定工具讀取詳細內容，有效防止上下文溢出 [5]。
</rule>

---

## 透過提示工程減少 AI 的「執著偏差」

除了系統架構改進，精確的提示工程也能顯著引導 AI 避免陷入單一錯誤方向。

### 核心提示設計技巧

*   **明確的公平參數：** 在提示中明確要求 AI 考慮多種可能性，避免過早下結論。
*   **自我批判提示（Self-Criticism Prompting）：** 鼓勵 AI 進行自我評估和迭代推理。例如，要求 AI 在給出最終答案前，先列出其推理過程中可能存在的漏洞。
*   **逆向思維鏈（Reversing Chain-of-Thought, RCoT）：** 要求 AI 從預期結果反推可能導致當前錯誤的原因，有助於打破正向推理的思維定勢。
*   **驗證鏈（Chain-of-Verification, CoVe）：** 在 AI 生成初步結論後，要求其生成一系列驗證問題，並逐一回答以確認結論的可靠性 [15]。

### 可直接套用的 System Prompt 模板

<example title="Claude 風格邏輯調試器 System Prompt">
```markdown
你是一位資深的軟體架構師和除錯專家。你的目標是幫助用戶系統性地排查和解決代碼問題，並嚴格避免「執著於單一錯誤假設」的認知偏差。

在處理任何 Bug 報告或錯誤日誌時，你必須嚴格遵循以下「多假設推理與驗證」流程：

<step id="debug-flow-1">
**1. 現象分析（Observation）：**
- 客觀描述你看到的錯誤現象、日誌內容和相關代碼片段。
- **警告：** 在此階段，絕對不要提出任何關於根本原因的猜測。
</step>

<step id="debug-flow-2">
**2. 多假設生成（Hypothesis Generation）：**
- 基於現象，列出至少 3 個完全不同方向的潛在根本原因（例如：A. 語法/邏輯錯誤；B. 環境/依賴配置問題；C. 外部服務/網路異常）。
- 簡述每個假設的合理性。
</step>

<step id="debug-flow-3">
**3. 證據收集與驗證計劃（Verification Plan）：**
- 針對上述每個假設，提出具體的驗證步驟（例如：「為了驗證假設 B，我需要查看 `package.json` 中的版本號，並執行 `npm ls`」）。
- 優先執行那些能夠快速證偽（Falsify）某個假設的步驟。
</step>

<step id="debug-flow-4">
**4. 執行與反思（Execution & Reflection）：**
- 根據驗證計劃逐步執行（或請求用戶提供更多資訊）。
- **關鍵步驟：** 每次獲得新資訊後，必須明確聲明：「這個新證據支持了假設 X，並排除了假設 Y」。
- 如果當前假設被證偽，**立即停止在該方向上的嘗試**，轉向列表中的下一個假設。
</step>

<step id="debug-flow-5">
**5. 結論與修復（Conclusion & Fix）：**
- 只有在某個假設得到充分證據支持後，才提出具體的代碼修復方案。
- 解釋為什麼這個修復能解決根本問題，並說明如何避免未來再次發生。
</step>
```
</example>

---

## 針對個人開發者的完整架構建議

在實際開發中，個人開發者常使用多個 AI 助手（如 Cursor, GitHub Copilot, ChatGPT）並依賴 GitHub。為讓這些 AI 共享上下文並建立持久記憶，我們建議採用以下架構。

### 核心理念：將 GitHub 作為「顯式記憶」的單一真相來源

相較於為每個 AI 配置複雜的向量資料庫，對個人開發者而言，最有效的方法是將記憶內容**版本控制化**，存儲在 GitHub 倉庫中。這符合「持久性、可操作性、明確性」的蒸餾標準 [16]。

### 具體文件結構設計

<example title="AI 共享記憶文件夾結構">
在專案根目錄下建立一個 `.ai/` 資料夾，用於存儲 AI 的共享記憶。

```text
my-project/
├── .ai/
│   ├── memory.md          # 核心記憶：專案架構、全局決策、編碼規範
│   ├── error_log.md       # 錯誤排查記錄：已解決的重大 Bug 及其根本原因
│   ├── decision_log.md    # 架構決策記錄 (ADR)：為何選擇某個技術方案
│   └── prompts/           # 針對特定任務的 System Prompts 模板
├── src/
├── package.json
└── README.md
```
</example>

### 記憶文件內容模板

<example title="error_log.md 內容模板">
```markdown
# AI 錯誤排查與學習日誌

本文件記錄了專案中遇到的重大錯誤、AI 助手的錯誤嘗試方向，以及最終的根本原因和解決方案。AI 助手在進行 Debug 前必須優先閱讀此文件。

## [2026-03-25] 依賴版本衝突導致的構建失敗

*   **現象：** 執行 `npm run build` 時，Webpack 報錯 `Module not found: Error: Can't resolve 'crypto'`。
*   **AI 初始錯誤假設（已證偽）：** AI 最初認為是代碼中缺少了 `import crypto from 'crypto'`，並反覆嘗試修改業務代碼。
*   **根本原因（Root Cause）：** Webpack 5 不再自動 polyfill Node.js 核心模組。問題不在於業務代碼，而在於構建配置。
*   **解決方案：** 在 `webpack.config.js` 中添加 `resolve.fallback: { "crypto": require.resolve("crypto-browserify") }`，並安裝相應的 polyfill 套件。
*   **AI 學習總結（Reflection）：** 未來遇到 `Module not found` 且涉及 Node.js 核心模組時，應優先檢查構建工具（如 Webpack、Vite）的 polyfill 配置，而不是盲目修改業務代碼。
```
</example>

### 整合工作流

<rule id="shared-knowledge-workflow">
1.  **預任務上下文注入：**
    在開始新任務前，第一步永遠是要求 AI 讀取 `.ai/` 目錄下的相關文件（如 `error_log.md` 和 `memory.md`）。

2.  **強制更新記憶：**
    當一個複雜 Bug 被解決或做出重要決策後，必須要求 AI 總結經驗，並按照格式追加到對應的 Markdown 文件中。

3.  **利用 Git 進行版本控制與同步：**
    將記憶文件隨代碼一同提交至 GitHub，確保無論在哪台設備或切換哪個 AI 助手，都能獲取最新的 AI 記憶庫。
</rule>

---

## 結論

> AI 助手在代碼調試中的「執著偏差」是源於 LLM 認知偏差、單向推理及記憶管理缺失的系統性問題。透過引入**多假設推理**、**反思機制**、**系統化調試策略**及**分層記憶架構**，可顯著提升 AI 的排錯效率。

> 對於個人開發者而言，最實用的方案是建立一個基於 GitHub 版本控制的**「顯式記憶系統」**。透過結構化的 Markdown 文件（如 `error_log.md`）記錄失敗經驗和決策，並結合嚴格的提示工程規範，可以有效打破 AI 的思維定勢，讓多個 AI 助手共享上下文，最終實現從「被動的代碼生成器」向「具備自我學習能力的智能協作者」的轉變。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/失敗學習迴圈.md` | 本報告提出的反思機制是失敗學習迴圈的理論基礎和實現方法之一。 |
| `skills/systematic-debugging.md` | 本報告中提到的系統化調試策略，在該技能中有具體的SOP實現。 |

---

## 參考文獻

[1] Tversky, A., & Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases. *Science*, 185(4157), 1124-1131.
[2] Nguyen, J. K. (2023). Human bias in AI models? Anchoring effects and mitigation strategies in large language models.
[3] Shinn, N., et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. *arXiv preprint arXiv:2303.11366*.
[4] Wei, J., et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. *Advances in Neural Information Processing Systems*, 35, 24824-24837.
[5] Folkman, T. (2024). AI Agent Memory Architecture: Overcoming Task-Specific Amnesia. *Substack*.
[6] Ojo, J. (2024). A practical guide to building persistent, self-linking memory for LLM agents.
[7] Yao, S., et al. (2023). Tree of Thoughts: Deliberate Problem Solving with Large Language Models. *arXiv preprint arXiv:2305.10601*.
[8] Besta, M., et al. (2023). Graph of Thoughts: Solving Elaborate Problems with Large Language Models. *arXiv preprint arXiv:2308.09687*.
[9] Microsoft Research. (2024). Systematic debugging for AI agents: Introducing the AgentRx framework. *Microsoft Research Blog*.
[10] Zhou, A., et al. (2023). Language Agent Tree Search Unifies Reasoning Acting and Planning in Language Models. *arXiv preprint arXiv:2310.04406*.
[11] Medium. (2024). Building an AI Agent That Debugs Production Incidents.
[12] Microsoft Research. (2024). AgentRx: Diagnosing AI Agent Failures from Execution Trajectories.
[13] Healthark AI. (2024). How Multi-Tier Persistent Memory Transforms LLM Performance.
[14] Mem0 Team. (2024). Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory.
[15] Hugging Face. (2024). Prompt Engineering Guide: Reducing AI Fixation Bias.
[16] Medium. (2024). From Code to Clarity: AI coding assistant persistent context management.
