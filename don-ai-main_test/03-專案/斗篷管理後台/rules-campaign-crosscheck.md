---
title: "shadow-cloak Worker 與 campaign 設定交叉比對報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-09"
summary: "交叉比對 Worker 執行邏輯、後台欄位與資料表設計，整理 campaign 與 rules 的實際生效邊界。"
version: "v1.0"
---
# shadow-cloak Worker 與 campaign 設定交叉比對報告

作者：**Manus AI**  
日期：2026-04-10

## 一、任務目的

本次比對的核心不是單看後台介面，而是直接交叉閱讀 **shadow-cloak Worker 實際執行邏輯**、**cloak-admin 的 Campaigns 表單欄位**、以及 **campaigns / rules / feature_flags / routing_rules / page_variants** 的資料流，判斷哪些能力在執行期真正生效、哪些只是歷史遺留、哪些看起來相似但其實層級不同，最後據此整理出「**以 campaign 為主，rules 只保留 campaign 做不到的全局規則**」的合併方案。

本報告比對的主要來源包括：

| 類別 | 檔案 | 重點 |
|---|---|---|
| Worker 主程式 | `05-原始碼/斗篷管理後台/shadow-cloak.js` | 入口層判定、campaign 載入、feature flags、routing rules、page variants、safe/money page 流程 |
| 前端表單 | `cloak-admin/client/src/pages/Campaigns.tsx` | Campaign 表單欄位、送出 payload、欄位語義 |
| 後端 API | `05-原始碼/斗篷管理後台/cloak-admin-api.js` | campaign 建立/更新時實際寫入 D1 的欄位 |
| Schema | `05-原始碼/斗篷管理後台/migrations/001_init_schema.sql` | campaigns 表欄位 |
| Schema | `05-原始碼/斗篷管理後台/migrations/004_layered_logging.sql` | rules 表設計目的 |
| Schema | `05-原始碼/斗篷管理後台/migrations/005_feature_flags.sql` | feature_flags / routing_rules |
| Schema | `05-原始碼/斗篷管理後台/migrations/006_page_variants.sql` | page_variants |

## 二、Worker 目前真正執行的判定邏輯

### 2.1 `isBot` 的所有判定條件

`isBot(ua, ip, asn, env)` 目前是 **實際生效的 Bot 阻擋主函式**。它沒有讀取 `rules` 表，而是直接讀取程式常數與 KV 設定。其判定順序如下。

| 順序 | 條件來源 | 實作說明 | 結論 |
|---|---|---|---|
| 1 | `BOT_PATTERNS` | UA 命中內建 bot regex 即判定為 bot | 全局硬編碼規則 |
| 2 | `META_ASNS` | ASN 命中 Meta ASN 清單即判定為 bot | 全局硬編碼規則 |
| 3 | `facebook_asn_list` KV | ASN 命中 Facebook ASN 名單即判定為 bot | 全局 KV 規則 |
| 4 | `bot_whitelist` KV | IP 命中白名單 CIDR 則直接視為 **不是 bot** | 全局 KV 白名單 |
| 5 | `bot_cidr_list` KV | IP 命中 bot CIDR 清單則視為 bot | 全局 KV 規則 |
| 6 | `manual_cidr_blacklist` KV | IP 命中手動 CIDR 黑名單則視為 bot | 全局 KV 規則 |
| 7 | `manual_asn_blacklist` KV | ASN 命中手動 ASN 黑名單則視為 bot | 全局 KV 規則 |
| 8 | 其他 | 都沒命中則回傳 false | 不阻擋 |

這表示 **Bot 判定的可配置來源目前是 KV，不是 `rules` 表，也不是 campaign 表**。

### 2.2 `checkVerifiedBot` 的邏輯

`checkVerifiedBot(ua, env)` 會從 KV 的 `verified_bots` 讀出設定，逐一比對 `ua_patterns`。只要 UA 包含任一 pattern，就回傳 `isVerified: true`，並附帶 `name`、`category`、`verify_method`。主流程在入口層若命中 verified bot，會 **直接走安全頁**，並記錄為 `verified_bot`。

