---
title: "修復指令：素材中心採集與系統主題"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "修復素材中心採集功能無法下載靜態資源、系統主題內容為空，以及清理無效測試數據的問題。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloudflare-d1, data-collection, landing-page, troubleshooting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令修復素材中心三大缺陷：**1. 採集功能優化**（將 `POST /templates/crawl` 改為分析+儲存兩階段，支援 CSS/JS/Img 內聯化，Img < 200KB 轉 Base64）；**2. 填充系統主題**（為 RPG、新聞、電商三個模板撰寫 < 50KB 的自包含 HTML）；**3. 清理數據**（刪除「測試」與「測試探集」無效記錄）。受限於 D1 限制，單筆寫入上限 **1MB**，單次採集最多 **50 個資源**。

# 修復指令：素材中心採集與系統主題

**版本：** bugfix
**規劃組：** A 規劃組
**執行組：** 技術組
**前置作業：** 請務必先閱讀《通用環境指令-斗篷後台.md》了解專案架構與限制。

## 背景與目標

目前素材中心存在採集功能缺陷、系統主題內容為空及無效測試數據等三個主要問題。本次任務旨在修復這些問題，確保採集功能完整，並為系統主題提供高質量的預設內容。

### 主要問題

1.  **採集功能缺陷**：現有 `POST /templates/crawl` API 僅抓取 HTML，未下載 CSS、JS、圖片等靜態資源，導致預覽時資源載入失敗。
2.  **系統主題內容為空**：系統預設的三個主題模板（RPG手遊、新聞資訊、電商促銷）內容為空，無法直接使用。
3.  **無效測試數據**：資料庫中存在無實際用途的測試模板數據需要清理。

## 詳細修復方案

### 1. 採集功能優化

<rule id="crawl-logic">
**修復邏輯**：將採集過程分為「分析」和「儲存」兩階段。
</rule>

#### 後端修復步驟 (`POST /templates/crawl`)

<step id="crawl-backend-1">
**階段 A：分析（不存入資料庫）**
1.  **抓取 HTML**：抓取目標 URL 的 HTML 源碼。
2.  **解析資源**：解析所有 `link[href]` (CSS)、`script[src]` (JS)、`img[src]` (圖片) 引用。
3.  **路徑轉換**：將相對路徑轉換為基於原始 URL 的絕對路徑。
4.  **下載與替換**：
    -   **CSS**：下載內容並嵌入 `<style>` 標籤，替換原有 `<link>`。
    -   **JS**：下載內容並嵌入 `<script>` 標籤。
    -   **圖片**：下載圖片並轉換為 Base64 Data URI，替換原有 `src` 屬性。
5.  **回傳分析結果**：回傳處理後的自包含 HTML 及資源統計數據。
</step>

#### 重要限制與規則

<rule id="crawl-constraints">
-   **D1 寫入限制**：單筆寫入最大為 1MB。**單張圖片上限 200KB**，超過此大小的圖片保留原始 URL。
-   **Workers Fetch 限制**：**一次採集最多 fetch 50 個資源**，超過的資源保留原始 URL。
-   **容錯處理**：若資源下載失敗，**保留其原始 URL**，不中斷採集過程。
</rule>

### 2. 填充系統主題內容

<rule id="system-theme-reqs">
**修復要求**：為三個主題撰寫符合以下要求的 HTML 內容：
-   **完全自包含**：CSS 內聯，無外部依賴。
-   **響應式設計**：適配手機和桌面設備。
-   **大小限制**：單個模板 HTML 內容不超過 **50KB**。
</rule>

#### 模板具體需求

<step id="fill-themes-1">**RPG手遊攻略安全頁 (`safe-page-game.html`)**：模擬遊戲攻略文章，包含標題、內文、圖片佔位符。</step>
<step id="fill-themes-2">**新聞資訊安全頁 (`safe-page-news.html`)**：模擬新聞網站文章，包含標題、發布時間、相關新聞列表。</step>
<step id="fill-themes-3">**電商促銷推廣頁 (`promo-ecommerce.html`)**：模擬電商促銷活動，包含商品圖、價格、倒計時、購買按鈕。</step>

### 3. 清理無效數據

<step id="cleanup-data">
**修復邏輯**：請技術組手動或通過 API 刪除 `templates` 表中名稱為「測試」和「測試探集」的兩筆無效數據。
</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-bugfix-full-cmd.md](cloak-admin-bugfix-full-cmd.md) | 全面修復指令 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案靈魂文件 |
