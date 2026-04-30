---
title: shadow-cloak staging 測試報告
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-09"
summary: "整理 shadow-cloak-staging 在 2026-04-09 對 P0/P1 修復項目的測試結果、初始化動作與重測結論。"
version: "v1.0"
author: Manus AI
date: 2026-04-09
status: completed
---
# shadow-cloak staging 測試報告

本報告整理 `shadow-cloak-staging` 環境於 2026-04-09 對今日所有 **P0/P1 修改**的實測結果、staging 資料初始化動作，以及針對最後三項缺陷完成修復後的重測結果。此次測試依照倉庫工作規範進行，先確認工作規範與認證資訊，再以 `curl` 對 staging Worker 逐項發送請求，同步以 Cloudflare D1 / KV 檢查資料結構與必要初始資料。[1] [2]

本輪測試的最終結論是：**先前阻塞驗收的三項問題已於 staging 完成修正並重測通過。`/cloak-action-verify` 現已同時接受 `fp_score` / `fingerprint_score` 與 `time_on_page` / `dwell_time`；`/cloak-fingerprint` 在高 `bot_score` 案例下會優先阻擋，不再被重複放行邏輯覆寫；`verified bot allowlist` 也已在 `decisions` 表留下 `decision = "verified_bot"`、`reason = "Googlebot"` 的審計記錄。** 其餘先前已通過的功能在本輪未見回歸。[3] [4] [5] [6] [7] [8] [9] [11] [12] [13] [14] [15] [16] [17] [18] [19] [20] [21] [22] [23] [24] [25]

## 測試範圍與環境

| 項目 | 內容 |
| --- | --- |
| Worker URL | `https://shadow-cloak-staging.laoqin1689.workers.dev` |
| D1 Database ID | `594f8569-ad3c-40c0-ac7c-8b691f9d7885` |
| KV Namespace ID | `40f192e8fc514af1b6a55eff8f63bbff` |
| 測試方式 | 以 `curl` 驗證 HTTP 狀態碼與回應內容，並搭配 D1 / KV 查詢交叉驗證 |
| 涵蓋範圍 | P0-1、P0-2~6、P1-1、P1-2、P1-3、P1-4/P1-5、P1-6/P1-7 |

## 總結摘要

| 功能項目 | 結果 | 結論 |
| --- | --- | --- |
| P0-1 操作層二次判斷 | 通過 | `/cloak-action-verify` 已支援 `fingerprint_score` / `dwell_time` 別名，重測成功回傳 `{"verified":true,...}` |
| P0-2~6 分層日誌 | 通過 | `interaction_events`、`decisions`、`rules` 三表存在且可讀寫；`rules` 已於 staging 補齊預設資料 |
| P1-1 verified bot allowlist | 通過 | Googlebot 重測後，`decisions` 已新增 `decision = "verified_bot"`、`reason = "Googlebot"` 的記錄；`cloak_logs` 亦保留 `verdict = "verified_bot"` 證據 |
| P1-2 Feature flags | 通過 | `/cloak-flags` GET/POST 正常，`feature_flags` 預設資料已存在並可更新後還原 |
| P1-3 BotD SDK | 通過 | `/cloak-fingerprint` 高 `bot_score` 案例現已回 `pass: false`，且 `decisions` 記錄為 `blocked` / `bot_detected` |
| P1-4/P1-5 page_variants 與模板版本 | 通過 | `/cloak-variants`、`/cloak-template-version`、`/cloak-template-rollback` 均可正常操作 |
| P1-6/P1-7 內容解耦與 R2 素材 | 通過 | `/cloak-content/templates`、`/cloak-content/assets`、`/cloak-content/logs` 皆可取得資料；相關表與示範資料已完成初始化 |

## 詳細測試結果

### P0-1 操作層二次判斷

`/cloak-action-verify` 端點在 staging 存在且可正常回應。以目前 Worker 實作欄位命名發送請求時，可得到成功放行結果；當缺少 `visitor_id`、指紋分數過低、互動次數過低或停留時間過短時，也都能返回 `verified: false` 並導向安全頁，代表端點的基礎判定流程已經接通。[2] [3]

