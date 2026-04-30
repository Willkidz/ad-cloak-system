---
title: "斗篷（Cloak）系統核心技術研究"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "研究斗篷系統的流量分流機制，包含 IP 過濾、UA 識別、瀏覽器指紋與行為分析四維度判斷，以及 Cloudflare Worker 後端實作優勢。"
version: "v1.0"
id: "20260325-cloak-research"
type: analysis
tags: [cloak-admin, cloaking, cloudflare-workers, money-page, safe-page, security]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本研究探討斗篷（Cloak）系統作為流量分流器的核心技術。**核心邏輯**：根據訪客特徵將審核爬蟲導向「安全頁（Safe Page）」，將真實用戶導向「目標頁（Money Page）」。**判斷維度**：(1) IP 過濾（黑名單/VPN/雲端服務商）；(2) UA 識別；(3) 瀏覽器指紋（Canvas/字體/插件）；(4) 行為分析（滑鼠軌跡/滾動）。**實作建議**：強烈推薦使用 **Cloudflare Worker 後端方式**，具備 100ms 內響應、隱藏源站 IP 且爬蟲難以偵測的優勢。目前 `shadow-cloak` 已採用此架構。

# 斗篷（Cloak）系統核心技術研究

斗篷系統本質上是一個流量分流器，其核心作用是根據訪客的身份特徵，將其導向不同的頁面，以應對廣告平台（如 Facebook、Google）的自動化審核機制。

---

## 判斷維度分析

斗篷系統透過多維度組合來判斷訪客身份，從基礎到高級可分為以下四類：

<step id="ip-filtering">

### 1. IP 過濾 (基礎)
主要依賴黑名單數據庫。
- 過濾已知的廣告平台爬蟲 IP 段。
- 封鎖來自 VPN 或代理服務的 IP。
- 排除來自 AWS、GCP、Azure 等主流雲端服務供應商的 IP。
- **挑戰**：審核人員可能使用住宅代理（Residential Proxies）繞過。

</step>

<step id="ua-identification">

### 2. User-Agent 識別
檢查瀏覽器發送的 User-Agent 字串。
- 識別已知的爬蟲 UA 標識。
- 交叉驗證 UA 與設備、作業系統等參數是否匹配。

</step>

<step id="browser-fingerprinting">

### 3. 瀏覽器指紋 (高級)
透過 JavaScript 收集瀏覽器環境的細微特徵，建立獨特的「指紋」。
- **收集參數**：瀏覽器版本、螢幕解析度、安裝字體、插件列表、Canvas 指紋、設備記憶體、時區等。

</step>

<step id="behavior-analysis">

### 4. 行為分析 (最高級)
分析用戶在頁面上的互動行為模式。
- **分析指標**：滑鼠移動軌跡、點擊速度、頁面停留時間、滾動行為等。
- **挑戰**：技術門檻高，需要機器學習模型支持。

</step>

---

## 技術實作方式對比

| 方式 | 優點 | 缺點 | 推薦度 |
| :--- | :--- | :--- | :--- |
| **前端 JS 跳轉** | 實作簡單 | 易被爬蟲偵測，SEO 差 | ❌ 不推薦 |
| **Iframe 嵌入** | 頁面切換無感 | DOM 結構暴露，易被分析 | ❌ 不推薦 |
| **PHP 動態輸出** | 後端判斷，爬蟲難偵測 | 依賴源站性能，易暴露 IP | ⚠️ 中等 |
| **Cloudflare Worker** | 邊緣節點響應，隱藏源站 | 需熟悉 Serverless 開發 | ✅ 強烈推薦 |

---

## 關鍵指標 (KPI)

<rule id="cloak-kpi">

- **過濾準確率**：平衡「誤傷真實用戶」與「被審核識破」的風險。
- **響應速度**：判斷與分流必須在 **100 毫秒** 內完成。
- **持續更新**：IP 庫與指紋庫必須隨廣告平台審核技術升級而持續更新。

</rule>

---

## 結論

在 Cloudflare Worker 上以後端方式實現，並結合 IP 過濾、瀏覽器指紋 and 基礎行為分析，是當前兼具效率與效果的最佳實踐路徑。目前專案中的 `shadow-cloak` 已成功應用此架構。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 斗篷系統靈魂文件 |
| [cloak-admin-line-integration.md](cloak-admin-line-integration.md) | 流量跳轉與歸因整合 |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 部署與環境配置 |
