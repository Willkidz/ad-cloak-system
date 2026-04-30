---
title: "斗篷管理後台系統架構與模式總覽"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "詳述斗篷管理後台的 Serverless 架構，包含核心 Cloudflare Workers（shadow-cloak、line-redirect 等）、D1 資料庫表結構（cloak_logs、clicks）、現行 `vid` 精準歸因主路徑與 45 秒 fallback，以及火鳥與隱者兩條流量路徑的歷史 / 現況關係。"
version: "v1.0"
id: "20260325-system-patterns"
type: analysis
tags: [architecture, attribution, cloak-admin, cloaking, cloudflare-d1, cloudflare-workers]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本系統採用全 Serverless 架構。**更正註記（2026-04-10）**：現行斗篷 + LIFF 歸因主路徑已改為 **`shadow-cloak → money-page → LIFF → line-login-callback → N8N` 的 `vid` 精準匹配**；`line-redirect` 主要保留於火鳥既有鏈路、非 LIFF 流程與直接跳 OA 類 fallback 場景；n8n 的 **45 秒時間窗口**則由主匹配策略降級為 fallback。資料庫使用 D1，核心表仍包括 `cloak_logs` 與 `clicks`。

# 斗篷管理後台系統架構與模式總覽

本文件記錄斗篷管理後台的完整系統架構，包含 Workers 分佈、資料庫結構、流量路徑及歸因邏輯，為系統維護與功能擴展提供核心參考。

---

## 一、技術棧與基礎設施

<boundaries id="tech-stack">

| 層級 | 技術實現 | 備註 |
| :--- | :--- | :--- |
| **前端** | React + TypeScript + Vite + Tailwind CSS + shadcn/ui | 主色調紫色 `#7c3aed` |
| **後端** | Hono 框架 + Cloudflare Workers | API Base: `admin-api.bexnua.store/api/v1` |
| **資料庫** | Cloudflare D1 (SQLite) | Database ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` |
| **自動化** | n8n (Self-hosted on Contabo) | 處理歸因匹配與監控告警 |

</boundaries>

---

## 二、核心 Cloudflare Workers (8 個)

系統功能由以下 8 個相互協作的 Worker 實現：

<rule id="worker-inventory">

1.  **shadow-cloak**:
    - **職責**: 訪客身份判定（blocked/allowed），寫入 `cloak_logs` 表。
    - **特性**: 已從 Service Worker 格式升級為 ES Module，D1 改用原生 binding 以修復 IP 記錄問題。
    - **判定維度**: ASN、User-Agent、國家（TW/HK/MO）。
2.  **cloak-admin-api**:
    - **職責**: 後台管理 API，處理廣告活動、素材、日誌的 CRUD。
3.  **safe-page**:
    - **職責**: 靜態安全頁面，展示給被攞截的訪客。
4.  **line-redirect**:
    - **職責**: LINE 跳轉 + 歸因追蹤 + D1 直寫 + CAPI 事件發送（上帝視角正式版）。
    - **關鍵配置**: `FALLBACK_BC_PIXEL` (940592681819066), `CONFIG_API_URL` (n8n webhook)。
5.  **line-redirect-staging**:
    - **職責**: 上帝視角測試版。
6.  **money-page**:
    - **職責**: 靜態推廣頁面，嵌入 BC 像素前端追蹤（PageView, Contact, Purchase）。
7.  **preview-page**:
    - **職責**: 預覽頁服務。
8.  **~~manus-memory-api~~**（已廢棄，ADR-003）:
    - **職責**: 內部記憶 API（與斗篷業務邏輯解耦）。

</rule>

---

## 三、資料庫表結構

### 3.1 cloak_logs (訪問日誌)
記錄 shadow-cloak 的判定結果，目前累積 2500+ 筆數據。

| 欄位 | 說明 | 欄位 | 說明 |
| :--- | :--- | :--- | :--- |
| **ip** | 訪客 IP (v5.2 修復) | **verdict** | 判定結果 (blocked/allowed) |
| **asn** | ASN 編號 | **reason** | 攔截/放行原因 |
| **country** | 國家代碼 | **visitor_id** | 唯一訪客 ID (v1.10 新增) |
| **ua** | User-Agent | **domain** | 訪問域名 |

### 3.2 clicks (點擊數據)
記錄 line-redirect 的點擊數據，目前累積 700+ 筆，匹配率約 34.5%。
- **核心欄位**: `click_id`, `tag`, `ad_code`, `ip_address`, `fbclid`, `fbc`, `fbp`, `matched_at`, `visitor_id`。

---

## 四、流量路徑分析

系統支持兩條並行的流量路徑，以適應不同的投放需求：

<step id="traffic-paths">

1.  **火鳥路徑（歷史主路徑／仍可作為相容 fallback）**:
    - `FB 廣告` → `火鳥落地頁` → `ini.html` → `{tag}.freshpathlab.com` → `line-redirect` → `LINE`
    - **特點**: 不經過 `shadow-cloak` 判定，保留歷史火鳥歸因鏈路與非 LIFF 場景相容性。
2.  **隱者路徑（現行主路徑）**:
    - `FB 廣告` → `shadow-cloak 域名` → `money-page` → `CTA 按鈕` → `LIFF` → `line-login-callback` → `N8N`
    - **特點**: 具備完整斗篷攔截能力，並以 `vid` 精準匹配為主；`line-redirect` 不再是此路徑的必經節點。

</step>

---

## 五、歸因匹配流程 (Attribution Logic)

歸因匹配由 n8n workflow 異步執行，確保不影響用戶跳轉速度。

<step id="attribution-steps">

1.  **用戶加 LINE**: LINE 平台推送到 n8n `/webhook/line-follow`。
2.  **主查詢**: 優先透過 `line_user_bindings` 與 `clicks` 以 `vid` 做精準匹配。
3.  **Fallback 匹配**: 若 `vid` 鏈路未命中，再退回 **45 秒時間窗口** 內的 `IP + User-Agent` 指紋匹配。
4.  **狀態更新**: 匹配成功後更新 `clicks` 表的 `matched` 狀態。
5.  **發送 CAPI**: 將歸因數據封裝並發送至 Facebook Graph API。

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽與版本紀錄 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 部署配置與 Worker 綁定規範 |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | n8n 節點邏輯與歸因細節 |
