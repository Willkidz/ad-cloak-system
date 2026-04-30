---
title: "修改指令 v1.10.2：CTA 連結與 TAG 歸因串接"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "詳細說明如何修改 shadow-cloak、money-page 及 line-redirect 三個 Worker，以打通從廣告點擊到 LINE 加好友的完整歸因參數傳遞鏈路。"
id: "20260325-024356"
type: "cmd"
tags: [attribution, cloudflare-d1, godview, line-redirect, money-page, shadow-cloak]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本指令旨在修復落地頁 CTA 按鈕為空連結 (`#`) 導致的歸因斷裂問題。核心任務是打通 **shadow-cloak → money-page → line-redirect** 的參數傳遞鏈路。修改內容：(1) `shadow-cloak` 透過自定義 Header (`x-ad-tag`, `x-visitor-id`) 傳遞參數；(2) `money-page` 使用 `HTMLRewriter` 動態替換 `a[href="#"]` 為包含 `tag`, `vid`, `fbclid`, `fbc`, `fbp` 的歸因連結；(3) `line-redirect` 支援 `customer_links` 多連結分流邏輯，並將點擊數據非同步寫入 D1 `clicks` 表。此舉確保了從廣告點擊到 LINE 加好友的端到端 TAG 歸因。

# 修改指令 v1.10.2：CTA 連結與 TAG 歸因串接

## 總覽

- **版本**：v1.10.2
- **優先級**：🔴 高（CTA 按鈕為空連結，歸因追蹤完全斷裂）
- **影響範圍**：shadow-cloak Worker、money-page Worker、line-redirect Worker、D1 資料庫
- **修改類型**：功能串接（三個 Worker 聯動 + D1 表結構調整）
- **預計耗時**：60–90 分鐘

---

## 問題描述

目前 `money-page`（落地頁）的所有行動呼籲（CTA）按鈕 `href` 屬性均為 `"#"`（空連結），導致用戶點擊後無法跳轉。此問題引發了以下四個關鍵斷點：

1.  用戶無法從落地頁順利進入 LINE 加好友流程。
2.  廣告 `tag` 參數（例如 `AS01`）未能成功傳遞至 `line-redirect` Worker。
3.  `fbclid`、`fbc`、`fbp` 等 Facebook 歸因參數在 CTA 環節中斷裂。
4.  N8N 的時間歸因（Time Attribution）工作流程無法正確回傳 `CompleteRegistration` 事件給 Facebook Conversions API (CAPI)。

本次修改旨在打通 **shadow-cloak → money-page → line-redirect** 的完整參數傳遞鏈路，以實現端到端的 TAG 歸因串接。

---

## 系統架構與用戶流程

### 系統架構

| 元件 | 說明 | 部署位置 |
| :--- | :--- | :--- |
| **shadow-cloak Worker** | 斗篷判斷，攔截爬蟲/審核，放行真實用戶 | mopliv.site 等 7 個廣告域名 |
| **money-page Worker** | 落地頁展示 | 由 shadow-cloak proxy 呼叫 |
| **line-redirect Worker** | 記錄點擊歸因 + 分流跳轉到 LINE 連結 | freshpathlab.com |
| **N8N Time Attribution** | LINE follow 後回傳 CAPI 事件 | n8n.bexnua.store |

### 完整用戶流程

<step id="user-flow">

1.  **廣告設定**：投放人員設定廣告連結，包含 `tag` 參數（如 `https://mopliv.site/?tag=AS01`）。
2.  **用戶點擊**：用戶點擊廣告，Facebook 自動附加 `fbclid` 參數。
3.  **Cloak 處理**：`shadow-cloak` Worker 進行斗篷判斷。若為真實用戶，則將 `tag`、`visitor_id` 及原始查詢字串透過 Header 代理至 `money-page`。
4.  **落地頁渲染**：`money-page` Worker 從 Header 讀取歸因參數，並使用 `HTMLRewriter` 動態生成包含所有參數的 CTA 連結（如 `https://freshpathlab.com/go?tag=AS01&vid={vid}&fbclid={fbclid}...`）。
5.  **點擊跳轉**：用戶點擊 CTA 按鈕，請求發送至 `line-redirect` Worker。
6.  **歸因記錄與分流**：`line-redirect` Worker 記錄參數至 D1 `clicks` 表，並根據 `tag` 查詢 `line_config` 進行分流跳轉。
7.  **CAPI 回傳**：用戶加入 LINE 好友後，觸發 N8N 工作流程回傳 `CompleteRegistration` 事件。

