---
title: "專案改造筆記：DataTable ID 更新與工作流程調整"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "記錄 ad_config DataTable ID 從 ICxZmq8e0vPZHX5j 變更為 vILi9V1mv3ouo6EM，以及 Config API、Sheets Report、Token Attribution 三個 workflow 的對應調整（移除 padStart 補零、停用 Reply to LINE User、簡化成效表欄位）。"
id: "20260325-rebuild-log"
type: "log"
tags: [attribution, godview, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 核心變更：`ad_config` DataTable ID 從 `ICxZmq8e0vPZHX5j` 更新為 `vILi9V1mv3ouo6EM`（`godview_events` 和 `line_config` 不變）。需連動調整三個 workflow：(1) **Config API**（`UCRZ0YDp4ZERmgqk`）的 Build Config 節點更新 DataTable URL；(2) **Token Attribution**（`uzOw6B8wPUyeAWl8`）停用 Reply to LINE User 節點、`project` 欄位改存完整 code 不再 `padStart` 補零；(3) **Sheets Report**（`dqbdnCN3xdJAahYQ`）移除 `padStart(2,'0')` 補零、移除自動填寫廣告帳戶 ID 與人員邏輯、簡化成效表欄位。

# 專案改造筆記：DataTable ID 更新與工作流程調整

本文檔記錄了專案中核心資料表（DataTable）ID 的變更，並列出了因此需要進行調整的相關 API 和工作流程。

---

## 資料表 ID 變更對照

| 資料表 | 舊 ID | 新 ID | 備註 |
| :--- | :--- | :--- | :--- |
| `ad_config` | `ICxZmq8e0vPZHX5j` | `vILi9V1mv3ouo6EM` | **已變更** |
| `godview_events` | `9TFf8tCRvfXRstrS` | `9TFf8tCRvfXRstrS` | 不變 |
| `line_config` | `1VvB8jijHE5GXbv6` | `1VvB8jijHE5GXbv6` | 不變 |

---

## 需要更新 `ad_config` ID 的位置

<step id="update-config-api">
在 **Config API (`UCRZ0YDp4ZERmgqk`)** 的 Build Config 節點中，更新其引用的 `ad_config` DataTable URL。
</step>

<step id="update-sheets-report">
檢查 **Sheets Report (`dqbdnCN3xdJAahYQ`)** 中是否有直接引用舊的 `ad_config` ID，若有則一併更新。
</step>

---

## 待改造的工作流程

### Token Attribution (`uzOw6B8wPUyeAWl8`)

<step id="token-attribution-disable-reply">
停用 `Reply to LINE User` 節點。
</step>

<step id="token-attribution-save-event">
在 `Save Token Match Event` 步驟中，`project` 欄位應直接儲存完整的 code，不再使用 `padStart` 進行補零。
</step>

### Sheets Report (`dqbdnCN3xdJAahYQ`)

<step id="sheets-report-remove-padding">
在 `Calculate Stats` 步驟中，移除 `padStart(2,'0')` 的補零邏輯。
</step>

<step id="sheets-report-remove-autofill">
在 `Calculate Stats` 步驟中，移除自動填寫廣告帳戶 ID 與相關人員的邏輯。
</step>

<step id="sheets-report-simplify-fields">
在 `Calculate Stats` 步驟中，簡化成效表的欄位。
</step>

### Config API (`UCRZ0YDp4ZERmgqk`)

<step id="config-api-update-datatable">
在 `Build Config` 步驟中，將 `ad_config` 的 DataTable ID 更新為新版 ID `vILi9V1mv3ouo6EM`。
</step>

---

## 結論

此次改造的核心是統一與簡化資料處理邏輯，特別是 `ad_config` ID 的更新。務必確保所有相關的工作流程都已根據本文件完成調整，以避免資料處理中斷或錯誤。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與 ID |
| [N8N DataTable API 分析](../../09-歸檔/03-專案/上帝視角/godview-n8n-datatable-api.md) | DataTable API 的呼叫方式與端點（已歸檔） |
| [新成效分頁欄位設計](godview-new-columns-arch.md) | 簡化後的成效表 14 欄位定義 |
| [成效分頁目前狀態](godview-sheets-state.md) | 當前 Google Sheets 的實際佈局與差異 |
