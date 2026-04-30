#!/usr/bin/env python3
"""將素材紀錄寫入Google Sheets"""
import json
import subprocess

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"
SHEET_NAME = "素材紀錄"
SHEET_ID = 1079837701

with open('/home/ubuntu/material_data.json') as f:
    data = json.load(f)

rows = data['rows']
total = len(rows)  # 包含header

# Step 1: 清空現有素材紀錄表
print(f"Step 1: 清空現有素材紀錄表...")
clear_cmd = f"""gws sheets spreadsheets values clear --params '{{"spreadsheetId": "{SPREADSHEET_ID}", "range": "素材紀錄!A1:Z1000"}}' --json '{{}}'"""
result = subprocess.run(clear_cmd, shell=True, capture_output=True, text=True)
print(f"  清空結果: {result.stdout[:200]}")

# Step 2: 分批寫入（每批200行，避免超出API限制）
batch_size = 200
for i in range(0, total, batch_size):
    batch = rows[i:i+batch_size]
    start_row = i + 1
    end_row = i + len(batch)
    range_str = f"素材紀錄!A{start_row}:I{end_row}"
    
    payload = json.dumps({
        "range": range_str,
        "majorDimension": "ROWS",
        "values": batch
    }, ensure_ascii=False)
    
    # 寫入到臨時檔案避免shell轉義問題
    payload_file = f"/home/ubuntu/batch_{i}.json"
    with open(payload_file, 'w', encoding='utf-8') as f:
        f.write(payload)
    
    cmd = f"""gws sheets spreadsheets values update --params '{{"spreadsheetId": "{SPREADSHEET_ID}", "range": "{range_str}", "valueInputOption": "USER_ENTERED"}}' --json @{payload_file}"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if 'error' in result.stdout.lower():
        print(f"  批次 {i//batch_size + 1} 錯誤: {result.stdout[:300]}")
    else:
        print(f"  批次 {i//batch_size + 1}: 寫入行 {start_row}-{end_row} 完成")
    
    # 清理臨時檔案
    subprocess.run(f"rm -f {payload_file}", shell=True)

print(f"\n素材紀錄表寫入完成！共 {total-1} 筆素材")
