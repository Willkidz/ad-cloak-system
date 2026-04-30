---
title: "Meta Ad Library API 技術細節與權限說明"
category: "project"
priority: "medium"
applicable_tools: ["Meta Graph API", "Ad Library"]
last_updated: "2026-03-28"
summary: "補充 Meta Ad Library API 的技術底層細節，包含 Access Token 權限要求、API 節流機制與數據結構解析。"
id: "20260328-known-meta-api-tech"
type: "notes"
tags: [credentials, facebook, meta-ads, security]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件聚焦於 Meta Ad Library API 的底層技術規範。核心要點包括：必須使用具備 `ads_read` 權限的長期 Access Token，且 API 受到嚴格的 App-level 節流限制。文件詳細解析了返回數據中的 `ad_snapshot_url`（用於獲取素材快照）與 `demographic_distribution`（用於分析受眾特徵）等關鍵欄位。針對博弈類廣告的特殊性，強調了在請求頭中正確設定 `ad_type=ALL` 的必要性，並提供了處理 API 錯誤碼的標準流程。

# Meta Ad Library API 技術細節與權限說明

## 1. 權限與認證要求

要直接調用 Meta Ad Library API，必須遵循 Meta Graph API 的認證流程。

<rule id="auth-requirement">
- **Access Token**：需要一個具備 `ads_read` 權限的 User Access Token 或 Page Access Token。建議將其轉換為長期 Token（有效期 60 天）以供自動化腳本使用。
- **身分驗證**：調用者必須完成 Meta 的廣告發布者身分驗證，否則部分敏感廣告數據（如政治或社會議題相關，有時也影響博弈類）可能無法獲取。
</rule>

---

## 2. API 節流與性能優化

Meta 對 Ad Library API 實施了嚴格的節流機制 (Rate Limiting)。

<boundaries id="rate-limiting-notes">
- **節流維度**：基於 App ID 的調用頻率。當觸發節流時，API 會返回 `Error 17` (User request limit reached)。
- **優化策略**：
    - **批次請求**：盡量在單次請求中使用 `limit=100`。
    - **快取機制**：對於 Page ID 等靜態資訊，應在本地進行快取，避免重複查詢。
    - **指數退避**：在腳本中實作重試邏輯，遇到節流錯誤時自動增加等待時間。
</boundaries>

---

## 3. 數據結構深度解析

API 返回的 JSON 數據包含多個關鍵欄位，對於競品分析至關重要：

<example id="data-fields-analysis">
| 欄位名稱 | 數據類型 | 分析價值 |
| :--- | :--- | :--- |
| `ad_snapshot_url` | String | 提供廣告在廣告庫中的永久連結，可用於人工複核素材。 |
| `funding_entity` | String | 顯示廣告的出資者，有助於識別背後的集團或品牌。 |
| `impressions` | Object | 提供曝光量區間，用於評估廣告的投放規模與成效。 |
| `demographic_distribution` | Array | 顯示受眾的年齡與性別分佈，是反推競品受眾策略的核心數據。 |
| `publisher_platforms` | Array | 顯示廣告投放的平台（FB, IG, Messenger, Audience Network）。 |
</example>

---

## 4. 錯誤處理與調試

<step id="error-handling-flow">
1.  **檢查 Token 有效性**：若返回 `Error 190`，表示 Token 已過期或被撤銷。
2.  **驗證參數組合**：確保 `search_terms` 或 `search_page_ids` 至少存在其一。
3.  **監控節流狀態**：檢查 API 回應頭中的 `x-app-usage` 欄位，預先判斷是否即將觸發節流。
</step>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-meta-ad-library-api-notes.md`](known-meta-ad-library-api-notes.md) | 搜尋邏輯與參數優化筆記 |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | SearchAPI.io 代理工具分析 |
