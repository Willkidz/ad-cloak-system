---
title: "Worker 程式碼分析筆記 (Worker Code Log)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 Worker 程式碼的關鍵邏輯，包括設定來源、備援對應、核心流程與廣告追蹤設定，並探討 project 欄位在不同事件中的歧義。"
id: "20260325-024356"
type: "project-doc"
tags: [analysis, cloudflare-workers, configuration, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本筆記記錄了 `line-redirect` Worker 的核心技術細節。關鍵點：(1) 配置來源：優先從 `CONFIG_API_URL` 獲取，失敗時啟用硬編碼的 `FALLBACK_LINE_MAP`（涵蓋 AS/AB/AX/BF/JD/N 系列）；(2) 核心流程：判斷子域名 `tag` → 獲取 `code` → 生成 5 碼 `token` → 發送 Webhook → 跳轉至帶 `token` 的 `oaMessage` 連結；(3) 數據歧義：`godview_events` 中的 `project` 欄位在一般事件中存 `code`，但在 `token_matched` 事件中存 `ad_code`，統計時需特別注意格式對齊。

# Worker 程式碼分析筆記

本文檔旨在分析 Worker 程式碼的核心邏輯與關鍵設定，以利於後續的維護與開發。

---

## 設定來源

<rule id="config-source">
系統設定主要透過 API 獲取，並包含一個硬編碼的備援機制。
</rule>

- **主要設定 API**: `CONFIG_API_URL`
  ```
  https://godview.app.n8n.cloud/webhook/get-config
  ```
- **Token 映射 API**: `N8N_WEBHOOK_TOKEN`
  ```
  https://godview.app.n8n.cloud/webhook/token-mapping
  ```
- **備援機制**: 若 API 請求失敗，系統將啟用寫死在程式碼中的 `FALLBACK_LINE_MAP` 作為備援。

---

## 備援 LINE 帳號對應

`FALLBACK_LINE_MAP` 是一個將子域名對應到特定 LINE 官方帳號的硬編碼物件。這確保了在主要設定服務不可用時，流量仍能被導向正確的 LINE 帳號。

| 子域名 Tag | LINE ID     | 說明                     |
| :---       | :---        | :---                     |
| `cx`       | `@697jsdma` | 獨角仙AI算牌系統, C      |
| `jx`       | `@652ahjmy` | 獨角仙AI算牌程式, J      |
| `lx`       | `@128hxyvp` | 獨角仙AI預測程式, L      |
| `mx`       | `@525euwsy` | 獨角仙AI預測系統, M      |
| `cs`       | `@999hqlmk` | 爆分王-電子訊號程式, C   |
| `js`       | `@935bicyi` | 爆分王-電子打法秘笈, J   |
| `ls`       | `@849rldxt` | 爆分王-24H訊號打法, L    |
| `ms`       | `@001qlmgf` | 爆分王-電子打法訊號, M   |
| `bf`       | `@678eohsd` | 博富 BOFU, -             |
| `cb`       | `@bn56`     | 莊家剋星-百家殺手, C     |
| `jb`       | `@448nzdkf` | 莊家剋星-百家專家, J     |
| `lb`       | `@bn58`     | 莊家剋星-百家GPT, L      |
| `mb`       | `@734xzzse` | 莊家剋星-百家打莊姬, M   |
| `jd`       | `@520ufhmw` | 兩斤炭吉, J              |
| `n14`~`n22` | *多個*      | 各種獨立帳號             |

---

## 核心執行流程

<step id="worker-core-flow">

1.  **判斷導向**：根據使用者來源的子域名 `tag`，決定要將使用者導向哪一個 LINE 官方帳號。
2.  **取得參數**：從 URL 的查詢字串 (query string) 中獲取 `code` 參數。
3.  **生成 Token**：系統會生成一組隨機的 5 位數 `token`。
4.  **發送 Webhook**：將 `token` 與對應的 `code` 資訊發送到 n8n 的 Webhook 進行記錄與後續處理。
5.  **準備預設訊息**：生成一則包含 `token` 的預設訊息，格式為 `"我要領取專屬優惠 #{token}"`。
6.  **重導向**：將使用者重導向至對應的 LINE 加好友頁面，並自動帶入上述的預設訊息，簡化使用者操作。

</step>

---

## 廣告追蹤設定

<rule id="ad-tracking">
系統透過 `ad_config` 查詢來獲取 Facebook 廣告追蹤所需的 `pixel_id` 和 `capi_token`。
</rule>

- **查詢來源**: `AD_MAP` (來自 `config.AD_MAP`)。
- **查詢鍵值**: 使用從 URL 取得的 `code` 作為 key 來查詢對應的廣告設定。

---

## `godview_events` 中的 `project` 欄位

<rule id="project-field-usage">
在 `godview_events` 資料庫中，`project` 欄位的具體含義取決於事件類型，這在進行數據統計時需要特別注意。
</rule>

- **一般事件**: `project` 欄位儲存的是 `code` 值（例如 "01", "X"）。
- **`token_matched` 事件**: `project` 欄位儲存的是 `ad_code`。
- **數據統計應用**: 在 `Calculate Stats` 腳本中，會對 `evt.project` 進行 `padStart(2, '0')` 處理，以確保格式一致性，使其能與 `code` 進行匹配。

---

## 結論

此 Worker 的核心功能是作為一個流量歸因與導向的中介層。它根據來源子域名和 `code` 參數，將使用者導向指定的 LINE 帳號，同時透過 Webhook 和 `ad_config` 完成數據記錄與廣告成效追蹤。`project` 欄位在不同事件中的歧義是數據分析時需要特別留意的技術細節。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-worker-analysis.md`](./godview-worker-analysis.md) | Worker 程式碼邏輯深度分析 |
| [`godview-time-attr-spec.md`](./godview-time-attr-spec.md) | 時間歸因方案設計文件 |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | 系統設計分析 |
| [`godview-tag-mapping.md`](./godview-tag-mapping.md) | 完整 TAG 對照表 |
