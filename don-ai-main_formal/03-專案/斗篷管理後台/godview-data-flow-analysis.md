---
title: "上帝視角關鍵資料流向分析（2026-04-03）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-03"
summary: "基於線上實際部署的 Worker 程式碼與 N8N 工作流，逐環節分析 vid、event_id、user_id（LINE userId）、fbclid 四個關鍵資料在 shadow-cloak → money-page → line-login-callback → N8N Time Attribution 各環節中的產生、存儲與傳遞邏輯。所有分析均基於 Cloudflare API 下載的線上程式碼，非倉庫版本。"
id: "20260403-godview-data-flow-analysis"
type: "project-doc"
tags: [godview, line-redirect, attribution, troubleshooting]
status: "active"
created: "2026-04-03"
updated: "2026-04-03"
version: "v1.0"
---

> **TL;DR**: 四個關鍵資料的完整鏈路已驗證通過。`vid` 由 shadow-cloak 產生，作為串聯點擊與綁定的唯一橋樑；`fbclid` 從廣告 URL 提取存入 clicks 表，最終由 N8N 轉換為 `fbc` 發送給 Meta；`event_id` 由 shadow-cloak 生成，用於 CAPI 去重；`user_id` 由 LIFF SDK 取得，透過 `/bind` 端點與 `vid` 綁定，N8N 收到 Webhook 後用其反查完整歸因鏈路。

# 上帝視角關鍵資料流向分析（2026-04-03）

本文件基於 Cloudflare API 下載的**線上實際部署程式碼**，逐環節分析四個關鍵資料在系統各元件中的產生、存儲與傳遞邏輯。

---

## 1. 隱者斗篷（shadow-cloak）

shadow-cloak 作為流量的第一站，負責生成追蹤識別碼並記錄初始點擊資料。

### 取得與產生邏輯

**vid** 使用 `crypto.randomUUID()` 隨機生成一個 UUID 作為訪客的唯一識別碼：

```javascript
// shadow-cloak.js L887
const visitorId = crypto.randomUUID();
```

**event_id** 結合當前時間戳與 `vid` 的前 8 碼生成：

```javascript
// shadow-cloak.js L1131
const eventId = `evt_${Date.now()}_${visitorId.substring(0, 8)}`;
```

**fbclid** 直接從 URL 查詢參數中提取，**fbc/fbp** 優先從 Cookie 讀取，若無則從 URL 查詢參數提取：

```javascript
// shadow-cloak.js L893-894, L1130
const fbp = cookies["_fbp"] || url.searchParams.get("fbp") || "";
const fbc = cookies["_fbc"] || url.searchParams.get("fbc") || "";
const fbclid = url.searchParams.get("fbclid") || "";
```

### 存儲位置

寫入 D1 資料庫的 `clicks` 表，`source` 欄位固定為 `'shadow-cloak'`：

```sql
-- shadow-cloak.js L1136-1156
INSERT INTO clicks (
  click_id, timestamp, tag, line_oa_id,
  ip_address, user_agent, accept_language, ip_country, ip_asn,
  fbclid, fbc, fbp, pixel_id,
  visitor_id, event_id, matched, source, ad_code
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'shadow-cloak', ?)
```

| 關鍵資料 | 對應欄位 |
| :--- | :--- |
| vid | `visitor_id` |
| event_id | `event_id` |
| fbclid | `fbclid` |
| fbc | `fbc` |
| fbp | `fbp` |
| ad_code | `ad_code` |

### 傳遞給下一步

透過 URL 參數將 `vid`、`liff_id`、`ac`（即 ad_code）傳遞給落地頁：

