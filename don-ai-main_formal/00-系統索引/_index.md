---
title: "系統索引"
category: "config"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "AI 全局入口目錄的文件索引，包含 llms.txt 入口地圖、系統全貌指南、受控標籤詞彙表、通用指令、truth-table 硬事實表與標籤完整性報告。"
id: "20260327-IDX-00"
type: "index"
tags: [architecture, index]
status: "active"
created: "2026-03-27"
updated: "2026-03-30"
---

> **TL;DR**: 本目錄是 AI 助手的全局入口，包含 7 個文件。AI 啟動時先讀 `llms.txt`（L0 層導航），再按需讀取 `sys-overview.md`（系統全貌）、`common-cmd.md`（通用指令與 SOP）。`truth-table.md` 記錄經驗證的系統硬事實，遇矛盾時以此為準。`tag-integrity-analysis.md` 為 frontmatter 完整性掃描報告，供維護參考。

# 00-系統索引 索引

本目錄是 AI 助手的全局入口，包含知識庫導航地圖、系統全貌指南、受控標籤詞彙表與通用工作指令。AI 在每次任務開始時應先讀取本目錄的 `llms.txt`。

---

## 文件清單（7 個）

| 文件 | 標題 | 摘要 |
| :--- | :--- | :--- |
| [llms.txt](./llms.txt) | AI 全局入口地圖 | 知識庫完整結構導航，AI 助手的唯一入口文件，用於 L0 層快速判斷任務涉及的資料夾 |
| [sys-overview.md](./sys-overview.md) | 系統全貌與快速上手 | 為新 Agent 準備的系統全貌指南，包含斗篷系統、上帝視角、整體架構、Worker 清單與域名清單 |
| [tags.yaml](./tags.yaml) | 受控標籤詞彙表 | 所有 Markdown 文件 YAML frontmatter 中 tags 的受控詞彙，避免同義詞混用 |
| [common-cmd.md](./common-cmd.md) | Don AI 通用指令 v2.6 | 新 AI session 必讀的通用指令，包含四大核心機制、四大 SOP、三層邊界、條件式動態載入 |
| [truth-table.md](./truth-table.md) | 系統硬事實表 | 經過驗證的系統硬事實，遇矛盾時以此為最終裁定 |
| [tag-integrity-analysis.md](./tag-integrity-analysis.md) | 標籤完整性報告 | 全倉庫 331 個 .md 文件的 YAML frontmatter 完整性掃描報告（2026-03-27） |
| [_index.md](./_index.md) | 本索引文件 | 本目錄的文件索引 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/_index.md`](../.ai/_index.md) | AI 核心記憶索引（與本目錄互補：本目錄管導航，.ai/ 管記憶） |
| [`01-核心原則/_index.md`](../01-核心原則/_index.md) | 核心原則索引（本目錄的通用指令引用了 01-核心原則/ 的所有規範） |

---

## 統計

- 文件數量：7
- 最後更新：2026-03-30
