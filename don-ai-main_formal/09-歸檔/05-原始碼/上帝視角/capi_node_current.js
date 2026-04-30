
// 發送 CAPI Lead 事件
const matchData = $('Fingerprint Match').item.json;
const pixels = matchData.pixels || [];

if (!pixels.length && matchData.pixel_id && matchData.capi_token) {
  pixels.push({ pixel: matchData.pixel_id, token: matchData.capi_token });
}

const results = [];
for (const px of pixels) {
  if (!px.pixel || !px.token) continue;
  
  const eventData = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: `https://${matchData.tag}.freshpathlab.com/`,
      action_source: "website",
      user_data: {
        client_ip_address: matchData.ip_address || undefined,
        client_user_agent: matchData.user_agent || undefined,
        fbc: matchData.fbc || undefined,
        fbp: matchData.fbp || undefined,
        external_id: matchData.line_user_id ? [require('crypto').createHash('sha256').update(matchData.line_user_id).digest('hex')] : undefined
      }
    }]
  };
  
  // 清理 undefined
  Object.keys(eventData.data[0].user_data).forEach(k => {
    if (!eventData.data[0].user_data[k]) delete eventData.data[0].user_data[k];
  });
  
  results.push({
    json: {
      pixel_id: px.pixel,
      capi_token: px.token,
      event_data: eventData,
      url: `https://graph.facebook.com/v21.0/${px.pixel}/events?access_token=${px.token}`
    }
  });
}

if (results.length === 0) {
  return [{ json: { skip: true, reason: 'no_valid_pixels' } }];
}

return results;
