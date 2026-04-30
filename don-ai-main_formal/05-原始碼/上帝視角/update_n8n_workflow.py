#!/usr/bin/env python3
"""修改 n8n Sheets Report workflow:
1. 更新 Calculate Stats 節點代碼
2. 更新 Read Existing Performance 的讀取範圍
3. 更新 Write Performance 的寫入配置
4. 更新 Write Attribution / Write Timestamp 配合新結構
"""
import json
import subprocess
import os

N8N_URL = os.environ.get('N8N_INSTANCE_URL', 'https://godview.app.n8n.cloud').rstrip('/')
N8N_KEY = os.environ.get('N8N_API_KEY', '')
WORKFLOW_ID = 'wYZTQNjOot8qZZ8I'

# 讀取原始 workflow
with open('/home/ubuntu/workflow_original.json') as f:
    workflow = json.load(f)

# 讀取新的 Calculate Stats 代碼
with open('/home/ubuntu/new_calculate_stats.js') as f:
    new_js_code = f.read()

# 修改節點
for node in workflow['nodes']:
    
    # 1. 更新 Calculate Stats 代碼
    if node['name'] == 'Calculate Stats':
        node['parameters']['jsCode'] = new_js_code
        print("✓ 更新 Calculate Stats 代碼")
    
    # 2. 更新 Read Existing Performance 讀取範圍（配合新結構）
    if node['name'] == 'Read Existing Performance':
        # 改為讀取成效表 A1:R20
        old_url = node['parameters'].get('url', '')
        new_url = "https://sheets.googleapis.com/v4/spreadsheets/1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I/values/%27%E6%88%90%E6%95%88%27!A1:R20"
        node['parameters']['url'] = new_url
        print(f"✓ 更新 Read Existing Performance URL")
    
    # 3. 更新 Write Performance 寫入配置
    if node['name'] == 'Write Performance':
        # URL 使用動態範圍，保持不變（它引用 writePayloads.adPerformance.range）
        print(f"✓ Write Performance URL 保持動態引用（已由 Calculate Stats 更新範圍）")
    
    # 4. 更新 Write Timestamp
    if node['name'] == 'Write Timestamp':
        new_url = "https://sheets.googleapis.com/v4/spreadsheets/1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I/values/%27%E6%88%90%E6%95%88%27%21F1?valueInputOption=USER_ENTERED"
        node['parameters']['url'] = new_url
        # 更新 body
        node['parameters']['sendBody'] = True
        node['parameters']['specifyBody'] = 'json'
        node['parameters']['jsonBody'] = '={{ JSON.stringify($("Calculate Stats").first().json.writePayloads.timestamp) }}'
        print(f"✓ 更新 Write Timestamp")
    
    # 5. 停用 Write Attribution 和 Hide Detection Rows（新版不需要）
    if node['name'] in ['Write Attribution', 'Hide Detection Rows']:
        node['disabled'] = True
        print(f"✓ 停用 {node['name']}")

# 準備更新 payload（只需要 nodes）
update_payload = {
    "name": workflow.get('name', '上帝視角_Sheets Report'),
    "nodes": workflow['nodes'],
    "connections": workflow.get('connections', {}),
    "settings": workflow.get('settings', {})
}

# 寫入臨時文件
with open('/tmp/workflow_update.json', 'w', encoding='utf-8') as f:
    json.dump(update_payload, f, ensure_ascii=False)

# 使用 curl 更新 workflow
result = subprocess.run([
    'curl', '-s', '--max-time', '30',
    '-X', 'PUT',
    f'{N8N_URL}/api/v1/workflows/{WORKFLOW_ID}',
    '-H', f'X-N8N-API-KEY: {N8N_KEY}',
    '-H', 'Content-Type: application/json',
    '-d', f'@/tmp/workflow_update.json'
], capture_output=True, text=True, timeout=45)

output = result.stdout
if 'error' in output.lower() and 'message' in output.lower():
    try:
        err = json.loads(output)
        print(f"\n✗ 更新失敗: {err.get('message', output[:300])}")
    except:
        print(f"\n✗ 更新失敗: {output[:500]}")
else:
    try:
        resp = json.loads(output)
        if resp.get('id'):
            print(f"\n✓ Workflow 更新成功！ID: {resp['id']}")
        else:
            print(f"\n? 回應: {output[:300]}")
    except:
        print(f"\n? 回應: {output[:300]}")

subprocess.run(['rm', '-f', '/tmp/workflow_update.json'])
