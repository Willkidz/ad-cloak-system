import json

rows = [["分組", "LINE帳號", "LINE名稱", "tag", "code", "廣告鏈結"]]

def add(group, line_id, line_name, tag, prefix, count):
    for i in range(1, count + 1):
        code = f"{prefix}{i:02d}"
        grp = f"{group}{i:02d}" if group else ""
        url = f"https://{tag}.freshpathlab.com/?a={code}"
        rows.append([grp, line_id, line_name, tag, code, url])

# 獨角仙 AX01~AX10 (4 LINE: MX, CX, JX, LX)
for i in range(1, 11):
    grp = f"AX{i:02d}"
    for prefix, tag, line_id, line_name in [
        ("MX", "mx", "@525euwsy", "獨角仙AI預測系統"),
        ("CX", "cx", "@697jsdma", "獨角仙AI算牌系統"),
        ("JX", "jx", "@652ahjmy", "獨角仙AI算牌程式"),
        ("LX", "lx", "@128hxyvp", "獨角仙AI預測程式"),
    ]:
        code = f"{prefix}{i:02d}"
        url = f"https://{tag}.freshpathlab.com/?a={code}"
        rows.append([grp, line_id, line_name, tag, code, url])

# 莊家剋星 AB01~AB10 (4 LINE: MB, CB, JB, LB)
for i in range(1, 11):
    grp = f"AB{i:02d}"
    for prefix, tag, line_id, line_name in [
        ("MB", "mb", "@734xzzse", "莊家剋星-百家打莊姬"),
        ("CB", "cb", "@bn56", "莊家剋星-百家殺手"),
        ("JB", "jb", "@448nzdkf", "莊家剋星-百家專家"),
        ("LB", "lb", "@bn58", "莊家剋星-百家GPT"),
    ]:
        code = f"{prefix}{i:02d}"
        url = f"https://{tag}.freshpathlab.com/?a={code}"
        rows.append([grp, line_id, line_name, tag, code, url])

# 爆分王 AS01~AS10 (4 LINE: MS, CS, JS, LS)
for i in range(1, 11):
    grp = f"AS{i:02d}"
    for prefix, tag, line_id, line_name in [
        ("MS", "ms", "@001qlmgf", "爆分王-電子打法訊號"),
        ("CS", "cs", "@999hqlmk", "爆分王-電子訊號程式"),
        ("JS", "js", "@935bicyi", "爆分王-電子打法秘笈"),
        ("LS", "ls", "@849rldxt", "爆分王-24H訊號打法"),
    ]:
        code = f"{prefix}{i:02d}"
        url = f"https://{tag}.freshpathlab.com/?a={code}"
        rows.append([grp, line_id, line_name, tag, code, url])

# 博富 - 單LINE，每個自成一組
for i in range(1, 11):
    code = f"BF{i:02d}"
    url = f"https://bf.freshpathlab.com/?a={code}"
    rows.append([code, "@678eohsd", "博富 BOFU", "bf", code, url])

# 兩斤炭吉 - 5
for i in range(1, 6):
    code = f"JD{i:02d}"
    url = f"https://jd.freshpathlab.com/?a={code}"
    rows.append([code, "@520ufhmw", "兩斤炭吉", "jd", code, url])

# 蘇主金 - 5
for i in range(1, 6):
    code = f"N20{i:02d}"
    url = f"https://n20.freshpathlab.com/?a={code}"
    rows.append([code, "@348ikfwm", "蘇主金", "n20", code, url])

# 蕭甘丹 - 5
for i in range(1, 6):
    code = f"N18{i:02d}"
    url = f"https://n18.freshpathlab.com/?a={code}"
    rows.append([code, "@013rgbjl", "電子蕭甘丹", "n18", code, url])

# 洪金豹 - 5
for i in range(1, 6):
    code = f"N14{i:02d}"
    url = f"https://n14.freshpathlab.com/?a={code}"
    rows.append([code, "@416nbqjl", "洪金豹", "n14", code, url])

# 阿奇體育 - 5
for i in range(1, 6):
    code = f"N22{i:02d}"
    url = f"https://n22.freshpathlab.com/?a={code}"
    rows.append([code, "@659jgxlp", "阿奇說球", "n22", code, url])

# 開版歪歪熊 - 5
for i in range(1, 6):
    code = f"N15{i:02d}"
    url = f"https://n15.freshpathlab.com/?a={code}"
    rows.append([code, "@745jaffa", "開版歪歪熊", "n15", code, url])

# 晴兒 - 5
for i in range(1, 6):
    code = f"N16{i:02d}"
    url = f"https://n16.freshpathlab.com/?a={code}"
    rows.append([code, "@751tggmd", "晴兒", "n16", code, url])

# 郝士多 - 5
for i in range(1, 6):
    code = f"N17{i:02d}"
    url = f"https://n17.freshpathlab.com/?a={code}"
    rows.append([code, "@106tndmh", "郝士多", "n17", code, url])

# 開版歪熊 - 5
for i in range(1, 6):
    code = f"N19{i:02d}"
    url = f"https://n19.freshpathlab.com/?a={code}"
    rows.append([code, "@536uhfpf", "開版歪熊", "n19", code, url])

# 武狀元 - 5
for i in range(1, 6):
    code = f"N21{i:02d}"
    url = f"https://n21.freshpathlab.com/?a={code}"
    rows.append([code, "@075cocov", "武狀元", "n21", code, url])

print(f"Total rows (including header): {len(rows)}")
print(f"Total links: {len(rows) - 1}")

# 驗證分組
groups = {}
for r in rows[1:]:
    g = r[0]
    if g not in groups:
        groups[g] = []
    groups[g].append(r[4])

print(f"\nSample groups:")
for g in ["AX01", "AB01", "AS01", "AX10"]:
    if g in groups:
        print(f"  {g}: {groups[g]}")

with open('/tmp/links_v2.json', 'w') as f:
    json.dump({"values": rows}, f, ensure_ascii=False)
