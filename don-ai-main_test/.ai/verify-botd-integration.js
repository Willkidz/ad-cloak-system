const fs = require('fs');
const path = '/home/ubuntu/don-ai/05-原始碼/斗篷管理後台/shadow-cloak.js';
const src = fs.readFileSync(path, 'utf8');

function assert(cond, msg) {
  if (!cond) {
    throw new Error(msg);
  }
}

const requiredSignals = [
  'webdriver',
  'headlessUa',
  'seleniumGlobals',
  'seleniumDocumentAttributes',
  'chromedriverCdc',
  'playwrightGlobals',
  'puppeteerGlobals',
  'phantomjsGlobals',
  'nightmareGlobals',
  'notificationPermissionsAnomaly',
];

for (const key of requiredSignals) {
  assert(src.includes(`'${key}'`) || src.includes(`\"${key}\"`), `缺少 bot signal: ${key}`);
}

assert(src.includes('async function canvasFp()'), '缺少 canvasFp，疑似破壞既有 Canvas 指紋');
assert(src.includes('function webglFp()'), '缺少 webglFp，疑似破壞既有 WebGL 指紋');
assert(src.includes('async function audioFp()'), '缺少 audioFp，疑似破壞既有 Audio 指紋');
assert(src.includes('detectBotSignals()'), '缺少 detectBotSignals 呼叫');
assert(src.includes("bot_score:bot.score||0") || src.includes("bot_score: bot.score||0") || src.includes("bot_score: bot.score || 0"), '前端 /cloak-fingerprint 未傳送 bot_score');
assert(src.includes("bot_signals:bot.details||{}") || src.includes("bot_signals: bot.details||{}") || src.includes("bot_signals: bot.details || {}"), '前端 /cloak-fingerprint 未傳送 bot_signals');
assert(src.includes("bot_score:window.__CLOAK_BOT_SCORE__||0") || src.includes("bot_score: window.__CLOAK_BOT_SCORE__||0") || src.includes("bot_score: window.__CLOAK_BOT_SCORE__ || 0"), '前端 /cloak-action-verify 未傳送 bot_score');
assert(src.includes("bot_signals:window.__CLOAK_BOT_DETAILS__||{}") || src.includes("bot_signals: window.__CLOAK_BOT_DETAILS__||{}") || src.includes("bot_signals: window.__CLOAK_BOT_DETAILS__ || {}"), '前端 /cloak-action-verify 未傳送 bot_signals');
assert(src.includes("event_type, event_data") || src.includes('bot_detected'), '缺少 bot_detected 記錄');
assert(src.includes("reason: 'bot_detected'") || src.includes("'bot_detected'"), '缺少 action verify 的 bot_detected 阻擋');

const chkMatches = src.match(/chk\('/g) || [];
assert(chkMatches.length >= 9, `自動化檢測數量不足，僅找到 ${chkMatches.length} 個同步檢測`);

console.log(JSON.stringify({
  status: 'ok',
  signal_count: requiredSignals.length,
  chk_count: chkMatches.length,
  preserved: ['canvasFp', 'webglFp', 'audioFp'],
  endpoints: ['/cloak-fingerprint', '/cloak-action-verify']
}, null, 2));
