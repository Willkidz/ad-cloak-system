---
title: "任務追蹤索引"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-08"
summary: "任務交接、版本紀錄、評估紀錄等 6 個任務追蹤文件的摘要索引。"
id: "20260325-IDX-08"
type: "index"
tags: [index, todo]
status: "active"
created: "2026-03-25"
updated: "2026-04-08"
---

> **TL;DR**: 本目錄包含 6 個任務追蹤文件。session 未完成需交接用 `HANDOFF.md`；查版本歷史用 `project-changelog.md`（Cloak Admin）、`shadow-cloak-changelog.md`（隱者斗篷）或 `godview-changelog.md`（上帝視角）；任務自評用 `project-evaluation-log.md`。任務狀態的唯一來源為 `.ai/active-context.md`。

# 任務追蹤索引

本目錄存放所有與任務進度、版本紀錄、交接文檔相關的文件，共 6 個 Markdown 文件。

---

## 文件清單（6 個）

| 文件 | 標題 | 優先級 | 摘要 |
| :--- | :--- | :--- | :--- |
| [HANDOFF.md](./HANDOFF.md) | 結構化任務交接文檔模板 | high | 當 AI session 結束但任務未完成時，必須填寫此模板進行結構化交接 |
| [project-changelog.md](project-changelog.md) | 版本紀錄（Cloak Admin） | medium | 斗篷管理後台的完整版本發佈紀錄，含 A/B 規劃組所有版本（v1.0~v1.11.0） |
| [godview-changelog.md](godview-changelog.md) | 上帝視角（GodView）— 版本紀錄 | medium | 上帝視角廣告歸因系統的完整版本發佈紀錄（v1.0.0 起） |
| [project-evaluation-log.md](project-evaluation-log.md) | 評估紀錄 | low | 任務評估模板與歷史評估記錄，AI 在每次任務完成後記錄自我評分 |
| [shadow-cloak-changelog.md](shadow-cloak-changelog.md) | 隱者斗篷（Shadow Cloak）— 版本紀錄 | medium | 隱者斗篷系統的完整版本發佈紀錄，含 Phase 1~2、v1.0~v1.8 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`CHANGELOG.md`](../CHANGELOG.md) | 根目錄的全局變更日誌 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 4 Offboarding 流程定義了何時需要填寫 HANDOFF.md |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前工作上下文，任務狀態唯一來源 |

---

## 統計

- 文件數量：6
- 最後更新：2026-04-08
