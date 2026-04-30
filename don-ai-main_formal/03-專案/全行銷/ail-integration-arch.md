---
title: "全行銷整合架構方案"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "全行銷平台的完整技術整合架構設計，包含系統模組、API 串接、資料流與部署方案。"
type: analysis
tags: [deployment, smm-panel]
status: active
created: "2026-03-29"
updated: "2026-03-29"
---
# 全行銷平台整合架構方案

> **文件版本**：v1.0 | **日期**：2026 年 3 月 28 日 | **作者**：Manus AI
>
> **核心理念**：不是選一個開源專案來用，而是把 24 個開源專案的所有優點全部拆出來，重新組裝成一個最強的系統。

---

## 目錄

1. [各開源專案優點拆解表](#1-各開源專案優點拆解表)
2. [整合架構設計](#2-整合架構設計)
3. [智慧 API 路由引擎設計](#3-智慧-api-路由引擎設計)
4. [技術整合方案](#4-技術整合方案)
5. [平台功能模組規劃](#5-平台功能模組規劃)
6. [資料庫設計概要](#6-資料庫設計概要)
7. [開發優先順序](#7-開發優先順序)

---

## 1. 各開源專案優點拆解表

本平台的設計哲學並非「選擇最好的一個專案」，而是將 24 個開源專案視為一座巨大的零件庫——從中精準拆解出每個專案最具價值的模組、設計模式與架構理念，再以用戶現有的 Cloudflare + React 技術棧為骨架，重新組裝成一個統一且強大的系統。以下按四大領域逐一拆解。

### 1.1 SMM Panel 系統（6 個專案）

這六個專案構成了 SMM 面板的核心業務邏輯基礎。它們各自在訂單管理、供應商對接、定價策略等方面有獨到之處，但也普遍存在技術棧老舊、缺乏自動化測試、單體架構擴展性差等共同問題。

| 編號 | 專案名稱 | 技術棧 | 核心優點 | 值得拆出的模組/設計 | 主要局限 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **smmbooster** | PHP/Laravel + Vue.js | 完整的 SMM 轉售閉環；動態服務與定價管理；多語言支援 | **API 整合與服務同步模組**：透過 `api_provider_id` 和 `api_service_id` 實現外部服務的精確對應；**動態定價引擎**：支援按百分比或固定金額加價；**多語言架構**：`languages` + `language_values` 表的設計清晰且易擴展 | 程式碼提交不活躍；缺乏自動化測試；單體架構 |
| 2 | **laravel-smm** | PHP/Laravel + Bootstrap | 供應商抽象層設計；使用者活動與餘額日誌 | **供應商抽象層**：將不同上游 API 統一為標準介面；**自訂價格表 (`custom_prices`)**：允許針對特定使用者設定專屬價格，增加運營靈活性；**資金流水帳設計**：完整記錄每筆餘額變動 | 前端技術棧陳舊 (jQuery)；缺乏完整對外 API |
| 3 | **boostpanel** | PHP/CodeIgniter + MySQL | 完整的供應商 API 整合；廣泛的支付網關；MIT 授權 | **票務支援系統 (Ticket System)**：完整的客服工單流程；**使用者特定費率 (Custom Rate)**：VIP 專屬定價邏輯；**集中式設定表 (`configs`)**：所有網站級設定集中管理 | 技術棧極度老舊 (PHP 5.6)；已停止維護；使用 MyISAM 引擎 |
| 4 | **SpeedSmm_v3** | Node.js/Express + MongoDB | 子面板 (Child Panel) 商業模式；動態外掛載入機制 | **子面板系統**：允許代理商建立自己的白牌 SMM 站點，是擴大營收的關鍵商業模式；**詳細的使用者日誌欄位設計**：結構化的事件通知開關 (alert)；**推薦系統欄位 (ref)**：為聯盟行銷打下基礎 | 專案為未完成的半成品；缺乏核心商業邏輯；存在安全隱患 |
| 5 | **SMMpanel** | Python/React/PHP | 宣稱支援 70+ 平台；API 優先設計 | **多平台整合的概念架構**：將所有社群平台的服務統一為標準化的服務定義；**API 優先設計理念**：提供 Python/JS/cURL 範例程式碼 | 缺乏可用原始碼；更像商業廣告而非真正的開源 |
| 6 | **smm-pannel** | React + Firebase | 無伺服器架構；前後端完全分離 | **無伺服器架構模式**：以 Firebase Cloud Functions 作為後端，完美契合 Cloudflare Workers 的邊緣運算理念；**Firebase 服務整合模式**：認證、儲存、資料庫的整合方式可直接映射至 Cloudflare 生態 | 深度綁定 Firebase 生態；NoSQL 對複雜查詢支援有限 |

### 1.2 數位服務/帳號交易平台（4 個專案）

這四個專案提供了市集平台的核心交易邏輯、多供應商管理、數位商品交付等關鍵能力。

| 編號 | 專案名稱 | 技術棧 | 核心優點 | 值得拆出的模組/設計 | 主要局限 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 7 | **sharetribe** | Ruby on Rails + React | 最成熟的市集平台；交易狀態機；多社群架構 | **交易流程引擎**：將交易過程抽象為可設定的狀態機，可靈活定義不同業務的交易流程；**多社群 (Multi-community) 設計**：一套程式碼服務多個獨立市集，對多租戶平台極具參考價值；**佣金與支付系統**：Stripe 整合的平台佣金計算邏輯 | 官方已不再積極維護；單體架構；Ruby 技術門檻 |
| 8 | **digitalhippo** | Next.js + TypeScript + Payload CMS | 雙向市集機制；tRPC 型別安全 API；Stripe Webhook 非同步處理 | **tRPC 型別安全 API 層**：前後端共享型別定義，消除 API 型別不匹配問題；**Stripe Webhook 非同步訂單處理**：支付成功後透過 Webhook 自動更新訂單狀態的完整流程；**商品審核機制**：管理員審核後才上架的品質控管流程 | 整合式單體架構；交易分潤機制過於簡化；缺乏 i18n |
| 9 | **mercur** | TypeScript + MedusaJS + PostgreSQL | 模組化與可組合式架構；專為多廠商設計；工作流引擎 | **廠商管理模組 (Seller Module)**：完整的供應商入駐、審核、管理流程；**佣金與支付模組 (Commission & Payout Module)**：靈活的分潤計算與結算機制；**「擴展而非侵入」的資料模型**：透過連結表 (Link Tables) 建立關係，避免侵入核心系統 | 高度依賴 MedusaJS；學習曲線陡峭 |
| 10 | **freelanceX** | Next.js + MongoDB + Prisma | 服務發布與購買；即時通訊；評價機制 | **Messages 模型與 Order 關聯**：將對話限制在特定交易上下文中的設計；**服務層 (Service Layer) 設計模式**：後端業務邏輯的清晰分層；**Prisma ORM 的應用實踐** | 搜尋功能基礎；缺乏管理員後台 |

### 1.3 自動化行銷與 SEO（5 個專案）

這五個專案是平台自動化能力的核心來源，從工作流編排到社群排程、從 SEO 審計到行銷自動化，涵蓋了行銷全鏈路。

| 編號 | 專案名稱 | 技術棧 | 核心優點 | 值得拆出的模組/設計 | 主要局限 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 11 | **n8n** | TypeScript + Vue.js | 視覺化與程式碼混合模式；原生 AI/Agent 功能；500+ 整合節點 | **節點式整合系統**：可擴展的外掛架構，為任何服務創建自訂節點；**工作流引擎**：JSON 格式的工作流定義，便於版本控制；**憑證加密儲存**：配置與資料分離的安全設計 | Fair-code 授權限制轉售；極大規模高併發場景需優化 |
| 12 | **postiz-app** | Next.js + NestJS + Temporal | AI 驅動的內容排程與優化；團隊協作；數據分析 | **以 `Organization` 為核心的多租戶資料模型**：清晰的組織層級權限隔離；**通用整合層 (`Integration` Model)**：統一管理所有第三方平台的 OAuth 連接；**Temporal 工作流編排**：處理複雜的排程與重試邏輯 | AGPL 授權限制商業複用；對 Temporal 重度依賴 |
| 13 | **InstaPy** | Python + Selenium + SQLite | 互動邏輯抽象層；可組合的智慧篩選器 | **互動操作封裝**：將按讚、留言等操作封裝為高階函式，可借鑑於跨平台自動化引擎設計；**智慧篩選器**：靈活組合多種條件的目標受眾篩選邏輯；**輕量級狀態追蹤**：使用 `recordActivity` 等表記錄操作歷史，確保冪等性 | 違反平台服務條款風險極高；基於 Selenium 資源消耗大 |
| 14 | **mautic** | PHP/Symfony + MySQL | 視覺化行銷活動建構器；多通路整合；潛在客戶評分 | **基於 Symfony Bundle 的外掛系統**：高度可擴展的模組化架構；**自動化工作流引擎**：觸發器-條件-動作的三段式設計；**聯絡人評分與標籤系統**：以 `leads` 為核心的星型資料模型，所有行為資料皆與之關聯 | 單體架構效能瓶頸；UI 相對傳統 |
| 15 | **seonaut** | Go + MySQL + ECharts | 全面的技術性 SEO 分析；互動式儀表板 | **爬蟲模組 (`internal/crawler`)**：高效的網站爬取與分析引擎；**問題標準化儲存**：對特定類型的 SEO 問題進行篩選和統計的高效設計；**爬取任務與報告的歷史追蹤**：支援不同時間點的報告比較 | 無外部 API 整合能力；前端互動性不足 |

### 1.4 其他擴充專案（9 個專案）

這九個專案各自在特定領域有獨到之處，為全行銷平台提供了從社群自動化、跨管道通知、電商促銷到代理機構管理等多維度的能力補充。

| 編號 | 專案名稱 | 技術棧 | 核心優點 | 值得拆出的模組/設計 | 主要局限 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 16 | **growchief** | TypeScript/NestJS + Temporal + Playwright | 擬人化自動操作；併發與排程管理；多租戶協作 | **基於 Temporal 的工作流程引擎**：處理複雜的多步驟自動化任務；**擬人化爬蟲與反偵測策略**：模擬真人操作的技術方案；**Bot 模型的精細化控制**：對自動化帳號的狀態與行為進行管理 | AGPL 授權；每任務啟動完整瀏覽器資源消耗大 |
| 17 | **Socioboard-5.0** | Node.js + Express + Laravel | 多平台整合管理；微服務架構；RSS Feed 整合 | **微服務模組劃分**：將不同功能拆分為獨立服務的實踐；**SQL + NoSQL 混合資料庫設計**：根據業務場景選擇最合適的資料庫 | 文件不完整；社群活躍度低 |
| 18 | **dittofeed** | TypeScript + PostgreSQL + ClickHouse + Temporal | 視覺化旅程建構器；用戶分群引擎；跨管道訊息傳遞 | **基於 ClickHouse 的用戶分群引擎**：高效處理大規模用戶行為數據；**以 `workspaceId` 實現的多租戶隔離**：徹底的資料分離設計；**統一的 `subscriptionGroup` 設計**：管理跨管道的用戶訂閱狀態 | 自架基礎設施要求高；部分白牌功能閉源 |
| 19 | **laudspeaker** | TypeScript/NestJS + PostgreSQL + RabbitMQ | 視覺化旅程建構器；A/B 測試；事件驅動架構 | **事件驅動架構**：以事件匯流排驅動系統行為的設計模式；**從 MongoDB 遷移至 PostgreSQL 的決策**：證明在複雜客戶關係場景下關聯式資料庫更具優勢；**A/B 測試框架**：行銷策略的科學驗證機制 | 仍處於公開測試階段；AGPL 授權 |
| 20 | **spree** | Ruby on Rails + TypeScript | 促銷與定價引擎；API-First 架構；模組化設計 | **促銷引擎的「規則-動作」設計模式 (`spree_promo`)**：靈活定義折扣規則與觸發條件；**`adjustments` 表設計**：統一處理所有影響價格的因素（折扣、稅金、運費）；**事件驅動架構 (`spree_bus`)**：模組間透過事件鬆耦合通訊 | Ruby 技術門檻；對小型專案過於複雜 |
| 21 | **agency-os** | Nuxt 3 + Directus + TypeScript | 客戶自助入口；動態頁面產生器；CRM 整合 | **基於區塊的動態頁面產生器**：透過 `block_*` 集合實現模組化頁面建構；**客戶入口與協作功能**：客戶可自助查看專案進度與文件；**Headless 架構模式**：前後端完全分離的最佳實踐 | 高度依賴 Directus；缺乏原生多租戶支援 |
| 22 | **seo-tools-api** | NestJS + TypeScript | 模組化 API 服務；無狀態設計；Swagger 文件 | **NestJS 模組化架構**：每個 SEO 工具為獨立模組，可按需載入；**無狀態 API 設計**：完美契合邊緣運算的無狀態特性；**Swagger 自動文件生成** | 無資料持久化；依賴第三方付費服務 |
| 23 | **SMM-Plugin** | PHP/WordPress | AI SEO 描述生成；智慧定價；會員錢包系統 | **三層式 AI 內容生成引擎**：自動為服務生成 SEO 友善的描述；**多維度動態定價引擎**：結合會員等級、幣別、利潤率的複合定價；**會員等級與錢包整合** | 原始碼不公開；商業模式可疑 |
| 24 | **Telegram Bot SMM** | Python/Aiogram + SQLite | Telegram Bot 整合；代理商複製功能；非同步架構 | **服務提供商抽象層 (Provider Manager)**：統一管理多個上游 API 的介面設計；**Bot 複製功能 (Bot Cloning)**：允許代理商一鍵複製機器人的白牌模式；**統一的 `history` 表**：記錄所有資金交易，便於對帳 | 單體架構；SQLite 高併發瓶頸；存在 SQL 注入風險 |

---

## 2. 整合架構設計

基於用戶現有的技術能力（Cloudflare 生態系、React 19、N8N、Contabo VPS），我們設計了一套**「邊緣運算 + 自動化工作流」的混合架構**。這套架構的核心思想是：將所有需要低延遲、高頻存取的操作放在 Cloudflare 邊緣節點執行，將所有耗時的後台任務交給 N8N 在 VPS 上非同步處理。

### 2.1 五層系統架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                    第一層：邊緣展示與互動層                            │
│          React 19 + TypeScript + Vite + Tailwind CSS v4              │
│          shadcn/ui · 部署於 Cloudflare Pages                         │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│    │ 客戶入口  │  │ 代理商面板│  │ 管理後台  │  │ Telegram │          │
│    │  Portal   │  │ Reseller │  │  Admin   │  │   Bot    │          │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────────────────┐
│                    第二層：邊緣 API 與路由層                           │
│              Cloudflare Workers + Hono Framework                     │
│    ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐     │
│    │ JWT 認證  │  │ 智慧路由引擎  │  │ 速率限制  │  │ 斗篷過濾  │     │
│    │Middleware │  │RoutingEngine │  │RateLimit │  │  Cloak   │     │
│    └──────────┘  └──────────────┘  └──────────┘  └──────────┘     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    第三層：資料持久與快取層                             │
│    ┌─────────────────────┐  ┌─────────────────────┐                │
│    │   Cloudflare D1     │  │   Cloudflare KV     │                │
│    │  (關聯式資料庫)       │  │   (鍵值快取)         │                │
│    │  用戶、訂單、財務     │  │  服務列表、供應商     │                │
│    │  供應商、指標歷史     │  │  評分、斷路器狀態     │                │
│    └─────────────────────┘  └─────────────────────┘                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Webhook / Cron Trigger
┌──────────────────────────▼──────────────────────────────────────────┐
│                    第四層：非同步與自動化工作流層                       │
│              N8N (自架於 Contabo VPS)                                │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│    │ 服務同步  │  │ 訂單狀態  │  │ AI 內容  │  │ 跨管道   │         │
│    │  Sync    │  │ Polling  │  │ 生成     │  │ 通知     │         │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│    │ 評分計算  │  │ 報表生成  │  │ 再行銷   │                       │
│    │ EWMA     │  │ Reports  │  │ Campaign │                       │
│    └──────────┘  └──────────┘  └──────────┘                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API Calls
┌──────────────────────────▼──────────────────────────────────────────┐
│                    第五層：外部整合層                                  │
│    ┌──────────────────────────────────────────────────────────┐     │
│    │              10 家上游 SMM API 供應商                      │     │
│    │  JustAnotherPanel · Peakerr · SMMFollows · BulkFollows  │     │
│    │  SMMPanelogy · MoreThanPanel · HeadSMM                  │     │
│    │  BestSMMProvider · SMMBin · KingSMMProvider              │     │
│    └──────────────────────────────────────────────────────────┘     │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│    │ 支付閘道  │  │ 斗篷系統  │  │ 上帝視角  │  │ 廣告策略  │         │
│    │ Stripe等 │  │  Cloak   │  │ 廣告歸因  │  │  分析    │         │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 各層詳細說明

**第一層：邊緣展示與互動層**借鑑了 `digitalhippo` 的現代化 UI 設計、`agency-os` 的客戶自助入口概念、以及 `SpeedSmm_v3` 的多角色面板設計。所有前端頁面部署於 Cloudflare Pages，利用全球 CDN 確保極致載入速度。React 19 的 Server Components 特性可進一步優化首屏渲染。

**第二層：邊緣 API 與路由層**是整個系統的神經中樞。Cloudflare Workers 提供了全球分佈的無伺服器運算能力，每次請求的冷啟動時間低於 5 毫秒。我們在此層部署智慧 API 路由引擎（詳見第 3 章），並整合用戶現有的斗篷系統作為流量過濾中間件。Hono 框架提供了類似 Express 的開發體驗，同時針對邊緣運算環境進行了深度優化。

**第三層：資料持久與快取層**採用 Cloudflare D1（基於 SQLite 的分散式關聯資料庫）儲存所有需要強一致性的核心業務資料，同時使用 Cloudflare KV（全球分佈的鍵值儲存）快取高頻讀取的資料，如服務列表、供應商評分、斷路器狀態等。這種「D1 寫入 + KV 讀取」的模式，既保證了資料一致性，又提供了毫秒級的讀取延遲。

**第四層：非同步與自動化工作流層**充分利用用戶已自架的 N8N 實例。所有不需要即時回應的任務——如定時同步 10 家上游 API 的服務列表與價格、輪詢訂單狀態、計算供應商 EWMA 評分、生成 AI 服務描述、發送跨管道通知——都由 N8N 工作流在 Contabo VPS 上非同步執行。這借鑑了 `dittofeed` 的跨管道通知邏輯、`mautic` 的自動化行銷觸發器、以及 `postiz-app` 的 AI 內容生成概念。

**第五層：外部整合層**統一管理所有外部服務的連接。10 家上游 SMM API 供應商透過標準化的 `ProviderInterface` 進行對接（借鑑 `laravel-smm` 與 `boostpanel` 的供應商抽象層設計），確保新增或移除供應商時不影響核心邏輯。

### 2.3 核心資料流向

全行銷平台的三條核心資料流如下：

**流程一：使用者下單（即時，< 500ms）**

前端 (React) 提交訂單 → Workers 驗證 JWT 與餘額 → 寫入訂單至 D1（狀態：`pending`）→ 扣除用戶餘額 → 觸發智慧路由引擎 → 從 KV 讀取供應商評分 → 選擇最佳供應商 → 呼叫上游 API 下單 → 寫入路由紀錄至 D1 → 更新訂單狀態為 `processing` → 回傳結果給前端。

**流程二：訂單狀態同步（非同步，每 5-15 分鐘）**

N8N 定時觸發 → 從 D1 查詢所有 `processing` 狀態的訂單 → 依供應商分組 → 批次呼叫各上游 API 查詢狀態 → 透過 Webhook 呼叫 Workers API → 更新 D1 訂單狀態 → 若完成則記錄交付數據 → 若失敗則觸發重試或退款邏輯。

**流程三：服務與評分更新（非同步，每 1-6 小時）**

N8N 定時觸發 → 抓取 10 家上游的服務列表與價格 → 比對現有服務，標記新增/下架/價格變動 → 對新服務呼叫 AI API 生成 SEO 描述 → 寫入 D1 → 根據最新訂單數據計算各供應商的 EWMA 評分 → 更新 KV 中的評分快取與斷路器狀態。

---

## 3. 智慧 API 路由引擎設計

智慧 API 路由引擎是全行銷平台的核心競爭力，也是區別於所有現有開源 SMM Panel 的關鍵差異化功能。該引擎部署於 Cloudflare Workers，確保每次下單都能在毫秒級別完成最佳供應商的選擇與派發。

### 3.1 追蹤指標體系

引擎追蹤六大核心指標，每個指標都有明確的數據來源、計算方式與業務含義。

| 指標 | 英文代號 | 說明 | 數據來源 | 計算方式 | 更新頻率 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **成功率** | `success_rate` | 訂單最終完成交付的比例 | D1 訂單狀態統計 | `完成訂單數 / 總訂單數 × 100` | 每 15 分鐘 |
| **投訴率** | `complaint_rate` | 客戶發起退款或投訴的比例 | D1 工單系統關聯 | `100 - (投訴訂單數 / 總訂單數 × 100)` | 每 15 分鐘 |
| **性價比** | `value_score` | 綜合品質與價格的得分 | 系統計算 | `(成功率 × 0.6 + 速度得分 × 0.2 + 留存率 × 0.2) / 價格標準化值` | 每 1 小時 |
| **價格** | `price_score` | 上游 API 的實際成本競爭力 | 上游服務列表同步 | `(最低價 / 該供應商價格) × 100` | 每 6 小時 |
| **交付速度** | `speed_score` | 從下單到開始交付的平均時間 | D1 訂單時間戳差值 | 最快為 100，超過 SLA 閾值為 0 | 每 15 分鐘 |
| **留存率** | `retention_rate` | 服務完成後數據的留存比例 | N8N 定期抽樣檢測 | `100 - (掉落數量 / 購買數量 × 100)` | 每 24 小時 |

### 3.2 EWMA 評分算法

我們採用**指數加權移動平均 (Exponentially Weighted Moving Average, EWMA)** 演算法來計算供應商的綜合評分。EWMA 的核心優勢在於：近期的數據佔有更大的權重，使系統能快速回應供應商品質的變化，同時不完全忽略歷史表現。

**EWMA 公式**：

```
EWMA_t = λ × X_t + (1 - λ) × EWMA_(t-1)
```

其中 `λ`（lambda）為平滑因子，取值範圍 0 < λ ≤ 1。`λ` 越大，近期數據的權重越高。我們建議初始設定 `λ = 0.3`，即近期數據佔 30% 權重，歷史累積佔 70%。

**綜合評分公式**：

```
S(provider, service) = W₁ × EWMA(success_rate)
                     + W₂ × EWMA(complaint_rate)
                     + W₃ × EWMA(value_score)
                     + W₄ × EWMA(price_score)
                     + W₅ × EWMA(speed_score)
                     + W₆ × EWMA(retention_rate)
```

**預設權重配置**（管理員可透過後台即時調整）：

| 權重 | 指標 | 預設值 | 適用場景說明 |
| :---: | :--- | :---: | :--- |
| W₁ | 成功率 | 0.25 | 最基本的服務品質保障 |
| W₂ | 投訴率 | 0.20 | 直接影響客戶滿意度與退款成本 |
| W₃ | 性價比 | 0.15 | 綜合考量品質與成本的平衡 |
| W₄ | 價格 | 0.20 | 直接影響平台利潤率 |
| W₅ | 交付速度 | 0.10 | 影響客戶體驗但非決定性因素 |
| W₆ | 留存率 | 0.10 | 長期品質指標，數據收集週期較長 |

### 3.3 路由決策邏輯

當一筆訂單進入路由引擎時，系統按以下步驟進行決策：

**步驟一：候選供應商篩選**。從 KV 快取中讀取提供該服務的所有供應商列表，排除以下情況：斷路器狀態為「開啟」的供應商、餘額不足的供應商、被管理員手動停用的供應商。

**步驟二：評分排序**。對剩餘候選供應商按綜合評分 `S` 降序排列。

**步驟三：路由策略選擇**。若最高分供應商的評分明顯領先（與第二名差距 ≥ 5 分），則直接派發至該供應商。若前幾名供應商評分接近（差距 < 5 分），則採用**加權輪詢 (Weighted Round Robin)** 策略，以評分作為權重分配流量，達到風險分散的效果。

**步驟四：成本驗證**。在最終派發前，系統檢查該供應商的成本是否會導致利潤低於管理員設定的「利潤率底線」。若低於底線，則跳過該供應商，嘗試下一個候選者。

### 3.4 斷路器機制 (Circuit Breaker)

借鑑微服務架構中的斷路器模式 [1]，我們為每個供應商實作三態斷路器：

**關閉狀態 (Closed)**：正常運作。系統持續追蹤該供應商的連續失敗次數。

**開啟狀態 (Open)**：當連續失敗次數達到閾值（預設 3 次），斷路器觸發。該供應商在 KV 中的狀態標記為 `circuit_open`，所有新訂單自動跳過此供應商。開啟狀態持續一個冷卻期（預設 30 分鐘）。

**半開狀態 (Half-Open)**：冷卻期結束後，斷路器進入半開狀態。系統允許少量測試流量（每分鐘最多 1 筆訂單）通過。若測試成功，斷路器恢復為關閉狀態；若測試失敗，斷路器重新回到開啟狀態，冷卻期加倍（最長 4 小時）。

### 3.5 失敗重試機制

當首選供應商的 API 呼叫失敗時，系統啟動自動重試流程：

**第一次重試**：等待 1 秒後，對同一供應商重試一次（處理暫時性網路問題）。

**第二次重試**：若仍失敗，立即切換至評分第二高的供應商進行派發。

**第三次重試**：若第二供應商也失敗，切換至評分第三高的供應商。

**最終處理**：若三次重試全部失敗，訂單狀態標記為 `failed`，系統自動退款至用戶錢包，並透過 N8N 發送 Telegram 警報通知管理員。同時，所有失敗的供應商的連續失敗計數器遞增，可能觸發斷路器。

### 3.6 成本優化策略

**策略一：動態利潤率保護**。管理員可為每個服務類別設定最低利潤率（如 20%）。當上游成本上漲導致利潤低於底線時，系統自動執行以下操作之一：切換至更便宜的供應商（即使評分略低）、自動調高該服務的售價、暫時將該服務標記為缺貨並發送警報。

**策略二：批量採購優化**。對於大量訂單（如單筆 > 10,000 粉絲），系統可將訂單拆分至多個供應商同時執行，既加快交付速度，又降低單一供應商的風險。

**策略三：時段差異化路由**。根據歷史數據分析，某些供應商在特定時段的表現更好（如亞洲供應商在 UTC+8 白天成功率更高）。系統可根據下單時間自動調整權重。

---

## 4. 技術整合方案

本章明確定義了 24 個開源專案在全行銷平台中的整合策略。我們將它們分為三個層級：直接使用、概念借鑑與重構、以及僅取理念參考。

### 4.1 直接使用與整合 (Direct Integration)

以下專案或技術將直接整合進全行銷平台的技術棧中：

| 整合項目 | 來源專案 | 整合方式 | 說明 |
| :--- | :--- | :--- | :--- |
| **N8N 工作流引擎** | n8n | 直接使用已自架實例 | 作為第四層的核心，承載所有非同步任務。將 `dittofeed` 的跨管道通知、`mautic` 的自動化行銷、`postiz-app` 的 AI 排程等邏輯，全部轉化為 N8N Workflow |
| **UI 元件庫** | shadcn/ui (用戶現有) | 直接使用 | 結合 Tailwind CSS v4，快速構建媲美 `digitalhippo` 與 `agency-os` 的現代化介面 |
| **Hono 框架** | 社群最佳實踐 | 直接使用 | 在 Cloudflare Workers 中提供類 Express 的路由與中間件開發體驗 |
| **GitHub Actions** | 用戶現有 | 直接使用 | CI/CD 流程，自動部署 Workers 與 Pages |

### 4.2 概念借鑑與深度重構 (Concept Adaptation)

以下專案的核心設計模式將被提取並以 TypeScript 重新實作於 Cloudflare 生態中：

| 重構模組 | 來源專案 | 借鑑內容 | 重構方式 |
| :--- | :--- | :--- | :--- |
| **供應商抽象層 (ProviderInterface)** | laravel-smm, boostpanel, Telegram Bot SMM | 統一的上游 API 介面定義 | 以 TypeScript Interface 定義 `createOrder()`, `checkStatus()`, `getServices()`, `getBalance()` 等標準方法，每個供應商實作一個 Adapter 類別 |
| **智慧路由引擎** | 無直接來源，綜合設計 | EWMA 評分、斷路器、加權輪詢 | 全新設計，部署於 Workers，評分數據存於 KV |
| **動態定價引擎** | smmbooster, spree, SMM-Plugin | `adjustments` 表設計、規則-動作模式 | 以 TypeScript 實作規則引擎，支援：基礎加價率、VIP 折扣、限時特價、代理商自訂價格 |
| **多租戶架構** | sharetribe, SpeedSmm_v3, dittofeed | 多社群設計、子面板、workspaceId 隔離 | 在 D1 中以 `tenant_id` 欄位實現資料隔離，每個代理商可擁有獨立的網域、主題與服務列表 |
| **交易狀態機** | sharetribe, mercur | 訂單生命週期管理 | 以有限狀態機 (FSM) 模式管理訂單狀態轉換：`pending → processing → partial → completed / cancelled / refunded` |
| **客服工單系統** | boostpanel, freelanceX | 票務系統、訂單關聯對話 | 以 D1 表實作工單系統，每個工單關聯至特定訂單，支援附件與狀態追蹤 |
| **AI 內容生成管線** | SMM-Plugin, postiz-app | 三層式 AI 描述生成 | 在 N8N 中建立工作流：上游原始描述 → GPT-4 翻譯與潤色 → SEO 關鍵字注入 → 寫入 D1 |
| **跨管道通知系統** | dittofeed, laudspeaker | 統一訂閱管理、多通道發送 | 在 N8N 中整合 Email (SendGrid/Resend)、Telegram Bot、SMS 等通道，統一管理用戶通知偏好 |
| **SEO 工具整合** | seonaut, seo-tools-api | 爬蟲模組、模組化 API 設計 | 將 SEO 分析功能封裝為獨立的 N8N 節點，可為客戶提供網站 SEO 健檢增值服務 |

### 4.3 僅取理念參考 (Concept Only)

以下專案因授權限制、技術棧不匹配或功能過於特化，僅作為設計理念的參考：

| 專案 | 參考理念 | 不直接使用的原因 |
| :--- | :--- | :--- |
| **InstaPy** | 互動邏輯的抽象化封裝、操作歷史的冪等性追蹤 | GPL 授權、基於 Selenium 資源消耗大、違反平台 ToS 風險 |
| **growchief** | 擬人化操作的反偵測策略、Bot 狀態管理 | AGPL 授權、Playwright 資源消耗大 |
| **Socioboard-5.0** | 微服務模組劃分的思路 | 文件不完整、社群不活躍、技術棧不匹配 |
| **laudspeaker** | 事件驅動架構、A/B 測試框架 | AGPL 授權、仍處於 Beta 階段 |
| **SMMpanel** | 多平台整合的概念架構 | 缺乏可用原始碼 |

---

## 5. 平台功能模組規劃

綜合 24 個專案的優點，全行銷平台的完整功能清單如下，按三大角色（客戶、代理商、管理員）組織：

### 5.1 客戶端功能 (Client Portal)

| 模組 | 功能項目 | 來源靈感 | 優先級 |
| :--- | :--- | :--- | :---: |
| **服務探索** | 多層級分類瀏覽（平台 → 類型 → 具體服務） | SMMpanel | P0 |
| | AI 優化的服務描述與 SEO 標題 | SMM-Plugin, postiz-app | P1 |
| | 即時價格試算（輸入數量即時顯示費用） | smmbooster | P0 |
| | 服務搜尋與篩選（按平台、價格、評分） | sharetribe | P1 |
| **訂單管理** | 一鍵下單與批量下單 | boostpanel | P0 |
| | 即時訂單狀態追蹤（含進度百分比） | SMMpanel | P0 |
| | 訂單歷史與篩選（按日期、狀態、平台） | laravel-smm | P0 |
| | 訂單自動重新下單（Drip Feed 滴灌模式） | smmbooster | P2 |
| **資金與錢包** | 多種支付方式儲值（加密貨幣、Stripe、PayPal） | smmbooster, boostpanel | P0 |
| | 資金流水帳明細（每筆交易可追溯） | laravel-smm | P0 |
| | 自動儲值提醒（餘額低於閾值時通知） | dittofeed | P2 |
| **客服與工單** | 建立工單並關聯至特定訂單 | boostpanel | P1 |
| | 即時訊息溝通 | freelanceX | P2 |
| | 常見問題自助查詢 (FAQ) | agency-os | P1 |
| **API 存取** | 個人 API Key 管理 | boostpanel | P1 |
| | API 文件與範例程式碼 | seo-tools-api | P1 |
| | API 呼叫日誌與統計 | n8n | P2 |
| **數據儀表板** | 花費統計與趨勢圖表 | seonaut | P1 |
| | 帳號成長追蹤（粉絲、按讚數變化） | InstaPy | P2 |

### 5.2 代理商端功能 (Reseller Panel)

| 模組 | 功能項目 | 來源靈感 | 優先級 |
| :--- | :--- | :--- | :---: |
| **白牌站點** | 自訂網域綁定 | SpeedSmm_v3 | P1 |
| | 自訂 Logo、主題顏色、品牌名稱 | agency-os | P1 |
| | 自訂登陸頁面 | agency-os | P2 |
| **定價管理** | 全域加價比例設定（如統一加價 30%） | smmbooster | P1 |
| | 單一服務自訂價格 | laravel-smm | P1 |
| | VIP 會員等級折扣 | boostpanel, SMM-Plugin | P2 |
| **下線管理** | 查看子用戶列表與訂單 | SpeedSmm_v3 | P1 |
| | 代客儲值 | boostpanel | P1 |
| | 設定子用戶專屬折扣 | laravel-smm | P2 |
| **Telegram Bot** | 一鍵生成專屬 Telegram 下單機器人 | Telegram Bot SMM | P2 |

### 5.3 管理員端功能 (Admin Dashboard)

| 模組 | 功能項目 | 來源靈感 | 優先級 |
| :--- | :--- | :--- | :---: |
| **路由監控中心** | 10 家供應商即時健康度儀表板 | 全新設計 | P0 |
| | 各供應商的六大指標即時數據 | 全新設計 | P0 |
| | 斷路器狀態視覺化與手動干預 | 全新設計 | P0 |
| | 路由權重即時調整 | 全新設計 | P1 |
| **供應商管理** | 新增/編輯/停用上游供應商 | smmbooster | P0 |
| | 一鍵同步上游服務列表 | SMM-Plugin | P0 |
| | 服務對應管理（上游服務 ↔ 平台服務） | smmbooster | P0 |
| | 供應商餘額監控與低餘額警報 | 全新設計 | P1 |
| **服務管理** | 服務上架/下架/編輯 | digitalhippo | P0 |
| | AI 批量生成服務描述 | SMM-Plugin, postiz-app | P1 |
| | 利潤率底線設定 | 全新設計 | P0 |
| **財務中心** | 平台收入與支出總覽 | spree | P0 |
| | 各供應商成本分析報表 | 全新設計 | P1 |
| | 退款管理 | mercur | P1 |
| | 整合「上帝視角」廣告歸因數據 | 用戶現有系統 | P2 |
| **用戶管理** | 用戶列表與搜尋 | laravel-smm | P0 |
| | 手動調整用戶餘額 | boostpanel | P0 |
| | 代理商審核與管理 | mercur | P1 |
| **自動化行銷** | 基於行為的觸發器設定 | mautic, dittofeed | P2 |
| | 跨管道通知模板管理 | dittofeed | P2 |
| | 用戶分群與再行銷 | mautic | P2 |

---

## 6. 資料庫設計概要

全行銷平台採用 **Cloudflare D1** 作為主要關聯式資料庫，**Cloudflare KV** 作為高速快取層。以下為核心表結構設計，借鑑了 `sharetribe` 的交易狀態機、`smmbooster` 的供應商對應表、`laravel-smm` 的資金流水帳、`spree` 的 `adjustments` 設計、以及 `dittofeed` 的多租戶隔離模式。

### 6.1 用戶與租戶

```sql
-- 用戶表
CREATE TABLE users (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id       TEXT REFERENCES tenants(id),       -- 所屬租戶（代理商）
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'client',     -- admin / reseller / client
    balance         REAL NOT NULL DEFAULT 0.00,         -- 錢包餘額
    api_key         TEXT UNIQUE,                        -- 客戶 API Key
    language        TEXT DEFAULT 'zh-TW',
    status          TEXT NOT NULL DEFAULT 'active',     -- active / suspended / banned
    referral_code   TEXT UNIQUE,                        -- 推薦碼
    referred_by     TEXT REFERENCES users(id),
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- 租戶表（代理商白牌站點）
CREATE TABLE tenants (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    owner_id        TEXT NOT NULL REFERENCES users(id), -- 代理商用戶 ID
    domain          TEXT UNIQUE,                        -- 自訂網域
    brand_name      TEXT NOT NULL,
    logo_url        TEXT,
    theme_config    TEXT,                               -- JSON: 主題顏色等配置
    markup_rate     REAL DEFAULT 0.30,                  -- 全域加價比例 (30%)
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TEXT DEFAULT (datetime('now'))
);
```

### 6.2 供應商與服務

```sql
-- 上游供應商表
CREATE TABLE providers (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name            TEXT NOT NULL,                      -- 如 JustAnotherPanel
    api_url         TEXT NOT NULL,                      -- API 端點
    api_key         TEXT NOT NULL,                      -- 加密儲存
    balance         REAL DEFAULT 0.00,                  -- 供應商帳戶餘額
    status          TEXT NOT NULL DEFAULT 'active',     -- active / paused / disabled
    circuit_state   TEXT DEFAULT 'closed',              -- closed / open / half_open
    circuit_failures INTEGER DEFAULT 0,                 -- 連續失敗次數
    circuit_opened_at TEXT,                             -- 斷路器開啟時間
    composite_score REAL DEFAULT 50.0,                  -- 綜合評分
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- 平台標準化服務表
CREATE TABLE services (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category_id     TEXT REFERENCES service_categories(id),
    platform        TEXT NOT NULL,                      -- instagram / youtube / tiktok 等
    type            TEXT NOT NULL,                      -- followers / likes / views 等
    name            TEXT NOT NULL,                      -- 對外顯示名稱
    description     TEXT,                               -- AI 生成的 SEO 描述
    base_price      REAL NOT NULL,                      -- 基礎售價 (每千個)
    min_quantity    INTEGER NOT NULL DEFAULT 100,
    max_quantity    INTEGER NOT NULL DEFAULT 100000,
    is_active       BOOLEAN DEFAULT TRUE,
    min_profit_rate REAL DEFAULT 0.20,                  -- 最低利潤率
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- 供應商-服務對應表（核心：一個平台服務可對應多個供應商）
CREATE TABLE provider_services (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    provider_id     TEXT NOT NULL REFERENCES providers(id),
    service_id      TEXT NOT NULL REFERENCES services(id),
    external_service_id TEXT NOT NULL,                  -- 上游 API 中的服務 ID
    cost_per_k      REAL NOT NULL,                      -- 上游成本 (每千個)
    is_active       BOOLEAN DEFAULT TRUE,
    last_synced_at  TEXT,
    UNIQUE(provider_id, service_id)
);

-- 服務分類表
CREATE TABLE service_categories (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    parent_id       TEXT REFERENCES service_categories(id),
    name            TEXT NOT NULL,
    sort_order      INTEGER DEFAULT 0
);
```

### 6.3 訂單與路由

```sql
-- 訂單表
CREATE TABLE orders (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id         TEXT NOT NULL REFERENCES users(id),
    tenant_id       TEXT REFERENCES tenants(id),
    service_id      TEXT NOT NULL REFERENCES services(id),
    target_url      TEXT NOT NULL,                      -- 目標連結
    quantity        INTEGER NOT NULL,
    amount          REAL NOT NULL,                      -- 客戶支付金額
    status          TEXT NOT NULL DEFAULT 'pending',    -- pending / processing / partial
                                                       -- completed / cancelled / refunded
    start_count     INTEGER,                            -- 下單時的初始數量
    remains         INTEGER,                            -- 剩餘待交付數量
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- 訂單路由紀錄表（記錄每筆訂單的實際派發歷史）
CREATE TABLE order_routes (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    order_id        TEXT NOT NULL REFERENCES orders(id),
    provider_id     TEXT NOT NULL REFERENCES providers(id),
    provider_service_id TEXT NOT NULL REFERENCES provider_services(id),
    external_order_id TEXT,                             -- 上游訂單 ID
    cost            REAL NOT NULL,                      -- 實際上游成本
    attempt_number  INTEGER NOT NULL DEFAULT 1,         -- 第幾次嘗試
    status          TEXT NOT NULL DEFAULT 'pending',    -- pending / success / failed
    error_message   TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    completed_at    TEXT
);
```

### 6.4 財務與交易

```sql
-- 資金流水帳（借鑑 laravel-smm 的餘額日誌設計）
CREATE TABLE transactions (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id         TEXT NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL,                      -- deposit / deduct / refund / bonus
    amount          REAL NOT NULL,
    balance_before  REAL NOT NULL,                      -- 交易前餘額
    balance_after   REAL NOT NULL,                      -- 交易後餘額
    reference_type  TEXT,                               -- order / topup / admin_adjust
    reference_id    TEXT,                               -- 關聯的訂單或儲值 ID
    description     TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- 動態定價規則表（借鑑 spree 的 adjustments 設計）
CREATE TABLE pricing_rules (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name            TEXT NOT NULL,
    rule_type       TEXT NOT NULL,                      -- user_discount / service_promo
                                                       -- tenant_markup / vip_tier
    target_type     TEXT,                               -- user / service / category / tenant
    target_id       TEXT,
    adjustment_type TEXT NOT NULL,                      -- percentage / fixed_amount
    adjustment_value REAL NOT NULL,                     -- 如 -0.10 表示 9 折
    priority        INTEGER DEFAULT 0,                  -- 規則優先級
    starts_at       TEXT,
    ends_at         TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TEXT DEFAULT (datetime('now'))
);
```

### 6.5 路由指標與分析

```sql
-- 供應商指標歷史快照（用於 EWMA 計算）
CREATE TABLE provider_metrics (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    provider_id     TEXT NOT NULL REFERENCES providers(id),
    service_id      TEXT REFERENCES services(id),       -- NULL 表示供應商整體指標
    metric_type     TEXT NOT NULL,                      -- success_rate / complaint_rate
                                                       -- speed_score / retention_rate
    raw_value       REAL NOT NULL,                      -- 原始值
    ewma_value      REAL NOT NULL,                      -- EWMA 計算後的值
    sample_size     INTEGER NOT NULL,                   -- 樣本數量
    recorded_at     TEXT DEFAULT (datetime('now'))
);

-- 客服工單表
CREATE TABLE tickets (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id         TEXT NOT NULL REFERENCES users(id),
    order_id        TEXT REFERENCES orders(id),
    subject         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open',       -- open / replied / resolved / closed
    priority        TEXT DEFAULT 'normal',              -- low / normal / high / urgent
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ticket_messages (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticket_id       TEXT NOT NULL REFERENCES tickets(id),
    sender_id       TEXT NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL,
    attachment_url  TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);
```

### 6.6 Cloudflare KV 快取結構

除了 D1 關聯式資料庫外，以下高頻讀取的數據儲存於 Cloudflare KV 中，確保毫秒級存取：

| KV Key 模式 | 儲存內容 | TTL | 更新觸發 |
| :--- | :--- | :--- | :--- |
| `services:list:{category}` | 該分類下的服務列表 JSON | 30 分鐘 | N8N 服務同步後 |
| `provider:score:{provider_id}:{service_id}` | 供應商對特定服務的綜合評分 | 15 分鐘 | N8N 評分計算後 |
| `provider:circuit:{provider_id}` | 斷路器狀態與時間戳 | 無 TTL | Workers 即時更新 |
| `provider:candidates:{service_id}` | 提供該服務的供應商列表（按評分排序） | 15 分鐘 | N8N 評分計算後 |
| `user:session:{token}` | 用戶 Session 資訊 | 24 小時 | 登入/登出時 |
| `rate_limit:{ip}:{endpoint}` | 速率限制計數器 | 1 分鐘 | 每次請求時 |

---

## 7. 開發優先順序

為確保專案能快速上線並驗證市場，建議採用**敏捷開發**方法，分四個階段交付。每個階段都有明確的目標、交付物與驗收標準。

### Phase 1：核心交易閉環 MVP（預計 4-6 週）

**目標**：跑通從用戶下單到上游 API 交付的完整閉環，驗證智慧路由引擎的基礎可行性。

| 週次 | 任務 | 交付物 |
| :---: | :--- | :--- |
| 1-2 | 建立 D1 資料庫結構（用戶、服務、訂單、供應商、路由紀錄表）；實作 Workers 核心 API（註冊、登入、JWT 認證） | 可運行的 API 端點 |
| 2-3 | 實作供應商抽象層 `ProviderInterface`；整合 3 家最穩定的上游 API | 可透過 API 下單至上游 |
| 3-4 | 實作智慧路由引擎 v1.0（基於成功率與價格的加權路由 + 基礎失敗重試） | 路由引擎可自動選擇供應商 |
| 4-5 | 開發 React 客戶端基礎介面（服務列表、下單、訂單查詢、錢包） | 可用的前端介面 |
| 5-6 | 整合測試、修復問題、內部試用 | **MVP 上線** |

### Phase 2：自動化與品質提升（預計 3-4 週）

**目標**：降低人工維運成本，提升服務品質與供應商管理的自動化程度。

| 週次 | 任務 | 交付物 |
| :---: | :--- | :--- |
| 1 | 在 N8N 中建立上游服務與價格的定時自動同步工作流 | 服務列表自動更新 |
| 1-2 | 在 N8N 中建立訂單狀態輪詢與自動更新工作流 | 訂單狀態自動同步 |
| 2-3 | 升級路由引擎至 v2.0：加入斷路器機制、完整 EWMA 六指標評分 | 智慧路由引擎完整版 |
| 3 | 建立 AI 服務描述生成工作流（N8N + OpenAI API） | 服務描述自動優化 |
| 3-4 | 整合斗篷系統作為 Workers Middleware；建立管理員路由監控儀表板 | 流量過濾 + 監控面板 |

### Phase 3：代理商體系與營收擴展（預計 4-5 週）

**目標**：開放代理商系統，擴大業務規模與營收來源。

| 週次 | 任務 | 交付物 |
| :---: | :--- | :--- |
| 1-2 | 實作多租戶架構（tenants 表、資料隔離、白牌站點配置） | 代理商可建立白牌站點 |
| 2-3 | 開發動態定價引擎（全域加價、單服務自訂價、VIP 折扣） | 靈活的定價體系 |
| 3-4 | 整合 Telegram Bot 下單與通知功能 | Telegram 快速下單 |
| 4-5 | 開發客服工單系統；整合剩餘 7 家上游 API | 完整的客服與供應商覆蓋 |

### Phase 4：行銷自動化與數據驅動（預計 3-4 週）

**目標**：建立完整的行銷自動化體系，以數據驅動業務增長。

| 週次 | 任務 | 交付物 |
| :---: | :--- | :--- |
| 1-2 | 透過 N8N 實作跨管道自動化再行銷旅程（Email/SMS/Telegram） | 自動化行銷工作流 |
| 2-3 | 整合「上帝視角」廣告歸因數據，建立 ROI 分析報表 | 數據驅動的決策支援 |
| 3-4 | 開發客戶 API 存取功能（API Key 管理、文件、呼叫日誌） | 開放 API 生態 |
| 4 | 效能優化、安全審計、全面測試 | **正式版上線** |

---

## 附錄 A：上游 API 供應商對接規格

所有 10 家上游 SMM API 供應商均遵循業界通用的 HTTP POST API 規格。以下為統一的 `ProviderInterface` 定義：

```typescript
interface ProviderInterface {
  // 取得供應商帳戶餘額
  getBalance(): Promise<{ balance: number; currency: string }>;

  // 取得供應商提供的所有服務列表
  getServices(): Promise<ProviderService[]>;

  // 建立新訂單
  createOrder(params: {
    serviceId: string;    // 上游服務 ID
    link: string;         // 目標連結
    quantity: number;     // 購買數量
  }): Promise<{ orderId: string }>;

  // 查詢訂單狀態
  checkStatus(orderId: string): Promise<{
    status: 'pending' | 'processing' | 'partial' | 'completed' | 'cancelled';
    charge: number;       // 實際扣費
    startCount: number;   // 開始時的數量
    remains: number;      // 剩餘數量
  }>;

  // 批量查詢訂單狀態
  checkMultipleStatus(orderIds: string[]): Promise<Map<string, OrderStatus>>;
}
```

---

## 附錄 B：技術棧總覽

| 層級 | 技術 | 用途 |
| :--- | :--- | :--- |
| 前端框架 | React 19 + TypeScript | 客戶端、代理商端、管理員端 |
| 建構工具 | Vite | 開發與建構 |
| UI 元件 | shadcn/ui + Tailwind CSS v4 | 介面元件與樣式 |
| 邊緣運算 | Cloudflare Workers + Hono | API 服務與路由引擎 |
| 關聯式資料庫 | Cloudflare D1 | 核心業務資料 |
| 鍵值快取 | Cloudflare KV | 高頻讀取快取 |
| 靜態託管 | Cloudflare Pages | 前端部署 |
| 自動化引擎 | N8N (自架) | 非同步任務與工作流 |
| CI/CD | GitHub Actions | 自動化部署 |
| VPS | Contabo | N8N 與其他後台服務 |
| 流量過濾 | 斗篷系統 (現有) | 惡意流量攔截 |
| 廣告歸因 | 上帝視角 (現有) | ROI 分析 |

---

> **結語**：全行銷平台的設計理念是「站在巨人的肩膀上」。我們不重複造輪子，而是從 24 個開源專案中精準提取最有價值的設計模式與架構理念，以現代化的邊緣運算技術棧重新實作。智慧 API 路由引擎作為核心差異化功能，將確保每一筆訂單都能以最優的品質、最低的成本、最快的速度完成交付。

---

[1]: https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker "Circuit Breaker Pattern - Azure Architecture Center"
