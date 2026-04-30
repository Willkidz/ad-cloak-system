/**
 * LINE LIFF Callback Worker
 * 
 * 功能：
 * 1. GET /line-login/callback：返回 LIFF HTML 頁面（不需要 code/state 參數）
 * 2. POST /bind：接收 vid 和 line_user_id，存進 D1
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ===== GET /line-login/callback：返回 LIFF 頁面 =====
    if (pathname === '/line-login/callback' && request.method === 'GET') {
      // 1. 先嘗試從 URL 參數讀取
      let liffId = url.searchParams.get('liff_id');
      let targetOaId = url.searchParams.get('line_id');

      // 2. 如果沒有，嘗試從 liff.state 解析（LINE LIFF 重定向時會把原始參數放在 liff.state 裡）
      if (!liffId || !targetOaId) {
        const liffState = url.searchParams.get('liff.state');
        if (liffState) {
          try {
            // liff.state 的值可能是 URL 編碼過的 query string，例如：?vid=xxx&liff_id=yyy&line_id=zzz
            // 或者是沒有問號的格式
            const stateParams = new URLSearchParams(
              liffState.startsWith('?') ? liffState.substring(1) : liffState
            );
            if (!liffId) liffId = stateParams.get('liff_id');
            if (!targetOaId) targetOaId = stateParams.get('line_id');
          } catch (e) {
            console.error('Failed to parse liff.state:', e);
          }
        }
      }

      // 3. Fallback 到環境變數或預設值
      liffId = liffId || env.LIFF_ID || '2009129136-BEXGdu4X';
      targetOaId = targetOaId || env.LINE_OA_ID || '075cocov'; // 預設使用 費狀元-蕃薯地薯條
      
      const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>載入中...</title>
  <script src="https://static.line-scdn.net/liff/edge/versions/2.22.0/sdk.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background-color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top: 3px solid #00B900; /* LINE Green */
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* 隱藏錯誤信息，除非在開發模式 */
    #error-container {
      display: none;
      padding: 20px;
      color: #ef4444;
      text-align: center;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div class="spinner" id="loading-spinner"></div>
  <div id="error-container"></div>

  <script>
    const LIFF_ID = '${liffId}';
    const TARGET_OA_ID = '${targetOaId}';
    const BIND_ENDPOINT = window.location.origin + '/bind';
    
    // 融合方案：從 URL 或 liff.state 中提取 vid（其他歸因參數已在斗篷階段寫入 clicks 表）
    function extractParams() {
      const urlParams = new URLSearchParams(window.location.search);
      let vid = urlParams.get('vid');
      let ac = urlParams.get('ac');
      
      // 嘗試從 liff.state 解析（LINE LIFF 會把原始參數封裝進 liff.state）
      if (!vid || !ac) {
        const liffState = urlParams.get('liff.state');
        if (liffState) {
          try {
            const stateParams = new URLSearchParams(
              liffState.startsWith('?') ? liffState.substring(1) : liffState
            );
            if (!vid) vid = stateParams.get('vid');
            if (!ac) ac = stateParams.get('ac');
          } catch (e) {}
        }
      }
      
      // vid fallback：如果完全沒有 vid，生成一個新的（但這樣無法與 clicks 表匹配）
      if (!vid) {
        vid = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.warn('No vid found in URL or liff.state, generated fallback vid:', vid);
      }
      
      return { vid, ac: ac || '' };
    }

    // 跳轉到 LINE OA
    function redirectToOA() {
      // BUG-008 fix: 清理 TARGET_OA_ID 的 @ 前綴，避免產生 @@ 雙重符號
      const cleanOaId = TARGET_OA_ID.startsWith('@') ? TARGET_OA_ID.substring(1) : TARGET_OA_ID;
      const oaUrl = 'https://line.me/R/ti/p/@' + cleanOaId;
      
      if (liff.isInClient()) {
        try {
          liff.openWindow({ url: oaUrl, external: false });
        } catch (e) {
          window.location.href = oaUrl;
        }
      } else {
        window.location.href = oaUrl;
      }
    }
    
    async function initLIFF() {
      try {
        await liff.init({ liffId: LIFF_ID });
        
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;
        const params = extractParams();
        const vid = params.vid;
        const adCode = params.ac;
        
        // 融合方案：綁定請求傳 vid、line_user_id 和 ad_code
        const bindPromise = fetch(BIND_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vid: vid,
            line_user_id: lineUserId,
            ad_code: adCode
          })
        });
        
        // 創建超時 Promise (8秒)
        const timeoutPromise = new Promise(resolve => {
          setTimeout(() => resolve('timeout'), 8000);
        });
        
        // 使用 Promise.race 等待綁定完成或超時
        try {
          const result = await Promise.race([bindPromise, timeoutPromise]);
          if (result !== 'timeout' && !result.ok) {
            console.error('Bind failed with status:', result.status);
          }
        } catch (e) {
          console.error('Bind request error:', e);
        }
        
        // 無論綁定成功、失敗或超時，都跳轉到 OA
        redirectToOA();
        
      } catch (error) {
        console.error('LIFF Error:', error);
        document.getElementById('loading-spinner').style.display = 'none';
        const errorContainer = document.getElementById('error-container');
        errorContainer.style.display = 'block';
        errorContainer.innerHTML = '載入失敗，請重試。<br><small>' + error.message + '</small>';
        
        // 即使發生錯誤，也嘗試在 3 秒後跳轉到 OA，避免死胡同
        setTimeout(redirectToOA, 3000);
      }
    }
    
    window.addEventListener('load', initLIFF);
  </script>
