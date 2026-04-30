#!/usr/bin/env python3.11
import json
import os
import sys
from urllib import request

ACCOUNT_ID = os.environ['ACCOUNT_ID']
TOKEN = os.environ['TOKEN']
DBID = os.environ['DBID']
BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DBID}/query"


def run_sql(sql: str):
    payload = json.dumps({"sql": sql}).encode()
    req = request.Request(
        BASE,
        data=payload,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with request.urlopen(req) as resp:
        obj = json.loads(resp.read().decode())
    if not obj.get("success"):
        raise SystemExit(json.dumps(obj, ensure_ascii=False, indent=2))
    return obj["result"][0]["results"]

schema = run_sql("PRAGMA table_info(line_config);")
print("---schema---")
for row in schema:
    print(f"{row['name']}|{row['type']}|default={row['dflt_value']}")

print("---counts---")
counts = run_sql("SELECT COUNT(*) AS total, SUM(CASE WHEN liff_id IS NOT NULL AND TRIM(liff_id) != '' THEN 1 ELSE 0 END) AS with_liff FROM line_config;")
print(json.dumps(counts[0], ensure_ascii=False))

print("---rows---")
rows = run_sql("SELECT tag, line, name, liff_id FROM line_config ORDER BY tag;")
for row in rows:
    print(json.dumps(row, ensure_ascii=False))
