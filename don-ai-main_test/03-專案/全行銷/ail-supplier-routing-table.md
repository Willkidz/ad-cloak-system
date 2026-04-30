---
title: "全行銷 SMM Panel 供應商智能路由表 v2"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-31"
version: "v2.0"
summary: "15 家供應商、662 條標準化路由規則的完整智能路由表 v2。涵蓋 32 個平台、16 種服務類型、5 個品質等級，每個服務含主選 + 最多 5 個備選供應商，附自動故障轉移邏輯、健康監控機制與單點故障風險分析。"
id: "20260330-ail-supplier-routing-table"
type: analysis
tags: [smm-panel, supplier-analysis, pricing, architecture, api]
status: active
created: "2026-03-30"
updated: "2026-03-31"
---

# SMM 供應商智能路由表

本文件為 SMM Panel 後台自動路由系統的完整技術文件。系統的核心目標是：當用戶在前台下單購買社群行銷服務時，後台自動從 15 家供應商中選擇最佳供應商執行訂單，並在失敗時無縫切換至備選供應商，全程對用戶透明。本文件涵蓋以下內容：服務分類標準化方法論、綜合評分公式、662 條完整路由規則、自動故障轉移機制設計、供應商健康度監控建議，以及單點故障風險分析。

---

## 1. 路由表總覽

### 1.1 基本統計

本路由表基於 15 家供應商共 21,196 筆原始服務資料，經過平台標準化、服務類型歸一、品質等級分類後，最終產出 662 條標準化路由規則。每條規則代表一個「平台 × 服務類型 × 品質等級 × 地區」的組合，並包含按綜合評分排序的主供應商及最多 5 個備選供應商。

| 指標 | 數值 |
| :--- | ---: |
| 原始服務總筆數 | 21,196 |
| 串接供應商數量 | 15 |
| 標準化路由項目數 | 662 |
| 涵蓋平台數量 | 32 |
| 標準化服務類型數量 | 16 |
| 品質等級數量 | 5 |
| 重點平台路由項目 | 375 |
| 單一供應商項目（高風險） | 285 |
| 雙供應商項目（中風險） | 138 |
| 三家以上供應商項目（低風險） | 239 |

### 1.2 供應商覆蓋率

下表列出 15 家供應商在路由表中的角色分佈。「主供應商次數」表示該供應商在多少條路由中被選為首選；「備選次數」表示作為備選1~5出現的總次數；「總覆蓋」為兩者之和，反映該供應商的整體重要性。

| 供應商 | 主供應商次數 | 備選次數 | 總覆蓋 | 定位 |
| :--- | ---: | ---: | ---: | :--- |
| JustAnotherPanel | 207 | 124 | 331 | 國際大型面板，服務最齊全 |
| URPanel | 75 | 165 | 240 | 國際面板，多項常規服務價格優勢 |
| SMMlite | 106 | 102 | 208 | 國際大型面板，覆蓋面廣 |
| 777fans | 57 | 132 | 189 | 亞洲市場專精，價格極具競爭力 |
| Peakerr | 91 | 86 | 177 | 國際面板，極低價格破壞者 |
| StarAds | 23 | 78 | 101 | 台灣本地面板，含限時促銷 |
| AutoBuyFans | 21 | 63 | 84 | 台灣面板，多樣化服務 |
| FBigLikes | 23 | 37 | 60 | 高單價高品質服務 |
| HDZ Bulk | 16 | 35 | 51 | 台灣專屬服務（Dcard/PTT/蝦皮） |
| FansKing | 15 | 29 | 44 | 台灣本地面板 |
| Taiwan Like | 15 | 21 | 36 | 台灣市場專精 |
| AI-FANS | 6 | 30 | 36 | 台灣面板，含 Dcard/LINE 服務 |
| GodLikes | 5 | 20 | 25 | 精選高品質台灣服務 |
| SocialKing | 1 | 11 | 12 | 台灣面板，真人互動服務 |
| SMMRush | 1 | 8 | 9 | 精選 Instagram 服務 |

### 1.3 標準化分類體系

每條路由規則由四個維度定義，形成唯一的服務 Key：`平台 × 服務類型 × 品質等級 × 地區`。

#### 服務類型標準化對照

原始 CSV 中的服務類型名稱不統一，以下為標準化對照表：

| 標準化名稱 | 原始名稱（合併來源） |
| :--- | :--- |
| Followers | Followers/Subscribers, Members |
| Likes | Likes/Reactions, Likes |
| Views | Views/Plays, Views, Plays/Streams |
| Live Viewers | Live Stream Viewers, Live Views |
| Comments | Comments |
| Shares | Shares, Shares/Retweets |
| Saves | Saves |
| Traffic | Website Traffic, Traffic/Visits |
| Reviews | Reviews/Ratings |
| Stories | Stories/Mentions |
| Mentions | Mentions |
| Votes | Votes |
| Accounts | Accounts |
| Packages | Packages |
| Posts | News/Forum Posts |
| Other | Other, Design/Dev, Downloads, Report Services |

#### 品質等級定義

品質等級的判斷基於服務名稱中的關鍵字、refill 欄位值，以及同類服務的相對價格位置。分類邏輯依優先順序如下：

| 品質等級 | 說明 | 主要判斷依據 |
| :--- | :--- | :--- |
| **Premium** | 最高品質，真人活躍帳號，永久或長期保固 | 名稱含 Premium / Diamond / VIP / 100% Real / Lifetime Refill / 鑽石 / 真人活躍 |
| **HQ** | 高品質，以真實帳號為主，通常有保固 | 名稱含 HQ / Real / Active / Non Drop / High Quality / 真人 / 穩定；或 refill=True 且名稱含保固相關字 |
| **Standard** | 標準品質，混合帳號，無特殊品質標記 | 無上述品質關鍵字的一般服務 |
| **Economy** | 經濟型，明確標示無保固或低成本 | 名稱含 No Refill / Cheap / Budget / 無保固 / 最便宜 |
| **Bot/Low** | 低品質，機器人或虛假帳號 | 名稱含 Bot / Fake / High Drop / Low Quality / 機器人 |

#### 地區標記定義

| 地區 | 說明 | 判斷依據 |
| :--- | :--- | :--- |
| **Global** | 全球帳號，無特定國家限制 | 無國家/地區關鍵字 |
| **TW** | 台灣/華人帳號 | 名稱含 台灣 / Taiwan / 🇹🇼 / 華人 / 中文 / 繁體 |
| **Targeted** | 特定國家帳號（非台灣） | 名稱含國旗 emoji 或國家名稱（USA / Korea / Japan / India 等） |

### 1.4 綜合評分公式

在同一標準化服務 Key 內，每個供應商的服務依以下六個維度計算綜合評分，分數越高排名越前：

| 維度 | 權重 | 計算方式 | 設計理由 |
| :--- | ---: | :--- | :--- |
| 價格 (Price) | 40% | 對數正規化至 0~100，最低價 = 100 | 成本是最核心的競爭力 |
| 可補發 (Refill) | 20% | 有保固 = 100，無 = 0 | 補發能力直接影響客訴率 |
| 最小訂購量 (Min) | 15% | 對數正規化，最小值 = 100 | 小白用戶常買少量，低門檻很重要 |
| 最大訂購量 (Max) | 10% | 對數正規化，最大值 = 100 | 大單彈性，避免拆單 |
| 可取消 (Cancel) | 10% | 可取消 = 100，不可 = 0 | 出問題時的止損能力 |
| 滴流投放 (Dripfeed) | 5% | 支援 = 100，不支援 = 0 | 模擬自然增長的加分項 |

> **綜合評分 = Price × 0.40 + Refill × 0.20 + Min × 0.15 + Max × 0.10 + Cancel × 0.10 + Dripfeed × 0.05**

對於價格、最小訂購量、最大訂購量等數值維度，採用**對數正規化**（log1p）而非線性正規化，以避免極端值（如某供應商價格是其他供應商的 1000 倍）過度壓縮中間供應商的分數差異。

---

## 2. 重點平台完整路由表

以下為系統主要銷售平台的完整路由表。每個路由項目列出主供應商及最多 5 個備選供應商（表格中顯示前 3 個備選，完整資料見附件 CSV）。

### 2.1 Instagram

共 **81** 個路由項目，平均每項有 **3.7** 家供應商可用，其中 **25** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0119 | Accounts | HQ | Global | Peakerr | 29,292 | $70.62 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0120 | Accounts | HQ | Targeted | Peakerr | 29,295 | $70.62 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0121 | Accounts | Standard | Global | URPanel | 12,383 | $2.40 | 65.5 | 777fans | $15.62 | FansKing | $31.25 | - | - | 3 |
| RT-0122 | Comments | Bot/Low | Global | SMMlite | 5,192 | $0.0300 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0123 | Comments | Economy | Global | SMMlite | 7,735 | $0.8100 | 60.4 | JustAnotherPanel | $0.8450 | HDZ Bulk | $12.81 | URPanel | $85.00 | 5 |
| RT-0124 | Comments | HQ | Global | JustAnotherPanel | 2,135 | $4.00 | 74.6 | Peakerr | $3.62 | SMMlite | $10.80 | - | - | 3 |
| RT-0125 | Comments | HQ | TW | SMMlite | 5,599 | $96.00 | 60.8 | AutoBuyFans | $96.25 | Taiwan Like | $312.50 | GodLikes | $468.75 | 5 |
| RT-0126 | Comments | HQ | Targeted | JustAnotherPanel | 3,383 | $11.25 | 50.9 | SMMlite | $35.00 | Peakerr | $2.03 | - | - | 3 |
| RT-0127 | Comments | Premium | Global | Peakerr | 29,491 | $0.8475 | 75.4 | SMMlite | $162.00 | JustAnotherPanel | $162.50 | - | - | 3 |
| RT-0128 | Comments | Premium | TW | Taiwan Like | 48 | $625.00 | 62.2 | AutoBuyFans | $673.75 | - | - | - | - | 2 |
| RT-0129 | Comments | Premium | Targeted | JustAnotherPanel | 6,075 | $144.38 | 65.0 | URPanel | $202.12 | SMMlite | $270.00 | - | - | 3 |
| RT-0130 | Comments | Standard | Global | SMMlite | 7,509 | $6.00 | 80.4 | Peakerr | $6.78 | URPanel | $3.78 | JustAnotherPanel | $3.66 | 8 |
| RT-0131 | Comments | Standard | Targeted | SMMlite | 5,976 | $15.00 | 59.6 | JustAnotherPanel | $8.12 | URPanel | $8.50 | Peakerr | $28.25 | 4 |
| RT-0132 | Followers | Bot/Low | Global | SMMlite | 7,601 | $1.94 | 75.8 | JustAnotherPanel | $0.2340 | Peakerr | $1.42 | URPanel | $4.10 | 5 |
| RT-0133 | Followers | Economy | Global | Peakerr | 28,365 | $0.3255 | 73.6 | SMMlite | $1.80 | JustAnotherPanel | $0.4880 | SMMRush | $0.3000 | 8 |
| RT-0134 | Followers | HQ | Global | JustAnotherPanel | 352 | $0.6250 | 95.0 | Peakerr | $0.3955 | SMMlite | $0.8900 | SMMRush | $0.4100 | 6 |
| RT-0135 | Followers | HQ | TW | SMMlite | 62 | $6.25 | 55.6 | Taiwan Like | $18.75 | AutoBuyFans | $20.31 | JustAnotherPanel | $6.25 | 8 |
| RT-0136 | Followers | HQ | Targeted | JustAnotherPanel | 6,328 | $4.75 | 85.6 | SMMlite | $3.52 | Peakerr | $5.76 | URPanel | $75.00 | 4 |
| RT-0137 | Followers | Premium | Global | Peakerr | 30,113 | $0.1356 | 92.0 | SMMRush | $0.5900 | SMMlite | $1.90 | JustAnotherPanel | $0.7560 | 4 |
| RT-0138 | Followers | Premium | TW | GodLikes | 284 | $18.75 | 58.2 | FansKing | $71.88 | Taiwan Like | $250.00 | SocialKing | $125.00 | 6 |
| RT-0139 | Followers | Premium | Targeted | SMMlite | 6,533 | $0.4500 | 70.5 | Peakerr | $27.91 | JustAnotherPanel | $20.62 | URPanel | $36.30 | 4 |
| RT-0140 | Followers | Standard | Global | SMMlite | 6,878 | $2.40 | 89.5 | Peakerr | $1.02 | JustAnotherPanel | $0.3750 | URPanel | $0.8112 | 11 |
| RT-0141 | Followers | Standard | Targeted | SMMlite | 1,500 | $3.60 | 81.1 | Peakerr | $1.32 | JustAnotherPanel | $0.7000 | URPanel | $0.4024 | 8 |
| RT-0142 | Likes | Bot/Low | Global | URPanel | 11,316 | $0.0544 | 72.2 | Peakerr | $0.1772 | SMMlite | $0.2300 | SMMRush | $0.0550 | 5 |
| RT-0143 | Likes | Economy | Global | SMMlite | 6,944 | $0.0500 | 71.4 | JustAnotherPanel | $0.0125 | Peakerr | $0.5650 | URPanel | $0.3150 | 8 |
| RT-0144 | Likes | HQ | Global | JustAnotherPanel | 8,409 | $0.1125 | 95.7 | SMMlite | $0.3200 | Peakerr | $0.0577 | SMMRush | $0.1000 | 7 |
| RT-0145 | Likes | HQ | TW | AutoBuyFans | 225 | $7.50 | 54.3 | GodLikes | $15.62 | JustAnotherPanel | $3.50 | SMMlite | $3.50 | 9 |
| RT-0146 | Likes | HQ | Targeted | Peakerr | 30,056 | $0.0938 | 82.6 | JustAnotherPanel | $0.3750 | SMMlite | $2.90 | URPanel | $7.80 | 4 |
| RT-0147 | Likes | Premium | Global | Peakerr | 29,461 | $0.0916 | 87.2 | JustAnotherPanel | $1.10 | SMMlite | $0.6200 | URPanel | $1.49 | 5 |
| RT-0148 | Likes | Premium | TW | Taiwan Like | 137 | $109.38 | 52.2 | AutoBuyFans | $134.69 | - | - | - | - | 2 |
| RT-0149 | Likes | Premium | Targeted | Peakerr | 27,077 | $1.92 | 80.0 | SMMlite | $10.75 | JustAnotherPanel | $9.38 | URPanel | $17.85 | 4 |
| RT-0150 | Likes | Standard | Global | SMMlite | 7,388 | $0.2000 | 91.9 | JustAnotherPanel | $0.1875 | Peakerr | $0.1526 | URPanel | $0.0910 | 13 |
| RT-0151 | Likes | Standard | Targeted | SMMlite | 5,529 | $1.07 | 84.5 | JustAnotherPanel | $0.4125 | Peakerr | $0.2712 | 777fans | $1.52 | 7 |
| RT-0152 | Live Viewers | Economy | Global | 777fans | 4,233 | $0.6923 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0153 | Live Viewers | Standard | Global | Peakerr | 29,301 | $6.78 | 62.6 | SocialKing | $21.88 | 777fans | $29.40 | StarAds | $15.06 | 4 |
| RT-0154 | Mentions | Economy | Global | SMMlite | 7,186 | $0.009900 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0155 | Mentions | HQ | Global | SMMlite | 5,745 | $60.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0156 | Mentions | HQ | TW | SMMlite | 2,607 | $0.4100 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0157 | Mentions | HQ | Targeted | SMMlite | 5,748 | $60.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0158 | Mentions | Standard | Global | SMMlite | 1,618 | $0.2000 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0159 | Mentions | Standard | Targeted | SMMlite | 2,377 | $0.4100 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0160 | Other | Bot/Low | Global | 777fans | 873 | $2.38 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0161 | Other | Economy | Global | AutoBuyFans | 589 | $0.6250 | 55.0 | 777fans | $4.46 | - | - | - | - | 2 |
| RT-0162 | Other | HQ | Global | StarAds | 534 | $23.69 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0163 | Other | HQ | TW | StarAds | 727 | $28.12 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0164 | Other | HQ | Targeted | StarAds | 741 | $184.06 | 85.0 | - | - | - | - | - | - | 1 |
| RT-0165 | Other | Premium | Global | StarAds | 83 | $52.50 | 85.0 | - | - | - | - | - | - | 1 |
| RT-0166 | Other | Premium | TW | StarAds | 602 | $117.19 | 85.0 | - | - | - | - | - | - | 1 |
| RT-0167 | Other | Standard | Global | SMMlite | 3,617 | $1.25 | 70.8 | Peakerr | $3.66 | URPanel | $2.40 | 777fans | $5.24 | 8 |
| RT-0168 | Packages | Standard | Global | 777fans | 1,787 | $5.92 | 62.2 | JustAnotherPanel | $12.50 | - | - | - | - | 2 |
| RT-0169 | Packages | Standard | Targeted | JustAnotherPanel | 6,829 | $12.50 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0170 | Reviews | Standard | Global | SMMlite | 7,169 | $4.50 | 50.0 | 777fans | $8.15 | - | - | - | - | 2 |
| RT-0171 | Saves | Economy | Global | SMMlite | 569 | $0.003200 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0172 | Saves | HQ | Global | Peakerr | 2,586 | $0.1554 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0173 | Saves | Standard | Global | JustAnotherPanel | 4,434 | $0.0600 | 73.6 | Peakerr | $0.0853 | 777fans | $0.7175 | URPanel | $0.1740 | 6 |
| RT-0174 | Saves | Standard | Targeted | SMMlite | 4,799 | $0.1000 | 60.0 | - | - | - | - | - | - | 1 |
| RT-0175 | Shares | Bot/Low | Global | SMMlite | 6,566 | $1.20 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0176 | Shares | Economy | Global | SMMlite | 7,291 | $0.0800 | 74.3 | JustAnotherPanel | $0.5000 | AutoBuyFans | $0.3125 | - | - | 3 |
| RT-0177 | Shares | HQ | Global | Peakerr | 26,712 | $0.0125 | 95.0 | SMMlite | $0.0600 | - | - | - | - | 2 |
| RT-0178 | Shares | Premium | Global | Peakerr | 26,615 | $10.17 | 50.0 | SMMlite | $18.50 | - | - | - | - | 2 |
| RT-0179 | Shares | Standard | Global | JustAnotherPanel | 9,590 | $0.0125 | 93.8 | Peakerr | $0.0113 | SMMlite | $0.1400 | 777fans | $0.1012 | 7 |
| RT-0180 | Shares | Standard | Targeted | JustAnotherPanel | 10,007 | $9.88 | 76.8 | SMMlite | $12.00 | - | - | - | - | 2 |
| RT-0181 | Stories | Standard | Global | JustAnotherPanel | 3,745 | $0.8200 | 61.0 | Peakerr | $0.9040 | URPanel | $2.98 | 777fans | $12.72 | 4 |
| RT-0182 | Traffic | Economy | Global | SMMlite | 6,593 | $0.009600 | 68.6 | JustAnotherPanel | $0.2250 | HDZ Bulk | $2.03 | - | - | 3 |
| RT-0183 | Traffic | HQ | Global | Peakerr | 3,359 | $0.0814 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0184 | Traffic | HQ | TW | JustAnotherPanel | 2,745 | $0.4375 | 80.0 | URPanel | $0.7000 | StarAds | $5.47 | - | - | 3 |
| RT-0185 | Traffic | Standard | Global | URPanel | 6,972 | $0.3000 | 64.5 | SMMlite | $0.4800 | JustAnotherPanel | $0.4375 | Peakerr | $0.0260 | 4 |
| RT-0186 | Traffic | Standard | Targeted | URPanel | 10,843 | $0.2235 | 72.7 | JustAnotherPanel | $0.2250 | SMMlite | $0.7000 | - | - | 3 |
| RT-0187 | Views | Economy | Global | SMMlite | 6,858 | $0.009000 | 74.0 | Peakerr | $0.0452 | JustAnotherPanel | $0.1212 | 777fans | $1.42 | 6 |
| RT-0188 | Views | HQ | Global | JustAnotherPanel | 5,959 | $0.3288 | 92.2 | Peakerr | $0.2119 | SMMlite | $0.1200 | URPanel | $0.0364 | 5 |
| RT-0189 | Views | HQ | TW | SMMlite | 5,656 | $0.2000 | 55.0 | 777fans | $1.25 | StarAds | $3.31 | - | - | 3 |
| RT-0190 | Views | HQ | Targeted | Peakerr | 29,613 | $0.2373 | 85.4 | SMMlite | $0.1000 | JustAnotherPanel | $12.18 | 777fans | $1.48 | 5 |
| RT-0191 | Views | Premium | Global | SMMlite | 4,001 | $0.0400 | 60.0 | JustAnotherPanel | $1.62 | - | - | - | - | 2 |
| RT-0192 | Views | Premium | Targeted | SMMlite | 7,100 | $0.2400 | 55.8 | JustAnotherPanel | $210.00 | - | - | - | - | 2 |
| RT-0193 | Views | Standard | Global | Peakerr | 27,257 | $0.0452 | 91.6 | SMMlite | $0.007000 | URPanel | $0.0828 | JustAnotherPanel | $0.1000 | 14 |
| RT-0194 | Views | Standard | Targeted | SMMlite | 5,183 | $0.1000 | 72.7 | JustAnotherPanel | $0.2700 | URPanel | $0.5000 | Peakerr | $0.2034 | 6 |
| RT-0195 | Votes | Economy | Global | SMMlite | 7,188 | $0.1400 | 63.3 | HDZ Bulk | $13.12 | - | - | - | - | 2 |
| RT-0196 | Votes | HQ | Global | SMMlite | 7,190 | $0.8300 | 64.5 | - | - | - | - | - | - | 1 |
| RT-0197 | Votes | HQ | TW | SMMlite | 5,711 | $3.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0198 | Votes | Standard | Global | SMMlite | 769 | $0.8000 | 57.9 | JustAnotherPanel | $0.1625 | StarAds | $27.62 | - | - | 3 |
| RT-0199 | Votes | Standard | Targeted | SMMlite | 5,715 | $3.00 | 65.0 | - | - | - | - | - | - | 1 |

