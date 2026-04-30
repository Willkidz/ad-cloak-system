---
title: "技能模板"
category: "sop"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "新增技能時的標準模板，複製此文件並填寫所有欄位。"
id: "20260327-SKILL-TEMPLATE"
type: "template"
tags: [reference, skills]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: 這是新增技能的標準模板。複製此文件後，依序填寫技能名稱、觸發條件、前置知識、具體步驟（使用 `<step>` 標籤）、驗證方式及常見陷阱。完成後將新技能加入 `skills/_index.md` 的技能清單表，並更新 `00-系統索引/common-cmd.md` 的條件式載入映射表。

# 技能名稱

> 一句話描述這個技能的用途。

## 觸發條件

<!-- 什麼情況下 AI 應該載入並使用這個技能？ -->
-

## 前置知識

<!-- 使用這個技能前，AI 需要先讀取哪些文件或了解哪些背景？ -->
-

## 具體步驟

<!-- 詳細的操作步驟，越具體越好。可以包含代碼範例、命令範例等。 -->

<step id="step-1">

### 步驟 1：
<!-- 描述 -->

</step>

<step id="step-2">

### 步驟 2：
<!-- 描述 -->

</step>

<step id="step-3">

### 步驟 3：
<!-- 描述 -->

</step>

## 驗證方式

<!-- 如何確認這個技能已經被正確執行？列出具體的驗證標準。 -->
- [ ]
- [ ]

## 常見陷阱

<!-- 執行此技能時容易犯的錯誤，幫助 AI 避坑。 -->
-

## 相關文件

<!-- 與此技能相關的其他文件連結 -->

| 文件 | 關係 |
| :--- | :--- |
| [`skills/_index.md`](_index.md) | 技能庫索引（新增技能後需更新） |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 條件式載入映射表（新增技能後需更新） |
| [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md) | YAML frontmatter 標準格式 |