在完成修補後，已再次以需求文件欄位名稱 `fingerprint_score` 與 `dwell_time` 重跑正向案例，staging 直接返回 `{"verified":true,"target":"https://lin.ee/stage-pass?vid=staging-pass-visitor"}`，證明別名映射已生效，對外 API 與需求文件已重新一致。原先使用實作欄位 `fp_score` / `time_on_page` 的既有行為也未受破壞。[2] [3] [11]

| 測試案例 | HTTP | 主要回應 | 判定 |
| --- | --- | --- | --- |
| 端點存在性檢查 | 200 | 端點可回應 JSON | 通過 |
| 使用需求欄位名 `fingerprint_score` / `dwell_time`（修復後重測） | 200 | `{"verified":true,"target":"https://lin.ee/stage-pass?vid=staging-pass-visitor"}` | 通過 |
| 使用實作欄位名 `fp_score` / `time_on_page` | 200 | `{"verified":true,...}` | 通過 |
| 缺少 `visitor_id` | 400 / 阻擋回應 | 缺參數被拒絕 | 通過 |
| 低指紋分數 | 200 | `{"verified":false,"reason":"low_fp_score",...}` | 通過 |
| 低互動次數 | 200 | `{"verified":false,"reason":"low_interaction",...}` | 通過 |
| 停留時間過短 | 200 | `{"verified":false,"reason":"short_stay",...}` | 通過 |

### P0-2~6 分層日誌

staging D1 中已確認 `interaction_events`、`decisions`、`rules` 三張表存在，且可以成功寫入與讀回測試資料。`decisions` 表的欄位也已確認包含 `request_id`、`visitor_id`、`session_id`、`decision`、`decision_layer`、`matched_rules`、`reason`、`target_url`、`domain`、`campaign_id`、`processing_time_ms`、`created_at` 等本次功能所需欄位，結構符合分層日誌需求。[4] [5]

在初始化方面，`rules` 表於測試時並非完整的預設狀態，因此本次已直接於 staging 補齊預設規則資料。初始化完成後，staging 至少已有可用的基礎 action 規則，後續也已補入 entry / action 類基礎規則，讓分層判斷不再依賴空表運作。[4]

| 檢查項目 | 結果 | 說明 |
| --- | --- | --- |
| `interaction_events` 表存在 | 通過 | D1 查詢可見 |
| `decisions` 表存在 | 通過 | D1 查詢可見 |
| `rules` 表存在 | 通過 | D1 查詢可見 |
| `interaction_events` 讀寫 | 通過 | 測試寫入後可查回 `interaction_rows = 1` |
| `decisions` 讀寫 | 通過 | 測試寫入後可查回 `decision_rows = 1` |
| `rules` 讀寫 | 通過 | 測試寫入後可查回 `rule_rows = 1` |
| `decisions` 欄位結構 | 通過 | PRAGMA 結果完整 |
| `rules` 預設資料 | 已初始化 | staging 已補齊預設規則 |

### P1-1 verified bot allowlist

本次已確認 staging KV 中存在 `verified_bots` 配置，且內容包含 Googlebot、Bingbot、Yandex、Baiduspider、DuckDuckBot、Applebot 等多類爬蟲／預覽機器人的比對規則，代表 allowlist 設定本身已建立。[6]

修補後已補做 focused retest。第一次直接以 Googlebot User-Agent 請求 staging root 時，仍先命中國家過濾而留下 `country_blocked`，顯示 staging 目前的 entry 判定順序是**國家過濾先於 verified bot allowlist**；因此為了驗證本次修補是否真的補上 `decisions` 寫入，測試期間暫時透過 `/cloak-flags` 將 `enable_country_filter` 關閉，重送 Googlebot 請求後，`decisions` 已新增兩筆 `decision = "verified_bot"`、`decision_layer = "entry"`、`matched_rules = ["verified_bot_allowlist"]`、`reason = "Googlebot"` 的記錄，`cloak_logs` 也同步新增 `verdict = "verified_bot"`、`reason = "verified_bot_search_engine"`。驗證完成後已立即將 `enable_country_filter` 還原為 `true`。[6] [13] [18] [19] [20] [21] [22] [23] [24] [25]

