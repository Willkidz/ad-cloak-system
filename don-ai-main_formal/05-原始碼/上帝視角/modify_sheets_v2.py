import json

with open('/tmp/wf_sheets_new.json') as f:
    wf = json.load(f)

for node in wf['nodes']:
    if node['name'] == 'Calculate Stats':
        code = node['parameters']['jsCode']
        
        # ============================================================
        # 1. 修改 existingData 解析（從 A12:N200 讀取）
        # ============================================================
        # 舊：row[3]=項目, row[5]=狀態, row[10]=區間成果
        # 新：row[3]=狀態, row[8]=區間成果
        code = code.replace(
            """const existingData = {};
for (const row of existingRows) {
  if (row && row[0]) {
    const code = String(row[0]).trim();
    existingData[code] = {
      project: row[3] || '',      // 項目（手動填）
      status: row[5] || '',       // 狀態（可能手動改過）
      rangeResult: row[10] || ''  // 區間成果（手動填）
    };
  }
}""",
            """const existingData = {};
for (const row of existingRows) {
  if (row && row[0]) {
    const code = String(row[0]).trim();
    existingData[code] = {
      accountId: row[1] || '',    // B: 廣告帳戶ID（手動填）
      material: row[2] || '',     // C: 素材說明（手動填）
      status: row[3] || '',       // D: 狀態（可能手動改過）
      rangeResult: row[8] || ''   // I: 區間成果（手動填）
    };
  }
}"""
        )
        print("✓ 1. existingData 解析已更新")
        
        # ============================================================
        # 2. 修改 perfRows 構建（新的 A~N 結構）
        # ============================================================
        old_return = """  return [
    code,                           // A: code（新格式如 AS01）                           // A: code
    '',                             // B: 廣告帳戶ID（手動維護）
    '',                             // C: 人員（已移除，code 本身包含資訊）
    existing.project || info.project || '',  // D: 項目（保留手動填寫）
    '',                             // E: 素材說明（手動維護）
    status,                         // F: 狀態（保留手動）
    totalSpend || '',               // G: 累計消耗
    totalAdd || '',                 // H: 累計添加
    totalCPA,                       // I: 累計CPA
    rangeSpend || '',               // J: 區間消耗
    existing.rangeResult || '',     // K: 區間成果（保留手動填寫）
    rangeAdd || '',                 // L: 區間添加
    `=IF(AND(K${rowNum}="",L${rowNum}=""),"",K${rowNum}-L${rowNum})`,  // M: 流失
    `=IFERROR(IF(K${rowNum}>0,L${rowNum}/K${rowNum},""),"")`,          // N: 添加占比
    rangeCPA,                       // O: 單次添加
    `=IFERROR(IF(K${rowNum}>0,J${rowNum}/K${rowNum},""),"")`           // P: 單次成果
  ];"""
        
        new_return = """  return [
    code,                           // A: code（AS01 格式）
    existing.accountId || '',       // B: 廣告帳戶ID（手動填寫，保留原值）
    existing.material || '',        // C: 素材說明（手動填寫，保留原值）
    status,                         // D: 狀態
    totalSpend || '',               // E: 累計消耗
    totalAdd || '',                 // F: 累計添加
    totalCPA,                       // G: 累計CPA
    rangeSpend || '',               // H: 區間消耗
    existing.rangeResult || '',     // I: 區間成果（手動填寫，保留原值）
    rangeAdd || '',                 // J: 區間添加
    `=IF(AND(I${rowNum}="",J${rowNum}=""),"",I${rowNum}-J${rowNum})`,  // K: 流失
    `=IFERROR(IF(I${rowNum}>0,J${rowNum}/I${rowNum},""),"")`,          // L: 添加占比
    rangeCPA,                       // M: 單次添加（區間CPA）
    `=IFERROR(IF(I${rowNum}>0,H${rowNum}/I${rowNum},""),"")`           // N: 單次成果
  ];"""
        
        code = code.replace(old_return, new_return)
        print("✓ 2. perfRows 構建已更新為 A~N 結構")
        
        # ============================================================
        # 3. 修改 adPerformance range（A12:P → A12:N）
        # ============================================================
        code = code.replace(
            "range: \"'成效'!A12:P\" + (11 + sortedCodes.length)",
            "range: \"'成效'!A12:N\" + (11 + sortedCodes.length)"
        )
        print("✓ 3. adPerformance range 已更新為 A12:N")
        
        # ============================================================
        # 4. 修改快照 snapshotRows（簡化）
        # ============================================================
        code = code.replace(
            "return [today, code, '', '', '', todaySpendByCode[code]||0, todayAddCounts[code]||0];",
            "return [today, code, todaySpendByCode[code]||0, todayAddCounts[code]||0];"
        )
        print("✓ 4. snapshotRows 已簡化")
        
        # ============================================================
        # 5. 修改消耗日誌 spendLogRows（簡化）
        # ============================================================
        code = code.replace(
            "return [today, '', code, '', '', adSpend[code]];",
            "return [today, code, adSpend[code]];"
        )
        print("✓ 5. spendLogRows 已簡化")
        
        node['parameters']['jsCode'] = code

    # ============================================================
    # 6. 修改 Read Existing Performance URL（A12:P200 → A12:N200）
    # ============================================================
    if node['name'] == 'Read Existing Performance':
        old_url = node['parameters']['url']
        new_url = old_url.replace('A12:P200', 'A12:N200')
        node['parameters']['url'] = new_url
        print("✓ 6. Read Existing Performance URL 已更新為 A12:N200")
    
    # ============================================================
    # 7. 修改 Write Snapshot Header（簡化標題）
    # ============================================================
    if node['name'] == 'Write Snapshot Header':
        params = node.get('parameters', {})
        if 'jsonBody' in params:
            # 更新為新的簡化標題
            old_body = params['jsonBody']
            # 替換 range 和 values
            new_body = old_body.replace(
                "'_%E6%AF%8F%E6%97%A5%E5%BF%AB%E7%85%A7'!A1:G1",
                "'_%E6%AF%8F%E6%97%A5%E5%BF%AB%E7%85%A7'!A1:D1"
            )
            params['jsonBody'] = new_body
            print("✓ 7. Write Snapshot Header range 已更新")

    # ============================================================
    # 8. 修改 Write Snapshot URL（G2 → D2）
    # ============================================================
    if node['name'] == 'Write Snapshot':
        params = node.get('parameters', {})
        url = params.get('url', '')
        new_url = url.replace('A2:G2', 'A2:D2')
        params['url'] = new_url
        print("✓ 8. Write Snapshot URL 已更新")

# 儲存
with open('/tmp/wf_sheets_v2.json', 'w') as f:
    json.dump(wf, f, ensure_ascii=False)

print("\n=== 所有修改完成，已儲存到 /tmp/wf_sheets_v2.json ===")
