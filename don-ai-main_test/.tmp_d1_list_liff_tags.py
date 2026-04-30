import json
import os
import requests

account_id = os.environ['ACCOUNT_ID']
api_token = os.environ['API_TOKEN']
db_id = os.environ['DB_ID']
sql = "SELECT tag, line, liff_id FROM line_config WHERE TRIM(COALESCE(liff_id, '')) != '' ORDER BY tag;"
url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{db_id}/query"
resp = requests.post(url, headers={
    'Authorization': f'Bearer {api_token}',
    'Content-Type': 'application/json',
}, json={'sql': sql}, timeout=60)
print(resp.status_code)
print(json.dumps(resp.json(), ensure_ascii=False, indent=2))
