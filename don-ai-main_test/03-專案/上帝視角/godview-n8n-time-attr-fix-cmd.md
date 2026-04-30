---
title: "修復指令：N8N Time Attribution Workflow Bug"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "修復因 N8N Code 節點不支援 $helpers 變數導致 51 次 follow 事件全部失敗、0 次 CAPI CompleteRegistration 送出的問題，改用純 JS sha256hex 函式並為 BC 像素補上標準事件。"
id: "20260325-time-attr-fix"
type: "fix-cmd"
tags: [attribution, capi, conversion, godview, n8n, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: Facebook Pixel 後台顯示 0 個 `CompleteRegistration` 事件（PageView 531、Purchase 117 正常）。根因：N8N Code 節點不支援 `$helpers` 變數，導致「Prepare CAPI Events」節點（ID: `5b745428-c1a5-4cb3-8cc5-555db86092bd`）每次執行 `follow` 事件都因 `ReferenceError: $helpers is not defined` 中斷（51 次全部失敗，250 次 `message` 事件在 `Is Follow Event?` 就結束未進入 CAPI 流程）。修復方案：(1) 將 `$helpers.crypto.createHash('sha256')` 替換為純 JS 實現的 `sha256hex()` 函式；(2) 為 BC 像素補上標準 `CompleteRegistration` 事件名稱（原本只發 `ALL_CompleteRegistration` 和 `{prefix}_CompleteRegistration`）。修復位置：workflow `dqbdnCN3xdJAahYQ` 的 Prepare CAPI Events 節點，僅需在 N8N 介面修改程式碼，無需部署 Worker。

# 修復指令：N8N Time Attribution Workflow Bug

## 問題描述

Facebook Pixel 後台顯示 **0 個 CompleteRegistration 事件**，而 PageView、Purchase 等其他事件類型皆正常。歸因報告顯示有大量點擊與加好友動作，但對應的 Facebook CAPI 事件卻完全沒有送出，顯示歸因流程在某處中斷。

| 指標 | 數據 |
| :--- | :--- |
| CompleteRegistration | 0 |
| PageView | 531 |
| Purchase | 117 |
| Clicks | 151 |
| Adds (加好友) | 43 |

---

## 根因分析

### 致命錯誤：`$helpers` 變數未定義

<rule id="n8n-code-node-no-helpers">
N8N 的 Code 節點執行環境不支援內建的 `$helpers` 變數。所有加密、雜湊等輔助功能都必須使用純 JavaScript 或引入外部庫來實現。同樣地，`require()` 也不可用。
</rule>

在 N8N 的「Prepare CAPI Events」節點中，程式碼錯誤地使用了 `$helpers.crypto.createHash('sha256')` 進行資料雜湊。此錯誤導致每一個 `follow` 事件（用戶加好友）在執行到此節點時都會因 `ReferenceError: $helpers is not defined` 而中斷，因此**從未成功送出任何 CAPI 事件**。

**執行紀錄驗證**：
- **錯誤執行 (51 次)**：全部是 `follow` 事件，且錯誤訊息均為 `$helpers is not defined`。
- **成功執行 (250 次)**：全部是 `message` 事件，在「Is Follow Event?」節點就已結束，未進入 CAPI 流程。
- **成功送出 CAPI**：0 次。

### 次要問題：BC 像素缺少標準事件名稱

原程式碼中，BC 像素只發送自定義的 `ALL_CompleteRegistration` 和 `{前綴}_CompleteRegistration` 事件，卻遺漏了 Facebook 標準的 `CompleteRegistration` 事件。這會導致即使在修復主要錯誤後，Facebook 後台的標準事件欄位中數據依舊為零。

---

## Workflow 流程說明

以下為「上帝視角_Time Attribution」工作流程的簡化圖，問題點已標示：

```plaintext
LINE Follow Webhook (接收 LINE webhook)
    ↓
Extract Follow Data (提取 user ID、時間戳等)
    ↓
Is Follow Event? (判斷是否為 follow 事件)
    ↓ Yes
Query Recent Clicks (查詢 D1 最近 45 秒內的點擊紀錄)
    ↓
Fingerprint Match (時間+指紋比對，找到對應的點擊)
    ↓
Matched? (是否匹配成功)
    ↓ Yes
Mark Click Matched (標記該點擊已匹配)
    ↓
Prepare CAPI Events ← 在此節點因 $helpers 未定義而報錯中斷
    ↓
Has Pixel? (判斷有無 Pixel ID)
    ↓ Yes
Send CAPI (送 HTTP POST 到 Facebook Graph API) ← 從未到達
```

---

## 修復步驟

<step id="open-n8n-editor">
**步驟一：打開 N8N 編輯器**
1.  訪問 N8N 服務網址：`https://n8n.bexnua.store`
2.  在 Workflow 列表中找到並打開「**上帝視角_Time Attribution**」(ID: `dqbdnCN3xdJAahYQ`)。
</step>

<step id="modify-code-node">
**步驟二：修改 Prepare CAPI Events 節點**
1.  雙擊打開「**Prepare CAPI Events**」節點 (節點 ID: `5b745428-c1a5-4cb3-8cc5-555db86092bd`)。
2.  刪除節點內的所有現有程式碼。
3.  將以下修復後的完整程式碼貼入節點。
</step>

<example>
**修復後的完整程式碼**
```javascript
// Pure JS SHA256 (no require)
function sha256hex(msg) {
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const s=unescape(encodeURIComponent(msg));
  const b=Array.from(s).map(c=>c.charCodeAt(0));
  b.push(0x80);while(b.length%64!==56)b.push(0);
  const l=s.length*8;for(let i=7;i>=0;i--)b.push((l/Math.pow(2,i*8))&0xff);
  const w=[];for(let i=0;i<b.length;i+=4)w.push((b[i]<<24)|(b[i+1]<<16)|(b[i+2]<<8)|b[i+3]);
  for(let i=0;i<w.length;i+=16){const W=w.slice(i,i+16);for(let j=16;j<64;j++){const s0=((W[j-15]>>>7)|(W[j-15]<<25))^((W[j-15]>>>18)|(W[j-15]<<14))^(W[j-15]>>>3);const s1=((W[j-2]>>>17)|(W[j-2]<<15))^((W[j-2]>>>19)|(W[j-2]<<13))^(W[j-2]>>>10);W[j]=(W[j-16]+s0+W[j-7]+s1)>>>0;}let[a,b2,c,d,e,f,g,h]=H;for(let j=0;j<64;j++){const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));const ch=(e&f)^(~e&g);const t1=(h+S1+ch+K[j]+W[j])>>>0;const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));const maj=(a&b2)^(a&c)^(b2&c);const t2=(S0+maj)>>>0;[h,g,f,e,d,c,b2,a]=[g,f,e,(d+t1)>>>0,c,b2,a,(t1+t2)>>>0];}H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b2)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;}
  return H.map(h=>h.toString(16).padStart(8,'0')).join('');
}

// TAG_PREFIX_MAP - 與 Worker 相同的映射
const TAG_PREFIX_MAP = {
  'js': 'AS', 'cs': 'AS', 'ms': 'AS', 'ls': 'AS',
  'jb': 'AB', 'cb': 'AB', 'mb': 'AB', 'lb': 'AB',
  'jx': 'AX', 'cx': 'AX', 'mx': 'AX', 'lx': 'AX',
  'bf': 'BF',
  'jd': 'JD',
  'n20': 'N20', 'n21': 'N21', 'n22': 'N22', 'n23': 'N23',
  'n24': 'N24', 'n25': 'N25', 'n26': 'N26', 'n27': 'N27',
  'n28': 'N28', 'n29': 'N29', 'n30': 'N30'
};

function getProductPrefix(tag) {
  return TAG_PREFIX_MAP[tag] || null;
}

// 發送 CAPI CompleteRegistration 事件
const matchData = $('Fingerprint Match').item.json;
const pixels = matchData.pixels || [];

if (!pixels.length && matchData.pixel_id && matchData.capi_token) {
  pixels.push({ pixel: matchData.pixel_id, token: matchData.capi_token });
}

const results = [];
const productPrefix = getProductPrefix(matchData.tag);

// 動態域名配置
const DEFAULT_DOMAIN = 'freshpathlab.com';
const eventSourceDomain = DEFAULT_DOMAIN;

for (const px of pixels) {
  if (!px.pixel || !px.token) continue;
  
  const isBcPixel = px.is_bc === true;
  
  // 【修復】BC 像素也加上標準 CompleteRegistration，確保 FB 後台能看到
  let eventNames = [];
  if (isBcPixel && productPrefix) {
    eventNames = [
      `${productPrefix}_CompleteRegistration`,
      'ALL_CompleteRegistration',
      'CompleteRegistration'
    ];
  } else if (isBcPixel) {
    eventNames = [
      'ALL_CompleteRegistration',
      'CompleteRegistration'
    ];
  } else {
    eventNames = ['CompleteRegistration'];
  }
  
  // 為每個事件名稱生成一個請求
  for (const eventName of eventNames) {
    const eventData = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: `https://${matchData.tag}.${eventSourceDomain}/`,
        action_source: "website",
        user_data: {
          client_ip_address: matchData.ip_address || undefined,
          client_user_agent: matchData.user_agent || undefined,
          fbc: matchData.fbc || undefined,
          fbp: matchData.fbp || undefined,
          // 【修復】改用純 JS 實現的 sha256hex 函式
          external_id: matchData.line_user_id ? [sha256hex(matchData.line_user_id)] : undefined,
          ct: matchData.ip_city ? [sha256hex(matchData.ip_city.toLowerCase().trim())] : undefined,
          st: matchData.ip_region_code ? [sha256hex(matchData.ip_region_code.toLowerCase().trim())] : undefined,
          zp: matchData.ip_postal_code ? [sha256hex(matchData.ip_postal_code.toLowerCase().trim())] : undefined,
          country: matchData.ip_country ? [sha256hex(matchData.ip_country.toLowerCase().trim())] : undefined
        }
      }]
    };
    
    // 清理 undefined 值
    Object.keys(eventData.data[0].user_data).forEach(k => {
      if (!eventData.data[0].user_data[k]) delete eventData.data[0].user_data[k];
    });
    
    results.push({
      json: {
        pixel_id: px.pixel,
        capi_token: px.token,
        event_name: eventName,
        is_bc: isBcPixel,
        event_data: eventData,
        url: `https://graph.facebook.com/v25.0/${px.pixel}/events?access_token=${px.token}`
      }
    });
  }
}

