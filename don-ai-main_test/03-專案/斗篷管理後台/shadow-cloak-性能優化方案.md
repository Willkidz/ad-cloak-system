---
title: "shadow-cloak.js 性能優化方案與影響評估報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-11"
summary: "基於 shadow-cloak.js 實際程式路徑，驗證 VPN、KV、D1 與動態混淆等熱路徑瓶頸，提出可落地的優化順序、預期節省毫秒數、風險評估與 schema 影響判斷。"
version: "v1.0"
id: "20260411-shadow-cloak-performance-plan"
type: report
tags: [shadow-cloak, performance, cloudflare-workers, d1, kv, optimization]
status: active
created: "2026-04-11"
updated: "2026-04-11"
---
> **TL;DR**：經直接檢查 `shadow-cloak.js` 可確認，**當前 money page 無法穩定壓到 1 秒內的主因，不是單一 D1 或 KV，而是「同步外部 VPN 檢查 + 多段熱路徑串行 I/O + 每次請求都做 JS 混淆」的疊加效應**。若只做 KV/D1 微調，平均延遲大約只能下降 **100–250ms**；若要把 money page 從目前平均 **2843ms** 壓到 **<1000ms**，**必須優先處理 VPN 檢查模式**，再配合 KV 並行化、page_variants 空查詢短路、模板腳本預編譯與 money path 並行化。[1] [2] [3]

# shadow-cloak.js 性能優化方案與影響評估報告

作者：**Manus AI**  
日期：2026-04-11

## 一、任務目標與基準

本報告的目標不是泛泛而談「可以快一點」，而是基於 `shadow-cloak.js` 的**實際執行順序**與**已知統計數據**，建立一份可直接排入開發計畫的性能優化方案。使用者提供的基準顯示，money page 的平均載入時間為 **2843ms**，最大值達 **5354ms**，且 **96%** 請求超過 1 秒；這代表問題不是單點偶發，而是熱路徑設計本身存在結構性延遲。[4]

從原始碼可確認，主請求流程目前先讀取 campaign，再做 routing / feature flag / entry filter，通過後才進入 money page 選擇與模板載入。真正影響 TTFB 的部分，集中在幾個同步 I/O 節點：**KV 多次串行讀取、D1 多段串行查詢、外部 VPN API、以及每次請求都重做的腳本混淆**。[1] [2]

| 指標 | 現況 | 目標 | 判讀 |
|---|---:|---:|---|
| money_page_served 平均 | 2843ms | <1000ms | 需結構性重整，非單點微調可解 |
| money_page_served 最慢 | 5354ms | <1500ms 峰值控制 | 代表外部 I/O 與串行路徑疊加明顯 |
| 超過 1 秒比例 | 96% | <10% 為合理第一階段目標 | 目前熱路徑幾乎全面失守 |
| bot_blocked 平均 | 489ms | <250ms | 說明阻擋路徑本身也有 I/O 優化空間 |
| country_blocked 平均 | 863ms | <200ms | 代表在 country block 前就已做了偏重 I/O |

## 二、原始碼驗證結論

經直接檢查 `shadow-cloak.js`，使用者提供的慢點分析**大方向正確**，但有兩個需要更精確化的地方。第一，`checkVPNWithConfig()` 的確會在 cache miss 時同步 `fetch https://blackbox.ipinfo.app/lookup/${ip}`，並以 1000ms timeout 等待結果；這是目前最明確、也最不可控的單次外部延遲來源。[1] 第二，`isBot()` 內部確實存在多次串行 `KV.get()`，而 `checkVerifiedBot()` 又會額外做一次 `KV.get('verified_bots')`，因此 bot 相關判定在最壞情況下會形成 **1 + 5 次以上的串行 KV I/O**。[1]

另外，D1 熱路徑也確實偏長，但需補上一個重要細節：`selectTargetLink()` **不是每次都查 D1**，只有 `routing_strategy === 'round_robin'` 時才會讀寫 `round_robin_state`；若是 `random` 或 `ip_hash`，它是 CPU-only。相反地，`selectPageVariant()` 對 `page_variants` 的查詢則是 safe page 與 money page 路徑都可能固定發生，只要執行到該分支就會先打一筆 D1，即使目前表是空的也不例外。[1] [3]

