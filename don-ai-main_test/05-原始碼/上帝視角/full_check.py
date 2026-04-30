import requests, json, time, urllib.parse

# Load config
with open('/tmp/config.json') as f:
    config = json.load(f)

LINE_MAP = config.get('LINE_MAP', {})
AD_MAP = config.get('AD_MAP', {})
MASTER_PIXEL_MAP = config.get('MASTER_PIXEL_MAP', {})
DEFAULT_MSG = config.get('DEFAULT_MSG', '')

# Build all URLs to test
# Format: tag.freshpathlab.com/?a=AD_CODE
# We need to test:
# 1. All ad codes (AS01 series: JS01/MS01/LS01/CS01, AS03, AS04, AS06, BF01)
# 2. All master tags (bf, jd, n20, cs, js, ls, ms, cb, etc.)

# Active ad campaigns
ad_codes = {
    'AS01': ['JS01', 'MS01', 'LS01', 'CS01'],
    'AS03': ['JS03', 'MS03', 'LS03', 'CS03'],
    'AS04': ['JS04', 'MS04', 'LS04', 'CS04'],
    'AS06': ['JS06', 'MS06', 'LS06', 'CS06'],
    'BF01': ['BF01'],
}

# Map ad code to tag (subdomain)
ad_to_tag = {}
for code in ['JS01','JS03','JS04','JS06']: ad_to_tag[code] = 'js'
for code in ['MS01','MS03','MS04','MS06']: ad_to_tag[code] = 'ms'
for code in ['LS01','LS03','LS04','LS06']: ad_to_tag[code] = 'ls'
for code in ['CS01','CS03','CS04','CS06']: ad_to_tag[code] = 'cs'
ad_to_tag['BF01'] = 'bf'

results = []

print("=" * 80)
print("全面檢查報告")
print("=" * 80)

# 1. Check all LINE_MAP tags - redirect & message format
print("\n【1】LINE_MAP 標籤跳轉檢查")
print("-" * 60)
for tag, info in sorted(LINE_MAP.items()):
    line_id = info if isinstance(info, str) else info.get('line', '')
    name = '-' if isinstance(info, str) else info.get('name', '-')
    
    # Check if tag has a valid LINE ID
    has_line = bool(line_id and line_id.startswith('@'))
    
    # Check master pixel
    master = MASTER_PIXEL_MAP.get(tag, {})
    has_master_pixel = bool(master and master.get('pixel'))
    
    status = "✅" if has_line else "❌"
    pixel_status = "✅" if has_master_pixel else "⚠️ 無主像素"
    
    print(f"  {status} {tag:6s} → {line_id:12s} ({name:20s}) | 主像素: {pixel_status}")
    
    results.append({
        'type': 'tag',
        'tag': tag,
        'line_id': line_id,
        'name': name,
        'has_line': has_line,
        'has_master_pixel': has_master_pixel,
    })

# 2. Check all ad codes - pixel config
print("\n【2】廣告代碼像素設定檢查")
print("-" * 60)
for group, codes in sorted(ad_codes.items()):
    print(f"\n  {group}:")
    for code in codes:
        ad_info = AD_MAP.get(code, {})
        pixels = ad_info.get('pixels', []) if ad_info else []
        has_ad_pixel = len(pixels) > 0 and any(p.get('pixel') for p in pixels)
        has_ad_token = len(pixels) > 0 and any(p.get('token') for p in pixels)
        
        tag = ad_to_tag.get(code, code.lower())
        master = MASTER_PIXEL_MAP.get(tag, {})
        has_master = bool(master and master.get('pixel'))
        
        pixel_str = pixels[0].get('pixel','') if pixels else 'N/A'
        token_str = "✅" if has_ad_token else "❌ 無權杖"
        
        status = "✅" if (has_ad_pixel and has_ad_token) else "❌"
        print(f"    {status} {code:6s} | 廣告像素: {pixel_str:20s} | 權杖: {token_str} | 主像素: {'✅' if has_master else '❌'}")

# 3. Check message format
print("\n【3】訊息規格檢查")
print("-" * 60)
print(f"  預設訊息模板: {DEFAULT_MSG}")
has_token_placeholder = '#{token}' in DEFAULT_MSG or '{token}' in DEFAULT_MSG
print(f"  Token 佔位符: {'✅ 正常' if has_token_placeholder else '❌ 缺少 token 佔位符'}")

