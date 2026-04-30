---
title: "Landingpage Js Edit Cmd"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Landingpage Js Edit Cmd"
type: "cmd"
tags: [changelog, landing-page]
status: "archived"
---

## 爆分王 (S 系列)

### 狀況：已有 JS，需要修改

<step>
**1. 定位現有腳本**

在落地頁 HTML 原始碼中，約在第 200 至 235 行之間，`</body>` 標籤前，可以找到一段現有的 `<script>` 區塊。此為舊版的 BC 像素 JS。

</step>

<step>
**2. 問題分析**

現有腳本在發送追蹤事件時，未將 `fbclid` 參數傳遞給 Worker，導致後端無法進行歸因分析。

</step>

<step>
**3. 執行替換**

將以下舊的程式碼區塊：

<example>
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://cs.freshpathlab.com/bc-event?e=PageView&t=cs&_='+Date.now( );
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&_='+Date.now( );
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

完整替換為以下新版本：

<example>
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://cs.freshpathlab.com/bc-event?e=PageView&t=cs&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

**變更說明**：此修改在 `PageView` 和 `Contact` 事件的請求 URL 中增加了 `&fbclid='+(fc||'')+'`，確保 `fbclid` 能被後端 Worker 接收。

</step>

---

## 剋星 (B 系列) 與 獨角仙 (X 系列)

### 狀況：沒有 JS，需要新增

<step>
**1. 定位插入點**

這兩個產品線的落地頁目前沒有 BC 像素腳本。腳本需要被插入到 `</body></html>` 標籤的正前方。

</step>

<step>
**2. 新增腳本**

根據對應的產品線，將以下相應的程式碼區塊完整複製並貼上到 `</body></html>` 之前。

<example>
**剋星 (B 系列) 專用腳本** (`tag: cb`):
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://cb.freshpathlab.com/bc-event?e=PageView&t=cb&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://cb.freshpathlab.com/bc-event?e=Contact&t=cb&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

<example>
**獨角仙 (X 系列) 專用腳本** (`tag: cx`):
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://cx.freshpathlab.com/bc-event?e=PageView&t=cx&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://cx.freshpathlab.com/bc-event?e=Contact&t=cx&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

</step>

---

## BF 博富

### 狀況：已有部分 JS，需整合 BC 像素事件

<step>
**1. 定位現有腳本**

在 `</body>` 標籤前，已存在一段僅用於保留 `fbclid` 的腳本，但缺少 BC 像素事件發送功能。

</step>

<step>
**2. 執行替換**

將以下舊的程式碼區塊：

<example>
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  if(!fc)return;
  var o=window.gotolink;
  window.gotolink=function(){
    var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
    var origSet=desc.set;
    desc.set=function(v){
      if(v&&v.indexOf('fbclid')===-1){
        v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
      }
      origSet.call(this,v);
    };
    Object.defineProperty(Location.prototype,'href',desc);
    if(typeof o==='function')o.apply(this,arguments);
  };
})();
</script>
```
</example>

完整替換為以下整合版本：

<example>
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://bf.freshpathlab.com/bc-event?e=PageView&t=bf&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://bf.freshpathlab.com/bc-event?e=Contact&t=bf&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

**變更說明**：
1.  **新增事件**：加入了 `PageView` 和 `Contact` 的 BC 像素事件發送邏輯。
2.  **保留功能**：保留了原有的 `fbclid` 跨頁傳遞邏輯。
3.  **邏輯優化**：調整了 `if(!fc)return;` 的位置，確保即使沒有 `fbclid`，像素事件依然能發送。
4.  **穩定性提升**：改用 `setInterval` 輪詢等待 `window.gotolink` 函數加載完成，以應對火鳥系統的動態注入機制。

</step>

---

## 兩斤炭吉 (jd)

<step>
[待確認：需確認「兩斤炭吉」產品線是否使用獨立的落地頁，以及是否需要添加追蹤腳本。]

如果需要，操作方式與「剋星」系列相同，在 `</body></html>` 前加入以下專用腳本 (`tag: jd`)：

<example>
```html
<script>
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://jd.freshpathlab.com/bc-event?e=PageView&t=jd&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://jd.freshpathlab.com/bc-event?e=Contact&t=jd&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var _i=setInterval(function(){
    if(typeof window.gotolink==='function'){
      clearInterval(_i);
      var o=window.gotolink;
      window.gotolink=function(){
        var desc=Object.getOwnPropertyDescriptor(Location.prototype,'href');
        var origSet=desc.set;
        desc.set=function(v){
          if(v&&v.indexOf('fbclid')===-1){
            v+=(v.indexOf('?')>-1?'&':'?')+'fbclid='+encodeURIComponent(fc);
          }
          origSet.call(this,v);
        };
        Object.defineProperty(Location.prototype,'href',desc);
        o.apply(this,arguments);
      };
    }
  },50);
  setTimeout(function(){clearInterval(_i)},5000);
})();
</script>
```
</example>

</step>

---

## 總結與快速對照表

本文提供了在火鳥後台針對不同產品線落地頁的 JS 修改方案。核心是確保 BC 像素事件（PageView, Contact）和 `fbclid` 能夠被正確發送和傳遞。執行前請務必根據下表確認操作方式。

| 產品線 | 落地頁狀態 | 操作方式 | 位置 | tag | 域名 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 爆分王 (S) | 已有舊 JS | 整段取代 | `</body>` 前的 `<script>` | cs | cs.freshpathlab.com |
| 剋星 (B) | 沒有 JS | 新增 | `</body></html>` 前 | cb | cb.freshpathlab.com |
| 獨角仙 (X) | 沒有 JS | 新增 | `</body></html>` 前 | cx | cx.freshpathlab.com |
| BF 博富 | 只有 fbclid 保留 | 整段取代 | `</body>` 前的 `<script>` | bf | bf.freshpathlab.com |
| 兩斤炭吉 (jd) | [待確認] | 新增 | `</body></html>` 前 | jd | jd.freshpathlab.com |

<rule id="lp-js-dependency-warning">
> **部署前置條件**：[待確認: Worker /bc-event 端點的修復狀態]。這些 JS 腳本的正確執行，依賴於後端 Worker 的 `/bc-event` 端點正常工作。請務必在確認 Worker 的相關錯誤（如 TDZ BUG）已修復並成功部署後，再執行本指南中的腳本修改操作。
</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `[待提供]` | Worker 部署與狀態追蹤文件 |
