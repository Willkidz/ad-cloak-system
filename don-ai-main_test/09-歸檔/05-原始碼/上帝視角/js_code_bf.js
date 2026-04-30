// ============================================
// BF 博富 BC 像素完整邏輯
// 適用 Tags: bf, jd
// 注意：整合了現有的 fbclid 保留邏輯
// ============================================

// 【通用模板】將下方 {TAG} 替換為實際的 tag 值（bf/jd）

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
  
  // 3. fbclid 參數保留邏輯（整合現有邏輯）
  if(!fc)return;
  var o=window.gotolink;
  if(o){
    // 如果 gotolink 已存在，直接攔截
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

// bf.freshpathlab.com 的 JS 代碼：
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

// jd.freshpathlab.com 的 JS 代碼：
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
