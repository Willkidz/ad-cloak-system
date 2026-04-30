---
title: "斗篷管理後台故障診斷與修復紀錄"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-31"
summary: "彙總斗篷管理後台運行至今 6 個重大故障（P0/P1 級別）的診斷與修復紀錄，涵蓋 shadow-cloak IP 記錄失效、BC 像素事件丟失、N8N 歸因匹配失敗及 CAPI 權限問題。"
version: "v1.0"
id: "20260325-troubleshoot"
type: analysis
tags: [capi, cloak-admin, cloudflare-d1, cloudflare-workers, dns, n8n]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件記錄了斗篷管理後台 6 個核心故障的排查過程。最嚴重的問題包括：(1) **shadow-cloak IP 記錄失效**：因 Service Worker 格式無法存取 `env` 且誤用 `cf.clientIp`，導致 2440 筆日誌 IP 為 "unknown"，已透過升級 ES Module 與原生 D1 binding 修復；(2) **BC 像素事件丟失**：因 `money-page` 缺失前端追蹤代碼且 N8N Webhook 指向舊 IP，已補齊代碼並更新 URL；(3) **N8N 歸因匹配失敗**：因 `$helpers` 未定義與 DNS 解析失敗，已更換 DNS 並加入 3 次重試機制。此外，文件還記錄了 4 類歷史數據完整性問題（如 clicks 缺 `fbclid` 佔 36.6%）。

# 斗篷管理後台故障診斷與修復紀錄

本文件記錄了「斗篷管理後台」專案在開發與維運過程中遇到的各類問題及其解決方案，旨在為未來的問題排除提供參考，並沉澱經驗。

---

## 一、已修復重大問題 (P0/P1 級別)

### 1.1 shadow-cloak IP 與 visitor_id 記錄失效 (v1.10.1 修復)

- **發現日期**: 2026-03-25
- **嚴重度**: **P0 (Critical)**
- **症狀**: `cloak_logs` 表所有 2440 筆記錄的 IP 欄位均為 "unknown"，`visitor_id` 為 `null`。
- **根因分析**:
    - **格式限制**: shadow-cloak 使用舊版 Service Worker 格式，無法存取 `env` 變數。
    - **API 缺陷**: 使用 D1 REST API (硬編碼 fetch) 寫入日誌，其 subrequest 無法取得 `CF-Connecting-IP`。
    - **代碼錯誤**: 誤用不存在的 `cf.clientIp` 屬性。
- **修復方案**:
    <step id="fix-shadow-cloak">
    1. 將 Worker 升級為 **ES Module** 格式。
    2. 新增原生 **D1 Binding** (name: DB)。
    3. 改用 `env.DB.prepare().bind().run()` 進行寫入。
    4. IP 獲取改為 `request.headers.get('CF-Connecting-IP')`。
    </step>

### 1.2 BC 像素自定義事件不回傳 (v1.10.3 修復)

- **發現日期**: 2026-03-25
- **嚴重度**: **P0 (Critical)**
- **症狀**: BC 像素後台看不到任何 `PageView`, `Contact`, `Purchase` 事件。
- **根因分析**:
    - **代碼缺失**: `money-page` 頁面完全沒有呼叫 `/bc-event` 端點的前端追蹤代碼。
    - **配置過時**: `line-redirect` 的 N8N Webhook URL 仍指向舊 IP `5.189.150.66`。
- **修復方案**:
    <step id="fix-bc-pixel">
    1. 在 `money-page` 嵌入前端追蹤代碼。
    2. 將 `CONFIG_API_URL` 更新為 `https://n8n.bexnua.store/webhook/get-config`。
    </step>

### 1.3 N8N 歸因匹配與 CAPI 發送失敗 (v1.10.2 修復)

- **發現日期**: 2026-03-25
- **嚴重度**: **P0 (Critical)**
- **症狀**: ADS 像素未收到 `CompleteRegistration` 事件。
- **根因分析**:
    - **環境 Bug**: N8N 出現 `$helpers is not defined` 錯誤，導致 `follow` 事件處理中斷。
    - **DNS 故障**: 伺服器 DNS 解析失敗，導致無法連接 Facebook Graph API。
    - **認證不穩**: D1 認證偶發 401 錯誤。
- **修復方案**:
    <step id="fix-n8n-capi">
    1. DNS 伺服器強制改為 `8.8.8.8` / `1.1.1.1`。
    2. 在 CAPI 發送邏輯中加入 **3 次重試機制**。
    3. 補發 552 筆歷史失敗事件（驗證 100% 成功）。
    </step>

### 1.4 BC 像素 CAPI 權限問題 (v1.10.4 修復)

