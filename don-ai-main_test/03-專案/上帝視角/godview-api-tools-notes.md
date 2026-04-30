---
title: "上帝視角 API 工具使用筆記"
category: project
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "記錄上帝視角系統中 n8n API（執行狀態查詢、Workflow 觸發）、Cloudflare D1 API（SQL 查詢點擊統計）及 Meta CAPI（事件驗證）的調用規範、curl 範例與頻率限制（n8n ≤60 次/分鐘）。"
id: "20260328-godview-api-notes"
type: notes
tags: [api, capi, cloudflare-d1, godview, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本筆記提供上帝視角系統日常維護所需的 API 操作手冊。涵蓋三大 API 的 `curl` 調用範例：(1) **n8n API**（`https://n8n.bexnua.store/api/v1/`）— 查詢 Workflow 執行紀錄、觸發手動執行，需設定 `X-N8N-API-KEY` Header；(2) **Cloudflare D1 API** — 透過 REST API 對 `clicks` 表執行 SQL 查詢（如今日各 tag 點擊統計），需 `CF_API_TOKEN`；(3) **Meta CAPI** — 驗證事件回傳狀態。關鍵限制：n8n API 每分鐘調用不超過 60 次，所有 API Key 嚴禁硬編碼，必須使用環境變數。

# 上帝視角 API 工具使用筆記

## 環境變數配置

在執行任何 API 指令前，請確保已配置以下環境變數。這些變數的實際值請查閱 `07-配置與環境/auth-info-config.md`。

<example id="env-setup">

```bash
export N8N_URL="https://n8n.bexnua.store"
export N8N_API_KEY="your_api_key_here"
export CF_ACCOUNT_ID="61f1eb800e48d2cf41ed9ddacf01581b"
export CF_API_TOKEN="your_cf_token_here"
export D1_DB_ID="3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"  # Production
# export D1_DB_ID="594f8569-ad3c-40c0-ac7c-8b691f9d7885"  # Staging
```

</example>

---

## n8n API 操作

### 查詢 Workflow 執行紀錄

<example id="n8n-executions">

查詢特定 Workflow 的最近 5 筆執行紀錄（以 Time Attribution 為例，ID: `dqbdnCN3xdJAahYQ`）：

```bash
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  "${N8N_URL}/api/v1/executions?workflowId=dqbdnCN3xdJAahYQ&limit=5" \
  | python3 -m json.tool
```

</example>

### 查詢 Workflow 詳細資訊

<example id="n8n-workflow-detail">

```bash
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  "${N8N_URL}/api/v1/workflows/dqbdnCN3xdJAahYQ" \
  | python3 -m json.tool
```

</example>

---

## Cloudflare D1 API 操作

### 查詢今日點擊統計

<example id="d1-click-stats">

按 `tag` 分組統計今日的點擊數與歸因成功數：

```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT tag, COUNT(*) as clicks, SUM(CASE WHEN matched = 1 THEN 1 ELSE 0 END) as matched FROM clicks WHERE timestamp >= date(\"now\") GROUP BY tag ORDER BY clicks DESC;"
  }'
```

</example>

### 查詢最近未匹配的點擊

<example id="d1-unmatched">

排查歸因失敗時，查詢最近 10 筆未匹配的點擊記錄：

```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT click_id, ad_code, line_oa_id, timestamp FROM clicks WHERE matched = 0 ORDER BY timestamp DESC LIMIT 10;"
  }'
```

</example>

---

## API 調用規範

<rule id="api-usage-rules">

| 規則 | 說明 |
| :--- | :--- |
| **頻率限制** | n8n API 每分鐘調用不超過 60 次，Cloudflare API 每 5 分鐘不超過 1200 次 |
| **錯誤處理** | 所有 API 調用必須檢查 HTTP 狀態碼，非 2xx 響應應記錄至 `.ai/error-log.md` |
| **安全性** | 嚴禁在代碼或文檔中硬編碼 API Key，必須使用環境變數或 Secret 管理工具 |
| **環境區分** | 操作前確認 `D1_DB_ID` 指向正確的環境（Production vs Staging） |

</rule>

---

## 結論

熟練掌握這些 API 工具能極大提升系統維護效率。建議將常用的查詢指令封裝為 Shell 腳本，配合 `jq` 進行結果解析，以實現快速的故障排查與日常監控。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 完整清單與 ID |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | CF Worker 邏輯分析 |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 故障診斷指南，使用這些 API 進行排查 |
| [`../../07-配置與環境/auth-info-config.md`](../../07-配置與環境/auth-info-config.md) | API Key 與憑證完整清單 |
