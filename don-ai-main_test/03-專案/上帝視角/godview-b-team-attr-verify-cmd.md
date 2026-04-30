---
title: "B 規劃組 — 歸因系統驗證指令集"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "B 規劃組的標準化歸因驗證 SOP：三大任務包括端到端歸因驗證（點擊→加好友→Sheets _添加日誌核對）、n8n 每日 10:00 例行監控（Time Attribution 執行狀態檢查）、D1 數據完整性 SQL 查詢（visitor_id/tag 缺失率統計），最終產出歸因數據報表。"
id: "20260328-godview-b-team-cmd"
type: spec
tags: [attribution, cloudflare-d1, godview, google-sheets, n8n, sop]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本指令集是 B 規劃組驗證歸因系統數據準確性的標準作業程序（SOP），包含三大任務：(1) **端到端歸因驗證**：使用測試手機點擊廣告鏈結（如 `https://n21.freshpathlab.com/?a=AS01`），完成 LINE 加好友後，在 Google Sheets「_添加日誌」分頁確認該筆記錄出現且 `code` 匹配正確；(2) **n8n 執行監控**：每日上午 10:00 檢查 `上帝視角_Time Attribution`（ID: `dqbdnCN3xdJAahYQ`）的執行紀錄，確認 `follow` 事件狀態為 `success`，若出現 `error` 需記錄 `Execution ID` 提交技術組；(3) **D1 數據完整性查詢**：使用 SQL 統計 `clicks` 表的總記錄數、`visitor_id` 缺失數與 `tag` 缺失數，識別數據品質問題。驗證結果需整理至「歸因數據報表」提交。

# B 規劃組 — 歸因系統驗證指令集

## 任務一：端到端歸因驗證 (E2E)

### 目標

模擬真實用戶行為，確認從廣告點擊到 LINE 加好友的完整數據鏈路暢通無阻。此驗證應在每次系統變更後、以及每週例行執行一次。

<step id="e2e-step-1">

**1. 點擊測試**：使用測試手機（非公司 Wi-Fi 網路，模擬真實用戶環境）點擊一個廣告鏈結，例如 `https://n21.freshpathlab.com/?a=AS01`。記錄以下資訊：

- 跳轉後的完整 URL（確認是否被 302 重定向至 `https://line.me/R/ti/p/...`）。
- 點擊時間（精確到秒，用於後續核對）。
- 使用的 `ad_code`（本例為 `AS01`）。

</step>

<step id="e2e-step-2">

**2. 加好友測試**：在 LINE 中完成加好友動作。注意：必須在點擊後 **45 秒內** 完成加好友，否則時間歸因窗口將關閉，導致本次測試無法匹配。

</step>

<step id="e2e-step-3">

**3. 數據核對**：等待約 1-2 分鐘後，在 Google Sheets（ID: `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I`）的「_添加日誌」分頁中，確認以下事項：

- 是否出現了新的記錄。
- 記錄中的 `code` 欄位是否為 `AS01`（與測試使用的 `ad_code` 一致）。
- 記錄中的時間是否與點擊時間接近。

**若未出現記錄**：按照 [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) 的 4 步診斷法進行排查。

</step>

---

## 任務二：n8n 執行監控

<rule id="n8n-monitor-rule">

### 監控規範

| 項目 | 要求 |
| :--- | :--- |
| **檢查頻率** | 每日上午 10:00 進行例行檢查 |
| **檢查目標** | `上帝視角_Time Attribution` Workflow（ID: `dqbdnCN3xdJAahYQ`） |
| **成功標準** | 前一日所有 `follow` 事件的執行狀態均為 `success` |
| **異常處理** | 若出現 `error` 狀態，記錄 `Execution ID` 並截圖錯誤詳情，提交給技術組 |

### 檢查步驟

1. 登入 n8n（`https://n8n.bexnua.store`）。
2. 進入 `上帝視角_Time Attribution` Workflow 的執行紀錄頁面。
3. 篩選前一日的執行紀錄，逐一確認狀態。
4. 若發現 `error`，點進詳情頁面，記錄錯誤發生的節點名稱與錯誤訊息。

</rule>

---

## 任務三：D1 數據完整性查詢

使用以下 SQL 檢查 `clicks` 表的數據健康狀況。可透過 Cloudflare D1 API 或請技術組協助執行。

<example id="d1-health-check">

```sql
-- 數據完整性總覽
SELECT 
    COUNT(*) as total_records, 
    SUM(CASE WHEN visitor_id IS NULL THEN 1 ELSE 0 END) as missing_visitor_id,
    SUM(CASE WHEN tag IS NULL THEN 1 ELSE 0 END) as missing_tag,
    SUM(CASE WHEN ad_code IS NULL OR ad_code = '' THEN 1 ELSE 0 END) as missing_ad_code,
    SUM(CASE WHEN matched = 1 THEN 1 ELSE 0 END) as matched_count
FROM clicks
WHERE timestamp >= date('now', '-1 day');
```

</example>

### 判讀標準

| 指標 | 正常範圍 | 異常處理 |
| :--- | :--- | :--- |
| `missing_visitor_id` | < 1% of total | 檢查 Worker 是否正確生成 visitor_id |
| `missing_tag` | 0 | 嚴重異常，立即通知技術組 |
| `missing_ad_code` | < 3% of total | 檢查火鳥落地頁按鈕設定 |
| `matched_count / total` | > 80% | 低於此值需啟動診斷流程 |

---

## 結論

B 規劃組的職責是守護歸因數據的「真實性」。請嚴格執行本指令集中的三大任務，並將每次驗證的結果（E2E 測試結果、n8n 執行狀態、D1 數據完整性指標）整理至「歸因數據報表」中提交。任何異常發現都應及時記錄並升級處理。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 故障診斷指南，E2E 驗證失敗時的排查流程 |
| [`godview-gsheets-ad-tracking-spec.md`](godview-gsheets-ad-tracking-spec.md) | Google Sheets 各分頁功能說明 |
| [`godview-api-tools-notes.md`](godview-api-tools-notes.md) | D1 API 查詢的 curl 指令範例 |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 完整清單與 ID |
