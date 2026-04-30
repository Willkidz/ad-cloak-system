---
title: "配置與環境索引"
category: "config"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "服務配置、認證資訊、N8N 工作流結構等文件的摘要索引，包含 3 個 Markdown 文件和 9 個 JSON/TXT 資料文件。"
id: "20260325-IDX-07"
type: "index"
tags: [configuration, index]
status: "active"
created: "2026-03-25"
updated: "2026-03-30"
---

> **TL;DR**: 本目錄存放所有服務配置、認證資訊與 N8N 工作流結構，共 3 個 Markdown 文件和 9 個 JSON/TXT 資料文件。查服務概覽看 `service-list-config.md`；查完整 Token/API Key 看 `auth-info-config.md`；查 N8N 工作流 ID 與 Webhook 路徑看 `n8n-workflow-arch.md`。認證資訊僅存於 private repo，操作前請確認已讀取安全護欄規則。

# 07-配置與環境 索引

本資料夾存放服務配置、認證資訊、N8N 工作流結構及 D1 資料庫匯出等資料。包含 3 個 Markdown 文件和 9 個 JSON/TXT 資料文件。

> **安全提示**：認證資訊（含 Token、API Key）僅存放於 private repo，請勿外洩。操作前請確認已讀取 [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) 中的機密洩漏防護規則。

---

## Markdown 文件清單（3 個）

| 文件 | 標題 | 優先級 | 摘要 |
| :--- | :--- | :--- | :--- |
| [服務清單.md](service-list-config.md) | 服務清單 | high | 所有使用中的 7 項服務帳號設定清單（不含密碼/Token），包含 Cloudflare、Contabo、N8N、Facebook、LINE、GitHub、Telegram |
| [認證資訊彙整.md](auth-info-config.md) | 認證資訊彙整 | critical | 所有服務的完整認證資訊：Cloudflare、Facebook CAPI、LINE OA（24 個）、N8N、GitHub PAT、Telegram Bot |
| [N8N工作流結構.md](n8n-workflow-arch.md) | N8N 工作流結構 | high | N8N 伺服器資訊、9 個工作流清單（6 啟用 + 3 停用，含 ID、Webhook 路徑、觸發方式）、2 個 Credentials、Telegram Bot 配置 |

---

## 資料文件清單（9 個）

| 文件 | 類型 | 說明 |
| :--- | :--- | :--- |
| [D1_ad_config.json](./D1_ad_config.json) | JSON | D1 廣告配置匯出（20 筆記錄，8KB） |
| [D1_line_config.json](./D1_line_config.json) | JSON | D1 LINE 配置匯出（24 筆記錄，7KB） |
| [clicks_schema.txt](./clicks_schema.txt) | TXT | clicks 表結構定義 |
| [column_mapping.txt](./column_mapping.txt) | TXT | 欄位映射定義 |
| [confirmed_mapping.json](./confirmed_mapping.json) | JSON | 已確認的映射配置（1KB） |
| [d1q.json](./d1q.json) | JSON | D1 查詢配置 |
| [memory_payload.json](./memory_payload.json) | JSON | 記憶系統 payload 範例（1KB） |
| [new_token_mapping_wf.json](./new_token_mapping_wf.json) | JSON | Token 映射工作流配置（5KB） |
| [time_attribution_modified.json](./time_attribution_modified.json) | JSON | 時間歸因工作流配置（31KB） |

---

## 快速查詢指引

<rule id="config-quick-reference">

| 需要查什麼 | 去哪裡找 |
| :--- | :--- |
| 服務概覽（不含 Token） | [服務清單.md](service-list-config.md) |
| 完整 Token / API Key | [認證資訊彙整.md](auth-info-config.md) |
| N8N 工作流 ID / Webhook 路徑 | [N8N工作流結構.md](n8n-workflow-arch.md) |
| D1 表結構 | [clicks_schema.txt](./clicks_schema.txt) |
| LINE 帳號對應 | [D1_line_config.json](./D1_line_config.json) 或 [認證資訊彙整.md](auth-info-config.md) |
| 廣告像素對應 | [D1_ad_config.json](./D1_ad_config.json) 或 [認證資訊彙整.md](auth-info-config.md) |

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | 安全護欄規則，操作認證資訊前必讀 |
| [`01-核心原則/project-specific-specs.md`](../01-核心原則/project-specific-specs.md) | 五個表的關聯方式與指標計算邏輯，操作 D1 時參考 |
| [`03-專案/上帝視角/_index.md`](../03-專案/上帝視角/_index.md) | 上帝視角專案索引，本目錄的配置主要服務於該專案 |

---

## 統計

- Markdown 文件數量：3
- 資料文件數量：9（manus_memory_full.json 已於 2026-03-31 刪除）
- 最後更新：2026-03-31
