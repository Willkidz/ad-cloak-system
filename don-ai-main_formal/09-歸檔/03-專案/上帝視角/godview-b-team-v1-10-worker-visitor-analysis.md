---
title: "B 規劃組 / v1.10 — Worker visitor_id 串接分析報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "這份報告針對現有 6 個 Worker 與 2 張資料庫表的架構進行了深度原始碼分析，並針對「選擇 A：改 Worker 加 visitor_id 串接」方案，提供完整的技術分析與執行計畫。本報告旨在確保廣告投放期間的系統穩定性，每一個改動..."
status: "archived"
archived_reason: "歸檔：已完成的分析報告，相關結論已納入後續版本"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

# B 規劃組 / v1.10 — Worker visitor_id 串接分析報告

這份報告針對現有 6 個 Worker 與 2 張資料庫表的架構進行了深度原始碼分析，並針對「選擇 A：改 Worker 加 visitor_id 串接」方案，提供完整的技術分析與執行計畫。本報告旨在確保廣告投放期間的系統穩定性，每一個改動細節皆經過嚴格評估。

## 1. 完整流程圖（文字描述）

在目前的架構下，訪客從點擊廣告到最終加入 LINE 好友的完整流程，涉及多個 Worker 與資料表的互動。首先，訪客點擊廣告後會進入推廣域名（例如 `velphi.shop`），此時請求會由 **shadow-cloak** Worker 攔截。該 Worker 會根據訪客的 ASN、User-Agent 以及國家（僅限 TW/HK/MO）來判定訪客身份，若判定為 `money` 則放行，若為 `safe` 則攔截。同時，它會透過 Cloudflare D1 REST API 非同步將請求資訊寫入 `cloak_logs` 表。然而，目前寫入的欄位缺少 `visitor_id`、`domain` 和 `language`，且 IP 欄位全部記錄為 "unknown"。

當判定為放行時，`shadow-cloak` 會將請求 Proxy 到 **money-page** Worker，該 Worker 會回傳純靜態的 HTML 推廣頁面。目前頁面上的 CTA 按鈕（如「立即開版」）的 `href` 屬性皆為 `#`，並未包含跳轉邏輯或參數傳遞。當訪客點擊推廣頁上的按鈕並跳轉到 `freshpathlab.com` 的子域名時，由於 `shadow-cloak` 和 `money-page` 之間沒有傳遞唯一識別碼，此跳轉無法攜帶 `visitor_id`。

請求到達 **line-redirect** Worker 後，系統會生成一個 UUID 作為 `click_id`，並透過 `env.DB` binding 將 39 個欄位的數據寫入 `clicks` 表。同時，系統會將 `token_mapping` 數據發送到 n8n webhook。最後，`line-redirect` Worker 會透過 302 Redirect 將訪客導向 LINE 官方帳號加入頁面。由於 `clicks` 表目前沒有 `visitor_id` 欄位，導致這兩張表無法有效關聯。

## 2. 選擇 A 方案的完整改動清單

為了將 `shadow-cloak` 和 `line-redirect` 兩張表透過 `visitor_id` 串接起來，我們需要對資料庫 Schema 以及三個核心 Worker 進行精準的改動。

### 2.1. 資料庫 Schema 改動

首先，必須在 `clicks` 表中新增 `visitor_id` 欄位（建議型別為 VARCHAR 或 TEXT）。這個改動的目的是為了儲存從前端傳遞過來的 `visitor_id`，以便後續能與 `cloak_logs` 表進行關聯。這是一個非破壞性的改動，舊數據的 `visitor_id` 將預設為 NULL，不會影響現有系統的運作。

### 2.2. shadow-cloak Worker 改動

在 `shadow-cloak-src.js` 中，我們需要進行四項關鍵改動。第一，在 `handleFetch` 函數（約第 17 行後）中，使用 `crypto.randomUUID()` 為每個請求生成一個唯一的 `visitor_id`。第二，在同一個函數（約第 46 行）中，將生成的 `visitor_id` 作為 Query Parameter 附加到 `proxyUrl`（例如 `?vid=${visitor_id}`），以便將其傳遞給 `money-page`。

