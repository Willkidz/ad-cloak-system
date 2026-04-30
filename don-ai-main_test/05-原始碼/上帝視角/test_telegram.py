import requests, json

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
CF_ACCOUNT = "61f1eb800e48d2cf41ed9ddacf01581b"
DB_ID = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
TG_TOKEN = "8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc"
TG_CHAT = "7495585445"

# 1. Test D1 query
print("=== 1. D1 Query Test ===")
try:
    r = requests.post(
        f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/d1/database/{DB_ID}/query",
        headers={"Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"},
        json={"sql": "SELECT tag, COUNT(*) as clicks FROM clicks WHERE DATE(timestamp, '+8 hours') = DATE('now','+8 hours') GROUP BY tag"},
        timeout=10
    )
    data = r.json()
    results = data.get('result', [{}])[0].get('results', [])
    print(f"D1 回傳 {len(results)} 筆")
    for row in results:
        print(f"  tag={row['tag']} clicks={row['clicks']}")
except Exception as e:
    print(f"D1 Error: {e}")

# 2. Test Telegram
print("\n=== 2. Telegram Test ===")
try:
    r = requests.get(f"https://api.telegram.org/bot{TG_TOKEN}/getMe", timeout=10)
    bot = r.json()
    print(f"Bot: {bot.get('result',{}).get('username','?')} - OK={bot.get('ok')}")
except Exception as e:
    print(f"Telegram Error: {e}")

# 3. Send test message
print("\n=== 3. Send Test Message ===")
try:
    r = requests.post(
        f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
        json={"chat_id": TG_CHAT, "text": "🔧 系統測試：每日統計報告排查中\n如果你看到這則訊息，代表 Telegram Bot 連線正常。"},
        timeout=10
    )
    result = r.json()
    print(f"Send OK={result.get('ok')} message_id={result.get('result',{}).get('message_id','?')}")
except Exception as e:
    print(f"Send Error: {e}")
