import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCT_ID = "b2471e0c307123945bdf1ce1b025563f"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

url = f"https://api.cloudflare.com/client/v4/accounts/{ACCT_ID}/d1/database/{DB_ID}/query"
headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

# 3/20 台灣時間 = UTC 3/19 16:00 ~ 3/20 16:00
r = requests.post(url, headers=headers, json={"sql": "SELECT * FROM clicks WHERE timestamp >= '2026-03-19T16:00:00' ORDER BY timestamp DESC LIMIT 50"}, timeout=15)
d = r.json()
if d.get("success"):
    rows = d["result"][0]["results"]
    print(f"=== 3/20 台灣時間 Clicks: {len(rows)} 筆 ===")
    for row in rows:
        matched = "✅歸因" if row.get("matched") == 1 else "❌未歸因"
        ts = row['timestamp'][:19].replace('T',' ')
        print(f"  {ts} UTC | tag={row['tag']} | ad={row.get('ad_code','')} | {matched} | user={row.get('matched_user_id','')[:25] if row.get('matched_user_id') else '-'} | {row.get('ip_city','')}")

# 統計
r2 = requests.post(url, headers=headers, json={"sql": "SELECT COUNT(*) as total, SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched_count FROM clicks WHERE timestamp >= '2026-03-19T16:00:00'"}, timeout=15)
d2 = r2.json()
if d2.get("success"):
    s = d2["result"][0]["results"][0]
    total = s['total'] or 0
    matched = s['matched_count'] or 0
    print(f"\n總點擊: {total} | 已歸因: {matched} | 歸因率: {matched/total*100:.1f}%" if total > 0 else "\n無資料")
