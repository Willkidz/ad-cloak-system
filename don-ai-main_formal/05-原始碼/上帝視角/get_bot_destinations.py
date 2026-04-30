import requests, os, json

N8N_BASE = 'https://godview.app.n8n.cloud'
API_KEY = os.environ['N8N_API_KEY']
n8n_headers = {'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json'}

# Sheets 中 9 個缺 destination 的帳號 + 它們的 Channel Access Token
accounts = [
    {'tag': 'n14', 'line': '@416nbqjl', 'name': '洪金豹', 'token': 'dYiKzP3gHEaMqHxO+hH83ggNeST5wdA9tUSifxhd/0RHJmYAJRT8AsfwS/F5HZs5I7CZa1JFTWa2AJd/7/hVvHyLJvV0ztRVXfS7qd45CwOCct0PZ9eKLzVpHPUsAdZvwDrIg3I7kE66ftYBK2sPCgdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n15', 'line': '@745jaffa', 'name': '開版歪歪熊', 'token': 'kI/1fsd7Wcz0oo5D+NxDo/tjdMh+rvCKc93fPovl5/Va4ewcjckAwgML8hmxPObIzU5+3m4YO93KDQSwmhsrOvafRRO9xSfXBz7PjQUbjnpOeHXTxbB6q4cubRQjEqMuhUyvV/IXOls0XTa6yf3+NQdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n16', 'line': '@751tggmd', 'name': '晴兒', 'token': 'xnwdQufji28FGesTzvsHYfNNJGbxJcBG6KdX/6o1iFEujxf7dmYva+64JUER1KHqt+MTpi3WhMHAPHJoPChph+GKcuNzP8YZd1wvEfoBAdNB0v4V3WRVA2hfG02bfICaAobkiQ9KImMjntohUcAW6wdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n17', 'line': '@106tndmh', 'name': '郝士多', 'token': 'TtE4VvErVtvV/OQV6IJkiIJqzCxoFXFtc/BxtnaYXO3YiMVeAD0Z7o4Swf9Uqko5zhei9LlmGhr5poovskXzgyw+QqhtxAO6klozN96w0L/vC2Qh6uM4tJDMJOfpVgX1naLTJZrVx67SyqpbamsjHAdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n18', 'line': '@013rgbjl', 'name': '電子蕭甘丹', 'token': 'gsO5fv7Wt2ufC/QrNaC0vq/0hiaoVMQL+t7Z+5eYBeNJlz9isf6snpUl39v6P2g5d11MKbidhDV7ywt7Cy3O0dL9vhtyeKhJ2xxARrWCSN5aXDL2vuN00yzQ3AIm6yUk9MXEitXSvjgivqaYwyt8owdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n19', 'line': '@536uhfpf', 'name': '開版歪熊', 'token': 'BMpbf0kwXVhfI6K7gr2kIRF0hxa7VwfBghn8k9ti8vePKcIVMlRBhokmYIrjGzlvWbP/o+MwO2UO1+NFcJ5+Wjd1QlSTuo2wc7dAojanyHd/OVgG5nLHfsU0s7XN+5rwPYsEeipfSihc2M3sDlbP/AdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n20', 'line': '@348ikfwm', 'name': '蘇主金', 'token': 'IhalgO6KC+EncElMWofdJcThr6NI9ApsIk48nfe6ldcxUbxGjgdIdiVsr7W8W+/GmgQr82xJ2cixTk5GTBlYd5XCIrkKZ7o3IixeYHH2rkLvnseqPQE+PCxlAaSJI229Vdzgfun+goch6MDhDx0oEAdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n21', 'line': '@075cocov', 'name': '武狀元', 'token': 'CuoCnfhxOyAz0O17XUgbb6PdH4BGuO2iTGyFzonZN1htWDcetna9SaYytdXhMPtN3FcT+w4Oo+IVVvWvj1uHjDZbADiMNW5jlzStw6luqnMtW0gSjP71Q/PW979azTHEJRFxPoxeCJbVMzfpuYLubAdB04t89/1O/w1cDnyilFU='},
    {'tag': 'n22', 'line': '@659jgxlp', 'name': '阿奇說球', 'token': ''},  # 不在 Sheets 中，沒有 token
]

# 也加入 Sheets 中有但 line_config 中已有 destination 的帳號，用來驗證
# 先只處理缺 destination 的

LINE_API = 'https://api.line.me/v2/bot/info'

results = []
for acc in accounts:
    tag = acc['tag']
    name = acc['name']
    token = acc['token']
    
    if not token:
        print(f"❌ {tag:5s} {name:10s} - 沒有 Channel Access Token，跳過")
        results.append({**acc, 'destination': '', 'status': 'no_token'})
        continue
    
    try:
        resp = requests.get(LINE_API, headers={'Authorization': f'Bearer {token}'}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            user_id = data.get('userId', '')
            basic_id = data.get('basicId', '')
            display_name = data.get('displayName', '')
            print(f"✅ {tag:5s} {name:10s} -> userId={user_id} basicId={basic_id} displayName={display_name}")
            results.append({**acc, 'destination': user_id, 'status': 'ok', 'basicId': basic_id})
        else:
            print(f"❌ {tag:5s} {name:10s} - HTTP {resp.status_code}: {resp.text[:100]}")
            results.append({**acc, 'destination': '', 'status': f'error_{resp.status_code}'})
    except Exception as e:
        print(f"❌ {tag:5s} {name:10s} - Exception: {e}")
        results.append({**acc, 'destination': '', 'status': 'exception'})

# 統計
ok = [r for r in results if r['status'] == 'ok']
fail = [r for r in results if r['status'] != 'ok']
print(f"\n成功取得: {len(ok)} 個")
print(f"失敗: {len(fail)} 個")

# 保存結果
with open('/home/ubuntu/bot_destinations.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("\n結果已保存到 /home/ubuntu/bot_destinations.json")
