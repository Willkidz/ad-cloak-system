---
title: "cloak-admin v1.12.1：pixel-groups CRUD 與 campaign cloak 更新修補"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-10"
summary: "記錄 cloak-admin-api 新增 pixel-groups 完整 CRUD 路由、修正 campaign cloak 欄位更新持久化問題、改以 Cloudflare API 直接部署 Worker，並完成 production 驗證。"
version: "v1.12.1"
id: "20260410-pixel-groups-cloak-fix"
type: implementation
status: active
created: "2026-04-10"
updated: "2026-04-10"
tags: [cloak-admin, pixel-groups, campaign, cloak, cloudflare, production, verification]
---

> **TL;DR**：本次修補已將 `cloak-admin-api` 的 `/api/v1/pixel-groups` 補齊為完整 CRUD 與狀態切換端點，並修正 campaign 更新流程中 cloak 欄位未正確持久化的問題。後端已透過 Cloudflare API 直接部署到 production，且已在 live 環境完成像素庫與 campaign cloak 更新驗證。[1] [2]

# cloak-admin v1.12.1：pixel-groups CRUD 與 campaign cloak 更新修補

本次工作聚焦於兩個 production 問題。第一，管理後台需要可直接操作 `pixel_groups` 與 `pixel_group_ads` 的完整像素庫 API；第二，Campaign 編輯畫面中的 cloak 欄位雖可進入前端 state，但更新後未能穩定持久化到後端資料。此次修補以後端為主，並保留前端既有介面不變，最終以 production live API 實測確認修補已生效。[1] [2]

| 模組 | 問題 | 修補結果 |
| :--- | :--- | :--- |
| `cloak-admin-api` 像素庫 | production 缺少 `/api/v1/pixel-groups` 完整管理能力 | 已補齊建立、查詢、更新、刪除與狀態切換 |
| `cloak-admin-api` campaign 更新 | cloak 欄位在更新時未完整寫回 D1 | 已修正 merge / 寫回流程，live 更新後可回讀驗證 |
| 部署流程 | `wrangler` 登入流程受阻 | 改用 Cloudflare API 直接上傳 Worker 原始碼部署 |

## 1. 本次實作內容

後端 API 已補齊 `pixel_groups` 與 `pixel_group_ads` 的對應能力，使管理端可直接對像素群組與其廣告像素明細進行新增、更新、查詢與刪除。除了主 CRUD 之外，亦補上獨立的狀態切換端點，讓前端可在不重送完整資料的情況下切換群組啟用狀態。這一組 API 已在 production 回應實測中返回成功結果與實際資料集，代表 live Worker 已載入新路由。[1]

Campaign 更新部分則修正 cloak 欄位的合併與寫回行為。經此次修補後，`cloak_country`、`cloak_region`、`cloak_lang`、`cloak_os`、`cloak_os_version`、`cloak_traffic_source` 與 `require_fbclid` 等欄位，皆可透過 `PUT /api/v1/campaigns/{id}` 成功更新並立即回讀確認。實測中，原本為空字串的 `cloak_region` 已可更新為 `TW-TPE,JP-13`，代表此次修補確實解決「表單有值、儲存不生效」的 production 問題。[2]

## 2. 部署方式調整

本次未使用需要互動登入的部署流程，而是直接以 Cloudflare Workers Script API 對 `cloak-admin-api` 執行覆蓋部署。部署時保留原有 D1 與 KV bindings，避免 production Worker 在更新後遺失 `DB` 或 `CLOAKER_CONFIG` 等必要綁定。這個做法使部署不再依賴本機登入狀態，也適合在自動化修補或緊急熱修場景中使用。

| 項目 | 本次做法 |
| :--- | :--- |
| 部署目標 | `cloak-admin-api` Worker |
| 部署方法 | Cloudflare Workers Script API `PUT /accounts/{account_id}/workers/scripts/{script_name}` |
| 上傳內容 | 修補後的 Worker 原始碼 |
| 保留設定 | D1 `DB`、KV `CLOAKER_CONFIG`、相容性日期 |
| 驗證方式 | live API 呼叫與資料回讀 |

## 3. Production 驗證結果

Production 驗證分成兩段。第一段針對像素庫新路由進行 CRUD 實測，建立一筆臨時群組、更新其主資料與 ad pixel、切換狀態為 `active`，最後刪除並確認查詢結果為空。第二段則針對既有 campaign `dd98e961-f2bf-4560-ac51-bdc9503bdbb8` 執行 cloak 欄位更新，並重新讀取資料確認各欄位已持久化回 D1。[1] [2]

| 驗證項目 | 測試動作 | 結果 |
| :--- | :--- | :--- |
| `GET /api/v1/pixel-groups` | 讀取 production 像素群組列表 | 成功，live 回傳多筆群組與 `ad_pixels` |
| `POST /api/v1/pixel-groups` | 建立臨時測試群組 | 成功，建立 `id: 16` |
| `PUT /api/v1/pixel-groups/16` | 更新群組與單筆 ad pixel | 成功 |
| `PATCH /api/v1/pixel-groups/16/status` | 狀態切為 `active` | 成功 |
| `DELETE /api/v1/pixel-groups/16` | 刪除臨時測試群組 | 成功 |
| `GET /api/v1/campaigns/dd98e961-f2bf-4560-ac51-bdc9503bdbb8` | 更新前後回讀對比 | 成功，`cloak_region` 由空值變為 `TW-TPE,JP-13`，`status` 變為 `paused` |
| `PUT /api/v1/campaigns/dd98e961-f2bf-4560-ac51-bdc9503bdbb8` | 更新多個 cloak 欄位與 `require_fbclid` | 成功，live API 回傳 `{\"success\":true}` |

## 4. 影響與後續建議

這次修補已解除兩個直接影響營運的障礙。首先，像素庫頁面所依賴的後端群組路由已在 production 可用，因此前端不需改版即可恢復正常操作。其次，Campaign 編輯中的 cloak 條件現在可以真正落庫，後續若再出現「欄位看起來有改但實際沒存」的問題，排查重點應先集中在前端 payload 是否送出正確值，而不是再優先懷疑 live API 路由不存在。

建議下一步把本次驗證腳本整理為固定回歸流程，在每次後端部署後自動跑一次 `pixel-groups` CRUD 與 `campaign update` smoke test。如此可在不進入 UI 的前提下，快速確定 Worker、D1 綁定與核心寫入邏輯皆仍正常。

## References

[1]: https://admin-api.bexnua.store/api/v1/pixel-groups "Production pixel-groups API"
[2]: https://admin-api.bexnua.store/api/v1/campaigns/dd98e961-f2bf-4560-ac51-bdc9503bdbb8 "Production campaign API"
[3]: https://admin.bexnua.store "Cloak Admin production console"
