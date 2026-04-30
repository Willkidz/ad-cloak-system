#!/usr/bin/env python3
"""Fix all N8N workflows: replace old Cloudflare token + activate Sheets Report"""
import json, requests, sys

API = "https://n8n.bexnua.store/api/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g"
HEADERS = {"X-N8N-API-KEY": KEY, "Content-Type": "application/json"}

OLD_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
NEW_TOKEN = "cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920"

SHEETS_ID = "Jbca1gwN6pGDnjhJ"

# Step 1: Get all workflows
print("=== Step 1: Listing all workflows ===")
r = requests.get(f"{API}/workflows", headers=HEADERS, timeout=15)
if r.status_code != 200:
    print(f"ERROR: Failed to list workflows: {r.status_code} {r.text[:500]}")
    sys.exit(1)

workflows = r.json()["data"]
print(f"Found {len(workflows)} workflows\n")

# Step 2: Find workflows with old token
updated_count = 0
for wf in workflows:
    wf_id = wf["id"]
    wf_name = wf["name"]
    wf_json = json.dumps(wf)
    
    if OLD_TOKEN not in wf_json:
        continue
    
    count = wf_json.count(OLD_TOKEN)
    print(f"--- Found {count}x old token in: {wf_name} ({wf_id}) ---")
    
    # Replace old token with new token in all nodes
    for node in wf.get("nodes", []):
        node_json = json.dumps(node)
        if OLD_TOKEN in node_json:
            node_str = json.dumps(node)
            node_str = node_str.replace(OLD_TOKEN, NEW_TOKEN)
            updated_node = json.loads(node_str)
            idx = wf["nodes"].index(node)
            wf["nodes"][idx] = updated_node
            print(f"  Updated node: {node.get('name', 'unknown')}")
    
    # PUT update - try with name, nodes, connections, settings
    payload = {
        "name": wf_name,
        "nodes": wf["nodes"],
        "connections": wf.get("connections", {}),
        "settings": wf.get("settings", {}),
    }
    
    r2 = requests.put(f"{API}/workflows/{wf_id}", headers=HEADERS, json=payload, timeout=15)
    if r2.status_code == 200:
        print(f"  ✅ Updated successfully!")
        updated_count += 1
    else:
        print(f"  ❌ PUT failed ({r2.status_code}): {r2.text[:300]}")
        # Try PATCH with just nodes
        print(f"  Trying PATCH...")
        r3 = requests.patch(f"{API}/workflows/{wf_id}", headers=HEADERS, json={"nodes": wf["nodes"]}, timeout=15)
        if r3.status_code == 200:
            print(f"  ✅ PATCH succeeded!")
            updated_count += 1
        else:
            print(f"  ❌ PATCH also failed ({r3.status_code}): {r3.text[:300]}")
    print()

# Step 3: Activate Sheets Report
print("=== Step 3: Activating Sheets Report ===")
r4 = requests.patch(f"{API}/workflows/{SHEETS_ID}", headers=HEADERS, json={"active": True}, timeout=15)
if r4.status_code == 200:
    active_status = r4.json().get("active", "unknown")
    print(f"✅ Sheets Report active={active_status}")
else:
    # Try POST activate endpoint
    r5 = requests.post(f"{API}/workflows/{SHEETS_ID}/activate", headers=HEADERS, timeout=15)
    if r5.status_code == 200:
        print(f"✅ Sheets Report activated via POST")
    else:
        print(f"❌ Failed to activate: PATCH={r4.status_code}, POST={r5.status_code}")
        print(f"  PATCH response: {r4.text[:300]}")

# Step 4: Verify
print(f"\n=== Summary ===")
print(f"Workflows with old token updated: {updated_count}")
print(f"Sheets Report activation attempted")

# Verify old token is gone
r6 = requests.get(f"{API}/workflows", headers=HEADERS, timeout=15)
remaining = json.dumps(r6.json()).count(OLD_TOKEN)
print(f"Remaining old tokens in all workflows: {remaining}")