這是一個典型的 **全局 allowlist / 例外處理機制**。它既不是 campaign 表單功能，也不是 `rules` 表功能。

### 2.3 入口主請求流程中的所有 if/else 判定

shadow-cloak 目前的主請求流程不是透過 `rules` 表逐條求值，而是 **硬編碼流程 + feature flag 開關 + campaign 欄位 + routing/page variant 覆寫** 的混合結構。入口層順序如下。

| 順序 | 判定 | 來源 | 命中後結果 |
|---|---|---|---|
| 1 | `campaignConfig.force_safe_page` | `routing_rules` 套用後可能寫入 | 直接安全頁 |
| 2 | `checkBlacklistRules` | `campaign.blacklist_rules` | 安全頁 |
| 3 | 國家/地區過濾 | `campaign.cloak_country` 為主、`country` 僅兼容，空時 fallback `ALLOWED_COUNTRIES`；若設定 `cloak_region` 再追加 region 檢查 | 安全頁 |
| 4 | `checkVerifiedBot` | KV `verified_bots` | 安全頁 |
| 5 | `isBot` | 硬編碼常數 + 多個 KV | 安全頁 |
| 6 | `checkOSWithConfig` | `campaign.allow_desktop` / `allow_mobile` → `cloak_os` → `allowed_devices`，若有 `cloak_os_version` 再追加版本比對 | 安全頁 |
| 7 | `checkLanguageWithConfig` | `campaign.cloak_lang` | 安全頁 |
| 8 | `checkReferer` | `REFERER_SPY_KEYWORDS` 全局常數 | 安全頁 |
| 9 | `checkTrafficSourceWithConfig` | `campaign.cloak_traffic_source` | 安全頁 |
| 10 | `checkFbclidWithConfig` | `campaign.require_fbclid`，空時 fallback KV | 安全頁 |
| 11 | `checkVPNWithConfig` | `campaign.residential_only` | 安全頁 |
| 12 | HTTP/1.0 檢查 | request.cf | 安全頁 |
| 13 | TLSv1 / TLSv1.1 檢查 | request.cf | 安全頁 |
| 14 | JA3 黑名單 | KV `ja3_blacklist` | 安全頁 |
| 15 | JWT 驗證 | Cookie + KV secret | 合法則放行並續發；失效不阻擋 |
| 16 | money page 選擇 | `page_variants` → `campaign.money_page_id` → Worker fallback → redirect fallback | 推廣頁 |

從這個順序可以確認：**`rules` 表在現行 Worker 主請求流程中完全沒有被查詢，也沒有被匹配。**

## 三、`rules` 表、`feature_flags`、`routing_rules`、`page_variants` 的實際角色

### 3.1 `rules` 表

`migrations/004_layered_logging.sql` 內定義了 `rules` 表，設計目標是做「規則配置化管理」。然而在目前版本的 `shadow-cloak.js` 中，執行期並沒有 `SELECT ... FROM rules`，也沒有任何 `matchRules` 或等價的求值器。換言之，**`rules` 表目前是歷史設計殘留，不是活躍執行路徑的一部分**。

### 3.2 `feature_flags`

`feature_flags` 目前是真正活躍的全局開關。它不是規則內容本身，而是控制某段程式是否啟用，例如 `enable_country_filter`、`enable_os_filter`、`enable_vpn_check`、`enable_routing_rules`。因此它與 campaign 的關係是：

> campaign 提供條件值，feature flag 決定該條件檢查整體是否啟用。

這不是重複，而是 **全局開關與 campaign 參數的上下游關係**。

### 3.3 `routing_rules`

`routing_rules` 目前會在 `resolveRoutingConfig` 中被查詢，條件命中後可覆寫 `safe_page_id`、`money_page_id`、`routing_strategy`、CTA links，甚至寫入 `force_safe_page` / `force_money_page` / `force_redirect`。這是 **執行期仍在使用的規則表**，但它的角色是「路由覆寫」，不是舊 `rules` 表那種 entry/page/action 逐條阻擋引擎。

### 3.4 `page_variants`

