---
title: "專案核心記憶 (AI Memory)"
category: "config"
priority: "critical"
last_updated: "2026-05-01"
summary: "專案核心架構、編碼規範、架構決策摘要、系統狀態快照、部署流程與版本管理。2026-05-01 更新：文件/CI 的 GitHub 倉庫引用統一為 Willkidz/ad-cloak-system（取代舊 laoqin1689/don-ai 與 laoqin1689/cloak-admin 字串）。"
id: "20260327-MEM-001"
type: "memory"
tags: [architecture, guidelines, memory]
status: "active"
created: "2026-03-25"
updated: "2026-05-01"
version: "v2.7"
---

# 專案核心記憶 (AI Memory)

本文件記錄了本專案的核心架構、編碼規範與全局決策。

---

## 3. 架構決策摘要

| 日期 | 決策摘要 |
| :--- | :--- |
| 2026-05-01 | **GitHub 倉庫正名**：知識庫/文件/CI 內所有舊引用 `laoqin1689/don-ai`、`laoqin1689/cloak-admin` 統一改為 `Willkidz/ad-cloak-system`（避免 onboarding 與 CI 目標倉庫漂移）。 |
| 2026-04-10 | **ADR-014 採納**：`cloak-admin-api` 加入全域 `X-API-Key` 認證中間件，保護所有 `/api/*` 端點。 |
| 2026-04-10 | **日誌系統強化**：實作 `content_api_logs` 自動化寫入（覆蓋 20 個端點），並在前端新增 `Decisions.tsx` 提供日誌可視化介面。 |
| 2026-04-10 | **Shadow Cloak 優化**：調整 Verified Bot 判定順序先於國家過濾，並實作 `capi_logs` 實體寫入。 |

---

## 4. 系統狀態快照 (2026-04-10)

| 組件 | 最新版本 | 狀態 | 關鍵特性 |
| :--- | :--- | :--- | :--- |
| Cloak Admin Frontend | v1.12.0 | ✅ 已部署 | 新增日誌管理頁面、API 認證 header |
| Cloak Admin API | v1.12.0 | ✅ 已部署 | 全域認證中間件、操作日誌自動寫入 |
| Shadow Cloak Worker | v1.9.0 | ✅ 已部署 | Verified Bot 順序優化、CAPI 日誌寫入 |
| GodView (System) | v1.1.0 | ✅ 運行中 | 整合日誌系統與 CAPI 監控 |
| N8N Workflows | v1.1.0 | ✅ 運行中 | 清理冗餘工作流，保留穩定版 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`CHANGELOG.md`](../CHANGELOG.md) | 全局變更日誌 |
| [`08-任務追蹤/project-changelog.md`](../08-任務追蹤/project-changelog.md) | Cloak Admin 版本紀錄 |
| [`08-任務追蹤/shadow-cloak-changelog.md`](../08-任務追蹤/shadow-cloak-changelog.md) | Shadow Cloak 版本紀錄 |