| 檢查項目 | 結果 | 說明 |
| --- | --- | --- |
| KV 存在 `verified_bots` 配置 | 通過 | 已成功寫入並查回完整 JSON |
| Googlebot UA 請求可達 Worker | 通過 | 收到 `HTTP 200` |
| 直接重測是否先被 country filter 擋下 | 是 | 第一次重測產生 `country_blocked`，代表 staging 目前仍以國家過濾優先 |
| 關閉 country filter 後 `decisions` 是否寫入 `verified_bot` | 通過 | 已查得 `decision = "verified_bot"`、`reason = "Googlebot"` |
| `cloak_logs` 是否同步保留 verified bot 證據 | 通過 | 已查得 `verdict = "verified_bot"` |

### P1-2 Feature flags

`/cloak-flags` 在 staging 可正常提供旗標列表，也可透過 `POST` 修改旗標狀態。測試中先讀取現況，再將 `debug_mode` 切換為 `true`，確認 GET 回傳已變更後，再將其還原成 `false`。另外，`feature_flags` 表中已存在一組完整預設旗標，包含 `enable_fingerprint`、`enable_action_verify`、`enable_verified_bot_allowlist`、`enable_layered_logging`、`enable_routing_rules`、`maintenance_mode`、`debug_mode` 等 14 項資料，故此項可判定為通過。[7]

| 測試案例 | HTTP | 主要回應 | 判定 |
| --- | --- | --- | --- |
| `/cloak-flags` GET | 200 | 回傳完整 flags 物件 | 通過 |
| `/cloak-flags` POST | 200 | `{"success":true}` | 通過 |
| POST 後 GET 驗證 | 200 | `debug_mode: true` | 通過 |
| 還原 flag 狀態 | 200 | `{"success":true}` | 通過 |
| `feature_flags` 預設資料 | 通過 | D1 已存在 14 筆預設旗標 |

### P1-3 BotD SDK

`/cloak-fingerprint` 已能接受 `bot_signals` 參數，且一般請求會回傳 `HTTP 200` 與 `{"pass":true,"score":8,"cached":true/false}`，代表端點與傳入資料格式本身已接通。[8]

完成修補後，已以新的 request id 重新送出高 `bot_score = 3` 且含 `webdriver`、`playwrightGlobals`、`headlessUa` 等明確自動化訊號的案例。staging 現已回傳 `{"pass":false,"score":8,"bot_score":3,"cached":false}`，且 `decisions` 新增 `decision = "blocked"`、`decision_layer = "page"`、`matched_rules = ["fingerprint","botd"]`、`reason = "bot_detected"` 的審計記錄；`cloak_logs` 也寫入 `reason = "fp_blocked_bot_detected"`。這表示高風險 bot 案例已優先於 duplicate/cached allow 路徑被阻擋，本次問題可判定為已修復。[8] [12] [14] [15]

| 測試案例 | HTTP | 主要回應 / 日誌 | 判定 |
| --- | --- | --- | --- |
| 接受 `bot_signals` 參數 | 200 | 正常回傳 JSON | 通過 |
| 高 `bot_score` 自動化訊號（修復後重測） | 200 | `{"pass":false,"score":8,"bot_score":3,"cached":false}` | 通過 |
| `decisions` 審計結果 | 通過 | `blocked` / `bot_detected` / `matched_rules=["fingerprint","botd"]` |
| `cloak_logs` 日誌結果 | 通過 | `reason = "fp_blocked_bot_detected"` |

### P1-4 / P1-5 page_variants 與模板版本

本輪測試已在 staging 補齊 `page_variants`、`template_versions` 結構，並確認 `templates` 表具備 `current_version`、`version_count` 欄位。之後透過 `/cloak-content/templates` 建立測試模板，再以 `/cloak-variants` 寫入 variant，確認 GET 前為空陣列、POST 後可查回剛建立的 variant 資料。接著以 `/cloak-template-version` 建立版本 2，再用 `/cloak-template-rollback` 回滾至版本 1，最終在 `template_versions` 與 `templates` 中都可查回正確版本資訊，代表版本治理流程已經打通。[2] [9]

