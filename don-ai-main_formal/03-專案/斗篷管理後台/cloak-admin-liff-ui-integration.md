---
title: "前台 UI 整合：LINE LIFF 連結設定統一到分流鏈結頁"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-04-05"
summary: "說明將 LINE LIFF 連結設定整合至分流鏈結頁的 UI 變更、資料流與影響範圍。"
version: "v1.0"
id: "20260405-LIFF-UI-INT"
type: project-doc
tags: [cloak-admin, cloudflare-workers, react, ui-ux, frontend]
status: active
created: "2026-04-05"
updated: "2026-04-05"
---
# 前台 UI 整合：LINE LIFF 連結設定統一到分流鏈結頁

## 背景

在整合之前，cloak-admin 前台存在功能重複的問題。「基本資訊」頁有一個綠色背景的「LINE LIFF 連結設定」區塊，可以新增多個 LIFF 連結、選擇 TAG、填入廣告代號；而「分流鏈結」頁也有「LINE 鏈接」功能，可以新增 LINE 連結並設定分配策略（隨機/輪替/IP 固定）。這兩個功能在概念上重複，容易造成使用者混淆，且 TAG 快速選擇下拉選單因為資料來源錯誤而顯示為空。

## 整合方案

本次整合將 LINE LIFF 連結設定統一到「分流鏈結」頁，移除「基本資訊」頁的重複區塊，並修復 TAG 快速選擇下拉選單的資料來源問題。

## 變更清單

### 前台（cloak-admin / Campaigns.tsx）

| 變更項目 | 說明 |
|---------|------|
| 移除基本資訊頁 LIFF 區塊 | 移除整個綠色背景的「LINE LIFF 連結設定（多連結輪替）」區塊 |
| 保留 ad_code 欄位 | 廣告代號欄位保留在基本資訊頁 |
| 分流鏈結頁新增 LIFF 區塊 | 新增綠色背景的「LINE LIFF 連結」區塊，支援 `https://liff.line.me/xxx` 格式 |
| TAG 快速選擇 | 從 `/api/v1/liff-options` 讀取選項，顯示 tag、名稱、分組 |
| 修正 liffOptions 類型 | 加入 `tag` 和 `label` 欄位 |
| 批量輸入更新 | LINE 批量輸入改為 LIFF 格式的 placeholder |
| totalLinks 計算 | 包含 liffLinks 的數量 |
| 提交邏輯 | `liff_links` 正確存儲到 campaigns 表 |

### 後端 API（cloak-admin-api.js）

| 變更項目 | 說明 |
|---------|------|
| `/api/v1/liff-options` 資料來源 | 從 `campaigns` 表改為 `line_config` 表，結合 LIFF_MAP 映射 |
| 返回欄位 | 包含 id、tag、name、label、liff_id、line_oa_id、group_name |
| 分組推導 | 根據 TAG 格式自動推導分組名稱（AS/AB/AX/BF/N 系列） |

### shadow-cloak（shadow-cloak.js）

| 變更項目 | 說明 |
|---------|------|
| LIFF 分配策略 | 從硬編碼 IP Hash 改為支援 `routing_strategy` 的三種策略 |
| 隨機策略 | `Math.random()` 隨機選擇 LIFF 連結 |
| 輪替策略 | 使用 `round_robin_state` 表記錄輪替狀態，key 為 `liff_{campaign_id}` |
| IP 固定策略 | 保留原有的 djb2 IP Hash 邏輯 |

## 部署記錄

| 服務 | 部署方式 | 狀態 |
|------|---------|------|
| cloak-admin（前台） | git push → GitHub Actions 自動部署 | 已完成 |
| cloak-admin-api | Cloudflare Workers API 部署 | 已完成 |
| shadow-cloak | Cloudflare Workers API 部署 | 已完成 |

## 驗證結果

`/api/v1/liff-options` API 已確認返回 23 個 TAG 選項，包含完整的 tag、name、label、liff_id、line_oa_id、group_name 資訊。TAG 快速選擇下拉選單不再為空。

## 相關文件

| 文件 | 關係 |
|------|------|
| `liff-multi-link-rotation-spec.md` | LIFF 多連結輪替的原始規格 |
| `liff-multi-link-review-report.md` | LIFF 多連結輪替的獨立複查報告 |
| `shadow-cloak-feature-ui-spec.md` | shadow-cloak 功能 UI 規格 |
