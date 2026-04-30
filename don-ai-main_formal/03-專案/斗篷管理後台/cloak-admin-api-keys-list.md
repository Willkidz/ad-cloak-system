---
title: "API Keys 清單"
category: project
priority: medium
applicable_tools: all
last_updated: "2026-03-29"
summary: "彙整「斗篷管理後台」專案所使用的 n8n、Cloudflare、Telegram 等各項服務的 API 金鑰、帳號密碼與相關設定資訊。"
version: "v1.0"
id: "20260329-cloak-admin-api-keys"
type: list
tags: [cloak-admin, cloudflare, credentials, n8n, telegram]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件集中管理「斗篷管理後台」專案所依賴的各項外部服務 API 金鑰、連線資訊及重要設定。核心包含：**自架 n8n**（IP: `5.189.150.66`）、**Cloudflare API Token**（已於 2026-03-25 驗證）、**D1 資料庫 ID**（`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`）以及 **Telegram 監控 Bot**。所有金鑰應定期更換，並嚴禁在公開代碼中硬編碼。

# API Keys 清單

本文件集中管理「斗篷管理後台」專案所依賴的各項外部服務 API 金鑰、連線資訊及重要設定，以便快速查閱與維護。

## n8n 連線資訊

<rule id="n8n-version-policy">
**版本政策**：官方雲端版本已過期並停用，所有生產環境工作流必須運行在自架主力版本上。
</rule>

### 自架主力版本
- **URL**: `http://5.189.150.66:5678`
- **管理員帳號**: `admin@bexnua.store`
- **管理員密碼**: `ShadowCloak2026!`
- **API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g`
- **VPS IP**: `5.189.150.66`
- **VPS Root 密碼**: `b7dXD2h1O1ZF4`

---

## Cloudflare 連線資訊

<rule id="cf-api-security">
**安全規範**：API Token 必須具備 `D1 Edit`、`Workers Edit` 與 `KV Edit` 權限。
</rule>

- **API Token**: `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` (✅ 2026-03-25 已驗證)
- **Account ID**: `b2471e0c307123945bdf1ce1b025563f`
- **主要 Zone**: `bexnua.store` (ID: `3d18bc84f1840bb4423a39030f5fc10b`)
- **D1 Database**: `godview-clicks` (ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`)

---

## Telegram Bot

- **Bot Name**: `godview_monitor_bot` (上帝視角監控)
- **Token**: `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc`
- **Chat ID**: `7495585445`

---

## n8n Workflow 清單

*最後更新：2026-03-23*

| ID | 名稱 | 狀態 | 說明 |
| :--- | :--- | :--- | :--- |
| `UCRZ0YDp4ZERmgqk` | Config API | ✅ 啟用 | `ad_config` 查詢 API |
| `VUMAiZXjG826mUDd` | 上帝視角_Admin API | ✅ 啟用 | 管理用 API |
| `biEtJWKGcnmqYjgW` | 上帝視角_Time Attribution | ✅ 啟用 | 核心歸因匹配 |
| `Mydz6vj7T7dw5Ugj` | DNS Auto-Sync | ✅ 啟用 | 處理域名解析自動化 |
| `ZVKJokmqh3GUbZio` | 上帝視角_CAPI Health Check | ✅ 啟用 | 每小時健康檢查與歸因報告 |
| `m5Pd6Sx29uE3W0ty` | 系統監控 | ✅ 啟用 | 每 15 分鐘監控 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | 工作流詳細邏輯 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 部署環境配置 |
