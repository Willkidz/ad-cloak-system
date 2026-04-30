#!/usr/bin/env python3
import json, subprocess, csv, sys

N8N_URL = "http://5.189.150.66:5678"
EMAIL = "admin@bexnua.store"
PASSWORD = "ShadowCloak2026!"

def curl(method, path, data=None, headers=None, cookie=None):
    cmd = ["curl", "-s", "-X", method, f"{N8N_URL}{path}"]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if cookie:
        cmd += ["-H", f"Cookie: {cookie}"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    try:
        return json.loads(result.stdout)
    except:
        return {"raw": result.stdout, "stderr": result.stderr}

# Step 1: Login
print("=== Step 1: Login ===")
resp = curl("POST", "/rest/login", {"email": EMAIL, "password": PASSWORD})
print(json.dumps(resp, indent=2, ensure_ascii=False)[:500])

# Try to get cookie from response
login_cmd = ["curl", "-s", "-c", "/tmp/n8n_cookies.txt", "-X", "POST",
             f"{N8N_URL}/rest/login",
             "-H", "Content-Type: application/json",
             "-d", json.dumps({"email": EMAIL, "password": PASSWORD})]
result = subprocess.run(login_cmd, capture_output=True, text=True, timeout=30)
print("Login response:", result.stdout[:300])

# Step 2: Generate API Key
print("\n=== Step 2: Generate API Key ===")
api_key_cmd = ["curl", "-s", "-b", "/tmp/n8n_cookies.txt",
               "-X", "POST", f"{N8N_URL}/rest/user/api-key",
               "-H", "Content-Type: application/json",
               "-d", json.dumps({"label": "datatables-key"})]
result = subprocess.run(api_key_cmd, capture_output=True, text=True, timeout=30)
print("API Key response:", result.stdout[:500])
try:
    api_key_data = json.loads(result.stdout)
    api_key = api_key_data.get("apiKey") or api_key_data.get("data", {}).get("apiKey", "")
    print(f"API Key: {api_key}")
except:
    api_key = ""
    print("Failed to parse API key")

# Step 3: List existing DataTables
print("\n=== Step 3: List DataTables ===")
list_cmd = ["curl", "-s", "-b", "/tmp/n8n_cookies.txt",
            f"{N8N_URL}/rest/data-tables"]
result = subprocess.run(list_cmd, capture_output=True, text=True, timeout=30)
print("DataTables list:", result.stdout[:500])

# Step 4: Create ad_config DataTable
print("\n=== Step 4: Create ad_config DataTable ===")
create_cmd = ["curl", "-s", "-b", "/tmp/n8n_cookies.txt",
              "-X", "POST", f"{N8N_URL}/rest/data-tables",
              "-H", "Content-Type: application/json",
              "-d", json.dumps({
                  "name": "ad_config",
                  "columns": [
                      {"name": "name", "type": "string"},
                      {"name": "lineid", "type": "string"},
                      {"name": "code", "type": "string"},
                      {"name": "pixel", "type": "string"},
                      {"name": "token", "type": "string"},
                      {"name": "type", "type": "string"},
                      {"name": "createdAt", "type": "string"},
                      {"name": "updatedAt", "type": "string"}
                  ]
              })]
result = subprocess.run(create_cmd, capture_output=True, text=True, timeout=30)
print("Create ad_config:", result.stdout[:500])
try:
    ad_config_id = json.loads(result.stdout).get("id", "")
    print(f"ad_config ID: {ad_config_id}")
except:
    ad_config_id = ""

# Step 5: Create line_config DataTable
print("\n=== Step 5: Create line_config DataTable ===")
create_cmd2 = ["curl", "-s", "-b", "/tmp/n8n_cookies.txt",
               "-X", "POST", f"{N8N_URL}/rest/data-tables",
               "-H", "Content-Type: application/json",
               "-d", json.dumps({
                   "name": "line_config",
                   "columns": [
                       {"name": "tag", "type": "string"},
                       {"name": "line", "type": "string"},
                       {"name": "name", "type": "string"},
                       {"name": "who", "type": "string"},
                       {"name": "msg", "type": "string"},
                       {"name": "destination", "type": "string"},
                       {"name": "createdAt", "type": "string"},
                       {"name": "updatedAt", "type": "string"}
                   ]
               })]
result = subprocess.run(create_cmd2, capture_output=True, text=True, timeout=30)
print("Create line_config:", result.stdout[:500])
try:
    line_config_id = json.loads(result.stdout).get("id", "")
    print(f"line_config ID: {line_config_id}")
except:
    line_config_id = ""

print(f"\n=== Summary ===")
print(f"ad_config ID: {ad_config_id}")
print(f"line_config ID: {line_config_id}")
print(f"API Key: {api_key}")
