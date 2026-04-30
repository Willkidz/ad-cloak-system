---
title: "邊緣流量分類與動態頁面切換開源方案研究報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-09"
summary: "基於 GitHub 開源項目研究，整理與流量分流、機器人識別、動態頁面切換、分層日誌記錄、素材管理與模板系統相關的技術方案。"
version: "v1.0"
id: "20260409-github-research"
type: analysis
tags: [cloak-admin, research, open-source, architecture]
status: active
created: "2026-04-09"
updated: "2026-04-09"
---
# 邊緣流量分類、動態頁面切換與內容管理開源方案研究報告

**作者：Manus AI**  
**日期：2026-04-09**

## 摘要

本報告基於已完成的 GitHub 與公開資料研究，整理與「流量分流、機器人識別、動態頁面切換、分層日誌記錄、素材管理與模板系統」相關的**合規**開源技術方案。需要先說明的是，原始關鍵詞中部分詞彙常被用於描述**規避廣告審核、對不同訪客呈現不同真實意圖內容**的做法；這類用途具有明顯的欺騙與規避審核風險，因此本報告不提供此類方案的落地實現、繞過邏輯或“最優 cloaking”建議。相對地，本文將這些需求拆解為可合法使用的相鄰技術能力，包括 **邊緣流量分類、風險分級、功能旗標驅動的動態切換、分層事件日誌，以及基於內容模型的模板與素材管理**。[1] [2] [3] [4] [5]

在已收集的來源中，最值得重點參考的不是單一「全能項目」，而是一組可以互補的模組化能力。就入口層流量識別而言，Cloudflare 官方的 **Heuristics、JavaScript Detections、Machine Learning、Anomaly Detection** 四層檢測思路，提供了最清晰的邊緣判斷框架。[1] 就 verified bot 識別而言，`microlinkhq/cloudflare-bot-directory` 是可直接用於 allowlist 與分析排除的資料集型項目。[2] 就動態頁面切換與規則控制而言，`pmbanugo/flargd` 提供了基於 Cloudflare Workers 的 feature flag 設計樣板。[3] 就頁面層與操作層自動化識別而言，`fingerprintjs/BotD` 是成熟且低整合成本的瀏覽器側信號採集工具。[4] 就素材、模板與後台管理而言，`SonicJs-Org/sonicjs` 則是目前與 **Cloudflare Workers + D1 + R2** 最契合的 headless CMS 參考底座。[5]

綜合評估後，本報告的核心結論是：**最適合 Cloudflare Workers + D1 + React 前端架構的最優方案，並非複製任何單一開源項目，而是採用「Cloudflare 風險判斷框架 + verified bot 目錄 + feature flag 路由 + 瀏覽器側 bot 信號 + edge-native CMS」的組合式架構**。其中，Workers 負責入口判斷與路由決策，D1 負責規則、事件、審計與模板元資料，R2 負責素材，React 負責管理後台與可配置頁面組件層。這樣的方案在性能、治理性、審計能力與可維護性方面都明顯優於把所有邏輯硬編碼在單一腳本或單語言後端中的做法。[1] [3] [5]

## 研究範圍與評估方法

本次報告只基於已完成收集的公開材料，不再新增搜索結果。評估重點集中於五個維度。第一，是否支持**入口層流量分類**，也就是在請求進站時即根據請求特徵進行快速判斷。第二，是否具備**頁面層或操作層信號**，例如瀏覽器端自動化檢測與按鈕事件分流能力。第三，是否支持**動態頁面切換與規則治理**，亦即可以透過配置而非改碼調整不同行為。第四，是否具備**日誌與審計延展性**，包括請求、攔截、互動、轉換等分層記錄能力。第五，是否適合落在 **Cloudflare Workers + D1 + React** 的目標架構上。[1] [3] [4] [5]

為避免將開源項目的原始定位過度延伸，本文在分析每個候選項目時，會同時說明它能解決的問題與不能解決的問題。例如，verified bot 目錄只能識別已知合法爬蟲，不等於完整的人機判斷；瀏覽器端 bot 檢測能提供有價值信號，但不能單獨作為最終決策依據；feature flag 系統擅長配置化路由，但不等於安全引擎。這種能力邊界的區分，正是設計穩定架構的前提。[2] [3] [4]

## Cloudflare 官方方法論：最可靠的總體設計基線

