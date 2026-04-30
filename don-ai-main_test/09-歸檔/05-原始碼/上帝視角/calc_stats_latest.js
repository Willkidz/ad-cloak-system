
// === 廣告成效計算邏輯 V6 - 修復版 ===
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODMwMDU4OTQtYjM1MC00YmU3LWI2ODMtYTk2NjFmOWM4NTA5IiwiaWF0IjoxNzczNDE4ODI2fQ.U-Mw5n-8liPl4V1AaOAPgMjCBqo03zyNRkEDWh_3vUY';
const BASE_URL = 'https://godview.app.n8n.cloud';
const EVENTS_TABLE = '9TFf8tCRvfXRstrS';

const dateSettings = $('Read Date Settings').first().json;
const spendData = $('Read Spend Data').first().json;
const existingPerf = $('Read Existing Performance').first().json;

// === 解析日期設定 ===
const dateRow = (dateSettings.values || [[]])[0] || [];
const rangeType = dateRow[3] || '今天';
const lastSyncedId = parseInt(dateRow[7]) || 0;  // H2: 最後同步的事件 ID

const now = new Date();
const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = utc8.toISOString().split('T')[0];
const currentYear = today.substring(0, 4);

let startDate, endDate;
endDate = today;

switch (rangeType) {
  case '今天': startDate = today; break;
  case '昨天': { const d = new Date(utc8.getTime() - 86400000); startDate = d.toISOString().split('T')[0]; endDate = startDate; break; }
  case '近3天': { const d = new Date(utc8.getTime() - 2*86400000); startDate = d.toISOString().split('T')[0]; break; }
  case '近7天': { const d = new Date(utc8.getTime() - 6*86400000); startDate = d.toISOString().split('T')[0]; break; }
  case '本月': startDate = today.substring(0, 8) + '01'; break;
  default: startDate = dateRow[1] || today; break;
}

// === 解析消耗數據 ===
const spendRows = spendData.values || [];
const headerRow = spendRows[1] || [];
const dateColStart = 12;
const adSpend = {};
const adTotalSpend = {};
const adInfo = {};

for (let i = 2; i < spendRows.length; i++) {
  const row = spendRows[i];
  if (!row || !row[2]) continue;
  const rawCode = row[8] || '';
  const code = String(rawCode).trim();
  adInfo[code] = { accountId: row[2]||'', person: row[9]||'', status: row[7]||'', material: row[3]||'', project: row[10]||'' };
  let rangeTotal = 0;
  let monthTotal = 0;
  for (let j = dateColStart; j < headerRow.length; j++) {
    const dl = headerRow[j]; if (!dl) continue;
    const p = dl.split('/'); if (p.length !== 2) continue;
    const cd = currentYear + '-' + p[0].padStart(2,'0') + '-' + p[1].padStart(2,'0');
    const val = parseFloat(row[j]) || 0;
    monthTotal += val;
    if (cd >= startDate && cd <= endDate) rangeTotal += val;
  }
  adSpend[code] = rangeTotal;
  adTotalSpend[code] = monthTotal;
}

