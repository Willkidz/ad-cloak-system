---
title: "斗篷管理後台 - 過濾功能分析與測試方案"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "根據 shadow-cloak 源碼整理過濾功能實作狀態，並規劃對應的自動與人工測試方案。"
version: "v1.0"
---
# 斗篷管理後台 - 過濾功能分析與測試方案

## 一、 過濾功能源碼分析清單

根據 `shadow-cloak.js` 最新源碼分析，12 個過濾功能的實作狀態如下：

| 功能名稱 | 實作狀態 | 源碼位置 | 備註 |
|---------|----------|----------|------|
| 1. 允許國家 (Country) | ✅ 有實作 | 第 988-997 行 | 讀取 Cloudflare `request.cf.country` 進行比對。已修復為空時允許所有的 Bug。 |
| 2. 允許省州 (State/Region) | ❌ 未實作 | - | 源碼中完全沒有省州過濾的相關邏輯。 |
| 3. 允許瀏覽器語言 (Language) | ✅ 有實作 | `checkLanguageWithConfig` (第 531 行) | 比對 `Accept-Language` header。 |
| 4. 允許作業系統 (OS) | ✅ 有實作 | `checkOSWithConfig` (第 493 行) | 透過 User-Agent 判斷 Android, iOS, Windows, macOS, Linux。 |
| 5. 允許作業系統版本 (OS Version) | ❌ 未實作 | `checkOSWithConfig` | 僅判斷 OS 類型，沒有解析與比對版本號的邏輯。 |
| 6. 允許流量來源 (Traffic Source) | ✅ 有實作 | `checkTrafficSourceWithConfig` (第 714 行) | 比對 Referer，支援 facebook, google, tiktok, line 等。 |
| 7. 強制要求 fbclid | ✅ 有實作 | `checkFbclidWithConfig` (第 547 行) | 檢查 URL 參數是否包含 `fbclid`。 |
| 8. 允許電腦端 (Desktop) | ✅ 有實作 | `checkOSWithConfig` (第 503 行) | 透過 User-Agent 判斷是否為非移動裝置。 |
| 9. 允許手機端 (Mobile) | ✅ 有實作 | `checkOSWithConfig` (第 503 行) | 透過 User-Agent 判斷是否為移動裝置。 |
| 10. 僅允許住宅 IP (Residential IP) | ✅ 有實作 | `checkVPNWithConfig` (第 560 行) | 呼叫 `blackbox.ipinfo.app` 檢查是否為 VPN/Datacenter IP。 |
| 11. IP 固定 (IP Pinning) | ✅ 有實作 | `selectTargetLink` (第 848 行) | 實作了 `ip_hash` 策略，將 IP 轉為 hash 值對應陣列索引。 |
| 12. 黑名單規則 | ⚠️ 部分實作 | `checkBlacklistRules` (第 756 行) | 支援 IP、IP範圍、UA關鍵字、UA正則。**未實作國家代碼黑名單**。 |

---

## 二、 完整測試方案

測試將使用廣告 `mopliv.site` (T-01) 或 `raxnto.shop` (T-02)，每次僅設定單一過濾條件以避免干擾。

### A. 自動測試 (可透過 curl 模擬)

這些測試可以由系統自動執行，透過修改 HTTP Headers 來模擬不同情境：

1. **瀏覽器語言過濾**
   - **配置**：設定 `cloak_lang = "zh-TW"`
   - **測試 1 (Pass)**：`curl -H "Accept-Language: zh-TW,zh;q=0.9"` 預期返回 200 (Money Page)
   - **測試 2 (Block)**：`curl -H "Accept-Language: en-US,en;q=0.9"` 預期返回 Safe Page

2. **作業系統過濾**
   - **配置**：設定 `cloak_os = "iOS"`
   - **測試 1 (Pass)**：`curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0...)"` 預期返回 Money Page
   - **測試 2 (Block)**：`curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0...)"` 預期返回 Safe Page

