// ============================================
// 爆分王（S 系列）BC 像素邏輯 - 改善版本
// 適用 Tags: js, cs, ms, ls
// 改善內容：
// 1. 在事件中傳遞 fbclid，便於 Worker 進行用戶匹配
// 2. 優化 fbclid 保留邏輯，檢查 gotolink 是否已存在
// ============================================

// 【通用模板】將下方 {TAG} 替換為實際的 tag 值（js/cs/ms/ls）

(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  
  // 1. 頁面加載時發送 PageView 事件（改善：傳遞 fbclid）
  new Image().src='https://{TAG}.freshpathlab.com/bc-event?e=PageView&t={TAG}&fbclid='+(fc||'')+'&_='+Date.now();
  
  // 2. 監聽點擊事件
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        // 發送 Contact 事件（改善：傳遞 fbclid）
        new Image().src='https://{TAG}.freshpathlab.com/bc-event?e=Contact&t={TAG}&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  
  // 3. fbclid 參數保留邏輯（改善版本）
  if(!fc)return;
  var o=window.gotolink;
  if(o){
    // 改善：如果 gotolink 已存在，直接攔截，避免輪詢
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
  }else{
    // 如果 gotolink 尚未定義，使用輪詢等待
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
  }
})();

// ============================================
// 【具體實例】
// ============================================

// js.freshpathlab.com 的改善版 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://js.freshpathlab.com/bc-event?e=PageView&t=js&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://js.freshpathlab.com/bc-event?e=Contact&t=js&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var o=window.gotolink;
  if(o){
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
  }else{
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
  }
})();

// cs.freshpathlab.com 的改善版 JS 代碼：
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
  var o=window.gotolink;
  if(o){
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
  }else{
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
  }
})();

// ms.freshpathlab.com 的改善版 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://ms.freshpathlab.com/bc-event?e=PageView&t=ms&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://ms.freshpathlab.com/bc-event?e=Contact&t=ms&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var o=window.gotolink;
  if(o){
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
  }else{
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
  }
})();

// ls.freshpathlab.com 的改善版 JS 代碼：
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  new Image().src='https://ls.freshpathlab.com/bc-event?e=PageView&t=ls&fbclid='+(fc||'')+'&_='+Date.now();
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1||el.classList.contains('gotolink')){
        new Image().src='https://ls.freshpathlab.com/bc-event?e=Contact&t=ls&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
  if(!fc)return;
  var o=window.gotolink;
  if(o){
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
  }else{
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
  }
})();
