# shadow-cloak Worker 載入慢根因分析（草稿）

## 測試範圍

本次針對以下目標做 production 實測：

| 目標 | 用途 |
|---|---|
| `https://z1k4h.xyz/` | 實際推廣頁入口，由 `shadow-cloak` Worker 處理 |
| `https://safe-page.laoqin1689.workers.dev/?t=health` | safe-page Worker 本體，用來切分 shadow-cloak 內部邏輯與純連線/邊緣開銷 |

測試使用的 User-Agent：

> `Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X)`

## curl 網路層結果

| 目標 | Run | DNS | TCP | TLS | TTFB | Total |
|---|---:|---:|---:|---:|---:|---:|
| z1k4h.xyz | 1 | 0.009750s | 0.010345s | 1.382738s | 4.802329s | 4.982882s |
| z1k4h.xyz | 2 | 0.001082s | 0.001586s | 1.207969s | 3.093538s | 3.288479s |
| z1k4h.xyz | 3 | 0.001086s | 0.001499s | 1.268511s | 3.103454s | 3.280286s |
| safe-page Worker | 1 | 0.013920s | 0.014414s | 1.446570s | 1.942476s | 2.202155s |
| safe-page Worker | 2 | 0.001079s | 0.001524s | 1.436088s | 1.932046s | 2.152586s |
| safe-page Worker | 3 | 0.001006s | 0.001334s | 1.396067s | 1.907352s | 2.168304s |

平均值如下：

| 目標 | DNS Avg | TCP Avg | TLS Avg | TTFB Avg | Total Avg |
|---|---:|---:|---:|---:|---:|
| z1k4h.xyz | 0.003973s | 0.004477s | 1.286406s | 3.666440s | 3.850549s |
| safe-page Worker | 0.005335s | 0.005757s | 1.426242s | 1.927291s | 2.174348s |

## shadow-cloak Server-Timing 結果

| Run | entry_campaign_lookup | entry_resolve_routing | entry_load_feature_flags | entry_check_verified_bot | entry_is_bot | safe_select_variant | safe_worker_fetch | x-worker-timing-total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 171ms | 507ms | 0ms | 226ms | 1302ms | 173ms | 101ms | 2879ms |
| 2 | 170ms | 503ms | 0ms | 2ms | 32ms | 178ms | 14ms | 1311ms |
| 3 | 175ms | 525ms | 0ms | 5ms | 30ms | 185ms | 72ms | 1413ms |

## 內部 perf trace 證據

從即時日誌可見下列內部步驟：

| 函式 | 量測結果 |
|---|---|
| `getCampaignConfigByHostname` | `queryCount=1`、`queryMs≈118ms` |
| `loadFeatureFlags` | `queryCount=2`、`globalQueryMs≈124ms`、`scopedQueryMs≈136ms`、`totalMs≈260ms` |
| `resolveRoutingConfig` | `flagMs≈260ms`、`queryMs≈122ms`、`totalMs≈382ms` |
| `selectPageVariant` | `queryMs≈119-127ms` |

此外，`wrangler d1 info godview-clicks` 顯示：

| 項目 | 值 |
|---|---|
| `running_in_region` | `ENAM` |
| `read_replication.mode` | `disabled` |

## 根因判斷

### 1. 持續性的主慢點是 **多次串行 D1 查詢**

從 warm run 來看，`x-worker-timing-total` 仍有 **1.31s ~ 1.41s**。其中最穩定的高耗時步驟是：

| 步驟 | 穩定耗時 | 直接原因 |
|---|---:|---|
| `entry_campaign_lookup` | ~170ms | `campaigns` 表查詢 1 次 |
| `entry_resolve_routing` | ~503-525ms | 內含 2 次 feature flag 查詢 + 1 次 routing_rules 查詢 |
| `safe_select_variant` | ~173-185ms | `page_variants` 表查詢 1 次 |
| `safe_worker_fetch` | ~14-72ms warm / 101ms cold-ish | 再發一次 subrequest 到 safe-page Worker |

這些步驟多數是 **串行** 發生的，因此 warm path 僅程式內部就約 1.3 秒。這代表程式碼本身已足以造成「點擊慢、進入慢」，不是單純 Cloudflare 網路問題。

### 2. `resolveRoutingConfig` 是 **最大且最穩定** 的程式瓶頸

`resolveRoutingConfig` 表面上在 Server-Timing 約 **503-525ms**，而內部 log 顯示其拆解為：

