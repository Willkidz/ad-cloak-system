---
title: "Cloudflare Worker line-redirect Pixel ID 遺失問題調查報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "調查 Worker line-redirect 因冷啟動（Cold Start）競態條件導致 Meta Pixel ID 間歇性遺失的根本原因：FALLBACK_CONFIG 的 MASTER_PIXEL_MAP 為空，冷啟動 Isolate 的首個請求寫入空 pixel_id。提出治標（補齊 FALLBACK_CONFIG）與治本（冷啟動時 await refreshConfig）兩套修復方案。"
id: "20260328-godview-pixel-id-analysis"
type: analysis
tags: [capi, cloaking, cloudflare-d1, cloudflare-workers, godview, line-redirect]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: Worker `line-redirect` 的 Pixel ID 間歇性遺失（36 筆匹配中 12 筆缺少 `pixel_id`），根本原因是**冷啟動競態條件**：Worker 使用全域 `cachedConfig` 快取 n8n Config API 設定，但 `FALLBACK_CONFIG.MASTER_PIXEL_MAP` 預設為空物件 `{}`。當 Cloudflare 啟動新 Isolate 時，首個請求使用 Fallback，導致 `masterPixel` 為 `null`，寫入 D1 的 `pixel_id` 為空字串。後續請求因 `cachedConfig` 已被背景 `refreshConfig()` 填充而正常。修復建議：**治標**——在 `FALLBACK_CONFIG` 中硬編碼常用 master pixel（`cs`/`js`/`ms`/`ls` → `1296143099239936`）；**治本**——冷啟動時改用 `await refreshConfig()` 同步等待，代價為首個請求增加數百毫秒延遲。

# Cloudflare Worker line-redirect Pixel ID 遺失問題調查報告

本報告深入調查 Worker `line-redirect` 在處理特定 `ad_code` 時，導致寫入 D1 資料庫的 `pixel_id` 和 `capi_token` 間歇性遺失的根本原因，並提出具體的修復建議。

---

## 問題背景與現象

根據監控數據，特定 `ad_code`（如 CS01、MS05 等）在通過 Worker 處理時，部分請求的 `pixel_id` 與 `capi_token` 未能成功寫入資料庫。在 36 筆匹配紀錄中，有多達 12 筆缺少這些關鍵資訊，直接導致無法回傳 Lead 給 Meta CAPI。

<boundaries id="symptom-pattern">

由於同一個 `ad_code` 的請求結果不一致（有時成功，有時失敗），初步排除了 n8n Config API 未配置該 `ad_code` 的可能性。問題呈現間歇性特徵，指向運行時環境因素。

</boundaries>

---

## 根本原因分析

經過對 Worker 原始碼與 n8n Config API 回應邏輯的交叉比對，確認問題根源在於 **Worker 的全域快取機制與冷啟動（Cold Start）引發的競態條件（Race Condition）**，以及 `FALLBACK_CONFIG` 的預設值不完整。

### 1. Config API 的實際回應

經查證，n8n Config API（Workflow ID: `UCRZ0YDp4ZERmgqk`）的 `AD_MAP` 生成邏輯依賴於 DataTable 中 `type=ad` 或 `type=group` 的資料。然而，DataTable（ID: `vILi9V1mv3ouo6EM`）中全部 19 筆資料的 type 都是 `master`，**沒有任何 `type=ad` 或 `type=group` 的資料**，導致 API 回傳的 `AD_MAP` 始終為空物件 `{}`。與此同時，`MASTER_PIXEL_MAP` 則包含了所有 master tag 的 pixel 資訊。

### 2. Worker 獲取 Pixel 的邏輯

Worker 中獲取 `pixel_id` 的程式碼邏輯如下：

<example id="pixel-fetch-logic">

```javascript
const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];
const masterPixel = MASTER_PIXEL_MAP[tag] || null;

if (masterPixel && masterPixel.pixel) {
    const alreadyExists = adPixels.some((p) => p.pixel === masterPixel.pixel);
    if (!alreadyExists) {
        adPixels.push(masterPixel);
    }
}

const pixels = adPixels;
const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: "", token: "" };
```

</example>

由於 `AD_MAP` 為空，`adInfo` 永遠為 `null`，因此 `adPixels` 初始為空陣列。最終寫入資料庫的 `firstPixel` 完全依賴於 `MASTER_PIXEL_MAP[tag]` 是否能成功取值。

### 3. 冷啟動與快取的競態條件（核心原因）

Worker 使用全域變數 `cachedConfig` 來快取 API 設定，並定義了一個 `FALLBACK_CONFIG`，其 `MASTER_PIXEL_MAP` 預設為空物件。

<rule id="cold-start-race-condition">

問題觸發流程如下：

