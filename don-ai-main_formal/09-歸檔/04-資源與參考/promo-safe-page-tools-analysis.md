---
title: "推廣頁與安全頁工具報告"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）推廣頁與安全頁工具報告"
type: "analysis"
tags: [analysis, changelog]
status: "archived"
---
---
title: "推廣頁與安全頁工具報告"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-27
summary: "整理並分析開源的推廣頁生成器、斗篷系統、網頁克隆工具及模板系統，提供技術棧、優缺點對比和選型建議。"
id: "20260325-110300"
type: "report"
tags: ["landing-page", "cloaking", "tools", "report", "open-source"]
status: archived
created: 2026-03-25
updated: 2026-03-27

archived_reason: "已整合至 04-資源與參考/斗篷系統與流量過濾整合.md"
merged_into: "04-資源與參考/斗篷系統與流量過濾整合.md"
archived_date: "2026-03-28"---

# 推廣頁與安全頁工具報告

本報告全面整理了各大平台（包含 GitHub、開源社區、論壇等）上可用於自動生成推廣頁（Landing Page）、安全頁（Safe Page / White Page）、斗篷系統（Cloaking System）以及網頁克隆的開源工具與方案。所有工具均依據其功能特性進行分類，並詳細列出技術棧與優缺點，以供評估與選擇。

## 推廣頁生成器 (Landing Page Builder / Generator)

這類工具主要用於快速搭建高轉換率的推廣頁，涵蓋了從視覺化拖放編輯器到基於 AI 和現代前端框架的生成工具。對於需要快速上線行銷活動的團隊而言，這些開源方案提供了極大的靈活性與成本優勢。

### GrapesJS

GrapesJS 是一款廣受歡迎的開源 Web 構建框架，專為在內容管理系統（CMS）中無縫整合而設計，讓用戶無需編寫程式碼即可構建 HTML 模板。它提供強大的拖放式介面，支援區塊管理、樣式編輯、圖層管理及代碼即時查看。其優勢在於無依賴、高度可定制且極易整合至現有系統，同時擁有活躍的社群與豐富的外掛生態（如網頁預設、電子報預設、表單等）。然而，對於完全不懂技術的終端用戶，初始的部署與配置仍需要開發者協助。

### VvvebJs

VvvebJs 是一個輕量級的拖放式頁面構建器庫，旨在提供快速的頁面搭建體驗。它提供直觀的視覺化編輯器，內建多種 Bootstrap 5 組件，可用於快速搭建推廣頁與網站。其最大特點是輕量級、無複雜的建置工具依賴且開箱即用，完美支援流行的 Bootstrap 框架。不過，其生態系統與擴展性相較於 GrapesJS 略顯不足。

### Convertfast UI

Convertfast UI 是專為現代前端開發者設計的落地頁生成工具。作為一個受 shadcn-ui 啟發的 CLI 工具，它提供大量預先建置的程式碼區塊，讓開發者能透過命令列快速生成並自定義落地頁。採用最現代化的技術棧（React, TypeScript, Tailwind CSS），生成的代碼乾淨且易於維護。缺點是僅適合具備 React 開發經驗的工程師使用，缺乏視覺化拖放介面。

### aipage.dev

aipage.dev 代表了結合人工智慧技術的現代化落地頁生成方案。這款 AI 驅動的落地頁生成器允許用戶透過輸入簡單的提示詞，由 AI 自動生成結構完整且美觀的推廣頁面。結合 AI 大幅提升了生成速度，非常適合快速驗證商業想法。需要注意的是，使用者必須自行配置 OpenAI API Key，且 AI 生成的結果通常需要人工進行細節微調。

