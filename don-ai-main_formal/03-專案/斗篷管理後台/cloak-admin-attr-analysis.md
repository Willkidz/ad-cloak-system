---
title: "廣告歸因系統 Lead 事件回傳邏輯分析報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "分析 n8n Time Attribution workflow 與 Cloudflare Worker (`line-redirect`) 的代碼，釐清 Lead 事件在廣告歸因系統中的回傳邏輯與數據流向。"
version: "v1.0"
id: "20260329-cloak-admin-attr-analysis"
type: analysis
tags: [attribution, capi, cloak-admin, cloudflare-d1, cloudflare-workers, conversion]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告分析「上帝視角」歸因系統的核心邏輯。歸因由 LINE Webhook 觸發，在 **45 秒窗口**內匹配 D1 `clicks` 表中 `matched=0` 的記錄。匹配成功後，系統會將 `matched` 設為 1，並向 `pixels` 陣列中的**所有像素**（含官方與 BC 像素）發送 Meta CAPI `Lead` 事件。關鍵數據包含 `fbc`, `fbp` 與加密後的 `line_user_id`（作為 `external_id`）。

# 廣告歸因系統 Lead 事件回傳邏輯分析報告

本報告旨在深入分析 n8n 的 **Time Attribution workflow** 與 Cloudflare Worker (`line-redirect`) 的代碼，以釐清 `Lead` 事件在整個廣告歸因系統中的回傳邏輯與數據流向。

## Time Attribution Workflow 回傳邏輯

Time Attribution workflow 由 LINE 的 Webhook 觸發，負責處理用戶加入好友事件的歸因與回傳。

### 觸發與事件定義

<rule id="trigger-condition">
系統會檢查 Webhook 傳入的 `event_type`，只有當事件類型為 `follow`（即用戶加入好友或解除封鎖）時，才會觸發後續歸因邏輯。
</rule>

<rule id="event-name">
回傳給 Meta CAPI 的事件名稱固定為 `Lead`。
</rule>

### 匹配流程

確認為 `follow` 事件後，系統會執行以下匹配流程：

<step id="taw-match-1">
**查詢點擊記錄**：向 Cloudflare D1 數據庫查詢最近 **45 秒**內、目標為該 LINE OA ID 且尚未被匹配（`matched = 0`）的點擊記錄。
</step>

<step id="taw-match-2">
**指紋匹配**：從查詢結果中，篩選出時間窗口內的點擊，並按時間倒序排列，取最近的一筆作為匹配對象。
</step>

<step id="taw-match-3">
**標記匹配**：將該筆點擊記錄在 D1 數據庫中標記為已匹配（`matched = 1`），並記錄匹配時間與 LINE User ID。
</step>

### CAPI 回傳規格

在準備 CAPI 事件數據時，系統會從匹配到的點擊記錄中提取像素與用戶資訊。

<rule id="pixel-forwarding">
**回傳像素**：系統會遍歷點擊記錄中的 `pixels` 陣列。如果該陣列為空，但存在單一的 `pixel_id` 與 `capi_token`，則會將其加入陣列。此設計確保事件會發送給所有記錄在案的像素（包含廣告官方像素與 BC 像素）。
</rule>

<rule id="parameter-forwarding">
**回傳參數**：
- **基本資訊**：`event_time`（當前時間）、`event_source_url`（基於 `tag` 生成的 URL）、`action_source`（固定為 "website"）。
- **用戶數據 (user_data)**：包含 `client_ip_address`、`client_user_agent`、`fbc`、`fbp`。
- **加密數據**：將 `line_user_id` 作為 `external_id` 進行 SHA256 加密回傳。同時也會對 `ip_city`、`ip_region_code`、`ip_postal_code`、`ip_country` 進行加密回傳。
</rule>

## Cloudflare Worker (line-redirect) 邏輯

`line-redirect` Worker 負責處理點擊跳轉連結的請求，記錄點擊數據，並觸發初步的事件發送。

### 點擊記錄與 D1 寫入

<step id="cfw-d1-write">
當用戶點擊跳轉連結時，Worker 會提取 URL 參數（如 `a`, `fbclid`, `fbc`, `fbp` 等）與請求標頭（如 IP, User-Agent, Country 等），生成一個唯一的 `click_id` 與 `token`，並將這些資訊寫入 D1 數據庫的 `clicks` 表中。寫入的像素資訊包含 `pixel_id`（第一個像素）與 `pixels`（JSON 格式的所有像素陣列）。
</step>

### BC 像素 Lead 事件發送

<rule id="cfw-bc-pixel-lead">
Worker 中包含一段直接發送 `Lead` 事件給 BC 像素的邏輯。
- **觸發條件**：根據 `tag` 獲取到 `productPrefix`，且 User-Agent 不是機器人。
- **發送邏輯**：調用 `sendBcEvent` 函數，發送名為 `Lead` 的事件。
- **使用的像素**：使用的是代碼中寫死的常量 `BC_PIXEL`。 **[已過期：目前 BC 像素已改為從 Config API 動態讀取，此處邏輯可能未更新]**
</rule>

## 綜合分析與結論

1.  **歸因精準度**：系統依賴 45 秒窗口進行時間歸因。在高併發情況下，若多個用戶在同一秒內點擊，可能會發生歸因錯誤。
2.  **像素覆蓋**：Time Attribution workflow 會向 D1 中 `pixels` 陣列的所有像素發送事件，這解決了多像素同步回傳的問題。
3.  **BC 像素風險**：Worker 中寫死的 `BC_PIXEL` 與 Config API 動態讀取的邏輯存在衝突，可能導致重複發送或發送至舊像素。

## 建議修復方案

<step id="fix-1">**統一像素來源**：移除 Worker 中寫死的 `BC_PIXEL`，統一由 Config API 獲取並寫入 D1 `pixels` 欄位。</step>
<step id="fix-2">**優化歸因窗口**：評估將 45 秒窗口縮短或引入更精確的指紋（如 `visitor_id`）以減少高併發下的誤判。</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | n8n 工作流節點詳解 |
| [cloak-admin-system-check-analysis.md](cloak-admin-system-check-analysis.md) | BC 像素與 fbclid 修復報告 |
