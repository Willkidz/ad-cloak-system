---
title: "Meta Ad Library API 使用筆記：搜尋邏輯與參數優化"
category: "project"
priority: "medium"
applicable_tools: ["SearchAPI.io", "Meta Ad Library API"]
last_updated: "2026-03-28"
summary: "記錄 Meta Ad Library API 的核心搜尋邏輯、關鍵參數設定以及如何透過 SearchAPI.io 進行高效的競品數據採集。"
id: "20260328-known-meta-api-notes"
type: "notes"
tags: [api, competitor-analysis, data-collection, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本筆記深入探討 Meta Ad Library API 的技術細節。核心發現：搜尋邏輯受關鍵字組合影響極大，使用「品牌名 + 行動詞」可顯著提升相關率。筆記詳細列出了 `ad_type` (建議設為 `ALL`)、`ad_reached_countries` (設為 `['TW']`) 等關鍵參數，並指出 SearchAPI.io 在處理分頁與去重方面的優勢。針對博弈類廣告，建議結合 `search_terms` 與 `publisher_platforms` 進行交叉篩選，以獲取最精準的競品投放數據。

# Meta Ad Library API 使用筆記：搜尋邏輯與參數優化

## 1. 搜尋邏輯與關鍵字策略

Meta Ad Library API 的搜尋結果品質高度依賴於 `search_terms` 的設定。

<rule id="search-logic-rule">
- **精準匹配**：直接搜尋品牌名稱（如 `誠運坊`）可獲得該品牌的所有活躍廣告，但需注意多粉專操作的情況。
- **組合搜尋**：使用「遊戲名 + 利益點」（如 `戰神賽特 送`）是獲取同類競品最有效的方式，相關率可達 100%。
- **排除干擾**：單一行業詞（如 `信用版`）會引入大量非博弈類廣告（如信用卡），建議配合 `publisher_platforms` 限制在 Facebook/Instagram 以減少雜訊。
</rule>

---

## 2. 核心參數設定指南

在使用 API（或透過 SearchAPI.io 代理）時，以下參數的設定至關重要：

<example id="api-parameters">
| 參數名稱 | 建議設定值 | 說明 |
| :--- | :--- | :--- |
| `ad_type` | `ALL` | 必須設定為 `ALL` 才能搜尋到所有類型的廣告，包括博弈類。 |
| `ad_reached_countries` | `['TW']` | 鎖定台灣市場，避免跨國數據干擾。 |
| `ad_active_status` | `ACTIVE` | 僅搜尋目前正在投放的廣告，以獲取最新市場動態。 |
| `search_page_ids` | [Page ID 列表] | 若已知競品粉專 ID，直接使用此參數可獲得最精準的監控數據。 |
| `limit` | `100` | 每次請求的結果上限，建議設為最大值以減少 API 調用次數。 |
</example>

---

## 3. SearchAPI.io 的優勢與限制

<boundaries id="searchapi-analysis">
- **優勢**：
    - **自動分頁**：簡化了原生 API 複雜的游標分頁邏輯。
    - **數據清洗**：返回的 JSON 格式更易於解析，且已包含部分去重邏輯。
    - **規避封鎖**：透過代理機制減少了直接調用 Meta API 可能面臨的頻率限制問題。
- **限制**：
    - **成本消耗**：每次搜尋都會消耗積分，需優化關鍵字以提升單次請求的價值。
    - **延遲性**：數據更新可能比原生廣告庫稍有延遲（通常在數小時內）。
</boundaries>

---

## 4. 實戰建議：博弈競品監控流程

<step id="monitoring-workflow">
1.  **關鍵字採集**：定期從熱門遊戲與競品文案中提取新關鍵字。
2.  **API 自動化搜尋**：利用 n8n 或 Python 腳本，每日定時調用 API 採集數據。
3.  **數據過濾與入庫**：透過腳本過濾掉 Page ID 重複或非博弈類的結果，將有效數據寫入 Google Sheets。
4.  **素材下載與分析**：針對新發現的廣告，自動下載其圖片/影片素材進行視覺策略分析。
</step>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | SearchAPI.io 功能深度分析 |
| [`known-fb-ad-competitor-analysis.md`](known-fb-ad-competitor-analysis.md) | 競品搜尋實戰報告 |
| [`known-meta-adlibrary-api-notes.md`](known-meta-adlibrary-api-notes.md) | Meta Ad Library API 技術細節補充 |