Cloudflare 官方文檔沒有提供一個可直接複製的開源「完整系統」，但它給出了最值得採納的總體判斷模型。文檔將 bot 檢測分為 **Heuristics**、**JavaScript Detections**、**Machine Learning** 與 **Anomaly Detection** 幾層。其中，Heuristics 面向所有請求，適合在入口層做快速阻斷與初篩；JavaScript Detections 用於頁面側檢測 headless 與惡意指紋；Machine Learning 生成 Bot Score，用於更穩定的人機區分；Anomaly Detection 則基於站點正常流量基線來識別離群請求。[1]

> “The Heuristics engine processes all requests. Cloudflare conducts a number of heuristic checks to identify automated traffic, and requests are matched against a growing database of malicious fingerprints.” — Cloudflare Docs, *Bot detection engines* [1]

> “The JavaScript Detections (JSD) engine identifies headless browsers and other malicious fingerprints.” — Cloudflare Docs, *Bot detection engines* [1]

這套方法論對本研究的最大價值，在於它天然對應了多層過濾機制。入口層可基於 IP、ASN、Geo、UA、已知 verified bots、速率限制、來源路徑等做快速分類；頁面層再引入瀏覽器信號、JS challenge 與自動化檢測；操作層則在按鈕點擊、表單提交、跳轉等敏感動作前，再做一次細粒度決策。換言之，真正穩定的方案不是在單一位置做一次判斷，而是把**請求前、頁面渲染時、用戶交互時**三個時間點的信號串成連續決策鏈。[1] [4]

下表總結了這套方法論如何映射到實際架構設計。

| 層級 | 主要目標 | 典型信號 | 建議落點 | 備註 |
| --- | --- | --- | --- | --- |
| 入口層 | 快速分類與初步攔截 | IP、ASN、Geo、UA、verified bot、速率、路徑 | Cloudflare Worker | 追求低延遲與高吞吐 |
| 頁面層 | 收集瀏覽器真實性與自動化信號 | headless 檢測、JS 執行結果、前端指紋特徵 | 前端 SDK + Worker API | 應視為補充信號 |
| 操作層 | 保護跳轉、提交、點擊等敏感動作 | 事件上下文、前端檢測結果、會話風險分數 | Worker action endpoint | 最適合做細粒度控制 |
| 決策層 | 生成統一風險結論 | 多源信號聚合、規則匹配、歷史事件 | Worker + D1 | 應支持審計與回溯 |
| 觀測層 | 支持調優、稽核與誤判分析 | 請求日誌、攔截日誌、點擊日誌、模板版本 | D1 + Analytics | 必須保留關聯 ID |

## 項目一：microlinkhq/cloudflare-bot-directory

項目地址：<https://github.com/microlinkhq/cloudflare-bot-directory>

這個項目的定位非常明確。它不是完整的判斷引擎，而是將 Cloudflare Radar verified bots 整理為可消費的 JSON 資料集，讓開發者能夠在服務端或邊緣程式中快速識別合法爬蟲與監控機器人。[2] README 中明確寫到它包含 **500+ verified bots**，並列出 `slug`、`name`、`kind`、`operator`、`category`、`userAgentPatterns`、`userAgents` 等欄位，可直接被引用於 user agent 匹配、分析過濾與 allowlist 判斷。[2]

其代碼結構顯示它屬於典型的「資料集 + 腳本 + 測試」項目。GitHub 頁面中可見 `src/`、`scripts/`、`test/`、`README.md`、`package.json` 等目錄與文件，這代表它更適合作為一個**入口層基礎模組**，而不是應用級系統。[2] 在 Cloudflare Workers 架構中，最合理的用法是在請求剛進站時先判定是否為已知 verified bot。如果是，可直接走搜尋引擎友好或監控放行策略；如果不是，才進入後續更昂貴的風險判斷流程。

它最大的優勢是簡潔、準確、易整合，而且能有效避免把合法搜尋爬蟲誤判為惡意流量。然而，它的侷限也非常明顯：它只能識別**已知且被驗證的 bot**，對偽裝 UA、代理流量、headless 自動化、行為異常等問題幾乎無能為力。因此，這個項目最適合擔任**allowlist 與基礎分類器**，絕不應被誤用為完整的人機分流方案。[2]

