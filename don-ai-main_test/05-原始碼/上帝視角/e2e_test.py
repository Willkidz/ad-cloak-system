import subprocess, json, time

CF_TOKEN = "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"
CF_ACCOUNT = "61f1eb800e48d2cf41ed9ddacf01581b"
D1_DB = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g"
D1_URL = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/d1/database/{D1_DB}/query"

def d1_query(sql):
    r = subprocess.run(["curl", "-s", "-X", "POST", D1_URL,
        "-H", f"Authorization: Bearer {CF_TOKEN}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"sql": sql})], capture_output=True, text=True, timeout=15)
    return json.loads(r.stdout)

def curl_get_code(url, data, extra_headers=None):
    cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-X", "POST", url,
           "-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if extra_headers:
        for k, v in extra_headers.items():
            cmd += ["-H", f"{k}: {v}"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return r.stdout.strip()

# Step 1 - Config API
print("第一步 Config API:", end=" ")
r1 = subprocess.run(["curl", "-s", "https://n8n.bexnua.store/webhook/get-config"],
    capture_output=True, text=True, timeout=15)
try:
    d1 = json.loads(r1.stdout)
    line_map = len(d1.get("LINE_MAP", {}))
    pixel_map = len(d1.get("MASTER_PIXEL_MAP", {}))
    bc = d1.get("BC_PIXEL", "缺失")
    ok = line_map >= 20 and pixel_map >= 15 and bc != "缺失"
    print(f"{'✅' if ok else '❌'} LINE_MAP:{line_map}筆 MASTER_PIXEL_MAP:{pixel_map}筆")
except Exception as e:
    print(f"❌ {e}")

# Step 2 - Insert
print("第二步 D1 寫入:", end=" ")
r2 = d1_query('INSERT INTO clicks (click_id, timestamp, tag, ad_code, line_oa_id, ip_address, user_agent, accept_language, ip_country, fbclid, fbc, fbp, pixel_id, capi_token, pixels, matched, destination, cf_colo, tls_version, http_protocol, referer) VALUES ("test_e2e_001", datetime("now"), "bf", "BF01", "U0cdeed609619a3ea8f8027b01d216f0f", "1.2.3.4", "Mozilla/5.0 iPhone", "zh-TW", "TW", "fb.1.test123456", "fb.1.1711234567.test123456", "", "2153779865162231", "token_test", "[]", 0, "U0cdeed609619a3ea8f8027b01d216f0f", "TPE", "TLSv1.3", "h2", "https://bexnua.store")')
print("✅" if r2.get("success") else f"❌ {r2.get('errors')}")

# Step 3 - Confirm
print("第三步 D1 確認:", end=" ")
r3 = d1_query('SELECT click_id, tag, ad_code, matched, destination FROM clicks WHERE click_id = "test_e2e_001"')
rows = r3.get("result", [{}])[0].get("results", [])
print(f"✅ 筆數:{len(rows)} matched:{rows[0].get('matched') if rows else 'N/A'}" if r3.get("success") and rows else f"❌ {r3.get('errors')}")

# Step 4 - LINE Follow
print("第四步 LINE Follow:", end=" ")
ts = int(time.time()) * 1000
r4 = curl_get_code("https://n8n.bexnua.store/webhook/line-follow", {
    "destination": "U0cdeed609619a3ea8f8027b01d216f0f",
    "events": [{"type": "follow", "timestamp": ts, "source": {"type": "user", "userId": "Utest_e2e_user_001"}, "replyToken": "test_reply_token_001", "mode": "active"}]
})
print(f"HTTP {r4} {'✅' if r4 == '200' else '❌'}")

# Wait
print("等待 5 秒...")
time.sleep(5)

# Step 5 - Verify match
print("第五步 匹配驗證:", end=" ")
r5 = d1_query('SELECT click_id, tag, ad_code, matched, destination FROM clicks WHERE click_id = "test_e2e_001"')
rows5 = r5.get("result", [{}])[0].get("results", [])
matched = rows5[0].get("matched") if rows5 else "N/A"
print(f"matched={matched} {'✅' if matched == 1 else '❌'}")

# Step 6 - n8n execution log
print("第六步 n8n 執行紀錄:", end=" ")
r6 = subprocess.run(["curl", "-s", "-H", f"X-N8N-API-KEY: {N8N_KEY}",
    "https://n8n.bexnua.store/api/v1/executions?workflowId=dqbdnCN3xdJAahYQ&limit=3"],
    capture_output=True, text=True, timeout=15)
try:
    d6 = json.loads(r6.stdout)
    execs = d6.get("data", [])
    if execs:
        status = execs[0]["status"]
        print(f"status={status} {'✅' if status == 'success' else '❌'}")
    else:
        print("無執行紀錄 ❌")
except:
    print(f"解析失敗: {r6.stdout[:100]}")

# Step 7 - Cleanup
print("第七步 清理:", end=" ")
r7 = d1_query('DELETE FROM clicks WHERE click_id = "test_e2e_001"')
print("✅" if r7.get("success") else "❌")
