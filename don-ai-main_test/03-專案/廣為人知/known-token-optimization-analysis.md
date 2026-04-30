---
title: "廣為人知專案 — Token 消耗優化分析報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "針對「廣為人知」專案的 AI 系統架構進行 Token 消耗分析，並提出多維度的成本優化方案。"
id: "20260328-known-token-optimization"
type: "analysis"
tags: [architecture, known, token-saving]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告旨在降低 AI 系統的運行成本。核心策略是將「感知任務（如圖片/影片分析）」卸載給專門的低成本 API（如 Google Vision），並利用 SQL 聚合查詢減少 D1 資料庫的數據傳輸量。預計優化後可降低 70% 以上的 Token 消耗，顯著提升系統的商業可行性。

# 廣為人知專案 — Token 消耗優化分析報告

## 優化方案總結

| 環節 | 目前問題 | 推薦工具 / API | 預期省 Token 幅度 |
| :--- | :--- | :--- | :--- |
| **圖片分析** | AI 直接看圖消耗大 | **Google Cloud Vision** | **70% - 85%** |
| **影片處理** | 逐幀分析成本極高 | **Twelve Labs API** | **75% - 95%** |
| **文案檢測** | 複雜判斷耗 token | **OpenAI Moderation** | **60% - 75%** |
| **數據分析** | 處理原始報表耗時 | **Meta Insights API** | **80% - 90%** |

---

## 核心優化邏輯

<step id="opt-logic-1">**感知卸載**：將非邏輯推理類的感知任務交給專門的微服務處理，主體 AI 只接收結構化的 JSON 結果。</step>
<step id="opt-logic-2">**數據聚合**：在資料庫層面完成數據預處理，避免將大量原始記錄餵給 AI。</step>
<step id="opt-logic-3">**快取機制**：對重複的分析請求實施快取，減少不必要的 API 調用。</step>

---

## 結論

透過「感知與推理分離」的架構優化，我們能在不犧牲分析品質的前提下，大幅降低運行成本。這對於需要大規模處理廣告素材的「廣為人知」專案至關重要。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | SearchAPI.io 功能分析 |
| [`known-tag-info.md`](known-tag-info.md) | 專案與 TAG 資訊彙總 |
