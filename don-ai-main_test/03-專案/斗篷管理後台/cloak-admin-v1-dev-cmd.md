---
title: "開發指令 v1.x：斗篷管理後台核心頁面開發指南（素材、廣告、日誌）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "提供斗篷系統管理後台前四個優先頁面（素材中心、廣告製作、添加廣告、廣告日誌）的完整開發指令，涵蓋專案初始化、環境設定、D1 數據庫結構、全局佈局及各頁面組件的實作細節。"
version: "v1.0"
id: "20260325-024356"
type: cmd
tags: [backend, cloak-admin, cloudflare-d1, cloudflare-workers, frontend, hono]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令集為斗篷管理後台 v1.x 版本的核心開發指南。涵蓋：1. **基礎設施**：Cloudflare D1 (`godview-clicks`)、n8n、域名配置。2. **初始化**：React (Vite) + Hono (Worker) 專案建立，Tailwind 紫色主題配置，D1 `campaigns` / `templates` 表結構。3. **佈局**：深色側邊導航欄與路由設定。4. **頁面實作**：素材中心（雙 Tab、Monaco 編輯器）、廣告製作（列表、狀態標籤）、添加廣告（5 步表單、ReactQuill）、廣告日誌（多維度篩選、IP 查詢）。

# 開發指令 v1.x：斗篷管理後台核心頁面開發指南

**目標**：為技術開發團隊提供斗篷系統管理後台前四個優先頁面（素材中心、廣告製作、添加廣告、廣告日誌）的完整開發指令，可直接依此文件進行開發。

## 1. 基礎設施資訊

