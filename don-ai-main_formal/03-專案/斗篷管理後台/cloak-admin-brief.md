---
title: "斗篷管理後台 — 專案目標"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "定義斗篷管理後台（Cloak Admin）的核心目標、功能需求與技術架構，作為專案開發的指導性文件。"
version: "v1.0"
id: "20260325-100600"
type: project-doc
tags: [cloak-admin, cloudflare, facebook, line, n8n, planning]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 斗篷管理後台（Cloak Admin）是基於 **Cloudflare Workers** 的流量管理系統。核心目標是實現從 Facebook 廣告點擊到 LINE 加好友的完整歸因追蹤。系統透過 `shadow-cloak` 進行流量判定（Money/Safe），並在 **45 秒窗口**內匹配 D1 `clicks` 表數據，最終透過 **Meta CAPI** 回傳 `Lead` 事件。目前歸因匹配率約 **34.5%**，支援 AS、AB、AX、BF 等多產品線。

# 斗篷管理後台 — 專案目標

## 專案概述

斗篷管理後台（Cloak Admin）是一套基於 Cloudflare Workers 的廣告追蹤與流量管理系統，整合了 N8N 工作流自動化和 LINE 官方帳號，旨在實現從 Facebook 廣告點擊到 LINE 加好友的完整歸因追蹤。此系統為多個產品線提供支援。

## 核心需求

<rule id="traffic-filtering">
**流量判定**：透過 `shadow-cloak` Worker 判定訪客身份（區分為 Money Page 或 Safe Page），有效攔截所有非目標地區或特徵的流量。
</rule>

<rule id="attribution-tracking">
**歸因追蹤**：需精確記錄廣告點擊數據（存於 `clicks` 表），並在用戶加入 LINE 好友時進行指紋匹配，最終將轉換事件透過 Conversion API (CAPI) 回傳至 Facebook。
</rule>

<rule id="admin-backend">
**後台管理**：提供一個功能完整的 Web UI，方便管理員進行廣告活動管理、日誌查看、Facebook 像素設定以及 LINE 帳號配置。
</rule>

<rule id="multi-product-support">
**多產品線支援**：系統架構必須具備擴展性，以支援爆分王（AS）、莊家剋星（AB）、獨角仙（AX）、博富（BF）等多條獨立的產品線。
</rule>

## 技術棧

| 層級 | 技術 |
| :--- | :--- |
| 前端 | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| 後端 | Hono + Cloudflare D1 + Workers |
| 自動化 | N8N (部署於 Contabo VPS) |
| 通訊 | LINE Messaging API |
| 廣告追蹤 | Facebook CAPI + Pixel |

## 關鍵指標與連結

- **歸因匹配率**：目前約 34.5%（基於 45 秒指紋匹配機制）。
- **系統可用性**：要求零停機時間，因廣告活動持續投放中。
- **後台網址**：`https://admin.bexnua.store`

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案靈魂文件 |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [cloak-admin-attr-analysis.md](cloak-admin-attr-analysis.md) | 歸因邏輯分析 |
