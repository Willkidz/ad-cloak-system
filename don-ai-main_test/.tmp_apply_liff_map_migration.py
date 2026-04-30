import json
import os
from pathlib import Path
import requests

account_id = os.environ['ACCOUNT_ID']
api_token = os.environ['API_TOKEN']
prod_db_id = os.environ['PROD_DB_ID']
staging_db_id = os.environ['STAGING_DB_ID']
sql = Path('/home/ubuntu/don-ai/05-原始碼/斗篷管理後台/migrations/008_seed_line_config_liff_map.sql').read_text(encoding='utf-8')
headers = {
    'Authorization': f'Bearer {api_token}',
    'Content-Type': 'application/json',
}
for label, db_id in [('production', prod_db_id), ('staging', staging_db_id)]:
    url = f'https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{db_id}/query'
    resp = requests.post(url, headers=headers, json={'sql': sql}, timeout=120)
    print(f'=== {label} status={resp.status_code} ===')
    data = resp.json()
    print(json.dumps(data, ensure_ascii=False, indent=2))
