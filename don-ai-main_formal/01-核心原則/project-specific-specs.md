---
title: "專案特定技術規範"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整合廣告代碼格式、廣告列表欄位、LINE 設定維護與數據關聯原則等專案專屬規範。"
type: "rule"
tags: [attribution, cloaking, database, reporting]
status: "active"
activation_glob: null
version: "v1.1"
---

<!-- Merged from data-relation-principles.md -->
> **TL;DR**: 本文件定義斗篷系統四張核心數據表（`cloak_logs`、`clicks`、`campaigns`、`line_config`）的關聯方式與五項指標計算邏輯。關鍵規則：瀏覽數必須過濾 `verdict='allowed'`（源碼確認實際値，非 `verdict='real'`）並按 `visitor_id` 去重；按鈕點擊必須過濾 `is_bot=0`；歸因數不去重；`clicks` 表需透過 `line_config` 的 `tag` 和 `destination` 欄位間接關聯。

# 數據關聯原則

## 概述

本文件定義了斗篷系統中各數據表的關聯方式、指標計算邏輯，確保所有數據統計的準確性和一致性。

---

## 1. 核心數據表與關聯方式

### 表 1：cloak_logs（斗篷瀏覽日誌）

| 欄位 | 說明 | 用途 |
| :--- | :--- | :--- |
| `campaign_id` | 廣告 ID | 與 `campaigns.id` 關聯 |
| `verdict` | 判定結果 | 過濾真實訪客（`verdict='allowed'`） |
| `visitor_id` | 訪客 ID | 去重計算瀏覽數 |
| `ua` | User Agent | 設備判斷（iPhone/Android/PC） |
| `referer` | 來源 | 歸因分析 |

**關聯方式**：`campaign_id` 直接關聯 `campaigns.id`

### 表 2：clicks（按鈕點擊日誌）

| 欄位 | 說明 | 用途 |
| :--- | :--- | :--- |
| `ad_code` | 廣告代碼 | 與 `campaigns` 通過 `line_config` 間接關聯 |
| `is_bot` | Bot 標記 | 過濾 Bot 流量（`is_bot=0`） |
| `matched` | 歸因匹配 | 統計歸因數（`matched=1`） |
| `user_agent` | User Agent | 設備判斷 |
| `referer` | 來源 | 歸因分析 |

**關聯方式**：`ad_code` → `line_config.tag`（小寫標籤，如 cx）→ `line_config.destination`（LINE OA User ID）

### 表 3：campaigns（廣告列表）

| 欄位 | 說明 |
| :--- | :--- |
| `id` | 廣告 ID（主鍵） |
| `name` | 廣告名稱 |
| `short_code` | 短鏈代碼 |

**關聯方式**：被 `cloak_logs.campaign_id` 直接關聯；`clicks` 透過 `line_config.tag` 間接關聯

### 表 4：line_config（LINE 帳號與廣告標籤配置）

| 欄位 | 說明 |
| :--- | :--- |
| `tag` | 廣告標籤（小寫，如 cx、cs、bf），與 `clicks.ad_code` 對應 |
| `destination` | LINE OA User ID（歸因匹配關鍵欄位） |

> **注意**：`line_config` 表不存在 `code` 或 `campaign_id` 欄位。實際使用 `tag`（小寫標籤）和 `destination`（LINE OA User ID）進行關聯。

**關聯方式**：`clicks.ad_code`（大寫）與 `line_config.tag`（小寫）對應，`line_config.destination` 為 LINE OA User ID

---

## 2. 指標計算邏輯

<rule id="metric-impressions">
### 指標 1：瀏覽數（Impressions）

**定義**：真實、不重複的訪客數

```sql
SELECT COUNT(DISTINCT visitor_id) 
FROM cloak_logs 
WHERE campaign_id = ? AND verdict = 'allowed'
```

只計算 `verdict='allowed'` 的記錄（過濾虛假流量），按 `visitor_id` 去重（同一訪客多次瀏覽只計 1 次）。
</rule>

<rule id="metric-clicks">
### 指標 2：按鈕點擊（Button Clicks）

**定義**：真實、非 Bot 的按鈕點擊數

```sql
SELECT COUNT(DISTINCT user_id) 
FROM clicks 
WHERE ad_code IN (SELECT tag FROM line_config WHERE destination IN (
  SELECT destination FROM line_config WHERE tag = ?
)) 
AND is_bot = 0
```

只計算 `is_bot=0` 的記錄（過濾 Bot 流量），按 `user_id` 去重，通過 `line_config` 表關聯 `ad_code` 到 `campaign_id`。
</rule>

<rule id="metric-attribution">
### 指標 3：歸因數（Attributed Clicks）

**定義**：成功匹配 LINE 的點擊數