`page_variants` 會在 safe page 與 money page 兩個階段優先查詢。若命中 variant，會優先使用 variant 的 `template_id`；若沒命中，再 fallback 到 campaign 的 `safe_page_id` / `money_page_id`；若模板不存在，再 fallback 到既有 safe-page / money-page Worker，最後在 money page 無模板但有 target link 的情況下再 fallback 到 redirect。

因此 `page_variants` 並不是與 campaign page ID 重複，而是 **高一層的動態覆寫與 A/B / 條件分流能力**。

## 四、Campaigns 表單實際送出的欄位與寫入 campaigns 表的方式

前端 `Campaigns.tsx` 的表單送出內容，經 `cloak-admin-api.js` 寫入 `campaigns` 表後，與本次 cloak 判定直接相關的欄位如下。

| 類別 | 前端欄位 | 寫入 campaigns 表 | Worker 目前是否使用 | 說明 |
|---|---|---|---|---|
| 國家過濾 | `cloak_country` | `cloak_country` 與 `country` 會被 API 同步寫成同值 | **有** | Worker 以 `cloak_country` 為主語義，`country` 僅兼容 fallback |
| 語言過濾 | `cloak_lang` | `cloak_lang` | **有** | 用於 `checkLanguageWithConfig` |
| OS 過濾 | `cloak_os` | `cloak_os` | **有** | 用於 `checkOSWithConfig` |
| OS 版本 | `cloak_os_version` | `cloak_os_version` | **有** | 若有設定，Worker 會做 OS 版本比對 |
| 地區 | `cloak_region` | `cloak_region` | **有** | 若有設定，Worker 會在國家過濾旁追加 region 檢查 |
| 流量來源 | `cloak_traffic_source` | `cloak_traffic_source` | **有** | 用於 `checkTrafficSourceWithConfig` |
| 裝置允許 | `allow_desktop` / `allow_mobile` | `allow_desktop` / `allow_mobile` | **有** | Worker 已載入並作為裝置判定最高優先順序 |
| 舊裝置欄位 | `allowed_devices` | `allowed_devices` | **有** | 保留為歷史兼容 fallback，優先度低於 `allow_*` 與 `cloak_os` |
| 住宅 IP | `residential_only` / `require_residential` | 兩者都會寫入 | **有** | Worker 用 `residential_only` |
| fbclid 要求 | `require_fbclid` | `require_fbclid` | **有** | `checkFbclidWithConfig` |
| 黑名單 | `blacklist_rules` | `blacklist_rules` JSON | **有** | 但支援類型少於前端 UI |
| 安全頁 | `safe_page_id` / `safe_page_type` | 同名欄位 | **有** | 用於安全頁 fallback |
| 推廣頁 | `money_page_id` / `template_id` | 同名欄位 | **有** | 用於 money page fallback |

這裡最重要的實作細節是：`cloak-admin-api.js` 在新增與更新 campaign 時，會把 `country` 與 `cloak_country` 都寫成同一個 `countryVal`。因此目前資料層其實已經把兩者視為同一件事，只是 Worker 端還維持了舊欄位優先順序。

## 五、逐項對比：campaign 與 rules / page_variants 的關係

### 5.1 `cloak_country` vs `rules` 國家規則

目前 Worker 的國家過濾實際是：

> 以 `campaign.cloak_country` 為主、`country` 為舊資料兼容；若空則退回全局 `ALLOWED_COUNTRIES`；若有設定 `cloak_region` 則在國家命中後再做地區過濾；不符合則安全頁。

雖然 production 的 `rules` 表內仍有一筆 `rule_type = country` 的預設規則，但 **該筆規則不會被 Worker 查詢或執行**。因此從執行層面來看，這不是「兩段都在跑」，而是「**campaign 國家條件是真正生效，rules 國家規則只是死資料**」。

| 面向 | campaign | rules 表 | 結論 |
|---|---|---|---|
| 資料來源 | `country` / `cloak_country` | `rules.rule_type = country` | 都描述國家限制 |
| 執行期是否生效 | 是 | 否 | **功能重複，但只有 campaign 真的在跑** |
| 合併方向 | 保留 campaign | 刪除預設 country rule | 以 campaign 為主 |

### 5.2 `cloak_lang` vs `rules` 語言規則

