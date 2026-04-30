---
title: "隱者斗篷 — 剩餘步驟清單"
category: project
priority: medium
applicable_tools: all
last_updated: "2026-03-29"
summary: "隱者斗篷專案的剩餘開發步驟清單，包含核心補強、分流工具、監控日誌與 JS 自動化等階段性任務，旨在追蹤專案從 v1.1 邁向完整功能的路徑。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloaking, planning, roadmap, shadow-cloak]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件列出了「隱者斗篷」系統在完成第二階段部署後的剩餘開發任務。目前已實現基礎反向代理與自託管架構（v1.1），後續將分四批次完成：1) 核心補強（Referer 驗證、多落地頁）；2) 分流與操作工具（權重輪替、連結生成器）；3) 監控與日誌（D1 記錄、TG 告警）；4) JS 自動化（像素注入、連結改寫）。

# 隱者斗篷 — 剩餘步驟清單

本文檔旨在追蹤「隱者斗篷」專案的剩餘開發工作，確保各項功能按計劃推進。

---

## 1. 目前完成狀態

下表總結了截至目前已完成並上線的核心組件。

| 項目 | 版本 | 狀態 | 備註 |
| :--- | :--- | :--- | :--- |
| **shadow-cloak** | v1.1 | ✅ 已上線 | 修正源站指向，解決 522 錯誤。 |
| **safe-page** | v1.0 | ✅ 已上線 | 樂享娛樂安全頁。 |
| **money-page** | v1.0 | ✅ 已上線 | 博富娛樂城推廣頁。 |
| **基礎設施** | — | ✅ 已完成 | DNS、SSL 與路由配置完畢。 |

---

## 2. 待完成步驟

根據功能清單的開發順序，後續任務分為四個階段執行。

### 2.1. 第一批：核心補強 (Core Strengthening)

<step id="phase-1-todo">

| 步驟 | 對應功能 | 目標版本 | 說明 |
| :--- | :--- | :--- | :--- |
| **1** | A5 Referer 驗證 | shadow-cloak v1.2 | 檢查流量是否來自 FB/Google 廣告點擊。 |
| **2** | B6 自訂落地頁 | money-page v1.1 | 實作按鈕連結動態替換。 |
| **3** | B7 多落地頁支援 | shadow-cloak v1.3 | 不同路徑對應不同產品線的落地頁。 |

</step>

### 2.2. 第二批：分流與操作工具 (Splitting & Tools)

<step id="phase-2-todo">

| 步驟 | 對應功能 | 目標版本 | 說明 |
| :--- | :--- | :--- | :--- |
| **4** | C1-C4 輪替分流 | shadow-cloak v1.4 | 按比例分流並攜帶 `fbclid`。 |
| **5** | H1 連結生成器 | 新 Worker/頁面 | 自動生成帶 UTM 參數的斗篷連結。 |

</step>

### 2.3. 第三批：監控與日誌 (Monitoring & Logging)

<step id="phase-3-todo">

| 步驟 | 對應功能 | 目標版本 | 說明 |
| :--- | :--- | :--- | :--- |
| **6** | G1 請求日誌 | shadow-cloak v1.5 | 將詳細請求資訊非同步寫入 D1 資料庫。 |
| **7** | G4-G5 告警 | n8n 工作流 | 機器人流量異常或爬蟲訪問時 TG 通知。 |
| **8** | G6 每日報告 | n8n 工作流 | 每日自動發送流量摘要報告。 |

</step>

### 2.4. 第四批：JS 自動化 (JS Automation)

<step id="phase-4-todo">

| 步驟 | 對應功能 | 目標版本 | 說明 |
| :--- | :--- | :--- | :--- |
| **9** | D1 像素注入 | shadow-cloak v1.6 | 自動在代理頁面注入 BC 像素腳本。 |
| **10** | D2 連結改寫 | shadow-cloak v1.6 | 將頁面按鈕改寫為通過分流端點。 |

</step>

---

## 3. 暫緩項目

以下項目因優先級或外部依賴因素暫緩執行。

| 項目 | 原因 |
| :--- | :--- |
| **域名管理 (E1-E6)** | 待核心功能穩定後再進行開發。 |
| **UI 管理介面** | 待第三批監控與日誌功能完成後再規劃。 |
| **白頁模板庫 (F1-F4)** | 優先級較低，延後處理。 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-feature-ui-spec.md](shadow-cloak-feature-ui-spec.md) | 完整功能規劃 |
| [shadow-cloak-progress.md](shadow-cloak-progress.md) | 當前開發進度 |
| [shadow-cloak-review.md](shadow-cloak-review.md) | 部署審查記錄 |
