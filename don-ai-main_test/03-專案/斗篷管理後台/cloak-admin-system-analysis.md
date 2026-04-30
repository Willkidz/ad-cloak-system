---
title: "斗篷系統功能分析 v2"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "對市面上七個主流開源斗篷（Cloaking）專案（YellowCloaker, FlareTunnel, MasqrProject 等）的 101 項功能進行全面拆解與對比，識別出 85 項功能缺口，為自研系統提供 A/B 測試、頁面增強及安全驗證的功能選型參考。"
version: "v1.0"
id: "20260325-cloak-system-analysis"
type: analysis
tags: [cloak-admin, competitor-analysis, reference, security, testing]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告對 7 個主流開源斗篷專案（YellowCloaker, FlareTunnel, MasqrProject, KMG 等）進行了深度功能拆解。在總計 101 項功能中，本系統目前具備 16 項（主要集中在基礎後台管理），尚有 85 項功能缺口。核心建議：(1) 優先補齊 YellowCloaker 的頁面增強功能（如離開意圖彈窗、禁用右鍵、多語言 Thank You 頁）；(2) 引入 MasqrProject 的 Cookie 授權許可證機制與 KMG 的動態加密 Token 握手以提升安全性；(3) 開發 A/B 測試流量分配與多維度 SubID 報表以優化投放效益。

# 斗篷系統功能分析 v2

本文件旨在深入分析市面上主流的開源斗篷（Cloaking）專案，拆解其核心功能，並與我們現有的系統進行對比。透過此分析，我們可以識別出功能的缺口，為未來產品的迭代和開發方向提供明確的數據支持與參考。

---

## 一、功能比較分析

以下是從七個開源專案中拆解出的功能列表，涵蓋了訪客過濾、內容保護、頁面增強及統計管理等多個維度。

### 1.1 頁面功能增強

