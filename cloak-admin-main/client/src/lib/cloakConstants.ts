// Cloak filtering constants

// 語言清單
export const LANGUAGE_OPTIONS = [
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'zh-CN', name: '簡體中文' },
  { code: 'en', name: '英語' },
  { code: 'ja', name: '日語' },
  { code: 'ko', name: '韓語' },
  { code: 'vi', name: '越南語' },
  { code: 'th', name: '泰語' },
  { code: 'id', name: '印尼語' },
  { code: 'ms', name: '馬來語' },
  { code: 'de', name: '德語' },
  { code: 'fr', name: '法語' },
  { code: 'es', name: '西班牙語' },
  { code: 'pt', name: '葡萄牙語' },
  { code: 'it', name: '義大利語' },
  { code: 'ru', name: '俄語' },
  { code: 'ar', name: '阿拉伯語' },
  { code: 'tr', name: '土耳其語' },
  { code: 'pl', name: '波蘭語' },
  { code: 'nl', name: '荷蘭語' },
];

// 操作系統清單
export const OS_OPTIONS = [
  { code: 'Windows', name: 'Windows' },
  { code: 'macOS', name: 'macOS' },
  { code: 'iOS', name: 'iOS' },
  { code: 'Android', name: 'Android' },
  { code: 'Linux', name: 'Linux' },
  { code: 'ChromeOS', name: 'ChromeOS' },
];

// 操作系統版本
export const OS_VERSIONS: Record<string, string[]> = {
  Windows: ['7', '8', '10', '11'],
  macOS: ['10.x', '11', '12', '13', '14', '15'],
  iOS: ['14', '15', '16', '17', '18'],
  Android: ['8', '9', '10', '11', '12', '13', '14', '15'],
  Linux: [''],
  ChromeOS: [''],
};

// 流量來源
export const TRAFFIC_SOURCE_OPTIONS = [
  { code: 'facebook', name: 'Facebook' },
  { code: 'instagram', name: 'Instagram' },
  { code: 'tiktok', name: 'TikTok' },
  { code: 'google', name: 'Google' },
  { code: 'youtube', name: 'YouTube' },
  { code: 'twitter', name: 'Twitter/X' },
  { code: 'line', name: 'Line' },
  { code: 'whatsapp', name: 'WhatsApp' },
  { code: 'direct', name: '直接訪問' },
  { code: 'other', name: '其他' },
];

// 省份/州別（依國家）
export const PROVINCES: Record<string, string[]> = {
  TW: [
    '台北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '台中市', '彰化縣',
    '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市', '高雄市', '屏東縣', '宜蘭縣',
    '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
  ],
  CN: [
    '北京', '天津', '河北', '山西', '內蒙古', '遼寧', '吉林', '黑龍江', '上海', '江蘇',
    '浙江', '安徽', '福建', '江西', '山東', '河南', '湖北', '湖南', '廣東', '廣西',
    '海南', '重慶', '四川', '貴州', '雲南', '西藏', '陝西', '甘肅', '青海', '寧夏', '新疆'
  ],
  JP: [
    '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島', '茨城', '栃木', '群馬',
    '埼玉', '千葉', '東京', '神奈川', '新潟', '富山', '石川', '福井', '山梨', '長野',
    '岐阜', '靜岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
    '鳥取', '島根', '岡山', '廣島', '山口', '徳島', '香川', '愛媛', '高知', '福岡',
    '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿兒島', '沖繩'
  ],
  US: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
  HK: ['香港'],
  MO: ['澳門'],
  KR: [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원',
    '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ],
};