| 維度 | 分析 |
| --- | --- |
| 項目名稱 | `microlinkhq/cloudflare-bot-directory` |
| GitHub | <https://github.com/microlinkhq/cloudflare-bot-directory> |
| 技術棧 | JavaScript / JSON dataset |
| 核心功能 | 提供 verified bots 目錄與 UA 匹配資料 |
| 核心架構 | 資料集、更新腳本、測試；無完整服務端判斷引擎 |
| 過濾邏輯 | 以 bot 名稱、分類、UA pattern 為主，屬於 allowlist 型判斷 |
| 關鍵文件/結構 | `src/`、`scripts/`、`test/`、`README.md`、`package.json` |
| 優點 | 輕量、易整合、適合入口層快速放行 verified bots |
| 缺點 | 只能識別已知 verified bots，無法完成風險判斷 |
| 推薦定位 | 入口層 verified bot allowlist 子模組 |

## 項目二：pmbanugo/flargd

項目地址：<https://github.com/pmbanugo/flargd>

`flargd` 是本次研究中最接近「動態切換核心」的項目，但其本質並不是安全產品，而是**部署在 Cloudflare Workers 上的 feature flag 系統**。[3] README 明確說明它可以 self-host 在 Cloudflare Workers 上，並透過 Admin UI 配置 feature flags、條件與 rollout 比例，然後在 Edge Middleware 或其他 edge/serverless runtime 中根據 flag 結果決定不同頁面或功能路徑。[3]

從項目結構來看，它是一個 monorepo，主要目錄包括 `apps/` 與 `packages/web/`；README 還明確提到 `apps/api/wrangler.toml` 與 `apps/admin-ui/wrangler.toml`，說明其基本部署形態為**API Worker + Admin UI**。[3] 更重要的是，它支持以 `City`、`Country`、`Continent`、`Postal Code`、`Region`、`IP` 等請求屬性作為條件來判斷旗標是否激活。[3] 這一點對於設計合法的**動態頁面切換**非常重要，因為它意味著可以把頁面分流規則從程式碼中抽離到配置層。

如果把使用者提到的「安全頁 / 推廣頁動態切換」轉化為合規語境，最合理的等價能力其實就是 **風險頁 / 正常頁 / 維護頁 / 實驗頁** 的配置化切換。`flargd` 雖然沒有提供完整的風險模型，但它展示了如何把「條件 + 比例 + 目標頁路由」做成一套可運營化的系統。它的缺點在於倉庫已被歸檔，不適合直接作為長期核心依賴；同時它以 KV 為主要存儲，若要承載完整的規則審計、事件關聯與版本管理，D1 顯然更合適。[3]

因此，`flargd` 最值得借鑑的是其**配置化決策思想**：不要把「頁面切換」硬寫成 if/else，而應以規則、條件、百分比、項目隔離與管理 UI 來治理。這恰好能直接映射到 Cloudflare Workers + D1 + React 方案中。[3]

| 維度 | 分析 |
| --- | --- |
| 項目名稱 | `pmbanugo/flargd` |
| GitHub | <https://github.com/pmbanugo/flargd> |
| 技術棧 | Cloudflare Workers、KV、TypeScript/JavaScript、Admin UI |
| 核心功能 | Feature flag、條件判斷、分流、管理 UI |
| 核心架構 | `apps/api` + `apps/admin-ui` + `packages/web` 的 monorepo 結構 |
| 過濾/判斷邏輯 | 按 IP、國家、城市、大洲等條件匹配，再配合 rollout 百分比決策 |
| 關鍵文件/結構 | `apps/`、`packages/web/`、`apps/api/wrangler.toml`、`apps/admin-ui/wrangler.toml` |
| 優點 | 非常適合 Cloudflare 邊緣路由；規則配置化；可支援 A/B 與頁面切換 |
| 缺點 | 已 archived；偏旗標系統，非完整風險引擎；以 KV 為主不利複雜審計 |
| 推薦定位 | 動態頁面切換與規則控制層的設計樣板 |

## 項目三：fingerprintjs/BotD

項目地址：<https://github.com/fingerprintjs/BotD>

`BotD` 是一個成熟的瀏覽器端 bot detection 函式庫，其核心價值在於**補足服務端不可見的前端信號**。[4] README 明確指出，它可以透過 CDN 或 npm 快速整合，並在瀏覽器端呼叫 `detect()` 取得 bot 檢測結果。[4] 從倉庫結構可見，項目包含 `src/`、`docs/`、`tests/`、`playground/` 等目錄，成熟度與可維護性都比較高。[4]

