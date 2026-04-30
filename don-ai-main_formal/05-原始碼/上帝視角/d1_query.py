import requests, json

CF_TOKEN = "119e6b13-c2e3-48db-b568-f82191de6b4e"
ACCT_ID = "b2471e0c307123945bdf1ce1b025563f"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCT_ID}/d1/database/{DB_ID}/query"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
    "Content-Type": "application/json"
}

# 1. 查表結構
r = requests.post(url, headers=headers, json={"sql": "SELECT name FROM sqlite_master WHERE type='table'"}, timeout=15)
print("=== Tables ===")
print(json.dumps(r.json(), indent=2)[:500])

# 2. 最近 clicks
r2 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks ORDER BY created_at DESC LIMIT 20"}, timeout=15)
print("\n=== Recent Clicks ===")
data = r2.json()
if data.get("success") and data.get("result"):
    for row in data["result"][0].get("results", []):
        print(row)
else:
    print(json.dumps(data, indent=2)[:500])

# 3. 最近 follows
r3 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM follows ORDER BY created_at DESC LIMIT 20"}, timeout=15)
print("\n=== Recent Follows ===")
data3 = r3.json()
if data3.get("success") and data3.get("result"):
    for row in data3["result"][0].get("results", []):
        print(row)
else:
    print(json.dumps(data3, indent=2)[:500])
