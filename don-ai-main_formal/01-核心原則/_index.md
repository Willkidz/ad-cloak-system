---
title: "核心原則索引"
category: principle
priority: high
applicable_tools: all
last_updated: "2026-03-30"
activation_glob: null
summary: "核心原則與工作規範文件的摘要索引，包含 AI 工作規範、安全與防護、品質與測試、規則合規性測試集等 14 個核心文件。"
id: 20260327-IDX-01
type: index
tags: [guidelines, index]
status: active
created: 2026-03-27
updated: 2026-03-30
version: "v1.1"
---

> **TL;DR**: 本索引彙整 `01-核心原則/` 目錄下全部 14 個文件，涵蓋 AI 工作規範、安全防護、品質測試、工作流程、成本效能等核心治理文件。AI 應根據任務需求，透過三層載入架構選擇性讀取相關文件。

# 01-核心原則 索引

本目錄存放所有核心原則、工作規範與品質標準。經過 2026-03-29 的重構與合併，目前共有 14 個主題明確的核心文件（manus-memory-project-cmd.md 已於 2026-03-31 刪除）。

---

## 文件清單（14 個）

| 文件 | 標題 | 優先級 | 摘要 |
| :--- | :--- | :---: | :--- |
| [ai-work-spec.md](ai-work-spec.md) | AI 工作規範 | critical | AI 代理在處理 don-ai 專案時必須遵循的核心行為準則（含幻覺、一致性防護） |
| [security-and-safety-rules.md](security-and-safety-rules.md) | 安全與防護規則 | critical | 整合系統安全護欄、提示詞注入防護與數據隱私規則，確保 AI 操作的安全性與權限控管 |
| [quality-and-testing-rules.md](quality-and-testing-rules.md) | 品質標準與測試規則 | high | 整合程式碼/文件/部署的品質標準、測試深度要求、Code Review 標準以及失敗學習迴圈機制 |
| [workflow-and-communication-rules.md](workflow-and-communication-rules.md) | 工作流程與溝通規則 | high | 整合通用工作原則、任務優先級排程、雙代理協作模式與溝通規範 |
| [cost-performance-optimization-rules.md](cost-performance-optimization-rules.md) | 成本與效能優化規則 | high | 整合 Token 節省策略、API 成本控制與系統效能優化指南 |
| [deploy-and-version-spec.md](deploy-and-version-spec.md) | 部署與版本管理規範 | high | 整合測試版/正式版分離部署流程與版本更新記錄（CHANGELOG）規範 |
| [doc-standards-spec.md](doc-standards-spec.md) | 文件標準與命名規範 | high | 整合 Markdown 文件的 YAML 元數據標準與檔案命名/標籤規範 |
| [project-specific-specs.md](project-specific-specs.md) | 專案特定技術規範 | high | 整合廣告代碼格式、廣告列表欄位、LINE 設定維護與數據關聯原則等專案專屬規範 |
| [dependency-and-tool-rules.md](dependency-and-tool-rules.md) | 依賴管理與工具評估規範 | high | 整合專案依賴（npm/PyPI）的版本控制、更新策略，以及引入外部工具與套件的評估流程 |
| [industry-best-practices-rules.md](industry-best-practices-rules.md) | 業界最佳實踐規則 | high | 整合 Google、Microsoft、OpenAI 與 Cursor 等業界頂尖 AI 系統的最佳實踐（自動化回滾、複合身份追蹤等） |
| [mouth-ai-cmd.md](mouth-ai-cmd.md) | Mouth AI 指令系統 | medium | 整合架構師角色與執行者角色的完整指令系統 |
| [rule-compliance-evals.md](rule-compliance-evals.md) | 規則合規性測試集 | high | 15 個測試案例，用於驗證 AI agent 是否正確遵守 don-ai 規則（場景描述 → 預期行為 → 違規範例） |
| [skill-index.md](skill-index.md) | gws CLI 最佳實踐 | medium | Google Workspace CLI 使用規則 |
| [cross-project-rule-submission-spec.md](cross-project-rule-submission-spec.md) | 跨專案 AI 規則提交機制指南 | high | 定義外部專案 AI 發現新規則時，如何透過標準化 JSON 格式與 Webhook 自動提交至 don-ai 知識庫的完整流程 |

---

## 變更記錄

### 2026-03-29 規則體系重構與合併
- 新增 `industry-best-practices-rules.md` 引入業界最佳實踐。
- 將原有的 24 個文件依主題合併為 13 個文件，大幅降低文件數量與閱讀負擔。
- 合併後的文件保留了所有原始規則內容，並去除了重複與冗餘的描述。

### 2026-03-28 結構整理
- 所有文件補充 TL;DR 區塊、重組段落結構、補充交叉引用
- 索引表新增「優先級」欄位，按 critical → high → medium 排序

---

## 統計

- 文件數量：14（不含 _index.md）
- 最後更新：2026-03-31
