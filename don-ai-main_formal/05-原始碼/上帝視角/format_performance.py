#!/usr/bin/env python3
"""格式化成效儀表板"""
import json
import subprocess

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"
SHEET_ID = 5002

format_requests = []

# 合併標題行
for cs, ce in [(4,7), (8,11), (12,15), (16,18)]:
    format_requests.append({
        "mergeCells": {
            "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": cs, "endColumnIndex": ce},
            "mergeType": "MERGE_ALL"
        }
    })

# Row 1 標題
format_requests.append({
    "repeatCell": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": 1},
        "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 14}}},
        "fields": "userEnteredFormat(textFormat)"
    }
})

# Row 4 區域標題顏色
for cs, ce, r, g, b in [
    (4, 7, 0.85, 0.92, 1.0),
    (8, 11, 0.9, 0.95, 0.85),
    (12, 15, 1.0, 0.95, 0.85),
    (16, 18, 0.92, 0.92, 0.92),
]:
    format_requests.append({
        "repeatCell": {
            "range": {"sheetId": SHEET_ID, "startRowIndex": 3, "endRowIndex": 4, "startColumnIndex": cs, "endColumnIndex": ce},
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

# 凍結前5行
format_requests.append({
    "updateSheetProperties": {
        "properties": {
            "sheetId": SHEET_ID,
            "gridProperties": {"frozenRowCount": 5}
        },
        "fields": "gridProperties.frozenRowCount"
    }
})

# 欄寬
widths = {0: 90, 1: 180, 2: 80, 3: 100, 4: 80, 5: 80, 6: 80, 7: 15, 8: 80, 9: 80, 10: 80, 11: 15, 12: 80, 13: 80, 14: 80, 15: 15, 16: 80, 17: 80}
for col, w in widths.items():
    format_requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": SHEET_ID, "dimension": "COLUMNS", "startIndex": col, "endIndex": col + 1},
            "properties": {"pixelSize": w},
            "fields": "pixelSize"
        }
    })

# 添加成本欄整數格式
for col in [6, 10, 14]:
    format_requests.append({
        "repeatCell": {
            "range": {"sheetId": SHEET_ID, "startRowIndex": 5, "endRowIndex": 15, "startColumnIndex": col, "endColumnIndex": col + 1},
            "cell": {"userEnteredFormat": {"numberFormat": {"type": "NUMBER", "pattern": "#,##0"}}},
            "fields": "userEnteredFormat.numberFormat"
        }
    })

# 準確率百分比格式
format_requests.append({
    "repeatCell": {
        "range": {"sheetId": SHEET_ID, "startRowIndex": 5, "endRowIndex": 15, "startColumnIndex": 17, "endColumnIndex": 18},
        "cell": {"userEnteredFormat": {"numberFormat": {"type": "PERCENT", "pattern": "0%"}}},
        "fields": "userEnteredFormat.numberFormat"
    }
})

# 添加成本漸層色
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

payload = json.dumps({"requests": format_requests}, ensure_ascii=False)
result = subprocess.run([
    'gws', 'sheets', 'spreadsheets', 'batchUpdate',
    '--params', json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    '--json', payload
], capture_output=True, text=True, timeout=30)

if 'error' in result.stdout.lower():
    print(f"錯誤: {result.stdout[:500]}")
else:
    print("成效儀表板格式化完成！")
