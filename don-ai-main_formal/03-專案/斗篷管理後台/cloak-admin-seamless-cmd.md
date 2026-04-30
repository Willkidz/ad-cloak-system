---
title: "無縫接軌指令 — 斗篷管理後台"
category: project
priority: critical
applicable_tools: all
last_updated: "2026-03-29"
summary: "供新規劃組接手使用的完整專案交接文件，涵蓋線上服務網址、Cloudflare 帳號與 D1 認證、資料庫 8 張表結構、16 個 API 端點、8 個前端路由、v1.0–v1.6 版本紀錄、已知問題清單、部署指令及接手優先順序。"
version: "v1.0"
id: "20260325-cloak-admin-seamless"
type: cmd
tags: [api, cloak-admin, cloudflare-d1, cloudflare-workers, deployment, planning]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件是斗篷管理後台（Cloak Admin）的完整接手指令，供新規劃組閱讀後即可掌握專案全貌。系統採用 React + TypeScript + Vite 前端搭配 Hono on Cloudflare Workers 後端，資料庫為 D1（SQLite），完全 Serverless 部署於 Cloudflare。文件記錄了線上服務四個端點（`admin.bexnua.store` 等）、Cloudflare Account ID 與 D1 Database ID、8 張資料表結構（本專案 3 張：campaigns 28 欄位 / templates / cloak_logs 2300+ 筆；既有 5 張勿動）、16 個 REST API 端點、8 個前端路由、v1.0 至 v1.6 的完整版本紀錄、三個已知問題（預覽靜態資源 / 系統主題無內容 / 鏈接欄位）、以及接手後的八項工作優先順序。

# 無縫接軌指令 — 斗篷管理後台

本文件供新規劃組接手使用。閱讀後即可掌握專案全貌、當前進度、所有環境資訊，並能直接產出技術指令給技術組執行。

---

## 一、專案概覽

<boundaries id="project-scope">
斗篷管理後台（Cloak Admin）是一個廣告投放管理系統，功能包含廣告活動管理、斗篷規則配置、素材模板管理、訪問日誌查看。前端使用 React + TypeScript + Vite + Tailwind CSS + shadcn/ui，後端使用 Hono 框架部署在 Cloudflare Workers，資料庫為 Cloudflare D1（SQLite）。整個系統完全 Serverless，部署在 Cloudflare 平台上。
</boundaries>

---

## 二、線上服務

| 服務 | 網址 | 狀態 |
| :--- | :--- | :--- |
| 前端後台 | https://admin.bexnua.store | 運行中 |
| 後端 API | https://admin-api.bexnua.store | 運行中 |
| API 備用 | https://cloak-admin-api.laoqin1689.workers.dev | 運行中 |
| 健康檢查 | https://admin-api.bexnua.store/health | 回傳 status: ok |

---

## 三、Cloudflare 帳號與認證

<example id="cf-credentials">

```
Account ID:    b2471e0c307123945bdf1ce1b025563f
D1 Database ID: 3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c
D1 Database Name: godview-clicks
API Token:     cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f
```

D1 可透過 REST API 直接執行 SQL：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/d1/database/3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c/query" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/json" \
  -d '{"sql": "你的SQL"}'
```

</example>

---

## 四、D1 資料庫現況

共 8 張表，其中 3 張是本專案新建的，5 張是既有的（勿修改）。

### 本專案的表

**campaigns**（廣告活動，28 欄位，目前 0 筆）
主要欄位：id, name, theme, status, safe_page_id, money_page_id, customer_links, short_codes, routing_strategy, allowed_devices, require_residential, pixel_tk, pixel_fb, pixel_ga, pixel_google_ad, pixel_google_conv, cloak_lang, cloak_os, cloak_os_version, cloak_country, cloak_region, cloak_traffic_source, safe_page_type, safe_page_action, safe_page_content, blacklist_rules, created_at, updated_at

**templates**（素材模板，目前有數筆測試數據）
欄位：id, type(safe_page/money_page), country, name, identifier, status, content(HTML源碼), created_at, updated_at

**cloak_logs**（訪問日誌，目前 2300+ 筆真實數據）
欄位：id, timestamp, ip, asn, country, ua, verdict(blocked/allowed), reason, path, referer, visitor_id, language, domain

### 既有的表（勿動）

<rule id="existing-tables">

- ad_config — 舊版廣告配置（線上運行中）
- clicks — 點擊記錄
- line_config — Line 分流配置
- _cf_KV — Cloudflare 內部
- sqlite_sequence — 自增序列

</rule>

---

## 五、API 端點一覽

Base URL: `https://admin-api.bexnua.store/api/v1`

