---
title: "專案變更日誌 (Global Changelog)"
last_updated: "2026-04-11"
summary: "集中記錄 don-ai 倉庫的全局版本演進，包含所有組件（Cloak Admin, Shadow Cloak, GodView）的部署與重大變更。"
version: "v1.16.2"
---
### 2026-04-11 - 新增 shadow-cloak.js 性能優化方案與影響評估報告（v1.16.2）

- **知識庫新增**
    - **`03-專案/斗篷管理後台/shadow-cloak-性能優化方案.md`**：新增基於 `shadow-cloak.js` 實際熱路徑驗證的性能優化報告，系統化整理 VPN 外部 API、bot 設定 KV 讀取、D1 串行查詢、`page_variants` 空表查詢與 `obfuscateJS()` 每請求 CPU 成本等瓶頸
    - 報告已列出各優化項目的具體改動方式、預期毫秒級收益、風險等級、可能受影響功能、實施優先順序，以及是否需要調整 D1 schema
    - 報告明確校正 `selectTargetLink()` 的熱點邊界：僅在 `routing_strategy = round_robin` 時才會觸發 `round_robin_state` 的 D1 讀寫，非所有 money page 請求皆固定查詢 D1
- **知識沉澱**
    - 同步更新 `.ai/active-context.md`，記錄本輪 Shadow Cloak 性能診斷與報告產出結果，供後續實施優化時追蹤

---
### 2026-04-11 - 修復 cloak-admin-api `cloak_country` 更新被 `country` 覆蓋（v1.16.1）

- **後端根因修復**
    - **`cloak-admin-api.js`**：修正 `POST /api/v1/campaigns` 將 `country` 與 `cloak_country` 混用同一 `countryVal` 的問題，改為分別使用 `countryVal` 與 `cloakCountryVal`
    - **`cloak-admin-api.js`**：修正 `PUT /api/v1/campaigns/:id` 的 fallback 邏輯，讓 `cloak_country` 優先讀取 `body.cloak_country`，`country` 僅讀取 `body.country`，避免 `body.country || body.cloak_country` 導致多國白名單被單一國家值覆蓋
    - SQL bind 已改為 `cloak_country = cloakCountryVal`、`country = countryVal`，確保兩個欄位獨立持久化到 `campaigns` 表
- **部署**
    - 已透過 Cloudflare Workers API 重新部署 production `cloak-admin-api`
    - 最新 deployment ID：`199ee54888bd4486ac5c660a9e499dbd`
    - 部署方式已調整為 ES module multipart upload，Cloudflare 回傳 `has_modules: true`

---
### 2026-04-10 - shadow-cloak.js 加入語言欄位寫入（v1.16.0）

- **`shadow-cloak.js`**：在 `logD1` 函數加入 `language` 欄位寫入支持
- 將 `acceptLang`（Accept-Language 請求頭）提前到請求作用域頂層讀取（與 `ua`、`country` 同層）
- 在三個主要 `logD1` 呼叫點（`logEntryBlock`、`redirect_to_link`、`money_page_served`）傳入 `language: acceptLang`
- 移除原本在語言過濾區塊的重複 `const acceptLang` 宣告
- 修改最小化，不影響任何過濾判斷邏輯

---

### 2026-04-10 - 修復 shadow-cloak 指紋混淡誤替換 JSON key（v1.15.1）

- **根因修復**
    - **`shadow-cloak.js`**：調整 `obfuscateJS()` 的 `varMap`，移除 `score`、`details`、`passed` 三個高頻識別符的全局 `\b` 混淡，避免誤改寫 `/cloak-fingerprint` request body 中的 JSON key。
    - 保留其餘較安全的函式與變數混淡映射，避免修復過程擴大影響面。
- **部署與驗證**
    - 已使用 `wrangler-shadow-cloak.toml` 重新部署 production `shadow-cloak`，最新版本 ID：`667e042a-fd21-495f-b639-5506b87302c3`。
    - 已主動對 production `/cloak-fingerprint` 送出驗證請求 `request_id = verify-obfuscate-20260410-1`，Workers 回應 `{"pass":true,"score":7,"cached":false}`。
    - 已查詢 production D1 `interaction_events`，確認最新 `fp_check` 記錄的 `event_data` 為 `{"score":7,"details":{"canvas":"ok","webgl":"ok","audio":"ok"},"bot_score":0,"bot_signals":{},"cached":false,"url":"https://shadow-cloak.laoqin1689.workers.dev/test"}`，證明 `score` 與 `details` 不再被錯誤替換為混淡 key，也不再固定為 `0 / {}`。

