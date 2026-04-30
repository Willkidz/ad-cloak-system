---
title: "火鳥落地頁源碼分析 (ryinb.shop)"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析火鳥落地頁 ryinb.shop 的靜態源碼：Meta Pixel 區塊（第 116-119 行）為空僅有註解、第 123 行的 [conftpl] 模板標記用於動態注入像素與 gotolink() 函式、包含 Cloudflare Beacon 分析腳本與 facebook-domain-verification meta 標籤。"
id: "20260325-source-analysis"
type: "analysis"
tags: [firebird, godview, known, landing-page, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 對火鳥落地頁 `ryinb.shop` 的靜態源碼分析揭示了六項關鍵發現：(1) **Meta Pixel 區塊為空**（第 116-119 行僅有 HTML 註解，無實際 `fbq('init')` 程式碼）；(2) **`[conftpl]` 動態模板標記**（第 123 行），火鳥系統透過此標記在伺服器端渲染時注入像素追蹤碼、`gotolink()` 函式等腳本；(3) **`gotolink()` 函式未在前端源碼中定義**，推斷由 `[conftpl]` 動態注入，該函式負責觸發 FB `Purchase` 事件、Google Ads `conversion` 事件後執行跳轉；(4) 源碼中**未找到 `fbq('track', 'Purchase')`** 事件；(5) 包含 **Cloudflare Beacon** (Web Analytics) 分析腳本；(6) 包含 **`facebook-domain-verification`** meta 標籤。結論：僅從靜態源碼無法完整分析追蹤行為，必須結合運行時腳本執行情況。

# 火鳥落地頁源碼分析 (ryinb.shop)

本文件記錄了對火鳥系統落地頁 `ryinb.shop` 靜態源碼的分析結果，重點關注追蹤像素的注入方式與動態腳本機制。

---

## 關鍵發現

### 1. Meta Pixel 區塊為空

在源碼第 116-119 行，Meta Pixel 的位置僅有 HTML 註解，沒有實際的 `fbq('init', ...)` 像素程式碼。這表明像素代碼不是靜態嵌入的。

### 2. 動態模板標記 `[conftpl]`

<rule id="conftpl-injection">
在源碼第 123 行發現 `[conftpl]` 模板標記。火鳥系統使用此標記作為伺服器端模板引擎的注入點，在頁面渲染時動態插入：
- Meta Pixel 初始化代碼（`fbq('init', ...)`)
- TikTok Pixel 代碼（`ttq.load(...)`)
- Google Ads 追蹤代碼（`gtag('config', ...)`)
- `gotolink()` 函式定義
- 其他自定義腳本
</rule>

### 3. `gotolink()` 函式未定義

`gotolink()` 函數在前端靜態源碼中找不到定義，推斷也是由 `[conftpl]` 模板動態注入。根據其他分析，此函式在執行時會依序觸發 FB `Purchase` 事件（含 `eventID`）、Google Ads `conversion` 事件（`send_to` 格式為 `adID/conversionID`）、TikTok `CompletePayment` 事件，然後透過 `window.location.href` 執行跳轉。

### 4. 缺少購買事件

源碼中未找到 `fbq('track', 'Purchase')` 事件，此事件由 `gotolink()` 函式在運行時動態觸發。

### 5. Cloudflare 分析腳本

文件包含了 Cloudflare Beacon (Web Analytics) 的分析腳本，用於收集頁面訪問數據。

### 6. Facebook 域名驗證

文件包含 `facebook-domain-verification` 的 meta 標籤，用於驗證網域所有權，確保 Facebook 廣告系統能正確識別此域名。

---

## 結論

該源碼分析顯示，火鳥的落地頁 (`ryinb.shop`) 採用了動態腳本注入機制。前端源碼中並未直接包含 Meta Pixel 的追蹤碼，而是透過 `[conftpl]` 模板標記在伺服器端或運行時動態載入。這意味著僅從靜態源碼無法完整分析其追蹤行為，必須結合運行時的腳本執行情況來綜合判斷。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [火鳥落地頁分析 (kogane.online)](godview-firebird-page-analysis.md) | 另一個火鳥落地頁的源碼分析，同樣發現 `[conftpl]` 與空 Pixel 區塊 |
| [火鳥像素代碼筆記](godview-firebird-pixel-code-notes.md) | `gotolink()` 函式的完整運行時行為分析 |
| [火鳥後台 UI 分析](godview-firebird-ad-ui-analysis.md) | 火鳥後台中像素配置與跳轉設定的 UI 分析 |
| [截圖內容分析](godview-screenshot-analysis.md) | 斗篷系統早期需求與技術選型的截圖記錄 |
