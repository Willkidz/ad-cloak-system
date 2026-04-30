---
title: "B 規劃組 — BC 像素與 ADS 像素事件未觸發：全部可能性分析"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "**分析時間**：2026-03-25"
status: "archived"
archived_reason: "歸檔：已完成的問題分析報告，問題已解決"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

# B 規劃組 — BC 像素與 ADS 像素事件未觸發：全部可能性分析

**分析時間**：2026-03-25
**分析範圍**：shadow-cloak → money-page → line-redirect → N8N 完整鏈路

---

## 像素事件觸發機制概述

系統中存在兩種像素事件觸發機制，分別在不同時間點、由不同元件負責：

| 像素類型 | 觸發時機 | 負責元件 | 事件名稱 |
| :--- | :--- | :--- | :--- |
| **BC 像素**（商業中心像素） | 用戶點擊 line-redirect 連結時 | line-redirect Worker `/bc-event` 端點 | `{PREFIX}_Click`、`ALL_Click` 等 |
| **ADS 像素**（各 tag 廣告像素） | 用戶加 LINE 好友後（follow 事件） | N8N `上帝視角_Time Attribution` workflow | `CompleteRegistration`、`{PREFIX}_CompleteRegistration`、`ALL_CompleteRegistration` |

**BC 像素** 固定為 pixel ID `783186198187359`，所有 tag 共用。
**ADS 像素** 為每個 tag 各自的 pixel（如 cs → `1296143099239936`、bf → `2153779865162231`），由 `MASTER_PIXEL_MAP` 和 `AD_MAP` 決定。

---

## 一、BC 像素事件未觸發的所有可能原因

BC 像素事件由 line-redirect Worker 的 `/bc-event` 端點觸發，使用 `sendBcEvent()` 函數透過 Facebook CAPI 發送。

### 1.1 前端未呼叫 `/bc-event`

**可能性：極高（目前最可能的根因）**

`/bc-event` 是一個被動端點，需要前端（money-page 或其他頁面）主動呼叫。目前 money-page 的原始碼中**完全沒有**任何呼叫 `/bc-event` 的程式碼——沒有 `fetch()`、沒有 `<img>` pixel tag、沒有任何 `bc-event` 字串。

> **結論**：如果 money-page 沒有嵌入呼叫 `/bc-event` 的腳本，BC 像素的 PageView/ViewContent 等前端事件就永遠不會觸發。

### 1.2 `sendBcEvent()` 的 `bcPixel` 參數為空

如果 `bcPixel` 物件的 `pixel` 或 `token` 為空，函數會直接 `return` 不發送。但目前 `FALLBACK_BC_PIXEL` 有硬編碼值（pixel: `783186198187359`），所以這個可能性較低，除非 Config API 回傳了空值覆蓋了 fallback。

### 1.3 `productPrefix` 為 null

如果 tag 不在 `TAG_PREFIX_MAP` 中，`getProductPrefix()` 回傳 `null`，則只會發送 `ALL_` 前綴的事件，不會發送產品線前綴的事件（如 `AS_Click`）。但 `ALL_Click` 仍然會發送。

### 1.4 Facebook CAPI 回傳錯誤

`sendBcEvent()` 的 `catch` 區塊是空的（`catch (e) {}`），即使 Facebook API 回傳錯誤也不會有任何日誌。可能的錯誤：
- CAPI Token 過期或無效
- Pixel ID 不存在或已停用
- 請求格式錯誤（缺少必要的 `user_data`）
- Facebook API 限流

### 1.5 `event_source_url` 缺失

`sendBcEvent()` 中的事件物件**沒有設定 `event_source_url`**，這可能導致 Facebook 拒絕或降低事件的匹配品質。

### 1.6 `user_data` 不足

如果 `userData.ip`、`userData.ua`、`userData.fbc`、`userData.fbp` 全部為空，Facebook 可能因為無法匹配用戶而丟棄事件。特別是如果用戶沒有 `fbclid`（非 Facebook 流量），`fbc` 和 `fbp` 都會是空的。

