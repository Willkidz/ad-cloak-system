---
title: "像素庫與 CAPI Token 鏈路分析報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-02"
summary: "分析像素庫設定、shadow-cloak 與 N8N CAPI 發送之間的資料鏈路與三個關鍵斷層。"
version: "v1.0"
date: "2026-04-03"
description: "分析前台像素庫設定至 N8N CAPI 發送的完整資料流向與落差"
tags: [godview, line-redirect, attribution, troubleshooting]
---
# 像素庫與 CAPI Token 鏈路分析報告

本報告針對系統中的「像素庫」功能與 Meta CAPI Token 的實際運作鏈路進行深度分析，確認從前台 UI 設定到 N8N 發送事件的過程中，資料是如何傳遞的，以及是否存在落差。

## 1. 像素資料的實際來源分析

經過對前台（`cloak-admin`）、後端 API（`cloak-admin-api`）、邊緣節點（`shadow-cloak`）以及自動化工作流（N8N）的線上實際程式碼分析，我們發現目前的像素機制存在**嚴重的斷層**。

### 1.1 前台設定與資料庫儲存
- **前台 UI**：在 `Pixels.tsx` 中提供了完整的像素庫管理介面，允許使用者新增 AD 與 BC 類型的像素，並填寫 Pixel ID 與 CAPI Token。
- **資料庫**：D1 資料庫中確實存在 `pixels_library` 表，且已成功存入 5 筆像素資料（如 JD-兩斤炭吉、N20-蘇主金等）。
- **後端 API**：**這是第一個斷層**。雖然前台有呼叫 `/api/v1/pixels` 的邏輯，但線上實際部署的 `cloak-admin-api` Worker 程式碼中，**完全沒有實作 `/pixels` 相關路由**。這意味著前台的像素管理功能目前無法正常透過 API 寫入或讀取資料。

### 1.2 邊緣節點 (shadow-cloak) 讀取邏輯
在 `shadow-cloak` 的線上程式碼中，對於像素的處理邏輯如下：
1. **讀取 Pixel ID**：從 `campaigns` 表的 `pixel_fb` 欄位讀取單一的 Pixel ID（`const pixelId = campaignConfig.pixel_fb || "";`）。
2. **讀取 CAPI Token**：從 Cloudflare KV 空間（`CLOAKER_CONFIG`）中，嘗試讀取名為 `capi_access_token_${pixelId}` 的鍵值（`await env.CLOAKER_CONFIG.get(...)`）。
3. **實際情況**：**這是第二個斷層**。我們查詢了 `CLOAKER_CONFIG` KV 空間，裡面**完全沒有**任何 `capi_access_token_` 開頭的鍵值。
4. **寫入 Clicks 表**：`shadow-cloak` 將讀取到的 `pixel_fb` 寫入 `clicks` 表的 `pixel_id` 欄位，但**沒有寫入 `capi_token` 欄位**（寫入時對應位置的值為空）。

### 1.3 N8N 工作流 (Time Attribution) 使用邏輯
在 N8N 的 `上帝視角_Time Attribution` 工作流中：
1. **查詢點擊**：透過 `Query Exact Click` 節點從 `clicks` 表中讀取 `pixel_id` 和 `capi_token`。
2. **處理邏輯**：在 `Exact Match` 節點中，程式碼會檢查 `matchData.pixel_id` 和 `matchData.capi_token`。
3. **實際情況**：**這是第三個斷層**。由於 `shadow-cloak` 沒有寫入 `capi_token`，N8N 從資料庫讀取到的 `capi_token` 將會是空的，導致後續的 `Send CAPI` 節點無法成功發送帶有正確 Token 的請求。

## 2. 系統架構落差總結

目前的像素與 CAPI 機制處於「新舊交替」的半成品狀態：

| 元件 | 預期設計（新架構） | 實際現狀（線上程式碼） | 狀態 |
| :--- | :--- | :--- | :--- |
| **前台 UI** | 支援多像素管理（AD/BC）、存入 `pixels_library` | UI 已完成，但呼叫的 API 端點不存在 | ❌ 斷連 |
| **後端 API** | 提供 `/pixels` CRUD，支援 `campaigns` 綁定多像素陣列 | 無 `/pixels` 路由，`campaigns` 仍依賴單一 `pixel_fb` 欄位 | ❌ 未實作 |
| **Shadow-Cloak** | 從 `campaigns` 讀取 `ad_pixels` / `bc_pixels` 陣列並寫入 `clicks` | 只讀取 `pixel_fb`，從 KV 找 Token，且未寫入 `capi_token` 到 `clicks` | ❌ 舊邏輯 |
| **N8N 工作流** | 從 `clicks.pixels` 陣列讀取多個像素與 Token 並發送 | 支援讀取 `pixels` 陣列，但也支援單一 `pixel_id` + `capi_token` | ⚠️ 缺資料 |

## 3. 改善建議與修復方案

為了讓前台設定的像素庫能真正發揮作用並自動串接 CAPI，我們需要進行以下三個階段的修復：

### 階段一：補齊後端 API (cloak-admin-api)
1. 實作 `/api/v1/pixels` 的 CRUD 路由，讓前台的像素庫管理功能可以正常讀寫 `pixels_library` 表。
2. 修改 `/api/v1/campaigns` 的寫入邏輯，支援將選取的像素 ID 陣列存入 `campaigns.ad_pixels` 和 `campaigns.bc_pixels` 欄位（以 JSON 字串格式）。

### 階段二：升級邊緣節點 (shadow-cloak)
1. 修改 `campaigns` 的 SELECT 查詢，加入 `ad_pixels` 和 `bc_pixels` 欄位。
2. 廢棄從 KV 讀取 Token 的舊邏輯。
3. 在寫入 `clicks` 表時，將 `ad_pixels` 和 `bc_pixels` 合併為一個 JSON 陣列（包含 pixel_id、token、is_bc 標記），並存入 `clicks.pixels` 欄位。

### 階段三：確認 N8N 邏輯相容性
目前 N8N 的 `Exact Match` 節點已經具備解析 `pixels` 陣列的能力（`JSON.parse(match.pixels || '[]')`），只要 `shadow-cloak` 能正確將包含 Token 的像素陣列寫入 `clicks.pixels` 欄位，N8N 就能自動對多個像素發送 CAPI 事件，無需修改 N8N 工作流。

---
*報告產生時間：2026-04-03*
