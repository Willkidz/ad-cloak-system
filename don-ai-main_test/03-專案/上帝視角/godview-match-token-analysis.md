---
title: "Match Token 歸因失效深度分析報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "針對上帝視角系統中 Match Token 服務偶發性歸因失效的問題進行深度分析，識別出 Worker 冷啟動導致的 pixels 陣列空值寫入為核心誘因，並提供修復方案。"
id: "20260328-match-token-analysis"
type: "analysis"
tags: [attribution, cloaking, cloudflare-workers, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告揭示了歸因系統中一個關鍵的競爭條件漏洞。當 `line-redirect` Worker 發生**冷啟動**時，由於異步加載延遲，`pixels` 陣列可能尚未填充即被寫入 D1，導致 `aid` 欄位存入空陣列 `[]`。這使得後續的 `Match Token Data` 服務因找不到像素配置而跳過 CAPI 發送。目前已透過在冷啟動階段引入**阻塞式配置加載**成功修復此問題。

# Match Token 歸因失效深度分析

## 問題現象

在系統運行過程中，部分 LINE `follow` 事件雖然成功匹配到了 `token`，但最終未能觸發 Meta CAPI 的 Lead 事件發送。經查，這些失敗案例在 `godview_events` 表中的 `aid` 欄位均顯示為 `[]`（空陣列字串）。

---

## 根本原因分析

問題的根源在於 `godview_events` 的儲存與讀取機制中存在冷啟動漏洞：

<rule id="cold-start-vulnerability">
**1. 儲存階段 (Worker)**：`Save Token Mapping` 服務在儲存事件時，會將 `pixels` 的 JSON 陣列序列化後存入 `aid` 欄位。
</rule>

<rule id="initialization-race-condition">
**2. 冷啟動問題**：當 Cloudflare Worker 發生冷啟動時，全域變數 `pixels` 被初始化為空陣列 `[]`。若在 Config API 異步回傳前就有請求進入，系統會將此空值寫入 D1。
</rule>

<rule id="downstream-failure">
**3. 解析與歸因階段 (n8n)**：後續的 `Match Token Data` 服務讀取到 `'[]'` 並解析為空陣列。由於沒有像素配置，系統判定無需處理，直接跳過 CAPI 呼叫，導致歸因流程中斷。
</rule>

---

## 解決方案與驗證

為了解決此問題，已對系統進行以下架構級更新：

<step id="fix-blocking-load">
**阻塞式配置載入**：更新後的 Worker (v4) 在冷啟動階段改用阻塞方式等待 Config API 回傳，確保在處理任何點擊請求前，`pixels` 數據已完整載入。
</step>

<step id="config-api-enhancement">
**Config API 健壯性優化**：Config API (v3) 增加了數據去重與黑名單過濾機制，確保傳遞給 Worker 的像素配置始終有效。
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-logic-analysis.md](godview-logic-analysis.md) | 歸因邏輯漏洞總覽 |
| [godview-line-redirect-staging-log.md](godview-line-redirect-staging-log.md) | Worker 邏輯更新驗證日誌 |
| [godview-n8n-workflow-list.md](godview-n8n-workflow-list.md) | 包含 Match Token 服務的工作流清單 |
