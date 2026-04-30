---
title: "Ad Code Format Spec"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Ad Code Format Spec"
type: "spec"
tags: [advertising, changelog]
status: "archived"
---

## 1. ad_code 命名格式

<rule id="adcode-naming">
### 格式定義

```
ad_code = [大寫字母 1-6 個] + [數字 1-4 個]
```

| 項目 | 規則 |
| :--- | :--- |
| 字母部分 | 1-6 個大寫英文字母（A-Z） |
| 數字部分 | 1-4 個阿拉伯數字（0-9） |
| 總長度 | 2-10 個字符 |
| 大小寫 | 統一為大寫 |

### 有效範例

| ad_code | 說明 |
| :--- | :--- |
| AS01 | 2 個字母 + 2 個數字 |
| CX06 | 2 個字母 + 2 個數字 |
| BF10 | 2 個字母 + 2 個數字 |
| N2001 | 1 個字母 + 4 個數字 |
| ABCDEF01 | 6 個字母 + 2 個數字 |
| ABC1 | 3 個字母 + 1 個數字 |

### 無效範例

| ad_code | 原因 |
| :--- | :--- |
| as01 | 小寫（應轉為大寫） |
| A | 只有 1 個字母，無數字 |
| 01 | 只有數字，無字母 |
| A-01 | 包含特殊字符 |
| ABC0001 | 數字超過 4 個 |
</rule>

---

## 2. ad_code 讀取方式

<rule id="adcode-read-priority">
line-redirect Worker 支援兩種 ad_code 讀取格式，優先順序如下：

### 格式 1：新格式（優先）— URL 路徑格式

```
URL: https://bf.go2line.cc/CX06
路徑: /CX06
ad_code: CX06
```

優點：避免 iOS Safari 的追蹤參數剝除問題、更簡潔的 URL 結構。**推薦使用**。

### 格式 2：舊格式（Fallback）— 查詢參數格式

```
URL: https://bf.go2line.cc/?a=CX06
查詢參數: ?a=CX06
ad_code: CX06
```

說明：向後兼容舊系統，當新格式不可用時使用。
</rule>

### 完整讀取邏輯

```javascript
// 新格式優先：從 URL pathname 讀取（例如 /CX06）
// 舊格式 fallback：從 ?a= query string 讀取（例如 ?a=CX06）
const pathSegment = url.pathname.slice(1).toUpperCase();
const adCodeFromPath = /^[A-Z]{1,6}\d{1,4}$/.test(pathSegment) ? pathSegment : "";
const adCode = adCodeFromPath || (url.searchParams.get("a") || "").toUpperCase() || "";
```

---

## 3. 大小寫規則

<rule id="adcode-case">
**原則：統一轉為大寫。** 所有 ad_code 最終都必須轉為大寫，確保 `line_config` 表中的查詢一致。

| 輸入格式 | 轉換前 | 轉換後 |
| :--- | :--- | :--- |
| 新格式大寫 | /CX06 | CX06 |
| 新格式小寫 | /cx06 | CX06 |
| 新格式混合 | /Cx06 | CX06 |
| 舊格式大寫 | ?a=CX06 | CX06 |
| 舊格式小寫 | ?a=cx06 | CX06 |
| 舊格式混合 | ?a=Cx06 | CX06 |
</rule>

---

## 4. 路徑過濾規則

<rule id="adcode-path-filter">
區分 ad_code 路徑和其他系統路徑（如 `/go`、`/bc-event`、`/favicon.ico`）。

```javascript
const pathSegment = url.pathname.slice(1).toUpperCase();
const adCodeRegex = /^[A-Z]{1,6}\d{1,4}$/;
const isAdCode = adCodeRegex.test(pathSegment);
```

| 路徑 | 是否 ad_code | 說明 |
| :--- | :--- | :--- |
| /CX06 | 是 | 符合格式 |
| /cx06 | 是 | 轉為大寫後符合 |
| /go | 否 | 無數字 |
| /bc-event | 否 | 包含特殊字符 |
| /favicon.ico | 否 | 包含特殊字符 |
| / | 否 | 空路徑 |
</rule>

---

## 5. line_config 維護規則

<rule id="adcode-lineconfig">
1. **ad_code 必須大寫**：`line_config` 表中的 `code` 欄位必須是大寫
2. **ad_code 必須唯一**：每個 ad_code 只能有一筆記錄
3. **ad_code 必須各自獨立**：每個 tag 的 `destination`（LINE OA User ID）必須各自獨立

### 驗證查詢

```sql
-- 檢查是否有重複的 ad_code
SELECT code, COUNT(*) as count FROM line_config GROUP BY code HAVING count > 1;

-- 檢查是否有共用的 destination
SELECT destination, COUNT(*) as count FROM line_config GROUP BY destination HAVING count > 1;
```
</rule>

---

## 6. 部署檢查清單

- [ ] ad_code 格式符合規範（1-6 個大寫字母 + 1-4 個數字）
- [ ] 新格式（/CX06）和舊格式（?a=CX06）都能正確讀取
- [ ] ad_code 統一轉為大寫
- [ ] 路徑過濾邏輯正確（不會誤判系統路徑）
- [ ] line_config 表中的 ad_code 都是大寫且無重複
- [ ] 每個 ad_code 的 destination 各自獨立
- [ ] 實際測試驗證新舊格式都能正確讀取

---

## 7. 常見問題

**Q：為什麼要支援兩種格式？**
為了向後兼容舊系統。舊系統使用查詢參數格式（?a=CX06），新系統推薦使用路徑格式（/CX06）以避免 iOS Safari 的追蹤參數剝除問題。

**Q：為什麼要統一轉為大寫？**
因為 `line_config` 表中的 ad_code 都是大寫。統一轉為大寫可以確保查詢一致。

**Q：路徑格式有什麼優勢？**
避免追蹤參數剝除、更簡潔的 URL、更好的 SEO。

**Q：如果 ad_code 不符合格式怎麼辦？**
系統會忽略該 ad_code，視為空值（`ad_code = ""`）。不會導致錯誤，但不會記錄 ad_code 信息。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/數據關聯原則.md` | ad_code 在數據關聯中的角色 |
| `06-SOP流程/deploy-sop.md` | 部署時需檢查 ad_code 格式 |
