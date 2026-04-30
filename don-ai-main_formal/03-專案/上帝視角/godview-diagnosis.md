---
title: "CAPI Lead 事件缺失診斷報告與排錯手冊"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "對 CAPI Lead 事件缺失問題進行深度診斷，指出因 Worker 未傳遞 pixels、CAPI token 為空及 ad_config 設定錯誤等多重根因導致歸因與事件發送失敗。提供分層診斷模型與具體排查步驟。"
id: "20260328-godview-diagnosis"
type: guide
tags: [capi, cloudflare-d1, cloudflare-workers, godview, n8n, troubleshooting]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告診斷了兩個 Meta 像素（`943527751701905` 和 `1425742365409547`）未收到 `Lead` 事件的根本原因。核心問題在於：(1) `ad_config` 表中存在過時與錯誤配置（ID 3, 4）；(2) Worker 未能將 `pixels` 陣列正確傳遞至 `token_mapping` 表（導致 `aid` 為空）；(3) 唯一的測試記錄中 CAPI token 為空字串。診斷結論為多層次數據鏈路中斷，導致歸因到發送的閉環徹底失效。

# CAPI Lead 事件缺失診斷報告

## 問題摘要

本報告旨在診斷兩個 Facebook 像素均未收到 `Lead` 事件的根本原因。經分析，此問題由數據傳遞鏈路中的多個故障點共同導致。

---

## 資料庫狀態深度分析

### 1. `godview_events` 表
對 50 筆記錄的分析顯示，事件類型分佈不均，其中 `token_matched` 事件僅有一筆，且與目標專案 `BF01` 無關。
- `landing_page_interaction`: 10
- `line_friend_added`: 11
- `redirect_click`: 14
- `token_mapping`: 14
- **`token_matched`**: 1 (token: `2X959`, project: `null`)

### 2. `token_mapping` 表
`token_mapping` 表中的記錄揭示了關鍵問題：
- 大多數記錄的 `aid` 欄位為 `None`，意味著像素資訊在映射過程中遺失。
- 唯一的 `BF01` 專案測試記錄 (TEST1, id=38) 中，`aid` 雖包含像素 ID，但其對應的 CAPI token 卻是空字串：`[{"pixel":"1425742365409547","token":""}]`。

### 3. `ad_config` 表
`ad_config` 表中存在過時與錯誤的設定，干擾了正確配置的讀取：
- `id=3`: `BF01` 專案錯配了 `Kolpona BM` 的 CAPI token。
- `id=4`: `BF01` 專案關聯到一個已棄用的像素 ID。
- `id=5`: `BF01` 專案與像素 `943527751701905` 的正確配置。
- `id=6`: `BF01` 專案與像素 `1425742365409547` 的正確配置。

---

## 根本原因分析 (Root Cause)

<boundaries id="root-cause-analysis">

1. **Worker 未傳遞 Pixels 資料**：Worker 在建立 `token_mapping` 記錄時，未能將 `pixels` 陣列正確傳遞。這導致 `aid` 欄位為空，使得後續歸因無法與任何像素關聯。
2. **CAPI Token 為空**：在唯一的 `BF01` 測試記錄中，雖然包含了像素 ID，但 CAPI token 為空字串。這使得即使歸因成功，也無法調用 CAPI 進行事件發送。
3. **`ad_config` 設定重複與錯配**：`id=3` 和 `id=4` 的過時記錄可能導致 Config API 在被 Worker 調用時返回了錯誤的像素與 Token 配置。
4. **歸因記錄缺失**：由於上述原因，系統中沒有任何一筆成功的 `token_matched` 記錄是屬於 `BF01` 專案的，導致歸因後的 CAPI 發送流程從未被觸發。

</boundaries>

---

## 故障分層診斷模型

<rule id="diagnostic-matrix">

| 故障環節 | 常見現象 | 排查工具 | 核心檢查點 |
| :--- | :--- | :--- | :--- |
| **前端落地頁** | 點擊按鈕無反應 | Chrome DevTools | `landing_page_script.js` 是否加載 |
| **中繼跳轉** | 跳轉後 URL 缺少 token | Wrangler Tail | CF Worker 邏輯是否報錯 |
| **後端歸因** | Sheets 數據不更新 | n8n Execution Log | Webhook 是否成功觸發 |

</rule>

---

## 修復與排錯步驟

<step id="diag-sop-1">

**1. 手動驗證 CAPI**：直接使用 CAPI API 手動發送一個測試 `Lead` 事件，以驗證像素 ID 和 CAPI token 本身的有效性。

</step>

<step id="diag-sop-2">

**2. 清理 `ad_config`**：刪除 `ad_config` 表中 `id=3` 和 `id=4` 的過時記錄，確保只保留 `id=5` 和 `id=6` 的正確配置。

</step>

<step id="diag-sop-3">

**3. 驗證 Worker 數據傳遞**：觸發一次完整的用戶流程，檢查 Worker 是否能將正確的 `pixels` 陣列傳遞給 `token-mapping` 的 Webhook。

</step>

<step id="diag-sop-4">

**4. 檢查 D1 寫入**：確認 `clicks` 表中存在對應 Token 的紀錄，否則後端無法完成歸因。

</step>

---

## 結論

診斷的關鍵在於「隔離問題」。通過分層排查，可以迅速定位是前端腳本、中繼 Worker 還是後端 n8n 出現了問題。目前的 `Lead` 事件缺失是多層次的數據鏈路中斷，必須從清理配置和修復 Worker 數據傳遞入手。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 歸因系統故障診斷指南 (SOP) |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | 中繼站像素邏輯分析 |
| [`godview-current-status.md`](godview-current-status.md) | 系統當前運行狀態報告 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統 v3 架構總綱 |