| 測試案例 | HTTP | 主要回應 | 判定 |
| --- | --- | --- | --- |
| `/cloak-variants` GET（建立前） | 200 | `variants: []` | 通過 |
| `/cloak-content/templates` 建立模板 | 200 | 成功回傳測試 `template_id` | 通過 |
| `/cloak-variants` POST | 200 | `{"success":true}` | 通過 |
| `/cloak-variants` GET（建立後） | 200 | 成功查回 variant | 通過 |
| `/cloak-template-version` POST | 200 | `{"success":true,"version":2}` | 通過 |
| `/cloak-template-rollback` POST | 200 | `{"success":true,"rolled_back_to":1}` | 通過 |
| D1 版本資料驗證 | 通過 | `current_version = 1`，`version_count = 2` |

### P1-6 / P1-7 內容解耦與 R2 素材

`/cloak-content/templates` 在 staging 可正常返回模板清單，`/cloak-content/assets` 與 `/cloak-content/logs` 也能返回資料。為完成測試，本次已在 staging 建立 `assets`、`content_api_logs` 表，並補入最小示範素材索引與內容操作日誌，使 GET 端點可直接驗證結果。[9] [10]

測試中，`/cloak-content/templates?campaign_id=staging-test-action-verify` 可回傳測試模板與既有模板清單；`/cloak-content/assets?campaign_id=staging-test-action-verify&category=banner` 可回傳剛補入的 `phase8/demo-banner.png`；`/cloak-content/logs?limit=10` 可回傳內容建立與素材 seed 日誌。整體來看，內容治理 API 已可在 staging 完成基本查詢與審計用途。[9] [10]

| 測試案例 | HTTP | 主要回應 | 判定 |
| --- | --- | --- | --- |
| `/cloak-content/templates` GET | 200 | 回傳模板清單 | 通過 |
| `/cloak-content/assets` GET | 200 | 回傳示範 asset 索引資料 | 通過 |
| `/cloak-content/logs` GET | 200 | 回傳內容操作日誌 | 通過 |
| `assets` / `content_api_logs` 初始化 | 已完成 | staging 已可支援內容與素材清單查詢 |

## 本次已直接在 staging 執行的初始化與資料補齊

本次任務已依授權直接在 staging 執行必要初始化，以確保各功能可完成驗證。這些動作包括補齊 `rules` 預設規則、確認並保留 `feature_flags` 預設資料、建立 `verified_bots` KV 設定、補齊 `page_variants` 與 `template_versions` 所需表與欄位、建立內容治理所需的 `assets` 與 `content_api_logs`，以及插入一筆測試模板、一筆測試 variant、一筆測試 asset 與對應內容日誌。[4] [6] [7] [9] [10]

| 類別 | 本次動作 | 目的 |
| --- | --- | --- |
| 規則系統 | 補齊 `rules` 預設資料 | 讓分層規則可在 staging 實際工作 |
| Feature flags | 確認／保留預設 flags，並測試後還原 `debug_mode` | 驗證旗標系統可動態切換 |
| Verified bots | 寫入 `verified_bots` KV JSON | 驗證 allowlist 配置層可用 |
| 模板版本治理 | 建立測試模板與版本資料 | 驗證 variant / version / rollback 流程 |
| 內容治理 | 建立 `assets`、`content_api_logs` 及示範資料 | 驗證內容與素材查詢 API |

## 修復後觀察與注意事項

本輪原先阻塞驗收的三項問題已全數關閉，staging 目前已具備再次交付驗收的條件。不過，verified bot 的 entry 流程仍有一項值得記錄的行為特徵：在目前 staging 順序下，**國家過濾仍先於 verified bot allowlist 執行**，因此若 Googlebot 來自不在 allowlist 國家集合內的測試來源，會先留下 `country_blocked`，而不會進入 verified bot 分支。這不影響本次要求的 `decisions` 寫入修復已完成，但後續若要讓合法爬蟲在所有場景下都優先落入 allowlist，仍可考慮再評估 entry 判定順序。[2] [18] [19] [24] [25]

