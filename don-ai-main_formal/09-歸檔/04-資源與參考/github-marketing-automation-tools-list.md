---
title: "GitHub 行銷自動化工具推薦報告"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）GitHub 行銷自動化工具推薦報告"
type: "list"
tags: [github, market-research]
status: "archived"
---
---
title: "GitHub 行銷自動化工具推薦報告"
category: reference
priority: medium
applicable_tools: all
last_updated: "2026-03-27"
summary: "精選適用於競品監控與 n8n 自動化的開源 GitHub 工具，並提供整合架構建議。"
id: "20260325-024356"
type: "reference"
tags: ["reference", "research", "automation", "github", "n8n"]
status: archived
created: 2026-03-25
updated: "2026-03-27"

archived_reason: "已整合至 04-資源與參考/GitHub開源工具與行銷自動化整合.md"
merged_into: "04-資源與參考/GitHub開源工具與行銷自動化整合.md"
archived_date: "2026-03-28"---

# GitHub 行銷自動化工具推薦報告

> 本報告旨在針對競品監控、社群媒體追蹤及 n8n 自動化工作流程等行銷需求，從 GitHub 上篩選並推薦一系列高價值的開源工具。報告將分析各工具的優缺點、適用情境，並提供一套整合 n8n 的建議架構與實施步驟。

## 推薦工具總覽

基於您的使用情境（競品監控、LINE 官方帳號追蹤、Facebook 廣告監控、粉絲數變化追蹤、Google Sheets 記錄），推薦以下工具組合：

| 工具名稱 | 星星數 | 活躍度 | 主要用途 | n8n 整合 |
| :--- | :--- | :--- | :--- | :--- |
| `changedetection.io` | 30.7k+ | ⭐⭐⭐⭐⭐ | 網站變更監控 | ✅ |
| `PriceGhost` | 400+ | ⭐⭐⭐⭐ | 價格和庫存追蹤 | ✅ |
| `postiz-app` | 27.3k+ | ⭐⭐⭐⭐⭐ | 社群媒體排程 | ✅ |
| `line-desktop-mcp` | 10+ | ⭐⭐⭐ | LINE 自動化 | ✅ |
| `Google-Sheets-Monitoring-Scraper` | 0 | ⭐⭐⭐ | Sheets 監控 | ✅ [待確認：此為新專案，穩定性與功能完整性有待驗證] |
| `facebook-ad-library-scraper` | 130+ | ⭐ | Facebook 廣告爬蟲 | ✅ [已過期：此專案已超過 7 年未更新，可能無法在新版 Facebook API 上正常運作，建議尋找替代方案。] |

## 按使用情境分類推薦

### 競品網站與廣告監控

<rule id="tool-changedetection">

#### changedetection.io (最強推薦)

