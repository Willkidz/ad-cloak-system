    if (LIFF_TAGS.has(tag)) {
      const liffParams = new URLSearchParams({
        tag, a: adCode, line_id: lineId, token,
        fbclid, fbc, fbp, ts: timestamp, msg: messageText
      });
      const liffFullUrl = LIFF_URL + "?" + liffParams.toString();
      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="1;url=${liffFullUrl}">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06C755;font-family:-apple-system,sans-serif;color:#fff;text-align:center}.c{padding:2rem}.btn{display:inline-block;margin-top:20px;padding:14px 40px;background:#fff;color:#06C755;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none}</style>
</head><body><div class="c">
<p>正在前往 LINE...</p>
<a class="btn" href="${liffFullUrl}">點此開啟 LINE</a>
</div>
<script>setTimeout(function(){window.location.href="${liffFullUrl}"},500);</script>
</body></html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    const encodedLineId = encodeURIComponent(lineId);
    const encodedMessage = encodeURIComponent(messageText);
    const lineUrl = `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`;
    return Response.redirect(lineUrl, 302);
  }