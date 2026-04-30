<!-- BC 受眾像素追蹤代碼 - 貼到火鳥落地頁「源碼」的 </body> 前面 -->
<script>
(function(){
  // === 設定 ===
  var WORKER_HOST = location.hostname; // 自動取當前子域名（如 mb.freshpathlab.com）
  var BC_ENDPOINT = 'https://' + WORKER_HOST + '/bc-event';
  // 從子域名判斷 tag（如 mb、js01、bf）
  var TAG = WORKER_HOST.split('.')[0];

  // === 發送事件 ===
  function sendBcEvent(eventName) {
    var data = JSON.stringify({ event_name: eventName, tag: TAG });
    // 優先用 sendBeacon（頁面關閉時也能送出）
    if (navigator.sendBeacon) {
      navigator.sendBeacon(BC_ENDPOINT, new Blob([data], { type: 'application/json' }));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', BC_ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    }
  }

  // === PageView：頁面載入時自動發送 ===
  sendBcEvent('PageView');

  // === Purchase：攔截 gotolink() 按鈕點擊 ===
  if (typeof window.gotolink === 'function') {
    var _originalGotolink = window.gotolink;
    window.gotolink = function() {
      sendBcEvent('Purchase');
      return _originalGotolink.apply(this, arguments);
    };
  }

  // 備用：監聽所有帶 onclick="gotolink()" 的按鈕
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document.body) {
      var oc = el.getAttribute('onclick') || '';
      if (oc.indexOf('gotolink') !== -1) {
        sendBcEvent('Purchase');
        return;
      }
      el = el.parentElement;
    }
  }, true);
})();
</script>
