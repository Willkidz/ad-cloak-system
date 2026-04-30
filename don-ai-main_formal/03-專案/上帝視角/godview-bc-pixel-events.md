---
title: "BC 像素事件定義與回傳規範"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "定義上帝視角系統中 BC 像素的 4 類標準事件（PageView/Lead/CompleteRegistration/Purchase）的觸發時機、必填參數（fbc/fbp/external_id 等）、external_id 生成規則（LINE User ID 的 SHA-256）、action_source 統一為 website，以及 Lead 事件的雙像素發送機制（Worker BC 像素 + n8n 產品像素，不重複）。"
id: "20260328-godview-pixel-spec"
type: spec
tags: [attribution, capi, conversion, godview, pixel]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本規範定義了上帝視角系統中 BC 像素支持的 4 類標準事件及其回傳要求。**PageView**：落地頁載入時觸發，需 `fbp`/`ip`/`ua`，由 `pixel-chain.js` 前端發送。**Lead**：點擊「加好友」按鈕時觸發，需 `fbc`/`external_id`，採用雙像素機制——Worker 透過 `/bc-event` 路由發送 BC 像素的 Lead（含 `{產品}_Lead` 和 `ALL_Lead`），n8n 歸因成功後透過 CAPI 發送產品像素的 Lead，兩者不重複。**CompleteRegistration**：LINE 時間歸因成功後由 n8n 透過 CAPI 發送，需 `external_id`。**Purchase**：用戶完成首儲時觸發（選填），需 `value`/`currency`。所有事件的 `external_id` 必須使用 LINE User ID 的 SHA-256 雜湊值，`event_time` 為 Unix 時間戳（秒），`action_source` 統一為 `website`。

# BC 像素事件定義與回傳規範

## 事件體系概覽

上帝視角系統的像素事件體系對應用戶旅程的四個關鍵節點：瀏覽（PageView）→ 興趣（Lead）→ 轉化（CompleteRegistration）→ 付費（Purchase）。每個事件都有明確的觸發時機、必填參數與發送方式，確保 Meta 廣告後台能接收到完整且一致的轉化信號。

---

## 事件詳細定義

| 事件名稱 | 觸發時機 | 發送方式 | 必填 `user_data` | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **PageView** | 落地頁載入完成 | `pixel-chain.js` 前端 | `fbp`, `client_ip_address`, `client_user_agent` | 基礎流量統計，衡量廣告觸及量 |
| **Lead** | 點擊「加好友」按鈕 | Worker `/bc-event` + n8n CAPI（雙像素） | `fbc`, `external_id` | 核心轉化指標，衡量用戶興趣 |
| **CompleteRegistration** | LINE 歸因成功後 | n8n CAPI 回傳 | `external_id` | 深層轉化優化信號 |
| **Purchase** | 用戶完成首儲（選填） | n8n CAPI 回傳 | `value`, `currency` | ROI 計算依據 |

---

## Lead 事件的雙像素發送機制

<rule id="lead-dual-pixel">

Lead 事件是系統中最複雜的事件，涉及兩個獨立的發送路徑，但**不會產生重複**：

| 發送方 | 像素類型 | 觸發時機 | 事件內容 |
| :--- | :--- | :--- | :--- |
| **CF Worker** | BC 像素（商業中心） | 用戶點擊按鈕、Worker 處理跳轉時 | `{產品}_Lead`（如 `AS_Lead`）和 `ALL_Lead` |
| **n8n CAPI** | 產品像素（廣告帳號） | 時間歸因成功後 | 標準 `Lead` 事件，附帶完整 `user_data` |

Worker 發送的是 BC 層級的聚合統計事件，n8n 發送的是產品層級的精準歸因事件。兩者的 Pixel ID 不同，因此不會在任何像素上產生重複計數。

前端 `pixel-chain.js` 在按鈕點擊時**僅觸發 PageView**（若尚未觸發）和向 `/bc-event` 路由發送請求，**不會**直接透過前端 `fbq('track', 'Lead')` 發送 Lead 事件至產品像素。

</rule>

---

## 參數處理規範

<rule id="pixel-param-rules">

| 參數 | 規範 | 範例 |
| :--- | :--- | :--- |
| **external_id** | 必須使用 LINE User ID 進行 SHA-256 雜湊處理 | `SHA256("U1234567890abcdef")` → `a1b2c3d4...` |
| **event_time** | Unix 時間戳，單位為秒 | `1711036800` |
| **action_source** | 統一設定為 `website` | `"website"` |
| **fbc** | 格式為 `fb.1.{timestamp}.{fbclid}` | `fb.1.1711036800.AbCdEf...` |
| **fbp** | 格式為 `fb.1.{timestamp}.{random}` | `fb.1.1711036800.1234567890` |

</rule>

---

## 壓力測試結果 (2026-03-21)

以下為 2026-03-21 執行的高併發壓力測試結果，模擬廣告高峰期（20:00-23:00）流量模式：

| 事件類型 | 觸發時機 | 發送總數 | 成功數 | 失敗數 | 成功率 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PageView** | 落地頁載入完成 | 12,450 | 12,388 | 62 | 99.5% |
| **Lead** | 點擊「加好友」按鈕 | 1,200 | 1,176 | 24 | 98.0% |
| **Purchase** | 用戶完成首儲 | 85 | 85 | 0 | 100.0% |

### Lead 丟失根因分析

Lead 事件 2% 的丟失率（24 筆）經排查確認均發生在 **Android 原生瀏覽器**環境。具體機制：部分 Android 瀏覽器在用戶點擊連結時會觸發「預加載」（prefetch）行為，預加載請求會提前訪問目標 URL，導致 `fbclid` 參數在正式跳轉前被 Worker 消耗。

**修復方案**：在 `godview-bc-pixel-chain.js` 的點擊事件監聽器中加入 `event.isTrusted` 校驗，過濾非人工觸發的預加載請求。

---

## 結論

嚴格遵循本事件規範是實現精準歸因的前提。特別注意 Lead 事件的雙像素機制——任何修改都必須同時評估 Worker 端與 n8n 端的影響，避免產生重複發送或遺漏。新增事件類型必須經過技術組評審，確保其不會對現有 CAPI 流程造成干擾。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-capi-current.md`](godview-capi-current.md) | CAPI 現況分析，像素合併方案 |
| [`godview-bc-pixel-chain-js-analysis.md`](godview-bc-pixel-chain-js-analysis.md) | pixel-chain.js 邏輯分析，前端事件觸發機制 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱 |
| [`godview-pixels-analysis.md`](godview-pixels-analysis.md) | D1 `pixels` 欄位分析，像素合併寫入邏輯 |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | Worker `/bc-event` 路由邏輯 |