### 2.2 Facebook

共 **56** 個路由項目，平均每項有 **4.1** 家供應商可用，其中 **14** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0044 | Accounts | HQ | TW | AutoBuyFans | 253 | $7,031.25 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0045 | Accounts | Standard | Global | 777fans | 1,639 | $2.22 | 68.1 | FansKing | $31.25 | FBigLikes | $699.00 | - | - | 3 |
| RT-0046 | Accounts | Standard | Targeted | FBigLikes | 309 | $7,000.00 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0047 | Comments | Economy | Global | Peakerr | 29,608 | $1.70 | 72.4 | URPanel | $12.75 | HDZ Bulk | $81.25 | - | - | 3 |
| RT-0048 | Comments | HQ | Global | JustAnotherPanel | 987 | $20.55 | 55.0 | URPanel | $76.50 | - | - | - | - | 2 |
| RT-0049 | Comments | HQ | TW | StarAds | 4 | $625.00 | 50.9 | Taiwan Like | $781.25 | AutoBuyFans | $842.50 | URPanel | $44.62 | 9 |
| RT-0050 | Comments | HQ | Targeted | URPanel | 12,048 | $44.62 | 55.0 | Peakerr | $169.50 | - | - | - | - | 2 |
| RT-0051 | Comments | Premium | TW | SocialKing | 33 | $531.25 | 40.0 | Taiwan Like | $1,562.50 | - | - | - | - | 2 |
| RT-0052 | Comments | Standard | Global | Peakerr | 22,337 | $2.03 | 65.3 | JustAnotherPanel | $6.97 | 777fans | $2.59 | AutoBuyFans | $10.62 | 10 |
| RT-0053 | Comments | Standard | Targeted | JustAnotherPanel | 9,052 | $1.18 | 65.3 | URPanel | $89.25 | Peakerr | $17.90 | StarAds | $536.59 | 4 |
| RT-0054 | Followers | Bot/Low | Global | Peakerr | 29,364 | $1.29 | 56.9 | - | - | - | - | - | - | 1 |
| RT-0055 | Followers | Economy | Global | URPanel | 12,878 | $0.1518 | 67.2 | JustAnotherPanel | $0.7260 | Peakerr | $0.2825 | FansKing | $18.75 | 5 |
| RT-0056 | Followers | HQ | Global | Peakerr | 29,603 | $0.2373 | 88.4 | JustAnotherPanel | $0.6000 | URPanel | $0.4500 | StarAds | $42.44 | 4 |
| RT-0057 | Followers | HQ | TW | StarAds | 625 | $0.000000 | 49.1 | URPanel | $9.00 | GodLikes | $93.75 | AI-FANS | $171.88 | 10 |
| RT-0058 | Followers | HQ | Targeted | URPanel | 12,129 | $0.2805 | 68.8 | Peakerr | $2.71 | JustAnotherPanel | $12.92 | - | - | 3 |
| RT-0059 | Followers | Premium | Global | StarAds | 504 | $46.88 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0060 | Followers | Premium | TW | Taiwan Like | 149 | $468.75 | 55.0 | AutoBuyFans | $842.50 | FBigLikes | $26,854.00 | - | - | 3 |
| RT-0061 | Followers | Standard | Global | Peakerr | 29,444 | $0.1695 | 74.6 | JustAnotherPanel | $0.2325 | 777fans | $1.14 | URPanel | $1.00 | 14 |
| RT-0062 | Followers | Standard | Targeted | URPanel | 12,132 | $0.3188 | 62.1 | JustAnotherPanel | $1.40 | Peakerr | $6.82 | StarAds | $109.38 | 4 |
| RT-0063 | Likes | Bot/Low | Global | 777fans | 59 | $2.39 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0064 | Likes | Economy | Global | URPanel | 11,609 | $0.3000 | 76.8 | Peakerr | $0.0944 | 777fans | $0.6016 | AutoBuyFans | $1.25 | 8 |
| RT-0065 | Likes | HQ | Global | Peakerr | 29,578 | $0.1356 | 83.1 | URPanel | $0.5600 | JustAnotherPanel | $7.38 | SMMlite | $1.70 | 6 |
| RT-0066 | Likes | HQ | TW | StarAds | 641 | $31.25 | 63.3 | URPanel | $8.93 | GodLikes | $62.50 | AutoBuyFans | $76.56 | 11 |
| RT-0067 | Likes | HQ | Targeted | Peakerr | 28,902 | $3.39 | 83.6 | URPanel | $8.93 | - | - | - | - | 2 |
| RT-0068 | Likes | Premium | Global | Peakerr | 22,683 | $0.0999 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0069 | Likes | Premium | TW | FansKing | 235 | $59.38 | 61.5 | SocialKing | $43.75 | Taiwan Like | $312.50 | AI-FANS | $281.25 | 5 |
| RT-0070 | Likes | Standard | Global | Peakerr | 30,391 | $0.1038 | 85.2 | JustAnotherPanel | $0.1744 | 777fans | $0.7954 | StarAds | $25.00 | 14 |
| RT-0071 | Likes | Standard | Targeted | JustAnotherPanel | 9,359 | $1.08 | 61.4 | SMMlite | $1.88 | URPanel | $0.4208 | Peakerr | $1.63 | 6 |
| RT-0072 | Live Viewers | Economy | Global | JustAnotherPanel | 8,024 | $1.25 | 50.2 | AI-FANS | $46.88 | HDZ Bulk | $8.75 | - | - | 3 |
| RT-0073 | Live Viewers | Premium | Global | 777fans | 622 | $3.12 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0074 | Live Viewers | Standard | Global | 777fans | 3,811 | $0.5008 | 68.3 | JustAnotherPanel | $0.3800 | Peakerr | $1.89 | URPanel | $1.37 | 10 |
| RT-0075 | Other | Economy | Global | AI-FANS | 389 | $109.38 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0076 | Other | HQ | TW | GodLikes | 263 | $93.75 | 57.7 | 777fans | $66.19 | StarAds | $625.00 | HDZ Bulk | $78.12 | 6 |
| RT-0077 | Other | Standard | Global | Peakerr | 29,372 | $0.5311 | 69.6 | 777fans | $2.10 | GodLikes | $15.62 | AutoBuyFans | $2.81 | 12 |
| RT-0078 | Other | Standard | Targeted | URPanel | 12,066 | $8.93 | 70.0 | JustAnotherPanel | $11.83 | - | - | - | - | 2 |
| RT-0079 | Packages | HQ | TW | HDZ Bulk | 520 | $312,500.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0080 | Reviews | HQ | TW | 777fans | 1,320 | $373.48 | 48.3 | SocialKing | $1,406.25 | - | - | - | - | 2 |
| RT-0081 | Reviews | Standard | Global | 777fans | 4,168 | $114.49 | 51.1 | - | - | - | - | - | - | 1 |
| RT-0082 | Shares | Economy | Global | URPanel | 12,882 | $0.0935 | 49.5 | 777fans | $2.41 | - | - | - | - | 2 |
| RT-0083 | Shares | HQ | TW | URPanel | 11,630 | $8.93 | 55.5 | JustAnotherPanel | $11.38 | 777fans | $49.60 | HDZ Bulk | $343.75 | 7 |
| RT-0084 | Shares | Standard | Global | 777fans | 1,709 | $4.95 | 64.6 | SMMlite | $6.48 | Peakerr | $25.76 | SocialKing | $25.31 | 7 |
| RT-0085 | Shares | Standard | Targeted | JustAnotherPanel | 9,366 | $5.58 | 55.0 | URPanel | $8.93 | AutoBuyFans | $20.94 | - | - | 3 |
| RT-0086 | Traffic | Economy | Global | JustAnotherPanel | 1,517 | $0.2250 | 70.5 | HDZ Bulk | $2.03 | - | - | - | - | 2 |
| RT-0087 | Traffic | HQ | TW | JustAnotherPanel | 2,744 | $0.4375 | 79.5 | URPanel | $0.7000 | SMMlite | $0.4100 | StarAds | $5.69 | 4 |
| RT-0088 | Traffic | Standard | Global | JustAnotherPanel | 740 | $0.1750 | 70.0 | URPanel | $0.3000 | SMMlite | $0.2100 | - | - | 3 |
| RT-0089 | Traffic | Standard | Targeted | URPanel | 10,842 | $0.2235 | 72.9 | JustAnotherPanel | $0.1750 | SMMlite | $0.4100 | - | - | 3 |
| RT-0090 | Views | Economy | Global | AutoBuyFans | 291 | $0.3125 | 50.0 | FansKing | $31.25 | URPanel | $44.62 | - | - | 3 |
| RT-0091 | Views | HQ | Global | Peakerr | 29,451 | $0.0221 | 95.0 | URPanel | $44.62 | - | - | - | - | 2 |
| RT-0092 | Views | HQ | TW | FansKing | 400 | $62.50 | 65.0 | Taiwan Like | $781.25 | - | - | - | - | 2 |
| RT-0093 | Views | HQ | Targeted | URPanel | 12,099 | $44.62 | 45.0 | - | - | - | - | - | - | 1 |
| RT-0094 | Views | Premium | Global | SMMlite | 6,327 | $4.80 | 47.3 | Peakerr | $30.38 | - | - | - | - | 2 |
| RT-0095 | Views | Premium | TW | Taiwan Like | 213 | $937.50 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0096 | Views | Premium | Targeted | URPanel | 12,764 | $1,930.50 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0097 | Views | Standard | Global | JustAnotherPanel | 7,824 | $0.0875 | 68.6 | Peakerr | $0.0193 | 777fans | $0.1759 | URPanel | $0.4200 | 11 |
| RT-0098 | Views | Standard | Targeted | JustAnotherPanel | 5,708 | $1.25 | 55.0 | URPanel | $8.93 | - | - | - | - | 2 |
| RT-0099 | Votes | HQ | TW | HDZ Bulk | 585 | $4,687.50 | 65.0 | - | - | - | - | - | - | 1 |

### 2.3 YouTube

共 **54** 個路由項目，平均每項有 **3.8** 家供應商可用，其中 **10** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0609 | Accounts | Standard | Global | FansKing | 238 | $31.25 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0610 | Comments | Economy | Global | Peakerr | 30,515 | $0.5650 | 58.7 | SMMlite | $6.00 | HDZ Bulk | $118.75 | - | - | 3 |
| RT-0611 | Comments | HQ | Global | Peakerr | 19,949 | $1.99 | 57.7 | URPanel | $4.50 | JustAnotherPanel | $9.96 | - | - | 3 |
| RT-0612 | Comments | HQ | TW | StarAds | 581 | $625.00 | 61.0 | Taiwan Like | $1,093.75 | AutoBuyFans | $1,179.38 | SocialKing | $562.50 | 5 |
| RT-0613 | Comments | HQ | Targeted | JustAnotherPanel | 4,296 | $9.00 | 40.0 | - | - | - | - | - | - | 1 |
| RT-0614 | Comments | Premium | Global | Peakerr | 29,791 | $5.65 | 85.0 | - | - | - | - | - | - | 1 |
| RT-0615 | Comments | Premium | Targeted | JustAnotherPanel | 8,292 | $7.38 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0616 | Comments | Standard | Global | Peakerr | 28,748 | $5.42 | 62.8 | JustAnotherPanel | $5.23 | SMMlite | $3.60 | URPanel | $22.27 | 9 |
| RT-0617 | Comments | Standard | Targeted | JustAnotherPanel | 8,737 | $6.39 | 61.4 | URPanel | $22.27 | SMMlite | $35.00 | AutoBuyFans | $65.31 | 5 |
| RT-0618 | Followers | Bot/Low | Global | JustAnotherPanel | 2,122 | $0.0875 | 70.0 | SMMlite | $3.00 | 777fans | $2.56 | - | - | 3 |
| RT-0619 | Followers | Economy | Global | SMMlite | 6,784 | $0.1200 | 70.0 | URPanel | $0.1600 | 777fans | $0.7522 | StarAds | $14.06 | 5 |
| RT-0620 | Followers | HQ | Global | URPanel | 11,968 | $20.00 | 47.2 | Peakerr | $16.54 | - | - | - | - | 2 |
| RT-0621 | Followers | HQ | TW | AI-FANS | 443 | $50.00 | 50.0 | AutoBuyFans | $962.81 | FBigLikes | $20,088.00 | - | - | 3 |
| RT-0622 | Followers | Premium | Global | Peakerr | 27,905 | $39.44 | 71.8 | StarAds | $184.38 | - | - | - | - | 2 |
| RT-0623 | Followers | Premium | Targeted | Peakerr | 28,717 | $30.27 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0624 | Followers | Standard | Global | Peakerr | 30,507 | $0.0645 | 69.9 | JustAnotherPanel | $3.69 | URPanel | $4.95 | AutoBuyFans | $4.69 | 13 |
| RT-0625 | Followers | Standard | Targeted | JustAnotherPanel | 6,798 | $20.93 | 55.0 | - | - | - | - | - | - | 1 |
| RT-0626 | Likes | Bot/Low | Global | JustAnotherPanel | 8,661 | $0.0625 | 70.0 | 777fans | $0.6165 | - | - | - | - | 2 |
| RT-0627 | Likes | Economy | Global | SMMlite | 1,813 | $1.05 | 77.1 | Peakerr | $0.1130 | URPanel | $0.5800 | JustAnotherPanel | $0.8875 | 6 |
| RT-0628 | Likes | HQ | Global | JustAnotherPanel | 8,660 | $0.1875 | 80.6 | Peakerr | $0.1695 | SMMlite | $2.00 | URPanel | $0.7200 | 6 |
| RT-0629 | Likes | HQ | TW | URPanel | 12,698 | $0.7200 | 60.0 | AI-FANS | $109.38 | - | - | - | - | 2 |
| RT-0630 | Likes | HQ | Targeted | URPanel | 5,992 | $0.7200 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0631 | Likes | Premium | Global | Peakerr | 19,626 | $0.4068 | 80.0 | URPanel | $0.7200 | SMMlite | $0.7100 | StarAds | $34.38 | 4 |
| RT-0632 | Likes | Premium | Targeted | URPanel | 5,496 | $0.7200 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0633 | Likes | Standard | Global | Peakerr | 23,991 | $0.1582 | 76.8 | JustAnotherPanel | $0.3750 | SMMlite | $0.9600 | URPanel | $1.14 | 14 |
| RT-0634 | Likes | Standard | Targeted | JustAnotherPanel | 2,132 | $0.8750 | 63.7 | Peakerr | $1.04 | SMMlite | $5.00 | 777fans | $7.07 | 4 |
| RT-0635 | Live Viewers | Economy | Global | Peakerr | 27,376 | $0.0396 | 55.0 | HDZ Bulk | $2.75 | - | - | - | - | 2 |
| RT-0636 | Live Viewers | HQ | Global | URPanel | 12,745 | $0.4800 | 80.7 | Peakerr | $0.3616 | 777fans | $0.4485 | - | - | 3 |
| RT-0637 | Live Viewers | Premium | Global | URPanel | 12,747 | $0.5400 | 75.5 | Peakerr | $0.2260 | - | - | - | - | 2 |
| RT-0638 | Live Viewers | Standard | Global | JustAnotherPanel | 8,638 | $1.17 | 85.7 | Peakerr | $0.1130 | URPanel | $0.1931 | AutoBuyFans | $0.3125 | 10 |
| RT-0639 | Other | Economy | Global | HDZ Bulk | 438 | $3.06 | 40.0 | URPanel | $29.90 | - | - | - | - | 2 |
| RT-0640 | Other | HQ | Global | Peakerr | 30,211 | $4.43 | 85.0 | URPanel | $36.00 | - | - | - | - | 2 |
| RT-0641 | Other | Premium | Global | URPanel | 12,911 | $2.99 | 65.0 | Peakerr | $8.47 | - | - | - | - | 2 |
| RT-0642 | Other | Standard | Global | StarAds | 624 | $0.000000 | 50.0 | Peakerr | $19.66 | SMMlite | $52.80 | JustAnotherPanel | $27.49 | 5 |
| RT-0643 | Shares | Economy | Global | HDZ Bulk | 294 | $8.12 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0644 | Shares | HQ | Global | Peakerr | 2,901 | $0.7730 | 50.0 | URPanel | $1.78 | - | - | - | - | 2 |
| RT-0645 | Shares | HQ | TW | SMMlite | 4,583 | $1.32 | 70.0 | 777fans | $10.62 | HDZ Bulk | $12.50 | - | - | 3 |
| RT-0646 | Shares | HQ | Targeted | URPanel | 12,613 | $1.78 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0647 | Shares | Premium | TW | URPanel | 12,491 | $1.76 | 60.0 | StarAds | $18.59 | - | - | - | - | 2 |
| RT-0648 | Shares | Standard | Global | SMMlite | 3,246 | $0.9000 | 69.3 | JustAnotherPanel | $0.2500 | 777fans | $3.99 | Peakerr | $1.27 | 7 |
| RT-0649 | Shares | Standard | Targeted | SMMlite | 4,574 | $1.32 | 59.4 | JustAnotherPanel | $0.2500 | 777fans | $9.24 | - | - | 3 |
| RT-0650 | Traffic | Economy | Global | JustAnotherPanel | 1,515 | $0.2250 | 70.5 | HDZ Bulk | $2.03 | - | - | - | - | 2 |
| RT-0651 | Traffic | HQ | TW | JustAnotherPanel | 2,743 | $0.4375 | 79.5 | URPanel | $0.7000 | SMMlite | $0.4100 | StarAds | $5.47 | 4 |
| RT-0652 | Traffic | Standard | Global | JustAnotherPanel | 743 | $0.1750 | 65.0 | URPanel | $0.3000 | SMMlite | $0.2100 | - | - | 3 |
| RT-0653 | Traffic | Standard | Targeted | URPanel | 10,830 | $0.2235 | 72.9 | JustAnotherPanel | $0.1750 | SMMlite | $0.4100 | - | - | 3 |
| RT-0654 | Views | Bot/Low | Global | JustAnotherPanel | 5,565 | $1.91 | 65.0 | URPanel | $2.40 | - | - | - | - | 2 |
| RT-0655 | Views | Economy | Global | SMMlite | 7,339 | $0.0800 | 67.7 | AutoBuyFans | $1.25 | JustAnotherPanel | $3.50 | FBigLikes | $1,507.00 | 4 |
| RT-0656 | Views | HQ | Global | SMMlite | 6,633 | $1.60 | 88.5 | Peakerr | $1.81 | JustAnotherPanel | $0.9375 | URPanel | $2.61 | 7 |
| RT-0657 | Views | HQ | TW | JustAnotherPanel | 4,006 | $3.50 | 70.0 | StarAds | $12.47 | URPanel | $7.20 | AutoBuyFans | $7.81 | 6 |
| RT-0658 | Views | HQ | Targeted | JustAnotherPanel | 7,216 | $2.25 | 90.0 | URPanel | $4.38 | SMMlite | $3.30 | - | - | 3 |
| RT-0659 | Views | Premium | Global | SMMlite | 3,599 | $2.30 | 79.4 | Peakerr | $2.60 | JustAnotherPanel | $1.07 | URPanel | $1.50 | 5 |
| RT-0660 | Views | Premium | TW | SMMlite | 3,150 | $3.30 | 70.0 | URPanel | $4.40 | - | - | - | - | 2 |
| RT-0661 | Views | Standard | Global | JustAnotherPanel | 5,990 | $1.38 | 86.9 | SMMlite | $1.70 | Peakerr | $0.6780 | 777fans | $0.2287 | 14 |
| RT-0662 | Views | Standard | Targeted | JustAnotherPanel | 9,189 | $1.44 | 57.6 | Peakerr | $0.6780 | SMMlite | $5.90 | 777fans | $8.62 | 5 |

