import requests, time, random

BC_PIXEL = "783186198187359"
TOKEN = "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD"
URL = f"https://graph.facebook.com/v25.0/{BC_PIXEL}/events"

event_names = [
    "AS_PageView", "AS_Purchase", "AS_Lead", "AS_Contact",
    "AB_PageView", "AB_Purchase", "AB_Lead", "AB_Contact",
    "AX_PageView", "AX_Purchase", "AX_Lead", "AX_Contact",
    "BF_PageView", "BF_Purchase", "BF_Lead", "BF_Contact",
    "N20_PageView", "N20_Lead",
    "ALL_PageView", "ALL_Purchase", "ALL_Lead", "ALL_Contact",
]

uas = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
]

now = int(time.time())
events = []
for name in event_names:
    for i in range(10):
        events.append({
            "event_name": name,
            "event_time": now - random.randint(0, 3600),
            "action_source": "website",
            "user_data": {
                "client_ip_address": f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
                "client_user_agent": random.choice(uas)
            }
        })

# 每次最多 1000 筆，分批發
batch_size = 100
total_received = 0
for i in range(0, len(events), batch_size):
    batch = events[i:i+batch_size]
    resp = requests.post(URL, json={"data": batch, "access_token": TOKEN}, timeout=15)
    r = resp.json()
    received = r.get("events_received", 0)
    total_received += received
    print(f"Batch {i//batch_size+1}: sent {len(batch)}, received {received}")
    if r.get("error"):
        print(f"  ERROR: {r['error']}")

print(f"\nTotal: {total_received}/{len(events)} events received")
