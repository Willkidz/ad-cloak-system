---
title: "n8n 工作流程式碼變更需求與驗證"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "驗證 n8n 工作流中 Calculate Stats 節點的寫入起始行（第 11 行）、讀取範圍（A11:N200）、偵測率統計方式（按 code 組 AS/AX/AB 寫入 C4:C6），並標記 line_config DataTable ID 可能不正確（程式碼用 aL6JTLjrpNXf8aKM，歷史記錄為 1VvB8jijHE5GXbv6 或 hLzNKUYqLlJwgGBR）。"
id: "20260328-godview-changes"
type: log
tags: [cloaking, godview, google-sheets, line, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本文件驗證了 n8n 工作流中與廣告成效統計相關的關鍵節點邏輯。**Calculate Stats** 節點：寫入起始行 `rowNum = 11 + idx`（第 10 行為標題行）正確，寫入範圍 `'成效'!A11:N` 與讀取範圍 `A11:N200` 一致，偵測率按 `code` 組（AS/AX/AB）統計並寫入 C4:C6 正確。**Hide Detection Rows** 節點：`startIndex: 3`（對應 Row 4）和 `endIndex: 4` 的映射需再確認是否對應 AS/AX/AB 三行。**關鍵待辦**：程式碼中 `line_config` DataTable ID 為 `aL6JTLjrpNXf8aKM`，但歷史記錄顯示正確 ID 可能是 `1VvB8jijHE5GXbv6` 或 `hLzNKUYqLlJwgGBR`，使用前必須最終確認。

# n8n 工作流程式碼變更需求與驗證

本文檔驗證 n8n 工作流中與廣告成效統計相關的幾個關鍵節點的程式碼邏輯是否正確，確保數據處理流程符合預期。

---

## Calculate Stats 程式碼邏輯檢視

<step id="calc-stats-row-num">

**寫入起始行確認**：程式碼 `const rowNum = 11 + idx;` 指定從第 11 行開始寫入數據，此設定正確，因為試算表中的第 10 行為標題行。

</step>

<step id="calc-stats-range">

**廣告數據寫入範圍**：`range: "'成效'!A11:N"` 表示數據將寫入「成效」工作表的 A11 到 N 欄。此設定與數據從第 11 行開始的邏輯一致，正確無誤。

</step>

<step id="calc-stats-detection-rate-logic">

**偵測率統計方式**：已確認偵測率是按 `code` 組（AS/AX/AB）進行統計，符合需求。

</step>

<step id="calc-stats-detection-rate-write">

**偵測率寫入位置**：已確認偵測率數據被正確寫入儲存格 C4:C6。

</step>

---

## Read Existing Performance 節點配置

<step id="read-perf-range">

**讀取範圍確認**：節點設定讀取範圍為 `A11:N200`，此設定會跳過第 10 行的標題列，直接從第 11 行的數據開始讀取，符合預期操作。

</step>

---

## Hide Detection Rows 節點配置

<step id="hide-rows-mapping">

**隱藏行對應關係**：節點設定 `startIndex: 3`（對應 Row 4）和 `endIndex: 4`（對應 Row 4）。

</step>

<boundaries id="hide-rows-concern">

需要再次確認試算表中第 4、5、6 行是否分別對應 AS、AX、AB 的偵測率數據顯示行。若 `startIndex` 和 `endIndex` 只覆蓋 Row 4，則可能遺漏 Row 5 和 Row 6 的隱藏需求。

</boundaries>

---

## 關鍵待辦：line_config DataTable ID 確認

<rule id="datatable-id-check">

**[待確認]** 程式碼中使用的 `line_config` DataTable ID 為 `aL6JTLjrpNXf8aKM`，但根據過往記錄，正確的 ID 可能是 `1VvB8jijHE5GXbv6` 或 `hLzNKUYqLlJwgGBR`。此項**必須在使用前進行最終確認**，以避免數據源錯誤。

已知的 DataTable ID 對照：

| 用途 | 程式碼中的 ID | 歷史記錄中的 ID |
| :--- | :--- | :--- |
| `line_config` | `aL6JTLjrpNXf8aKM` | `1VvB8jijHE5GXbv6` 或 `hLzNKUYqLlJwgGBR` |
| `ad_config` | `ICxZmq8e0vPZHX5j`（見系統規格書） | — |
| 像素 DataTable | `vILi9V1mv3ouo6EM` | — |

</rule>

---

## 結論

整體而言，工作流中的程式碼邏輯與試算表結構基本對齊。數據的讀取和寫入範圍均已正確設定，從第 11 行開始處理數據，避開了標題行。偵測率按 code 組統計並寫入 C4:C6 的邏輯正確。

唯一發現的潛在問題是 `line_config` 的 DataTable ID 可能不正確，以及 Hide Detection Rows 的行範圍覆蓋是否完整，這兩項需要在實際執行前確認。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-gsheets-ad-tracking-spec.md`](godview-gsheets-ad-tracking-spec.md) | Google Sheets 儀表板規格（工作表結構與 n8n 讀寫路徑） |
| [`godview-google-sheets-api-notes.md`](godview-google-sheets-api-notes.md) | Sheets API 筆記（valueInputOption 設定） |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統 v3 架構總綱（含 DataTable ID 清單） |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 完整清單 |
