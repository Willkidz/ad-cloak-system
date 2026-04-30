---
title: "隱者斗篷與上帝視角直連 LIFF 融合方案"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-03"
summary: "Shadow Cloak 與上帝視角 LIFF 歸因系統的完整融合方案。核心設計：斗篷過濾 → 落地頁 CTA 直連 LIFF（只帶 vid）→ 回調綁定 userId → N8N 精準匹配 → CAPI 回傳。包含完整流程圖、程式修改清單、資料庫操作時機與新增廣告域名 SOP。"
id: "20260403-shadow-cloak-godview-liff-fusion"
type: "project-doc"
tags: [shadow-cloak, godview, line, attribution, capi, architecture]
status: "active"
created: "2026-04-03"
updated: "2026-04-03"
version: "v1.0"
---

> **TL;DR**: 本方案將隱者斗篷（Shadow Cloak）的邊緣過濾能力與上帝視角（GodView）的 LIFF 精準歸因能力融合為一條完整鏈路。核心設計為：斗篷負責過濾並寫入 `clicks` 表 → 落地頁 CTA 按鈕直連 LIFF（只帶 `vid`）→ 回調程式綁定 `vid` 與 LINE `userId` → N8N 用 `vid` 精準匹配 → CAPI 回傳臉書。**更正註記（2026-04-10）**：此處應理解為**現行主路徑由 `vid` 精準匹配取代舊主路徑**，但 **45 秒時間窗口仍保留為 fallback**，並未完全刪除。

# 隱者斗篷與上帝視角直連 LIFF 融合方案

---

## 一、方案前提

本方案基於以下前提設計：

| 項目 | 說明 |
| :--- | :--- |
| **一域一廣告** | 一個廣告對應一組主域名（如 `kogane.online`） |
| **無參數入口** | 廣告連結直接使用主域名，不帶任何自訂參數，僅依靠臉書自動附加的 `fbclid` |
| **斗篷前置過濾** | 由隱者斗篷負責區分真人與爬蟲，並在資料庫寫入完整的點擊紀錄 |
| **直連 LIFF** | 落地頁 CTA 按鈕直接指向 LIFF 連結，且**只帶 `vid` 參數** |
| **移除中間頁** | 不經過 `line-redirect` 的綠色中間頁，用戶點擊 CTA 後直接喚醒 LINE APP |
| **後端匹配** | 回調程式將 `vid` 與 LINE `userId` 綁定，N8N 透過 `vid` 串聯所有歸因數據 |

---

## 二、完整流程圖

### 步驟 1：廣告點擊與斗篷過濾

用戶在臉書點擊廣告，瀏覽器發送請求到主域名。隱者斗篷攔截請求，執行 IP / ASN / Bot / OS / 語言 / 流量來源等多層過濾，判斷是真人還是爬蟲。如果是爬蟲，回傳安全頁（白頁）；如果是真人，生成唯一的訪客編號（`vid`），並將完整的點擊紀錄寫入資料庫。

| 項目 | 內容 |
| :--- | :--- |
| **當下網址** | `https://kogane.online/?fbclid=IwAR2...` |
| **執行程式** | `shadow-cloak` Worker |
| **資料庫操作** | 寫入 `clicks` 表：`vid`、`fbclid`、`fbc`、`fbp`、IP、UA、時間等（`matched = 0`） |
| **用戶看到什麼** | 瀏覽器正在載入 |

### 步驟 2：渲染落地頁

斗篷確認是真人後，在背景向落地頁程式（money-page）請求網頁內容，並把 `vid` 和 `liff_id` 傳過去。落地頁程式把網頁裡所有 CTA 按鈕的連結替換成帶有 `vid` 的 LIFF 連結，然後把網頁顯示給用戶。

| 項目 | 內容 |
| :--- | :--- |
| **當下網址** | 依然是 `https://kogane.online/?fbclid=IwAR2...`（網址列不變） |
| **執行程式** | `money-page` Worker（被 shadow-cloak 內部呼叫） |
| **CTA 按鈕網址** | `https://liff.line.me/{liff_id}?vid={vid}` |
| **用戶看到什麼** | 精美的推廣落地頁，上面有「立即開版」等按鈕 |

### 步驟 3：用戶點擊 CTA 按鈕

用戶點擊「立即開版」按鈕。因為按鈕直接指向 `liff.line.me` 的網址，iOS 會觸發 Universal Link，直接喚醒 LINE APP。這是用戶的**主動點擊行為**，符合 iOS Universal Link 的觸發條件。

| 項目 | 內容 |
| :--- | :--- |
| **按鈕網址** | `https://liff.line.me/2009129136-BEXGdu4X?vid=a1b2c3d4-e5f6` |
| **用戶看到什麼** | 畫面跳轉到 LINE APP（首次使用會看到授權同意畫面） |

### 步驟 4：回調程式綁定帳號

