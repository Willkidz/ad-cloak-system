---
title: "Don AI - 多恩數據庫"
category: "core"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-04-10"
summary: "Don AI 知識庫的總索引與 AI 使用指南，所有 AI 的共用大腦。已更新至 v1.12.0。"
id: "20260325-100000"
type: "rule"
tags: [ai-agent, index]
status: "active"
created: "2026-03-25"
updated: "2026-04-10"
version: "v1.12.0"
activation_glob: null
---

# Don AI - 多恩數據庫 (v1.12.0)

**所有 AI 的共用大腦。** 本知識庫是所有 AI 代理協作時的統一知識來源，採用結構化的 Markdown 文件 + YAML frontmatter + 分層索引機制，實現高效的知識管理與 Token 優化。

## AI 使用指南

每個新 session 進來時，請依照以下標準流程操作：

### 第一步：Clone 知識庫

```bash
gh repo clone Willkidz/ad-cloak-system
cd ad-cloak-system
```

### 第二步：建立系統認知

讀取 `00-系統索引/llms.txt` 與 `00-系統索引/common-cmd.md`。這是 AI 的全局入口與行為準則，包含三層邊界與核心 SOP。

### 第三步：定位資料與任務

1. 讀取 `.ai/active-context.md` 了解當前進行中的任務。
2. 根據任務，找到對應資料夾的 `_index.md` 摘要索引，快速定位具體文件。

### 第四步：執行與驗證

1. 按照 `06-SOP流程/` 中的對應 SOP 執行任務。
2. 任務完成後，必須進行部署驗收，參考 `06-SOP流程/acceptance-checklist.md`。

### 第五步：更新並推送 (Offboarding)

任務完成後，必須執行以下步驟：
1. 更新 `CHANGELOG.md`（按語義化版本規範）。
2. 更新 `.ai/active-context.md`（任務標記為完成）。
3. 更新 `.ai/memory.md`（系統狀態快照）。
4. 執行 `git add -A && git commit -m "vX.Y.Z: 描述內容" && git push`。

## 自動歸檔規定

<rule id="archive-rules">

1. **狀態驅動歸檔**：當專案完成或 SOP 廢棄時，將 frontmatter 中的 `status` 改為 `archived`
2. **物理隔離**：所有 `status: archived` 的文件移動到 `09-歸檔/` 目錄
3. **搜索隔離**：AI 的默認搜索範圍排除 `09-歸檔/`，除非用戶明確要求查找歷史記錄
4. **動態記憶清理**：`02-動態記憶/` 中超過 30 天未修改的文件，進行記憶整合後歸檔
5. **專案歸檔**：專案完成或暫停超過 3 個月後，整個資料夾移至 `09-歸檔/`
6. **新文件強制規範**：所有新建 Markdown 文件必須包含完整的 YAML frontmatter，詳見 `01-核心原則/doc-standards-spec.md`
</rule>

## 資料夾目錄索引

| 資料夾 | 用途 | 關鍵文件 |
| :--- | :--- | :--- |
| `.ai/` | AI 核心記憶區（memory、error-log、decision-log） | memory.md, active-context.md |
| `00-系統索引/` | 知識庫的全局地圖，AI 的唯一入口點 | llms.txt, common-cmd.md |
| `01-核心原則/` | AI 行為準則、品質標準、命名規範 | ai-work-spec.md, doc-standards-spec.md |
| `02-動態記憶/` | 對話精華、想法與規劃 | chat-highlights-memory.md |
| `03-專案/` | 專案專屬知識與架構設計 | 斗篷管理後台/ |
| `04-資源與參考/` | 外部 API 文件、工具推薦 | resources-summary.md |
| `05-原始碼/` | 實際的程式碼存放區與部署記錄 | deploy-record.json |
| `06-SOP流程/` | 標準操作流程（部署、驗收、自檢） | deploy-sop.md, acceptance-checklist.md |
| `07-配置與環境/` | 服務帳號設定與認證資訊 | auth-info-config.md |
| `08-任務追蹤/` | 各組件變更日誌與交接文件 | project-changelog.md, HANDOFF.md |
| `09-歸檔/` | 已完成或過期的資源 | README.md |
| `skills/` | 模組化技能庫，AI 按需掛載 | systematic-debugging.md |

---

## 相關文件

- [系統總覽](00-系統索引/sys-overview.md)
- [常用命令與邊界 (AGENTS.md)](AGENTS.md)
- [變更日誌 (CHANGELOG.md)](CHANGELOG.md)