---

## 二、ADS 像素事件未觸發的所有可能原因

ADS 像素事件由 N8N `上帝視角_Time Attribution` workflow 在 LINE follow 事件發生後觸發。

### 2.1 沒有收到 follow 事件（最常見）

**可能性：極高**

從 N8N 執行紀錄來看，修復後的所有執行（1499~1509）收到的事件類型全部是 `message` 或 `unfollow`，**沒有任何一筆 follow 事件**。沒有 follow 事件 → `Is Follow Event?` 節點走 false 分支 → 後續所有節點都不執行 → 不會發送 CAPI。

**可能原因：**
- LINE 帳號的 Webhook URL 未設定或設定錯誤（不是 `https://n8n.bexnua.store/webhook/line-follow`）
- LINE Developers Console 中 Webhook 功能未開啟
- LINE 帳號的 Webhook 設定指向舊的 URL（如 `http://5.189.150.66:5678/webhook/...`）
- 用戶已經是好友（不會觸發 follow 事件，只有首次加好友才會）

### 2.2 Fingerprint Match 失敗（45 秒窗口過窄）

**可能性：中等**

即使收到 follow 事件，`Fingerprint Match` 節點使用 **45 秒時間窗口** 匹配 clicks 表中的記錄。如果用戶從點擊 line-redirect 到實際按下「加好友」的時間超過 45 秒，就會匹配失敗。

匹配邏輯：`WHERE destination = ?1 AND matched = 0 AND timestamp >= datetime(?2, '-45 seconds') AND timestamp <= ?2`

**可能場景：**
- 用戶點擊後猶豫了一下才加好友
- LINE App 開啟較慢
- 用戶先看了 LINE 帳號資訊再決定加好友

### 2.3 `destination` 不匹配

`Query Recent Clicks` 用 `destination` 欄位（LINE 帳號的 userId）來匹配。如果 `line_config` 中的 `destination` 與 LINE Webhook 回傳的 `body.destination` 不一致，就會查無結果。

### 2.4 clicks 表中沒有對應記錄

如果用戶透過其他管道加好友（直接搜尋 LINE ID、掃 QR code），clicks 表中不會有記錄，自然無法匹配。

### 2.5 `pixels` 欄位為空

即使匹配成功，如果 clicks 表中該筆記錄的 `pixels` 欄位為空 JSON（`[]`），且 `pixel_id` 和 `capi_token` 也為空，`Prepare CAPI Events` 節點會回傳 `{ skip: true, reason: 'no_valid_pixels' }`，`Has Pixel?` 節點走 false 分支，不會發送 CAPI。

**可能原因：**
- `AD_MAP` 為空（目前確認 `AD_MAP: {}` 是空的！）
- `MASTER_PIXEL_MAP` 中沒有該 tag 的對應
- `BC_PIXEL` 未正確加入 pixels 陣列

### 2.6 AD_MAP 為空（重要發現）

**可能性：高**

line-redirect 的 fallback 配置中 `AD_MAP: {}` 是空的。這意味著當用戶帶 `?a=CS01` 參數訪問時，`adInfo` 會是 `null`，`adPixels` 會是空陣列。像素來源只剩 `MASTER_PIXEL_MAP[tag]` 和 `BC_PIXEL`。

如果 `MASTER_PIXEL_MAP` 中有該 tag 的對應（如 cs → `1296143099239936`），ADS 像素仍然可以工作。但如果某些 tag 不在 `MASTER_PIXEL_MAP` 中，就只會有 BC 像素。

### 2.7 CAPI Token 無效或過期

所有像素目前共用同一個 CAPI Token。如果這個 Token 過期：
- 所有 CAPI 事件都會失敗
- N8N 的 `Send CAPI` 節點會收到 Facebook API 的錯誤回應
- 但 workflow 仍然會標記為 `success`（因為 HTTP 請求本身成功了，只是 Facebook 回傳錯誤）

### 2.8 N8N D1 查詢認證失敗

