---
title: "專案與 TAG 資訊彙總"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "彙整主要專案的 TAG 分組規則、Pixel ID 與技術設定規範，確保追蹤系統的一致性。"
id: "20260328-known-tag-info"
type: "spec"
tags: [advertising, known, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件為追蹤系統的技術規範。明確了博富、爆分王、莊家剋星、獨角仙四個專案的 TAG 命名規則（如 AS 代表爆分王）與對應的 Pixel ID。文件還涵蓋了 DNS 設定與連結產生器的使用流程，是確保廣告數據精準歸因的核心文檔。

# 專案與 TAG 資訊彙總

## 專案與 TAG 分組規則

為了有效管理多個專案的追蹤數據，我們採用了以下分組與命名規範：

| 專案名稱 | 業務性質 | TAG 前綴 | Pixel ID |
| :--- | :--- | :--- | :--- |
| **博富** | 博弈信用版 | [待補] | `943527751701905` |
| **爆分王** | 電子遊戲預測 | **AS** | `1059815113881250` |
| **莊家剋星** | 百家樂預測 | **AB** | `629682249831836` |
| **獨角仙** | 百家樂預測 | **AX** | `1996956134550764` |

---

## 技術設定規範

<step id="tracking-setup-1">**像素映射**：所有 Pixel ID 必須在 `Config API MASTER_PIXEL_MAP` 中完成註冊。</step>
<step id="tracking-setup-2">**路由設定**：23 個子域名（TAG）均需配置 Cloudflare Worker 路由以實現數據轉發。</step>
<step id="tracking-setup-3">**連結產生**：統一使用 Google Sheet 連結產生器，確保帶有正確的 `ad_code` 前綴。</step>

---

## 結論

嚴格遵循本規範能確保各專案數據的獨立性與準確性。在新增專案或 TAG 時，必須同步更新本文件與相關 API 設定。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-competitor-line-monitor-spec.md`](known-competitor-line-monitor-spec.md) | 競品監控系統啟動文件 |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | SearchAPI.io 功能分析 |
