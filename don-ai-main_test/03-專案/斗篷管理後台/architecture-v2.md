---
version: 2.0
date: 2026-04-01
author: Manus AI
---

# 隱者系統技術架構 v2 (對標火鳥系統)

## 1. 系統定位與目標

隱者系統（Shadow Cloak）是為了解決傳統火鳥系統（Line Redirect）在歸因追蹤、動態分流及系統擴展性上的瓶頸而設計的進階架構。本文件旨在梳理隱者系統 v2 的技術架構，對標火鳥系統的已知機制，並詳細說明核心數據鏈路（如 `eventID` 與 `fbclid`）的傳遞方式。

## 2. 完整流程圖（文字描述）

隱者系統的流量處理流程分為以下幾個核心階段：

1. **流量入口 (shadow-cloak Worker)**
   - 使用者點擊 Facebook 廣告，進入綁定於 Cloudflare 的廣告域名。
   - 請求 URL 中包含 `fbclid` 參數。
   - `shadow-cloak` 攔截請求，執行機器人過濾與 IP 判斷。
   - 提取 `fbclid`，並動態生成一個全局唯一的 `eventID`（例如使用 UUID v4 或時間戳+隨機數）。
   - 根據請求的 hostname 查詢 D1 `campaigns` 表，獲取廣告活動設定。

2. **落地頁生成 (money-page Worker)**
   - 如果判定為真實使用者，且需要顯示落地頁，`shadow-cloak` 將請求轉發給 `money-page` Worker。
   - 轉發時，透過 URL 參數或 Header 將 `fbclid`、`eventID`、`campaign_id` 及 `tag` 傳遞給 `money-page`。
   - `money-page` 根據 `campaign_id` 獲取落地頁模板（可能來自 D1 `templates` 表或靜態資源）。
   - 動態渲染 HTML，並將聯絡按鈕（CTA）的 URL 替換為指向 `line-redirect` 的短鏈接，URL 中附帶 `fbclid` 與 `eventID`。

3. **跳轉與記錄 (line-redirect Worker)**
   - 使用者點擊落地頁上的聯絡按鈕，訪問 `line-redirect` 的 `/go` 路由（例如 `https://freshpathlab.com/go?tag=xxx&fbclid=xxx&eventID=xxx`）。
   - `line-redirect` 接收請求，提取 `tag`、`fbclid` 與 `eventID`。
   - 根據 `tag` 查詢 D1 `line_config` 表，獲取對應的 LINE OA 連結與輪替策略。
   - 根據輪替策略（隨機、輪替、IP Hash）選擇最終的 LINE OA 連結。
   - 將點擊事件（包含 `fbclid` 與 `eventID`）非同步寫入 D1 `clicks` 表。
   - 執行 302 重定向，將使用者導向最終的 LINE OA。

4. **歸因回傳 (N8N CAPI 工作流)**
   - N8N 定期輪詢 D1 `clicks` 表，或透過 Webhook 接收新點擊事件。
   - 提取包含 `fbclid` 與 `eventID` 的記錄。
   - 透過 Facebook Conversions API (CAPI) 發送事件（如 Purchase 或 Lead），確保精準歸因。

## 3. 對標火鳥系統的機制比較

下表詳細比較了火鳥系統與隱者系統在各個環節的實作差異與優勢：

| 比較項目 | 火鳥系統 (基準) | 隱者系統 v2 (優化/超越) |
| :--- | :--- | :--- |
| **落地頁技術** | WordPress + Elementor，依賴前端 JavaScript (`gotolink()`) | Cloudflare Workers (`money-page`)，Edge 端動態渲染 HTML，速度更快，不依賴客戶端 JS。 |
| **按鈕跳轉** | 點擊按鈕觸發 JS，跳轉到中繼頁 `ini.html` | 點擊按鈕直接訪問 `line-redirect` 的 `/go` 路由，減少跳轉層級，降低流失率。 |
| **中繼頁處理** | `ini.html` 動態替換 `[conftpl]`，顯示 LINE OA 按鈕彈窗 | 移除中繼頁彈窗，直接由 `line-redirect` 在 Edge 端計算輪替並 302 重定向。 |
| **像素觸發** | 前端發送 FB Pixel Purchase 事件 | 後端透過 N8N 發送 CAPI 事件，不受瀏覽器阻擋（如 iOS 14+ 或 AdBlocker），歸因更準確。 |
| **eventID 生成** | 中繼頁 `ini.html` 後端動態生成，每次請求唯一 | `shadow-cloak` 首次攔截時即生成，並一路傳遞至 CAPI，確保前後端事件去重。 |
| **fbclid 追蹤** | 依賴 FB Pixel 自動追蹤，未手動提取與傳遞 | `shadow-cloak` 提取後，透過 URL 參數顯式傳遞至 `line-redirect` 並存入 D1，確保 CAPI 具備高質量匹配參數。 |
| **資料存儲** | 未知或分散 | 統一使用 Cloudflare D1，集中管理 `campaigns`、`clicks`、`line_config` 等。 |

