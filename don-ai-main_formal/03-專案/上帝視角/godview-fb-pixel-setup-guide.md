---
title: "Facebook 像素 (Pixel) 與 CAPI 設定指南"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "提供在「上帝視角」系統中設定 Meta 像素與轉換 API (CAPI) 的標準流程，涵蓋像素創建、進階比對配置、CAPI Token 獲取及 n8n ad_config 表的對接規範。"
id: "20260328-godview-fb-pixel-guide"
type: guide
tags: [advertising, capi, godview, pixel]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本指南是廣告技術人員的 SOP。它詳細說明了如何在 Meta 商業管理員中創建像素，並強調了必須開啟「自動進階比對」功能以提升歸因成功率。指南提供了獲取 CAPI 存取權杖（Access Token）的具體步驟，這是確保「上帝視角」後端（n8n）能成功回傳 `Lead` 轉化數據至 Meta 的關鍵前提。

# Facebook 像素 (Pixel) 與 CAPI 設定指南

## 像素創建流程

為確保數據追蹤的準確性，請嚴格遵循以下步驟：

---

## 標準設定步驟

<step id="pixel-setup-1">

**1. 創建數據源**：進入 Meta 事件管理員，選擇「連結數據源」→「網頁」，輸入像素名稱並創建。

</step>

<step id="pixel-setup-2">

**2. 開啟進階比對**：在像素設定頁面，務必開啟「自動進階比對」，這能顯著提升 CAPI 的匹配率。

</step>

<step id="pixel-setup-3">

**3. 獲取 CAPI Token**：在「設定」標籤下找到「轉換 API」，點擊「立即開始」並生成存取權杖 (Access Token)。

</step>

---

## 關鍵參數核對與系統對接

<rule id="pixel-config-rule">

獲取參數後，必須將其填入 n8n 的 `ad_config` DataTable 中，系統才能正確調用。

| 參數名稱 | 格式範例 | 填寫位置 | 說明 |
| :--- | :--- | :--- | :--- |
| **Pixel ID** | `943527751701905` | `ad_config` -> `pixel_id` | 15-16 位數字。 |
| **CAPI Token** | `EAAG...` (長字串) | `ad_config` -> `capi_token` | 具有高權限，請妥善保管。 |
| **測試事件代碼** | `TEST12345` | n8n 測試節點 | 用於實時查看回傳結果。 |

</rule>

---

## 測試與驗證

<step id="pixel-verification">

1. **事件管理員測試**：使用「測試事件」功能，輸入落地頁 URL。
2. **觸發 PageView**：確認 `PageView` 事件在管理員介面即時出現。
3. **觸發 Lead**：模擬加好友流程，確認 n8n 成功觸發 CAPI 並在管理員介面顯示 `Lead` 事件。

</step>

---

## 結論

正確的像素設定是歸因系統的靈魂。完成設定後，請務必確認 `ad_config` 中的記錄與實際像素 ID 一致，避免因「配置污染」導致 Lead 事件缺失。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-bc-pixel-events.md`](godview-bc-pixel-events.md) | BC 像素事件規範 |
| [`godview-capi-current.md`](godview-capi-current.md) | CAPI 現況分析 |
| [`godview-diagnosis.md`](godview-diagnosis.md) | CAPI Lead 事件缺失診斷報告 |
