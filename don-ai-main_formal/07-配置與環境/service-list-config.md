---
title: "服務清單"
category: "config"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "所有使用中的服務帳號設定清單（不含密碼/Token），包含 Cloudflare（7 Workers + 2 D1 + DNS）、2 台 Contabo VPS、N8N、Facebook BM、LINE、GitHub、Telegram 與抖影知識正式站點 tuvral.store 的部署狀態。"
id: "20260325-102300"
type: "project-doc"
tags: [cloak-admin, cloudflare, deployment, facebook, line, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-31"
---

> **TL;DR**: 本文件列出目前使用中的核心服務與站點設定（不含密碼與 Token）。除了既有的 Cloudflare、N8N、Facebook、LINE、GitHub、Telegram 之外，2026-03-31 已新增 **抖影知識正式站 `tuvral.store`** 的服務狀態：Cloudflare 代理至 Contabo VPS `109.123.230.100`，前端由 Nginx 提供，API 採 FastAPI，資料層已由 D1 遷移為本地 SQLite，SSL 模式為 **Strict**。

# 服務清單

本文件列出所有使用中的服務及其基本設定資訊。**不包含任何密碼、API Key 或 Token**，完整認證資訊請參閱 [認證資訊彙整.md](auth-info-config.md)。

---

## 服務總覽

| 服務 | 用途 | 關鍵資訊 | 狀態 |
| :--- | :--- | :--- | :--- |
| Cloudflare | Workers + D1 + DNS + Pages + CDN | 7 個 Workers、2 個 D1 資料庫、多個域名、CDN 代理 | 正常 |
| Contabo VPS（N8N） | N8N 伺服器 | IP: 5.189.150.66 | 正常 |
| Contabo VPS（抖影知識） | 抖影知識正式站與 API | IP: 109.123.230.100，日本機房，4 vCPU / 8GB RAM | 正常 |
| N8N | 工作流自動化 | 域名: n8n.bexnua.store、版本 2.12.3 | 正常 |
| Facebook Business Manager | 像素管理、CAPI | 10 個 ADS 像素 + 1 個 BC 像素 | 正常 |
| LINE Developers Console | LINE OA 管理 | 24 個官方帳號 | 正常 |
| GitHub | 程式碼與知識庫 | 帳號: laoqin1689 | 正常 |
| Telegram | 系統監控告警 | Bot: godview_monitor_bot | 正常 |
| 抖影知識正式站 | 內容搜尋、知識瀏覽、摘要查詢 | 網址: `https://tuvral.store` | 正常 |

---

## Cloudflare

<rule id="cloudflare-service-config">

| 項目 | 值 |
| :--- | :--- |
| Account ID | `b2471e0c307123945bdf1ce1b025563f` |
| Workers | shadow-cloak, cloak-admin-api, safe-page, line-redirect, line-redirect-staging, money-page, preview-page |
| D1 Database（godview-clicks） | `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` |
| D1 Database（douyin-knowledge） | `26616dfa-cd47-421f-baee-7212625a1d25` — 抖影知識系統舊資料來源（2026-03-31 已匯出至 SQLite，現保留作歷史資料） |
| ~~D1 Database（manus-memory）~~ | ~~`915bd7ab-34a1-415b-b716-16995bccb978`~~ — 已廢棄（ADR-003, 2026-03-30） |
| 推廣域名 | velphi.shop, zuntek.site, mopliv.site, fyntro.lol, kravdo.lol, bexnua.store, tuvral.store, raxnto.shop |
| 歸因域名 | freshpathlab.com（23 個子域名） |
| 後台域名 | admin.bexnua.store（Cloudflare Pages） |
| API 域名 | admin-api.bexnua.store |
| `tuvral.store` 狀態 | Cloudflare Proxy 啟用，A 記錄指向 `109.123.230.100`，SSL 模式為 **Strict** |

</rule>

### Workers 功能說明

| Worker 名稱 | 用途 |
| :--- | :--- |
| shadow-cloak | 斗篷引擎，流量過濾與分流 |
| cloak-admin-api | 斗篷管理後台 API |
| safe-page | 安全頁服務 |
| line-redirect | LINE 跳轉 + 歸因追蹤 + D1 直寫 + CAPI 事件發送（上帝視角正式版） |
| line-redirect-staging | 上帝視角測試版 |
| money-page | 推廣頁（落地頁）服務 |
| preview-page | 預覽頁服務 |
| ~~manus-memory-api~~ | **已廢棄**（ADR-003, 2026-03-30）— 記憶系統已遷移至 don-ai `.ai/` 目錄 |

---

## Contabo VPS

<rule id="contabo-service-config">

| 項目 | 值 |
| :--- | :--- |
| N8N VPS IP | `5.189.150.66` |
| N8N VPS 用途 | N8N 伺服器 |
| 抖影知識 VPS IP | `109.123.230.100` |
| 抖影知識 VPS 用途 | `tuvral.store` 前端、FastAPI API、SQLite 資料庫、影片處理腳本 |
| 抖影知識 VPS 規格 | 4 vCPU / 8GB RAM / 日本機房 |
| 抖影知識 Python 目錄 | `/opt/douyin-knowledge/` |
| 抖影知識前端目錄 | `/var/www/douyin-knowledge/` |
| 抖影知識 API 服務 | `127.0.0.1:8000`（FastAPI） |
| 抖影知識 systemd | `douyin-api.service` |
| DNS | 8.8.8.8 / 1.1.1.1 / 8.8.4.4 |
| 存取方式 | SSH |

</rule>

---

## N8N

<rule id="n8n-service-config">

| 項目 | 值 |
| :--- | :--- |
| 域名 | n8n.bexnua.store |
| 直連 | 5.189.150.66:5678 |
| 帳號 | administrator |
| 版本 | 2.12.3 |
| 核心 Workflow | 上帝視角_Time Attribution（ID: dqbdnCN3xdJAahYQ） |
| Webhook 端點 | /webhook/line-follow, /webhook/get-config, /webhook/admin-api, /webhook/dns-sync, /webhook/douyin-knowledge（舊版抖影知識入口） |

</rule>

> **注意**：N8N 詳細工作流結構請參閱 [N8N工作流結構.md](n8n-workflow-arch.md)。抖影知識系統目前已以 `tuvral.store` 為主要正式入口，N8N Webhook 路徑保留作歷史兼容或內部轉接用途。

---

## Facebook Business Manager

<rule id="facebook-service-config">

| 項目 | 值 |
| :--- | :--- |
| ADS 像素數量 | 10 個（bf/jd/n14/n18/n20/n22/sz + AS/AB/AX 各 1 個共用） |
| BC 像素（全域共用） | 940592681819066 |
| CAPI Token 存放位置 | line-redirect Worker 環境變數 |
| Graph API 版本 | v25.0 |
| CAPI Endpoint | `POST https://graph.facebook.com/v25.0/{pixel_id}/events` |

</rule>

> [待確認] n20 Pixel ID (1339967038176681) 曾回傳 400 錯誤，需確認是否已修復。

---

## LINE Developers Console

<rule id="line-service-config">

| 項目 | 值 |
| :--- | :--- |
| 官方帳號數量 | 24 個（含 1 個舊 cb 帳號） |
| Webhook URL | `https://n8n.bexnua.store/webhook/line-follow` |
| 產品線分組 | AS（爆分王）4 個、AB（莊家剋星）4 個、AX（獨角仙）4 個、BF 1 個、JD 1 個、N 系列 9 個、SZ 1 個 |

</rule>

---

## GitHub

<rule id="github-service-config">

| 項目 | 值 |
| :--- | :--- |
| 帳號 | laoqin1689 |
| 知識庫 Repo | don-ai（private） |
| 專案 Repo | cloak-admin（private） |
| GitHub Actions | deploy-workers.yml（自動部署）、sync-check.yml（每日 UTC 00:00 同步檢查） |

</rule>

---

## Telegram

<rule id="telegram-service-config">

| 項目 | 值 |
| :--- | :--- |
| Bot 名稱 | godview_monitor_bot（上帝視角監控） |
| Chat 所有者 | 多恩 Don (@don5168) |
| 用途 | N8N 系統監控告警、CAPI Health Check 通知、GitHub Actions Worker 同步警告 |

</rule>

---

## 抖影知識正式站（tuvral.store）

<rule id="douyin-knowledge-service-config">

| 項目 | 值 |
| :--- | :--- |
| 正式網址 | `https://tuvral.store` |
| 代理路徑 | 用戶 → Cloudflare CDN → Nginx → FastAPI / 靜態前端 |
| 前端服務 | `/var/www/douyin-knowledge/` |
| API 代理 | `/api/*` → `127.0.0.1:8000` |
| 應用框架 | FastAPI |
| 資料庫 | SQLite（由 D1 匯出遷移） |
| SSL | VPS Let's Encrypt + Cloudflare Strict SSL |
| 目前資料量 | 107 支影片、107 份逐字稿、107 份摘要、7 個關鍵字 |
| 驗證狀態 | 端到端測試通過（即夢AI 關鍵字） |

</rule>

---

## Token 管理原則

<rule id="token-management">

1. **不在文件中記錄完整 Token**：Token 只存放在環境變數或安全儲存中。
2. **共用 Token**：目前所有像素共用同一個 CAPI Token。
3. **權限驗證**：新像素需要在 Facebook BM 中指派系統工作人員後 Token 才有效。
4. **原生 Binding 優先**：使用 Cloudflare D1 原生 Binding（`env.DB`）而非 REST API，更安全且不需要 API Token。
5. **VPS 應用分層**：若服務已遷移至 VPS 本地資料庫，正式環境優先使用本地服務內部連線，不再為新流程增加跨平台憑證依賴。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N工作流結構.md](n8n-workflow-arch.md) | N8N 工作流的詳細結構與 Webhook 路徑 |
| [認證資訊彙整.md](auth-info-config.md) | 所有服務的完整認證資訊（含 Token） |
| [`03-專案/斗影知識/douyin-knowledge-system.md`](../03-專案/斗影知識/douyin-knowledge-system.md) | 斗影知識系統完整架構與遷移後說明 |
| [`03-專案/上帝視角/godview-n8n-workflow-list.md`](../03-專案/上帝視角/godview-n8n-workflow-list.md) | 上帝視角專案的 N8N 工作流詳細說明 |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | 安全護欄規則，操作服務配置前應參考 |
