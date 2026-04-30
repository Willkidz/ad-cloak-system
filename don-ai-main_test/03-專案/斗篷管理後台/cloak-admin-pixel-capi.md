---
title: "像素綁定與 CAPI 設定"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-31"
summary: "定義 Facebook 像素 ID（ADS 獨立/BC 全域）、CAPI Token 權限、自訂事件（{PREFIX}_PageView/Contact/Purchase/CompleteRegistration）及前後端發送流程。"
version: "v1.0"
id: "20260325-pixel-capi"
type: spec
tags: [capi, cloak-admin, facebook, pixel]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件定義了「斗篷管理後台」的 Facebook 像素與 CAPI 追蹤架構。**ADS 像素**：每個 tag 獨立（如 `js/cs/ms/ls→1296143099239936` AS、`bf→2153779865162231` BF），由 n8n 發送標準 `CompleteRegistration`。**BC 像素**：全域共用（`940592681819066`），發送 `{PREFIX}_` 與 `ALL_` 雙版本自訂事件。**發送流程**：(1) 前端事件（PageView/Contact/Purchase）由 money-page JS 透過 `line-redirect` 的 `/bc-event` 端點轉發；(2) 後端事件（CompleteRegistration）由 n8n `Time Attribution` 工作流在 45 秒指紋匹配成功後發送。關鍵規則：新像素必須在 BM 指派「系統工作人員」權限，否則 CAPI 會回傳 400 錯誤。v1.10.2 曾成功補發 552 筆事件。

# 像素綁定與 CAPI 設定

> **驗證狀態**：2026-03-25 已驗證。像素 ID 和 CAPI Token 權限設定方式未變。Graph API 最新版本為 v25.0。

本文件詳細記錄了「斗篷管理後台」專案中，關於 Facebook 像素與 Conversions API (CAPI) 的所有設定、ID、權限、事件清單與技術流程。

---

## 一、ADS 像素（每個 Tag 獨立）

每個廣告活動（Tag）都使用獨立的 ADS 像素 ID，用於追蹤各自的轉換成效。

| Tag | ADS 像素 ID | 產品線 | PREFIX |
| :--- | :--- | :--- | :--- |
| js/cs/ms/ls | 1296143099239936 | 爆分王 | AS |
| jb/cb/mb/lb | 2030344604527767 | 莊家剋星 | AB |
| jx/cx/mx/lx | 4353746171539948 | 獨角仙 | AX |
| bf | 2153779865162231 | 博富 | BF |
| jd | 867887526267694 | — | JD |
| n14 | 3441258769365705 | — | N14 |
| n18 | 735170192897322 | — | N18 |
| n20 | 1339967038176681 | — | N20 |
| n22 | 962140406204890 | — | N22 |
| sz | 1701026614201171 | — | SZ |

---

## 二、BC 像素（全域共用）

BC (Business Center) 像素為全域共用，用於整合所有產品線的數據。

| 像素 ID | 狀態 | 備註 |
| :--- | :--- | :--- |
| 940592681819066 | 使用中 | v1.10.4 更新，需先在 BM 指派系統工作人員權限 |
| 783186198187359 | 已替換 | 舊 BC 像素 |

---

## 三、CAPI Token

所有像素共用同一個 Conversions API Token，該 Token 存放在 `line-redirect` Worker 的環境變數中。

**權限驗證紀錄**：
- ADS 像素 `1296143099239936`：Token 有效
- BC 像素 `940592681819066`：Token 有效（需先在 BM 指派權限）
- BC 像素 `783186198187359`（舊）：Token 有效

<rule id="capi-permission">

**重要規則**：新像素必須在 Facebook Business Manager 中，將權限指派給對應的「系統工作人員」，CAPI Token 才有權限發送事件。未指派權限會導致 API 回傳 400 錯誤（Missing perms）。

</rule>

---

## 四、自訂義事件清單

每個用戶行為都會觸發 `{PREFIX}` 版本和 `ALL` 版本兩筆事件，發送到 BC 像素。

| 事件名稱 | 觸發時機 | 觸發元件 |
| :--- | :--- | :--- |
| `{PREFIX}_PageView` / `ALL_PageView` | 用戶進入 money-page | money-page 前端 JS |
| `{PREFIX}_Contact` / `ALL_Contact` | 用戶點擊 CTA 按鈕 | money-page 前端 JS |
| `{PREFIX}_Purchase` / `ALL_Purchase` | 用戶點擊 CTA 按鈕 | money-page 前端 JS |
| `{PREFIX}_CompleteRegistration` / `ALL_CompleteRegistration` | 用戶加 LINE 好友 | N8N workflow CAPI |
| `{PREFIX}_Lead` / `ALL_Lead` | 用戶提交表單 | 目前無表單，未實作 |

<rule id="ads-pixel-event">

**ADS 像素**目前僅透過 N8N workflow 發送標準的 `CompleteRegistration` 事件。

</rule>

---

## 五、TAG_PREFIX_MAP 對應表

此表定義了 `tag` 與事件 `PREFIX` 的對應關係。

