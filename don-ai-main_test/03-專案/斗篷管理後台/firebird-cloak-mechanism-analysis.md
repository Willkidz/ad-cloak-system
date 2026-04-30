---
title: "火鳥斗篷機制分析與 fbclid 傳遞方案"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "分析火鳥系統的三層斗篷架構，找出 fbclid 參數在跳轉過程中丟失的原因，並提出多種解決方案以確保 fbclid 能成功傳遞至後端。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [attribution, cloaking, firebird, meta-ads]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告分析了火鳥（Firebird）系統的三層斗篷架構，發現 `fbclid` 參數丟失的根本原因在於落地頁的 `gotolink()` 函數未將查詢參數傳遞至 `ini.html` 分流頁。報告評估了五種方案，最終推薦採用「方案 E」：為每個廣告碼配置獨立活動頁，並覆寫 `gotolink()` 直接跳轉至帶有 `fbclid` 的 Worker URL，以確保 100% 的歸因準確性。

# 火鳥斗篷機制分析與 fbclid 傳遞方案

## 1. 背景：fbclid 參數丟失

在 Facebook 廣告投放中，`fbclid` 參數是歸因點擊來源的關鍵。然而，當前火鳥 (Firebird) 系統的斗篷 (Cloaking) 機制在多層跳轉過程中，會導致此參數丟失，無法傳遞到最終的後端追蹤服務。本文件旨在分析其根本原因並提出解決方案。

## 2. 已確認事實

<rule id="confirmed-facts">

| # | 事實 | 說明 |
| :--- | :--- | :--- |
| 1 | **FB 點擊產生 fbclid** | Meta 會自動在廣告點擊 URL 附加 `&fbclid=xxx`。 |
| 2 | **伺服器端判斷** | 火鳥落地頁 (`ryinb.site`) 使用 IP 判斷來決定顯示推廣頁或安全頁。 |
| 3 | **CTA 綁定** | 火鳥 CTA 按鈕使用 `onclick="gotolink()"` 綁定跳轉邏輯。 |
| 4 | **三層鏈路** | 落地頁 → `ini.html?id=475` → `bf.freshpathlab.com/?a=BF06` → LINE。 |
| 5 | **分流頁斗篷** | `ini.html` 同樣具備斗篷判斷，非白名單 IP 會看到安全頁。 |
| 6 | **Worker 記錄** | 手動在 Worker URL 加上 `&fbclid=test123`，後端 D1 成功記錄。 |

</rule>

---

## 3. 火鳥三層斗篷架構解析

火鳥系統採用了三層斗篷結構，以應對 FB 的審查機制。

<example id="cloaking-architecture">

```mermaid
graph TD
    A[FB 廣告 (帶 fbclid)] --> B{【第一層】<br>ryinb.site 落地頁<br>(伺服器端 IP 判斷)};
    B --> C[推廣頁<br>CTA 按鈕 onclick="gotolink()"];
    B --> D[安全頁 (合規內容)];
    C --> E{【第二層】<br>ini.html?id=XXX 分流頁<br>(IP 判斷)};
    E --> F[根據 id 跳轉到最終 URL];
    E --> G[安全頁];
    F --> H{【第三層】<br>bf.freshpathlab.com<br>(Worker)};
    H --> I[LINE 加好友頁];
```
</example>

**設計用意分析：**
- **第一層（落地頁）**：作為 FB 爬蟲的主要入口，顯示合規內容並載入 FB Pixel。
- **第二層（ini.html 分流頁）**：即使爬蟲跟隨連結，也會因 IP 被過濾而看到安全頁，形成雙重保險。
- **第三層（Worker）**：FB 爬蟲永遠無法到達此層。

---

## 4. 根本原因分析

`fbclid` 丟失的核心原因在於落地頁的 `gotolink()` 函數。該函數內部寫死了跳轉目標 URL（例如 `ini.html?id=475`），並未設計將當前頁面 URL 的查詢參數（包含 `fbclid`）傳遞到下一跳。

<boundaries id="parameter-loss-flow">

```plaintext
FB 廣告點擊 → ryinb.site?fbclid=abc123
                              ↓ gotolink()
                    ini.html?id=475     ← fbclid 在此丟失
                              ↓
                    bf.freshpathlab.com/?a=BF06  ← 後端未收到 fbclid
```
</boundaries>

---

## 5. 解決方案評估

| 方案 | 做法 | 優點 | 缺點 | 結論 |
| :--- | :--- | :--- | :--- | :--- |
| **方案 A** | 繞過分流頁，直接跳轉 Worker | 鏈路短 | 前端無法得知廣告碼 `a=` 的值 | 不可行 |
| **方案 B** | 將 fbclid 附加到分流頁 URL | 實作簡單 | 依賴 `ini.html` 未知的跳轉邏輯 | 待測試 |
| **方案 C** | 攔截 `location.href` 賦值 | 自動化程度高 | 瀏覽器安全限制，不夠可靠 | 不可靠 |
| **方案 D** | 改用 `_fbc` Cookie | 標準做法 | 跨域問題（ryinb.site vs freshpathlab.com） | 不可行 |
| **方案 E** | **獨立活動頁 + 覆寫 gotolink** | **100% 準確** | 增加管理成本 | **推薦** |

### 5.1. 推薦方案實作 (方案 E)

為每個廣告碼配置獨立活動頁，並在主題源碼中覆寫 `gotolink()`：

<example id="solution-e-code">

```html
<script>
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (!fbclid) return;

  const originalGotolink = window.gotolink;
  window.gotolink = function() {
    // 直接跳轉到帶有廣告碼和 fbclid 的 Worker URL
    window.location.href = 'https://bf.freshpathlab.com/?a=BF01&fbclid=' + encodeURIComponent(fbclid);
  };
})();
</script>
```
</example>

---

## 6. 結論與建議行動

<step id="action-plan">

1.  **測試方案 B**：使用手機 4G/5G 網絡訪問 `ini.html?id=475&fbclid=test999`。
2.  **驗證結果**：檢查後端 D1 數據庫中是否成功記錄了 `fbclid=test999`。
3.  **決策**：
    - 如果 D1 **有記錄**，採用方案 B（修改共用主題）。
    - 如果 D1 **沒有記錄**，採用方案 E（為每個廣告碼創建獨立活動頁）。

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [firebird-cloak-src-analysis.md](firebird-cloak-src-analysis.md) | 火鳥源碼深度分析 |
| ~~shadow-cloak-api-spec.md~~ | 斗篷系統 API 規範（文件不存在，相關規範請參考 `05-原始碼/斗篷管理後台/` 下的源碼文件） |
| [cloak-risk-levels-spec.md](cloak-risk-levels-spec.md) | 風險等級與應對規範 |