它能識別 headless browsers、Selenium、Playwright、PhantomJS、Nightmare、Electron 等多種常見自動化工具。[4] 這使它非常適合放在**頁面層**與**操作層**。具體來說，頁面在加載後可以立即執行一次 BotD 檢測，將結果連同 session ID、頁面版本、訪問入口等資訊回傳給 Worker；當使用者點擊敏感按鈕、提交表單或發起下一步操作時，再帶著同一個事件上下文觸發服務端風險判斷。如此一來，即可實現「同一個操作介面，在不同風險狀態下執行不同合法行為」的結構化設計。

但 `BotD` 的邊界同樣必須講清楚。官方 README 已明確表示，開源版更適合基礎 bot 檢測，而更高階的識別能力需要其專業版服務端 API。[4] 這意味著若將其作為唯一依據，容易遭遇繞過、誤判或對抗性不足。因此，正確做法不是直接根據 `BotD` 結果做硬封鎖，而是將其視為**一個前端信號特徵**，與入口層特徵、會話歷史與事件日誌一起進入 Workers 端的風險分數模型。

| 維度 | 分析 |
| --- | --- |
| 項目名稱 | `fingerprintjs/BotD` |
| GitHub | <https://github.com/fingerprintjs/BotD> |
| 技術棧 | JavaScript / TypeScript，瀏覽器端 SDK |
| 核心功能 | 檢測 headless 與常見自動化框架 |
| 核心架構 | 前端庫，經由 CDN 或 npm 注入；非服務端系統 |
| 過濾/判斷邏輯 | 依賴瀏覽器側檢測與自動化特徵判斷 |
| 關鍵文件/結構 | `src/`、`docs/`、`tests/`、`playground/`、`README.md` |
| 優點 | 整合成本低；能補足前端可見性；社群成熟 |
| 缺點 | 只能在瀏覽器端工作；易被研究與繞過；不適合作唯一決策來源 |
| 推薦定位 | 頁面層與操作層的前端風險信號模組 |

## 項目四：SonicJs-Org/sonicjs

項目地址：<https://github.com/SonicJs-Org/sonicjs>

在所有候選項目中，`SonicJS` 與目標架構的契合度最高，因為它本身就是**為 Cloudflare Workers 生態打造的 edge-native headless CMS**，並明確使用 **D1、R2、KV、Workers、Hono、TypeScript、Drizzle ORM** 等技術。[5] README 還清楚描述了其 monorepo 結構，包括 `packages/core/src/routes`、`packages/core/src/templates`、`packages/core/src/middleware`、`packages/core/src/db` 等目錄，對內容 API、模板渲染、資料模型、中間件與遷移都有明確分層。[5]

這個項目的重點不在流量判斷，而在於**素材管理與模板系統**。如果要構建一套能支撐多站點、多模板、多語版本、多素材資產與頁面組件管理的後台，`SonicJS` 比單純使用靜態 JSON 或自製資料表更具長期優勢。[5] 它還天然匹配 R2 作為媒體存儲，匹配 D1 作為內容模型與版本索引，並可利用 Cloudflare Images API 做媒體優化。[5]

對本研究而言，`SonicJS` 提供的最大啟示是：模板與素材管理不能只是把 HTML 檔案放到存儲裡，而應具備**內容類型、版本、工作流程、媒體關聯、路由映射與後台治理**。如果將其簡化後套入本報告的推薦架構，便可形成一個輕量但清晰的 CMS 子系統：模板存 D1 結構、靜態資產存 R2、渲染元資料與頁面規則由 Worker 決策使用。[5]

| 維度 | 分析 |
| --- | --- |
| 項目名稱 | `SonicJs-Org/sonicjs` |
| GitHub | <https://github.com/SonicJs-Org/sonicjs> |
| 技術棧 | Cloudflare Workers、D1、R2、KV、Hono、TypeScript、Drizzle |
| 核心功能 | Edge-native headless CMS、模板、內容管理、媒體管理 |
| 核心架構 | monorepo；`routes`、`templates`、`middleware`、`db` 分層清晰 |
| 過濾/判斷邏輯 | 非主要目標，不提供完整流量風險判斷 |
| 關鍵文件/結構 | `packages/core/src/routes`、`packages/core/src/templates`、`packages/core/src/middleware`、`packages/core/src/db` |
| 優點 | 與 Workers + D1 + R2 架構高度契合；CMS 能力完整；擴展性高 |
| 缺點 | 偏重 CMS，本身不是風險引擎；若只做輕量模板可能偏重 |
| 推薦定位 | 素材管理與模板系統的首要參考底座 |

