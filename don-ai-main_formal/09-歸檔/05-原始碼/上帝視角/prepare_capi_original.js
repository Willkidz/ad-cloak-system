// Pure JS SHA256 (no require)
function sha256hex(msg) {
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const s=unescape(encodeURIComponent(msg));
  const b=Array.from(s).map(c=>c.charCodeAt(0));
  b.push(0x80);while(b.length%64!==56)b.push(0);
  const l=s.length*8;for(let i=7;i>=0;i--)b.push((l/Math.pow(2,i*8))&0xff);
  const w=[];for(let i=0;i<b.length;i+=4)w.push((b[i]<<24)|(b[i+1]<<16)|(b[i+2]<<8)|b[i+3]);
  for(let i=0;i<w.length;i+=16){const W=w.slice(i,i+16);for(let j=16;j<64;j++){const s0=((W[j-15]>>>7)|(W[j-15]<<25))^((W[j-15]>>>18)|(W[j-15]<<14))^(W[j-15]>>>3);const s1=((W[j-2]>>>17)|(W[j-2]<<15))^((W[j-2]>>>19)|(W[j-2]<<13))^(W[j-2]>>>10);W[j]=(W[j-16]+s0+W[j-7]+s1)>>>0;}let[a,b2,c,d,e,f,g,h]=H;for(let j=0;j<64;j++){const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+W[j])>>>0;const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));const maj=(a&b2)^(a&c)^(b2&c);const t2=(S0+maj)>>>0;[h,g,f,e,d,c,b2,a]=[g,f,e,(d+t1)>>>0,c,b2,a,(t1+t2)>>>0];}H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b2)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;}
  return H.map(h=>h.toString(16).padStart(8,'0')).join('');
}
// TAG_PREFIX_MAP - 與 Worker 相同的映射
const TAG_PREFIX_MAP = {
  'js': 'AS', 'cs': 'AS', 'ms': 'AS', 'ls': 'AS',
  'jb': 'AB', 'cb': 'AB', 'mb': 'AB', 'lb': 'AB',
  'jx': 'AX', 'cx': 'AX', 'mx': 'AX', 'lx': 'AX',
  'bf': 'BF',
  'jd': 'JD',
  'n20': 'N20', 'n21': 'N21', 'n22': 'N22', 'n23': 'N23',
  'n24': 'N24', 'n25': 'N25', 'n26': 'N26', 'n27': 'N27',
  'n28': 'N28', 'n29': 'N29', 'n30': 'N30'
};

function getProductPrefix(tag) {
  return TAG_PREFIX_MAP[tag] || null;
}

// 發送 CAPI CompleteRegistration 事件
const matchData = $('Fingerprint Match').item.json;
const pixels = matchData.pixels || [];

if (!pixels.length && matchData.pixel_id && matchData.capi_token) {
  pixels.push({ pixel: matchData.pixel_id, token: matchData.capi_token });
}

const results = [];
const productPrefix = getProductPrefix(matchData.tag);

// 動態域名配置 - 默認使用 freshpathlab.com，可從 D1 line_config 表讀取
// 如需支持多個域名，應在 line_config 表添加 domain 欄位
const DEFAULT_DOMAIN = 'freshpathlab.com';
const eventSourceDomain = DEFAULT_DOMAIN; // 可改為從 D1 動態讀取

for (const px of pixels) {
  if (!px.pixel || !px.token) continue;
  
  // 判斷是否為 BC 像素
  const isBcPixel = px.is_bc === true;
  
  // 根據是否為 BC 像素決定事件名稱
  let eventNames = [];
  if (isBcPixel && productPrefix) {
    // BC 像素：發送帶產品前綴的事件 + ALL_CompleteRegistration
    eventNames = [
      `${productPrefix}_CompleteRegistration`,
      'ALL_CompleteRegistration'
    ];
  } else if (isBcPixel) {
    // BC 像素但沒有產品前綴：只發送 ALL_CompleteRegistration
    eventNames = ['ALL_CompleteRegistration'];
  } else {
    // 一般像素：發送標準 CompleteRegistration 事件
    eventNames = ['CompleteRegistration'];
  }
  
  // 為每個事件名稱生成一個請求
  for (const eventName of eventNames) {
    const eventData = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: `https://${matchData.tag}.${eventSourceDomain}/`,
        action_source: "website",
        user_data: {
          client_ip_address: matchData.ip_address || undefined,
          client_user_agent: matchData.user_agent || undefined,
          fbc: matchData.fbc || undefined,
          fbp: matchData.fbp || undefined,
          external_id: matchData.line_user_id ? [sha256hex(matchData.line_user_id)] : undefined,
          ct: matchData.ip_city ? [$helpers.crypto.createHash('sha256').update(matchData.ip_city.toLowerCase().trim()).digest('hex')] : undefined,
          st: matchData.ip_region_code ? [$helpers.crypto.createHash('sha256').update(matchData.ip_region_code.toLowerCase().trim()).digest('hex')] : undefined,
          zp: matchData.ip_postal_code ? [$helpers.crypto.createHash('sha256').update(matchData.ip_postal_code.toLowerCase().trim()).digest('hex')] : undefined,
          country: matchData.ip_country ? [$helpers.crypto.createHash('sha256').update(matchData.ip_country.toLowerCase().trim()).digest('hex')] : undefined
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
        event_name: eventName,
        is_bc: isBcPixel,
        event_data: eventData,
        url: `https://graph.facebook.com/v21.0/${px.pixel}/events?access_token=${px.token}`
      }
    });
  }
}

if (results.length === 0) {
  return [{ json: { skip: true, reason: 'no_valid_pixels' } }];
}

return results;

