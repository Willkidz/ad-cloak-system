import requests
import json
import time

API_KEY = "pPKEf8V69WXLbACq1rzxe6Wi"
BASE_URL = "https://www.searchapi.io/api/v1/search"

# 信用版相關關鍵字
keywords = [
    "信用版",
    "免驗證",
    "周結",
    "先上分",
    "送20000",
    "送10000",
]

all_ads = {}  # 用 ad_archive_id 去重

for kw in keywords:
    print(f"\n=== 搜尋: {kw} ===")
    params = {
        "engine": "meta_ad_library",
        "q": kw,
        "country": "TW",
        "active_status": "active",
        "sort_by": "most_recent",
        "start_date": "2026-03-01",
        "api_key": API_KEY
    }
    
    try:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        data = resp.json()
        total = data.get("search_information", {}).get("total_results", 0)
        ads = data.get("ads", [])
        print(f"結果數: {total}, 本頁: {len(ads)}")
        
        for ad in ads:
            aid = ad.get("ad_archive_id", "")
            if aid not in all_ads:
                all_ads[aid] = {
                    "keyword": kw,
                    "ad": ad
                }
    except Exception as e:
        print(f"搜尋 {kw} 失敗: {e}")
    
    time.sleep(1)  # 避免 rate limit

print(f"\n=== 去重後共 {len(all_ads)} 筆廣告 ===")

# 輸出詳細資訊
results = []
for aid, item in all_ads.items():
    ad = item["ad"]
    snap = ad.get("snapshot", {})
    body_text = snap.get("body", {}).get("text", "")
    
    # 提取 cards 中的資訊
    cards = snap.get("cards", [])
    card_links = [c.get("link_url", "") for c in cards if c.get("link_url")]
    card_bodies = [c.get("body", "") for c in cards if c.get("body")]
    
    record = {
        "ad_archive_id": aid,
        "搜尋關鍵字": item["keyword"],
        "粉專名稱": ad.get("page_name", ""),
        "page_id": ad.get("page_id", ""),
        "文案": body_text[:200],
        "CTA": snap.get("cta_text", ""),
        "CTA類型": snap.get("cta_type", ""),
        "連結": snap.get("link_url", "") or (card_links[0] if card_links else ""),
        "域名": snap.get("caption", ""),
        "格式": snap.get("display_format", ""),
        "圖片數": len(snap.get("images", [])),
        "影片數": len(snap.get("videos", [])),
        "輪播卡片數": len(cards),
        "素材變體": ad.get("collation_count", ""),
        "平台": ad.get("publisher_platform", []),
        "開始日期": ad.get("start_date", ""),
        "仍在投放": ad.get("is_active", ""),
        "粉專讚數": snap.get("page_like_count", ""),
        "粉專分類": snap.get("page_categories", []),
        "card_bodies": card_bodies[:3],  # 輪播卡片文案
    }
    results.append(record)

# 按開始日期排序（最新的在前）
results.sort(key=lambda x: x["開始日期"], reverse=True)

# 保存完整結果
with open("/home/ubuntu/competitor_search_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# 輸出摘要
print(f"\n=== 搜尋結果摘要（共 {len(results)} 筆）===\n")
for i, r in enumerate(results[:30]):
    print(f"--- #{i+1} ---")
    print(f"粉專: {r['粉專名稱']} (page_id: {r['page_id']})")
    print(f"搜尋詞: {r['搜尋關鍵字']}")
    print(f"文案: {r['文案'][:100]}...")
    print(f"CTA: {r['CTA']} | 格式: {r['格式']} | 圖:{r['圖片數']} 影:{r['影片數']} 輪播:{r['輪播卡片數']}")
    print(f"連結: {r['連結']} | 域名: {r['域名']}")
    print(f"開始: {r['開始日期']} | 活躍: {r['仍在投放']} | 變體: {r['素材變體']}")
    print(f"讚數: {r['粉專讚數']} | 平台: {r['平台']}")
    if r['card_bodies']:
        print(f"輪播文案: {str(r['card_bodies'][:2])[:150]}")
    print()
