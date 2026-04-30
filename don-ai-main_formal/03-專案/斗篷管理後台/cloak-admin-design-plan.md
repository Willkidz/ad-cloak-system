---
title: "斗篷系統管理後台設計規劃文件"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件為斗篷系統管理後台的詳細設計規劃，涵蓋系統架構、功能模組、數據庫設計、API 接口及 UI 線框圖，旨在打造高效、安全的流量控制中心。"
version: "v1.0"
id: "20260325-024356"
type: plan
tags: [api, architecture, cloak-admin, cloudflare-d1, planning, roadmap]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件規劃斗篷系統管理後台的發展藍圖。系統採用 **React + Hono + D1** 的全 Serverless 架構。功能分為三期：**Phase 1 (MVP)** 實現廣告活動與斗篷規則（ASN/UA/Geo）管理；**Phase 2** 引入素材中心（ZIP 上傳/URL 採集）與流量儀表板；**Phase 3** 強化自動化（域名輪換/TG 告警）。數據庫設計包含 `campaigns`、`cloak_rules`、`templates` 等核心表。

# 斗篷系統管理後台設計規劃文件

本文件旨在為基於 Cloudflare Workers 的斗篷系統（Cloaking System）設計一套完整的管理後台。該設計深度參考了火鳥廣告系統的 UI 與功能邏輯，並結合了現有系統架構（Cloudflare Workers、D1 數據庫、n8n 工作流、Meta CAPI）進行無縫整合與優化，旨在打造一個高效、安全且易於操作的流量控制中心。

## 系統架構設計

為了確保系統的高效能、可擴展性與安全性，管理後台將採用現代化的無伺服器（Serverless）架構，充分利用 Cloudflare 生態系的優勢。

### 技術選型

| 模組 | 技術棧 | 說明 |
| :--- | :--- | :--- |
| **前端框架** | React + Vite + TypeScript | 提供快速的開發體驗與高效的單頁應用（SPA）效能。 |
| **UI 組件庫** | Tailwind CSS + shadcn/ui | 實現快速且一致的樣式設計。 |
| **後端 API** | Cloudflare Workers (Hono) | 輕量級、低延遲的邊緣運算 API，直接與 D1 互動。 |
| **數據庫** | Cloudflare D1 (SQLite) | 原生無伺服器關聯型數據庫，適合高頻讀寫。 |
| **自動化** | n8n (自架版) | 處理複雜的外部 API 整合（如 Meta CAPI、TG 告警）。 |

## 功能模組規劃

系統功能將分為三期進行開發，以確保核心功能優先上線。

### Phase 1（MVP）：核心管理與監控
<rule id="phase1-features">
- **廣告活動管理**：新增、編輯、刪除廣告活動，配置基本資訊（名稱、主題、狀態、客服連結）。
- **斗篷規則配置**：設定 ASN 黑名單、UA 黑名單、國家白名單（TW/HK/MO）、設備類型限制。
- **安全頁/落地頁切換**：為每個廣告活動指定對應的 `safe-page` 與 `money-page` 路由。
- **基本日誌查看**：即時查看 `cloak_logs`，包含訪問時間、IP、國家、UA、攔截原因。
</rule>

### Phase 2：素材與流量管理
<rule id="phase2-features">
- **素材管理中心**：上傳與管理落地頁（ZIP 上傳或線上編輯 HTML/JS），支援變數替換。
- **多模板管理**：建立安全頁與落地頁的模板庫，支援「採集新增」功能。
- **流量儀表板**：基於 D1 數據，提供視覺化圖表（如每日點擊量、攔截率）。
- **域名管理**：整合 Cloudflare API，自動解析與綁定域名。
</rule>

### Phase 3：進階自動化與防護
<rule id="phase3-features">
- **自動輪換機制**：支援多個落地頁或域名的自動輪詢（Round-Robin）或隨機分流。
- **Telegram 告警**：整合 `godview_monitor_bot`，當攔截率異常時自動發送通知。
- **域名健康檢查**：定期檢查域名是否被標記為惡意連結，並自動切換備用域名。
</rule>

## 數據庫設計 (D1)

### `campaigns` (廣告活動表)
| 欄位 | 類型 | 說明 |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | 主鍵 |
| `name` | TEXT | 廣告名稱 |
| `status` | TEXT | 狀態 (active, paused) |
| `pixel_id` | TEXT | Meta 像素 ID |

### `cloak_rules` (斗篷規則表)
| 欄位 | 類型 | 說明 |
| :--- | :--- | :--- |
| `id` | TEXT (UUID) | 主鍵 |
| `campaign_id` | TEXT | 關聯的廣告活動 ID |
| `allowed_countries` | TEXT (JSON) | 允許的國家代碼 |
| `routing_strategy` | TEXT | 分流策略 (random, round_robin, sticky_ip) |

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案靈魂文件 |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [cloak-admin-bugfix-full-cmd.md](cloak-admin-bugfix-full-cmd.md) | BUG 修復清單 |