---

### 2026-04-10 - 修復訪問日誌 7 Tab SQL 錯誤（v1.15.0）

- **後端 API 修復**
    - **`cloak-admin-api.js`**：修復「全部日誌」Tab 的 UNION ALL SQL 錯誤（interaction_events/clicks 表無 campaign_id 欄位，改用 NULL 替代）
    - 修復「全部跳轉」和「已歸因」Tab 的 campaign_id 過濾條件導致 SQL 錯誤（clicks 表無此欄位，移除過濾）
    - 修復所有 7 個 Tab 顯示「無記錄」的根本原因
- **前端重構**
    - **`Logs.tsx`**：重構為 v7.0，根據數據來源為各 Tab 設計最合適的欄位組合
    - 安全頁/推廣頁 Tab：序號、時間、域名/來源、國家/IP、訪客ID、語言、設備、判定、原因
    - 推廣頁按鈕/安全頁按鈕 Tab：序號、時間、域名、國家/IP、訪客ID、事件類型、結果、設備、事件數據
    - 全部跳轉/已歸因 Tab：序號、時間、TAG/Ad Code、國家/IP、訪客ID、fbclid、歸因、歸因用戶、系統、Destination

---

### 2026-04-10 - 訪問日誌 7 Tab 完整追蹤漏斗重構（v6.0）

- **後端 API 升級**
    - **`cloak-admin-api.js`**：`GET /api/v1/visit-logs` 升級支持 7 Tab 分層查詢，新增 `all_jumps` 與 `attributed` 分頁
    - 實現 `cloak_logs`、`interaction_events` 與 `clicks` 三表聯查邏輯，修復歸因數據缺失問題
    - 優化全部日誌 Tab 的 `UNION ALL` 效能，整合所有追蹤來源
- **前端重構**
    - **`Logs.tsx`**：重構為 v6.0，改為 7 Tab 完整追蹤漏斗設計（全部日誌、安全頁、推廣頁、推廣頁按鈕、安全頁按鈕、全部跳轉、已歸因）
    - **新增 VID/EVENT 欄位**：每個 Tab 統一顯示訪客ID (VID) 與 事件類型 (EVENT)，方便追蹤漏斗流轉
    - **全面中文化優化**：優化 JSON 數據解析（指紋分數、互動次數、跳轉目標）並提供更精準的中文翻譯
- **部署**
    - 前端已推送至 `laoqin1689/cloak-admin` main 分支，觸發 GitHub Actions 自動部署至 Cloudflare Pages
    - 後端已推送至 `laoqin1689/don-ai` main 分支，觸發 GitHub Actions 自動部署至 Cloudflare Workers

### 2026-04-10 - 訪問日誌分層顯示重構（5 Tab 設計 v5.0）

- **後端 API 新增**
    - **`cloak-admin-api.js`**：新增 `GET /api/v1/visit-logs` 統一分層查詢端點，支持 `tab` 參數（all / visit / button_click / safe_page_click / cloak_blocked）
    - 新增 `GET /api/v1/decisions` 和 `GET /api/v1/interaction-events` 查詢端點
    - 增強原有 `GET /api/v1/logs` 端點，新增 campaign_id、campaign_ids、start_date、end_date、reason、visitor_id 搜索支持
    - 全部日誌 Tab 使用 UNION ALL 跨 cloak_logs + interaction_events 表聯合查詢
- **前端重構**
    - **`Logs.tsx`**：從 v4.0 重構為 v5.0，改為 5 Tab 分層設計（全部日誌、訪問日誌、按鈕點擊、安全內頁點擊、斗篷攔截）
    - 統一欄位格式：序號、訪問時間、訪問域名/訪問來源、國家/訪問IP、訪客ID、語言、設備、狀態、日誌
    - 全面中文化：所有狀態/原因欄位顯示中文，包含 30+ 種英文狀態碼的中文映射
    - 新增 `fetchVisitLogs` API 函數
