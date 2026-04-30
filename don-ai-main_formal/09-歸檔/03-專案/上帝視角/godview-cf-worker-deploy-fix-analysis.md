---
title: "Cloudflare Worker `line-redirect` 部署與修復報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "本報告記錄了修復 Cloudflare Worker 因冷啟動導致 Pixel ID 遺失問題的過程，包含程式碼修改、部署步驟與驗證結果。"
status: "archived"
archived_reason: "已整合至 03-專案/上帝視角/Cloudflare Worker Pixel ID 遺失問題調查報告.md"
archived_date: "2026-03-27"
merged_into: "03-專案/上帝視角/Cloudflare Worker Pixel ID 遺失問題調查報告.md"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

# Cloudflare Worker `line-redirect` 部署與修復報告

本報告旨在詳細記錄針對 Cloudflare Worker `line-redirect` 中因冷啟動（Cold Start）導致 Pixel ID 遺失問題的修復方案、部署過程及驗證結果。

## 問題背景與修復方案

經查，問題根源在於 Worker 在冷啟動時，會因直接使用空的預設設定而遺失 Pixel ID。為了解決此問題，我們採取了治標與治本相結合的兩項關鍵修改。

<step id="fallback-config">
### 步驟一：補齊 `FALLBACK_CONFIG`（治標）

為了在極端情況下（如 Config API 故障）仍能確保追蹤功能正常，我們從 n8n Config API 獲取了最新的 `MASTER_PIXEL_MAP`，並將其硬編碼寫入 Worker 的 `FALLBACK_CONFIG` 中。這份內建的備用設定可以防止因無法獲取遠端設定而導致的追蹤中斷。

- **新增的 Pixel 組別**：共 19 組，包含 `bf`, `cb`, `cs`, `cx`, `jb`, `jd`, `js`, `jx`, `lb`, `ls`, `lx`, `mb`, `ms`, `mx`, `n14`, `n18`, `n20`, `n22`, `sz`。
</step>

<step id="force-config-refresh">
### 步驟二：強制等待設定更新（治本）

我們修改了 `fetch` 事件處理函式的快取邏輯，從根本上解決問題。原邏輯在冷啟動時會直接處理請求，並在背景非同步更新設定。修改後，若 `cachedConfig` 為空（即冷啟動狀態），Worker 將會使用 `await refreshConfig()` 強制等待，直到從 Config API 成功獲取最新設定後，才會繼續處理請求。

<example>
**修改後的核心邏輯：**
```javascript
const now = Date.now();
if (!cachedConfig) {
  // 冷啟動：強制等待最新設定
  await refreshConfig();
} else if (now - cacheTime > CACHE_TTL) {
  // 快取過期：背景更新，不阻塞當前請求
  ctx.waitUntil(refreshConfig());
}
const config = getConfigSync();
```
</example>
</step>

## 部署與驗證

程式碼修改完成後，我們於 **2026-03-23T08:25:12Z** 透過 Cloudflare API (multipart/form-data) 成功將更新部署上線，並保留了原有的 D1 Database Binding (`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`)。

部署後，我們進行了多輪驗證測試，結果如下表所示：

| 測試網址                               | `ad_code` | 測試參數 (`fbclid`)    | D1 寫入的 `pixel_id` | 狀態     |
| :------------------------------------- | :-------- | :--------------------- | :------------------- | :------- |
| `https://cs.freshpathlab.com/?a=CS01`  | CS01      | `test_verify_deploy`   | `1296143099239936`   | ✅ 成功 |
| `https://ms.freshpathlab.com/?a=MS05`  | MS05      | `test_ms05_verify`     | `1296143099239936`   | ✅ 成功 |
| `https://js.freshpathlab.com/?a=JS02`  | JS02      | `test_js02_verify`     | `1296143099239936`   | ✅ 成功 |

## 結論

所有測試請求均成功觸發了 HTTP 302 重導向，且 D1 資料庫中正確記錄了對應的 `pixel_id` 和 `capi_token`。驗證結果表明，本次修復徹底解決了因 Worker 冷啟動導致 Pixel ID 遺失的問題，系統穩定性得到提升。