# Check individual tag messages
for tag, info in sorted(LINE_MAP.items()):
    if isinstance(info, dict) and info.get('msg'):
        msg = info['msg']
        has_tok = '#{token}' in msg or '{token}' in msg
        status = "✅" if has_tok else "❌"
        print(f"  {status} {tag}: {msg}")

# 4. Check CAPI token validity for all unique pixel+token pairs
print("\n【4】CAPI 權杖有效性檢查")
print("-" * 60)

# Collect all unique pixel+token pairs
checked = set()
capi_results = []

# From AD_MAP
for code, info in AD_MAP.items():
    if not info: continue
    pixels = info.get('pixels', [])
    for p in pixels:
        pixel = p.get('pixel', '')
        token = p.get('token', '')
        if pixel and token and (pixel, token) not in checked:
            checked.add((pixel, token))
            capi_results.append({'source': f'廣告({code})', 'pixel': pixel, 'token': token})

# From MASTER_PIXEL_MAP
for tag, info in MASTER_PIXEL_MAP.items():
    pixel = info.get('pixel', '')
    token = info.get('token', '')
    if pixel and token and (pixel, token) not in checked:
        checked.add((pixel, token))
        capi_results.append({'source': f'主像素({tag})', 'pixel': pixel, 'token': token})

import hashlib
for item in capi_results:
    pixel = str(item['pixel'])
    token = item['token']
    try:
        test_data = {
            "data": [{
                "event_name": "PageView",
                "event_time": int(time.time()),
                "action_source": "website",
                "user_data": {
                    "em": [hashlib.sha256("healthcheck@test.com".encode()).hexdigest()],
                    "client_ip_address": "1.1.1.1",
                    "client_user_agent": "HealthCheck/1.0"
                },
                "event_source_url": "https://healthcheck.test"
            }],
            "test_event_code": "HEALTH_CHECK"
        }
        resp = requests.post(
            f"https://graph.facebook.com/v25.0/{pixel}/events?access_token={token}",
            json=test_data,
            timeout=10
        )
        result = resp.json()
        if 'events_received' in result:
            item['status'] = '✅ 正常'
            item['detail'] = f"events_received={result['events_received']}"
        elif 'error' in result:
            item['status'] = '❌ 失敗'
            item['detail'] = result['error'].get('message', '')[:60]
        else:
            item['status'] = '⚠️ 未知'
            item['detail'] = str(result)[:60]
    except Exception as e:
        item['status'] = '❌ 錯誤'
        item['detail'] = str(e)[:60]
    
    print(f"  {item['status']} {item['source']:20s} | 像素: {pixel:20s} | {item['detail']}")

# 5. Check tags without master pixel
print("\n【5】缺少主像素的標籤")
print("-" * 60)
missing_master = []
for tag in LINE_MAP:
    if tag not in MASTER_PIXEL_MAP:
        missing_master.append(tag)
if missing_master:
    for tag in sorted(missing_master):
        print(f"  ⚠️ {tag} - 無主像素設定")
else:
    print("  ✅ 所有標籤都有主像素")

# 6. Check AD_MAP entries with empty pixels
print("\n【6】AD_MAP 中無像素的廣告代碼")
print("-" * 60)
empty_ads = []
for code, info in sorted(AD_MAP.items()):
    if not info: continue
    pixels = info.get('pixels', [])
    if not pixels or not any(p.get('pixel') for p in pixels):
        empty_ads.append(code)
if empty_ads:
    for code in empty_ads:
        print(f"  ⚠️ {code} - AD_MAP 中無像素")
else:
    print("  ✅ 所有廣告代碼都有像素")

# Summary
print("\n" + "=" * 80)
print("總結")
print("=" * 80)

total_tags = len(LINE_MAP)
tags_with_master = sum(1 for t in LINE_MAP if t in MASTER_PIXEL_MAP)
total_ad_codes = sum(len(codes) for codes in ad_codes.values())
capi_ok = sum(1 for c in capi_results if '✅' in c['status'])
capi_fail = sum(1 for c in capi_results if '❌' in c['status'])

print(f"  LINE 標籤: {total_tags} 個 | 有主像素: {tags_with_master} | 缺主像素: {total_tags - tags_with_master}")
print(f"  進行中廣告: {total_ad_codes} 個")
print(f"  CAPI 權杖: {capi_ok} 正常 / {capi_fail} 失敗 / {len(capi_results)} 總計")
print(f"  AD_MAP 無像素: {len(empty_ads)} 個")