- **部署**
    - 前端已推送至 `laoqin1689/cloak-admin` main 分支，觸發 GitHub Actions 自動部署至 Cloudflare Pages
    - 後端已推送至 `laoqin1689/don-ai` main 分支，觸發 GitHub Actions 自動部署至 Cloudflare Workers

### 2026-04-10 - 修復 cloak-admin 前端編輯廣告未送出完整 cloak payload，並完成 production 部署

- **前端根因確認與修補**
    - 已確認 Bug 2 並非 `admin-api.bexnua.store` 後端落表問題；直接對正式 API 執行 `PUT /api/v1/campaigns/:id` 可正確更新 D1，真正根因位於前端倉庫 `laoqin1689/cloak-admin`
    - **`client/src/pages/Campaigns.tsx`**：補強 campaign 編輯表單對 cloak 欄位的 hydrate / reset / submit 邏輯，讀取既有資料時同時兼容 `cloak_lang` 與 `cloak_language`
    - 最後一步按下「更新」時，前端現在會顯式建立 cloak payload，固定送出 `cloak_country`、`cloak_region`、`cloak_lang`、`cloak_language`、`cloak_os`、`cloak_os_version`、`cloak_traffic_source`、`require_fbclid`，避免多步驟表單切換或 alias 不一致造成欄位遺漏
- **部署與驗證**
    - 已在本地完成 `npm install --legacy-peer-deps` 與 `npm run build`，確認修補後前端可正常產生 production build
    - 前端修補已以 commit `6a4ff80`（`fix: include cloak filters in campaign updates`）推送到 `laoqin1689/cloak-admin` `main`
    - GitHub Actions `Deploy to Cloudflare Pages` workflow run `24235474265` 已成功完成，正式將最新版本部署至 production `admin.bexnua.store`
    - 重新檢查 production bundle 後，已可在 live 程式碼中確認 campaign 編輯的載入邏輯包含 `cloak_lang / cloak_language` 相容處理，且更新 payload 明確含有 `cloak_country`、`cloak_region`、`cloak_lang`、`cloak_language`、`cloak_os`、`cloak_os_version`、`cloak_traffic_source`、`require_fbclid`，證明正式站點最後送出的 `PUT` body 已包含完整 cloak 欄位

### 2026-04-10 - 修復 campaign 暫停安全頁超時與 cloak 設定未持久化，並完成 production 驗證

- **Shadow Cloak 暫停狀態修復**
    - **`shadow-cloak.js`**：新增 `isCampaignRuntimeActive()`，將 hostname 查詢從只抓 `status = 'active'` 改為先抓對應 campaign、再於 runtime 判定是否屬於 **active / enabled**
    - 當 campaign 為 `paused` 或其他非啟用狀態時，Worker 會設定 `force_safe_page = true` 與 `force_safe_reason = "campaign_paused"`，並直接回傳安全頁，不再因後續 routing / config 流程落空而出現 TLS 成功但 0 bytes 最終超時的情況
    - entry block log 亦補上 `campaign_status` 命中原因，方便後續在日誌中區分 maintenance mode 與 campaign 暫停導致的安全頁回退
- **Cloak Admin API 更新持久化修復**
    - **`cloak-admin-api.js`**：新增 `firstDefined()` / `mAlias()` 型別安全取值路徑，讓 `PUT /api/v1/campaigns/:id` 在更新時可正確接收前端送出的 cloak 相關欄位，即使值為空字串、`false` 或使用別名欄位也不會被錯誤忽略
    - campaign update 已明確納入 `cloak_country`、`cloak_region`、`cloak_lang` / `cloak_language`、`cloak_os`、`cloak_os_version`、`cloak_traffic_source`、`require_fbclid` 等欄位，並修正 `country` / `cloak_country` 的合併邏輯，確保最終 `UPDATE campaigns` 寫入 D1 的是最新使用者輸入值
    - 前端倉庫 `laoqin1689/cloak-admin` 已一併複查 `Campaigns.tsx` 與 `api.ts` 的編輯提交流程，確認最後按「更新」時會送出完整 campaign payload，本次不需額外前端程式修補
