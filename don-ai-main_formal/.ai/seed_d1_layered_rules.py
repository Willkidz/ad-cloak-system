#!/usr/bin/env python3
import json
import re
from pathlib import Path

import requests

REPO_DIR = Path('/home/ubuntu/don-ai')
AUTH_FILE = REPO_DIR / '07-配置與環境/auth-info-config.md'
LOG_FILE = REPO_DIR / '.ai/d1-layered-rules-seed.log'
ACCOUNT_ID = 'b2471e0c307123945bdf1ce1b025563f'
DATABASE_ID = '3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c'
API_URL = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query'

SQL = r'''INSERT INTO rules (name, description, rule_type, layer, priority, conditions, action, enabled) VALUES
('國家過濾', '只允許指定國家的流量', 'country', 'entry', 10, '{"field":"country","operator":"in","value":["TW","HK","JP","MY","SG","TH","VN","PH","ID","KR"]}', 'block', 1),
('Bot UA 過濾', '過濾已知機器人 User-Agent', 'bot', 'entry', 20, '{"field":"ua","operator":"matches_bot_list","value":"bot_ua_list"}', 'block', 1),
('Bot IP/CIDR 過濾', '過濾已知機器人 IP 段', 'bot', 'entry', 21, '{"field":"ip","operator":"in_cidr_list","value":"bot_cidr_list"}', 'block', 1),
('Bot ASN 過濾', '過濾已知機器人 ASN', 'bot', 'entry', 22, '{"field":"asn","operator":"in_list","value":"manual_asn_blacklist"}', 'block', 1),
('OS 過濾', '根據裝置類型過濾', 'os', 'entry', 30, '{"field":"os","operator":"config_based","value":"campaign.cloak_os"}', 'block', 1),
('語言過濾', '根據 Accept-Language 過濾', 'language', 'entry', 40, '{"field":"accept_language","operator":"config_based","value":"campaign.cloak_lang"}', 'block', 1),
('Referer Spy 過濾', '過濾已知間諜工具來源', 'referer', 'entry', 50, '{"field":"referer","operator":"contains_spy_keywords","value":"REFERER_SPY_KEYWORDS"}', 'block', 1),
('流量來源過濾', '限制允許的流量來源', 'traffic_source', 'entry', 60, '{"field":"referer","operator":"config_based","value":"campaign.cloak_traffic_source"}', 'block', 1),
('fbclid 要求', '要求必須帶 fbclid 參數', 'fbclid', 'entry', 70, '{"field":"url","operator":"has_param","value":"fbclid"}', 'block', 1),
('VPN 檢測', '過濾 VPN/代理流量', 'vpn', 'entry', 80, '{"field":"ip","operator":"is_vpn","value":"ipinfo_blackbox"}', 'block', 1),
('指紋檢測', '前端瀏覽器指紋評分', 'fingerprint', 'page', 100, '{"field":"fp_score","operator":"gte","value":5}', 'block', 1),
('互動檢測', '3秒內無互動則攔截', 'interaction', 'page', 110, '{"field":"interaction","operator":"timeout","value":3000}', 'block', 1),
('操作層二次驗證', 'CTA 點擊時服務端再驗證', 'custom', 'action', 200, '{"field":"action_verify","operator":"composite","value":{"fp_score_min":5,"time_on_page_min":3000,"interaction_min":1}}', 'block', 1);'''


def load_token() -> str:
    content = AUTH_FILE.read_text(encoding='utf-8')
    match = re.search(r'cfut_[A-Za-z0-9]+', content)
    if not match:
        raise RuntimeError('無法從 auth-info-config.md 讀取 Cloudflare API Token')
    return match.group(0)


def log(message: str) -> None:
    with LOG_FILE.open('a', encoding='utf-8') as fh:
        fh.write(message + '\n')


def main() -> int:
    LOG_FILE.write_text('', encoding='utf-8')
    token = load_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    log('[SEED] 開始初始化 rules 預設規則')
    resp = requests.post(API_URL, headers=headers, json={'sql': SQL}, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    log(json.dumps(data, ensure_ascii=False))
    if data.get('success') is not True:
        errors = data.get('errors') or []
        msg = errors[0].get('message', 'unknown error') if errors else 'unknown error'
        raise RuntimeError(f'rules seed 失敗：{msg}')
    log('[SEED] rules 預設規則初始化成功')
    print(str(LOG_FILE))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
