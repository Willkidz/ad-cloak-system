import json
import os
import re

OLD_AD_CONFIG_ID = 'ICxZmq8e0vPZHX5j'
NEW_AD_CONFIG_ID = 'vILi9V1mv3ouo6EM'

# ============================================================
# 1. 修改 Config API - 更新 ad_config DataTable ID
# ============================================================
print("=== 1. 修改 Config API ===")
with open('/tmp/wf_config_api.json') as f:
    wf_config = json.load(f)

for node in wf_config['nodes']:
    if node['name'] == 'Build Config':
        old_code = node['parameters']['jsCode']
        new_code = old_code.replace(OLD_AD_CONFIG_ID, NEW_AD_CONFIG_ID)
        node['parameters']['jsCode'] = new_code
        if OLD_AD_CONFIG_ID in old_code:
            print(f"  ✓ Build Config: 已將 ad_config ID 從 {OLD_AD_CONFIG_ID} 更新為 {NEW_AD_CONFIG_ID}")
        else:
            print(f"  ! Build Config: 未找到舊 ID，可能已經更新過")

with open('/tmp/wf_config_api_new.json', 'w') as f:
    json.dump(wf_config, f, ensure_ascii=False)
print(f"  → 已儲存到 /tmp/wf_config_api_new.json")

# ============================================================
# 2. 修改 Token Attribution System
# ============================================================
print("\n=== 2. 修改 Token Attribution System ===")
with open('/tmp/wf_token.json') as f:
    wf_token = json.load(f)

for node in wf_token['nodes']:
    # 2a. 停用 Reply to LINE User 節點
    if node['name'] == 'Reply to LINE User':
        node['disabled'] = True
        print("  ✓ Reply to LINE User: 已停用（disabled=True）")
    
    # 2b. Save Token Match Event - 移除 padStart，直接存完整 code
    if node['name'] == 'Save Token Match Event':
        # 檢查 columns mapping 中的 project 欄位
        columns = node.get('parameters', {}).get('columns', {})
        value_map = columns.get('value', {})
        if 'project' in value_map:
            old_val = value_map['project']
            # 改為直接存 ad_code，不做任何轉換
            value_map['project'] = "={{ $('Match Token Data').first().json.ad_code }}"
            print(f"  ✓ Save Token Match Event: project 欄位已改為直接存 ad_code（不再 padStart）")
            print(f"    舊值: {old_val}")
            print(f"    新值: {value_map['project']}")

with open('/tmp/wf_token_new.json', 'w') as f:
    json.dump(wf_token, f, ensure_ascii=False)
print(f"  → 已儲存到 /tmp/wf_token_new.json")

# ============================================================
# 3. 修改 Sheets Report - Calculate Stats
# ============================================================
print("\n=== 3. 修改 Sheets Report - Calculate Stats ===")
with open('/tmp/wf_sheets.json') as f:
    wf_sheets = json.load(f)

for node in wf_sheets['nodes']:
    if node['name'] == 'Calculate Stats':
        old_code = node['parameters']['jsCode']
        
        # 3a. 移除所有 padStart(2, '0') 補零邏輯
        # 找到所有 padStart 的使用
        padstart_count = old_code.count('padStart')
        
        # 替換 code 相關的 padStart
        # 模式1: String(row[8] || '').padStart(2, '0')  → String(row[8] || '')
        new_code = old_code.replace(
            "String(row[8] || '').padStart(2, '0')",
            "String(row[8] || '').trim()"
        )
        # 模式2: String(row[0]).padStart(2, '0')  → String(row[0]).trim()
        new_code = new_code.replace(
            "String(row[0]).padStart(2, '0')",
            "String(row[0]).trim()"
        )
        # 模式3: evt.project ? String(evt.project).padStart(2, '0') : ''
        new_code = new_code.replace(
            "String(evt.project).padStart(2, '0')",
            "String(evt.project).trim()"
        )
        
        new_padstart_count = new_code.count('padStart')
        print(f"  ✓ padStart 替換: {padstart_count} → {new_padstart_count} 處")
        
        # 3b. 移除自動填寫廣告帳戶ID和人員的邏輯
        # 在 perfRows 構建中，將 info.accountId 和 info.person 改為空字串
        # 找到 perfRows 的構建邏輯
        new_code = new_code.replace(
            "info.accountId || '',           // B: 廣告帳戶ID",
            "'',                             // B: 廣告帳戶ID（手動維護）"
        )
        new_code = new_code.replace(
            "info.person || '',              // C: 人員",
            "'',                             // C: 人員（已移除，code 本身包含資訊）"
        )
        new_code = new_code.replace(
            "info.material || '',            // E: 素材名稱",
            "'',                             // E: 素材說明（手動維護）"
        )
        print("  ✓ 已移除自動填寫廣告帳戶ID、人員、素材名稱的邏輯")
        
        # 3c. 在快照中也移除自動填寫
        new_code = new_code.replace(
            "info.accountId||''",
            "''"
        )
        new_code = new_code.replace(
            "info.person||''",
            "''"
        )
        new_code = new_code.replace(
            "info.material||''",
            "''"
        )
        print("  ✓ 已移除快照和日誌中的自動填寫邏輯")
        
        # 3d. 移除 code 前綴引號（舊設計為了強制文字格式）
        new_code = new_code.replace(
            "\"'\" + code,  // 前綴引號強制文字格式",
            "code,                           // A: code（新格式如 AS01）"
        )
        print("  ✓ 已移除 code 前綴引號（新格式 AS01 不需要）")
        
        node['parameters']['jsCode'] = new_code
        
    # 3e. 更新快照 header
    if node['name'] == 'Write Snapshot Header':
        params = node.get('parameters', {})
        if 'jsonBody' in params:
            old_body = params['jsonBody']
            # 更新 header 移除廣告帳戶ID
            new_body = old_body.replace(
                '["\\u65e5\\u671f", "code", "\\u5ee3\\u544a\\u5e33\\u6236ID", "\\u6d88\\u8017", "\\u6dfb\\u52a0", "\\u6210\\u679c", "CPA"]',
                '["\\u65e5\\u671f", "code", "\\u6d88\\u8017", "\\u6dfb\\u52a0", "CPA"]'
            )
            if new_body != old_body:
                params['jsonBody'] = new_body
                print("  ✓ Write Snapshot Header: 已簡化快照標題列")

with open('/tmp/wf_sheets_new.json', 'w') as f:
    json.dump(wf_sheets, f, ensure_ascii=False)
print(f"  → 已儲存到 /tmp/wf_sheets_new.json")

print("\n=== 所有修改完成 ===")
print("接下來需要透過 API 將修改後的 JSON 推送回 n8n")
