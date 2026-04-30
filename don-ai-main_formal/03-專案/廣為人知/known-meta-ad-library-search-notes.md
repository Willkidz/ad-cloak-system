---
title: "Meta 廣告庫搜尋實戰筆記：規避干擾與精準定位"
category: "project"
priority: "medium"
applicable_tools: ["Meta Ad Library"]
last_updated: "2026-03-28"
summary: "記錄在 Meta 廣告庫中手動搜尋博弈競品的技巧、常見坑點與解決方案。"
id: "20260328-known-meta-search-notes"
type: "notes"
tags: [competitor-analysis, gambling, market-research, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本筆記分享了手動搜尋 Meta 廣告庫的「避坑指南」。核心技巧：**利用「廣告類別：所有廣告」**與**「精準排除關鍵字」**。筆記指出，直接搜尋「信用版」會被大量信用卡廣告淹沒，建議改用「開版」、「免儲值」等博弈專屬詞彙。此外，筆記還介紹了如何透過「廣告主資訊」挖掘其背後的關聯粉專。

# Meta 廣告庫搜尋實戰筆記

## 1. 搜尋設定的關鍵細節

<rule id="search-settings">
- **廣告類別**：必須手動切換為「所有廣告」(All Ads)，否則預設可能只顯示政治或社會議題廣告。
- **地區設定**：確保設定為「台灣」，並注意部分競品可能因投放設定而隱藏了特定地區的搜尋結果。
</rule>

---

## 2. 規避無效干擾的技巧

<example id="search-hacks">
| 搜尋詞 | 干擾項 | 解決方案 |
| :--- | :--- | :--- |
| **信用版** | 銀行信用卡、貸款廣告。 | 改搜「開版」、「額度」、「先玩後付」。 |
| **娛樂城** | 實體遊樂園、一般手遊。 | 增加「送」、「體驗金」、「註冊」等行動詞。 |
| **戰神** | 戰神系列單機遊戲。 | 搜尋完整遊戲名「戰神賽特」。 |
</example>

---

## 3. 挖掘隱藏競品的方法

<step id="deep-search-steps">
1.  **追蹤 Page ID**：在廣告庫中點擊粉專名稱，查看其「關於」頁面，確認其建立時間與更名記錄。
2.  **關聯粉專挖掘**：觀察廣告文案中的 LINE ID 或官網網址，在 Google 中搜尋這些資訊，往往能找到該集團經營的其他粉專。
3.  **利用「廣告主」過濾**：若發現某個廣告主非常活躍，直接在過濾器中選擇該廣告主，查看其所有在投素材。
</step>

---

## 4. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-meta-ad-library-api-notes.md`](known-meta-ad-library-api-notes.md) | API 搜尋邏輯筆記 |
| [`known-competitor-analysis.md`](known-competitor-analysis.md) | 搜尋與篩選實戰記錄 |