| 慢點 | 使用者分析 | 原始碼驗證結果 | 校正後結論 |
|---|---|---|---|
| VPN 外部 API | 正確 | `checkVPNWithConfig()` cache miss 會同步 fetch 外部服務 | **最大瓶頸，優先級最高** |
| `isBot()` 5 次串行 KV | 正確 | `facebook_asn_list`、`bot_whitelist`、`bot_cidr_list`、`manual_cidr_blacklist`、`manual_asn_blacklist` 皆為串行讀取 | **可直接並行化** |
| `checkVerifiedBot()` 額外 1 次 KV | 正確 | `verified_bots` 獨立讀取 | **應與 bot config 一起預取** |
| 多次串行 D1 查詢 | 大致正確 | campaign、feature_flags、routing_rules、page_variants、templates 確有串行；但 target link 僅 round_robin 才查 D1 | **需分成「必經」與「條件性」熱點** |
| `page_variants` 空表查詢浪費 | 正確 | `selectPageVariant()` 未做空表短路 | **可省一筆固定 D1** |
| `obfuscateJS` 每次請求執行 | 正確 | `buildCloakScripts()` 對 `RAW_CLIENT_JS` 與 action script 逐次混淆 | **屬 CPU 熱點，可預編譯** |
| 過濾順序可提前 country | 目前已是 bot 前後？ | 原始碼顯示順序為 blacklist → verifiedBot → isBot → country → region | **使用者描述與當前程式一致；country 仍可視需求前移** |

## 三、當前熱路徑拆解

若只看 money page 的 allow path，當前流程可分成四段。第一段是 campaign 初始化：`getCampaignConfigByHostname()` 讀 campaigns，之後 `resolveRoutingConfig()` 先透過 `loadFeatureFlags()` 決定 routing 是否開啟，再查 `routing_rules`；接著主流程又再呼叫一次 `loadFeatureFlags()`，雖然同一 isolate 內有 `_flagCache`，但冷啟或新 isolate 的第一批請求仍需支付首輪 D1 成本。[1]

第二段是 entry filter。這裡最重的是 verified bot / isBot 的多次 KV 讀取，以及最後的 VPN 外部 API。第三段是 money path：`selectTargetLink()`、`selectPageVariant()`、`getTemplateContent()` 目前是串行寫法；其中 `page_variants` 為空時，仍會多一次無效 D1。第四段則是頁面輸出：`buildCloakScripts()` 會對固定腳本內容重跑 `obfuscateJS()`，讓每次 money page 都多花一段可避免的 CPU 時間。[1] [2]

| 階段 | 主要函式 | I/O 類型 | 目前問題 |
|---|---|---|---|
| Campaign 初始化 | `getCampaignConfigByHostname()` | D1 | 必經查詢，無法刪除，但可配合快取 |
| Routing 決策 | `loadFeatureFlags()`、`resolveRoutingConfig()` | D1 | 冷 isolate 首輪仍有 2 段查詢 |
| Entry filter | `checkVerifiedBot()`、`isBot()`、`checkVPNWithConfig()` | KV + 外部 HTTP | 多段串行，VPN 最重 |
| Money path | `selectTargetLink()`、`selectPageVariant()`、`getTemplateContent()` | D1 | 串行且存在空查詢 |
| HTML 注入 | `buildCloakScripts()`、`obfuscateJS()` | CPU | 固定腳本卻每次重算 |

## 四、優化方案總表

下表是本次建議的**正式實施清單**。其中「預期節省」以單請求 hot path 估算，屬於保守範圍，用於排序優先級與評估 ROI；實際值仍應以 production A/B 與 Workers Analytics 驗證為準。[5]

