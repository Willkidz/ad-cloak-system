import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCT_ID = "b2471e0c307123945bdf1ce1b025563f"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"  # godview-clicks

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCT_ID}/d1/database/{DB_ID}/query"
headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

# 1. 表結構
r = requests.post(url, headers=headers, json={"sql": "SELECT name FROM sqlite_master WHERE type='table'"}, timeout=15)
tables = r.json()
print("=== Tables ===")
if tables.get("success"):
    for t in tables["result"][0]["results"]:
        print(f"  {t['name']}")
else:
    print(json.dumps(tables, indent=2)[:300])

# 2. 3/20 clicks
r2 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks WHERE created_at >= '2026-03-20' ORDER BY created_at DESC LIMIT 30"}, timeout=15)
d2 = r2.json()
print("\n=== 3/20 Clicks ===")
if d2.get("success") and d2.get("result"):
    rows = d2["result"][0].get("results", [])
    print(f"共 {len(rows)} 筆")
    for r in rows:
        print(r)
else:
    print(json.dumps(d2, indent=2)[:300])

# 3. 3/20 follows
r3 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM follows WHERE created_at >= '2026-03-20' ORDER BY created_at DESC LIMIT 30"}, timeout=15)
d3 = r3.json()
print("\n=== 3/20 Follows ===")
if d3.get("success") and d3.get("result"):
    rows = d3["result"][0].get("results", [])
    print(f"共 {len(rows)} 筆")
    for r in rows:
        print(r)
else:
    print(json.dumps(d3, indent=2)[:300])
