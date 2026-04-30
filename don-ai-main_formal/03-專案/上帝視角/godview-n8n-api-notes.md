---
title: "n8n Data Tables API 調用指南"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "詳細說明如何透過 REST API 與 n8n Data Tables 進行交互，涵蓋查詢、更新與刪除操作的請求格式與認證規範。"
id: "20260328-n8n-api-notes"
type: "guide"
tags: [api, automation, godview, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **注**：本文件提及的 `manus_memory` DataTable 已於 2026-03-30 廢棄（ADR-003），記憶系統已遷移至 don-ai `.ai/` 目錄。以下為歷史記錄。

> **TL;DR**: 本指南為開發者提供 n8n Data Tables API 的標準調用範例。系統目前主要利用此 API 進行廣告配置同步與歸因數據檢索。所有請求必須包含 `X-N8N-API-KEY` Header。請注意，`UPDATE` 操作需指定行 ID，而 `INSERT` 則直接發送數據對象。

# n8n Data Tables API 調用指南

## 認證規範

所有 API 請求必須在 HTTP Header 中攜帶有效的 API Key。

```http
X-N8N-API-KEY: <YOUR_N8N_API_KEY>
Content-Type: application/json
```

---

## 核心操作範例

### 1. 查詢數據表內容 (GET)

<rule id="api-query">
用於獲取特定數據表的所有行。
</rule>

**Endpoint**: `GET /data-tables/{tableId}/rows`

```bash
curl -X GET "https://godview.app.n8n.cloud/api/v1/data-tables/vILi9V1mv3ouo6EM/rows" \
     -H "X-N8N-API-KEY: $N8N_API_KEY"
```

---

### 2. 更新現有行 (PATCH)

<rule id="api-update">
更新操作必須提供目標行的 `id`。
</rule>

**Endpoint**: `PATCH /data-tables/{tableId}/rows/update`

```bash
curl -X PATCH "https://godview.app.n8n.cloud/api/v1/data-tables/vILi9V1mv3ouo6EM/rows/update" \
     -H "X-N8N-API-KEY: $N8N_API_KEY" \
     -d '{
       "id": "row_id_123",
       "status": "active",
       "last_updated": "2026-03-28"
     }'
```

---

### 3. 插入新數據 (POST)

<rule id="api-insert">
插入操作會自動產生新的行 ID。
</rule>

**Endpoint**: `POST /data-tables/{tableId}/rows`

```bash
curl -X POST "https://godview.app.n8n.cloud/api/v1/data-tables/vILi9V1mv3ouo6EM/rows" \
     -H "X-N8N-API-KEY: $N8N_API_KEY" \
     -d '{
       "ad_code": "js99",
       "pixel_id": "987654321",
       "status": "active"
     }'
```

---

## 完整 API 端點列表

> **重要陷阱**：API 基礎路徑必須是 `/data-tables`（含連字號），使用 `/datatables`（無連字號）會直接導致請求失敗。

| 方法 (Method) | 路徑 (Path) | 描述 (Description) |
| :--- | :--- | :--- |
| `GET` | `/data-tables` | 列出所有 DataTable |
| `POST` | `/data-tables` | 建立一個新的 DataTable |
| `GET` | `/data-tables/{dataTableId}` | 獲取特定 DataTable 的詳細資訊 |
| `PATCH` | `/data-tables/{dataTableId}` | 更新指定 DataTable 的屬性 |
| `DELETE` | `/data-tables/{dataTableId}` | 刪除指定的 DataTable |
| `GET` | `/data-tables/{dataTableId}/rows` | 獲取指定 DataTable 中的所有行 |
| `POST` | `/data-tables/{dataTableId}/rows` | 在指定 DataTable 中插入新行 |
| `PATCH` | `/data-tables/{dataTableId}/rows/update` | 更新指定 DataTable 中的現有行 |
| `POST` | `/data-tables/{dataTableId}/rows/upsert` | 更新或插入（Upsert）DataTable 中的行 |
| `DELETE` | `/data-tables/{dataTableId}/rows/delete` | 刪除指定 DataTable 中的行 |

---

## 常用數據表 ID 參考

| 數據表名稱 | 數據表 ID | 用途 |
| :--- | :--- | :--- |
| **Ad Mapping** | `vILi9V1mv3ouo6EM` | 廣告代碼與像素映射 |
| **System Config** | `1VvB8jijHE5GXbv6` | 全域系統參數設定 |
| **CAPI Logs** | `zXyW9V...` | CAPI 發送日誌記錄 |
| **manus_memory** | `RSVBymwsyOBoSg7K` | Manus 記憶存儲 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-n8n-api-key-analysis.md](godview-n8n-api-key-analysis.md) | API Key 安全審計與更新建議 |
| [godview-mapping-spec.md](godview-mapping-spec.md) | 映射表結構定義 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 workflow 架構總覽 |
