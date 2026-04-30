import json
import subprocess
import re
from collections import defaultdict

with open('/tmp/link_gen.json') as f:
    data = json.load(f)
rows = data.get('values', [])

# 正確的 TAG → LINE ID 對應
correct_mapping = {
    'cx': '@697jsdma', 'jx': '@652ahjmy', 'lx': '@128hxyvp', 'mx': '@525euwsy',
    'cs': '@999hqlmk', 'js': '@935bicyi', 'ls': '@849rldxt', 'ms': '@001qlmgf',
    'bf': '@678eohsd',
    'cb': '@bn56', 'jb': '@448nzdkf', 'lb': '@bn58', 'mb': '@734xzzse',
    'jd': '@520ufhmw',
    'n14': '@416nbqjl', 'n15': '@745jaffa', 'n16': '@751tggmd', 'n17': '@106tndmh',
    'n18': '@013rgbjl', 'n19': '@536uhfpf', 'n20': '@348ikfwm', 'n21': '@075cocov',
    'n22': '@659jgxlp',
}

# 每個TAG前綴只測第一個就好（同前綴Worker邏輯一樣）
tested_tags = set()
results = []

for r in rows[1:]:
    tag = r[3] if len(r) > 3 else ''
    code = r[4] if len(r) > 4 else ''
    link = r[5] if len(r) > 5 else ''
    line_id = r[1] if len(r) > 1 else ''
    
    if tag in tested_tags:
        continue
    tested_tags.add(tag)
    
    expected_line_id = correct_mapping.get(tag, '')
    
    try:
        result = subprocess.run(
            ['curl', '-sI', '--max-time', '5', '-L', '--max-redirs', '3', link],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout
        
        # 找所有 Location headers
        locations = re.findall(r'(?i)^location:\s*(.+)$', output, re.MULTILINE)
        
        # 找最終跳轉的LINE URL
        line_url = ''
        actual_line_id = ''
        for loc in locations:
            loc = loc.strip()
            if 'line.me' in loc or 'lin.ee' in loc:
                line_url = loc
                # 提取 LINE ID from URL like https://line.me/R/ti/p/@xxxxx
                m = re.search(r'@[\w]+', loc)
                if m:
                    actual_line_id = m.group(0)
        
        if actual_line_id:
            match = actual_line_id == expected_line_id
            status = '✅' if match else '❌'
            results.append({
                'tag': tag, 'code': code, 'expected': expected_line_id,
                'actual': actual_line_id, 'status': status, 'line_url': line_url
            })
            print(f"{status} {tag} ({code}): expected={expected_line_id}, actual={actual_line_id}")
        else:
            # 沒找到LINE跳轉，可能是landing page
            # 檢查第一個location
            first_loc = locations[0].strip() if locations else 'NO REDIRECT'
            results.append({
                'tag': tag, 'code': code, 'expected': expected_line_id,
                'actual': 'N/A', 'status': '⚠️', 'line_url': first_loc
            })
            print(f"⚠️ {tag} ({code}): 無直接LINE跳轉, first_redirect={first_loc}")
            
    except Exception as e:
        results.append({
            'tag': tag, 'code': code, 'expected': expected_line_id,
            'actual': 'ERROR', 'status': '❌', 'line_url': str(e)
        })
        print(f"❌ {tag} ({code}): ERROR - {e}")

print(f"\n=== 總結 ===")
ok = sum(1 for r in results if r['status'] == '✅')
warn = sum(1 for r in results if r['status'] == '⚠️')
fail = sum(1 for r in results if r['status'] == '❌')
print(f"✅ 正確: {ok}")
print(f"⚠️ 需確認: {warn}")
print(f"❌ 錯誤: {fail}")

with open('/tmp/test_results.json', 'w') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
