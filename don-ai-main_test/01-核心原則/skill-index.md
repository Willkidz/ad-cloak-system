---
title: "gws CLI 最佳實踐"
category: "principle"
priority: "medium"
applicable_tools: [gws-cli]
last_updated: "2026-03-28"
summary: "gws CLI 使用最佳實踐，涵蓋支援服務、Drive 連結處理、Slides 文字格式、禁止永久刪除等規則。"
id: "20260327-skill-gws"
type: "spec"
tags: [guidelines, index]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
activation_glob: null
name: "gws-best-practices"
description: "Best practices for using the gws CLI with supported Google Workspace services (Drive, Docs, Sheets, Slides). Use when performing any operation with the gws CLI."
version: "v1.0"
---

> **TL;DR**: gws CLI 僅支援 Drive、Docs、Sheets、Slides 四項服務，禁止嘗試其他服務。與 Google Drive 相關連結必須透過 gws 命令操作，禁止用瀏覽器開啟。Slides 文字中 `\n` 產生新段落、`\v` 產生軟換行。嚴禁執行任何永久刪除用戶數據的命令。

# gws CLI 最佳實踐

使用 `gws` 命令列介面的關鍵指南。遵循這些規則以防止常見錯誤並保護用戶數據。

---

## 1. 支援的服務

<rule id="gws-supported-services">
僅以下服務可用且已預先配置：

| 服務 | 功能 |
| :--- | :--- |
| **Drive** | 文件和資料夾操作 |
| **Docs** | 文檔讀寫 |
| **Sheets** | 試算表讀寫 |
| **Slides** | 簡報讀寫 |

所有其他服務（Gmail、Calendar、Tasks、Chat 等）**不可用**，禁止嘗試使用。
</rule>

---

## 2. 與 Google Drive 連結互動

<rule id="gws-drive-links">
**禁止使用瀏覽器開啟 Google Drive、Docs、Sheets 或 Slides 連結**（如 `https://docs.google.com/...`）。瀏覽器環境可能未登入正確的 Google 帳號，存取很可能失敗。

應使用 `gws` 命令與這些資源互動。要查看內容，使用對應的 `get` 或 `export` 命令（如 `gws drive export`）。
</rule>

---

## 3. Google Slides 文字格式：`\n` vs. `\v`

<rule id="gws-slides-formatting">
透過 `gws slides presentations batchUpdate` 插入文字時，API 對換行字元有特定的解釋方式：

| 輸入字串 | API 解釋 | 視覺結果 |
| :--- | :--- | :--- |
| `First\nSecond` | 兩個獨立段落 | First（換行）Second（如按 Enter） |
| `First\vSecond` | 單一段落中的垂直 Tab | First（換行）Second（如按 Shift+Enter） |
| `First\n\nSecond` | 三個段落（中間為空） | First（空行）Second |

- **`\n`（Newline）**：API 將每個 `\n` 轉換為新的 `paragraphMarker`，產生新段落
- **`\v`（Vertical Tab, `\u000b`）**：API 視為單一 `textRun` 內的特殊字元，產生軟換行

**規則**：使用 `\n` 建立新段落/項目符號；使用 `\v` 在同一段落/項目符號內換行。
</rule>

---

## 4. 禁止永久刪除

<rule id="gws-no-permanent-delete">
**嚴禁執行任何永久刪除用戶數據的 gws 命令。**

這包括永久刪除文件、簡報、文檔、電子郵件、日曆事件或任何其他資源。始終使用垃圾桶/封存操作替代。即使用戶要求刪除，也應先移至垃圾桶並明確確認後再進行。

> 永久刪除是不可逆的，可能導致災難性的數據損失。
</rule>

---

## 5. 探索可用技能

<step id="gws-explore-skills">
首次使用或更新 CLI 後，執行以下命令生成本地技能文檔：

```bash
gws generate-skills
```

這會在 `skills/` 下產生技能目錄，並在 `docs/skills.md` 產生索引。閱讀生成的索引和個別技能文件以了解可用的命令、服務、配方和工作流程。
</step>

---

## 6. 更新 CLI

```bash
pnpm update -g @googleworkspace/cli
```

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/security-and-safety-rules.md` | 安全護欄中的「禁止永久刪除」規則與本文第 4 節一致 |
| `01-核心原則/ai-work-spec.md` | AI 工作規範中的工具使用相關規則 |
