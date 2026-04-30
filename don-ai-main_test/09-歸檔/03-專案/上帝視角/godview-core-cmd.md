---
title: "Memory System Commands"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "5. 風險評估：所有高風險操作都必須評估和確認"
status: "archived"
archived_reason: "歸檔：舊版核心指令，已由 Manus 專案指令：上帝視角.md 取代"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

5. 風險評估：所有高風險操作都必須評估和確認

# Memory System Commands
- 讀取記憶：`GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=上帝視角&limit=30`
- 寫入記憶：`POST https://manus-memory-api.laoqin1689.workers.dev/memory` with JSON body

# System Architecture
- 火鳥落地頁 → freshpathlab → Token 歸因 → n8n 工作流 → D1 數據庫 → 記憶系統
```
