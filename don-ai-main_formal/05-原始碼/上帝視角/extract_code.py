import json

with open('/tmp/daily_report_wf.json') as f:
    data = json.load(f)

nodes = data.get('nodes', [])
for n in nodes:
    if n.get('name') == 'LINE Insight + 歸因率':
        params = n.get('parameters', {})
        code = params.get('jsCode', '')
        with open('/tmp/line_insight_full.js', 'w') as out:
            out.write(code)
        print(f"Written {len(code)} chars to /tmp/line_insight_full.js")

# Also get the Schedule Trigger details
for n in nodes:
    if n.get('name') == 'Schedule Trigger':
        params = n.get('parameters', {})
        print(f"\nSchedule Trigger params: {json.dumps(params, indent=2)}")
