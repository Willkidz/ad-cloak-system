import requests, json

API = "https://api.cloudflare.com/client/v4/accounts/61f1eb800e48d2cf41ed9ddacf01581b/d1/database/3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c/query"
TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def query(sql):
    r = requests.post(API, headers=HEADERS, json={"sql": sql})
    data = r.json()
    if data.get("success") and data.get("result"):
        return data["result"][0]["results"]
    print(f"Error: {data}")
    return []

# 1. 總覽統計
print("=== 1. 總覽統計 ===")
rows = query("""
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched_count,
  SUM(CASE WHEN fbclid != '' AND fbclid IS NOT NULL THEN 1 ELSE 0 END) as has_fbclid,
  SUM(CASE WHEN fbc != '' AND fbc IS NOT NULL THEN 1 ELSE 0 END) as has_fbc,
  SUM(CASE WHEN fbp != '' AND fbp IS NOT NULL THEN 1 ELSE 0 END) as has_fbp,
  SUM(CASE WHEN ip_address != '' AND ip_address IS NOT NULL THEN 1 ELSE 0 END) as has_ip,
  SUM(CASE WHEN user_agent != '' AND user_agent IS NOT NULL THEN 1 ELSE 0 END) as has_ua
FROM clicks
""")
for r in rows:
    for k,v in r.items():
        print(f"  {k}: {v}")

# 2. 按 ad_code 分組統計
print("\n=== 2. 按 ad_code 分組 ===")
rows = query("""
SELECT ad_code, COUNT(*) as cnt, 
  SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched,
  SUM(CASE WHEN fbclid != '' THEN 1 ELSE 0 END) as has_fbclid
FROM clicks GROUP BY ad_code ORDER BY cnt DESC
""")
for r in rows:
    print(f"  {r['ad_code']:10s} | 點擊:{r['cnt']:3d} | 配對:{r['matched']:3d} | 有fbclid:{r['has_fbclid']:3d}")

# 3. 已配對的記錄詳情（看 CAPI 發了什麼）
print("\n=== 3. 已配對記錄詳情 ===")
rows = query("""
SELECT click_id, ad_code, timestamp, matched_at, matched_user_id, 
  ip_address, user_agent, fbclid, fbc, fbp, ip_country
FROM clicks WHERE matched=1 ORDER BY matched_at DESC LIMIT 10
""")
for r in rows:
    print(f"  click:{r['click_id'][:8]}... | {r['ad_code']} | {r['timestamp']}")
    print(f"    IP: {r['ip_address']}")
    print(f"    UA: {r['user_agent'][:80]}")
    print(f"    fbclid: {r['fbclid'] or '(空)'}")
    print(f"    fbc: {r['fbc'] or '(空)'}")
    print(f"    fbp: {r['fbp'] or '(空)'}")
    print(f"    matched_at: {r['matched_at']}")
    print(f"    matched_user: {r['matched_user_id']}")
    print()

# 4. 未配對的記錄（看為什麼沒配上）
print("\n=== 4. 未配對記錄（最近20筆）===")
rows = query("""
SELECT click_id, ad_code, timestamp, destination, ip_address, user_agent, ip_country
FROM clicks WHERE matched=0 ORDER BY timestamp DESC LIMIT 20
""")
for r in rows:
    print(f"  {r['timestamp']} | {r['ad_code']:6s} | dest:{r['destination'][:30] if r.get('destination') else '(空)'} | IP:{r['ip_address'][:30]} | country:{r['ip_country']}")

# 5. 配對時間差分析
print("\n=== 5. 配對時間差分析 ===")
rows = query("""
SELECT click_id, ad_code, timestamp, matched_at,
  ROUND((julianday(matched_at) - julianday(timestamp)) * 86400, 1) as seconds_diff
FROM clicks WHERE matched=1 ORDER BY matched_at DESC LIMIT 10
""")
for r in rows:
    print(f"  {r['ad_code']} | 點擊:{r['timestamp']} | 配對:{r['matched_at']} | 差:{r['seconds_diff']}秒")

# 6. 重複 IP 分析（同一 IP 多次點擊）
print("\n=== 6. 重複 IP 分析 ===")
rows = query("""
SELECT ip_address, COUNT(*) as cnt, GROUP_CONCAT(DISTINCT ad_code) as codes
FROM clicks WHERE ip_address != '' 
GROUP BY ip_address HAVING cnt > 2 ORDER BY cnt DESC LIMIT 10
""")
for r in rows:
    print(f"  IP:{r['ip_address'][:40]} | 次數:{r['cnt']} | 廣告碼:{r['codes']}")
