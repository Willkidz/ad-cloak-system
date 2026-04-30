#!/usr/bin/env python3
"""為素材紀錄表設定條件格式、凍結窗格、欄寬"""
import json
import subprocess

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"
SHEET_ID = 1079837701  # 素材紀錄的sheetId

requests = []

# 1. 凍結第一行（header）
requests.append({
    "updateSheetProperties": {
        "properties": {
            "sheetId": SHEET_ID,
            "gridProperties": {
                "frozenRowCount": 1
            }
        },
        "fields": "gridProperties.frozenRowCount"
    }
})

# 2. 設定欄寬
col_widths = {
    0: 250,  # A: 素材名稱
    1: 60,   # B: 類型
    2: 100,  # C: 首次上架
    3: 80,   # D: 系列
    4: 80,   # E: 角色
    5: 90,   # F: 審核狀態
    6: 120,  # G: 使用過的Code
    7: 60,   # H: 評價
    8: 150,  # I: 備註
}
for col, width in col_widths.items():
    requests.append({
        "updateDimensionProperties": {
            "range": {
                "sheetId": SHEET_ID,
                "dimension": "COLUMNS",
                "startIndex": col,
                "endIndex": col + 1
            },
            "properties": {"pixelSize": width},
            "fields": "pixelSize"
        }
    })

# 3. Header 格式（粗體、灰底）
requests.append({
    "repeatCell": {
        "range": {
            "sheetId": SHEET_ID,
            "startRowIndex": 0,
            "endRowIndex": 1,
            "startColumnIndex": 0,
            "endColumnIndex": 9
        },
        "cell": {
            "userEnteredFormat": {
                "textFormat": {"bold": True},
                "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 0.9},
                "horizontalAlignment": "CENTER"
            }
        },
        "fields": "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)"
    }
})

# 4. 條件格式：審核狀態 = "禁止刊登" → 整行灰底
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 1,
                "endRowIndex": 900,
                "startColumnIndex": 0,
                "endColumnIndex": 9
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$F2=\"禁止刊登\""}]
                },
                "format": {
                    "backgroundColor": {"red": 0.85, "green": 0.85, "blue": 0.85},
                    "textFormat": {
                        "strikethrough": True,
                        "foregroundColor": {"red": 0.6, "green": 0.6, "blue": 0.6}
                    }
                }
            }
        },
        "index": 0
    }
})

# 5. 條件格式：備註 = "秒死" → 紅字
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 1,
                "endRowIndex": 900,
                "startColumnIndex": 8,
                "endColumnIndex": 9
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$I2=\"秒死\""}]
                },
                "format": {
                    "textFormat": {
                        "bold": True,
                        "foregroundColor": {"red": 0.8, "green": 0.1, "blue": 0.1}
                    }
                }
            }
        },
        "index": 1
    }
})

# 6. 條件格式：評價 = "好" → 綠底
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 1,
                "endRowIndex": 900,
                "startColumnIndex": 0,
                "endColumnIndex": 9
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$H2=\"好\""}]
                },
                "format": {
                    "backgroundColor": {"red": 0.85, "green": 0.95, "blue": 0.85}
                }
            }
        },
        "index": 2
    }
})

# 7. 條件格式：審核狀態 = "通過" → 狀態欄綠字
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 1,
                "endRowIndex": 900,
                "startColumnIndex": 5,
                "endColumnIndex": 6
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$F2=\"通過\""}]
                },
                "format": {
                    "textFormat": {
                        "bold": True,
                        "foregroundColor": {"red": 0.1, "green": 0.6, "blue": 0.1}
                    }
                }
            }
        },
        "index": 3
    }
})

# 8. 資料驗證：審核狀態下拉選單
requests.append({
    "setDataValidation": {
        "range": {
            "sheetId": SHEET_ID,
            "startRowIndex": 1,
            "endRowIndex": 900,
            "startColumnIndex": 5,
            "endColumnIndex": 6
        },
        "rule": {
            "condition": {
                "type": "ONE_OF_LIST",
                "values": [
                    {"userEnteredValue": "通過"},
                    {"userEnteredValue": "禁止刊登"},
                    {"userEnteredValue": "秒死"},
                    {"userEnteredValue": "未使用"}
                ]
            },
            "showCustomUi": True,
            "strict": False
        }
    }
})

# 9. 資料驗證：評價下拉選單
requests.append({
    "setDataValidation": {
        "range": {
            "sheetId": SHEET_ID,
            "startRowIndex": 1,
            "endRowIndex": 900,
            "startColumnIndex": 7,
            "endColumnIndex": 8
        },
        "rule": {
            "condition": {
                "type": "ONE_OF_LIST",
                "values": [
                    {"userEnteredValue": "好"},
                    {"userEnteredValue": "普通"},
                    {"userEnteredValue": "差"}
                ]
            },
            "showCustomUi": True,
            "strict": False
        }
    }
})

# 執行 batchUpdate
payload = json.dumps({"requests": requests}, ensure_ascii=False)

cmd = [
    'gws', 'sheets', 'spreadsheets', 'batchUpdate',
    '--params', json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    '--json', payload
]

result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

if 'error' in result.stdout.lower():
    print(f"錯誤: {result.stdout[:500]}")
else:
    print("素材紀錄表格式化完成！")
    print("- 凍結第一行")
    print("- 設定欄寬")
    print("- Header 粗體灰底")
    print("- 條件格式：禁止刊登→灰底刪除線、秒死→紅字、評價好→綠底、通過→綠字")
    print("- 下拉選單：審核狀態、評價")
