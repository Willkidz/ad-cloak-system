---
title: "博弈競品搜尋與初步篩選報告"
category: "project"
priority: "medium"
applicable_tools: ["SearchAPI.io", "Meta Ad Library"]
last_updated: "2026-03-28"
summary: "記錄針對「博富」專案進行的競品搜尋過程，包含關鍵字測試、結果篩選與初步的競品清單建立。"
id: "20260328-known-comp-search"
type: "analysis"
tags: [competitor-analysis, gambling, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告記錄了競品搜尋的實戰過程。透過測試多組關鍵字，確認「遊戲名 + 送」是最高效的搜尋組合。報告初步篩選出 14 個博弈相關粉專，並將其分類為「信用版」與「現金版」。這份清單為後續的深度素材分析與投放策略研究奠定了基礎。

# 博弈競品搜尋與初步篩選報告

## 1. 搜尋策略與關鍵字測試

為獲取最相關的競品數據，我們進行了多輪關鍵字測試。

<step id="search-testing">
1.  **品牌詞搜尋**：搜尋已知品牌（如「誠運坊」），用於追蹤特定對手的多粉專操作。
2.  **行業詞搜尋**：搜尋「信用版」、「娛樂城」，結果較為雜亂，包含大量非目標廣告。
3.  **利益點搜尋**：搜尋「送 20000」、「免儲值」，能找到部分精準競品。
4.  **遊戲 IP 搜尋**：搜尋「戰神賽特 送」，相關率最高，能有效捕捉到正在利用熱門遊戲獲客的活躍競品。
</step>

---

## 2. 初步篩選結果概覽

搜尋共獲得 30 條原始結果，經人工篩選後，確認 14 條為高度相關的博弈廣告。

<example id="search-summary">
| 搜尋類別 | 總結果數 | 相關結果數 | 相關率 |
| :--- | :--- | :--- | :--- |
| **品牌/特定詞** | 10 | 4 | 40% |
| **行業/利益點** | 10 | 2 | 20% |
| **遊戲 IP 組合** | 10 | 8 | **80%** |
</example>

---

## 3. 競品分類與特徵

篩選出的競品呈現出兩大陣營：

<boundaries id="comp-classification">
- **信用版 (直接競品)**：主打「免儲值」、「開版」、「高額度」。導流方式多為 Facebook 內建表單。
- **現金版 (間接競品)**：主打「首儲優惠」、「高返水」。導流方式多為 LINE 或官方網站。
</boundaries>

---

## 4. 結論與後續行動

<rule id="next-steps">
- **建立監控清單**：將篩選出的 Page ID 加入每日自動化採集任務。
- **深度素材拆解**：針對信用版競品，進行視覺風格與文案邏輯的深度拆解。
- **追蹤投放壽命**：持續觀察特定廣告的投放時長，以判斷其素材的有效性。
</rule>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-fb-ad-competitor-analysis.md`](known-fb-ad-competitor-analysis.md) | 深度競品分析報告 |
| [`known-competitors-credit-analysis.md`](known-competitors-credit-analysis.md) | 信用版同行記錄 |
