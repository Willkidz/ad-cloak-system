---
title: "廣告列表欄位規範"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "定義斗篷管理後台廣告列表的欄位結構、顯示邏輯、分組方式及響應式設計，以確保數據呈現的準確性與用戶體驗的一致性。"
version: "v1.0"
id: "20260327-adlist-001"
type: guide
tags: [advertising, cloak-admin, cloudflare-d1, reporting, ui-ux]
status: active
created: "2026-03-27"
updated: "2026-03-29"
---
> **TL;DR**: 本文件定義廣告列表的 11 個核心欄位與顯示邏輯。核心指標包含：**瀏覽數**（`cloak_logs` 中 `verdict='allowed'` 且按 `visitor_id` 去重）、**按鈕點擊**（`clicks` 表中 `is_bot=0` 且按 `user_id` 去重）、**歸因數**（`clicks` 表中 `matched=1`）。計算指標 **CTR** 為 `點擊/瀏覽`，**CVR** 為 `歸因/點擊`。所有指標需處理分母為零的情況，並支援 5 分鐘緩存與手動刷新。

# 廣告列表欄位規範

## 總覽

本文件旨在定義「斗篷管理後台（cloak-admin）」核心頁面——廣告列表的欄位結構、顯示邏輯、分組方式及相關互動規範。統一的標準有助於提升數據可讀性與用戶體驗的一致性。

## 欄位清單

此處定義了廣告列表中必須展示的 11 個核心欄位。

| 序號 | 欄位名稱 | 英文名 | 數據來源 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 廣告名稱 | name | campaigns | 廣告的中文名稱 |
| 2 | 短鏈代碼 | short_code | campaigns | 用於生成短鏈的唯一代碼，可複製 |
| 3 | 素材代碼 | ad_code | line_config | 廣告活動所使用的素材代碼 |
| 4 | 落地頁名稱 | landing_page | campaigns | 訪客點擊廣告後到達的頁面 |
| 5 | 安全頁名稱 | safe_page | campaigns | 用於審核或非目標流量的頁面 |
| 6 | 瀏覽數 | impressions | cloak_logs | 經系統過濾後的真實不重複訪客數 |
| 7 | 按鈕點擊 | clicks | clicks | 真實用戶（非機器人）的按鈕點擊數 |
| 8 | 歸因數 | attributed | clicks | 成功歸因至 LINE 的有效點擊數 |
| 9 | 按鈕率 | ctr | 計算 | `按鈕點擊 / 瀏覽數` |
| 10 | 轉化率 | cvr | 計算 | `歸因數 / 按鈕點擊` |
| 11 | 操作 | actions | UI | 包含編輯、刪除、查看日誌等功能 |

## 核心指標計算邏輯

<rule id="metrics-logic">

為確保數據準確性，後端 API 在計算指標時必須遵循以下 SQL 邏輯：

- **瀏覽數 (Impressions)**:
  ```sql
  SELECT COUNT(DISTINCT visitor_id) FROM cloak_logs 
  WHERE verdict = 'allowed' AND campaign_id = ? AND timestamp BETWEEN ? AND ?
  ```
- **按鈕點擊 (Clicks)**:
  ```sql
  SELECT COUNT(DISTINCT user_id) FROM clicks 
  WHERE is_bot = 0 AND campaign_id = ? AND timestamp BETWEEN ? AND ?
  ```
- **歸因數 (Attributed)**:
  ```sql
  SELECT COUNT(*) FROM clicks 
  WHERE matched = 1 AND campaign_id = ? AND timestamp BETWEEN ? AND ?
  ```

</rule>

## 欄位顯示規則

<rule id="ad-name">
### 廣告名稱
- **顯示內容**：廣告的中文名稱。
- **寬度**：200px。
- **對齊**：左對齊。
- **可操作性**：可點擊進入廣告詳情頁。
</rule>

<rule id="short-code">
### 短鏈代碼
- **顯示內容**：短鏈代碼（例如：`bf`, `js`, `cs`）。
- **寬度**：100px。
- **對齊**：居中。
- **可操作性**：點擊可複製完整短鏈 URL（例如：`https://bf.go2line.cc`），並顯示「已複製」提示。
</rule>

<rule id="metrics-display">
### 核心指標（瀏覽數、按鈕點擊、歸因數）
- **顯示內容**：整數。
- **寬度**：各 100px。
- **對齊**：右對齊。
- **無數據**：顯示「-」。
- **可排序**：是。
</rule>

<rule id="ctr-cvr-display">
### 計算指標（按鈕率、轉化率）
- **顯示內容**：百分比，保留 1 位小數（例如：`30.0%`, `45.5%`）。
- **寬度**：各 100px。
- **對齊**：右對齊。
- **無數據**：顯示「-」。
- **計算公式**：
  - **按鈕率**：`(按鈕點擊 / 瀏覽數) × 100%`
  - **轉化率**：`(歸因數 / 按鈕點擊) × 100%`
- **異常處理**：若分母為 0，顯示「-」。
</rule>

## 數據更新策略

<rule id="data-refresh">
- **更新頻率**：頁面首次載入時自動獲取最新數據。用戶可通過「刷新」按鈕手動更新。
- **數據緩存**：為提升性能，數據緩存 5 分鐘。用戶可按 `F5` 或點擊「刷新」按鈕強制清除緩存並獲取最新數據。
</rule>

## 部署檢查清單

<step id="check-metrics">1. 驗證 `cloak_logs` 與 `clicks` 表的關聯查詢是否正確處理了 `visitor_id` 與 `user_id` 的去重。</step>
<step id="check-sorting">2. 測試所有數值欄位的排序功能，確保「-」值在排序時被正確處理（通常排在最後）。</step>
<step id="check-copy">3. 驗證點擊短鏈代碼時，剪貼簿內容是否包含完整的 `https://` 協議前綴。</step>
<step id="check-responsive">4. 在手機版（<768px）下確認「操作」按鈕已正確收納至下拉選單，且表格可流暢橫向滾動。</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-attr-analysis.md](cloak-admin-attr-analysis.md) | 歸因邏輯分析 |
| [cloak-admin-troubleshoot.md](cloak-admin-troubleshoot.md) | 數據不一致排查 |
