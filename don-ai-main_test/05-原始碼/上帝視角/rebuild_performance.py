#!/usr/bin/env python3
"""重建成效儀表板：今日/昨日/近3天 三個維度"""
import json
import subprocess

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"
SHEET_ID = 5002  # 成效表的sheetId

# 活躍的廣告代碼（從3月消耗表）
active_codes = ['N2001', 'BF01', 'AS01', 'AS02', 'AS03', 'AS04', 'AS05', 'AS06', 'BF02']
code_materials = {
    'N2001': '註冊送20000',
    'BF01': '',
    'AS01': '260306-爆分-企鵝',
    'AS02': '260305-爆分-企鵝02',
    'AS03': '260305-爆分-企鵝',
    'AS04': '260206-爆分-三寶',
    'AS05': '',
    'AS06': '260206-爆分-阿金',
    'BF02': '新會員禮20000',
}

# Step 1: 清空成效表
print("Step 1: 清空成效表...")
subprocess.run([
    'gws', 'sheets', 'spreadsheets', 'values', 'clear',
    '--params', json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": "成效!A1:Z60"}),
    '--json', '{}'
], capture_output=True, text=True, timeout=15)

# Step 2: 寫入新的儀表板結構
# 設計：
# Row 1: 標題
# Row 2: 最後更新時間
# Row 3: 空行
# Row 4: Header - 合併標題行
# Row 5: Header - 子欄位
# Row 6+: 數據行

header_row1 = ['廣告成效儀表板', '', '', '', '今日', '', '', '', '昨日', '', '', '', '近3天', '', '', '', '系統校準']
header_row2 = ['廣告代碼', '素材名稱', '廣告狀態', '權杖狀態', 
               '消耗', '手動添加', '添加成本', '',
               '消耗', '手動添加', '添加成本', '',
               '消耗', '手動添加', '添加成本', '',
               '系統抓取', '準確率']

# 數據行（初始為空，由n8n自動填入消耗和系統抓取）
data_rows = []
for i, code in enumerate(active_codes):
    row_num = i + 6  # 從第6行開始
    material = code_materials.get(code, '')
    # 添加成本公式: =IF(F{n}>0, E{n}/F{n}, "")
    today_cost = f'=IF(F{row_num}>0, E{row_num}/F{row_num}, "")'
    yesterday_cost = f'=IF(J{row_num}>0, I{row_num}/J{row_num}, "")'
    three_day_cost = f'=IF(N{row_num}>0, M{row_num}/N{row_num}, "")'
    # 準確率公式: =IF(F{n}>0, Q{n}/F{n}, "")
    accuracy = f'=IF(F{row_num}>0, Q{row_num}/F{row_num}, "")'
    
    data_rows.append([
        code,           # A: 廣告代碼
        material,       # B: 素材名稱
        '',             # C: 廣告狀態 (n8n填)
        '',             # D: 權杖狀態 (n8n填)
        '',             # E: 今日消耗 (n8n填)
        '',             # F: 今日手動添加 (手動填)
        today_cost,     # G: 今日添加成本 (公式)
        '',             # H: 空白分隔
        '',             # I: 昨日消耗 (n8n填)
        '',             # J: 昨日手動添加 (手動填)
        yesterday_cost, # K: 昨日添加成本 (公式)
        '',             # L: 空白分隔
        '',             # M: 近3天消耗 (n8n填)
        '',             # N: 近3天手動添加 (手動填)
        three_day_cost, # O: 近3天添加成本 (公式)
        '',             # P: 空白分隔
        '',             # Q: 系統抓取 (n8n填)
        accuracy,       # R: 準確率 (公式)
    ])

# 組合所有行
all_rows = [
    ['廣告成效儀表板', '', '', '', '', f'最後更新:'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    header_row1,
    header_row2,
] + data_rows

# 寫入數據
print("Step 2: 寫入新儀表板結構...")
total_rows = len(all_rows)
range_str = f"成效!A1:R{total_rows}"
payload = json.dumps({
    "range": range_str,
    "majorDimension": "ROWS",
    "values": all_rows
}, ensure_ascii=False)

result = subprocess.run([
    'gws', 'sheets', 'spreadsheets', 'values', 'update',
    '--params', json.dumps({
        "spreadsheetId": SPREADSHEET_ID,
        "range": range_str,
        "valueInputOption": "USER_ENTERED"
    }),
    '--json', payload
], capture_output=True, text=True, timeout=30)

if 'error' in result.stdout.lower():
    print(f"寫入錯誤: {result.stdout[:300]}")
else:
    print(f"  寫入 {total_rows} 行完成")

# Step 3: 格式化
print("Step 3: 設定格式...")
format_requests = []

# 3a: 合併標題行的區域標題
# 今日: E4:G4
format_requests.append({
    "mergeCells": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": 4, "endColumnIndex": 7},
        "mergeType": "MERGE_ALL"
    }
})
# 昨日: I4:K4
format_requests.append({
    "mergeCells": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": 8, "endColumnIndex": 11},
        "mergeType": "MERGE_ALL"
    }
})
# 近3天: M4:O4
format_requests.append({
    "mergeCells": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": 12, "endColumnIndex": 15},
        "mergeType": "MERGE_ALL"
    }
})
# 系統校準: Q4:R4
format_requests.append({
    "mergeCells": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": 16, "endColumnIndex": 18},
        "mergeType": "MERGE_ALL"
    }
})