第三，在準備日誌數據的 `logData` 物件（約第 27 行）和寫入資料庫的 `logToDB` 函數（約第 177 行）中，加入 `visitor_id` 欄位及對應的參數，確保該識別碼被記錄到 `cloak_logs` 表中。最後，修復 IP 取得方式，將 `logData` 物件（約第 29 行）中的 `cf.clientIp` 改為 `request.headers.get('CF-Connecting-IP')`，以解決 IP 全部記錄為 "unknown" 的問題。

### 2.3. money-page Worker 改動

在 `money-page-src.js` 中，我們需要動態注入 `visitor_id` 到 HTML 中。在 `handleRequest` 函數（約第 10 行）中，從 `request.url` 解析出 `vid` 參數，並將其傳遞給 `getHTML` 函數。在 HTML 的 JavaScript 區塊中，讀取 URL 參數，並動態修改所有 CTA 按鈕的 `href` 屬性，將 `visitor_id` 附加到跳轉連結上。這樣可以確保訪客點擊按鈕時，能將 `visitor_id` 成功帶到下游的 `line-redirect`。

### 2.4. line-redirect Worker 改動

在 `line-redirect-clean.js` 中，我們需要進行三項改動。第一，在 `index_default.fetch` 函數（約第 415 行後）中，從 `url.searchParams` 讀取 `vid`（或 `visitor_id`）參數，以獲取上游傳遞過來的唯一識別碼。第二，在執行資料庫寫入的 `env.DB.prepare` 語句（約第 453 行）中，增加 `visitor_id` 欄位，並綁定讀取到的值，完成資料庫層面的串接。第三，在準備 webhook 數據的 `tokenMappingData` 物件（約第 497 行）中，新增 `visitor_id` 屬性，確保下游系統（如 n8n）也能獲取該識別碼。

## 3. 風險評估矩陣

為了確保廣告投放不受影響，我們對每一個改動點進行了詳細的風險評估，並制定了相應的回滾方案。

| 改動點 | 風險等級 | 可能的故障場景 | 影響範圍 | 回滾方案 |
| :--- | :---: | :--- | :--- | :--- |
| **DB Schema 改動** | 低 | SQL 語法錯誤導致執行失敗。 | 無影響（舊程式不依賴新欄位）。 | 執行 `ALTER TABLE DROP COLUMN` 移除新增的欄位。 |
| **line-redirect 改動** | 中 | SQL 語法錯誤導致寫入 `clicks` 表失敗；Webhook 格式錯誤導致 n8n 處理失敗。 | 歸因數據遺失，無法追蹤廣告成效。 | 重新部署改動前的 `line-redirect` 版本。 |
| **money-page 改動** | 中 | JavaScript 錯誤導致 CTA 按鈕無法點擊或跳轉失敗。 | 訪客無法進入 LINE，直接影響轉換率。 | 重新部署改動前的 `money-page` 版本。 |
| **shadow-cloak 改動** | 高 | Proxy 邏輯錯誤導致頁面無法載入；D1 API 請求格式錯誤導致日誌寫入失敗。 | 所有推廣流量中斷，廣告預算浪費。 | 重新部署改動前的 `shadow-cloak` 版本。 |

## 4. 部署順序

為了確保系統在部署過程中保持穩定，且不影響現有廣告流量，必須嚴格按照以下順序進行部署：

首先，**修改 DB Schema**。在 `clicks` 表中加入 `visitor_id` 欄位是一個非破壞性改動，現有的 `line-redirect` Worker 即使不寫入該欄位也不會報錯。

接著，**部署 line-redirect Worker**。這可以讓系統準備好接收並記錄 `visitor_id`。此時上游尚未傳遞 `visitor_id`，因此寫入的值為 NULL 或空字串，完全不會影響現有邏輯。

