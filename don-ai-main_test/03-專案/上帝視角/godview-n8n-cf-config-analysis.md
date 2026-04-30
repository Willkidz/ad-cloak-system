---
title: "n8n 實例 Cloudflare 設定與紀錄分析報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 n8n 實例中 8 個 workflow 的 Cloudflare 整合：5 個含 CF API 呼叫，DNS Auto-Sync 的 API Token 已失效（403/401），4 個 workflow 共用同一 D1 Database ID。"
id: "20260325-cf-config-analysis"
type: "analysis"
tags: [cloudflare, cloudflare-d1, credentials, dns, godview, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 對 n8n 實例（`https://godview.app.n8n.cloud`）的 8 個 workflow 進行 Cloudflare 整合分析，發現 5 個含 CF API 呼叫。核心發現：(1) `DNS Auto-Sync`（ID: `Mydz6vj7T7dw5Ugj`）的 API Token `v5navxTZVeyz...` 已失效（403 Invalid access token / 401 Authentication error），該 workflow 無法執行 DNS 同步。(2) 4 個 workflow（Time Attribution、CAPI Health Check、系統監控、每日統計報告）共用同一 D1 Database ID `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`。(3) Config API workflow 不直接呼叫 CF API，僅與 n8n 內部 DataTable 互動。建議更換失效 Token 並將硬編碼憑證遷移至 n8n Credentials 系統。

# n8n 實例 Cloudflare 設定與紀錄分析報告

## 執行摘要

本報告針對指定的 n8n 實例（`https://godview.app.n8n.cloud`）中的 8 個 workflow 進行了全面分析，重點排查與 Cloudflare 相關的設定、API 呼叫、憑證及 DNS 紀錄。分析結果顯示，在 8 個 workflow 中，共有 5 個包含 Cloudflare 相關的整合或 API 呼叫。

我們成功提取了 Cloudflare API Token、Zone ID、Account ID 以及 D1 Database ID。然而，在嘗試使用提取的 API Token 查詢 DNS 紀錄時，Cloudflare API 回傳了 `403 Invalid access token` 和 `401 Authentication error` 錯誤，表明該 Token 可能已過期、被撤銷或權限不足。

---

## Cloudflare 憑證與核心設定

在分析過程中，我們從 workflow 的程式碼節點和 HTTP 請求中提取了以下核心 Cloudflare 設定資訊：

| 設定項目 | 提取值 | 來源 Workflow |
| :--- | :--- | :--- |
| **API Token** | `v5navxTZVeyzWQ0-q_jm-hp166prlsgTFzEMTFJA` [已過期：API 測試回傳 403/401 錯誤] | DNS Auto-Sync |
| **Zone ID** | `3558fb741de4523d04af78db910e7376` | DNS Auto-Sync |
| **Account ID** | `61f1eb800e48d2cf41ed9ddacf01581b` | 多個 Workflow (D1 查詢) |
| **D1 Database ID** | `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` | 多個 Workflow (D1 查詢) |
| **目標網域** | `freshpathlab.com` | DNS Auto-Sync |

---

## Workflow 詳細分析

### DNS Auto-Sync (ID: Mydz6vj7T7dw5Ugj)

此 workflow 是與 Cloudflare DNS 整合最深的核心組件。其主要功能是自動同步 n8n 數據表中的標籤（tags）到 Cloudflare，為缺少的標籤建立對應的子網域。

**運作邏輯**：
<step id="read-tags">透過 n8n API 讀取 `line_config` 數據表（ID: `1VvB8jijHE5GXbv6`）中的所有標籤。</step>
<step id="query-dns">使用 Cloudflare API 查詢 `freshpathlab.com` 網域現有的 DNS 紀錄。</step>
<step id="compare-records">比對兩者，找出在數據表中存在但尚未建立 DNS 紀錄的標籤。</step>
<step id="create-record">為缺少的標籤自動建立 AAAA 紀錄（指向 `100::` 並開啟 Proxy 模式）。</step>

**相關程式碼片段**：
<example>
```javascript
const CF_API_TOKEN = 'v5navxTZVeyzWQ0-q_jm-hp166prlsgTFzEMTFJA'; // [待確認] 此 Token 已驗證為無效
const CF_ZONE_ID = '3558fb741de4523d04af78db910e7376';
const DOMAIN = 'freshpathlab.com';
```
</example>

### Config API (ID: UCRZ0YDp4ZERmgqk)

此 workflow 主要負責處理配置請求，雖然在初步檢查中被列為重點，但深入分析其 `Build Config` 節點的程式碼後，並未發現直接呼叫 Cloudflare API 的邏輯。它主要與 n8n 內部的數據表（Data Tables）進行互動，處理 LINE 和廣告（AD）的配置映射。

### Cloudflare D1 資料庫整合

除了 DNS 管理外，實例中有多個 workflow 深度整合了 Cloudflare D1 資料庫（Serverless SQL 資料庫），用於儲存和查詢歸因數據。

以下 workflow 包含了對 D1 資料庫的直接 API 呼叫：

| Workflow 名稱 | 呼叫端點 | 請求方法 | 用途推測 |
| :--- | :--- | :--- | :--- |
| 上帝視角_Time Attribution | `/d1/database/.../raw` | POST | 查詢最近點擊紀錄與標記匹配狀態 |
| 上帝視角_CAPI Health Check | `/d1/database/.../query` | POST | 查詢 D1 歸因數據以生成每小時報告 |
| 系統監控 | `/d1/database/.../query` | POST | 系統狀態監控與數據讀取 |
| 每日統計報告 | `/d1/database/.../query` | POST | 讀取統計數據以生成日報 |

所有 D1 資料庫呼叫均指向同一個 Account ID (`61f1eb800e48d2cf41ed9ddacf01581b`) 和 Database ID (`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`)。

---

## DNS 紀錄查詢結果

我們嘗試使用從 `DNS Auto-Sync` workflow 中提取的 API Token 直接呼叫 Cloudflare API，以獲取 `freshpathlab.com` 的完整 DNS 紀錄。

**測試結果**：**失敗**

*   **Zone 資訊查詢**：回傳 `HTTP 403 Forbidden`
    *   錯誤訊息：`{"success":false,"errors":[{"code":9109,"message":"Invalid access token"}],"messages":[],"result":null}`
*   **DNS 紀錄查詢**：回傳 `HTTP 401 Unauthorized`
    *   錯誤訊息：`{"success":false,"errors":[{"code":10000,"message":"Authentication error"}]}`

**結論**：寫死在 `DNS Auto-Sync` 程式碼中的 Cloudflare API Token 目前是無效的。這可能意味著該 Token 已經過期、被管理員手動撤銷，或者該 workflow 目前實際上無法正常執行其預期的 DNS 同步功能。

---

## 總結與建議

<rule id="update-token">**憑證失效問題**：`DNS Auto-Sync` 中的 Cloudflare API Token 已失效。如果該自動同步功能仍是業務所需，建議立即在 Cloudflare 控制台中生成新的 API Token（需具備 Zone.DNS 編輯權限），並更新至該 workflow 的程式碼中。</rule>

<rule id="use-credentials">**安全實踐**：目前 API Token 和 Zone ID 等敏感資訊直接硬編碼（Hardcoded）在 JavaScript 節點中。建議改用 n8n 的 Credentials 系統來安全地管理 Cloudflare API Token，這不僅能提高安全性，也便於未來的憑證輪換。</rule>

<rule id="check-d1-auth">**D1 資料庫依賴**：系統高度依賴 Cloudflare D1 資料庫進行數據歸因和報告生成。建議確認這些 HTTP 請求節點中使用的認證方式（可能是透過 n8n credentials 或其他未在程式碼中明文顯示的方式）是否仍然有效。 [待確認]</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 維護任務報告](godview-n8n-cf-api-analysis.md) | n8n 系統維護任務的完整報告 |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 workflow 架構總覽 |