> `loadFeatureFlags ≈ 260ms` + `routing_rules 查詢 ≈ 122ms` + 其他控制流程開銷 ≈ 382ms

之所以比 log 顯示更高，是因為 fetch handler 中 `entry_resolve_routing` 包含函式呼叫邊界與排程成本；但整體結論不變：

1. 每個請求都先進 `isFeatureEnabled(...)`。
2. `isFeatureEnabled(...)` 會呼叫 `loadFeatureFlags(...)`。
3. `loadFeatureFlags(...)` 在 cache miss 時對 D1 進行 **2 次查詢**：一次 `scope='global'`，一次 `scope='campaign:<id>'`。
4. 接著 `resolveRoutingConfig(...)` 再對 `routing_rules` 做 **第 3 次 D1 查詢**。

即使 routing 最後沒有命中任何規則，這三次 D1 存取仍然全部發生。

### 3. `isBot` / `checkVerifiedBot` 的慢主要是 **冷啟動或 KV 未命中時的初始化成本**

首個量測 run 中：

| 步驟 | Cold-ish | Warm |
|---|---:|---:|
| `entry_check_verified_bot` | 226ms | 2-5ms |
| `entry_is_bot` | 1302ms | 30-32ms |

這種從 **1.3 秒掉到 30ms** 的形態，不像固定業務邏輯，而更像：

1. 首次 isolate 啟動時需要載入模組資料與初始化；
2. `isBot(...)` 內部連續對 KV 執行多次 `get`：
   - `facebook_asn_list`
   - `bot_whitelist`
   - `bot_cidr_list`
   - `manual_cidr_blacklist`
   - `manual_asn_blacklist`
3. `checkVerifiedBot(...)` 也會再讀一次 `verified_bots`。

因此在 cold path 上，bot 相關步驟會放大；但它 **不是 warm path 的主要瓶頸**。warm 後它只剩數十毫秒，說明真正讓所有請求都慢的核心仍是 D1 熱路徑。

### 4. `enforceAdminApiAuth` 不是瓶頸

`Server-Timing` 顯示 `enforce_admin_api_auth;dur=0`。程式碼也證明：

1. 它每個請求都會先跑一次；
2. 但對非 admin path 會在 `isProtectedAdminPath(pathname)` 後直接返回；
3. 非 admin path 不會去 KV 讀 `admin_api_key`。

因此它在目前入口頁請求上不是主要性能問題，只是存在一個幾乎可忽略的固定函式呼叫。

### 5. `getCampaignConfigByHostname` 目前只有 1 次 D1 查詢，但仍偏慢

程式碼顯示 `getCampaignConfigByHostname(...)` 僅查一次 `campaigns` 表，`queryCount=1`。但 production 實測仍約 **118-175ms**，代表單次 D1 round trip 本身就不便宜。

由於 D1 資料庫目前運行在 **ENAM**，且讀複寫關閉，若使用者請求落在其他邊緣節點，單次 D1 查詢 latency 會被放大。這也解釋了為何多個查詢串行後，總耗時很容易堆到 500ms 以上。

### 6. safe-page Worker 自己也慢，表示 **網路 / TLS 固定成本** 確實存在，但不足以解釋全部問題

單獨請求 safe-page Worker 的平均：

| 指標 | 數值 |
|---|---:|
| TLS Avg | 1.426s |
| TTFB Avg | 1.927s |

這表示從目前 sandbox 到 Cloudflare 邊緣，**TLS 握手本身就接近 1.3-1.4 秒**。但 z1k4h.xyz warm run 的 `x-worker-timing-total` 仍有 **1.3-1.4 秒**，說明：

> **網路層固定成本存在，但 Worker 程式內部也額外再吃掉約 1.3 秒。**

因此不能把全部問題歸因於 Cloudflare 或網路。

## 對使用者問題的直接回答

### 哪個步驟最慢？

若看所有請求共同存在的熱點，最慢的是：

1. **`resolveRoutingConfig`**：約 **0.5 秒**，且每次都穩定偏慢。
2. **`campaign lookup` + `page variant lookup`**：合計約 **0.34 秒**。
3. **safe-page subrequest**：warm 約 **0.01-0.07 秒**，cold-ish 可到 **0.1 秒**。
4. **cold path 的 `isBot`**：首請求可暴衝到 **1.3 秒**，但 warm 後降到 **30ms**。

