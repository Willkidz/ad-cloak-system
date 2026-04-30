import requests
import time
import hashlib
import json

# Read targets
targets = []
with open('/home/ubuntu/test_targets.txt') as f:
    for line in f:
        parts = line.strip().split('|')
        if len(parts) == 4:
            targets.append({
                'group': parts[0],
                'code': parts[1],
                'pixel': parts[2],
                'token': parts[3],
            })

results = []

for t in targets:
    pixel = t['pixel']
    token = t['token']
    group = t['group']
    
    # Build test Lead event
    event_time = int(time.time())
    test_email = hashlib.sha256(f"test_{group}@example.com".encode()).hexdigest()
    
    payload = {
        "data": [
            {
                "event_name": "Lead",
                "event_time": event_time,
                "action_source": "website",
                "user_data": {
                    "em": [test_email],
                    "client_ip_address": "1.2.3.4",
                    "client_user_agent": "Mozilla/5.0 (CAPI Test)"
                }
            }
        ],
        "test_event_code": f"TEST_{group}"
    }
    
    url = f"https://graph.facebook.com/v25.0/{pixel}/events"
    
    try:
        resp = requests.post(
            url,
            params={"access_token": token},
            json=payload,
            timeout=15
        )
        status = resp.status_code
        body = resp.json()
        
        if status == 200 and body.get("events_received"):
            result = f"✅ OK (events_received={body['events_received']})"
        else:
            error = body.get("error", {})
            err_msg = error.get("message", json.dumps(body)[:100])
            err_code = error.get("code", "")
            result = f"❌ FAIL [{status}] code={err_code} {err_msg}"
    except Exception as e:
        result = f"❌ ERROR: {str(e)}"
    
    results.append((group, t['code'], pixel, result))
    print(f"{group} ({t['code']}): {result}")

print("\n=== Summary ===")
for group, code, pixel, result in results:
    print(f"  {group:6s} pixel={pixel:20s} {result}")
