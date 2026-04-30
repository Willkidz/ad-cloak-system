---
title: "時間歸因方案設計文件 (Time Attribution Spec)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "設計一套基於廣告點擊與 LINE 加好友時間差的自動化歸因系統，取代現行手動 Token 機制，實現 100% 自動化歸因與 CAPI 回傳。"
id: "20260318-time-attr-spec"
type: "spec"
tags: [attribution, capi, cloudflare-d1, cloudflare-workers, godview, n8n]
status: "active"
created: "2026-03-18"
updated: "2026-03-30"
version: "v1.1"
---

> **TL;DR**: 本方案旨在建立 100% 自動化的歸因系統，取代依賴用戶手動發送 Token 的舊機制。核心邏輯：(1) `line-redirect` Worker 生成唯一 `click_id`，並使用 `env.DB.prepare` 直接將點擊數據（含 `fbclid`, `ad_code`, `line_oa_id` 等）寫入 D1 `clicks` 表，同時向 Facebook BC 像素發送 `CompleteRegistration` 事件；(2) 用戶加好友觸發 LINE `follow` 事件至 n8n；(3) n8n 根據 `destination` (LINE OA ID) 與時間戳，在 D1 中查詢過去 **45 秒**內未匹配的點擊記錄；(4) 匹配成功後標記 `matched=1` 並透過 CAPI 回傳 `CompleteRegistration` 事件。此方案消除了用戶操作成本，顯著提升歸因精準度。

# 時間歸因方案設計文件

## 總體目標

為「上帝視角」專案建立一套 100% 自動化的歸因系統，取代目前依賴用戶手動發送 Token 的機制。新方案將基於廣告點擊事件與 LINE 加好友事件的時間差進行匹配，實現無需用戶操作的自動歸因，並為後續的廣告成效分析提供更精準的數據基礎。

---

## 系統架構變更

新方案將對現有的 `line-redirect` Worker 和 n8n Workflow 進行修改，並引入新的數據表來記錄點擊事件。

### 資料流程

新的資料流程如下：

<step id="ad-click">**1. 廣告點擊**：用戶點擊 Facebook 廣告，跳轉至火鳥落地頁，再由火鳥輪替跳轉至其中一個 `line-redirect` Worker 子域名 (例如 `n21.freshpathlab.com`)。</step>

<step id="worker-log-click">**2. 點擊事件記錄與直寫 D1 (Worker)**：`line-redirect` Worker 觸發後，不再生成用於訊息的 Token。取而代之的是，它會生成一個唯一的 `click_id`，並使用 `env.DB.prepare` **直接將**此次點擊的詳細資訊（包含 `click_id`, `ad_code`, `fbclid`, IP 位址, User-Agent, `line_oa_id` 等）寫入 D1 `clicks` 表。</step>

<step id="worker-capi">**3. 發送初步 CAPI 事件 (Worker)**：Worker 在寫入 D1 的同時，向 Facebook BC 像素發送一個初步的 `CompleteRegistration` 事件，記錄本次廣告點擊行為。</step>

<step id="worker-redirect">**4. 直接跳轉 (Worker)**：Worker 立即回傳一個 302 Redirect，將用戶直接導向 LINE OA 的加好友頁面 (`https://line.me/R/ti/p/{line_oa_id}`)。</step>

<step id="line-follow-event">**5. 加好友事件 (LINE)**：用戶在 LINE 中將該官方帳號加為好友。LINE Platform 會發送一個 `follow` 事件到我們已設定好的 n8n Webhook 端點 (`/webhook/line-follow`)。</step>

<step id="n8n-attribution">**6. 時間歸因 (n8n)**：n8n 的歸因 Workflow 收到 `follow` 事件後，會根據 `destination` (即 LINE OA ID) 和時間戳，在 `clicks` 資料表中查詢近期（**過去 45 秒**內）是否有來自同一個 LINE OA 且尚未匹配的點擊記錄。</step>

<step id="n8n-capi-report">**7. 歸因成功與 CAPI 回傳 (n8n)**：如果找到匹配的點擊記錄，則視為歸因成功。系統會將該筆點擊記錄標記為「已匹配」，並使用點擊記錄中的 `fbclid`, IP, UA 等資訊，透過 Facebook Conversion API (CAPI) 回傳一個 `CompleteRegistration` 事件。歸因成功的事件也會被記錄在 `godview_events` 資料表中。</step>

---

### Cloudflare Worker (`line-redirect`) 修改

| 項目 | 原有邏輯 | 修改後邏輯 |
| :--- | :--- | :--- |
| **Token 生成** | `generateToken()` 產生 5 位隨機碼 | **移除**。改為生成一個唯一的 `click_id` (e.g., using `crypto.randomUUID()`)。 |
| **數據寫入** | 發送 POST 到 n8n Webhook，由 n8n 寫入 D1 | **Worker 直接使用 `env.DB.prepare` 寫入 D1 `clicks` 表**，不經過 n8n。 |
| **CAPI 事件** | 無 | Worker 直接向 BC 像素發送 `CompleteRegistration` 事件。 |
| **跳轉邏輯** | 產生帶有 Token 的 `oaMessage` 連結 | 直接跳轉至 `https://line.me/R/ti/p/{line_oa_id}`。 |

