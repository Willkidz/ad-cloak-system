from openai import OpenAI
import os
import time

client = OpenAI()

print("=== 測試 OpenAI API 連線 ===")
print(f"API Base URL: {os.environ.get('OPENAI_BASE_URL', 'N/A')}")
print(f"API Key: {os.environ.get('OPENAI_API_KEY', 'N/A')[:10]}...")
print()

models_to_test = ["gpt-4.1-mini", "gpt-4.1-nano", "gemini-2.5-flash"]

for model in models_to_test:
    try:
        start = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello, reply with just 'OK'"}],
            max_tokens=10,
            timeout=15
        )
        elapsed = time.time() - start
        reply = response.choices[0].message.content.strip()
        print(f"✅ {model}: 連線成功 (回應: {reply}, 耗時: {elapsed:.2f}s)")
    except Exception as e:
        print(f"❌ {model}: 連線失敗 - {e}")

print()
print("=== 測試完成 ===")