- **Cloudflare D1 數據庫**: `godview-clicks` (ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`)
- **Cloudflare Account ID**: `61f1eb800e48d2cf41ed9ddacf01581b`
- **自架 n8n**: `https://n8n.bexnua.store`
- **域名**: `bexnua.store` (shadow-cloak Worker), `raxnto.shop` (safe-page Worker)

---

## 2. 指令一：專案初始化與環境設定

**目標**：建立前端 React 專案、後端 Hono Worker 專案，並完成 D1 數據庫的資料表建立。

<step id="v1-init-frontend">

### 2.1. 前端初始化 (React + Vite + TailwindCSS + shadcn/ui)

```bash
# 1. 建立 Vite 專案
npm create vite@latest cloak-admin-frontend -- --template react-ts
cd cloak-admin-frontend

# 2. 安裝依賴
npm install
npm install react-router-dom zustand @tanstack/react-query axios lucide-react date-fns @monaco-editor/react react-quill

# 3. 初始化 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. 初始化 shadcn/ui
npx shadcn-ui@latest init

# 5. 安裝所需 UI 組件
npx shadcn-ui@latest add button input select table dialog tabs checkbox radio-group textarea form label popover badge
```

**修改 `tailwind.config.js`**，加入火鳥紫色主題：

```javascript
// extend colors
primary: {
  DEFAULT: '#7c3aed', // 火鳥系統紫色主題
  hover: '#6d28d9',
  light: '#ede9fe',
},
success: {
  DEFAULT: '#10b981', // 綠色按鈕與標籤
  hover: '#059669',
  light: '#d1fae5',
},
danger: {
  DEFAULT: '#ef4444', // 紅色標籤
  light: '#fee2e2',
}
```
</step>

<step id="v1-init-backend">

### 2.2. 後端 API 初始化 (Cloudflare Workers + Hono)

```bash
# 1. 建立 Hono 專案
npm create hono@latest cloak-admin-api
cd cloak-admin-api
npm install

# 2. 安裝 D1 類型支援與 CORS 中介軟體
npm install @cloudflare/workers-types hono
```

**修改 `wrangler.toml`**，綁定 D1 數據庫：

```toml
[[d1_databases]]
binding = "DB"
database_name = "godview-clicks"
database_id = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
```
</step>

<step id="v1-init-db">

### 2.3. D1 數據庫 Schema 建立

```sql
-- 1. 建立 campaigns 表
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT,
    status TEXT DEFAULT 'active',
    safe_page_id TEXT,
    money_page_id TEXT,
    customer_links TEXT, -- JSON 陣列
    short_codes TEXT, -- JSON 陣列
    routing_strategy TEXT DEFAULT 'random',
    allowed_devices TEXT, -- JSON 陣列
    require_residential BOOLEAN DEFAULT 0,
    pixel_tk TEXT,
    pixel_fb TEXT,
    pixel_ga TEXT,
    pixel_google_ad TEXT,
    pixel_google_conv TEXT,
    cloak_lang TEXT,
    cloak_os TEXT,
    cloak_os_version TEXT,
    cloak_country TEXT,
    cloak_region TEXT,
    cloak_traffic_source TEXT,
    safe_page_type TEXT,
    safe_page_action TEXT,
    safe_page_content TEXT,
    blacklist_rules TEXT, -- JSON 陣列
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 建立 templates 表
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- money_page, safe_page
    country TEXT NOT NULL,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
</step>

---

## 3. 指令二：全局佈局與路由

**目標**：建立後台的側邊導航欄、頂部標題欄，並設定四個主要頁面的路由。

<step id="v1-layout-steps">

1. **路由設定 (`src/App.tsx`)**：設定 `/templates`, `/campaigns`, `/campaigns/new`, `/logs` 路由。
2. **側邊欄 (`src/layouts/Layout.tsx`)**：
   - 使用 `lucide-react` 圖標。
   - 選中項背景色：`bg-primary` (`#7c3aed`)。
   - 導航項：儀表板、廣告製作、素材中心、域名/短鏈、廣告日誌、系統設定。

</step>

---

## 4. 指令三：素材中心頁面

**目標**：開發素材中心頁面，包含雙 Tab 切換、數據表格、新增主題彈窗與源碼編輯器。

<rule id="v1-template-page-rule">

- **雙 Tab**：落地頁管理 / 素材中心。
- **標籤顏色**：安全頁 (`bg-success-light`) / 主題 (`bg-primary-light`)。
- **源碼編輯器**：使用 `@monaco-editor/react`，主題 `vs-dark`，支援 HTML/CSS/JS 格式檢查。

</rule>

---

## 5. 指令四：廣告製作頁面 (列表)

**目標**：開發廣告列表頁面，包含搜索區、數據表格與狀態標籤。

<step id="v1-campaign-list-steps">

1. **搜索區**：廣告活動名稱輸入框 + 重置 + 搜索按鈕。
2. **新增按鈕**：綠色 `bg-success` 按鈕，跳轉至 `/campaigns/new`。
3. **表格欄位**：廣告名稱、主題、客服鏈接（多行）、二級鏈接/短碼（Badge 顯示）、狀態（上架/下架）、操作（日誌/編輯/刪除/分享）。

</step>

---

## 6. 指令五：添加廣告頁面 (5 步表單)

**目標**：開發複雜的添加廣告表單，包含左側 5 步流程指引、左右分欄表單與富文本編輯器。

<step id="v1-campaign-edit-steps">

1. **左側指引**：① 選擇模版、② 添加分流、③ 創建斗篷、④ 廣告投放、⑤ 提交信息。
2. **右側分欄**：
   - **左欄**：基本資訊（標題、落地頁）、分流設置（Line 鏈結、策略）、斗篷規則（設備、住宅 IP）。
   - **右欄**：廣告投放 Pixel (TK/FB/Google)、安全頁設置（模板/自定義、富文本編輯器 `ReactQuill`）。

</step>

---

## 7. 指令六：廣告日誌頁面

**目標**：開發廣告日誌頁面，包含複雜的篩選條件與日誌數據表格。

<rule id="v1-log-page-rule">

- **篩選維度**：IP、廣告活動、域名、訪客 ID、國家、結果 (Safe/Money)、日期範圍。
- **表格細節**：IP 旁附帶 `ipinfo.io` 外部鏈結圖標；地理位置顯示國旗/地球圖標；結果欄位使用 Badge 區分。

</rule>

---

## 8. 驗收標準

<rule id="v1-dev-acceptance">

1. **初始化**：前後端專案可啟動，D1 表結構正確。
2. **佈局**：側邊欄切換流暢，紫色主題色正確。
3. **素材中心**：Monaco 編輯器可正常載入與編輯。
4. **廣告製作**：列表數據渲染正確，跳轉邏輯正常。
5. **添加廣告**：5 步表單 UI 完整，富文本編輯器可用。
6. **廣告日誌**：篩選器佈局整齊，外部鏈結可跳轉。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-v1-6-fix-material-btn-cmd.md](cloak-admin-v1-6-fix-material-btn-cmd.md) | v1.6 版素材按鈕修復 |
| [cloak-admin-v1-7-add-ad-logic-cmd.md](cloak-admin-v1-7-add-ad-logic-cmd.md) | v1.7 版廣告邏輯詳解 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範 |
