---
title: "火鳥落地頁域名與頁面整合筆記"
category: project
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "記錄與第三方落地頁供應商「火鳥」的協作細節：域名管理（hamapu.xyz、azmmk.store 等）、landing_page_script.js 嵌入方式、按鈕鏈結指向 freshpathlab.com Worker 的設定規範，以及黑盒架構下的操作限制。"
id: "20260328-firebird-notes"
type: notes
tags: [dns, firebird, godview, known, landing-page]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 火鳥（Firebird）是本專案的主要落地頁供應商，提供 `hamapu.xyz`、`azmmk.store` 等域名。由於其系統為封閉式架構（黑盒），我們的整合僅限於兩個接觸點：(1) 透過火鳥後台的「自定義 JavaScript」功能嵌入 `landing_page_script.js`，負責攔截點擊並讀取 `_fbc`/`_fbp` Cookie；(2) 將頁面上的「加好友」按鈕鏈結指向 `https://{tag}.freshpathlab.com/?a={code}` 格式的歸因 URL。我們不具備火鳥域名的 DNS 控制權，因此必須嚴格區分火鳥域名與我們的歸因域名（`*.freshpathlab.com`）。

# 火鳥落地頁域名與頁面整合筆記

## 協作架構概覽

火鳥（Firebird）是本專案的主要落地頁供應商，負責提供廣告流量的著陸頁面。由於其系統為封閉式架構，我們無法直接存取其伺服器或修改其後端邏輯，整合方式僅限於前端腳本注入與鏈結跳轉。

<boundaries id="firebird-limitations">

以下為與火鳥協作時的關鍵限制：

- 我們**不具備**火鳥域名（如 `azmmk.store`）的 DNS 控制權。
- 我們**無法**直接修改火鳥的伺服器端邏輯或資料庫。
- 所有整合僅透過火鳥後台提供的「自定義 JavaScript」與「按鈕鏈結」兩個介面完成。
- 火鳥域名與我們的歸因域名（`*.freshpathlab.com`）必須嚴格區分，避免混淆。

</boundaries>

---

## 核心整合規範

<rule id="firebird-integration">

### 1. 域名管理

火鳥提供的域名（如 `azmmk.store`、`hamapu.xyz`）僅作為廣告流量的著陸入口。這些域名的 DNS 由火鳥控制，我們無法也不需要管理。我們的歸因域名 `*.freshpathlab.com` 由 Cloudflare 管理，透過 n8n DNS Auto-Sync Workflow 自動建立子域名的 AAAA 記錄。

### 2. 腳本嵌入

透過火鳥後台的「自定義 JavaScript」功能嵌入 `landing_page_script.js`。該腳本的職責包括：

- 攔截頁面上的按鈕點擊事件。
- 從瀏覽器 Cookie 中讀取 `_fbc`（Facebook Click ID）與 `_fbp`（Facebook Pixel ID）。
- 從 URL 參數中提取 `fbclid`。
- 將上述參數附加至跳轉 URL，確保歸因數據不丟失。

### 3. 按鈕鏈結設定

落地頁上的「加好友」按鈕必須指向對應的歸因鏈結，格式為：

```
https://{tag}.freshpathlab.com/?a={code}
```

其中 `{tag}` 對應 LINE 官方帳號的子域名標識，`{code}` 為廣告代碼（`ad_code`）。

</rule>

---

## 操作流程

<step id="update-link">

**更新鏈結**：當廣告代碼 `code` 變更或新增 LINE OA 時，需登入火鳥後台，手動修改對應頁面的按鈕目標 URL。確保 URL 格式正確且 `{tag}` 與 `{code}` 對應無誤。

</step>

<step id="verify-script">

**驗證腳本**：使用瀏覽器開發者工具（F12 → Console）檢查頁面載入時，`landing_page_script.js` 是否正確執行且無報錯。特別注意 Cookie 讀取是否成功（在第三方 Cookie 限制日益嚴格的環境下）。

</step>

<step id="test-redirect">

**測試跳轉**：點擊按鈕後，確認瀏覽器被正確重定向至 `freshpathlab.com` 的 Worker，且 URL 中包含 `a={code}` 參數以及 `_fbc`/`_fbp` 等追蹤參數。

</step>

---

## 結論

與火鳥的協作重點在於「標準化配置」。任何前端頁面的變動都必須確保追蹤腳本的完整性，否則將導致歸因鏈斷裂——用戶點擊後的 `ad_code` 和 Facebook 追蹤參數無法傳遞至 Worker，最終造成歸因失敗與 CAPI 回傳缺失。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 上帝視角系統總綱，定義完整歸因流程 |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | CF Worker 中繼站邏輯分析，火鳥跳轉後的下一環節 |
| [`godview-ad-attr-code-analysis.md`](godview-ad-attr-code-analysis.md) | `ad_code` 傳遞鏈路分析 |
