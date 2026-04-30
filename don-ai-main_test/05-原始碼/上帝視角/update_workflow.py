import json, requests, os

N8N_URL = os.environ['N8N_INSTANCE_URL'].rstrip('/')
N8N_KEY = os.environ['N8N_API_KEY']

with open('/home/ubuntu/workflow_time_attr.json') as f:
    wf = json.load(f)

for node in wf['nodes']:
    # 1. Query Recent Clicks: 加 ip_city, ip_region_code, ip_postal_code, ip_country 到 SELECT
    if node['name'] == 'Query Recent Clicks':
        old_sql = "SELECT click_id, timestamp, tag, ad_code, line_oa_id, destination, ip_address, user_agent, accept_language, ip_country, ip_asn, fbclid, fbc, fbp, pixel_id, capi_token, pixels FROM clicks"
        new_sql = "SELECT click_id, timestamp, tag, ad_code, line_oa_id, destination, ip_address, user_agent, accept_language, ip_country, ip_asn, ip_city, ip_region_code, ip_postal_code, fbclid, fbc, fbp, pixel_id, capi_token, pixels FROM clicks"
        body = node['parameters'].get('jsonBody', '')
        if old_sql in body:
            node['parameters']['jsonBody'] = body.replace(old_sql, new_sql)
            print(f"[OK] Query Recent Clicks: added geo columns to SELECT")
        else:
            print(f"[WARN] Query Recent Clicks: SQL pattern not found, manual check needed")
            print(f"  Current: {body[:200]}")

    # 2. Fingerprint Match: 加 ip_city, ip_region_code, ip_postal_code, ip_country 到 return
    if node['name'] == 'Fingerprint Match':
        code = node['parameters']['jsCode']
        old_return = """  ip_address: match.ip_address,
  user_agent: match.user_agent,
  click_timestamp: match.timestamp,
  follow_timestamp: followData.follow_timestamp"""
        new_return = """  ip_address: match.ip_address,
  user_agent: match.user_agent,
  ip_city: match.ip_city || '',
  ip_region_code: match.ip_region_code || '',
  ip_postal_code: match.ip_postal_code || '',
  ip_country: match.ip_country || '',
  click_timestamp: match.timestamp,
  follow_timestamp: followData.follow_timestamp"""
        if old_return in code:
            node['parameters']['jsCode'] = code.replace(old_return, new_return)
            print(f"[OK] Fingerprint Match: added geo fields to return")
        else:
            print(f"[WARN] Fingerprint Match: return pattern not found")

    # 3. Prepare CAPI Events: 加 ct, st, zp, country 到 user_data
    if node['name'] == 'Prepare CAPI Events':
        code = node['parameters']['jsCode']
        old_user_data = """      user_data: {
        client_ip_address: matchData.ip_address || undefined,
        client_user_agent: matchData.user_agent || undefined,
        fbc: matchData.fbc || undefined,
        fbp: matchData.fbp || undefined,
        external_id: matchData.line_user_id ? [require('crypto').createHash('sha256').update(matchData.line_user_id).digest('hex')] : undefined
      }"""
        new_user_data = """      user_data: {
        client_ip_address: matchData.ip_address || undefined,
        client_user_agent: matchData.user_agent || undefined,
        fbc: matchData.fbc || undefined,
        fbp: matchData.fbp || undefined,
        external_id: matchData.line_user_id ? [require('crypto').createHash('sha256').update(matchData.line_user_id).digest('hex')] : undefined,
        ct: matchData.ip_city ? [require('crypto').createHash('sha256').update(matchData.ip_city.toLowerCase().trim()).digest('hex')] : undefined,
        st: matchData.ip_region_code ? [require('crypto').createHash('sha256').update(matchData.ip_region_code.toLowerCase().trim()).digest('hex')] : undefined,
        zp: matchData.ip_postal_code ? [require('crypto').createHash('sha256').update(matchData.ip_postal_code.toLowerCase().trim()).digest('hex')] : undefined,
        country: matchData.ip_country ? [require('crypto').createHash('sha256').update(matchData.ip_country.toLowerCase().trim()).digest('hex')] : undefined
      }"""
        if old_user_data in code:
            node['parameters']['jsCode'] = code.replace(old_user_data, new_user_data)
            print(f"[OK] Prepare CAPI Events: added ct/st/zp/country to user_data")
        else:
            print(f"[WARN] Prepare CAPI Events: user_data pattern not found")

# Update workflow via API
headers = {
    'X-N8N-API-KEY': N8N_KEY,
    'Content-Type': 'application/json'
}

# Only send nodes and connections
payload = {
    'name': wf['name'],
    'nodes': wf['nodes'],
    'connections': wf['connections'],
    'settings': wf.get('settings', {})
}

resp = requests.put(
    f"{N8N_URL}/api/v1/workflows/biEtJWKGcnmqYjgW",
    headers=headers,
    json=payload
)

print(f"\nAPI Status: {resp.status_code}")
d = resp.json()
if 'id' in d:
    print(f"Workflow updated successfully: {d['id']}")
else:
    print(f"Error: {json.dumps(d, indent=2)[:500]}")
