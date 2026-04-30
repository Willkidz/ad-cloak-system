import json
import urllib.request

N8N_URL = "http://5.189.150.66:5678"
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g"
WORKFLOW_ID = "iNV4mSJjUTrUOGkw"

# Read new jsCode
with open("/home/ubuntu/build_config_code_d1.js") as f:
    new_js_code = f.read()

# Fetch current workflow
req = urllib.request.Request(
    f"{N8N_URL}/api/v1/workflows/{WORKFLOW_ID}",
    headers={"X-N8N-API-KEY": N8N_API_KEY}
)
with urllib.request.urlopen(req) as resp:
    wf = json.loads(resp.read())

# Update the Build Config node's jsCode
updated = False
for node in wf.get("nodes", []):
    if node.get("name") == "Build Config":
        old_code = node["parameters"].get("jsCode", "")
        node["parameters"]["jsCode"] = new_js_code
        updated = True
        print(f"[OK] Build Config node found and updated")
        print(f"  Old code starts with: {old_code[:80]}...")
        print(f"  New code starts with: {new_js_code[:80]}...")
        break

if not updated:
    print("[ERROR] Build Config node not found!")
    exit(1)

# PUT the updated workflow back
# Only send the fields n8n API expects
payload = {
    "name": wf["name"],
    "nodes": wf["nodes"],
    "connections": wf["connections"],
    "settings": wf.get("settings", {}),
    "staticData": wf.get("staticData"),
}

data = json.dumps(payload).encode("utf-8")
req2 = urllib.request.Request(
    f"{N8N_URL}/api/v1/workflows/{WORKFLOW_ID}",
    data=data,
    headers={
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    },
    method="PUT"
)

try:
    with urllib.request.urlopen(req2) as resp2:
        result = json.loads(resp2.read())
        print(f"[OK] Workflow updated successfully!")
        print(f"  Workflow ID: {result.get('id')}")
        print(f"  Name: {result.get('name')}")
        print(f"  Active: {result.get('active')}")
        print(f"  Updated at: {result.get('updatedAt')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"[ERROR] HTTP {e.code}: {body}")
