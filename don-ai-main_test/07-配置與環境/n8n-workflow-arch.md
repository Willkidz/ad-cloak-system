---
title: "N8N 工作流結構"
category: "config"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "N8N 伺服器資訊、API Key、13 個工作流清單（7 啟用 + 6 停用，含 ID、Webhook 路徑、觸發方式）、2 個 Credentials、Telegram Bot 配置。"
id: "20260325-110000"
type: "config"
tags: [configuration, credentials, n8n, workflow]
status: "active"
created: "2026-03-25"
updated: "2026-03-31"
---

> **TL;DR**: 本文件記錄 N8N 伺服器（n8n.bexnua.store，版本 2.12.3）的完整配置。目前有 13 個工作流（7 啟用 + 6 停用），核心為「上帝視角_Time Attribution」負責 LINE 歸因追蹤與 CAPI 事件發送。4 個 Webhook 端點分別處理 LINE follow、Config 查詢、Admin API 與 DNS 同步。系統監控透過 Telegram Bot 告警。

# N8N 工作流結構

本文件記錄 N8N 伺服器的完整配置與工作流清單，供 AI 在操作 N8N 相關任務時參考。

**最後更新**：2026-03-27
**版本**：N8N 2.12.3

---

## 一、伺服器資訊

<rule id="n8n-server-config">

| 項目 | 值 |
| :--- | :--- |
| IP | 5.189.150.66:5678 |
| 域名 | n8n.bexnua.store |
| 版本 | 2.12.3 |
| API Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（完整值見認證資訊彙整.md）` |

</rule>

> [待確認] N8N 2.12.3 是否受 CVE-2025-68613 RCE 漏洞影響。對話精華中記錄版本 2.12.3 遠高於受影響的 1.122.0，但安全警告中建議升級至 2.14.0+，兩者資訊矛盾，需確認。

---

## 二、工作流清單（13 個）

### 啟用中（7 個）

| # | 名稱 | ID | 觸發方式 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 上帝視角_Admin API | TBJgFC9TmFnK8eyG | Webhook: `POST /webhook/admin-api` | 管理 API 入口，處理 line_config 和 ad_config 的 CRUD |
| 2 | 上帝視角_Time Attribution | dqbdnCN3xdJAahYQ | Webhook: `POST /webhook/line-follow` | LINE 追蹤歸因 → D1 指紋匹配 → CAPI 事件發送 |
| 3 | Config API | iNV4mSJjUTrUOGkw | Webhook: `GET /webhook/get-config` | 取得設定資料（line_config + ad_config） |
| 4 | 上帝視角_CAPI Health Check | uQFTrGvbMHY1TYUX | 排程：每小時 | 檢查所有 Pixel 的 CAPI 狀態 → Telegram 通知 |
| 5 | 系統監控 | ecnSO9T2NLWZKApl | 排程 | 定時檢查 D1 + 錯誤告警 → Telegram |
| 6 | DNS Auto-Sync | ciiNthLHHTeyG7p7 | Webhook: `GET /webhook/dns-sync` | DNS 自動同步 |
| 7 | douyin-knowledge-webhook | KjvTjlf7iVEtYHvc | Webhook: `POST /webhook/douyin-knowledge` | 抖影知識系統入口，轉發請求至 VPS 處理服務 |

### 停用中（6 個）

| # | 名稱 | ID | 說明 |
| :--- | :--- | :--- | :--- |
| 7 | Shadow Cloak G4 - Bot Ratio Alert | 5AnQOHX5nP6Kcu1z | 已停用，監控 Bot 比例告警 |
| 8 | Shadow Cloak G5 - Crawler Detection | wKUIIpU3eM43fmah | 已停用，偵測爬蟲流量告警 |
| 9 | Shadow Cloak G6 - Daily Report | pldVCzWVKKEsc478 | 已停用，每日斗篷報告 |
| 10 | Shadow Cloak G6 - Daily Report（重複） | eNvk0yxwT6H1wSEe | 已停用，與 #9 重複 |
| 11 | Update ad_config DataTable | oBpzQacg6KiPK5Yn | 已停用，一次性腳本 |
| 12 | 一鍵更新Token（副本） | — | 已停用，功能已整合至其他工作流 |

### 已知問題

<rule id="n8n-known-issues">

- 工作流 #4「上帝視角_CAPI Health Check」已升級至 Facebook Graph API v25.0（需在 N8N 中手動更新 Code 節點的 URL）。
- N8N v2.12.3 的 Code 節點限制：`require()` 不可用、`$helpers` 不可用，只能使用純 JS 或 `globalThis.crypto`。
- 舊 Token Attribution workflow（ID: biEtJWKGcnmqYjgW）已廢棄，已被 dqbdnCN3xdJAahYQ 取代。

</rule>

---

## 三、Webhook 端點總覽

| 端點路徑 | 方法 | 對應工作流 | 用途 |
| :--- | :--- | :--- | :--- |
| `/webhook/admin-api` | POST | Admin API | 管理 API（CRUD） |
| `/webhook/line-follow` | POST | Time Attribution | LINE follow 事件接收 |
| `/webhook/get-config` | GET | Config API | 取得設定資料 |
| `/webhook/dns-sync` | GET | DNS Auto-Sync | DNS 同步觸發 |

---

## 四、Credentials（2 個）

| 名稱 | ID | 類型 | 用途 |
| :--- | :--- | :--- | :--- |
| Cloudflare D1 Auth | ePBnzTcW9TNntAXr | httpHeaderAuth | D1 資料庫存取 |
| Cloudflare API Token | pkPbXc5z0LGydthu | httpHeaderAuth | Cloudflare API 操作 |

---

## 五、Telegram Bot

| 項目 | 值 |
| :--- | :--- |
| Bot Token | `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc` |
| 用途 | 系統監控告警、CAPI Health Check 通知 |
| 手動觸發 | 發送 `/check` 至 @godview_monitor_bot |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [服務清單.md](service-list-config.md) | 所有使用中的服務帳號設定清單 |
| [認證資訊彙整.md](auth-info-config.md) | 所有服務的完整認證資訊（含完整 API Key） |
| [`03-專案/上帝視角/godview-n8n-workflow-list.md`](../03-專案/上帝視角/godview-n8n-workflow-list.md) | 上帝視角專案的 N8N 工作流詳細說明（含節點流程） |
