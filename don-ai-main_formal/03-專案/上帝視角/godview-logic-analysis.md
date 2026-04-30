---
title: "上帝視角歸因邏輯漏洞分析與優化建議"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析現有點擊歸因邏輯中因 IP 匹配失效、事件來源不準確及時間窗口限制引發的四大潛在漏洞，並提出引入點擊 ID 與放寬時間窗口的優化方案。"
id: "20260328-godview-logic-analysis"
type: "analysis"
tags: [analysis, attribution, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 現有歸因邏輯高度依賴不可靠的 IP 匹配（LINE Webhook 僅提供伺服器 IP）與嚴苛的 90 秒唯一點擊窗口，導致高流量下歸因成功率極低。本文識別四大漏洞：(1) IP 來源不準確導致前兩層匹配失效；(2) 唯一窗口機制在高併發下易誤判；(3) 共享 IP（如辦公室 WiFi）導致衝突；(4) 多廣告活動共用目標造成數據混亂。建議轉向 **LIFF/點擊 ID 方案** 以實現 100% 精準歸因。

# 歸因邏輯漏洞分析

> **ℹ️ 歷史文件說明**：本文分析的是**舊版三層 IP 匹配歸因邏輯**（IP 精準匹配→IP 子網匹配→唯一時間窗口）。此邏輯已被替換為**純時間 + destination（45 秒窗口）**方案（詳見 [godview-time-attr-spec.md](godview-time-attr-spec.md)）。本文保留作為歷史分析參考，其中提出的問題已透過新方案解決。

## 現有邏輯摘要（舊版）

目前的歸因邏輯主要依賴以下 SQL 查詢條件與三層匹配機制，旨在將 LINE `follow` 事件與 D1 中的點擊記錄關聯。

```sql
WHERE destination = ?1 
  AND matched = 0 
  AND timestamp >= datetime(?2, '-90 seconds') 
  AND timestamp <= ?2
```

- **第一層：IP 精準匹配**：在 60 秒內，尋找與 `follow` 事件來源 IP 完全相同的未歸因點擊。
- **第二層：IP 子網匹配**：若第一層未命中，在 30 秒內，尋找 /24 子網相同的 IP。
- **第三層：唯一時間窗口**：若前兩層皆未命中，在 90 秒內，如果只有一筆未歸因點擊，則直接歸因。

---

## 潛在漏洞分析

### 漏洞一：IP 來源不準確導致匹配失效

<rule id="ip-source-issue">
**核心問題**：LINE Webhook 事件中的 `x-forwarded-for` IP 來源通常是 LINE 的伺服器代理 IP，而非真實的用戶手機 IP。
</rule>

- **後果**：這導致第一層（精準 IP 匹配）和第二層（子網 IP 匹配）的歸因邏輯幾乎完全失效。
- **現狀**：所有歸因壓力都落在第三層的「唯一時間窗口」機制上，容錯率極低。

### 漏洞二：唯一時間窗口過於嚴苛

<rule id="unique-window-limit">
**核心問題**：第三層邏輯要求在 90 秒內必須**僅有 1 筆**未匹配的點擊，才會進行歸因。
</rule>

- **後果**：在高流量時段，或有多個廣告活動同時進行時，只要 90 秒內出現 2 筆以上的點擊，系統就會因「無法確定唯一來源」而放棄歸因，導致數據大量流失。

### 漏洞三：共享 IP 地址導致歸因錯誤

<rule id="shared-ip-conflict">
**核心問題**：當多個用戶在短時間內從同一個 IP（如：辦公室網路、公共 WiFi）點擊不同廣告時，系統無法區分。
</rule>

- **後果**：歸因系統會將 `follow` 事件錯誤地歸因到時間上最新的那筆點擊，而非用戶實際點擊的廣告，造成嚴重的數據偏誤。

### 漏洞四：多廣告活動共用目標

<rule id="shared-destination-issue">
**核心問題**：當多個不同的廣告活動（例如 `js01` 和 `ms01`）指向同一個 LINE 官方帳號時，它們的 `destination` 參數完全相同。
</rule>

- **後果**：這使得歸因系統在 SQL 查詢層面就無法區分點擊來源，造成歸因數據混亂，無法準確追蹤各個廣告的成效。

---

## 驗證測試案例設計

為了驗證上述漏洞，建議執行以下測試場景：

<example id="vulnerability-test-cases">
- **T6: 不同 IP，分別點擊與關注**：兩個不同 IP 的用戶在短時間內點擊同一個廣告，觀察是否僅依賴時間窗口歸因。
- **T7: 相同 IP，分別點擊與關注**：兩個使用相同 WiFi 的用戶點擊不同廣告，驗證是否存在歸因衝突。
- **T8: 不同廣告，相同目標**：點擊指向同一 LINE OA 的不同廣告（如 `js01` 和 `ms01`），觀察歸因是否混亂。
- **T9: 高流量模擬**：在 90 秒內模擬 3 筆點擊，但只有 1 位用戶關注，驗證唯一窗口是否失效。
</example>

---

## 結論與優化建議

目前的歸因邏輯存在嚴重設計缺陷，過度依賴不可靠的 IP 地址且窗口限制過於嚴苛。

**建議優化方向：**

1.  **引入點擊 ID (推薦)**：在點擊連結中生成唯一 `click_id`，並透過 LIFF 中間頁將此 ID 傳遞至 `follow` 事件，實現 100% 精準歸因。
2.  **放寬時間窗口**：如果無法實現點擊 ID，應考慮移除「唯一點擊」的限制，並引入「最近點擊優先 (Last Click)」模型。
3.  **區分廣告活動**：確保指向同一 LINE OA 的不同廣告活動能透過 `ad_code` 參數在資料庫層面進行區分。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-attr-research.md](godview-line-attr-research.md) | 歸因方案初步調研 |
| [godview-line-follow-research.md](godview-line-follow-research.md) | LINE Follow 事件間接歸因方案比較 |
| [godview-n8n-workflow-list.md](godview-n8n-workflow-list.md) | 包含 Time Attribution 工作流的具體實現細節 |
