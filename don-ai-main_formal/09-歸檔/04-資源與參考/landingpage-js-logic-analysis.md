---
title: "Landingpage Js Logic Analysis"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Landingpage Js Logic Analysis"
type: "analysis"
tags: [analysis, landing-page]
status: "archived"
---

## 詳細分析

### 剋星（B 系列）- pasted_content.txt

#### Meta Pixel 配置
- **Meta Pixel 代碼狀態**：✗ **缺失**
- 頁面包含 `<!-- Meta Pixel Code -->` 和 `<!-- End Meta Pixel Code -->` 註釋標籤，但兩者之間完全為空，沒有任何 Meta Pixel 初始化代碼。
- **Pixel ID**：未設置
- **fbq 函數**：不存在

#### 跳轉邏輯
- **gotolink 函數定義**：✗ **未定義**
- 頁面中有兩處呼叫 `href="javascript:gotolink();"`，但並未實現 `gotolink()` 函數，導致點擊按鈕時不會執行任何操作。

#### BC 像素事件
- **BC 像素追蹤**：✗ 不存在

#### 問題總結

| 項目 | 狀態 | 嚴重性 |
| :--- | :--- | :--- |
| Meta Pixel 初始化 | ✗ 缺失 | 🔴 嚴重 |
| fbq('track', 'Lead') | ✗ 不存在 | 🔴 嚴重 |
| fbq('track', 'Contact') | ✗ 不存在 | 🔴 嚴重 |
| gotolink 函數 | ✗ 未定義 | 🔴 嚴重 |
| BC 像素事件 | ✗ 不存在 | 🟡 中等 |

---

### 獨角仙（X 系列）- pasted_content_2.txt

#### Meta Pixel 配置
- **Meta Pixel 代碼狀態**：✗ **缺失**
- 與剋星（B 系列）完全相同，包含空的 Meta Pixel 代碼註釋標籤。
- **Pixel ID**：未設置
- **fbq 函數**：不存在

#### 跳轉邏輯
- **gotolink 函數定義**：✗ **未定義**
- 頁面中有兩處呼叫 `href="javascript:gotolink();"`，但沒有實現 `gotolink()` 函數。

#### BC 像素事件
- **BC 像素追蹤**：✗ 不存在

#### 問題總結

| 項目 | 狀態 | 嚴重性 |
| :--- | :--- | :--- |
| Meta Pixel 初始化 | ✗ 缺失 | 🔴 嚴重 |
| fbq('track', 'Lead') | ✗ 不存在 | 🔴 嚴重 |
| fbq('track', 'Contact') | ✗ 不存在 | 🔴 嚴重 |
| gotolink 函數 | ✗ 未定義 | 🔴 嚴重 |
| BC 像素事件 | ✗ 不存在 | 🟡 中等 |

---

### 爆分王（S 系列）- pasted_content_3.txt

#### Meta Pixel 配置
- **Meta Pixel 代碼狀態**：✗ **缺失**
- 同樣包含空的 Meta Pixel 代碼註釋標籤。
- **Pixel ID**：未設置
- **fbq 函數**：不存在

#### 跳轉邏輯
- **gotolink 函數定義**：✓ **已定義（部分）**
- 頁面中有兩處呼叫 `href="javascript:gotolink();"`。
- 在 `[conftpl]` 標籤後的 Script Block 12 中，存在 `window.gotolink` 的重新定義邏輯。

<example title="gotolink 函數重定義邏輯">

```javascript
// 等待 gotolink 函數存在
var _i=setInterval(function(){
  if(typeof window.gotolink==='function'){
    clearInterval(_i);
    var o=window.gotolink;
    window.gotolink=function(){
      // 修改 Location.prototype.href 的 setter
      // 在跳轉前添加 fbclid 參數
      o.apply(this,arguments);
    };
  }
},50);
```

</example>

#### BC 像素事件
- **BC 像素追蹤**：✓ **已實現**
- **端點**：`https://cs.freshpathlab.com/bc-event`
- **事件類型**：
  1. **頁面加載事件**：`e=PageView`
  2. **點擊事件**：`e=Contact`

<example title="BC 像素事件實現代碼">

