---
title: "架構決策記錄 (ADR)"
category: "config"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "記錄專案中重要的架構決策，包含決策背景、方案選擇、替代方案與影響分析，遵循 MADR 標準。目前包含 7 條 ADR。"
id: "20260327-ADR-001"
type: "memory"
tags: [architecture, memory, planning]
status: "active"
created: "2026-03-25"
updated: "2026-03-31"
version: "v1.1"
---

> **TL;DR**: 本文件以 MADR 標準格式記錄專案中的重要架構決策。目前包含 7 條 ADR：ADR-001 GitHub 私有 repo 作為知識庫；ADR-002 `.ai/` 目錄結構；ADR-003 廢棄 manus-memory；ADR-004 隱者系統修正策略；ADR-005 抖影知識遷移 VPS；ADR-006 line-redirect ad_code 大小寫統一策略；ADR-007 抖影知識分層逐字稿策略。新增決策時須複製模板、編號遞增，並同步更新 `memory.md`。

# 架構決策記錄 (Architecture Decision Records, ADR)

本文件記錄了專案中重要的架構決策，包括為什麼選擇某個技術方案，以及放棄了哪些替代方案。

---

## 標準化 MADR 模板

> 基於 [adr/madr](https://github.com/adr/madr) 開源標準。AI 在新增決策記錄時，必須複製以下模板並填寫所有欄位。

<rule id="adr-template">

```markdown
## [ADR-XXX] 決策標題

- **日期：** YYYY-MM-DD
- **狀態：** proposed | accepted | deprecated | superseded by [ADR-YYY]
- **背景 (Context)：**
  描述面臨的問題或需求。為什麼需要做這個決策？當前的技術環境、業務約束和相關上下文是什麼？
- **決策 (Decision)：**
  最終選擇了什麼方案？用「我們決定…」開頭。
- **替代方案 (Alternatives Considered)：**
  考慮過哪些其他方案？為什麼放棄它們？
- **後果 (Consequences)：**
  - **正面效益：** 這個決策帶來了哪些好處？
  - **負面妥協：** 這個決策帶來了哪些潛在的風險或技術債？
```

</rule>

---

## 狀態說明

| 狀態 | 說明 |
| :--- | :--- |
| `proposed` | 已提出但尚未經人類開發者確認 |
| `accepted` | 已經人類開發者確認並正式採用 |
| `deprecated` | 曾經採用但已過時，不再適用 |
| `superseded by [ADR-YYY]` | 已被新的決策取代，必須標註取代者編號 |

---

## 使用規則

<rule id="adr-usage-rules">

1. **新增決策**：複製上方模板，在本文件底部新增，編號遞增。
2. **後果分析**：「後果」欄位必須同時包含正面效益與負面妥協，禁止只寫好處。
3. **狀態變更**：當決策被取代時，不要刪除舊記錄，而是將狀態改為 `superseded by [ADR-YYY]`。
4. **與 memory.md 同步**：重大決策應同時在 [`memory.md`](./memory.md) 的「架構決策摘要」中新增一行摘要。

</rule>

---

## [ADR-001] 知識庫選址決策

- **日期：** 2026-03-25
- **狀態：** accepted
- **背景 (Context)：**
  需要一個統一的地方來存儲 AI 助手的工作記憶、專案文檔和代碼，以便跨 session 和跨設備訪問。
- **決策 (Decision)：**
  我們決定使用 GitHub 私有 repo (`don-ai`) 作為 AI 共用知識庫。
- **替代方案 (Alternatives Considered)：**
  - **Cloudflare D1：** 放棄原因：容量限制（10GB），且本質上是關聯式資料庫，不適合存儲大量 Markdown 文件。
  - **Contabo VPS：** 放棄原因：存在單點故障風險（掛了資料就沒），且不方便外部存取。
- **後果 (Consequences)：**
  - **正面效益：** 免費、自帶版本控制、跨平台共用、手機電腦都能看。
  - **負面妥協：** 需要確保 AI 助手在每次工作前後都正確執行 `git pull` 和 `git push`。

---

## [ADR-002] 引入 AI 記憶與防執著偏差機制

- **日期：** 2026-03-26
- **狀態：** accepted
- **背景 (Context)：**
  AI 助手在長期協作中容易遺忘上下文，且在 Debug 時容易陷入「執著偏差」，反覆嘗試錯誤的解決方案。
- **決策 (Decision)：**
  我們決定在專案根目錄引入 `.ai/` 目錄結構，包含 `memory.md`、`error-log.md`、`decision-log.md` 和 `debug_prompt.md`，並升級通用指令。
- **替代方案 (Alternatives Considered)：**
  - 無明確的替代方案被考慮。
- **後果 (Consequences)：**
  - **正面效益：** 提升 AI 助手的上下文感知能力，減少重複犯錯，提高 Debug 效率。
  - **負面妥協：** 增加了 AI 助手的工作流負擔，需要嚴格遵守更新規範。

---

## [ADR-003] 廢棄 manus-memory 系統，以 don-ai 倉庫為唯一記憶來源

- **日期：** 2026-03-30
- **狀態：** accepted
- **背景 (Context)：**
  專案早期建立了 `manus-memory-api`（Cloudflare Worker）和 `manus-memory`（Cloudflare D1 資料庫）作為 AI 記憶系統，透過 n8n 工作流實現 MANUS_MEMORY_LOAD / MANUS_MEMORY_SAVE 指令。隨著 don-ai GitHub 倉庫的 `.ai/` 目錄結構日益完善（ADR-002），兩套記憶系統並存造成了維護負擔和資料不一致風險。manus-memory 中的 270 筆記憶條目大部分已過時或已整合進 don-ai 的各文件中。
- **決策 (Decision)：**
  我們決定廢棄 `manus-memory-api` Worker 和 `manus-memory` D1 資料庫，以 don-ai GitHub 倉庫作為唯一的知識庫和記憶系統（Single Source of Truth）。所有 AI 記憶讀寫操作改為直接操作 `.ai/` 目錄下的 Markdown 文件。
- **替代方案 (Alternatives Considered)：**
  - **維持雙軌並存**：放棄原因：維護成本高，兩套系統資料容易不一致，且 manus-memory 的 D1 存儲對 Markdown 知識文件並不適合（ADR-001 已論證）。
  - **將 don-ai 遷移回 D1**：放棄原因：違反 ADR-001 的決策，D1 不適合存儲大量 Markdown 文件。
- **後果 (Consequences)：**
  - **正面效益：** 消除雙系統維護負擔，統一記憶來源，減少 Worker 數量和 D1 資料庫數量，降低 Cloudflare 資源使用。AI 助手只需操作 Git 倉庫即可完成所有記憶管理。
  - **負面妥協：** 失去了 API 化的記憶查詢能力（如按 project/category 過濾）。外部專案的 AI 需要直接 clone don-ai 倉庫才能存取記憶，無法透過 HTTP API 存取。manus-memory 中部分歷史細節可能在遷移過程中遺失。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/memory.md`](./memory.md) | 架構決策摘要同步至此文件的第 3 節 |
| [`.ai/system-patterns.md`](./system-patterns.md) | 關鍵架構決策表引用本文件的 ADR 編號 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | SOP 4 Offboarding 流程中要求更新本文件 |

---
## [ADR-004] 隱者系統修正策略：火鳥零影響原則
- **日期：** 2026-03-31
- **狀態：** proposed
- **背景 (Context)：**
  深度分析發現隱者系統（bexnua.store）存在 9 個問題，其中 campaigns 表為空導致系統完全癱瘓。火鳥系統（freshpathlab.com）正常運作中，有 2,043 筆點擊和穩定的歸因流程。兩個系統共用同一個 D1 資料庫和 line-redirect Worker，修正隱者時必須確保不影響火鳥。
- **決策 (Decision)：**
  我們決定採用「火鳥零影響」原則進行修正：
  1. 只修改隱者專用的程式碼路徑（shadow-cloak.js 和 /track 路由），絕不動火鳥主路由。
  2. 利用 clicks 表現有的 target_link 欄位傳遞隱者網域，而非新增欄位。
  3. N8N 修改採用「有值判斷」邏輯（if target_link 有值則用隱者網域，否則維持火鳥邏輯）。
  4. line_config 的 campaign_id 問題暫不修正，保持現有 MASTER_PIXEL_MAP 備用邏輯。
- **替代方案 (Alternatives Considered)：**
  - **新增 hostname 欄位到 clicks 表**：放棄原因：需要 ALTER TABLE 且修改兩個系統的 INSERT SQL，風險較高。
  - **根據 tag 判斷系統**：放棄原因：兩個系統可能使用相同的 tag（如 js、bf），無法可靠區分。
  - **修改 line_config 加 campaign_id**：放棄原因：會改變火鳥現有穩定的像素取得路徑，引入不必要風險。
- **後果 (Consequences)：**
  - **正面效益：** 火鳥系統完全不受影響，修正風險極低，可逐步驗證。
  - **負面妥協：** target_link 欄位被複用為「來源網域」，語義不完全精確；line_config 缺少 campaign_id 的技術債暫時保留。

---

## [ADR-006] line-redirect ad_code 路徑讀取與大小寫統一策略

- **日期：** 2026-03-31
- **狀態：** accepted
- **背景 (Context)：**
  火鳥系統的 LINE 連結已採用 `https://cx.freshpathlab.com/cX10` 的路徑格式，其中路徑即為 ad_code。但實際使用中大小寫不一致（cX10、CX10、cx10 等都可能出現），導致 line-redirect Worker 的 AD_MAP 查詢失敗，329 筆 clicks 的 ad_code 為空。同時，舊的 query 參數格式（`?a=AS01`）已不再使用。
- **決策 (Decision)：**
  我們決定在 line-redirect Worker 中：(1) 從 URL 路徑讀取 ad_code（取代舊的 query 參數）；(2) 讀取後統一轉成大寫（`.toUpperCase()`），確保 AD_MAP 查詢一致性。AD_MAP 的 key 全部使用大寫格式。
- **替代方案 (Alternatives Considered)：**
  - **雙格式支援（路徑 + query）**：放棄原因：火鳥系統已全面採用路徑格式，無需向後相容 query 參數。
  - **更新所有廣告的 line_links 為統一大寫**：放棄原因：需要改動現有流量，風險較高，且 Worker 端統一處理更簡潔。
- **後果 (Consequences)：**
  - **正面效益：** 無論 LINE 連結中的 ad_code 大小寫如何，Worker 都能正確識別，解決 329 筆 ad_code 為空的歸因問題。
  - **負面妥協：** AD_MAP 的 key 必須全部為大寫，未來新增 ad_code 時需注意此約定。

---

## [ADR-007] 抖影知識系統採用分層逐字稿策略

- **日期：** 2026-03-31
- **狀態：** accepted
- **背景 (Context)：**
  抖影知識系統目前的 AI 摘要品質高度依賴逐字稿品質。既有分析確認，上游逐字稿常出現缺乏標點、專有名詞誤辨與同音錯字等問題，直接削弱摘要可靠性。同時，TikHub `fetch_one_video_v2` 的 9 支影片實測顯示，原生字幕命中率為 0%，無法作為穩定來源。若仍依賴單一 Apify 或單一字幕接口方案，當影片沒有現成字幕時，整條流程會直接失效。
- **決策 (Decision)：**
  我們決定採用分層逐字稿策略，取代單一 Apify 方案：第一層優先使用 Apify 類工具抓取現成字幕；若無可用字幕，第二層改用騰訊雲 ASR 或 GPT-4o-mini 進行補底轉寫；後續若需進一步壓低成本並提升可控性，再評估以 FunASR 作為中文自建 ASR 方案。
- **替代方案 (Alternatives Considered)：**
  - **維持單一 Apify 方案：** 放棄原因為只在影片已存在可提取字幕時有效，覆蓋率無法保證。
  - **完全依賴 TikHub 原生字幕欄位：** 放棄原因為實測 9/9 影片均未提供可直接使用的字幕資料。
  - **直接全面切換自建 ASR（如 FunASR）：** 放棄原因為現階段會增加部署、推理與維運成本，不利快速落地。
- **後果 (Consequences)：**
  - **正面效益：** 兼顧成本、品質與覆蓋率，能以低成本先處理有現成字幕的影片，再用高品質中文 ASR 或多模態模型補足缺口，明顯提升逐字稿可用率與摘要穩定性。
  - **負面妥協：** 流程編排與監控會變得更複雜，需要維護多個供應商接入、錯誤回退邏輯，以及逐字稿來源與成本統計。

---

## [ADR-005] 抖影知識系統由 Cloudflare D1 遷移至 VPS 本地 SQLite

- **日期：** 2026-03-31
- **狀態：** accepted
- **背景 (Context)：**
  抖影知識系統於 2026-03-30 先以 Cloudflare Pages / Workers / D1 為初版上線，搭配 Contabo VPS 執行逐字稿抓取與 AI 摘要處理。然而在實際使用中，首頁載入時間約為 10.3 秒，HTML 體積約 360KB，API 回應約需 2–3 秒，整體體驗不理想。同時，抖影知識屬於內容查詢與批量處理型系統，資料流已高度集中在 VPS 的 Python 腳本與本地檔案環境，繼續將前端、API、資料庫拆散在 Cloudflare 與 VPS 之間，會增加網路往返與除錯成本。
- **決策 (Decision)：**
  我們決定將抖影知識系統由 Cloudflare Pages / Workers / D1 架構，遷移為 **Cloudflare CDN + Nginx + FastAPI + SQLite** 架構。Cloudflare 保留 DNS、CDN 與 Strict SSL 的邊界能力；應用邏輯與資料儲存則集中於 VPS `109.123.230.100`。原 D1 資料完整匯出至本地 SQLite，並以 `tuvral.store` 作為正式入口。
- **替代方案 (Alternatives Considered)：**
  - **維持 Cloudflare Pages / Workers / D1 現狀**：放棄原因為首頁與 API 反應偏慢，且對於需要頻繁讀寫與批量處理的內容型系統，跨平台拆分帶來的延遲與維運複雜度偏高。
  - **僅優化前端，不搬遷 API / 資料庫**：放棄原因為瓶頸不只在前端資源，資料查詢與處理鏈路仍需穿越多層服務，無法根本改善。
  - **改用 VPS 上的 PostgreSQL / MySQL**：放棄原因為現階段資料量仍可由 SQLite 穩定承接，SQLite 部署更輕量、備份更直接、與 Python/FastAPI 整合成本更低。
- **後果 (Consequences)：**
  - **正面效益：** 顯著縮短資料路徑，降低首頁與 API 延遲；應用與資料同機部署，除錯更直接；SQLite 與 Python 生態整合成熟，適合現階段 100+ 影片規模的知識庫型系統；Cloudflare 仍可保留 CDN 與 TLS 優勢。
  - **負面妥協：** 系統對單一 VPS 的依賴增加，需更重視 SQLite 備份、磁碟監控與服務可用性；未來若寫入量或併發顯著成長，可能需要再升級為更完整的資料庫服務。


---

## [ADR-008] 斗篷系統架構統一：保持 Worker 分離，統一配置表

- **日期：** 2026-03-31
- **狀態：** accepted
- **背景 (Context)：**
  隱者系統（Shadow Cloak）與火鳥系統（Line Redirect）已高度耦合，共用同一個 D1 資料庫（cloak-admin-db）。經過深度架構評估，發現存在 5 個核心矛盾點：fbclid 斷鏈、visitor_id 未寫入、campaigns 表為空、group_name 與 tag 斷裂、event_source_url 寫死。需要決策是否合併 Worker、是否統一配置表。

- **決策 (Decision)：**
  我們決定**保持 Worker 分離，統一配置表**。具體方案為：
  1. shadow-cloak 和 line-redirect 各自保持獨立職責，不合併成單一 Worker
  2. 在 campaigns 表新增 tag 欄位，建立與 line_config 表的關聯
  3. 修復 fbclid 傳遞鏈路（shadow-cloak → money-page → line-redirect → clicks → N8N）
  4. 不修改 line_config 表結構，保持火鳥系統現有功能不變

- **替代方案 (Alternatives Considered)：**
  1. **方向 1：維持現狀，在 clicks 表加 source 欄位區分來源**
     - 優點：改動最小
     - 缺點：無法從根本上解決架構混亂，問題會持續累積
  
  2. **方向 2：統一到火鳥系統（把隱者功能合併到 line-redirect）**
     - 優點：配置統一，代碼集中
     - 缺點：line-redirect Worker 會過度膨脹（目前已 1000+ 行），違反單一職責原則，維護難度大幅提升，且會破壞火鳥系統的穩定性
  
  3. **方向 3：統一到隱者系統（把火鳥功能合併到 shadow-cloak）**
     - 優點：隱者系統更完整
     - 缺點：shadow-cloak 已是複雜的判定系統，再加入短鏈接邏輯會導致職責混亂，且會破壞隱者系統的核心功能
  
  4. **方向 4：完全重構，建立新的統一 Worker**
     - 優點：架構最清晰
     - 缺點：工作量最大（需要遷移 22 個火鳥廣告、5 個隱者廣告、所有歷史數據），風險最高，且會導致長期服務中斷

- **後果 (Consequences)：**
  - **正面效益：**
    1. 保持 Worker 分離確保各系統職責清晰，shadow-cloak 專注斗篷判定，line-redirect 專注短鏈接跳轉
    2. 新增 campaigns.tag 欄位建立與 line_config 的關聯，實現隱者與火鳥的配置統一
    3. 修復 fbclid 傳遞鏈路，確保 CAPI 歸因成功，完整打通 Facebook 廣告 → 落地頁 → LINE OA → 歸因 的完整流程
    4. 不破壞火鳥系統現有功能，22 個火鳥廣告繼續正常運作
    5. 漸進式遷移，可以逐步將隱者廣告配置遷移到 campaigns 表，無需一次性重構
  
  - **負面妥協：**
    1. campaigns 表和 line_config 表仍然並存，維護兩套配置邏輯
    2. 需要在多個 Worker 中處理 campaigns.tag 的 fallback 邏輯（無 tag 時 fallback 到 'js'）
    3. 短期內 fbclid 傳遞鏈路需要修改 shadow-cloak、money-page、line-redirect 三個 Worker，工作量相對較大
    4. 需要在前端新增 LINE OA 下拉選單，增加廣告編輯表單的複雜度

- **實施結果 (Implementation)：**
  已完成全部 6 個修復項目：
  1. ✅ D1 campaigns 表新增 tag 欄位
  2. ✅ shadow-cloak.js 修復 fbclid 提取與傳遞
  3. ✅ money-page.js 修復按鈕 URL 注入
  4. ✅ line-redirect /go 路由驗證（無需修改）
  5. ✅ cloak-admin-api 新增 tag 欄位支援和 /line-config/tags 端點
  6. ✅ 前端 Campaigns.tsx 新增 LINE OA 下拉選單
  
  所有修改已部署到正式環境，fbclid 傳遞鏈路已打通，向後相容，不影響火鳥系統。

---

## [ADR-009] LINE 加好友歸因缺口解決方案選擇 LIFF

- **日期：** 2026-04-01
- **狀態：** accepted
- **背景 (Context)：**
  目前用戶從落地頁點擊按鈕加 LINE OA 好友時，系統依靠「點擊時間」與「加好友時間」進行模糊比對來實現歸因，這存在歸因缺口（時間差過大或跨設備會導致歸因失敗）。為實現精準歸因，必須將 `eventID` 或 `vid` 傳遞到 LINE Webhook。但經過調查，LINE 原生加好友連結（`https://line.me/R/ti/p/...`）並不支援自定義參數傳遞到 Webhook 的 `followEvent` 中。
- **決策 (Decision)：**
  我們決定採用 **LINE LIFF (LINE Front-end Framework)** 作為解決方案。透過建立一個輕量級的 LIFF App，讓用戶點擊落地頁按鈕後先跳轉至 LIFF URL（可帶入 `?eventID=xxx&vid=yyy`），在 LIFF App 內部讀取參數並透過 API 發送給後端綁定，隨後再引導用戶加入好友或打開對話視窗。
- **替代方案 (Alternatives Considered)：**
  - **LINE URL Scheme 帶參數**：放棄原因：LINE 官方文件顯示 URL scheme 不支援將自定義參數傳遞給加好友事件。
  - **維持時間比對**：放棄原因：準確率無法達到 100%，且容易受到網路延遲或用戶行為習慣影響。
- **後果 (Consequences)：**
  - **正面效益：** 能實現 100% 精準歸因，將 `eventID` 和 `vid` 與特定的 LINE 用戶完美綁定，徹底解決歸因缺口。
  - **負面妥協：** 開發成本增加，需要註冊 LINE Login Channel、建立 LIFF App；用戶體驗可能多了一層跳轉或需要授權（雖然可設定為最低權限），不如原生加好友連結直接。

---

## [ADR-008] 斗篷系統 LINE 授權綁定改用純 LIFF 模式

- **日期：** 2026-04-01
- **狀態：** accepted
- **背景 (Context)：**
  在實現斗篷系統的 LINE 授權綁定功能時，最初設計為標準的 OAuth 2.0 回調流程，Worker 會檢查 LINE 重定向時附加的 `code` 和 `state` 參數。但在實際測試中發現，用戶在 LINE App 內打開 LIFF URL 時，LINE 並不會將其作為 OAuth 回調處理，而是直接加載網頁，導致缺少參數而報錯。
- **決策 (Decision)：**
  我們決定放棄傳統的 LINE Login OAuth 流程，改為純 LIFF (LINE Front-end Framework) 模式。Worker 的 `/line-login/callback` 路由不再檢查 `code/state`，而是直接返回包含 `liff.js` 的 HTML 頁面，由前端 SDK 自動處理授權並獲取 `userId`，再通過 `/bind` 端點發送給 Worker。同時，我們決定在 `/bind` 路由中加入 `CREATE TABLE IF NOT EXISTS` 邏輯，以確保 Serverless 環境下資料庫表的自動建立。
- **替代方案 (Alternatives Considered)：**
  - **保留 OAuth 並要求用戶在外部瀏覽器打開：** 放棄原因：這會嚴重影響用戶體驗，且違背了使用 LIFF 以實現無縫授權的初衷。
  - **使用手動數據庫遷移腳本：** 放棄原因：對於 Serverless架構（如 Cloudflare Workers + D1），將基礎設施初始化邏輯（如表創建）內嵌在代碼中，能更好地保證部署的自包含性和容錯性。
- **後果 (Consequences)：**
  - **正面效益：** 用戶在 LINE App 內點擊連結即可無縫完成授權和綁定，無需手動登入或跳轉；Worker 部署更加健壯，能自動處理缺失的數據表。
  - **負面妥協：** 授權邏輯從後端移至前端，依賴客戶端執行 JS；`/bind` 端點每次調用都需要執行一次 `CREATE TABLE IF NOT EXISTS` 檢查，略微增加了數據庫開銷。

---

## [ADR-010] LIFF 全量升級與動態跳轉架構決策

- **日期：** 2026-04-01
- **狀態：** accepted
- **背景 (Context)：**
  為了實現 100% 精準歸因，我們之前決定採用 LIFF 綁定流程（ADR-009）。然而，原先的設計是只針對特定的 tag（如 `n21`）走 LIFF 流程，且 LIFF 的跳轉目標（LINE OA）是寫死在環境變數中的。這導致我們無法將 LIFF 綁定推廣到所有廣告活動，因為不同的廣告對應不同的 LINE OA。
- **決策 (Decision)：**
  我們決定**全量升級 LIFF 流程並實現動態跳轉**。具體方案為：
  1. `line-redirect` 移除 `LIFF_TAGS` 的限制，讓**所有** tag（n14-n22、mx、ms、mb 等）的點擊都強制走 LIFF 流程。
  2. 若點擊沒有 `vid`（例如直接點擊短連結），`line-redirect` 會動態生成一個 `vid` 並存入 `clicks` 表。
  3. `line-login-callback` (LIFF Worker) 的跳轉目標改為**動態決定**：從 URL 參數中讀取 `line_id`，並跳轉到 `https://line.me/R/ti/p/@{line_id}`。
  4. N8N 歸因工作流從模糊匹配升級為**精確匹配**：透過 `line_user_id` 查詢 `vid`，再用 `vid` 精確匹配 `clicks` 表。
- **替代方案 (Alternatives Considered)：**
  - **為每個 LINE OA 建立獨立的 LIFF Worker**：放棄原因為維護成本過高，24 個 LINE OA 需要 24 個 Worker 和 24 個 LIFF ID，擴展性極差。
  - **在 line-redirect 中處理綁定邏輯**：放棄原因為 LIFF 需要前端環境執行 JS SDK，無法在純後端的 redirect Worker 中完成。
- **後果 (Consequences)：**
  - **正面效益：** 
    1. 實現了所有廣告活動的 100% 精準歸因，徹底消除了時間窗模糊匹配的誤差。
    2. 架構極具擴展性：單一 LIFF Worker 即可服務所有 LINE OA，新增 OA 無需修改代碼。
    3. 用戶體驗統一：所有用戶點擊連結後都會經歷極短的靜默綁定，然後跳轉到正確的 OA。
  - **負面妥協：** 
    1. 所有用戶都會多出一次短暫的 LIFF 頁面載入時間（通常 < 1秒）。
    2. 如果用戶在非 LINE 環境（如電腦版 Chrome）點擊連結，可能需要掃碼登入 LINE 才能完成綁定（雖然我們已加入超時跳轉機制來緩解此問題）。

---

## [ADR-011] 動態 LIFFID 路由策略

- **日期：** 2026-04-01
- **狀態：** accepted
- **背景 (Context)：**
  隨著多個產品線（TAG）接入 LIFF 授權綁定系統，單一的 LIFFID 無法滿足所有 LINE OA 的綁定需求。每個產品線的 LINE OA 都需要在 LINE Developers Console 中註冊獨立的 LIFF 應用，並取得專屬的 LIFFID。
- **決策 (Decision)：**
  在 `line-redirect` Worker 中引入動態 LIFFID 路由策略：
  1. 建立 `LIFF_MAP` 對應表，將 23 個 TAG 映射到對應的 LIFFID。
  2. 更新 `LIFF_TAGS` 集合，包含所有支援 LIFF 的 TAG。
  3. 在跳轉邏輯中，根據請求的 `tag` 動態查找 `LIFF_MAP`，若找不到則退回預設的 LIFFID（`2009129136-lUm2n85A`）。
- **替代方案 (Alternatives Considered)：**
  - **將對應表存入 D1 或 KV**：放棄原因：為了保證重定向的極致效能，減少資料庫查詢延遲，暫時將對應表硬編碼在 Worker 記憶體中。
- **後果 (Consequences)：**
  - **正面效益：** 實現了多產品線的 LIFF 授權隔離，確保用戶授權時看到的是對應產品線的名稱和圖示，提升信任感。
  - **負面妥協：** 每次新增產品線或更換 LIFFID 時，都需要更新 Worker 代碼並重新部署。

> **2026-04-10 更正註記：** 本段與相鄰 ADR 中提及的 `line-redirect`、分組配置與歸因流程，應按現況重新理解：第一，`group_config` 屬於歷史命名／過渡相容層，現行後台 API 以 `/api/v1/line-groups` 與 `line_groups` 為準；第二，斗篷 + LIFF 現行主路徑為 `shadow-cloak → money-page → LIFF → line-login-callback → N8N`，`line-redirect` 不再是此主鏈路的必經節點；第三，歸因策略以 `vid` 精準匹配為主，45 秒時間窗口只保留為 fallback，而非完全廢棄。

---

## [ADR-012] Shadow Cloak 操作層二次判斷採用「前端攔截 + Worker 複核 + 失敗放行 fallback」

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  現行斗篷系統已具備入口層（isBot、國家、OS、語言、VPN 等）與頁面層（Canvas/WebGL/Audio 指紋、3 秒無互動導安全頁）兩層過濾，但 money page / CTA / LIFF 類關鍵操作仍由前端直接跳轉，缺少「操作當下」的最終複核。這導致前兩層已拿到落地頁的流量，只要直接觸發按鈕，就可能繞過後端再判斷。
- **決策 (Decision)：**
  我們決定在 `shadow-cloak` 內新增第三層「操作層二次判斷」，採用以下做法：
  1. 新增獨立 `POST /cloak-action-verify` 端點，不改動既有 `/cloak-fingerprint` 與 `/cloak-check`。
  2. 由 money page 前端攔截 CTA / LIFF / LINE 類跳轉，先把 `visitor_id`、`session_id`、`fp_score`、`fp_details`、`interaction_count`、`time_on_page`、`target_url` 等上下文回傳給 Worker。
  3. Worker 透過 `cloak_logs` 中 `reason='money_page_served'` 的同網域訪客紀錄確認該 `visitor_id` 為合法進頁訪客，再結合 `fp_score`、互動數、停留時間與 `isBot()` 重新做一次放行判定。
  4. 若 Worker 明確判定不通過，導向安全頁；若前端注入失敗或驗證請求發生網路錯誤，則 fallback 為直接跳轉，避免誤擋真人。
  5. 所有新增前端攔截腳本沿用既有 `obfuscateJS()` 風格處理，避免暴露明顯的驗證控制邏輯。
- **替代方案 (Alternatives Considered)：**
  1. **只在前端做判斷，不回 Worker：** 放棄原因為前端結果可被直接繞過，無法形成真正的操作層服務端複核。
  2. **每次點擊都強制阻擋並要求重新驗證：** 放棄原因為真人體驗過差，且會降低轉化率。
  3. **直接修改既有 `/cloak-check` 端點承擔操作層驗證：** 放棄原因為會混淆端點責任，增加既有頁面層流程回歸風險，不利向後相容。
  4. **把合法訪客先預寫入 clicks 表再做驗證：** 放棄原因為會把尚未完成 CTA 的曝光提早寫成點擊語義，污染下游歸因資料。
- **後果 (Consequences)：**
  - **正面效益：**
    1. 在不破壞前兩層架構的前提下，補上關鍵跳轉前的最後一道服務端判定。
    2. 透過 `money_page_served` 記錄驗證訪客來源，避免憑空構造 `visitor_id` 直接換取真實目標連結。
    3. 採用附加端點與 fallback 放行策略，最大限度降低對既有真人轉化流程的破壞。
    4. 以 `obfuscateJS()` 注入方式延續現有程式風格，降低與既有推廣頁代碼的整合成本。
  - **負面妥協：**
    1. 操作層判斷仍依賴前端成功回傳上下文，若瀏覽器阻擋腳本或請求失敗，系統會退回直接跳轉，安全性與轉化率之間採取偏真人友善的折衷。
    2. 驗證依據目前建立在 `cloak_logs` 的 `money_page_served` 紀錄與啟發式閾值上，未額外引入新表或強型別 session 狀態機，後續若要提高精準度可再配置化。

## 2026-04-09：P0-2 分層日誌重構源碼落地
本次實作在 `05-原始碼/斗篷管理後台/shadow-cloak.js` 完成分層日誌接入，決策上統一以 **Cloudflare D1 綁定 `env.D1`** 作為資料庫入口，避免既有 `DB` / `D1` 綁定名稱不一致導致的新舊代碼混用問題。為了支援完整回溯，於請求開始即生成 `requestId` 與 `startTime`，並擴充 `logD1` 使其攜帶 `request_id`、`session_id` 與 `processing_time_ms`。同時新增 `logDecision` 與 `logInteraction`，將入口層、頁面層與動作層的允許/阻擋判定，以及 fingerprint / action verify 的互動資料，分別寫入 `decisions` 與 `interaction_events`。

在判定點設計上，本次優先覆蓋所有主要 `blocked` 分支，以及 `jwt_passed`、`jwt_replay_reissue`、`jwt_expired_reissue`、`redirect_to_link`、`money_page_served` 等關鍵 `allowed` 分支，確保後台能回溯「在哪一層被擋、原因是什麼、最後導向了什麼目標」。前端注入腳本亦同步攜帶 `request_id`、`visitor_id`、`session_id`，讓 `/cloak-fingerprint` 與 `/cloak-action-verify` 的 interaction log 可以和同一次入口判定建立關聯。


---

## [ADR-013] Verified Bot Allowlist 第一版採用 UA 名錄匹配，暫不啟用 DNS 反查驗證

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  目前 `shadow-cloak` 的 `isBot()` 主要負責攔截可疑流量，依據 UA 黑名單、CIDR、ASN 與手動黑名單做判定，但缺少「先辨識合法 bot」的能力。這使 Googlebot、Bingbot、社群預覽抓取器與監控服務等合法流量，容易與一般可疑 bot 共用同一套阻擋語義，導致日誌中難以區分「被擋的可疑流量」與「被識別的合法爬蟲」。需求是導入 verified bot allowlist，讓已知合法 bot 直接走安全頁並記為 `verified_bot`，同時不破壞既有 `isBot()` 與主流程穩定性。
- **決策 (Decision)：**
  我們決定在 verified bot allowlist 的第一版實作中，採用 **Cloudflare KV 儲存 bot 名錄 + User-Agent pattern 匹配** 的方式進行辨識，並在主流程中將該檢查放在 `isBot()` 之前。對於命中的合法 bot，系統直接導向安全頁，不記為 `blocked`，而是於 `cloak_logs` 記為 `verdict='verified_bot'`，並在 `decisions` 中標註 `matched_rules=['verified_bot_allowlist']`。DNS reverse / forward 驗證暫不納入第一版同步執行。
- **替代方案 (Alternatives Considered)：**
  1. **第一版就加入 DNS reverse + forward 驗證：** 放棄原因為 Cloudflare Workers 內進行 DNS 查詢會增加額外延遲、外部依賴與失敗面，且本次任務目標優先是改善日誌語義與誤判分析，不是建立最高強度的 bot 身份證明鏈。
  2. **沿用既有 `isBot()` 黑名單邏輯，不新增 allowlist：** 放棄原因為合法搜尋引擎與監控服務仍會混入一般 bot 記錄，無法改善後台分析品質，也不利區分誤判與真實風險。
  3. **直接把 verified bot 納入白名單並視同真人放行到金錢頁：** 放棄原因為合法爬蟲仍不應看到金錢頁內容；需求是保護頁面同時改善標記語義，而不是提升其可見權限。
- **後果 (Consequences)：**
  - **正面效益：**
    1. 在不破壞既有 `isBot()` 邏輯的前提下，新增合法爬蟲辨識層，改善入口層流量分類品質。
    2. `verified_bot` 與 `blocked` 分離後，後續日誌分析、誤判排查與規則調整會更清楚。
    3. 採用 KV + UA 名錄的方式實作成本低、延遲低，適合快速落地並持續擴充 bot 名錄。
    4. 若 KV 讀取或 JSON 解析失敗，可安全 fallback 為不檢查 verified bot，不影響現有流量判定鏈路。
  - **負面妥協：**
    1. 僅依賴 UA pattern 仍存在被偽造的可能，無法提供與 DNS 驗證同等級的真實性保證。
    2. verified bot 名錄需要持續維護，若新 bot UA 未納入名錄，仍可能落回既有 `isBot()` 或其他規則處理。
    3. 後續若要提升可信度，仍需額外實作 DNS reverse / forward 驗證、IP 範圍校驗或供應商官方清單同步機制。

- 2026-04-09：P1-2 採用 D1 feature_flags + routing_rules 作為頁面切換控制來源；所有 flag 預設啟用並於讀取失敗時 fallback 啟用；Worker 以請求級快取載入旗標，並在每次 fetch finally 中清空 _flagCache，避免跨請求殘留。另新增 /cloak-flags GET/POST 供後台動態查改旗標，且加上 CORS。

---

## [ADR-014] Shadow Cloak BotD 補強採用核心信號內嵌整合，而不直接引入完整 SDK

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  目前 `shadow-cloak` 的前端指紋檢測已具備 Canvas / WebGL / AudioContext 等基礎信號，但缺少對 Selenium、Puppeteer、Playwright、PhantomJS、Nightmare 與 ChromeDriver 痕跡的專門檢測能力。需求是補上成熟的 bot / automation signals，同時維持現有 Worker 單檔注入架構、避免破壞既有流量判定流程，並將檢測結果一併回傳至 `/cloak-fingerprint` 與 `/cloak-action-verify` 供服務端複核。
- **決策 (Decision)：**
  我們決定不直接引入完整 BotD SDK，而是將其可在現有注入腳本中穩定落地的**核心自動化檢測邏輯**提取並內嵌到 `RAW_CLIENT_JS`。本次採用 10 項信號：`webdriver`、Headless UA、Selenium globals、Selenium document attributes、ChromeDriver `cdc_*`、Playwright globals、Puppeteer globals、PhantomJS globals、Nightmare globals、通知權限異常。前端以 `bot_score` 與 `bot_signals` 回傳服務端；若 `bot_score >= 2`，則在 Worker 記錄 `bot_detected`，並於 `/cloak-action-verify` 直接返回 `verified: false`。同時保留既有 Canvas / WebGL / Audio 指紋計算，僅在 bot 分數達閾值時對整體 `fp_score` 做輕量扣分。
- **替代方案 (Alternatives Considered)：**
  1. **直接引入完整 BotD SDK：** 放棄原因為會增加外部依賴與腳本體積，延長推廣頁載入時間，也會讓注入腳本與現有混淆流程耦合度提高。
  2. **只在服務端以 UA / ASN 規則判定 bot：** 放棄原因為無法覆蓋瀏覽器端的自動化痕跡，對 Selenium / Playwright / Puppeteer 等工具的識別能力不足。
  3. **完全以 bot_score 取代既有 fingerprint score：** 放棄原因為會破壞現有真人 / 低質量流量分層語義，且回歸風險較高。
- **後果 (Consequences)：**
  - **正面效益：**
    1. 避免新增外部 SDK 依賴，降低載入成本並維持現有單檔注入架構。
    2. 可依專案需要自訂 `bot_score` 閾值與 `fp_score` 扣分策略，後續調整成本低。
    3. 既保留原有 Canvas / WebGL / Audio 指紋鏈路，也補足自動化工具特徵，前後端判定語義更完整。
    4. 所有新增檢測均以 `try/catch` 包裹，對瀏覽器相容性失敗採安全降級，不會讓整段 JS 崩潰。
  - **負面妥協：**
    1. 未完整引入 BotD SDK 的所有信號與封裝層，檢測覆蓋面仍低於完整上游實作。
    2. 內嵌邏輯需由專案自行維護；若上游 BotD 後續新增更有效的信號，需要手動比對與同步。
    3. 目前採用啟發式閾值 `bot_score >= 2`，仍需要依實際流量持續觀察誤判與漏判情況。

## 2026-04-09 P1-4/P1-5 page_variants 與模板版本治理
- 決定新增 `page_variants` 表支援同 campaign 多套安全頁/金錢頁模板，按 priority、conditions、weight 做動態選擇。
- 決定新增 `template_versions` 表與 `templates.current_version`、`templates.version_count` 欄位，支援版本快照與回滾。
- 決定在 `shadow-cloak.js` 新增 `/cloak-variants`、`/cloak-template-version`、`/cloak-template-rollback` API，全部補齊 CORS header。
- 決定在安全頁與金錢頁主流程先嘗試 page variant，無配置時完整 fallback 到既有模板/Worker 邏輯，避免破壞現有功能。

---

## [ADR-015] 內容管理與風險判定先做 API 分層解耦，R2 素材管理先落地基礎版索引與框架

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  `shadow-cloak` 目前同時承擔模板內容讀取、版本治理、流量風險判定與頁面回應邏輯。隨著 P1-4/P1-5 已導入 `page_variants` 與 `template_versions`，模板 CRUD 與版本管理需求逐漸獨立，若仍完全混在主判定流程內，後續將難以擴充後台內容管理。同時，P1-7 需要建立 Cloudflare R2 素材管理能力，但現場環境的 `env.R2_ASSETS` binding 可能尚未完成配置；若等 binding 全部就緒才開始開發，會延後資料模型與 API 分層工作。
- **決策 (Decision)：**
  我們決定先在 `shadow-cloak.js` 內新增一層獨立的 `/cloak-content/*` API，將模板內容 CRUD、內容操作日誌與素材管理入口從主風險判定流程中初步拆出；同時先建立 `assets` 與 `content_api_logs` 的 D1 資料表與 API 框架。對於 R2 操作，第一版一律以 `if (env.R2_ASSETS)` 保護：當 binding 已配置時自動執行 `put/delete`，未配置時仍允許 D1 索引與 API 結構先落地，不阻塞整體開發。
- **替代方案 (Alternatives Considered)：**
  1. **等 R2 binding 全部配置完成後再一起實作：** 放棄原因為會讓內容管理分層與資料表設計被外部環境阻塞，延後後台 API 解耦。
  2. **直接把內容管理完全拆成另一個新 Worker：** 放棄原因為本輪目標是 P1 級快速落地，若立即拆成獨立 Worker，會同時引入路由、部署、權限與跨服務調用複雜度，風險高於收益。
  3. **維持模板 CRUD 與風險判定完全耦合：** 放棄原因為後續模板治理、素材引用與後台管理都會持續擴張，若不先做 API 分層，技術債會快速累積。
- **後果 (Consequences)：**
  - **正面效益：**
    1. 模板內容 CRUD、素材索引與操作日誌有了獨立 API 層，後台整合點更清晰。
    2. 即使 R2 binding 尚未配置，D1 索引、API 契約與前後端串接仍可先開始，縮短後續整合時間。
    3. 第一版維持在既有 `shadow-cloak` 內漸進演進，不破壞主流量判定鏈路，回歸風險較低。
    4. 透過 `content_api_logs` 保留內容層操作審計，便於後續追查模板與素材變動。
  - **負面妥協：**
    1. 內容 API 雖已分層，但目前仍與 `shadow-cloak` 同檔共存，尚未做到物理層面的完全拆分。
    2. 第一版 R2 管理以基礎上傳、刪除與索引為主，尚未包含簽名 URL、批次搬移、版本化與快取策略。
    3. 為兼容既有 `templates` schema 差異，程式內加入 schema 自檢與防禦式寫入，短期內會增加一些條件分支複雜度。

---

## [ADR-016] shadow-cloak staging 採用 production schema 直同步，並於 CI 以環境分流綁定 D1 / KV

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  `shadow-cloak-staging` 需要在極短時間內追上 production 的可用資料結構與 Worker 綁定，但 staging D1 明顯落後，只保留 12 張基礎表，而 production 已擴展到 27 張業務表。若逐份重新人工盤點 migration、再按歷史順序重跑，雖然理論上較接近演進軌跡，但會拉長修復時間，也無法保證現場 staging 與 production 之間所有手動補丁都能被完整覆蓋。同時，現有 GitHub Actions 在 staging 部署 `shadow-cloak` 時僅改 Worker 名稱，未同步切換 D1 / KV 綁定，存在 staging 誤連 production 資源的風險。
- **決策 (Decision)：**
  我們決定本次 staging 補齊採用 **production schema 直同步** 策略：直接透過 Cloudflare D1 REST API 讀取 production `sqlite_master`，抽取 staging 缺失資料表的 `CREATE TABLE` 與相關索引定義，並補上共用表中 staging 尚未具備的欄位，讓 staging 儘速追上 production 可用結構。Worker 部署則直接以 `shadow-cloak.js` 建立 `shadow-cloak-staging`，並強制綁定 staging D1 `godview-clicks-staging` 與 staging KV `CLOAKER_CONFIG-staging`。CI/CD 方面，`deploy-workers.yml` 對 `shadow-cloak` 新增 `DEPLOY_ENV=staging` 分支邏輯，於產生 `wrangler.toml` 時切換到 staging 專用 D1 / KV 綁定；production 則保留原配置。
- **替代方案 (Alternatives Considered)：**
  1. **逐份重跑所有歷史 migration：** 放棄原因為 staging 與 production 間可能存在 migration 之外的手動 schema 演進，單靠檔案順序未必能快速追平現況，且耗時較高。
  2. **只部署 Worker，不先補 D1：** 放棄原因為新版 `shadow-cloak` 已依賴 `feature_flags`、`routing_rules`、`page_variants`、`template_versions`、`assets` 等表，若 schema 不完整，staging 測試價值有限且容易在執行期失敗。
  3. **讓 staging 直接共用 production D1 / KV：** 放棄原因為會污染正式資料，且失去 staging 作為隔離驗證環境的意義。
- **後果 (Consequences)：**
  - **正面效益：**
    1. 可用最短路徑讓 staging D1 追上 production 的可用表結構，快速恢復 staging 驗證能力。
    2. staging Worker 綁定與 CI 綁定邏輯一致後，可降低後續再次誤接 production 資源的風險。
    3. 透過 `/cloak-flags` 驗證可直接確認 Worker 已成功部署並能存取 staging D1 / KV。
  - **負面妥協：**
    1. schema 直同步反映的是「當前 production 狀態」，不等同於完整保留歷史 migration 執行軌跡。
    2. 若 production 未來存在人工熱修但未回寫 migration，後續仍需補做正式的 schema source-of-truth 收斂。
    3. 本次為加速處理而使用輔助同步腳本，後續若要長期維護 staging/prod 對齊，仍建議建立正式資料庫 migration / drift 檢查流程。

## [ADR-008] Shadow Cloak 正式端備份與部署至 Production

- **日期：** 2026-04-09
- **狀態：** accepted
- **背景 (Context)：**
  Shadow Cloak 斗篷管理後台已在 staging 環境完成 BotD SDK 補強、verified bot allowlist 導入及多項缺陷修復。為確保正式環境同步最新防護能力，需執行 production 部署。依據 `security-and-safety-rules.md`，生產環境操作需二次確認並保留備份。
- **決策 (Decision)：**
  我們決定執行正式端 shadow-cloak 的全量備份與部署。具體包含：(1) 使用 Cloudflare API 下載 Worker 源碼、匯出 D1 關鍵表資料、讀取 KV 配置；(2) 部署前自動檢查並補齊 D1 表結構與預設資料；(3) 部署最新 `shadow-cloak.js` 並強制保留現有 bindings 以防配置丟失；(4) 執行正式端煙霧測試驗證核心端點與 Googlebot 識別。
- **替代方案 (Alternatives Considered)：**
  - **手動部署：** 風險較高，易遺漏 bindings 或 D1 表結構更新。
  - **Wrangler 部署：** 在 sandbox 環境中配置 wrangler 認證較為繁瑣，且難以精確控制 bindings 保留邏輯，故選擇直接調用 Cloudflare API。
- **後果 (Consequences)：**
  - **正面效益：** 正式環境具備了最新的自動化工具檢測與合法爬蟲識別能力，且備份文件確保了操作的可逆性。
  - **負面妥協：** 部署過程中需暫時調整 `feature_flags` 以驗證 Googlebot 識別，雖已立即還原，但存在極短時間的過濾規則變動。

---

## [ADR-010] Shadow Cloak entry 判定以 campaign 為主，rules 僅保留真正全局規則

- **日期：** 2026-04-10
- **狀態：** accepted
- **背景 (Context)：**
  `shadow-cloak.js` 在演進過程中同時存在 `campaigns`、`rules`、`feature_flags`、`page_variants` 等多個配置來源，而 `cloak-admin` 的 `Campaigns.tsx` 也已提供國家、語言、OS、流量來源、裝置、黑名單與 safe/money page 等 entry 過濾欄位。深度交叉比對後確認，Worker runtime 的主 entry 判定其實已主要依賴 `campaigns`，`rules` 表現況並未承擔獨立且必要的 runtime 決策角色，但資料仍殘留於 staging / production，容易讓維運者誤以為 `rules` 與 `campaign` 會同時生效，造成雙重配置與審計混亂。
- **決策 (Decision)：**
  我們決定將 Shadow Cloak 的 entry 判定正式收斂為 **以 `campaigns` 為主**。與 campaign 已重疊的國家、語言、OS、流量來源、裝置、黑名單與頁面選擇，不再由 `rules` 表承擔；`rules` 未來僅保留 campaign 無法表達的真正全局規則用途，且在重新定義新語義之前，先將 staging / production 既有重複 `rules` 清空，以避免誤用。
- **替代方案 (Alternatives Considered)：**
  - **維持 `campaigns` 與 `rules` 並存共同判定：** 放棄原因為兩者語義重疊，維運時難以判斷哪一層生效，且會增加除錯與審計成本。
  - **全面改回以 `rules` 為主、campaign 僅做 UI 映射：** 放棄原因為前端與營運流程早已以 campaign 為主要操作面，倒退回 `rules` 會增加資料同步與使用成本。
  - **立即重新設計一套新的全局規則 DSL：** 放棄原因為目前沒有對應迫切需求，先完成來源收斂比先重構規則語言更能降低風險。
- **後果 (Consequences)：**
  - **正面效益：** entry 判定來源單一化，前端配置與 Worker runtime 對齊；`allow_desktop` / `allow_mobile` 與 `blacklist_rules.country` 等既有 campaign 欄位終於真正生效；staging / production `rules` 表回到乾淨狀態，後續若要重新引入全局規則，邊界會更清楚。
  - **負面妥協：** 若未來確實需要跨 campaign 的全局規則能力，仍需重新定義 `rules` 的新語義與治理方式；在此之前，所有 entry 類過濾能力都必須持續透過 campaign 欄位擴充與維護。
