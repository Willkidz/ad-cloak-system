import requests
import json
import time

API_KEY = "pPKEf8V69WXLbACq1rzxe6Wi"
BASE_URL = "https://www.searchapi.io/api/v1/search"

# 已知 11 家同行的粉專名稱
competitors = [
    "喬娜博弈小天地",
    "誠運坊娛樂事業",
    "魔教教主",
    "Kipo",
    "誠運坊-娛樂活動",
    "天碩娛樂",
    "金富翁 online",
    "水晶晶",
    "娛樂世界",
    "八金富娛樂城",
    "金富翁"
]

# Nguyễn Hạnh 跳過，越南名不好搜

results = []

for name in competitors:
    print(f"\n搜尋粉專: {name}")
    try:
        resp = requests.get(BASE_URL, params={
            "engine": "meta_ad_library_page_search",
            "api_key": API_KEY,
            "q": name,
            "country": "TW"
        }, timeout=30)
        data = resp.json()
        pages = data.get("pages", [])
        if pages:
            for p in pages[:3]:  # 最多看前3個結果
                results.append({
                    "search_name": name,
                    "page_id": p.get("page_id"),
                    "page_name": p.get("page_name"),
                    "page_like_count": p.get("page_like_count"),
                    "page_categories": p.get("page_categories"),
                    "page_profile_uri": p.get("page_profile_uri")
                })
                print(f"  找到: {p.get('page_name')} (ID: {p.get('page_id')}, 讚: {p.get('page_like_count')})")
        else:
            print(f"  未找到")
            results.append({"search_name": name, "page_id": None, "page_name": "NOT FOUND"})
    except Exception as e:
        print(f"  錯誤: {e}")
        results.append({"search_name": name, "page_id": None, "page_name": f"ERROR: {e}"})
    time.sleep(1)

# 存結果
with open("/home/ubuntu/page_ids.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\n\n完成，共 {len(results)} 筆結果")
