---
title: "動態記憶索引"
category: "index"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "動態記憶資料夾的摘要索引，包含對話精華與想法規劃共 2 個活躍文件。D1 知識庫匯出已歸檔至 09-歸檔/（ADR-003）。"
id: "20260325-IDX-02"
type: "index"
tags: [index, memory]
status: "active"
created: "2026-03-16"
updated: "2026-03-31"
---

> **TL;DR**: `02-動態記憶/` 存放動態更新的記憶資料，共 2 個活躍文件。對話精華記錄歷史決策與發現（知識庫架構、Bug 分析、CI/CD 等）；想法與規劃記錄用戶的未來方向與構想。D1 知識庫匯出已隨 manus-memory 系統廢棄（ADR-003）歸檔至 `09-歸檔/02-動態記憶/`。

# 02-動態記憶 索引

本資料夾存放動態更新的記憶資料，包含對話中的重要決策與想法規劃。AI 在每次任務開始前應參考本目錄的對話精華與想法規劃，了解用戶的整體思路與歷史決策。

---

## 文件清單（2 個）

| 文件 | 標題 | 摘要 |
| :--- | :--- | :--- |
| [chat-highlights-memory.md](chat-highlights-memory.md) | 對話精華 | 重要對話結論與決策記錄，涵蓋知識庫架構選型、Bug 分析、CI/CD 決策、CAPI 發現、N8N 配置等主題 |
| [ideas-plan-memory.md](ideas-plan-memory.md) | 想法與規劃 | 用戶的想法、計畫和未來方向記錄，供 AI 在後續 session 中參考 |

> ℹ️ **已歸檔**：`d1-kb-export-memory.md`（D1 記憶系統完整匯出）已隨 manus-memory 系統廢棄（ADR-003, 2026-03-30）移至 [`09-歸檔/02-動態記憶/d1-kb-export-memory.md`](../09-歸檔/02-動態記憶/d1-kb-export-memory.md)。

---

## 使用指引

<rule id="dynamic-memory-usage">

1. **對話精華**：每次 session 開始時快速瀏覽，了解歷史決策脈絡。
2. **想法與規劃**：了解用戶的整體方向，避免與既定規劃衝突。

</rule>

---

## 統計

- 文件數量：2（不含 _index.md）
- 已歸檔：1（d1-kb-export-memory.md → 09-歸檔/）
- 最後更新：2026-03-31

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/memory.md`](../.ai/memory.md) | 系統狀態快照（與動態記憶互補） |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前活躍上下文（任務狀態唯一來源） |
| [`.ai/decision-log.md`](../.ai/decision-log.md) | 架構決策日誌（MADR 格式） |