### 2.4 TikTok

共 **52** 個路由項目，平均每項有 **3.2** 家供應商可用，其中 **18** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0462 | Accounts | Standard | Global | FansKing | 244 | $31.25 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0463 | Comments | Economy | Global | Peakerr | 27,983 | $0.9040 | 58.2 | AI-FANS | $21.88 | HDZ Bulk | $32.81 | - | - | 3 |
| RT-0464 | Comments | HQ | Global | JustAnotherPanel | 9,402 | $1.00 | 70.6 | Peakerr | $0.9125 | - | - | - | - | 2 |
| RT-0465 | Comments | HQ | TW | AI-FANS | 439 | $1,718.75 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0466 | Comments | HQ | Targeted | URPanel | 12,810 | $39.00 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0467 | Comments | Premium | Global | Peakerr | 19,856 | $0.0678 | 40.0 | SMMlite | $0.0800 | - | - | - | - | 2 |
| RT-0468 | Comments | Standard | Global | JustAnotherPanel | 10,000 | $1.25 | 66.1 | Peakerr | $0.3390 | 777fans | $36.34 | SMMlite | $0.1500 | 7 |
| RT-0469 | Comments | Standard | Targeted | JustAnotherPanel | 3,378 | $11.25 | 59.6 | URPanel | $22.27 | 777fans | $4.84 | - | - | 3 |
| RT-0470 | Followers | Bot/Low | Global | Peakerr | 28,061 | $0.5255 | 83.8 | SMMlite | $1.67 | URPanel | $3.20 | 777fans | $5.89 | 4 |
| RT-0471 | Followers | Economy | Global | Peakerr | 29,734 | $0.1582 | 69.8 | JustAnotherPanel | $1.50 | SMMlite | $2.02 | AutoBuyFans | $0.3125 | 5 |
| RT-0472 | Followers | HQ | Global | JustAnotherPanel | 8,777 | $0.7250 | 92.2 | Peakerr | $0.1695 | URPanel | $3.74 | 777fans | $5.12 | 7 |
| RT-0473 | Followers | HQ | TW | 777fans | 2,173 | $7.94 | 77.0 | - | - | - | - | - | - | 1 |
| RT-0474 | Followers | HQ | Targeted | JustAnotherPanel | 9,591 | $1.85 | 83.6 | Peakerr | $1.36 | URPanel | $4.16 | - | - | 3 |
| RT-0475 | Followers | Premium | Global | Peakerr | 25,371 | $0.0498 | 82.5 | - | - | - | - | - | - | 1 |
| RT-0476 | Followers | Premium | Targeted | Peakerr | 26,182 | $1.33 | 92.9 | - | - | - | - | - | - | 1 |
| RT-0477 | Followers | Standard | Global | Peakerr | 29,881 | $0.8249 | 88.2 | JustAnotherPanel | $1.36 | URPanel | $0.9750 | 777fans | $9.60 | 14 |
| RT-0478 | Followers | Standard | Targeted | Peakerr | 19,682 | $2.64 | 76.3 | JustAnotherPanel | $1.39 | URPanel | $3.12 | 777fans | $1.59 | 4 |
| RT-0479 | Likes | Bot/Low | Global | Peakerr | 29,584 | $0.0136 | 86.4 | - | - | - | - | - | - | 1 |
| RT-0480 | Likes | Economy | Global | URPanel | 12,299 | $0.1600 | 78.7 | Peakerr | $0.0599 | JustAnotherPanel | $0.6950 | AI-FANS | $15.62 | 6 |
| RT-0481 | Likes | HQ | Global | JustAnotherPanel | 10,173 | $0.0825 | 91.8 | Peakerr | $0.0588 | 777fans | $0.8562 | StarAds | $11.72 | 4 |
| RT-0482 | Likes | HQ | Targeted | JustAnotherPanel | 4,268 | $0.3500 | 92.8 | URPanel | $0.1935 | Peakerr | $0.1356 | - | - | 3 |
| RT-0483 | Likes | Premium | Global | Peakerr | 29,432 | $0.0396 | 92.7 | StarAds | $18.75 | - | - | - | - | 2 |
| RT-0484 | Likes | Premium | Targeted | SMMlite | 6,446 | $0.1600 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0485 | Likes | Standard | Global | Peakerr | 29,980 | $0.0181 | 84.8 | JustAnotherPanel | $0.1450 | URPanel | $0.1800 | 777fans | $1.25 | 10 |
| RT-0486 | Likes | Standard | Targeted | Peakerr | 19,675 | $0.5650 | 81.3 | JustAnotherPanel | $0.0780 | URPanel | $0.5363 | - | - | 3 |
| RT-0487 | Live Viewers | Economy | Global | Peakerr | 24,242 | $24.86 | 60.0 | HDZ Bulk | $14.06 | - | - | - | - | 2 |
| RT-0488 | Live Viewers | HQ | Global | URPanel | 12,322 | $0.2420 | 70.0 | Peakerr | $0.6780 | - | - | - | - | 2 |
| RT-0489 | Live Viewers | Premium | Global | Peakerr | 27,386 | $0.6780 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0490 | Live Viewers | Standard | Global | URPanel | 12,609 | $0.9923 | 66.7 | Peakerr | $0.0226 | 777fans | $0.2716 | JustAnotherPanel | $6.88 | 7 |
| RT-0491 | Live Viewers | Standard | Targeted | Peakerr | 26,345 | $1.13 | 54.0 | JustAnotherPanel | $2.50 | - | - | - | - | 2 |
| RT-0492 | Other | Economy | Global | AI-FANS | 377 | $21.88 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0493 | Other | HQ | Global | Peakerr | 25,359 | $0.1356 | 61.5 | - | - | - | - | - | - | 1 |
| RT-0494 | Other | Standard | Global | JustAnotherPanel | 9,299 | $0.1625 | 63.0 | 777fans | $0.003100 | Peakerr | $0.1921 | AI-FANS | $28.12 | 6 |
| RT-0495 | Reviews | Standard | Global | GodLikes | 287 | $312.50 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0496 | Saves | Economy | Global | Peakerr | 28,135 | $0.005700 | 64.1 | - | - | - | - | - | - | 1 |
| RT-0497 | Saves | HQ | Global | Peakerr | 28,134 | $0.004600 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0498 | Saves | Standard | Global | Peakerr | 25,801 | $0.0678 | 74.6 | URPanel | $0.1200 | GodLikes | $15.62 | AI-FANS | $156.25 | 4 |
| RT-0499 | Shares | Economy | Global | Peakerr | 29,553 | $0.6667 | 75.0 | HDZ Bulk | $6.25 | - | - | - | - | 2 |
| RT-0500 | Shares | HQ | Global | Peakerr | 29,453 | $0.0147 | 88.4 | 777fans | $1.09 | - | - | - | - | 2 |
| RT-0501 | Shares | Standard | Global | URPanel | 3,820 | $0.0224 | 69.3 | JustAnotherPanel | $0.0375 | Peakerr | $0.0452 | 777fans | $2.02 | 6 |
| RT-0502 | Shares | Standard | Targeted | JustAnotherPanel | 4,375 | $3.12 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0503 | Traffic | Standard | Global | JustAnotherPanel | 9,239 | $0.2250 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0504 | Traffic | Standard | Targeted | JustAnotherPanel | 8,186 | $0.1750 | 65.0 | URPanel | $0.3000 | - | - | - | - | 2 |
| RT-0505 | Views | Bot/Low | Global | Peakerr | 28,143 | $0.0904 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0506 | Views | Economy | Global | Peakerr | 30,564 | $0.008000 | 74.7 | JustAnotherPanel | $0.008200 | URPanel | $0.2189 | HDZ Bulk | $0.5312 | 5 |
| RT-0507 | Views | HQ | Global | JustAnotherPanel | 10,161 | $0.006300 | 95.0 | Peakerr | $0.009100 | - | - | - | - | 2 |
| RT-0508 | Views | HQ | TW | JustAnotherPanel | 6,994 | $0.1563 | 46.6 | FansKing | $2.50 | GodLikes | $4.69 | - | - | 3 |
| RT-0509 | Views | HQ | Targeted | Peakerr | 25,179 | $0.0961 | 94.5 | URPanel | $0.4200 | - | - | - | - | 2 |
| RT-0510 | Views | Premium | Global | JustAnotherPanel | 3,365 | $0.0832 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0511 | Views | Premium | Targeted | Peakerr | 25,427 | $0.1243 | 65.0 | JustAnotherPanel | $0.5625 | - | - | - | - | 2 |
| RT-0512 | Views | Standard | Global | Peakerr | 27,990 | $0.0100 | 91.3 | JustAnotherPanel | $0.005000 | URPanel | $0.2475 | 777fans | $0.6300 | 11 |
| RT-0513 | Views | Standard | Targeted | Peakerr | 25,171 | $0.0848 | 88.5 | JustAnotherPanel | $0.2650 | URPanel | $0.1120 | 777fans | $4.38 | 4 |

### 2.5 Twitter/X

共 **42** 個路由項目，平均每項有 **2.8** 家供應商可用，其中 **16** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0536 | Accounts | Standard | Global | FansKing | 604 | $31.25 | 61.7 | JustAnotherPanel | $91.20 | - | - | - | - | 2 |
| RT-0537 | Comments | Economy | Global | AutoBuyFans | 357 | $47.81 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0538 | Comments | Standard | Global | SMMlite | 3,363 | $35.00 | 55.4 | JustAnotherPanel | $62.50 | URPanel | $45.00 | AutoBuyFans | $121.88 | 5 |
| RT-0539 | Comments | Standard | Targeted | SMMlite | 5,787 | $31.25 | 65.0 | URPanel | $43.23 | - | - | - | - | 2 |
| RT-0540 | Followers | Bot/Low | Global | JustAnotherPanel | 7,634 | $11.25 | 67.6 | 777fans | $78.51 | URPanel | $50.00 | - | - | 3 |
| RT-0541 | Followers | Economy | Global | SMMlite | 7,803 | $1.20 | 62.2 | AutoBuyFans | $3.12 | URPanel | $45.08 | - | - | 3 |
| RT-0542 | Followers | HQ | Global | JustAnotherPanel | 8,696 | $0.6250 | 84.1 | StarAds | $94.94 | URPanel | $9.60 | 777fans | $52.37 | 5 |
| RT-0543 | Followers | HQ | Targeted | JustAnotherPanel | 8,700 | $0.9375 | 89.4 | Peakerr | $5.40 | - | - | - | - | 2 |
| RT-0544 | Followers | Premium | Global | SMMlite | 4,965 | $11.97 | 49.4 | - | - | - | - | - | - | 1 |
| RT-0545 | Followers | Standard | Global | JustAnotherPanel | 9,329 | $1.10 | 68.5 | URPanel | $14.00 | 777fans | $4.55 | SMMlite | $3.60 | 9 |
| RT-0546 | Followers | Standard | Targeted | JustAnotherPanel | 8,699 | $0.8125 | 69.7 | Peakerr | $3.33 | URPanel | $49.52 | SMMlite | $13.20 | 5 |
| RT-0547 | Likes | Bot/Low | Global | 777fans | 8 | $61.32 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0548 | Likes | Economy | Global | URPanel | 4,624 | $4.58 | 58.8 | JustAnotherPanel | $1.25 | SMMlite | $3.75 | 777fans | $41.15 | 5 |
| RT-0549 | Likes | HQ | Global | JustAnotherPanel | 4,299 | $8.12 | 77.0 | SMMlite | $2.85 | URPanel | $4.20 | StarAds | $35.94 | 6 |
| RT-0550 | Likes | HQ | Targeted | JustAnotherPanel | 895 | $12.50 | 90.0 | - | - | - | - | - | - | 1 |
| RT-0551 | Likes | Standard | Global | JustAnotherPanel | 9,393 | $0.1125 | 66.8 | URPanel | $2.18 | SMMlite | $1.25 | Peakerr | $4.21 | 9 |
| RT-0552 | Likes | Standard | Targeted | SMMlite | 5,451 | $2.38 | 55.0 | JustAnotherPanel | $3.75 | URPanel | $9.00 | 777fans | $12.86 | 4 |
| RT-0553 | Mentions | Standard | Global | SMMlite | 7,674 | $0.000600 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0554 | Mentions | Standard | Targeted | SMMlite | 5,789 | $50.00 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0555 | Other | Bot/Low | Global | 777fans | 429 | $6.61 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0556 | Other | Standard | Global | 777fans | 440 | $0.0261 | 67.0 | Peakerr | $0.001500 | JustAnotherPanel | $0.1359 | URPanel | $0.4875 | 7 |
| RT-0557 | Packages | Standard | Global | URPanel | 981 | $300.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0558 | Reviews | Economy | Global | SMMlite | 5,476 | $14.40 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0559 | Reviews | Standard | Global | 777fans | 453 | $0.4212 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0560 | Reviews | Standard | Targeted | 777fans | 444 | $0.0282 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0561 | Shares | Economy | Global | SMMlite | 7,525 | $1.80 | 46.7 | JustAnotherPanel | $6.00 | - | - | - | - | 2 |
| RT-0562 | Shares | HQ | Global | JustAnotherPanel | 8,861 | $0.5000 | 90.0 | StarAds | $46.25 | - | - | - | - | 2 |
| RT-0563 | Shares | Standard | Global | JustAnotherPanel | 8,860 | $0.1250 | 66.3 | URPanel | $2.18 | SMMlite | $1.65 | 777fans | $80.40 | 4 |
| RT-0564 | Shares | Standard | Targeted | JustAnotherPanel | 4,300 | $9.28 | 45.9 | SMMlite | $62.50 | - | - | - | - | 2 |
| RT-0565 | Stories | Standard | Global | JustAnotherPanel | 6,738 | $3.62 | 59.1 | - | - | - | - | - | - | 1 |
| RT-0566 | Traffic | Economy | Global | JustAnotherPanel | 1,513 | $0.2250 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0567 | Traffic | HQ | TW | JustAnotherPanel | 2,746 | $0.4375 | 79.5 | URPanel | $0.7000 | SMMlite | $0.4100 | StarAds | $5.47 | 4 |
| RT-0568 | Traffic | Standard | Global | SMMlite | 7,670 | $0.000600 | 69.2 | JustAnotherPanel | $0.1750 | URPanel | $0.3000 | - | - | 3 |
| RT-0569 | Traffic | Standard | Targeted | URPanel | 10,844 | $0.2235 | 74.0 | JustAnotherPanel | $0.1750 | SMMlite | $0.4100 | - | - | 3 |
| RT-0570 | Views | Economy | Global | Peakerr | 29,862 | $0.004600 | 65.0 | HDZ Bulk | $0.5625 | - | - | - | - | 2 |
| RT-0571 | Views | HQ | Global | Peakerr | 29,859 | $0.004700 | 85.0 | JustAnotherPanel | $0.5000 | - | - | - | - | 2 |
| RT-0572 | Views | HQ | Targeted | JustAnotherPanel | 4,216 | $5.04 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0573 | Views | Premium | Global | JustAnotherPanel | 2,174 | $0.9750 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0574 | Views | Standard | Global | JustAnotherPanel | 10,042 | $0.0100 | 71.2 | SMMlite | $0.004500 | URPanel | $0.0350 | Peakerr | $0.0177 | 7 |
| RT-0575 | Views | Standard | Targeted | Peakerr | 20,894 | $0.0206 | 63.7 | JustAnotherPanel | $0.2250 | - | - | - | - | 2 |
| RT-0576 | Votes | Economy | Global | URPanel | 5,666 | $0.2113 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0577 | Votes | Standard | Global | JustAnotherPanel | 1,982 | $2.38 | 53.4 | 777fans | $0.8179 | StarAds | $115.59 | - | - | 3 |

