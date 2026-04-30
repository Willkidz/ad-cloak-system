---
title: "斗篷系統管理後台 - 技術開發規格書 (v1)"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "定義斗篷系統管理後台核心 API 端點（GET /logs）與 7 個主要頁面的 UI 組件拆分規格，涵蓋儀表板、廣告製作、素材中心、域名管理、日誌與系統設定。"
version: "v1.0"
id: "20260325-tech-dev-spec"
type: spec
tags: [api, cloak-admin, frontend, landing-page, reporting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本技術規格書定義了斗篷系統管理後台的核心 API 與 UI 組件架構。核心 API `GET /logs` 支持 5 種日誌類型（all, visit, click, safe_click, cloak_block）與分頁功能。UI 部分將系統拆分為 7 個主要頁面：(1) **儀表板**（4 個統計卡片 + 流量趨勢圖）；(2) **廣告製作**（列表 + 左右分欄編輯頁）；(3) **素材中心**（雙 Tab + 四 Tab 新增彈窗）；(4) **域名管理**（3 Tab：解析、管理、短鏈）；(5) **廣告日誌**（5 Tab 篩選 + 國旗 Emoji 顯示）；(6) **系統設定**（帳號、參數、API 設定）；(7) **全局佈局**（白色側邊欄 + 麵包屑導航）。

# 斗篷系統管理後台 - 技術開發規格書 (v1)

本文檔定義了斗篷系統管理後台的核心 API 端點與 UI 組件拆分規格，為前端開發與後端數據交互提供技術依據。

---

## 一、核心 API 端點：GET /logs

<rule id="api-get-logs">
此端點用於獲取系統的訪問日誌，支持多種過濾條件，並提供分頁功能。
</rule>

### 1.1 請求參數 (Query Parameters)

| 參數 | 類型 | 描述 |
| :--- | :--- | :--- |
| `type` | string | 日誌類型：`all`, `visit`, `click`, `safe_click`, `cloak_block` |
| `page` | integer | 頁碼（預設 1） |
| `limit` | integer | 每頁顯示記錄數（預設 20） |

### 1.2 回應格式 (Response Format)

<example id="api-response-example">

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "timestamp": "2026-03-24T09:24:01.379Z",
        "domain": "jovkc.shop",
        "country": "US",
        "ip": "192.168.1.1",
        "visitor_id": "v-123",
        "language": "en-US",
        "ua": "Mozilla/5.0...",
        "verdict": "blocked",
        "reason": "瀏覽器語言不允許:en-US,en"
      }
    ],
    "total": 209,
    "page": 1,
    "limit": 20
  }
}
```

</example>

---

## 二、頁面組件拆分規格

系統 UI 採用白色模板重構，組件化開發以提升復用性。

### 2.1 全局佈局 (AppLayout)
- **側邊欄 (Sidebar)**: 白色背景，紫色選中態，包含 6 個主選單。
- **頂欄 (Header)**: 麵包屑導航、全局搜尋、通知中心、用戶頭像。

### 2.2 儀表板 (Dashboard)
- **統計卡片 (StatCard)**: 4 個（今日點擊、今日轉化、CTR、CVR），含趨勢指標。
- **流量趨勢圖**: 近 7 天流量折線圖。
- **Top 5 廣告**: 效果最佳廣告活動排名。
- **最近活動**: 系統操作日誌流。

### 2.3 廣告製作 (Campaigns)
- **列表頁**: 支援 Tabs 切換（全部、運行中、已停止）、關鍵字搜尋、批量操作。
- **編輯頁 (v1.5 重構)**: 
    - **左欄**: 基礎資訊、推廣連結、像素設置（TK/FB/GA/Google）。
    - **右欄**: 斗篷規則（國家、語言、OS、黑名單）、安全頁/推廣頁選擇。

### 2.4 素材中心 (Templates)
- **雙 Tab 結構**: 安全頁 (Safe Page) 與 推廣頁 (Money Page)。
- **新增彈窗 (v1.2)**: 四個 Tab（採集新增、ZIP 上傳、自定義新增、系統主題）。
- **編輯器**: 整合 CodeMirror 實現 HTML 語法高亮與行號顯示。

### 2.5 廣告日誌 (Logs)
- **5 個 Tab 篩選**: 全部、訪問日誌、點擊日誌、安全頁點擊、斗篷攔截。
- **表格顯示**: 包含國旗 Emoji、IP/ASN、判定結果（綠色訪問/紅色攔截）、攔截原因。

### 2.6 域名管理 (Domains)
- **3 個 Tab**: 域名解析、域名管理、防封短鏈。

---

## 三、UI 風格規範

<rule id="ui-design-tokens">

- **主色調**: 紫色 `#7c3aed` (Primary), 懸停色 `#6d28d9` (Hover)。
- **背景色**: 頁面背景 `#f8fafc` (Slate-50), 側邊欄/卡片背景 `#ffffff`。
- **文字色**: 標題 `#0f172a` (Slate-900), 正文 `#475569` (Slate-600)。
- **狀態色**: 運行中 (Green), 暫停 (Yellow), 已停止 (Red)。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構與後端邏輯 |
| [cloak-admin-ui-upgrade-analysis.md](cloak-admin-ui-upgrade-analysis.md) | UI 升級執行報告 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