| 功能名稱 | 功能描述 | 我們有沒有 | 來源專案 | 源碼網址 |
| :--- | :--- | :--- | :--- | :--- |
| **多語言 Thank You 頁面** | 根據配置或訪客語言，自動載入對應語系的 Thank You 模板 | ❌ | YellowCloaker | [thankyou/thankyou.php](https://github.com/dvygolov/YellowCloaker/blob/master/thankyou/thankyou.php) |
| **Thank You 頁 Upsell 區塊** | 在 Thank You 頁面動態生成加價購 (Upsell) 的商品輪播區塊 | ❌ | YellowCloaker | [thankyou/thankyou.php](https://github.com/dvygolov/YellowCloaker/blob/master/thankyou/thankyou.php) |
| **禁用右鍵與文字複製** | 注入 JS 腳本禁用網頁的右鍵選單與文字選取複製功能 | ❌ | YellowCloaker | [htmlprocessing.php#L140-L142](https://github.com/dvygolov/YellowCloaker/blob/master/htmlprocessing.php) |
| **攔截/替換瀏覽器返回鍵** | 攔截瀏覽器的上一頁動作，將其禁用或重定向到指定的廣告連結 | ❌ | YellowCloaker | [htmlprocessing.php#L144-L153](https://github.com/dvygolov/YellowCloaker/blob/master/htmlprocessing.php) |
| **離開意圖彈窗 (Comebacker)** | 當滑鼠移出視窗範圍時，彈出挽留視窗或折扣提示 | ❌ | YellowCloaker | [htmlprocessing.php#L164-L167](https://github.com/dvygolov/YellowCloaker/blob/master/htmlprocessing.php) |
| **回撥彈窗 (Callbacker)** | 在頁面上顯示「回撥電話」的浮動彈窗，引導訪客留下電話 | ❌ | YellowCloaker | [htmlprocessing.php#L159-L162](https://github.com/dvygolov/YellowCloaker/blob/master/htmlprocessing.php) |
| **加入購物車彈窗** | 顯示「已加入購物車」的浮動通知，營造搶購氛圍 | ❌ | YellowCloaker | [htmlprocessing.php#L169-L172](https://github.com/dvygolov/YellowCloaker/blob/master/htmlprocessing.php) |
| **多語言服務條款頁面** | 提供 17 種語言版本的服務條款靜態頁面 (BA/BG/CZ/EE/EN/GR/HR/HU/IT/LT/LV/MK/PL/RO/RS/SI/SK) | ❌ | YellowCloaker | [tos/index.php](https://github.com/dvygolov/YellowCloaker/blob/master/tos/index.php) |
| **Email 收集** | 在 Thank You 頁面收集訪客 Email 並儲存 | ❌ | YellowCloaker | [thankyou/thankyou.php](https://github.com/dvygolov/YellowCloaker/blob/master/thankyou/thankyou.php) |
| **Prelanding 替換 (JS)** | 當訪客從 Prelanding 跳轉到 Landing 時，用 JS 替換 Prelanding 的 URL 為指定地址 | ❌ | YellowCloaker | [scripts/replaceprelanding.js](https://github.com/dvygolov/YellowCloaker/blob/master/scripts/replaceprelanding.js) |
| **Landing 替換 (JS)** | 當訪客提交表單後，用 JS 替換 Landing 的 URL 為指定地址 | ❌ | YellowCloaker | [scripts/replacelanding.js](https://github.com/dvygolov/YellowCloaker/blob/master/scripts/replacelanding.js) |
| **錨點平滑滾動** | 將頁面中的錨點連結替換為平滑滾動效果 | ❌ | YellowCloaker | [scripts/replaceanchorswithsmoothscroll.js](https://github.com/dvygolov/YellowCloaker/blob/master/scripts/replaceanchorswithsmoothscroll.js) |

### 1.2 安全與驗證

| 功能名稱 | 功能描述 | 我們有沒有 | 來源專案 | 源碼網址 |
| :--- | :--- | :--- | :--- | :--- |
| **防重複 Lead** | 提交表單時檢查 SubID + Phone 是否已存在，避免重複記錄 | ❌ | YellowCloaker | [buttonlog.php](https://github.com/dvygolov/YellowCloaker/blob/master/buttonlog.php) |
| **Cookie 授權許可證機制** | 透過授權伺服器發放帶有時效的 Cookie，無 Cookie 者只能看到假站，防止連結洩漏 | ❌ | MasqrProject | [MasqrBackend/index.js#L51-L104](https://github.com/titaniumnetwork-dev/MasqrProject/blob/master/MasqrBackend/index.js) |
| **動態加密 Token 握手** | 前端載入時獲取 XOR+Base64 加密的短時效 Token，提交資料時需帶上此 Token 驗證 | ❌ | KMG | [index.php#L6-L18](https://github.com/KMG-Official/free-cloak-system-client/blob/main/index.php) |
| **遠端 API 決策分流** | 將訪客特徵加密打包送至遠端 API，由遠端決定回傳 SHOW(真實內容)/REDIRECT/ERROR | ❌ | KMG | [index.php#L19-L46](https://github.com/KMG-Official/free-cloak-system-client/blob/main/index.php) |
| **XOR + Base64url 加解密** | 使用 XOR 加密搭配 Base64url 編碼，對前後端傳輸的資料進行加解密 | ❌ | KMG | [index.php#L67-L92](https://github.com/KMG-Official/free-cloak-system-client/blob/main/index.php) |

### 1.3 統計與管理

| 功能名稱 | 功能描述 | 我們有沒有 | 來源專案 | 源碼網址 |
| :--- | :--- | :--- | :--- | :--- |
| **AB 測試流量分配** | 支援 Epsilon-Greedy 等策略，將流量分配到不同的 Landing Page 版本 | ❌ | YellowCloaker | [abtest.php](https://github.com/dvygolov/YellowCloaker/blob/master/abtest.php) |
| **AB 測試成效計算** | 根據各版本的點擊與轉化數據，計算 `Is Best%` (勝出機率) | ❌ | YellowCloaker | [admin/statistics.php](https://github.com/dvygolov/YellowCloaker/blob/master/admin/statistics.php) |
| **多維度 SubID 報表** | 根據自訂的 Sub 參數 (如 ad_id, placement) 進行分組統計與轉化率計算 | ❌ | YellowCloaker | [admin/statistics.php](https://github.com/dvygolov/YellowCloaker/blob/master/admin/statistics.php) |
| **CLI 部署與管理工具** | 提供命令列工具進行 Worker 的建立、測試、匯出配置與清理 | ❌ | flareprox | [flareprox.py#L323-L536](https://github.com/MrTurvey/flareprox/blob/main/flareprox.py) |
| **後台統計面板** | 提供 Web 後台查看每日點擊、轉化、CR、EPC、Revenue 等指標 | ✅ | YellowCloaker | [admin/statistics.php](https://github.com/dvygolov/YellowCloaker/blob/master/admin/statistics.php) |
| **後台密碼保護** | 管理後台需要輸入密碼才能訪問 | ✅ | YellowCloaker | [admin/password.php](https://github.com/dvygolov/YellowCloaker/blob/master/admin/password.php) |
| **後台設定編輯** | 在 Web 後台直接編輯所有斗篷配置 (過濾規則、像素、白頁等) | ✅ | YellowCloaker | [admin/editsettings.php](https://github.com/dvygolov/YellowCloaker/blob/master/admin/editsettings.php) |
| **SleekDB 輕量資料庫** | 使用基於 JSON 檔案的輕量資料庫 SleekDB 儲存點擊和轉化數據 | ❌ | YellowCloaker | [db/SleekDB.php](https://github.com/dvygolov/YellowCloaker/blob/master/db/SleekDB.php) |
| **Cookie 保持使用者流程** | 用 Cookie 記住訪客被分配到的 Landing/Prelanding，確保回訪時看到同一版本 | ❌ | YellowCloaker | [cookies.php](https://github.com/dvygolov/YellowCloaker/blob/master/cookies.php) |
| **LP CTR 記錄** | 記錄從 Prelanding 點擊到 Landing 的 CTR (Click-Through Rate) | ❌ | YellowCloaker | [landing.php](https://github.com/dvygolov/YellowCloaker/blob/master/landing.php) |
| **巨集變數替換** | 在重定向 URL 中替換 `{subid}`, `{country}`, `{city}` 等巨集變數 | ❌ | YellowCloaker | [url.php](https://github.com/dvygolov/YellowCloaker/blob/master/url.php) |
| **配置匯出/匯入** | 支援將 Worker 配置和端點資訊匯出為 JSON 檔案，並可匯入還原 | ❌ | FlareTunnel | [FlareTunnel.go#L1088-L1216](https://github.com/MorDavid/FlareTunnel/blob/main/FlareTunnel.go) |
| **Worker 批量清理** | 一鍵刪除所有帳號下的 FlareTunnel Worker | ❌ | FlareTunnel | [FlareTunnel.go#L979-L1016](https://github.com/MorDavid/FlareTunnel/blob/main/FlareTunnel.go) |
| **授權伺服器 (License Server)** | 獨立的授權伺服器，負責生成/驗證/過期帶時效的存取許可證 | ❌ | MasqrProject | [LicensingServer/index.js](https://github.com/titaniumnetwork-dev/MasqrProject/blob/master/LicensingServer/index.js) |
| **前端授權驗證 (Client-side)** | 前端 JS 直接呼叫授權伺服器 API 驗證 License，通過後存入 localStorage | ❌ | MasqrProject | [MasqrFront/masqr.js](https://github.com/titaniumnetwork-dev/MasqrProject/blob/master/MasqrFront/masqr.js) |
| **HTTP Basic Auth 觸發** | 利用 HTTP 401 + WWW-Authenticate 觸發瀏覽器的帳密輸入框，將密碼欄作為 License Key 輸入 | ❌ | MasqrProject | [MasqrBackend/index.js#L82-L86](https://github.com/titaniumnetwork-dev/MasqrProject/blob/master/MasqrBackend/index.js) |
| **HTTP 錯誤頁面模板** | 內建 400/401/403/404/405/500/502/503 等 HTTP 錯誤頁面模板 | ✅ | KMG | [index.php#L53-L66](https://github.com/KMG-Official/free-cloak-system-client/blob/main/index.php) |
| **Referer 透過 Cookie 保持** | 首次訪問時將 Referer 存入 Cookie，後續請求可從 Cookie 中讀取 Referer | ❌ | YellowCloaker | [core.php#L49-L58](https://github.com/dvygolov/YellowCloaker/blob/master/core.php) |

---

## 二、統計摘要

<data_point id="feature-stats">

| 指標 | 數值 |
| :--- | :--- |
| 分析專案數 | 7 |
| 功能總數 | 101 |
| 我們已有 ✅ | 16 |
| 我們沒有 ❌ | 85 |

</data_point>

### 各專案貢獻功能數

| 來源專案 | 功能數 |
| :--- | :--- |
| YellowCloaker | 64 |
| FlareTunnel | 14 |
| cf-revpxy | 6 |
| php-cloaker | 5 |
| KMG (看門狗) | 5 |
| MasqrProject | 4 |
| flareprox | 3 |

---

## 三、結論

綜合分析，**YellowCloaker** 是目前功能最全面的開源專案，貢獻了超過 60% 的功能點，特別是在「頁面功能增強」和「統計與管理」方面表現突出。然而，我們系統在核心的後台管理、密碼保護等方面已有基礎。下一步的開發重點，可以參考 YellowCloaker 的實現，優先補齊高價值的缺失功能，例如 A/B 測試、多維度報表以及多樣化的頁面交互功能（如離開意圖彈窗、Upsell 區塊等），以快速提升產品的市場競爭力。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽（含研究文檔索引） |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構模式 |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
