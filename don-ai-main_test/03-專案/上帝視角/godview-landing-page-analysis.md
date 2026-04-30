---
title: "火鳥落地頁 JS 分析"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析火鳥落地頁（kogane.online/0906-2-2/）的 JavaScript 實作：已部署 Facebook Pixel（ID 245644733147949）、GTM（dataLayer 已初始化）、jQuery 3.2.1、Cloudflare Beacon，但未找到 gotolink() 函數定義、bc-event 端點呼叫及 Contact 事件觸發代碼。"
id: "20260328-godview-lp-analysis"
type: "analysis"
tags: [attribution, godview, javascript, known, landing-page, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 落地頁 `https://kogane.online/0906-2-2/` 基於 WordPress 6.6.2 + Elementor 3.24.7 建構，UTM 參數顯示流量來自付費 FB 廣告（`utm_medium=paid&utm_source=fb`）。`<head>` 區塊已部署四個追蹤腳本：Facebook Pixel（透過 `fbevents.js` 加載，含 Pixel ID `245644733147949`）、GTM（`dataLayer` 已初始化但 GTM 容器路徑異常）、jQuery 3.2.1、Cloudflare Beacon。`<body>` 中的核心按鈕「無須掃碼點擊加入」綁定了 `onclick="gotolink()"`，但 `<a>` 標籤無 `href`，完全依賴 JS 跳轉。**關鍵缺失**：`gotolink()` 函數定義未在源碼中找到、無任何 `bc-event` 或 `freshpathlab.com` 端點呼叫、無 `Contact` 事件觸發代碼——這意味著點擊事件可能無法被正確歸因。

# 火鳥落地頁 JS 分析

本文件旨在分析「火鳥」專案落地頁的 JavaScript 實作情況，特別是關於使用者行為追蹤與歸因的腳本。透過檢視頁面原始碼，我們得以了解當前部署了哪些工具，以及可能存在的問題。

---

## 頁面基本資訊

- **URL**: `https://kogane.online/0906-2-2/`
- **UTM 參數**: 頁面連結包含了明確的廣告活動追蹤參數，例如 `utm_medium=paid` 和 `utm_source=fb`，同時 `utm_id`、`utm_content`、`utm_campaign` 等欄位也攜帶了 Facebook 的廣告 ID，表明流量主要來自付費臉書廣告。
- **技術棧**: 該頁面基於 WordPress 6.6.2 版本，並使用 Elementor 3.24.7 頁面編輯器建構。

---

## `<head>` 區塊中的追蹤腳本

在頁面的 `<head>` 區塊中，我們發現了以下幾個主要的追蹤與功能性腳本：

1.  **Facebook Pixel (Meta Pixel)**
    - 腳本來源：`https://connect.facebook.net/signals/config/245644733147949...`
    - 說明：這是 Facebook Pixel 的核心設定檔，其中包含了多個 Pixel ID。頁面註解 `<!-- Meta Pixel Code -->` 後方跟隨了標準的 Pixel 安裝程式碼，並透過 `fbevents.js` 進行事件追蹤。

    <example id="fb-pixel-code">

    ```html
    <script async src="https://connect.facebook.com/en_US/fbevents.js"></script>
    ```

    </example>

2.  **Google Tag Manager (GTM)**
    - 腳本來源：`/themes/t11559609//themes/t15513660//script/gtm.js`
    - 說明：頁面中部署了 GTM，用於管理各種追蹤代碼。相關的 `dataLayer` 也已初始化。

    <example id="gtm-datalayer">

    ```javascript
    var gtm4wp_datalayer_name = 'dataLayer';
    var dataLayer = dataLayer || [];
    ```

    </example>

3.  **jQuery**
    - 腳本來源：`https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js`
    - 說明：引入了 jQuery 函式庫，版本為 3.2.1。

4.  **Cloudflare Beacon**
    - 腳本來源：`https://static.cloudflareinsights.com/beacon.min.js/v8c78df7...`
    - 說明：使用了 Cloudflare 的網站分析工具 Beacon，用於監測網站效能與流量。

---

## `<body>` 區塊分析

頁面中的主要互動元素是一個按鈕，其文字為「無須掃碼點擊加入」。

- **按鈕行為**: 該按鈕的 `onclick` 事件綁定了 `gotolink()` 函數。
- **HTML 結構**: 按鈕的 `<a>` 標籤本身沒有設置 `href` 屬性，完全依賴 JavaScript 函數來處理點擊後的跳轉行為。

<example id="button-html">

```html
<a class="elementor-button elementor-button-link elementor-size-lg" onclick="gotolink()">無須掃碼點擊加入</a>
```

</example>

---

## 未找到的關鍵程式碼

<boundaries>

在目前的分析範圍內，我們未能找到以下幾項關鍵的程式碼定義：

- `gotolink()` 函數的具體實作。
- 任何對 `bc-event` 或 `freshpathlab.com` 端點的呼叫。
- 觸發 `Contact` 事件的相關程式碼。

</boundaries>

---

## 結論

綜合以上分析，我們可以得出以下結論：

- **已具備基礎追蹤架構**: 頁面已正確安裝 Facebook Pixel 和 Google Tag Manager，為使用者行為追蹤打下了基礎。
- **缺少關鍵歸因腳本**: 儘管有基礎追蹤，但頁面原始碼中**並未發現**任何呼叫 `bc-event` Worker 端點的程式碼。這意味著點擊事件可能無法被正確歸因，影響了後續的數據分析與廣告優化。
- **功能實作不完整**: 核心的 `gotolink()` 函數定義缺失，導致無法確定按鈕點擊後的最終跳轉邏輯。這可能是因為該函數被動態加載或隱藏在其他被壓縮的腳本檔案中，需要進一步的動態偵錯來確認。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-firebird-page-analysis.md](godview-firebird-page-analysis.md) | 火鳥落地頁源碼分析（含 `[conftpl]` 注入機制） |
| [godview-firebird-pixel-code-notes.md](godview-firebird-pixel-code-notes.md) | 像素注入與 gotolink() 完整流程分析 |
| [godview-bc-pixel-chain-js-analysis.md](godview-bc-pixel-chain-js-analysis.md) | 像素鏈 JS 分析 |
