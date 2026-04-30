---
title: "競品 LINE 與 Facebook 監控系統：專案啟動文件"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "定義自動化監控系統的技術架構與執行流程，涵蓋 LINE 好友人數抓取與 Facebook 廣告活動監控，旨在建立高效的情報蒐集機制。"
id: "20260328-known-monitor-spec"
type: "spec"
tags: [api, automation, competitor-analysis, data-collection, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件為「競品監控系統」的執行藍圖，旨在透過自動化方式蒐集 LINE 好友人數與 Facebook 廣告活動數據。核心技術方案包括利用 CHRLINE 函式庫，透過備用 LINE 帳號的 Session Token 調用 `BuddyService` API 獲取 LINE 官方帳號好友數，並實施 3-10 秒隨機延遲以規避封鎖；同時，整合 Facebook Ads Library API 追蹤競品廣告投放資訊。所有蒐集到的數據將自動彙整至 Google Sheets，並透過 n8n 設定排程自動化執行。文件明確了技術方案、防封策略與執行指令，是確保專案順利落地的核心規範。

# 競品 LINE 與 Facebook 監控系統：專案啟動文件

## 專案目標

<boundaries id="project-goals">
本專案旨在建立一套自動化競品監控系統，以達成以下兩大核心功能：

- **LINE 好友人數監控**：自動抓取競品 LINE 官方帳號的好友人數，每日定時更新至 Google Sheets。
- **Facebook 活動監控**：自動抓取競品 Facebook 廣告投放資訊與粉絲數變化，定時更新至 Google Sheets。
</boundaries>

---

## 技術方案一：LINE 好友數監控

### 核心工具：CHRLINE

<rule id="line-api-usage">
- **原理**：透過一個真實 LINE 帳號的 Session Token，直接呼叫 LINE 內部的 `BuddyService` API，使用 `getBuddyDetailWithPersonal()` 方法取得指定官方帳號的精確好友人數。
- **防封策略**：為降低風險，建議每次 API 查詢之間加入 3 至 10 秒的隨機延遲，並務必使用備用帳號進行操作。
</rule>

### 監控流程

<step id="line-monitoring-flow">
1. **準備帳號**：使用一個備用的 LINE 帳號，將所有要監控的競品官方帳號加入好友。
2. **執行查詢**：利用 Python 腳本透過 CHRLINE 函式庫登入該備用帳號，並依序查詢每個競品帳號的好友數。
3. **記錄數據**：將查詢到的好友數結果，自動寫入指定的 Google Sheets 試算表中。
</step>

---

## 技術方案二：Facebook 廣告與粉絲數監控

### 核心工具：Facebook Ads Library API

<rule id="facebook-api-usage">
- **說明**：此為 Facebook 官方提供的公開 API，可合法且免費地查詢任何粉絲專頁的廣告投放資訊。
- **必要條件**：需擁有 Facebook Developer 帳號並產生 Access Token 才能使用。
</rule>

### 監控流程

<step id="facebook-monitoring-flow">
1. **取得憑證**：申請一個 Facebook Developer 帳號，並取得 Access Token。
2. **抓取廣告**：利用 n8n 設定排程，定時呼叫 API 以抓取廣告資料。
3. **記錄與通知**：將所有數據自動寫入 Google Sheets。若發現重大變化，可設定自動推送 LINE 通知。
</step>

---

## 專案執行指令

<rule id="project-execution-rules">
1. **成本效益**：優先採用最節省資源（積分）的方式完成任務，避免任何不必要的消耗。
2. **API 優先**：凡是可透過 API 解決的問題，一律使用 API，禁止採用其他更複雜或低效的方式。
3. **文件更新**：完成重要任務後，必須立即更新「專案說明文件」，涵蓋架構、邏輯、決策與後續步驟執行。
4. **CHRLINE 邏輯**：本專案使用 CHRLINE 查詢 LINE 好友數，需在查詢間加入 3-10 秒隨機延遲。
</rule>

---

## 結論

本文件詳細闡述了競品監控系統的技術選型與執行流程。透過遵循本文件設定的指令與流程，預期能順利完成系統建置，為市場決策提供有力的數據支持。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-meta-adlibrary-api-notes.md`](./known-meta-adlibrary-api-notes.md) | Meta Ad Library API 使用筆記 |
| [`known-searchapi-analysis.md`](./known-searchapi-analysis.md) | SearchAPI.io Meta Ad Library API 功能分析 |
| [`known-ad-spy-api-comparison.md`](./known-ad-spy-api-comparison.md) | 廣告監控工具 API 功能比較與評估 |
