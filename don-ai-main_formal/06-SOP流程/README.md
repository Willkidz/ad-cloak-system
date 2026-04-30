---
title: "SOP 存放說明"
category: "sop"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "SOP 資料夾的用途說明、命名規則與建議優先建立的 SOP 清單。"
id: "20260325-102200"
type: "sop"
tags: [guidelines, landing-page, sop]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: 本文件說明 `06-SOP流程/` 資料夾的用途與命名規則。每個 SOP 文件描述一個可重複執行的標準操作流程，命名格式為 `sop-{任務名稱}.md` 或中文命名。文件中提供了 SOP 模板結構（含 frontmatter、步驟、驗證、回滾等區塊），並列出建議優先建立的 8 個 SOP 及其當前狀態。

# 06-SOP流程 — 存放說明

本資料夾用於存放標準操作流程（Standard Operating Procedure），每個 SOP 文件描述一個可重複執行的任務流程。

---

## 命名規則

<rule id="sop-naming">
檔案命名格式：`sop-{任務名稱}.md` 或 `{任務名稱}.md`（中文命名亦可）。
</rule>

---

## 建議優先建立的 SOP

| 優先度 | SOP 名稱 | 說明 | 狀態 |
| :--- | :--- | :--- | :--- |
| P1 | sop-deploy-worker.md | Cloudflare Worker 部署流程（含驗證和回滾） | 已建立（[deploy-sop.md](deploy-sop.md)） |
| P1 | sop-new-pixel.md | 新增 Facebook 像素的完整流程（含 BM 權限指派） | 待建立 |
| P1 | sop-new-line-oa.md | 新增 LINE 官方帳號的流程（含 Webhook 設定） | 待建立 |
| P1 | sop-new-domain.md | 新增域名的完整流程（含 DNS、Worker Route、D1） | 已建立（[domain-add-sop.md](domain-add-sop.md)） |
| P2 | sop-new-tag.md | 新增 tag（產品線）的完整流程 | 待建立 |
| P2 | sop-capi-debug.md | CAPI 事件發送失敗的排錯流程 | 待建立 |
| P2 | sop-n8n-maintenance.md | N8N 伺服器維護流程（含 DNS、更新、備份） | 待建立 |
| P3 | sop-weekly-review.md | 每週數據回顧與知識庫維護流程 | 待建立 |
| P3 | sop-archive.md | 文件歸檔流程（含記憶整合步驟） | 待建立 |

---

## SOP 模板

<example>
每個 SOP 文件應包含以下結構：

```markdown
---
title: "SOP 標題"
category: sop
priority: high
applicable_tools: all
last_updated: YYYY-MM-DD
activation_glob: null
summary: "一句話摘要"
id: YYYYMMDD-HHMMSS
type: sop
tags: [相關標籤]
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# SOP 標題

## 前置條件
（執行此 SOP 前需要準備什麼）

## 步驟
<step id="sop-step-1">
1. 步驟一
2. 步驟二
</step>

## 驗證
（如何確認操作成功）

## 回滾
（如果出錯如何恢復）

## 注意事項
（常見陷阱和提醒）

## 相關文件
（交叉引用相關文件）
```
</example>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/_index.md`](_index.md) | 本目錄的文件索引 |
| [`01-核心原則/doc-standards-spec.md`](../01-核心原則/doc-standards-spec.md) | YAML frontmatter 標準格式 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 通用指令中的四大標準 SOP 定義 |
