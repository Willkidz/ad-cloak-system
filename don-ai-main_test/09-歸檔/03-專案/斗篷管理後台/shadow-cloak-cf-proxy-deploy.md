---
title: "隱者斗篷 (ShadowCloak) Cloudflare Workers 反向代理斗篷系統部署報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "對隱者斗篷 (ShadowCloak) 系統透過 Cloudflare Workers 進行反向代理部署的詳細報告，包含資源配置、問題分析及未來改進建議。"
type: "deploy"
tags: [cloaking, deployment, shadow-cloak]
status: "archived"
archived_reason: "已整合至 03-專案/斗篷管理後台/隱者斗篷（Shadow Cloak）Cloudflare Workers 反向代理斗篷系統 - 部署報告.md"
archived_date: "2026-03-27"
merged_into: "03-專案/斗篷管理後台/隱者斗篷（Shadow Cloak）Cloudflare Workers 反向代理斗篷系統 - 部署報告.md"
---

# 隱者斗篷 (ShadowCloak) 部署報告

本報告詳細記錄了「隱者斗篷」(ShadowCloak) 系統透過 Cloudflare Workers 進行反向代理部署的過程、資源配置、已識別問題、解決方案及後續改進建議。

## 部署總覽

<rule id="deployment-overview">
此部署利用 Cloudflare Workers 作為反向代理，對訪問流量進行過濾。根據訪客的地理位置、ASN、IP 信譽、User-Agent 等特徵，將流量導向「目標頁面」(Money Page) 或「安全頁面」(Safe Page)，以達到斗篷效果。
</rule>

## 已建立資源

### DNS 記錄

| 記錄 ID | 名稱 | 類型 | 內容 | Proxy | TTL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ea1bd9acf4eaf1aefc2d73548c42d766` | bexnua.store | AAAA | 100:: | ✅ | 1 |
| `4777c249da3adc82e77105e9cc6e0a52` | www.bexnua.store | AAAA | 100:: | ✅ | 1 |

### Worker 資源

| 資源類型 | 資源 ID | 資源名稱 | 狀態 |
| :--- | :--- | :--- | :--- |
| Worker Script | shadow-cloak | shadow-cloak | ✅ Active |
| Worker Route | `d52aab3984614d95a6b016588f1c4403` | bexnua.store/* | ✅ Active |
| Worker Route | `f0d15eec750448308fbd622880b3b0e1` | www.bexnua.store/* | ✅ Active |

### 核心配置參數

| 參數 | 值 |
| :--- | :--- |
| **安全頁面源站** | `https://raxnto.shop` |
| **目標頁面源站** | `https://kogane.online` |
| **允許的國家** | TW, HK, MO |
| **地理位置過濾** | ✅ 啟用 |
| **黑名單 ASN 數量** | 33 |
| **IP 白名單** | 空 |

## 問題與建議

### 已識別問題

#### 1. 源站連接失敗 (HTTP 522)

- **問題描述**: 測試 5 和 6 無法連接到源站，返回 HTTP 522 Connection Timed Out。
- **影響範圍**: 正常用戶無法訪問目標頁面 (`kogane.online`)，Bot 無法訪問安全頁面 (`raxnto.shop`)。
- **根本原因**: 源站不可達、DNS 解析失敗或源站防火牆阻止 Cloudflare Worker 的請求。

