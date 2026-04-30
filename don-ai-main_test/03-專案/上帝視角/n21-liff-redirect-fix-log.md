---
title: "n21 火鳥歸因鏈路修復記錄（2026-04-02）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-02"
summary: "武狀元(n21) 火鳥歸因鏈路的兩個關鍵 BUG 修復記錄：BUG-008 雙重 @ 符號問題（line_id 帶 @ 前綴導致加好友 URL 變成 @@）、中間頁自動跳轉問題（meta refresh + setTimeout 無法觸發 iOS Universal Link）。修復後跳轉流程：廣告連結 → 中間頁（手動點擊按鈕）→ LIFF → LINE APP → 加好友。"
id: "20260402-n21-liff-redirect-fix"
type: "project-doc"
tags: [godview, line-redirect, line, cloudflare-workers, attribution, troubleshooting]
status: "active"
created: "2026-04-02"
updated: "2026-04-02"
version: "v1.0"
---

> **TL;DR**: 修復了 n21（武狀元）火鳥歸因鏈路的兩個關鍵問題：(1) 雙重 `@` 符號導致 LINE 加好友 URL 無效；(2) 中間頁自動跳轉（meta refresh / setTimeout）無法觸發 iOS Universal Link，改為用戶手動點擊按鈕後成功喚醒 LINE APP。

# n21 火鳥歸因鏈路修復記錄（2026-04-02）

---

## 修復概覽

| 項目 | 說明 |
| :--- | :--- |
| **修復日期** | 2026-04-02 |
| **影響範圍** | 所有走 LIFF 流程的 tag（n21 為主要測試對象） |
| **修復文件** | `05-原始碼/上帝視角/line-redirect.js`、`03-專案/斗篷管理後台/line-login-callback.js` |
| **部署版本** | line-redirect: `b482052c`；line-login-callback: `64598bb5` |
| **Git Commit** | `785006a`（BUG-008）、`2fa5ec4`（中間頁修復） |

---

## BUG-008：雙重 @ 符號問題

### 問題描述

LINE 加好友 URL 產生 `@@075cocov`，LINE 報錯「無法加入好友。請確認網址是否正確。」

### 根因分析

兩個地方各自加了一個 `@`：

| 位置 | 問題 |
| :--- | :--- |
| `line-redirect.js` 第 568 行 | `FALLBACK_LINE_MAP` 中的 lineId 值為 `@075cocov`（帶 @ 前綴），直接作為 `line_id` 參數傳遞 |
| `line-login-callback.js` 第 142 行 | `redirectToOA` 函數硬編碼 `'https://line.me/R/ti/p/@' + TARGET_OA_ID`，又加了一個 `@` |

最終 URL 變成：`https://line.me/R/ti/p/@@075cocov`

### 修復方案

**line-redirect.js（第 568-569 行）**：
```javascript
// 修復前
const liffParams = { line_id: lineId, ... };

// 修復後
const cleanLineId = lineId.startsWith('@') ? lineId.substring(1) : lineId;
const liffParams = { line_id: cleanLineId, ... };
```

**line-login-callback.js（第 142-143 行）**：
```javascript
// 修復前
const oaUrl = 'https://line.me/R/ti/p/@' + TARGET_OA_ID;

// 修復後
const cleanOaId = TARGET_OA_ID.startsWith('@') ? TARGET_OA_ID.substring(1) : TARGET_OA_ID;
const oaUrl = 'https://line.me/R/ti/p/@' + cleanOaId;
```

### 測試驗證

| 測試項目 | 修復前 | 修復後 |
| :--- | :--- | :--- |
| `n21.freshpathlab.com/N2101` 的 `line_id` 參數 | `line_id=%40075cocov`（帶 @） | `line_id=075cocov`（無 @） |
| 加好友 URL | `https://line.me/R/ti/p/@@075cocov`（無效） | `https://line.me/R/ti/p/@075cocov`（正確） |
| 傳入 `@075cocov`（防禦性） | — | `cleanOaId` 移除多餘 @，URL 仍正確 |

