---
title: "部署與版本管理規範"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整合測試版/正式版分離部署流程與版本更新記錄（CHANGELOG）規範。"
type: "rule"
tags: [changelog, deployment, documentation, sop]
status: "active"
activation_glob: null
version: "v1.0"
---

<!-- Merged from version-update-spec.md -->
> **TL;DR**: 本規範定義語義版本控制格式（v主版本.次版本.修補版本）、CHANGELOG.md 更新規則（每次部署前必須更新）、commit 訊息格式（`v版本號: 簡短描述`）以及五步版本發佈流程。版本號遞進依據修改內容決定：新功能 → 次版本 +1、Bug 修復 → 修補版本 +1、重大架構變更 → 主版本 +1。

# 版本更新記錄規範

## 概述

版本號和變更記錄是追蹤系統演進的重要工具。本規範定義了版本號格式、CHANGELOG 更新規則和 commit 訊息規範。

---

## 1. 版本號格式

<rule id="version-semver">
### 語義版本控制 (Semantic Versioning)

版本號格式：**v主版本.次版本.修補版本**

| 版本類型 | 格式 | 範例 | 何時遞進 |
| :--- | :--- | :--- | :--- |
| 主版本 | v**X**.0.0 | v2.0.0 | 重大架構變更、不向後相容的修改 |
| 次版本 | v1.**X**.0 | v1.11.0 | 新增功能、向後相容的新特性 |
| 修補版本 | v1.0.**X** | v1.0.10 | Bug 修復、小優化、配置更新 |
</rule>

### 版本號遞進範例

```
v1.10.8 (當前版本)
  ↓ 新增功能（次版本 +1）
v1.11.0
  ↓ Bug 修復（修補版本 +1）
v1.11.1
  ↓ 重大改版（主版本 +1）
v2.0.0
```

---

## 2. CHANGELOG.md 規範

### 文件位置

- cloak-admin 前端：`/home/ubuntu/cloak-admin/CHANGELOG.md`
- cloak-admin-api 後端：`/home/ubuntu/cloak-admin-api/CHANGELOG.md`
- don-ai 知識庫：`/home/ubuntu/don-ai/CHANGELOG.md`

### 更新時機

<rule id="version-changelog-timing">
**每次部署到正式版前必須更新 CHANGELOG.md。** 無論變更大小，都必須在 CHANGELOG 中新增一條記錄。
</rule>

### 記錄格式

<rule id="version-changelog-format">
在文件頂部追加新版本的記錄（最新版本在最上方）：

```markdown
## [v版本號] - YYYY-MM-DD

### 新增 (Added)
- 新功能描述 1
- 新功能描述 2

### 修復 (Fixed)
- Bug 修復描述 1

### 優化 (Improved)
- 性能優化描述 1

### 已知問題 (Known Issues)
- 已知問題描述（如有）

---
```
</rule>

<example>

```markdown
## [v1.11.0] - 2026-03-26

### 新增 (Added)
- 廣告列表新增 iPhone/Android/PC 點擊數欄位
- 廣告列表新增歸因欄位（Top 1 流量來源 + 百分比）
- 後端新增 `/api/v1/campaigns/stats` endpoint，統計設備點擊數和流量歸因

### 修復 (Fixed)
- 修復廣告編輯表單的 React 崩潰問題（陣列欄位 JSON parse 錯誤）
- 修復 Settings 頁面的 inline notice 顯示問題

### 優化 (Improved)
- 優化廣告列表表格加載性能（並行請求 campaigns 和 stats API）
- 簡化 API 數據規範化流程

---
```
</example>

---

## 3. Commit 訊息規範

<rule id="version-commit-format">
### 格式

```
v版本號: 簡短描述（50 字以內）

詳細說明（可選）
- 修改文件清單
- 具體改動內容
- 影響範圍
```

### 禁止事項