</body>
</html>`;
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // ===== POST /bind：綁定 vid 和 line_user_id，同時更新 clicks 表 =====
    if (pathname === '/bind' && request.method === 'POST') {
      // CORS headers for /bind
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      };
      try {
        const body = await request.json();
        const { vid, line_user_id, event_id, fbclid, fbc, fbp, ad_code } = body;
        
        if (!vid || !line_user_id) {
          return new Response(JSON.stringify({ success: false, error: 'Missing vid or line_user_id' }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        
        // 生成唯一 ID
        const bindingId = crypto.randomUUID();
        
        // 寫入 D1 資料庫
        try {
          // 1. 確保表存在
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS line_user_bindings (
              id TEXT PRIMARY KEY,
              vid TEXT NOT NULL,
              line_user_id TEXT NOT NULL UNIQUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `).run();

          // 2. 插入或更新綁定數據（含 ad_code）
          await env.DB.prepare(
            `INSERT INTO line_user_bindings (id, vid, line_user_id, ad_code, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(line_user_id) DO UPDATE SET
               vid = excluded.vid,
               ad_code = excluded.ad_code,
               updated_at = excluded.updated_at`
          ).bind(
            bindingId,
            vid,
            line_user_id,
            ad_code || '',
            new Date().toISOString(),
            new Date().toISOString()
          ).run();

          // 3. 更新 clicks 表：將 line_user_id 寫入對應 vid 的最新點擊記錄
          ctx.waitUntil(
            env.DB.prepare(
              `UPDATE clicks SET matched = 1, matched_at = ?, matched_user_id = ? WHERE visitor_id = ? AND matched = 0 ORDER BY timestamp DESC LIMIT 1`
            ).bind(
              new Date().toISOString(),
              line_user_id,
              vid
            ).run().catch(e => console.error('clicks update error:', e.message))
          );

          // 4. 歸因成功 → 發送 CompleteRegistration CAPI 事件
          // 從 clicks 表查回該 vid 的 pixel_id、capi_token、fbc、fbp、ip_address、user_agent
          ctx.waitUntil((async () => {
            try {
              const clickRow = await env.DB.prepare(
                `SELECT pixel_id, capi_token, pixels, fbc, fbp, ip_address, user_agent FROM clicks WHERE visitor_id = ? ORDER BY timestamp DESC LIMIT 1`
              ).bind(vid).first();
              if (!clickRow) return;

              // 解析 pixels JSON（含 AD 像素和 BC 像素）
              let pixelList = [];
              try {
                const parsed = JSON.parse(clickRow.pixels || '[]');
                if (Array.isArray(parsed)) pixelList = parsed;
              } catch (_) {}

              // fallback：若 pixels 為空，使用 pixel_id + capi_token
              if (pixelList.length === 0 && clickRow.pixel_id && clickRow.capi_token) {
                pixelList = [{ pixel: clickRow.pixel_id, token: clickRow.capi_token }];
              }

              if (pixelList.length === 0) return;

              const eventTime = Math.floor(Date.now() / 1000);
              const clientIpForCapi = request.headers.get('CF-Connecting-IP') || clickRow.ip_address || '';
              const uaForCapi = request.headers.get('User-Agent') || clickRow.user_agent || '';
              const fbcForCapi = clickRow.fbc || '';
              const fbpForCapi = clickRow.fbp || '';

              const capiPromises = pixelList.map(async (px) => {
                const pixelId = px.pixel || px.pixel_id || '';
                const accessToken = px.token || px.capi_token || '';
                if (!pixelId || !accessToken) return;
                try {
                  const eventData = {
                    data: [{
                      event_name: 'CompleteRegistration',
                      event_time: eventTime,
                      action_source: 'website',
                      user_data: {
                        client_ip_address: clientIpForCapi,
                        client_user_agent: uaForCapi,
                        fbc: fbcForCapi || undefined,
                        fbp: fbpForCapi || undefined
                      }
                    }],
                    access_token: accessToken
                  };
                  await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                  });
                } catch (capiErr) {
                  console.error('CompleteRegistration CAPI error for pixel', pixelId, capiErr);
                }
              });
              await Promise.allSettled(capiPromises);
            } catch (e) {
              console.error('CompleteRegistration CAPI lookup error:', e);
            }
          })());

          return new Response(JSON.stringify({
            success: true,
            message: 'Binding successful',
            binding_id: bindingId,
            vid: vid,
            line_user_id: line_user_id,
            event_id: event_id || null
          }), {
            status: 200,
            headers: corsHeaders,
          });
        } catch (dbError) {
          console.error('DB Error:', dbError);
          return new Response(JSON.stringify({
            success: false,
            error: 'Database error: ' + dbError.message
          }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      } catch (error) {
        console.error('Request Error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request: ' + error.message
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ===== 其他路由：404 =====
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
