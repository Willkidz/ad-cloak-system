import json, urllib.request, urllib.error

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
ACCOUNT_ID = "b2471e0c307123945bdf1ce1b025563f"
MEMORY_DB_ID = "915bd7ab-34a1-415b-b716-16995bccb978"

BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{MEMORY_DB_ID}"
headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

def d1_query(sql):
    url = f"{BASE}/query"
    data = json.dumps({"sql": sql}).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())
    except Exception as e:
        return {"error": str(e)}

# 1. DB info
print("=== manus-memory D1 資料庫 ===")
url = f"{BASE}"
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    if data.get("success"):
        db = data["result"]
        print(f"  名稱: {db.get('name')}")
        print(f"  UUID: {db.get('uuid')}")
        print(f"  大小: {db.get('file_size')} bytes")
except Exception as e:
    print(f"  Error: {e}")

# 2. Tables
print("\n=== Tables ===")
r = d1_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
if r.get("success"):
    tables = [row["name"] for row in r["result"][0]["results"]]
    print(f"共 {len(tables)} 個 table: {tables}")
else:
    tables = []
    print(json.dumps(r, indent=2, ensure_ascii=False))

# 3. Schema + count + sample
for t in tables:
    if t.startswith("_cf_"): continue
    print(f"\n--- {t} ---")
    r = d1_query(f"PRAGMA table_info({t});")
    if r.get("success"):
        for c in r["result"][0]["results"]:
            pk = " [PK]" if c.get("pk") else ""
            print(f"  {c['name']:<25} {c['type']:<15}{pk}")
    
    r = d1_query(f"SELECT COUNT(*) as cnt FROM {t};")
    if r.get("success"):
        print(f"  筆數: {r['result'][0]['results'][0]['cnt']}")
    
    r = d1_query(f"SELECT * FROM {t} ORDER BY rowid DESC LIMIT 5;")
    if r.get("success"):
        rows = r["result"][0]["results"]
        print(f"  最新 {len(rows)} 筆:")
        for row in rows:
            print(f"    {json.dumps(row, ensure_ascii=False)[:200]}")

# 4. Also get some stats from clicks DB
print("\n\n=== godview-clicks 統計 ===")
CLICKS_DB = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
BASE2 = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{CLICKS_DB}"

def d1_query2(sql):
    url = f"{BASE2}/query"
    data = json.dumps({"sql": sql}).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

queries = [
    ("總點擊數", "SELECT COUNT(*) as total FROM clicks"),
    ("已匹配數", "SELECT COUNT(*) as matched FROM clicks WHERE matched=1"),
    ("未匹配數", "SELECT COUNT(*) as unmatched FROM clicks WHERE matched=0"),
    ("各 tag 點擊數", "SELECT tag, COUNT(*) as cnt, SUM(matched) as matched_cnt FROM clicks GROUP BY tag ORDER BY cnt DESC"),
    ("各國家點擊數", "SELECT ip_country, COUNT(*) as cnt FROM clicks GROUP BY ip_country ORDER BY cnt DESC LIMIT 10"),
    ("每日點擊數", "SELECT DATE(timestamp) as day, COUNT(*) as cnt, SUM(matched) as matched_cnt FROM clicks GROUP BY day ORDER BY day DESC LIMIT 10"),
    ("各 line_oa_id 點擊數", "SELECT line_oa_id, COUNT(*) as cnt FROM clicks GROUP BY line_oa_id ORDER BY cnt DESC"),
]

for label, sql in queries:
    r = d1_query2(sql)
    if r.get("success"):
        rows = r["result"][0]["results"]
        print(f"\n{label}:")
        for row in rows:
            print(f"  {row}")
    else:
        print(f"\n{label}: ERROR")

print("\n=== 完成 ===")