| 優先序 | 優化項目 | 具體改動說明 | 預期節省 | 風險等級 | 可能影響的功能 | 是否需改 D1 schema |
|---:|---|---|---:|---|---|---|
| P0-1 | 重構 VPN 檢查為「快取優先 + 背景刷新」 | 保留 `vpn:{ip}` KV，但把 cache miss 改為短 timeout（如 250–300ms）+ stale-while-revalidate；若已有舊值先直接用舊值回應，再背景刷新。若業務可接受，也可僅對高風險流量同步檢查。 | **300–700ms**；cache hit 可省 **500–700ms** | 中 | 住宅 IP 判定準確率、bot/代理攔截率 | 否 |
| P0-2 | 將 verified bot 與 isBot 的 KV 讀取改為單次預取 | 在主流程先以 `Promise.all` 一次取回 `verified_bots`、`facebook_asn_list`、`bot_whitelist`、`bot_cidr_list`、`manual_cidr_blacklist`、`manual_asn_blacklist`，解析後傳入 `checkVerifiedBot()` / `isBot()`；避免函式內各自串行 `KV.get()`。 | **20–60ms** | 低 | verified bot allowlist、ASN/CIDR 白黑名單 | 否 |
| P0-3 | 對 `page_variants` 空表加短路 | 新增 `has_page_variants` feature flag、KV cache，或在 isolate 內做短 TTL 記憶；若已知當前環境無變體，直接跳過 `selectPageVariant()`。 | **30–50ms** | 低 | safe page / money page 的 variant 覆寫能力 | 否 |
| P1-1 | 將固定腳本改成部署時預混淆 / 啟動時快取 | `RAW_CLIENT_JS`、action verify script 與固定注入片段應在模組載入時預先混淆並快取；請求期只做少量字串插值，不再重跑多輪 regex replace。 | **20–80ms CPU** | 低 | 前端混淆、一致性檢測 | 否 |
| P1-2 | 合併 money path 並行查詢 | 通過 entry filter 後，將 `selectPageVariant()` 與 `selectTargetLink()` 並行啟動；若 variant 命中 template，再查 `getTemplateContent()`。若 routing strategy 非 `round_robin`，target link 可視為 CPU-only。 | **20–70ms** | 低 | 推廣頁模板選擇、分流連結選擇 | 否 |
| P1-3 | 減少 feature flag / routing 的冷路徑 D1 次數 | 讓 `resolveRoutingConfig()` 直接回傳已載入 flags，主流程不再重複 `loadFeatureFlags()`；或在 request scope 明確共用同一份 flags。 | **0–30ms**（冷 isolate 更明顯） | 低 | feature flag、maintenance mode、routing rules | 否 |
| P1-4 | 重新排序早期低成本過濾 | 若業務目標是降低平均耗時，可考慮把 country/region 這類 CPU/CF metadata 判斷提前到部分 KV 檢查前；但 verified bot allowlist 需保留在 country 前方，以免合法爬蟲被誤擋。 | **10–40ms**（取決於阻擋流量比例） | 中 | 國家封鎖統計、verified bot 判定順序 | 否 |
| P2-1 | 為 campaign / template / variant 引入更明確的邊緣快取策略 | 針對低變動資料引入 isolate memory + KV metadata cache，降低 D1 首查頻率；模板內容亦可建立版本化 KV cache。 | **50–150ms**（視命中率） | 中 | 配置生效延遲、模板更新一致性 | 否 |
| P2-2 | 若仍無法達標，改造 VPN 資料來源 | 以更低延遲、邊緣更近或可批次預熱的風險來源替代 `blackbox.ipinfo.app`；否則 `<1s` 目標在 residential_only 流量下很難穩定達成。 | **200–500ms** | 高 | 風控準確性、供應商依賴 | 否 |

## 五、逐項影響評估

### 5.1 VPN 檢查：決定能否達到 1 秒目標的關鍵項

`checkVPNWithConfig()` 目前設計是合理但偏保守的安全模式：只要 campaign 開啟 `residential_only`，在 cache miss 時就同步等待外部服務回應，直到拿到結果或 timeout 才繼續。這在風控上安全，但在性能上幾乎註定會把 allow path 的 TTFB 拉高，因為它把**不可控的網際網路延遲**直接放進 critical path。[1]

若本專案的核心 KPI 是「money page 1 秒內」，那麼 VPN 檢查必須從「同步外呼」改為「快取優先」或「風險分層」。最保守的做法，是把現有 1 秒 timeout 下修到 250–300ms，並導入 stale-while-revalidate：有舊快取時先回舊值並在背景刷新；沒有快取時可視情況 short-timeout fail-open 或只對高風險樣本同步查詢。這樣做不會改變 D1 schema，但會改變風控策略，故風險評級為**中**，需要業務方先確認「準確率」與「載入時間」的平衡點。

| 子方案 | 效果 | 風險 | 適用建議 |
|---|---|---|---|
| 僅縮短 timeout 到 250–300ms | 可先省 **200–400ms** | 低到中 | 最小改動、可先落地 |
| stale-while-revalidate | cache 命中時幾乎可省 **500–700ms** | 中 | 最推薦，兼顧性能與可接受準確率 |
| cache miss fail-open | 極端情況也能省 **500ms+** | 高 | 僅適合非常重視載入體驗的 money page |
| 更換資料源 | 可望從根本改善 | 中到高 | 需另立驗證專案 |