</step>

---

## 前置作業：D1 資料庫修改

### `line_config` 表：新增分流欄位

<rule id="d1-line-config-alter">
`line_config` 表已存在且包含真實資料，**嚴禁刪除或重建**。僅需透過 `ALTER TABLE` 新增欄位。
</rule>

| 欄位 | 類型 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| `customer_links` | TEXT | JSON 陣列，儲存多個 LINE 連結。 | `["https://line.me/R/ti/p/@abc", ...]` |
| `routing_strategy` | TEXT | 分流規則，預設為 `random`。 | `random` / `round_robin` |

### `clicks` 表：確認歸因欄位

<rule id="d1-clicks-schema">
`clicks` 表必須包含儲存所有歸因參數的欄位（`tag`, `visitor_id`, `fbclid`, `fbc`, `fbp`, `ip`, `user_agent`, `target_link`, `created_at`）。
</rule>

---

## Worker 修改要點

### 1. shadow-cloak

<rule id="worker-shadow-cloak-rule">
修改 `shadow-cloak` Worker，使其在放行後將歸因參數透過自訂 Header 傳遞。
</rule>

<example id="shadow-cloak-headers">

```javascript
// v1.10.2：設定歸因 Header
const proxyHeaders = new Headers(request.headers);
if (adTag) proxyHeaders.set('x-ad-tag', adTag);
if (visitor_id) proxyHeaders.set('x-visitor-id', visitor_id);
proxyHeaders.set('x-original-query', incomingUrl.search);
```

</example>

### 2. money-page

<rule id="worker-money-page-rule">
修改 `money-page` Worker，使用 `HTMLRewriter` 動態替換所有 `href="#"` 的 CTA 連結。
</rule>

<example id="money-page-rewriter">

```javascript
// v1.10.2：動態替換 CTA 連結
const ctaUrl = `https://freshpathlab.com/go?tag=${adTag}&vid=${visitorId}&fbclid=${fbclid}...`;
const rewriter = new HTMLRewriter().on('a[href="#"]', {
  element(element) {
    element.setAttribute('href', ctaUrl);
  },
});
return rewriter.transform(response);
```

</example>

### 3. line-redirect

<rule id="worker-line-redirect-rule">
修改 `line-redirect` Worker，處理 `customer_links` 分流邏輯，並將數據寫入 D1 `clicks` 表。
</rule>

<example id="line-redirect-d1-log">

```javascript
// v1.10.2：非同步寫入 clicks 表
const stmt = env.DB.prepare(
  'INSERT INTO clicks (tag, visitor_id, fbclid, fbc, fbp, target_link) VALUES (?, ?, ?, ?, ?, ?)'
).bind(tag, vid, fbclid, fbc, fbp, targetLink);
ctx.waitUntil(stmt.run());
```

</example>

---

## 結論

本次修改透過對三個核心 Worker 和 D1 資料庫的協同調整，成功串接了從廣告點擊到用戶加 LINE 的完整歸因鏈路，解決了 CTA 連結失效問題，並確保了 Facebook 參數的準確追蹤。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-time-attr-spec.md`](./godview-time-attr-spec.md) | 時間歸因方案設計文件 |
| [`godview-worker-code-log.md`](./godview-worker-code-log.md) | Worker 程式碼變更日誌 |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | 系統設計分析 |
| [`godview-tag-mapping.md`](./godview-tag-mapping.md) | 完整 TAG 對照表 |