3. **流量來源過濾**
   - **配置**：設定 `cloak_traffic_source = "facebook"`
   - **測試 1 (Pass)**：`curl -H "Referer: https://l.facebook.com/"` 預期返回 Money Page
   - **測試 2 (Block)**：`curl -H "Referer: https://www.google.com/"` 預期返回 Safe Page

4. **強制要求 fbclid**
   - **配置**：設定 `require_fbclid = 1`
   - **測試 1 (Pass)**：`curl "https://domain.com/?fbclid=123"` 預期返回 Money Page
   - **測試 2 (Block)**：`curl "https://domain.com/"` 預期返回 Safe Page

5. **客戶端過濾 (電腦/手機)**
   - **配置**：設定 `allow_desktop = 1`, `allow_mobile = 0`
   - **測試 1 (Pass)**：使用 Windows UA 訪問，預期返回 Money Page
   - **測試 2 (Block)**：使用 iPhone UA 訪問，預期返回 Safe Page

6. **黑名單 (UA 關鍵字)**
   - **配置**：設定 `blacklist_rules = [{"type":"ua","value":"testbot"}]`
   - **測試 1 (Block)**：`curl -H "User-Agent: Mozilla/5.0 testbot 1.0"` 預期返回 Safe Page

7. **IP 固定 (IP Hash)**
   - **配置**：設定 `routing_strategy = "ip_hash"`，配置 3 個跳轉連結
   - **測試**：使用同一個 IP 多次請求，檢查是否始終跳轉到同一個目標連結。

---

### B. 手動測試 (需要用戶真實操作)

由於 Cloudflare 會覆寫 IP 與 Country Header，且 Datacenter IP 會被 Bot 檢測攔截，以下功能需要用戶使用真實裝置與網路測試：

1. **允許國家過濾**
   - **配置**：設定 `country = "TW"`
   - **測試步驟**：
     1. 用戶使用台灣網路訪問，預期看到 Money Page。
     2. 用戶開啟 VPN (例如切換到日本)，再次訪問，預期看到 Safe Page。

2. **僅允許住宅 IP (VPN 阻擋)**
   - **配置**：設定 `residential_only = 1`
   - **測試步驟**：
     1. 用戶使用手機 4G/5G 網路 (住宅 IP) 訪問，預期看到 Money Page。
     2. 用戶開啟 VPN (機房 IP) 訪問，預期看到 Safe Page。

3. **黑名單 (IP / IP 範圍)**
   - **配置**：將用戶當前的真實 IP 加入 `blacklist_rules`
   - **測試步驟**：用戶訪問網站，預期被阻擋並顯示 Safe Page。

---

## 三、 待解決問題分析

### 1. 模板預覽 API 404 問題
- **分析結果**：在 `cloak-admin-api.js` 源碼中（第 3588 行），**確實有實作** `/api/v1/templates/:id/preview` 路由，且路由順序正確（在 `/:id` 之前）。
- **根本原因**：線上環境返回 404，說明**目前部署在 Cloudflare 上的 `cloak-admin-api` Worker 版本過舊**，並未包含這段預覽 API 的代碼。需要將最新的 API 源碼重新部署到 Workers。

### 2. AX 爬蟲故障 (jovkc.shop)
- **分析結果**：爬蟲功能是由 `cloak-admin-api` 的 `/api/v1/templates/scrape` 端點負責。它使用固定的 Chrome User-Agent 透過 `fetch()` 抓取目標網頁。
- **根本原因**：
  1. `jovkc.shop` 很可能啟用了 Cloudflare 的防爬蟲保護（Bot Fight Mode / WAF）。
  2. 爬蟲 API 在抓取時，如果遇到 Cloudflare 的 "Just a moment" 或 "challenge-platform" 攔截頁面，會直接返回 HTTP 422 錯誤（源碼第 3477 行）。
  3. 因為 Worker 的 IP 屬於機房 IP，極易觸發目標網站的 Cloudflare 驗證，導致無法自動採集。
- **解決建議**：對於開啟了 CF 保護的站點，無法透過簡單的 `fetch` 採集，建議改用手動下載 HTML 後上傳，或接入第三方的無頭瀏覽器服務 (如 Apify / Browserless)。