## 項目對比與技術結論

綜合上述四個方向可以看出，這些項目各自解決的是不同層次的問題。`cloudflare-bot-directory` 解決入口層 verified bot allowlist；`flargd` 解決配置化路由與頁面切換；`BotD` 解決前端可見的自動化信號；`SonicJS` 解決模板、內容與素材治理。真正穩定的系統必須把它們拼裝成一條連續的能力鏈，而不是寄望於任何單一項目同時完成所有事情。[2] [3] [4] [5]

下表概括了它們在本次研究中的相對位置。

| 能力域 | 最佳參考項目 | 原因 |
| --- | --- | --- |
| verified bot 識別 | `cloudflare-bot-directory` | 官方 Radar 資料來源導向，適合 allowlist |
| 動態頁面切換 | `flargd` | 條件化 feature flag 與 edge routing 思路清晰 |
| 前端自動化檢測 | `BotD` | 頁面層信號成熟、整合成本低 |
| 素材與模板管理 | `SonicJS` | 與 Workers + D1 + R2 高度匹配 |
| 總體判斷方法論 | Cloudflare Bot Detection Docs | 多層引擎架構最完整且最可靠 |

從工程視角看，最優實現方案應遵循三個原則。第一，**信號必須分層採集**，不能把所有判斷集中在單次請求。第二，**決策必須配置化與可審計**，不能把規則寫死在程式碼中。第三，**內容系統與風險系統必須解耦**，也就是模板、素材、路由、風險規則、事件日誌應各有獨立資料模型與權責邊界。這也是本報告最終推薦架構的理論基礎。[1] [3] [5]

## 面向 Cloudflare Workers + D1 + React 的推薦最優方案

### 一、總體架構

最適合的方案不是複製某個現成項目，而是將 Cloudflare 官方判斷模型作為總體骨架，並分別借鑑 `cloudflare-bot-directory`、`flargd`、`BotD` 與 `SonicJS` 的關鍵設計。其核心結構如下：

| 層 | 技術選型 | 主要職責 |
| --- | --- | --- |
| Edge Gateway | Cloudflare Workers | 接收請求、解析上下文、執行入口層分類與頁面路由 |
| Rule & Decision Engine | Workers + D1 | 根據規則、信號、模板映射生成決策 |
| Browser Signal Layer | React 前端 + BotD | 收集頁面層與操作層自動化信號並回傳 |
| Content & Template Layer | D1 + R2 + 模板渲染 | 管理頁面模板、內容版本、素材資產與組件配置 |
| Admin Console | React | 管理規則、模板、事件查詢、審計與發布 |
| Event & Audit Layer | D1 | 存儲請求日誌、攔截日誌、點擊日誌、模板版本與關聯 ID |

在請求生命周期上，建議採用以下流程。請求到達 Worker 後，先做入口層分類，包括 verified bot 檢查、基礎特徵提取、簡單規則匹配與速率控制。之後，Worker 查詢 D1 中的規則集與頁面映射，決定返回哪一個頁面類型，例如正常內容頁、風險挑戰頁、維護頁或實驗頁。前端頁面載入後，再由 React 組件執行 BotD 檢測並回傳 Worker。若使用者觸發敏感按鈕或提交操作，則再由 action endpoint 根據入口層 + 頁面層 + 歷史事件層三類信號做最終動作判定。這樣即可形成完整的多層決策鏈。[1] [3] [4] [5]

### 二、對使用者關注功能的合規映射

使用者原始需求中提到的幾個能力，本報告將其映射為合規用途下的對應設計。以下表格給出推薦翻譯方式與實作建議。

