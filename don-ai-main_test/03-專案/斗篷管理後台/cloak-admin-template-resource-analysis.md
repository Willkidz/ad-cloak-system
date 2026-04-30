---
title: "素材模板資源問題分析與採集器重構方案"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "分析 1122 模板（博富娛樂城）因相對路徑資源導致的載入失敗問題，並提出兩階段採集器重構方案，包含資源內聯、Base64 轉換及 D1 1MB 寫入限制處理。"
version: "v1.0"
id: "20260325-template-resource-analysis"
type: analysis
tags: [cloak-admin, cloudflare-d1, data-collection, landing-page]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告針對素材模板採集功能（`POST /templates/crawl`）的資源載入失敗問題進行深度分析。核心問題在於採集器僅抓取 HTML 而未處理 CSS/JS/圖片等相對路徑資源，導致 1122 模板（博富娛樂城）等素材在預覽時出現大量 404 錯誤。解決方案：重構採集器為「兩階段處理模式」——(1) 解析 HTML 並將所有相對路徑轉換為絕對路徑；(2) 將關鍵資源（CSS, JS, 小於 200KB 的圖片）內聯化或 Base64 化，生成完全自包含的 HTML。需嚴格遵守 D1 資料庫單次寫入 1MB 的物理限制，並對超過 50 個資源的請求執行截斷。

# 素材模板資源問題分析與採集器重構方案

本文件旨在分析「斗篷管理後台」素材中心在模板採集與呈現上的技術缺陷，並提供具體的重構規格。

---

## 一、現有模板數據現況

目前系統中存在 4 筆測試數據，其中 1122 模板代表了典型的採集失敗案例。

| 名稱 | 類型 | 國家 | Content 長度 | 狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **測試** | safe_page | TW | 528 bytes | 正常 (example.com) |
| **測試探集** | safe_page | 台灣 | 528 bytes | 正常 (example.com) |
| **1122** | money_page | TW | 11,118 bytes | **失效 (博富娛樂城)** |
| **1122-副本** | money_page | TW | 11,118 bytes | **失效 (1122 複製品)** |

---

## 二、問題深度分析：資源路徑失效

1122 模板在預覽時無法正常顯示樣式與圖片，經檢查 HTML 原始碼，發現其引用了大量火鳥伺服器的相對路徑資源：

<example id="failed-resource-paths">

- `/themes/t11526906//themes/t1556437//css/bootstrap.min.css` (樣式表)
- `/themes/t11526906//themes/t1556437//image/bg.png` (背景圖)
- `/themes/t11526906//themes/t1556437//image/LOGO.png` (Logo)
- `/themes/t11526906//themes/t1556437//image/ClickAdd.png` (按鈕圖)
- `/themes/t11526906//themes/t1556437//js/bootstrap.bundle.min.js` (腳本)

</example>

由於這些資源在 `admin.bexnua.store` 域名下不存在，且採集器未進行路徑轉換，導致瀏覽器嘗試從後台域名加載這些資源並返回 404。

---

## 三、採集器重構方案：兩階段處理模式

為了解決資源失效問題，採集服務（`POST /templates/crawl`）必須從單純的 HTML 抓取升級為「資源整合引擎」。

### 3.1 處理流程 (Two-Phase Crawl)

<step id="crawl-steps">

1.  **解析與轉換**:
    - 解析 HTML 中所有的 `link[href]`, `script[src]`, `img[src]`。
    - 將所有相對路徑轉換為指向原始伺服器的絕對路徑。
2.  **資源內聯 (Inlining)**:
    - **CSS/JS**: 下載內容並直接嵌入 `<style>` 與 `<script>` 標籤。
    - **圖片**: 下載並轉換為 Base64 Data URI 嵌入 `src`。
3.  **生成自包含 HTML**: 輸出一個不依賴外部資源的單一 HTML 文件。

</step>

### 3.2 技術邊界與限制 (Boundaries)

<boundaries id="crawler-limits">

- **D1 寫入限制**: 單筆記錄寫入 D1 資料庫不得超過 **1MB**。
- **圖片內聯閾值**: 僅對小於 **200KB** 的圖片執行 Base64 轉換，超過者保留絕對路徑連結。
- **資源數量上限**: 單個頁面最多處理 **50 個** 外部資源請求，超出部分將停止下載以防止超時。
- **失敗處理**: 若資源下載失敗，應保留原始絕對路徑作為 Fallback，不應導致整個採集任務崩潰。

</boundaries>

---

## 四、結論與建議

目前的採集功能僅完成了「抓取」而未完成「處理」。透過實施上述兩階段處理模式，可以確保採集到的素材在任何域名下都能完美呈現。在實施過程中，應優先處理 1122 模板的修復，並清理無效的測試數據。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-bugfix-material-sys-cmd.md](cloak-admin-bugfix-material-sys-cmd.md) | 素材中心與系統主題修復指令 |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
