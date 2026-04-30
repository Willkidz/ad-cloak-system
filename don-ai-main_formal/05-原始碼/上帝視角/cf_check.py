import json, urllib.request, urllib.error

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
ZONE_ID = "3558fb741de4523d04af78db910e7376"
ACCOUNT_ID = "b2471e0c307123945bdf1ce1b025563f"
D1_DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

headers = {"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"}

def cf_get(url):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())
    except Exception as e:
        return {"error": str(e)}

# 1. Verify Token
print("=== 1. 驗證 Token ===")
r = cf_get("https://api.cloudflare.com/client/v4/user/tokens/verify")
print(json.dumps(r, indent=2, ensure_ascii=False))

# 2. List Zones
print("\n=== 2. 所有 Zones ===")
r = cf_get("https://api.cloudflare.com/client/v4/zones")
if r.get("success"):
    for z in r["result"]:
        print(f"  Zone: {z['name']}  ID: {z['id']}  Status: {z['status']}")
else:
    print(json.dumps(r, indent=2, ensure_ascii=False))

# 3. DNS Records
print(f"\n=== 3. DNS 紀錄 (Zone: {ZONE_ID}) ===")
r = cf_get(f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records?per_page=100")
if r.get("success"):
    records = r["result"]
    print(f"共 {len(records)} 筆\n")
    for rec in sorted(records, key=lambda x: (x["type"], x["name"])):
        proxy = "Proxied" if rec.get("proxied") else "DNS only"
        print(f"  {rec['type']:<8} {rec['name']:<45} {rec['content']:<40} {proxy}")
    # Save full records
    with open("/home/ubuntu/cf_dns_full.json", "w") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
else:
    print(json.dumps(r, indent=2, ensure_ascii=False))

# 4. D1 Database check
print(f"\n=== 4. D1 資料庫檢查 ===")
r = cf_get(f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{D1_DB_ID}")
if r.get("success"):
    db = r["result"]
    print(f"  名稱: {db.get('name','N/A')}")
    print(f"  UUID: {db.get('uuid','N/A')}")
    print(f"  版本: {db.get('version','N/A')}")
    print(f"  大小: {db.get('file_size','N/A')} bytes")
    print(f"  筆數: {db.get('num_tables','N/A')} tables")
else:
    print(json.dumps(r, indent=2, ensure_ascii=False))

# 5. Workers
print(f"\n=== 5. Workers 列表 ===")
r = cf_get(f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts")
if r.get("success"):
    workers = r["result"]
    print(f"共 {len(workers)} 個 Worker")
    for w in workers:
        print(f"  - {w.get('id','N/A')}  modified: {w.get('modified_on','N/A')[:19]}")
else:
    print(json.dumps(r, indent=2, ensure_ascii=False))

print("\n=== 完成 ===")
