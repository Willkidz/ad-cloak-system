---
title: "n8n DataTable API 端點參考"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "n8n DataTable REST API 端點列表（10 個端點），關鍵注意事項：路徑必須用 /data-tables（含連字號），manus_memory 表 ID 為 RSVBymwsyOBoSg7K。"
id: "20260325-datatable-api"
type: "reference"
tags: [api, godview, manus, n8n]
status: "archived"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: n8n DataTable API 共有 10 個 RESTful 端點，支援 CRUD 與 Upsert 操作。**最關鍵的陷阱**：API 基礎路徑必須是 `/data-tables`（含連字號），使用 `/datatables`（無連字號）會直接導致請求失敗。常用表格 ID：`manus_memory` = `RSVBymwsyOBoSg7K`。

# n8n DataTable API 端點參考

本文檔提供了 n8n 中 DataTable API 的端點列表和相關資訊，旨在作為開發時的快速參考。

---

## 核心規則

<rule id="endpoint-path">
與 n8n DataTable 互動時，API 的基礎路徑是 `/data-tables`，中間包含一個連字號。使用不含連字號的 `/datatables` 將會導致請求失敗。
</rule>

---

## API 端點列表

下表詳細列出了對 DataTable 進行操作的各個 API 端點及其功能。

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

## 特定表格 ID

以下是常用 DataTable 的 ID，方便快速取用。

| DataTable 名稱 | ID |
| :--- | :--- |
| **manus_memory** | `RSVBymwsyOBoSg7K` |

---

## 結論

正確使用 n8n DataTable API 的關鍵在於掌握其 RESTful 端點的結構，特別是路徑中 `/data-tables` 的連字號。開發者應依據本文件提供的端點列表進行操作，以確保資料庫互動的順利進行。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N API 操作指南](godview-n8n-api-notes.md) | DataTable API 的使用範例與 Header 規範 |
| [N8N API Key 分析](godview-n8n-api-key-analysis.md) | API Key 安全性審計報告 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 workflow 架構總覽 |
