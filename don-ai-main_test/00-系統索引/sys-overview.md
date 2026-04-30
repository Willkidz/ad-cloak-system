---
title: "系統全貌與快速上手 (System Overview & Quick Start)"
category: "principle"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "為新 Agent 準備的系統全貌指南，包含斗篷系統、上帝視角、整體架構、Worker 清單與域名清單。"
id: "20260327-SYS-001"
type: "guide"
tags: [architecture, index]
status: "active"
created: "2026-03-27"
updated: "2026-03-30"
---

> **TL;DR**: don-ai 是基於 Cloudflare 生態系（Workers, Pages, D1, KV）與 N8N 的自動化廣告追蹤與斗篷管理系統。系統包含 7 個 Workers、9 個域名，分為斗篷系統（cloak-admin，流量過濾與分流）和上帝視角（GodView，FB 廣告歸因追蹤）兩大核心。環境嚴格隔離為 Staging/Production，所有部署透過 GitHub Actions 自動化。

# 系統全貌與快速上手 (System Overview & Quick Start)

本文件專為新加入的 AI Agent 準備，旨在提供 don-ai 專案的全局視角。讀完本文件後，你將能立即了解系統的核心架構並開始工作。

---

## 1. 整體系統架構

don-ai 是一個基於 Cloudflare 生態系（Workers, Pages, D1, KV）與 N8N 的自動化廣告追蹤與斗篷管理系統。

### 1.1 所有 Cloudflare Workers 清單

系統目前包含 7 個 Workers（另有 1 個已廢棄），源碼統一管理於 `05-原始碼/` 目錄下（詳見 `05-原始碼/worker-mapping.md`）：

| Worker 名稱 | 類別 | 對應域名 | 說明 |
| :--- | :--- | :--- | :--- |
| `cloak-admin-api` | 斗篷管理後台 | `admin-api.bexnua.store` | 斗篷管理後台的後端 API (Hono 框架) |
| `shadow-cloak` | 斗篷管理後台 | 7 個推廣域名 (`fyntro.lol` 等) | 斗篷核心引擎，負責流量過濾與分流 |
| `safe-page` | 斗篷管理後台 | (內部調用) | 安全頁服務（一般訪客看到的頁面） |
| `line-redirect` | 上帝視角 | `*.freshpathlab.com` | LINE 跳轉、歸因追蹤、D1 直寫與 CAPI 發送 |
| `line-redirect-staging` | 上帝視角 | (測試域名) | LINE 跳轉的測試版 Worker |
| `money-page` | 上帝視角 | (內部調用) | 推廣頁 Worker（落地頁） |
| `preview-page` | 上帝視角 | (內部調用) | 預覽頁 Worker |
| ~~`manus-memory-api`~~ | 其他 | (內部調用) | **已廢棄**（ADR-003, 2026-03-30）— 記憶系統已遷移至 don-ai `.ai/` 目錄 |

### 1.2 所有域名清單（共 9 個）

系統目前使用以下 9 個域名：

**後台與歸因域名（2 個）：**

1. `bexnua.store`：斗篷管理後台 (`admin.bexnua.store`) 與 API (`admin-api.bexnua.store`)，以及 N8N 伺服器 (`n8n.bexnua.store`)。
2. `freshpathlab.com`：上帝視角歸因域名，包含 23 個子域名（如 `bf.freshpathlab.com`），流量指向 `line-redirect` Worker。

**斗篷推廣域名（7 個）：**

流量全部指向 `shadow-cloak` Worker 進行過濾。

3. `fyntro.lol`
4. `kravdo.lol`
5. `mopliv.site`
6. `raxnto.shop`
7. `tuvral.store`
8. `velphi.shop`
9. `zuntek.site`

### 1.3 GitHub Repo 結構

