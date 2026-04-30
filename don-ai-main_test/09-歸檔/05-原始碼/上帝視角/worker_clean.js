    const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];
    const masterPixel = MASTER_PIXEL_MAP[tag] || null;
    if (masterPixel && masterPixel.pixel) {
      const alreadyExists = adPixels.some((p) => p.pixel === masterPixel.pixel);
      if (!alreadyExists) {
        adPixels.push(masterPixel);
      }
    }
    const pixels = adPixels;
    const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: "", token: "" };
    const tokenMappingData = {
      event_type: "token_mapping",
      token,
      tag,
      line_id: lineId,
      line_name: lineName,
      who: lineWho,
      ad_code: adCode,
      ad_name: "",
      pixel_id: firstPixel.pixel,
      capi_token: firstPixel.token,
      pixels,
      fbc,
      fbp,
      fbclid,
      click_id,
      ip_address: clientIp,
      country,
      user_agent: userAgent,
      referer,
      accept_language: acceptLang,
      timestamp,
      message_text: messageText
    };
    ctx.waitUntil(
      fetch(N8N_WEBHOOK_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenMappingData)
      }).catch(() => {
      })
    );
    // === 新增：點擊 LINE 連結時額外發送 Lead 到 BC 像素 ===
    const productPrefix = getProductPrefix(tag);
    if (productPrefix) {
      ctx.waitUntil(sendBcEvent("Lead", productPrefix, {
        ip: clientIp,
        ua: userAgent,
        fbc: fbc,
        fbp: fbp
      }));
    }
    if (LIFF_TAGS.has(tag)) {
      const liffParams = new URLSearchParams({
        tag,
        a: adCode,
        line_id: lineId,
        token,
        fbclid,
        fbc,
        fbp,
        ts: timestamp,
        msg: messageText
      });
      const liffFullUrl = LIFF_URL + "?" + liffParams.toString();
      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="1;url=${liffFullUrl}">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06C755;font-family:-apple-system,sans-serif;color:#fff;text-align:center}.c{padding:2rem}.btn{display:inline-block;margin-top:20px;padding:14px 40px;background:#fff;color:#06C755;font-size:16px;font-weight:700;border-radius:10px;text-decoration:none}</style>
</head><body><div class="c">
<p>\u6B63\u5728\u524D\u5F80 LINE...</p>
<a class="btn" href="${liffFullUrl}">\u9EDE\u6B64\u958B\u555F LINE</a>
</div>
<script>setTimeout(function(){window.location.href="${liffFullUrl}"},500);<\/script>
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
};
export {
  index_default as default
};
