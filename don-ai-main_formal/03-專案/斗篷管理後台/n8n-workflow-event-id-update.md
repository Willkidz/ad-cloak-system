---
title: "N8N 工作流 event_id 支持修改記錄"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "記錄上帝視角 Time Attribution 工作流加入 clicks.event_id 支援的修改內容與節點變更。"
version: "v1.0"
---
# N8N 工作流 event_id 支持修改記錄

**日期**：2026-03-31  
**工作流**：上帝視角_Time Attribution（ID: `dqbdnCN3xdJAahYQ`）  
**目標**：支持 clicks 表的 event_id 欄位，用於 FB 像素事件去重

---

## 修改概述

為了支持隱者系統落地頁 FB 像素事件觸發功能，需要在 N8N 工作流中加入 `event_id` 欄位的讀取和傳遞。

### 修改清單

#### 1. Query Recent Clicks 節點

**位置**：工作流中的 D1 查詢節點  
**修改內容**：SQL SELECT 語句

**修改前**：
```sql
SELECT click_id, timestamp, tag, ad_code, line_oa_id, destination, ip_address, user_agent, accept_language, ip_country, ip_asn, ip_city, ip_region_code, ip_postal_code, fbclid, fbc, fbp, pixel_id, capi_token, pixels FROM clicks WHERE destination = ?1 AND matched = 0 AND timestamp >= datetime(?2, '-45 seconds') AND timestamp <= ?2 ORDER BY timestamp DESC LIMIT 10
```

**修改後**：
```sql
SELECT click_id, timestamp, tag, ad_code, line_oa_id, destination, ip_address, user_agent, accept_language, ip_country, ip_asn, ip_city, ip_region_code, ip_postal_code, fbclid, fbc, fbp, pixel_id, capi_token, pixels, event_id FROM clicks WHERE destination = ?1 AND matched = 0 AND timestamp >= datetime(?2, '-45 seconds') AND timestamp <= ?2 ORDER BY timestamp DESC LIMIT 10
```

**說明**：在 `pixels` 後加入 `, event_id`

---

#### 2. Prepare CAPI Events 節點

**位置**：工作流中的代碼節點（Code 類型）  
**修改內容**：JavaScript 代碼

##### 修改 2a：cols 陣列

**修改前**：
```javascript
const cols = results.columns || ['click_id','timestamp','tag','ad_code','line_oa_id','ip_address','user_agent','accept_language','ip_country','ip_asn','fbclid','fbc','fbp','pixel_id','capi_token','pixels'];
```

**修改後**：
```javascript
const cols = results.columns || ['click_id','timestamp','tag','ad_code','line_oa_id','ip_address','user_agent','accept_language','ip_country','ip_asn','fbclid','fbc','fbp','pixel_id','capi_token','pixels','event_id'];
```

**說明**：在陣列末尾加入 `'event_id'`

##### 修改 2b：eventData 構建

**修改前**：
```javascript
      event_name: eventName,
```

**修改後**：
```javascript
      event_name: eventName,
      event_id: matchData.event_id || undefined,
```

**說明**：在 `event_name` 後加入 `event_id` 欄位，值來自 `matchData.event_id`

---

## 修改步驟（手動操作）

1. 登入 N8N：http://n8n.bexnua.store
2. 開啟工作流「上帝視角_Time Attribution」
3. 找到「Query Recent Clicks」節點，編輯 SQL 語句
4. 找到「Prepare CAPI Events」節點，編輯 JavaScript 代碼
5. 應用修改並測試
6. 啟用工作流

---

## 影響範圍

- **clicks 表**：新增 `event_id` 欄位已在 D1 中完成
- **CAPI 事件**：Facebook CAPI 請求將包含 `event_id` 參數用於事件去重
- **歸因匹配**：不影響現有的時間歸因邏輯

---

## 驗證方法

1. 在隱者系統落地頁點擊按鈕，觸發 FB 像素事件
2. 檢查 clicks 表是否正確寫入 `event_id`
3. 檢查 N8N 工作流日誌，確認 CAPI 事件包含 `event_id` 參數
4. 驗證 Facebook Conversion API 是否正確接收 `event_id`

---

## 相關文件

- [architecture-v2.md](./architecture-v2.md) - 隱者系統技術架構
- [active-context.md](../../.ai/active-context.md) - 項目活動上下文
- [CHANGELOG.md](../../CHANGELOG.md) - 變更日誌