### 2.6 Telegram

共 **43** 個路由項目，平均每項有 **2.3** 家供應商可用，其中 **21** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0395 | Accounts | HQ | TW | FBigLikes | 400 | $440.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0396 | Accounts | Standard | Global | FansKing | 599 | $109.38 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0397 | Comments | Standard | Global | JustAnotherPanel | 7,412 | $1.88 | 50.0 | URPanel | $3.00 | Peakerr | $21.26 | 777fans | $10.55 | 4 |
| RT-0398 | Comments | Standard | Targeted | JustAnotherPanel | 7,413 | $1.88 | 65.0 | 777fans | $12.83 | - | - | - | - | 2 |
| RT-0399 | Followers | Bot/Low | Global | URPanel | 12,898 | $0.4000 | 61.6 | Peakerr | $0.2279 | JustAnotherPanel | $0.5250 | - | - | 3 |
| RT-0400 | Followers | Economy | Global | Peakerr | 29,540 | $0.3390 | 73.0 | URPanel | $1.04 | SMMlite | $2.20 | AutoBuyFans | $1.56 | 5 |
| RT-0401 | Followers | HQ | Global | Peakerr | 29,541 | $0.3503 | 92.8 | - | - | - | - | - | - | 1 |
| RT-0402 | Followers | HQ | TW | Taiwan Like | 214 | $9.38 | 70.0 | AutoBuyFans | $10.00 | - | - | - | - | 2 |
| RT-0403 | Followers | HQ | Targeted | URPanel | 8,220 | $1.56 | 78.0 | JustAnotherPanel | $3.00 | SMMlite | $5.40 | - | - | 3 |
| RT-0404 | Followers | Premium | Global | JustAnotherPanel | 10,114 | $2.50 | 66.9 | Peakerr | $1.68 | URPanel | $8.37 | SMMlite | $6.00 | 4 |
| RT-0405 | Followers | Premium | Targeted | JustAnotherPanel | 9,320 | $4.50 | 45.0 | - | - | - | - | - | - | 1 |
| RT-0406 | Followers | Standard | Global | JustAnotherPanel | 7,102 | $0.0675 | 68.8 | Peakerr | $0.4123 | URPanel | $0.9900 | SMMlite | $1.05 | 4 |
| RT-0407 | Followers | Standard | Targeted | JustAnotherPanel | 7,111 | $0.7200 | 73.2 | URPanel | $0.6000 | - | - | - | - | 2 |
| RT-0408 | Likes | Economy | Global | URPanel | 12,161 | $0.0650 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0409 | Likes | Premium | Global | Peakerr | 23,361 | $0.0147 | 75.0 | URPanel | $0.0172 | - | - | - | - | 2 |
| RT-0410 | Likes | Standard | Global | JustAnotherPanel | 7,951 | $0.0275 | 62.1 | SMMlite | $0.2400 | 777fans | $0.0858 | Peakerr | $0.1441 | 7 |
| RT-0411 | Likes | Standard | Targeted | SMMlite | 5,833 | $0.2400 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0412 | Other | Bot/Low | Global | URPanel | 12,717 | $1.20 | 66.4 | Peakerr | $0.5876 | - | - | - | - | 2 |
| RT-0413 | Other | Economy | Global | 777fans | 319 | $0.0110 | 59.0 | AutoBuyFans | $1.88 | - | - | - | - | 2 |
| RT-0414 | Other | HQ | Global | StarAds | 388 | $30.47 | 60.0 | - | - | - | - | - | - | 1 |
| RT-0415 | Other | HQ | TW | 777fans | 4,278 | $5.87 | 58.0 | StarAds | $101.03 | - | - | - | - | 2 |
| RT-0416 | Other | Premium | Global | Peakerr | 28,516 | $2.71 | 69.2 | AutoBuyFans | $3.75 | StarAds | $59.38 | - | - | 3 |
| RT-0417 | Other | Premium | Targeted | URPanel | 12,339 | $6.90 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0418 | Other | Standard | Global | 777fans | 4,243 | $3.44 | 58.1 | AutoBuyFans | $0.6250 | StarAds | $19.22 | JustAnotherPanel | $27.50 | 5 |
| RT-0419 | Other | Standard | Targeted | StarAds | 139 | $31.38 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0420 | Packages | Standard | Global | 777fans | 810 | $0.2464 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0421 | Reviews | Standard | Global | 777fans | 712 | $1.94 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0422 | Shares | Bot/Low | Global | SMMlite | 5,825 | $0.2400 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0423 | Shares | HQ | TW | StarAds | 644 | $10.94 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0424 | Shares | Standard | Global | Peakerr | 16,052 | $0.0136 | 51.6 | URPanel | $0.0204 | JustAnotherPanel | $0.3125 | 777fans | $0.0749 | 5 |
| RT-0425 | Shares | Standard | Targeted | 777fans | 710 | $0.2866 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0426 | Stories | Premium | Global | Peakerr | 28,483 | $28.64 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0427 | Stories | Standard | Global | Peakerr | 28,553 | $9.17 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0428 | Views | Bot/Low | Global | Peakerr | 28,657 | $0.2116 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0429 | Views | Economy | Global | SMMlite | 5,840 | $0.0300 | 67.5 | Peakerr | $0.002300 | AutoBuyFans | $0.3125 | - | - | 3 |
| RT-0430 | Views | HQ | Global | JustAnotherPanel | 8,468 | $0.0104 | 74.7 | Peakerr | $0.0136 | - | - | - | - | 2 |
| RT-0431 | Views | HQ | TW | StarAds | 684 | $3.12 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0432 | Views | HQ | Targeted | JustAnotherPanel | 7,400 | $0.0625 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0433 | Views | Premium | Global | Peakerr | 28,478 | $0.0911 | 75.0 | - | - | - | - | - | - | 1 |
| RT-0434 | Views | Premium | Targeted | Peakerr | 15,958 | $0.0791 | 65.0 | URPanel | $0.1029 | - | - | - | - | 2 |
| RT-0435 | Views | Standard | Global | JustAnotherPanel | 7,640 | $0.0104 | 75.8 | URPanel | $0.0474 | Peakerr | $0.004600 | FansKing | $0.6250 | 9 |
| RT-0436 | Views | Standard | Targeted | URPanel | 6,336 | $0.0700 | 70.6 | Peakerr | $0.0243 | JustAnotherPanel | $0.1250 | - | - | 3 |
| RT-0437 | Votes | Standard | Global | Peakerr | 13,291 | $0.2946 | 50.0 | - | - | - | - | - | - | 1 |

### 2.7 LINE

共 **4** 個路由項目，平均每項有 **3.0** 家供應商可用，其中 **1** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0200 | Accounts | Standard | Global | AutoBuyFans | 591 | $119.06 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0201 | Followers | Economy | Global | FansKing | 562 | $78.12 | 55.0 | HDZ Bulk | $115.62 | - | - | - | - | 2 |
| RT-0202 | Followers | Standard | Global | 777fans | 4,180 | $108.62 | 48.5 | JustAnotherPanel | $43.75 | FansKing | $156.25 | AI-FANS | $265.62 | 5 |
| RT-0203 | Other | Standard | Global | GodLikes | 19 | $125.00 | 58.5 | SocialKing | $149.38 | Taiwan Like | $156.25 | StarAds | $501.34 | 4 |

### 2.8 Threads

共 **24** 個路由項目，平均每項有 **2.5** 家供應商可用，其中 **10** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0438 | Accounts | Standard | Global | FansKing | 580 | $156.25 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0439 | Comments | HQ | TW | URPanel | 12,408 | $125.00 | 70.0 | Taiwan Like | $312.50 | AutoBuyFans | $336.88 | AI-FANS | $1,875.00 | 4 |
| RT-0440 | Comments | Premium | TW | Taiwan Like | 202 | $625.00 | 65.0 | AutoBuyFans | $673.75 | - | - | - | - | 2 |
| RT-0441 | Comments | Standard | Global | URPanel | 6,157 | $13.86 | 55.3 | 777fans | $15.06 | StarAds | $281.25 | FBigLikes | $12,695.00 | 4 |
| RT-0442 | Comments | Standard | Targeted | URPanel | 12,409 | $125.00 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0443 | Followers | Economy | Global | AutoBuyFans | 72 | $6.25 | 65.0 | 777fans | $63.36 | - | - | - | - | 2 |
| RT-0444 | Followers | HQ | Global | Peakerr | 29,558 | $16.95 | 82.9 | StarAds | $109.06 | - | - | - | - | 2 |
| RT-0445 | Followers | HQ | TW | URPanel | 12,223 | $12.00 | 61.1 | Taiwan Like | $25.00 | AutoBuyFans | $26.88 | GodLikes | $93.75 | 6 |
| RT-0446 | Followers | HQ | Targeted | URPanel | 12,849 | $6.00 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0447 | Followers | Premium | Global | 777fans | 4,335 | $112.71 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0448 | Followers | Premium | TW | 777fans | 4,334 | $77.49 | 55.0 | Taiwan Like | $250.00 | AutoBuyFans | $269.69 | - | - | 3 |
| RT-0449 | Followers | Standard | Global | URPanel | 12,399 | $5.00 | 56.5 | 777fans | $10.25 | AutoBuyFans | $18.44 | AI-FANS | $250.00 | 5 |
| RT-0450 | Followers | Standard | Targeted | URPanel | 12,406 | $35.00 | 60.0 | - | - | - | - | - | - | 1 |
| RT-0451 | Likes | Economy | Global | AutoBuyFans | 70 | $1.88 | 55.0 | URPanel | $3.00 | 777fans | $8.16 | - | - | 3 |
| RT-0452 | Likes | HQ | Global | Peakerr | 29,559 | $8.47 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0453 | Likes | HQ | TW | URPanel | 12,224 | $8.00 | 64.6 | GodLikes | $31.25 | Taiwan Like | $62.50 | AutoBuyFans | $67.50 | 6 |
| RT-0454 | Likes | Premium | Global | 777fans | 4,331 | $21.78 | 50.0 | - | - | - | - | - | - | 1 |
| RT-0455 | Likes | Premium | TW | 777fans | 4,333 | $52.83 | 55.0 | Taiwan Like | $109.38 | AutoBuyFans | $117.81 | FBigLikes | $2,539.00 | 4 |
| RT-0456 | Likes | Standard | Global | 777fans | 4,326 | $5.91 | 61.1 | AI-FANS | $78.12 | StarAds | $109.38 | - | - | 3 |
| RT-0457 | Likes | Standard | Targeted | URPanel | 11,641 | $11.98 | 70.0 | - | - | - | - | - | - | 1 |
| RT-0458 | Other | Standard | Global | Taiwan Like | 220 | $15.62 | 70.0 | AutoBuyFans | $16.88 | - | - | - | - | 2 |
| RT-0459 | Reviews | Standard | Global | 777fans | 3,989 | $4,365.84 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0460 | Shares | HQ | Global | Peakerr | 29,561 | $15.82 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0461 | Shares | Standard | Global | 777fans | 3,674 | $5.72 | 57.1 | URPanel | $15.57 | StarAds | $78.12 | - | - | 3 |

### 2.9 Google

共 **15** 個路由項目，平均每項有 **2.1** 家供應商可用，其中 **7** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0100 | Accounts | Standard | Global | FBigLikes | 720 | $14,000.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0101 | Followers | Standard | Global | 777fans | 2,573 | $4.97 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0102 | Other | Standard | Global | StarAds | 188 | $612.50 | 70.2 | FansKing | $156.25 | JustAnotherPanel | $315.00 | - | - | 3 |
| RT-0103 | Reviews | HQ | TW | AutoBuyFans | 564 | $3,369.38 | 65.0 | StarAds | $8,906.25 | - | - | - | - | 2 |
| RT-0104 | Reviews | Premium | TW | Taiwan Like | 209 | $3,125.00 | 55.0 | AutoBuyFans | $3,369.38 | FBigLikes | $117,180.00 | - | - | 3 |
| RT-0105 | Reviews | Standard | Targeted | AutoBuyFans | 141 | $7,640.62 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0106 | Traffic | Economy | Global | JustAnotherPanel | 2,358 | $0.1750 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0107 | Traffic | HQ | Global | JustAnotherPanel | 1,826 | $0.2970 | 75.0 | 777fans | $76.28 | - | - | - | - | 2 |
| RT-0108 | Traffic | HQ | TW | JustAnotherPanel | 1,198 | $0.1750 | 65.0 | SMMlite | $0.4100 | URPanel | $0.7000 | 777fans | $4.12 | 4 |
| RT-0109 | Traffic | Premium | Global | URPanel | 11,962 | $0.3750 | 80.0 | - | - | - | - | - | - | 1 |
| RT-0110 | Traffic | Standard | Global | JustAnotherPanel | 1,191 | $0.1750 | 77.2 | URPanel | $0.2477 | Peakerr | $0.2147 | SMMlite | $0.4100 | 5 |
| RT-0111 | Traffic | Standard | Targeted | JustAnotherPanel | 1,474 | $0.1750 | 79.8 | URPanel | $0.2235 | SMMlite | $0.4100 | 777fans | $4.53 | 4 |
| RT-0112 | Views | HQ | TW | FansKing | 416 | $9.38 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0113 | Views | Standard | Global | FansKing | 493 | $4.69 | 65.0 | SMMlite | $5,000.00 | - | - | - | - | 2 |
| RT-0114 | Views | Standard | Targeted | SMMlite | 5,458 | $2,109.24 | 51.0 | - | - | - | - | - | - | 1 |

### 2.10 Google Maps

共 **4** 個路由項目，平均每項有 **1.0** 家供應商可用，其中 **4** 項為單一供應商（高風險）。

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主ID | 主價格/K | 主評分 | 備選1 | 備1價格 | 備選2 | 備2價格 | 備選3 | 備3價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: | :--- | ---: | :--- | ---: | :--- | ---: | ---: |
| RT-0115 | Packages | Standard | Global | JustAnotherPanel | 6,256 | $15,000.00 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0116 | Reviews | HQ | TW | HDZ Bulk | 565 | $7,812.50 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0117 | Reviews | Standard | Global | 777fans | 813 | $11,241.98 | 65.0 | - | - | - | - | - | - | 1 |
| RT-0118 | Shares | Standard | Global | SMMlite | 1,905 | $110.00 | 70.0 | - | - | - | - | - | - | 1 |

---

## 3. 其他平台路由表

以下為非重點平台的路由表，採用精簡格式呈現。

### Apple Music (7 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0001 | Followers | Standard | Global | 777fans | $114.33 | - | - | 1 |
| RT-0002 | Other | Standard | Global | 777fans | $14.19 | - | - | 1 |
| RT-0003 | Reviews | Standard | Global | 777fans | $767.22 | - | - | 1 |
| RT-0004 | Reviews | Standard | Targeted | JustAnotherPanel | $937.50 | - | - | 1 |
| RT-0005 | Views | Premium | Global | JustAnotherPanel | $6.24 | - | - | 1 |
| RT-0006 | Views | Premium | Targeted | JustAnotherPanel | $6.24 | - | - | 1 |
| RT-0007 | Views | Standard | Global | 777fans | $25.15 | - | - | 1 |

### Clubhouse (8 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0008 | Followers | HQ | Global | JustAnotherPanel | $2.50 | - | - | 1 |
| RT-0009 | Followers | Standard | Global | 777fans | $0.9091 | JustAnotherPanel | $2.19 | 3 |
| RT-0010 | Followers | Standard | Targeted | SMMlite | $12.94 | JustAnotherPanel | $13.20 | 2 |
| RT-0011 | Live Viewers | Standard | Targeted | SMMlite | $0.5400 | - | - | 1 |
| RT-0012 | Other | Standard | Targeted | JustAnotherPanel | $0.5400 | - | - | 1 |
| RT-0013 | Traffic | HQ | Global | JustAnotherPanel | $3.60 | - | - | 1 |
| RT-0014 | Traffic | Standard | Global | JustAnotherPanel | $13.80 | - | - | 1 |
| RT-0015 | Traffic | Standard | Targeted | JustAnotherPanel | $28.80 | - | - | 1 |

### Crypto/NFT (14 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0016 | Followers | HQ | Global | JustAnotherPanel | $2.00 | - | - | 1 |
| RT-0017 | Followers | Standard | Global | JustAnotherPanel | $1.24 | - | - | 1 |
| RT-0018 | Likes | Standard | Global | JustAnotherPanel | $1.06 | - | - | 1 |
| RT-0019 | Other | HQ | Global | JustAnotherPanel | $12.50 | - | - | 1 |
| RT-0020 | Other | Standard | Global | JustAnotherPanel | $16.88 | - | - | 1 |
| RT-0021 | Other | Standard | Targeted | JustAnotherPanel | $998.75 | - | - | 1 |
| RT-0022 | Shares | Standard | Global | JustAnotherPanel | $25.00 | - | - | 1 |
| RT-0023 | Traffic | HQ | TW | URPanel | $1.31 | - | - | 1 |
| RT-0024 | Traffic | Standard | Global | URPanel | $0.7275 | - | - | 1 |
| RT-0025 | Traffic | Standard | Targeted | URPanel | $1.31 | - | - | 1 |
| RT-0026 | Views | HQ | Global | JustAnotherPanel | $50.00 | - | - | 1 |
| RT-0027 | Views | Standard | Global | JustAnotherPanel | $1.00 | - | - | 1 |
| RT-0028 | Votes | HQ | Global | JustAnotherPanel | $13.75 | - | - | 1 |
| RT-0029 | Votes | Standard | Global | JustAnotherPanel | $27.50 | - | - | 1 |

### Dcard (7 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0030 | Accounts | Standard | Global | AutoBuyFans | $6,250.00 | FBigLikes | $290,000.00 | 2 |
| RT-0031 | Accounts | Standard | Targeted | FBigLikes | $300,000.00 | - | - | 1 |
| RT-0032 | Comments | Standard | Global | AutoBuyFans | $2,312.50 | Taiwan Like | $2,500.00 | 3 |
| RT-0033 | Likes | Premium | Global | FBigLikes | $25,000.00 | - | - | 1 |
| RT-0034 | Likes | Standard | Global | Taiwan Like | $781.25 | AutoBuyFans | $656.25 | 4 |
| RT-0035 | Other | Standard | Global | AutoBuyFans | $4,687.50 | - | - | 1 |
| RT-0036 | Saves | Standard | Global | Taiwan Like | $781.25 | - | - | 1 |

### Deezer (2 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0037 | Followers | Standard | Global | JustAnotherPanel | $0.6250 | - | - | 1 |
| RT-0038 | Likes | Standard | Global | JustAnotherPanel | $0.6250 | - | - | 1 |

