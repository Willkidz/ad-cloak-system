---
title: "廣告追蹤鏈結產生器格式規範"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "定義上帝視角系統中廣告追蹤鏈結的欄位格式、擴充規則與注意事項。包含 24 個 LINE 帳號的廣告代碼擴充需求，確保鏈結參數與子域名映射的一致性。"
id: "20260325-024356"
type: "spec"
tags: [advertising, attribution, dns, documentation, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件定義了廣告追蹤鏈結的標準格式。每個鏈結由 LINE ID、名稱、標籤 (tag) 及廣告代碼 (code) 組成。**核心規範**：`code` 必須為純數字（如 `01`），鏈結格式為 `https://{tag}.freshpathlab.com/?a={code}`。目前需求為將 `bf`、莊家剋星、爆分王、獨角仙擴充至 10 個代碼，其餘帳號擴充至 5 個。所有新產生的鏈結必須確保對應的子域名已在 Cloudflare 完成 DNS 解析。

# 鏈結產生器格式規範

本文檔定義了用於產生廣告追蹤鏈結的資料格式、擴充規則與相關注意事項。

---

## 欄位格式定義

<rule id="format-definition">
每個追蹤鏈結的生成必須基於以下五個核心欄位，嚴格遵守範例格式以確保系統解析正確。
</rule>

| 欄位 | 說明 | 範例 |
| :--- | :--- | :--- |
| **A** | LINE 官方帳號 ID | `@678eohsd` |
| **B** | LINE 官方帳號名稱 | `博富 BOFU` |
| **C** | 帳號標籤 (tag) | `bf` |
| **D** | 廣告代碼 (code) | `01` |
| **E** | 產生的廣告鏈結 | `https://bf.freshpathlab.com/?a=01` |

---

## 擴充需求與現況

### 現況說明

<rule id="current-state">
目前資料庫中，24 個 LINE 帳號各自擁有 2 筆預設資料（`code` 為 `01` 和 `02`），總計 48 筆記錄。
</rule>

### 擴充規則

<rule id="expansion-requirements">
為滿足多管道行銷需求，需按以下規則擴充各帳號的廣告代碼 (ad_code) 數量：
</rule>

| 帳號標籤 (Tag) | 產品名稱 | 擴充目標 | 代碼範圍 |
| :--- | :--- | :--- | :--- |
| `bf` | 博富 BOFU | 10 個 | `01` - `10` |
| `jb` / `cb` / `mb` / `lb` | 莊家剋星系列 | 10 個 | `01` - `10` |
| `jx` / `cx` / `mx` / `lx` | 爆分王系列 | 10 個 | `01` - `10` |
| `js` / `cs` / `ms` / `ls` | 獨角仙系列 | 10 個 | `01` - `10` |
| **其餘所有帳號** | - | 5 個 | `01` - `05` |

---

## 格式注意事項

<boundaries id="naming-constraints">
在處理資料擴充時，務必遵守以下約束以避免歸因失效：
</boundaries>

1.  **代碼純淨性**：`code` 欄位僅允許純數字（例如 `01`, `02`），**嚴禁**包含字母前綴（如 `BF01` 是錯誤的）。
2.  **參數一致性**：廣告鏈結的 query parameter 必須與 `code` 欄位完全一致，例如 `?a=01`。
3.  **子域名依賴**：鏈結中的子域名（如 `bf.freshpathlab.com`）必須與 `tag` 欄位對應，且必須已透過 n8n 自動化流程完成 DNS CNAME 設定。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-subdomain-mapping.md](godview-subdomain-mapping.md) | 子域名命名規則與自動化流程 |
| [godview-tag-mapping.md](godview-tag-mapping.md) | 完整產品標籤與 LINE ID 映射表 |
| [godview-line-redirect-staging-log.md](godview-line-redirect-staging-log.md) | Worker 對 ad_code 的解析邏輯驗證 |