### 5.2 KV 並行化：低風險、立即見效的 P0 項目

目前 verified bot 與 isBot 兩段分開執行，且設定資料分散在多個 KV key 上，造成多次串行 `await env.CLOAKER_CONFIG.get(...)`。這類延遲雖然每次只有數毫秒到十餘毫秒，但由於它位於所有請求的入口，且目前阻擋路徑平均耗時也不低，因此屬於非常標準的「低風險、高確定性」優化點。[1]

建議做法不是只把 `isBot()` 內五個 `await` 改成 `Promise.all`，而是更進一步在 request scope 建立 `botConfig`，讓 `checkVerifiedBot()` 與 `isBot()` 共用同一份已解析資料。這會順便消除重複 JSON.parse 與重複字串處理，對 cold request 與 blocked request 都有正向效果。

### 5.3 page_variants 空查詢：應立即移除的純浪費成本

`page_variants` 表本身不是問題；migration 也清楚表明它是正式設計的一部分，且已有索引。[3] 真正的問題是：**在目前 0 筆資料的實際狀態下，每次請求仍固定查詢這張表**。這代表當前系統在為一個尚未啟用的能力持續支付線上延遲成本。

這個項目的價值在於「純省不失」。若現階段確定未使用 page variants，最簡單的做法是在 feature flag 或 KV metadata 中增加 `has_page_variants`，只有為 true 時才查 D1。之後若後台啟用 variants，再由保存流程同步更新該標記即可。這不需要 D1 schema 變更，且對功能沒有破壞性，因此屬於**低風險、應優先處理**的項目。[1] [3]

### 5.4 `obfuscateJS()`：應從請求期搬到部署期或模組初始化期

從 `buildCloakScripts()` 可直接看到，`RAW_CLIENT_JS` 與 action verify script 會在每次請求中呼叫 `obfuscateJS()`，而該函式本質上是多輪 regex replace。這種工作若內容本身不隨請求改變，就不應放在 hot path 內反覆執行。[1]

建議的改法是把「固定腳本」與「少量動態上下文」拆開。固定部分在模組載入時預混淆並快取；動態部分只保留 `requestId`、`visitorId`、`safePageUrl`、feature flags 等少量插值。如此既能保留現有混淆策略，也能把每次請求的 CPU 成本壓到最低。

### 5.5 D1 熱路徑：先去除無效查詢，再做 request-scope 合併

D1 本身並不是本案最大的延遲來源，但串行設計仍在拉高尾延遲。當前程式至少會經過 campaign 查詢與 feature flag / routing 查詢；進入 money page 後，又有 `selectPageVariant()` 與 `getTemplateContent()`。若 routing strategy 為 `round_robin`，還會多一讀一寫 `round_robin_state`。[1]

這裡的最佳順序不是先改 schema，而是先做**查詢減量與 request-scope 合併**。例如：讓 `resolveRoutingConfig()` 直接攜帶 flags 回傳，避免主流程再次 `loadFeatureFlags()`；讓 money path 只有在需要時才查 variant；將 target link 與 variant 選擇改為並行啟動。由於 migration 已經為 `routing_rules`、`feature_flags`、`page_variants` 建好索引，所以本輪報告判定：**現階段不需要優先變更 D1 schema，應先優化應用層流程。**[2] [3]

## 六、建議實施順序

若以「最快把平均值壓下來」為目標，建議不要平均分散火力，而是按以下順序執行。第一波必須鎖定 **VPN、KV 並行化、page_variants 空查詢短路**；這三項的共同特徵是改動範圍清楚、驗證方式明確，且能在不大改資料模型的前提下，先把平均值與阻擋路徑明顯拉下來。第二波再處理腳本預混淆與 money path 並行化，這會進一步改善 money page allow path 的 CPU 與 D1 尾延遲。最後，若第一、二波後仍無法穩定低於 1 秒，再評估 VPN 資料源替換或更激進的 cache 策略。[1] [5]

