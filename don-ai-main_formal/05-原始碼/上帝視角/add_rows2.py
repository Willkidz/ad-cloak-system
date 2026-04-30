import subprocess, json, time

N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjZlNTQ0NWEtNDNjMC00MWNmLWE5NzgtNmVlN2E0MTY2ODQ5IiwiaWF0IjoxNzczNTE3MDA5fQ.QgZXNh6Xt38Yt2btL-oWARK7wtD_5JDu_Dr395DxTpg"
AD_TABLE = "vILi9V1mv3ouo6EM"
URL = f"https://godview.app.n8n.cloud/api/v1/data-tables/{AD_TABLE}/rows"

# 已有 + 剛建的
existing = {'JS01','MS01','LS01','CS01','JS03','MS03','LS03','CS03',
            'JS04','MS04','LS04','CS04','JS05','MS05','LS05','CS05',
            'JS06','MS06','LS06','CS06','AS01','AS02',
            'BF01','BF02','BF03','BF04','BF05','BF06',
            'bf','jd','n20','cs','js','ls','ms','cb','jb','lb','mb',
            'cx','jx','lx','mx','n18','n14','n22'}

to_add = []

# AS03-AS10 (group)
for i in range(3, 11):
    code = f"AS{i:02d}"
    if code not in existing:
        to_add.append({"code": code, "pixel": "", "token": "", "type": "group"})

# JS/CS/MS/LS 02, 07-10 (ad)
for prefix in ['JS', 'CS', 'MS', 'LS']:
    for i in [2] + list(range(7, 11)):
        code = f"{prefix}{i:02d}"
        if code not in existing:
            to_add.append({"code": code, "pixel": "", "token": "", "type": "ad"})

print(f"To add: {len(to_add)} rows")

# 批量新增 - 每次最多 10 筆
batch_size = 10
success = 0
fail = 0

for i in range(0, len(to_add), batch_size):
    batch = to_add[i:i+batch_size]
    codes = [r['code'] for r in batch]
    payload = json.dumps({"data": batch})
    
    result = subprocess.run(
        ["curl", "-s", "--max-time", "15", "-X", "POST", URL,
         "-H", f"X-N8N-API-KEY: {N8N_KEY}",
         "-H", "Content-Type: application/json",
         "-d", payload],
        capture_output=True, text=True, timeout=20
    )
    resp = result.stdout.strip()
    if "success" in resp and "true" in resp:
        success += len(batch)
        print(f"  ✓ batch {codes}")
    else:
        fail += len(batch)
        print(f"  ✗ batch {codes}: {resp[:100]}")
    time.sleep(1)

print(f"\nDone: {success} success, {fail} fail")
