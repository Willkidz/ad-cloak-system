const lineResp = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://godview.app.n8n.cloud/api/v1/data-tables/1VvB8jijHE5GXbv6/rows?limit=200',
  headers: { 'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjZlNTQ0NWEtNDNjMC00MWNmLWE5NzgtNmVlN2E0MTY2ODQ5IiwiaWF0IjoxNzczNTE3MDA5fQ.QgZXNh6Xt38Yt2btL-oWARK7wtD_5JDu_Dr395DxTpg' },
  json: true
});
const adResp = await this.helpers.httpRequest({
  method: 'GET',
  url: 'https://godview.app.n8n.cloud/api/v1/data-tables/vILi9V1mv3ouo6EM/rows?limit=200',
  headers: { 'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjZlNTQ0NWEtNDNjMC00MWNmLWE5NzgtNmVlN2E0MTY2ODQ5IiwiaWF0IjoxNzczNTE3MDA5fQ.QgZXNh6Xt38Yt2btL-oWARK7wtD_5JDu_Dr395DxTpg' },
  json: true
});

const LINE_MAP = {};
const AD_MAP = {};
let DEFAULT_MSG = '領取優惠，優惠碼： #{token}';

// ===== 主資料庫像素映射（按 tag/域名綁定）=====
const MASTER_PIXEL_MAP = {
  'bf': { pixel: '943527751701905', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'jd': { pixel: '1002866765291838', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'n20': { pixel: '2193730667756432', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'cs': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'js': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'ls': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'ms': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'cb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'jb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'lb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'mb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'cx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'jx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'lx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'mx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'n18': { pixel: '1536783794086440', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'n14': { pixel: '1684363839598393', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'n22': { pixel: '2038340907023537', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' }
};

const PIXEL_BLACKLIST = new Set(['1101853092009819']);
const MASTER_PIXEL_IDS = new Set(
  Object.values(MASTER_PIXEL_MAP).map(p => p.pixel)
);

// ===== 組別同步映射 v1 =====
// AS01 → JS01/CS01/MS01/LS01 共用像素權杖
// AB01 → JB01/CB01/MB01/LB01 共用像素權杖
// AX01 → JX01/CX01/MX01/LX01 共用像素權杖
const GROUP_PREFIX_MAP = {
  'AS': ['JS', 'CS', 'MS', 'LS'],
  'AB': ['JB', 'CB', 'MB', 'LB'],
  'AX': ['JX', 'CX', 'MX', 'LX']
};

const lineRows = lineResp.data || [];
for (const row of lineRows) {
  const tag = row.tag || '';
  if (tag === '_default_') continue;
  if (!tag) continue;
  LINE_MAP[tag] = {
    line: row.line || '',
    name: row.name || '',
    who: row.who || '-',
    msg: (row.msg || '').replace('#(token)', '#{token}'),
    destination: row.destination || '',
    master_pixel: MASTER_PIXEL_MAP[tag] || null
  };
}

// AD_MAP v6: 支援組別同步
const adRows = adResp.data || [];

// 第一步：收集組別 (type=group) 的像素權杖
const groupPixels = {};
for (const row of adRows) {
  const code = row.code || '';
  if (!code || row.type !== 'group') continue;
  if (!row.pixel || !row.token) continue;
  const match = code.match(/^(AS|AB|AX)(\d+)$/i);
  if (match) {
    groupPixels[match[1].toUpperCase() + match[2]] = { pixel: row.pixel, token: row.token };
  }
}

// 第二步：處理 ad 類型，自身沒像素就從組別繼承
for (const row of adRows) {
  const code = row.code || '';
  if (!code || row.type === 'group' || row.type === 'master') continue;

  let pixel = row.pixel || '';
  let token = row.token || '';

  // 自身沒像素，嘗試從組別繼承
  if (!pixel) {
    const adMatch = code.match(/^(JS|CS|MS|LS|JB|CB|MB|LB|JX|CX|MX|LX)(\d+)$/i);
    if (adMatch) {
      const adPrefix = adMatch[1].toUpperCase();
      const num = adMatch[2];
      for (const [gp, members] of Object.entries(GROUP_PREFIX_MAP)) {
        if (members.includes(adPrefix)) {
          const gk = gp + num;
          if (groupPixels[gk]) {
            pixel = groupPixels[gk].pixel;
            token = groupPixels[gk].token;
          }
          break;
        }
      }
    }
  }

  if (!AD_MAP[code]) {
    AD_MAP[code] = { pixels: [] };
  }
  if (pixel
      && !PIXEL_BLACKLIST.has(pixel)
      && !MASTER_PIXEL_IDS.has(pixel)) {
    const existIdx = AD_MAP[code].pixels.findIndex(p => p.pixel === pixel);
    if (existIdx >= 0) {
      AD_MAP[code].pixels[existIdx] = { pixel, token };
    } else {
      AD_MAP[code].pixels.push({ pixel, token });
    }
  }
}

// bf msg 已統一由 DataTable 管理，不再硬編碼

return [{ json: { LINE_MAP, AD_MAP, DEFAULT_MSG, MASTER_PIXEL_MAP } }];
