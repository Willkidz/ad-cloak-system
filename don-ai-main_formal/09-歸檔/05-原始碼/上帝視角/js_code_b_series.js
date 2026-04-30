// ============================================
// 剋星（B 系列）BC 像素完整邏輯
// 適用 Tags: jb, cb, mb, lb
// ============================================

// 【通用模板】將下方 {TAG} 替換為實際的 tag 值（jb/cb/mb/lb）

(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  
  // 1. 頁面加載時發送 PageView 事件
  new Image().src='https://{TAG}.freshpathlab.com/bc-event?e=PageView&t={TAG}&fbclid='+(fc||'')+'&_='+Date.now();
  
  // 2. 監聽點擊事件
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        // 發送 Contact 事件
        new Image().src='https://{TAG}.freshpathlab.com/bc-event?e=Contact&t={TAG}&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  
  // 3. fbclid 參數保留邏輯
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
        if(typeof o==='function')o.apply(this,arguments);
      };
    }
  },50);
})();

// ============================================
// 【具體實例】
// ============================================

// jb.freshpathlab.com 的 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://jb.freshpathlab.com/bc-event?e=PageView&t=jb&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://jb.freshpathlab.com/bc-event?e=Contact&t=jb&fbclid='+(fc||'')+'&_='+Date.now();
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
        if(typeof o==='function')o.apply(this,arguments);
      };
    }
  },50);
})();

// cb.freshpathlab.com 的 JS 代碼：
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
        if(typeof o==='function')o.apply(this,arguments);
      };
    }
  },50);
})();

// mb.freshpathlab.com 的 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://mb.freshpathlab.com/bc-event?e=PageView&t=mb&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://mb.freshpathlab.com/bc-event?e=Contact&t=mb&fbclid='+(fc||'')+'&_='+Date.now();
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
        if(typeof o==='function')o.apply(this,arguments);
      };
    }
  },50);
})();

// lb.freshpathlab.com 的 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://lb.freshpathlab.com/bc-event?e=PageView&t=lb&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://lb.freshpathlab.com/bc-event?e=Contact&t=lb&fbclid='+(fc||'')+'&_='+Date.now();
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
        if(typeof o==='function')o.apply(this,arguments);
      };
    }
  },50);
})();