```javascript
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  // 1. 頁面加載時發送 PageView 事件
  new Image().src='https://cs.freshpathlab.com/bc-event?e=PageView&t=cs&_='+Date.now();
  
  // 2. 監聽點擊事件
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      // 檢查是否點擊了包含 gotolink 的元素
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        // 發送 Contact 事件
        new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  
  // 3. fbclid 參數保留邏輯...
})();
```

</example>

#### 問題總結

| 項目 | 狀態 | 嚴重性 |
| :--- | :--- | :--- |
| Meta Pixel 初始化 | ✗ 缺失 | 🔴 嚴重 |
| fbq('track', 'Lead') | ✗ 不存在 | 🔴 嚴重 |
| fbq('track', 'Contact') | ✗ 不存在 | 🔴 嚴重 |
| gotolink 函數 | ✓ 已定義 | 🟢 正常 |
| BC 像素事件 | ✓ 已實現 | 🟢 正常 |

#### 潛在問題：BC 事件名稱映射

- 頁面加載時發送 `PageView` 事件，用戶點擊按鈕時發送 `Contact` 事件。
- **疑慮**：根據廣告歸因系統的標準，通常事件流程應為頁面加載觸發 `Lead` 或 `ViewContent`，用戶點擊提交觸發 `Contact` 或 `Lead`。

> **當前 BC 事件的命名 (`PageView`, `Contact`) 可能不符合 Meta Pixel 的標準事件名稱，這可能導致 Meta 廣告優化算法無法正確識別轉換。**

---

### BF博富 - pasted_content_4.txt

#### Meta Pixel 配置
- **Meta Pixel 代碼狀態**：✗ **缺失**
- 包含空的 Meta Pixel 代碼註釋標籤。
- **Pixel ID**：未設置
- **fbq 函數**：不存在

#### 跳轉邏輯
- **gotolink 函數定義**：✓ **已定義**
- 頁面中有一處呼叫 `href="javascript:gotolink();"`。
- 在 `[conftpl]` 標籤後的 Script Block 5 中，實現了 fbclid 參數保留邏輯。

<example title="fbclid 參數保留邏輯">

```javascript
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  if(!fc)return;  // 如果沒有 fbclid，直接返回
  var o=window.gotolink;
  window.gotolink=function(){
    // 修改 Location.prototype.href 的 setter
    // 在跳轉前添加 fbclid 參數
    if(typeof o==='function')o.apply(this,arguments);
  };
})();
```

</example>

#### BC 像素事件
- **BC 像素追蹤**：✗ 不存在

#### 問題總結

| 項目 | 狀態 | 嚴重性 |
| :--- | :--- | :--- |
| Meta Pixel 初始化 | ✗ 缺失 | 🔴 嚴重 |
| fbq('track', 'Lead') | ✗ 不存在 | 🔴 嚴重 |
| fbq('track', 'Contact') | ✗ 不存在 | 🔴 嚴重 |
| gotolink 函數 | ✓ 已定義 | 🟢 正常 |
| BC 像素事件 | ✗ 不存在 | 🟡 中等 |

---

## 核心問題診斷

<rule id="missing-meta-pixel">
### 🔴 第一級問題：Meta Pixel 事件完全缺失

**所有四個產品線都存在此問題。** 頁面的 HTML 中雖然包含 `<!-- Meta Pixel Code -->` 註釋，但其間完全為空，沒有正確的初始化腳本。這將導致無法初始化 Meta Pixel，無法發送任何 `fbq('track', ...)` 事件，最終使 Meta 廣告無法進行轉換追蹤和優化。

