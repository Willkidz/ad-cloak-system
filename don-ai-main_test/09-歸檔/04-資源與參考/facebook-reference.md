---
title: "Facebook 像素與 CAPI 知識"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Facebook 像素與 CAPI 知識"
type: "analysis"
tags: [changelog, facebook]
status: "archived"
---
---
title: "Facebook 像素與 CAPI 知識"
category: reference
priority: medium
applicable_tools: all
last_updated: "2026-03-27"
summary: "整理 Facebook Conversions API (CAPI) 的核心知識，包含 Token 權限設定、API 端點、事件參數、自訂事件規範及 Graph API 版本資訊。"
id: "20260325-101700"
type: concept
tags: ["facebook", "pixel", "capi", "graph-api"]
status: archived
created: "2026-03-25"
updated: "2026-03-27"

archived_reason: "已整合至 04-資源與參考/廣告投放與Meta_Facebook整合.md"
merged_into: "04-資源與參考/廣告投放與Meta_Facebook整合.md"
archived_date: "2026-03-28"---

# Facebook 像素與 CAPI 知識

本文件旨在整理 Facebook 像素 (Pixel) 與伺服器端轉換 API (Conversions API, CAPI) 的核心技術知識與實踐規範，以作為廣告投遞、數據追蹤與問題排查的統一參考，避免重複研究與資訊不一致的問題。

> **驗證狀態**：本文內容已於 2026-03-25 根據 Meta 官方開發者文件進行驗證。當前 Graph API 最新版本為 v25.0。

## CAPI (Conversions API) 核心概念

Conversions API 允許開發者從伺服器端直接發送用戶事件至 Facebook，作為瀏覽器端像素的補充或替代方案。此方法不依賴用戶瀏覽器的 Cookie，能更可靠地追蹤跨平台、跨裝置的用戶行為，例如從網站跳轉至 LINE 應用內的轉換事件。

### API 端點與版本

<example>
發送 CAPI 事件的標準端點如下：

```http
POST https://graph.facebook.com/v25.0/{pixel_id}/events
```

</example>

> **重要版本資訊**：
> - **建議版本**：為確保穩定性，建議始終採用 `v24.0` 或更新的 Graph API 版本。
> - **[已過期：v22.0 已於 2026-02-19 到期]**：舊版 API v18.0 雖仍可能運作，但應盡快升級。
> - **[已過期：Offline Conversions API 已於 2025-05 停用]**：所有離線事件現在都必須透過 Conversions API 進行發送。

### 必要參數

每次 API 請求都必須包含以下核心參數：

| 參數 | 說明 |
| :--- | :--- |
| `access_token` | 用於驗證身份的 CAPI Token，建議使用系統用戶 (System User) 生成的權杖。 |
| `data` | 一個 JSON 陣列，其中包含一或多個事件物件。每個物件需定義 `event_name`、`event_time`、`user_data` 及 `action_source`。 |

### 成功回應格式

請求成功後，API 會回傳如下格式的 JSON，確認收到的事件數量。

```json
{
  "events_received": 1,
  "messages": [],
  "fbtrace_id": "AFL-Qp2r...c7w"
}
```

## 權限管理與常見錯誤

### CAPI Token 權限設定

<rule id="fb-capi-permission">
**一個最關鍵且容易被忽略的規則是：新建立的像素 (Pixel) 不會自動繼承任何現有 CAPI Token 的權限。** 開發者必須手動在企業管理平台 (Business Manager) 中為該像素指派對應的系統用戶 (System User) 權限，否則 API 請求將會失敗。

若權限未正確設定，CAPI 將回傳 `400 Bad Request` 錯誤，並附帶 `(#100) Missing permissions` 的錯誤訊息，指出該 Token 無權對指定的像素發送事件。
</rule>

<step>
**權限指派標準流程**：
1.  登入 Facebook 企業管理平台，導航至「事件管理工具」。
2.  在左側選單選擇目標像素，進入「設定」分頁。
3.  在「Conversions API」區塊下，找到「透過 GTM 手動設定」或類似選項，點擊「產生存取權杖」。
4.  如果已有系統用戶和權杖，請在像素的「已連結資產」或「合作夥伴」中，將權限指派給對應的系統用戶。
</step>

### Token 共用策略

目前，所有產品線的像素（包含廣告專用的 ADS 像素和商業中心共用的 BC 像素）均共用同一個 CAPI Token。此 Token 作為環境變數儲存在 `line-redirect` Worker 中，嚴禁將其硬編碼於程式碼或寫入任何文件中。

## 像素與事件規範

### 像素類型劃分

| 類型 | 用途 | 數量 |
| :--- | :--- | :--- |
| **ADS 像素** | 每個獨立的產品線使用一個，專門用於廣告活動的成效追蹤與優化。 | 10 個 |
| **BC 像素** | 所有產品線共用一個全域像素，主要用於在商業中心 (Business Center) 進行跨產品線的數據匯總與分析。 | 1 個 (`940592681819066`) |

### 自訂事件命名規範

<rule id="fb-custom-event-naming">
為了同時滿足產品線獨立分析與全域數據匯總的需求，自訂事件採用 `{PREFIX}_{EventName}` 和 `ALL_{EventName}` 的雙發模式。

-   `{PREFIX}_{EventName}`：用於區分不同產品線的同類事件，例如 `AS_CompleteRegistration` 代表「爆分王」產品線的註冊完成事件。
-   `ALL_{EventName}`：用於將所有產品線的同類事件進行匯總，例如 `ALL_CompleteRegistration`。
-   標準事件：發送到 ADS 像素的事件應使用標準名稱，如 `CompleteRegistration`。

**範例**：當「爆分王 (AS)」產品線發生一次用戶註冊時，系統會同時發送三個事件：
1.  `AS_CompleteRegistration` (發送到 BC 像素)
2.  `ALL_CompleteRegistration` (發送到 BC 像素)
3.  `CompleteRegistration` (發送到該產品線的 ADS 像素)
</rule>

## Graph API 工具與資訊

### 版本發布週期

| 版本 | 發布日期 | 預計到期日期 |
| :--- | :--- | :--- |
| v25.0 | 2026-02-18 | TBD |
| v24.0 | 2025-10-08 | TBD |
| v23.0 | 2025-05-29 | TBD |
| v22.0 | 2025-01-21 | **[已到期]** |
| v21.0 | 2024-10-02 | TBD |
| v20.0 | 2024-05-21 | 2026-09-24 |

### 驗證 Token 有效性

<example>
可使用以下 Graph API 請求來驗證一個 CAPI Token 是否對特定像素擁有發送權限：

```http
GET https://graph.facebook.com/v25.0/{pixel_id}?access_token={token}
```

如果請求成功並回傳該像素的詳細資訊，則表示 Token 有效且權限正確。
</example>

## 近期重要變更

-   **[待確認] Viewers Metric 取代 Page Reach**：Meta 官方宣布計劃在 2026 年 6 月前，於 Graph API 中引入新的 `Page Viewer Metric` 指標，用以取代現有的 `Reach` 指標。此變更可能會影響所有依賴觸及率數據的報表 API，需密切關注官方更新。

## 結論

正確設定與使用 Facebook CAPI 是確保數據追蹤準確性的關鍵。核心要點包括：**嚴格遵守權限指派流程**，為每個新像素手動授權；**採用標準化的事件命名規範**，以利後續分析；並**持續關注 API 版本更新**，及時遷移至最新的穩定版本。忽略任何一個環節都可能導致數據遺失或錯誤，進而影響廣告成效評估與商業決策。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [待補充] | [待補充] |
