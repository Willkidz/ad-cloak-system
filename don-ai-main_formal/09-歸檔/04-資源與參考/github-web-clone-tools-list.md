---
title: "GitHub 網頁克隆與網站複製開源工具總覽"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）GitHub 網頁克隆與網站複製開源工具總覽"
type: "list"
tags: [changelog, github]
status: "archived"
---
---
title: "GitHub 網頁克隆與網站複製開源工具總覽"
category: "reference"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "本文檔全面整理並分類了 GitHub 上與網頁克隆、網站複製及落地頁拷貝相關的開源工具，提供不同應用場景下的技術選型參考。"
id: "20260325-024356"
type: "reference"
tags: ["reference", "research"]
status: archived
created: 2026-03-25
updated: "2026-03-27"

archived_reason: "已整合至 04-資源與參考/GitHub開源工具與行銷自動化整合.md"
merged_into: "04-資源與參考/GitHub開源工具與行銷自動化整合.md"
archived_date: "2026-03-28"---

# GitHub 網頁克隆與網站複製開源工具總覽

本文檔全面整理並分類了 GitHub 上與網頁克隆、網站複製及落地頁拷貝相關的開源工具。根據功能複雜度與應用場景，這些工具被系統性地分類為基礎版、進階版、升級版、API 版、特殊功能版，以及整合了抓取、預覽與編輯的「一體化工具」，旨在為開發者提供不同需求下的技術選型參考。

## 工具分類與總覽

### 1. 基礎版：簡單的 HTML 下載器

