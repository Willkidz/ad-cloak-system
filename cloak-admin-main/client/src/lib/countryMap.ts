// BUG-15, BUG-21: 統一國家代碼映射（繁體中文）
export const COUNTRY_MAP: Record<string, string> = {
  TW: '台灣',
  JP: '日本',
  KR: '韓國',
  US: '美國',
  GB: '英國',
  CA: '加拿大',
  AU: '澳洲',
  DE: '德國',
  FR: '法國',
  SG: '新加坡',
  MY: '馬來西亞',
  TH: '泰國',
  VN: '越南',
  PH: '菲律賓',
  ID: '印尼',
  IN: '印度',
  HK: '香港',
  MO: '澳門',
  CN: '中國',
  NZ: '紐西蘭',
  IT: '義大利',
  ES: '西班牙',
  BR: '巴西',
  MX: '墨西哥',
  RU: '俄羅斯',
  AE: '阿聯酋',
  SA: '沙烏地阿拉伯',
  BD: '孟加拉',
  PK: '巴基斯坦',
  NG: '奈及利亞',
  ZA: '南非',
  EG: '埃及',
  TR: '土耳其',
  NL: '荷蘭',
  SE: '瑞典',
  NO: '挪威',
  DK: '丹麥',
  FI: '芬蘭',
  PL: '波蘭',
  CZ: '捷克',
  AT: '奧地利',
  CH: '瑞士',
  BE: '比利時',
  PT: '葡萄牙',
  IE: '愛爾蘭',
  IL: '以色列',
  AR: '阿根廷',
  CL: '智利',
  CO: '哥倫比亞',
  PE: '秘魯',
};

// 國家選項列表（用於下拉選單）
export const COUNTRY_OPTIONS = Object.entries(COUNTRY_MAP).map(([code, name]) => ({
  value: code,
  label: `${code} - ${name}`,
}));

// 格式化國家顯示
export function formatCountry(value: string | null | undefined): string {
  if (!value) return '-';
  const code = value.toUpperCase().trim();
  if (COUNTRY_MAP[code]) {
    return `${code} - ${COUNTRY_MAP[code]}`;
  }
  // 嘗試反向查找（如果傳入的是中文名稱）
  for (const [c, name] of Object.entries(COUNTRY_MAP)) {
    if (name === value || value.includes(name)) {
      return `${c} - ${name}`;
    }
  }
  return value;
}

// 獲取國家代碼
export function getCountryCode(value: string | null | undefined): string {
  if (!value) return '';
  const upper = value.toUpperCase().trim();
  if (COUNTRY_MAP[upper]) return upper;
  for (const [code, name] of Object.entries(COUNTRY_MAP)) {
    if (name === value || value.includes(name)) return code;
  }
  return value;
}
