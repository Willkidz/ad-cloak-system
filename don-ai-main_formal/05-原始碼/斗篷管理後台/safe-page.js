// ============================================
// 安全頁 (Safe Page) v1.2
// 白頁模板庫 (F1) - 3 套模板：健康、理財、教育
// + F2 白頁快速切換（不同域名/路徑對應不同白頁模板）
// + F3 白頁合規檢查（自動掃描隱私政策、服務條款、聯絡方式）
// ============================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// --- 模板配置 ---
const TEMPLATES = {
  health: {
    id: "health",
    name: "健康生活",
    title: "悅康健康生活平台",
    tagline: "科學養生，健康每一天",
    description: "悅康健康生活平台提供專業的健康資訊、養生知識與生活建議，幫助您建立科學的健康管理習慣。",
    keywords: "健康生活,養生知識,健康管理,營養建議,運動健身",
    color1: "#059669", color2: "#047857",
    heroIcon: "🌿",
    heroBadge: "專業健康資訊平台",
    aboutText: [
      "悅康健康生活平台致力於為每一位用戶提供科學、可靠的健康資訊與養生建議。我們的內容團隊由專業營養師、健身教練及健康管理師組成，確保所有資訊的準確性與實用性。",
      "我們深信，健康是人生最重要的財富。透過科學的飲食指導、合理的運動規劃以及正確的生活習慣養成，每個人都能擁有更健康、更美好的生活品質。"
    ],
    features: [
      { icon: "🥗", title: "營養飲食指南", desc: "由專業營養師團隊精心編撰的飲食建議，幫助您均衡攝取每日所需營養。" },
      { icon: "🏃", title: "運動健身計畫", desc: "量身定制的運動方案，從初學者到進階者，循序漸進達成健身目標。" },
      { icon: "😴", title: "睡眠品質改善", desc: "科學的睡眠管理方法，幫助您改善睡眠品質，恢復充沛精力。" },
      { icon: "🧘", title: "身心靈平衡", desc: "冥想、瑜伽與壓力管理技巧，讓您在忙碌生活中找到內心的平靜。" }
    ],
    steps: [
      { title: "健康評估", desc: "完成簡單的健康問卷，了解您目前的健康狀態" },
      { title: "專屬方案", desc: "根據評估結果，獲得個人化的健康管理建議" },
      { title: "持續追蹤", desc: "定期檢視進度，調整方案，持續改善健康" }
    ],
    ctaTitle: "開始您的健康之旅",
    ctaText: "立即加入悅康，讓專業團隊陪伴您邁向更健康的生活",
    ctaBtn: "免費健康評估",
    companyName: "悅康健康生活有限公司",
    contactEmail: "service@yuekang-health.com",
    contactPhone: "(02) 2765-8800"
  },
  finance: {
    id: "finance",
    name: "理財規劃",
    title: "智富理財學院",
    tagline: "智慧理財，穩健增值",
    description: "智富理財學院提供專業的理財教育課程與投資知識分享，幫助您建立正確的財務觀念與資產配置策略。",
    keywords: "理財教育,投資知識,財務規劃,資產配置,理財課程",
    color1: "#2563eb", color2: "#1d4ed8",
    heroIcon: "📊",
    heroBadge: "專業理財教育平台",
    aboutText: [
      "智富理財學院是一個專注於理財教育的知識平台。我們匯集了金融領域的專業講師與資深分析師，透過淺顯易懂的課程內容，幫助每一位學員建立正確的理財觀念。",
      "我們相信，良好的財務管理能力是每個人都應該具備的生活技能。無論您是理財新手還是有經驗的投資者，都能在這裡找到適合自己的學習資源與成長路徑。"
    ],
    features: [
      { icon: "📚", title: "基礎理財課程", desc: "從零開始學習理財知識，建立正確的金錢觀念與儲蓄習慣。" },
      { icon: "📈", title: "投資分析教學", desc: "學習基本面與技術面分析方法，培養獨立判斷的投資能力。" },
      { icon: "🏦", title: "資產配置策略", desc: "了解不同資產類別的特性，學習建構適合自己的投資組合。" },
      { icon: "🎯", title: "財務目標規劃", desc: "設定短中長期財務目標，制定可執行的理財計畫與行動方案。" }
    ],
    steps: [
      { title: "能力評估", desc: "完成理財知識測驗，了解您目前的理財程度" },
      { title: "選擇課程", desc: "根據評估結果，推薦最適合您的學習路徑" },
      { title: "實戰練習", desc: "透過模擬操作與案例分析，將知識轉化為實力" }
    ],
    ctaTitle: "開啟您的理財之路",
    ctaText: "加入智富理財學院，與萬名學員一起學習成長",
    ctaBtn: "免費試聽課程",
    companyName: "智富理財教育有限公司",
    contactEmail: "support@zhifu-academy.com",
    contactPhone: "(02) 2788-6600"
  },
  education: {
    id: "education",
    name: "線上教育",
    title: "博學線上學堂",
    tagline: "知識無界，學習無限",
    description: "博學線上學堂提供多元化的線上學習課程，涵蓋語言、技能、興趣等領域，讓學習不受時間與空間限制。",
    keywords: "線上教育,遠距學習,技能培訓,語言學習,自我提升",
    color1: "#7c3aed", color2: "#6d28d9",
    heroIcon: "📖",
    heroBadge: "優質線上學習平台",
    aboutText: [
      "博學線上學堂是一個致力於推動終身學習的教育平台。我們與數百位各領域的專業講師合作，提供從語言學習、專業技能到興趣培養的全方位課程內容。",
      "我們相信，每個人都擁有無限的學習潛能。透過精心設計的課程架構、互動式的教學方式以及靈活的學習時間安排，讓您隨時隨地都能享受學習的樂趣。"
    ],
    features: [
      { icon: "🌐", title: "多語言課程", desc: "英語、日語、韓語等多國語言課程，由母語講師親自授課指導。" },
      { icon: "💻", title: "程式設計入門", desc: "從基礎到進階的程式設計課程，培養數位時代的核心競爭力。" },
      { icon: "🎨", title: "創意設計學習", desc: "平面設計、攝影、影片剪輯等創意課程，激發您的藝術潛能。" },
      { icon: "📝", title: "考試認證輔導", desc: "各類專業證照考試的備考課程，助您順利取得理想認證。" }
    ],
    steps: [
      { title: "興趣探索", desc: "瀏覽課程目錄，找到您感興趣的學習領域" },
      { title: "開始學習", desc: "選擇適合的課程，按照自己的節奏學習" },
      { title: "獲得認證", desc: "完成課程後取得結業證書，展現學習成果" }
    ],
    ctaTitle: "開始您的學習旅程",
    ctaText: "加入博學線上學堂，與全球學習者一起成長進步",
    ctaBtn: "瀏覽課程目錄",
    companyName: "博學數位教育有限公司",
    contactEmail: "hello@boxue-learn.com",
    contactPhone: "(02) 2712-3300"
  }
};