<step id="solve-522-error">
**建議解決方案**：
1.  驗證源站 `kogane.online` 和 `raxnto.shop` 的 DNS 解析。
2.  確認源站服務器正在運行且可公開訪問。
3.  檢查源站防火牆規則，確保允許 Cloudflare 的 [IP 範圍](https://www.cloudflare.com/ips/)。
4.  使用 `curl -v --resolve` 直接從外部測試源站連接。
5.  檢查 Cloudflare Worker 日誌以獲取詳細錯誤信息。
</step>

#### 2. ASN 過濾過於激進

- **問題描述**: 測試環境的 ASN 16509 (AWS) 被列入黑名單，導致所有測試都被檢測為 Bot。
- **影響範圍**: 無法準確測試 User-Agent 過濾功能，且可能誤殺使用 AWS 代理的合法用戶。

<step id="solve-asn-filtering">
**建議解決方案**：
1.  在真實用戶網絡環境中進行測試。
2.  根據實際需求謹慎調整 `BLOCKED_ASNS` 列表。
3.  為測試環境設置專用的 IP 白名單。
</step>

### 改進建議

- **增強日誌記錄**: <step id="improve-logging">添加詳細請求日誌 (時間戳、客戶端 IP、User-Agent、檢測結果、路由決策)，可使用 Cloudflare Analytics Engine 或外部日誌服務實現。</step>
- **動態配置管理**: <step id="improve-config">將配置參數 (如 `ALLOWED_COUNTRIES`, `BLOCKED_ASNS`) 存儲在 Cloudflare KV 中，以支持動態更新，無需重新部署 Worker。</step>
- **性能優化**: <step id="improve-performance">實現請求緩存 (Cache API)、優化 HTML 重寫邏輯 (流式處理) 以減少源站請求延遲。</step>
- **安全加固**: <step id="improve-security">實現速率限制、請求簽名驗證和 DDoS 防護規則，以防止濫用。</step>
- **監控告警**: <step id="improve-monitoring">設置 Worker 錯誤率、源站連接失敗率和 Bot 檢測命中率的告警規則。</step>

## 後續步驟：Phase 3 輪替分流準備

### 部署後驗證

- **源站配置驗證**
    - [ ] 驗證 `kogane.online` 可用性
    - [ ] 驗證 `raxnto.shop` 可用性
    - [ ] 測試源站 DNS 解析
- **功能測試**
    - [ ] 使用真實用戶 IP 重新運行測試
    - [ ] 驗證 HTML 內容重寫功能
    - [ ] 測試備用白頁功能
- **性能測試**
    - [ ] 測試高流量場景下的響應時間
    - [ ] 監控 Worker 執行時間

### 輪替分流準備

- **流量分流配置**: <step id="prepare-traffic-split">定義流量分流比例 (例如 80/20)，配置 A/B 測試參數，並準備回滾方案。</step>
- **多源站支持**: <step id="prepare-multi-origin">添加多個目標源站配置，實現源站健康檢查與自動故障轉移。</step>
- **地理位置分流**: <step id="prepare-geo-routing">擴展允許的國家列表，為不同地區配置不同源站和 Bot 檢測規則。</step>

## 部署檢查清單

### 部署前
- [x] Cloudflare API Token 有效
- [x] 域名 DNS 已指向 Cloudflare
- [x] SSL 證書已配置 (模式: Full 或 Strict)

### 部署中
- [x] DNS AAAA 記錄已建立
- [x] Worker 代碼已上傳
- [x] 路由規則已綁定

### 部署後
- [x] 健康檢查通過
- [x] Bot 檢測功能正常
- [ ] 源站連接正常 `[待確認]`
- [ ] 性能測試通過 `[待確認]`

## 結論

本次部署成功在 Cloudflare Workers 上實現了 ShadowCloak 反向代理系統，基礎功能已配置完成。目前存在的主要問題是源站連接超時 (HTTP 522)，需要優先排查解決。長遠來看，建議引入動態配置、增強日誌監控和安全加固，以提高系統的穩定性與可維護性。

## 附錄

### A. Cloudflare Worker 配置文件 (`wrangler.toml`)

<example>
```toml
name = "shadow-cloak"
main = "shadow-cloak.js"
compatibility_date = "2024-01-01"
account_id = "61f1eb800e48d2cf41ed9ddacf01581b"

[env.production]
name = "shadow-cloak"
routes = [
  { pattern = "bexnua.store/*", zone_name = "bexnua.store" },
  { pattern = "www.bexnua.store/*", zone_name = "bexnua.store" }
]
```
</example>

### B. 部署命令

<example>
```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 設置 API Token [待確認：請更換為變數或移除敏感資訊]
export CLOUDFLARE_API_TOKEN="<YOUR_API_TOKEN>"

# 部署 Worker
wrangler deploy --env production
```
</example>

### C. 測試命令

<example>
```bash
# 健康檢查
curl -s https://bexnua.store/_health

# Debug 信息
curl -s https://bexnua.store/_debug | jq .

# Bot 檢測 (模擬 Facebook 爬蟲)
curl -s -H "User-Agent: facebookexternalhit/1.1" https://bexnua.store/_debug | jq .

# 主頁訪問
curl -s https://bexnua.store/
```
</example>

### D. 安全頁面示例 (`safe-page.html`)

<example>
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6; }
        h1 { color: #1a1a2e; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <h1>Welcome to our website</h1>
    <div class="content">
        <p>We are committed to providing the best services and product information.</p>
        <p>If you have any questions, please feel free to contact us.</p>
    </div>
    <footer>
        <p>&copy; 2026 All Rights Reserved.</p>
    </footer>
</body>
</html>
```
</example>

### 相關文件

- [隱者斗篷 (ShadowCloak) 系統架構設計](<待補充文件連結>)
- [Phase 3 輪替分流執行計畫](<待補充文件連結>)
