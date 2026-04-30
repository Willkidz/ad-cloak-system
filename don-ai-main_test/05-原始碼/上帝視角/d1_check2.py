import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCOUNT_ID = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
    "Content-Type": "application/json"
}

# 查 clicks 完整欄位
r = requests.post(url, headers=headers, json={"sql": "PRAGMA table_info(clicks)"}, timeout=30)
data = r.json()
print("=== clicks 欄位 ===")
for col in data['result'][0]['results']:
    print(f"  {col['name']} ({col['type']})")

# 查最近的 clicks
r2 = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks ORDER BY timestamp DESC LIMIT 5"}, timeout=30)
data2 = r2.json()
print("\n=== 最近 5 筆 clicks ===")
for row in data2['result'][0]['results']:
    print(json.dumps(row, ensure_ascii=False))

# 查今天的歸因統計 (用 timestamp 欄位)
r3 = requests.post(url, headers=headers, json={"sql": "SELECT tag, COUNT(*) as cnt FROM clicks WHERE timestamp >= datetime('now', '-1 day') AND matched = 1 GROUP BY tag ORDER BY cnt DESC"}, timeout=30)
data3 = r3.json()
print("\n=== 今天歸因統計 ===")
if data3.get('success'):
    for row in data3['result'][0]['results']:
        print(f"  {row['tag']}: {row['cnt']} 筆")
else:
    print(json.dumps(data3, ensure_ascii=False))
