---
title: "火鳥斗篷完整源碼分析 - ryinb.site"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 ryinb.site 網站採用的伺服器端 PHP 斗篷技術，該技術透過 IP 判斷區分訪客並返回不同頁面，以規避平台審查。"
version: "v1.0"
type: "analysis"
tags: [cloaking, firebird]
status: "active"
---
# 火鳥斗篷完整源碼分析 - ryinb.site

本文深入分析「ryinb.site」網站所採用的伺服器端斗篷（Server-Side Cloaking）技術。該網站利用 PHP 後端根據訪客 IP 位址進行判斷，並由 Cloudflare CDN 分發不同的 HTML 內容，從而實現對普通訪客和平台審查者的內容區隔。

## 斗篷架構與原理

<rule id="server-side-cloaking">
核心原理是在伺服器端（PHP）進行 IP 判斷，而非依賴前端 JavaScript。伺服器根據訪客 IP 所屬的地理位置或其他特徵，決定回傳「安全頁面」（Safe Page）或「推廣頁面」（Money Page），這是規避自動化審查的關鍵。
</rule>

## 頁面結構分析

此斗篷策略採用了兩層頁面結構，以增加審查爬蟲追蹤的難度。

### 第一層：落地頁（ryinb.site）

訪客點擊廣告後到達的第一層頁面，伺服器會根據 IP 進行分流：

| 訪客類型 | 顯示內容 |
| :--- | :--- |
| **白名單 IP**（例如台灣地區） | 推廣頁面，包含跳轉至 LINE 的按鈕。 |
| **非白名單 IP**（例如審查爬蟲） | 安全頁面，內容為無意義的圖文，並包含一個「立即領取」按鈕。 |

<step id="safe-page-action">
在安全頁面中，點擊按鈕會觸發 Facebook Pixel 的 `Purchase` 事件，隨後將用戶導向第二層的中間頁 `/ryinbsite/details.html?id=473`。
</step>

### 第二層：中間頁（details.html）

此頁面是為了進一步過濾和混淆審查者而設計，其行為同樣取決於訪客 IP。

*   **非白名單 IP 訪問時**：
    1.  頁面會自動觸發 JavaScript，顯示一個全螢幕的黑色遮罩 (`.fc-make`) 和一個居中的彈窗 (`#showboxinfo`)。
    2.  彈窗內僅包含無意義的廢話文字和一個未被伺服器端替換的 `[conftpl]` 模板佔位符。
    3.  最終用戶會看到一個無法進行任何操作的死胡同頁面，`gotolink()` 函數在此頁面中僅會重複顯示遮罩，不會發生跳轉。

*   **白名單 IP 訪問時（推測）**：
    *   頁面可能直接顯示推廣內容，或 `gotolink()` 函數會包含真實的跳轉連結（例如 LINE），引導用戶至最終目標頁。

## 關鍵技術細節

### 像素追蹤

為了讓平台認為這是一個正常的廣告活動，所有頁面（包括安全頁）都載入了兩個 Facebook Pixel，並在安全頁的按鈕點擊時觸發 `Purchase` 事件，以模擬真實的用戶轉換行為。

*   `943527751701905` (舊像素)
*   `1259161412843235` (新像素)

### JavaScript 邏輯差異

落地頁與中間頁的 `gotolink()` 函數有著截然不同的實作，這是實現斗篷策略的關鍵之一。

<example>
**落地頁 (ryinb.site) 的 JS：**
```javascript
function gotolink() {
    fbq('track','Purchase');
    window.location.href="/ryinbsite/details.html?id=473";  // 跳轉到中間頁
}
```

**中間頁 (details.html) 的 JS：**
```javascript
$(function(){
    $('#showboxinfo').show();   // 自動顯示遮罩
    $('.fc-make').show();
});
function gotolink() {
    fbq('track','Purchase');
    $('#showboxinfo').show();   // 僅重複顯示遮罩，不跳轉
    $('.fc-make').show();
}
```
</example>

### 模板佔位符 `[conftpl]`

此佔位符是火鳥（Phoenix）模板系統的一部分。在提供給非白名單 IP 的安全頁版本中，此佔位符未被伺服器端腳本處理和替換，因此直接以純文字形式顯示在頁面源碼中。

### 遮罩機制

`.fc-make` 元素透過 CSS 實現了一個覆蓋整個畫面的固定定位遮罩，其用途是在非白名單訪客訪問中間頁時，阻止用戶與頁面進行任何互動。

```css
.fc-make {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 3060;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,.9);
}
```

## 斗篷運作流程

以下是整個斗篷系統的運作流程圖：

```plaintext
FB 廣告點擊
    ↓
ryinb.site (PHP 伺服器端 IP 判斷)
    ├── 白名單 IP → 推廣頁 → 按鈕 → details.html → 真正跳轉 (LINE/目標頁)
    └── 非白名單 IP → 安全頁 (散文+圖片)
         ↓ 按鈕點擊 (觸發 Purchase 事件)
         details.html → 黑色遮罩 + 廢話 → 死胡同 (無法操作)
```

## 結論與啟示

從此案例分析中，可以總結出幾條自建斗篷系統的關鍵啟示：

<rule id="server-side-logic">
**伺服器端判斷是核心**：IP 和 User-Agent 的判斷必須在伺服器端完成，不能依賴任何前端 JavaScript，以防被輕易識破。
</rule>

<rule id="multi-layer-security">
**兩層結構增加安全性**：即使審查爬蟲成功跟隨了第一層的按鈕連結，第二層的中間頁依然能有效攔截並顯示安全內容。
</rule>

<rule id="pixel-consistency">
**像素在安全頁也載入**：在安全頁載入追蹤像素並觸發轉換事件，可以讓平台數據看起來更為真實，降低被標記為異常流量的風險。
</rule>

<rule id="event-obfuscation">
**在安全路徑觸發關鍵事件**：在看似無害的安全頁按鈕上觸發 `Purchase` 等關鍵轉換事件，可以有效混淆平台的行為分析模型。
</rule>

<rule id="cf-worker-alternative">
**Cloudflare Worker 可完美替代**：對於需要地理位置判斷的場景，Cloudflare Worker 提供了原生的 IP 地理位置資訊（國家、城市、ASN），無需依賴外部 GeoIP 數據庫或服務，是實現此類斗篷的絕佳工具。
</rule>
