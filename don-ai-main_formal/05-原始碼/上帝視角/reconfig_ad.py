import json
import requests

N8N_URL = "https://godview.app.n8n.cloud"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjZlNTQ0NWEtNDNjMC00MWNmLWE5NzgtNmVlN2E0MTY2ODQ5IiwiaWF0IjoxNzczNTE3MDA5fQ.QgZXNh6Xt38Yt2btL-oWARK7wtD_5JDu_Dr395DxTpg"
HEADERS = {"X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json"}

AD_TABLE_ID = "vILi9V1mv3ouo6EM"

# LINE DataTable 的 tag -> line_id, line_name 對照
LINE_INFO = {
    "bf": ("@678eohsd", "博富 BOFU"),
    "jd": ("@520ufhmw", "兩斤炭吉"),
    "cx": ("@697jsdma", "獨角仙AI算牌系統"),
    "jx": ("@652ahjmy", "獨角仙AI算牌程式"),
    "lx": ("@128hxyvp", "獨角仙AI預測程式"),
    "mx": ("@525euwsy", "獨角仙AI預測系統"),
    "cs": ("@999hqlmk", "爆分王-電子訊號程式"),
    "js": ("@935bicyi", "爆分王-電子打法秘笈"),
    "ls": ("@849rldxt", "爆分王-24H訊號打法"),
    "ms": ("@001qlmgf", "爆分王-電子打法訊號"),
    "cb": ("@181pgtlc", "莊家剋星-百家殺手"),
    "jb": ("@448nzdkf", "莊家剋星-百家專家"),
    "lb": ("@bn58", "莊家剋星-百家GPT"),
    "mb": ("@734xzzse", "莊家剋星-百家打莊姬"),
    "n14": ("@416nbqjl", "洪金豹"),
    "n18": ("@013rgbjl", "電子蕭甘丹"),
    "n20": ("@348ikfwm", "蘇主金"),
    "n22": ("@659jgxlp", "阿奇說球"),
    "sz": ("", ""),  # sz 沒有在 LINE DataTable 中
}

# Step 1: 先新增 line_id 和 line_name 兩個欄位到 ad_config DataTable
print("=== Step 1: 新增欄位 line_id, line_name ===")

# 嘗試用 n8n API 新增欄位
for col_name in ["line_id", "line_name"]:
    resp = requests.post(
        f"{N8N_URL}/api/v1/data-tables/{AD_TABLE_ID}/columns",
        headers=HEADERS,
        json={"name": col_name, "dataType": "string"}
    )
    print(f"  新增 {col_name}: {resp.status_code} {resp.text[:100]}")

# Step 2: 更新現有的 19 筆 master 資料，加上 line_id 和 line_name
print("\n=== Step 2: 更新現有 master 資料加上 line_id, line_name ===")

# 取得現有資料
resp = requests.get(
    f"{N8N_URL}/api/v1/data-tables/{AD_TABLE_ID}/rows?limit=200",
    headers=HEADERS
)
rows = resp.json().get('data', [])
print(f"  取得 {len(rows)} 筆資料")

for row in rows:
    row_id = row.get('id')
    code = row.get('code', '')
    if code in LINE_INFO:
        line_id, line_name = LINE_INFO[code]
        resp = requests.patch(
            f"{N8N_URL}/api/v1/data-tables/{AD_TABLE_ID}/rows/{row_id}",
            headers=HEADERS,
            json={"line_id": line_id, "line_name": line_name}
        )
        print(f"  更新 {code} (id={row_id}): line_id={line_id}, line_name={line_name} -> {resp.status_code}")
    else:
        print(f"  跳過 {code} (id={row_id}): 無 LINE 資訊")

# Step 3: 新增 BC 像素 (type=bc)
print("\n=== Step 3: 新增 BC 像素 (type=bc) ===")
bc_pixel_data = {
    "type": "bc",
    "code": "all",
    "pixel": "783186198187359",
    "token": "EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD",
    "line_id": "",
    "line_name": "BC統一像素"
}

resp = requests.post(
    f"{N8N_URL}/api/v1/data-tables/{AD_TABLE_ID}/rows",
    headers=HEADERS,
    json=bc_pixel_data
)
print(f"  新增 BC 像素: {resp.status_code} {resp.text[:200]}")

# Step 4: 驗證
print("\n=== Step 4: 驗證 ===")
resp = requests.get(
    f"{N8N_URL}/api/v1/data-tables/{AD_TABLE_ID}/rows?limit=200",
    headers=HEADERS
)
rows = resp.json().get('data', [])
print(f"  共 {len(rows)} 筆資料")
for r in rows:
    line_id = r.get('line_id', '')
    line_name = r.get('line_name', '')
    print(f"  type={r.get('type','')} | code={r.get('code','')} | pixel={r.get('pixel','')} | line_id={line_id} | line_name={line_name}")