| 方法 | 端點 | 說明 | 狀態 |
| :--- | :--- | :--- | :--- |
| GET | /campaigns | 廣告列表 | 可用 |
| GET | /campaigns/:id | 單一廣告 | 可用 |
| POST | /campaigns | 新增廣告 | 可用 |
| PUT | /campaigns/:id | 更新廣告 | 可用 |
| DELETE | /campaigns/:id | 刪除廣告 | 可用 |
| GET | /templates | 素材列表 | 可用 |
| GET | /templates/:id | 單一素材 | 可用 |
| POST | /templates | 新增素材 | 可用 |
| PUT | /templates/:id | 更新素材 | 可用 |
| DELETE | /templates/:id | 刪除素材 | 可用 |
| POST | /templates/crawl | 採集網址 | 可用 |
| POST | /templates/upload | ZIP 上傳 | 可用 |
| GET | /templates/system | 系統主題列表 | 可用 |
| GET | /templates/system/:id | 系統主題內容 | 可用 |
| GET | /logs | 訪問日誌 | 可用 |
| GET | /health | 健康檢查 | 可用 |

---

## 六、前端頁面與路由

| 路由 | 頁面 | 狀態 |
| :--- | :--- | :--- |
| / | 首頁儀表板 | 已完成（基本統計卡片） |
| /campaigns | 廣告製作列表 | 已完成（表格+搜索） |
| /campaigns/new | 添加廣告 | v1.5 重構中（對齊火鳥版面） |
| /campaigns/:id/edit | 編輯廣告 | 同上 |
| /templates | 素材中心 | 已完成（雙Tab+四Tab新增彈窗+操作按鈕） |
| /logs | 廣告日誌 | v1.3 待執行 |
| /domains | 域名/短鏈 | 佔位頁（顯示「開發中」） |
| /settings | 系統設定 | 佔位頁（顯示「開發中」） |

側邊欄 6 個選單：首頁/儀表板、廣告製作、素材中心、域名/短鏈、廣告日誌、系統設定

---

## 七、版本紀錄（按時間順序）

| 版本 | 內容 | 狀態 | 日期 |
| :--- | :--- | :--- | :--- |
| v1.0 指令一~八 | 專案初始化、
D1建表(campaigns/templates/cloak_logs擴充)、全局佈局路由、素材中心頁面、廣告製作列表、添加廣告頁面、廣告日誌頁面、後端API(6端點)、前後端串接部署 | 已完成 | 2026-03-24 |
| v1.1 | 修復六個問題：首頁儀表板、廣告編輯/複製/刪除/鏈結按鈕、新增安全頁彈窗 | 已完成 | 2026-03-24 |
| v1.2 | 素材中心擴充四個Tab：採集新增、ZIP上傳、自定義新增(React Quill)、系統主題(3個預設模板) | 已完成 | 2026-03-24 |
| react-quill 修復 | react-quill 換成 react-quill-new（解決 React 18 findDOMNode 白屏） | 已完成 | 2026-03-24 |
| Monaco→textarea | 源碼編輯器從 Monaco 改為 textarea（避免外部 CDN 依賴） | 已完成（後被 v1.4 取代） | 2026-03-24 |
| v1.4 | textarea 升級為 CodeMirror（行號+HTML語法高亮+One Dark深色主題，純npm不依賴CDN） | 已完成 | 2026-03-24 |
| v1.6 | 素材操作欄改為文字按鈕（編輯源碼/複製/預覽/編輯/刪除）+ 域名短鏈和系統設定佔位路由 | 已完成 | 2026-03-24 |
| v1.3 | 訪問日誌頁面（5個Tab、分頁、攔截原因中文轉換） | 指令已產出，待技術組執行 | — |
| v1.5 | 添加廣告頁面重構（一頁式左右分欄對齊火鳥、像素設置、落地頁下拉選擇） | 技術組執行中 | — |

---

## 八、已知問題（待修復）

<rule id="known-issues">

**預覽靜態資源問題**：採集功能只抓 HTML，沒有下載 CSS/JS/圖片。預覽時這些資源的相對路徑指向 admin.bexnua.store，被 SPA fallback 返回 index.html，導致 MIME type 錯誤。解法：採集時改為抓取完整資源並存儲，或將相對路徑轉為絕對路徑指向原站。