// === 讀取 line_config（動態歸因）===
let lineConfigData = [];
try {
  const lcResp = await this.helpers.httpRequest({
    method: 'GET',
    url: BASE_URL + '/api/v1/data-tables/aL6JTLjrpNXf8aKM/rows?limit=100',
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  const lcParsed = typeof lcResp === 'string' ? JSON.parse(lcResp) : lcResp;
  lineConfigData = lcParsed.data || [];
} catch (e) { /* fallback to hardcoded */ }

// 建立 destination → line @ID 的映射（用於 line_friend_added 事件）
const destToLineId = {};
for (const lc of lineConfigData) {
  if (lc.line && lc.destination) {
    destToLineId[lc.destination] = lc.line;
  }
}

// === 讀取事件 ===
let allEvents = [];
let cursor = null;
while (true) {
  let url = BASE_URL + '/api/v1/data-tables/' + EVENTS_TABLE + '/rows?limit=100';
  if (cursor) url += '&cursor=' + encodeURIComponent(cursor);
  const data = await this.helpers.httpRequest({ method: 'GET', url, headers: { 'X-N8N-API-KEY': API_KEY } });
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  allEvents = allEvents.concat(parsed.data || []);
  if (!parsed.nextCursor || (parsed.data || []).length < 100) break;
  cursor = parsed.nextCursor;
}

// === 統計事件（修復：用 project 欄位而非 cid）===
const lineAddCounts = {};
const adAddCounts = {};
const adTotalAddCounts = {};
const todayAddCounts = {};
const todaySpendByCode = {};
const unsyncedFollows = [];

for (const evt of allEvents) {
  if (!evt.timestamp) continue;
  const evtDate = evt.timestamp.split('T')[0];
  
  if (evt.event_type === 'line_friend_added') {
    if (evtDate >= startDate && evtDate <= endDate) {
      const lid = evt.line_id || 'unknown';
      if (lid && lid !== '') lineAddCounts[lid] = (lineAddCounts[lid] || 0) + 1;
    }
    if (evt.id > lastSyncedId) {
      unsyncedFollows.push(evt);
    }
  }
  
  if (evt.event_type === 'token_matched') {
    const code = evt.project ? String(evt.project).trim() : '';
    if (code) {
      adTotalAddCounts[code] = (adTotalAddCounts[code] || 0) + 1;
      if (evtDate >= startDate && evtDate <= endDate) {
        adAddCounts[code] = (adAddCounts[code] || 0) + 1;
      }
      if (evtDate === today) {
        todayAddCounts[code] = (todayAddCounts[code] || 0) + 1;
      }
    }
    const matchedLineId = evt.line_id || '';
    if (matchedLineId) {
      lineAddCounts[matchedLineId] = (lineAddCounts[matchedLineId] || 0) + 1;
    }
  }
}

// 計算今日消耗
for (let i = 2; i < spendRows.length; i++) {
  const row = spendRows[i];
  if (!row || !row[2]) continue;
  const code = String(row[8] || '').trim();
  for (let j = dateColStart; j < headerRow.length; j++) {
    const dl = headerRow[j]; if (!dl) continue;
    const p = dl.split('/'); if (p.length !== 2) continue;
    const cd = currentYear + '-' + p[0].padStart(2,'0') + '-' + p[1].padStart(2,'0');
    if (cd === today) {
      todaySpendByCode[code] = parseFloat(row[j]) || 0;
    }
  }
}

// === 解析現有成效數據（保留手動填寫的欄位）===
const existingRows = (existingPerf.values || []);
const existingData = {};
for (const row of existingRows) {
  if (row && row[0]) {
    const code = String(row[0]).trim();
    existingData[code] = {
      accountId: row[1] || '',    // B: 廣告帳戶ID（手動填）
      material: row[2] || '',     // C: 素材說明（手動填）
      status: row[3] || '',       // D: 狀態（可能手動改過）
      rangeResult: row[8] || ''   // I: 區間成果（手動填）
    };
  }
}

// 所有 code = 現有的 + 消耗表新出現的
const allCodes = new Set([...Object.keys(existingData), ...Object.keys(adInfo)]);
const sortedCodes = [...allCodes].sort();

const timestamp = utc8.toISOString().replace('T', ' ').substring(0, 19);

// === 構建成效數據（保留手動欄位）===
const perfRows = sortedCodes.map((code, idx) => {
  const info = adInfo[code] || {};
  const existing = existingData[code] || {};
  
  const totalSpend = adTotalSpend[code] || 0;
  const totalAdd = adTotalAddCounts[code] || 0;
  const totalCPA = totalAdd > 0 ? Math.round(totalSpend / totalAdd) : '';
  const rangeSpend = adSpend[code] || 0;
  const rangeAdd = adAddCounts[code] || 0;
  const rangeCPA = rangeAdd > 0 ? Math.round(rangeSpend / rangeAdd) : '';
  
  // 狀態：如果用戶手動改過（不是消耗表帶入的），保留用戶的
  const autoStatuses = ['進行中', '暫停', ''];
  let status = info.status || existing.status || '';
  if (existing.status && !autoStatuses.includes(existing.status)) {
    status = existing.status;  // 保留用戶手動設定的狀態
  }
  
  const rowNum = 11 + idx;  // 從 Row 21 開始
  
  return [
    code,                           // A: code（AS01 格式）
    existing.accountId || '',       // B: 廣告帳戶ID（手動填寫，保留原值）
    existing.material || '',        // C: 素材說明（手動填寫，保留原值）
    status,                         // D: 狀態
    totalSpend || '',               // E: 累計消耗
    totalAdd || '',                 // F: 累計添加
    totalCPA,                       // G: 累計CPA
    rangeSpend || '',               // H: 區間消耗
    existing.rangeResult || '',     // I: 區間成果（手動填寫，保留原值）
    rangeAdd || '',                 // J: 區間添加
    `=IF(AND(I${rowNum}="",J${rowNum}=""),"",I${rowNum}-J${rowNum})`,  // K: 流失
    `=IFERROR(IF(I${rowNum}>0,J${rowNum}/I${rowNum},""),"")`,          // L: 添加占比
    rangeCPA,                       // M: 單次添加（區間CPA）
    `=IFERROR(IF(I${rowNum}>0,H${rowNum}/I${rowNum},""),"")`           // N: 單次成果
  ];
});

// === 構建每日快照 ===
const snapshotRows = sortedCodes
  .filter(code => (todaySpendByCode[code] > 0) || (todayAddCounts[code] > 0))
  .map(code => {
    const info = adInfo[code] || {};
    return [today, code, todaySpendByCode[code]||0, todayAddCounts[code]||0];
  });

// === 構建日誌 ===
const addLogRows = unsyncedFollows.map(evt => [
  evt.timestamp||'', evt.line_id||'', evt.line_user_id||'', evt.project ? String(evt.project).trim() : '', evt.event_type, evt.ip_address||''
]);
const syncIds = unsyncedFollows.map(evt => evt.id);
const newMaxSyncedId = syncIds.length > 0 ? Math.max(...syncIds) : lastSyncedId;

const spendLogRows = sortedCodes
  .filter(c => adSpend[c] > 0)
  .map(code => {
    const info = adInfo[code] || {};
    return [today, code, adSpend[code]];
  });


// === 按 code 前綴分組統計（偵測率區）===
const groupCounts = { 'AS': 0, 'AX': 0, 'AB': 0 };
for (const [code, count] of Object.entries(adTotalAddCounts)) {
  const prefix = code.toUpperCase().substring(0, 2);
  if (groupCounts.hasOwnProperty(prefix)) {
    groupCounts[prefix] += count;
  }
}

// === 輸出 ===
const writePayloads = {
  attribution: {
    range: "'成效'!C4:C6",
    values: [
      [groupCounts['AS']],
      [groupCounts['AX']],
      [groupCounts['AB']]
    ]
  },
  hideDetectionRows: {
    requests: [4, 5, 6].map((row, idx) => ({
      updateDimensionProperties: {
        range: { sheetId: 5002, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
        properties: { hiddenByUser: [groupCounts['AS'], groupCounts['AX'], groupCounts['AB']][idx] === 0 },
        fields: 'hiddenByUser'
      }
    }))
  },
  adPerformance: {
    range: "'成效'!A11:N" + (11 + sortedCodes.length),
    values: perfRows
  },
  timestamp: {
    range: "'成效'!F2",
    values: [[timestamp]]
  },
  snapshot: { values: snapshotRows },
  addLog: { values: addLogRows },
  spendLog: { values: spendLogRows },
  syncIds: syncIds,
  syncMarker: {
    range: "'成效'!H2",
    values: [[newMaxSyncedId]]
  }
};

return [{ json: {
  success: true, startDate, endDate, rangeType, timestamp, writePayloads,
  lineAddCounts, adAddCounts, adTotalAddCounts,
  codes: sortedCodes.length, totalEvents: allEvents.length,
  newCodes: sortedCodes.filter(c => !Object.keys(existingData).includes(c)),
  snapshotCount: snapshotRows.length
}}];
