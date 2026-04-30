import re

# 火鳥 3/20 的按鈕點擊（台灣時間）
firebird_clicks = [
    {"seq": 1,  "time": "2026-03-20 11:37:13", "dest": "js.freshpathlab.com/?a=JS03", "ip": "2001:b011:d002:542f:796b:f5c3:9d8e:d3c8", "tag": "js", "ad": "JS03"},
    {"seq": 2,  "time": "2026-03-20 11:13:43", "dest": "cs.freshpathlab.com/?a=CS03", "ip": "150.116.147.237", "tag": "cs", "ad": "CS03"},
    {"seq": 3,  "time": "2026-03-20 11:11:53", "dest": "ms.freshpathlab.com/?a=MS03", "ip": "2402:7500:a60:383e:d0e8:90e9:328c:ce23", "tag": "ms", "ad": "MS03"},
    {"seq": 4,  "time": "2026-03-20 09:14:17", "dest": "ls.freshpathlab.com/?a=LS03", "ip": "101.12.97.252", "tag": "ls", "ad": "LS03"},
    {"seq": 5,  "time": "2026-03-20 08:30:21", "dest": "js.freshpathlab.com/?a=JS03", "ip": "2402:7500:500:66c6:fda4:6cd3:594b:a665", "tag": "js", "ad": "JS03"},
    {"seq": 6,  "time": "2026-03-20 08:29:04", "dest": "cs.freshpathlab.com/?a=CS03", "ip": "2401:e180:8990:f55:cd8d:74ff:c6a7:5fe5", "tag": "cs", "ad": "CS03"},
    {"seq": 7,  "time": "2026-03-20 06:13:31", "dest": "ls.freshpathlab.com/?a=LS03", "ip": "111.240.79.64", "tag": "ls", "ad": "LS03"},
    {"seq": 8,  "time": "2026-03-20 06:13:18", "dest": "ls.freshpathlab.com/?a=LS03", "ip": "111.240.79.64", "tag": "ls", "ad": "LS03"},
    {"seq": 9,  "time": "2026-03-20 06:01:12", "dest": "js.freshpathlab.com/?a=JS03", "ip": "2001:b400:e784:f42c:1447:855:e609:8f0c", "tag": "js", "ad": "JS03"},
    {"seq": 10, "time": "2026-03-20 05:25:36", "dest": "cs.freshpathlab.com/?a=CS03", "ip": "114.43.224.37", "tag": "cs", "ad": "CS03"},
    {"seq": 11, "time": "2026-03-20 04:56:23", "dest": "ms.freshpathlab.com/?a=MS03", "ip": "180.177.52.9", "tag": "ms", "ad": "MS03"},
]

# D1 中 AS 系列（台灣時間 3/20）的記錄
# 只有 1 筆：2026-03-19T20:56:24 UTC = 台灣 3/20 04:56:24, tag=ms, ad=MS03, ip=180.177.52.9
d1_as_clicks = [
    {"time_utc": "2026-03-19T20:56:24", "time_tw": "2026-03-20 04:56:24", "tag": "ms", "ad": "MS03", "ip": "180.177.52.9", "matched": False},
]

print("=== 火鳥 AS 系列 3/20 按鈕點擊（11筆）vs D1（1筆）===\n")
print(f"{'序號':4s} | {'火鳥時間':19s} | {'TAG':4s} | {'ad':6s} | {'IP':25s} | D1 有無")
print("-" * 90)

for fc in firebird_clicks:
    # 比對 D1
    found = False
    for dc in d1_as_clicks:
        if dc["ip"].startswith(fc["ip"][:12]) and dc["tag"] == fc["tag"]:
            found = True
            break
    status = "✓ 有" if found else "✗ 缺失"
    print(f"{fc['seq']:4d} | {fc['time']:19s} | {fc['tag']:4s} | {fc['ad']:6s} | {fc['ip'][:25]:25s} | {status}")

print(f"\n火鳥 AS 3/20: {len(firebird_clicks)} 筆")
print(f"D1 AS 3/20: {len(d1_as_clicks)} 筆")
print(f"缺失: {len(firebird_clicks) - len(d1_as_clicks)} 筆")

# 分析缺失原因
print("\n=== 缺失原因分析 ===")
# 修復時間：大約 3/20 上午（台灣時間約 10:00-11:00）
print("Worker FALLBACK 修復部署時間：約台灣 3/20 10:30")
print()
for fc in firebird_clicks:
    h = int(fc["time"].split(" ")[1].split(":")[0])
    if fc["seq"] == 11:
        print(f"  #{fc['seq']} {fc['time']} {fc['tag']} → D1 有記錄（唯一一筆）")
    elif h < 10:
        print(f"  #{fc['seq']} {fc['time']} {fc['tag']} → 修復前，Worker 可能 404（FALLBACK 缺 key）")
    else:
        print(f"  #{fc['seq']} {fc['time']} {fc['tag']} → 修復後，但 D1 仍無記錄？需進一步查")
