---
title: "line_config D1 表維護規範"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "定義 D1 資料庫 line_config 表的完整維護規則：ad_code 必須大寫且唯一、destination（LINE OA User ID）必須各自獨立不可共用、ad_code 與 campaign_id 為多對一關係，並提供驗證 SQL、修復方法、新增/修改/刪除操作流程及部署前檢查清單。"
id: "20260327-lineconfig-001"
type: "guide"
tags: [advertising, cloaking, cloudflare-d1, godview, knowledge-base, line]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
---

> **TL;DR**: `line_config` 是連接廣告代碼（ad_code）與 LINE OA 的核心 D1 配置表，包含 `code`（UNIQUE）、`campaign_id`、`destination`（LINE OA User ID）等欄位。三條核心維護規則：(1) ad_code 必須大寫且唯一，(2) 每個 destination 只能對應一個 ad_code（不可共用，否則歸因數據混亂），(3) 一個 ad_code 只能屬於一個 campaign_id。修改前必須先檢查 `line-redirect` Worker 源碼中的 `LINE_MAP` 和 `AD_MAP` 確保配置一致。本文件提供完整的驗證 SQL、修復方法、CRUD 操作流程及部署前檢查清單。

# line_config 維護規範

## 概述

`line_config` 表是連接廣告代碼（ad_code）和 LINE OA 的核心配置表。本文件旨在定義該表的標準維護規則，以確保數據的一致性、唯一性與可追溯性。

---

## line_config 表結構

### 表定義

| 欄位          | 類型      | 說明              | 約束                    |
| :------------ | :-------- | :---------------- | :---------------------- |
| `id`          | INTEGER   | 主鍵              | PRIMARY KEY             |
| `code`        | TEXT      | ad_code（如 CX06） | UNIQUE, NOT NULL        |
| `campaign_id` | INTEGER   | 廣告 ID           | NOT NULL                |
| `destination` | TEXT      | LINE OA User ID   | NOT NULL                |
| `created_at`  | TIMESTAMP | 建立時間          | DEFAULT CURRENT_TIMESTAMP |
| `updated_at`  | TIMESTAMP | 更新時間          | DEFAULT CURRENT_TIMESTAMP |

### 數據範例

<example id="line-config-data-sample">

| id | code | campaign_id | destination                            |
| :--- | :--- | :---------- | :------------------------------------- |
| 1  | CX06 | 10          | U1234567890abcdef1234567890abcdef       |
| 2  | BF01 | 11          | U0987654321fedcba0987654321fedcba       |
| 3  | AS01 | 12          | Uabcdefghijklmnopqrstuvwxyz123456      |

</example>

---

## 核心維護原則

### ad_code 必須大寫且唯一

<rule id="ad-code-uniqueness">
- `code` 欄位中的 ad_code 必須為大寫。
- 每個 ad_code 在表中只能出現一次，不允許重複。
</rule>

**驗證查詢**：

<example id="verify-ad-code">

```sql
-- 檢查是否有重複的 ad_code
SELECT code, COUNT(*) as count 
FROM line_config 
GROUP BY code 
HAVING count > 1;

-- 檢查是否有小寫 ad_code
SELECT * FROM line_config WHERE code != UPPER(code);
```

</example>

**修復方法**：

<example id="fix-ad-code">

```sql
-- 刪除重複的記錄（保留 id 最小的）
DELETE FROM line_config 
WHERE id NOT IN (
  SELECT MIN(id) FROM line_config GROUP BY code
);

-- 將所有 code 轉為大寫
UPDATE line_config SET code = UPPER(code);
```

</example>

### destination 必須各自獨立

<rule id="destination-independence">
- 每個 `destination`（LINE OA User ID）只能對應一個 ad_code。
- 不同的 ad_code 不能共用同一個 LINE OA User ID。
</rule>

**原因**：若多個 ad_code 共用同一個 destination，將無法區分點擊來源，導致歸因數據混亂，無法準確追蹤廣告成效。

**驗證查詢**：

<example id="verify-destination">

```sql
-- 檢查是否有共用的 destination
SELECT destination, COUNT(*) as count, GROUP_CONCAT(code) as codes
FROM line_config 
GROUP BY destination 
HAVING count > 1;
```

</example>

**修復方法**：

<example id="fix-destination">

```sql
-- 為重複的 destination 分配新的 LINE OA User ID
-- [待確認] 此操作需手動介入，確保每個 ad_code 最終對應唯一的 destination
UPDATE line_config 
SET destination = 'U新的OA_ID' 
WHERE code = 'CX06';
```

</example>

### ad_code 與 campaign_id 關係必須一致

<rule id="campaign-consistency">
- 一個 ad_code 只能對應一個 campaign_id。
- 一個 campaign_id 可以擁有多個 ad_code。
</rule>

**驗證查詢**：

<example id="verify-campaign">

```sql
-- 檢查是否有一個 ad_code 對應多個 campaign_id
SELECT code, COUNT(DISTINCT campaign_id) as campaign_count
FROM line_config 
GROUP BY code 
HAVING campaign_count > 1;
```

</example>

### 修改前需確認 Worker 源碼

<rule id="worker-source-check">
- 修改 `line_config` 前，必須先檢查 `line-redirect` Worker 源碼中的 fallback 設定，確保兩者配置一致。
- 若 Worker 源碼有更新，必須同步修改 `line_config` 表。
</rule>

<step id="check-worker-source">
1. 查看 `line-redirect` Worker 源碼中的 `LINE_MAP` 和 `AD_MAP`。
2. 確認 ad_code 和 destination 的映射關係。
3. 若有差異，根據 Worker 的定義更新 `line_config` 表。
4. 部署 Worker 前，再次確認 `line_config` 已同步更新。
</step>