| Tag | PREFIX | 產品線 |
| :--- | :--- | :--- |
| js/cs/ms/ls | AS | 爆分王 |
| jb/cb/mb/lb | AB | 莊家剋星 |
| jx/cx/mx/lx | AX | 獨角仙 |
| bf | BF | 博富 |
| jd | JD | — |
| n20~n30 | N20~N30 | — |

---

## 六、CAPI 事件發送流程

### 前端事件 (money-page → BC 像素)

<step id="frontend-event-flow">

1. 用戶進入 money-page，前端 JS 觸發 `PageView` 事件。
2. 用戶點擊 CTA 按鈕，前端 JS 觸發 `Contact` 和 `Purchase` 事件。
3. JS 向 `line-redirect` 的 `/bc-event` 端點發送請求：`fetch(/bc-event?e={event}&t={tag})`。
4. `line-redirect` 服務器接收請求，並透過 Facebook Graph API 將事件發送到對應的 BC 像素：`POST /{pixel_id}/events`。

</step>

```text
用戶進入 money-page → JS 觸發 PageView
用戶點擊 CTA → JS 觸發 Contact + Purchase
→ fetch(/bc-event?e={event}&t={tag}) → line-redirect /bc-event 端點
→ Facebook Graph API POST /{pixel_id}/events
```

### 後端事件 (N8N → ADS + BC 像素)

<step id="backend-event-flow">

1. N8N 接收到 LINE follow webhook。
2. 執行 Time Attribution 流程，查詢 D1 `clicks` 表。
3. 進行 45 秒內的點擊指紋匹配。
4. 若匹配成功，準備 CAPI 事件。
5. 發送 CAPI 事件：
    - **ADS 像素**：發送 `CompleteRegistration` 標準事件。
    - **BC 像素**：發送 `{PREFIX}_CompleteRegistration` 和 `ALL_CompleteRegistration` 兩個自訂事件。

</step>

```text
LINE follow webhook → N8N Time Attribution
→ Query D1 clicks 表 → 45 秒指紋匹配
→ 匹配成功 → Prepare CAPI Events
→ Send CAPI：
  - ADS 像素：CompleteRegistration
  - BC 像素：{PREFIX}_CompleteRegistration + ALL_CompleteRegistration
```

---

## 七、歷史紀錄

### v1.10.2 補發紀錄

2026-03-25 曾手動補發 552 筆 CAPI 事件，成功率 100%。

| Tag | Matched Clicks | CAPI 事件數 | 對應像素 |
| :--- | :--- | :--- | :--- |
| js | 44 | 132 | 1296143099239936 (AS) |
| cs | 46 | 138 | 1296143099239936 (AS) |
| ms | 37 | 111 | 1296143099239936 (AS) |
| ls | 42 | 126 | 1296143099239936 (AS) |
| bf | 8 | 24 | 2153779865162231 (BF) |
| jb/cb/mb/lb | 7 | 21 | 2030344604527767 (AB) |
| **合計** | **184** | **552** | — |

---

## 結論

本文件提供了像素與 CAPI 設定的完整視圖，確保所有團隊成員對事件追蹤的架構有一致的理解。核心要點是：新像素需在 BM 後台手動授權，以及前端與後端事件有不同的觸發與發送流程。未來的維護應持續保持此文件的更新。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | N8N 工作流配置（含 CAPI 發送節點） |
| [cloak-admin-line-integration.md](cloak-admin-line-integration.md) | LINE OA 對應表與 Webhook 設定 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 斗篷管理後台靈魂文件 |
| [上帝視角 CAPI 現況](../上帝視角/godview-capi-current.md) | CAPI 發送現況分析 |

---
## 五、深度分析補充（2026-03-31 驗證）

### 5.1 像素來源路徑

火鳥系統的像素取得路徑為：line-redirect 主路由嘗試透過 `line_config.campaign_id → campaigns.ad_pixels` 查詢，但因 line_config 缺少 campaign_id 欄位而失敗（D1 報錯），隨後 fallback 到 N8N Config API 提供的 `MASTER_PIXEL_MAP`。此備用邏輯穩定運作中。

隱者系統的像素取得路徑設計為：shadow-cloak 查詢 `campaigns WHERE theme = hostname`，取得 `ad_pixels` 和 `bc_pixels`，轉換為 `{pixel, token, is_bc}` 格式後透過 `/track` 路由寫入 clicks 表。但因 campaigns 表為空，此路徑從未執行過。

### 5.2 AD_MAP 為空

N8N Config API 回傳的 `AD_MAP` 為空物件（0 筆），所有火鳥像素完全依賴 `MASTER_PIXEL_MAP`（19 筆）和全域 `BC_PIXEL`。

### 5.3 缺失像素的標籤

n21 在 `ad_config` 表完全無記錄，也不在 `MASTER_PIXEL_MAP` 中，導致 n21 的 7 筆點擊像素為空。其餘空像素點擊（cs: 47, ls: 43 等）為早期配置未完善時寫入的歷史資料。

### 5.4 TAG_PREFIX_MAP 覆蓋範圍

目前 MAP 包含：js/cs/ms/ls → AS、jb/cb/mb/lb → AB、jx/cx/mx/lx → AX、bf → BF、jd → JD、n20-n30 → N20-N30。**缺少 n14-n19**，需補齊。
