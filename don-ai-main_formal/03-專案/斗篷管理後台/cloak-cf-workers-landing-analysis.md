---
title: "廣告落地頁斗篷（Cloaking）技術與 Cloudflare Workers 實現方案研究報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "研究報告，探討如何利用 Cloudflare Workers 實現廣告落地頁的斗篷（Cloaking）技術，以應對 Meta 和 Google 日益嚴格的 AI 審核機制，並提供具體的代碼架構與風險評估。"
version: "v1.0"
id: "20260325-024356"
type: analysis
tags: [advertising, cloak-admin, cloaking, cloudflare-workers, meta-ads]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本報告針對廣告落地頁的「斗篷」（Cloaking）技術進行深入研究。核心結論是：傳統 JS 跳轉已失效，必須採用基於 Cloudflare Workers 的伺服器端（Server-side）過濾。利用 `request.cf` 原生獲取 ASN、國家與威脅分數，結合 IP/UA 黑名單進行多層過濾。推薦採用「反向代理」模式，對機器人展示安全頁（Safe Page），對真人展示真實頁（Money Page），確保網址不變且無跳轉痕跡。

# 廣告落地頁斗篷（Cloaking）技術與 Cloudflare Workers 實現方案研究報告

## 1. 執行摘要

本報告針對廣告落地頁的「斗篷」（Cloaking）技術進行了深入研究，並結合您現有的 Cloudflare 基礎設施（包含 9 個網域及 Cloudflare Workers），提出了一套基於 Serverless 架構的流量過濾與保護方案。研究顯示，隨著 Meta（Facebook）與 Google 等廣告平台持續升級其人工智慧審核機制，傳統的客戶端（JavaScript）跳轉與靜態規則已無法有效規避偵測。現代的斗篷技術必須依賴伺服器端（Server-side）的動態過濾，結合 IP 自治系統編號（ASN）、使用者代理（User-Agent）以及行為特徵分析，才能在保護真實落地頁（Money Page）的同時，向審核機器人展示合規的安全頁面（Safe Page）。

## 2. 斗篷（Cloaking）技術核心原理

斗篷技術的核心在於「流量分流」（Traffic Segmentation）。其運作方式是透過分析每一個 HTTP 請求的特徵，判斷該訪客是真實的潛在客戶，還是廣告平台的審核機器人、競爭對手或惡意爬蟲。

### 2.1. 流量識別維度

<rule id="multi-layer-filtering">
現代斗篷系統通常採用多層次的過濾機制，主要依賴以下幾個維度進行判斷：
</rule>

| 檢測維度 | 說明與應用 | 規避難度 |
| :--- | :--- | :--- |
| **IP 與 ASN 檢測** | 檢查訪客 IP 是否屬於已知的資料中心（Datacenter）、雲端服務供應商（如 AWS、Google Cloud）或廣告平台的專屬網段（如 Meta 的 AS32934）。這是最基礎且最有效的防線。 | 高 |
| **User-Agent (UA) 分析** | 比對瀏覽器標識字串。雖然 UA 容易被偽造，但官方爬蟲（如 `AdsBot-Google` 或 `facebookexternalhit`）通常會誠實宣告其身分。 | 低 |
| **地理位置 (Geo-targeting)** | 確保訪客來自廣告投放的目標國家或地區。若廣告僅投放於台灣，但請求來自愛爾蘭（Meta 歐洲總部）或美國，則極有可能是審核流量。 | 中 |
| **Referer 驗證** | 檢查 HTTP Referer 標頭，確認流量是否確實來自廣告平台的點擊，而非直接輸入網址或從其他不明來源跳轉。 | 中 |
| **行為與指紋分析** | 透過客戶端 JavaScript 收集設備指紋（Canvas、WebGL）、螢幕解析度，並分析互動行為。機器人通常缺乏這些真實的人類互動特徵。 | 極高 |

### 2.2. 安全頁面與真實頁面的切換邏輯

在確認訪客身分後，系統必須決定如何呈現內容。目前的最佳實踐是採用「反向代理」（Reverse Proxy）模式。

<step id="cloaking-process">

1.  **判定為審核/機器人**：系統直接在當前網域下渲染合規的「安全頁面」（Safe Page）。頁面必須看起來像是一個真實、合法的商業網站，且內容需與廣告素材具備關聯性。
2.  **判定為真實用戶**：透過反向代理，在不改變瀏覽器網址列的情況下，從後端伺服器（如火鳥系統）拉取並展示「真實頁面」（Money Page）的內容。

</step>

## 3. Cloudflare Workers 實現架構

利用 Cloudflare Workers 實現斗篷技術具有顯著優勢。Workers 運行於全球邊緣節點，能以極低的延遲攔截並分析請求。

### 3.1. 技術優勢

- **原生屬性**：內建 `request.cf` 物件，可直接獲取訪客的 ASN、國家、城市、威脅分數（Threat Score），無需額外呼叫第三方 API。
- **高性能**：在請求到達源站前即可完成判斷，延遲通常小於 10ms。
- **隱蔽性**：配合 Cloudflare Proxy（橘色雲朵），隱藏真實源站 IP，審核方無法追蹤後端伺服器。

### 3.2. 代碼設計架構

<example id="workers-cloaking-logic">

```javascript
export default {
  async fetch(request, env) {
    const cf = request.cf;
    const ua = request.headers.get('user-agent') || '';
    
    // 1. 基礎過濾：ASN 黑名單 (如 Meta AS32934, Google AS15169)
    const blockedASNs = [32934, 15169, 16509, 14618];
    if (blockedASNs.includes(cf.asn)) return serveSafePage(env);
    
    // 2. UA 檢測：常見爬蟲特徵
    const botRegex = /facebookexternalhit|adsbot-google|googlebot|headlesschrome/i;
    if (botRegex.test(ua)) return serveSafePage(env);
    
    // 3. 地理位置：僅允許目標國家 (如台灣 TW)
    if (cf.country !== 'TW') return serveSafePage(env);
    
    // 4. 通過過濾：反向代理真實頁面
    return serveMoneyPage(request, env);
  }
}
```
</example>

## 4. 風險評估與應對

<boundaries id="cloaking-risks">

- **誤判風險**：過於嚴格的過濾可能導致真實用戶被導向安全頁，降低轉化率。應定期分析日誌，優化 ASN 與 IP 黑名單。
- **域名關聯**：若多個廣告帳號共用同一個斗篷域名，一旦域名被封，所有帳號都會受影響。建議實施「一帳號一域名」策略。
- **內容不一致**：安全頁內容若與廣告素材完全無關，會增加人工審核失敗的機率。安全頁應設計為廣告素材的「合規延伸」。

</boundaries>

## 5. 結論

本研究確認，採用基於 Cloudflare Workers 的伺服器端斗篷技術，是應對當前主流廣告平台 AI 審核的有效策略。此方案不僅延遲低、成本可控，更能充分利用 Cloudflare 的原生安全特性來識別與過濾可疑流量。建議下一步應基於本報告提出的原理，完成具體的 Workers 代碼開發與小規模 A/B 測試，以驗證其實際成效與穩定性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-dev-roadmap-plan.md](cloak-dev-roadmap-plan.md) | 斗篷系統開發路線圖 |
| [cloak-firebird-system-arch-analysis.md](cloak-firebird-system-arch-analysis.md) | 系統架構深度解析 |
| [cloak-open-source-analysis.md](cloak-open-source-analysis.md) | 開源方案技術對比 |
| [cloak-risk-levels-spec.md](cloak-risk-levels-spec.md) | 風險等級與應對規範 |
