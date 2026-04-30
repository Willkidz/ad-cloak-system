import json

with open('/tmp/wf_sheets_v2.json') as f:
    wf = json.load(f)

for node in wf['nodes']:
    if node['name'] == 'Calculate Stats':
        code = node['parameters']['jsCode']
        
        # ============================================================
        # 1. 修改 attribution 區塊：從只寫 bf/n20 改為按人員(C/J/L/M)統計
        # ============================================================
        old_attribution = """  attribution: {
    range: "'成效'!D6:D7",
    values: (() => {
      // 動態從 line_config 取得歸因驗證區的 LINE ID
      const bfConfig = lineConfigData.find(c => c.tag === 'bf');
      const n20Config = lineConfigData.find(c => c.tag === 'n20');
      const bfLine = bfConfig ? bfConfig.line : '@678eohsd';
      const n20Line = n20Config ? n20Config.line : '@348ikfwm';
      return [
        [lineAddCounts[bfLine] || 0],
        [lineAddCounts[n20Line] || '']
      ];
    })()
  },"""
        
        new_attribution = """  attribution: {
    range: "'成效'!D4:D7",
    values: (() => {
      // 按人員(who)統計系統抓取數：將該人員所有 LINE 帳號的添加數加總
      const persons = ['C', 'J', 'L', 'M'];
      return persons.map(who => {
        const personLines = lineConfigData.filter(c => c.who === who);
        let total = 0;
        for (const lc of personLines) {
          if (lc.line) total += (lineAddCounts[lc.line] || 0);
        }
        return [total || ''];
      });
    })()
  },"""
        
        code = code.replace(old_attribution, new_attribution)
        print("✓ 1. attribution 區塊已更新為按人員統計")
        
        node['parameters']['jsCode'] = code
    
    # ============================================================
    # 2. 修改 Write Attribution URL 的 range（D6:D7 → D4:D7）
    # ============================================================
    if node['name'] == 'Write Attribution':
        params = node['parameters']
        url = params.get('url', '')
        # URL 是動態的，從 Calculate Stats 的 writePayloads.attribution.range 取得
        # 所以不需要改 URL，它會自動用新的 range
        print(f"✓ 2. Write Attribution URL 是動態的，無需修改")
        print(f"     URL: {url[:150]}")

# 儲存
with open('/tmp/wf_sheets_v3.json', 'w') as f:
    json.dump(wf, f, ensure_ascii=False)

print("\n=== 已儲存到 /tmp/wf_sheets_v3.json ===")