```javascript
// shadow-cloak.js L1161
const mpUrl = `https://money-page.laoqin1689.workers.dev/?t=${moneyPageId}&vid=${visitorId}&liff_id=${liffId}&ac=${adCode}`;
```

---

## 2. 落地頁（money-page）

money-page 負責展示內容並將用戶引導至 LINE，同時確保追蹤參數不遺失。

### 取得邏輯

```javascript
// money-page.js L11-13
const visitorId = request.headers.get("x-visitor-id") || url.searchParams.get("vid") || "";
const liffId = url.searchParams.get("liff_id") || "2009129136-BEXGdu4X";
const adCode = url.searchParams.get("ac") || "";
```

### 傳遞給下一步

將靜態 HTML 中所有包含 `freshpathlab` 的 CTA 連結替換為帶參數的 LIFF URL：

```javascript
// money-page.js L14
const ctaUrl = `https://liff.line.me/${liffId}?vid=${encodeURIComponent(visitorId)}${adCode ? "&ac=" + encodeURIComponent(adCode) : ""}`;
```

money-page **不存儲任何資料**，僅作為參數的中繼傳遞站。

---

## 3. LIFF / LINE Login Callback（line-login-callback）

此環節負責在用戶點擊 CTA 後，透過 LINE LIFF 取得用戶的 LINE 身份，並將其與先前的點擊資料（vid）綁定。

### 取得邏輯

**user_id** 透過 LIFF SDK 取得：

```javascript
// line-login-callback.js L136-137
const profile = await liff.getProfile();
const lineUserId = profile.userId;
```

**vid 與 ac** 透過 `extractParams()` 函數提取，支援 `liff.state` 封裝的情況：

```javascript
// line-login-callback.js L82-108
function extractParams() {
  const urlParams = new URLSearchParams(window.location.search);
  let vid = urlParams.get('vid');
  let ac = urlParams.get('ac');
  // 若 URL 中沒有，嘗試解析 LINE 封裝的 liff.state 參數
  if (!vid || !ac) {
    const liffState = urlParams.get('liff.state');
    if (liffState) {
      const stateParams = new URLSearchParams(liffState.startsWith('?') ? liffState.substring(1) : liffState);
      if (!vid) vid = stateParams.get('vid');
      if (!ac) ac = stateParams.get('ac');
    }
  }
  return { vid, ac: ac || '' };
}
```

### 前端傳遞（ac → ad_code 的映射）

前端 JS 將 URL 的 `ac` 參數映射為 `ad_code` 欄位名，發送 POST 請求至 `/bind`：

```javascript
// line-login-callback.js L146-150
body: JSON.stringify({
  vid: vid,
  line_user_id: lineUserId,
  ad_code: adCode  // URL 的 ac 參數在此映射為 ad_code
})
```

### 後端存儲（/bind 端點）

```javascript
// line-login-callback.js L204
const { vid, line_user_id, event_id, fbclid, fbc, fbp, ad_code } = body;
```

寫入 `line_user_bindings` 表（UPSERT 邏輯）：

```sql
-- line-login-callback.js L223-228
INSERT INTO line_user_bindings (id, vid, line_user_id, ad_code, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(line_user_id) DO UPDATE SET
  vid = excluded.vid,
  ad_code = excluded.ad_code,
  updated_at = excluded.updated_at
```

同時非同步將 `clicks` 表中對應的記錄標記為已匹配：

```sql
-- line-login-callback.js L239
UPDATE clicks SET matched = 1, matched_at = ?, matched_user_id = ?
WHERE visitor_id = ? AND matched = 0
ORDER BY timestamp DESC LIMIT 1
```

---

## 4. N8N Time Attribution

N8N 工作流在用戶實際加入 LINE OA（觸發 Follow Webhook）時執行，負責將 LINE 事件與先前的點擊歸因，並發送事件給 Meta CAPI。

### 取得 user_id

從 LINE Webhook Payload 中提取：

```javascript
// N8N: Extract Follow Data 節點
line_user_id = $json.body.events[0].source.userId
```

### 歸因查詢（Query Exact Click 節點）

使用 `line_user_id` 透過 JOIN 查詢精確找回原始點擊資料：

```sql
SELECT c.click_id, c.timestamp, c.tag, c.ad_code,
       c.fbclid, c.fbc, c.fbp, c.pixel_id, c.capi_token, c.pixels,
       c.event_id, c.ip_address, c.user_agent, ...
FROM line_user_bindings b
JOIN clicks c ON b.vid = c.visitor_id
WHERE b.line_user_id = ?1
  AND c.matched = 0
  AND c.source = 'shadow-cloak'
ORDER BY c.timestamp DESC LIMIT 1
```

### CAPI 事件組裝（Prepare CAPI Events 節點）

| CAPI 欄位 | 來源 | 說明 |
| :--- | :--- | :--- |
| `event_id` | `matchData.event_id` | 用於 Meta 事件去重 |
| `user_data.fbc` | `matchData.fbc` | 包含 fbclid 的點擊識別碼 |
| `user_data.fbp` | `matchData.fbp` | 瀏覽器識別碼 |
| `user_data.external_id` | `sha256hex(matchData.line_user_id)` | LINE userId 的 Hash 值 |
| `user_data.client_ip_address` | `matchData.ip_address` | 用戶 IP |
| `custom_data.ad_code` | `matchData.ad_code` | 廣告代號 |

---

## 5. 關鍵資料流向總表

| 資料 | 產生環節 | 存在哪裡 | 傳遞方式 | 最終用途 |
| :--- | :--- | :--- | :--- | :--- |
| **vid** | shadow-cloak（UUID 生成） | `clicks.visitor_id`、`line_user_bindings.vid` | URL 參數 `?vid=` → LIFF URL → `/bind` POST body | 串聯點擊與綁定的**唯一橋樑**（JOIN 鍵） |
| **fbclid** | Facebook 廣告（FB 點擊產生） | `clicks.fbclid`、`clicks.fbc` | 存入資料庫，N8N 透過 vid 關聯查詢取得 | 轉換為 `fbc` 發送給 Meta CAPI，用於**精準廣告歸因** |
| **event_id** | shadow-cloak（時間戳 + vid 組合） | `clicks.event_id` | 存入資料庫，N8N 透過 vid 關聯查詢取得 | 發送給 Meta CAPI，用於**事件去重** |
| **user_id** | LINE LIFF（用戶授權後取得） | `line_user_bindings.line_user_id`、`clicks.matched_user_id` | `/bind` POST body → 資料庫；Webhook 觸發時由 N8N 接收 | 反查對應點擊紀錄；Hash 後作為 `external_id` 傳給 Meta |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-e2e-test-report.md`](godview-e2e-test-report.md) | 端到端功能測試報告，驗證本文件描述的資料流向 |
| [`n21-liff-redirect-fix-log.md`](n21-liff-redirect-fix-log.md) | n21 歸因鏈路修復記錄，包含 BUG-008 雙重 @ 修復 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱，v3 架構與端到端歸因流程 |
| [`../../.ai/memory.md`](../../.ai/memory.md) | 專案核心記憶 |
