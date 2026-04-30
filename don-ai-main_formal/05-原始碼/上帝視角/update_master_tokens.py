import json
import requests
import os
import time

N8N_API_KEY = os.environ.get('N8N_API_KEY')
BASE = "https://godview.app.n8n.cloud/api/v1"
TABLE_ID = "vILi9V1mv3ouo6EM"
NEW_TOKEN = "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD"

headers = {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json"
}

# Master row IDs to update (all type=master)
master_rows = [
    {"id": 25, "code": "bf"},
    {"id": 26, "code": "jd"},
    {"id": 27, "code": "n20"},
    {"id": 28, "code": "cs"},
    {"id": 29, "code": "js"},
    {"id": 30, "code": "ls"},
    {"id": 31, "code": "ms"},
    {"id": 32, "code": "cb"},
    {"id": 33, "code": "jb"},
    {"id": 34, "code": "lb"},
    {"id": 35, "code": "mb"},
    {"id": 36, "code": "cx"},
    {"id": 37, "code": "jx"},
    {"id": 38, "code": "lx"},
    {"id": 39, "code": "mx"},
    {"id": 40, "code": "n18"},
    {"id": 41, "code": "n14"},
    {"id": 42, "code": "n22"},
]

success = 0
fail = 0

for row in master_rows:
    url = f"{BASE}/data-tables/{TABLE_ID}/rows/{row['id']}"
    payload = {"token": NEW_TOKEN}
    try:
        resp = requests.patch(url, headers=headers, json=payload, timeout=15)
        if resp.status_code in [200, 201]:
            print(f"✅ {row['code']} (id:{row['id']}) - token updated")
            success += 1
        else:
            print(f"❌ {row['code']} (id:{row['id']}) - {resp.status_code}: {resp.text[:100]}")
            fail += 1
    except Exception as e:
        print(f"❌ {row['code']} (id:{row['id']}) - Error: {e}")
        fail += 1
    time.sleep(0.5)

print(f"\nDone! Success: {success}, Failed: {fail}")
