---
title: "變更記錄規則"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）變更記錄規則"
type: "analysis"
tags: [analysis, memory]
status: "archived"
---
description: 強制記錄代碼變更
globs: [\"src/**/*.ts\", \"src/**/*.tsx\", \"src/**/*.py\"]
alwaysApply: false
---

# 變更記錄規則

當你對匹配的文件進行了實質性的修改（新增功能、修復 Bug、重構）後，你**必須**主動詢問用戶：\"是否需要將本次修改記錄到 `.ai/CHANGELOG.md` 中？\"

如果用戶同意，請分析你剛剛的代碼 diff，並以專業的開發者語氣，將變更總結寫入 `.ai/CHANGELOG.md` 的頂部。總結必須包含：
1. 為什麼要進行這次修改（動機）。
2. 具體修改了哪些核心邏輯。
3. 潛在的副作用或需要後續注意的地方。
```

</example>

## 結論

> AI 編程助手忘記代碼變更的本質是**缺乏持久化記憶層和標準化的記錄工作流**。雖然業界正在積極開發如 Mem0、Letta 等複雜的底層記憶框架，以及 Agent Trace 等數據標準，但對於個人開發者而言，最實用且立竿見影的解決方案是**建立基於 Markdown 的靜態上下文（`AGENTS.md`）和強制性的本地日誌記錄機制（`.ai/CHANGELOG.md`）**。通過將「記錄變更」本身作為 AI 任務的標準收尾步驟，可以有效解決跨 session 和多 Agent 協作時的上下文丟失問題，將 GitHub 倉庫真正轉變為人類與 AI 共享的動態知識庫。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/通用指令.md` | 通用指令中定義了 AI 應遵循的記憶持久化工作流 |

## 參考文獻

[1] *Memory for AI Agents: Designing Persistent, Adaptive Memory Systems*. Medium.
[2] Steve Yegge. (2025). *Introducing Beads: A coding agent memory system*. Medium.
[3] Cursor. (2026). *Agent Trace: A standard format for tracing AI-generated code*. GitHub.
[4] Paolo Perrone. (2026). *The Complete Guide to AI Agent Memory Files (CLAUDE.md, AGENTS.md, and Beyond)*. Data Science Collective.
[5] Anthropic. (2026). *How Claude remembers your project*. Claude Code Docs.
[6] Lee Robinson. (2026). *Best practices for coding with agents*. Cursor Blog.
[7] Mem0. (2026). *Mem0 - The Memory Layer for your AI Apps*.
[8] Letta. (2026). *Core memory*. Letta Docs.
[9] Tiferet Gazit. (2026). *Building an agentic memory system for GitHub Copilot*. The GitHub Blog.
[10] Steve Yegge. (2025). *The Beads Revolution: How I Built The TODO System That AI Agents Actually Want to Use*. Medium.
