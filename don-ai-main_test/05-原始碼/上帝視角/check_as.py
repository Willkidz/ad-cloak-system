import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCOUNT_ID = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

def q(sql):
    r = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query",
        headers={"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"},
        json={"sql": sql}, timeout=15
    )
    return r.json()['result'][0]['results']

# AS 系列 TAG: js, cs, ms, ls
print("=== AS 系列 (js/cs/ms/ls) 最近點擊記錄 ===")
rows = q("SELECT timestamp, tag, ad_code, matched, matched_at, matched_user_id, ip_address, fbclid, destination, os, device_brand FROM clicks WHERE tag IN ('js','cs','ms','ls') ORDER BY timestamp DESC LIMIT 20")
for r in rows:
    fc = (r.get('fbclid','') or '')[:15]
    print(f"  {r['timestamp'][:19]} | tag={r.get('tag')} | ad={r.get('ad_code','')} | matched={r.get('matched',0)} | user={r.get('matched_user_id','')[:20] if r.get('matched_user_id') else ''} | dest={r.get('destination','')[:30]} | {r.get('os','')} {r.get('device_brand','')}")

print(f"\n共 {len(rows)} 筆")

# 查今天的記錄
print("\n=== 今天 (3/20) AS 系列點擊 ===")
rows2 = q("SELECT timestamp, tag, ad_code, matched, matched_at, matched_user_id, ip_address, destination FROM clicks WHERE tag IN ('js','cs','ms','ls') AND timestamp >= '2026-03-20' ORDER BY timestamp DESC")
for r in rows2:
    print(f"  {r['timestamp'][:19]} | tag={r.get('tag')} | ad={r.get('ad_code','')} | matched={r.get('matched',0)} | user={r.get('matched_user_id','')}")
print(f"共 {len(rows2)} 筆")

# 也查昨天晚上的
print("\n=== 昨天 (3/19) 18:00 後 AS 系列 ===")
rows3 = q("SELECT timestamp, tag, ad_code, matched, matched_at, matched_user_id, ip_address, destination FROM clicks WHERE tag IN ('js','cs','ms','ls') AND timestamp >= '2026-03-19T18:00' ORDER BY timestamp DESC")
for r in rows3:
    print(f"  {r['timestamp'][:19]} | tag={r.get('tag')} | ad={r.get('ad_code','')} | matched={r.get('matched',0)} | user={r.get('matched_user_id','')}")
print(f"共 {len(rows3)} 筆")
