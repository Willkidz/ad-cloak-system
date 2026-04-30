---
title: "LIFF 跳轉系統故障分析報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "分析 line-redirect 與 line-login-callback 的參數傳遞鏈路，定位 LIFF 跳轉失敗的核心原因。"
version: "v1.0"
---
# LIFF 跳轉系統故障分析報告

## 問題描述
用戶回報目前的 `line-redirect` 系統故障。透過分析 `line-redirect.js` 和 `line-login-callback.js` 的程式碼，我發現了導致跳轉失敗的核心問題。

## 1. line-redirect.js 邏輯分析

### Tag 取得方式
在 `line-redirect.js` 的開頭（第 362-363 行），`tag` 是從 `hostname` 取得的：
```javascript
const url = new URL(request.url);
const hostname = url.hostname;
const tag = hostname.split(".")[0];
```
例如：`https://n21.freshpathlab.com`，`tag` 就是 `n21`。

### LIFF 跳轉參數構建
在第 557-570 行，當 `tag` 屬於 `LIFF_TAGS` 時，會構建 LIFF 跳轉 URL：
```javascript
if (LIFF_TAGS.has(tag)) {
  const liffParams = new URLSearchParams({
    tag,
    a: adCode,
    line_id: lineId,
    token,
    fbclid,
    fbc,
    fbp,
    ts: timestamp,
    msg: messageText
  });
  const liffId = LIFF_MAP[tag] || "2009129136-lUm2n85A";
  const liffFullUrl = `https://liff.line.me/${liffId}?${liffParams.toString()}`;
  // ... 返回 HTML 進行跳轉
}
```

**⚠️ 關鍵問題點 1**：`line-redirect` 在構建 `liffParams` 時，**沒有將 `vid` (visitorId) 放入參數中！** 它也沒有放入 `liff_id`。

## 2. line-login-callback.js 邏輯分析

### 參數讀取邏輯
在 `line-login-callback.js` 中，我們剛修改了讀取邏輯（第 16-31 行）：
```javascript
let liffId = url.searchParams.get('liff_id');
let targetOaId = url.searchParams.get('line_id');

if (!liffId || !targetOaId) {
  const liffState = url.searchParams.get('liff.state');
  if (liffState) {
    try {
      const stateParams = new URLSearchParams(
        liffState.startsWith('?') ? liffState.substring(1) : liffState
      );
      if (!liffId) liffId = stateParams.get('liff_id');
      if (!targetOaId) targetOaId = stateParams.get('line_id');
    } catch (e) {}
  }
}
```

在第 99-114 行提取 `vid`：
```javascript
function extractVid() {
  const urlParams = new URLSearchParams(window.location.search);
  let vid = urlParams.get('vid');
  
  if (vid) return vid;
  
  try {
    const decodedIdToken = liff.getDecodedIDToken();
    if (decodedIdToken && decodedIdToken.nonce) {
      vid = decodedIdToken.nonce;
      if (vid) return vid;
    }
  } catch (e) {}
  
  return 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
```

## 3. 故障根源與修復方案

### 故障根源
1. **缺少 `liff_id` 參數**：`line-redirect` 在重定向到 `liff.line.me` 時，沒有在 query string 中帶上 `liff_id`。導致 `line-login-callback` 無法從 `liff.state` 中解析出 `liff_id`，最終 fallback 到預設的 `2009129136-BEXGdu4X`。如果用戶的 TAG 實際上需要不同的 LIFF ID，就會導致 `liff.init()` 失敗。
2. **缺少 `vid` 參數**：`line-redirect` 在資料庫寫入了 `visitorId`（存為 `vid`），但在跳轉 LIFF 時，`liffParams` 中並沒有包含 `vid`。這導致 `line-login-callback` 無法獲取原始的 `vid`，只能在前端隨機生成一個新的 `vid`，這會導致**綁定記錄的 `vid` 與點擊日誌的 `vid` 不一致，歸因鏈路斷裂**。

### 修復方案

需要修改 `line-redirect.js` 中的 LIFF 參數構建邏輯，將缺失的參數補齊。

修改前的代碼（約 558 行）：
```javascript
const liffParams = new URLSearchParams({
  tag,
  a: adCode,
  line_id: lineId,
  token,
  fbclid,
  fbc,
  fbp,
  ts: timestamp,
  msg: messageText
});
const liffId = LIFF_MAP[tag] || "2009129136-lUm2n85A";
```

修改後的代碼：
```javascript
const liffId = LIFF_MAP[tag] || "2009129136-lUm2n85A";
const liffParams = new URLSearchParams({
  tag,
  a: adCode,
  line_id: lineId,
  liff_id: liffId, // 新增：讓 callback 知道是哪個 LIFF ID
  vid: visitorId,  // 新增：傳遞原始的 visitorId 進行綁定
  token,
  fbclid,
  fbc,
  fbp,
  ts: timestamp,
  msg: messageText
});
```

只要在 `line-redirect.js` 中加上這兩行，`line-login-callback.js` 就能正確從 `liff.state` 讀取到 `liff_id`、`line_id` 和 `vid`，完成正確的初始化和綁定流程。