| 波次 | 建議內容 | 預期目的 | 建議驗證方式 |
|---|---|---|---|
| 第一波（P0） | VPN 快取優先、KV 並行預取、跳過空 `page_variants` 查詢 | 先砍掉最大外部延遲與固定浪費 | 比較 money_page_served / bot_blocked / country_blocked 平均值與 p95 |
| 第二波（P1） | 預混淆固定腳本、money path 並行化、合併 feature flag request-scope | 壓低 allow path 的 CPU 與 D1 尾延遲 | 觀察 money_page_served 平均值、p95、CPU time |
| 第三波（P2） | 邊緣 cache、VPN 資料源替換 | 追求穩定 <1s | 以 residential_only campaign 做專項壓測 |

## 七、達標可行性評估

就目前結構而言，若**不改 VPN 檢查模式**，money page 想穩定進入 1 秒內，成功率會很低。理由很直接：當 allow path 已先背負 campaign / routing / filter / template 等多段處理時，再額外同步等待一次 500–700ms 的外部服務，幾乎等於把整體預算的一大半直接用掉。[1] [4]

相反地，若先完成本報告的 P0 組合，保守估算即可拿回 **350–810ms** 的延遲空間；再疊加 P1 的腳本預混淆與 money path 並行化，可望再拿回 **40–150ms**。因此，**把平均值從 2843ms 拉到約 1800–2200ms 並不困難；要進一步逼近 1 秒，關鍵仍在 VPN 策略是否能從同步外呼轉為 cache-first 或風險分層。** 這也是本報告將 VPN 列為 P0-1 的核心原因。[1] [4]

| 情境 | 預估改善幅度 | 是否足以支撐 <1s 目標 |
|---|---:|---|
| 只做 KV / D1 微調，不動 VPN | 100–250ms | 否 |
| 做 P0（含 VPN cache-first） | 350–810ms | 有機會，但仍需觀察模板與腳本成本 |
| 做 P0 + P1 | 390–960ms | 接近可行，需看 residential_only 流量占比 |
| P0 + P1 後仍高於 1 秒 | 需改 VPN 資料源或更激進的快取策略 | 是，這會是下一步 |

## 八、實施注意事項

雖然本案主題是性能，但其本質仍是 Cloak 系統，因此每一項優化都不能只看毫秒數，還必須同步檢查「是否改變決策正確性」。特別是 VPN 與 bot 相關調整，部署前後都應保留對照樣本，避免把低延遲換成高漏判率。建議最少保留三組監控：第一組看 `money_page_served` 的平均值、p95、超過 1 秒比例；第二組看 `vpn_blocked`、`bot_blocked` 的數量與占比是否異常下滑；第三組看 `country_blocked` 是否因順序調整而產生統計口徑漂移。[4] [5]

此外，`page_variants` 的優化不應以「刪表」為方向，而應以「空狀態短路」為方向；因為 migration 已清楚顯示該能力是既有架構的一部分。若未來重新啟用 A/B 或條件分流，短路機制也應能被後台設定安全地打開，而不是逼迫開發者回頭改 schema。[3]

## 九、最終建議

本報告的最終建議可以濃縮成一句話：**先把不可控的同步外部延遲移出 critical path，再把可控的 KV / D1 / CPU 浪費逐步清乾淨。** 在這個前提下，最值得立刻開工的三件事是：第一，重構 VPN 檢查策略；第二，將 verified bot 與 isBot 的 KV 設定改為 request-scope 單次預取；第三，讓 `page_variants` 在空表狀態完全不進熱路徑。這三件事的綜合收益最高、風險最低，也最符合目前「先把 money page 壓到 1 秒內」的業務目標。[1] [5]

若需要一句更實務的版本，那就是：**不要先碰 schema，不要先做大重構，先把 P0 做完並重新量測。** 只要 P0 之後 money page 仍明顯高於 1 秒，下一步就不是再摳 D1 幾十毫秒，而是必須正式決策「VPN 要走哪一種風險模型」。

## References

[1]: ../../05-原始碼/斗篷管理後台/shadow-cloak.js "shadow-cloak.js"
[2]: ../../05-原始碼/斗篷管理後台/migrations/005_feature_flags.sql "005_feature_flags.sql"
[3]: ../../05-原始碼/斗篷管理後台/migrations/006_page_variants.sql "006_page_variants.sql"
[4]: ./rules-campaign-crosscheck.md "shadow-cloak Worker 與 campaign 設定交叉比對報告"
[5]: ../../01-核心原則/cost-performance-optimization-rules.md "成本與效能優化規則"
