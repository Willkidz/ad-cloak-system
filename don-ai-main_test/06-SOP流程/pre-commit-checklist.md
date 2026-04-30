---
title: "AI 專屬 Pre-commit 自檢清單"
category: "sop"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "AI 在提交代碼（git commit）前必須逐項自檢的質量閘門清單，攔截跨文件結構性錯誤。"
id: "20260327-SOP-001"
type: "sop"
tags: [ai-agent, checklist, sop]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: 本清單是 AI 在執行 `git commit` 前的強制自檢閘門。涵蓋四大檢查維度：跨文件結構完整性（斷鏈導入、函數簽名同步、殘留引用）、代碼品質（`any` 類型、硬編碼密碼、未處理錯誤、除錯程式碼）、文檔同步（CHANGELOG、`_index.md`、`.ai/` 記憶文件）及知識庫連結完整性（Markdown 內部連結、YAML frontmatter）。所有項目必須全部通過才能提交。

# AI 專屬 Pre-commit 自檢清單

> **用途**：AI 在執行 `git add` / `git commit` 之前，必須逐項檢查以下清單。所有項目必須全部通過，才能執行提交。
> **觸發時機**：每次準備提交代碼或文檔變更時（對應 SOP 4 Offboarding 流程的提交步驟之前）。

---

## 自檢項目

### 1. 跨文件結構完整性

<rule id="precommit-structure">

- [ ] **斷鏈的模組導入**：檢查所有新增或修改的 `import` / `require` 語句，確認目標模組確實存在且路徑正確
- [ ] **未同步更新的函數調用者**：若修改了某個函數的簽名（參數、返回值），確認所有調用該函數的地方都已同步更新
- [ ] **對已刪除文件的殘留引用**：若本次提交刪除了任何文件，全域搜索確認沒有其他文件仍然引用已刪除的文件路徑

</rule>

### 2. 代碼品質

<rule id="precommit-quality">

- [ ] **是否有 `any` 類型**：檢查所有 TypeScript 文件，確認沒有新增的 `any` 類型（違反 AGENTS.md 編碼規範）
- [ ] **是否有硬編碼密碼 / Token**：全域搜索確認代碼中沒有硬編碼的密碼、API Key、Token 或其他敏感憑證（違反三層邊界 Never do 規範）
- [ ] **是否有未處理的錯誤**：檢查所有異步請求是否都包含 `try-catch` 塊
- [ ] **是否有遺留的除錯程式碼**：確認沒有 `console.log`、`debugger` 等除錯語句

</rule>

### 3. 文檔同步

<rule id="precommit-docs">

- [ ] **是否已更新 `CHANGELOG.md`**：確認本次變更已按照「版本更新記錄規範」記錄到 `CHANGELOG.md` 頂部
- [ ] **是否已更新相關 `_index.md`**：若新增或刪除了文件，確認對應資料夾的 `_index.md` 已同步更新
- [ ] **是否已更新 `.ai/` 記憶文件**：若涉及架構決策、重大 Bug 修復或系統狀態變更，確認已更新 `memory.md`、`active-context.md`、`decision-log.md` 或 `error-log.md`

</rule>

### 4. 知識庫連結完整性

<rule id="precommit-links">

- [ ] **Markdown 內部連結**：檢查所有新增的 Markdown 文件中的內部連結（`[文字](路徑)`），確認目標文件確實存在
- [ ] **YAML frontmatter**：確認所有新增的 Markdown 文件都包含完整的 YAML frontmatter（參照 [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md)）

</rule>

### 5. 標籤校驗（Tags Validation）

<rule id="precommit-tags">

- [ ] **tags 欄位存在**：確認所有新增或修改的 `.md` 文件的 YAML frontmatter 中包含 `tags` 欄位
- [ ] **標籤數量合規**：每個文件的 `tags` 數量在 **2-6 個**之間
- [ ] **標籤格式合規**：所有標籤為**全小寫英文 kebab-case** 格式（如 `cloudflare-workers`），禁止大寫字母、中文、底線或空格
- [ ] **標籤來源合規**：所有標籤必須存在於受控詞彙表 [`00-系統索引/tags.yaml`](../00-系統索引/tags.yaml) 中，禁止自創標籤
- [ ] **無同義詞**：若使用了 `tags.yaml` 同義詞映射表（`synonyms` 區塊）中列出的非標準標籤，必須替換為對應的標準標籤
- [ ] **語義相關**：標籤應與文件內容語義相關，避免無意義的泛用標籤堆砌

**快速驗證命令**（可選）：
```bash
# 列出所有 .md 文件中使用的標籤，檢查是否有不在受控詞彙表中的標籤
grep -rh '^tags:' --include='*.md' . | sed 's/tags: \[//;s/\]//;s/, /\n/g' | sort -u
```

</rule>

---

## 使用方式

<step id="precommit-usage">

1. 在準備提交前，逐項檢查上方清單
2. 每個項目確認通過後打勾
3. **全部通過**後，才能執行 `git add -A && git commit -m "..." && git push`
4. 若有任何項目未通過，**必須先修復**，再重新自檢

</step>

> **注意**：此清單是 SOP 4（Offboarding 流程）的前置步驟。即使是純文檔變更（不涉及代碼），也必須執行第 3、4 部分的檢查。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/deploy-sop.md`](deploy-sop.md) | 部署流程 SOP（本清單是部署前的前置步驟） |
| [`06-SOP流程/acceptance-checklist.md`](acceptance-checklist.md) | 部署後驗收清單 |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | 硬編碼密碼檢查的規則來源 |
| [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md) | YAML frontmatter 的標準格式 |
| [`01-核心原則/deploy-and-version-spec.md`](../01-核心原則/deploy-and-version-spec.md) | CHANGELOG.md 的更新規範 |
| [`AGENTS.md`](../AGENTS.md) | 編碼規範（`any` 類型禁止等） |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 4 Offboarding 流程定義 |
| [`00-系統索引/tags.yaml`](../00-系統索引/tags.yaml) | 受控標籤詞彙表與同義詞映射表（標籤校驗的基準） |