1. **冷啟動（Cold Start）**：當 Cloudflare 啟動一個新的 Worker Isolate 時，`cachedConfig` 為 `null`。
2. **使用 Fallback**：第一個進入此 Isolate 的請求會立即使用 `FALLBACK_CONFIG`。此時，`MASTER_PIXEL_MAP` 是空的 `{}`。
3. **Pixel 遺失**：由於 `MASTER_PIXEL_MAP` 為空，`masterPixel` 為 `null`，最終導致寫入資料庫的 `pixel_id` 為空字串。
4. **背景更新**：與此同時，Worker 在背景非同步觸發 `refreshConfig()` 以獲取遠端設定。
5. **熱啟動（Hot Start）**：當 `refreshConfig()` 完成後，`cachedConfig` 被成功賦值。後續進入同一個 Isolate 的請求，便能從 `cachedConfig.MASTER_PIXEL_MAP` 獲取正確的 pixel 資訊，正常運作。

</rule>

此流程完美解釋了「同一個 `ad_code` 有時有 pixel 有時沒有」的現象：**命中冷啟動 Isolate 的請求會遺失 pixel，而命中熱啟動 Isolate 的請求則能正常取得。**

---

## 修復建議

為徹底解決此問題，建議同時實作以下兩種修復方式，以確保系統的穩健性。

### 建議一：補齊 FALLBACK_CONFIG（治標）

<step id="fix-fallback-config">

修改 Worker 程式碼，在 `FALLBACK_CONFIG` 中手動填入 `MASTER_PIXEL_MAP` 的常用預設值。這能確保即使在冷啟動狀態下，Worker 也能獲取到基本的 pixel 資訊，避免空值寫入。

</step>

<example id="fallback-before">

修改前：
```javascript
var FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  MASTER_PIXEL_MAP: {}, // 空物件是問題來源
  DEFAULT_MSG: FALLBACK_DEFAULT_MSG
};
```

</example>

<example id="fallback-after">

修改後：
```javascript
var FALLBACK_CONFIG = {
  LINE_MAP: FALLBACK_LINE_MAP,
  AD_MAP: {},
  MASTER_PIXEL_MAP: {
    "cs": { "pixel": "1296143099239936", "token": "EAAeahovhP0c..." },
    "js": { "pixel": "1296143099239936", "token": "EAAeahovhP0c..." },
    "ms": { "pixel": "1296143099239936", "token": "EAAeahovhP0c..." },
    "ls": { "pixel": "1296143099239936", "token": "EAAeahovhP0c..." }
    // 建議將其他常用的 master pixel 也補上
  },
  DEFAULT_MSG: FALLBACK_DEFAULT_MSG
};
```

</example>

### 建議二：冷啟動時同步等待設定（治本）

<step id="use-await-for-config">

目前的非同步架構在需要精確追蹤的廣告場景中存在風險。建議修改 Worker 的主邏輯，在 `cachedConfig` 為空時，**強制同步等待（await）** `refreshConfig()` 完成，而不是在背景執行。

</step>

<example id="await-fix">

```javascript
// 移除原有的 getConfigSync() 呼叫
const now = Date.now();
if (!cachedConfig || now - cacheTime > CACHE_TTL) {
  // 如果是冷啟動，強制等待 fetch 完成
  if (!cachedConfig) {
    await refreshConfig();
  } else {
    // 如果只是快取過期，則在背景更新，不阻塞當前請求
    ctx.waitUntil(refreshConfig());
  }
}

// 確保即使 fetch 失敗，也有 fallback 可用
const config = cachedConfig || FALLBACK_CONFIG;
```

</example>

<boundaries id="await-tradeoff">

此修改可確保冷啟動的第一個請求 100% 獲取到最新的 `MASTER_PIXEL_MAP`，徹底根除 Pixel 遺失問題。代價是冷啟動請求會增加數百毫秒的延遲（Config API 的 RTT），但對用戶體驗影響極小，因為後續的 302 重定向才是用戶感知的主要延遲來源。

</boundaries>

---

## 結論

Cloudflare Worker 的 Pixel ID 遺失問題，其根本原因在於冷啟動時非同步獲取設定與不完整的 Fallback 設定相結合所引發的競態條件。建議立即採取「治標」措施，補齊 `FALLBACK_CONFIG` 以快速緩解問題。同時，應規劃實施「治本」方案，將冷啟動時的設定獲取改為同步等待，以長遠確保資料的完整性和準確性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | BC 像素 vs 廣告像素邏輯分析，含 DataTable 現況 |
| [`godview-cf-worker-deploy-verify.md`](godview-cf-worker-deploy-verify.md) | Worker 部署驗證報告（含 BC 像素併入 D1 修復） |
| [`godview-capi-current.md`](godview-capi-current.md) | CAPI 回傳現況與像素合併方案 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統 v3 架構總綱 |
