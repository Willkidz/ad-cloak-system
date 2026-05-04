---
title: "修復指令 — bugfix — 後台功能全面修復"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件彙整了斗篷管理後台的 36 個待修復問題，並提供詳細的修復方向與執行順序。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, dns, landing-page, reporting, troubleshooting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件指導技術組修復 `admin.bexnua.store` 的 **36 個待修復問題**。核心修復包含：**BUG-01 落地頁管理空白**（檢查 `GET /api/v1/templates?type=money_page`）、**BUG-02 域名解析無反應**（檢查 `POST /api/v1/domains/resolve`）、**BUG-03 預覽空白**（檢查 `window.open()` 與素材 ID 拼接）、**BUG-10 日誌表格溢出**（添加 `overflow-x-auto`）。修復順序為：致命（2）> 嚴重（9）> 一般（18）> 輕微（7）。

# 修復指令 — bugfix — 後台功能全面修復

本文件旨在指導技術組全體成員對「斗篷管理後台」(admin.bexnua.store) 進行全面的功能修復。根據系統測試報告，本文彙整了 **36 個待修復問題**，按優先級由高到低排列為致命（2）、嚴重（9）、一般（18）、輕微（7）四個等級。每個問題均包含詳細描述、預期行為與具體修復方向。

- **目標系統**: `admin.bexnua.store`
- **搭配文件**: 《通用環境指令-斗篷後台》
- **前端 Repo**: `Willkidz/ad-cloak-system` (React + Vite + Tailwind CSS + shadcn/ui)
- **後端 Worker**: `cloak-admin-api` (Hono + Cloudflare D1)

請技術組依序執行修復，並於每次修改後完成 build、部署與驗證的完整流程。

## 問題總覽

| 優先級 | 數量 | 涵蓋模塊 |
|:---|:---|:---|
| 致命 | 2 | 素材中心、域名短鏈 |
| 嚴重 | 9 | 素材中心、系統主題、編輯源碼、廣告日誌、域名短鏈 |
| 一般 | 18 | 儀表板、素材中心、新增主題、廣告製作、廣告日誌、域名短鏈 |
| 輕微 | 7 | 儀表板、系統主題、自定義新增、廣告製作、廣告日誌、系統設定 |

## 一、致命問題 (共 2 個)

致命問題代表核心功能完全不可用，必須最優先修復。

### BUG-01｜素材中心「落地頁管理」Tab 點進去完全空白

| 項目 | 說明 |
|:---|:---|
| **所屬模塊** | 素材中心 |
| **問題描述** | 在素材中心點擊「落地頁管理」Tab 後，頁面完全空白，沒有任何內容、表格或提示文字。這意味著落地頁相關的所有管理操作（查看、編輯、刪除）均無法進行。 |
| **預期行為** | 切換到「落地頁管理」Tab 後，應正常渲染落地頁列表表格。若無資料，應顯示「暫無數據」的空狀態提示。 |

**修復方向**

<step id="bug-01-fix">
前端問題。請檢查 `src/pages/Templates/` 目錄下負責落地頁列表渲染的元件（可能命名為 `LandingPageList.tsx`、`MoneyPageTab.tsx` 或在主元件中以條件渲染實現）。重點排查以下三個方面：
1.  確認該 Tab 對應的元件是否已正確實作並匯出。
2.  確認 API 請求 `GET /api/v1/templates?type=money_page` 是否被正確調用，以及回傳數據是否被正確解析（注意 `type` 參數值是否與後端一致）。
3.  確認渲染邏輯中是否存在未捕獲的異常（如存取 `undefined` 屬性）導致 React 元件崩潰白屏。建議在該元件外層包裹 `ErrorBoundary`，以便在開發階段快速定位問題。
</step>

### BUG-02｜域名解析功能完全無反應

| 項目 | 說明 |
|:---|:---|
| **所屬模塊** | 域名短鏈 |
| **問題描述** | 在域名解析 Tab 中，輸入域名後點擊「解析域名」按鈕，無任何反應——沒有 loading 動畫、沒有成功或失敗提示、表格也沒有任何變化。此問題為連鎖影響源頭，直接導致 BUG-11（新增短鏈無可用域名）及 BUG-20（添加廣告鏈接下拉無選項）。 |
| **預期行為** | 點擊「解析域名」後應顯示 loading 狀態，調用後端域名解析 API，成功後更新域名列表表格並顯示成功提示；失敗則顯示具體錯誤原因。 |

**修復方向**

<step id="bug-02-fix">
前端為主，可能涉及後端。首先檢查域名解析元件中「解析域名」按鈕的 `onClick` 事件是否正確綁定了處理函數。其次確認 `src/api/index.ts` 中是否存在對應的域名解析 API 函數，以及該函數是否被正確調用。若 API 函數存在但未被調用，則為前端事件綁定問題；若 API 函數本身不存在，則需新增。後端方面，確認 `cloak-admin-api` 是否有域名解析相關的路由端點（如 `POST /api/v1/domains/resolve`），若無則需新增。
</step>

## 二、嚴重問題 (共 9 個)

嚴重問題代表主要功能受損或使用者體驗嚴重受阻，應在致命問題修復後立即處理。

### BUG-03｜素材中心 - 預覽按鈕打開新窗口但完全空白

| 項目 | 說明 |
|:---|:---|
| **所屬模塊** | 素材中心 |
| **問題描述** | 點擊素材列表的「預覽」按鈕會打開新窗口，但頁面內容完全空白（顯示 `about:blank`），無法查看素材的實際效果。 |
| **預期行為** | 新窗口應正確加載並顯示該素材的 HTML 預覽內容。 |

**修復方向**

<step id="bug-03-fix">
前端問題。檢查 `src/pages/Templates/` 列表元件中「預覽」按鈕的 `window.open()` 調用邏輯。確認傳遞的 URL 是否正確拼接了素材 ID（如 `/preview/:id`），或者是否使用了 `Blob URL` / `document.write()` 方式寫入 HTML 內容。若預覽依賴後端 API（如 `GET /api/v1/templates/:id`）返回 HTML 內容，需確認 API 調用是否成功以及內容是否被正確寫入新窗口。
</step>

### BUG-10｜廣告日誌表格列過多且無水平滾動條

| 項目 | 說明 |
|:---|:---|
| **所屬模塊** | 廣告日誌 |
| **問題描述** | 表格列過多且無水平滾動條，導致佈局極度擁擠，「狀態」和「日誌（攔截原因）」列被擠出視窗外，無法查看。 |
| **預期行為** | 表格容器應支持水平滾動，確保所有列都能被查看；或對次要列進行隱藏/折疊處理。 |

**修復方向**

<step id="bug-10-fix">
前端問題。在 `src/pages/Logs/` 的表格外層容器添加 `overflow-x-auto` 類，並為 `<table>` 元素設置 `min-w-[1200px]`（或根據實際列寬調整）。同時考慮為「訪客ID」和「UA」列設置固定寬度（如 `w-32`）並配合 `truncate` 類截斷顯示，以減少表格總寬度。
</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-full-verify-analysis.md](cloak-admin-full-verify-analysis.md) | 全面測試報告 |
| [cloak-admin-bugfix-material-sys-cmd.md](cloak-admin-bugfix-material-sys-cmd.md) | 素材中心修復指令 |
| [cloak-admin-troubleshoot.md](cloak-admin-troubleshoot.md) | 故障診斷紀錄 |
