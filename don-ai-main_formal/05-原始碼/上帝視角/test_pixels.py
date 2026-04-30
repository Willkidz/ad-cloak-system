import json, subprocess

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
CF_ACCOUNT = "b2471e0c307123945bdf1ce1b025563f"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

def query_d1(sql):
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/d1/database/{DB_ID}/query',
        '-H', f'Authorization: Bearer {CF_TOKEN}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"sql": sql})
    ], capture_output=True, text=True, timeout=15)
    data = json.loads(result.stdout)
    res = data.get('result', [])
    if not res:
        print(f'Error: {json.dumps(data, indent=2)[:300]}')
        return []
    return res[0].get('results', [])

# 1. 今日各 tag 統計
print("=== 今日各 tag 統計（台灣時間）===")
sql1 = """
SELECT tag, 
  COUNT(*) as total, 
  SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched,
  SUM(CASE WHEN matched=1 AND pixel_id IS NOT NULL AND pixel_id != '' THEN 1 ELSE 0 END) as has_pixel,
  SUM(CASE WHEN matched=1 AND (pixel_id IS NULL OR pixel_id = '') THEN 1 ELSE 0 END) as no_pixel
FROM clicks 
WHERE created_at >= datetime('now', '-16 hours')
GROUP BY tag ORDER BY total DESC
"""
rows = query_d1(sql1)
print(f"{'tag':5s} | {'點擊':>4s} | {'匹配':>4s} | {'有pixel':>7s} | {'無pixel':>7s}")
print("-" * 50)
t1=t2=t3=t4=0
for r in rows:
    tag=r.get('tag','')
    total=r.get('total',0)
    matched=r.get('matched',0)
    hp=r.get('has_pixel',0)
    np_=r.get('no_pixel',0)
    t1+=total;t2+=matched;t3+=hp;t4+=np_
    print(f"  {tag:5s} | {total:4d} | {matched:4d} | {hp:7d} | {np_:7d}")
print("-" * 50)
print(f"  {'合計':5s} | {t1:4d} | {t2:4d} | {t3:7d} | {t4:7d}")

# 2. 最近 10 筆匹配紀錄 - 確認 pixel_id
print("\n=== 最近 10 筆匹配紀錄（AD 像素檢查）===")
sql2 = "SELECT tag, pixel_id, matched, created_at FROM clicks WHERE matched = 1 ORDER BY created_at DESC LIMIT 10"
rows2 = query_d1(sql2)
for r in rows2:
    tag = r.get('tag','')
    pixel = str(r.get('pixel_id',''))[:15] if r.get('pixel_id') else '(空)'
    time = r.get('created_at','')
    status = 'OK' if r.get('pixel_id') else 'MISSING'
    print(f"  {tag:5s} | pixel={pixel:18s} | {status} | {time}")

# 3. 修復後 vs 修復前的比較
print("\n=== 修復前後比較 ===")
sql3 = """
SELECT 
  CASE WHEN created_at >= '2026-03-23T08:30:00' THEN '修復後' ELSE '修復前' END as period,
  COUNT(*) as total_matched,
  SUM(CASE WHEN pixel_id IS NOT NULL AND pixel_id != '' THEN 1 ELSE 0 END) as has_pixel,
  SUM(CASE WHEN pixel_id IS NULL OR pixel_id = '' THEN 1 ELSE 0 END) as no_pixel
FROM clicks 
WHERE matched = 1 AND created_at >= '2026-03-23T00:00:00'
GROUP BY period
"""
rows3 = query_d1(sql3)
for r in rows3:
    period = r.get('period','')
    total = r.get('total_matched',0)
    hp = r.get('has_pixel',0)
    np_ = r.get('no_pixel',0)
    rate = f"{hp/total*100:.0f}%" if total > 0 else "N/A"
    print(f"  {period}: 匹配={total}, 有pixel={hp}, 無pixel={np_}, pixel率={rate}")
