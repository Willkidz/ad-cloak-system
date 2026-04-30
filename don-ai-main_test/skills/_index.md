---
title: "模組化技能庫索引"
category: "index"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "skills/ 目錄的用途說明與技能清單索引，AI 根據任務需求按需掛載對應技能。"
id: "20260327-SKILLS-INDEX"
type: "index"
tags: [index, skills]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: `skills/` 目錄存放獨立的、可按需掛載的專業技能模組。與全局指令不同，技能模組不會被全局載入，只在 AI 遇到特定任務時透過條件式載入映射表掛載。目前包含 1 個技能（系統性除錯流程）和 1 個模板。新增技能時複製 `skill-template.md` 模板填寫即可。

# 模組化技能庫（Modular Skills Library）

## 用途

`skills/` 目錄存放**獨立的、可按需掛載的專業技能模組**。每個技能是一個完整的 Markdown 文件，封裝了特定領域的深度操作指南。

與全局指令（[`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md)、[`AGENTS.md`](../AGENTS.md)）不同，技能模組**不會被全局載入**，只有在 AI 遇到特定任務時，才透過條件式載入映射表「掛載」對應的技能。這樣做的好處是：

1. **避免全局指令膨脹**：複雜的專業流程不會污染通用指令的 Token 預算
2. **極度專業的深度指導**：每個技能可以包含非常詳細的步驟、範例和驗證方式，不受篇幅限制
3. **高度可擴展**：新增技能只需新增一個 `.md` 文件，不影響現有系統

## 使用方式

<rule id="skill-usage">

1. AI 在 SOP 1（Onboarding）時，根據任務類型查閱「條件式動態載入映射表」（見 [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) 的 `<conditional_loading>` 區塊）
2. 若映射表指向 `skills/` 中的某個技能，則載入該技能文件
3. 按照技能文件中的步驟執行任務
4. 若需要新增技能，複製 [`skill-template.md`](skill-template.md) 模板填寫

</rule>

## 技能清單

| 技能文件 | 技能名稱 | 觸發條件 |
| :--- | :--- | :--- |
| [systematic-debugging.md](systematic-debugging.md) | 系統性除錯流程（增強版） | 遇到 Bug 需要排查時 |
| [skill-template.md](skill-template.md) | 技能模板（不是技能） | 需要新增技能時複製此模板 |

## 統計

- 技能數量：1（不含模板）
- 最後更新：2026-03-28

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 條件式動態載入映射表定義 |
| [`01-核心原則/skill-index.md`](../01-核心原則/skill-index.md) | 技能系統的規範說明 |
| [`.ai/prompts/debug-prompt.md`](../.ai/prompts/debug-prompt.md) | Debug 提示模板（被 systematic-debugging.md 封裝） |
| [`01-核心原則/cost-performance-optimization-rules.md`](../01-核心原則/cost-performance-optimization-rules.md) | 三層載入架構（技能屬於 L2 按需載入） |