if (results.length === 0) {
  return [{ json: { skip: true, reason: 'no_valid_pixels' } }];
}

return results;
```
</example>

<step id="save-and-test">
**步驟三：儲存並測試**
1.  點擊 **Save** 按鈕儲存 Workflow。
2.  使用 **Test workflow** 功能手動觸發一次執行，或等待下一個真實 `follow` 事件進入。
3.  檢查「Prepare CAPI Events」節點的執行歷史，確認不再出現錯誤。
4.  確認「Send CAPI」節點成功執行並收到 HTTP 200 回應。
5.  前往 Facebook 事件管理工具，驗證 `CompleteRegistration` 事件是否已開始正常接收。
</step>

---

## 修改差異對照

### 關鍵修復：`$helpers` 改為 `sha256hex`

此為修復致命錯誤的核心。

<example>
**修改前 (錯誤)**
```javascript
// 在 N8N Code 節點中，$helpers 未定義
st: matchData.ip_region_code ? [$helpers.crypto.createHash('sha256').update(matchData.ip_region_code.toLowerCase().trim()).digest('hex')] : undefined,
```

**修改後 (正確)**
```javascript
// 使用程式碼內已有的純 JS sha256hex 函式
st: matchData.ip_region_code ? [sha256hex(matchData.ip_region_code.toLowerCase().trim())] : undefined,
```
</example>

### 補充修復：為 BC 像素添加標準事件

此為確保數據在 Facebook 後台正確呈現的補充性修復。

<example>
**修改前**
```javascript
// BC 像素只發送自定義事件
if (isBcPixel) {
  eventNames = ['ALL_CompleteRegistration'];
}
```

**修改後**
```javascript
// BC 像素同時發送自定義事件和標準事件
if (isBcPixel) {
  eventNames = [
    'ALL_CompleteRegistration',
    'CompleteRegistration' // ← 新增標準事件
  ];
}
```
</example>

---

## 驗證方式

修復部署後，應觀察以下指標以確認問題已解決。

| 檢查項目 | 預期結果 |
| :--- | :--- |
| N8N 執行紀錄 | `follow` 事件不再報錯，執行狀態均為 `success`。 |
| N8N Send CAPI 節點 | 節點被成功觸發，且 HTTP 回應碼為 200。 |
| FB 事件管理工具 | `CompleteRegistration` 事件開始持續出現。 |
| BC 像素後台 | `ALL_CompleteRegistration` 和 `CompleteRegistration` 事件均有數據。 |

---

## 結論

本次問題的核心是由於 N8N Code 節點的環境限制，開發者錯誤地使用了不被支援的 `$helpers` 變數，導致歸因流程中的 CAPI 事件發送環節完全中斷。透過改用純 JavaScript 實現的 `sha256hex` 函式替換錯誤的程式碼，並補充遺漏的標準事件名稱，可以完整修復此 Bug，恢復 Facebook CAPI 的 `CompleteRegistration` 事件歸因。

---

## 補充資訊

| 項目 | 值 |
| :--- | :--- |
| **Workflow ID** | `dqbdnCN3xdJAahYQ` |
| **節點 ID** | `5b745428-c1a5-4cb3-8cc5-555db86092bd` |
| **N8N 網址** | `https://n8n.bexnua.store` |
| **注意事項** | 此修復僅需在 N8N 介面修改程式碼並儲存，**無需部署 Worker**。 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [Time Attribution Workflow 分析](godview-n8n-time-attr-workflow-analysis.md) | is_bc 判斷邏輯的深度分析 |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與已知問題（含 Code 節點限制） |
