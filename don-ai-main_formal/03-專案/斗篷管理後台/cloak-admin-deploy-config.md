---
title: "斗篷管理後台部署設定"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件詳細記錄「斗篷管理後台」專案在 Cloudflare 上的各項部署設定，包含 D1 資料庫、Worker 綁定與路由、N8N 伺服器資訊及重要的部署維運守則。"
version: "v1.0"
id: "20260325-101300"
type: project-doc
tags: [cloak-admin, cloudflare, cloudflare-d1, cloudflare-workers, configuration, deployment]
status: verified
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件彙整斗篷管理後台的 Cloudflare 部署參數。核心資料庫 D1 ID 為 `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`。`shadow-cloak` (v5.2) 已轉換為 **ES Module** 格式並綁定 `DB` 與 `SHADOW_CLOAK_KV`。`line-redirect` 負責 23 個子域名流量。**n8n** 部署於 `5.189.150.66`。所有部署必須遵循**零停機**與**驗證優先**守則。

# 斗篷管理後台部署設定

## Cloudflare D1 資料庫

專案核心數據儲存於 Cloudflare D1 資料庫，具體設定如下：

| 項目 | 值 |
| :--- | :--- |
| **Database ID** | `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` |
| **名稱** | 斗篷管理資料庫 |
| **綁定 Worker** | `shadow-cloak` (DB), `line-redirect` (DB), `cloak-admin-api` (DB) |

## Cloudflare Worker 綁定 (Bindings)

各 Worker 的資源綁定情況，包含 KV 儲存和 D1 資料庫：

| Worker | KV 命名空間 | D1 資料庫 | 備註 |
| :--- | :--- | :--- | :--- |
| `shadow-cloak` | `SHADOW_CLOAK_KV` | `DB` | v1.10.1 升級 ES Module 並新增 D1 綁定 |
| `line-redirect` | — | `DB` | 使用原生 `env.DB` |
| `money-page` | — | — | 純靜態頁面 |
| `safe-page` | — | — | 純靜態頁面 |
| `cloak-admin-api` | — | `DB` | 使用 Hono 框架 |

## Cloudflare Worker 路由 (Routes)

透過路由規則將特定 URL 路徑指向對應的 Worker 服務。

### `shadow-cloak` 服務
所有用於廣告推廣的域名，其全部流量 (`/*`) 均指向 `shadow-cloak` Worker。
- `velphi.shop/*`, `zuntek.site/*`, `mopliv.site/*`, `fyntro.lol/*`, `kravdo.lol/*`, `bexnua.store/*`, `tuvral.store/*`

### `line-redirect` 服務
`freshpathlab.com` 網域下的 23 個子域名，其全部流量 (`/*`) 均指向 `line-redirect` Worker。

## N8N 伺服器設定

用於自動化工作流程的 N8N 服務部署在一台獨立伺服器上。

| 項目 | 值 |
| :--- | :--- |
| **IP 位址** | `5.189.150.66` |
| **域名** | `n8n.bexnua.store` |
| **DNS** | `8.8.8.8`, `1.1.1.1`, `8.8.4.4` (v1.10.2 修改) |

## 部署維運守則

<rule id="zero-downtime">**零停機要求**：由於線上廣告持續投放，任何部署操作都不能造成服務中斷。</rule>
<rule id="verification-first">**驗證優先**：每次部署完成後，必須立即驗證核心功能（如 D1 寫入、歸因匹配）是否正常運作。</rule>
<rule id="worker-format-consistency">**Worker 格式**：`shadow-cloak` 已轉換為 ES Module 格式 (`export default`)，需注意其他 Worker 可能仍為舊格式，避免格式不相容。</rule>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [cloak-admin-b-team-v1-10-1-d1-fix-cmd.md](cloak-admin-b-team-v1-10-1-d1-fix-cmd.md) | D1 修復指令 |
| [deploy-sop.md](../../06-SOP流程/deploy-sop.md) | 標準部署流程 |
