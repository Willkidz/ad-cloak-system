import json

with open('/tmp/daily_report_wf.json') as f:
    data = json.load(f)

nodes = data.get('nodes', [])
print(f'Workflow: {data.get("name","")}')
print(f'Active: {data.get("active","")}')
print(f'Nodes count: {len(nodes)}')
print()

for n in nodes:
    name = n.get('name','')
    ntype = n.get('type','')
    print(f'=== {name} ({ntype}) ===')
    params = n.get('parameters',{})
    
    if 'jsCode' in params:
        print('JS Code:')
        print(params['jsCode'][:4000])
    elif ntype == 'n8n-nodes-base.httpRequest':
        print(f'URL: {params.get("url","")}')
        print(f'Method: {params.get("method","GET")}')
        if 'sendBody' in params:
            print(f'sendBody: {params["sendBody"]}')
        if 'specifyBody' in params:
            print(f'specifyBody: {params["specifyBody"]}')
        if 'jsonBody' in params:
            print(f'jsonBody: {str(params["jsonBody"])[:2000]}')
        if 'bodyParameters' in params:
            print(f'bodyParameters: {json.dumps(params["bodyParameters"], indent=2)[:1000]}')
        if 'headerParameters' in params:
            print(f'headerParameters: {json.dumps(params["headerParameters"], indent=2)[:1000]}')
    elif ntype == '@n8n/n8n-nodes-langchain.lmChatOpenAi' or 'openai' in ntype.lower():
        for k,v in params.items():
            print(f'  {k}: {str(v)[:500]}')
    elif 'chatId' in params or ntype == 'n8n-nodes-base.telegram':
        print(f'chatId: {params.get("chatId","")}')
        print(f'text: {str(params.get("text",""))[:2000]}')
        if 'additionalFields' in params:
            print(f'additionalFields: {json.dumps(params.get("additionalFields",{}), indent=2)[:1000]}')
    else:
        for k,v in params.items():
            val_str = str(v)
            if len(val_str) > 500:
                val_str = val_str[:500] + '...'
            print(f'  {k}: {val_str}')
    print()

# Also check connections
connections = data.get('connections', {})
print('\n=== CONNECTIONS ===')
for src, conns in connections.items():
    for conn_type, targets in conns.items():
        for target_list in targets:
            for t in target_list:
                print(f'{src} -> {t.get("node","")} (type: {conn_type})')
