---
title: "上帝視角數據刪除 API 使用筆記"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "記錄如何安全地使用 API 刪除「上帝視角」系統中的冗餘或錯誤數據，包含 D1 資料庫（DELETE FROM clicks）與 n8n 執行紀錄的清理方法，強調 filter 參數與 dryRun 模式的重要性。"
id: "20260328-godview-delete-api"
type: notes
tags: [api, cloudflare-d1, godview, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本筆記是數據清理的「安全手冊」。它提供了刪除 D1 資料庫中過期點擊紀錄與清理 n8n 歷史執行數據的 `curl` 指令。**核心規範**：必須使用 `filter` 參數（JSON 格式）以防止意外全表刪除，建議優先使用 `dryRun: true` 預覽結果。嚴禁在生產環境執行未經 `WHERE` 條件限制的 `DELETE` 語句。

# 上帝視角數據刪除 API 使用筆記

## 數據清理規範

為維持系統性能，需定期清理超過 90 天的歷史數據。

---

## API 參數詳解

<rule id="delete-api-params">

以下為 `delete` API 的主要參數：

| 參數 | 類型 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| **`filter`** | string | (無) | **[必要]** 用於指定過濾條件的 JSON 字串。為防止意外刪除所有數據，此為必填欄位。 |
| **`returnData`** | boolean | `false` | 是否在回應中返回已刪除的數據。 |
| **`dryRun`** | boolean | `false` | 預覽將被刪除的數據列，而不實際執行刪除操作。 |

</rule>

---

## 常用刪除指令範例

### 1. 刪除 D1 過期點擊紀錄

<example id="delete-d1-clicks">

```bash
# 刪除 90 天前的數據
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/{ACC_ID}/d1/database/{DB_ID}/query" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "DELETE FROM clicks WHERE created_at < date('\''now'\'', '\''-90 days'\'');"}'
```

</example>

### 2. 清理 n8n 執行紀錄

<step id="delete-n8n-exec">

n8n 建議透過後台設定「自動清理」功能。若需手動刪除特定執行 ID：

```bash
curl -X DELETE -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  "${N8N_URL}/api/v1/executions/{EXECUTION_ID}"
```

</step>

---

## 安全邊界 (Boundaries)

<boundaries id="delete-safety">

- **嚴禁操作**：禁止執行 `DELETE FROM clicks;`（無條件全表刪除）。
- **備份要求**：在大規模刪除前，必須先執行 `SELECT * INTO clicks_backup...` 備份數據。
- **審核流程**：所有刪除操作必須在 Slack 頻道報備並獲得技術負責人確認。
- **n8n 限制**：禁止刪除 n8n DataTable 的欄位（因 DELETE column 操作會回傳 404 錯誤），應建立新表並進行數據遷移。

</boundaries>

---

## 結論

數據刪除是不可逆的操作。請務必謹慎執行，並優先考慮使用「軟刪除」（標記 `is_deleted = 1`）而非物理刪除。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-api-tools-notes.md`](godview-api-tools-notes.md) | API 工具使用筆記 |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 系統診斷指南 |
| [`godview-core-cmd.md`](godview-core-cmd.md) | 核心指令與禁止事項 |