### Discord (5 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0039 | Accounts | Standard | Global | FansKing | $31.25 | - | - | 1 |
| RT-0040 | Followers | HQ | Global | SMMlite | $4.08 | - | - | 1 |
| RT-0041 | Followers | Standard | Global | SMMlite | $5.52 | JustAnotherPanel | $5.63 | 3 |
| RT-0042 | Other | Standard | Global | 777fans | $3.18 | JustAnotherPanel | $16.20 | 4 |
| RT-0043 | Packages | Standard | Global | AutoBuyFans | $33.44 | FBigLikes | $2,799.00 | 2 |

### LinkedIn (19 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0204 | Comments | Standard | Global | JustAnotherPanel | $24.77 | URPanel | $73.55 | 2 |
| RT-0205 | Comments | Standard | Targeted | URPanel | $33.41 | AutoBuyFans | $76.56 | 3 |
| RT-0206 | Followers | HQ | Global | JustAnotherPanel | $50.00 | - | - | 1 |
| RT-0207 | Followers | Standard | Global | SMMlite | $9.29 | JustAnotherPanel | $24.70 | 6 |
| RT-0208 | Likes | Economy | Global | Peakerr | $12.88 | - | - | 1 |
| RT-0209 | Likes | HQ | Global | Peakerr | $28.80 | - | - | 1 |
| RT-0210 | Likes | Standard | Global | JustAnotherPanel | $14.37 | URPanel | $14.96 | 5 |
| RT-0211 | Other | HQ | Global | JustAnotherPanel | $120.00 | - | - | 1 |
| RT-0212 | Other | Standard | Global | JustAnotherPanel | $12.92 | AutoBuyFans | $42.50 | 5 |
| RT-0213 | Other | Standard | Targeted | JustAnotherPanel | $125.00 | - | - | 1 |
| RT-0214 | Reviews | Standard | Global | HDZ Bulk | $312.50 | - | - | 1 |
| RT-0215 | Shares | HQ | Global | Peakerr | $38.77 | - | - | 1 |
| RT-0216 | Shares | Standard | Global | JustAnotherPanel | $25.01 | SMMlite | $144.00 | 2 |
| RT-0217 | Traffic | Economy | Global | JustAnotherPanel | $0.4375 | - | - | 1 |
| RT-0218 | Traffic | HQ | TW | JustAnotherPanel | $0.4375 | SMMlite | $0.4100 | 3 |
| RT-0219 | Traffic | Standard | Global | JustAnotherPanel | $0.1750 | URPanel | $0.3000 | 3 |
| RT-0220 | Traffic | Standard | Targeted | URPanel | $0.2235 | JustAnotherPanel | $0.1750 | 3 |
| RT-0221 | Views | Standard | Global | URPanel | $4.80 | JustAnotherPanel | $7.50 | 4 |
| RT-0222 | Votes | Standard | Global | HDZ Bulk | $125.00 | - | - | 1 |

### Other (50 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0223 | Accounts | Premium | Global | FBigLikes | $400.00 | - | - | 1 |
| RT-0224 | Accounts | Standard | Global | SMMRush | $10.00 | FBigLikes | $75.00 | 2 |
| RT-0225 | Comments | Economy | Global | 777fans | $77.07 | - | - | 1 |
| RT-0226 | Comments | HQ | TW | FBigLikes | $3,955.00 | - | - | 1 |
| RT-0227 | Comments | Premium | Global | JustAnotherPanel | $93.75 | - | - | 1 |
| RT-0228 | Comments | Premium | TW | FBigLikes | $3,348.00 | - | - | 1 |
| RT-0229 | Comments | Standard | Global | SMMlite | $11.28 | JustAnotherPanel | $3.75 | 5 |
| RT-0230 | Comments | Standard | Targeted | JustAnotherPanel | $2.08 | URPanel | $4.50 | 2 |
| RT-0231 | Followers | Bot/Low | Global | Peakerr | $0.3503 | - | - | 1 |
| RT-0232 | Followers | Economy | Global | SMMlite | $0.6000 | JustAnotherPanel | $4.00 | 3 |
| RT-0233 | Followers | HQ | Global | Peakerr | $0.4859 | URPanel | $4.19 | 3 |
| RT-0234 | Followers | HQ | TW | FBigLikes | $879.00 | - | - | 1 |
| RT-0235 | Followers | HQ | Targeted | JustAnotherPanel | $0.6500 | Peakerr | $3.62 | 4 |
| RT-0236 | Followers | Premium | Global | Peakerr | $6.78 | FBigLikes | $30.00 | 2 |
| RT-0237 | Followers | Premium | TW | FBigLikes | $5,870.00 | - | - | 1 |
| RT-0238 | Followers | Standard | Global | Peakerr | $1.64 | SMMlite | $1.55 | 8 |
| RT-0239 | Followers | Standard | Targeted | Peakerr | $1.41 | URPanel | $1.97 | 5 |
| RT-0240 | Likes | Economy | Global | JustAnotherPanel | $0.5204 | FBigLikes | $8.00 | 3 |
| RT-0241 | Likes | HQ | TW | FBigLikes | $279.00 | - | - | 1 |
| RT-0242 | Likes | Premium | Global | JustAnotherPanel | $43.75 | - | - | 1 |
| RT-0243 | Likes | Standard | Global | SMMlite | $1.55 | JustAnotherPanel | $0.7050 | 7 |
| RT-0244 | Likes | Standard | Targeted | JustAnotherPanel | $0.4250 | Peakerr | $0.4746 | 4 |
| RT-0245 | Live Viewers | Economy | Global | JustAnotherPanel | $2.36 | - | - | 1 |
| RT-0246 | Live Viewers | Standard | Global | JustAnotherPanel | $0.1500 | 777fans | $72.83 | 4 |
| RT-0247 | Live Viewers | Standard | Targeted | JustAnotherPanel | $1.52 | 777fans | $75.84 | 2 |
| RT-0248 | Other | Bot/Low | Global | FBigLikes | $1,600.00 | - | - | 1 |
| RT-0249 | Other | HQ | Global | JustAnotherPanel | $3.12 | - | - | 1 |
| RT-0250 | Other | HQ | TW | AutoBuyFans | $175.31 | - | - | 1 |
| RT-0251 | Other | HQ | Targeted | JustAnotherPanel | $6.00 | - | - | 1 |
| RT-0252 | Other | Premium | Global | FBigLikes | $50,000.00 | - | - | 1 |
| RT-0253 | Other | Standard | Global | JustAnotherPanel | $3.12 | URPanel | $1.20 | 11 |
| RT-0254 | Other | Standard | Targeted | URPanel | $1.97 | JustAnotherPanel | $87.50 | 3 |
| RT-0255 | Packages | HQ | TW | FBigLikes | $30.00 | - | - | 1 |
| RT-0256 | Packages | Standard | Global | FBigLikes | $30.00 | JustAnotherPanel | $87.50 | 3 |
| RT-0257 | Reviews | HQ | TW | FBigLikes | $195,000.00 | - | - | 1 |
| RT-0258 | Reviews | Standard | Global | 777fans | $17.12 | - | - | 1 |
| RT-0259 | Reviews | Standard | Targeted | SMMlite | $4.20 | JustAnotherPanel | $187.50 | 3 |
| RT-0260 | Saves | HQ | Global | JustAnotherPanel | $43.75 | - | - | 1 |
| RT-0261 | Shares | Premium | Global | SMMlite | $7.20 | - | - | 1 |
| RT-0262 | Shares | Standard | Global | 777fans | $2.42 | SMMlite | $0.9400 | 4 |
| RT-0263 | Shares | Standard | Targeted | JustAnotherPanel | $0.6500 | URPanel | $2.00 | 2 |
| RT-0264 | Stories | Standard | Global | FBigLikes | $5,000.00 | - | - | 1 |
| RT-0265 | Views | Economy | Global | SMMlite | $0.0700 | 777fans | $2.60 | 2 |
| RT-0266 | Views | HQ | Global | JustAnotherPanel | $0.7500 | URPanel | $1.40 | 2 |
| RT-0267 | Views | HQ | Targeted | JustAnotherPanel | $0.006500 | URPanel | $4,455.00 | 2 |
| RT-0268 | Views | Premium | Global | FBigLikes | $100.00 | - | - | 1 |
| RT-0269 | Views | Standard | Global | JustAnotherPanel | $0.0313 | SMMlite | $0.4200 | 5 |
| RT-0270 | Views | Standard | Targeted | URPanel | $0.1125 | Peakerr | $0.2034 | 4 |
| RT-0271 | Votes | HQ | TW | HDZ Bulk | $1,562.50 | - | - | 1 |
| RT-0272 | Votes | Standard | Global | JustAnotherPanel | $0.6250 | - | - | 1 |

### Pinterest (8 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0273 | Followers | HQ | Global | StarAds | $23.44 | - | - | 1 |
| RT-0274 | Followers | Standard | Global | URPanel | $3.00 | AutoBuyFans | $7.50 | 4 |
| RT-0275 | Likes | Standard | Global | JustAnotherPanel | $2.50 | URPanel | $3.00 | 2 |
| RT-0276 | Other | Standard | Global | JustAnotherPanel | $2.50 | URPanel | $3.60 | 3 |
| RT-0277 | Traffic | Economy | Global | JustAnotherPanel | $0.4375 | - | - | 1 |
| RT-0278 | Traffic | HQ | TW | SMMlite | $0.4100 | JustAnotherPanel | $0.4375 | 2 |
| RT-0279 | Traffic | Standard | Global | JustAnotherPanel | $0.1750 | SMMlite | $0.2100 | 2 |
| RT-0280 | Traffic | Standard | Targeted | JustAnotherPanel | $0.1750 | SMMlite | $0.4100 | 2 |

### Quora (13 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0281 | Followers | Economy | Global | SMMlite | $1.68 | - | - | 1 |
| RT-0282 | Followers | Standard | Global | JustAnotherPanel | $1.81 | 777fans | $75.32 | 2 |
| RT-0283 | Likes | Standard | Global | 777fans | $23.25 | - | - | 1 |
| RT-0284 | Other | Standard | Global | 777fans | $1.52 | JustAnotherPanel | $1,875.00 | 3 |
| RT-0285 | Reviews | Standard | Global | SMMlite | $1.68 | - | - | 1 |
| RT-0286 | Shares | Standard | Global | SMMlite | $1.68 | JustAnotherPanel | $1.81 | 2 |
| RT-0287 | Traffic | Economy | Global | JustAnotherPanel | $0.2250 | - | - | 1 |
| RT-0288 | Traffic | HQ | TW | JustAnotherPanel | $0.4375 | SMMlite | $0.4100 | 3 |
| RT-0289 | Traffic | Standard | Global | JustAnotherPanel | $0.1750 | URPanel | $0.3000 | 3 |
| RT-0290 | Traffic | Standard | Targeted | URPanel | $0.2235 | JustAnotherPanel | $0.1750 | 3 |
| RT-0291 | Views | Standard | Global | SMMlite | $0.2100 | JustAnotherPanel | $0.3125 | 3 |
| RT-0292 | Views | Standard | Targeted | URPanel | $0.2875 | SMMlite | $0.3000 | 2 |
| RT-0293 | Votes | Standard | Global | JustAnotherPanel | $1.81 | - | - | 1 |

### Reddit (10 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0294 | Followers | HQ | Global | JustAnotherPanel | $4.00 | - | - | 1 |
| RT-0295 | Followers | Standard | Global | JustAnotherPanel | $1.00 | 777fans | $11.15 | 2 |
| RT-0296 | Likes | Standard | Global | 777fans | $174.80 | - | - | 1 |
| RT-0297 | Other | Standard | Global | StarAds | $312.47 | - | - | 1 |
| RT-0298 | Traffic | Economy | Global | JustAnotherPanel | $0.1750 | - | - | 1 |
| RT-0299 | Traffic | HQ | TW | SMMlite | $0.4100 | JustAnotherPanel | $0.4375 | 2 |
| RT-0300 | Traffic | Standard | Global | JustAnotherPanel | $0.1750 | URPanel | $0.3000 | 3 |
| RT-0301 | Traffic | Standard | Targeted | URPanel | $0.2235 | JustAnotherPanel | $0.1750 | 3 |
| RT-0302 | Votes | Economy | Global | JustAnotherPanel | $35.00 | - | - | 1 |
| RT-0303 | Votes | Standard | Global | JustAnotherPanel | $4.38 | - | - | 1 |

### Shazam (3 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0304 | Shares | Standard | Global | SMMlite | $1.80 | - | - | 1 |
| RT-0305 | Views | Standard | Global | JustAnotherPanel | $1.25 | - | - | 1 |
| RT-0306 | Views | Standard | Targeted | JustAnotherPanel | $1.25 | - | - | 1 |

### Shopee (11 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0307 | Followers | HQ | TW | FBigLikes | $3,000.00 | - | - | 1 |
| RT-0308 | Followers | Standard | Global | HDZ Bulk | $9.06 | FansKing | $156.25 | 3 |
| RT-0309 | Likes | Standard | Global | StarAds | $78.25 | - | - | 1 |
| RT-0310 | Live Viewers | Economy | Global | HDZ Bulk | $11.25 | - | - | 1 |
| RT-0311 | Live Viewers | Standard | Global | GodLikes | $62.50 | StarAds | $152.12 | 3 |
| RT-0312 | Live Viewers | Standard | Targeted | 777fans | $11.04 | - | - | 1 |
| RT-0313 | Traffic | Economy | Global | JustAnotherPanel | $0.4375 | - | - | 1 |
| RT-0314 | Traffic | HQ | TW | JustAnotherPanel | $0.4375 | StarAds | $8.09 | 2 |
| RT-0315 | Traffic | Standard | Targeted | JustAnotherPanel | $0.4375 | - | - | 1 |
| RT-0316 | Views | HQ | TW | 777fans | $88.35 | - | - | 1 |
| RT-0317 | Views | Standard | Global | JustAnotherPanel | $5.25 | - | - | 1 |

### Snapchat (31 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0318 | Comments | Premium | Global | SMMlite | $61.25 | - | - | 1 |
| RT-0319 | Comments | Premium | Targeted | SMMlite | $61.05 | - | - | 1 |
| RT-0320 | Followers | Economy | Global | SMMlite | $10.92 | 777fans | $152.11 | 2 |
| RT-0321 | Followers | Premium | Global | SMMlite | $178.80 | - | - | 1 |
| RT-0322 | Followers | Standard | Global | SMMlite | $3.44 | 777fans | $19.47 | 3 |
| RT-0323 | Followers | Standard | Targeted | SMMlite | $3.44 | JustAnotherPanel | $18.50 | 3 |
| RT-0324 | Likes | Economy | Global | SMMlite | $46.54 | 777fans | $152.11 | 2 |
| RT-0325 | Likes | Premium | Global | SMMlite | $42.19 | - | - | 1 |
| RT-0326 | Likes | Premium | Targeted | SMMlite | $45.94 | - | - | 1 |
| RT-0327 | Likes | Standard | Global | 777fans | $152.11 | - | - | 1 |
| RT-0328 | Likes | Standard | Targeted | 777fans | $152.11 | - | - | 1 |
| RT-0329 | Other | Economy | Global | SMMlite | $45.43 | - | - | 1 |
| RT-0330 | Other | Premium | Global | SMMlite | $54.90 | - | - | 1 |
| RT-0331 | Other | Premium | Targeted | SMMlite | $58.04 | - | - | 1 |
| RT-0332 | Other | Standard | Global | JustAnotherPanel | $3.50 | 777fans | $152.11 | 2 |
| RT-0333 | Other | Standard | Targeted | JustAnotherPanel | $3.94 | - | - | 1 |
| RT-0334 | Reviews | Standard | Global | 777fans | $152.11 | - | - | 1 |
| RT-0335 | Reviews | Standard | Targeted | 777fans | $152.11 | - | - | 1 |
| RT-0336 | Saves | Premium | Global | SMMlite | $64.33 | - | - | 1 |
| RT-0337 | Saves | Premium | Targeted | SMMlite | $71.25 | - | - | 1 |
| RT-0338 | Saves | Standard | Global | 777fans | $152.11 | - | - | 1 |
| RT-0339 | Saves | Standard | Targeted | 777fans | $152.11 | - | - | 1 |
| RT-0340 | Shares | Premium | Global | SMMlite | $38.29 | - | - | 1 |
| RT-0341 | Shares | Premium | Targeted | SMMlite | $44.68 | - | - | 1 |
| RT-0342 | Shares | Standard | Global | 777fans | $152.11 | - | - | 1 |
| RT-0343 | Shares | Standard | Targeted | 777fans | $152.11 | - | - | 1 |
| RT-0344 | Views | Economy | Global | SMMlite | $31.70 | 777fans | $152.11 | 2 |
| RT-0345 | Views | Premium | Global | SMMlite | $38.73 | - | - | 1 |
| RT-0346 | Views | Premium | Targeted | SMMlite | $39.20 | - | - | 1 |
| RT-0347 | Views | Standard | Global | JustAnotherPanel | $3.08 | 777fans | $243.36 | 2 |
| RT-0348 | Views | Standard | Targeted | JustAnotherPanel | $2.87 | 777fans | $152.11 | 2 |

### SoundCloud (13 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0349 | Comments | Standard | Global | JustAnotherPanel | $9.00 | SMMlite | $150.00 | 3 |
| RT-0350 | Followers | HQ | Targeted | JustAnotherPanel | $5.71 | - | - | 1 |
| RT-0351 | Followers | Standard | Global | JustAnotherPanel | $1.40 | 777fans | $13.64 | 2 |
| RT-0352 | Followers | Standard | Targeted | JustAnotherPanel | $10.00 | - | - | 1 |
| RT-0353 | Likes | Standard | Global | JustAnotherPanel | $8.75 | 777fans | $14.03 | 2 |
| RT-0354 | Likes | Standard | Targeted | JustAnotherPanel | $10.00 | - | - | 1 |
| RT-0355 | Other | Standard | Global | 777fans | $5.61 | StarAds | $312.47 | 2 |
| RT-0356 | Reviews | Standard | Global | 777fans | $145.24 | - | - | 1 |
| RT-0357 | Shares | Economy | Global | JustAnotherPanel | $11.69 | - | - | 1 |
| RT-0358 | Shares | Standard | Global | JustAnotherPanel | $11.00 | 777fans | $107.15 | 2 |
| RT-0359 | Shares | Standard | Targeted | JustAnotherPanel | $10.00 | - | - | 1 |
| RT-0360 | Views | Standard | Global | JustAnotherPanel | $0.2813 | 777fans | $0.9352 | 2 |
| RT-0361 | Views | Standard | Targeted | JustAnotherPanel | $1.88 | - | - | 1 |

