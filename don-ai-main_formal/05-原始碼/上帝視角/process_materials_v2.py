#!/usr/bin/env python3
"""處理素材檔名清單，生成素材紀錄表數據 v2 - 修正解析"""
import subprocess
import json
from collections import defaultdict

# 讀取並轉換檔案
result = subprocess.run(
    ['iconv', '-f', 'UTF-16LE', '-t', 'UTF-8', '/home/ubuntu/upload/filelist.txt'],
    capture_output=True, text=True
)
raw_lines = [l.strip().replace('\ufeff','') for l in result.stdout.split('\n') if l.strip()]
lines = [l for l in raw_lines if l and l != 'filelist.txt']

# 解析每個檔名
# 格式: YYMMDD-系列名-角色名[編號].mp4
# 但有些檔名可能有空格，例如 "250709 剋星-卡特.mp4"
materials = []
for line in lines:
    name = line.replace('.mp4', '').strip()
    if not name:
        continue
    
    # 先處理日期部分（前6個字元）
    # 有些用 - 分隔，有些用空格
    clean_name = name.replace(' ', '-')  # 統一用 - 分隔
    
    parts = clean_name.split('-')
    
    if len(parts) >= 3:
        date_str = parts[0]
        series = parts[1]
        character = '-'.join(parts[2:])  # 處理角色名中可能有 - 的情況
    elif len(parts) == 2:
        date_str = parts[0]
        series = parts[1]
        character = ''
    else:
        date_str = ''
        series = name
        character = ''
    
    # 轉換日期格式
    if len(date_str) == 6 and date_str.isdigit():
        yy = date_str[:2]
        mm = date_str[2:4]
        dd = date_str[4:6]
        formatted_date = f"20{yy}/{mm}/{dd}"
    else:
        formatted_date = ''
    
    # 角色名去掉末尾數字（編號）
    char_base = character.rstrip('0123456789') if character else ''
    
    materials.append({
        'filename': line,
        'name': name,
        'date': formatted_date,
        'series': series,
        'character': character,
        'char_base': char_base,
        'type': '影片'
    })

# 去重
seen = set()
unique_materials = []
for m in materials:
    if m['name'] not in seen:
        seen.add(m['name'])
        unique_materials.append(m)

# 按日期倒序
unique_materials.sort(key=lambda x: x['date'] if x['date'] else '0', reverse=True)

# 統計
series_count = defaultdict(int)
char_count = defaultdict(int)
for m in unique_materials:
    series_count[m['series']] += 1
    if m['char_base']:
        char_count[m['char_base']] += 1

print(f"總檔案數: {len(lines)}")
print(f"去重後素材數: {len(unique_materials)}")
print(f"\n系列統計:")
for s, c in sorted(series_count.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")
print(f"\n角色統計:")
for s, c in sorted(char_count.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")

# 已知使用中的素材（從3月消耗表）
used_materials = {
    '260306-爆分-企鵝': 'AS01, AS03',
    '260305-爆分-企鵝02': 'AS02',
    '260305-爆分-企鵝': 'AS03',
    '260206-爆分-三寶': 'AS04',
    '260206-爆分-阿金': 'AS06',
    '註冊送20000': 'BF01',
    '新會員禮20000': 'BF02',
}

# 已知禁止刊登
banned = {
    '260305-爆分-阿金02',
    '260305-爆分-阿金',
    '260304-爆分-阿金',
    '260303-爆分-阿金',
}

# 生成 Google Sheets 數據
header = ['素材名稱', '類型', '首次上架', '系列', '角色', '審核狀態', '使用過的Code', '評價', '備註']
rows = [header]

for m in unique_materials:
    name = m['name']
    if name in banned:
        status = '禁止刊登'
        note = '秒死'
    elif name in used_materials:
        status = '通過'
        note = ''
    else:
        status = '未使用'
        note = ''
    
    code = used_materials.get(name, '')
    
    rows.append([
        name,
        m['type'],
        m['date'],
        m['series'],
        m['char_base'],
        status,
        code,
        '',  # 評價
        note
    ])

output = {'total': len(unique_materials), 'rows': rows}
with open('/home/ubuntu/material_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

# 驗證前10筆
print(f"\n前10筆數據:")
for row in rows[1:11]:
    print(f"  {row[0]} | {row[2]} | {row[3]} | {row[4]} | {row[5]}")

print(f"\n已生成 {len(rows)-1} 筆素材紀錄")
