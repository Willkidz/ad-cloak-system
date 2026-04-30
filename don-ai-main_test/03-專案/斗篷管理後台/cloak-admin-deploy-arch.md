---
title: "斗篷管理後台部署架構分析"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "分析斗篷管理後台的 Serverless 部署架構，涵蓋前端 Pages、後端 Workers 與 D1 資料庫的協作機制。"
version: "v1.0"
id: "20260328-cloak-admin-arch"
type: analysis
tags: [architecture, ci-cd, cloak-admin, cloudflare-d1, cloudflare-pages, cloudflare-workers]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告深入分析斗篷管理後台的 **全 Serverless 架構**。前端託管於 **Cloudflare Pages**，透過 **GitHub Actions** 實現 CI/CD 並自動移除 `manus-runtime` 腳本；後端 API 運行於 **Cloudflare Workers (Hono)**，直接綁定 **D1 資料庫** (`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`)。系統透過 `shadow-cloak` 進行邊緣判定，並與自架 **n8n** (Contabo VPS) 協作處理 CAPI 歸因。

# 斗篷管理後台部署架構分析

## 架構核心組件

系統採用模組化設計，各組件間透過環境變數與 Binding 進行通訊。

### 組件協作表 (Component Collaboration)

| 組件 | 技術棧 | 職責 | 部署目標 |
| :--- | :--- | :--- | :--- |
| **管理前端** | React + shadcn/ui | 提供可視化管理介面，執行廣告配置與日誌查看。 | Cloudflare Pages (`admin.bexnua.store`) |
| **管理 API** | Hono (Workers) | 處理業務邏輯，執行 D1 資料庫 CRUD 操作。 | Cloudflare Workers (`cloak-admin-api`) |
| **流量判定** | shadow-cloak | 邊緣節點訪客判定 (Money/Safe)，記錄日誌至 D1。 | Cloudflare Workers (多域名綁定) |
| **資料庫** | Cloudflare D1 | 存儲廣告配置 (`campaigns`)、模板 (`templates`) 與日誌 (`cloak_logs`)。 | D1 ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` |
| **自動化引擎** | n8n | 處理 Meta CAPI 歸因、DNS 自動同步與 TG 告警。 | Contabo VPS (`n8n.bexnua.store`) |

---

## 部署流程 (Deployment Flow)

為了確保生產環境安全，系統採用了基於 GitHub Actions 的自動化部署流程。

<step id="arch-1">
**代碼提交與同步**：開發者在 `webdev` 環境完成修改後，需手動同步至 GitHub 私有倉庫 `laoqin1689/cloak-admin`。
</step>

<step id="arch-2">
**CI/CD 觸發**：GitHub Actions 監聽到 `main` 分支的 push 事件，啟動構建任務。
</step>

<step id="arch-3">
**腳本清理 (Strip Scripts)**：在部署前，執行 Python 腳本自動移除 HTML 中的 `manus-runtime`、`debug-collector` 等開發用腳本，防止洩漏內部工具。
</step>

<step id="arch-4">
**自動部署**：使用 `cloudflare/wrangler-action` 將清理後的 `dist` 目錄部署至 Cloudflare Pages。
</step>

---

## 關鍵技術決策

<rule id="arch-decision-1">
**為何選擇 GitHub Actions 而非 Pages 直接連接？**
Pages 直接連接無法在構建後執行自定義清理腳本。透過 GitHub Actions，我們可以在 `npm run build` 後介入，確保生產環境的 HTML 是純淨且安全的。
</rule>

<rule id="arch-decision-2">
**D1 資料庫共享機制**：
Staging 環境 (`staging.admin.bexnua.store`) 與 Production 環境共享同一個 D1 資料庫。這確保了測試數據與生產數據的一致性，但也要求在執行 Schema 變更時必須極度謹慎。
</rule>

## 結論

全 Serverless 架構大幅降低了運維成本。建議在後續版本中引入 `Smart Placement`，讓 Workers 自動選擇最接近 D1 數據中心的節點運行，以進一步降低 API 響應時間。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-deploy.md](cloak-admin-deploy.md) | GitHub Actions 具體配置 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 詳細環境變數與 Binding 配置 |
| [cloak-admin-deploy-progress.md](../../09-歸檔/03-專案/斗篷管理後台/cloak-admin-deploy-progress.md) | 部署問題修復紀錄（已歸檔） |
