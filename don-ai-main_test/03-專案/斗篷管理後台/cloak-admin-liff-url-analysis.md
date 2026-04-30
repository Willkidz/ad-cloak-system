---
title: "LIFF URL 結構與跳轉流程分析"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-01"
summary: "分析 LIFF URL 結構、Endpoint URL、完整跳轉流程以及多 Provider 下的授權行為。"
version: "v1.0"
id: "20260401-liff-analysis"
type: spec
tags: [line, liff, attribution, auth, cloak-admin]
status: active
created: "2026-04-01"
updated: "2026-04-01"
---
# LIFF URL 結構與跳轉流程分析

本文件詳細記錄了 LIFF（LINE Front-end Framework）在斗篷管理後台系統中的 URL 結構、跳轉機制及重要發現。

## 一、URL 結構示例

以武狀元（n21）的 LIFF 為例：
- **LIFF URL**: `https://liff.line.me/2009129136-BEXGdu4X?vid=test_002`
- **LIFF ID**: `2009129136-BEXGdu4X`
- **Endpoint URL**: `https://line-login-callback.laoqin1689.workers.dev/line-login/callback`

## 二、完整跳轉流程

系統處理 LIFF 跳轉的完整生命週期如下：

1.  **用戶訪問**: 用戶點擊廣告或連結訪問 `https://liff.line.me/{liffId}?vid=xxx`。
2.  **參數封裝**: LINE 平台自動將查詢參數（如 `vid=xxx`）封裝進 `liff.state` 參數中。
3.  **重定向至 Endpoint**: LINE 將用戶引導至預設的 Endpoint URL：
    `https://line-login-callback.laoqin1689.workers.dev/line-login/callback?liff.state=vid%3Dxxx`
4.  **Worker 初始化**: `callback` Worker 啟動，並從 URL 參數 `liff_id` 或 `liff.state` 中讀取對應的 `LIFF_ID` 進行初始化。
5.  **解析 vid**: 在 `liff.init` 成功執行後，從 `liff.state` 中解析出原始的 `vid`。
6.  **綁定與跳轉**: 
    - 取得用戶的 `userId`。
    - 調用 `POST /bind` 介面將 `vid` 與 `userId` 進行綁定。
    - 最終跳轉到對應的 LINE 官方帳號（OA）。

## 三、重要發現與決策

### 1. 授權行為
- **同 Provider 免重覆授權**: 在同一個 Provider 下，用戶只要授權過一次，後續訪問該 Provider 下的其他 LIFF 不需要再次點擊授權。
- **跨 Provider 需授權**: 由於平台限制，不同 Provider 的新 LIFF 在第一次訪問時，用戶必須點擊「許可」進行授權，這是正常且預期的行為。

### 2. 參數傳遞
- **跳轉必要參數**: `line-redirect` 在執行跳轉時，必須明確傳遞 `liff_id` 和 `line_id` 參數給 `callback` Worker，以確保正確的初始化與後續導向。

### 3. 部署狀態
- **LIFF_MAP 整合**: 目前針對 23 個 TAG 的 `LIFF_MAP` 對應關係已正式部署於 `line-redirect` Worker 中。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-line-integration.md](cloak-admin-line-integration.md) | LINE OA 與 Webhook 整合說明 |
| [.ai/active-context.md](../../.ai/active-context.md) | 包含 2026-04-01 的最新進度記錄 |
| [auth-info-config.md](../../07-配置與環境/auth-info-config.md) | 包含 LIFF ID 與 Channel 資訊 |
