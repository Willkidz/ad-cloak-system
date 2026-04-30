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
// 同項目下所有 ad_code 自動附加主資料庫像素
// 未來新增項目只需在這裡加一行
const MASTER_PIXEL_MAP = {
  // 博富
  'bf': { pixel: '943527751701905', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 兩斤炭吉
  'jd': { pixel: '1002866765291838', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 蘇主金
  'n20': { pixel: '2193730667756432', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 爆分王（cs, js, ls, ms 共用）
  'cs': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'js': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'ls': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'ms': { pixel: '1059815113881250', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 莊家剋星（cb, jb, lb, mb 共用）
  'cb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'jb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'lb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'mb': { pixel: '629682249831836', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 獨角仙（cx, jx, lx, mx 共用）
  'cx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'jx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'lx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  'mx': { pixel: '1996956134550764', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 蕭甘丹
  'n18': { pixel: '1536783794086440', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 洪金豹
  'n14': { pixel: '1684363839598393', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' },
  // 阿奇體育
  'n22': { pixel: '2038340907023537', token: 'EAAICwpHzbToBQ3cuWzQpBGfndYtsYvfaX0KcHHXXi8gFHxvBHT3tTKmvKorrfDvZCYI9MOxR8LxTLmEiBHxIVaH6BHLrzkSNkB2hrYs61a1vIIGW7Uzfp0puXG775K5kcZAD0UXN1aOl0NhAKCU32X9AvKCrlo0ZA6uLa1zA8tb1PO0b8VnPQQ9sZAvivlopFgZDZD' }
};

// 像素黑名單（已廢棄的像素）
const PIXEL_BLACKLIST = new Set(['1101853092009819']);

// 收集所有主資料庫像素 ID，用於從廣告像素排除
const MASTER_PIXEL_IDS = new Set(
  Object.values(MASTER_PIXEL_MAP).map(p => p.pixel)
);

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

// 廣告像素映射 v5: 只存廣告像素，排除主資料庫像素和黑名單
const adRows = adResp.data || [];
for (const row of adRows) {
  const code = row.code || '';
  if (!code) continue;
  const pixelEntry = { pixel: row.pixel || '', token: row.token || '' };
  if (!AD_MAP[code]) {
    AD_MAP[code] = { pixels: [] };
  }
  // 排除：空像素、黑名單、主資料庫像素
  if (pixelEntry.pixel
      && !PIXEL_BLACKLIST.has(pixelEntry.pixel)
      && !MASTER_PIXEL_IDS.has(pixelEntry.pixel)) {
    const existIdx = AD_MAP[code].pixels.findIndex(p => p.pixel === pixelEntry.pixel);
    if (existIdx >= 0) {
      AD_MAP[code].pixels[existIdx] = pixelEntry;
    } else {
      AD_MAP[code].pixels.push(pixelEntry);
    }
  }
}

// bf msg 已統一由 DataTable 管理，不再硬編碼

return [{ json: { LINE_MAP, AD_MAP, DEFAULT_MSG, MASTER_PIXEL_MAP } }];
