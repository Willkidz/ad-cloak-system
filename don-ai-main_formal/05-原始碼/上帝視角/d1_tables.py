import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCOUNT_ID = "b2471e0c307123945bdf1ce1b025563f"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query"
headers = {
    "Authorization": f"Bearer {CF_TOKEN}",
    "Content-Type": "application/json"
}

# 查表
r = requests.post(url, headers=headers, json={"sql": "SELECT name FROM sqlite_master WHERE type='table'"}, timeout=30)
print("Tables:", r.text[:500])

# 查 clicks 表結構
r2 = requests.post(url, headers=headers, json={"sql": "PRAGMA table_info(clicks)"}, timeout=30)
print("\nClicks schema:", r2.text[:500])

# 查 follows 表結構
r3 = requests.post(url, headers=headers, json={"sql": "PRAGMA table_info(follows)"}, timeout=30)
print("\nFollows schema:", r3.text[:500])

# 查今天的歸因數量
r4 = requests.post(url, headers=headers, json={"sql": "SELECT tag, ad_code, COUNT(*) as cnt FROM clicks WHERE created_at >= datetime('now', '-1 day') GROUP BY tag, ad_code ORDER BY cnt DESC"}, timeout=30)
print("\nToday clicks:", r4.text[:1000])
