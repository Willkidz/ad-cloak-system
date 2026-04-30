---
title: "隱者斗篷 技術組 — 執行記錄"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "記錄「隱者斗篷」管理後台各項技術任務的執行細節、版本更新、系統架構與部署資訊，涵蓋 v1.11.x 版本的前後端重建與 v6.0 分流引擎整合。"
version: "v1.0"
id: "20260325-tech-exec-log"
type: log
tags: [changelog, cloaking, cloudflare-d1, cloudflare-workers, reporting, shadow-cloak]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本執行記錄彙整了「隱者斗篷」專案自 2026-03-25 以來的重大技術更新。核心成果包含：1) 完成 `cloak-admin` 前後端 v1.11.0 重建，修復 36 個 Bug；2) 實作 v1.11.1 廣告製作表單與域名管理頁面；3) 部署 `shadow-cloak v6.0` 動態分流引擎，實現從 D1 資料庫讀取廣告設定；4) 建立 `preview-page` 解決素材預覽的跨域限制。

# 隱者斗篷 技術組 — 執行記錄

## 1. 版本更新總覽 (Version History)

| 版本 | 日期 | 元件 | 說明 | 狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **v1.11.0** | 2026-03-25 | `cloak-admin` | 全面 Bug 修復（36 個）+ 前端完整重建。 | ✅ 已部署 |
| **v1.11.1** | 2026-03-25 | `cloak-admin` | 廣告製作表單完整版（8 個功能區塊，對齊火鳥）。 | ✅ 已部署 |
| **v1.11.1** | 2026-03-25 | `cloak-admin-api` | 廣告表單後端 API 完整支援 + 域名/短鏈 API。 | ✅ 已部署 |
| **v6.0** | 2026-03-25 | `shadow-cloak` | **動態分流引擎**：讀取 D1 廣告設定進行分流。 | ✅ 已部署 |
| **v1.0** | 2026-03-25 | `preview-page` | 建立 `preview.bexnua.store` 代理預覽服務。 | ✅ 已部署 |
| **v1.11.2** | 2026-03-25 | `cloak-admin` | 素材中心新增「採集新增」Tab + 預覽開新分頁。 | ✅ 已部署 |
| **v1.11.3** | 2026-03-25 | `cloak-admin` | 補齊廣告表單下拉選項（19 語言/6 OS/10 來源）。 | ✅ 已部署 |

---

## 2. 詳細執行記錄 (Execution Details)

### 2.1. v1.11.0 — 前後端重建與 Bug 修復
- **任務來源**：修復指令—bugfix—後台功能全面修復.md
- **前端重建**：React + TypeScript + Vite + Tailwind CSS + shadcn/ui。
- **設計風格**：深色側邊欄（深紫/靛色漸變）+ 淺色主內容區，主色 `#7c3aed`。
- **Bug 修復統計**：致命問題 (3/3)、嚴重問題 (7/7)、一般問題 (18/18)、輕微問題 (7/7)，總計 36/36 ✅。

### 2.2. preview-page — 素材預覽服務
- **問題**：素材中心預覽原使用 iframe 嵌入，因 Cloudflare Workers 的 `X-Frame-Options` 限制導致失敗。
- **解決方案**：建立獨立的 `preview` Worker，代理到對應的 `money-page` 或 `safe-page` Worker。
- **代理邏輯**：
    - `money_page` 類型 → 代理到 `money-page.laoqin1689.workers.dev`。
    - `safe_page` 類型 → 代理到 `safe-page.laoqin1689.workers.dev`。
    - `landing_page` 類型 → 從 D1 `templates` 表讀取 `content` 渲染 HTML。

### 2.3. v2.6 — shadow-cloak 動態分流整合
- **核心變更**：將寫死規則改為從 D1 資料庫動態讀取廣告設定。
<rule id="shadow-cloak-logic">

1.  根據請求的 `hostname` 查詢 D1 `campaigns` 表。
2.  若找不到對應廣告，則回傳安全頁。
3.  若找到廣告，則依序套用過濾規則（裝置、IP 類型、國家、語言、OS、來源、黑名單）。
4.  通過規則檢查 → 代理到 `money_page` 模板；未通過 → 代理到 `safe_page` 模板。
5.  所有訪問日誌非同步寫入 `cloak_logs` 並記錄 `campaign_id`。

</rule>

---

## 3. 系統架構總覽 (System Architecture)

```text
訪客點擊廣告
    ↓
[推廣域名] (fyntro.lol 等)
    ↓
shadow-cloak Worker (v6.0)
    ├── 查 D1 campaigns 表 (WHERE theme = hostname)
    ├── 套用廣告的斗篷規則
    ├── 通過 → proxy 到 money_page 模板
    └── 不通過 → proxy 到 safe_page 模板
    ↓
寫入 cloak_logs (含 campaign_id)

後台管理
    ↓
admin.bexnua.store (cloak-admin, Cloudflare Pages)
    ↓
admin-api.bexnua.store (cloak-admin-api, Cloudflare Workers)
    ↓
D1: cloak-admin-db (campaigns, templates, domains, logs)
```

---

## 4. 相關資源 (Resources)

| 元件 | 版本 | URL | 備注 |
| :--- | :--- | :--- | :--- |
| **shadow-cloak** | v6.0 | 所有推廣域名 | 反向代理 + 斗篷判定（D1 廣告設定分流）。 |
| **safe-page** | v1.2 | `safe-page.laoqin1689.workers.dev` | 安全頁。 |
| **money-page** | v1.0 | `money-page.laoqin1689.workers.dev` | 推廣頁。 |
| **cloak-admin** | v1.11.2 | `https://admin.bexnua.store` | 後台前端。 |
| **cloak-admin-api** | v1.11.2 | `https://admin-api.bexnua.store` | 後台後端。 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-progress.md](shadow-cloak-progress.md) | 專案進度記錄 |
| [shadow-cloak-feature-ui-spec.md](shadow-cloak-feature-ui-spec.md) | 完整功能規劃 |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構模式 |
