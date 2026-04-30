import requests, json

CF_TOKEN = "D3qRx4sB_kz2rnJyNZWcmn55lxhnd0DOwW0hAKbA"
ACCOUNT_ID = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"

def query_d1(sql):
    r = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query",
        headers={"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"},
        json={"sql": sql}, timeout=15
    )
    return r.json()

# 1. 各產品的 click 數量（今天）
print("=== D1 今日 click 按 tag 前綴統計 ===")
r = query_d1("SELECT tag, COUNT(*) as cnt FROM clicks WHERE timestamp > datetime('now', '-24 hours') GROUP BY tag ORDER BY cnt DESC")
if r.get("success"):
    for row in r["result"][0]["results"]:
        print(f"  {row['tag']}: {row['cnt']}")

# 2. 各產品的 matched 數量
print("\n=== D1 今日歸因成功 ===")
r = query_d1("SELECT tag, COUNT(*) as cnt FROM clicks WHERE timestamp > datetime('now', '-24 hours') AND matched=1 GROUP BY tag ORDER BY cnt DESC")
if r.get("success"):
    for row in r["result"][0]["results"]:
        print(f"  {row['tag']}: {row['cnt']}")

# 3. 按產品分組統計
TAG_PREFIX = {
    "js": "AS", "cs": "AS", "ms": "AS", "ls": "AS",
    "jb": "AB", "cb": "AB", "mb": "AB", "lb": "AB",
    "jx": "AX", "cx": "AX", "mx": "AX", "lx": "AX",
    "bf": "BF", "jd": "BF",
    "n14": "N14", "n18": "N18", "n20": "N20", "n21": "N21", "n22": "N22",
}

print("\n=== D1 今日 click 按產品分組 ===")
r = query_d1("SELECT tag, COUNT(*) as cnt FROM clicks WHERE timestamp > datetime('now', '-24 hours') GROUP BY tag")
if r.get("success"):
    product_clicks = {}
    for row in r["result"][0]["results"]:
        tag = row["tag"]
        prefix = TAG_PREFIX.get(tag, tag[:2].upper() if len(tag) >= 2 else tag)
        product_clicks[prefix] = product_clicks.get(prefix, 0) + row["cnt"]
    for p in sorted(product_clicks.keys()):
        print(f"  {p}: {product_clicks[p]} clicks")

# 4. 總計
print("\n=== D1 今日總計 ===")
r = query_d1("SELECT COUNT(*) as total, SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as matched FROM clicks WHERE timestamp > datetime('now', '-24 hours')")
if r.get("success"):
    row = r["result"][0]["results"][0]
    print(f"  總 click: {row['total']}, 歸因成功: {row['matched']}")

# 5. BC 像素截圖數據
print("\n=== BC 像素事件（截圖）vs D1 比對 ===")
bc_events = {
    "ALL_Lead": 99, "ALL_PageView": 52,
    "BF_Lead": 43, "BF_PageView": 40,
    "AS_Lead": 30, "ALL_Purchase": 26,
    "AB_Lead": 23, "BF_Purchase": 21,
    "AS_PageView": 19, "AX_Lead": 17,
}

# Lead = Worker 跳轉時發的，所以 Lead 數 ≈ click 數
# PageView = 落地頁 JS 發的（/bc-event）
# Purchase = 落地頁 JS 發的（/bc-event）
lead_total = bc_events.get("BF_Lead",0) + bc_events.get("AS_Lead",0) + bc_events.get("AB_Lead",0) + bc_events.get("AX_Lead",0)
print(f"  BC Lead 總計（BF+AS+AB+AX）: {lead_total}")
print(f"  BC ALL_Lead: {bc_events['ALL_Lead']}")
print(f"  差異: ALL_Lead({bc_events['ALL_Lead']}) vs 產品Lead合計({lead_total})")
print(f"  → {'一致' if abs(bc_events['ALL_Lead'] - lead_total) <= 5 else '有差異'}")
