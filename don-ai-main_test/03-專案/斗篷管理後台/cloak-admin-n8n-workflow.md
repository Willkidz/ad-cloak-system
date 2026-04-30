---
title: "N8N 設定與工作流"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "N8N 伺服器（5.189.150.66, n8n.bexnua.store）設定與核心歸因工作流 Time Attribution（dqbdnCN3xdJAahYQ）的 10 節點流程、重試機制、Webhook 路徑、DNS 組態及歷史問題修復紀錄。"
version: "v1.0"
id: "20260325-n8n-workflow"
type: spec
tags: [attribution, capi, cloak-admin, cloudflare-d1, dns, n8n]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件記錄了自架 N8N 伺服器（IP `5.189.150.66`，域名 `n8n.bexnua.store`，帳號 `administrator`）的設定與核心工作流。**上帝視角_Time Attribution**（ID `dqbdnCN3xdJAahYQ`）是歸因核心，由 LINE Webhook `/webhook/line-follow` 觸發，10 個節點依序執行：接收 Follow 事件 → 提取數據 → 判斷事件類型 → 查詢 D1 clicks 表 → 45 秒內 IP+UA 指紋匹配 → 更新 matched 狀態 → 準備 CAPI 事件 → 檢查 Pixel → 發送 Facebook Graph API。關鍵節點均有重試機制（Send CAPI 3次/2秒、Query/Mark 3次/1秒）。Webhook 路徑含 `/webhook/line-follow`（LINE follow 事件）、`/webhook/get-config`（配置讀取）、`/webhook/token-mapping-v2`（已過期）。DNS 已從 systemd-resolved 改為 Google/Cloudflare 公用 DNS。歷史問題含 `$helpers is not defined` Bug（已修復）、D1 401 認證偶發錯誤（已加重試）、DNS 解析失敗（已修復）。v1.10.2 後錯誤率 0%。

# N8N 設定與工作流

> **驗證狀態**：2026-03-27 部分驗證。N8N 最新版本為 2.14.0，建議確認伺服器版本是否已更新。
> **安全警告**：CVE-2025-68613 是 N8N 的一個重大遠端程式碼執行（RCE）漏洞，影響舊版本，必須更新至最新版以確保安全。升級至 N8N 2.0 版時，API 憑證可能損壞，需要重新設定。

---

## 伺服器資訊

| 項目 | 值 |
| :--- | :--- |
| IP 位址 | 5.189.150.66 |
| 域名 | n8n.bexnua.store |
| 帳號 | administrator |
| 存取方式 | SSH + Web UI |

---

## 核心工作流：上帝視角_Time Attribution

此工作流是實現 LINE 用戶行為歸因的核心，負責處理來自 LINE 的 follow 事件並將其與最近的點擊行為進行匹配。

| 項目 | 值 |
| :--- | :--- |
| Workflow ID | dqbdnCN3xdJAahYQ |
| 觸發方式 | LINE Webhook → `/webhook/line-follow` |
| 狀態 | Active |

### 節點流程

<step id="line-follow">接收 LINE Follow Webhook (`/webhook/line-follow`)</step>
<step id="extract-data">提取 Follow 事件的相關數據</step>
<step id="check-event-type">判斷是否為 Follow 事件</step>
<step id="query-clicks">查詢最近的點擊記錄（Cloudflare D1）</step>
<step id="match-fingerprint">進行指紋匹配（45 秒內 IP + User-Agent 匹配）</step>
<step id="check-match-result">判斷是否匹配成功</step>
<step id="update-click-status">若匹配成功，則更新 D1 中的點擊記錄為已匹配</step>
<step id="prepare-capi">準備 Facebook Conversions API (CAPI) 所需的事件數據</step>
<step id="check-pixel">檢查是否設定了 Facebook Pixel</step>
<step id="send-capi">發送 CAPI 事件至 Facebook Graph API</step>

### 重試機制

<rule id="retry-logic">

為了提高工作流的穩定性，針對可能失敗的關鍵網路請求加入了重試機制。

| 節點 | 重試次數 | 重試間隔 |
| :--- | :--- | :--- |
| Send CAPI | 3 次 | 2 秒 |
| Query Recent Clicks | 3 次 | 1 秒 |
| Mark Click Matched | 3 次 | 1 秒 |

</rule>

---

## Webhook 路徑

| 路徑 | 用途 | 狀態 |
| :--- | :--- | :--- |
| `/webhook/line-follow` | 接收 LINE follow 事件 | 使用中 |
| `/webhook/get-config` | 提供 `line-redirect` 服務取得設定 | 使用中 |
| `/webhook/token-mapping-v2` | 舊版 token mapping | [已過期：功能已在 line-redirect 中被註解移除] |

---

## DNS 設定

為了提升對外請求的解析穩定性，N8N 伺服器的 DNS 已從預設的 `127.0.0.53` (systemd-resolved) 變更為公用 DNS 服務器。

- **主要**：`8.8.8.8` (Google DNS)
- **備用**：`1.1.1.1` (Cloudflare DNS)
- **第三備用**：`8.8.4.4` (Google DNS)
- **Fallback**：`9.9.9.9` (Quad9)

修改的設定檔包含 `/etc/resolv.conf` 以及 `systemd-resolved` 的 `FallbackDNS`。

---

## 歷史問題紀錄

<rule id="issue-helpers-undefined">

**`$helpers is not defined`（已修復）**
- **原因**：N8N 舊版本的 bug，導致 `Fingerprint Match` 節點無法正常執行。
- **影響**：在修復前，約 50 多筆 follow 事件全部歸因失敗。
- **修復**：升級 N8N 至新版本。

</rule>

<rule id="issue-d1-auth-error">

**D1 認證 401 錯誤（偶發）** `[待確認]`
- **原因**：`Query Recent Clicks` 節點的 Cloudflare D1 認證偶爾會失敗。
- **影響**：導致少量 follow 事件無法查詢 `clicks` 表，歸因失敗。
- **修復**：加入了重試機制（3 次，1 秒間隔），觀察是否仍會發生。

</rule>

<rule id="issue-dns-resolution-failure">

**DNS 解析失敗（已修復）**
- **原因**：N8N 伺服器預設的 DNS 解析不穩定，導致 `Send CAPI` 節點無法連接 `graph.facebook.com`。
- **影響**：已成功匹配的事件，其 CAPI 發送失敗。
- **修復**：將 DNS 更換為 Google DNS 等公用服務。

</rule>

---

## 結論

此文件詳細記錄了 N8N 伺服器的關鍵設定與核心歸因工作流的運作方式。在經歷了數次問題修復與優化（如加入重試機制、更換 DNS）後，目前工作流的穩定性已大幅提升。根據最新統計，自 v1.10.2 版本更新後，所有執行均成功，錯誤率為 0%。未來應持續監控 D1 認證問題，並確保 N8N 版本保持更新以應對潛在的安全風險。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-line-integration.md](cloak-admin-line-integration.md) | LINE OA 對應表與 Webhook 設定 |
| [cloak-admin-pixel-capi.md](cloak-admin-pixel-capi.md) | 像素綁定與 CAPI 事件清單 |
| [cloak-admin-diagnostic-analysis.md](cloak-admin-diagnostic-analysis.md) | Telegram Bot 推送失敗診斷（D1 Token 問題） |
| [上帝視角 N8N 工作流清單](../上帝視角/godview-n8n-workflow-list.md) | 完整 N8N 工作流清單 |