已觀察到 execution 1503 出現 D1 查詢 401 認證失敗。如果 `Query Recent Clicks` 節點失敗，整個 workflow 會報錯，不會到達 `Send CAPI`。

### 2.9 `event_source_url` 格式問題

`Prepare CAPI Events` 中設定 `event_source_url` 為 `https://{tag}.freshpathlab.com/`。如果 Facebook Pixel 的設定域名與此不匹配，事件可能被 Facebook 忽略或降低匹配品質。

---

## 三、共通問題

### 3.1 所有 CAPI Token 相同

目前所有 tag 的 CAPI Token 都是同一個（`EAAeahovhP0cBQ7D...`），BC 像素和 ADS 像素共用。如果這個 Token 失效，所有像素事件都會同時失效。

### 3.2 錯誤被靜默吞掉

- `sendBcEvent()` 的 `catch` 是空的
- line-redirect 的 `ctx.waitUntil()` 不會等待結果
- N8N 的 `Send CAPI` 節點即使 Facebook 回傳錯誤碼也不會中斷 workflow

這導致即使 CAPI 發送失敗，也不會有任何可見的錯誤日誌。

### 3.3 money-page 沒有任何像素追蹤代碼

money-page 的原始碼中完全沒有：
- Facebook Pixel base code（`fbq('init', ...)`）
- Google Analytics
- 任何 `bc-event` 呼叫
- 任何追蹤腳本

這意味著 money-page 上的用戶行為（PageView、ViewContent、CTA 點擊）完全沒有被追蹤。

### 3.4 shadow-cloak 沒有任何像素相關代碼

shadow-cloak Worker 不負責發送任何像素事件，它只做斗篷判定和 proxy。

---

## 四、可能性排序（由高到低）

| 排名 | 可能原因 | 影響範圍 | 嚴重度 |
| :--- | :--- | :--- | :--- |
| **1** | **N8N 沒有收到 follow 事件**（LINE Webhook 未設定或設定錯誤） | ADS 像素全部失效 | 🔴 致命 |
| **2** | **money-page 沒有呼叫 `/bc-event`** | BC 像素前端事件全部失效 | 🔴 致命 |
| **3** | **AD_MAP 為空**，像素來源只靠 MASTER_PIXEL_MAP | 部分 tag 的 ADS 像素可能缺失 | 🟡 高 |
| **4** | **45 秒匹配窗口過窄**，follow 事件無法匹配到 click | ADS 像素匹配率低 | 🟡 高 |
| **5** | **CAPI Token 過期或無效** | 所有像素事件失效 | 🔴 致命 |
| **6** | **錯誤被靜默吞掉**，無法發現問題 | 無法診斷 | 🟡 高 |
| **7** | `event_source_url` 與 Pixel 設定域名不匹配 | 事件匹配品質低 | 🟠 中 |
| **8** | `user_data` 不足（缺少 fbc/fbp） | 事件匹配品質低 | 🟠 中 |
| **9** | D1 查詢偶發性認證失敗 | 偶發性 ADS 像素失效 | 🟢 低 |
| **10** | `productPrefix` 為 null（tag 不在 TAG_PREFIX_MAP 中） | 只影響產品線前綴事件 | 🟢 低 |

---

## 五、建議排查步驟

1. **最優先**：確認所有 LINE 帳號的 Webhook URL 是否正確設定為 `https://n8n.bexnua.store/webhook/line-follow`（需登入 LINE Developers Console 逐一檢查）
2. **次優先**：在 money-page 中加入 BC 像素追蹤代碼（至少 PageView 和 CTA 點擊事件）
3. **第三**：驗證 CAPI Token 是否有效（可用 N8N 的 `CAPI Health Check` workflow 手動觸發）
4. **第四**：填充 `AD_MAP` 或確認 `MASTER_PIXEL_MAP` 覆蓋所有活躍 tag
5. **第五**：在 `sendBcEvent()` 和 N8N `Send CAPI` 中加入錯誤日誌