| 原始關注點 | 合規技術映射 | 推薦實作 |
| --- | --- | --- |
| 流量分流（真人 vs 機器） | 風險分級與 bot / automation score | 入口層規則 + verified bot allowlist + 頁面層 BotD 信號 + 事件分數 |
| 多層過濾（入口、頁面、按鈕） | 分層風險決策 | Worker 入口判斷、React 頁面信號、action endpoint 再判斷 |
| 安全頁/推廣頁動態切換 | 風險頁/正常頁/維護頁/實驗頁切換 | 以 feature flag 與規則映射決定返回模板 |
| gotolink 類似動態行為注入 | 同一 UI 元件按風險等級執行不同合法行為 | React 組件讀取 decision token，決定正常跳轉、二次驗證、延遲執行或禁用 |
| ini.html / details.html 中間承接頁 | 引導頁 / 說明頁 / 驗證頁 / 預處理頁 | 使用模板系統生成多步驟中介頁，並帶事件關聯 ID |
| 日誌記錄系統 | 分層事件與審計系統 | 請求日誌、攔截日誌、頁面事件、點擊事件、模板版本日誌 |
| 素材管理與模板系統 | Edge-native CMS | D1 管理內容結構，R2 管理素材，React 後台管理模板與版本 |

### 三、資料模型建議

若以 D1 作為主要結構化資料存儲，建議最少建立以下資料表。`rules` 用於存規則條件與優先級，`page_variants` 用於存頁面類型與模板映射，`templates` 用於存模板版本元資料，`assets` 用於存 R2 素材對應資訊，`request_events` 用於記錄入口層請求，`interaction_events` 用於記錄頁面與按鈕事件，`decisions` 用於記錄每次最終決策結果與理由摘要。這種設計比單一日誌表更利於審計與分析，也更方便在 React 後台中做查詢與回放。

| 表名 | 用途 | 關鍵欄位 |
| --- | --- | --- |
| `rules` | 規則與條件 | `id`, `name`, `priority`, `conditions_json`, `action`, `enabled` |
| `page_variants` | 頁面變體與路由映射 | `id`, `variant_key`, `template_id`, `status`, `description` |
| `templates` | 模板元資料與版本 | `id`, `name`, `version`, `schema_json`, `published_at` |
| `assets` | 素材索引 | `id`, `r2_key`, `mime_type`, `tags`, `created_at` |
| `request_events` | 入口層日誌 | `id`, `request_id`, `ip_hash`, `ua`, `geo`, `risk_score`, `decision` |
| `interaction_events` | 頁面/按鈕事件 | `id`, `request_id`, `session_id`, `event_type`, `payload_json` |
| `decisions` | 最終決策審計 | `id`, `request_id`, `rule_id`, `variant_key`, `reason_summary`, `created_at` |

### 四、關於「多層過濾機制」的具體架構建議

在入口層，應追求極低成本的快速分類。此處建議採用 verified bot allowlist、地理與網路屬性、UA 結構檢查、路徑白黑名單、簡單頻率控制等信號。若命中明確 allowlist 或 denylist，直接做早期決策；其餘請求則帶著初始風險分數繼續流入頁面層。[1] [2]

在頁面層，React 客戶端可以執行 BotD 檢測、收集必要的瀏覽器特徵與頁面交互上下文，再把結果送回 Worker。這一步不應阻塞首屏，但應作為後續操作決策的前置資料。頁面層還可根據 Worker 返回的 decision token 決定呈現不同元件，例如直接內容、驗證引導、額外說明或限制操作提示。[4]

在操作層，所有敏感動作都不應直接把前端 DOM click 當作可信輸入，而應要求攜帶 `request_id`、`session_id`、`variant_key`、`client_signal_id` 等上下文，由 Worker 在服務端重新完成一次授權性判斷。這一層是替代所謂“同一按鈕針對不同訪客做不同行為”的最佳合規方式：**UI 可以一致，但服務端執行路徑根據風險與配置安全地分流**。這種設計既保留動態性，又不會把決策邏輯暴露在前端腳本中。[3] [4]

### 五、關於中間承接頁的設計

若要實現類似 `ini.html / details.html` 的多步驟流程，建議不要將其視為“隱藏頁”或“偽裝頁”，而應設計為**顯式的中介模板類型**。例如，可以定義 `preface_page`、`verify_page`、`details_page`、`action_page` 等模板類型，每一步都關聯獨立模板版本與事件記錄。當 Worker 根據風險分數與規則決定需要多一步確認時，可將請求導向相應中介模板，並在 D1 中記錄跳轉原因、版本、時間與關聯 request_id。這種方式在治理與審計上遠比硬編碼多個靜態 HTML 文件可靠。[3] [5]

### 六、日誌與審計設計

