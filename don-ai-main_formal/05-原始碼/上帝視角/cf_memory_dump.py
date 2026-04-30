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
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())
    except Exception as e:
        return {"error": str(e)}

# 1. Get all projects and categories overview
print("=== 專案與分類總覽 ===")
r = d1_query("SELECT project, category, COUNT(*) as cnt FROM memories GROUP BY project, category ORDER BY project, category;")
if r.get("success"):
    for row in r["result"][0]["results"]:
        print(f"  {row['project']:<20} {row['category']:<25} {row['cnt']} 筆")

# 2. Dump ALL memories ordered by project, then by id desc
print("\n\n=== 全部記憶 ===")
offset = 0
all_memories = []
while True:
    r = d1_query(f"SELECT id, project, category, title, content, tags, created_at, updated_at, importance_score, summary FROM memories ORDER BY project, id DESC LIMIT 50 OFFSET {offset};")
    if r.get("success"):
        rows = r["result"][0]["results"]
        if not rows:
            break
        all_memories.extend(rows)
        offset += 50
    else:
        print(f"Error at offset {offset}: {json.dumps(r, ensure_ascii=False)}")
        break

print(f"共讀取 {len(all_memories)} 筆記憶\n")

# Save full dump
with open("/home/ubuntu/memories_full.json", "w") as f:
    json.dump(all_memories, f, indent=2, ensure_ascii=False)

# Group by project
from collections import defaultdict
projects = defaultdict(list)
for m in all_memories:
    projects[m["project"]].append(m)

for proj, mems in sorted(projects.items()):
    print(f"\n{'='*80}")
    print(f"專案: {proj} ({len(mems)} 筆記憶)")
    print(f"{'='*80}")
    
    # Group by category within project
    cats = defaultdict(list)
    for m in mems:
        cats[m["category"]].append(m)
    
    for cat, cat_mems in sorted(cats.items()):
        print(f"\n  --- {cat} ({len(cat_mems)} 筆) ---")
        for m in cat_mems[:15]:  # show up to 15 per category
            title = m.get("title", "")[:80]
            content = m.get("content", "")[:200]
            importance = m.get("importance_score", "")
            print(f"\n  [#{m['id']}] {title}")
            print(f"  重要度: {importance} | 建立: {m.get('created_at','')[:19]} | 更新: {m.get('updated_at','')[:19]}")
            print(f"  內容: {content}")

print("\n\n=== 完成 ===")
