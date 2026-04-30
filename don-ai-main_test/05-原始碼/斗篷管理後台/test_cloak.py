import requests
import hashlib

URL = "https://ryinb.site"

tests = [
    {
        "name": "T1: 正常手機 iPhone (TW referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Instagram 421.0.6.37 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
            "Referer": "https://l.facebook.com/",
        }
    },
    {
        "name": "T2: 正常手機 Android (FB referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9",
            "Referer": "https://l.facebook.com/",
        }
    },
    {
        "name": "T3: Meta 爬蟲 (facebookexternalhit)",
        "headers": {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        }
    },
    {
        "name": "T4: Meta 爬蟲 (Facebot)",
        "headers": {
            "User-Agent": "Facebot/1.0",
        }
    },
    {
        "name": "T5: Google 爬蟲 (Googlebot)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        }
    },
    {
        "name": "T6: 桌面 Chrome (無 referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9",
        }
    },
    {
        "name": "T7: 桌面 Chrome (FB referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9",
            "Referer": "https://l.facebook.com/",
        }
    },
    {
        "name": "T8: curl 預設 (無 UA)",
        "headers": {}
    },
    {
        "name": "T9: 英文語言 iPhone (FB referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://l.facebook.com/",
        }
    },
    {
        "name": "T10: 日文語言 iPhone (FB referer)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "ja-JP,ja;q=0.9",
            "Referer": "https://l.facebook.com/",
        }
    },
    {
        "name": "T11: iPhone 無 referer",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
        }
    },
    {
        "name": "T12: Instagram referer",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Instagram 421.0.6.37 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
            "Referer": "https://www.instagram.com/",
        }
    },
    {
        "name": "T13: Meta 審核 IP 模擬 (帶 X-Forwarded-For)",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
            "Referer": "https://l.facebook.com/",
            "X-Forwarded-For": "69.171.251.12",  # Meta IP range
        }
    },
    {
        "name": "T14: Python requests 預設 UA",
        "headers": {
            "User-Agent": "python-requests/2.31.0",
        }
    },
    {
        "name": "T15: 帶 fbclid 參數",
        "url": "https://ryinb.site/?fbclid=IwAR3abc123def456",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
        }
    },
    {
        "name": "T16: 帶 utm_source=facebook",
        "url": "https://ryinb.site/?utm_source=facebook&utm_medium=paid",
        "headers": {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21H221 Safari/604.1",
            "Accept-Language": "zh-TW,zh-Hant;q=0.9",
        }
    },
]

for t in tests:
    url = t.get("url", URL)
    try:
        r = requests.get(url, headers=t["headers"], allow_redirects=False, timeout=10)
        status = r.status_code
        
        # 判斷是安全頁還是落地頁
        body = r.text[:5000]
        has_fbq = "fbq" in body
        has_pixel = "fbevents" in body
        has_gotolink = "gotolink" in body
        has_conftpl = "[conftpl]" in body
        title_match = ""
        if "<title>" in body:
            start = body.index("<title>") + 7
            end = body.index("</title>", start) if "</title>" in body[start:start+200] else start+50
            title_match = body[start:end][:60]
        
        # 檢查是否有 redirect
        location = r.headers.get("Location", "")
        
        # 內容長度
        content_len = len(r.text)
        
        # 簡單判斷
        if status in (301, 302, 303, 307):
            page_type = f"REDIRECT → {location[:80]}"
        elif has_gotolink or has_conftpl:
            page_type = "落地頁 (有 gotolink/conftpl)"
        elif has_fbq or has_pixel:
            page_type = "落地頁 (有像素)"
        else:
            # 看內容特徵
            if "博富" in body or "領取" in body:
                page_type = "落地頁"
            else:
                page_type = "安全頁"
        
        body_hash = hashlib.md5(r.text.encode()).hexdigest()[:8]
        
        print(f"{t['name']}")
        print(f"  Status: {status} | Size: {content_len} | Hash: {body_hash}")
        print(f"  Title: {title_match}")
        print(f"  判斷: {page_type}")
        print(f"  fbq={has_fbq} pixel={has_pixel} gotolink={has_gotolink}")
        print()
        
    except Exception as e:
        print(f"{t['name']}")
        print(f"  ERROR: {e}")
        print()
