import requests, os, json

N8N_BASE = 'https://godview.app.n8n.cloud'
API_KEY = os.environ['N8N_API_KEY']
TABLE_ID = '1VvB8jijHE5GXbv6'  # line_config

headers = {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json'
}

# 要更新的帳號
updates = [
    {'tag': 'n14', 'line': '@416nbqjl', 'name': '洪金豹', 'destination': 'U0d18d0ef85a7200968002ad98333feda'},
    {'tag': 'n15', 'line': '@745jaffa', 'name': '開版歪歪熊', 'destination': 'U454703dd1ed39d71332747a69a134556'},
    {'tag': 'n16', 'line': '@751tggmd', 'name': '晴兒', 'destination': 'U7a4a33ecbcf38fa50d2d0727ea12ec8a'},
    {'tag': 'n17', 'line': '@106tndmh', 'name': '郝士多', 'destination': 'U3e09fe40176b71674bf5eae8e77a9d2e'},
    {'tag': 'n18', 'line': '@013rgbjl', 'name': '電子蕭甘丹', 'destination': 'Ud4569f5351c03a556e19729a8a3c2711'},
    {'tag': 'n19', 'line': '@536uhfpf', 'name': '開版歪熊', 'destination': 'U9aa3a89e3ea6a0af910290e941a1c47d'},
    {'tag': 'n20', 'line': '@348ikfwm', 'name': '蘇主金', 'destination': 'U822bb6807f10db0ec822086078a45fb4'},
    {'tag': 'n21', 'line': '@075cocov', 'name': '武狀元', 'destination': 'Uf5fc4eaa9fbbd5fbdd42ed8102abeba4'},
]

# 先讀取 line_config 的所有行，找到每個 tag 對應的行 ID
resp = requests.get(f'{N8N_BASE}/api/v1/data-tables/{TABLE_ID}/rows', headers=headers)
rows = json.loads(resp.text).get('data', [])

# 建立 tag -> row 的對照
tag_to_row = {}
for r in rows:
    tag = r.get('tag', '')
    tag_to_row[tag] = r

# 逐一更新
success = 0
fail = 0
for upd in updates:
    tag = upd['tag']
    dest = upd['destination']
    
    if tag not in tag_to_row:
        print(f"❌ {tag} - 在 line_config 中找不到此 tag")
        fail += 1
        continue
    
    row = tag_to_row[tag]
    current_dest = row.get('destination', '')
    
    if current_dest == dest:
        print(f"⏭️ {tag} {upd['name']} - destination 已正確，跳過")
        continue
    
    # 使用 upsert 操作，以 tag 為 match key
    payload = {
        "operation": "update",
        "columns": {
            "destination": dest
        }
    }
    
    # n8n DataTable API 的 update 需要用 row ID
    row_id = row.get('id', '')
    
    resp2 = requests.patch(
        f'{N8N_BASE}/api/v1/data-tables/{TABLE_ID}/rows/{row_id}',
        headers=headers,
        json={"destination": dest}
    )
    
    if resp2.status_code in [200, 201, 204]:
        print(f"✅ {tag} {upd['name']:10s} -> {dest}")
        success += 1
    else:
        print(f"❌ {tag} {upd['name']:10s} - HTTP {resp2.status_code}: {resp2.text[:100]}")
        fail += 1

print(f"\n成功: {success}, 失敗: {fail}")