LINE APP 打開 LIFF 後，會自動把 `vid` 參數包裝進 `liff.state`，跳轉到回調程式。回調程式向 LINE 取得用戶的真實身份編號（`userId`），然後把 `vid` 和 `userId` 送到資料庫綁定。綁定完成後，自動把畫面轉到官方帳號的加入好友頁面。

| 項目 | 內容 |
| :--- | :--- |
| **當下網址** | `https://line-login-callback.laoqin1689.workers.dev/line-login/callback?liff.state=vid=a1b2c3d4-e5f6` |
| **執行程式** | `line-login-callback` Worker |
| **資料庫操作** | 寫入 `line_user_bindings` 表（`vid` ↔ `userId`）；更新 `clicks` 表（`matched = 1`） |
| **用戶看到什麼** | LINE OA 的「加入好友」或聊天畫面 |

### 步驟 5：N8N 精準匹配與 CAPI 回傳

用戶加入好友後，LINE 發送 Webhook 通知給 N8N。N8N 收到通知後，用 `userId` 查詢 `line_user_bindings` 表找到 `vid`，再用 `vid` 查詢 `clicks` 表取得完整的歸因參數（`fbclid`、`fbc`、`fbp`、IP、UA 等），最後打包送給臉書 CAPI。

| 項目 | 內容 |
| :--- | :--- |
| **觸發條件** | LINE Follow Webhook |
| **執行程式** | N8N 工作流 `上帝視角_Time Attribution` |
| **資料庫操作** | 查詢 `line_user_bindings`（userId → vid）；查詢 `clicks`（vid → fbclid 等） |
| **最終結果** | 向臉書發送 `CompleteRegistration` 事件，廣告後台轉換數 +1 |

---

## 三、參數傳遞鏈路

| 傳遞節點 | 傳遞方式 | 攜帶的參數 |
| :--- | :--- | :--- |
| 臉書 → 斗篷 | URL 查詢字串 + Cookie | `fbclid`、`fbc`（Cookie）、`fbp`（Cookie） |
| 斗篷 → 落地頁 | 內部 Fetch URL 查詢字串 | `vid`（新生成）、`liff_id`（從 campaigns 表讀取） |
| 落地頁 → LIFF | HTML `<a>` 標籤的 `href` | `vid`（僅此一個參數） |
| LIFF → 回調程式 | `liff.state` 參數（LINE 自動封裝） | `vid` |
| 回調程式 → 資料庫 | `POST /bind` JSON Body | `vid`、`line_user_id`（從 LIFF 取得） |
| N8N → 臉書 | Meta CAPI HTTP POST | `event_id`、`fbclid`、`fbc`、`fbp`、IP、UA（全部從 `clicks` 表讀取） |

---

## 四、需要修改的程式清單

### 1. shadow-cloak.js（隱者斗篷）

在斗篷判定為真人、準備轉發給 money-page 之前，新增寫入 `clicks` 表的邏輯。同時在轉發 URL 中加入 `liff_id` 參數。

**修改位置**：約第 1089-1095 行（`moneyPageId` 取得後、`mpUrl` 構建前）

