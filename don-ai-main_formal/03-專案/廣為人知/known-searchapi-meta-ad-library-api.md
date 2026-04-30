---
title: "SearchAPI.io Meta Ad Library API 技術規格與實作指南"
category: "project"
priority: "medium"
applicable_tools: ["SearchAPI.io", "Python", "n8n"]
last_updated: "2026-03-28"
summary: "詳細記錄 SearchAPI.io 提供的 Meta 廣告庫 API 規格，並提供 Python 實作範例與數據解析邏輯。"
id: "20260328-known-searchapi-spec"
type: "spec"
tags: [api, data-collection, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本指南定義了透過 SearchAPI.io 採集 Meta 廣告數據的標準流程。核心內容：API 端點設定、關鍵參數（如 `q`, `ad_type`, `ad_reached_countries`）的應用，以及一個完整的 Python 採集腳本範例。指南強調了對返回結果中 `ads` 陣列的深度解析，以提取競品的文案與素材連結。

# SearchAPI.io Meta Ad Library API 技術規格與實作指南

## 1. API 端點與認證

<rule id="api-auth">
- **Endpoint**: `https://www.searchapi.io/api/v1/search`
- **Engine**: `facebook_ad_library`
- **Auth**: 透過 URL 參數 `api_key` 進行認證。
</rule>

---

## 2. 關鍵請求參數

<example id="request-params">
| 參數 | 必填 | 說明 | 範例值 |
| :--- | :--- | :--- | :--- |
| `q` | 是 | 搜尋關鍵字。 | `戰神賽特 送` |
| `ad_type` | 是 | 廣告類型。 | `all` |
| `ad_reached_countries` | 否 | 目標國家。 | `TW` |
| `active_status` | 否 | 廣告狀態。 | `active` |
| `publisher_platforms` | 否 | 投放平台。 | `facebook,instagram` |
</example>

---

## 3. Python 實作範例

```python
import requests
import json

def fetch_competitor_ads(query):
    api_key = "YOUR_SEARCHAPI_KEY"
    url = "https://www.searchapi.io/api/v1/search"
    params = {
        "engine": "facebook_ad_library",
        "q": query,
        "ad_reached_countries": "TW",
        "api_key": api_key
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    for ad in data.get("ads", []):
        print(f"Page: {ad.get('page_name')}")
        print(f"Text: {ad.get('ad_creative_bodies')[0] if ad.get('ad_creative_bodies') else 'N/A'}")
        print(f"Link: {ad.get('ad_snapshot_url')}")
        print("-" * 20)

# 執行搜尋
fetch_competitor_ads("戰神賽特 送")
```

---

## 4. 數據解析與入庫建議

<step id="data-processing">
1.  **去重邏輯**：基於 `ad_id` 進行去重，避免重複記錄同一條廣告。
2.  **素材提取**：解析 `ad_creative_link_captions` 獲取導流網址。
3.  **自動化入庫**：將解析後的數據寫入 Google Sheets 或資料庫，並觸發 Slack 通知。
</step>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | 工具性能評估 |
| [`known-meta-ad-library-api-notes.md`](known-meta-ad-library-api-notes.md) | 搜尋邏輯筆記 |