| 禁止行為 | 原因 |
| :--- | :--- |
| 只寫版本號，沒有描述 | 無法快速了解變更內容 |
| 模糊描述（如「fix bug」、「update code」） | 無法追蹤具體修改 |
| 超過 50 字的簡短描述 | 影響 git log 可讀性 |
| 在 commit 訊息中記錄完整代碼變更 | 應在 CHANGELOG.md 中記錄 |
</rule>

<example>

```
v1.11.0: 新增廣告列表設備點擊數和歸因統計欄位

- 修改文件：client/src/pages/Campaigns.tsx, client/src/lib/api.ts, server/index.ts
- 新增後端 API endpoint: GET /api/v1/campaigns/stats
- 前端表格新增 iPhone/Android/PC/歸因四個欄位
- 後端查詢 cloak_logs 表統計設備點擊數和流量來源
```
</example>

---

## 4. 版本發佈流程

<step id="release-1">
**步驟 1 — 準備發佈**：確認所有功能已在測試版驗證無誤，決定版本號（根據修改內容決定是 major/minor/patch），更新 CHANGELOG.md。
</step>

<step id="release-2">
**步驟 2 — 提交代碼**：

```bash
git add CHANGELOG.md
git commit -m "v版本號: 簡短描述"
git push origin main
```
</step>

<step id="release-3">
**步驟 3 — 部署到正式版**：按照 `06-SOP流程/deploy-sop.md` 的流程執行部署。
</step>

<step id="release-4">
**步驟 4 — 驗證部署**：訪問正式版網站驗證前端，測試 API 回應，確認沒有新錯誤。
</step>

<step id="release-5">
**步驟 5 — 更新記憶**：更新 `.ai/memory.md` 的「系統狀態快照」。
</step>

---

## 5. 版本號決策樹

```
修改內容是什麼？
├─ 新增功能（向後相容）
│  └─ 次版本 +1（v1.10.0 → v1.11.0）
├─ Bug 修復
│  └─ 修補版本 +1（v1.10.9 → v1.10.10）
├─ 性能優化、代碼重構
│  └─ 修補版本 +1（v1.10.9 → v1.10.10）
├─ 不向後相容的修改、重大架構變更
│  └─ 主版本 +1（v1.10.0 → v2.0.0）
└─ 配置更新、文檔更新
   └─ 修補版本 +1（v1.10.9 → v1.10.10）
```

---

## 6. 常見問題

### Q: 如果一次修改包含新功能和 Bug 修復，版本號怎麼定？

A: 優先按最重要的修改定版本號。通常新功能優先級更高，所以用次版本 +1。

### Q: 為什麼要在 CHANGELOG.md 中記錄，commit 訊息不夠嗎？

A: Commit 訊息是給開發者看的，CHANGELOG.md 是給用戶看的。CHANGELOG 應該用更易懂的語言描述用戶可見的變化。

### Q: 如果部署後發現問題，版本號怎麼處理？

A: 回滾到上一個穩定版本，修復問題後發佈新版本（修補版本 +1）。不要修改已發佈的版本號。

### Q: 測試版部署需要更新版本號嗎？

A: 不需要。版本號只在部署到正式版時更新。測試版可以用 `v版本號-rc1`（Release Candidate）標記，但不是必須。

---

## 7. 部署前檢查清單

- [ ] CHANGELOG.md 已更新新版本記錄
- [ ] Commit 訊息格式正確（`v版本號: 描述`）
- [ ] 版本號遞進符合規則（根據修改內容決定 major/minor/patch）
- [ ] 所有修改已記錄到 CHANGELOG.md 的「新增/修復/優化」部分
- [ ] `.ai/memory.md` 已更新版本發佈記錄
- [ ] 代碼已推送到 GitHub
- [ ] 正式版部署成功，功能驗證通過

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `CHANGELOG.md` | 本規範的實際應用文件 |
| `06-SOP流程/deploy-sop.md` | 部署流程 SOP（部署時必須更新 CHANGELOG） |
| `06-SOP流程/pre-commit-checklist.md` | 提交前檢查 CHANGELOG 是否已更新 |
| `01-核心原則/ai-work-spec.md` | AI 工作規範中的版本管理相關規則 |
