#!/usr/bin/env python3
"""將素材紀錄寫入Google Sheets - v2 使用正確語法"""
import json
import subprocess
import time

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"

with open('/home/ubuntu/material_data.json') as f:
    data = json.load(f)

rows = data['rows']
total = len(rows)

# 分批寫入（每批100行）
batch_size = 100
for i in range(0, total, batch_size):
    batch = rows[i:i+batch_size]
    start_row = i + 1
    end_row = i + len(batch)
    range_str = f"素材紀錄!A{start_row}:I{end_row}"
    
    payload = {
        "range": range_str,
        "majorDimension": "ROWS",
        "values": batch
    }
    
    # 寫入臨時JSON檔案
    payload_file = f"/tmp/batch_{i}.json"
    with open(payload_file, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False)
    
    # 讀取檔案內容作為 --json 參數
    with open(payload_file, 'r', encoding='utf-8') as f:
        json_str = f.read()
    
    params = json.dumps({
        "spreadsheetId": SPREADSHEET_ID,
        "range": range_str,
        "valueInputOption": "USER_ENTERED"
    })
    
    cmd = [
        'gws', 'sheets', 'spreadsheets', 'values', 'update',
        '--params', params,
        '--json', json_str
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    
    if 'error' in result.stdout.lower() or result.returncode != 0:
        print(f"批次 {i//batch_size + 1} 錯誤: {result.stdout[:200]} {result.stderr[:200]}")
    else:
        print(f"批次 {i//batch_size + 1}: 行 {start_row}-{end_row} 完成")
    
    subprocess.run(['rm', '-f', payload_file])
    time.sleep(0.5)  # 避免 rate limit

print(f"\n完成！共寫入 {total-1} 筆素材紀錄")