- **GitHub**: [https://github.com/dgtlmoon/changedetection.io](https://github.com/dgtlmoon/changedetection.io)
- **星星數**: 30.7k+
- **最後更新**: 活躍
- **核心優勢**:
  - **通用性強**：可監控任何網站的內容變化，包括新聞、廣告、產品更新等。
  - **精準定位**：支援 CSS 選擇器、XPath、JSONPath，能精確指定監控的頁面元素。
  - **API 監控**：支援 JSON API 監控，可用於追蹤 Facebook 廣告 API 或其他 API 端點的變化。
  - **整合便利**：內建多種通知方式（Webhook、Discord、Slack），可無縫整合 n8n。
  - **反反爬蟲**：支援 Playwright 瀏覽器自動化，能處理 JavaScript 動態載入的內容。
  - **數據可控**：可自託管（Self-host），完全掌握監控數據。

- **與 n8n 整合方式**:
  - **觸發**：當 `changedetection.io` 偵測到變化時，透過 Webhook 通知 n8n。
  - **執行**：在 n8n 中設定 Webhook 觸發器接收通知，並自動將變更數據寫入 Google Sheets。

- **具體應用**:
  - 監控競品官網首頁、產品頁、定價頁。
  - 追蹤競品 Facebook 廣告投放變化。
  - 監控競品新聞稿或部落格發佈。

</rule>

### Facebook 廣告監控

<rule id="tool-fb-scraper">

#### facebook-ad-library-scraper

- **GitHub**: [https://github.com/minimaxir/facebook-ad-library-scraper](https://github.com/minimaxir/facebook-ad-library-scraper)
- **星星數**: 130+
- **最後更新**: 7 年前 [已過期：此專案已超過 7 年未更新，可能無法在新版 Facebook API 上正常運作，建議尋找替代方案。]
- **核心優勢**:
  - **官方 API**：曾是使用官方 Facebook Ad Library API 的合規方案，數據穩定。
  - **結構化數據**：可提取廣告元數據、受眾分佈等，並輸出為 CSV。

- **使用限制**:
  - 需要向 Facebook 申請 API 訪問權限，且流程嚴格。
  - API 政策可能已變更，原功能或受限制。

- **與 n8n 整合方式**:
  - 在 n8n 中透過「Execute Command」節點定期執行其 Python 腳本，並將結果寫入 Google Sheets。

</rule>

### LINE 官方帳號監控

<rule id="tool-line-mcp">

#### line-desktop-mcp

- **GitHub**: [https://github.com/dtwang/line-desktop-mcp](https://github.com/dtwang/line-desktop-mcp)
- **星星數**: 10+
- **最後更新**: 5 個月前
- **核心優勢**:
  - **n8n 原生整合**：透過 MCP (Model Context Protocol) 與 LINE 桌面版整合，並提供 n8n 工作流程範例。
  - **無需開發者帳號**：直接操作 LINE 桌面版，免去申請開發者帳號的麻煩。
  - **雙向通訊**：支援讀取和發送訊息，可實現監控與自動化互動。

- **具體應用**:
  - 自動監控競品 LINE 官方帳號的新訊息、優惠券或文章。
  - 將監控到的內容自動分類並存檔至 Google Sheets 進行分析。

</rule>

### 粉絲數與社群數據追蹤

<rule id="tool-priceghost">

#### PriceGhost

- **GitHub**: [https://github.com/clucraft/PriceGhost](https://github.com/clucraft/PriceGhost)
- **星星數**: 400+
- **最後更新**: 活躍
- **核心優勢**:
  - **通用數據提取**：雖名為價格追蹤，但其核心是通用的網頁數據提取與監控引擎。
  - **多策略提取**：支援 JSON-LD、CSS 選擇器、甚至 AI 分析，能應對複雜頁面。
  - **歷史數據可視化**：提供歷史數據圖表，便於分析粉絲數、按讚數等指標的增長趨勢。

- **具體應用**:
  - 監控競品 Facebook、Instagram、YouTube 等平台的粉絲數或訂閱數。
  - 記錄數據變化歷史，分析社群增長趨勢。

</rule>

### Google Sheets 數據記錄

<rule id="tool-gs-scraper">

#### Google-Sheets-Monitoring-Scraper

- **GitHub**: [https://github.com/acey-arton/Google-Sheets-Monitoring-Scraper](https://github.com/acey-arton/Google-Sheets-Monitoring-Scraper)
- **星星數**: 0 [待確認：此為新專案，穩定性與功能完整性有待驗證]
- **最後更新**: 3 個月前
- **核心優勢**:
  - **與 Sheets 深度整合**：專為監控 Google Sheets 中的 URL 列表而設計。
  - **自動化流程**：自動爬取 Sheets 中指定的網頁，提取數據，並將結果附帶時間戳回寫到 Sheets 中。

- **使用流程**:
  1. 在 Google Sheets 中建立要監控的競品 URL 列表。
  2. 為每個 URL 定義 CSS 選擇器（如粉絲數所在的元素）。
  3. 執行爬蟲，即可自動完成數據提取與更新。

</rule>

## 推薦的整體架構

我們推薦以 n8n 為核心，整合 `changedetection.io` 和 Google Sheets，打造一個強大且靈活的自動化監控系統。

```plaintext
┌─────────────────────────────────────────────────────────┐
│                    監控目標                              │
│  - 競品官網  - Facebook 廣告  - LINE 官方帳號           │
│  - 粉絲頁面  - 定價頁面       - 新聞頁面                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│changedetection│ │line-desktop- │ │ 其他爬蟲工具 │
│.io           │ │mcp           │ │ (e.g. PriceGhost)│
│(網站變化監控)│ │(LINE 訊息監控)│ │(特定數據提取)│
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
                    ┌────────────┐
                    │    n8n     │
                    │ (工作流程核心) │
                    │            │
                    │ - 接收通知 │
                    │ - 數據轉換 │
                    │ - 分析處理 │
                    └─────┬──────┘
                          │
                          ▼
                    ┌────────────────┐
                    │  Google Sheets │
                    │ (數據存儲與分析) │
                    │                │
                    │ - 競品監控表   │
                    │ - 粉絲數歷史   │
                    │ - LINE 訊息日誌│
                    └────────────────┘
```

### <example>具體工作流程範例</example>

<step>
**工作流程 1：監控競品官網變化**
1.  **監控**：`changedetection.io` 監控競品官網。
2.  **觸發**：偵測到變化時，發送 Webhook 到 n8n。
3.  **處理**：n8n 接收通知，提取變化內容。
4.  **存儲**：n8n 將數據寫入 Google Sheets 的「競品官網變化」工作表。
5.  **通知**（可選）：n8n 發送通知到 Slack 或 Email。
</step>

<step>
**工作流程 2：追蹤粉絲數變化**
1.  **排程**：n8n 設定排程，每日執行一次。
2.  **爬取**：使用 `PriceGhost` 或其他爬蟲工具爬取粉絲頁面，提取粉絲數。
3.  **比較**：與前一日數據進行比較。
4.  **存儲**：若有變化，記錄到 Google Sheets 的「粉絲數歷史」工作表。
</step>

<step>
**工作流程 3：監控 LINE 官方帳號**
1.  **監控**：`line-desktop-mcp` 監控指定的 LINE 官方帳號。
2.  **觸發**：接收到新訊息時，觸發 n8n 工作流程。
3.  **解析**：n8n 解析訊息內容。
4.  **存儲**：將訊息記錄到 Google Sheets 的「LINE 訊息日誌」工作表。
</step>

## 實施建議

### 優先順序

<step>
1.  **第一步**：部署 `changedetection.io`，因為它最通用、最強大。
2.  **第二步**：配置 n8n 與 `changedetection.io` 的 Webhook 整合。
3.  **第三步**：設定 Google Sheets 自動記錄，建立數據存儲基礎。
4.  **第四步**：根據需求，逐步添加 `line-desktop-mcp` 等其他專用工具。
</step>

### <example>快速開始：部署 changedetection.io</example>

使用 Docker 可以快速啟動 `changedetection.io` 服務：

```bash
docker run -d --restart always -p "127.0.0.1:5000:5000" \
  -v datastore-volume:/datastore \
  --name changedetection.io \
  dgtlmoon/changedetection.io
```

之後，在 n8n 中建立一個新的工作流程，添加「Webhook」觸發器，將其 URL 填入 `changedetection.io` 的通知設定中，即可完成整合。

## 其他有用工具

- **社群媒體分析**: `social-analyzer` (GitHub 22.1k ⭐) - 可用於分析帳號信息，作為粉絲追蹤的補充。
- **競品分析**: `Comperator` (GitHub 11 ⭐) - 使用 AI 進行深度競品分析，可生成競品報告。
- **通用爬蟲**: Apify - 可透過 n8n 的原生節點整合，提供更強大的網頁爬蟲與自動化能力。

## 注意事項

<rule id="legal-compliance">
1.  **法律合規**：確保您的監控活動符合當地法律法規及目標網站的服務條款（Terms of Service）。
2.  **API 限制**：部分服務（如 Facebook）的 API 需要申請批准，且有使用頻率限制。
3.  **數據隱私**：妥善保護您收集的數據，避免洩漏用戶隱私。
4.  **反爬蟲機制**：許多網站設有反爬蟲機制。在爬取時，建議使用代理服務、設定合理的請求延遲，以降低被封鎖的風險。
</rule>

## 結論

本文提供了一套以開源工具為核心的行銷自動化監控解決方案。**我們強烈建議以 `changedetection.io` 作為起點**，因其功能強大且用途廣泛，能滿足大部分網站變更監控的需求。再以 **n8n 作為自動化中樞**，串連各個專用工具（如 `line-desktop-mcp`）與 Google Sheets，即可構建一個低成本、高效率且數據完全自主可控的競品情報系統。雖然部分推薦工具存在過期或不確定性風險，但核心架構的靈活性足以應對未來的變化與擴展。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `06-SOP流程/n8n基礎工作流SOP.md` | 可參考此文件建立 n8n 的基礎 Webhook 與數據處理流程。 |
