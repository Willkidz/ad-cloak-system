import json, subprocess

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
CF_ACCOUNT = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

def query_d1(sql):
    r = subprocess.run([
        'curl', '-s', '-X', 'POST',
        f'https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/d1/database/{DB_ID}/query',
        '-H', f'Authorization: Bearer {CF_TOKEN}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"sql": sql})
    ], capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout)

# Get schema
data = query_d1("PRAGMA table_info(clicks)")
res = data.get('result', [])
if res:
    rows = res[0].get('results', [])
    print("clicks 表欄位：")
    for r in rows:
        print(f"  {r.get('name')}")
else:
    print("Error:", json.dumps(data, indent=2)[:300])
