---
title: "火鳥廣告日誌 UI 截圖重點記錄"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "火鳥日誌 UI 的五個分頁（全部215條/訪問11條/按鈕點擊8條/安全內頁6條/斗篷攔截190條）數據特徵，以及與內部 cloak_logs verdict 欄位的對應規則。"
id: "20260328-firebird-ui-log"
type: "log"
tags: [cloaking, firebird, godview, ui-ux]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 火鳥日誌 UI 包含五個分頁：全部日誌（215 條）、訪問日誌（11 條，綠色標籤，主要來自 TW）、按鈕點擊（8 條，綠色，記錄跳轉至 `mx.freshpathlab.com` 的詳情）、安全內頁點擊（6 條，紅色，含 Googlebot 記錄）、斗篷攔截（190 條，紅色，攔截原因如「瀏覽器語言不允許:en-US,en」）。與內部 `cloak_logs` 的對應：`verdict=blocked` → 斗篷攞截、`verdict=allowed` → 訪問日誌/全部日誌。但「按鈕點擊」和「安全內頁點擊」在我方日誌中無直接對應，且 `domain` 欄位多為 `null`，是數據整合的已知差距。

# 火鳥廣告日誌 UI 截圖重點記錄

本文檔根據 UI 截圖，記錄並分析了火鳥（Firebird）廣告日誌系統的介面佈局與各類日誌的數據特點。

---

## 整體介面佈局

- **導航**: 頁面頂部提供「← 返回」按鈕。
- **核心功能**: 
    - 介面包含五個主要日誌分頁：全部日誌、訪問日誌、按鈕點擊、安全內頁點擊、斗篷攔截。
    - 右上角提供手動刷新按鈕。
    - [待確認] 當前版本未提供搜索功能。
- **分頁**: 列表底部具備分頁功能，顯示總記錄數，並可選擇每頁顯示的條數。

---

## 表格欄位結構

所有日誌列表均採用統一的表格格式，欄位如下：

| 序號 | 訪問時間 | 訪問域名/訪問來源 | 國家/訪問IP | 訪客ID | 語言 | 設備 | 狀態 | 日誌 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

---

## 各分頁數據特徵

### 全部日誌 (All Logs)

- **數據量**: 215 條
- **特徵**: 
    - 包含被「斗篷攔截」的記錄，狀態標籤為紅色。
    - 日誌內容範例：「瀏覽器語言不允許:en-US,en」。

### 訪問日誌 (Visit Logs)

- **數據量**: 11 條
- **特徵**: 
    - 狀態標籤為綠色的「訪問日誌」。
    - 日誌欄位通常為空白。
    - 記錄主要來自台灣 (TW)。

### 按鈕點擊 (Button Clicks)

- **數據量**: 8 條
- **特徵**: 
    - 狀態標籤為綠色的「按鈕點擊」。
    - 日誌內容記錄了跳轉詳情，<example id="button-click-log">例如：「鏈接跳轉成功:https://mx.freshpathlab.com/?a=MX10」。</example>
    - 「訪問來源」欄位會顯示完整的來源 URL。

### 安全內頁點擊 (Safe Page Clicks)

- **數據量**: 6 條
- **特徵**: 
    - 狀態標籤為紅色的「安全內頁點」。
    - 日誌內容範例：「安全頁面[]」。
    - 包含來自 Googlebot User-Agent 的記錄。

### 斗篷攔截 (Cloak Interceptions)

- **數據量**: 190 條
- **特徵**: 
    - 狀態標籤為紅色的「斗篷攔截」。
    - 日誌內容主要記錄攔截原因，<example id="cloak-intercept-log">例如：「瀏覽器語言不允許:xxx」。</example>
    - 包含大量來自不同國家的攔截記錄。

---

## 狀態標籤顏色規則

| 顏色 | 含義 | 對應分頁 |
| :--- | :--- | :--- |
| **綠色背景** | 安全或成功的操作 | 訪問日誌、按鈕點擊 |
| **紅色背景** | 攔截或需注意的操作 | 斗篷攔截、安全內頁點擊 |

---

## 與內部 `cloak_logs` 數據對應規則

<rule id="verdict-blocked">`verdict=blocked` → 對應 **斗篷攞截** 分頁。</rule>
<rule id="verdict-allowed">`verdict=allowed` → 對應 **訪問日誌** 分頁，並顯示在 **全部日誌** 中。</rule>
<rule id="unmatched-clicks">[待確認] **按鈕點擊** 的日誌由火鳥系統自身記錄，我們目前沒有對應的 `cloak_logs` 記錄。</rule>
<rule id="unmatched-safe-page">[待確認] **安全內頁點擊** 同樣在我們的日誌中沒有直接對應項。</rule>
<rule id="domain-null">[待確認] 我們的 `cloak_logs` 中 `domain` 欄位大部分為 `null`，與火鳥系統的顯示存在差異。</rule>

---

## 結論

火鳥日誌 UI 透過明確的分類和顏色標籤，提供了直觀的日誌審查介面。然而，其日誌分類與我們內部的 `cloak_logs` 數據並非完全一對一對應，特別是在「按鈕點擊」、「安全內頁點擊」以及 `domain` 欄位的記錄上存在顯著差異，這些是後續數據整合或比對時需要關注的重點。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-firebird-complete-analysis.md](godview-firebird-complete-analysis.md) | 火鳥系統完整分析 |
| [godview-firebird-page-analysis.md](godview-firebird-page-analysis.md) | 落地頁源碼分析 |
| ~~godview-cloak-log-schema.md~~ | cloak_logs 數據結構（文件不存在，相關資訊請參考 `07-配置與環境/` 下的 D1 表結構文件） |