**Worker 源碼位置**：
- **正式版**: `05-原始碼/上帝視角/line-redirect-current.js`
- **Staging 版**: `05-原始碼/上帝視角/line-redirect-staging.js`

---

## 常見操作流程

### 新增 ad_code

<step id="add-ad-code">
1. 確認 ad_code 格式正確（大寫，1-6 個字母 + 1-4 個數字）。
2. 確認 ad_code 在 `line_config` 中不存在。
3. 確認 `campaign_id` 存在於 `campaigns` 表中。
4. 確認 `destination`（LINE OA User ID）是全新的，未被其他 ad_code 使用。
5. 執行 `INSERT` 語句並驗證。
</step>

<example id="insert-ad-code">

```sql
-- 新增
INSERT INTO line_config (code, campaign_id, destination)
VALUES ('CX06', 10, 'U1234567890abcdef1234567890abcdef');

-- 驗證
SELECT * FROM line_config WHERE code = 'CX06';
```

</example>

### 修改 ad_code 的 destination

<step id="edit-destination">
1. 確認新的 `destination` 未被其他 ad_code 使用。
2. 確認此修改不會影響現有的歸因數據分析。
3. 執行 `UPDATE` 語句並驗證。
</step>

<example id="update-destination">

```sql
-- 修改
UPDATE line_config 
SET destination = 'U新的OA_ID' 
WHERE code = 'CX06';

-- 驗證
SELECT * FROM line_config WHERE code = 'CX06';
```

</example>

### 刪除 ad_code

<step id="delete-ad-code">
1. 確認該 ad_code 的 `clicks` 記錄已備份或不再需要。
2. 確認刪除操作不會影響現有的統計報表。
3. 執行 `DELETE` 語句並驗證。
</step>

<example id="delete-ad-code-sql">

```sql
-- 刪除
DELETE FROM line_config WHERE code = 'CX06';

-- 驗證 (應返回空結果)
SELECT * FROM line_config WHERE code = 'CX06';
```

</example>

### 批量檢查與修復

<example id="batch-check">

```sql
-- 檢查重複的 ad_code
SELECT code, COUNT(*) FROM line_config GROUP BY code HAVING COUNT(*) > 1;

-- 檢查共用的 destination
SELECT destination, COUNT(*), GROUP_CONCAT(code) FROM line_config GROUP BY destination HAVING COUNT(*) > 1;

-- 檢查小寫 ad_code
SELECT * FROM line_config WHERE code != UPPER(code);

-- 檢查無效的 campaign_id
SELECT * FROM line_config WHERE campaign_id NOT IN (SELECT id FROM campaigns);
```

</example>

---

## 部署前檢查清單

在部署任何涉及 `line_config` 的功能前，必須逐一確認以下項目：

- [ ] 所有 ad_code 均為大寫。
- [ ] 沒有重複的 ad_code。
- [ ] 沒有共用的 destination。
- [ ] 所有 `campaign_id` 均有效（存在於 `campaigns` 表）。
- [ ] `line-redirect` Worker 源碼中的配置與 `line_config` 表一致。
- [ ] 新增的 ad_code 已在 Worker 的 `AD_MAP` 中定義。
- [ ] 已通過實際測試驗證 ad_code 到 destination 的映射正確無誤。

---

## 常見問題與解答

**Q: 為什麼每個 destination 必須各自獨立？**

A: 因為 destination 是 LINE OA 的唯一標識。如果多個 ad_code 共用同一個 destination，系統將無法區分點擊來自哪個廣告，導致歸因數據混亂。

**Q: 如果誤刪了 ad_code 怎麼辦？**

A: 可從資料庫備份中恢復，或手動重新插入。但請注意，`clicks` 表中關聯此 ad_code 的歷史點擊記錄將無法自動恢復關聯。

**Q: 可以直接修改現有 ad_code 的 `code` 值嗎？**

A: 強烈不建議。`clicks` 表中已存在該 `code` 的歷史記錄，直接修改會導致歷史數據失聯。正確做法是新增一個 ad_code，然後逐步將流量遷移過去。

**Q: ad_code 和 campaign_id 的關係是什麼？**

A: 一個 `campaign_id` 可以對應多個 `ad_code`（例如，同一廣告活動下的不同素材或渠道），但一個 `ad_code` 只能屬於一個 `campaign_id`。

**Q: 如何查詢某個廣告活動下的所有 ad_code？**

A:

<example id="query-campaign-codes">

```sql
SELECT code, destination 
FROM line_config 
WHERE campaign_id = 10
ORDER BY code;
```

</example>

**Q: 如何查詢某個 ad_code 的歸因數據？**

A:

<example id="query-attribution-data">

```sql
SELECT ad_code, COUNT(*) as total_clicks, SUM(CASE WHEN matched=1 THEN 1 ELSE 0 END) as attributed_clicks
FROM clicks 
WHERE ad_code = 'CX06'
GROUP BY ad_code;
```

</example>

---

## 結論

嚴格遵守本規範是確保 `line_config` 數據質量和廣告歸因準確性的關鍵。所有相關人員在進行維護操作前，都應詳細閱讀並遵循文件中的各項原則與流程。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-redirect-worker-verify.md](godview-line-redirect-worker-verify.md) | line-redirect Worker 驗證記錄 |
| [godview-line-redirect-staging-log.md](godview-line-redirect-staging-log.md) | Staging 環境測試日誌 |
| [godview-mapping-spec.md](godview-mapping-spec.md) | 負責人、項目與 LINE ID 對應規則 |
