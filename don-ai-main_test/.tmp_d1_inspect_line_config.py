import json
import os
import sys
import requests

ACCOUNT_ID = os.environ["ACCOUNT_ID"]
API_TOKEN = os.environ["API_TOKEN"]
DB_IDS = {
    "production": os.environ["PROD_DB_ID"],
    "staging": os.environ["STAGING_DB_ID"],
}
SQLS = {
    "schema": "PRAGMA table_info(line_config);",
    "count": "SELECT COUNT(*) AS total_rows, SUM(CASE WHEN TRIM(COALESCE(liff_id, '')) != '' THEN 1 ELSE 0 END) AS rows_with_liff FROM line_config;",
    "sample": "SELECT tag, line, liff_id FROM line_config ORDER BY tag LIMIT 30;",
}
headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json",
}
for label, db_id in DB_IDS.items():
    print(f"=== {label} ({db_id}) ===")
    for name, sql in SQLS.items():
        url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{db_id}/query"
        resp = requests.post(url, headers=headers, json={"sql": sql}, timeout=60)
        print(f"--- {name} status={resp.status_code} ---")
        try:
            data = resp.json()
        except Exception:
            print(resp.text)
            continue
        print(json.dumps(data, ensure_ascii=False, indent=2))
