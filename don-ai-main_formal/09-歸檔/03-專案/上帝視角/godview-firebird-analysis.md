---
title: "火鳥斗篷系統 (Ad Cloaking) 深度功能分析"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "分析火鳥斗篷系統（新舊版本）的核心功能，包含域名管理、多維度過濾規則（IP、UA、語言、時間段）與 A/B 測試分流機制。揭示其「域名 -> 過濾判斷 -> 分流」的底層運作邏輯。"
id: "20260328-godview-firebird-analysis"
type: analysis
tags: [cloaking, dns, firebird, godview, security, testing]
status: archived
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 火鳥斗篷系統 (Ad Cloaking) 是一套專為規避廣告平台審核而設計的流量分發工具。其核心價值在於透過多維度過濾規則（如 IP 黑名單、設備類型、瀏覽器語言等），精準區分審核機器人與真實用戶。系統會將可疑流量導向「安全頁 (Safe Page)」，而將真實用戶導向「目標頁 (Money Page)」。新版本在舊版基礎上增加了更精細的過濾控制（如時間段限制）與更現代化的 UI。

# 火鳥斗篷系統 (Ad Cloaking) 深度功能分析

本文旨在分析「火鳥」斗篷系統的核心功能與運作邏輯。斗篷技術主要用於在廣告審核時呈現一個「安全」的頁面，而對真實用戶則顯示真正的「目標」頁面。

---

## 系統核心功能模組

火鳥系統的核心運作邏輯可歸納為以下五個關鍵模組：

<rule id="firebird-core-modules">

| 模組 | 職責 | 關鍵技術點 |
| :--- | :--- | :--- |
| **域名管理** | 基礎設施 | 支援自訂域名綁定、SSL 配置與 CNAME 解析。 |
| **流量過濾** | 核心引擎 | 多維度過濾：IP 黑白名單、國家/地區、設備類型、UA、Referer、語言、時間段。 |
| **分流機制** | 執行層 | 根據過濾結果，將流量導向 Safe Page 或 Money Page。 |
| **A/B 測試** | 優化層 | 支援多個目標頁按比例分配流量（Rotation）。 |
| **追蹤整合** | 數據層 | 整合 Facebook Pixel 等追蹤代碼，監測轉換事件。 |

</rule>

---

## 廣告活動 (Campaign) 設定流程

建立一個新的廣告活動通常遵循以下標準化步驟：

<step id="campaign-setup-flow">

1. **基本設定**：設定活動名稱，綁定域名，並填寫「目標 URL (Money Page)」與「安全 URL (Safe Page)」。
2. **過濾規則配置**：這是區分流量的關鍵。建立 IP 黑白名單，或根據國家、設備類型、瀏覽器 User-Agent、語言等條件進行過濾。
3. **進階設定**：設定特定時間段過濾或訪問頻率限制，以應對高強度的審核情境。
4. **分流與追蹤**：設定 A/B 測試比例，並嵌入 Facebook Pixel ID 以監測廣告成效。
5. **域名生效**：完成 SSL 憑證申請與 DNS 解析。

</step>

---

## 新舊版本對比分析

雖然新舊版本的核心邏輯一致，但在功能精細度上有顯著差異：

<boundaries id="version-comparison">

| 特性 | 新版火鳥 (adcloaking.com) | 舊版火鳥 |
| :--- | :--- | :--- |
| **使用者介面** | 現代化、引導式流程 | 較為過時，功能集中 |
| **過濾維度** | 增加「語言」、「時間段」過濾 | 基本維度（IP、UA、國家、設備） |
| **分流彈性** | 支援更複雜的權重分配 | 基本分流 |
| **日誌詳盡度** | 提供即時分流成效與地理分佈 | 基礎訪問日誌 |

</boundaries>

---

## 結論

火鳥斗篷系統的核心價值在於其**多維度的規則引擎**。它不僅可用於廣告斗篷，也適用於任何需要根據訪客屬性展示不同內容的場景（如內容在地化）。對於「上帝視角」專案而言，理解火鳥的過濾邏輯有助於我們優化自研的 `shadow-cloak` Worker，使其具備更強的抗審核能力。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-firebird-ad-ui-analysis.md`](godview-firebird-ad-ui-analysis.md) | 火鳥系統 UI 功能詳細拆解 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱 |
| [`godview-current-status.md`](godview-current-status.md) | 系統當前運行狀態 |