```sql
SELECT COUNT(*) 
FROM clicks 
WHERE ad_code IN (SELECT tag FROM line_config WHERE destination IN (
  SELECT destination FROM line_config WHERE tag = ?
)) 
AND matched = 1
```

只計算 `matched=1` 的記錄（成功歸因的點擊），不去重（計算總歸因筆數，不是不重複用戶數）。
</rule>

<rule id="metric-ctr">
### 指標 4：按鈕率（Click-Through Rate）

**定義**：按鈕點擊數 / 瀏覽數

```
按鈕率 = 按鈕點擊 / 瀏覽數 × 100%
```
</rule>

<rule id="metric-cvr">
### 指標 5：轉化率（Conversion Rate）

**定義**：歸因數 / 按鈕點擊

```
轉化率 = 歸因數 / 按鈕點擊 × 100%
```
</rule>

---

## 3. 數據一致性原則

<rule id="data-consistency-1">
### 原則 1：cloak_logs 用 campaign_id 直接關聯

`cloak_logs` 表已包含 `campaign_id` 欄位，直接用 `campaign_id` 查詢，無需多表 JOIN。
</rule>

<rule id="data-consistency-2">
### 原則 2：clicks 用 ad_code 透過 line_config 間接關聯

`clicks` 表只有 `ad_code`，需要透過 `line_config` 表的 `tag` 欄位對應。`line_config` 表不存在 `code` 或 `campaign_id` 欄位，實際使用 `tag`（小寫標籤）和 `destination`（LINE OA User ID）進行關聯。
</rule>

<rule id="data-consistency-3">
### 原則 3：瀏覽數必須過濾與去重

瀏覽數 = `cloak_logs` 中 `verdict='allowed'`，按 `visitor_id` 去重。不是所有 `cloak_logs` 記錄都算瀏覽。
</rule>

<rule id="data-consistency-4">
### 原則 4：按鈕點擊必須過濾 Bot

按鈕點擊 = `clicks` 表中 `is_bot=0` 的不重複訪客。必須按 `user_id` 去重。
</rule>

<rule id="data-consistency-5">
### 原則 5：歸因數不去重

歸因數 = `clicks` 表中 `matched=1` 的筆數。不去重，計算總筆數。歸因數可能大於按鈕點擊數（同一用戶可能多次成功歸因）。
</rule>

---

## 4. 數據驗證檢查清單

部署任何涉及數據統計的功能前，必須確認以下項目：

- [ ] cloak_logs 查詢已過濾 `verdict='allowed'`
- [ ] cloak_logs 查詢已按 `visitor_id` 去重
- [ ] clicks 查詢已過濾 `is_bot=0`
- [ ] clicks 查詢已按 `user_id` 去重（如需計算不重複用戶）
- [ ] clicks 查詢已透過 `line_config.tag` 欄位正確關聯
- [ ] 歸因數查詢已過濾 `matched=1`
- [ ] 按鈕率計算公式正確（按鈕點擊 / 瀏覽數）
- [ ] 轉化率計算公式正確（歸因數 / 按鈕點擊）
- [ ] 實際測試驗證了計算結果的正確性

---

## 5. 常見問題

### Q: 為什麼 cloak_logs 和 clicks 的關聯方式不同？

A: 因為兩個表的設計不同。`cloak_logs` 已經包含 `campaign_id`，可以直接關聯。`clicks` 只有 `ad_code`，需要透過 `line_config` 的 `tag` 欄位對應（注意：`line_config` 不存在 `code` 或 `campaign_id` 欄位）。這是系統的實際架構。

### Q: 為什麼瀏覽數要按 visitor_id 去重？

A: 因為同一訪客可能多次訪問同一廣告。如果不去重，同一訪客的多次瀏覽會被重複計算，導致瀏覽數虛高。

### Q: 為什麼按鈕點擊要過濾 is_bot=0？

A: 因為 Bot 流量不是真實用戶，不應該計入統計。過濾 Bot 流量可以確保統計的是真實用戶的行為。

### Q: 歸因數為什麼不去重？

A: 因為歸因數統計的是成功匹配 LINE 的點擊筆數，不是不重複用戶數。同一用戶可能多次點擊並成功歸因，每次都應該計入。

### Q: 按鈕率和轉化率的區別是什麼？

A: **按鈕率**衡量廣告的吸引力（有多少訪客點擊了按鈕），**轉化率**衡量歸因系統的效率（有多少點擊成功歸因到 LINE）。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `04-資源與參考/landingpage-tracking-analysis.md` | ad_code 的命名與大小寫規則（原 `ad_code-格式規範.md` 已整合至此） |
| `06-SOP流程/deploy-sop.md` | 資料庫變更的部署流程 |
| `01-核心原則/security-and-safety-rules.md` | 危險 SQL 攔截規則（規則 2） |