這類工具主要用於將網站的靜態資源（HTML、CSS、JS、圖片）下載到本地，並保持相對連結結構，適合簡單的靜態頁面備份與離線瀏覽。

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **httrack** | [xroche/httrack](https://github.com/xroche/httrack) | 4.4k | C | 經典的離線瀏覽器工具，能將網站遞迴下載到本地目錄，並保持原始網站的相對連結結構。支援更新已鏡像的網站和恢復中斷的下載。 | 否 | 否 | 1 year ago |
| **goclone** | [goclone-dev/goclone](https://github.com/goclone-dev/goclone) | 2k | Go | 利用 Go routine 快速克隆網站到本地，獲取 HTML、CSS、JS、圖片等文件。保留原始網站的相對連結結構。 | [待確認] | 否 | 2 months ago |
| **Website-Cloner** | [X-SLAYER/Website-Cloner](https://github.com/X-SLAYER/Website-Cloner) | 334 | VB.NET | 桌面應用程式，允許使用者將網站檔案下載到電腦，協助下載完整的 HTML、CSS、JS、圖片等前端原始碼。 | [待確認] | 否 | Jun 2023 |
| **web-cloner** | [CripterHack/web-cloner](https://github.com/CripterHack/web-cloner) | 13 | Python | 簡單的網站克隆工具，具有圖形介面，允許用戶克隆網站並修改其基本 URL，將所有資源保存在本地。 | [待確認] | 否 | Mar 2025 |

### 2. 進階版：支援動態渲染與 SPA

這類工具能夠處理現代前端框架（如 React、Vue）構建的單頁應用程式（SPA），通常內建無頭瀏覽器（如 Puppeteer）來等待 JavaScript 執行完畢後再抓取最終渲染的 DOM。

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SingleFile** | [gildas-lormeau/SingleFile](https://github.com/gildas-lormeau/SingleFile) | 20.7k | JavaScript | 作為瀏覽器擴充功能和 CLI 工具，能將完整的網頁（包含 CSS、圖片等）嵌入並儲存為單一 HTML 檔案。 | 是 | 是 (CLI) | last month |
| **node-website-scraper** | [website-scraper/node-website-scraper](https://github.com/website-scraper/node-website-scraper) | 1.7k | JavaScript | 下載整個網站到本地目錄。支援自訂下載資源篩選、遞迴深度控制。搭配 `website-scraper-puppeteer` 插件可支援 SPA。 | 是 (需插件) | 是 | last week |
| **Website-Cloner** | [NeaByteLab/Website-Cloner](https://github.com/NeaByteLab/Website-Cloner) | 4 | JavaScript | 使用 Node.js、Puppeteer 構建。抓取網站並下載所有資源到本地。支援使用 Puppeteer 進行可靠的頁面渲染。 | 是 | 否 | 8 months ago |

### 3. 升級版：具備進階處理與歸檔能力

這類工具不僅僅是下載，還提供了更複雜的連結重寫、資源過濾、長期歸檔格式支援，或是具備更強大的並發下載能力。

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ArchiveBox** | [ArchiveBox/ArchiveBox](https://github.com/ArchiveBox/ArchiveBox) | 27.1k | Python | 開源自託管網路歸檔工具。可從網址、書籤等來源，保存 HTML、JS、PDF、媒體、WARC 等多種格式。 | 是 | 是 | 2 hours ago |
| **monolith** | [y2z/monolith](https://github.com/y2z/monolith) | 14.9k | Rust | CLI 工具，將 CSS、圖片和 JS 資產全部嵌入到單一 HTML5 文件中，生成一個可獨立運行的頁面。 | 否 | 否 | 9 months ago |
| **website-downloader** | [PKHarsimran/website-downloader](https://github.com/PKHarsimran/website-downloader) | 110 | Python | 功能強大的 Python 腳本，遞迴爬取同源頁面，重寫離線引用，支援域名白名單，移除有問題的跨域屬性，並發下載。 | 部分 | 否 | 3 days ago |
| **Crystal-Web-Archiver** | [davidfstr/Crystal-Web-Archiver](https://github.com/davidfstr/Crystal-Web-Archiver) | 89 | Python | 用於長期歸檔高保真網站副本的工具。下載的頁面以其原始形式儲存，包括所有 HTTP 標頭，元數據儲存在 SQLite 中。 | 否 | 否 | 2 days ago |

### 4. API 版：提供程式化呼叫接口

這類工具設計為函式庫或服務，提供 API 供其他系統或腳本整合呼叫。

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **webcloner-js** | [maornissan/webcloner-js](https://github.com/maornissan/webcloner-js) | 12 | TypeScript | 強大且隱蔽的網站複製工具，支援代理認證、智慧型 URL 重寫。提供 Programmatic Usage 供 Node.js 呼叫。 | 部分 | 是 | Nov 2025 |
| **Website-downloader** | [AhmadIbrahiim/Website-downloader](https://github.com/AhmadIbrahiim/Website-downloader) | 2.1k | HTML/JS | 使用 Node.js 下載任何網站的完整原始碼。封裝了 wget 的進階參數，可作為模組引入。 | 否 | 是 | 4 months ago |

### 5. 特殊功能：繞過反爬蟲與防護

這類工具專門解決現代網站常見的防護機制，如 Cloudflare 的五秒盾或 CAPTCHA。

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **cloudscraper** | [VeNoMouS/cloudscraper](https://github.com/VeNoMouS/cloudscraper) | 6.3k | Python | 專門用於繞過 Cloudflare 反機器人頁面（IUAM）的 Python 模組。支援 Cloudflare v2 挑戰、代理輪換和隱身模式。 | 是 | 是 | 9 months ago |

### 6. 整合版：抓取、預覽與編輯（一體化工具）

在開源社群中，**完全整合「任意網址抓取 + 部署預覽 + 所見即所得線上編輯」三合一的完美工具非常罕見**。大多數工具要麼專注於抓取歸檔（如 ArchiveBox），要麼專注於視覺化建構（如 Webstudio）。以下列出部分具備相關潛力的專案：

| 專案名稱 | GitHub URL | 星數 | 語言 | 功能特色與整合程度 | 支援 SPA | 有 API | 最後更新 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **archiveweb.page** | [webrecorder/archiveweb.page](https://github.com/webrecorder/archiveweb.page) | 1.4k | JavaScript | **抓取+預覽**：作為擴充功能互動式地歸檔網頁，並可直接在瀏覽器中重播歸檔的網頁。缺少直接修改 DOM 的線上編輯器。 | 是 | [待確認] | 3 months ago |
| **VvvebJs** | [givanz/VvvebJs](https://github.com/givanz/VvvebJs) | 8.4k | JavaScript | **編輯+預覽**：強大的拖放式網頁建構器，提供即時程式碼編輯與預覽。但它主要用於從頭建構或匯入本地模板，不具備直接輸入 URL 抓取外部網站的功能。 | 部分 | 否 | Mar 2026 |
| **webstudio** | [webstudio-is/webstudio](https://github.com/webstudio-is/webstudio) | 8.4k | TypeScript | **編輯+部署**：開源的 Webflow 替代方案，提供先進的可視化建構器與部署能力。同樣缺少直接抓取外部網站為起點的功能。 | 是 | [待確認] | 1 day ago |
| **scrapecraft** | [ScrapeGraphAI/scrapecraft](https://github.com/ScrapeGraphAI/scrapecraft) | 611 | Python | **抓取+編輯(邏輯)**：AI 驅動的網路爬蟲編輯器。它的「編輯」是指編輯抓取邏輯與工作流程，而非編輯抓取下來的網頁視覺內容。 | 是 | 是 | 3 months ago |

## 最佳實踐與建議

<rule id="best-practice-workflow">
**組合使用工作流**：若需要完整的「抓取 + 編輯 + 部署」工作流，目前最可行的開源方案是**組合使用**。

<step>1. **抓取**：先使用 `SingleFile` 或 `node-website-scraper` 將目標網頁完整抓取到本地。</step>
<step>2. **編輯**：將產生的 HTML/CSS 匯入到 `VvvebJs` 或本地的 VS Code（搭配 Live Preview）進行編輯。</step>
<step>3. **部署**：最後再推送到 Vercel 或 GitHub Pages 進行部署。</step>
</rule>

## 結論

> **總結來說，針對不同的網頁克隆需求，開發者應選擇最適合的工具。對於簡單的靜態頁面，基礎版工具已足夠；若涉及現代 SPA 框架，則必須依賴進階版工具；而面對複雜的反爬蟲機制，則需結合特殊功能工具。目前尚無完美的「一體化」開源解決方案，採用組合工作流是達成複雜需求的最佳途徑。**

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `00-系統索引/common-cmd.md` | 參考系統通用規範 |
