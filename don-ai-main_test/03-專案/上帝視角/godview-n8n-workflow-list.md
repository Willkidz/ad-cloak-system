---
title: "N8N Workflow 清單"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "N8N 平台（n8n.bexnua.store）上 11 個 workflow 的完整清單：6 個 Active（CAPI Health Check、Time Attribution、系統監控、Config API、DNS Auto-Sync、Admin API）、5 個 Inactive（含 Shadow Cloak 系列），以及 1 個已刪除（Sheets Report）。"
id: "20260325-workflow-list"
type: "list"
tags: [attribution, capi, godview, n8n, shadow-cloak, telegram]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: N8N 平台（`n8n.bexnua.store`）上共有 11 個 workflow（6 Active + 5 Inactive）及 1 個已刪除。核心 Active workflow：(1) `CAPI Health Check`（`uQFTrGvbMHY1TYUX`）每小時檢查所有 Pixel 的 CAPI 狀態並推送 Telegram 歸因報告；(2) `Time Attribution`（`dqbdnCN3xdJAahYQ`）接收 LINE follow 事件，45 秒窗口匹配 D1 點擊後發送 CAPI；(3) `系統監控`（`ecnSO9T2NLWZKApl`）每 15 分鐘監控 D1 與 N8N 錯誤；(4) `Config API`（`iNV4mSJjUTrUOGkw`）提供 tag 配置查詢；(5) `DNS Auto-Sync`（`ciiNthLHHTeyG7p7`）自動為新 tag 建立 `tag.freshpathlab.com` DNS 記錄；(6) `Admin API`（`TBJgFC9TmFnK8eyG`）提供 CRUD 管理。Inactive 包含 3 個 Shadow Cloak 告警 workflow 和 2 個一次性腳本。

# N8N Workflow 清單