- **發現日期**: 2026-03-25
- **嚴重度**: **P1 (High)**
- **症狀**: CAPI 發送到新 BC 像素 (ID: 940592681819066) 時回傳 400 錯誤 (`Missing perms`)。
- **根因分析**: 新像素未在 Facebook Business Manager (BM) 中指派給對應的系統工作人員。
- **修復方案**: 由用戶在 BM 後台完成權限指派。
- **教訓**: 新建像素後必須在 BM 中指派系統工作人員權限，CAPI Token 才會生效。

---

## 二、歷史數據完整性問題

以下問題僅影響歷史數據，不影響新流入的流量。

| 問題描述 | 影響數量 | 根本原因 | 可修復性 |
| :--- | :--- | :--- | :--- |
| **舊 clicks 缺 pixel_id** | 198 筆 | 3/18~3/23 期間的舊版 Bug | 可手動補全 |
| **clicks 缺 fbclid** | 262/716 (36.6%) | 用戶行為或 `ini.html` 跳轉過程中丟失 | 無法修復 |
| **clicks 缺 visitor_id** | 709/716 (99%) | 「火鳥」流程不經過 shadow-cloak | 架構限制 |
| **clicks 缺 ad_code** | 111/716 (15.5%) | 廣告連結未帶 `?a=` 參數 | 需修改廣告連結 |

---

## 三、結論與預防措施

多數嚴重故障源於 **Cloudflare Worker 環境限制**（如 Service Worker vs ES Module）與 **外部服務整合**（如 N8N DNS 與 FB 權限）。

<rule id="troubleshoot-prevention">

1. **環境一致性**: 所有新 Worker 必須使用 ES Module 格式。
2. **重試機制**: 所有對外 API 調用（特別是 CAPI）必須包含至少 3 次重試。
3. **權限檢查**: 新增像素後，應立即執行 CAPI 測試以驗證 BM 權限。
4. **監控告警**: 應在 N8N 建立健康檢查 Workflow，定期檢測 D1 與 CAPI 的連通性。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽與版本紀錄 |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | n8n 歸因匹配邏輯細節 |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構與流量路徑 |

---
## 二、隱者系統深度分析問題（2026-03-31 發現）

> **分析方法**：直接從 Cloudflare Workers API 下載實際部署的 Worker 源碼，搭配 D1 資料庫實際查詢驗證。

### 2.1 campaigns 表為空，隱者系統完全癱瘓 (P0)
- **發現日期**: 2026-03-31
- **嚴重度**: **P0 (Critical)**
- **症狀**: `SELECT COUNT(*) FROM campaigns` 回傳 0。隱者系統的 shadow-cloak Worker 呼叫 `getCampaignConfigByHostname` 時，查詢 `WHERE theme = hostname AND status = 'active'` 永遠回傳 null，導致整個流程無法啟動。
- **根因分析**: D1 campaigns 表從未被寫入任何隱者廣告活動資料。
- **修復方案**: 在 campaigns 表 INSERT 隱者的廣告活動（theme=隱者網域, group_name=對應 line_config.tag）。純新增資料，不改程式碼，對火鳥零影響。
- **狀態**: 待修復

### 2.2 /track 路由強制清空 ad_code (P1)
- **發現日期**: 2026-03-31
- **嚴重度**: **P1 (High)**
- **症狀**: line-redirect `/track` 路由的 INSERT SQL 中 ad_code 位置寫死為空字串 `""`。
- **根因分析**: 源碼第 386 行註解「隱者不使用 ad_code」，設計時認為隱者不需要 ad_code。
- **修復方案**: 修改 `/track` 路由，從 `body.ad_code` 讀取值。同時修改 shadow-cloak.js 在 trackPayload 中加入 ad_code。
- **狀態**: 待修復

### 2.3 N8N CAPI event_source_url 寫死為 freshpathlab.com (P1)
- **發現日期**: 2026-03-31
- **嚴重度**: **P1 (High)**
- **症狀**: Prepare CAPI Events 節點的 `DEFAULT_DOMAIN` 寫死為 `freshpathlab.com`，所有 CAPI 事件的 `event_source_url` 都指向火鳥網域。
- **根因分析**: 開發時只有火鳥系統，未考慮隱者使用不同網域。
- **修復方案**: 利用 clicks 表的 target_link 欄位傳遞隱者網域，N8N 動態判斷。火鳥的 target_link 為 null，維持原邏輯。
- **狀態**: 待修復

### 2.4 TAG_PREFIX_MAP 缺少 n14-n19 (P2)
- **發現日期**: 2026-03-31
- **嚴重度**: **P2 (Medium)**
- **症狀**: N8N Prepare CAPI Events 的 TAG_PREFIX_MAP 只有 n20-n30，缺少 n14-n19。
- **修復方案**: 在 MAP 中補入 `'n14': 'N14', 'n15': 'N15', ..., 'n19': 'N19'`。
- **狀態**: 待修復