| 工具名稱 | 網址 / GitHub 連結 | 技術棧 | 是否免費/開源 | 核心優勢 |
| :--- | :--- | :--- | :--- | :--- |
| GrapesJS | [GitHub 連結](https://github.com/GrapesJS/grapesjs) | JavaScript, HTML, CSS | 是 (BSD 3-clause) | 擴展性極強，適合整合至自有 CMS |
| VvvebJs | [GitHub 連結](https://github.com/givanz/VvvebJs) | Vanilla JS, Bootstrap 5 | 是 (MIT) | 輕量級，無依賴，開箱即用 |
| Convertfast UI | [GitHub 連結](https://github.com/ObservedObserver/convertfast-ui) | React, Tailwind, shadcn | 是 | 現代化技術棧，代碼乾淨易維護 |
| aipage.dev | [GitHub 連結](https://github.com/zinedkaloc/aipage.dev) | React, OpenAI API | 是 | AI 驅動，極速生成頁面原型 |

## 斗篷系統 (Cloaking System) 與安全頁工具

斗篷系統主要用於廣告投放時的流量過濾，透過識別訪問者身份（如審核爬蟲、競爭對手或真實用戶），展示不同的頁面（白頁/安全頁 vs 黑頁/真實推廣頁）。這在聯盟行銷與跨境電商廣告投放中極為常見。

### YellowCloaker

YellowCloaker 是目前開源界功能最完整、最成熟的聯盟行銷斗篷腳本。它支援根據 IP、作業系統、國家、User Agent、ISP 及 Referer 進行精準的流量過濾。系統可靈活配置多種白頁模式，包含本地文件、重定向、CURL 載入外部內容或返回特定 HTTP 狀態碼，並內建 A/B 測試、Postback 回傳與詳細的流量統計面板。雖然功能極為強大且自帶管理後台，但需要配置 PHP 運行環境，初始設定較為繁瑣，且需定期手動更新 IP 資料庫以維持過濾準確率。

### Cloak-Cloaking

Cloak-Cloaking 是一個適合學習與研究黑白頁分離技術的基礎開源項目。該項目演示了如何透過基礎的 Bot 識別、UA 檢測、IP 控制與地區控制，實現廣告審核訪問（展示白頁）與真實用戶訪問（展示落地頁）的內容分離。其邏輯清晰、代碼簡單易懂，非常適合開發者學習原理與進行二次開發。但若要投入高強度的生產環境，需自行完善龐大的特徵庫與防護邏輯。

### php-cloaker

php-cloaker 是一款專為 WordPress 生態打造的輕量級斗篷腳本。它利用 ipstack API 進行 IP 解析與地理位置過濾，實現伺服器端與客戶端的流量隱藏與重定向。專為 WordPress 優化使得整合相對容易，但其強度依賴外部 API，若 API 達到調用限制或失效，將直接影響過濾功能。

### cloakings 組織系列客戶端

cloakings 組織提供了多個斗篷系統的 PHP 客戶端庫（如 Palladium、CloakIT、Mr.Clo 等），用於向真實用戶和機器人展示不同內容，防止網站被抓取。這些庫支援多種主流商業斗篷服務的對接，代碼標準化。然而，這些庫本質上是 API 客戶端，核心的過濾邏輯與資料庫仍依賴於其對應的付費雲端服務。

| 工具名稱 | 網址 / GitHub 連結 | 技術棧 | 是否免費/開源 | 核心優勢 |
| :--- | :--- | :--- | :--- | :--- |
| YellowCloaker | [GitHub 連結](https://github.com/dvygolov/YellowCloaker) | PHP, HTML, JS | 是 | 功能最完整，內建管理面板與統計 |
| Cloak-Cloaking | [GitHub 連結](https://github.com/opmhoubue-eng/Cloak-Cloaking) | PHP, HTML | 是 | 邏輯清晰，適合學習黑白頁分離原理 |
| php-cloaker | [GitHub 連結](https://github.com/prescience-data/php-cloaker) | PHP, WordPress | 是 | 專為 WordPress 優化，輕量級 |
| cloakings 客戶端 | [GitHub 連結](https://github.com/cloakings) | PHP | 是 (MIT) | 標準化代碼，支援對接多種商業服務 |

## 網頁克隆工具 (Website Cloners)

網頁克隆工具常用於抓取競爭對手的優秀落地頁，或將動態網站靜態化以作為自己的推廣頁基礎。這些工具能大幅縮短頁面製作的時間。

### HTTrack Website Copier

HTTrack 是歷史最悠久且最著名的離線瀏覽器與網站複製工具。它能夠遞歸下載整個網站，包含 HTML、圖片、樣式表及其他文件，並完美重建本地目錄結構，實現離線瀏覽。其極度穩定、支援斷點續傳，並具備複雜的過濾規則與深度控制。缺點是介面較為老舊，對於現代重度依賴 JavaScript 動態渲染的單頁應用（SPA）抓取效果有限。

### SingleFile

SingleFile 提供了現代化的單頁完美保存方案。它包含瀏覽器擴充功能與 CLI 工具，能將完整的網頁（包含 CSS、圖片、字體、甚至 Canvas 內容）內聯保存為單一的 HTML 文件。這能完美保存網頁當前渲染狀態，極好地支援動態頁面，單一文件也非常便於分享、修改與部署。不過，它僅針對單一頁面操作，無法像 HTTrack 那樣自動遞歸抓取整個網站的層級結構。

### goclone

goclone 是一款追求極致速度的現代化克隆工具。利用 Go 語言的 goroutines 併發特性開發，它能在數秒內將目標網站完整克隆至本地。執行速度極快，跨平台支援良好，無繁瑣依賴。但作為純命令行操作工具，對於複雜動態內容的處理能力不如基於無頭瀏覽器（Headless Browser）的工具。

| 工具名稱 | 網址 / GitHub 連結 | 技術棧 | 是否免費/開源 | 核心優勢 |
| :--- | :--- | :--- | :--- | :--- |
| HTTrack | [官方網站](https://www.httrack.com/) | C | 是 (GNU GPL) | 穩定可靠，支援遞歸下載整個網站 |
| SingleFile | [GitHub 連結](https://github.com/gildas-lormeau/singlefile) | JavaScript | 是 | 完美保存動態渲染頁面為單一文件 |
| goclone | [GitHub 連結](https://github.com/goclone-dev/goclone) | Go | 是 | 執行速度極快，跨平台支援良好 |

## 模板系統與批量生成工具

除了上述工具，還有許多基於模板系統的批量生成方案，適合需要大量產出相似頁面的場景。

### WordPress 批量頁面生成器

WordPress 批量頁面生成器（如 LPagery）允許用戶透過上傳 CSV 或 Excel 數據表，結合預設模板，一鍵批量生成大量針對不同地區或長尾關鍵字的 SEO 落地頁。這極大提升了本地 SEO 頁面與長尾關鍵字頁面的生成效率，並無縫整合 WordPress 生態。缺點是高度依賴 WordPress，大量生成頁面可能會導致資料庫臃腫並影響網站效能。

### Shadcn Landing Page Templates

Shadcn Landing Page Templates 提供了基於現代前端技術棧的免費落地頁模板。這些模板包含多種精美、響應式的區塊設計（如 Hero 區塊、定價表、功能介紹等）。設計極具現代感、效能優異，且組件高度解耦，具備極強的擴展性。使用者需要具備現代前端（React/Tailwind）開發知識才能進行深度的修改與部署。

| 工具名稱 | 網址 / GitHub 連結 | 技術棧 | 是否免費/開源 | 核心優勢 |
| :--- | :--- | :--- | :--- | :--- |
| LPagery | [WordPress 外掛](https://wordpress.org/plugins/lpagery/) | PHP, WordPress | 基礎版免費 | 結合數據表批量生成 SEO 落地頁 |
| Shadcn Templates | [GitHub 連結](https://github.com/leoMirandaa/shadcn-landing-page) | React, Tailwind | 是 | 現代化設計，組件解耦，擴展性強 |

## 結論與選型建議

在選擇合適的工具時，應根據團隊的技術背景與具體需求進行評估。

> 若需要視覺化拖放建站，強烈推薦使用 **GrapesJS**，它提供了強大的開源底層，非常適合二次開發或整合進自有的後台系統中。
> 若需要應對廣告審核與流量過濾（Cloaking），**YellowCloaker** 是目前開源界功能最完整、可直接部署使用的選擇；若想自行研究黑白頁分離原理，可參考 **Cloak-Cloaking** 示例代碼。

對於需要快速複製競爭對手頁面的場景，傳統靜態多頁面網站推薦使用 **HTTrack**；而對於現代動態渲染的單頁落地頁，推薦使用 **SingleFile** 保存後再進行源碼修改。最後，若團隊為前端開發者且追求現代化技術棧，推薦使用 **Convertfast UI** 或 **Shadcn Landing Page Templates**，能以最高效的方式產出高質感、高轉換率的推廣頁。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `[待補充]` | `[待補充]` |
