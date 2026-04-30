---
title: "原始碼存放說明"
category: "config"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "05-原始碼資料夾的用途說明，所有 Worker 源碼已同步至本資料夾，透過 worker-mapping.md 維護映射關係，sync-check.yml 每日自動檢查源碼一致性。"
id: "20260325-102000"
type: "project-doc"
tags: [advertising, reference]
status: "active"
created: "2026-03-25"
updated: "2026-03-30"
version: "v1.1"
---

# 05-原始碼 — 存放說明

本資料夾用於存放所有 Cloudflare Worker 的實際源碼檔案，是 GitOps 自動部署流程的核心。

## 當前狀態

所有 7 個現役 Worker 的線上源碼已於 2026-03-27 完成同步（另有 1 個已廢棄的 manus-memory-api），目前透過以下機制維護源碼一致性：

- **映射關係**：`worker-mapping.md` 記錄每個 Worker 名稱與 Git 源碼路徑的對應關係
- **自動部署**：`deploy-workers.yml` 在 push 到 main/staging 分支時自動部署有變更的 Worker
- **每日同步檢查**：`sync-check.yml` 每日 UTC 00:00 從 Cloudflare API 下載源碼，與 Git repo 進行 diff 比對，偵測到差異時自動開 PR 並通知
- **部署記錄**：`deploy-record.json` 記錄每個 Worker 的部署時間戳與元數據

## 資料夾結構

| 子資料夾 / 檔案 | 說明 |
| :--- | :--- |
| `斗篷管理後台/` | cloak-admin-api、safe-page、shadow-cloak 等斗篷相關 Worker 源碼 |
| `上帝視角/` | line-redirect、money-page、preview-page 等上帝視角相關 Worker 源碼 |
| `其他/` | manus-memory-api（已廢棄） 等其他 Worker 源碼 |
| `worker-mapping.md` | Worker 名稱與 Git 源碼路徑的映射表 |
| `deploy-record.json` | 部署時間戳記錄（由 GitHub Actions 自動維護） |

## 存放規則

1. 每個 Worker 的源碼放在對應類別的子資料夾中
2. 檔案命名與 Cloudflare Worker 名稱一致（如 `shadow-cloak.js`）
3. 不存放 `node_modules/`、`dist/`、`.wrangler/` 等建置產物
4. 以線上版本為準：如果 Git 和線上有差異，以線上版本為準更新 Git

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `worker-mapping.md` | Worker 名稱與源碼路徑的完整映射表 |
| `deploy-record.json` | 部署時間戳記錄 |
| `.github/workflows/deploy-workers.yml` | 自動部署 workflow |
| `.github/workflows/sync-check.yml` | 每日同步檢查 workflow |
