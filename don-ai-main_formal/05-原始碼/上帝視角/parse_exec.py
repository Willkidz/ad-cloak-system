import json

# Workflow ID to name mapping
wf_map = {
    "Mydz6vj7T7dw5Ugj": "DNS Auto-Sync",
    "UCRZ0YDp4ZERmgqk": "Config API",
    "VUMAiZXjG826mUDd": "上帝視角_Admin API",
    "ZVKJokmqh3GUbZio": "上帝視角_CAPI Health Check",
    "biEtJWKGcnmqYjgW": "上帝視角_Time Attribution",
    "m5Pd6Sx29uE3W0ty": "系統監控",
    "wYZTQNjOot8qZZ8I": "上帝視角_Sheets Report",
    "xlsrmuNYqV88VJSu": "每日統計報告",
    "aOCq55FbKzCXA8C9": "Token Mapping Standalone",
}

with open('/home/ubuntu/n8n_executions.json') as f:
    data = json.load(f)

execs = data.get('data', [])
print(f'最近 {len(execs)} 筆執行紀錄\n')

status_map = {'success': '✅ 成功', 'error': '❌ 失敗', 'running': '🔄 執行中', 'waiting': '⏳ 等待中'}

for e in execs:
    eid = str(e.get('id',''))
    wid = e.get('workflowId','')
    wname = wf_map.get(wid, wid)
    status = status_map.get(e.get('status',''), e.get('status',''))
    finished = (e.get('stoppedAt') or e.get('startedAt') or '')[:19]
    mode = e.get('mode','')
    print(f"#{eid}  {wname}  {status}  {finished}  ({mode})")