---

## 中間頁 Universal Link 修復

### 問題描述

用戶訪問 `https://n21.freshpathlab.com/N2101` 後，看到中間頁（斗篷頁面），但自動跳轉到 LIFF URL 後出現 LINE Login 登入頁面，而非直接喚醒 LINE APP。

對比測試：
- 直接在瀏覽器輸入 `https://liff.line.me/2009129136-BEXGdu4X?vid=test_002` → 正常喚醒 LINE APP
- 從 line-redirect 中間頁自動跳轉到同一 LIFF URL → 出現 LINE Login 登入頁面

### 根因分析

**iOS Universal Link 的核心限制**：只有用戶**主動的點擊行為**才能觸發 Universal Link，讓 LINE APP 攔截 `liff.line.me` 域名的 URL。程式化導航（`window.location.href`、`meta http-equiv="refresh"`、HTTP 302 redirect）均不算用戶主動行為，不會觸發 Universal Link。

原中間頁的跳轉機制（三種自動跳轉並存）：
```html
<!-- 1. meta refresh（1秒後自動跳轉）-->
<meta http-equiv="refresh" content="1;url=https://liff.line.me/...">

<!-- 2. JavaScript setTimeout（0.5秒後自動跳轉）-->
<script>setTimeout(function(){ window.location.href="https://liff.line.me/..."; }, 500);</script>

<!-- 3. 手動點擊按鈕（唯一有效的觸發方式，但按鈕不夠醒目）-->
<a class="btn" href="https://liff.line.me/...">點此開啟 LINE</a>
```

前兩種方式均為程式化導航，無法觸發 Universal Link。第三種（用戶點擊）才能觸發，但原按鈕不夠醒目，用戶往往在看到按鈕前就被自動跳轉走了。

### 修復方案

移除所有自動跳轉機制，只保留醒目的手動點擊按鈕：

```html
<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body { background: #06C755; /* LINE 綠色 */ }
  .btn { display: block; width: 100%; padding: 18px 0;
         background: #fff; color: #06C755; font-size: 18px;
         font-weight: 700; border-radius: 12px; }
</style>
</head><body>
<div class="c">
  <div class="icon">💬</div>
  <p class="title">即將前往 LINE</p>
  <p class="desc">點擊下方按鈕開啟 LINE 加入好友</p>
  <a class="btn" href="https://liff.line.me/...">開啟 LINE</a>
</div>
</body></html>
```

**移除項目**：
- `meta http-equiv="refresh"` 自動跳轉
- `setTimeout` JS 自動跳轉

**新增項目**：
- `viewport` meta 標籤（手機適配）
- 醒目的「開啟 LINE」按鈕（全寬白色圓角，18px 粗體，LINE 綠色文字，陰影效果）
- 💬 圖示和說明文字

### 測試驗證

```bash
curl -s "https://n21.freshpathlab.com/N2101" | grep -c "http-equiv"  # 結果：0（已移除）
curl -s "https://n21.freshpathlab.com/N2101" | grep -c "setTimeout"  # 結果：0（已移除）
curl -s "https://n21.freshpathlab.com/N2101" | grep -c 'class="btn"' # 結果：1（按鈕存在）
```

---

## 完整跳轉流程（修復後）