然後，**部署 money-page Worker**。更新前端頁面，使其具備讀取並傳遞 `visitor_id` 的能力。此時 `shadow-cloak` 尚未傳遞參數，頁面行為保持不變。

最後，**部署 shadow-cloak Worker**。這是開啟源頭 `visitor_id` 生成與傳遞的關鍵步驟。一旦部署，整個數據流即刻貫通。若此步出現問題，只需回滾此 Worker 即可，不影響下游運作。

## 5. 部署後完整檢查清單

部署完成後，請依照以下清單逐一檢查，確保系統運作正常。

| 步驟 | 檢查項目 | 檢查方式 | 預期結果 | 異常處理 |
| :---: | :--- | :--- | :--- | :--- |
| 0 | **DB Schema** | 執行 `PRAGMA table_info(clicks);` | 應包含 `visitor_id` 欄位。 | 重新執行 `ALTER TABLE` 語句。 |
| 1 | **line-redirect** | 模擬請求：`curl -I "https://js.freshpathlab.com/?vid=test-123"` | 回傳 302 Redirect，且 `clicks` 表中出現 `visitor_id='test-123'` 的記錄。 | 檢查 Worker 錯誤日誌，回滾程式碼。 |
| 2 | **money-page** | 瀏覽器訪問：`https://money-page.laoqin1689.workers.dev/?vid=test-456` | 頁面正常顯示，檢查 CTA 按鈕的 `href` 是否包含 `vid=test-456`。 | 檢查瀏覽器 Console 錯誤，回滾程式碼。 |
| 3 | **shadow-cloak** | 瀏覽器訪問推廣域名（如 `velphi.shop`） | 頁面正常顯示，Network 面板顯示請求 `money-page` 時帶有 `vid` 參數。 | 檢查 Worker 錯誤日誌，回滾程式碼。 |
| 4 | **端到端測試** | 完整走一次流程：點擊推廣域名 -> 點擊按鈕 -> 跳轉 LINE | `cloak_logs` 和 `clicks` 表中出現相同 `visitor_id` 的記錄。 | 依序檢查各節點的參數傳遞情況。 |

## 6. 回滾方案

若在部署後發現任何異常（如頁面白畫面、跳轉失敗、數據未寫入等），請立即執行以下回滾步驟以快速止血。

首先，立即將 `shadow-cloak` Worker 回滾至改動前的版本（v5.1）。這將切斷 `visitor_id` 的生成與傳遞，系統會迅速恢復至原有的無關聯狀態。若問題出在下游，請依序將 `money-page` 和 `line-redirect` 回滾至舊版本。至於 `clicks` 表新增的 `visitor_id` 欄位，無需移除，保留為 NULL 即可，完全不影響舊程式運行。

## 7. 額外發現的問題與建議

在深度分析原始碼的過程中，我們發現了幾個關鍵問題，建議在後續維護中一併處理。

**IP 記錄為 "unknown" 的根本原因**：`shadow-cloak` 目前使用 `cf.clientIp` 來獲取訪客 IP，但這並非 Cloudflare Worker 的標準屬性。正確的獲取方式應為 `request.headers.get('CF-Connecting-IP')`。這也是導致目前 `cloak_logs` 表中 IP 全部為 "unknown" 的原因。

**money-page 的 CTA 按鈕未配置跳轉**：目前 `money-page` 原始碼中，所有 CTA 按鈕的 `href` 皆為 `#`。這意味著在沒有外部 JavaScript 注入的情況下，訪客點擊按鈕不會發生任何跳轉。建議確認實際生產環境中，跳轉連結是如何配置的（是否透過 GTM 或其他腳本動態替換），以確保 `visitor_id` 能正確附加到最終的跳轉 URL 上。

**D1 寫入效能與穩定性**：`shadow-cloak` 目前使用 REST API 呼叫 D1 寫入日誌，而非使用原生的 Binding。雖然使用了 `event.waitUntil` 進行非同步處理，但頻繁的 HTTP 請求仍可能增加延遲與失敗率。建議未來可評估改用 D1 Binding 以提升效能與穩定性。
