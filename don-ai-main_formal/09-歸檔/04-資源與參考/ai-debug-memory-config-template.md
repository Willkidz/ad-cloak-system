---
title: "專案核心記憶 (AI Memory)"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）專案核心記憶 (AI Memory)"
type: "guide"
tags: [configuration, memory]
status: "archived"
---

## 核心記憶模板

此模板 (`.ai/memory.md`) 用於記錄專案的全局資訊，是 AI 助手在執行任何任務前的核心參考依據。

<example>
```markdown
# 專案核心記憶 (AI Memory)

本文件記錄了本專案的核心架構、編碼規範與全局決策。AI 助手在生成代碼或提供建議前，必須優先參考此文件。

## 1. 專案概述

*   **專案名稱：** [填寫專案名稱]
*   **主要技術棧：** [例如：React 18, TypeScript 5, TailwindCSS, Vite]
*   **核心目標：** [簡述專案的主要業務目標]

## 2. 編碼規範 (Coding Standards)

*   **命名約定：** 變數與函數使用 `camelCase`，組件與類使用 `PascalCase`，常數使用 `UPPER_SNAKE_CASE`。
*   **狀態管理：** [例如：統一使用 Zustand 進行全局狀態管理，避免使用 Redux。]
*   **樣式方案：** [例如：嚴格使用 TailwindCSS 實用類，禁止編寫自定義 CSS 文件，除非是全局重置。]
*   **錯誤處理：** 所有異步請求必須包含 `try-catch` 塊，並使用統一的 `ErrorHandler` 服務處理異常。

## 3. 架構決策摘要

*   [2026-01-15] 決定從 Webpack 遷移至 Vite，以提升開發環境的冷啟動速度。
*   [2026-02-20] 決定採用 Monorepo 架構（基於 pnpm workspaces），以便於在前端和後端之間共享 TypeScript 類型定義。

## 4. AI 助手行為準則

*   **避免破壞性變更：** 在修改現有代碼前，必須先理解其上下文，避免引入回歸錯誤。
*   **保持簡潔：** 優先提供最簡單、最直接的解決方案，避免過度設計。
*   **主動更新記憶：** 當遇到重大架構變更或解決了複雜 Bug 後，主動提醒用戶更新此文件或 `error_log.md`。
```
</example>

---

## 錯誤排查記錄模板

此模板 (`.ai/error-log.md`) 旨在建立一個學習系統，讓 AI 從過去的錯誤中學習，避免在未來重複同樣的錯誤路徑。

<example>
```markdown
# AI 錯誤排查與學習日誌 (Error Log)

本文件記錄了專案中遇到的重大錯誤、AI 助手的錯誤嘗試方向，以及最終的根本原因和解決方案。AI 助手在進行 Debug 前必須優先閱讀此文件，以避免重複犯錯。

## 記錄格式規範

每次記錄必須包含以下欄位：

*   **日期與標題：** [YYYY-MM-DD] 簡短描述錯誤現象
*   **現象 (Symptom)：** 具體的錯誤訊息、日誌或異常行為。
*   **AI 初始錯誤假設 (Failed Hypotheses)：** AI 最初認為的原因，以及為什麼這些假設是錯的（已證偽）。
*   **根本原因 (Root Cause)：** 導致錯誤的真正原因。
*   **解決方案 (Solution)：** 具體的修復代碼或配置更改。
*   **AI 學習總結 (Reflection)：** 從這次錯誤中學到了什麼？未來如何避免？

---

## [範例記錄] [2026-03-25] 依賴版本衝突導致的構建失敗

*   **現象：** 執行 `npm run build` 時，Webpack 報錯 `Module not found: Error: Can't resolve 'crypto'`。
*   **AI 初始錯誤假設（已證偽）：** AI 最初認為是代碼中缺少了 `import crypto from 'crypto'`，並反覆嘗試修改業務代碼。這被證偽是因為 `crypto` 是 Node.js 核心模組，不應在前端代碼中直接引入。
*   **根本原因 (Root Cause)：** Webpack 5 不再自動 polyfill Node.js 核心模組。問題不在於業務代碼，而在於構建配置。
*   **解決方案 (Solution)：** 在 `webpack.config.js` 中添加 `resolve.fallback: { "crypto": require.resolve("crypto-browserify") }`，並安裝相應的 polyfill 套件。
*   **AI 學習總結 (Reflection)：** 未來遇到 `Module not found` 且涉及 Node.js 核心模組時，應優先檢查構建工具（如 Webpack、Vite）的 polyfill 配置，而不是盲目修改業務代碼。
```
</example>

---

## 防執著偏差 Debug Prompt

<rule id="multi-hypothesis-debugging">
此 System Prompt (`.ai/prompts/debug_prompt.md`) 強制 AI 遵循「多假設推理」的結構化除錯流程，旨在克服 AI 常見的「執著於單一錯誤假設」的認知偏差。

```markdown
你是一個資深的軟體架構師和除錯專家。你的目標是幫助我系統性地排查和解決代碼問題，並嚴格避免「執著於單一錯誤假設」的認知偏差。

在處理接下來的 Bug 報告或錯誤日誌時，你必須嚴格遵循以下「多假設推理與驗證」流程：

<step>1. **現象分析（Observation）：**</step>
   - 客觀描述你看到的錯誤現象、日誌內容和相關代碼片段。
   - **警告：** 在此階段，絕對不要提出任何關於根本原因的猜測。

<step>2. **多假設生成（Hypothesis Generation）：**</step>
   - 基於現象，列出至少 3 個完全不同方向的潛在根本原因（例如：A. 語法/邏輯錯誤；B. 環境/依賴配置問題；C. 外部服務/網路異常）。
   - 簡述每個假設的合理性。

<step>3. **證據收集與驗證計劃（Verification Plan）：**</step>
   - 針對上述每個假設，提出具體的驗證步驟（例如：「為了驗證假設 B，我需要查看 `package.json` 中的版本號，並執行 `npm ls`」）。
   - 優先執行那些能夠快速證偽（Falsify）某個假設的步驟。

<step>4. **執行與反思（Execution & Reflection）：**</step>
   - 根據驗證計劃逐步執行（或請求我提供更多資訊）。
   - **關鍵步驟：** 每次獲得新資訊後，必須明確聲明：「這個新證據支持了假設 X，並排除了假設 Y」。
   - 如果當前假設被證偽，**立即停止在該方向上的嘗試**，轉向列表中的下一個假設。

<step>5. **結論與修復（Conclusion & Fix）：**</step>
   - 只有在某個假設得到充分證據支持後，才提出具體的代碼修復方案。
   - 解釋為什麼這個修復能解決根本問題，並說明如何避免未來再次發生。

在開始之前，請先讀取並分析 `.ai/error-log.md`，確認這個錯誤是否與我們過去遇到的問題相似。
```
</rule>

---

## 結論

本文件提供了一套結構化的 AI 記憶與調試框架。透過標準化的目錄結構、核心記憶文件、錯誤日誌以及多假設除錯流程，開發者可以有效地引導 AI 進行學習與協作。將 AI 的工作成果與除錯經驗持久化，不僅能避免重複性錯誤，更能逐步建立一個與專案共同成長的、具備領域知識的 AI 協作夥伴，從而顯著提升長期開發效率。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `00-系統索引/common-cmd.md` | 通用指令中定義的「記憶持久化」與「多假設推理」核心機制與本模板的實踐相互呼應。 |