### Spotify (24 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0362 | Followers | Economy | Global | URPanel | $2.40 | - | - | 1 |
| RT-0363 | Followers | HQ | Global | JustAnotherPanel | $2.50 | FansKing | $4.69 | 2 |
| RT-0364 | Followers | Premium | Global | JustAnotherPanel | $0.5645 | StarAds | $19.72 | 2 |
| RT-0365 | Followers | Standard | Global | URPanel | $0.7917 | JustAnotherPanel | $0.2125 | 5 |
| RT-0366 | Followers | Standard | Targeted | JustAnotherPanel | $0.2750 | URPanel | $0.9744 | 2 |
| RT-0367 | Other | Economy | Global | URPanel | $1.51 | HDZ Bulk | $9.69 | 2 |
| RT-0368 | Other | HQ | Global | URPanel | $2.11 | 777fans | $50.83 | 2 |
| RT-0369 | Other | Standard | Global | JustAnotherPanel | $3.20 | 777fans | $2.12 | 6 |
| RT-0370 | Other | Standard | Targeted | JustAnotherPanel | $1.05 | URPanel | $1.84 | 2 |
| RT-0371 | Packages | HQ | Global | JustAnotherPanel | $4.03 | - | - | 1 |
| RT-0372 | Packages | Standard | Global | URPanel | $8.06 | - | - | 1 |
| RT-0373 | Saves | Premium | Targeted | JustAnotherPanel | $0.3125 | URPanel | $0.5000 | 2 |
| RT-0374 | Saves | Standard | Global | JustAnotherPanel | $0.2319 | URPanel | $0.3125 | 3 |
| RT-0375 | Saves | Standard | Targeted | JustAnotherPanel | $0.2722 | URPanel | $11.00 | 2 |
| RT-0376 | Shares | Premium | Global | SMMlite | $1.50 | - | - | 1 |
| RT-0377 | Shares | Standard | Global | SMMlite | $1.60 | - | - | 1 |
| RT-0378 | Traffic | Standard | Global | StarAds | $36.75 | - | - | 1 |
| RT-0379 | Views | Economy | Global | JustAnotherPanel | $0.2375 | URPanel | $0.7644 | 2 |
| RT-0380 | Views | HQ | Global | JustAnotherPanel | $1.20 | URPanel | $5.60 | 3 |
| RT-0381 | Views | HQ | Targeted | JustAnotherPanel | $1.20 | URPanel | $1.92 | 2 |
| RT-0382 | Views | Premium | Global | JustAnotherPanel | $0.4725 | URPanel | $0.2940 | 5 |
| RT-0383 | Views | Premium | Targeted | URPanel | $0.1500 | JustAnotherPanel | $0.4725 | 2 |
| RT-0384 | Views | Standard | Global | JustAnotherPanel | $0.2415 | URPanel | $0.3850 | 7 |
| RT-0385 | Views | Standard | Targeted | JustAnotherPanel | $0.3150 | URPanel | $0.6804 | 3 |

### Taiwan Forums (9 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0386 | Accounts | Premium | TW | AutoBuyFans | $11,375.00 | - | - | 1 |
| RT-0387 | Comments | HQ | TW | HDZ Bulk | $2,187.50 | - | - | 1 |
| RT-0388 | Comments | Premium | TW | AutoBuyFans | $3,281.25 | FBigLikes | $45,000.00 | 2 |
| RT-0389 | Comments | Standard | Global | AutoBuyFans | $2,812.50 | - | - | 1 |
| RT-0390 | Followers | HQ | TW | HDZ Bulk | $2,500.00 | - | - | 1 |
| RT-0391 | Likes | HQ | TW | HDZ Bulk | $1,250.00 | - | - | 1 |
| RT-0392 | Other | Standard | Global | AutoBuyFans | $9,375.00 | Taiwan Like | $56,250.00 | 2 |
| RT-0393 | Posts | HQ | TW | HDZ Bulk | $6,093.75 | - | - | 1 |
| RT-0394 | Posts | Standard | Global | HDZ Bulk | $312,500.00 | - | - | 1 |

### Tumblr (7 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0514 | Followers | Standard | Global | JustAnotherPanel | $7.00 | URPanel | $11.26 | 3 |
| RT-0515 | Likes | Standard | Global | JustAnotherPanel | $7.00 | URPanel | $9.99 | 3 |
| RT-0516 | Other | Standard | Global | JustAnotherPanel | $6.50 | URPanel | $11.48 | 4 |
| RT-0517 | Traffic | Economy | Global | JustAnotherPanel | $0.4375 | - | - | 1 |
| RT-0518 | Traffic | HQ | TW | SMMlite | $0.4100 | JustAnotherPanel | $0.4375 | 2 |
| RT-0519 | Traffic | Standard | Global | JustAnotherPanel | $0.3375 | SMMlite | $0.3200 | 3 |
| RT-0520 | Traffic | Standard | Targeted | JustAnotherPanel | $0.1750 | SMMlite | $0.4100 | 2 |

### Twitch (15 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0521 | Accounts | Standard | Global | FansKing | $31.25 | - | - | 1 |
| RT-0522 | Followers | Economy | Global | URPanel | $0.2501 | - | - | 1 |
| RT-0523 | Followers | HQ | Global | URPanel | $4.80 | FansKing | $21.88 | 2 |
| RT-0524 | Followers | Standard | Global | JustAnotherPanel | $0.1625 | URPanel | $0.3080 | 11 |
| RT-0525 | Live Viewers | Economy | Global | HDZ Bulk | $4.38 | - | - | 1 |
| RT-0526 | Live Viewers | Standard | Global | Peakerr | $1.99 | URPanel | $0.6921 | 3 |
| RT-0527 | Other | Bot/Low | Global | SMMlite | $1.56 | - | - | 1 |
| RT-0528 | Other | Standard | Global | AutoBuyFans | $0.6250 | - | - | 1 |
| RT-0529 | Traffic | Economy | Global | JustAnotherPanel | $0.4375 | HDZ Bulk | $2.03 | 2 |
| RT-0530 | Traffic | HQ | TW | SMMlite | $0.4100 | JustAnotherPanel | $0.4375 | 2 |
| RT-0531 | Traffic | Standard | Global | JustAnotherPanel | $0.1750 | URPanel | $0.3000 | 3 |
| RT-0532 | Traffic | Standard | Targeted | SMMlite | $0.4100 | JustAnotherPanel | $0.4200 | 2 |
| RT-0533 | Views | Economy | Global | URPanel | $76.61 | - | - | 1 |
| RT-0534 | Views | Standard | Global | JustAnotherPanel | $0.4219 | URPanel | $1.00 | 6 |
| RT-0535 | Views | Standard | Targeted | JustAnotherPanel | $0.7000 | URPanel | $0.9100 | 2 |

### Vimeo (6 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0578 | Followers | HQ | Global | JustAnotherPanel | $3.38 | - | - | 1 |
| RT-0579 | Followers | Standard | Global | JustAnotherPanel | $3.75 | 777fans | $44.99 | 2 |
| RT-0580 | Likes | HQ | Global | JustAnotherPanel | $3.38 | - | - | 1 |
| RT-0581 | Likes | Standard | Global | JustAnotherPanel | $3.75 | 777fans | $59.68 | 2 |
| RT-0582 | Other | Standard | Global | StarAds | $312.47 | - | - | 1 |
| RT-0583 | Views | Standard | Global | JustAnotherPanel | $0.6000 | 777fans | $9.55 | 2 |

### Website Traffic (14 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0584 | Followers | HQ | Global | FansKing | $78.12 | - | - | 1 |
| RT-0585 | Followers | Standard | Global | FansKing | $9.38 | StarAds | $43.03 | 2 |
| RT-0586 | Likes | Standard | Global | StarAds | $29.97 | - | - | 1 |
| RT-0587 | Live Viewers | HQ | Global | 777fans | $5.13 | - | - | 1 |
| RT-0588 | Reviews | Standard | Global | FansKing | $468.75 | - | - | 1 |
| RT-0589 | Reviews | Standard | Targeted | SMMlite | $0.4100 | - | - | 1 |
| RT-0590 | Traffic | Economy | Global | URPanel | $0.2825 | JustAnotherPanel | $0.4375 | 3 |
| RT-0591 | Traffic | HQ | TW | JustAnotherPanel | $0.4375 | SMMlite | $0.4100 | 5 |
| RT-0592 | Traffic | Premium | Global | JustAnotherPanel | $0.2813 | URPanel | $2.62 | 2 |
| RT-0593 | Traffic | Premium | TW | StarAds | $6.72 | - | - | 1 |
| RT-0594 | Traffic | Premium | Targeted | URPanel | $2.62 | - | - | 1 |
| RT-0595 | Traffic | Standard | Global | URPanel | $0.1746 | JustAnotherPanel | $0.2250 | 10 |
| RT-0596 | Traffic | Standard | Targeted | URPanel | $0.2235 | JustAnotherPanel | $0.1750 | 3 |
| RT-0597 | Views | Standard | Global | FBigLikes | $2.00 | - | - | 1 |

### Xiaohongshu (11 項)

| 路由ID | 服務類型 | 品質 | 地區 | 主供應商 | 主價格/K | 備選1 | 備1價格 | 供應商數 |
| :--- | :--- | :--- | :--- | :--- | ---: | :--- | ---: | ---: |
| RT-0598 | Accounts | Standard | Global | FBigLikes | $14,648.00 | - | - | 1 |
| RT-0599 | Followers | HQ | TW | Taiwan Like | $250.00 | AutoBuyFans | $269.69 | 3 |
| RT-0600 | Followers | Standard | Global | AutoBuyFans | $140.62 | AI-FANS | $250.00 | 4 |
| RT-0601 | Likes | HQ | TW | Taiwan Like | $109.38 | AutoBuyFans | $117.81 | 2 |
| RT-0602 | Likes | Standard | Global | AI-FANS | $203.12 | FBigLikes | $5,127.00 | 2 |
| RT-0603 | Reviews | HQ | TW | Taiwan Like | $375.00 | - | - | 1 |
| RT-0604 | Reviews | Standard | Global | FBigLikes | $17,577.00 | - | - | 1 |
| RT-0605 | Saves | HQ | TW | Taiwan Like | $312.50 | AutoBuyFans | $336.88 | 2 |
| RT-0606 | Saves | Standard | Global | AI-FANS | $203.12 | - | - | 1 |
| RT-0607 | Views | HQ | TW | Taiwan Like | $4.06 | AutoBuyFans | $4.38 | 2 |
| RT-0608 | Views | Standard | Global | FBigLikes | $191.00 | - | - | 1 |

---

## 4. 自動故障轉移機制設計

### 4.1 系統架構流程圖

以下流程圖描述用戶下單後，系統如何自動選擇供應商並處理失敗情境：

```
用戶下單（前端顯示「處理中」）
  │
  ▼
┌──────────────────────────────────────┐
│ Step 1: 解析訂單                      │
│ → 匹配標準化服務 Key                   │
│   (平台 × 服務類型 × 品質 × 地區)       │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│ Step 2: 查詢路由表                    │
│ → 取得排序後的供應商列表               │
│   [主供應商, 備選1, 備選2, ..., 備選5] │
└─────────────────┬────────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ 遍歷供應商列表 │◄──────────────────┐
          └───────┬───────┘                    │
                  │                            │
                  ▼                            │
┌──────────────────────────────────────┐       │
│ Step 3: 前置檢查                      │       │
│ ① 熔斷器是否開啟？ → 跳過             │       │
│ ② 健康度 < 70%？   → 跳過             │       │
│ ③ 訂購量在 min~max 範圍內？ → 否則跳過 │       │
│ ④ 備選成本 > 主供應商 3 倍？ → 跳過    │       │
└─────────────────┬────────────────────┘       │
                  │ 通過                        │
                  ▼                            │
┌──────────────────────────────────────┐       │
│ Step 4: 向供應商 API 下單             │       │
└─────────────────┬────────────────────┘       │
            ┌─────┴─────┐                      │
            │  成功？    │                      │
            └─────┬─────┘                      │
           是 ╱     ╲ 否                       │
            ╱         ╲                        │
           ▼           ▼                       │
  ┌──────────────┐  ┌────────────────────┐     │
  │ 記錄訂單資訊  │  │ 記錄失敗原因        │     │
  │ 狀態: 處理中  │  │ 更新健康指標        │     │
  │ 返回成功     │  │ 還有下一個供應商？   │─是──┘
  └──────────────┘  └────────┬───────────┘
                             │ 否
                             ▼
                   ┌──────────────────┐
                   │ 全部失敗          │
                   │ → 標記「需人工處理」│
                   │ → 通知管理員       │
                   │ → 前端仍顯示處理中 │
                   └──────────────────┘
```

### 4.2 核心路由虛擬碼

```python
import logging
from datetime import datetime, timedelta
from typing import List, Optional

# ═══════════════════════════════════════════
# 配置常數
# ═══════════════════════════════════════════
MAX_RETRY = 6                    # 主供應商 + 5 個備選
HEALTH_THRESHOLD = 0.70          # 成功率低於 70% 視為不健康
COOLDOWN_MINUTES = 30            # 熔斷後冷卻時間
CIRCUIT_BREAKER_FAILURES = 5     # 連續失敗 N 次觸發熔斷
MAX_COST_MULTIPLIER = 3.0        # 備選成本不超過主供應商的 N 倍
MIN_PROFIT_MARGIN = 0.20         # 最低利潤率保護


class OrderRouter:
    """SMM 訂單智能路由器"""

    def __init__(self, routing_table, health_db, supplier_api_clients):
        self.routing_table = routing_table
        self.health_db = health_db
        self.api_clients = supplier_api_clients

    def route_order(self, order) -> "OrderResult":
        """
        主路由入口：接收用戶訂單，自動選擇最佳供應商下單。
        
        Parameters:
            order: 包含 platform, service_type, quality_tier, region,
                   quantity, target_link, selling_price 等欄位
        Returns:
            OrderResult: 包含 success, supplier, cost, errors 等
        """
        # ── Step 1: 匹配標準化服務 Key ──
        service_key = self.match_service_key(
            platform=order.platform,
            service_type=order.service_type,
            quality=order.quality_tier,
            region=order.region
        )
        if not service_key:
            return self._handle_no_route(order, "無匹配的路由項目")

        # ── Step 2: 取得供應商排序列表 ──
        suppliers = self.routing_table.get_ranked_suppliers(service_key)
        primary_rate = suppliers[0]["rate_usd"] if suppliers else None

        # ── Step 3~4: 依序嘗試每個供應商 ──
        errors = []
        for attempt, sup in enumerate(suppliers[:MAX_RETRY], 1):
            supplier_name = sup["supplier"]
            service_id = sup["service_id"]

            # ── 前置檢查 ──
            skip_reason = self._pre_check(sup, order, primary_rate)
            if skip_reason:
                errors.append({"supplier": supplier_name, "reason": skip_reason})
                logging.info(f"[跳過] {supplier_name}: {skip_reason}")
                continue

            # ── 嘗試下單 ──
            try:
                client = self.api_clients[supplier_name]
                result = client.create_order(
                    service=service_id,
                    link=order.target_link,
                    quantity=order.quantity
                )

                if result.success:
                    self.health_db.record_success(supplier_name)
                    cost = sup["rate_usd"] * order.quantity / 1000
                    order.update(
                        status="processing",
                        supplier=supplier_name,
                        supplier_order_id=result.order_id,
                        cost_usd=cost,
                        attempt_count=attempt,
                        routed_at=datetime.utcnow()
                    )
                    logging.info(
                        f"[成功] 訂單 {order.id} → {supplier_name} "
                        f"(嘗試 #{attempt}, 成本 ${cost:.4f})"
                    )
                    return OrderResult(success=True, order=order)
                else:
                    self.health_db.record_failure(supplier_name, result.error_code)
                    errors.append({
                        "supplier": supplier_name,
                        "reason": "api_error",
                        "code": result.error_code,
                        "msg": result.error_message
                    })

            except (ConnectionError, TimeoutError) as e:
                self.health_db.record_failure(supplier_name, type(e).__name__)
                errors.append({
                    "supplier": supplier_name,
                    "reason": type(e).__name__,
                    "detail": str(e)
                })

            except Exception as e:
                self.health_db.record_failure(supplier_name, "unknown")
                errors.append({
                    "supplier": supplier_name,
                    "reason": "unknown_error",
                    "detail": str(e)
                })
                logging.exception(f"[未知錯誤] {supplier_name}")

        # ── 全部失敗 ──
        return self._handle_all_failed(order, errors)

    def _pre_check(self, sup, order, primary_rate) -> Optional[str]:
        """前置檢查，返回跳過原因或 None"""
        name = sup["supplier"]
        health = self.health_db.get_health(name)

        if health.is_circuit_open:
            return f"熔斷中 (冷卻至 {health.cooldown_until})"
        if health.success_rate < HEALTH_THRESHOLD:
            return f"健康度不足 ({health.success_rate:.0%})"
        if order.quantity < sup["min"]:
            return f"低於最小訂購量 ({sup['min']})"
        if order.quantity > sup["max"]:
            return f"超過最大訂購量 ({sup['max']})"
        if primary_rate and sup["rate_usd"] > primary_rate * MAX_COST_MULTIPLIER:
            return f"成本過高 (${sup['rate_usd']:.2f} > {MAX_COST_MULTIPLIER}x)"

        # 利潤率保護
        cost = sup["rate_usd"] * order.quantity / 1000
        if order.selling_price > 0:
            margin = (order.selling_price - cost) / order.selling_price
            if margin < MIN_PROFIT_MARGIN:
                return f"利潤率不足 ({margin:.0%} < {MIN_PROFIT_MARGIN:.0%})"

        return None

    def _handle_all_failed(self, order, errors):
        """所有供應商失敗 → 人工處理"""
        order.update(status="manual_review", error_log=errors)
        self.notify_admin(
            subject=f"[緊急] 訂單 {order.id} 全部供應商失敗",
            body=f"服務Key: {order.service_key}\n錯誤記錄: {errors}"
        )
        logging.critical(f"[全部失敗] 訂單 {order.id}")
        return OrderResult(success=False, errors=errors)
```

### 4.3 錯誤類型與處理策略

| 錯誤類型 | 錯誤碼 | 處理策略 | 計入健康度 | 重試間隔 |
| :--- | :--- | :--- | :---: | :--- |
| API 回傳業務錯誤 | `api_error` | 記錄錯誤碼，立即切換下一個供應商 | ✓ | 0s |
| 連線逾時 | `TimeoutError` | 等待後切換下一個供應商 | ✓ | 5s |
| 連線失敗 | `ConnectionError` | 立即切換下一個供應商 | ✓ | 0s |
| 庫存不足 | `out_of_stock` | 切換下一個，暫時標記該服務不可用 | ✓ | 0s |
| 服務已下架 | `service_disabled` | 切換下一個，從路由表移除該服務 | ✓ | 0s |
| 訂購量超出範圍 | `quantity_mismatch` | 跳過（前置檢查階段） | ✗ | 0s |
| 供應商餘額不足 | `insufficient_balance` | 切換下一個，通知管理員充值 | ✓ | 0s |
| 成本超過限制 | `cost_exceeded` | 跳過（前置檢查階段） | ✗ | 0s |
| 利潤率不足 | `margin_too_low` | 跳過（前置檢查階段） | ✗ | 0s |
| 未知錯誤 | `unknown` | 記錄完整堆疊，切換下一個 | ✓ | 0s |

