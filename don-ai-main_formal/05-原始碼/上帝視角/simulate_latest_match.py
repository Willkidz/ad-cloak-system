"""
模擬「最近時間匹配」策略
規則：第三層改為「匹配最近一筆未匹配 click」（不管有幾筆）
"""
import json, time

# ============================================================
# 模擬引擎（純邏輯，不打 API）
# ============================================================
clicks_db = []
results = []

def reset():
    global clicks_db
    clicks_db = []

def add_click(click_id, tag, ad_code, destination, ip, ts_offset_sec):
    """ts_offset_sec: 負數表示幾秒前"""
    clicks_db.append({
        "click_id": click_id,
        "tag": tag,
        "ad_code": ad_code,
        "destination": destination,
        "ip_address": ip,
        "timestamp": time.time() + ts_offset_sec,
        "matched": False,
        "matched_user_id": None,
        "matched_ad": None,
    })

def follow_event(destination, user_id, follow_time_offset=0):
    """模擬 follow 事件，用「最近時間匹配」策略"""
    follow_ts = time.time() + follow_time_offset
    
    # 找 destination 相同、未匹配、90 秒內的 clicks
    candidates = [c for c in clicks_db 
                  if c["destination"] == destination 
                  and not c["matched"]
                  and abs(follow_ts - c["timestamp"]) <= 90]
    
    if not candidates:
        return None, "no_match"
    
    # 最近時間匹配：取最接近 follow 時間的那筆
    candidates.sort(key=lambda c: abs(follow_ts - c["timestamp"]))
    best = candidates[0]
    best["matched"] = True
    best["matched_user_id"] = user_id
    return best, "latest_match"

# ============================================================
# 情境模擬
# ============================================================

N21 = "dest_n21"
BF = "dest_bf"
JD = "dest_jd"

# ---- 情境 1: 低流量，1 click 1 follow（最常見）----
reset()
add_click("c1", "n21", "AD001", N21, "1.1.1.1", -30)
match, reason = follow_event(N21, "UserA")
results.append({
    "scenario": "1. 低流量：1 click → 1 follow",
    "desc": "一個人看到廣告 AD001，點了連結，30 秒後加好友",
    "result": "正確" if match and match["ad_code"] == "AD001" else "錯誤",
    "detail": f"歸因到 {match['ad_code']}" if match else reason,
    "real_ad": "AD001",
    "risk": "無"
})

# ---- 情境 2: 同 OA 2 人先後點擊，先後 follow（間隔 > 90s）----
reset()
add_click("c2a", "n21", "AD001", N21, "2.2.2.2", -120)  # 120 秒前
add_click("c2b", "n21", "AD002", N21, "3.3.3.3", -30)   # 30 秒前
# UserB 先 follow（他點的是 AD002）
match, reason = follow_event(N21, "UserB", follow_time_offset=0)
results.append({
    "scenario": "2. 兩人先後點擊（間隔 90s+），後者先 follow",
    "desc": "UserA 120 秒前點 AD001，UserB 30 秒前點 AD002，UserB 先加好友",
    "result": "正確" if match and match["ad_code"] == "AD002" else "錯誤",
    "detail": f"歸因到 {match['ad_code']}" if match else reason,
    "real_ad": "AD002",
    "risk": "無（AD001 已超時）"
})

# ---- 情境 3: 同 OA 2 人短時間點擊，正確順序 follow ----
reset()
add_click("c3a", "n21", "AD001", N21, "4.4.4.4", -50)  # 50 秒前
add_click("c3b", "n21", "AD002", N21, "5.5.5.5", -20)   # 20 秒前
# UserB 先 follow（他點的是 AD002，最近的）
match, reason = follow_event(N21, "UserB", follow_time_offset=0)
results.append({
    "scenario": "3. 兩人短時間點擊，後者先 follow",
    "desc": "UserA 50 秒前點 AD001，UserB 20 秒前點 AD002，UserB 先加好友",
    "result": "正確" if match and match["ad_code"] == "AD002" else "錯誤",
    "detail": f"歸因到 {match['ad_code']}" if match else reason,
    "real_ad": "AD002",
    "risk": "低（最近匹配碰巧正確）"
})
# UserA 再 follow
match2, reason2 = follow_event(N21, "UserA", follow_time_offset=5)
results.append({
    "scenario": "3b. 接著 UserA follow",
    "desc": "UserB 已匹配走了，剩 AD001 是唯一未匹配",
    "result": "正確" if match2 and match2["ad_code"] == "AD001" else "錯誤",
    "detail": f"歸因到 {match2['ad_code']}" if match2 else reason2,
    "real_ad": "AD001",
    "risk": "無"
})

# ---- 情境 4: 同 OA 2 人短時間點擊，反序 follow（最危險）----
reset()
add_click("c4a", "n21", "AD001", N21, "6.6.6.6", -50)  # 50 秒前
add_click("c4b", "n21", "AD002", N21, "7.7.7.7", -20)   # 20 秒前
# UserA 先 follow（他點的是 AD001，但 AD002 更近）
match, reason = follow_event(N21, "UserA", follow_time_offset=0)
results.append({
    "scenario": "4. 兩人短時間點擊，先點者先 follow（反序）",
    "desc": "UserA 50 秒前點 AD001，UserB 20 秒前點 AD002，UserA 先加好友",
    "result": "錯誤" if match and match["ad_code"] == "AD002" else "正確",
    "detail": f"歸因到 {match['ad_code']}（實際是 AD001）" if match else reason,
    "real_ad": "AD001",
    "risk": "高（歸因錯誤，AD001 的成本算到 AD002）"
})
# UserB 再 follow
match2, reason2 = follow_event(N21, "UserB", follow_time_offset=5)
results.append({
    "scenario": "4b. 接著 UserB follow",
    "desc": "AD002 已被 UserA 拿走，剩 AD001",
    "result": "錯誤" if match2 and match2["ad_code"] == "AD001" else "正確",
    "detail": f"歸因到 {match2['ad_code']}（實際是 AD002）" if match2 else reason2,
    "real_ad": "AD002",
    "risk": "高（連鎖錯誤，兩筆都歸因錯誤）"
})