本文件旨在記錄與管理在 [N8N 平台](https://n8n.bexnua.store) 上運行的所有自動化工作流程（Workflow），以便於追蹤、維護和快速查找。

---

## 運行中 (Active)

以下為目前正在線上環境中積極運行的 Workflow。

### 1. 上帝視角_CAPI Health Check

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `uQFTrGvbMHY1TYUX` |
| **狀態** | Active |
| **觸發方式** | 每小時自動 + Webhook 手動 (`/webhook/telegram-health-check`) |
| **功能** | 執行 CAPI 健康檢查與每小時歸因報告 |

#### 功能 A：CAPI 健康檢查

<step id="a1">查詢 D1 的 `ad_config` 表，取出所有像素 ID 和 CAPI Token。</step>
<step id="a2">對每個像素發送測試事件到 Facebook Graph API。</step>
<step id="a3">檢查回傳是否正常。</step>
<step id="a4">推送結果到 Telegram（全部正常或哪個像素異常）。</step>

#### 功能 B：每小時歸因報告

<step id="b1">查詢 D1 的 `clicks` 表，統計台灣時間今日各 tag 的 click 和 matched (add) 數量。</step>
<step id="b2">按產品線分組（爆分王、莊家剋星、獨角仙、博富、N系列）。</step>
<step id="b3">推送到 Telegram：「每小時歸因報告」。</step>

### 2. 上帝視角_Time Attribution

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `dqbdnCN3xdJAahYQ` |
| **狀態** | Active |
| **觸發方式** | Webhook (`/webhook/line-follow`)，由 LINE 平台呼叫 |
| **功能** | LINE follow 歸因匹配 + CAPI 事件發送 |

**說明：** 這是整個歸因系統的核心 Workflow。

#### 流程

<step id="ta1">收到 LINE follow 事件（用戶加好友）。</step>
<step id="ta2">查詢 D1 的 `clicks` 表，用 `destination` + 45 秒時間窗口匹配最近的點擊。</step>
<step id="ta3">匹配成功後，標記 click 為 `matched`。</step>
<step id="ta4">準備 CAPI 事件（CompleteRegistration）。</step>
<step id="ta5">發送到 Facebook CAPI（各 tag 的 ADS 像素 + BC 像素）。</step>

### 3. 系統監控

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `ecnSO9T2NLWZKApl` |
| **狀態** | Active |
| **觸發方式** | 每 15 分鐘自動（台灣時區） |
| **功能** | 監控 D1 資料庫與 N8N 執行錯誤 |

#### 流程

<step id="sm1">查詢 D1 資料庫狀態（例如：最近記錄數量）。</step>
<step id="sm2">若發現異常，則推送 Telegram 告警。</step>
<step id="sm3">查詢 N8N 最近的執行紀錄，過濾出錯誤的項目。</step>
<step id="sm4">若有錯誤，則推送 Telegram 錯誤告警。</step>

### 4. Config API

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `iNV4mSJjUTrUOGkw` |
| **狀態** | Active |
| **觸發方式** | Webhook (`/webhook/get-config`) |
| **功能** | 提供廣告配置 API，供其他服務呼叫 |

#### 流程

<step id="ca1">收到帶有 `tag` 參數的請求。</step>
<step id="ca2">從 D1 的 `ad_config`、`line_config` 等表查詢該 tag 的配置。</step>
<step id="ca3">回傳像素 ID、CAPI Token、LINE 帳號資訊等。</step>
<step id="ca4">此 API 主要由 `shadow-cloak`、`line-redirect` 等 Worker 呼叫。</step>

### 5. DNS Auto-Sync

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `ciiNthLHHTeyG7p7` |
| **狀態** | Active |
| **觸發方式** | Webhook (`/webhook/dns-sync`)，手動觸發 |
| **功能** | 自動同步 DNS 記錄 |

#### 流程

<step id="dns1">讀取 `line_config` 中所有 tag。</step>
<step id="dns2">讀取 Cloudflare DNS 現有記錄。</step>
<step id="dns3">找出缺少的子域名 (`tag.freshpathlab.com`)。</step>
<step id="dns4">自動在 Cloudflare 建立 AAAA 記錄（proxied）。</step>

### 6. 上帝視角_Admin API

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `TBJgFC9TmFnK8eyG` |
| **狀態** | Active |
| **觸發方式** | Webhook (`/webhook/admin-api`) |
| **功能** | 提供後台管理 API (CRUD) |

#### 流程

<step id="aa1">收到帶有 `resource`（如 `ad_config`）和 `action`（如 `list`）的請求。</step>
<step id="aa2">對 D1 資料庫執行對應操作。</step>
<step id="aa3">回傳操作結果。</step>

---

## 未啟用 (Inactive)

以下為已建立但目前未啟用的 Workflow。

### 7. Shadow Cloak G4 - Bot Ratio Alert

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `5AnQOHX5nP6Kcu1z` |
| **狀態** | Inactive |
| **功能** | 監控 Bot 比例，超過閾值時推送 Telegram 告警。 |

### 8. Shadow Cloak G5 - Crawler Detection

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `wKUIIpU3eM43fmah` |
| **狀態** | Inactive |
| **功能** | 偵測爬蟲流量，並推送 Telegram 告警。 |

### 9. Shadow Cloak G6 - Daily Report

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `pldVCzWVKKEsc478` |
| **狀態** | Inactive |
| **功能** | 產生每日斗篷報告，統計並推送至 Telegram。 |

### 10. [已過期：重複] Shadow Cloak G6 - Daily Report

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `eNvk0yxwT6H1wSEe` |
| **狀態** | Inactive |
| **功能** | 功能與前一項重複。 |

### 11. Update ad_config DataTable

| 項目 | 內容 |
| :--- | :--- |
| **ID** | `oBpzQacg6KiPK5Yn` |
| **狀態** | Inactive |
| **功能** | 用於批量更新 `ad_config` 資料的一次性腳本。 |

---

## 已刪除 (Deleted)

| Workflow | 原因 |
| :--- | :--- |
| 上帝視角_Sheets Report | 依賴的 Google Sheets OAuth2 憑證已遺失，且功能已被「CAPI Health Check」中的報告取代。 |

---

## 結論

此文件提供了 N8N 工作流程的全面概覽，有助於團隊成員快速理解各個自動化任務的狀態與功能。定時維護此文件的準確性對於確保系統穩定運行至關重要。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置、Webhook 端點總覽與 Credentials |
| [Time Attribution Workflow 分析](godview-n8n-time-attr-workflow-analysis.md) | Time Attribution 的 10 節點流程深度分析 |
| [CAPI Health Check 檢查報告](godview-n8n-capi-workflow-verify.md) | CAPI Health Check 的執行統計與錯誤分析 |
| [N8N Cloudflare 設定分析](godview-n8n-cf-config-analysis.md) | Cloudflare 憑證與 D1 整合的深度分析 |
