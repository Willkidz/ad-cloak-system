---
title: "歸因系統故障診斷指南"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "上帝視角歸因系統的標準化故障排查 SOP：4 步診斷法（CF Worker 跳轉 → n8n Webhook 接收 → D1 數據查詢 → LINE Webhook 設定），涵蓋數據不更新、歸因顯示未知、CAPI 回傳失敗、時間窗口匹配失敗等常見問題的根因與解決方案。"
id: "20260328-godview-diagnosis"
type: guide
tags: [attribution, capi, cloudflare-workers, godview, n8n, troubleshooting]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本指南是上帝視角歸因系統的「急救手冊」。當發現 Google Sheets 數據不更新或 Meta CAPI 報錯時，應遵循 **4 步診斷法**：(1) 手動點擊歸因鏈結，確認 CF Worker 正確 302 重定向至 LINE 且 D1 有新增點擊記錄；(2) 登入 n8n 檢查 `上帝視角_Time Attribution`（ID: `dqbdnCN3xdJAahYQ`）的執行紀錄是否為 `success`；(3) 用 D1 API 查詢 `clicks` 表確認原始數據是否正確寫入（`ad_code`、`line_oa_id`、`matched` 狀態）；(4) 在 LINE Developers Console 確認 Webhook URL 指向 `https://n8n.bexnua.store/webhook/line-follow` 且已啟用。常見問題包括：`ad_config` 表中過期記錄導致 Pixel ID 錯誤、Meta Access Token 過期（約 60 天）、高峰期 n8n 執行限額耗盡。

# 歸因系統故障診斷指南

## 快速診斷流程 (4-Step)

當系統出現異常（如歸因數據停止更新、CAPI 回傳失敗、偵測率驟降）時，請按以下順序逐步排查。每一步都應記錄結果，以便在需要升級處理時提供完整的診斷資訊。

---

## 診斷步驟詳解

<step id="diag-step-1">

**步驟一：檢查前端跳轉（CF Worker）**

手動點擊一個歸因鏈結（如 `https://n21.freshpathlab.com/?a=AS01`），觀察以下行為：

1. 瀏覽器是否被 302 重定向至 `https://line.me/R/ti/p/{line_oa_id}`。
2. 使用瀏覽器開發者工具（Network Tab）檢查 Worker 的響應 Header 是否包含正確的 `Location`。
3. 查詢 D1 `clicks` 表，確認是否有對應的新增記錄（`ad_code = 'AS01'`）。

**若跳轉失敗**：檢查 Cloudflare DNS 中 `n21.freshpathlab.com` 的 AAAA 記錄是否存在（可透過 n8n DNS Auto-Sync Workflow 重新同步）。

</step>

<step id="diag-step-2">

**步驟二：驗證 n8n Webhook 接收**

登入 n8n（`https://n8n.bexnua.store`），檢查以下 Workflow 的執行紀錄：

| Workflow | ID | 檢查重點 |
| :--- | :--- | :--- |
| `上帝視角_Click Tracking` | — | 是否收到 Worker POST 的點擊事件 |
| `上帝視角_Time Attribution` | `dqbdnCN3xdJAahYQ` | `follow` 事件是否觸發、執行狀態是否為 `success` |
| `上帝視角_CAPI Health Check` | `uQFTrGvbMHY1TYUX` | 每小時健康檢查是否正常執行 |

**若執行狀態為 `error`**：記錄 `Execution ID`，點進詳情查看具體的錯誤節點與錯誤訊息。常見原因包括 n8n 執行限額耗盡（`Execution limit reached`）或 D1 API 超時。

</step>

<step id="diag-step-3">

**步驟三：查詢 D1 原始數據**

使用 Cloudflare D1 API 執行以下 SQL 查詢，確認數據是否正確寫入：

```sql
-- 查詢最近 10 筆點擊記錄
SELECT click_id, ad_code, line_oa_id, timestamp, matched 
FROM clicks 
ORDER BY timestamp DESC LIMIT 10;

-- 檢查特定 tag 的今日歸因狀況
SELECT 
    COUNT(*) as total_clicks,
    SUM(CASE WHEN matched = 1 THEN 1 ELSE 0 END) as matched_count
FROM clicks 
WHERE line_oa_id = '@目標OA_ID' AND timestamp >= date('now');
```

**若數據缺失**：回到步驟一確認 Worker 是否正常運作。若 Worker 正常但 D1 無數據，檢查 n8n Click Tracking Workflow 是否正確接收並寫入。

</step>

<step id="diag-step-4">

**步驟四：核對 LINE Webhook 設定**

登入 [LINE Developers Console](https://developers.line.biz/)，確認以下設定：

1. Webhook URL 正確指向 `https://n8n.bexnua.store/webhook/line-follow`。
2. 「Use webhook」開關已啟用。
3. 點擊「Verify」按鈕確認連線正常。

**若 Webhook 驗證失敗**：檢查 n8n 是否在線、Webhook 節點是否處於 Active 狀態。

</step>

---

## 常見問題與解決方案

| 現象 | 可能原因 | 解決方案 |
| :--- | :--- | :--- |
| **數據完全不更新** | n8n 執行限額耗盡或服務當機 | 檢查 n8n 狀態頁面，考慮升級方案或降低 Health Check 頻率 |
| **歸因顯示「未知」** | 落地頁 `landing_page_script.js` 未載入，`ad_code` 缺失 | 用瀏覽器 F12 檢查腳本是否正確執行，確認按鈕 URL 包含 `?a={code}` |
| **CAPI 回傳失敗** | Meta Access Token 過期（約 60 天有效期） | 在 n8n 憑證管理中更新 Meta Token，或透過 CAPI Health Check 確認 |
| **偵測率驟降** | `ad_config` 表存在過期記錄（Pixel ID 或 CAPI Token 錯誤） | 清理 `ad_config` 中的無效記錄（如 ID 3、4），重新部署 Worker 刷新快取 |
| **高峰期歸因失敗** | 45 秒時間窗口內有多筆未匹配點擊，歸因邏輯無法唯一確定 | 短期：擴大時間窗口；長期：引入 LIFF SDK 實現精準歸因 |
| **特定 tag 無法歸因** | DNS 記錄缺失（子域名未建立） | 觸發 n8n DNS Auto-Sync Workflow 重新同步 |

---

## 結論

系統穩定性源於細緻的監控與快速的故障響應。建議每週執行一次「端到端驗證」（模擬完整的點擊→加好友→歸因流程），確保所有組件均處於正常狀態。當偵測率低於 80% 時，應立即啟動本指南的 4 步診斷流程。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-api-tools-notes.md`](godview-api-tools-notes.md) | API 工具使用筆記，提供診斷所需的 curl 指令 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱，理解各組件職責 |
| [`godview-analysis-result.md`](godview-analysis-result.md) | 系統分析結果，了解已知瓶頸 |
| [`godview-current-status.md`](godview-current-status.md) | 系統即時狀態報告 |
| [`godview-b-team-attr-verify-cmd.md`](godview-b-team-attr-verify-cmd.md) | B 規劃組驗證指令集 |