# ---- 情境 5: 同 OA 3 人短時間點擊，只有 1 人 follow ----
reset()
add_click("c5a", "n21", "AD001", N21, "8.8.8.8", -60)
add_click("c5b", "n21", "AD002", N21, "9.9.9.9", -30)
add_click("c5c", "n21", "AD003", N21, "10.10.10.10", -10)
# 只有 UserC follow（他點的是 AD003）
match, reason = follow_event(N21, "UserC", follow_time_offset=0)
results.append({
    "scenario": "5. 三人短時間點擊，只有最後一人 follow",
    "desc": "AD001(60s前)、AD002(30s前)、AD003(10s前)，只有 AD003 的人加好友",
    "result": "正確" if match and match["ad_code"] == "AD003" else "錯誤",
    "detail": f"歸因到 {match['ad_code']}" if match else reason,
    "real_ad": "AD003",
    "risk": "低（最近匹配碰巧正確）"
})

# ---- 情境 6: 同 OA 3 人短時間點擊，中間的人 follow ----
reset()
add_click("c6a", "n21", "AD001", N21, "11.11.11.11", -60)
add_click("c6b", "n21", "AD002", N21, "12.12.12.12", -30)
add_click("c6c", "n21", "AD003", N21, "13.13.13.13", -10)
# UserB follow（他點的是 AD002，但 AD003 更近）
match, reason = follow_event(N21, "UserB", follow_time_offset=0)
results.append({
    "scenario": "6. 三人短時間點擊，中間的人 follow",
    "desc": "AD001(60s前)、AD002(30s前)、AD003(10s前)，AD002 的人加好友",
    "result": "錯誤" if match and match["ad_code"] != "AD002" else "正確",
    "detail": f"歸因到 {match['ad_code']}（實際是 AD002）" if match else reason,
    "real_ad": "AD002",
    "risk": "高（歸因到 AD003 而非 AD002）"
})

# ---- 情境 7: 多項目多廣告（不同 OA）----
reset()
add_click("c7a", "n21", "AD001", N21, "14.14.14.14", -20)
add_click("c7b", "bf",  "AD002", BF,  "15.15.15.15", -15)
add_click("c7c", "jd",  "AD003", JD,  "16.16.16.16", -10)
# 各自 follow
m1, _ = follow_event(N21, "UserA")
m2, _ = follow_event(BF, "UserB")
m3, _ = follow_event(JD, "UserC")
results.append({
    "scenario": "7. 多項目多廣告（不同 LINE OA）",
    "desc": "n21/AD001、bf/AD002、jd/AD003 各一人點擊，各自加好友",
    "result": "正確" if (m1 and m1["ad_code"]=="AD001" and m2 and m2["ad_code"]=="AD002" and m3 and m3["ad_code"]=="AD003") else "錯誤",
    "detail": f"n21→{m1['ad_code'] if m1 else 'X'}, bf→{m2['ad_code'] if m2 else 'X'}, jd→{m3['ad_code'] if m3 else 'X'}",
    "real_ad": "各自正確",
    "risk": "無（destination 隔離）"
})

# ---- 情境 8: 同一人重複點擊（看了兩次廣告）----
reset()
add_click("c8a", "n21", "AD001", N21, "17.17.17.17", -80)
add_click("c8b", "n21", "AD002", N21, "17.17.17.17", -20)  # 同一人看了另一個廣告
# 這人 follow
match, reason = follow_event(N21, "UserA", follow_time_offset=0)
results.append({
    "scenario": "8. 同一人看了兩個廣告再加好友",
    "desc": "UserA 先點 AD001(80s前)，又點 AD002(20s前)，然後加好友",
    "result": "正確" if match and match["ad_code"] == "AD002" else "看法不同",
    "detail": f"歸因到 {match['ad_code']}（最後觸及）" if match else reason,
    "real_ad": "AD002（last-touch）",
    "risk": "無（last-touch 歸因合理）"
})

# ============================================================
# 輸出結果
# ============================================================
print("=" * 70)
print("「最近時間匹配」策略模擬結果")
print("=" * 70)
correct = 0
wrong = 0
for r in results:
    icon = "✅" if "正確" in r["result"] else "❌"
    print(f'\n{icon} {r["scenario"]}')
    print(f'   場景：{r["desc"]}')
    print(f'   結果：{r["detail"]}')
    print(f'   風險：{r["risk"]}')
    if "正確" in r["result"]:
        correct += 1
    else:
        wrong += 1

print(f'\n{"=" * 70}')
print(f'總計：{correct} 正確 / {wrong} 錯誤 / {len(results)} 總情境')
print(f'準確率：{correct/len(results)*100:.0f}%')
print(f'{"=" * 70}')
