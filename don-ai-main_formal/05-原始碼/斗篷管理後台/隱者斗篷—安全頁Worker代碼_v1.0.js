// ============================================
// 安全頁 (Safe Page) v1.0
// Cloudflare Worker - 樂享娛樂平台官網
// ============================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  return new Response(getHTML(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>樂享娛樂 - 探索全新遊戲體驗</title>
<meta name="description" content="樂享娛樂平台提供豐富的數位休閒遊戲體驗，安全、公平、便捷的互動娛樂服務。">
<meta name="keywords" content="遊戲平台,數位娛樂,休閒遊戲,互動體驗,娛樂平台">
<meta name="robots" content="index, follow">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:#333;background:#fff;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:#4a6cf7;text-decoration:none}
a:hover{text-decoration:underline}

/* Hero */
.hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:80px 20px 60px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 60%);animation:heroGlow 8s ease-in-out infinite alternate}
@keyframes heroGlow{0%{transform:translate(0,0)}100%{transform:translate(5%,5%)}}
.hero h1{font-size:2.5rem;font-weight:700;margin-bottom:12px;position:relative;z-index:1}
.hero p{font-size:1.15rem;opacity:0.92;position:relative;z-index:1;max-width:500px;margin:0 auto}
.hero-badge{display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:6px 18px;font-size:0.85rem;margin-bottom:20px;position:relative;z-index:1}

/* Container */
.container{max-width:960px;margin:0 auto;padding:0 20px}