**系統主題無內容**：系統主題的三個預設模板（RPG手遊攻略安全頁、新聞資訊安全頁、電商促銷推廣頁）只有名稱和描述，沒有實際的 HTML 內容。需要把真正做好的安全頁 HTML 放進去。

**鏈接欄位**：添加廣告頁的「鏈接」欄位目前是純輸入框，應改為下拉選擇已建立的域名/短鏈。v1.5 正在修復此問題。

</rule>

---

## 九、已產出的指令文件清單

| 文件名 | 用途 | 狀態 |
| :--- | :--- | :--- |
| 通用環境指令-斗篷後台.md | 所有技術必讀的基礎環境資訊 | 最新 |
| 開發指令-斗篷後台v1.md | 八個指令的初始開發 | 已全部執行完成 |
| 修復指令-斗篷後台v1.1.md | 六個修復 | 已執行完成 |
| 素材中心擴充指令-v1.2.md | 四個Tab擴充 | 已執行完成 |
| 修改指令-v1.3-訪問日誌頁面.md | 訪問日誌完整實作 | 待執行 |
| 修改指令-v1.4-編輯源碼樣式.md | CodeMirror升級 | 已執行完成 |
| 修改指令-v1.5-添加廣告頁面重構.md | 對齊火鳥版面 | 執行中 |
| 修改指令-v1.6-素材操作按鈕修復.md | 五個文字按鈕 | 已執行完成 |

---

## 十、UI 風格規範

<rule id="ui-style-guide">
主色紫色 `#7c3aed`，hover `#6d28d9`。側邊欄深色背景 `#1e1b4b` 白色文字，選中項紫色背景。表格白色背景灰色邊框。標籤分色：安全頁綠色、推廣頁紫色、主題黃色、斗篷攔截紅色、已放行綠色。按鈕圓角 `rounded-md`。整體風格對齊火鳥廣告系統。
</rule>

---

## 十一、部署方式

<step id="deploy-frontend">
**前端部署到 Cloudflare Pages**：

```bash
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```
</step>

<step id="deploy-backend">
**後端部署到 Cloudflare Workers**：

```bash
cd cloak-admin-api
npx wrangler deploy
```
</step>

---

## 十二、接手後的工作優先順序建議

<step id="handover-priority">

1. **確認 v1.5 完成**：添加廣告頁面重構是目前最大的改動，需要驗收
2. **執行 v1.3**：訪問日誌頁面，指令已寫好，直接給技術組
3. **修復預覽問題**：採集頁面的靜態資源載入
4. **填充系統主題**：把真實的安全頁 HTML 放入系統主題
5. **開發域名/短鏈頁面**：目前是佔位頁
6. **開發系統設定頁面**：目前是佔位頁
7. **登入驗證**：目前後台無登入機制，任何人可訪問
8. **shadow-cloak Worker 整合**：讓斗篷 Worker 從 D1 campaigns 表讀取動態配置，取代硬編碼

</step>

---

## 十三、歸因系統端對端測試 SOP

為確保系統各個環節的數據流動和處理邏輯正確無誤，請定期執行以下七步驟端對端測試：

1. **驗證 Config API**：確認 n8n 工作流能成功讀取並返回最新的系統配置（`LINE_MAP` 23 筆，`MASTER_PIXEL_MAP` 19 筆）。
2. **模擬廣告點擊（寫入 D1）**：透過 Cloudflare D1 REST API 寫入模擬點擊記錄（含 token `test_e2e_001` 等完整欄位）。
3. **確認 D1 寫入成功**：驗證點擊數據已成功寫入 D1 數據庫，且 `matched` 狀態為 0。
4. **模擬 LINE Follow 事件**：向 `n8n.bexnua.store/webhook/line-follow` 發送模擬 LINE Follow 事件。
5. **驗證歸因匹配**：等待 5 秒後，檢查 D1 數據庫中的對應記錄，確認 `matched` 狀態已更新為 1。
6. **檢查 n8n 執行紀錄**：通過 n8n API 檢查 Time Attribution 工作流的執行狀態為 `success`。
7. **清理測試數據**：完成所有驗證後，從 D1 刪除 `test_e2e_001` 測試數據。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽（版本紀錄、問題排查、N8N 配置） |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 部署配置規範 |
| [cloak-admin-quick-reference.md](cloak-admin-quick-reference.md) | 快速參考（URL、ID、Token 速查） |
| [cloak-admin-e2e-cmd.md](../../09-歸檔/03-專案/斗篷管理後台/cloak-admin-e2e-cmd.md) | 歸因系統端對端測試 SOP（已歸檔） |