### 為什麼慢？

核心原因是 **請求主流程存在多次串行 D1 / KV 存取**，尤其是 routing 階段會固定做多次 D1 round trip；再加上 cold path 的 bot/KV 初始化，以及 Cloudflare 邊緣本身的 TLS 固定成本，最終把 TTFB 推高到 3-5 秒。

## 優化建議（按優先級排序）

### P0：把 routing 所需 feature flags 與規則改成單次讀取或快取結果

目前 `resolveRoutingConfig` 在 cache miss 時至少 3 次 D1 round trip。應優先處理：

1. **把 global + campaign flags 合併成單查詢**，例如：
   - `WHERE scope IN ('global', ?)`
   - 再在記憶體中做覆蓋合併。
2. 若 routing 規則更新頻率不高，**把 routing config 與 flags 預先序列化到 KV / 記憶體 cache**，請求期間直接讀快取。
3. 若業務允許，對沒有 routing 規則的 campaign，**在 campaign row 中加一個布林欄位**，先快速短路，不要每次都查 `routing_rules`。

預期收益：單是這一段就有機會下降 **200-350ms+**。

### P1：把 campaign、variant、flags 做 request 熱路徑快取整併

目前首頁入口至少會碰：

- `campaigns`
- `feature_flags`（2 次）
- `routing_rules`
- `page_variants`

可以考慮：

1. 將常用 campaign runtime 配置做成 **KV 快照**；
2. 後台更新 campaign 時同步刷新快照；
3. Worker 請求只在快照 miss 時回源 D1。

這樣可以把熱路徑從「每請求多次 D1」改為「多數請求 0 次或 1 次 D1」。

### P1：bot 檢查相關 KV key 做模組級快取或合併存放

目前 `isBot` 與 `checkVerifiedBot` 需要多個 KV key。建議：

1. 把 `verified_bots`、ASN 列表、CIDR 名單整併成 **單個 bot config JSON**；或
2. 第一次讀完後放在模組級 cache，附帶短 TTL；或
3. 在 deploy / config 更新時刷新版本號，避免每請求多 key round trip。

這能顯著縮小 cold path 的 1.3s 峰值，也能降低抖動。

### P2：避免 `safe-page` 經由 HTTP subrequest 再走一次 Worker

目前 safe page 是：

1. `shadow-cloak` 先決策；
2. 再 `fetch('https://safe-page...')` 去拿 safe page HTML。

若 safe page 內容較固定，可考慮：

- 直接把 safe page HTML 版本放到 KV / R2 / D1 快照；或
- 使用 Service Binding 呼叫內部 Worker，而不是經公網 URL；或
- 將 safe page 模板內嵌/共用模組化，避免額外 subrequest。

這可再減少 tens of ms 到 100ms 左右，並降低另一個 Worker 的額外不確定性。

### P2：移除 `round_robin` 路徑中的每請求建表

雖然本次入口量測沒有進到 `selectTargetLink` 的 round_robin 慢點，但程式碼顯示：

> `CREATE TABLE IF NOT EXISTS round_robin_state ...`

這在 `round_robin` 策略下會 **每個請求都跑一次**，屬於明確的結構性問題。應改為：

1. 部署前 migration 建表；
2. runtime 不再執行 DDL；
3. 或直接改用 KV / Durable Object 維護索引。

### P3：網路層優化與驗證

若程式優化完成後 TTFB 仍高，接著再看：

1. **TLS 握手**：目前 sandbox 到 Cloudflare 邊緣約 1.3-1.4s。
2. **D1 區域**：目前 DB 在 `ENAM`，可考慮 read replication 或區域策略。
3. **cold start**：比較首次請求與連續請求差異，已可見 bot 檢查在 cold path 特別敏感。

## 結論

本次 production 埋點已證明：

> **shadow-cloak 慢並非單一因素，而是「網路/TLS 固定成本 + Worker 內部多次串行 D1/KV 讀取」疊加所致。**

其中，**最需要先修的程式瓶頸是 `resolveRoutingConfig` 所代表的多次 D1 查詢鏈路**；而 **`isBot` 的 1.3s 峰值屬於 cold path / KV 初始化問題**。即使完全不考慮 Cloudflare 網路因素，warm path 的 Worker 內部仍然約 **1.3-1.4 秒**，已足以構成使用者體感上的「很慢」。