`checkLanguageWithConfig` 直接讀 `campaign.cloak_lang`。若 campaign 未設定，會 fallback 成接受 `zh-*` 的預設語言策略。production `rules` 中的語言規則同樣只是描述，沒有被執行。

| 面向 | campaign | rules 表 | 結論 |
|---|---|---|---|
| 資料來源 | `cloak_lang` | `rule_type = language` | 都在描述語言條件 |
| 執行期是否生效 | 是 | 否 | **功能重複，但只有 campaign 生效** |
| 合併方向 | 保留 campaign | 刪除預設 language rule | 以 campaign 為主 |

### 5.3 `cloak_os` / `allow_desktop` / `allow_mobile` vs `rules` OS / device 規則

Worker 的 OS 過濾目前由 `checkOSWithConfig` 執行，其邏輯包含四層：

1. 若有 `allow_desktop` / `allow_mobile`，先做桌機與手機封鎖。  
2. 若有 `cloak_os`，再比對 OS 名稱。  
3. 若有 `cloak_os_version`，再比對 OS 版本。  
4. 若沒有 `cloak_os`，才 fallback 用舊 `allowed_devices`。  

目前 `getCampaignConfig()` 與 `getCampaignConfigByHostname()` 已同步載入 `allow_desktop` / `allow_mobile`、`cloak_os_version`，因此前端的桌機/手機開關與 OS 版本條件都能真正進入 runtime 判定。

這代表這一組功能雖然仍與舊 `rules` 規則在語義上重疊，但現在 **campaign 欄位已成為清楚且完整的主來源**。

| 面向 | campaign | rules 表 | 結論 |
|---|---|---|---|
| OS 名稱 | `cloak_os` | `rule_type = os` | **重複描述，同一功能** |
| 裝置類型 | `allow_desktop` / `allow_mobile`、舊 `allowed_devices` | rules 無獨立 device row，但概念上也屬 entry 條件 | **campaign 為主，`allowed_devices` 僅歷史 fallback** |
| 執行期狀態 | `cloak_os`、`allow_*`、`cloak_os_version` 皆已生效 | rules 不生效 | **已統一由 campaign 欄位驅動** |

### 5.4 `cloak_traffic_source` vs `rules` 流量來源規則

Worker 目前直接執行 `checkTrafficSourceWithConfig(effectiveReferer, campaign.cloak_traffic_source)`。production `rules` 中雖有 `traffic_source` 預設規則，但不會進入執行路徑。

| 面向 | campaign | rules 表 | 結論 |
|---|---|---|---|
| 資料來源 | `cloak_traffic_source` | `rule_type = traffic_source` | 同一功能領域 |
| 執行期是否生效 | 是 | 否 | **功能重複，但只有 campaign 生效** |
| 合併方向 | 保留 campaign | 刪除預設 traffic_source rule | 以 campaign 為主 |

### 5.5 `blacklist_rules` vs `rules` 黑名單規則

Worker 入口第一優先的黑名單檢查是 `campaign.blacklist_rules`，由 `checkBlacklistRules` 執行。它目前支援的類型只有：`ip`、`ip_range`、`asn`、`ua`、`ua_regex`。然而前端 `BlacklistEditor` UI 允許的類型包含 `country`，這表示 **前端宣稱能力大於 Worker 實作能力**。

此外，本次查到的 production `rules` 表中 **甚至沒有一筆活躍的 `rule_type = blacklist` 預設規則**。也就是說，黑名單能力目前完全是 campaign 內建，不依賴 rules 表。

| 面向 | campaign.blacklist_rules | rules 表 | 結論 |
|---|---|---|---|
| 執行期是否生效 | 是 | 否 | **不屬於雙重執行，只有 campaign 在跑** |
| 支援類型 | `ip` / `ip_range` / `asn` / `ua` / `ua_regex` | 無活躍 runtime | **前端 country 類型目前無效** |
| 合併方向 | 保留 campaign | 無需保留 rules 黑名單 | 以 campaign 為主 |

### 5.6 `safe_page_id` / `money_page_id` vs `page_variants`

