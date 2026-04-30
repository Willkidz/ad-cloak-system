---
title: "廣告日誌頁面優化"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "優化斗篷管理後台的「廣告日誌」頁面，對齊火鳥廣告系統的日誌格式與數據顯示邏輯，並提供前端實作程式碼與部署指令。"
version: "v1.0"
id: "20260328-ad-log-opt"
type: log
tags: [cloak-admin, firebird, frontend, react, reporting, ui-ux]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件指導技術組優化「廣告日誌」頁面，使其對齊**火鳥廣告系統**標準。核心改動包含：**訪問來源顯示**（若 `domain` 為 null 則顯示「火鳥」）、**狀態標籤**（`allowed` 為綠色「訪問日誌」，`blocked` 為紅色「斗篷攞截」）、**攔截原因翻譯**（如 `geo_filter_US` 轉為「國家過濾::US」）。頁面需支援 5 個 Tab 過濾（全部、訪問、按鈕點擊、安全內頁點擊、斗篷攔截）與 20 筆分頁。

# 廣告日誌頁面優化

## 任務目標

本文件旨在指導技術組優化斗篷管理後台的「廣告日誌」頁面，使其顯示邏輯與功能對齊火鳥廣告系統的日誌標準。請技術組依據本文件內容，直接執行前端頁面的修改與部署。

## 前端修改需求

**目標檔案**: `cloak-admin-frontend/src/pages/Logs.tsx`

### 顯示邏輯與格式

<rule id="display-logic">
- **訪問來源顯示**:
    - **有 `domain` 值**: 第一行顯示 `domain`，第二行顯示 `path`。
    - **無 `domain` 值**: 第一行顯示「火鳥」，第二行顯示 `path`。
    > [注意] 目前資料庫中 `domain` 欄位皆為 `null`，因此現階段所有日誌都會顯示「火鳥」，此為預期行為。
- **欄位格式對齊**:
    - **國家/訪問IP**: 分兩行顯示，第一行國家代碼，第二行 IP 位址。
    - **訪客ID**: 顯示完整 `visitor_id`，若為 `null` 則顯示 `-`。
    - **語言**: 顯示完整 `language` 字串，若為 `null` 則顯示 `-`。
    - **設備(UA)**: 顯示完整 `ua` 字串。
    - **狀態**: `verdict === 'allowed'` 顯示綠色「訪問日誌」；`verdict === 'blocked'` 顯示紅色「斗篷攞截」。
    - **日誌(攔截原因)**: 顯示 `reason` 並進行中文轉換（例如 `geo_filter_US` 轉換為「國家過濾::US」）。
</rule>

### 功能需求

<rule id="feature-requirements">
- **Tab 過濾邏輯**:
    - **全部日誌**: 顯示所有數據。
    - **訪問日誌**: 過濾 `verdict === 'allowed'`。
    - **按鈕點擊**: 過濾 `reason` 包含 `button_click`。
    - **安全內頁點擊**: 過濾 `reason` 包含 `safe_page_click`。
    - **斗篷攞截**: 過濾 `verdict === 'blocked'`。
- **核心功能**:
    - **搜索**: 支援 IP 或域名關鍵字搜索。
    - **分頁**: 每頁顯示 20 筆，支援上下頁切換。
    - **刷新**: 提供刷新按鈕，點擊後重新獲取數據。
</rule>

## 核心實作邏輯 (React)

<step id="impl-1">
**狀態與過濾實作**：
使用 `useState` 管理 `activeTab`，並在 `filteredLogs` 中根據 `verdict` 與 `reason` 進行過濾。
<example>
```tsx
const filteredLogs = logs.filter(log => {
  switch (activeTab) {
    case 'visit': return log.verdict === 'allowed';
    case 'button': return log.reason?.includes('button_click');
    case 'safe_page': return log.reason?.includes('safe_page_click');
    case 'cloak': return log.verdict === 'blocked';
    default: return true;
  }
});
```
</example>
</step>

<step id="impl-2">
**原因翻譯實作**：
建立 `translateReason` 函數處理 `geo_filter_` 與 `blocked_asn_` 前綴。
<example>
```tsx
const translateReason = (reason: string) => {
  if (reason.startsWith('geo_filter_')) return `國家過濾::${reason.replace('geo_filter_', '')}`;
  if (reason.startsWith('blocked_asn_')) return `ASN黑名單::${reason.replace('blocked_asn_', '')}`;
  return reason === 'valid_traffic' ? '有效流量' : reason;
};
```
</example>
</step>

## 驗收標準

<step id="verify-1">1. 驗證 `domain` 為 null 時，表格第一列是否正確顯示「火鳥」。</step>
<step id="verify-2">2. 測試「按鈕點擊」Tab 是否能正確過濾出 `reason` 包含 `button_click` 的記錄。</step>
<step id="verify-3">3. 檢查表格在 1200px 以下是否出現水平滾動條，確保「狀態」列不被遮擋。</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | UI 設計規範 |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | API 技術規格 |
