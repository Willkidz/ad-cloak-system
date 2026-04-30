---
title: "上帝視角（GodView）— 版本紀錄"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-04-08"
summary: "上帝視角（GodView）廣告歸因系統的完整版本發佈紀錄。v1.0.0 首次正式版本：line-redirect CAPI 像素統一由 D1 pixel_groups 驅動、n8n 像素健康監控工作流上線。v1.0.1 修復：n8n 像素健康監控 workflow fetch is not defined 錯誤修復。"
id: "20260408-godview-changelog"
type: "log"
tags: [changelog, godview, deployment]
status: "active"
created: "2026-04-08"
updated: "2026-04-08"
activation_glob: null
---

> **TL;DR**: 本文件記錄上帝視角（GodView）廣告歸因系統的版本演進。上帝視角是專為博弈廣告設計的歸因與數據追蹤系統，核心組件包含 line-redirect Worker（部署於 `*.freshpathlab.com`）、money-page Worker、preview-page Worker 及 n8n 自動化工作流。v1.0.0 為首次正式版本紀錄，核心變更：line-redirect CAPI 像素解析統一由 D1 `pixel_groups` 表驅動、n8n 像素健康監控工作流上線、歸因通知 SQL 修正。

# 上帝視角（GodView）— 版本紀錄

> **最後更新**：2026-04-08
> **維護單位**：Manus 規劃組

---

## 系統組件

上帝視角系統包含以下核心組件（依據 `05-原始碼/worker-mapping.md`）：

| 組件 | 類型 | 說明 |
| :--- | :--- | :--- |
| `line-redirect` | Cloudflare Worker | LINE 跳轉 + 歸因追蹤，部署於 `*.freshpathlab.com` |
| `line-redirect-staging` | Cloudflare Worker | LINE 跳轉測試版（不自動部署） |
| `money-page` | Cloudflare Worker | 推廣頁 Worker |
| `preview-page` | Cloudflare Worker | 預覽頁 Worker |
| n8n 工作流 | 自動化平台 | 數據大腦：點擊記錄、時間歸因、CAPI 回傳、健康檢查 |
| Google Sheets | 報表 | 數據儀表板：廣告消耗與歸因成效 |

---

## 版本紀錄總覽

| 版本 | 日期 | 說明 | 執行單位 |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-04-07 | 首次正式版本紀錄：CAPI 像素統一來源 + n8n 像素健康監控 + 歸因通知修復 | Manus 規劃組 |
| v1.0.1 | 2026-04-08 | n8n 像素健康監控 workflow 修復：fetch is not defined 錯誤 + axios-based fetch polyfill | Manus 規劃組 |

---

## v1.0.0 — CAPI 像素統一來源 + n8n 像素健康監控 + 歸因通知修復

**狀態**：已完成 | **完成日期**：2026-04-07~08

v1.0.0 是上帝視角系統的首次正式版本紀錄。此前系統已運行但未建立獨立的版本追蹤。本次版本涵蓋 line-redirect Worker 的 CAPI 像素統一來源改造，以及 n8n 工作流的像素健康監控與歸因通知修復。

### line-redirect Worker

1. **CAPI 像素解析統一**：與 shadow-cloak 一致，完全由 D1 `pixel_groups` 表驅動，移除所有硬編碼 fallback（`FALLBACK_MASTER_PIXEL_MAP`、`FALLBACK_BC_PIXEL`）
2. **[conftp] placeholder 修復**：確保 Facebook Pixel 代碼中的 `[conftp]` 佔位符正確替換為實際像素 ID
3. **visitor_id / event_id 寫入 clicks 表修復**：確保每次點擊的 `visitor_id` 和 `event_id` 正確寫入 D1 `clicks` 表
4. **/refresh-cache 端點**：新增快取刷新端點，密鑰為 `don-ai-refresh-2025`，用於手動觸發像素快取更新
5. **Worker 已部署**：line-redirect Worker 已部署至 Cloudflare

### n8n 工作流

1. **像素健康監控 workflow**（ID: `GtliCqQYv9aPhYNw`）：
   - **執行頻率**：每 30 分鐘自動執行
   - **Token 連通性測試**：檢查每個 BM 組的 CAPI Token 是否有效
   - **橫向/縱向比較**：比較不同 BM 組之間的像素健康狀態，以及同一 BM 組的歷史趨勢
   - **Telegram 異常告警**：發現異常時立即發送 Telegram 通知（Bot Token: `8676944081:...`、Chat ID: `7495585445`）
   - **每 6 小時正常報告**：即使無異常，也定期發送健康狀態摘要