```text
.ai/           → AI 核心記憶 (`memory.md`)、決策日誌與 Debug 模板
.github/       → GitHub Actions 工作流程（自動部署 `deploy-workers.yml`、同步檢查 `sync-check.yml`）
00-系統索引/   → AI 入口地圖與通用指令
01-核心原則/   → 工作規範、部署流程、版本更新記錄規範
02-動態記憶/   → 對話精華、想法與規劃
03-專案/       → 斗篷管理後台、上帝視角等專案的詳細文件
04-資源與參考/ → ad_code 格式規範等參考資料
05-原始碼/     → Cloudflare Worker 源碼（與線上版本同步）
06-SOP流程/    → 部署流程 SOP、新增域名操作手冊等
07-配置與環境/ → 服務清單、認證資訊彙整
08-任務追蹤/   → TODO 待辦事項
09-歸檔/       → 已完成的舊資料
skills/        → 按需掛載的專業技能模組
```

---

## 2. 斗篷系統 (cloak-admin)

斗篷系統用於過濾廣告流量，將審查員導向安全頁，將真實用戶導向推廣頁。

### 2.1 部署方式與 CI/CD 流程

- **環境隔離**：Staging（測試版）與 Production（正式版）完全隔離，使用獨立的 D1 資料庫與 KV。
- **CI/CD 流程**：透過 GitHub Actions (`deploy-workers.yml`) 自動部署。
  - Push 到 `staging` 分支 → 自動部署到 Staging 環境。
  - Push 到 `main` 分支 → 自動部署到 Production 環境。
- **開發規範**：所有修改必須先在 `staging` 分支開發並驗證，確認無誤後才能 merge 到 `main`。嚴禁直接修改正式環境。詳見 `06-SOP流程/deploy-sop.md`。

### 2.2 網址與環境對照

| 項目 | Staging (測試版) | Production (正式版) |
| :--- | :--- | :--- |
| **前端網址** | `https://staging.admin.bexnua.store` | `https://admin.bexnua.store` |
| **後端 API** | `https://cloak-admin-api-staging.laoqin1689.workers.dev` | `https://cloak-admin-api.laoqin1689.workers.dev` |
| **D1 資料庫** | `godview-clicks-staging` | `godview-clicks` |
| **KV 命名空間** | `CLOAKER_CONFIG-staging` | `CLOAKER_CONFIG` |

### 2.3 後端 API 端點清單

API Base URL: `https://cloak-admin-api.laoqin1689.workers.dev/api/v1` (Production)

| 端點 | 方法 | 說明 |
| :--- | :--- | :--- |
| `/campaigns` | GET, POST | 取得/新增廣告活動 |
| `/campaigns/:id` | GET, PUT, DELETE | 取得/更新/刪除單一廣告活動 |
| `/templates` | GET, POST | 取得/新增素材模板（支援 `?type=` 過濾） |
| `/templates/:id` | GET, PUT, DELETE | 取得/更新/刪除單一素材模板 |
| `/templates/:id/preview` | GET | 預覽採集的 HTML 內容 |
| `/templates/crawl` | POST | 採集目標網址內容 |
| `/templates/upload` | POST | 上傳 ZIP 格式素材 |
| `/templates/system` | GET | 取得系統預設主題列表 |
| `/templates/system/:id` | GET | 取得單一系統主題內容 |
| `/domains/check-dns` | POST | 檢查域名的 DNS A 記錄狀態 |
| `/pixels` | GET, POST | 取得/新增像素（支援 `?type=` 過濾） |
| `/pixels/:id` | GET, PUT, DELETE | 取得/更新/刪除單一像素 |
| `/logs` | GET | 取得訪問日誌 |
| `/health` | GET | 系統健康檢查 |

### 2.4 資料庫 Schema (D1 表結構)

完整 SQL 定義見 `05-原始碼/斗篷管理後台/migrations/001_init_schema.sql`。核心表包含：