## 4. 動態 eventID 的實現方案

為了確保 Facebook CAPI 能夠正確去重並歸因，`eventID` 的傳遞鏈路必須完整：

1. **生成階段 (`shadow-cloak`)**：
   當流量進入 `shadow-cloak`，且判定為真實使用者時，生成全局唯一的 `eventID`。
   ```javascript
   const eventID = crypto.randomUUID(); // 使用 Web Crypto API 生成 UUID v4
   ```

2. **傳遞階段 1 (`shadow-cloak` -> `money-page`)**：
   將 `eventID` 作為 URL 參數附加在轉發給 `money-page` 的請求中。
   ```javascript
   const mpUrl = `https://money-page.example.com/?vid=${vid}&tag=${tag}&eventID=${eventID}`;
   ```

3. **傳遞階段 2 (`money-page` -> 落地頁 HTML)**：
   `money-page` 將 `eventID` 注入到 CTA 按鈕的 URL 中。
   ```html
   <!-- 替換前 -->
   <a href="{{CTA_URL}}" class="btn">聯絡我們</a>
   <!-- 替換後 -->
   <a href="https://freshpathlab.com/go?tag=xxx&vid=xxx&fbclid=xxx&eventID=xxx" class="btn">聯絡我們</a>
   ```

4. **傳遞階段 3 (落地頁 -> `line-redirect`)**：
   使用者點擊按鈕，`line-redirect` 接收到包含 `eventID` 的請求，並將其存入 D1 `clicks` 表。

5. **傳遞階段 4 (`clicks` 表 -> N8N CAPI)**：
   N8N 讀取 `clicks` 表時，提取 `eventID`，並將其作為 CAPI 請求中的 `event_id` 欄位發送給 Facebook。

## 5. fbclid 傳遞鏈路

`fbclid` 的傳遞鏈路與 `eventID` 類似，這是先前已修復的關鍵部分：

1. **提取**：`shadow-cloak` 從初始請求的 URL 參數中提取 `fbclid`。
2. **傳遞**：附加到 `money-page` 的請求 URL 中。
3. **注入**：`money-page` 將其注入到 CTA 按鈕的 URL 中。
4. **存儲**：`line-redirect` 接收後，寫入 D1 `clicks` 表的 `fbclid` 欄位。
5. **歸因**：N8N 將其作為 CAPI 請求的關鍵參數發送。

## 6. 輪替機制

隱者系統支援靈活的輪替機制，主要透過 `campaigns` 表的 `line_links` 欄位與 `routing_strategy` 欄位實現。

### 資料結構

`campaigns` 表中的 `line_links` 欄位存儲 JSON 陣列：
```json
[
  { "id": 1, "url": "https://cx.freshpathlab.com/CX01", "weight": 50, "status": "active" },
  { "id": 2, "url": "https://cs.freshpathlab.com/CS01", "weight": 30, "status": "active" }
]
```
`routing_strategy` 支援三種模式：`random`（隨機）、`round_robin`（輪替）、`ip_hash`（IP 固定）。

### 雙層輪替架構

隱者系統實際上存在兩層可能的輪替：

1. **第一層：廣告級別輪替 (`shadow-cloak`)**
   - 依賴 `campaigns` 表的設定。
   - 如果廣告設定了 `line_links`，`shadow-cloak` 的 `selectTargetLink()` 函數會直接根據策略選擇一個連結並 302 重定向，**跳過落地頁顯示**。
   - 狀態管理：`round_robin` 模式使用獨立的 `round_robin_state` 表記錄當前索引。

2. **第二層：標籤級別輪替 (`line-redirect`)**
   - 依賴 `line_config` 表的設定。
   - 如果廣告沒有設定 `line_links`，則顯示落地頁。使用者點擊按鈕後，由 `line-redirect` 根據 `tag` 查詢 `line_config` 進行輪替。

## 7. 需要新增或修改的項目清單

為了完全實現上述架構（特別是 `eventID` 的動態生成與傳遞），需要進行以下修改：

1. **D1 資料庫修改**
   - `clicks` 表：新增 `event_id` 欄位（如果尚未存在）。

2. **shadow-cloak Worker 修改**
   - 在攔截真實使用者流量時，生成 UUID 作為 `eventID`。
   - 將 `eventID` 附加到轉發給 `money-page` 的 URL 參數中。

3. **money-page Worker 修改**
   - 從請求參數中提取 `eventID`。
   - 在生成 `ctaUrl` 時，將 `eventID` 加入 URL 參數中。

4. **line-redirect Worker 修改**
   - 在 `/go` 路由處理中，從請求參數提取 `eventID`。
   - 將 `eventID` 寫入 `clicks` 表的對應欄位。

5. **N8N 工作流修改**
   - 更新讀取 `clicks` 表的 SQL 查詢，包含 `event_id` 欄位。
   - 在構建 Facebook CAPI 請求時，將 `event_id` 映射到對應的 API 欄位。