/* Section */
.section{padding:60px 20px}
.section-title{text-align:center;font-size:1.6rem;font-weight:700;color:#1a1a2e;margin-bottom:10px}
.section-subtitle{text-align:center;color:#666;font-size:0.95rem;margin-bottom:40px;max-width:600px;margin-left:auto;margin-right:auto}

/* About */
.about{background:#f8f9fc}
.about-text{max-width:720px;margin:0 auto;font-size:1rem;color:#444;text-align:center;line-height:1.9}
.about-text p{margin-bottom:16px}

/* Features */
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;max-width:960px;margin:0 auto}
.feature-card{background:#fff;border:1px solid #eef0f5;border-radius:14px;padding:32px 24px;text-align:center;transition:transform 0.3s,box-shadow 0.3s}
.feature-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(74,108,247,0.1)}
.feature-icon{font-size:2.4rem;margin-bottom:14px;display:block}
.feature-card h3{font-size:1.05rem;color:#1a1a2e;margin-bottom:8px}
.feature-card p{font-size:0.88rem;color:#666;line-height:1.6}

/* Steps */
.steps{background:#f8f9fc}
.steps-grid{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;max-width:720px;margin:0 auto}
.step{text-align:center;flex:1;min-width:180px;max-width:220px}
.step-num{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;margin:0 auto 14px}
.step h3{font-size:1rem;color:#1a1a2e;margin-bottom:6px}
.step p{font-size:0.85rem;color:#666}
.step-arrow{display:flex;align-items:center;color:#ccc;font-size:1.5rem;padding-top:20px}

/* CTA */
.cta{text-align:center;padding:60px 20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff}
.cta h2{font-size:1.6rem;margin-bottom:12px}
.cta p{opacity:0.9;margin-bottom:28px;font-size:1rem}
.btn{display:inline-block;background:#fff;color:#667eea;font-size:1.05rem;font-weight:600;padding:14px 40px;border-radius:30px;transition:transform 0.2s,box-shadow 0.2s;cursor:pointer}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.15);text-decoration:none}

/* Footer */
footer{background:#1a1a2e;color:rgba(255,255,255,0.6);padding:30px 20px;text-align:center;font-size:0.85rem}
footer a{color:rgba(255,255,255,0.75)}
footer a:hover{color:#fff}
footer .links{margin-bottom:10px}
footer .links a{margin:0 12px}

/* Responsive */
@media(max-width:600px){
  .hero{padding:60px 16px 48px}
  .hero h1{font-size:1.8rem}
  .hero p{font-size:1rem}
  .section{padding:44px 16px}
  .section-title{font-size:1.3rem}
  .features-grid{grid-template-columns:1fr 1fr;gap:14px}
  .feature-card{padding:24px 16px}
  .steps-grid{flex-direction:column;align-items:center;gap:20px}
  .step-arrow{display:none}
}
</style>
</head>
<body>

<!-- Hero -->
<section class="hero">
  <div class="hero-badge">🎮 全新數位娛樂平台</div>
  <h1>樂享娛樂</h1>
  <p>探索全新遊戲體驗，盡享安全、公平、便捷的數位互動娛樂世界</p>
</section>

<!-- About -->
<section class="section about">
  <div class="container">
    <h2 class="section-title">關於我們</h2>
    <div class="about-text">
      <p>樂享娛樂是一個致力於打造頂級數位互動體驗的遊戲平台。我們匯集了全球最受歡迎的休閒遊戲內容，為玩家提供安全可靠、公平透明的娛樂環境。無論您是資深玩家還是新手，都能在這裡找到屬於自己的樂趣。</p>
      <p>我們採用業界領先的安全技術，確保每一位用戶的資訊與體驗都受到最高規格的保護。簡潔直覺的操作介面，讓您隨時隨地輕鬆享受精彩的遊戲時光。</p>
    </div>
  </div>
</section>

<!-- Features -->
<section class="section">
  <div class="container">
    <h2 class="section-title">平台特色</h2>
    <p class="section-subtitle">我們專注於為用戶提供最優質的數位娛樂體驗</p>
    <div class="features-grid">
      <div class="feature-card">
        <span class="feature-icon">🎮</span>
        <h3>豐富遊戲選擇</h3>
        <p>匯集數百款精選休閒遊戲，涵蓋多種類型，滿足不同玩家的喜好與需求。</p>
      </div>
      <div class="feature-card">
        <span class="feature-icon">🎁</span>
        <h3>新手專屬福利</h3>
        <p>註冊即享豐富新手禮包，讓您從第一刻起就感受到滿滿的誠意與驚喜。</p>
      </div>
      <div class="feature-card">
        <span class="feature-icon">🔒</span>
        <h3>安全保障</h3>
        <p>採用銀行級加密技術，全方位保護您的個人資訊與帳戶安全，讓您安心暢玩。</p>
      </div>
      <div class="feature-card">
        <span class="feature-icon">⚡</span>
        <h3>快速便捷</h3>
        <p>極速載入、流暢操作，支援多種裝置無縫切換，隨時隨地享受遊戲樂趣。</p>
      </div>
    </div>
  </div>
</section>

<!-- Steps -->
<section class="section steps">
  <div class="container">
    <h2 class="section-title">輕鬆三步，開啟旅程</h2>
    <p class="section-subtitle">簡單快速的流程，讓您立即體驗精彩的遊戲世界</p>
    <div class="steps-grid">
      <div class="step">
        <div class="step-num">1</div>
        <h3>註冊帳號</h3>
        <p>填寫基本資訊，30 秒即可完成註冊</p>
      </div>
      <div class="step-arrow">→</div>
      <div class="step">
        <div class="step-num">2</div>
        <h3>選擇遊戲</h3>
        <p>瀏覽豐富遊戲庫，找到您喜愛的類型</p>
      </div>
      <div class="step-arrow">→</div>
      <div class="step">
        <div class="step-num">3</div>
        <h3>開始體驗</h3>
        <p>即刻暢玩，享受精彩的互動娛樂時光</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>準備好了嗎？</h2>
  <p>加入樂享娛樂，探索無限精彩的遊戲世界</p>
  <a href="#" class="btn">馬上開始</a>
</section>

<!-- Footer -->
<footer>
  <div class="links">
    <a href="#">隱私權政策</a>
    <a href="#">服務條款</a>
  </div>
  <p>&copy; 2026 樂享娛樂 All Rights Reserved.</p>
</footer>

</body>
</html>`;
}
