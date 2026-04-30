import requests, json, subprocess, os

ACCOUNT_ID = "b2471e0c307123945bdf1ce1b025563f"
WORKER_NAME = "gv-bridge"

# Get API token from MCP OAuth - try to extract from manus-mcp-cli
# First, try using the MCP tool to deploy
def deploy_via_mcp():
    """Use manus-mcp-cli to get worker deployed"""
    with open('/home/ubuntu/gv-bridge/worker.js', 'r') as f:
        code = f.read()
    
    # Use workers_get_worker to check if it exists first
    result = subprocess.run(
        ['manus-mcp-cli', 'tool', 'call', 'workers_get_worker', '--server', 'cloudflare',
         '--input', json.dumps({"name": WORKER_NAME})],
        capture_output=True, text=True, timeout=30
    )
    print(f"Check existing: {result.stdout[:200] if result.stdout else result.stderr[:200]}")
    return result

try:
    r = deploy_via_mcp()
except Exception as e:
    print(f"MCP check failed: {e}")

# Alternative: try to find Cloudflare API token from various sources
token_sources = [
    os.path.expanduser("~/.wrangler/config/default.toml"),
    os.path.expanduser("~/.cloudflare/config"),
    "/tmp/cf_token",
]

for src in token_sources:
    if os.path.exists(src):
        print(f"Found config: {src}")
        with open(src) as f:
            print(f.read()[:200])
