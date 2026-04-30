---
title: "待驗證規則草稿區"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "存放 AI 從錯誤中提煉的規則草稿，經過金絲雀試用期驗證後才能轉正至 error-log.md 的已驗證規則區。"
id: "20260327-PENDING-001"
type: "memory"
tags: [guidelines, memory]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
version: "v1.0"
---

> **TL;DR**: 本文件是「防護型自動學習迴圈」的暫存區。AI 從錯誤中提煉的規則草稿必須先存放在此，經過 7 天金絲雀試用期驗證後，才能轉移至 `error-log.md` 的「已驗證規則」區塊。每條規則有四種狀態：Pending → Trial → Verified/Rejected。目前暫無待驗證的規則草稿。

# 待驗證規則草稿區 (Pending Rules)

---

## 1. 用途說明

本文件是「防護型自動學習迴圈」的暫存區。AI 在 Offboarding 階段從 [`.ai/error-log.md`](./error-log.md) 提煉出的新規則草稿，必須先存放在這裡，**絕對不能直接生效**。

所有規則草稿必須經過 7 天的「金絲雀試用期」（僅在低風險任務中參考）。試用期滿且無負面影響後，才能轉移到 [`.ai/error-log.md`](./error-log.md) 的「已驗證規則」區塊。

---

## 2. 狀態說明

每條規則草稿必須標註以下狀態之一：

| 狀態 | 說明 |
| :--- | :--- |
| `[Pending]` | 剛提煉出，等待進入試用期（若信心等級為「低」，需等待人工確認） |
| `[Trial: YYYY-MM-DD]` | 正在試用中，標註試用開始日期 |
| `[Verified]` | 試用通過，準備轉移至 `error-log.md` |
| `[Rejected: 原因]` | 試用失敗，標註淘汰原因並歸檔於此，防止未來重複提煉 |

---

## 3. 規則草稿模板

<rule id="pending-rule-template">

新增規則草稿時，請嚴格使用以下格式：

```markdown
### [狀態] 規則簡述

- **觸發條件**：[在什麼具體情況下適用此規則？]
- **錯誤現象**：[如果不遵守此規則，會發生什麼錯誤？]
- **正確做法**：[應該如何正確執行？]
- **來源**：[源自哪次 session 的哪一項錯誤紀錄？例如：2026-03-27 斗篷後台 Bug]
- **信心等級**：[高 / 中 / 低]
```

</rule>

---

## 4. 規則草稿列表

*(目前暫無待驗證的規則草稿)*

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/error-log.md`](./error-log.md) | 規則試用通過後轉入該文件的「已驗證規則」區塊 |
| [`01-核心原則/quality-and-testing-rules.md`](../01-核心原則/quality-and-testing-rules.md) | 定義了完整的失敗學習迴圈流程 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 4 Offboarding 流程中定義了規則提煉步驟 |
