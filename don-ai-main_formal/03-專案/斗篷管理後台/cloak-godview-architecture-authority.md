---
title: 斗篷 × 上帝視角現行權威架構文件
author: Manus AI
status: authoritative
last_verified: 2026-04-10
source_policy: source-code-first
scope:
  - 05-原始碼/斗篷管理後台/shadow-cloak.js
  - 05-原始碼/斗篷管理後台/cloak-admin-api.js
  - 05-原始碼/斗篷管理後台/migrations/*.sql
  - 05-原始碼/斗篷管理後台/wrangler-shadow-cloak.toml
  - 05-原始碼/斗篷管理後台/wrangler-shadow-cloak-staging.toml
  - 05-原始碼/斗篷管理後台/wrangler.toml
  - 05-原始碼/上帝視角/wrangler.toml
  - 03-專案/斗篷管理後台/wrangler.toml
  - .github/workflows/deploy-workers.yml
  - 07-配置與環境/time_attribution_modified.json
  - 03-專案/斗篷管理後台/pixel-pipeline-fix-report.md
---

# 斗篷 × 上帝視角現行權威架構文件

本文是 **don-ai 倉庫中「斗篷 × 上帝視角」系統現況的唯一權威參考**。判定原則不是沿用歷史敘述，而是以 **現行 Worker 原始碼、Wrangler 部署設定、migration、GitHub Actions 部署流程，以及已在倉庫內留下更正註記的文件** 為準。凡與本文矛盾的舊文件，一律視為歷史材料，不再作為現況依據。[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

> 本文件刻意把「現行主路徑」、「備援路徑」與「歷史相容/已廢棄」分開書寫，目的就是避免新同事與 AI 助手被舊命名、舊資料模型或舊分流鏈路誤導。[1] [2] [9] [10]

## 1. 現行系統架構總覽

現行系統可以概括為三個運作層。第一層是 **入口與判定層**，由 `shadow-cloak` 依請求 hostname、Campaign 設定、流量條件與風控訊號決定訪客應進入安全頁或推廣頁。第二層是 **後台管理層**，由 `cloak-admin-api` 暴露 Campaign、Template、Pixel、LINE 設定、群組與日誌查詢 API。第三層是 **頁面/轉向輔助層**，包括 `safe-page`、`money-page`、`preview-page`、`line-redirect` 與 `line-login-callback` 等 Worker，其中部分仍為主流程備援，部分已降為歷史相容或周邊用途。[1] [2] [3] [4] [5] [6] [8]

| Worker / 元件 | 現行用途 | 已驗證域名 / 路由狀態 | 綁定與環境 | 現況判定 |
|---|---|---|---|---|
| `shadow-cloak` | 現行入口 Worker。依 hostname 取 `campaigns` 設定，執行入口過濾、頁面選擇、CTA 嵌入、`/cloak-fingerprint`、`/cloak-action-verify`、`/cloak-check`。 | **不是固定單一入口域名**；實際入口由 `campaigns.link` 與請求 `hostname` 決定。程式內明文使用 `safe-page.laoqin1689.workers.dev` 與 `money-page.laoqin1689.workers.dev` 作為 fallback 服務位址。[1] | Production 綁 `godview-clicks` D1 與 production `CLOAKER_CONFIG`；staging 綁 `godview-clicks-staging` 與 staging `CLOAKER_CONFIG`。[3] [4] [9] | **主路徑核心** |
| `cloak-admin-api` | 現行管理後台 API。提供 Campaign、Pixel、Template、LINE、群組、Dashboard、Logs、Shortlinks、Domains 等 API。 | Wrangler 已驗證 production 名稱與 staging 名稱，但本次核對範圍內 **未見自訂 route 明文**；可確認 `health` 與 `/api/v1/*` 為現行 API 面。[2] [5] | Production 綁 `godview-clicks` + production `CLOAKER_CONFIG`；staging 使用 `[env.staging]`，綁 `godview-clicks-staging` + staging `CLOAKER_CONFIG`。[5] | **主路徑核心** |
| `safe-page` | 安全頁 Worker。當 D1 template / page variant 取用失敗時，`shadow-cloak` 直接抓取此 Worker 輸出 HTML。 | `https://safe-page.laoqin1689.workers.dev/?t=...`。[1] | 由 GitHub Actions 納入部署集合；未見額外 D1/KV 綁定需求的現行證據。[9] | **主路徑 fallback** |
| `money-page` | 推廣頁 Worker。當 D1 template 不可用且沒有命中 `moneyVariant` 時，由 `shadow-cloak` 抓取此 Worker 作為推廣頁 fallback。 | `https://money-page.laoqin1689.workers.dev/?t=...`。[1] | 由 GitHub Actions 納入部署集合；獨立 wrangler 已證明 Worker 存在。[9] [11] | **主路徑 fallback** |
| `preview-page` | 預覽頁 Worker，用於部署集合中的獨立頁面元件。 | 本輪已驗證其被 CI/CD 納入現行部署，但 **未在已核對源碼中找到明文公開 route**。[9] | 由 GitHub Actions 納入部署集合。[9] | **周邊現行元件** |
| `line-redirect` | 上帝視角歷史轉向 Worker，仍在部署清單中，且綁定 production D1。 | Wrangler 已證明其為獨立 Worker，但本輪未在已核對程式中找到明文公開 route。[6] [9] | Production 由 CI/CD 生成 D1 綁定；staging 明確不在自動部署主範圍註記內。[6] [9] | **已非主路徑，仍保留** |
| `line-login-callback` | LINE/LIFF 登入回呼 Worker，承接 `LIFF_ID` 與 `LINE_OA_ID` 的 callback 場景。 | `https://line-login-callback.laoqin1689.workers.dev/*`。[8] | 綁 production `godview-clicks` D1，未見 KV/R2 綁定。[8] | **現行周邊元件** |

### 1.1 D1、KV、R2 現況

目前已在現行 Wrangler 設定中明確驗證兩套 D1 與兩套 KV。`cloak-admin-api` 與 `shadow-cloak` 都有 production / staging 對照；`line-redirect` 與 `line-login-callback` 則只在已核對設定中看見 production D1 綁定。**本輪沒有在現行 Wrangler 設定中驗證到任何 active R2 bucket 綁定**；雖然 migration `007_content_decouple_r2.sql` 建立了 `assets` 與 `content_api_logs` 等表，表示曾有內容解耦/R2 方向的設計，但目前不能把它寫成已啟用的現行 R2 架構。[3] [4] [5] [6] [7] [8]

| 類型 | Production | Staging | 說明 |
|---|---|---|---|
| D1 | `godview-clicks` (`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`) | `godview-clicks-staging` (`594f8569-ad3c-40c0-ac7c-8b691f9d7885`) | `shadow-cloak` 與 `cloak-admin-api` 的核心資料庫對照已在 Wrangler 中明文定義。[3] [4] [5] |
| KV | `CLOAKER_CONFIG` (`cfca8f5e3aa84d33b889cddfc5d5763c`) | `CLOAKER_CONFIG` (`40f192e8fc514af1b6a55eff8f63bbff`) | 供 feature flags / cloaker config 類設定讀取使用。[3] [4] [5] |
| R2 | **未驗證到現行 bucket 綁定** | **未驗證到現行 bucket 綁定** | migration 顯示有內容解耦設計，但現行部署設定未見 R2 binding。[7] |

## 2. 現行資料模型

現行資料模型不能再用單一年代的 schema 理解，因為這套系統同時存在 **現行主表**、**現行輔助表** 與 **歷史相容表**。判定原則是：凡 `shadow-cloak.js` runtime、`cloak-admin-api.js` 現行 API、以及 migration 持續維護的資料表，視為現行；凡已被註解為「舊 rules 不再參與 runtime 判定」、或只剩 CRUD / 舊脈絡用途者，視為歷史相容。[1] [2] [7]

| 資料表 | 用途 | 現況分類 |
|---|---|---|
| `campaigns` | 入口 hostname 對應、國家/裝置/來源/像素/頁面/連結等主設定來源。`shadow-cloak` 以 `link = hostname` 且 `status = 'active'` 取用。 | **現行主表** [1] [7] |
| `clicks` | 上帝視角/斗篷點擊主記錄表，保存 `visitor_id`、像素、來源、裝置、IP、目標鏈結、matched 狀態等歸因資料。 | **現行主表** [6] [7] [10] |
| `interaction_events` | 分層互動事件日誌，承接 fingerprint、action verify 等細粒度互動。 | **現行主表** [7] |
| `decisions` | 分層決策日誌，記錄 entry / page / action 層的 allowed/blocked 與 reason。 | **現行主表** [7] |
| `feature_flags` | runtime 功能旗標，例如 maintenance / fingerprint / action verify 等。 | **現行主表** [1] [7] |
| `routing_rules` | 入口判定補充規則，可驅動 `force_safe_page` 等覆寫邏輯。 | **現行主表** [1] [7] |
| `page_variants` | 現行安全頁/推廣頁變體選擇表，支援條件與權重。 | **現行主表** [1] [7] |
| `templates` | D1 版型內容主表，安全頁與推廣頁都可直接由此渲染。 | **現行主表** [1] [7] |
| `template_versions` | 模板版本歷史。 | **現行輔助表** [7] |
| `domains` | 後台管理的網域資料。 | **現行輔助表** [2] [7] |
| `short_links` | 短鏈結管理。 | **現行輔助表** [2] [7] |
| `round_robin_state` | `routing_strategy = round_robin` 時保存目前索引。 | **現行輔助表** [1] [7] |
| `line_config` | LINE/LIFF 設定資料表，供後台 `/api/v1/line-config` CRUD。 | **現行輔助表** [2] [7] |
| `line_groups` | 現行 LINE 群組 API 對應表，供 `/api/v1/line-groups` CRUD。 | **現行輔助表（現行 API 命名）** [2] |
| `line_user_bindings` | LINE 使用者與 `vid` 綁定資料來源；n8n 會用它把 follow 事件對回 `clicks.visitor_id`。 | **現行主表（定義不在本輪 migration 內，但被流程直接使用）** [7] [10] |
| `pixel_groups` | 現行像素主源之一；`shadow-cloak` runtime 以此參與 CAPI 像素解析。 | **現行主表** [1] [10] |
| `pixel_group_ads` | 現行像素主源之一；與 `pixel_groups` 組成現行像素主映射。 | **現行主表** [1] [10] |
| `pixels_library` | 後台像素 CRUD 使用的表；現行 admin API 仍直接讀寫，但已不是 runtime 唯一主源。 | **歷史相容表 / 後台相容表** [1] [2] [10] |
| `cloak_logs` | 舊式粗粒度 cloaking log；新分層日誌上線後，不再是唯一權威 log。 | **歷史相容表** [1] [7] |
| `rules` | 歷史規則表；`shadow-cloak` 內已明文註記「舊 rules 表不再參與 runtime 判定」。 | **歷史相容表** [1] [7] |
| `ad_config` | 初代廣告配置表，已不再是現行 runtime 主配置來源。 | **歷史相容表** [7] |
| `scraped_pages` | 模板抓取/匯入類輔助資料。 | **現行輔助表** [2] [7] |
| `assets` | 內容解耦/R2 方向的資產索引表。 | **保留/未完全啟用** [7] |
| `content_api_logs` | 內容 API 日誌。 | **保留/未完全啟用** [7] |

### 2.1 像素資料模型的權威結論

**現行 runtime 的像素主源是 `pixel_groups + pixel_group_ads`，不是 `pixels_library`。** 這件事不能再依舊報告理解，因為 `shadow-cloak.js` 已明文註解「統一 CAPI 像素解析：只從 `pixel_groups + pixel_group_ads` 讀取」，而 2026-04-10 的更正文件也已把 `pixels_library` 重新界定為「後台管理／歷史資料模型脈絡，而非當前執行期唯一主來源」。因此，凡是描述 `pixels_library` 為斗篷執行期唯一像素主表的歷史文件，一律視為過時。[1] [10]

> 權威口徑：`pixel_groups + pixel_group_ads` 是 **現行像素主源**；`pixels_library` 是 **後台管理與歷史相容資料**。[1] [2] [10]

### 2.2 LINE 群組資料模型的權威結論

**現行 API 命名是 `line_groups`，不是 `group_config`。** 已核對的 `cloak-admin-api.js` 只暴露 `/api/v1/line-groups` 這組 CRUD 路由，並直接對 `line_groups` 表執行查詢、建立、更新與刪除。換言之，若歷史文件仍用 `group_config` 指稱現行群組 API，應視為歷史命名，不應再拿來指導新實作或新文件。[2]

> 權威口徑：對外 API 與資料模型請以 `line_groups` / `/api/v1/line-groups` 為準；`group_config` 僅能視為舊命名脈絡，不是現行 API 名稱。[2]

## 3. 現行流量處理鏈路

現行鏈路必須分成 **入口層 → 頁面層 → 操作層** 三段理解。這是目前 `shadow-cloak` 的真正運作方式，也是最容易被舊文件寫錯的地方。[1]

### 3.1 入口層：hostname 取設定，先做伺服器端判定

當請求進入 `shadow-cloak` 時，Worker 先以 `url.hostname` 到 `campaigns` 取 `status = 'active'` 的設定；這表示入口不是靠舊式單一路由表，而是以 **hostname 對應 campaign** 的方式運作。取到設定後，系統再讀取 feature flags / routing context，並在 maintenance mode 或 routing rule 強制安全頁時直接落到安全頁。[1] [3] [4]

入口層的 **主路徑判定順序** 應理解為：先確認 campaign 與 routing 狀態，再做黑名單規則、來源限制、裝置/OS/語言/國家/地區/住宅 IP / `fbclid` 等過濾，最後才決定是否允許進入頁面層。特別是黑名單規則已被寫成「最高優先級」，且 `shadow-cloak.js` 明文註解：**campaign 是 entry 過濾唯一主來源，舊 `rules` 表不再參與 runtime 判定**。因此，任何仍把 `rules` 表當作現行入口主判定源的文件，都是錯的。[1]

| 層級 | 現行主路徑 | fallback | 已廢棄/不再作主源 |
|---|---|---|---|
| 入口層 | `hostname` → `campaigns` → feature flags / routing rules → 黑名單 / 條件判定。[1] | `campaigns.country` 作 `cloak_country` 相容欄位；`link_strategy` 作 `routing_strategy` 相容欄位。[1] | `rules` 表已不再參與 runtime 主判定。[1] [7] |

### 3.2 頁面層：先 D1 variant/template，後 Worker fallback

頁面層的現行原則是 **D1 優先，Worker 次之**。安全頁先看 `page_variants`，若命中 `safe_page` 變體且可從 `templates` 取到 HTML，直接由 D1 渲染；若沒命中，再看 `campaignConfig.safe_page_type === 'template'` 時是否能從 `templates` 直接讀取；最後才 fallback 到 `safe-page` Worker。推廣頁同理，先以 `page_variants` / `templates` 作主渲染來源，若 D1 模板不可用，才 fallback 到 `money-page` Worker；如果甚至沒有模板，但已選出 `targetLink`，則再 fallback 到「直接輸出一個極簡 HTML，50ms 後自動跳轉目標連結」。[1]

這個層級裡還有一個常被舊文件寫錯的點：**現行 target link 的主選擇順序是 `line_links` 優先，`customer_links` 次之**，而選擇策略則以 `routing_strategy` 決定 `random`、`round_robin` 或 `ip_hash`。因此，如果舊文件還把 `customer_links` 寫成唯一主路徑，就與現況不符。[1]

| 層級 | 現行主路徑 | fallback | 已廢棄/不再作主源 |
|---|---|---|---|
| 頁面層 | `page_variants` + `templates` 渲染安全頁/推廣頁；連結主選擇使用 `line_links`。[1] | `safe-page` Worker、`money-page` Worker、最後直接 redirect HTML。[1] | 把外部 Worker 頁面當成唯一主頁面來源的舊說法已失效。[1] |

### 3.3 操作層：`fingerprint` + `action verify` 的雙段驗證

進入頁面層後，頁面內嵌的 JS 會先執行 `fingerprint`，把分數、bot signals、visitor/session/request 資訊送到 `/cloak-fingerprint`。若 bot 分數過高、指紋分數不足，使用者會被送回安全頁；若通過，才保留在頁面上等待 CTA 操作。當使用者點擊 CTA、LIFF 或 LINE 連結時，前端不再直接裸跳，而是先呼叫 `/cloak-action-verify`，帶上 `fp_score`、`bot_score`、互動次數、停留時間與目標 URL，再由 Worker 決定是否放行到 target 或改送安全頁。[1]

因此，操作層的 **現行主路徑** 不是「點了就跳」，而是「頁面先過指紋、點擊再過 action verify」。這也說明了 `shadow-cloak` 已經從早期純入口判定，演進成 **入口 + 頁面 + 行為** 三段式風控鏈路。[1]

| 層級 | 現行主路徑 | fallback | 已廢棄/不再作主源 |
|---|---|---|---|
| 操作層 | `/cloak-fingerprint` → `/cloak-action-verify` → 目標連結。[1] | 功能旗標可關閉 fingerprint / action verify；錯誤時前端可退回原 target 或安全頁。[1] | 純前端無驗證直跳，已不是權威主路徑。[1] |

### 3.4 `line-redirect` 的實際狀態

`line-redirect` **仍然存在、仍在 CI/CD 部署清單內、仍綁定 D1**，所以它不是已刪除元件；但依現行 `shadow-cloak.js` 的主流程，它已 **不是主鏈路中的必要節點**。現行 `shadow-cloak` 會直接把 `vid` 參數拼入被選中的 `targetLink`，並在 CTA 點擊時透過 `/cloak-action-verify` 做最後放行。換言之，`line-redirect` 在目前權威架構中的定位應寫成：**保留中的歷史/周邊 Worker，而非現行斗篷主路徑核心**。[1] [6] [9]

### 3.5 LIFF 融合方案現況

已核對的現行鏈路顯示，**`vid` 是 LIFF / follow 歸因的主鍵主路徑**。`shadow-cloak` 在 CTA URL 上直接附加 `vid=${visitorId}`；而現行 n8n 歸因流程則以 `line_user_bindings.vid = clicks.visitor_id` 做精準查詢，命中後把 click 標成 `matched = 1`，這構成了目前最明確、最可驗證的 LIFF 融合主鏈路。[1] [10]

至於「**45 秒 fallback**」這一點，現行流程文件名稱與既有運營口徑都指向它仍屬次路徑設計，但在本次已核對到的 `time_attribution_modified.json` 片段中，我們能直接驗證的是 `vid` 精準匹配主鏈，而 **未在本次擷取片段中完整抽出 45 秒條件邏輯的可引用程式碼**。因此，本文將其列為 **次路徑/備援口徑**，但不把它升格成比 `vid` 更高權威的實作主源。[1] [10]

> 權威口徑：LIFF 融合現況應寫成「**`vid` 為主；45 秒視為 fallback/次路徑，不得反寫成主鏈路**」。[1] [10]

## 4. 現行 API 端點列表

### 4.1 `shadow-cloak` Worker API

`shadow-cloak` 的 API 面很小，但每一個都直接在主鏈路上。它本質不是一個純 REST 後台，而是一個把入口頁面回應與風控 API 合併在同一 Worker 的入口服務。[1]

| 端點 | 方法 | 用途 | 認證狀態 | 現況 |
|---|---|---|---|---|
| `POST /cloak-fingerprint` | `POST` | 接收前端指紋與 bot signal，決定頁面層是否放行。 | **公開**。由頁面 JS 直接呼叫，未見管理認證。 | **現行主路徑** [1] |
| `POST /cloak-action-verify` | `POST` | 接收 CTA 點擊時的互動數、停留時間、fp/bot 分數與 target URL，決定是否放行。 | **公開**。由頁面 JS 直接呼叫，未見管理認證。 | **現行主路徑** [1] |
| `POST /cloak-check` | `POST` | 額外的檢查端點，屬頁面/入口輔助判定 API。 | **公開**。未見管理認證。 | **現行輔助端點** [1] |
| `/*` | 主要為 `GET`（亦由 `fetch` 統一接管） | 入口頁面請求；依 hostname 與 campaign 決定回安全頁、推廣頁或 redirect HTML。 | **公開**。屬入口網站面。 | **現行主路徑** [1] |

### 4.2 `cloak-admin-api` Worker API

經本輪核對，`cloak-admin-api.js` 在 `/api/*` 上只掛了 CORS，**沒有在已核對區段看到任何 API token / Bearer / session 驗證中介層**。因此，就程式事實而言，這些端點目前應視為 **未在 Worker 內做認證保護**；若實際環境存在其他網關限制，那是 Worker 外層的事，不應反寫成此檔案已內建認證。[2] [5]

| 端點 | 方法 | 用途 | 認證狀態 |
|---|---|---|---|
| `/health` | `GET` | 健康檢查。 | **公開** [2] |
| `/api/v1/system/links` | `GET` | 取得可用系統 links / domains 清單。 | **公開** [2] |
| `/api/v1/domains/` | `GET` | 取得 domains 清單。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/zones` | `GET`, `POST` | Cloudflare zone 查詢與建立綁定前流程。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/zones/:zoneId/check` | `POST` | 檢查指定 zone。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/bind` | `POST` | 域名綁定。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/:id/unbind` | `PUT` | 解除綁定。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/:id/note` | `PUT` | 更新 domain 備註。 | **未見 Worker 內認證** [2] |
| `/api/v1/domains/check-dns` | `POST` | DNS 檢查。 | **未見 Worker 內認證** [2] |
| `/api/v1/shortlinks/` | `GET`, `POST` | 短鏈結列表與建立。 | **未見 Worker 內認證** [2] |
| `/api/v1/shortlinks/:id` | `PUT`, `DELETE` | 短鏈結更新與刪除。 | **未見 Worker 內認證** [2] |
| `/api/v1/shortlinks/:id/logs` | `GET` | 短鏈結日誌。 | **未見 Worker 內認證** [2] |
| `/api/v1/campaigns` | `GET`, `POST` | Campaign 列表與建立。 | **未見 Worker 內認證** [2] |
| `/api/v1/campaigns/stats` | `GET` | Campaign 統計。 | **未見 Worker 內認證** [2] |
| `/api/v1/campaigns/metrics` | `GET` | Campaign metrics。 | **未見 Worker 內認證** [2] |
| `/api/v1/campaigns/:id` | `GET`, `PUT`, `DELETE` | 單一 Campaign 讀取、更新、刪除。 | **未見 Worker 內認證** [2] |
| `/api/v1/pixels` | `GET`, `POST` | 像素列表與建立（對 `pixels_library`）。 | **未見 Worker 內認證** [2] |
| `/api/v1/pixels/:id` | `GET`, `PUT`, `DELETE` | 單一像素 CRUD。 | **未見 Worker 內認證** [2] |
| `/api/v1/groups` | `GET` | 群組列表。 | **未見 Worker 內認證** [2] |
| `/api/v1/liff-options` | `GET` | LIFF 選項資料。 | **未見 Worker 內認證** [2] |
| `/api/v1/line-config` | `GET`, `POST` | LINE 設定列表與建立。 | **未見 Worker 內認證** [2] |
| `/api/v1/line-config/:tag` | `GET`, `PUT`, `DELETE` | 單一 LINE 設定 CRUD。 | **未見 Worker 內認證** [2] |
| `/api/v1/line-groups` | `GET`, `POST` | 現行 `line_groups` API 列表與建立。 | **未見 Worker 內認證** [2] |
| `/api/v1/line-groups/:id` | `GET`, `PUT`, `DELETE` | 現行 `line_groups` API 單筆 CRUD。 | **未見 Worker 內認證** [2] |
| `/api/v1/dashboard/stats` | `GET` | Dashboard 統計。 | **未見 Worker 內認證** [2] |
| `/api/v1/logs` | `GET` | 日誌查詢。 | **未見 Worker 內認證** [2] |
| `/api/v1/clicks` | `GET` | 點擊查詢。 | **未見 Worker 內認證** [2] |
| `/api/v1/templates/crawl` | `POST` | 模板抓取。 | **未見 Worker 內認證** [2] |
| `/api/v1/templates/scrape` | `POST` | 模板爬取。 | **未見 Worker 內認證** [2] |
| `/api/v1/templates` | `GET`, `POST` | 模板列表與建立。 | **未見 Worker 內認證** [2] |
| `/api/v1/templates/:id/preview` | `GET` | 模板預覽。 | **未見 Worker 內認證** [2] |
| `/api/v1/templates/:id` | `GET`, `PUT`, `DELETE` | 單一模板 CRUD。 | **未見 Worker 內認證** [2] |

## 5. 現行部署架構

### 5.1 staging / production 對照

目前 production 與 staging 的差異，主要體現在 `shadow-cloak` 與 `cloak-admin-api` 的 D1/KV 指向，以及部署名稱。`cloak-admin-api` 使用單一 `wrangler.toml` 加 `[env.staging]`；`shadow-cloak` 則分別有 production 與 staging 的 Wrangler 檔。對其他 Worker，GitHub Actions 會用臨時產生的 `wrangler.toml` 部署，staging 時除 `cloak-admin-api` 外都以 `--name "${WORKER}-staging"` 的方式命名。[3] [4] [5] [9]

| 元件 | Production | Staging |
|---|---|---|
| `cloak-admin-api` | 使用 `05-原始碼/斗篷管理後台/wrangler.toml` 預設環境。 | 使用同檔案內 `[env.staging]`，Worker 名稱為 `cloak-admin-api-staging`。[5] |
| `shadow-cloak` | `wrangler-shadow-cloak.toml` 指向 production D1/KV。 | `wrangler-shadow-cloak-staging.toml` 指向 staging D1/KV，CI 部署名稱為 `shadow-cloak-staging`。[3] [4] [9] |
| 其他 Worker | `wrangler deploy` 直接部署 Worker 名稱。 | 除 `cloak-admin-api` 外皆以 `--name "${WORKER}-staging"` 方式部署。[9] |

### 5.2 CI/CD 流程（GitHub Actions）

現行 CI/CD 的權威流程是 `.github/workflows/deploy-workers.yml`。它會在 `main` 或 `staging` 分支收到 `05-原始碼/**/*.js` 或 `05-原始碼/**/*.toml` 的 push 時觸發，也支援手動 `workflow_dispatch`。系統先偵測變更檔，再把它映射到 Worker 名稱；若是手動觸發，就一次部署整個 Worker 集合：`cloak-admin-api`、`line-redirect`、`money-page`、`preview-page`、`safe-page`、`shadow-cloak`。之後流程安裝 Wrangler、為每個 Worker 準備專用或臨時 `wrangler.toml`，並依 branch 決定部署到 production 或 staging。部署完成後，還會回寫 `05-原始碼/deploy-record.json`，記錄部署時間、commit hash、環境與執行者。[9]

> 權威口徑：目前自動部署集合就是 `cloak-admin-api`、`line-redirect`、`money-page`、`preview-page`、`safe-page`、`shadow-cloak`；其中 staging 對 `line-redirect-staging` 有註記，不把它視為與 production 完全同等的自動部署主項。[9]

### 5.3 備份機制

在本次已核對範圍內，**可以明確驗證的備份機制是 repo 內快照式備份，而不是已明文化的自動雲端備份管線**。`05-原始碼/斗篷管理後台/backups/` 目錄中已存在 D1、production/staging KV 與 `shadow-cloak` 程式碼的時間戳快照，例如 `d1-20260409-pre-p0p1.json`、`kv-production-20260409.json`、`kv-staging-20260409.json`、`shadow-cloak-20260409-pre-p0p1.js`。因此，本文只能把目前權威備份口徑寫成：**有 repo 內快照備份證據，但未在本輪已核對設定中看到完整自動化備份 workflow 的明文實作**。[12] [13] [14] [15]

## 6. 已廢棄 / 歷史組件清單

已廢棄不代表「檔案不存在」，而是代表它 **不再是現行主路徑的權威來源**。以下清單是目前最容易誤導人的歷史殘留項目。[1] [2] [6] [7] [10]

| 歷史殘留項目 | 類型 | 廢棄 / 降級原因 | 現行替代方案 |
|---|---|---|---|
| `rules` | D1 表 | `shadow-cloak.js` 已明文註解不再讓舊 `rules` 表參與 runtime 判定。 | `campaigns` + `feature_flags` + `routing_rules`。[1] [7] |
| `pixels_library` 作為 runtime 唯一主源 | 資料模型認知 | 現行 runtime 像素解析已改為 `pixel_groups + pixel_group_ads`。 | `pixel_groups` + `pixel_group_ads`；`pixels_library` 僅保留後台/歷史相容。[1] [2] [10] |
| `group_config` 命名 | 歷史命名 | 現行 API 與資料表命名已是 `line_groups`。 | `line_groups` / `/api/v1/line-groups`。[2] |
| 單靠外部 `safe-page` / `money-page` Worker 作頁面主來源 | 架構描述 | 現行頁面優先從 `page_variants` + `templates` 讀 D1；外部 Worker 已降為 fallback。 | D1 `page_variants` + `templates`。[1] [7] |
| `line-redirect` 作為斗篷主轉向鏈路 | Worker 角色 | 現行 `shadow-cloak` 直接把 `vid` 嵌入 target link 並自行完成 action verify；`line-redirect` 不再是主流程必要節點。 | `shadow-cloak` 內建 CTA / verify 鏈路。[1] [6] [9] |
| `campaigns.country`、`link_strategy` | 歷史欄位語義 | 現行語義已由 `cloak_country`、`routing_strategy` 主導；舊欄位只作相容。 | `cloak_country`、`routing_strategy`。[1] |
| `cloak_logs` 作為唯一判定日誌 | 觀測模型 | 新版已引入 `interaction_events` 與 `decisions` 的分層記錄。 | `interaction_events` + `decisions`。[1] [7] |

## 7. 權威結論

如果只保留一句話，現行「斗篷 × 上帝視角」應這樣理解：**`shadow-cloak` 是入口與風控主核心，`cloak-admin-api` 是現行管理面，D1 主配置以 `campaigns` / `clicks` / `decisions` / `interaction_events` / `page_variants` / `templates` 為骨幹，像素主源已切換到 `pixel_groups + pixel_group_ads`，LIFF 融合以 `vid` 為主鏈，`safe-page`、`money-page` 與 `line-redirect` 都不能再被寫成高於 D1 主鏈路的權威核心。**[1] [2] [3] [4] [5] [6] [7] [9] [10]

任何新文件、新任務說明、新同事交接與 AI 助手提示，都應直接引用本文，而不是回頭拼接歷史文件敘述。[1] [2] [10]

## References

[1]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/shadow-cloak.js "shadow-cloak.js"
[2]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/cloak-admin-api.js "cloak-admin-api.js"
[3]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/wrangler-shadow-cloak.toml "wrangler-shadow-cloak.toml"
[4]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/wrangler-shadow-cloak-staging.toml "wrangler-shadow-cloak-staging.toml"
[5]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/wrangler.toml "cloak-admin-api wrangler.toml"
[6]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E4%B8%8A%E5%B8%9D%E8%A6%96%E8%A7%92/wrangler.toml "godview wrangler.toml"
[7]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/migrations/001_init_schema.sql "001_init_schema.sql"
[8]: ./wrangler.toml "line-login-callback wrangler.toml"
[9]: ../../.github/workflows/deploy-workers.yml "deploy-workers.yml"
[10]: ../../07-%E9%85%8D%E7%BD%AE%E8%88%87%E7%92%B0%E5%A2%83/time_attribution_modified.json "time_attribution_modified.json"
[11]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E4%B8%8A%E5%B8%9D%E8%A6%96%E8%A7%92/wrangler-money-page.toml "wrangler-money-page.toml"
[12]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/backups/d1-20260409-pre-p0p1.json "d1 backup snapshot"
[13]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/backups/kv-production-20260409.json "production kv backup snapshot"
[14]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/backups/kv-staging-20260409.json "staging kv backup snapshot"
[15]: ../../05-%E5%8E%9F%E5%A7%8B%E7%A2%BC/%E6%96%97%E7%AF%B7%E7%AE%A1%E7%90%86%E5%BE%8C%E5%8F%B0/backups/shadow-cloak-20260409-pre-p0p1.js "shadow-cloak code backup snapshot"
[16]: ./pixel-pipeline-fix-report.md "pixel-pipeline-fix-report.md"
