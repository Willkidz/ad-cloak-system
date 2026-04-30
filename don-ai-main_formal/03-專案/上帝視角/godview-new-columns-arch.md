---
title: "新成效分頁欄位設計"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "定義新版成效分頁的 14 個欄位（A-N）：code（AS01 格式）、廣告帳戶ID、累計/區間消耗與添加、CPA、流失率等，移除原有人員和項目欄位，整合至 code。"
id: "20260325-new-columns"
type: "spec"
tags: [conversion, godview, google-sheets]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 新版成效分頁共 14 個欄位（A-N）。自動欄位：`code`（AS01 格式唯一識別碼）、累計消耗/添加/CPA、區間消耗/添加、單次添加（區間 CPA）；手動欄位：廣告帳戶ID、素材說明、狀態、區間成果；公式欄位：流失 = `區間成果 - 區間添加`、添加占比 = `區間添加 / 區間成果`、單次成果 = `區間消耗 / 區間成果`。原有的「人員」和「項目」欄位已移除，相關資訊整合至 `code` 欄位。

# 新成效分頁欄位設計

本文檔旨在定義「上帝視角」專案中，新版成效分頁所使用的欄位結構與內容來源。

---

## 新欄位結構

新結構共包含 14 個欄位（A 至 N），詳細定義如下：

| 欄 | 名稱 | 來源 | 說明 |
| :--- | :--- | :--- | :--- |
| A | code | n8n 自動 | AS01 格式的唯一識別碼 |
| B | 廣告帳戶ID | 手動 | 相關廣告帳戶的 ID |
| C | 素材說明 | 手動 | 用於備註素材相關資訊 |
| D | 狀態 | 手動/自動 | 廣告活動的當前狀態（例如：進行中、暫停、已結束） |
| E | 累計消耗 | n8n 自動 | 該項目自開始以來的總花費 |
| F | 累計添加 | n8n 自動 | 該項目自開始以來的總添加次數 |
| G | 累計CPA | n8n 自動 | 累計的單次添加成本 (Cost Per Acquisition) |
| H | 區間消耗 | n8n 自動 | 特定時間區間內的總花費 |
| I | 區間成果 | 手動 | 由人員填寫的特定區間內真實成果數字 |
| J | 區間添加 | n8n 自動 | 特定時間區間內的總添加次數 |
| K | 流失 | 公式 | `I - J`（區間成果 - 區間添加） |
| L | 添加占比 | 公式 | `J / I`（區間添加 / 區間成果） |
| M | 單次添加 | n8n 自動 | 特定區間的單次添加成本 (區間 CPA) |
| N | 單次成果 | 公式 | `H / I`（區間消耗 / 區間成果） |

<boundaries id="data-source-types">
欄位資料來源分為三類：
- **n8n 自動**（A, E, F, G, H, J, M）：由 n8n workflow 自動從 D1 或 Facebook API 拉取並寫入。
- **手動**（B, C, D, I）：需由操作人員在 Google Sheets 中手動填寫。
- **公式**（K, L, N）：由 Google Sheets 公式自動計算，依賴手動和自動欄位的數據。
</boundaries>

---

## 移除的欄位

為了簡化結構並避免資訊冗餘，以下原有欄位已被移除：

- **人員 (原 C 欄)**：相關資訊已整合至 `code` 欄位。
- **項目 (原 D 欄)**：相關資訊已整合至 `code` 欄位。

<rule id="code-field-convention">
`code` 欄位採用 `{產品前綴}{序號}` 格式（如 `AS01`、`BF03`），其中產品前綴即為 `TAG_PREFIX_MAP` 中定義的映射值，序號為該產品線下的流水號。此設計使得人員和項目資訊可從 code 直接推導，無需額外欄位。
</rule>

---

## 結論

此新設計旨在標準化成效數據的追蹤方式，透過自動化與手動輸入的結合，提供更清晰、準確的成效概覽。統一的 `code` 欄位將取代過去分散的人員和項目資訊，提升數據管理效率。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [Google Sheets 狀態](godview-sheets-state.md) | 成效分頁的當前 Google Sheets 狀態 |
| [Google Sheets API 操作指南](godview-google-sheets-api-notes.md) | n8n 與 Google Sheets 的 API 互動方式 |
| [廣告追蹤數據分析](godview-ad-tracking-data-analysis.md) | 成效數據的來源與分析 |
