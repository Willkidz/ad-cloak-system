#!/usr/bin/env python3
"""優化3月消耗表：拿掉BM ID、新增權杖狀態欄、條件格式"""
import json
import subprocess

SPREADSHEET_ID = "1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I"
SHEET_ID = 5001  # 3月消耗的sheetId

# 現有欄位映射 (0-indexed):
# A(0): 人員
# B(1): 類型
# C(2): 落地頁
# D(3): TAG
# E(4): ads
# F(5): 素材名稱
# G(6): 廣告帳戶
# H(7): BM ID  ← 要刪掉
# I(8): 日消
# J(9): 卡
# K(10): 狀態  ← 改為「廣告狀態」
# L(11): 卡總充值
# M(12): 廣告總消耗
# N(13): 待付款
# O(14): 預付餘額 (Row1=日期)
# P(15): 總計 (Row1=日期)
# ...

requests = []

# Step 1: 刪除 BM ID 欄 (H欄, index=7)
requests.append({
    "deleteDimension": {
        "range": {
            "sheetId": SHEET_ID,
            "dimension": "COLUMNS",
            "startIndex": 7,
            "endIndex": 8
        }
    }
})

# 刪除H欄後，欄位重新映射:
# A(0): 人員
# B(1): 類型
# C(2): 落地頁
# D(3): TAG
# E(4): ads
# F(5): 素材名稱
# G(6): 廣告帳戶
# H(7): 日消 (原I)
# I(8): 卡 (原J)
# J(9): 狀態 (原K) ← 改header為「廣告狀態」
# K(10): 卡總充值 (原L)
# L(11): 廣告總消耗 (原M)
# M(12): 待付款 (原N)
# N(13): 預付餘額/日期 (原O)
# ...

# Step 2: 在原狀態欄(現在J欄, index=9)後面插入「權杖狀態」欄
requests.append({
    "insertDimension": {
        "range": {
            "sheetId": SHEET_ID,
            "dimension": "COLUMNS",
            "startIndex": 10,  # 在J(9)後面插入
            "endIndex": 11
        },
        "inheritFromBefore": True
    }
})

# 插入後欄位映射:
# J(9): 廣告狀態
# K(10): 權杖狀態 (新增)
# L(11): 卡總充值
# ...

# Step 3: 條件格式

# 3a: 廣告狀態 = "禁止刊登" → 整行灰底
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 2,
                "endRowIndex": 20,
                "startColumnIndex": 0,
                "endColumnIndex": 15
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$J3=\"禁止刊登\""}]
                },
                "format": {
                    "backgroundColor": {"red": 0.85, "green": 0.85, "blue": 0.85},
                    "textFormat": {
                        "foregroundColor": {"red": 0.5, "green": 0.5, "blue": 0.5}
                    }
                }
            }
        },
        "index": 0
    }
})

# 3b: 廣告狀態 = "審核中" → 整行黃底
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 2,
                "endRowIndex": 20,
                "startColumnIndex": 0,
                "endColumnIndex": 15
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$J3=\"審核中\""}]
                },
                "format": {
                    "backgroundColor": {"red": 1.0, "green": 0.95, "blue": 0.8}
                }
            }
        },
        "index": 1
    }
})

# 3c: 權杖狀態不是 "OK" 且不為空 → 紅底
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 2,
                "endRowIndex": 20,
                "startColumnIndex": 10,
                "endColumnIndex": 11
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=AND($K3<>\"OK\",$K3<>\"\")"}]
                },
                "format": {
                    "backgroundColor": {"red": 0.95, "green": 0.8, "blue": 0.8},
                    "textFormat": {
                        "bold": True,
                        "foregroundColor": {"red": 0.8, "green": 0.1, "blue": 0.1}
                    }
                }
            }
        },
        "index": 2
    }
})

# 3d: 權杖狀態 = "OK" → 綠字
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 2,
                "endRowIndex": 20,
                "startColumnIndex": 10,
                "endColumnIndex": 11
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$K3=\"OK\""}]
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

# 3e: 廣告狀態 = "進行中" → 綠字
requests.append({
    "addConditionalFormatRule": {
        "rule": {
            "ranges": [{
                "sheetId": SHEET_ID,
                "startRowIndex": 2,
                "endRowIndex": 20,
                "startColumnIndex": 9,
                "endColumnIndex": 10
            }],
            "booleanRule": {
                "condition": {
                    "type": "CUSTOM_FORMULA",
                    "values": [{"userEnteredValue": "=$J3=\"進行中\""}]
                },
                "format": {
                    "textFormat": {
                        "bold": True,
                        "foregroundColor": {"red": 0.1, "green": 0.6, "blue": 0.1}
                    }
                }
            }
        },
        "index": 4
    }
})

# Step 4: 廣告狀態下拉選單
requests.append({
    "setDataValidation": {
        "range": {
            "sheetId": SHEET_ID,
            "startRowIndex": 2,
            "endRowIndex": 20,
            "startColumnIndex": 9,
            "endColumnIndex": 10
        },
        "rule": {
            "condition": {
                "type": "ONE_OF_LIST",
                "values": [
                    {"userEnteredValue": "進行中"},
                    {"userEnteredValue": "審核中"},
                    {"userEnteredValue": "禁止刊登"},
                    {"userEnteredValue": "已死"}
                ]
            },
            "showCustomUi": True,
            "strict": False
        }
    }
})

# Step 5: 設定權杖狀態欄寬
requests.append({
    "updateDimensionProperties": {
        "range": {
            "sheetId": SHEET_ID,
            "dimension": "COLUMNS",
            "startIndex": 10,
            "endIndex": 11
        },
        "properties": {"pixelSize": 120},
        "fields": "pixelSize"
    }
})

# 執行
payload = json.dumps({"requests": requests}, ensure_ascii=False)
cmd = [
    'gws', 'sheets', 'spreadsheets', 'batchUpdate',
    '--params', json.dumps({"spreadsheetId": SPREADSHEET_ID}),
    '--json', payload
]

result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

if 'error' in result.stdout.lower():
    print(f"錯誤: {result.stdout[:500]}")
    print(f"stderr: {result.stderr[:300]}")
else:
    print("3月消耗表結構優化完成！")
    print("- 已刪除 BM ID 欄")
    print("- 已插入「權杖狀態」欄")
    print("- 已設定條件格式（禁止刊登灰底、審核中黃底、權杖異常紅底）")
    print("- 已設定廣告狀態下拉選單")
