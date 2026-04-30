---
title: "斗篷系統 v1.10 數據流分析與驗證方案"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件深入分析了斗篷系統從廣告點擊到 LINE 好友加入的完整數據流，詳細拆解了各個 Cloudflare Worker 的處理邏輯、數據寫入和驗證方法。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloudflare-d1, data-collection, line-redirect, shadow-cloak, testing]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告為「v1.10 Worker visitor_id 串接分析報告」的補充文件。核心分析 `shadow-cloak` (v5.1) 的三層判定邏輯：**ASN 黑名單** (32934, 15169, 13335, 8075)、**UA 黑名單** (13 種爬蟲特徵) 與 **國家白名單** (TW, HK, MO)。判定為 `money` 的流量會被代理至 `money-page` 並附帶 `visitor_id`。本文件詳列了 D1 `cloak_logs` 表的寫入欄位與 `ip` 欄位可能為 `unknown` 的 Bug 診斷。

# 斗篷系統 v1.10 數據流分析與驗證方案

> **文件版本**：v1.10-supplement-r1  
> **分析範圍**：`shadow-cloak-src.js` (v5.1)、`line-redirect-clean.js`、`money-page-src.js` (v1.0)、`cloak-admin-api-src.js`

本報告為「v1.10 Worker visitor_id 串接分析報告」的補充文件。為遵循「每一步回傳的資料都要列出來」的要求，本報告將以原始碼為依據，逐行拆解每一個 Worker 在各個步驟中的行為，包含處理邏輯、資料寫入與傳遞，並提供具體可執行的驗證方案。

---

## 第一部分：完整數據流逐步分析

訪客從點擊 Facebook 廣告到最終加入 LINE 好友的完整流程，共涉及三個前台 Worker 與一個後台 API Worker。以下按照請求的時間順序，逐步拆解每一個環節。

<step id="1">

### 步驟一：廣告點擊 → shadow-cloak Worker（身份判定與日誌記錄）

訪客在 Facebook 上點擊廣告後，瀏覽器會被導向推廣域名（例如 `velphi.shop`）。由於該域名的 Cloudflare Worker Route 已被設定為 `${domain}/*` → `shadow-cloak`（此設定由 `cloak-admin-api` 的 `POST /api/v1/domains/zones` 端點自動完成），因此所有請求都會先經過 `shadow-cloak` Worker。

**涉及 Worker**：`shadow-cloak-src.js`（v5.1）

#### 輸入（Request）

| 項目 | 說明 |
| :--- | :--- |
| Request URL | `https://velphi.shop/{path}?{query}` — 推廣域名加上 Facebook 附加的參數（如 `fbclid`） |
| `User-Agent` Header | 訪客的瀏覽器 UA 字串 |
| `Referer` Header | 通常為 Facebook 的 referrer（如 `https://l.facebook.com/`） |
| `request.cf` 物件 | Cloudflare 自動注入的地理與網路資訊，包含 `cf.asn`（ASN 編號）與 `cf.country`（國家代碼） |

#### 判定邏輯（`determineVerdict` 函數）

<rule id="shadow-cloak-verdict">
Worker 會依序執行三層判定：
1.  **ASN 黑名單**：若訪客的 ASN 為 32934 (Meta)、15169 (Google)、13335 (Cloudflare) 或 8075 (Microsoft)，則判定為 `blocked`。
2.  **User-Agent 黑名單**：若 UA 匹配 `facebookexternalhit`、`googlebot`、`bingbot`、`bytespider`、`yandexbot`、`baiduspider`、`slurp`、`duckduckbot`、`twitterbot`、`linkedinbot`、`whatsapp`、`adsbot`、`msnbot` 等 13 種爬蟲特徵（不分大小寫），則判定為 `blocked`。
3.  **國家白名單**：僅允許 `TW` (台灣)、`HK` (香港)、`MO` (澳門)。不在白名單內的國家皆判定為 `blocked`。

通過所有檢查的訪客最終判定為 `allowed`。
</rule>

#### 判定原因（`getVerdictReason` 函數）

若判定為 `allowed`，原因為 `valid_traffic`。若判定為 `blocked`，原因會精確標示觸發的規則，例如 `blocked_asn_32934`、`facebook_bot`、`geo_filter_US` 等。

#### 輸出（Response）

| 項目 | 值 |
| :--- | :--- |
| HTTP Status | 與目標 Worker 回傳的 Status 一致（通常為 200） |
| `X-Shadow-Cloak` Header | `v5.1` |
| `X-Verdict` Header | `allowed` 或 `blocked` |
| Response Body | 目標 Worker 回傳的完整 HTML 內容（串流透傳） |

若判定為 `allowed`，Worker 會將請求代理至 `https://money-page.laoqin1689.workers.dev` 並附帶原始路徑與查詢參數。若判定為 `blocked`，則代理至 `https://safe-page.laoqin1689.workers.dev`。代理過程中會保留原始請求的所有 Headers 與 Body。

#### 寫入資料庫：`cloak_logs` 表

寫入方式為透過 Cloudflare D1 REST API（而非原生 Binding），使用 `event.waitUntil()` 進行非同步處理，不阻塞回應。

| 欄位 | 值來源 | 原始碼位置 | 備註 |
| :--- | :--- | :--- | :--- |
| `timestamp` | `new Date().toISOString()` | 第 28 行 | ISO 8601 格式 |
| `ip` | `cf.clientIp || 'unknown'` | 第 29 行 | **[待確認]** `cf.clientIp` 非標準屬性，實際值可能永遠為 `unknown` |
| `asn` | `cf.asn || 0` | 第 30 行 | 整數型別 |
| `country` | `cf.country || 'unknown'` | 第 31 行 | 兩碼國家代碼 |
| `ua` | `request.headers.get('user-agent') || 'unknown'` | 第 32 行 | 完整 UA 字串 |

</step>

## 第二部分：結論與建議

本文件詳細拆解了 `shadow-cloak` Worker 的數據處理流程，從請求輸入、判定邏輯到最終的數據庫寫入，提供了完整的分析。為確保系統穩定性，建議針對 `ip` 欄位的 bug 進行確認與修復。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-b-team-v1-10-1-d1-fix-cmd.md](cloak-admin-b-team-v1-10-1-d1-fix-cmd.md) | D1 修復指令 |
| [cloak-admin-attr-analysis.md](cloak-admin-attr-analysis.md) | 歸因邏輯分析 |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
