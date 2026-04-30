---
title: "斗篷管理後台速查表 (Quick Reference)"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "彙整斗篷管理後台的關鍵網址、Cloudflare 憑證、D1 資料庫 ID、n8n 工作流 ID 及常用 API 端點，供開發與維運快速參考。"
version: "v1.0"
id: "20260325-quick-ref"
type: reference
tags: [api, cloak-admin, credentials, infrastructure]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件為斗篷管理後台的技術速查表。**核心網址**：前端 `admin.bexnua.store`、API `admin-api.bexnua.store`、n8n `n8n.bexnua.store`。**Cloudflare**：Account ID `b2471e0c...`、D1 DB `godview-clicks` (ID `3f7ed41d...`)、API Token `cfut_2tx...`。**n8n 工作流**：Time Attribution (`dqbdnCN3xdJAahYQ`)、Admin API (`TBJgFC9TmFnK8eyG`)。**常用 API**：`GET /api/v1/logs` (日誌)、`GET /webhook/get-config` (配置)。

# 斗篷管理後台速查表 (Quick Reference)

## 核心服務網址

| 服務 | 網址 | 備註 |
| :--- | :--- | :--- |
| **前端後台** | [admin.bexnua.store](https://admin.bexnua.store) | React + Vite |
| **後端 API** | [admin-api.bexnua.store](https://admin-api.bexnua.store) | Hono + Workers |
| **n8n 服務** | [n8n.bexnua.store](https://n8n.bexnua.store) | 自架自動化平台 |
| **API Health** | [admin-api.bexnua.store/health](https://admin-api.bexnua.store/health) | 健康檢查 |

---

## Cloudflare 基礎設施

<example id="cf-infrastructure">

- **Account ID**: `61f1eb800e48d2cf41ed9ddacf01581b`
- **D1 Database Name**: `godview-clicks`
- **D1 Database ID**: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`
- **API Token**: `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920`

</example>

---

## n8n 工作流與 Webhook

| 工作流名稱 | ID | Webhook 路徑 |
| :--- | :--- | :--- |
| **上帝視角_Time Attribution** | `dqbdnCN3xdJAahYQ` | `/webhook/line-follow` |
| **上帝視角_Admin API** | `TBJgFC9TmFnK8eyG` | `/webhook/admin-api` |
| **上帝視角_CAPI Health Check** | `uQFTrGvbMHY1TYUX` | — |
| **系統配置獲取** | — | `/webhook/get-config` |

---

## 常用 API 端點 (admin-api)

| 功能 | 方法 | 路徑 | 參數 |
| :--- | :--- | :--- | :--- |
| **獲取日誌** | `GET` | `/api/v1/logs` | `page`, `limit`, `verdict`, `search` |
| **獲取廣告列表** | `GET` | `/api/v1/campaigns` | — |
| **獲取素材列表** | `GET` | `/api/v1/materials` | `type` (theme/page) |
| **解析域名** | `POST` | `/api/v1/domains/resolve` | `domain` |

---

## 像素與 CAPI 資訊

- **BC 像素 ID**: `940592681819066`
- **ADS 像素 (AS)**: `1296143099239936`
- **ADS 像素 (BF)**: `2153779865162231`

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 詳細環境指令 |
| [cloak-admin-api-keys-list.md](cloak-admin-api-keys-list.md) | 完整金鑰清單 |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | n8n 工作流詳情 |