<example title="正確的 Meta Pixel 初始化代碼">

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->
```

</example>
</rule>

<rule id="undefined-gotolink">
### 🔴 第二級問題：gotolink 函數定義不完整

**前兩個產品線（B、X 系列）存在此問題。** 頁面呼叫了 `gotolink()` 函數，但該函數未定義，導致用戶點擊按鈕時無任何反應，頁面停留在原處。
</rule>

<rule id="non-standard-bc-event">
### 🟡 第三級問題：BC 像素事件名稱可能不符合標準

**爆分王（S 系列）存在此問題。** 其 BC 事件使用了 `PageView` 和 `Contact` 作為事件名稱，這並非 Meta Pixel 的標準事件。如果後端映射規則不正確，可能導致 Meta 廣告優化算法無法識別轉換。
</rule>

---

## 事件名稱對調分析

### 用戶懷疑：Lead 和 Contact 事件是否互換？

**分析結論：**

> 根據分析，問題並非簡單的 `Lead` 和 `Contact` 事件互換。主要問題在於 **Meta Pixel 事件的完全缺失**。爆分王（S 系列）的 BC 事件使用了非標準的事件名稱，但這與事件互換是不同的問題。

### 推測的正確事件流程

<step>用戶點擊 Facebook 廣告</step>
<step>到達落地頁</step>
<step>頁面加載 → 發送 `fbq('track', 'Lead')` 或 `fbq('track', 'ViewContent')`</step>
<step>用戶點擊按鈕加入 LINE</step>
<step>發送 `fbq('track', 'Contact')`</step>
<step>跳轉到 LINE 加好友</step>

---

## 建議修復方案

<rule id="fix-priority-1">
### 🔴 優先級 1：添加 Meta Pixel 代碼

所有四個產品線都需要在 `<!-- Meta Pixel Code -->` 註釋之間添加正確的 Meta Pixel 初始化代碼，並將 `YOUR_PIXEL_ID` 替換為實際的 Meta Pixel ID。

<example title="Meta Pixel 初始化代碼">

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->
```

</example>
</rule>

<rule id="fix-priority-2">
### 🔴 優先級 2：實現 gotolink 函數

前兩個產品線（B、X 系列）需要在 `</body>` 前添加 `gotolink` 函數定義，並將 `YOUR_LINE_FRIEND_URL` 替換為實際的 LINE 加好友 URL。

<example title="gotolink 函數實現">

```javascript
<script>
  window.gotolink = function() {
    // 發送 Meta Pixel 事件
    if (typeof fbq === 'function') {
      fbq('track', 'Contact');
    }
    // 跳轉到 LINE 加好友
    window.location.href = 'YOUR_LINE_FRIEND_URL';
  };
</script>
```

</example>
</rule>

<rule id="fix-priority-3">
### 🟡 優先級 3：修正 BC 事件名稱

建議將爆分王（S 系列）的 BC 事件名稱改為更符合標準的名稱（如 `Lead`），或與 BC 系統提供商確認事件映射規則，確保 `PageView` 和 `Contact` 能被正確映射到 Meta Pixel 事件。

<example title="BC 事件名稱修正建議">

```javascript
// 修改前
new Image().src='https://cs.freshpathlab.com/bc-event?e=PageView&t=cs&_='+Date.now();
new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&_='+Date.now();

// 修改後 (建議)
new Image().src='https://cs.freshpathlab.com/bc-event?e=Lead&t=cs&_='+Date.now(); // PageView -> Lead
new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&_='+Date.now(); // Contact 保持不變或按需調整
```

</example>
</rule>

<rule id="fix-priority-4">
### 🟡 優先級 4：為 BF博富添加 BC 像素事件

建議為 BF博富頁面添加 BC 像素事件追蹤，可參考爆分王（S 系列）的實現方式。
</rule>

---

## 總結表格

| 產品線 | Meta Pixel | fbq 事件 | gotolink | BC 事件 | 整體狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 剋星（B） | ✗ 缺失 | ✗ 無 | ✗ 未定義 | ✗ 無 | 🔴 不可用 |
| 獨角仙（X） | ✗ 缺失 | ✗ 無 | ✗ 未定義 | ✗ 無 | 🔴 不可用 |
| 爆分王（S） | ✗ 缺失 | ✗ 無 | ✓ 已定義 | ✓ 已實現 | 🟡 部分可用 |
| BF博富 | ✗ 缺失 | ✗ 無 | ✓ 已定義 | ✗ 無 | 🟡 部分可用 |

---

## 結論

> **用戶懷疑的 `Lead` 和 `Contact` 事件互換問題並非根本原因。**
>
> 根據本次分析，最核心的問題是 **所有產品線都缺少 Meta Pixel 代碼初始化**，這導致整個廣告歸因系統無法正常工作。其次，部分產品線的跳轉鏈路中斷。最後，已實現的 BC 事件也存在命名不規範的潛在風險。
>
> **建議立即修復優先級 1 和 2 的問題，以恢復基礎的廣告追蹤與頁面跳轉功能。**

---

## 相關文件

- None
