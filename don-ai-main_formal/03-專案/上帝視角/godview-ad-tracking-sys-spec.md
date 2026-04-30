---
title: "上帝視角廣告追蹤系統 v3 規格說明書"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "定義上帝視角 v3 的技術架構：火鳥落地頁（流量入口）→ CF Worker line-redirect（click_id 生成與 302 跳轉）→ n8n（時間歸因與 CAPI 回傳）→ Google Sheets（報表展示），以及各組件的職責邊界與歸因鏈結格式 https://{tag}.freshpathlab.com/?a={code}。"
id: "20260328-godview-spec"
type: spec
tags: [architecture, capi, cloudflare-workers, godview, google-sheets, known]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 「上帝視角 (GodView)」v3 是專為博弈廣告設計的歸因與數據追蹤系統，整合四大組件：(1) **火鳥落地頁**作為流量入口，嵌入 `landing_page_script.js` 採集 `ad_code`/`fbclid`/`_fbc`/`_fbp`；(2) **CF Worker**（`line-redirect`，部署於 `*.freshpathlab.com`）接收點擊、生成 `click_id`、非同步 POST 至 n8n 後 302 重定向至 LINE；(3) **n8n** 作為數據大腦，執行點擊記錄（寫入 D1 `clicks`）、時間歸因（45 秒窗口匹配 LINE follow 事件）、Meta CAPI 回傳（`CompleteRegistration`）及每小時 Telegram 報告；(4) **Google Sheets** 作為數據儀表板，記錄廣告消耗與歸因成效。歸因鏈結格式為 `https://{tag}.freshpathlab.com/?a={code}`。

# 上帝視角廣告追蹤系統 v3 規格說明書

## 系統架構概覽

「上帝視角 (GodView)」是一套專為博弈廣告設計的歸因與數據追蹤系統。其核心目標是解決「第三方落地頁無法直接追蹤轉化」的問題，透過在廣告點擊與 LINE 加好友之間插入一個 Cloudflare Worker 中繼站，實現從廣告點擊到社群轉化的精準歸因。

系統的端到端數據流如下：

```text
FB廣告 → 火鳥落地頁（嵌入 landing_page_script.js）
    → {tag}.freshpathlab.com Worker（生成 click_id，302 → LINE）
        → 用戶加好友 → LINE follow Webhook → n8n
            → 時間歸因（45s 窗口）→ Meta CAPI 回傳
            → Google Sheets 報表 + Telegram 報告
```

---

## 核心組件職責

<boundaries id="component-responsibilities">

各組件的職責邊界必須嚴格遵守，跨組件的邏輯耦合會增加系統的脆弱性。

| 組件 | 技術棧 | 核心職責 | 關鍵限制 |
| :--- | :--- | :--- | :--- |
| **火鳥落地頁** | 第三方服務 | 流量入口，嵌入追蹤腳本採集 `ad_code`/`fbclid`/`_fbc`/`_fbp` | 黑盒架構，無 DNS 控制權，僅能透過自定義 JS 與按鈕鏈結整合 |
| **CF Worker** | JavaScript（`line-redirect`） | 歸因中繼：生成 `click_id`、POST 點擊事件至 n8n、302 重定向至 LINE | 部署於 `*.freshpathlab.com`，透過 n8n DNS Auto-Sync 自動建立子域名 |
| **n8n 自動化** | 自架於 `n8n.bexnua.store` | 數據大腦：點擊記錄、時間歸因、CAPI 回傳、健康檢查、Telegram 報告 | 6 個 Active Workflow，核心為 Time Attribution（ID: `dqbdnCN3xdJAahYQ`） |
| **Google Sheets** | Google Sheets API | 數據儀表板：記錄廣告消耗（手動）與歸因成效（自動） | Sheets ID: `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I` |

</boundaries>

---

## 歸因流程 (End-to-End)

<step id="flow-1">

**1. 鏈結準備**：在 Google Sheets 中使用鏈結產生器，根據 `{tag}`（LINE OA 子域名標識）和 `{code}`（廣告代碼）生成格式為 `https://{tag}.freshpathlab.com/?a={code}` 的歸因鏈結。此鏈結被設定為火鳥落地頁上「加好友」按鈕的目標 URL。

</step>

<step id="flow-2">

**2. 前端採集與攔截**：用戶點擊 FB 廣告後抵達火鳥落地頁。`landing_page_script.js` 自動執行，從 URL 提取 `ad_code`（`a` 參數）和 `fbclid`，從 Cookie 讀取 `_fbc`/`_fbp`，並將這些參數附加至按鈕的跳轉 URL。

</step>

<step id="flow-3">

**3. Worker 中繼處理**：用戶點擊按鈕後，CF Worker 接收請求。Worker 生成唯一 `click_id`（`crypto.randomUUID()`），將完整點擊資訊（`click_id`、`ad_code`、`fbclid`、`fbc`、`fbp`、IP、UA、`line_oa_id`）非同步 POST 至 n8n `/webhook/click-tracking`，同時立即回傳 302 重定向至 `https://line.me/R/ti/p/{line_oa_id}`。

</step>

<step id="flow-4">

**4. 後端歸因與 CAPI 回傳**：n8n 將點擊數據寫入 D1 `clicks` 表。當 LINE Platform 發送 `follow` 事件至 `/webhook/line-follow` 時，n8n 以 `destination` + 45 秒時間窗口查詢最近的未匹配點擊。匹配成功後，標記 `matched = 1`，並使用點擊記錄中的 `fbclid`/IP/UA 透過 Meta CAPI 回傳 `CompleteRegistration` 事件。

</step>

---

## 關鍵憑證快速查詢

<rule id="credentials-reference">

以下為系統運行所需的關鍵憑證，完整清單見 `07-配置與環境/auth-info-config.md`。

| 項目 | 值 |
| :--- | :--- |
| Google Sheets ID | `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I` |
| n8n 核心 Workflow ID | `dqbdnCN3xdJAahYQ` |
| 歸因域名 | `*.freshpathlab.com` |
| n8n `ad_config` DataTable ID | `ICxZmq8e0vPZHX5j` |
| n8n `line_config` DataTable ID | `aL6JTLjrpNXf8aKM` |
| n8n `godview_events` DataTable ID | `9TFf8tCRvfXRstrS` |

</rule>

---

## 結論

本系統透過「中繼站」模式解決了第三方落地頁無法直接追蹤的問題。系統的穩定運行依賴於：(1) 各組件間 API 的穩定性（特別是 n8n Webhook 端點）；(2) 參數傳遞的一致性（`ad_code` 從 URL 到 D1 的完整鏈路）；(3) 時間歸因窗口的合理設定（目前為 45 秒）。任何組件的變更都應評估對上下游的影響。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-data-analysis.md`](godview-ad-tracking-data-analysis.md) | 數據鏈路分析，定義偵測率等關鍵指標 |
| [`godview-code-link-design-spec.md`](godview-code-link-design-spec.md) | 鏈結設計規範，定義 `{tag}` 與 `{code}` 命名體系 |
| [`godview-time-attr-spec.md`](godview-time-attr-spec.md) | 時間歸因方案設計，定義 D1 表結構與匹配邏輯 |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 完整清單 |
| [`firebird-domain-page-notes.md`](firebird-domain-page-notes.md) | 火鳥落地頁整合細節 |
| [`godview-core-cmd.md`](godview-core-cmd.md) | 操作指令與關鍵憑證 |
