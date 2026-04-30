---
title: "Firebird 像素注入與按鈕跳轉機制分析"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析火鳥系統如何透過後端將 TikTok/Facebook/Google 像素注入推廣頁 <head>，並解析 gotolink() 函數先觸發所有像素轉換事件再執行頁面跳轉的詳細機制。"
id: "20260328-firebird-pixel-code"
type: "analysis"
tags: [advertising, firebird, godview, known, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 火鳥系統的推廣頁採用「後端注入 + 事件優先觸發」架構。所有追蹤像素（TikTok `ttq.load()`、Facebook `fbq('init')`、Google `gtag('config')`）均在伺服器端動態注入到 `<head>` 區塊。當用戶點擊 `.gotolink` 按鈕時，`gotolink()` 函數依序觸發 FB `Purchase` 事件（含 eventID）、Google Ads `conversion` 事件（`send_to` 格式為 `廣告ID/轉換ID`）、TikTok `CompletePayment` 事件，全部完成後才執行 `window.location.href` 跳轉至目標頁（如 LINE 連結）。此「先追蹤後跳轉」設計是確保數據完整性的關鍵。

# Firebird 像素注入與按鈕跳轉機制分析

本文檔分析了「火鳥」系統的推廣頁面，重點研究其像素注入方式以及按鈕點擊後的跳轉觸發機制。

---

## 像素與連結設定介面

根據後台截圖，系統允許用戶配置多種像素 ID 和連結選項。

- **像素 ID**:
    - TikTok 像素 ID：可配置多個。
    - Facebook 像素 ID：可配置多個。
    - Google Analytics ID：可配置多個。
    - Google 廣告/轉換 ID：可配置多個，每組包含兩個欄位（廣告 ID/轉換 ID）。
- **多連結設定**:
    - 提供「隨機打開」、「輪詢打開」和「同 IP 固定訪問同一連結」三種模式。
- **訪問權限**:
    - 可限制訪問裝置（電腦、移動端）和來源 IP（僅住宅 IP）。

---

## 源碼分析：像素注入與跳轉機制

通過分析推廣頁的源碼，我們發現像素和跳轉腳本是在後端動態注入的。

### 像素注入方式

<rule id="pixel-injection-method">

所有追蹤像素都是在後端服務中處理，並直接注入到推廣頁 HTML 的 `<head>` 區塊內。

</rule>

<example id="pixel-loading-code">

以下是從源碼中觀察到的具體像素加載代碼：

- **TikTok Pixel**
  ```javascript
  // 透過 identify_31760074.js 和 main.MTEwMjY2ZTExMA.js 加載
  ttq.load('1');
  ttq.load('2'); // 加載了兩個 TK 像素
  ```

- **Facebook Pixel**
  ```javascript
  // 透過 connect.facebook.net/signals/config/... 加載
  fbq('init', '4353746171539948');
  fbq('init', '940592681819066');
  fbq('track', 'PageView');
  ```

- **Google Analytics / Ads**
  ```javascript
  // 透過 googletagmanager.com/gtag/js 加載
  gtag('config', '5');
  gtag('config', '7');
  gtag('config', '3');
  gtag('config', '4');
  ```

</example>

---

### 按鈕跳轉機制

<rule id="button-redirect-logic">

頁面中帶有 `gotolink` class 的按鈕被點擊時，會先觸發所有已配置像素的轉換事件，然後才執行頁面跳轉。

</rule>

<step id="gotolink-flow">

`gotolink()` 函數的執行流程如下：

1.  **綁定點擊事件**：透過 jQuery 將點擊事件綁定到所有 `class="gotolink"` 的元素上。
    ```javascript
    $(document).on("click",".gotolink", function(e){ 
        gotolink(); 
        return false; 
    });
    ```

2.  **觸發像素轉換**：依次觸發 Facebook、Google Ads 和 TikTok 的轉換事件。
    ```javascript
    // FB 轉換事件
    fbq('track', 'Purchase', {}, {"eventID":"aaisvq1jn2dfr81ko665vpus4j"});
    // Google Ads 轉換事件
    gtag('event', 'conversion', { 'send_to': '5/6' });
    gtag('event', 'conversion', { 'send_to': '7/8' });
    // TikTok 轉換事件
    ttq.track('CompletePayment');
    ```

3.  **頁面跳轉**：完成所有像素事件後，跳轉至目標頁面（例如 LINE 連結）。
    ```javascript
    if('11' != '1'){ 
        window.location.href="/jovkcshop/ini.html?id=518"; 
    }
    ```

</step>

---

### 安全頁面機制

安全頁面也採用了類似的機制，提供「顯示內容」和「安全連結」兩種互動，前者用於展示富文本，後者用於跳轉。

---

## 結論

火鳥系統的核心機制是**後端注入**與**事件優先觸發**。

1.  **後端注入**：所有第三方追蹤代碼都在伺服器端動態生成並插入頁面，確保了配置的靈活性和安全性。
2.  **事件優先觸發**：在用戶點擊跳轉連結時，系統優先完成所有設定的像素轉換追蹤，然後才進行頁面重定向。這個設計確保了數據追蹤的完整性，是實現精準歸因的關鍵。
3.  **格式標準**：Google Ads 的 `send_to` 參數格式為 `廣告ID/轉換ID`，這是一個需要注意的技術細節。

這種架構設計清晰地分離了頁面內容與追蹤邏輯，使得行銷活動的數據追蹤既全面又可靠。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-firebird-page-analysis.md](godview-firebird-page-analysis.md) | 落地頁源碼結構分析 |
| [godview-firebird-complete-analysis.md](godview-firebird-complete-analysis.md) | 火鳥系統完整分析 |
| [godview-bc-pixel-chain-js-analysis.md](godview-bc-pixel-chain-js-analysis.md) | 像素鏈 JS 分析 |
