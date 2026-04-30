import json

with open('/tmp/wf_sheets_latest.json') as f:
    wf = json.load(f)

for node in wf.get('nodes', []):
    if node.get('name') == 'Calculate Stats':
        code = node['parameters']['jsCode']
        
        # 1. 修正 line_config DataTable ID（舊的已被刪除）
        code = code.replace('aL6JTLjrpNXf8aKM', '1VvB8jijHE5GXbv6')
        
        # 2. Read Existing Performance 讀取 A11:N200 → 正確（Row 10 是標題，Row 11 開始數據）
        # 3. adPerformance range A11:N → 正確
        # 4. 偵測率 C4:C6 → 正確（AS/AX/AB）
        # 5. Hide Detection Rows startIndex 3~6 → Row 4~7 → 正確
        
        node['parameters']['jsCode'] = code
        print(f"Calculate Stats updated")
        print(f"  - Fixed line_config ID: aL6JTLjrpNXf8aKM -> 1VvB8jijHE5GXbv6")

# 也修正 Read Existing Performance 的 URL 確認行號
for node in wf.get('nodes', []):
    if node.get('name') == 'Read Existing Performance':
        url = node['parameters'].get('url', '')
        print(f"\nRead Existing Performance URL: {url}")
        # 確認是 A11:N200（跳過 Row 10 標題列）
        # URL encoded: %27%E6%88%90%E6%95%88%27!A11:N200
        if 'A12' in url:
            # 需要改為 A11
            new_url = url.replace('A12', 'A11').replace('N200', 'N200')
            node['parameters']['url'] = new_url
            print(f"  -> Fixed: A12 -> A11")
        elif 'A11' in url:
            print(f"  -> Already correct (A11)")

# 準備推送
push_data = {
    'name': wf['name'],
    'nodes': wf['nodes'],
    'connections': wf['connections'],
    'settings': wf.get('settings', {})
}

with open('/tmp/wf_sheets_v4_push.json', 'w') as f:
    json.dump(push_data, f, ensure_ascii=False)

print(f"\nPush payload saved ({len(json.dumps(push_data))} bytes)")