這組最容易被誤判為重複，但實際上不是。`page_variants` 的角色是 **優先覆寫 campaign 預設頁面**，其邏輯如下。

| 頁面類型 | 第一層 | 第二層 | 第三層 | 第四層 |
|---|---|---|---|---|
| Safe page | `page_variants(page_type='safe_page')` | `campaign.safe_page_id` + `safe_page_type` | safe-page Worker | 內建簡易 HTML fallback |
| Money page | `page_variants(page_type='money_page')` | `campaign.money_page_id` | money-page Worker | 若無模板但有 target link 則 redirect |

因此 `page_variants` 不是和 campaign 重複，而是 **campaign 預設值之上的條件化覆寫層**。這一層應保留。

## 六、真正重複、看似相似但不同、以及完全不重複的新功能

### 6.1 真正重複的

所謂真正重複，這裡指的是 **資料語義重複，且 rules 表保留這些列只會造成誤解**。雖然目前 runtime 沒有「兩段同時執行」的情況，但 rules 內的預設列與 campaign 欄位描述的是同一件事。

| 類別 | campaign 來源 | rules 表預設列 | 判定 |
|---|---|---|---|
| 國家 | `country` / `cloak_country` | `country` | 重複 |
| 語言 | `cloak_lang` | `language` | 重複 |
| OS | `cloak_os` | `os` | 重複 |
| 流量來源 | `cloak_traffic_source` | `traffic_source` | 重複 |
| fbclid | `require_fbclid` | `fbclid` | 重複 |
| VPN / 住宅 IP | `residential_only` | `vpn` | 重複 |
| 黑名單 | `blacklist_rules` | 若未來補 blacklist 規則也會重複 | 重複概念 |

### 6.2 看起來像但其實不同的

| 類別 | 為何看起來像 | 實際差異 | 判定 |
|---|---|---|---|
| `safe_page_id` / `money_page_id` vs `page_variants` | 都能決定最後頁面 | campaign 是預設值，page_variants 是條件化覆寫層 | **不同功能** |
| campaign 條件 vs `feature_flags` | 都影響是否放行 | campaign 提供條件值；feature flag 控制該類檢查是否啟用 | **不同層級** |
| campaign 條件 vs `routing_rules` | 都可能改變最終頁面或流程 | campaign 是主設定；routing_rules 是命中後覆寫 | **不同功能** |
| `allow_desktop` / `allow_mobile` vs `allowed_devices` | 都在描述裝置允許 | 前者是新欄位、後者是舊兼容欄位 | **同域但新舊並存** |

### 6.3 完全不重複的新功能

| 功能 | 來源 | 說明 |
|---|---|---|
| Verified Bot allowlist | KV + `checkVerifiedBot` | 合法爬蟲直接走安全頁，campaign 無等價設定 |
| Bot whitelist / CIDR / ASN 黑名單 | KV + `isBot` | 全局 bot 防護，campaign 無等價設定 |
| Referer spy keyword 檢測 | 全局常數 | 針對偵測/掃描 referer，campaign 無等價設定 |
| HTTP/TLS/JA3 檢查 | `request.cf` + KV | 傳輸層/指紋層的全局防護 |
| JWT 快速通行證 | Cookie + KV secret | 訪客續訪優化，不屬於 campaign 過濾 |
| `routing_rules` | D1 | 條件化覆寫路由 |
| `page_variants` | D1 | 條件化頁面 variant |

## 七、目前最關鍵的結論

第一，**當前 runtime 根本沒有在執行 `rules` 表**。因此 production 內那批預設 `rules` 列，已不是有效規則，而是描述型殘留資料。若繼續保留，會讓後續維運誤以為有第二套規則引擎存在。

第二，**campaign 已經是目前 entry 過濾的事實主體**。國家、語言、OS、流量來源、fbclid、住宅 IP、黑名單，全部都已由 campaign 欄位直接驅動。

第三，**真正要保留的全局能力並不在 `rules` 表，而是在 `feature_flags`、KV、`routing_rules`、`page_variants`**。因此若採「以 campaign 為主」策略，清理 `rules` 表不會影響現有 Worker 執行結果，反而能消除概念重複。