本報告特別建議將日誌分為至少四層。第一層是**請求日誌**，記錄請求來源、初始特徵與入口決策。第二層是**攔截/挑戰日誌**，記錄哪些請求被要求進一步驗證或被拒絕。第三層是**互動日誌**，記錄頁面載入、BotD 回傳、按鈕點擊、表單操作等。第四層是**模板與版本日誌**，記錄當次請求實際使用的模板、頁面變體與資產版本。如此一來，任何一次結果都能被完整追溯到其規則、模板與信號來源，便於後續調優與稽核。

| 日誌層 | 主要內容 | 目的 |
| --- | --- | --- |
| Request Log | IP hash、UA、Geo、來源路徑、verified bot 判定、初始分數 | 入口層觀測 |
| Intercept Log | 挑戰、延遲、拒絕、替代頁返回原因 | 攔截效果分析 |
| Interaction Log | 頁面載入、BotD 結果、點擊、提交、前端事件 | 頁面層與操作層分析 |
| Template Log | 模板 ID、版本、變體、資產快照 | 回放與審計 |

## 為何本方案優於 PHP / Node.js / Python 的單體式實現

從本次已收集到的材料看，最有價值的高質量公開參考幾乎全部集中在 Cloudflare 生態與 TypeScript 生態，而不是傳統 PHP 單體後端或通用 Python Web 應用。這並不是因為 PHP 或 Python 做不到，而是因為本研究的核心需求本質上是一種**邊緣判斷 + 低延遲路由 + 前後端信號協同 + 全球內容分發**問題。Cloudflare Workers 天生位於入口位置，能以最低延遲獲取請求上下文並做最早決策；D1 與 R2 又能把規則、事件與素材留在同一平台內管理，這在工程複雜度和運營效率上都有明顯優勢。[1] [3] [5]

Node.js / TypeScript 的優勢還在於它與 Workers、React、Hono、Drizzle、前端 SDK 的整合邊界非常自然。若改用 PHP 或 Python 作為主判斷層，常見問題包括：決策離入口更遠、動態路由依賴回源、事件鏈路更分散，以及模板與素材管理更容易與邊緣規則脫節。因此，在目標架構已經明確是 Cloudflare Workers + D1 + React 的前提下，**最優方案應優先採用 TypeScript 為主的 edge-native 組合**。

## 最終推薦

綜合技術匹配度、組件成熟度、可治理性與對目標架構的適配程度，本報告給出的最終推薦如下。

第一，將 **Cloudflare 官方 Bot Detection 分層方法論**作為整體流量分類框架，而不是自行臆造單點規則模型。[1] 第二，將 `cloudflare-bot-directory` 作為**入口層 verified bot allowlist**，解決合法爬蟲識別問題。[2] 第三，將 `flargd` 的設計思想重構為**基於 D1 的規則與頁面變體決策系統**，用於合法的動態頁面切換與流程編排。[3] 第四，將 `BotD` 以 SDK 方式嵌入 React 前端，作為**頁面層與操作層的補充信號源**。[4] 第五，借鑑 `SonicJS` 的 `routes + templates + db + media` 分層方法，構建**素材與模板管理後台**，並以 D1 + R2 為資料底座。[5]

若必須用一句話概括最優技術實現方案，那就是：

> **以 Cloudflare Workers 實現入口與操作決策，以 D1 承載規則、日誌與模板元資料，以 React 實現管理後台與頁面組件，以 R2 管理素材，並用 verified bot 名錄、feature flag、瀏覽器側 bot 信號與內容模板系統組成一個可審計、可配置、可擴展的邊緣決策平台。**

這套方案的真正優勢不在於“偽裝”，而在於**治理能力**。它能讓請求分類、頁面切換、交互控制、素材管理與事件審計全部進入一個結構化、可回溯、可持續演進的工程體系之中。對於任何需要低延遲決策、全局分發與內容/規則協同治理的應用，這都是比單純腳本拼湊更穩健的選擇。

## 參考資料

[1]: https://developers.cloudflare.com/bots/concepts/bot-detection-engines/ "Cloudflare Docs - Bot detection engines"
[2]: https://github.com/microlinkhq/cloudflare-bot-directory "microlinkhq/cloudflare-bot-directory"
[3]: https://github.com/pmbanugo/flargd "pmbanugo/flargd"
[4]: https://github.com/fingerprintjs/BotD "fingerprintjs/BotD"
[5]: https://github.com/SonicJs-Org/sonicjs "SonicJs-Org/sonicjs"