- **部署與驗證**
    - 已以 Cloudflare Wrangler 重新部署 production `shadow-cloak`，版本 ID：`287c2afc-ea43-4f50-be0d-012f4bd481bf`
    - 已以 Cloudflare Wrangler 重新部署 production `cloak-admin-api`，版本 ID：`f291ecbf-82ec-4863-ab0f-62ff2bc53cd1`
    - 使用正式 campaign `velphi.shop` 進行 live verification：暫時將狀態改為 `paused` 後，正式域名已回 `HTTP 200` 與 `text/html`，且 body 前綴包含安全頁注入的 `noindex, nofollow` / `no-referrer` meta，確認 Bug 1 已修復；驗證後已立即還原原狀態
    - 針對同一筆 campaign 以正式 API 執行 `PUT /api/v1/campaigns/:id` 更新 cloak 欄位後，再以 Cloudflare D1 `godview-clicks` 直接查詢 `campaigns` 表，已確認 `status = paused`、`cloak_country = TW,SG`、`cloak_region = TW-TPE,SG-01`、`cloak_lang = zh-TW,en`、`cloak_os_version = 17,15`、`cloak_traffic_source = facebook,tiktok`、`require_fbclid = 0` 均已正確落表；驗證後已立即還原原值

### 2026-04-10 - freshpathlab 子域名建置、line-redirect fallback 補齊與重新部署

- **Cloudflare 設定**
    - 已在 freshpathlab.com zone `3558fb741de4523d04af78db910e7376` 建立 `ct`、`jt`、`lt`、`mt`、`n23`~`n42` 共 24 個子域名的 **AAAA** DNS 記錄，內容統一為 `100::`，並開啟 Cloudflare Proxy
    - 已同步建立 24 條 `line-redirect` Worker route：`{tag}.freshpathlab.com/*`
- **line-redirect 程式調整**
    - **`line-redirect.js`**：已從 `MASTER_PIXEL_MAP` 刪除 `sz`，並依 production D1 `line_config` 補齊 `ct`、`jt`、`lt`、`mt`、`n23`~`n42` 的 `FALLBACK_LINE_MAP`
    - **`line-redirect-staging.js`**：同步套用 `LINE_MAP` fallback merge 修正，避免遠端 config 缺少個別 tag 時直接覆蓋靜態 fallback
    - 已修正 `LINE_MAP` 讀取邏輯為 **`{ ...FALLBACK_LINE_MAP, ...(config.LINE_MAP || {}) }`**，解決 `jt`、`mt` 在遠端 config 缺漏時回 `404` 的問題
- **部署與驗證**
    - 已透過 Cloudflare Workers API 重新部署 production `line-redirect`，deployment ID：`07e6153fef964b6097e5ce24eb47d26d`
    - 抽樣驗證 `ct.freshpathlab.com`、`jt.freshpathlab.com`、`lt.freshpathlab.com`、`mt.freshpathlab.com`、`n23.freshpathlab.com`、`n42.freshpathlab.com` 皆回 `HTTP/2 302`，並正確導向對應 LINE OA

### 2026-04-10 - 問題 4：LIFF_MAP 改為從 D1 讀取，並保留 fallback

- **實作內容**
    - **cloak-admin-api.js**：`/api/v1/liff-options` 改為優先從 D1 `line_config` 讀取 `tag / line / liff_id`，僅在 D1 無法提供資料時才退回硬編碼 fallback
    - **line-redirect.js**：LIFF 映射改為 **D1 優先、靜態映射 fallback** 的載入方式，避免持續維護大批硬編碼資料
    - 新增 **`05-原始碼/斗篷管理後台/migrations/008_seed_line_config_liff_map.sql`**，將既有 LIFF 映射批次回填到 `line_config`
- **部署與資料更新**
    - 已將 LIFF 映射回填到 production / staging Cloudflare D1
    - 已重新部署 `cloak-admin-api` 與 `line-redirect` 相關 Worker
