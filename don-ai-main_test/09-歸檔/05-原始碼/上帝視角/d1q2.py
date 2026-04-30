import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCT_ID = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCT_ID}/d1/database/{DB_ID}/query"
headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

# clicks 表結構
r = requests.post(url, headers=headers, json={"sql": "PRAGMA table_info(clicks)"}, timeout=15)
print("=== clicks schema ===")
for col in r.json()["result"][0]["results"]:
    print(f"  {col['name']} ({col['type']})")

# 最近 clicks
r2 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks ORDER BY rowid DESC LIMIT 30"}, timeout=15)
d2 = r2.json()
print(f"\n=== Recent Clicks ({len(d2['result'][0]['results'])} rows) ===")
for row in d2["result"][0]["results"]:
    print(row)

# 所有表
r3 = requests.post(url, headers=headers, json={"sql": "SELECT name FROM sqlite_master WHERE type='table'"}, timeout=15)
print("\n=== All tables ===")
for t in r3.json()["result"][0]["results"]:
    print(f"  {t['name']}")