---

### n8n Workflow 修改

n8n 在新架構中**不負責寫入點擊數據**，其核心職責為歸因匹配與發送最終轉換事件。

#### 修改 Workflow: `上帝視角_Event Attribution`

*   **觸發器**: 維持不變，仍由 `LINE Add Friend Event` (`/webhook/line-follow`) 觸發。
*   **移除節點**: 刪除所有與「訊息 Token 處理」相關的節點。
*   **新增歸因邏輯**:
    1.  在收到 `follow` 事件後，新增一個 `Cloudflare D1` 節點。
    2.  使用 `SELECT` 查詢 `clicks` 資料表。
    3.  <rule id="attribution-query">**查詢條件**：
        ```sql
        WHERE destination = '{{$json.events[0].destination}}' 
          AND timestamp >= datetime('now', '-45 seconds') 
          AND matched = 0 
        ORDER BY timestamp DESC LIMIT 1
        ```
        </rule>
    4.  新增 `IF` 節點，判斷是否查詢到結果。
    5.  **若匹配成功**:
        *   新增 `Cloudflare D1` 節點，`UPDATE clicks SET matched = 1 WHERE click_id = '{{$json.click_id}}'`。
        *   將原有的 CAPI Data 準備節點的輸入，改為來自新查詢到的點擊事件數據。
        *   透過 CAPI 回傳 `CompleteRegistration` 事件，並向 Telegram 發送系統監控報告。
    6.  **若無匹配**: 結束流程，或可選擇性地將未匹配的 `follow` 事件記錄到另一個資料表以供分析。

---

### 資料庫結構 (D1)

**資料表名稱**: `clicks`（實際使用名稱，非 `clicks`）

| 欄位名稱 | 資料類型 | 描述 | 範例 |
| :--- | :--- | :--- | :--- |
| `click_id` | `TEXT` | 唯一點擊 ID (Primary Key) | `c8a9f4a7-1b2c-4d5e-8f6a-7b8c9d0e1f2a` |
| `timestamp` | `TEXT` | ISO 8601 格式的點擊時間戳 | `2026-03-18T12:00:00.123Z` |
| `ad_code` | `TEXT` | 廣告代碼 | `AS0101` |
| `destination` | `TEXT` | 目標 LINE 官方帳號 User ID（歸因匹配關鍵欄位） | `U5717d3ae4604d92bb02671b4323f73ef` |
| `ip_address` | `TEXT` | 用戶 IP 位址 | `123.123.123.123` |
| `user_agent` | `TEXT` | 用戶瀏覽器 User-Agent | `Mozilla/5.0 ...` |
| `fbclid` | `TEXT` | Facebook Click ID | `fb.1.15585310...` |
| `fbc` | `TEXT` | Facebook Browser Cookie | `fb.1.15585310...` |
| `fbp` | `TEXT` | Facebook Pixel Cookie | `fb.1.15585310...` |
| `matched` | `INTEGER` | 是否已歸因 (0: 否, 1: 是) | `0` |
| `matched_at` | `TEXT` | 歸因成功時間戳 (Nullable) | `2026-03-18T12:00:30.456Z` |
| `matched_user_id` | `TEXT` | 歸因成功的 LINE User ID (Nullable) | `U123456789...` |

---

## 實施步驟

<step id="impl-1">**1. 資料庫準備**：在 Cloudflare D1 中確認 `clicks` 資料表已存在（實際表名為 `clicks`，非 `clicks`）。</step>
<step id="impl-2">**2. Worker 升級**：修改 `line-redirect` Worker 的程式碼，使用 `env.DB.prepare` 直接寫入 D1，並加入 BC 像素 `CompleteRegistration` 事件發送邏輯，然後部署新版本。</step>
<step id="impl-3">**3. 歸因邏輯升級**：修改 n8n 中的 `上帝視角_Event Attribution` Workflow，實現新的 45 秒時間歸因邏輯，匹配成功後回傳 `CompleteRegistration` 事件。</step>
<step id="impl-4">**4. 整合測試**：進行端到端測試，確保點擊、D1 直寫、加好友、歸因、CAPI 回傳流程完整且正確。</step>
<step id="impl-5">**5. 舊邏輯停用**：確認舊的 Token 處理邏輯已完全停用。</step>

---

## 結論

此時間歸因方案透過自動化點擊與加好友事件的匹配，消除了對用戶手動操作的依賴，預期將顯著提升歸因的即時性與準確性。架構上，Worker 直接寫入 D1（`env.DB.prepare`）避免了 n8n 中轉的延遲與單點故障風險；n8n 專注於歸因匹配邏輯與最終 CAPI 事件回傳。建議後續應建立監控機制，追蹤歸因成功率與潛在的未匹配事件，以持續優化歸因窗口（目前為 **45 秒**）的設定。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | 系統設計分析與職責劃分 |
| [`godview-n8n-workflow-list.md`](./godview-n8n-workflow-list.md) | n8n 工作流完整清單 |
| [`godview-worker-code-log.md`](./godview-worker-code-log.md) | Worker 程式碼變更日誌 |
| [`godview-system-rebuild-spec.md`](./godview-system-rebuild-spec.md) | 系統改造計畫書 (v5 架構) |
