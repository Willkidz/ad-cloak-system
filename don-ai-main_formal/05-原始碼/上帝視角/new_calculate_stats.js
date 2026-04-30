const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODMwMDU4OTQtYjM1MC00YmU3LWI2ODMtYTk2NjFmOWM4NTA5IiwiaWF0IjoxNzczNDE4ODI2fQ.U-Mw5n-8liPl4V1AaOAPgMjCBqo03zyNRkEDWh_3vUY';
const BASE_URL = 'https://godview.app.n8n.cloud';
const EVENTS_TABLE = '9TFf8tCRvfXRstrS';

const spendData = $('Read Spend Data').first().json;

// === 計算日期 ===
const now = new Date();
const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const today = utc8.toISOString().split('T')[0];
const currentYear = today.substring(0, 4);
const timestamp = utc8.toISOString().replace('T', ' ').substring(0, 19);

// 昨日
const yesterdayDate = new Date(utc8.getTime() - 86400000);
const yesterday = yesterdayDate.toISOString().split('T')[0];

// 近3天（今天 + 前2天）
const threeDaysAgo = new Date(utc8.getTime() - 2 * 86400000);
const threeDaysStart = threeDaysAgo.toISOString().split('T')[0];

// === 解析消耗數據（新版欄位映射）===
const spendRows = spendData.values || [];
// Row 0 (spendRows[0]) = 標題行，日期從 index 14 開始
// Row 1 (spendRows[1]) = header labels
// Row 2+ = 數據行
const dateHeaderRow = spendRows[0] || [];  // 用 Row 0 讀日期
const dateColStart = 14;  // 日期從 O 列（index 14）開始