### 4.4 熔斷器機制 (Circuit Breaker Pattern)

為避免持續向故障供應商發送無效請求，系統對每個供應商維護獨立的熔斷器：

| 狀態 | 觸發條件 | 行為 |
| :--- | :--- | :--- |
| **Closed（正常）** | 預設狀態，或 Half-Open 探測成功 | 所有請求正常通過 |
| **Open（熔斷）** | 連續失敗 ≥ 5 次 | 拒絕所有請求，進入 30 分鐘冷卻期 |
| **Half-Open（半開）** | 冷卻期結束 | 允許 1 個探測請求：成功 → Closed，失敗 → 重新 Open |

熔斷器的冷卻時間建議採用**指數退避**策略：第一次熔斷 30 分鐘，第二次 60 分鐘，第三次 120 分鐘，以此類推，最長不超過 24 小時。

---

## 5. 供應商健康度監控建議

### 5.1 核心監控指標

| 指標 | 計算方式 | 預警閾值 | 觸發動作 |
| :--- | :--- | :--- | :--- |
| **即時成功率** | 過去 1 小時成功 / 總請求 | < 70% | 降低路由優先級 |
| **API 回應時間** | 過去 1 小時 P95 回應時間 | > 10 秒 | 標記為慢速 |
| **訂單完成率** | 過去 24 小時已完成 / 已下單 | < 80% | 降低評分權重 |
| **平均完成時間** | 從下單到完成的中位數時間 | 依服務類型 | 用於排名微調 |
| **退款率** | 過去 7 天退款 / 總訂單 | > 10% | 暫停該供應商 |
| **留存率（掉粉率）** | 完成後 7 天的實際留存 | < 70% | 降低品質評分 |
| **帳戶餘額** | 即時查詢供應商 API | < $50 | 通知管理員充值 |

### 5.2 動態評分調整

路由表中的靜態綜合評分應根據即時健康數據進行動態調整。建議的調整公式如下：

```python
def dynamic_score(base_score: float, health: HealthMetrics) -> float:
    """
    動態調整供應商評分
    base_score: 路由表中的靜態綜合評分 (0~100)
    health: 即時健康指標
    返回: 調整後的評分
    """
    score = base_score

    # 成功率因子 (±20%)
    score *= (0.8 + 0.4 * health.success_rate)

    # 完成率因子 (±15%)
    score *= (0.85 + 0.3 * health.completion_rate)

    # 速度獎懲
    if health.p95_response_time < 3:      # 快速
        score *= 1.05
    elif health.p95_response_time > 15:   # 過慢
        score *= 0.90

    # 留存率懲罰
    if health.retention_rate < 0.7:
        score *= 0.75

    # 退款率懲罰
    if health.refund_rate > 0.1:
        score *= 0.5

    return max(0, score)
```

### 5.3 建議的監控儀表板欄位

| 欄位 | 資料來源 | 更新頻率 |
| :--- | :--- | :--- |
| 供應商名稱 | 靜態配置 | - |
| 當前狀態（正常/降級/熔斷） | 熔斷器狀態 | 即時 |
| 1h 成功率 | 訂單日誌 | 每分鐘 |
| 24h 完成率 | 訂單狀態回查 | 每 5 分鐘 |
| P95 回應時間 | API 呼叫日誌 | 每分鐘 |
| 今日訂單量 | 訂單日誌 | 即時 |
| 今日花費 (USD) | 訂單日誌 | 即時 |
| 帳戶餘額 (USD) | 供應商 API | 每 15 分鐘 |
| 7d 退款率 | 退款記錄 | 每小時 |
| 最後成功時間 | 訂單日誌 | 即時 |

---

## 6. 風險分析

### 6.1 供應商覆蓋度分佈

以下統計每條路由規則可用的供應商數量分佈，供應商數量越少，單點故障風險越高。

| 可用供應商數 | 路由項目數 | 佔比 | 風險等級 |
| :---: | ---: | ---: | :--- |
| 1 | 285 | 43.1% | 🔴 高風險 |
| 2 | 138 | 20.8% | 🟡 中風險 |
| 3 | 89 | 13.4% | 🟢 低風險 |
| 4 | 45 | 6.8% | 🟢 低風險 |
| 5 | 35 | 5.3% | 🟢 極低風險 |
| 6 | 20 | 3.0% | 🟢 極低風險 |
| 7 | 15 | 2.3% | 🟢 極低風險 |
| 8 | 8 | 1.2% | 🟢 極低風險 |
| 9 | 6 | 0.9% | 🟢 極低風險 |
| 10 | 6 | 0.9% | 🟢 極低風險 |
| 11 | 6 | 0.9% | 🟢 極低風險 |
| 12 | 1 | 0.2% | 🟢 極低風險 |
| 13 | 2 | 0.3% | 🟢 極低風險 |
| 14 | 6 | 0.9% | 🟢 極低風險 |

### 6.2 重點平台高風險項目（僅 1 家供應商）

以下路由項目僅有單一供應商，該供應商一旦故障，服務將完全中斷。**建議優先為這些項目尋找替代供應商或建立降級方案。**

| 路由ID | 平台 | 服務類型 | 品質 | 地區 | 唯一供應商 | 價格/K | 建議 |
| :--- | :--- | :--- | :--- | :--- | :--- | ---: | :--- |
| RT-0044 | Facebook | Accounts | HQ | TW | AutoBuyFans | $7,031.25 | 尋找同類替代服務 |
| RT-0046 | Facebook | Accounts | Standard | Targeted | FBigLikes | $7,000.00 | 尋找同類替代服務 |
| RT-0054 | Facebook | Followers | Bot/Low | Global | Peakerr | $1.29 | 嘗試從其他國際面板找替代 |
| RT-0059 | Facebook | Followers | Premium | Global | StarAds | $46.88 | 尋找同類替代服務 |
| RT-0063 | Facebook | Likes | Bot/Low | Global | 777fans | $2.39 | 尋找同類替代服務 |
| RT-0068 | Facebook | Likes | Premium | Global | Peakerr | $0.0999 | 嘗試從其他國際面板找替代 |
| RT-0073 | Facebook | Live Viewers | Premium | Global | 777fans | $3.12 | 尋找同類替代服務 |
| RT-0075 | Facebook | Other | Economy | Global | AI-FANS | $109.38 | 台灣獨家服務，建議保留並監控 |
| RT-0079 | Facebook | Packages | HQ | TW | HDZ Bulk | $312,500.00 | 台灣獨家服務，建議保留並監控 |
| RT-0081 | Facebook | Reviews | Standard | Global | 777fans | $114.49 | 尋找同類替代服務 |
| RT-0093 | Facebook | Views | HQ | Targeted | URPanel | $44.62 | 嘗試從其他國際面板找替代 |
| RT-0095 | Facebook | Views | Premium | TW | Taiwan Like | $937.50 | 台灣獨家服務，建議保留並監控 |
| RT-0096 | Facebook | Views | Premium | Targeted | URPanel | $1,930.50 | 嘗試從其他國際面板找替代 |
| RT-0099 | Facebook | Votes | HQ | TW | HDZ Bulk | $4,687.50 | 台灣獨家服務，建議保留並監控 |
| RT-0100 | Google | Accounts | Standard | Global | FBigLikes | $14,000.00 | 尋找同類替代服務 |
| RT-0101 | Google | Followers | Standard | Global | 777fans | $4.97 | 尋找同類替代服務 |
| RT-0105 | Google | Reviews | Standard | Targeted | AutoBuyFans | $7,640.62 | 尋找同類替代服務 |
| RT-0106 | Google | Traffic | Economy | Global | JustAnotherPanel | $0.1750 | 嘗試從其他國際面板找替代 |
| RT-0109 | Google | Traffic | Premium | Global | URPanel | $0.3750 | 嘗試從其他國際面板找替代 |
| RT-0112 | Google | Views | HQ | TW | FansKing | $9.38 | 尋找同類替代服務 |
| RT-0114 | Google | Views | Standard | Targeted | SMMlite | $2,109.24 | 嘗試從其他國際面板找替代 |
| RT-0115 | Google Maps | Packages | Standard | Global | JustAnotherPanel | $15,000.00 | 嘗試從其他國際面板找替代 |
| RT-0116 | Google Maps | Reviews | HQ | TW | HDZ Bulk | $7,812.50 | 台灣獨家服務，建議保留並監控 |
| RT-0117 | Google Maps | Reviews | Standard | Global | 777fans | $11,241.98 | 尋找同類替代服務 |
| RT-0118 | Google Maps | Shares | Standard | Global | SMMlite | $110.00 | 嘗試從其他國際面板找替代 |
| RT-0119 | Instagram | Accounts | HQ | Global | Peakerr | $70.62 | 嘗試從其他國際面板找替代 |
| RT-0120 | Instagram | Accounts | HQ | Targeted | Peakerr | $70.62 | 嘗試從其他國際面板找替代 |
| RT-0122 | Instagram | Comments | Bot/Low | Global | SMMlite | $0.0300 | 嘗試從其他國際面板找替代 |
| RT-0152 | Instagram | Live Viewers | Economy | Global | 777fans | $0.6923 | 尋找同類替代服務 |
| RT-0154 | Instagram | Mentions | Economy | Global | SMMlite | $0.009900 | 嘗試從其他國際面板找替代 |
| RT-0155 | Instagram | Mentions | HQ | Global | SMMlite | $60.00 | 嘗試從其他國際面板找替代 |
| RT-0156 | Instagram | Mentions | HQ | TW | SMMlite | $0.4100 | 嘗試從其他國際面板找替代 |
| RT-0157 | Instagram | Mentions | HQ | Targeted | SMMlite | $60.00 | 嘗試從其他國際面板找替代 |
| RT-0158 | Instagram | Mentions | Standard | Global | SMMlite | $0.2000 | 嘗試從其他國際面板找替代 |
| RT-0159 | Instagram | Mentions | Standard | Targeted | SMMlite | $0.4100 | 嘗試從其他國際面板找替代 |
| RT-0160 | Instagram | Other | Bot/Low | Global | 777fans | $2.38 | 尋找同類替代服務 |
| RT-0162 | Instagram | Other | HQ | Global | StarAds | $23.69 | 尋找同類替代服務 |
| RT-0163 | Instagram | Other | HQ | TW | StarAds | $28.12 | 尋找同類替代服務 |
| RT-0164 | Instagram | Other | HQ | Targeted | StarAds | $184.06 | 尋找同類替代服務 |
| RT-0165 | Instagram | Other | Premium | Global | StarAds | $52.50 | 尋找同類替代服務 |
| RT-0166 | Instagram | Other | Premium | TW | StarAds | $117.19 | 尋找同類替代服務 |
| RT-0169 | Instagram | Packages | Standard | Targeted | JustAnotherPanel | $12.50 | 嘗試從其他國際面板找替代 |
| RT-0171 | Instagram | Saves | Economy | Global | SMMlite | $0.003200 | 嘗試從其他國際面板找替代 |
| RT-0172 | Instagram | Saves | HQ | Global | Peakerr | $0.1554 | 嘗試從其他國際面板找替代 |
| RT-0174 | Instagram | Saves | Standard | Targeted | SMMlite | $0.1000 | 嘗試從其他國際面板找替代 |
| RT-0175 | Instagram | Shares | Bot/Low | Global | SMMlite | $1.20 | 嘗試從其他國際面板找替代 |
| RT-0183 | Instagram | Traffic | HQ | Global | Peakerr | $0.0814 | 嘗試從其他國際面板找替代 |
| RT-0196 | Instagram | Votes | HQ | Global | SMMlite | $0.8300 | 嘗試從其他國際面板找替代 |
| RT-0197 | Instagram | Votes | HQ | TW | SMMlite | $3.00 | 嘗試從其他國際面板找替代 |
| RT-0199 | Instagram | Votes | Standard | Targeted | SMMlite | $3.00 | 嘗試從其他國際面板找替代 |
| RT-0200 | LINE | Accounts | Standard | Global | AutoBuyFans | $119.06 | 尋找同類替代服務 |
| RT-0395 | Telegram | Accounts | HQ | TW | FBigLikes | $440.00 | 尋找同類替代服務 |
| RT-0396 | Telegram | Accounts | Standard | Global | FansKing | $109.38 | 尋找同類替代服務 |
| RT-0401 | Telegram | Followers | HQ | Global | Peakerr | $0.3503 | 嘗試從其他國際面板找替代 |
| RT-0405 | Telegram | Followers | Premium | Targeted | JustAnotherPanel | $4.50 | 嘗試從其他國際面板找替代 |
| RT-0408 | Telegram | Likes | Economy | Global | URPanel | $0.0650 | 嘗試從其他國際面板找替代 |
| RT-0411 | Telegram | Likes | Standard | Targeted | SMMlite | $0.2400 | 嘗試從其他國際面板找替代 |
| RT-0414 | Telegram | Other | HQ | Global | StarAds | $30.47 | 尋找同類替代服務 |
| RT-0417 | Telegram | Other | Premium | Targeted | URPanel | $6.90 | 嘗試從其他國際面板找替代 |
| RT-0419 | Telegram | Other | Standard | Targeted | StarAds | $31.38 | 尋找同類替代服務 |
| RT-0420 | Telegram | Packages | Standard | Global | 777fans | $0.2464 | 尋找同類替代服務 |
| RT-0421 | Telegram | Reviews | Standard | Global | 777fans | $1.94 | 尋找同類替代服務 |
| RT-0422 | Telegram | Shares | Bot/Low | Global | SMMlite | $0.2400 | 嘗試從其他國際面板找替代 |
| RT-0423 | Telegram | Shares | HQ | TW | StarAds | $10.94 | 尋找同類替代服務 |
| RT-0425 | Telegram | Shares | Standard | Targeted | 777fans | $0.2866 | 尋找同類替代服務 |
| RT-0426 | Telegram | Stories | Premium | Global | Peakerr | $28.64 | 嘗試從其他國際面板找替代 |
| RT-0427 | Telegram | Stories | Standard | Global | Peakerr | $9.17 | 嘗試從其他國際面板找替代 |
| RT-0428 | Telegram | Views | Bot/Low | Global | Peakerr | $0.2116 | 嘗試從其他國際面板找替代 |
| RT-0431 | Telegram | Views | HQ | TW | StarAds | $3.12 | 尋找同類替代服務 |
| RT-0432 | Telegram | Views | HQ | Targeted | JustAnotherPanel | $0.0625 | 嘗試從其他國際面板找替代 |
| RT-0433 | Telegram | Views | Premium | Global | Peakerr | $0.0911 | 嘗試從其他國際面板找替代 |
| RT-0437 | Telegram | Votes | Standard | Global | Peakerr | $0.2946 | 嘗試從其他國際面板找替代 |
| RT-0438 | Threads | Accounts | Standard | Global | FansKing | $156.25 | 尋找同類替代服務 |
| RT-0442 | Threads | Comments | Standard | Targeted | URPanel | $125.00 | 嘗試從其他國際面板找替代 |
| RT-0446 | Threads | Followers | HQ | Targeted | URPanel | $6.00 | 嘗試從其他國際面板找替代 |
| RT-0447 | Threads | Followers | Premium | Global | 777fans | $112.71 | 尋找同類替代服務 |
| RT-0450 | Threads | Followers | Standard | Targeted | URPanel | $35.00 | 嘗試從其他國際面板找替代 |
| RT-0452 | Threads | Likes | HQ | Global | Peakerr | $8.47 | 嘗試從其他國際面板找替代 |
| RT-0454 | Threads | Likes | Premium | Global | 777fans | $21.78 | 尋找同類替代服務 |
| RT-0457 | Threads | Likes | Standard | Targeted | URPanel | $11.98 | 嘗試從其他國際面板找替代 |
| RT-0459 | Threads | Reviews | Standard | Global | 777fans | $4,365.84 | 尋找同類替代服務 |
| RT-0460 | Threads | Shares | HQ | Global | Peakerr | $15.82 | 嘗試從其他國際面板找替代 |
| RT-0462 | TikTok | Accounts | Standard | Global | FansKing | $31.25 | 尋找同類替代服務 |
| RT-0465 | TikTok | Comments | HQ | TW | AI-FANS | $1,718.75 | 台灣獨家服務，建議保留並監控 |
| RT-0466 | TikTok | Comments | HQ | Targeted | URPanel | $39.00 | 嘗試從其他國際面板找替代 |
| RT-0473 | TikTok | Followers | HQ | TW | 777fans | $7.94 | 尋找同類替代服務 |
| RT-0475 | TikTok | Followers | Premium | Global | Peakerr | $0.0498 | 嘗試從其他國際面板找替代 |
| RT-0476 | TikTok | Followers | Premium | Targeted | Peakerr | $1.33 | 嘗試從其他國際面板找替代 |
| RT-0479 | TikTok | Likes | Bot/Low | Global | Peakerr | $0.0136 | 嘗試從其他國際面板找替代 |
| RT-0484 | TikTok | Likes | Premium | Targeted | SMMlite | $0.1600 | 嘗試從其他國際面板找替代 |
| RT-0489 | TikTok | Live Viewers | Premium | Global | Peakerr | $0.6780 | 嘗試從其他國際面板找替代 |
| RT-0492 | TikTok | Other | Economy | Global | AI-FANS | $21.88 | 台灣獨家服務，建議保留並監控 |
| RT-0493 | TikTok | Other | HQ | Global | Peakerr | $0.1356 | 嘗試從其他國際面板找替代 |
| RT-0495 | TikTok | Reviews | Standard | Global | GodLikes | $312.50 | 台灣獨家服務，建議保留並監控 |
| RT-0496 | TikTok | Saves | Economy | Global | Peakerr | $0.005700 | 嘗試從其他國際面板找替代 |
| RT-0497 | TikTok | Saves | HQ | Global | Peakerr | $0.004600 | 嘗試從其他國際面板找替代 |
| RT-0502 | TikTok | Shares | Standard | Targeted | JustAnotherPanel | $3.12 | 嘗試從其他國際面板找替代 |
| RT-0503 | TikTok | Traffic | Standard | Global | JustAnotherPanel | $0.2250 | 嘗試從其他國際面板找替代 |
| RT-0505 | TikTok | Views | Bot/Low | Global | Peakerr | $0.0904 | 嘗試從其他國際面板找替代 |
| RT-0510 | TikTok | Views | Premium | Global | JustAnotherPanel | $0.0832 | 嘗試從其他國際面板找替代 |
| RT-0537 | Twitter/X | Comments | Economy | Global | AutoBuyFans | $47.81 | 尋找同類替代服務 |
| RT-0544 | Twitter/X | Followers | Premium | Global | SMMlite | $11.97 | 嘗試從其他國際面板找替代 |
| RT-0547 | Twitter/X | Likes | Bot/Low | Global | 777fans | $61.32 | 尋找同類替代服務 |
| RT-0550 | Twitter/X | Likes | HQ | Targeted | JustAnotherPanel | $12.50 | 嘗試從其他國際面板找替代 |
| RT-0553 | Twitter/X | Mentions | Standard | Global | SMMlite | $0.000600 | 嘗試從其他國際面板找替代 |
| RT-0554 | Twitter/X | Mentions | Standard | Targeted | SMMlite | $50.00 | 嘗試從其他國際面板找替代 |
| RT-0555 | Twitter/X | Other | Bot/Low | Global | 777fans | $6.61 | 尋找同類替代服務 |
| RT-0557 | Twitter/X | Packages | Standard | Global | URPanel | $300.00 | 嘗試從其他國際面板找替代 |
| RT-0558 | Twitter/X | Reviews | Economy | Global | SMMlite | $14.40 | 嘗試從其他國際面板找替代 |
| RT-0559 | Twitter/X | Reviews | Standard | Global | 777fans | $0.4212 | 尋找同類替代服務 |
| RT-0560 | Twitter/X | Reviews | Standard | Targeted | 777fans | $0.0282 | 尋找同類替代服務 |
| RT-0565 | Twitter/X | Stories | Standard | Global | JustAnotherPanel | $3.62 | 嘗試從其他國際面板找替代 |
| RT-0566 | Twitter/X | Traffic | Economy | Global | JustAnotherPanel | $0.2250 | 嘗試從其他國際面板找替代 |
| RT-0572 | Twitter/X | Views | HQ | Targeted | JustAnotherPanel | $5.04 | 嘗試從其他國際面板找替代 |
| RT-0573 | Twitter/X | Views | Premium | Global | JustAnotherPanel | $0.9750 | 嘗試從其他國際面板找替代 |
| RT-0576 | Twitter/X | Votes | Economy | Global | URPanel | $0.2113 | 嘗試從其他國際面板找替代 |
| RT-0609 | YouTube | Accounts | Standard | Global | FansKing | $31.25 | 尋找同類替代服務 |
| RT-0613 | YouTube | Comments | HQ | Targeted | JustAnotherPanel | $9.00 | 嘗試從其他國際面板找替代 |
| RT-0614 | YouTube | Comments | Premium | Global | Peakerr | $5.65 | 嘗試從其他國際面板找替代 |
| RT-0615 | YouTube | Comments | Premium | Targeted | JustAnotherPanel | $7.38 | 嘗試從其他國際面板找替代 |
| RT-0623 | YouTube | Followers | Premium | Targeted | Peakerr | $30.27 | 嘗試從其他國際面板找替代 |
| RT-0625 | YouTube | Followers | Standard | Targeted | JustAnotherPanel | $20.93 | 嘗試從其他國際面板找替代 |
| RT-0630 | YouTube | Likes | HQ | Targeted | URPanel | $0.7200 | 嘗試從其他國際面板找替代 |
| RT-0632 | YouTube | Likes | Premium | Targeted | URPanel | $0.7200 | 嘗試從其他國際面板找替代 |
| RT-0643 | YouTube | Shares | Economy | Global | HDZ Bulk | $8.12 | 台灣獨家服務，建議保留並監控 |
| RT-0646 | YouTube | Shares | HQ | Targeted | URPanel | $1.78 | 嘗試從其他國際面板找替代 |