| 項目 | 現況 | 影響 |
| --- | --- | --- |
| `/cloak-action-verify` 參數別名 | 已修復並重測通過 | 需求文件欄位名可直接使用 |
| `/cloak-fingerprint` 高 `bot_score` 優先阻擋 | 已修復並重測通過 | 高風險自動化流量不再被 duplicate allow 覆寫 |
| verified bot `decisions` 記錄 | 已修復並重測通過 | `decisions` 與 `cloak_logs` 皆可提供審計證據 |
| verified bot 與 country filter 順序 | 仍以 country filter 較早執行 | 影響測試路徑，但不影響本次修補本身成立 |

## 建議後續處理

建議將本報告此次 focused retest 結論視為 staging 最新基準，後續若再擴充 verified bot 能力，可另外規劃一輪 entry pipeline regression，專門評估 country / verified bot / general bot 三者的先後順序是否需要進一步調整。若現階段目標僅為完成本次三項缺陷修復與驗收，則 staging 已可視為**本輪通過**。[12] [14] [15] [24] [25]

## References

[1]: ../../00-系統索引/common-cmd.md "don-ai 工作規範"
[2]: ../../05-原始碼/斗篷管理後台/shadow-cloak.js "shadow-cloak Worker 原始碼"
[3]: ../../.tmp-action-verify-results/03_impl_named_params_pass.txt "P0-1 正向 action verify 測試"
[4]: ../../.tmp-d1-phase3-fix/01_tables_exist.json "P0-2~6 D1 三表存在性與初始化證據"
[5]: ../../.tmp-d1-phase3-fix/03_rw_interaction.json "P0-2~6 分層日誌讀寫驗證"
[6]: ../../.tmp-p1-verified-bot/02_kv_get.body "P1-1 verified_bots KV 設定"
[7]: ../../.tmp-p1-feature-flags/09_feature_flags_sample.json "P1-2 feature_flags 預設資料與端點測試"
[8]: ../../.tmp-p1-botd-robust/01_accepts_bot_signals_pass.txt "P1-3 BotD SDK 與指紋端點測試"
[9]: ../../.tmp-p1-variants/13_template_versions_rows.json "P1-4/P1-5 page variants 與模板版本測試"
[10]: ../../.tmp-p1-content/06b_logs_get.body "P1-6/P1-7 內容解耦與素材日誌測試"
[11]: ../../.tmp-shadow-cloak-retest/11_action_verify_alias.body "P0-1 修復後 action verify 需求欄位名重測"
[12]: ../../.tmp-shadow-cloak-retest/12_fingerprint_high_bot.body "P1-3 修復後 fingerprint 高 bot_score 重測"
[13]: ../../.tmp-shadow-cloak-retest/13_googlebot.body "P1-1 首次 Googlebot 重測回應"
[14]: ../../.tmp-shadow-cloak-retest/14_decisions_after_retest.json "P0-1 與 P1-3 修復後 decisions 重測證據"
[15]: ../../.tmp-shadow-cloak-retest/15_cloak_logs_after_retest.json "P0-1 與 P1-3 修復後 cloak_logs 重測證據"
[16]: ../../.tmp-shadow-cloak-retest/18_campaign_links.json "staging campaigns link 綁定查詢"
[17]: ../../.tmp-shadow-cloak-retest/19_recent_decisions_window.json "staging 近期 decisions 視窗查詢"
[18]: ../../.tmp-shadow-cloak-retest/21_disable_country_filter.body "verified bot 重測期間暫停 country filter"
[19]: ../../.tmp-shadow-cloak-retest/22_googlebot_after_disable.body "verified bot 重測期間 Googlebot 回應"
[20]: ../../.tmp-shadow-cloak-retest/23_restore_country_filter.body "verified bot 重測後還原 country filter"
[21]: ../../.tmp-shadow-cloak-retest/24_verified_bot_evidence.json "verified bot 修復後 decisions 證據"
[22]: ../../.tmp-shadow-cloak-retest/25_verified_bot_logs_latest.json "verified bot 修復後 cloak_logs 證據"
[23]: ../../05-原始碼/斗篷管理後台/shadow-cloak.js "Shadow Cloak verified bot / fingerprint / action verify 最新實作"
[24]: ../../.tmp-shadow-cloak-retest/24_verified_bot_evidence.json "verified bot decisions 最新查詢結果"
[25]: ../../.tmp-shadow-cloak-retest/25_verified_bot_logs_latest.json "verified bot cloak_logs 最新查詢結果"