2. **歸因通知 workflow 修復**：修正 SQL 查詢中的欄位名稱錯誤，確保歸因匹配結果正確通知
3. **D1 API 回應路徑修正**：修正 n8n 中 D1 API 回應的資料路徑，從 `.rows` 改為 `.result[0].results`，確保資料正確解析

### 部署狀態

| 組件 | 狀態 | 備註 |
| :--- | :--- | :--- |
| line-redirect Worker | ✅ 已部署 | CAPI 像素統一來源 |
| n8n 像素健康監控 | ✅ 已啟用 | Workflow ID: GtliCqQYv9aPhYNw |
| n8n 歸因通知修復 | ✅ 已修復 | SQL 欄位名修正 |
| D1 API 路徑修正 | ✅ 已修正 | .result[0].results |

### 程式碼檔案

| 檔案名稱 | 版本 | 說明 |
| :--- | :--- | :--- |
| `05-原始碼/上帝視角/line-redirect.js` | v1.0.0 | CAPI 像素統一來源 + visitor_id 修復 + refresh-cache |

---

## 目前線上狀態

| 網域 | Worker | 版本 | 狀態 |
| :--- | :--- | :--- | :--- |
| *.freshpathlab.com | line-redirect | v1.0.0 | ✅ 運行中 |
| — | money-page | — | ✅ 運行中 |
| — | preview-page | — | ✅ 運行中 |

---

## v1.0.1 — n8n 像素健康監控 workflow 修復（fetch is not defined）

**部署時間**：2026-04-08 | **執行單位**：Manus 規劃組

v1.0.1 是针對 v1.0.0 上線後像素健康監控 workflow 發現的執行時期錯誤進行的修復。核心問題：n8n 的 Code 節點中使用了原生 `fetch` API，但 n8n 執行環境不提供原生 `fetch`，導致 workflow 在執行 HTTP 請求時抛出 `fetch is not defined` 錯誤而中斷。

### 變更內容

1. **修復 `fetch is not defined` 錯誤**：n8n 像素健康監控 workflow（ID: `GtliCqQYv9aPhYNw`）的 Code 節點中，將所有原生 `fetch()` 呼叫替換為 axios-based fetch polyfill
2. **加入 axios-based fetch polyfill**：在 Code 節點頂部加入 polyfill 層，透過 `$helpers.httpRequest()` 或 axios 實現 HTTP 請求，確保在 n8n 執行環境中正常運作
3. **workflow 已更新並重新啟用**：修復後 workflow 已重新啟用，每 30 分鐘自動執行正常

### 修復前後對比

| 項目 | 修復前 | 修復後 |
| :--- | :--- | :--- |
| workflow 執行狀態 | 失敗（fetch is not defined） | 正常執行 |
| HTTP 請求方式 | 原生 fetch（不支援） | axios-based polyfill |
| Token 連通性測試 | 無法執行 | 正常檢查 |
| Telegram 告警 | 無法發送 | 正常發送 |

### 部署狀態

| 項目 | 狀態 | 備註 |
| :--- | :--- | :--- |
| n8n workflow 更新 | ✅ | ID: GtliCqQYv9aPhYNw |
| workflow 重新啟用 | ✅ | 每 30 分鐘自動執行 |
| 執行測試 | ✅ | Token 連通性測試正常 |

---

## 後續待辦

<step id="godview-next-steps">

1. **待執行**：
   - line-redirect-staging 測試環境同步更新
   - money-page Worker CAPI 像素統一來源改造
   - preview-page Worker 功能增強
2. **監控**：
   - 持續觀察像素健康監控 workflow 的告警情況
   - 確認歸因匹配率穩定

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`03-專案/上帝視角/godview-ad-tracking-sys-spec.md`](../03-專案/上帝視角/godview-ad-tracking-sys-spec.md) | 上帝視角 v3 系統規格說明書 |
| [`05-原始碼/worker-mapping.md`](../05-原始碼/worker-mapping.md) | Worker 源碼映射表（定義組件歸屬） |
| [`08-任務追蹤/project-changelog.md`](project-changelog.md) | 斗篷管理後台版本紀錄（關聯專案） |
| [`08-任務追蹤/shadow-cloak-changelog.md`](shadow-cloak-changelog.md) | 隱者斗篷版本紀錄（關聯專案） |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前任務狀態（任務狀態唯一來源） |

---

> **文件結束**
> 最後更新：2026-04-08 ｜ Manus 規劃組
