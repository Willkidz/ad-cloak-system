---
title: "斗篷系統開發路線圖與功能規劃"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件詳細規劃了基於 Cloudflare Workers 的斗篷系統開發路線圖，涵蓋從底層基礎、核心過濾引擎到反向代理、輪替分流及日誌監控的六大開發階段與功能細節。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloak-admin, cloaking, cloudflare-workers, planning, roadmap]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本開發路線圖旨在建立一套基於 Cloudflare Workers 的高效斗篷系統。分為六個階段：**Phase 0** 基礎設施搭建；**Phase 1** 核心過濾引擎（ASN/UA/Geo）；**Phase 2** 反向代理（白頁與真頁）；**Phase 3** 輪替分流系統（取代 `ini.html`）；**Phase 4** 落地頁 JS 整合（像素注入）；**Phase 5** 日誌監控與告警；**Phase 6** 多域名管理。預計總開發時間約 8.5 小時。

# 斗篷系統開發路線圖與功能規劃

**目標**：建立一套基於 Cloudflare Workers 的高效斗篷系統，支援輪替分流、反向代理、多層審核過濾及日誌監控功能。

---

## 1. 系統架構總覽

<example id="system-architecture-flow">

```plaintext
FB 廣告 → 斗篷域名（bexnua.store）→ Cloaking Worker 判斷
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
               [審核/機器人]                            [真實用戶]
                    │                                       │
                    ▼                                       ▼
            反向代理安全頁面                         反向代理火鳥落地頁
           (raxnto.shop)                          (kogane.online)
                                                        │
                                                   用戶點擊按鈕
                                                        │
                                                        ▼
                                              輪替分流（取代火鳥 ini.html）
                                              由 Worker 控制跳轉目標
                                                        │
                                          ┌─────┬─────┬─────┐
                                          ▼     ▼     ▼     ▼
                                         JS    CS    MS    LS
                                    freshpathlab.com（line-redirect）
                                                        │
                                                        ▼
                                                  LINE 加好友
```
</example>

---

## 2. 開發階段規劃

<step id="phase-0">

### Phase 0 — 底層基礎（最高優先級）

**目標**：搭建斗篷 Worker 的核心骨架，確保最基礎的「審核看白頁、用戶看真頁」流程能夠順利運作。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 0-1 | **DNS 配置** | 在 `bexnua.store` 建立 AAAA 記錄指向 `100::`，並啟用 Cloudflare Proxy（橘色雲朵）。 | 瀏覽器訪問 `bexnua.store` 確認有回應。 |
| 0-2 | **Worker 部署骨架** | 部署一個最簡化的 Worker 到 `bexnua.store`，該 Worker 對所有請求僅返回 "Hello World"。 | `curl bexnua.store` 應看到 "Hello World" 回應。 |
| 0-3 | **Worker 路由綁定** | 設定 `bexnua.store/*` 的所有流量都導向 `cloaking-worker`。 | 確認訪問 `bexnua.store` 的所有路徑都被 Worker 攔截。 |

**驗收標準**：`curl bexnua.store` 能成功接收到 Worker 的回應即為通過。
</step>

<step id="phase-1">

### Phase 1 — 核心過濾引擎

**目標**：實現三層過濾邏輯（ASN、User-Agent、地理位置），以準確區分機器人流量與真實用戶。

<rule id="filtering-logic">

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 1-1 | **ASN 封鎖清單** | 建立包含超過 30 個已知數據中心（如 Meta AS32934、Google AS15169、AWS、Azure）的 ASN 封鎖清單。 | Worker 返回的 JSON 中應明確顯示判斷結果。 |
| 1-2 | **UA 檢測正則** | 建立包含超過 50 個常見爬蟲特徵（如 `facebookexternalhit`、`Googlebot`、`HeadlessChrome`）的 User-Agent 正則表達式。 | 使用 `curl -H "User-Agent: facebookexternalhit"` 進行測試。 |
| 1-3 | **地理位置過濾** | 設定僅允許台灣、香港、澳門的流量，其餘國家或地區的流量均視為可疑並阻擋。 | 使用不同國家的 VPN 進行訪問測試。 |
| 1-4 | **偵測結果 JSON 端點** | 建立 `/_debug` 端點，用於返回 ASN、UA、國家及最終判斷結果，以利於調試。 | 直接訪問 `bexnua.store/_debug`。 |

</rule>

**驗收標準**：
- 正常瀏覽器訪問應返回：`{"isBot": false, "reason": "passed"}`
- 使用 `facebookexternalhit` UA 訪問應返回：`{"isBot": true, "reason": "bot_ua:..."}`
- 從美國 IP 訪問應返回：`{"isBot": true, "reason": "geo_blocked:US"}`
</step>

