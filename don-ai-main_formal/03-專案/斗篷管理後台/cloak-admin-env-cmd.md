---
title: "通用環境指令 - 斗篷管理後台"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "斗篷管理後台的環境資訊速查：前端 admin.bexnua.store（React/Vite）、後端 admin-api.bexnua.store（Hono/Workers/D1）、n8n 自架服務及 Cloudflare 帳號。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloudflare, configuration, credentials, infrastructure, n8n]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 斗篷管理後台環境速查。前端為 React + TypeScript + Vite + shadcn/ui，部署於 Cloudflare Pages（`admin.bexnua.store`）；後端為 Hono on Cloudflare Workers + D1（`admin-api.bexnua.store`，備用 `cloak-admin-api.laoqin1689.workers.dev`）。Cloudflare Account ID 為 `b2471e0c...`，D1 Database 為 `godview-clicks`（ID `3f7ed41d...`）。N8N 自架於 `n8n.bexnua.store`（IP `5.189.150.66:5678`），包含 Time Attribution（`dqbdnCN3xdJAahYQ`）與 Admin API（`TBJgFC9TmFnK8eyG`）兩個活躍工作流。

# 通用環境指令 - 斗篷管理後台

## 專案概覽

斗篷管理後台（Cloak Admin）是一個廣告投放管理系統，用於管理廣告活動、斗篷規則、素材模板和訪問日誌。

- **前端**：React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **後端**：Hono (Cloudflare Workers) + D1 (SQLite)
- **部署平台**：Cloudflare（Pages + Workers + D1）

---

## 線上網址

| 服務 | 網址 |
| :--- | :--- |
| 前端後台 | https://admin.bexnua.store |
| 後端 API | https://admin-api.bexnua.store |
| API 備用 | https://cloak-admin-api.laoqin1689.workers.dev |
| API Health | https://admin-api.bexnua.store/health |

---

## Cloudflare 帳號資訊

<example id="cloudflare-credentials">

```plaintext
Account ID: b2471e0c307123945bdf1ce1b025563f
D1 Database ID: 3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c
D1 Database Name: godview-clicks
API Token: cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920
```

</example>

---

## N8N 自架服務

<example id="n8n-credentials">

```plaintext
N8N 網址: https://n8n.bexnua.store
N8N IP: 5.189.150.66:5678
N8N API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g
```

</example>

| Workflow ID | 名稱 | 狀態 |
| :--- | :--- | :--- |
| dqbdnCN3xdJAahYQ | 上帝視角_Time Attribution | active |
| TBJgFC9TmFnK8eyG | 上帝視角_Admin API | active |

---

## 結論

本文件提供了斗篷管理後台所有必要的環境資訊與連結，是開發與維護此專案的基礎。所有相關人員都應熟悉本文件內容。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-api-keys-list.md](cloak-admin-api-keys-list.md) | 完整 API Keys 與憑證清單 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 部署配置詳情 |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | N8N 工作流配置 |
