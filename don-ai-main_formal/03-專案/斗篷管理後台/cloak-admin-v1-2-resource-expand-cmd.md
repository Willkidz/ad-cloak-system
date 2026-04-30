---
title: "素材中心功能擴充指令 v1.2"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "擴充斗篷管理後台的素材中心功能，將「新增主題」升級為包含採集、ZIP 上傳、自定義和系統模板四個功能的 Tab 彈窗，並定義對應的後端 API 規格與前端組件實作細節。"
version: "v1.0"
id: "20260324-v1-2-resource-expand"
type: cmd
tags: [api, cloak-admin, data-collection, frontend, landing-page]
status: active
created: "2026-03-24"
updated: "2026-03-29"
---
> **TL;DR**: 本指令定義了素材中心「新增主題」功能的重大升級。目標是將單一表單替換為包含 **4 個 Tab** 的功能彈窗（採集、ZIP 上傳、自定義、系統模板），UI 需對齊火鳥系統。技術要點包括：(1) 前端引入 **TinyMCE** 富文本編輯器；(2) 後端引入 **fflate** 處理 Cloudflare Workers 環境下的 ZIP 解壓；(3) 新增 3 個 API 端點（`/templates/crawl`, `/templates/upload`, `/templates/system`）。採集功能需抓取完整 HTML，ZIP 上傳需提取 `index.html`。

# 素材中心功能擴充指令 v1.2

**作者**：資深技術主管  
**日期**：2026-03-24  
**版本**：v1.2  
**前置版本**：開發指令-斗篷後台v1、修復指令-斗篷後台v1.1  
**線上環境**：`https://admin.bexnua.store`

---

## 一、變更概述

<rule id="feature-upgrade">
素材中心「新增主題」彈窗將從單一表單升級為包含 **四個 Tab** 的完整功能彈窗，UI 與火鳥廣告系統完全一致。此變更旨在擴充素材來源，支援網頁採集、ZIP 壓縮包上傳與系統內置模板，並需同步開發對應的後端 API 端點。
</rule>

### 1.1 變更範圍

| 變更類型 | 檔案路徑 | 說明 |
| :--- | :--- | :--- |
| **替換** | `src/pages/Templates/AddTemplateModal.tsx` | 原單一表單替換為四 Tab 彈窗。 |
| **新增** | `src/pages/Templates/tabs/` | 新增 `CrawlTab`, `ZipUploadTab`, `CustomTab`, `SystemTab`, `SharedFormFields`。 |
| **修改** | `src/api/index.ts` | 新增 `crawl`, `upload`, `system` 請求函式。 |
| **新增** | 後端 `src/routes/templates.ts` | 新增對應的 API 路由。 |

---

## 二、前置準備：套件安裝

### 2.1 前端套件 (TinyMCE)
<step id="frontend-dependency">
在 `cloak-admin-frontend` 目錄下安裝 TinyMCE 以實現完整工具列功能。
```bash
npm install @tinymce/tinymce-react
```
**注意**: TinyMCE 需要 API Key，請設定於 `.env` 中的 `VITE_TINYMCE_API_KEY`。
</step>

### 2.2 後端套件 (fflate)
<step id="backend-dependency">
在 `cloak-admin-api` 目錄下安裝 `fflate` 以支援 Workers 環境下的 ZIP 解壓。
```bash
npm install fflate
```
</step>

---

## 三、API 端點規格 (Base: `/api/v1`)

### 3.1 POST `/templates/crawl` — 採集新增
- **用途**: 接收目標網址，抓取其 HTML 原始碼作為新素材。
- **Request Body**: `{ "url", "name", "country", "type", "status", "identifier" }`
- **後端邏輯**: 使用 `fetch` 抓取網頁，將 HTML 存入 `templates.content`。需設定合理 User-Agent。

### 3.2 POST `/templates/upload` — ZIP 上傳
- **用途**: 接收 ZIP 壓縮包，解壓並提取 `index.html`。
- **Request Body**: `multipart/form-data` (包含 `file` 欄位)。
- **後端邏輯**: 使用 `fflate` 解壓，搜尋並提取 `index.html` 內容。若無 `index.html` 則返回 400。

### 3.3 GET `/templates/system` — 系統模板列表
- **用途**: 返回預設的系統模板列表。
- **Response**: `{ "success": true, "data": [ { "id", "name", "type", "file", "preview" } ] }`

---

## 四、前端組件實作細節

### 4.1 共用表單欄位 (SharedFormFields.tsx)
<step id="impl-shared-fields">
將「主題名稱」、「國家」、「類型」、「狀態」抽取為獨立組件，供前三個 Tab 復用。
</step>

### 4.2 Tab 1: 採集新增 (CrawlTab.tsx)
<step id="impl-crawl-tab">
提供輸入框填寫採集鏈接，並附帶提示文字：「系統將自動抓取該網址的完整 HTML 內容作為主題素材」。
</step>

### 4.3 Tab 2: ZIP 上傳 (ZipUploadTab.tsx)
<step id="impl-zip-tab">
提供拖拽上傳區域，包含檔案格式（.zip）與大小驗證。
</step>

### 4.4 Tab 3: 自定義新增 (CustomTab.tsx)
<step id="impl-custom-tab">
內嵌 TinyMCE 富文本編輯器。若不依賴外部 CDN，可改用 `react-quill` 作為備選方案。
</step>

### 4.5 Tab 4: 系統主題 (SystemTab.tsx)
<step id="impl-system-tab">
通過 `useQuery` 獲取系統模板列表，展示預覽圖並提供「使用」按鈕。
</step>

---

## 五、結論與驗收

本次擴充將大幅提升素材中心的靈活性。開發團隊需確保：
1. 四個 Tab 的 UI 與火鳥系統完全一致。
2. ZIP 上傳能正確處理不同目錄結構下的 `index.html`。
3. 採集功能具備基本的錯誤處理（如目標網站拒絕訪問）。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-template-resource-analysis.md](cloak-admin-template-resource-analysis.md) | 採集器資源失效分析與重構方案 |
| [cloak-admin-bugfix-material-sys-cmd.md](cloak-admin-bugfix-material-sys-cmd.md) | 素材中心修復指令 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