```javascript
// 新增：生成 event_id 並寫入 clicks 表
const eventId = `evt_${Date.now()}_${visitorId.substring(0,8)}`;
const fbclid = url.searchParams.get("fbclid") || "";
const liffId = campaignConfig.liff_id || "";
const lineOaId = campaignConfig.line_oa_id || "";

ctx.waitUntil(
  env.D1.prepare(
    `INSERT INTO clicks (click_id, timestamp, tag, line_oa_id, ip_address, user_agent,
     accept_language, ip_country, ip_asn, fbclid, fbc, fbp, pixel_id,
     visitor_id, event_id, matched) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`
  ).bind(
    crypto.randomUUID(), new Date().toISOString(), tag, lineOaId,
    clientIP, ua, request.headers.get("Accept-Language") || "",
    country, String(asn), fbclid, fbc, fbp,
    campaignConfig.pixel_fb || "", visitorId, eventId
  ).run().catch(e => console.error("clicks insert error:", e))
);

// 修改：轉發 URL 加入 liff_id
const mpUrl = `https://money-page.laoqin1689.workers.dev/?t=${encodeURIComponent(moneyPageId)}&vid=${encodeURIComponent(visitorId)}&liff_id=${encodeURIComponent(liffId)}`;
```

### 2. money-page.js（落地頁程式）

將 CTA 按鈕的連結改為直連 LIFF 網址，只帶 `vid` 參數。

**修改位置**：第 5-14 行

```javascript
async function handleRequest(request) {
  const url = new URL(request.url);
  const visitorId = request.headers.get('x-visitor-id') || url.searchParams.get('vid') || '';
  const liffId = url.searchParams.get('liff_id') || '2009129136-BEXGdu4X';

  // 直接組裝 LIFF 連結，只帶 vid
  const ctaUrl = `https://liff.line.me/${liffId}?vid=${encodeURIComponent(visitorId)}`;

  const htmlResponse = new Response(getHTML(), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" },
  });

  return new HTMLRewriter()
    .on('a[href*="freshpathlab"]', {
      element(el) { el.setAttribute('href', ctaUrl); }
    })
    .transform(htmlResponse);
}
```

### 3. line-login-callback.js（回調程式）

簡化參數提取邏輯，只需要處理 `vid`。`/bind` 端點保持不變（已支援只靠 `vid` 綁定）。

**修改位置**：`extractParams` 函數（約第 99-138 行）

### 4. N8N 工作流

新增 `vid` 精準匹配主路徑，並明確將 45 秒時間窗口降級為 fallback，只在 `vid` 綁定未命中或歷史火鳥鏈路資料不足時啟用。

```sql
-- 精準匹配查詢
SELECT c.* FROM clicks c
JOIN line_user_bindings b ON c.visitor_id = b.vid
WHERE b.line_user_id = :userId
ORDER BY c.timestamp DESC LIMIT 1;
```

### 5. campaigns 資料表

新增兩個欄位：

```sql
ALTER TABLE campaigns ADD COLUMN liff_id TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN line_oa_id TEXT DEFAULT '';
```

---

## 五、資料庫操作時機

| 操作 | 時機 | 執行者 | 寫入內容 |
| :--- | :--- | :--- | :--- |
| 寫入 `clicks` | 斗篷判定為真人時 | shadow-cloak | `vid`、`fbclid`、`fbc`、`fbp`、IP、UA、時間（`matched = 0`） |
| 寫入 `line_user_bindings` | LIFF 回調取得 userId 時 | line-login-callback | `vid` ↔ `userId` 對應關係 |
| 更新 `clicks` | 同上 | line-login-callback | `matched = 1`、`matched_user_id = userId` |
| 查詢匹配 | LINE Follow Webhook 觸發時 | N8N | userId → vid → fbclid/event_id/fbc/fbp |

---

## 六、新增廣告域名 SOP

當需要上線一個新的廣告域名（如 `new-game.online`）時：

1. **DNS 設定**：將域名託管到 Cloudflare，設定 A 紀錄或 CNAME 並開啟 Proxy（橘色雲朵），在 Workers Routes 中將 `*new-game.online/*` 綁定到 `shadow-cloak` Worker。
2. **資料庫設定**：在 `campaigns` 表新增一筆紀錄，填入 `theme`（主域名）、`money_page_id`（落地頁版型）、`pixel_fb`（像素 ID）、`liff_id`（LIFF ID）、`line_oa_id`（官方帳號 ID，不帶 @）。
3. **臉書廣告設定**：廣告連結直接填寫 `https://new-game.online`，不需要手動加上任何參數。

---

## 七、注意事項

1. **iOS Universal Link**：CTA 按鈕必須是用戶主動點擊，不能使用 JavaScript 自動跳轉，否則 Universal Link 不觸發。
2. **LIFF 授權畫面**：首次使用特定 LIFF ID 時，LINE 會彈出授權同意畫面，這是 LINE 官方限制，無法跳過。
3. **斗篷準確性**：寫入 `clicks` 表的動作移到斗篷階段，如果誤判會影響歸因完整性。
4. **`line-redirect` 角色**：需明確區分三種狀態。**現行主路徑**為 `shadow-cloak → money-page → LIFF → line-login-callback → N8N`，不再把 `line-redirect` 視為必經中間站；**fallback / 歷史相容路徑**仍可在火鳥既有鏈路、非 LIFF 流程或直接跳 LINE OA 聊天場景中使用 `line-redirect`；**完全廢棄的部分**則是把 `line-redirect` 寫成現行斗篷 + LIFF 核心主鏈路的描述。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`05-原始碼/斗篷管理後台/shadow-cloak.js`](../../05-原始碼/斗篷管理後台/shadow-cloak.js) | 隱者斗篷 Worker 源碼 |
| [`05-原始碼/上帝視角/money-page.js`](../../05-原始碼/上帝視角/money-page.js) | 落地頁 Worker 源碼 |
| [`03-專案/斗篷管理後台/line-login-callback.js`](line-login-callback.js) | 回調程式 Worker 源碼 |
| [`07-配置與環境/time_attribution_modified.json`](../../07-配置與環境/time_attribution_modified.json) | N8N 工作流匯出檔 |
| [`05-原始碼/斗篷管理後台/migrations/001_init_schema.sql`](../../05-原始碼/斗篷管理後台/migrations/001_init_schema.sql) | D1 資料庫 Schema |
| [`03-專案/上帝視角/n21-liff-redirect-fix-log.md`](../上帝視角/n21-liff-redirect-fix-log.md) | iOS Universal Link 修復記錄 |