<step id="phase-2">

### Phase 2 — 反向代理（白頁與真頁）

**目標**：讓被識別為機器人的流量看到安全的「白頁」，真實用戶則看到「真頁」（火鳥落地頁），過程中瀏覽器的網址列保持不變。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 2-1 | **安全頁面準備** | 在 `raxnto.shop` 部署一個與廣告素材主題相關的合規安全頁面。 | 直接訪問 `raxnto.shop` 檢查頁面內容。 |
| 2-2 | **反向代理安全頁面** | 當 `isBot=true` 時，Worker 應 `fetch(raxnto.shop)` 並返回其內容。 | 使用 `facebookexternalhit` UA 訪問 `bexnua.store`。 |
| 2-3 | **反向代理火鳥落地頁** | 當 `isBot=false` 時，Worker 應 `fetch(kogane.online/xxx)` 並返回其內容。 | 使用正常瀏覽器訪問 `bexnua.store`。 |
| 2-4 | **HTML 內容改寫** | 代理火鳥頁面時，需將頁面內所有對 `kogane.online` 的引用改寫為 `bexnua.store`，以避免混合內容問題。 | 檢查頁面原始碼，確認無 `kogane.online` 域名洩漏。 |
| 2-5 | **靜態資源代理** | CSS、JS、圖片等靜態資源也必須通過 Worker 進行代理。 | 確保頁面載入完整，無 404 錯誤。 |
| 2-6 | **備用白頁** | 當 `raxnto.shop` 無法訪問時，應返回一個內建於 Worker 中的 HTML 備用頁面。 | 中斷 `raxnto.shop` 的訪問以進行測試。 |

**驗收標準**：
- 正常瀏覽器訪問 `bexnua.store` 時，應顯示火鳥落地頁。
- 使用 `facebookexternalhit` UA 訪問時，應顯示安全頁面。
- 頁面內所有資源皆正常載入，無混合內容警告。
</step>

<step id="phase-3">

### Phase 3 — 輪替分流系統

**目標**：取代傳統 `ini.html` 方案，當用戶點擊落地頁按鈕後，由 Worker 根據預設規則進行權重分流。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 3-1 | **分流配置表** | 定義各產品線的分流規則（例如 AS 系列 → js/cs/ms/ls 各 25%），配置可寫在 Worker 或從 n8n Config API 讀取。 | 檢查 Worker 配置或 API 回應。 |
| 3-2 | **分流端點** | 建立 `/redirect` 或 `/go` 端點，接收產品線參數並按設定比例分流。 | 連續訪問 10 次，確認流量分布大致均勻。 |
| 3-3 | **權重分流** | 支援為不同標籤設定不同權重（例如 js:30%, cs:30%, ms:20%, ls:20%）。 | 進行大量請求後統計分布比例。 |
| 3-4 | **fbclid 保留** | 分流跳轉時，必須自動攜帶 `fbclid` 參數。 | 帶 `fbclid` 訪問，確認跳轉後的 URL 仍包含 `fbclid`。 |
| 3-5 | **分流日誌** | 將每次分流的詳細資訊（用戶、目標標籤、時間）記錄到 Cloudflare D1 資料庫。 | 查詢 D1 資料庫確認記錄完整性。 |

<example id="traffic-splitting-logic">

**分流邏輯範例**：
```plaintext
用戶在落地頁點擊按鈕
    │
    ▼
訪問 bexnua.store/go?p=AS&fbclid=xxx
    │
    ▼
Worker 讀取 AS 產品線的分流配置：
  js: 25% → js.freshpathlab.com/?a=JS01&fbclid=xxx
  cs: 25% → cs.freshpathlab.com/?a=CS01&fbclid=xxx
  ms: 25% → ms.freshpathlab.com/?a=MS01&fbclid=xxx
  ls: 25% → ls.freshpathlab.com/?a=LS01&fbclid=xxx
    │
    ▼
以 302 狀態碼跳轉到選中的目標 URL
```
</example>

**驗收標準**：
- 連續訪問 `/go?p=AS` 100 次，js/cs/ms/ls 的分布應各接近 25 次。
- `fbclid` 參數被正確傳遞。
- D1 資料庫中有完整的分流日誌。
</step>

<step id="phase-4">

### Phase 4 — 落地頁 JS 整合