第四，**目前仍需持續關注的實作缺口只剩前端黑名單 `country` 類型未落地**：

| 缺口 | 現況 | 影響 |
|---|---|---|
| `blacklist_rules` 前端可選 `country`，Worker 不支援 | UI 能選、執行期不會命中 | 形成假功能 |

原先未接入的 `allow_desktop` / `allow_mobile`、`cloak_os_version`、`cloak_region` 已在 Worker 補齊，現在不再是 runtime 缺口。

## 八、以 campaign 為主的合併方案

### 8.1 原則

合併後的設計原則應該明確定義為：

> **campaign 管 campaign 級別的 visitor filter；全局能力留在 feature flags、KV、routing rules、page variants；`rules` 表不再承載與 campaign 重複的 entry/page/action 預設規則。**

### 8.2 實作策略

| 類別 | 處理策略 |
|---|---|
| `rules` 表重複預設列 | migration 不再保留舊 seed INSERT，既有資料表可直接清空殘留預設列 |
| `campaign` 欄位 | 作為 entry 過濾唯一主來源 |
| `feature_flags` | 保留，作為全局 enable/disable 開關 |
| KV bot / verified bot / JA3 等 | 保留，作為 campaign 做不到的全局規則 |
| `routing_rules` | 保留，作為路由覆寫層 |
| `page_variants` | 保留，作為頁面 variant 覆寫層 |

### 8.3 Worker 應做的同步調整

| 調整項 | 原因 | 建議處理 |
|---|---|---|
| 明確以 `cloak_country` 為主要語義來源，`country` 作為兼容 fallback | 避免「落地頁國家」與「cloak 國家」概念混淆 | 已在 campaign config 正規化階段統一語義並補註解 |
| 補 SELECT `allow_desktop` / `allow_mobile` | 讓前端新裝置開關真正生效 | 已修改 `getCampaignConfig*` 查詢與回傳物件 |
| 保留 `allowed_devices` 僅作舊資料 fallback | 新舊欄位並存時避免衝突 | 已在程式註解明確優先 `allow_*`，其次 `cloak_os`，最後 `allowed_devices` |
| 補上 `cloak_os_version` / `cloak_region` runtime 支援 | 讓前端已送出的欄位真正落地 | 已在 Worker 入口判定鏈補齊 |
| 擴充 `checkBlacklistRules` 支援 `country` | 前端已有欄位 | 後續再補，讓 UI 與 runtime 一致 |
| 在程式註解與文件中明確標示 `rules` 已退出 runtime | 避免後續誤用 | 已寫入程式註解、migration 與 changelog |

## 九、D1 現況與清理建議

本次查詢到的 `rules` 狀態如下。

| 環境 | 目前列數 | 內容摘要 | 評估 |
|---|---:|---|---|
| Staging `594f8569-ad3c-40c0-ac7c-8b691f9d7885` | 2 | `default-action-verify`、`default-entry-allow` | 非 runtime 必需，可清空 |
| Production `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` | 12 | 國家、bot、os、language、referer、traffic_source、fbclid、vpn、fingerprint、interaction、action verify 等預設列 | 與現行硬編碼 / campaign / KV / feature flag 邏輯重疊，應清空 |

建議的資料策略不是「只刪其中幾筆」，而是：

> **在 staging 與 production 直接清空 `rules` 表中的現有預設規則，讓系統概念上回到單一主來源：campaign + feature_flags + KV + routing_rules + page_variants。**

這樣做的理由在於，現行 Worker 不查 `rules`，所以保留這些資料沒有執行意義，只會增加誤判風險。

## 十、結論

綜合比對結果，本次最重要的結論可以濃縮成三句話。

第一，**現在真正決定 entry 過濾結果的是 campaign，不是 `rules` 表**。  
第二，**`rules` 表中的預設規則與 campaign 欄位在語義上高度重複，但 runtime 並未執行 `rules`，因此它們應視為可清除的歷史殘留**。  
第三，**應保留的全局能力不在 `rules` 表，而在 `feature_flags`、KV、`routing_rules`、`page_variants`，因此合併方向應是「campaign 為主，rules 清空，Worker 補齊 campaign 真正使用」**。
