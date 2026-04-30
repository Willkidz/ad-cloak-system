#!/usr/bin/env python3
"""處理素材檔名清單，生成素材紀錄表數據"""
import subprocess
import json
from collections import defaultdict

# 讀取並轉換檔案
result = subprocess.run(
    ['iconv', '-f', 'UTF-16LE', '-t', 'UTF-8', '/home/ubuntu/upload/filelist.txt'],
    capture_output=True, text=True
)
lines = [l.strip() for l in result.stdout.split('\n') if l.strip() and l.strip() != 'filelist.txt' and not l.startswith('\ufeff')]

# 解析每個檔名
materials = []
for line in lines:
    name = line.replace('.mp4', '').strip()
    if not name:
        continue
    
    parts = name.split('-', 2)  # YYMMDD-系列-角色[編號]
    if len(parts) >= 3:
        date_str = parts[0]
        series = parts[1]
        character = parts[2]
    elif len(parts) == 2:
        date_str = parts[0]
        series = parts[1]
        character = ''
    else:
        date_str = ''
        series = name
        character = ''
    
    # 轉換日期格式
    if len(date_str) == 6:
        yy = date_str[:2]
        mm = date_str[2:4]
        dd = date_str[4:6]
        formatted_date = f"20{yy}/{mm}/{dd}"
    else:
        formatted_date = date_str
    
    materials.append({
        'filename': line,
        'name': name,
        'date': formatted_date,
        'series': series,
        'character': character,
        'type': '影片'  # 全部是mp4
    })

# 去重：同一個素材名稱只保留一筆
seen = set()
unique_materials = []
for m in materials:
    if m['name'] not in seen:
        seen.add(m['name'])
        unique_materials.append(m)

# 按日期倒序排列（最新的在前）
unique_materials.sort(key=lambda x: x['date'], reverse=True)

# 統計
series_count = defaultdict(int)
char_count = defaultdict(int)
for m in unique_materials:
    series_count[m['series']] += 1
    if m['character']:
        # 去掉編號取角色名
        char_name = m['character'].rstrip('0123456789')
        char_count[char_name] += 1

print(f"總檔案數: {len(lines)}")
print(f"去重後素材數: {len(unique_materials)}")
print(f"\n系列統計:")
for s, c in sorted(series_count.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")
print(f"\n角色統計:")
for s, c in sorted(char_count.items(), key=lambda x: -x[1]):
    print(f"  {s}: {c}")

# 查看3月消耗表中已使用的素材
used_materials = {
    '260306-爆分-企鵝': 'AS01, AS03',
    '260305-爆分-企鵝02': 'AS02',
    '260305-爆分-企鵝': 'AS03, AS07',
    '260206-爆分-三寶': 'AS04',
    '260206-爆分-阿金': 'AS06',
    '註冊送20000': 'BF01',
    '新會員禮20000': 'BF02',
}

# 已知禁止刊登的素材
banned = {
    '260305-爆分-阿金02',
    '260305-爆分-阿金',
    '260304-爆分-阿金',
    '260303-爆分-阿金',
}

# 生成寫入Google Sheets的數據
# Header: 素材名稱 | 類型 | 首次上架 | 審核狀態 | 使用過的Code | 評價 | 備註
header = ['素材名稱', '類型', '首次上架', '系列', '角色', '審核狀態', '使用過的Code', '評價', '備註']

rows = [header]
for m in unique_materials:
    name = m['name']
    
    # 判斷審核狀態
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
    
    # 角色名去掉編號
    char_name = m['character'].rstrip('0123456789') if m['character'] else ''
    
    rows.append([
        name,
        m['type'],
        m['date'],
        m['series'],
        char_name,
        status,
        code,
        '',  # 評價 - 手動填
        note
    ])

# 輸出為JSON供後續使用
output = {
    'total': len(unique_materials),
    'rows': rows
}

with open('/home/ubuntu/material_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n已生成 {len(rows)-1} 筆素材紀錄數據")
print(f"已保存到 /home/ubuntu/material_data.json")