### 6.3 重點平台中風險項目（僅 2 家供應商）

| 路由ID | 平台 | 服務類型 | 品質 | 地區 | 主供應商 | 備選1 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RT-0048 | Facebook | Comments | HQ | Global | JustAnotherPanel | URPanel |
| RT-0050 | Facebook | Comments | HQ | Targeted | URPanel | Peakerr |
| RT-0051 | Facebook | Comments | Premium | TW | SocialKing | Taiwan Like |
| RT-0067 | Facebook | Likes | HQ | Targeted | Peakerr | URPanel |
| RT-0078 | Facebook | Other | Standard | Targeted | URPanel | JustAnotherPanel |
| RT-0080 | Facebook | Reviews | HQ | TW | 777fans | SocialKing |
| RT-0082 | Facebook | Shares | Economy | Global | URPanel | 777fans |
| RT-0086 | Facebook | Traffic | Economy | Global | JustAnotherPanel | HDZ Bulk |
| RT-0091 | Facebook | Views | HQ | Global | Peakerr | URPanel |
| RT-0092 | Facebook | Views | HQ | TW | FansKing | Taiwan Like |
| RT-0094 | Facebook | Views | Premium | Global | SMMlite | Peakerr |
| RT-0098 | Facebook | Views | Standard | Targeted | JustAnotherPanel | URPanel |
| RT-0103 | Google | Reviews | HQ | TW | AutoBuyFans | StarAds |
| RT-0107 | Google | Traffic | HQ | Global | JustAnotherPanel | 777fans |
| RT-0113 | Google | Views | Standard | Global | FansKing | SMMlite |
| RT-0128 | Instagram | Comments | Premium | TW | Taiwan Like | AutoBuyFans |
| RT-0148 | Instagram | Likes | Premium | TW | Taiwan Like | AutoBuyFans |
| RT-0161 | Instagram | Other | Economy | Global | AutoBuyFans | 777fans |
| RT-0168 | Instagram | Packages | Standard | Global | 777fans | JustAnotherPanel |
| RT-0170 | Instagram | Reviews | Standard | Global | SMMlite | 777fans |
| RT-0177 | Instagram | Shares | HQ | Global | Peakerr | SMMlite |
| RT-0178 | Instagram | Shares | Premium | Global | Peakerr | SMMlite |
| RT-0180 | Instagram | Shares | Standard | Targeted | JustAnotherPanel | SMMlite |
| RT-0191 | Instagram | Views | Premium | Global | SMMlite | JustAnotherPanel |
| RT-0192 | Instagram | Views | Premium | Targeted | SMMlite | JustAnotherPanel |
| RT-0195 | Instagram | Votes | Economy | Global | SMMlite | HDZ Bulk |
| RT-0201 | LINE | Followers | Economy | Global | FansKing | HDZ Bulk |
| RT-0398 | Telegram | Comments | Standard | Targeted | JustAnotherPanel | 777fans |
| RT-0402 | Telegram | Followers | HQ | TW | Taiwan Like | AutoBuyFans |
| RT-0407 | Telegram | Followers | Standard | Targeted | JustAnotherPanel | URPanel |
| RT-0409 | Telegram | Likes | Premium | Global | Peakerr | URPanel |
| RT-0412 | Telegram | Other | Bot/Low | Global | URPanel | Peakerr |
| RT-0413 | Telegram | Other | Economy | Global | 777fans | AutoBuyFans |
| RT-0415 | Telegram | Other | HQ | TW | 777fans | StarAds |
| RT-0430 | Telegram | Views | HQ | Global | JustAnotherPanel | Peakerr |
| RT-0434 | Telegram | Views | Premium | Targeted | Peakerr | URPanel |
| RT-0440 | Threads | Comments | Premium | TW | Taiwan Like | AutoBuyFans |
| RT-0443 | Threads | Followers | Economy | Global | AutoBuyFans | 777fans |
| RT-0444 | Threads | Followers | HQ | Global | Peakerr | StarAds |
| RT-0458 | Threads | Other | Standard | Global | Taiwan Like | AutoBuyFans |
| RT-0464 | TikTok | Comments | HQ | Global | JustAnotherPanel | Peakerr |
| RT-0467 | TikTok | Comments | Premium | Global | Peakerr | SMMlite |
| RT-0483 | TikTok | Likes | Premium | Global | Peakerr | StarAds |
| RT-0487 | TikTok | Live Viewers | Economy | Global | Peakerr | HDZ Bulk |
| RT-0488 | TikTok | Live Viewers | HQ | Global | URPanel | Peakerr |
| RT-0491 | TikTok | Live Viewers | Standard | Targeted | Peakerr | JustAnotherPanel |
| RT-0499 | TikTok | Shares | Economy | Global | Peakerr | HDZ Bulk |
| RT-0500 | TikTok | Shares | HQ | Global | Peakerr | 777fans |
| RT-0504 | TikTok | Traffic | Standard | Targeted | JustAnotherPanel | URPanel |
| RT-0507 | TikTok | Views | HQ | Global | JustAnotherPanel | Peakerr |
| RT-0509 | TikTok | Views | HQ | Targeted | Peakerr | URPanel |
| RT-0511 | TikTok | Views | Premium | Targeted | Peakerr | JustAnotherPanel |
| RT-0536 | Twitter/X | Accounts | Standard | Global | FansKing | JustAnotherPanel |
| RT-0539 | Twitter/X | Comments | Standard | Targeted | SMMlite | URPanel |
| RT-0543 | Twitter/X | Followers | HQ | Targeted | JustAnotherPanel | Peakerr |
| RT-0561 | Twitter/X | Shares | Economy | Global | SMMlite | JustAnotherPanel |
| RT-0562 | Twitter/X | Shares | HQ | Global | JustAnotherPanel | StarAds |
| RT-0564 | Twitter/X | Shares | Standard | Targeted | JustAnotherPanel | SMMlite |
| RT-0570 | Twitter/X | Views | Economy | Global | Peakerr | HDZ Bulk |
| RT-0571 | Twitter/X | Views | HQ | Global | Peakerr | JustAnotherPanel |
| RT-0575 | Twitter/X | Views | Standard | Targeted | Peakerr | JustAnotherPanel |
| RT-0620 | YouTube | Followers | HQ | Global | URPanel | Peakerr |
| RT-0622 | YouTube | Followers | Premium | Global | Peakerr | StarAds |
| RT-0626 | YouTube | Likes | Bot/Low | Global | JustAnotherPanel | 777fans |
| RT-0629 | YouTube | Likes | HQ | TW | URPanel | AI-FANS |
| RT-0635 | YouTube | Live Viewers | Economy | Global | Peakerr | HDZ Bulk |
| RT-0637 | YouTube | Live Viewers | Premium | Global | URPanel | Peakerr |
| RT-0639 | YouTube | Other | Economy | Global | HDZ Bulk | URPanel |
| RT-0640 | YouTube | Other | HQ | Global | Peakerr | URPanel |
| RT-0641 | YouTube | Other | Premium | Global | URPanel | Peakerr |
| RT-0644 | YouTube | Shares | HQ | Global | Peakerr | URPanel |
| RT-0647 | YouTube | Shares | Premium | TW | URPanel | StarAds |
| RT-0650 | YouTube | Traffic | Economy | Global | JustAnotherPanel | HDZ Bulk |
| RT-0654 | YouTube | Views | Bot/Low | Global | JustAnotherPanel | URPanel |
| RT-0660 | YouTube | Views | Premium | TW | SMMlite | URPanel |

### 6.4 供應商依賴度分析

以下分析各供應商作為「唯一供應商」的服務數量，反映系統對該供應商的單點依賴程度。依賴度越高，該供應商故障時影響範圍越大。

| 供應商 | 獨佔服務數 | 佔全部路由 | 風險評估 |
| :--- | ---: | ---: | :--- |
| JustAnotherPanel | 71 | 10.7% | 🔴 極高依賴，建議積極尋找替代 |
| SMMlite | 46 | 6.9% | 🟡 高依賴，需密切監控 |
| 777fans | 38 | 5.7% | 🟡 高依賴，需密切監控 |
| Peakerr | 28 | 4.2% | 🟡 高依賴，需密切監控 |
| URPanel | 23 | 3.5% | 🟡 高依賴，需密切監控 |
| FBigLikes | 22 | 3.3% | 🟡 高依賴，需密切監控 |
| StarAds | 17 | 2.6% | 🟠 中等依賴 |
| HDZ Bulk | 14 | 2.1% | 🟠 中等依賴 |
| AutoBuyFans | 9 | 1.4% | 🟠 中等依賴 |
| FansKing | 9 | 1.4% | 🟠 中等依賴 |
| AI-FANS | 4 | 0.6% | 🟢 低依賴 |
| Taiwan Like | 3 | 0.5% | 🟢 低依賴 |
| GodLikes | 1 | 0.2% | 🟢 低依賴 |

---

## 7. 實施建議

### 7.1 路由表維護頻率

路由表是動態文件，需要持續維護以反映供應商的最新狀態。建議的維護節奏如下：

| 維護項目 | 頻率 | 方式 | 說明 |
| :--- | :--- | :--- | :--- |
| 價格同步 | 每日 | 自動（API 抓取） | 各供應商價格可能隨時調整 |
| 服務可用性檢查 | 每小時 | 自動（API 探測） | 確認服務是否仍然上架 |
| 品質評估與調整 | 每週 | 半自動 | 根據完成率、掉粉率調整品質等級 |
| 新供應商評估 | 每月 | 人工 | 評估市場上是否有新的供應商可加入 |
| 路由表全面重算 | 每月 | 自動 | 根據累積數據重新計算所有評分與排名 |
| 異常價格審查 | 每日 | 自動告警 | 偵測價格異常波動（如漲幅 > 50%） |

### 7.2 前端用戶體驗對照

用戶完全不需要知道後台有多個供應商。以下為後台狀態與前端顯示的對照：

| 後台狀態 | 前端顯示 | 用戶感知 |
| :--- | :--- | :--- |
| 路由中（嘗試供應商 1~6） | 「處理中」 | 訂單已被接受，正在處理 |
| 已成功下單到供應商 | 「處理中」 | 正在執行 |
| 供應商回報部分完成 | 「處理中 (已完成 N/M)」 | 正在進行 |
| 供應商回報完成 | 「已完成 ✓」 | 服務已交付 |
| 全部供應商失敗（等待人工） | 「處理中」 | 用戶不知道有問題 |
| 人工介入後退款 | 「已退款」 | 收到退款通知 |
| 人工介入後重新路由成功 | 「處理中」→「已完成 ✓」 | 正常完成 |

### 7.3 成本控制機制

故障轉移可能導致訂單被路由到價格較高的備選供應商，因此需要成本控制機制：

| 控制項目 | 建議值 | 說明 |
| :--- | :--- | :--- |
| 最大成本倍率 | 3.0x | 備選供應商價格不超過主供應商的 3 倍，否則跳過 |
| 最低利潤率保護 | 20% | 若使用備選供應商導致利潤率低於 20%，標記人工處理 |
| 單日供應商花費上限 | 依預算設定 | 避免單一供應商花費失控 |
| 自動充值告警 | 餘額 < $50 | 供應商帳戶餘額不足時通知管理員 |
| 異常訂單偵測 | 單筆 > $100 | 大額訂單需額外確認 |

### 7.4 資料庫建議 Schema

```sql
-- 路由表
CREATE TABLE routing_rules (
    route_id        VARCHAR(10) PRIMARY KEY,
    platform        VARCHAR(50) NOT NULL,
    service_type    VARCHAR(50) NOT NULL,
    quality_tier    VARCHAR(20) NOT NULL,
    region          VARCHAR(20) NOT NULL,
    supplier_count  INT NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 路由供應商排序
CREATE TABLE routing_suppliers (
    route_id        VARCHAR(10) NOT NULL,
    priority        INT NOT NULL,          -- 0=主供應商, 1~5=備選
    supplier_name   VARCHAR(50) NOT NULL,
    service_id      INT NOT NULL,
    rate_usd        DECIMAL(12,6) NOT NULL,
    composite_score DECIMAL(6,2) NOT NULL,
    has_refill      BOOLEAN DEFAULT FALSE,
    min_order       INT,
    max_order       INT,
    is_active       BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (route_id, priority),
    FOREIGN KEY (route_id) REFERENCES routing_rules(route_id)
);

-- 供應商健康記錄
CREATE TABLE supplier_health_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_name   VARCHAR(50) NOT NULL,
    result          ENUM("success", "failure") NOT NULL,
    error_code      VARCHAR(50),
    response_time   INT,                   -- 毫秒
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_supplier_time (supplier_name, created_at)
);

-- 訂單路由記錄
CREATE TABLE order_routing_log (
    order_id        BIGINT NOT NULL,
    attempt         INT NOT NULL,
    supplier_name   VARCHAR(50) NOT NULL,
    service_id      INT NOT NULL,
    result          ENUM("success", "skipped", "failed") NOT NULL,
    skip_reason     VARCHAR(100),
    error_code      VARCHAR(50),
    cost_usd        DECIMAL(12,6),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id, attempt)
);
```

---

## 附錄 A：路由表 CSV 欄位說明

完整路由表以 CSV 格式另存於 `routing_table.csv`，包含所有 662 條路由規則及完整的 6 個供應商欄位（主供應商 + 備選1~5）。欄位說明如下：

| 欄位 | 型別 | 說明 |
| :--- | :--- | :--- |
| `route_id` | string | 路由項目唯一識別碼（RT-0001 ~ RT-0662） |
| `std_service_key` | string | 標準化服務 Key（平台 × 服務類型 × 品質 × 地區） |
| `platform` | string | 標準化平台名稱 |
| `service_type` | string | 標準化服務類型 |
| `quality_tier` | string | 品質等級（Premium / HQ / Standard / Economy / Bot/Low） |
| `region` | string | 地區標記（Global / TW / Targeted） |
| `supplier_count` | int | 該路由可用的供應商總數 |
| `primary_supplier` | string | 主供應商名稱 |
| `primary_service_id` | int | 主供應商原始服務 ID（用於 API 下單） |
| `primary_rate_usd` | float | 主供應商每千次價格 (USD) |
| `primary_score` | float | 主供應商綜合評分 (0~100) |
| `primary_refill` | bool | 主供應商是否支援補發 |
| `primary_min` | int | 主供應商最小訂購量 |
| `primary_max` | int | 主供應商最大訂購量 |
| `backup_N_*` | mixed | 第 N 備選供應商的對應欄位（N=1~5，結構同上） |

## 附錄 B：涵蓋平台完整清單

| 編號 | 平台 | 路由項目數 | 是否為重點平台 |
| ---: | :--- | ---: | :---: |
| 1 | Instagram | 81 | ✓ |
| 2 | Facebook | 56 | ✓ |
| 3 | YouTube | 54 | ✓ |
| 4 | TikTok | 52 | ✓ |
| 5 | Other | 50 | - |
| 6 | Telegram | 43 | ✓ |
| 7 | Twitter/X | 42 | ✓ |
| 8 | Snapchat | 31 | - |
| 9 | Spotify | 24 | - |
| 10 | Threads | 24 | ✓ |
| 11 | LinkedIn | 19 | - |
| 12 | Twitch | 15 | - |
| 13 | Google | 15 | ✓ |
| 14 | Crypto/NFT | 14 | - |
| 15 | Website Traffic | 14 | - |
| 16 | Quora | 13 | - |
| 17 | SoundCloud | 13 | - |
| 18 | Shopee | 11 | - |
| 19 | Xiaohongshu | 11 | - |
| 20 | Reddit | 10 | - |
| 21 | Taiwan Forums | 9 | - |
| 22 | Clubhouse | 8 | - |
| 23 | Pinterest | 8 | - |
| 24 | Apple Music | 7 | - |
| 25 | Dcard | 7 | - |
| 26 | Tumblr | 7 | - |
| 27 | Vimeo | 6 | - |
| 28 | Discord | 5 | - |
| 29 | LINE | 4 | ✓ |
| 30 | Google Maps | 4 | ✓ |
| 31 | Shazam | 3 | - |
| 32 | Deezer | 2 | - |
