import json

rows = [["LINE帳號", "LINE名稱", "tag", "code", "廣告鏈結"]]

def add(line_id, line_name, tag, prefix, count):
    for i in range(1, count + 1):
        code = f"{prefix}{i:02d}"
        url = f"https://{tag}.freshpathlab.com/?a={code}"
        rows.append([line_id, line_name, tag, code, url])

# 博富 (bf) - 10
add("@678eohsd", "博富 BOFU", "bf", "BF", 10)

# 莊家剋星 - 各10
add("@bn56", "莊家剋星-百家殺手", "cb", "CB", 10)
add("@448nzdkf", "莊家剋星-百家專家", "jb", "JB", 10)
add("@bn58", "莊家剋星-百家GPT", "lb", "LB", 10)
add("@734xzzse", "莊家剋星-百家打莊姬", "mb", "MB", 10)

# 爆分王 - 各10
add("@999hqlmk", "爆分王-電子訊號程式", "cs", "CS", 10)
add("@935bicyi", "爆分王-電子打法秘笈", "js", "JS", 10)
add("@849rldxt", "爆分王-24H訊號打法", "ls", "LS", 10)
add("@001qlmgf", "爆分王-電子打法訊號", "ms", "MS", 10)

# 獨角仙 - 各10
add("@697jsdma", "獨角仙AI算牌系統", "cx", "CX", 10)
add("@652ahjmy", "獨角仙AI算牌程式", "jx", "JX", 10)
add("@128hxyvp", "獨角仙AI預測程式", "lx", "LX", 10)
add("@525euwsy", "獨角仙AI預測系統", "mx", "MX", 10)

# 兩斤炭吉 - 5
add("@520ufhmw", "兩斤炭吉", "jd", "JD", 5)

# 蘇主金 - 5
add("@348ikfwm", "蘇主金", "n20", "N20", 5)

# 蕭甘丹 - 5
add("@013rgbjl", "電子蕭甘丹", "n18", "N18", 5)

# 洪金豹 - 5
add("@416nbqjl", "洪金豹", "n14", "N14", 5)

# 阿奇體育 - 5
add("@659jgxlp", "阿奇說球", "n22", "N22", 5)

# 開版歪歪熊 - 5
add("@745jaffa", "開版歪歪熊", "n15", "N15", 5)

# 晴兒 - 5
add("@751tggmd", "晴兒", "n16", "N16", 5)

# 郝士多 - 5
add("@106tndmh", "郝士多", "n17", "N17", 5)

# 開版歪熊 - 5
add("@536uhfpf", "開版歪熊", "n19", "N19", 5)

# 武狀元 - 5
add("@075cocov", "武狀元", "n21", "N21", 5)

print(f"Total rows (including header): {len(rows)}")
print(f"Total links: {len(rows) - 1}")

with open('/tmp/links_values.json', 'w') as f:
    json.dump({"values": rows}, f, ensure_ascii=False)

print("Saved to /tmp/links_values.json")
