import requests, os, json, time

N8N_BASE = 'https://godview.app.n8n.cloud'
API_KEY = os.environ['N8N_API_KEY']
SHEETS_ID = '1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I'

headers = {'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json'}

# Step 1: 從 Google Sheets 取得所有帳號的 Channel Access Token
from subprocess import run as sp_run
result = sp_run(['gws', 'sheets', 'spreadsheets', 'values', 'get', '--params', json.dumps({
    "spreadsheetId": SHEETS_ID,
    "range": "LINE官方!A1:H20"
})], capture_output=True, text=True)

data = json.loads(result.stdout)
rows = data.get('values', [])

# 建立 bot_id -> token 的映射
bot_tokens = {}
for row in rows[1:]:  # skip header
    if len(row) >= 8:
        bot_id = row[5] if len(row) > 5 else ''  # F column = Bot basic ID
        token = row[7]  # H column = Channel access token
        name = row[1] if len(row) > 1 else ''
        if bot_id and token:
            bot_tokens[bot_id] = {'token': token, 'name': name}

print(f'從 Sheets 取得 {len(bot_tokens)} 個帳號的 token')

# Step 2: 用 LINE API 取得每個帳號的 destination
bot_destinations = {}
for bot_id, info in bot_tokens.items():
    resp = requests.get(
        'https://api.line.me/v2/bot/info',
        headers={'Authorization': f'Bearer {info["token"]}'}
    )
    if resp.status_code == 200:
        dest = resp.json().get('userId', '')
        bot_destinations[bot_id] = dest
        print(f'  ✅ {bot_id:15s} {info["name"]:20s} -> {dest[:20]}...')
    else:
        print(f'  ❌ {bot_id:15s} {info["name"]:20s} -> API error {resp.status_code}')
    time.sleep(0.2)

print(f'\n取得 {len(bot_destinations)} 個 destination')

# Step 3: 讀取 line_config 取得 tag -> bot_id 映射
resp = requests.get(f'{N8N_BASE}/api/v1/data-tables/1VvB8jijHE5GXbv6/rows', headers={'X-N8N-API-KEY': API_KEY})
config_rows = json.loads(resp.text).get('data', [])

tag_to_botid = {}
for r in config_rows:
    tag = r.get('tag', '') or ''
    line = r.get('line', '') or ''
    if tag and line and tag != '_default_' and tag != 'test_delete_me':
        tag_to_botid[tag] = line

print(f'\nline_config 中有 {len(tag_to_botid)} 個帳號')

# Step 4: 建立臨時 workflow
workflow = {
    'name': '上帝視角_Fix Destinations',
    'nodes': [
        {
            'id': 'webhook-1',
            'name': 'Webhook',
            'type': 'n8n-nodes-base.webhook',
            'typeVersion': 2,
            'position': [250, 300],
            'parameters': {
                'path': 'fix-dest',
                'httpMethod': 'POST',
                'responseMode': 'lastNode'
            },
            'webhookId': 'fix-dest-temp'
        },
        {
            'id': 'dt-upsert-1',
            'name': 'Upsert Destination',
            'type': 'n8n-nodes-base.dataTable',
            'typeVersion': 1,
            'position': [500, 300],
            'parameters': {
                'operation': 'upsert',
                'dataTableId': {
                    '__rl': True,
                    'value': '1VvB8jijHE5GXbv6',
                    'mode': 'id'
                },
                'matchType': 'allConditions',
                'filters': {
                    'conditions': [
                        {
                            'keyName': 'tag',
                            'keyValue': '={{ $json.body.tag }}'
                        }
                    ]
                },
                'columns': {
                    'mappingMode': 'defineBelow',
                    'value': {
                        'tag': '={{ $json.body.tag }}',
                        'destination': '={{ $json.body.destination }}'
                    },
                    'matchingColumns': [],
                    'schema': [],
                    'attemptToConvertTypes': False,
                    'convertFieldsToString': False
                }
            }
        }
    ],
    'connections': {
        'Webhook': {
            'main': [[{'node': 'Upsert Destination', 'type': 'main', 'index': 0}]]
        }
    },
    'settings': {
        'executionOrder': 'v1'
    }
}

resp = requests.post(f'{N8N_BASE}/api/v1/workflows', headers=headers, json=workflow)
result = resp.json()
wf_id = result.get('id', '')
print(f'\nWorkflow created: {wf_id}')

resp2 = requests.post(f'{N8N_BASE}/api/v1/workflows/{wf_id}/activate', headers=headers)
print(f'Activated: {resp2.status_code}')

time.sleep(2)

# Step 5: 批量更新 destination（只更新 destination，不碰 msg）
WEBHOOK_URL = 'https://godview.app.n8n.cloud/webhook/fix-dest'

success = 0
fail = 0
for tag, bot_id in tag_to_botid.items():
    dest = bot_destinations.get(bot_id, '')
    if not dest:
        print(f'  ⚠️  {tag:5s} {bot_id:15s} -> 無 destination（不在 Sheets 中）')
        continue
    
    resp = requests.post(WEBHOOK_URL, json={'tag': tag, 'destination': dest}, timeout=15)
    if resp.status_code == 200:
        success += 1
        print(f'  ✅ {tag:5s} -> {dest[:20]}...')
    else:
        fail += 1
        print(f'  ❌ {tag:5s} -> {resp.status_code}')
    time.sleep(0.3)

print(f'\n成功: {success}, 失敗: {fail}')

# Step 6: 清理
requests.post(f'{N8N_BASE}/api/v1/workflows/{wf_id}/deactivate', headers=headers)
requests.delete(f'{N8N_BASE}/api/v1/workflows/{wf_id}', headers=headers)
print('臨時 workflow 已清理')

# Step 7: 驗證
time.sleep(1)
resp = requests.get(f'{N8N_BASE}/api/v1/data-tables/1VvB8jijHE5GXbv6/rows', headers={'X-N8N-API-KEY': API_KEY})
final_rows = json.loads(resp.text).get('data', [])

print('\n=== 最終驗證 ===')
ok = 0
bad = 0
for r in final_rows:
    tag = r.get('tag', '') or ''
    dest = r.get('destination', '') or ''
    msg = r.get('msg', '') or ''
    name = r.get('name', '') or ''
    if tag in ('_default_', 'test_delete_me', ''):
        continue
    status = '✅' if dest else '❌'
    if dest:
        ok += 1
    else:
        bad += 1
    print(f'  {status} {tag:5s} {name:18s} dest={"有" if dest else "空":3s} msg={msg[:25]}')

print(f'\n✅ 有 destination: {ok}')
print(f'❌ 無 destination: {bad}')
