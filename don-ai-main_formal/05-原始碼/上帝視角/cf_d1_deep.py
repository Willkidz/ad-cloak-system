import json, urllib.request, urllib.error

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
ACCOUNT_ID = "b2471e0c307123945bdf1ce1b025563f"
D1_DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{D1_DB_ID}"
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

# 1. List all tables
print("=== 1. D1 資料庫所有 Tables ===")
r = d1_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
if r.get("success"):
    tables = [row["name"] for row in r["result"][0]["results"]]
    print(f"共 {len(tables)} 個 table: {tables}")
else:
    print(json.dumps(r, indent=2, ensure_ascii=False))
    tables = []

# 2. Get schema for each table
print("\n=== 2. 每個 Table 的結構 ===")
for t in tables:
    r = d1_query(f"PRAGMA table_info({t});")
    if r.get("success"):
        cols = r["result"][0]["results"]
        print(f"\n--- {t} ---")
        for c in cols:
            pk = " [PK]" if c.get("pk") else ""
            nn = " NOT NULL" if c.get("notnull") else ""
            df = f" DEFAULT {c['dflt_value']}" if c.get("dflt_value") else ""
            print(f"  {c['name']:<25} {c['type']:<15}{pk}{nn}{df}")

# 3. Row count for each table
print("\n=== 3. 每個 Table 的資料筆數 ===")
for t in tables:
    r = d1_query(f"SELECT COUNT(*) as cnt FROM {t};")
    if r.get("success"):
        cnt = r["result"][0]["results"][0]["cnt"]
        print(f"  {t}: {cnt} 筆")

# 4. Sample data from each table
print("\n=== 4. 每個 Table 的最新 10 筆資料 ===")
for t in tables:
    r = d1_query(f"SELECT * FROM {t} ORDER BY rowid DESC LIMIT 10;")
    if r.get("success"):
        rows = r["result"][0]["results"]
        print(f"\n--- {t} (最新 {len(rows)} 筆) ---")
        if rows:
            # print header
            keys = list(rows[0].keys())
            print("  " + " | ".join(keys))
            print("  " + "-" * 80)
            for row in rows:
                vals = [str(row.get(k, ""))[:30] for k in keys]
                print("  " + " | ".join(vals))

# 5. Check indexes
print("\n=== 5. 索引 ===")
for t in tables:
    r = d1_query(f"PRAGMA index_list({t});")
    if r.get("success"):
        indexes = r["result"][0]["results"]
        if indexes:
            print(f"\n--- {t} ---")
            for idx in indexes:
                print(f"  {idx.get('name','')} unique={idx.get('unique','')}")

# 6. Check if there are other D1 databases
print("\n=== 6. 帳號下所有 D1 資料庫 ===")
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database"
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
    if data.get("success"):
        for db in data["result"]:
            print(f"  {db.get('name','N/A')}  UUID: {db.get('uuid','N/A')}  version: {db.get('version','N/A')}")
except Exception as e:
    print(f"  Error: {e}")

print("\n=== 完成 ===")
