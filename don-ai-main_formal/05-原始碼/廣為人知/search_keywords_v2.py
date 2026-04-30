import requests
import json
import time

API_KEY = "pPKEf8V69WXLbACq1rzxe6Wi"
BASE_URL = "https://www.searchapi.io/api/v1/search"

# 更精準的關鍵字，從同行素材中提取
keywords = [
    "開版送",
    "先玩後付",
    "開版即贈",
    "戰神賽特",
    "額度爽爽玩",
]

all_ads = []
seen_page_ids = set()

for kw in keywords:
    print(f"\n===== 搜尋: {kw} =====")
    try:
        resp = requests.get(BASE_URL, params={
            "engine": "meta_ad_library",
            "api_key": API_KEY,
            "q": kw,
            "country": "TW",
            "active_status": "active",
            "sort_by": "most_recent",
            "content_languages": "zh"
        }, timeout=30)
        data = resp.json()
        ads = data.get("ads", [])
        print(f"  結果數: {len(ads)}")
        
        gambling_count = 0
        for ad in ads:
            snapshot = ad.get("snapshot", {})
            page_name = snapshot.get("page_name", "")
            page_id = ad.get("page_id", "")
            body = snapshot.get("body", {})
            text = body.get("text", "") if isinstance(body, dict) else ""
            cta_text = snapshot.get("cta_text", "")
            display_format = snapshot.get("display_format", "")
            link_url = snapshot.get("link_url", "")
            link_caption = snapshot.get("link_caption", "")
            images = snapshot.get("images", [])
            videos = snapshot.get("videos", [])
            page_like_count = snapshot.get("page_like_count", 0)
            
            # 判斷是否博弈相關
            all_text = f"{page_name} {text} {cta_text} {link_url} {link_caption}".lower()
            gambling_keywords = ["娛樂城", "開版", "額度", "返水", "信用版", "免儲值", 
                               "先玩後付", "體驗金", "戰神", "老虎機", "百家樂",
                               "博弈", "賽特", "財神", "免費玩", "開通好禮"]
            
            is_gambling = any(gk in all_text for gk in gambling_keywords)
            
            if is_gambling:
                gambling_count += 1
                ad_info = {
                    "search_keyword": kw,
                    "page_name": page_name,
                    "page_id": page_id,
                    "text": text[:200],
                    "cta": cta_text,
                    "format": display_format,
                    "link_url": link_url,
                    "link_caption": link_caption,
                    "images_count": len(images),
                    "videos_count": len(videos),
                    "page_likes": page_like_count,
                    "start_date": ad.get("start_date", ""),
                    "is_active": ad.get("is_active", False),
                    "collation_count": ad.get("collation_count", ""),
                    "platforms": [p.get("publisher_platform", "") for p in ad.get("publisher_platform", [])] if isinstance(ad.get("publisher_platform"), list) else [],
                    "ad_archive_id": ad.get("ad_archive_id", "")
                }
                all_ads.append(ad_info)
                
                new_flag = " [新粉專]" if page_id not in seen_page_ids else ""
                seen_page_ids.add(page_id)
                
                print(f"  ✅ {page_name} (ID:{page_id}){new_flag}")
                print(f"     文案: {text[:80]}...")
                print(f"     CTA: {cta_text} | 格式: {display_format} | 連結: {link_url[:50]}")
                print(f"     讚: {page_like_count} | 開始: {ad.get('start_date','')}")
        
        print(f"  博弈相關: {gambling_count}/{len(ads)} = {gambling_count/len(ads)*100:.0f}%" if ads else "  無結果")
        
    except Exception as e:
        print(f"  錯誤: {e}")
    
    time.sleep(1)

# 存結果
with open("/home/ubuntu/gambling_ads_v2.json", "w") as f:
    json.dump(all_ads, f, ensure_ascii=False, indent=2)

# 統計
unique_pages = {}
for ad in all_ads:
    pid = ad["page_id"]
    if pid not in unique_pages:
        unique_pages[pid] = {"name": ad["page_name"], "likes": ad["page_likes"], "ad_count": 0}
    unique_pages[pid]["ad_count"] += 1

print(f"\n\n===== 總結 =====")
print(f"找到博弈廣告: {len(all_ads)} 筆")
print(f"不重複粉專: {len(unique_pages)} 個")
print(f"\n粉專列表:")
for pid, info in sorted(unique_pages.items(), key=lambda x: x[1]["ad_count"], reverse=True):
    print(f"  {info['name']} (ID:{pid}) - {info['ad_count']}筆廣告, {info['likes']}讚")
