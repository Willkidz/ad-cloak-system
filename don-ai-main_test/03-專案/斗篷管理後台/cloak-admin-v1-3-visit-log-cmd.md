---
title: "修改指令 v1.3 — 訪問日誌頁面（廣告日誌）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "重寫「廣告日誌」頁面，目標要求介面、顏色、風格、大小需完全對齊「火鳥廣告系統」。此重構包含 5 個頁籤（Tabs）、9 欄位的表格、分頁功能、搜索功能以及刷新按鈕。"
version: "v1.0"
id: "20260325-v1-3-visit-log"
type: cmd
tags: [api, cloak-admin, firebird, frontend, react, reporting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令定義了「廣告日誌」頁面的全面重構規範，旨在將介面、風格與功能完全對齊「火鳥廣告系統」。核心內容包括：(1) **5 個頁籤 (Tabs)**：全部、訪問、按鈕點擊、安全內頁點擊、斗篷攔截；(2) **9 欄位表格**：包含序號、訪問時間、域名/來源、國家/IP、訪客ID、語言、設備(UA)、狀態、攔截原因；(3) **狀態標籤**：對齊火鳥配色（紅色攔截、綠色訪問）；(4) **中文轉換**：將後端 `reason` 轉換為易讀的中文說明。目前 `cloak_logs` 表已有 2323 筆真實攔截數據。

# 修改指令 v1.3 — 訪問日誌頁面（廣告日誌）

> **規劃組**：A 規劃組  
> **版本**：v1.3  
> **搭配使用**：通用環境指令-斗篷後台.md  

---

## 一、目標

重寫「廣告日誌」頁面，目標要求介面、顏色、風格、大小需完全對齊「火鳥廣告系統」。此重構包含 5 個頁籤（Tabs）、9 欄位的表格、分頁功能、搜索功能以及刷新按鈕。

---

## 二、現有數據說明

`cloak_logs` 資料表記錄了 **2323 筆**真實數據，目前所有記錄的 `verdict` 均為 `blocked`（表示被斗篷系統攞截），尚無 `allowed`（表示通過）的記錄。

### 2.1 攔截原因 (Reason) 分佈範例
- **地理位置攔截**: `geo_filter_FR` (2154 筆), `geo_filter_US` (80 筆)。
- **ASN 攔截**: `blocked_asn_8075` (6 筆), `blocked_asn_15169` (4 筆)。

### 2.2 欄位狀態
以下欄位目前在資料庫中皆為 `null`，需確認其用途及未來是否會寫入資料：`domain`、`visitor_id`、`language`。**注意：若 `domain` 為 null，前端應顯示為「火鳥」。**

---

## 三、頁籤篩選邏輯

<rule id="tab-filtering">

| Tab 名稱 | 篩選條件 | 說明 |
| :--- | :--- | :--- |
| **全部日誌** | 不篩選 | 顯示所有記錄。 |
| **訪問日誌** | `verdict = 'allowed'` | 通過斗篷的真實訪問（目前 0 筆）。 |
| **按鈕點擊** | `reason = 'button_click'` | 數據來源為火鳥系統，目前預留。 |
| **安全內頁點擊** | `reason = 'safe_page_click'` | 同上，目前預留。 |
| **斗篷攞截** | `verdict = 'blocked'` | 被攞截的訪問（目前 2323 筆）。 |

</rule>

---

## 四、表格欄位定義 (9 欄，對齊火鳥)

<rule id="table-columns">

| # | 表頭文字 | 寬度 | 數據來源 | 顯示方式 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **序號** | 60px | 前端計算 | `(page - 1) * pageSize + index + 1` |
| 2 | **訪問時間** | 160px | `timestamp` | 格式化為 `YYYY-MM-DD HH:mm:ss` |
| 3 | **訪問域名/來源** | 180px | `domain` + `path` | 第一行顯示域名（null 則顯示「火鳥」），第二行小字灰色顯示 path |
| 4 | **國家/訪問IP** | 130px | `country` + `ip` | 第一行粗體顯示國家代碼，第二行小字灰色顯示 IP |
| 5 | **訪客ID** | 160px | `visitor_id` | 若為 null 則顯示 `-`，文字過長時可截斷 |
| 6 | **語言** | 80px | `language` | 若為 null 則顯示 `-` |
| 7 | **設備(UA)** | 200px | `ua` | 截斷顯示，滑鼠懸停時以 Tooltip 顯示完整 UA |
| 8 | **狀態** | 90px | `verdict` | 參照狀態標籤樣式規則 |
| 9 | **日誌(原因)** | auto | `reason` | 參照攔截原因轉換規則 |

</rule>

---

## 五、狀態標籤樣式 (對齊火鳥配色)

<rule id="status-styles">

統一樣式：`inline-block px-2 py-0.5 text-xs rounded border`

- **verdict = 'blocked'**: 文字「斗篷攞截」 (紅色: `bg-red-100 text-red-600 border-red-200`)
- **verdict = 'allowed'**: 文字「訪問日誌」 (綠色: `bg-green-100 text-green-600 border-green-200`)
- **按鈕點擊 Tab**: 文字「按鈕點擊」 (綠色: `bg-green-100 text-green-600 border-green-200`)
- **安全內頁點擊 Tab**: 文字「安全內頁點」 (紅色: `bg-red-100 text-red-600 border-red-200`)

</rule>

---

## 六、攔截原因中文轉換

<example id="reason-translation">

```typescript
function translateReason(reason: string): string {
  if (!reason) return '-';
  if (reason.startsWith('geo_filter_')) {
    const code = reason.replace('geo_filter_', '');
    return `瀏覽器語言不允許:${code}`;
  }
  if (reason.startsWith('blocked_asn_')) {
    const asn = reason.replace('blocked_asn_', '');
    return `ASN黑名單攔截:${asn}`;
  }
  if (reason === 'bot_detected') return '機器人檢測攔截';
  if (reason === 'vpn_detected') return 'VPN/代理IP攔截';
  if (reason === 'language_filter') return '瀏覽器語言不允許';
  return reason;
}
```

</example>

---

## 七、前端實作參考

<step id="frontend-implementation">
修改 `src/pages/Logs/index.tsx`，整合 `useCallback` 處理 API 請求，並實作分頁與搜尋邏輯。確保在寬度低於 1200px 時出現水平滾動條。
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-b-team-v1-8-ad-log.md](cloak-admin-b-team-v1-8-ad-log.md) | 廣告日誌優化與篩選邏輯 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範與設計 Token |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
