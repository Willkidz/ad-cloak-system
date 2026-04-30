---
title: "AI Agent 開發與品質驗證最佳實踐：從指令設計到自動化部署"
category: reference
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "整合 AI Agent 開發全生命週期最佳實踐，涵蓋防回歸策略、指令設計原則、品質驗證體系及 Token 成本優化。"
id: "20260328-ai-agent-dev-practices"
type: guide
tags: [ai-agent, guidelines, prompt-engineering, testing, token-saving]
status: active
created: 2026-03-28
updated: 2026-03-28
merged_from:
  - "AI Agent開發最佳實踐指南.md"
  - "AI代碼測試與品質驗證.md"
  - "agent_instruction_research.md"
  - "代碼變更記錄與回溯.md"
  - "garrytan_gstack架構分析.md"
---

> **TL;DR**: 本指南為 AI Agent 開發提供全方位防護與優化策略。核心包含：1. **防回歸四層防護**：透過 `CLAUDE.md` 系統約束、改動預算提示、子代理隔離及自動化 Hooks 降低 60% 以上錯誤率；2. **指令設計**：強調提供上下文而非程序指令，並透過結構化 System Prompt 節省 Token；3. **品質驗證**：推行 TDAD（測試驅動代理開發）與 CoVe（驗證鏈），強制 AI 在沙箱中執行測試以閉環修復。

# AI Agent 開發與品質驗證最佳實踐

本指南旨在解決 AI 引入軟體開發生命週期後帶來的挑戰，確保 Agent 協作的高效性、穩定性與可維護性。

---

## 一、防止代碼回歸的四層防護策略

AI 修改代碼時常因上下文漂移、範疇潛變及缺乏反饋而引入錯誤。我們提出以下防護體系：

### 1.1 第一層：系統級約束 (`CLAUDE.md`)

<rule id="system-constraints">

在根目錄建立 `CLAUDE.md`，定義架構、關鍵指令與 **絕對禁止行為**（如禁止刪除測試、禁止未經確認刪除文件）。
> **效果**：預防 60% 的常見操作錯誤。

</rule>

### 1.2 第二層：改動預算提示 (Change Budget)

<rule id="change-budget">

明確定義每次任務的「改動預算」（如最多接觸 N 個文件、改動 N 行程式碼）。
> **效果**：將平均變更量從 150+ 行降至 20-30 行，回歸率下降 60%。

</rule>

### 1.3 第三層：子代理隔離 (Subagents)

<step id="subagent-workflow">

1. **Planner**：研究代碼庫並編寫計劃（不產出代碼）。
2. **Tester**：編寫並運行完整測試套件，報告回歸錯誤。
3. **Code-Reviewer**：檢查回歸風險與設計模式。

</step>

### 1.4 第四層：自動化安全網 (Hooks)

<rule id="automated-hooks">

在工具配置中設定 `PreToolUse` Hooks，阻止包含失敗測試的 Git 提交。

</rule>

---

## 二、AI Agent 指令設計原則

### 2.1 提供上下文，而非程序指令

<example title="正確的指令方式">

**❌ 錯誤**：請遵循 TDD 流程：先寫測試，再寫程式碼。
**✅ 正確**：請修改 `validateEmail()`。相關測試在 `tests/validators.test.ts`。修改後請確保 `valid emails pass` 等案例通過。

</example>

### 2.2 結構化與 Token 優化

<boundaries id="prompt-optimization">

- **結構化輸出**：使用 Markdown/XML 標籤組織 System Prompt。
- **動態工具過濾**：僅傳遞任務相關的工具，減少輸入 Token。
- **提示詞快取 (Caching)**：將不變的系統提示詞置於最前以利用快取。

</boundaries>

---

## 三、品質驗證與測試解決方案

### 3.1 代理自我驗證 (Agentic Self-Validation)

賦予 Agent 執行權限，強制其在給出答案前於沙箱環境運行測試。若失敗則讀取日誌自我修正。

### 3.2 驗證鏈 (Chain of Verification, CoVe)

<step id="cove-steps">

1. **起草**：AI 生成初始代碼。
2. **規劃驗證**：AI 針對代碼邏輯提出驗證問題。
3. **執行驗證**：AI 逐一回答驗證問題。
4. **修正**：根據驗證結果產出最終版本。

</step>

---

## 四、實踐案例：Garry Tan 的 gstack 架構

<key_insight>

**gstack 核心理念**：極簡化與標準化。
- **技術棧**：Next.js + Tailwind + Lucide + Supabase。
- **開發規範**：強制使用單一文件組件，減少跨文件依賴，降低 AI 理解難度。

</key_insight>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [don-tools: AI Agent 框架評估](https://github.com/laoqin1689/don-tools/blob/main/01-AI工具/ai-agent-framework-evaluation.md) | 開源 AI Agent 框架評估報告（已遷移至 don-tools） |
| [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md) | YAML Frontmatter 標準規範 |
| [`06-SOP流程/pre-commit-checklist.md`](../06-SOP流程/pre-commit-checklist.md) | AI 輔助代碼審查標準流程 |
