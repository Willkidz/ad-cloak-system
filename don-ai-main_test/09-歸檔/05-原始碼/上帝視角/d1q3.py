import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCT_ID = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCT_ID}/d1/database/{DB_ID}/query"
headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

# 3/20 clicks
r = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks WHERE timestamp >= '2026-03-20' ORDER BY timestamp DESC LIMIT 50"}, timeout=15)
d = r.json()
if d.get("success"):
    rows = d["result"][0]["results"]
    print(f"=== 3/20 Clicks: {len(rows)} 筆 ===")
    for row in rows:
        matched = "✅歸因" if row.get("matched") == 1 else "❌未歸因"
        print(f"  {row['timestamp'][:19]} | tag={row['tag']} | ad={row.get('ad_code','')} | {matched} | user={row.get('matched_user_id','')[:20] if row.get('matched_user_id') else ''} | ip_country={row.get('ip_country','')} | city={row.get('ip_city','')}")
else:
    print(json.dumps(d, indent=2)[:500])

# 統計
r2 = requests.post(url, headers=headers, json={"sql": "SELECT COUNT(*) as total, SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched_count FROM clicks WHERE timestamp >= '2026-03-20'"}, timeout=15)
d2 = r2.json()
if d2.get("success"):
    s = d2["result"][0]["results"][0]
    print(f"\n=== 3/20 統計 ===")
    print(f"總點擊: {s['total']}")
    print(f"已歸因: {s['matched_count']}")
    print(f"歸因率: {s['matched_count']/s['total']*100:.1f}%" if s['total'] > 0 else "無資料")

# 3/20 之前最新的資料是什麼時候
r3 = requests.post(url, headers=headers, json={"sql": "SELECT MAX(timestamp) as latest FROM clicks"}, timeout=15)
d3 = r3.json()
if d3.get("success"):
    print(f"\n最新一筆 click: {d3['result'][0]['results'][0]['latest']}")
