---
title: "BC 像素事件回傳壓力測試日誌 (2026-03-21)"
category: project
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "記錄 2026-03-21 的 BC 像素事件高併發壓力測試結果：PageView 99.5%（12,450 筆）、Lead 98.0%（1,200 筆，24 筆丟失）、Purchase 100%（85 筆），Lead 丟失根因為 Android 原生瀏覽器預加載機制消耗 fbclid，建議在 pixel-chain.js 加入 isTrusted 點擊校驗。"
id: "20260321-godview-bc-events-log"
type: log
tags: [attribution, conversion, godview, pixel]
status: archived
created: 2026-03-21
updated: 2026-03-28
---

> **TL;DR**: 2026-03-21 執行的 BC 像素事件高併發壓力測試結果：**PageView** 成功率 99.5%（12,450 筆中 62 筆失敗），**Lead** 成功率 98.0%（1,200 筆中 24 筆丟失），**Purchase** 成功率 100%（85 筆全部成功）。Lead 的 2% 丟失率經排查確認為 **Android 原生瀏覽器的預加載（prefetch）機制**所致——瀏覽器在用戶正式點擊前預先發送請求，導致 `fbclid` 被提前消耗。修復方案為在 `godview-bc-pixel-chain.js` 中加入 `event.isTrusted` 點擊校驗，過濾非人工觸發的預加載請求。

# BC 像素事件回傳壓力測試日誌 (2026-03-21)

## 測試概覽

本次測試的目標是驗證 BC 像素事件在高併發場景下的回傳穩定性。測試模擬了廣告高峰期（20:00-23:00）的流量模式，對 Worker 的 `/bc-event` 路由進行壓力測試。測試覆蓋了三種核心事件類型，分別對應用戶旅程的不同階段。

---

## 數據統計

| 事件類型 | 觸發時機 | 發送總數 | 成功數 | 失敗數 | 成功率 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PageView** | 落地頁載入完成 | 12,450 | 12,388 | 62 | 99.5% |
| **Lead** | 點擊「加好友」按鈕 | 1,200 | 1,176 | 24 | 98.0% |
| **Purchase** | 用戶完成首儲 | 85 | 85 | 0 | 100.0% |

---

## 異常事件分析：Lead 丟失

<rule id="lead-loss-analysis">

### 根因

針對 Lead 事件 2% 的丟失率（24 筆），經逐筆排查發現所有丟失均發生在 **Android 原生瀏覽器**環境。具體機制如下：

1. 部分 Android 瀏覽器在用戶點擊連結時，會觸發「預加載」（prefetch）行為。
2. 預加載請求會提前訪問目標 URL，導致 `fbclid` 參數在正式跳轉前被 Worker 消耗。
3. 當用戶正式點擊時，`fbclid` 已不存在，Worker 無法正確記錄 Lead 事件。

### 修復方案

在 `godview-bc-pixel-chain.js` 的點擊事件監聽器中加入 `event.isTrusted` 校驗：

```javascript
button.addEventListener('click', function(event) {
    if (!event.isTrusted) return; // 過濾非人工觸發的預加載請求
    // ... 原有的歸因邏輯
});
```

`event.isTrusted` 為 `true` 時表示該事件由真實的用戶操作觸發，為 `false` 時表示由腳本或瀏覽器預加載機制觸發。

</rule>

---

## 結論

整體回傳狀況良好，PageView 與 Purchase 的成功率均達到預期水準。Lead 事件的 Android 預加載問題已有明確的修復方案，建議在下一次腳本更新中一併部署。後續應持續監控 Lead 成功率，確認修復效果。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-bc-pixel-events.md`](godview-bc-pixel-events.md) | BC 像素事件定義與規範 |
| [`godview-bc-pixel-chain-js-analysis.md`](godview-bc-pixel-chain-js-analysis.md) | pixel-chain.js 邏輯分析，修復方案的實施位置 |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | Worker `/bc-event` 路由邏輯 |