const DEFAULT_TEMPLATE = "health";

// --- F2: 域名/路徑到模板的路由映射 ---
const DOMAIN_TEMPLATE_MAPPING = {
  // 域名層級映射
  "health.bexnua.store": "health",
  "finance.bexnua.store": "finance",
  "education.bexnua.store": "education",
  // 路徑層級映射
  "/health": "health",
  "/finance": "finance",
  "/education": "education",
  "/wellness": "health",
  "/money": "finance",
  "/learn": "education"
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const host = url.hostname;
  const pathname = url.pathname;

  // 系統端點
  if (pathname === "/_sp/health") {
    return jsonResp({ status: "ok", version: "v1.2", templates: Object.keys(TEMPLATES), defaultTemplate: DEFAULT_TEMPLATE, features: ["F1_template_library", "F2_quick_switch", "F3_compliance_check"] });
  }
  if (pathname === "/_sp/templates") {
    return jsonResp({ version: "v1.2", templates: Object.entries(TEMPLATES).map(([k,v]) => ({ id: k, name: v.name, title: v.title })) });
  }
  if (pathname === "/_sp/preview" && url.searchParams.get("t")) {
    const t = TEMPLATES[url.searchParams.get("t")];
    if (!t) return jsonResp({ error: "模板不存在" }, 404);
    return new Response(renderTemplate(t), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // F2: 白頁快速切換 - 根據域名或路徑自動選擇模板
  let templateKey = url.searchParams.get("t") || url.searchParams.get("template") || DEFAULT_TEMPLATE;

  // 檢查域名映射
  if (DOMAIN_TEMPLATE_MAPPING[host]) {
    templateKey = DOMAIN_TEMPLATE_MAPPING[host];
  }

  // 檢查路徑映射
  for (const [path, template] of Object.entries(DOMAIN_TEMPLATE_MAPPING)) {
    if (path.startsWith("/") && pathname.startsWith(path)) {
      templateKey = template;
      break;
    }
  }

  // F3: 白頁合規檢查端點
  if (pathname === "/_sp/compliance" || pathname === "/_sp/check-compliance") {
    const checkTemplate = url.searchParams.get("t") || templateKey || DEFAULT_TEMPLATE;
    const complianceResult = await checkCompliance(checkTemplate);
    return jsonResp(complianceResult);
  }

  // F3: 白頁合規檢查報告
  if (pathname === "/_sp/compliance-report") {
    const checkTemplate = url.searchParams.get("t") || templateKey || DEFAULT_TEMPLATE;
    const complianceResult = await checkCompliance(checkTemplate);
    return new Response(renderComplianceReport(complianceResult, TEMPLATES[checkTemplate]), { 
      status: 200, 
      headers: { "Content-Type": "text/html; charset=utf-8" } 
    });
  }

  // 隱私政策頁
  if (pathname === "/privacy" || pathname === "/privacy-policy") {
    const t = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    return new Response(renderPrivacyPage(t), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }
  // 服務條款頁
  if (pathname === "/terms" || pathname === "/terms-of-service") {
    const t = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    return new Response(renderTermsPage(t), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }
  // 聯絡我們頁
  if (pathname === "/contact") {
    const t = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    return new Response(renderContactPage(t), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
  }

  // 預設：渲染白頁
  const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
  return new Response(renderTemplate(template), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

// ============================================
// F3: 白頁合規檢查
// ============================================
async function checkCompliance(templateKey) {
  const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
  const baseUrl = "https://safe-page.bexnua.workers.dev";
  
  const results = {
    version: "v1.2",
    templateId: templateKey,
    templateName: template.name,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // 檢查隱私政策
  try {
    const privacyResp = await fetch(`${baseUrl}/privacy?t=${templateKey}`, { method: "HEAD" });
    const privacyText = await fetch(`${baseUrl}/privacy?t=${templateKey}`).then(r => r.text());
    results.checks.privacy_policy = {
      required: true,
      available: privacyResp.status === 200,
      httpStatus: privacyResp.status,
      hasContent: privacyText.length > 500,
      hasKeywords: /隱私|個人資訊|資料保護|Cookie|蒐集|使用/i.test(privacyText),
      contentLength: privacyText.length,
      verdict: (privacyResp.status === 200 && privacyText.length > 500 && /隱私|個人資訊|資料保護/i.test(privacyText)) ? "PASS" : "FAIL"
    };
  } catch (e) {
    results.checks.privacy_policy = { required: true, available: false, error: e.message, verdict: "FAIL" };
  }

  // 檢查服務條款
  try {
    const termsResp = await fetch(`${baseUrl}/terms?t=${templateKey}`, { method: "HEAD" });
    const termsText = await fetch(`${baseUrl}/terms?t=${templateKey}`).then(r => r.text());
    results.checks.terms_of_service = {
      required: true,
      available: termsResp.status === 200,
      httpStatus: termsResp.status,
      hasContent: termsText.length > 500,
      hasKeywords: /服務|條款|使用者|責任|免責|同意|協議/i.test(termsText),
      contentLength: termsText.length,
      verdict: (termsResp.status === 200 && termsText.length > 500 && /服務|條款|責任/i.test(termsText)) ? "PASS" : "FAIL"
    };
  } catch (e) {
    results.checks.terms_of_service = { required: true, available: false, error: e.message, verdict: "FAIL" };
  }

  // 檢查聯絡方式
  try {
    const contactResp = await fetch(`${baseUrl}/contact?t=${templateKey}`, { method: "HEAD" });
    const contactText = await fetch(`${baseUrl}/contact?t=${templateKey}`).then(r => r.text());
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/i;
    const phoneRegex = /\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}/i;
    results.checks.contact_info = {
      required: true,
      available: contactResp.status === 200,
      httpStatus: contactResp.status,
      hasContent: contactText.length > 200,
      hasEmail: emailRegex.test(contactText),
      hasPhone: phoneRegex.test(contactText),
      contentLength: contactText.length,
      verdict: (contactResp.status === 200 && contactText.length > 200 && (emailRegex.test(contactText) || phoneRegex.test(contactText))) ? "PASS" : "FAIL"
    };
  } catch (e) {
    results.checks.contact_info = { required: true, available: false, error: e.message, verdict: "FAIL" };
  }

  // 計算總體結果
  const passCount = Object.values(results.checks).filter(c => c.verdict === "PASS").length;
  const totalChecks = Object.keys(results.checks).length;
  results.summary = {
    passed: passCount,
    total: totalChecks,
    allPassed: passCount === totalChecks,
    verdict: passCount === totalChecks ? "合規 - 符合廣告審查要求" : `不合規 - ${totalChecks - passCount} 項未通過`
  };

  return results;
}

// ============================================
// 主模板渲染
// ============================================
function renderTemplate(t) {
  const aboutHtml = t.aboutText.map(p => '<p>' + p + '</p>').join('');
  const featuresHtml = t.features.map(f => '<div class="feature-card"><span class="feature-icon">' + f.icon + '</span><h3>' + f.title + '</h3><p>' + f.desc + '</p></div>').join('');
  const stepsHtml = t.steps.map((s, i) => (i > 0 ? '<div class="step-arrow">&rarr;</div>' : '') + '<div class="step"><div class="step-num">' + (i+1) + '</div><h3>' + s.title + '</h3><p>' + s.desc + '</p></div>').join('');

  return '<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + t.title + ' - ' + t.tagline + '</title><meta name="description" content="' + t.description + '"><meta name="keywords" content="' + t.keywords + '"><meta name="robots" content="index, follow"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:#333;background:#fff;line-height:1.7;-webkit-font-smoothing:antialiased}a{color:' + t.color1 + ';text-decoration:none}a:hover{text-decoration:underline}.hero{background:linear-gradient(135deg,' + t.color1 + ' 0%,' + t.color2 + ' 100%);color:#fff;padding:80px 20px 60px;text-align:center;position:relative;overflow:hidden}.hero::before{content:"";position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 60%);animation:g 8s ease-in-out infinite alternate}@keyframes g{0%{transform:translate(0,0)}100%{transform:translate(5%,5%)}}.hero h1{font-size:2.5rem;font-weight:700;margin-bottom:12px;position:relative;z-index:1}.hero p{font-size:1.15rem;opacity:0.92;position:relative;z-index:1;max-width:500px;margin:0 auto}.hero-badge{display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:6px 18px;font-size:0.85rem;margin-bottom:20px;position:relative;z-index:1}.container{max-width:960px;margin:0 auto;padding:0 20px}.section{padding:60px 20px}.section-title{text-align:center;font-size:1.6rem;font-weight:700;color:#1a1a2e;margin-bottom:10px}.section-subtitle{text-align:center;color:#666;font-size:0.95rem;margin-bottom:40px;max-width:600px;margin-left:auto;margin-right:auto}.about{background:#f8f9fc}.about-text{max-width:720px;margin:0 auto;font-size:1rem;color:#444;text-align:center;line-height:1.9}.about-text p{margin-bottom:20px}.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;margin-top:40px}.feature-card{background:#f8f9fc;border-radius:12px;padding:24px;text-align:center;transition:transform 0.3s,box-shadow 0.3s}.feature-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.1)}.feature-icon{font-size:2.5rem;display:block;margin-bottom:12px}.feature-card h3{font-size:1.1rem;color:#1a1a2e;margin-bottom:8px}.feature-card p{font-size:0.9rem;color:#666;line-height:1.6}.steps{background:#f8f9fc}.steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:40px;align-items:center}.step{background:#fff;border-radius:12px;padding:24px;text-align:center;border:2px solid #eef0f5;position:relative}.step-num{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:' + t.color1 + ';color:#fff;border-radius:50%;font-size:1.2rem;font-weight:700;margin-bottom:12px}.step h3{font-size:1.05rem;color:#1a1a2e;margin-bottom:8px}.step p{font-size:0.9rem;color:#666}.step-arrow{color:#ccc;font-size:1.5rem;display:flex;align-items:center;justify-content:center}.cta{background:linear-gradient(135deg,' + t.color1 + ' 0%,' + t.color2 + ' 100%);color:#fff;padding:60px 20px;text-align:center}.cta h2{font-size:1.8rem;margin-bottom:16px}.cta p{font-size:1.05rem;margin-bottom:24px;max-width:500px;margin-left:auto;margin-right:auto;opacity:0.95}.btn{display:inline-block;background:#fff;color:' + t.color1 + ';padding:14px 32px;border-radius:8px;font-weight:600;transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;text-decoration:none}.btn:hover{transform:scale(1.05);box-shadow:0 8px 20px rgba(0,0,0,0.2)}footer{background:#1a1a2e;color:rgba(255,255,255,0.7);padding:40px 20px;text-align:center}.links{margin-bottom:16px}.links a{color:rgba(255,255,255,0.8);margin:0 16px;text-decoration:none;font-size:0.9rem}.links a:hover{color:#fff;text-decoration:underline}.contact-info{font-size:0.85rem;color:rgba(255,255,255,0.6);margin-top:12px}</style></head><body><section class="hero"><div class="hero-badge">' + t.heroBadge + '</div><h1>' + t.heroIcon + ' ' + t.title + '</h1><p>' + t.tagline + '</p></section><section class="section about"><div class="container"><h2 class="section-title">關於我們</h2><div class="about-text">' + aboutHtml + '</div></div></section><section class="section"><div class="container"><h2 class="section-title">平台特色</h2><p class="section-subtitle">我們專注於為用戶提供最優質的服務體驗</p><div class="features-grid">' + featuresHtml + '</div></div></section><section class="section steps"><div class="container"><h2 class="section-title">輕鬆三步，開啟旅程</h2><div class="steps-grid">' + stepsHtml + '</div></div></section><section class="cta"><h2>' + t.ctaTitle + '</h2><p>' + t.ctaText + '</p><a href="#" class="btn">' + t.ctaBtn + '</a></section><footer><div class="links"><a href="/privacy?t=' + t.id + '">隱私權政策</a><a href="/terms?t=' + t.id + '">服務條款</a><a href="/contact?t=' + t.id + '">聯絡我們</a></div><p>&copy; 2026 ' + t.companyName + ' All Rights Reserved.</p><div class="contact-info">聯絡信箱：' + t.contactEmail + ' | 客服電話：' + t.contactPhone + '</div></footer></body></html>';
}

// ============================================
// 隱私權政策頁
// ============================================
function renderPrivacyPage(t) {
  return '<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>隱私權政策 - ' + t.title + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:#333;background:#fff;line-height:1.8}.header{background:linear-gradient(135deg,' + t.color1 + ',' + t.color2 + ');color:#fff;padding:40px 20px;text-align:center}.header h1{font-size:1.8rem}.header p{opacity:0.85;margin-top:8px}.content{max-width:800px;margin:40px auto;padding:0 20px}h2{font-size:1.2rem;color:#1a1a2e;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #eef0f5}p,li{font-size:0.95rem;color:#444;margin-bottom:10px}ul{padding-left:24px}footer{background:#1a1a2e;color:rgba(255,255,255,0.6);padding:20px;text-align:center;font-size:0.8rem;margin-top:60px}footer a{color:rgba(255,255,255,0.75);margin:0 10px}</style></head><body><div class="header"><h1>隱私權政策</h1><p>' + t.title + '</p></div><div class="content"><p>最後更新日期：2026 年 3 月 24 日</p><p>' + t.companyName + '（以下簡稱「本公司」）非常重視您的隱私權。本隱私權政策說明我們如何蒐集、使用、保護及分享您的個人資訊。使用本平台即表示您同意本政策的內容。</p><h2>一、資訊蒐集範圍</h2><p>我們可能蒐集以下類型的資訊：</p><ul><li><strong>個人識別資訊</strong>：包括姓名、電子郵件地址、電話號碼等您主動提供的資訊。</li><li><strong>裝置與瀏覽資訊</strong>：包括 IP 位址、瀏覽器類型、作業系統、瀏覽頁面、造訪時間等。</li><li><strong>Cookie 與追蹤技術</strong>：我們使用 Cookie 及類似技術來改善您的使用體驗並進行網站分析。</li></ul><h2>二、資訊使用目的</h2><p>我們蒐集的資訊將用於以下目的：</p><ul><li>提供、維護及改善我們的服務品質。</li><li>處理您的查詢與客戶服務請求。</li><li>進行市場研究與用戶行為分析。</li><li>發送相關的通知與更新資訊。</li><li>遵守法律義務與規定。</li></ul><h2>三、資訊保護措施</h2><p>我們採取適當的技術與組織措施來保護您的個人資訊安全，包括加密傳輸、安全存儲及訪問控制等。</p><h2>四、資訊分享與披露</h2><p>我們不會未經您同意將您的個人資訊分享給第三方，除非法律要求或為提供服務所必需。</p><h2>五、您的權利</h2><p>您有權訪問、更正、刪除或限制我們對您個人資訊的使用。如有任何疑問，請聯絡我們。</p><h2>六、聯絡方式</h2><p>如對本隱私權政策有任何疑問，請聯絡：</p><ul><li>電子郵件：' + t.contactEmail + '</li><li>電話：' + t.contactPhone + '</li></ul></div><footer><a href="/?t=' + t.id + '">返回首頁</a> | <a href="/terms?t=' + t.id + '">服務條款</a> | <a href="/contact?t=' + t.id + '">聯絡我們</a></footer></body></html>';
}

// ============================================
// 服務條款頁
// ============================================
function renderTermsPage(t) {
  return '<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>服務條款 - ' + t.title + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:#333;background:#fff;line-height:1.8}.header{background:linear-gradient(135deg,' + t.color1 + ',' + t.color2 + ');color:#fff;padding:40px 20px;text-align:center}.header h1{font-size:1.8rem}.header p{opacity:0.85;margin-top:8px}.content{max-width:800px;margin:40px auto;padding:0 20px}h2{font-size:1.2rem;color:#1a1a2e;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #eef0f5}p,li{font-size:0.95rem;color:#444;margin-bottom:10px}ul{padding-left:24px}footer{background:#1a1a2e;color:rgba(255,255,255,0.6);padding:20px;text-align:center;font-size:0.8rem;margin-top:60px}footer a{color:rgba(255,255,255,0.75);margin:0 10px}</style></head><body><div class="header"><h1>服務條款</h1><p>' + t.title + '</p></div><div class="content"><p>最後更新日期：2026 年 3 月 24 日</p><p>歡迎使用 ' + t.companyName + ' 提供的服務。使用本平台即表示您同意遵守以下服務條款。</p><h2>一、服務內容</h2><p>本平台提供線上教育、資訊與服務內容。我們保留隨時修改、暫停或終止服務的權利。</p><h2>二、使用者責任</h2><p>您同意：</p><ul><li>遵守所有適用的法律與法規。</li><li>不從事任何非法、有害或騷擾性的活動。</li><li>尊重他人的智慧財產權與隱私。</li><li>不嘗試破壞或干擾平台的正常運作。</li></ul><h2>三、智慧財產權</h2><p>本平台上的所有內容（包括文字、圖像、影片等）均受著作權保護。未經許可，不得複製、修改或傳播。</p><h2>四、免責聲明</h2><p>本平台按「現狀」提供，不提供任何明示或暗示的保證。我們不對因使用本平台而產生的任何直接或間接損害承擔責任。</p><h2>五、責任限制</h2><p>在任何情況下，本公司對您的賠償責任均不超過您在過去 12 個月內支付的費用總額。</p><h2>六、條款修改</h2><p>我們保留隨時修改本條款的權利。修改後的條款將在平台上發佈，繼續使用表示您同意新條款。</p><h2>七、聯絡方式</h2><p>如對本服務條款有任何疑問，請聯絡：</p><ul><li>電子郵件：' + t.contactEmail + '</li><li>電話：' + t.contactPhone + '</li></ul></div><footer><a href="/?t=' + t.id + '">返回首頁</a> | <a href="/privacy?t=' + t.id + '">隱私權政策</a> | <a href="/contact?t=' + t.id + '">聯絡我們</a></footer></body></html>';
}

// ============================================
// 聯絡我們頁
// ============================================
function renderContactPage(t) {
  return '<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>聯絡我們 - ' + t.title + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:#333;background:#fff;line-height:1.8}.header{background:linear-gradient(135deg,' + t.color1 + ',' + t.color2 + ');color:#fff;padding:40px 20px;text-align:center}.header h1{font-size:1.8rem}.header p{opacity:0.85;margin-top:8px}.content{max-width:800px;margin:40px auto;padding:0 20px}.contact-card{background:#f8f9fc;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid ' + t.color1 + '}h2{font-size:1.2rem;color:#1a1a2e;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #eef0f5}p,li{font-size:0.95rem;color:#444;margin-bottom:10px}.contact-item{margin-bottom:16px}.contact-label{font-weight:600;color:#1a1a2e}.contact-value{color:#666;margin-top:4px}footer{background:#1a1a2e;color:rgba(255,255,255,0.6);padding:20px;text-align:center;font-size:0.8rem;margin-top:60px}footer a{color:rgba(255,255,255,0.75);margin:0 10px}</style></head><body><div class="header"><h1>聯絡我們</h1><p>' + t.title + '</p></div><div class="content"><h2>感謝您的聯絡</h2><p>如有任何問題、建議或反饋，歡迎透過以下方式與我們聯絡。我們的客服團隊將盡快回覆您的查詢。</p><div class="contact-card"><h2>聯絡方式</h2><div class="contact-item"><div class="contact-label">公司名稱</div><div class="contact-value">' + t.companyName + '</div></div><div class="contact-item"><div class="contact-label">電子郵件</div><div class="contact-value"><a href="mailto:' + t.contactEmail + '">' + t.contactEmail + '</a></div></div><div class="contact-item"><div class="contact-label">客服電話</div><div class="contact-value"><a href="tel:' + t.contactPhone.replace(/\s/g, '') + '">' + t.contactPhone + '</a></div></div><div class="contact-item"><div class="contact-label">服務時間</div><div class="contact-value">週一至週五 09:00 - 18:00（國定假日除外）</div></div></div><h2>常見問題</h2><p>我們致力於提供最優質的服務。如您有任何疑問，請先查閱我們的常見問題頁面，或直接與我們的客服團隊聯絡。</p></div><footer><a href="/?t=' + t.id + '">返回首頁</a> | <a href="/privacy?t=' + t.id + '">隱私權政策</a> | <a href="/terms?t=' + t.id + '">服務條款</a></footer></body></html>';
}

// ============================================
// F3: 合規檢查報告渲染
// ============================================
function renderComplianceReport(complianceData, template) {
  const checks = complianceData.checks;
  const summary = complianceData.summary;
  
  let checksHtml = '';
  for (const [key, check] of Object.entries(checks)) {
    const verdictClass = check.verdict === "PASS" ? "pass" : "fail";
    const verdictText = check.verdict === "PASS" ? "✓ 通過" : "✗ 未通過";
    checksHtml += `
      <div class="check-item ${verdictClass}">
        <div class="check-header">
          <span class="check-name">${key === 'privacy_policy' ? '隱私權政策' : key === 'terms_of_service' ? '服務條款' : '聯絡方式'}</span>
          <span class="check-verdict">${verdictText}</span>
        </div>
        <div class="check-details">
          <p><strong>HTTP 狀態：</strong> ${check.httpStatus || 'N/A'}</p>
          <p><strong>內容長度：</strong> ${check.contentLength || 0} 字元</p>
          <p><strong>關鍵字檢查：</strong> ${check.hasKeywords ? '✓ 包含相關關鍵字' : '✗ 缺少相關關鍵字'}</p>
          ${check.hasEmail !== undefined ? `<p><strong>電子郵件：</strong> ${check.hasEmail ? '✓ 已找到' : '✗ 未找到'}</p>` : ''}
          ${check.hasPhone !== undefined ? `<p><strong>電話號碼：</strong> ${check.hasPhone ? '✓ 已找到' : '✗ 未找到'}</p>` : ''}
        </div>
      </div>
    `;
  }

  const summaryClass = summary.allPassed ? "pass" : "fail";
  const summaryText = summary.allPassed ? "✓ 合規 - 符合廣告審查要求" : "✗ 不合規 - 需要改進";

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>白頁合規檢查報告 - ${template.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
      color: #333;
      background: #f5f7fa;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header {
      background: linear-gradient(135deg, ${template.color1}, ${template.color2});
      color: #fff;
      padding: 40px 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      text-align: center;
    }
    .header h1 { font-size: 1.8rem; margin-bottom: 8px; }
    .header p { opacity: 0.9; }
    .summary-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .summary-card.pass { border-left: 4px solid #10b981; }
    .summary-card.fail { border-left: 4px solid #ef4444; }
    .summary-title { font-size: 1.3rem; font-weight: 600; margin-bottom: 12px; }
    .summary-verdict { font-size: 1.1rem; font-weight: 600; }
    .summary-verdict.pass { color: #10b981; }
    .summary-verdict.fail { color: #ef4444; }
    .summary-stats {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    .stat { flex: 1; }
    .stat-label { font-size: 0.85rem; color: #666; margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: ${template.color1}; }
    .checks-section { margin-top: 24px; }
    .checks-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 16px; }
    .check-item {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      border-left: 4px solid #e5e7eb;
    }
    .check-item.pass { border-left-color: #10b981; background: #f0fdf4; }
    .check-item.fail { border-left-color: #ef4444; background: #fef2f2; }
    .check-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .check-name { font-weight: 600; font-size: 1rem; }
    .check-verdict { font-weight: 600; font-size: 0.9rem; }
    .check-item.pass .check-verdict { color: #10b981; }
    .check-item.fail .check-verdict { color: #ef4444; }
    .check-details { font-size: 0.9rem; color: #666; }
    .check-details p { margin-bottom: 6px; }
    footer {
      background: #1a1a2e;
      color: rgba(255,255,255,0.6);
      padding: 20px;
      text-align: center;
      font-size: 0.8rem;
      margin-top: 40px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>白頁合規檢查報告</h1>
      <p>${template.title}</p>
    </div>
    
    <div class="summary-card ${summaryClass}">
      <div class="summary-title">檢查結果</div>
      <div class="summary-verdict ${summaryClass}">${summaryText}</div>
      <div class="summary-stats">
        <div class="stat">
          <div class="stat-label">通過項目</div>
          <div class="stat-value">${summary.passed}/${summary.total}</div>
        </div>
        <div class="stat">
          <div class="stat-label">檢查時間</div>
          <div class="stat-value">${new Date(complianceData.timestamp).toLocaleString('zh-TW')}</div>
        </div>
      </div>
    </div>

    <div class="checks-section">
      <div class="checks-title">詳細檢查結果</div>
      ${checksHtml}
    </div>

    <footer>
      <p>此報告由 Safe Page v1.2 自動生成。報告時間：${new Date().toLocaleString('zh-TW')}</p>
    </footer>
  </div>
</body>
</html>`;
}