- `campaigns`：廣告活動配置（包含路由策略、安全頁/推廣頁 ID、過濾規則等）。
- `templates`：素材模板（包含 HTML 內容、類型 `safe_page`/`money_page`、縮圖等）。
- `cloak_logs`：斗篷訪問日誌（記錄 IP、判斷結果 `verdict`、原因 `reason` 等）。
- `clicks`：點擊與歸因記錄（上帝視角核心表）。
- `line_config`：LINE 分流與 ad_code 配置。
- `domains`：域名管理狀態。

---

## 3. 上帝視角 (GodView)

上帝視角是廣告成效追蹤與歸因系統，負責將 FB 廣告點擊與 LINE 加好友事件進行匹配。

### 3.1 系統架構與歸因邏輯

<step id="godview-flow-1">

1. **流量入口**：用戶點擊 FB 廣告，進入火鳥落地頁或斗篷推廣頁。

</step>

<step id="godview-flow-2">

2. **生成 Token**：點擊按鈕後，跳轉至 `freshpathlab.com` 子域名（由 `line-redirect` Worker 處理）。Worker 會解析 URL 中的 `ad_code`（如 `/CX06` 或 `?a=CX06`），並將點擊資訊（IP、User-Agent、fbclid 等）寫入 D1 的 `clicks` 表。

</step>

<step id="godview-flow-3">

3. **導向 LINE**：Worker 透過 302 重定向將用戶導向對應的 LINE 官方帳號加好友連結。

</step>

<step id="godview-flow-4">

4. **Webhook 觸發**：用戶在 LINE 加好友後，LINE 平台發送 Webhook 給 N8N (`/webhook/line-follow`)。

</step>

<step id="godview-flow-5">

5. **歸因匹配**：N8N 執行「上帝視角_Time Attribution」工作流，使用 `destination` (LINE OA ID) + 45 秒時間窗口，在 `clicks` 表中尋找最匹配的點擊記錄。

</step>

<step id="godview-flow-6">

6. **CAPI 回傳**：匹配成功後，N8N 將 `CompleteRegistration` 轉換事件透過 Facebook Conversions API (CAPI) 回傳給 Meta。

</step>

### 3.2 ad_code 規範

- **來源**：廣告投放時附加在網址上的參數。
- **格式**：1-6 個大寫字母 + 1-4 個數字（如 `CX06`, `AS01`）。
- **讀取優先級**：優先從 URL 路徑讀取（`https://bf.freshpathlab.com/CX06`），其次從查詢參數讀取（`?a=CX06`）。
- **記錄**：統一轉為大寫，並記錄在 D1 `clicks` 表的 `ad_code` 欄位，以及 `line_config` 表中。
- 詳見 `04-資源與參考/ad_code-格式規範.md`。

### 3.3 報告格式 (每小時/每日)

報告由 N8N 工作流自動生成並推送到 Telegram：

- **每小時歸因報告**：由「上帝視角_CAPI Health Check」工作流（ID: `ZVKJokmqh3GUbZio`）每小時觸發。
  - **內容**：查詢 D1 `clicks` 表，統計台灣時間今日各 tag 的 `click` 和 `matched` (加好友) 數量。
  - **格式**：按產品線分組（爆分王、莊家剋星、獨角仙、博富、N系列），輸出「📊 每小時歸因報告」至 Telegram。
- **每日報告**：目前每日報告（Shadow Cloak G6 - Daily Report）處於 **Inactive (未啟用)** 狀態。每日的廣告成效主要透過 Google Sheets 儀表板（ID: `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I`）進行查看與管理。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`README.md`](../README.md) | 專案說明 |
| [`01-核心原則/_index.md`](../01-核心原則/_index.md) | 核心原則索引 |
| [`00-系統索引/common-cmd.md`](./common-cmd.md) | 通用指令（含四大 SOP 與三層邊界） |
| [`.ai/system-patterns.md`](../.ai/system-patterns.md) | 系統架構模式（更偏向設計模式與技術決策） |
| [`05-原始碼/worker-mapping.md`](../05-原始碼/worker-mapping.md) | Worker 名稱與 Git 源碼路徑的對應關係 |
