import json

with open('/tmp/capi_wf.json') as f:
    data = json.load(f)

nodes = data.get('nodes', [])
print(f'Workflow: {data.get("name","")}')
print(f'Nodes: {len(nodes)}')
for n in nodes:
    name = n.get('name','')
    ntype = n.get('type','')
    print(f'  - {name} ({ntype})')
print()

for n in nodes:
    if n.get('type') == 'n8n-nodes-base.code':
        params = n.get('parameters',{})
        code = params.get('jsCode','')
        print(f'=== {n.get("name","")} ===')
        print(code[:5000])
        print()
