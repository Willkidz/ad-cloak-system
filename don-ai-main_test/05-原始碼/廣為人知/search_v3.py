import requests
import json
import time

API_KEY = 'pPKEf8V69WXLbACq1rzxe6Wi'
BASE_URL = 'https://www.searchapi.io/api/v1/search'

# 精準關鍵字：信用版專屬詞 + 品牌名
KEYWORDS = [
    "信用版",
    "免儲值 娛樂城",
    "送兩萬 娛樂城",
    "金富翁",
    "誠運坊",
    "戰神賽特 送",
]

all_results = []
seen_ad_ids = set()
seen_page_ids = set()
search_stats = {}

for kw in KEYWORDS:
    print(f"\n===== 搜尋: {kw} =====")
    try:
        resp = requests.get(BASE_URL, params={
            'engine': 'meta_ad_library',
            'api_key': API_KEY,
            'q': kw,
            'country': 'TW',
            'active_status': 'active',
            'content_languages': 'zh'
        }, timeout=30)
        data = resp.json()
        ads = data.get('ads', [])
        print(f"  結果數: {len(ads)}")
        
        gambling_count = 0
        for ad in ads:
            ad_id = ad.get('ad_archive_id', '')
            if ad_id in seen_ad_ids:
                continue
            seen_ad_ids.add(ad_id)
            
            snapshot = ad.get('snapshot', {})
            page_name = snapshot.get('page_name', '') or ad.get('page_name', '')
            page_id = str(snapshot.get('page_id', '') or ad.get('page_id', ''))
            body = snapshot.get('body', {})
            body_text = body.get('text', '') if isinstance(body, dict) else str(body)
            cta_text = snapshot.get('cta_text', '')
            link_url = snapshot.get('link_url', '')
            display_format = snapshot.get('display_format', '')
            caption = snapshot.get('caption', '')
            title = snapshot.get('title', '')
            link_desc = snapshot.get('link_description', '')
            start_date = ad.get('start_date', '')
            collation_count = ad.get('collation_count', 1)
            page_like_count = snapshot.get('page_like_count', 0)
            
            images = snapshot.get('images', [])
            image_url = images[0].get('resized_image_url', '') if images else ''
            videos = snapshot.get('videos', [])
            video_url = videos[0].get('video_sd_url', '') if videos else ''
            
            all_text = f"{page_name} {body_text} {title} {link_desc} {caption}".lower()
            gambling_kws = ['娛樂城', '送', '儲值', '返水', '信用', '開版', '博弈',
                           '老虎機', '百家樂', '體育', '電子', '棋牌', '彩金',
                           '戰神', '賽特', '聚寶', '財神', '註冊送', '首儲',
                           '免費玩', '額度', '出金', '入金', '洗碼', '水錢',
                           '娛樂', '真人', '捕魚', '輪盤', '骰寶']
            
            is_gambling = any(gk in all_text for gk in gambling_kws)
            if not is_gambling:
                continue
                
            gambling_count += 1
            
            credit_kws = ['信用', '開版', '免儲值', '先玩後付', '額度']
            high_bonus_kws = ['送兩萬', '送20000', '送16800', '送25000', '送2萬', '送兩萬']
            credit_signals = [ck for ck in credit_kws if ck in all_text]
            bonus_signals = [hb for hb in high_bonus_kws if hb in all_text]
            is_credit = bool(credit_signals or bonus_signals)
            
            ad_data = {
                'keyword': kw,
                'ad_id': ad_id,
                'page_name': page_name,
                'page_id': page_id,
                'body_text': body_text[:300],
                'title': title,
                'link_description': link_desc,
                'cta_text': cta_text,
                'link_url': link_url,
                'domain': caption,
                'display_format': display_format,
                'start_date': start_date,
                'collation_count': collation_count,
                'page_like_count': page_like_count,
                'image_url': image_url,
                'video_url': video_url,
                'is_credit': is_credit,
                'credit_signals': credit_signals + bonus_signals
            }
            all_results.append(ad_data)
            
            is_new_page = page_id not in seen_page_ids
            if is_new_page:
                seen_page_ids.add(page_id)
            
            tag = "★信用" if is_credit else "現金"
            new_tag = "NEW" if is_new_page else "dup"
            print(f"  [{tag}][{new_tag}] {page_name} | {body_text[:60]}... | {caption}")
        
        relevance = gambling_count / len(ads) * 100 if ads else 0
        search_stats[kw] = {'total': len(ads), 'gambling': gambling_count, 'relevance': f"{relevance:.0f}%"}
        print(f"  博弈相關: {gambling_count}/{len(ads)} = {relevance:.0f}%")
        
    except Exception as e:
        print(f"  錯誤: {e}")
        search_stats[kw] = {'total': 0, 'gambling': 0, 'relevance': '0%', 'error': str(e)}
    
    time.sleep(1)

# 總結
print(f"\n\n{'='*60}")
print(f"搜尋統計:")
for kw, stats in search_stats.items():
    print(f"  {kw}: {stats['gambling']}/{stats['total']} ({stats['relevance']})")

# 按粉專分組
pages = {}
for r in all_results:
    pid = r['page_id']
    if pid not in pages:
        pages[pid] = {
            'page_name': r['page_name'],
            'page_id': pid,
            'domain': r['domain'],
            'is_credit': r['is_credit'],
            'credit_signals': r['credit_signals'],
            'page_like_count': r['page_like_count'],
            'ads': []
        }
    pages[pid]['ads'].append(r)
    if r['is_credit']:
        pages[pid]['is_credit'] = True
        pages[pid]['credit_signals'] = list(set(pages[pid]['credit_signals'] + r['credit_signals']))

credit_pages = {k: v for k, v in pages.items() if v['is_credit']}
cash_pages = {k: v for k, v in pages.items() if not v['is_credit']}

print(f"\n不重複粉專: {len(pages)} 個")
print(f"  ★ 信用版: {len(credit_pages)} 個")
print(f"  現金版: {len(cash_pages)} 個")

print(f"\n{'='*60}")
print(f"★ 信用版粉專詳細 ({len(credit_pages)}):")
for pid, p in sorted(credit_pages.items(), key=lambda x: x[1]['page_like_count'], reverse=True):
    print(f"\n  {p['page_name']} (ID:{pid})")
    print(f"    域名: {p['domain']} | 讚: {p['page_like_count']} | 信號: {p['credit_signals']}")
    print(f"    廣告數: {len(p['ads'])}")
    for ad in p['ads'][:3]:
        print(f"      [{ad['display_format']}] {ad['body_text'][:80]}")
        print(f"      CTA:{ad['cta_text']} | 開始:{ad['start_date'][:10]} | 變體:{ad['collation_count']}")

print(f"\n{'='*60}")
print(f"現金版粉專 ({len(cash_pages)}):")
for pid, p in sorted(cash_pages.items(), key=lambda x: x[1]['page_like_count'], reverse=True):
    print(f"  {p['page_name']} | {p['domain']} | 讚:{p['page_like_count']} | 廣告:{len(p['ads'])}")

# 儲存
with open('/home/ubuntu/competitor_results_v3.json', 'w', encoding='utf-8') as f:
    json.dump({
        'search_stats': search_stats,
        'total_ads': len(all_results),
        'total_pages': len(pages),
        'credit_pages': credit_pages,
        'cash_pages': cash_pages,
        'all_results': all_results
    }, f, ensure_ascii=False, indent=2)

print(f"\n結果已儲存至 competitor_results_v3.json")
