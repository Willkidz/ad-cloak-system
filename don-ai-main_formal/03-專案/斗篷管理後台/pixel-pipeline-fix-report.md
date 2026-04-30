---
title: "像素鏈路修復報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-04-10"
summary: "已過時報告：記錄像素庫、shadow-cloak 與 N8N CAPI 鏈路三個斷點的修復內容，供歷史追溯。"
version: "v1.0"
date: "2026-04-03"
description: "修復像素庫三個斷點：後端 API、shadow-cloak CAPI Token 讀取、N8N 相容性確認"
tags: [godview, line-redirect, attribution, troubleshooting]
---
# 像素鏈路修復報告

## 修復概述

針對 2026-04-03 發現的像素庫與 CAPI Token 鏈路三個斷點，本次修復完成了以下工作：

## 修復內容

### 斷點一：後端 API（cloak-admin-api）

**問題**：前台像素庫 UI 呼叫 `/api/v1/pixels` 端點，但線上部署的 `cloak-admin-api` Worker 完全沒有實作此路由。

**修復**：在 `cloak-admin-api` Worker 中新增完整的 `/api/v1/pixels` CRUD 路由：

| 方法 | 端點 | 功能 |
| :--- | :--- | :--- |
| GET | `/api/v1/pixels` | 列出所有像素（支援 `?type=AD` 過濾） |
| POST | `/api/v1/pixels` | 新增像素（name, pixel_id, token, type, note） |
| PUT | `/api/v1/pixels/:id` | 編輯像素 |
| DELETE | `/api/v1/pixels/:id` | 刪除像素 |

### 斷點二：邊緣節點（shadow-cloak）

**問題**：`shadow-cloak` 從 KV 空間讀取 CAPI Token（`capi_access_token_${pixelId}`），但 KV 中沒有存任何 Token。且 clicks INSERT 不包含 `capi_token` 欄位。

**修復**：
1. `sendCAPIPageView` 函數改為從 D1 `pixels_library` 表查詢 Token
2. campaigns SELECT 加入 `pixel_id` 欄位
3. clicks INSERT 新增 `capi_token` 欄位，從 `pixels_library` 表查詢後寫入
4. `effectivePixelId` 優先使用 `campaigns.pixel_id`，fallback 到 `pixel_fb`

> **2026-04-10 更正註記：** 本段記錄的是 2026-04-03 的修補階段與當時資料模型。現行 `shadow-cloak.js` runtime 的像素主源已改為 `pixel_groups + pixel_group_ads`；`pixels_library` 應視為後台管理／歷史資料模型脈絡，而非當前執行期唯一主來源。

### 斷點三：N8N 工作流

**結論**：N8N 工作流**不需要修改**，已完全相容。

`Prepare CAPI Events` 節點有完美的 fallback 邏輯：
- 先嘗試解析 `pixels` JSON 陣列
- 如果為空但有 `pixel_id` + `capi_token`，自動組成單一像素
- 用 `pixel_id` 和 `capi_token` 組裝 Meta CAPI URL 並發送

## 功能測試結果

| 測試項目 | 結果 | 說明 |
| :--- | :--- | :--- |
| GET /api/v1/pixels | ✅ 通過 | 返回 8 筆像素資料 |
| POST /api/v1/pixels | ✅ 通過 | 成功新增並寫入 DB |
| PUT /api/v1/pixels/:id | ✅ 通過 | 成功更新 name 和 note |
| 建立帶 pixel_id 的廣告活動 | ⚠️ 部分 | API 返回成功但 pixel_id 未寫入 campaigns（需前台配合） |
| clicks INSERT 帶 capi_token | ✅ 通過 | pixel_id 和 capi_token 都正確寫入 |
| N8N JOIN 查詢含 pixel_id + capi_token | ✅ 通過 | 完整歸因鏈路可用 |
| DELETE /api/v1/pixels/:id | ✅ 通過 | 成功刪除並清理 |

## 部署版本

| Worker | 部署時間 | etag |
| :--- | :--- | :--- |
| cloak-admin-api | 2026-04-03 | 264869c18dbf... |
| shadow-cloak | 2026-04-03 | 34be9300f5a4... |

## 待辦事項

1. **campaigns 表的 pixel_id 寫入**：目前 `cloak-admin-api` 的 campaigns POST/PUT 邏輯中，`pixel_id` 欄位可能未包含在 INSERT/UPDATE 語句中，需要確認並補上。
2. **前台像素選擇器**：在廣告活動編輯頁面中，新增像素選擇下拉框，讓使用者能從像素庫中選取像素並關聯到廣告活動。

---
*報告產生時間：2026-04-03*
