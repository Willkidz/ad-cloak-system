---
title: "AI 核心記憶索引"
category: "config"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "AI 核心記憶目錄的文件索引，包含記憶持久化、架構決策、錯誤學習與 Debug 模板。"
id: "20260327-IDX-AI"
type: "index"
tags: [ai-agent, index, memory]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
version: "v1.0"
---

> **TL;DR**: 本文件是 `.ai/` 目錄的導航索引，列出 7 個核心記憶文件及其用途。AI 助手在每次任務開始時強制讀取本索引，根據讀取優先級決定載入順序：快速了解現狀讀 `active-context.md`、了解全局架構讀 `memory.md` + `system-patterns.md`、查詢歷史決策或錯誤讀對應日誌。

# .ai/ 核心記憶索引

本目錄是 AI 助手的核心記憶中樞，採用 Memory Bank 標準結構。AI 在每次任務開始時強制讀取，任務結束時強制更新。

---

## 文件清單（7 個）

| 文件 | 標題 | 摘要 |
| :--- | :--- | :--- |
| [memory.md](./memory.md) | 專案核心記憶 | 專案概述、編碼規範、架構決策摘要、系統狀態快照、部署流程與版本管理、AI 助手行為準則 |
| [active-context.md](./active-context.md) | 活躍上下文 | 當前正在進行的任務、最近的變更軌跡、下一步計畫。快速掌握即時狀態 |
| [system-patterns.md](./system-patterns.md) | 系統架構模式 | 整體架構概覽、關鍵架構決策、設計模式、技術棧詳情、API 行為備忘 |
| [decision-log.md](./decision-log.md) | 架構決策記錄 (ADR) | 重要架構決策的背景、方案、替代方案與影響，遵循 MADR 標準 |
| [error-log.md](./error-log.md) | 錯誤學習日誌 | 踩過的坑與解決方案，避免重複犯錯（含已驗證規則區） |
| [pending-rules.md](./pending-rules.md) | 待驗證規則草稿區 | 存放 AI 從錯誤中提煉的規則草稿，等待 7 天金絲雀試用期驗證 |
| [prompts/debug-prompt.md](./prompts/debug-prompt.md) | Debug 基礎模板 | 防執著偏差的結構化除錯流程模板（增強版見 `skills/systematic-debugging.md`） |

---

## 讀取優先級

1. **快速了解現狀** → 讀 `active-context.md`
2. **了解全局架構** → 讀 `memory.md` + `system-patterns.md`
3. **查詢歷史決策** → 讀 `decision-log.md`
4. **查詢歷史錯誤** → 讀 `error-log.md`
5. **進行 Debug** → 讀 `prompts/debug-prompt.md`（基礎版）或 `skills/systematic-debugging.md`（增強版）

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 1 Onboarding 流程中定義了本目錄的讀取順序 |
| [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md) | `.ai/` 目錄文件可使用簡化 frontmatter 的例外規定 |
| [`01-核心原則/quality-and-testing-rules.md`](../01-核心原則/quality-and-testing-rules.md) | 定義了 `pending-rules.md` → `error-log.md` 的規則轉正流程 |

---

## 統計

- 文件數量：7
- 最後更新：2026-03-28