**目標**：在代理的火鳥落地頁中動態注入 BC 像素 JS，並將頁面按鈕的跳轉目標改為 Worker 的分流端點。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 4-1 | **JS 注入** | Worker 代理火鳥頁面時，在 `</body>` 標籤前自動注入 BC 像素 JS 腳本。 | 檢查頁面原始碼，確認 JS 腳本已成功注入。 |
| 4-2 | **gotolink 改寫** | 將火鳥頁面中的 `gotolink` 跳轉邏輯改為指向 `bexnua.store/go?p=AS`。 | 點擊頁面按鈕，確認跳轉至 Worker 分流端點。 |
| 4-3 | **BC 像素事件** | 確保 `PageView` 和 `Contact` 事件能正常發送到 `/bc-event` 端點。 | 在 Meta 事件管理工具中確認事件已收到。 |

**優點**：此方案無需手動修改火鳥後台，由 Worker 統一管理 JS 注入，更換落地頁時僅需修改 Worker 配置即可。
</step>

<step id="phase-5">

### Phase 5 — 日誌監控與告警

**目標**：建立完整的流量日誌記錄與異常事件告警機制。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 5-1 | **D1 日誌表** | 建立 `cloak_logs` 表，記錄每次請求的 ASN、UA、國家、判斷結果及時間戳。 | 查詢 D1 資料庫確認記錄完整性。 |
| 5-2 | **n8n 監控 workflow** | 建立 n8n workflow，定時查詢 D1 資料庫，統計機器人比例、國家分布等指標。 | 確保能定時收到 Telegram 統計報告。 |
| 5-3 | **異常告警** | 當機器人比例突然升高或出現大量未知 ASN 訪問時，自動發送告警至 Telegram。 | 模擬異常流量以觸發告警。 |
</step>

<step id="phase-6">

### Phase 6 — 多域名管理

**目標**：支援多個斗篷域名同時運作，並在域名被封鎖時能快速切換。

| 順序 | 功能 | 說明 | 測試方式 |
|:---|:---|:---|:---|
| 6-1 | **多域名部署** | 將同一個 Worker 部署到多個域名（例如 `bexnua.store`, `fyntro.lol`）。 | 確認兩個域名都能正常訪問並觸發 Worker。 |
| 6-2 | **域名健康檢查** | 建立 n8n workflow，定時檢查每個域名是否被 Meta 封鎖。 | 確保 n8n workflow 能自動執行檢查。 |
| 6-3 | **快速切換** | 當主域名被封鎖時，應能一鍵切換至備用域名。 | 模擬域名封鎖情境並執行切換操作。 |
</step>

---

## 3. 開發優先級與時程

| 優先級 | Phase | 預估時間 | 前置條件 |
|:---|:---|:---|:---|
| 最高 | Phase 0 (底層基礎) | 0.5 小時 | 無 |
| 最高 | Phase 1 (過濾引擎) | 1 小時 | Phase 0 |
| 最高 | Phase 2 (反向代理) | 2 小時 | Phase 1 |
| 高 | Phase 3 (輪替分流) | 1.5 小時 | Phase 2 |
| 中 | Phase 4 (JS 注入) | 1 小時 | Phase 2, 3 |
| 中 | Phase 5 (日誌監控) | 1 小時 | Phase 1 |
| 低 | Phase 6 (多域名管理) | 1 小時 | Phase 2 |

**建議開發順序**：`0 → 1 → 2 → 測試驗證 → 3 → 4 → 5 → 6`

---

## 4. 待確認事項

<boundaries id="pending-items">

| 項目 | 說明 | 狀態 |
|:---|:---|:---|
| 安全頁面內容 | 需要提供與廣告素材主題相關的內容。 | `[待確認]` |
| 火鳥落地頁路徑 | 需要提供各產品線在火鳥上的完整 URL 路徑。 | `[待確認]` |
| 分流比例 | 需要確認各產品線的 tag 分流比例（預設各 25% 或自訂）。 | `[待確認]` |
| 測試廣告帳號 | 建議提供一個獨立的廣告帳號用於測試，避免影響主帳號。 | `[待確認]` |
| `ini.html` 邏輯 | 若能提供 `ini.html` 原始碼，可更精確地複製其分流邏輯。 | `[待確認]` |

</boundaries>

---

## 5. 結論

本開發路線圖為斗篷管理後台的建設提供了清晰的模組化實施路徑。初期核心（Phase 0-2）完成後即可支援小規模廣告測試，後續階段則逐步增強系統的分流、整合與監控能力，最終實現一個強大且易於維護的自動化斗篷系統。建議在啟動開發前，優先完成「待確認事項」列表中的項目，以確保開發過程順利。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-cf-workers-landing-analysis.md](cloak-cf-workers-landing-analysis.md) | 斗篷技術研究報告 |
| [cloak-firebird-system-arch-analysis.md](cloak-firebird-system-arch-analysis.md) | 系統架構深度解析 |
| [cloak-admin-v1-dev-cmd.md](cloak-admin-v1-dev-cmd.md) | 核心頁面開發指令 |
