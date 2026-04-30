---
title: "變更記錄規則"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）變更記錄規則"
type: "spec"
tags: [changelog, memory]
status: "archived"
---
description: 強制記錄程式碼變更
globs: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.py"]
alwaysApply: false
---

# 變更記錄規則

當你對匹配的文件進行了實質性的修改（新增功能、修復 Bug、重構）後，你**必須**主動詢問用戶："是否需要將本次修改記錄到 `.ai/CHANGELOG.md` 中？"

如果用戶同意，請分析你剛剛的程式碼 diff，並以專業的開發者語氣，將變更總結寫入 `.ai/CHANGELOG.md` 的頂部。
```
</example>

### 針對 Claude Code 用戶：配置 CLAUDE.md

如果你主要使用 Claude Code，可以在 `CLAUDE.md` 中添加以下內容，以整合專案上下文：

<example>
```markdown
# Claude Code 專案配置

## 導入通用配置
See @AGENTS.md for shared project context

## Claude 特定的工作流
當完成任務時，使用 `/memory` 命令記錄關鍵決策。
```
</example>

## GitHub Actions 自動化（可選）

如果你想自動化 Changelog 的生成和發布，可以在 `.github/workflows/` 中建立以下工作流：

<example>
**文件路徑**：`.github/workflows/changelog.yml`

```yaml
name: Generate Changelog

on:
  push:
    branches:
      - main
    paths:
      - '.ai/CHANGELOG.md'

jobs:
  update-wiki:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update Wiki
        run: |
          # 將 .ai/CHANGELOG.md 複製到 wiki 目錄
          cp .ai/CHANGELOG.md wiki/AI-Changes.md
          git config user.name "AI Changelog Bot"
          git config user.email "bot@example.com"
          git add wiki/AI-Changes.md
          git commit -m "Auto-update changelog from AI changes"
          git push
```
</example>

## 最佳實踐

<rule id="best-practice-1">
### 1. 定期審查 Changelog
每週花 10 分鐘審查 `.ai/CHANGELOG.md`，確保記錄準確無誤。這可以幫助你理解 AI 的決策過程，並及時糾正偏差。
</rule>

<rule id="best-practice-2">
### 2. 使用清晰的任務描述
在 `.ai/TODO.md` 中使用清晰、具體的任務描述。例如，不要寫「修復 bug」，而要寫「修復用戶登入時 token 過期導致的 500 錯誤」。
</rule>

<rule id="best-practice-3">
### 3. 定期更新 AGENTS.md
當專案的技術棧或程式碼規範發生變化時，立即更新 `AGENTS.md`。這確保 AI 總是基於最新的專案資訊工作。
</rule>

<rule id="best-practice-4">
### 4. 為複雜任務添加背景資訊
在 `.ai/TODO.md` 中，為複雜的任務添加背景資訊和相關的文件引用，以提供充足的上下文。

<example>
```markdown
- [ ] 重構認證系統以支持 OAuth
  - 背景：當前使用簡單的 JWT，需要支持第三方登入
  - 相關文件：`src/auth/`, `src/pages/api/auth/`
  - 參考：See @docs/oauth-implementation.md
```
</example>
</rule>

## 故障排除

以下列出實施 AI 記憶系統時常見的問題與解決方案：

| 常見問題 | 解決方案 |
| :--- | :--- |
| **AI 仍然在重複之前的錯誤** | 檢查 `.ai/CHANGELOG.md` 中是否記錄了該錯誤及其解決方案。如果沒有，手動添加。然後在 `AGENTS.md` 中添加一個特定的規則，例如「不要在 API 路由中使用同步文件操作」。 |
| **Changelog 變得太長** | 按月份或功能模組分割 changelog。例如，建立 `.ai/CHANGELOG-2026-03.md` 和 `.ai/CHANGELOG-auth.md`。 |
| **多個 AI 助手之間的記憶不同步** | 確保所有 AI 助手都讀取了相同的 `AGENTS.md`。如果使用 Cursor 和 Claude Code，確保兩者都在專案根目錄中讀取 `AGENTS.md`。 |

## 下一步

<step>
1. 將這些文件提交到 Git：`git add AGENTS.md .ai/ && git commit -m "Add AI memory system"`
</step>
<step>
2. 在你的 AI 工具中測試：告訴 AI「請讀取 AGENTS.md 和 .ai/TODO.md，然後告訴我當前的任務是什麼」
</step>
<step>
3. 完成第一個任務，並要求 AI 更新 `.ai/CHANGELOG.md`
</step>
<step>
4. 審查記錄，調整格式和詳細程度
</step>

## 結論

**建立完善的 AI 記憶系統是提升人機協作效率的關鍵。** 透過標準化的文件結構與嚴格的變更記錄工作流，開發者可以有效避免 AI 遺忘上下文或重複犯錯。持續維護與更新這些記憶文件，將使 AI 助手越來越熟悉專案，成為更可靠的開發夥伴。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/deploy-and-version-spec.md` | 變更記錄的標準規範參考 |
| `08-任務追蹤/project-todo.md` | 任務追蹤與狀態更新參考 |
| `.ai/memory.md` | AI 記憶持久化的核心文件 |
