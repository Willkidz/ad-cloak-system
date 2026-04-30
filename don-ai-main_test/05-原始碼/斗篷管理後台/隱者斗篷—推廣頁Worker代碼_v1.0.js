// ============================================
// 推廣頁 (Money Page) v1.0
// Cloudflare Worker - 博富娛樂城
// ============================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  return new Response(getHTML(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>博富娛樂城 - 注冊就送 20000</title>
<meta name="description" content="博富娛樂城，最頂級的線上娛樂體驗，注冊即送20000，出款秒到帳。">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;background:#0a0a1a;color:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}

/* Gold coin animation */
.coin-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden}
.coin{position:absolute;top:-60px;font-size:24px;animation:coinFall linear infinite;opacity:0.7}
@keyframes coinFall{
  0%{transform:translateY(-60px) rotate(0deg);opacity:0.7}
  100%{transform:translateY(110vh) rotate(720deg);opacity:0}
}

/* Hero */
.hero{position:relative;z-index:1;background:linear-gradient(180deg,#0a0a1a 0%,#1a0a2e 40%,#0d1b3e 100%);padding:60px 20px 50px;text-align:center;overflow:hidden}
.hero::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(255,215,0,0.12) 0%,transparent 70%);pointer-events:none}
.hero::after{content:"";position:absolute;bottom:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,#ffd700,transparent)}
.hero-crown{font-size:3rem;display:block;margin-bottom:10px;filter:drop-shadow(0 0 20px rgba(255,215,0,0.5))}
.hero h1{font-size:2.6rem;font-weight:800;background:linear-gradient(135deg,#ffd700,#ffaa00,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;letter-spacing:2px}
.hero-sub{font-size:1.4rem;color:#ffd700;font-weight:700;margin-bottom:8px;text-shadow:0 0 20px rgba(255,215,0,0.4)}
.hero-amount{font-size:3.2rem;font-weight:900;background:linear-gradient(135deg,#ffd700,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;margin:10px 0 20px;letter-spacing:3px}
.hero-desc{color:rgba(255,255,255,0.7);font-size:0.95rem;max-width:400px;margin:0 auto}

/* CTA Button */
.cta-btn{display:inline-block;background:linear-gradient(135deg,#ffd700,#ff8c00);color:#1a0a2e;font-size:1.2rem;font-weight:800;padding:16px 52px;border-radius:50px;margin-top:28px;position:relative;overflow:hidden;animation:pulse 2s ease-in-out infinite;box-shadow:0 0 30px rgba(255,215,0,0.4);letter-spacing:1px}
.cta-btn::after{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent 30%,rgba(255,255,255,0.3) 50%,transparent 70%);animation:shine 3s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(255,215,0,0.4)}50%{transform:scale(1.05);box-shadow:0 0 50px rgba(255,215,0,0.6)}}
@keyframes shine{0%{transform:translateX(-100%) rotate(25deg)}100%{transform:translateX(100%) rotate(25deg)}}

/* Section */
.section{position:relative;z-index:1;padding:50px 20px}
.section-title{text-align:center;font-size:1.5rem;font-weight:700;margin-bottom:8px}
.section-title span{background:linear-gradient(135deg,#ffd700,#ffaa00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.section-line{width:60px;height:3px;background:linear-gradient(90deg,#ffd700,#ff8c00);margin:12px auto 32px;border-radius:2px}

/* Selling Points */
.sell-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:600px;margin:0 auto}
.sell-card{background:linear-gradient(145deg,rgba(255,215,0,0.08),rgba(255,255,255,0.03));border:1px solid rgba(255,215,0,0.15);border-radius:16px;padding:28px 16px;text-align:center;transition:transform 0.3s}
.sell-card:hover{transform:translateY(-4px)}
.sell-icon{font-size:2.2rem;display:block;margin-bottom:10px}
.sell-card h3{font-size:0.95rem;color:#ffd700;margin-bottom:6px;font-weight:700}
.sell-card p{font-size:0.78rem;color:rgba(255,255,255,0.6);line-height:1.5}

/* Promo */
.promo{background:linear-gradient(180deg,rgba(255,215,0,0.05),transparent);border-top:1px solid rgba(255,215,0,0.1);border-bottom:1px solid rgba(255,215,0,0.1)}
.promo-box{max-width:500px;margin:0 auto;background:linear-gradient(145deg,rgba(255,215,0,0.06),rgba(139,0,0,0.06));border:1px solid rgba(255,215,0,0.2);border-radius:20px;padding:32px 24px;text-align:center}
.promo-badge{display:inline-block;background:linear-gradient(135deg,#ff4444,#cc0000);color:#fff;font-size:0.8rem;font-weight:700;padding:5px 16px;border-radius:12px;margin-bottom:14px;letter-spacing:1px}
.promo-title{font-size:1.3rem;font-weight:700;color:#ffd700;margin-bottom:10px}
.promo-desc{color:rgba(255,255,255,0.7);font-size:0.9rem;margin-bottom:20px;line-height:1.6}
.countdown{display:flex;justify-content:center;gap:10px;margin-bottom:20px}
.cd-item{background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.2);border-radius:10px;padding:10px 14px;min-width:60px}
.cd-num{font-size:1.6rem;font-weight:800;color:#ffd700;display:block}
.cd-label{font-size:0.65rem;color:rgba(255,255,255,0.5);margin-top:2px}
.promo-slots{color:#ff6b6b;font-size:0.85rem;font-weight:600;margin-top:8px}

/* Trust */
.trust{background:rgba(255,255,255,0.02)}
.trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:600px;margin:0 auto}
.trust-item{text-align:center;padding:20px 12px}
.trust-icon{font-size:1.8rem;display:block;margin-bottom:8px}
.trust-num{font-size:1.5rem;font-weight:800;color:#ffd700;display:block;margin-bottom:4px}
.trust-label{font-size:0.75rem;color:rgba(255,255,255,0.5)}

/* Bottom CTA */
.bottom-cta{text-align:center;padding:50px 20px 60px;position:relative;z-index:1}
.bottom-cta h2{font-size:1.3rem;color:rgba(255,255,255,0.9);margin-bottom:20px;font-weight:600}
.cta-btn-bottom{display:inline-block;background:linear-gradient(135deg,#00c853,#00e676);color:#0a0a1a;font-size:1.1rem;font-weight:800;padding:16px 48px;border-radius:50px;animation:pulse2 2s ease-in-out infinite;box-shadow:0 0 30px rgba(0,200,83,0.3);letter-spacing:1px}
@keyframes pulse2{0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(0,200,83,0.3)}50%{transform:scale(1.05);box-shadow:0 0 50px rgba(0,200,83,0.5)}}

/* Footer */
footer{background:rgba(0,0,0,0.3);padding:20px;text-align:center;font-size:0.75rem;color:rgba(255,255,255,0.3);position:relative;z-index:1}

/* Fade-in animation */
.fade-in{opacity:0;transform:translateY(20px);transition:opacity 0.6s,transform 0.6s}
.fade-in.visible{opacity:1;transform:translateY(0)}

/* Responsive */
@media(max-width:480px){
  .hero h1{font-size:2rem}
  .hero-amount{font-size:2.4rem}
  .hero-sub{font-size:1.1rem}
  .sell-grid{grid-template-columns:repeat(3,1fr);gap:10px}
  .sell-card{padding:20px 10px}
  .sell-icon{font-size:1.8rem}
  .sell-card h3{font-size:0.82rem}
  .sell-card p{font-size:0.72rem}
  .trust-grid{grid-template-columns:repeat(3,1fr);gap:10px}
  .cta-btn{padding:14px 40px;font-size:1.1rem}
}
</style>
</head>
<body>

<!-- Coin Animation Container -->
<div class="coin-container" id="coinContainer"></div>

<!-- Hero -->
<section class="hero">
  <span class="hero-crown">👑</span>
  <h1>博富娛樂城</h1>
  <p class="hero-sub">注冊就送</p>
  <span class="hero-amount">20,000</span>
  <p class="hero-desc">全網最頂級的線上娛樂體驗，百萬玩家的首選平台</p>
  <a href="#" class="cta-btn">立即開版</a>
</section>

<!-- Selling Points -->
<section class="section fade-in">
  <h2 class="section-title"><span>為什麼選擇博富</span></h2>
  <div class="section-line"></div>
  <div class="sell-grid">
    <div class="sell-card">
      <span class="sell-icon">💰</span>
      <h3>大額無憂</h3>
      <p>超高額度，大額存取不受限</p>
    </div>
    <div class="sell-card">
      <span class="sell-icon">⚡</span>
      <h3>出款秒到</h3>
      <p>獨家通道，最快 30 秒到帳</p>
    </div>
    <div class="sell-card">
      <span class="sell-icon">🔥</span>
      <h3>全網最高返水</h3>
      <p>業界最高返水比例，天天領</p>
    </div>
  </div>
</section>

<!-- Promo -->
<section class="section promo fade-in">
  <div class="promo-box">
    <span class="promo-badge">🔥 限時活動</span>
    <h3 class="promo-title">新會員首存加碼 100%</h3>
    <p class="promo-desc">活動期間註冊並完成首次存款，即可獲得等額加碼獎勵，最高可領 50,000！</p>
    <div class="countdown">
      <div class="cd-item">
        <span class="cd-num" id="cdHours">23</span>
        <span class="cd-label">時</span>
      </div>
      <div class="cd-item">
        <span class="cd-num" id="cdMins">59</span>
        <span class="cd-label">分</span>
      </div>
      <div class="cd-item">
        <span class="cd-num" id="cdSecs">59</span>
        <span class="cd-label">秒</span>
      </div>
    </div>
    <a href="#" class="cta-btn" style="margin-top:0;font-size:1rem;padding:12px 36px">立即領取</a>
    <p class="promo-slots">⚠️ 今日剩餘名額：<span id="slotsLeft">37</span> 位</p>
  </div>
</section>

<!-- Trust -->
<section class="section trust fade-in">
  <h2 class="section-title"><span>值得信賴</span></h2>
  <div class="section-line"></div>
  <div class="trust-grid">
    <div class="trust-item">
      <span class="trust-icon">🛡️</span>
      <span class="trust-num">256</span>
      <span class="trust-label">位元 SSL 加密</span>
    </div>
    <div class="trust-item">
      <span class="trust-icon">📞</span>
      <span class="trust-num">24/7</span>
      <span class="trust-label">全天候客服</span>
    </div>
    <div class="trust-item">
      <span class="trust-icon">👥</span>
      <span class="trust-num" id="playerCount">0</span>
      <span class="trust-label">萬玩家信賴</span>
    </div>
  </div>
</section>

<!-- Bottom CTA -->
<section class="bottom-cta fade-in">
  <h2>把握機會，開啟您的財富之旅</h2>
  <a href="#" class="cta-btn-bottom">立即加入，開啟財富之旅</a>
</section>

<!-- Footer -->
<footer>
  <p>&copy; 2026 博富娛樂城 All Rights Reserved.</p>
</footer>

<script>
// Coin fall animation
(function(){
  var container=document.getElementById('coinContainer');
  var coins=['🪙','💰','✨','⭐'];
  function createCoin(){
    var el=document.createElement('div');
    el.className='coin';
    el.textContent=coins[Math.floor(Math.random()*coins.length)];
    el.style.left=Math.random()*100+'%';
    el.style.fontSize=(16+Math.random()*16)+'px';
    var dur=4+Math.random()*6;
    el.style.animationDuration=dur+'s';
    el.style.animationDelay=Math.random()*2+'s';
    container.appendChild(el);
    setTimeout(function(){el.remove()},dur*1000+2000);
  }
  setInterval(createCoin,400);
  for(var i=0;i<8;i++) setTimeout(createCoin,i*200);
})();

// Countdown timer
(function(){
  var h=23,m=59,s=59;
  function tick(){
    s--;
    if(s<0){s=59;m--;}
    if(m<0){m=59;h--;}
    if(h<0){h=23;m=59;s=59;}
    document.getElementById('cdHours').textContent=h<10?'0'+h:h;
    document.getElementById('cdMins').textContent=m<10?'0'+m:m;
    document.getElementById('cdSecs').textContent=s<10?'0'+s:s;
  }
  setInterval(tick,1000);
})();

// Number rolling animation for player count
(function(){
  var target=186;
  var current=0;
  var el=document.getElementById('playerCount');
  var step=target/60;
  function roll(){
    current+=step;
    if(current>=target){current=target;el.textContent=target;return;}
    el.textContent=Math.floor(current);
    requestAnimationFrame(roll);
  }
  setTimeout(roll,800);
})();

// Slots countdown
(function(){
  var el=document.getElementById('slotsLeft');
  var n=37;
  setInterval(function(){
    if(Math.random()<0.3&&n>5){
      n--;
      el.textContent=n;
    }
  },8000);
})();

// Fade-in on scroll
(function(){
  var items=document.querySelectorAll('.fade-in');
  function check(){
    items.forEach(function(el){
      var rect=el.getBoundingClientRect();
      if(rect.top<window.innerHeight-60){
        el.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll',check);
  check();
})();
</script>

</body>
</html>`;
}
