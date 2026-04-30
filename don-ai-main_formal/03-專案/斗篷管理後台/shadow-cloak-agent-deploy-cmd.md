---
title: "隱者斗篷 — Agent 部署指令"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "本文件提供在 Cloudflare Workers 上部署「隱者斗篷」反向代理系統的詳細步驟與設定指令，涵蓋 DNS 配置、Worker 腳本部署與路由綁定。"
version: "v1.0"
id: "20260325-024356"
type: cmd
tags: [cloaking, cloudflare-workers, deployment, dns, shadow-cloak]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本部署手冊指導如何在 Cloudflare Workers 上建立「隱者斗篷」反向代理系統。核心流程分為三步：**Phase 1** 建立 AAAA 記錄並啟用 Proxy；**Phase 2** 部署 `shadow-cloak.js` 核心腳本；**Phase 3** 綁定 Worker 路由。系統利用 ASN、UA 與 GeoIP 進行多層過濾，將機器人導向 `raxnto.shop`（白頁），真實用戶導向 `kogane.online`（真頁）。

# 隱者斗篷 — Agent 部署指令

本文件詳細說明瞭在 Cloudflare Workers 上部署「隱者斗篷」（Cloaking System）反向代理的核心步驟與完整設定。系統目標是將來自特定流量來源（如爬蟲、審核員）的請求導向安全頁面（白頁），同時將真實用戶流量導向目標頁面（Money Page）。

## 1. 環境資訊

<rule id="env-config">

以下為本專案所需的 Cloudflare 環境變數與域名設定。API Token 等敏感資訊應妥善保管。

```yaml
# Cloudflare API Token
CloudflareAPIToken: "cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f"

# Cloudflare 帳戶 ID
CloudflareAccountID: "b2471e0c307123945bdf1ce1b025563f"

# 斗篷前端域名 (廣告入口)
- domain: "bexnua.store"
  zone_id: "3d18bc84f1840bb4423a39030f5fc10b"

# 安全頁面域名 (白頁)
- domain: "raxnto.shop"
  zone_id: "fe971e900ef0af475d98ad6f9b866d4e"

# 核心業務域名 (不可用於斗篷，需嚴格隔離)
- domain: "freshpathlab.com"
  zone_id: "3558fb741de4523d04af78db910e7376"
```
</rule>

---

## 2. Phase 1：底層基礎建設

此階段將完成部署所需的前置作業，包含 DNS 設定、Worker 腳本部署與路由綁定。

<step id="dns-setup">

### 步驟 1：建立 DNS 記錄
在斗篷前端域名 `bexnua.store` 上建立 AAAA 記錄，指向 `100::` 並啟用 Cloudflare Proxy（橘色雲朵）。

<example id="dns-api-call">

```bash
# 建立根域名 AAAA 記錄
curl -X POST "https://api.cloudflare.com/client/v4/zones/3d18bc84f1840bb4423a39030f5fc10b/dns_records" \
  -H "Authorization: Bearer ${CloudflareAPIToken}" \
  -H "Content-Type: application/json" \
  --data '{"type": "AAAA", "name": "@", "content": "100::", "proxied": true, "ttl": 1}'
```
</example>
</step>

<step id="worker-deploy">

### 步驟 2：部署 Worker 腳本
將 `shadow-cloak.js` 腳本部署到 Cloudflare Workers，腳本名稱為 `shadow-cloak`。

<example id="worker-api-call">

```bash
# 部署 Worker（名稱：shadow-cloak）
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/${CloudflareAccountID}/workers/scripts/shadow-cloak" \
  -H "Authorization: Bearer ${CloudflareAPIToken}" \
  -H "Content-Type: application/javascript" \
  --data-binary @shadow-cloak.js
```
</example>
</step>

<step id="route-binding">

### 步驟 3：綁定 Worker 路由
將 Worker 腳本綁定到斗篷前端域名的流量路徑上，確保所有進入 `bexnua.store/*` 的請求都會由 `shadow-cloak` 處理。

<example id="route-api-call">

```bash
# 為 bexnua.store 綁定 Worker 路由
curl -X POST "https://api.cloudflare.com/client/v4/zones/3d18bc84f1840bb4423a39030f5fc10b/workers/routes" \
  -H "Authorization: Bearer ${CloudflareAPIToken}" \
  -H "Content-Type: application/json" \
  --data '{"pattern": "bexnua.store/*", "script": "shadow-cloak"}'
```
</example>
</step>

---

## 3. Phase 2：過濾引擎與反向代理

此階段的核心邏輯已全部實作於 `shadow-cloak.js` 腳本中，主要包含流量過濾與反向代理兩大功能。

<rule id="filter-logic">

### 過濾規則
1.  **IP 白名單**：位於白名單的 IP 將永遠被視為真實用戶。
2.  **ASN 封鎖**：來自已知數據中心（如 Meta AS32934, Google AS15169）的 ASN 將被阻擋。
3.  **User-Agent 偵測**：符合常見爬蟲（如 `facebookexternalhit`）特徵的 UA 將被阻擋。
4.  **地理位置過濾**：非指定地區（TW, HK, MO）的流量將被阻擋。
5.  **空 User-Agent**：缺少 User-Agent 的請求將被阻擋。

</rule>

<rule id="proxy-logic">

### 代理邏輯
- **真實用戶**：代理至 `MONEY_PAGE_ORIGIN` (`kogane.online`)，並改寫頁面中的域名以匹配斗篷域名。
- **機器人/審核員**：代理至 `SAFE_PAGE_ORIGIN` (`raxnto.shop`)，若失敗則返回內建的備用安全頁面。

</rule>

---

## 4. 部署後測試清單

部署完成後，請依序執行以下測試以確保系統正常運作。

| ID | 測試項目 | 指令 | 預期結果 |
| :--- | :--- | :--- | :--- |
| 1 | **健康檢查** | `curl https://bexnua.store/_health` | 回應 `OK` |
| 2 | **偵測調試** | `curl https://bexnua.store/_debug` | `isBot: false` |
| 3 | **模擬爬蟲** | `curl -H "User-Agent: facebookexternalhit/1.1" https://bexnua.store/_debug` | `isBot: true` |
| 4 | **真實用戶訪問** | 瀏覽器訪問 `https://bexnua.store/` | 顯示 Money Page 內容 |
| 5 | **模擬爬蟲訪問** | `curl -H "User-Agent: facebookexternalhit/1.1" https://bexnua.store/` | 顯示安全頁面內容 |

---

## 5. 結論

本文件提供了一套完整的「隱者斗篷」部署與測試流程。開發者應依照步驟操作，並在部署後徹底執行測試清單以確保所有功能符合預期。對於腳本中的設定（如域名、IP 白名單），應根據實際需求進行調整。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-cf-proxy-deploy.md](shadow-cloak-cf-proxy-deploy.md) | 部署報告與問題分析 |
| [shadow-cloak-feature-ui-spec.md](shadow-cloak-feature-ui-spec.md) | 功能與 UI 規範 |
| [cloak-risk-levels-spec.md](cloak-risk-levels-spec.md) | 風險等級與應對規範 |