- **驗證**
    - production D1 `line_config` 非空 `liff_id` 筆數：`25`
    - staging D1 `line_config` 非空 `liff_id` 筆數：`23`
    - `https://admin-api.bexnua.store/api/v1/liff-options` 以正確 `X-API-Key` 驗證回傳 `200 OK`、`success: true`，且已可讀出多筆 LIFF 映射資料
    - `https://line-redirect.laoqin1689.workers.dev/` 部署後仍由 Cloudflare 正常回應；根路徑目前為既有設計上的 `404`

# 變更日誌 (Changelog)

所有版本號遵循 [語義版本控制 (SemVer)](01-核心原則/deploy-and-version-spec.md) 規範。
格式：`v主版本.次版本.修補版本`

---

## [v1.12.0] - 2026-04-10

### 摘要 (Summary)
本次發佈整合了日誌系統的全面強化，包含全域認證保護、操作日誌自動化記錄、Verified Bot 判定順序優化，以及後台可視化管理頁面。

### 組件更新 (Component Updates)
- **Cloak Admin (Frontend/API)**: `v1.11.0` -> `v1.12.0`
- **Shadow Cloak (Worker)**: `v1.8.1` -> `v1.9.0`
- **GodView (System)**: `v1.0.1` -> `v1.1.0`

### 新增 (Added)
- **[Cloak Admin API] 全域認證保護**：實作 `X-API-Key` 認證中間件，保護所有 `/api/*` 端點，防止未授權存取。
- **[Cloak Admin API] 操作日誌 (Content API Logs)**：新增 `logContentChange()` 函數，全面覆蓋 20 個寫入端點（Campaigns, Pixels, Domains, Shortlinks 等）。
- **[Cloak Admin Frontend] 日誌可視化**：新增 `Decisions.tsx` 頁面與雙 Tab 介面，支援檢視 `decisions` 與 `interaction_events`。
- **[Cloak Admin API] 日誌查詢 API**：新增 `GET /api/v1/decisions` 與 `GET /api/v1/interaction-events`。
- **[Shadow Cloak] CAPI 寫入**：在 `sendCAPIPageView()` 中實作 `capi_logs` 實體寫入邏輯。

### 修復 (Fixed)
- **[Shadow Cloak] Verified Bot 順序修正**：將 Verified Bot Allowlist 檢查移至國家過濾之前，確保 Googlebot 等合法爬蟲優先命中 allowlist。
- **[Cloak Admin Frontend] API 認證**：修復 `api.ts` 缺失 `X-API-Key` header 的問題。

### 優化 (Improved)
- **[Shadow Cloak] D1 Binding 統一**：將 `env.D1` 統一重命名為 `env.DB`，與 API 組件保持一致。
- **[N8N] 工作流清理**：刪除冗餘的「一鍵更新Token」工作流，保留最新版本 `dCXDkZiK5np7pRSb`。

---

## [v1.11.0] - 2026-04-08

### 摘要 (Summary)
像素庫架構重構與域名動態管理功能上線。

### 組件更新 (Component Updates)
- **Cloak Admin (Frontend/API)**: `v1.10.5` -> `v1.11.0`
- **Shadow Cloak (Worker)**: `v1.8.0` -> `v1.8.1`
- **GodView (System)**: `v1.0.0` -> `v1.0.1`

### 新增 (Added)
- **像素庫重構 (pixel_groups)**：從 `pixel_sets` 遷移到 BM-based `pixel_groups` 模型。
- **域名動態 NS 查詢**：`Domains.tsx` 支援動態顯示專屬 NS 並提供手動檢查狀態。
- **素材中心升級**：整合 CodeMirror 編輯器與語法高亮。

### 修復 (Fixed)
- **Tag 轉換邏輯修復**：修正 `shadow-cloak` 與 `line-redirect` 的 `getProductPrefix` 邏輯。

---

---

### 2026-04-11 - 修復 production D1 campaigns 缺少  /  欄位

- **根因修復**
    - production Cloudflare D1  表缺少 **** 與 **** 欄位，但  的 campaign  /  SQL 已開始引用這兩個欄位，導致  後台更新 campaign 時出現 
    - 已直接對正式 D1  執行  與 ，將資料表 schema 補齊到與目前 API 寫入邏輯一致
- **驗證**
    - 以  確認 、 均已存在於 production  表中
    - 兩欄位型別皆為 ，預設值皆為空字串 ，符合目前 campaign 表單與 API 的空值相容需求
