---
title: "Bexnua Ads 後台 UI 白色模板升級開發規劃 (最終版)"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "admin.bexnua.store 白色模板升級的完整開發規劃：代碼結構分析、7 步驟改版範圍、工作量預估（10 工作天）、風險評估與驗收標準。"
version: "v1.0"
id: "20260326-ui-upgrade-plan"
type: guide
tags: [cloak-admin, frontend, planning, react, tailwindcss, ui-ux]
status: active
created: "2026-03-26"
updated: "2026-03-29"
---
> **TL;DR**: 本計劃書定義了 `admin.bexnua.store` 全站 UI 升級的技術路線與實施時程。目標是將現有的深色主題全面重構為基於白色模板的現代化 UI，以提升營運人員的使用體驗。計劃將開發過程拆分為 7 個關鍵步驟，預估總工作量為 10 個工作天。核心改動涵蓋全局 CSS 變數更新、`AppLayout.tsx` 重寫、以及 7 個主要功能頁面（Dashboard, Campaigns, Logs, Templates, Domains, Settings）的遷移。特別注意「編輯廣告」交互從彈窗改為全螢幕佈局的風險控管。

# Bexnua Ads 後台 UI 白色模板升級開發規劃 (最終版)

## 一、現有代碼結構分析

基於對 `cloak-admin` 前端代碼庫的深入分析，系統採用 React 19 搭配 TypeScript 與 Vite 進行構建。

<boundaries id="code-structure">

- **路由管理**: 使用 `wouter`。
- **樣式系統**: Tailwind CSS v4 結合 `index.css` 中的 CSS 變數。
- **UI 組件庫**: 基於 Radix UI 的 `shadcn/ui`，存放於 `client/src/components/ui/`。
- **數據可視化**: 依賴 `recharts`。
- **API 請求**: 統一封裝於 `client/src/lib/api.ts` (Axios)。
- **主題配置**: 主色調為紫色 (`--primary`)，側邊欄目前為深色背景 (`--sidebar`)。

</boundaries>

---

## 二、UI 改版範圍 (全站同步)

核心目標是將全站所有頁面升級為白色/淺色系模板，並優化視覺層次。

### 2.1 全局樣式與佈局
- **CSS 變數**: 側邊欄改為純白/淺灰背景，文字調整為深色，選中態採用淺紫色背景。
- **佈局組件**: `AppLayout.tsx` 移除頂部深色背景，新增麵包屑導航，優化搜尋框與用戶頭像佈局。

### 2.2 頁面特定修改

| 頁面名稱 | 主要修改內容 |
| :--- | :--- |
| **廣告管理總覽** | 重新設計 4 個統計卡片（含趨勢圖標），新增「效果最佳 Top 5」區塊（Mock 數據）。 |
| **廣告列表** | 重構工具列（Tabs + 搜尋），調整批量操作列為淺紫色背景，優化表格狀態標籤。 |
| **編輯廣告** | 將 Dialog 彈窗改為全螢幕抽屜佈局，實作左側步驟導航與右側獨立卡片表單。 |
| **訪問日誌** | 新增「今日訪問」與「通過/攔截」統計卡片，整合日期選擇器，加入國旗圖示。 |
| **素材中心** | 同步白色卡片與表格樣式，優化 `AddTemplatePanel` 內的 Tabs 與彈窗。 |
| **域名/短鏈** | 優化 NS 設定指引卡片（黃色背景改為新風格提示框），同步表格與彈窗樣式。 |
| **系統設定** | 恢復隱藏的路由與側邊欄連結，建立基礎白色卡片佈局頁面。 |

---

## 三、開發步驟與預估工作量 (10 工作天)

<step id="ui-upgrade-steps">

1.  **Step 1: 全局樣式與佈局重構 (1天)**: 修改 CSS 變數、`AppLayout.tsx` 與 `App.tsx`。
2.  **Step 2: 共用 UI 組件優化 (1.5天)**: 優化圓角/邊框，新增狀態標籤與日期範圍選擇器。
3.  **Step 3: 廣告管理總覽重構 (1天)**: 統計卡片、趨勢圖表與 Top 5 區塊。
4.  **Step 4: 廣告列表與編輯重構 (2.5天)**: 批量操作列、全螢幕編輯佈局與步驟導航。
5.  **Step 5: 訪問日誌重構 (1天)**: 統計卡片、日期選擇器與國旗圖示。
6.  **Step 6: 素材中心與域名管理重構 (2天)**: 同步所有卡片、表格、Tabs 與彈窗風格。
7.  **Step 7: 系統設定頁面建立與測試 (1天)**: 建立 `Settings.tsx` 並進行全站響應式測試。

</step>

---

## 四、風險評估與應對

<rule id="risk-management">

- **編輯廣告交互變更 (高)**: 從 `Dialog` 改為全螢幕頁面成本較高。**應對**: 保持在 `Campaigns.tsx` 內處理，但將 `DialogContent` 樣式修改為佔滿螢幕的抽屜式設計。
- **複雜表單樣式覆蓋 (中)**: 深層嵌套的表單可能出現佈局異常。**應對**: 逐一開啟所有彈窗進行視覺回歸測試。
- **Mock 數據遺漏 (低)**: Dashboard 部分數據尚無 API。**應對**: 嚴格標註 `// TODO: 補接 API` 註解。

</rule>

---

## 五、驗收標準

- **全局**: 側邊欄白色，選中項淺紫色背景；主背景淺灰色，卡片純白色帶陰影。
- **功能**: 麵包屑導航正確；系統設定頁面可訪問；編輯介面佔滿畫面。
- **細節**: 狀態標籤帶小圓點；國家/IP 列顯示國旗圖示；代碼中包含必要的 TODO 標記。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-ui-upgrade-analysis.md](cloak-admin-ui-upgrade-analysis.md) | 升級完成報告 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範與設計 Token |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