# 3b: 標題行格式
# Row 1 標題
format_requests.append({
    "repeatCell": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": 1},
        "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 14}}},
        "fields": "userEnteredFormat(textFormat)"
    }
})

# Row 4 區域標題（今日/昨日/近3天）
for col_start, col_end, r, g, b in [
    (4, 7, 0.85, 0.92, 1.0),    # 今日 - 淺藍
    (8, 11, 0.9, 0.95, 0.85),   # 昨日 - 淺綠
    (12, 15, 1.0, 0.95, 0.85),  # 近3天 - 淺橘
    (16, 18, 0.92, 0.92, 0.92), # 系統校準 - 淺灰
]:
    format_requests.append({
        "repeatCell": {
            "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": col_start, "endColumnIndex": col_end},
            "cell": {"userEnteredFormat": {
                "textFormat": {"bold": True},
                "backgroundColor": {"red": r, "green": g, "blue": b},
                "horizontalAlignment": "CENTER"
            }},
            "fields": "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)"
        }
    })

# Row 5 子header
format_requests.append({
    "repeatCell": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 4, "endRowIndex": 5, "startColumnIndex": 0, "endColumnIndex": 18},
        "cell": {"userEnteredFormat": {
            "textFormat": {"bold": True, "fontSize": 9},
            "backgroundColor": {"red": 0.95, "green": 0.95, "blue": 0.95},
            "horizontalAlignment": "CENTER"
        }},
        "fields": "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)"
    }
})

# 3c: 凍結前5行
format_requests.append({
    "updateSheetProperties": {
        "properties": {
            "sheetId": SHEET_ID,
            "gridProperties": {
                "frozenRowCount": 5
            }
        },
        "fields": "gridProperties.frozenRowCount"
    }
})

# 3d: 欄寬
widths = {0: 90, 1: 180, 2: 80, 3: 100, 4: 80, 5: 80, 6: 80, 7: 15, 8: 80, 9: 80, 10: 80, 11: 15, 12: 80, 13: 80, 14: 80, 15: 15, 16: 80, 17: 80}
for col, w in widths.items():
    format_requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": SHEET_ID, "dimension": "COLUMNS", "startIndex": col, "endIndex": col + 1},
            "properties": {"pixelSize": w},
            "fields": "pixelSize"
        }
    })

# 3e: 添加成本欄的數字格式（整數）
for col in [6, 10, 14]:  # G, K, O 欄
    format_requests.append({
        "repeatCell": {
            "range": {"sheetId": SHEET_ID, "startRowIndex": 5, "endRowIndex": 15, "startColumnIndex": col, "endColumnIndex": col + 1},
            "cell": {"userEnteredFormat": {"numberFormat": {"type": "NUMBER", "pattern": "#,##0"}}},
            "fields": "userEnteredFormat.numberFormat"
        }
    })

# 3f: 準確率欄的百分比格式
format_requests.append({
    "repeatCell": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 5, "endRowIndex": 15, "startColumnIndex": 17, "endColumnIndex": 18},
        "cell": {"userEnteredFormat": {"numberFormat": {"type": "PERCENT", "pattern": "0%"}}},
        "fields": "userEnteredFormat.numberFormat"
    }
})

# 3g: 條件格式 - 添加成本最低的標綠
for col in [6, 10, 14]:
    format_requests.append({
        "addConditionalFormatRule": {
            "rule": {
                "ranges": [{"sheetId": SHEET_ID, "startRowIndex": 5, "endRowIndex": 15, "startColumnIndex": col, "endColumnIndex": col + 1}],
                "gradientRule": {
                    "minpoint": {"color": {"red": 0.7, "green": 0.95, "blue": 0.7}, "type": "MIN"},
                    "maxpoint": {"color": {"red": 0.95, "green": 0.8, "blue": 0.8}, "type": "MAX"}
                }
            },
            "index": 0
        }
    })

# 執行格式化
payload = json.dumps({"requests": format_requests}, ensure_ascii=False)
result = subprocess.run([
    'gws', 'sheets', 'spreadsheets', 'batchUpdate',
    '--params', json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    '--json', payload
], capture_output=True, text=True, timeout=30)

if 'error' in result.stdout.lower():
    print(f"格式化錯誤: {result.stdout[:500]}")
else:
    print("成效儀表板格式化完成！")
    print("- 區域標題合併（今日/昨日/近3天/系統校準）")
    print("- 顏色區分（藍/綠/橘/灰）")
    print("- 凍結前5行+前2欄")
    print("- 添加成本漸層色（低=綠, 高=紅）")
    print("- 準確率百分比格式")

print("\n成效儀表板重建完成！")