```
廣告連結
https://n21.freshpathlab.com/N2101
        │
        ▼
line-redirect Worker（Cloudflare）
- 解析 adCode = "N2101"（從 URL 路徑）
- 查詢 FALLBACK_LINE_MAP → lineId = "@075cocov"
- 清理 @ 前綴 → cleanLineId = "075cocov"
- 查詢 LIFF_MAP → liffId = "2009129136-BEXGdu4X"
- 生成 vid（crypto.randomUUID）
- 生成 event_id（evt_{timestamp}_{uuid}）
- 寫入 D1 clicks 表（visitor_id, event_id, tag, ad_code...）
- 返回中間頁 HTML（LINE 綠色背景 + 「開啟 LINE」按鈕）
        │
        ▼ 用戶主動點擊「開啟 LINE」按鈕
        │
        ▼ iOS Universal Link 觸發
LINE APP 攔截 liff.line.me 域名
        │
        ▼ 在 LINE 內建 LIFF Browser 中打開
https://liff.line.me/2009129136-BEXGdu4X
  ?tag=n21&a=N2101&line_id=075cocov
  &vid={uuid}&event_id={evt_id}&token={token}
  &fbclid=&fbc=&fbp=&ts={timestamp}&msg=我想了解
        │
        ▼ LIFF SDK 跳轉到 Endpoint URL
https://line-login-callback.laoqin1689.workers.dev/line-login/callback
  ?liff.state={encoded_params}
        │
        ▼ line-login-callback Worker
- liff.init() 初始化 LIFF SDK
- 已在 LINE APP 內 → 靜默取得 userId（無需 LINE Login）
- 解析 liff.state → 取得 line_id = "075cocov"
- POST /bind → 寫入 line_user_bindings 表（vid + userId）
- 清理 @ 前綴 → cleanOaId = "075cocov"
- 構造加好友 URL = "https://line.me/R/ti/p/@075cocov"
        │
        ▼
用戶加入 LINE OA @075cocov（武狀元-蕃薯地薯條）
        │
        ▼ N8N 歸因工作流（非同步）
- 接收 follow event → 取得 userId
- 查詢 line_user_bindings → 取得 vid
- 查詢 clicks → 取得 event_id、fbclid、fbc、fbp
- 發送 Meta CAPI CompleteRegistration 事件
```

---

## 關鍵技術要點

| 要點 | 說明 |
| :--- | :--- |
| **line_id 去 @ 前綴** | `FALLBACK_LINE_MAP` 中的值帶 `@`，傳遞前必須用 `cleanLineId` 去除，否則 callback 會產生 `@@` |
| **callback 防禦性清理** | `line-login-callback.js` 的 `redirectToOA` 也要清理 `TARGET_OA_ID` 的 `@`，防止上游傳入帶 `@` 的值 |
| **禁止自動跳轉** | 中間頁不能用 `meta refresh`、`setTimeout`、`302 redirect`，必須讓用戶主動點擊，否則 iOS Universal Link 不觸發 |
| **路徑優先於查詢參數** | `adCode` 解析優先級：URL 路徑（`/N2101`）> 查詢參數（`?a=N2101`），正則 `^[A-Z]{1,6}\d{1,4}$` |
| **後續計畫** | 按鈕頁面將改用 `ini.html` / `golink` 斗篷頁面，由火鳥系統提供，line-redirect 只負責歸因記錄 |

---

## 部署記錄

| Worker | 修復內容 | 版本 ID | Commit |
| :--- | :--- | :--- | :--- |
| `line-redirect` | BUG-008 @ 前綴清理 + 中間頁移除自動跳轉 | `b482052c-5a4a-4d8e-869b-27e8b1c9317a` | `2fa5ec4` |
| `line-login-callback` | BUG-008 @ 前綴防禦性清理 | `64598bb5-abcb-4905-aa17-ca956165f41d` | `785006a` |

---

## 相關文件

| 文件 | 說明 |
| :--- | :--- |
| [`05-原始碼/上帝視角/line-redirect.js`](../../05-原始碼/上帝視角/line-redirect.js) | line-redirect Worker 源碼（修復後版本） |
| [`03-專案/斗篷管理後台/line-login-callback.js`](../斗篷管理後台/line-login-callback.js) | line-login-callback Worker 源碼（修復後版本） |
| [`03-專案/斗篷管理後台/cloak-admin-liff-url-analysis.md`](../斗篷管理後台/cloak-admin-liff-url-analysis.md) | LIFF URL 結構與跳轉流程分析 |
| [`03-專案/上帝視角/firebird-domain-page-notes.md`](firebird-domain-page-notes.md) | 火鳥落地頁域名管理與按鈕鏈結設定 |
