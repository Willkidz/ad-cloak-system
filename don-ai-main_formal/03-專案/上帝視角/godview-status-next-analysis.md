---
title: "「上帝視角」專案：當前狀態與下一步行動報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "2026-03-15 的系統全面盤點報告，發現 ad_config 缺少 Pixel ID 與 CAPI Token 導致歸因鏈路中斷，並列出四項修復行動計畫。"
id: "20260325-024356"
type: "analysis"
tags: [attribution, capi, cloudflare, godview, n8n, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **注**：本文件提及的 `manus_memory` DataTable 已於 2026-03-30 廢棄（ADR-003），記憶系統已遷移至 don-ai `.ai/` 目錄。以下為歷史記錄。

> **TL;DR**: 2026-03-15 的系統全面盤點報告。n8n 有 9 個 Workflows（歸因與報表為核心）和 9 個 DataTables，但 `ad_config` 中的 Meta Pixel ID 與 CAPI Token 欄位為空值，導致歸因數據鏈路中斷、轉換事件無法回傳 Meta。Cloudflare 端有 1 個 Worker（`line-redirect`）綁定 freshpathlab.com 下 23 個子域名，當時尚無 D1/KV。下一步需向用戶取得 Pixel ID 與 CAPI Token、修復 n8n Calculate Stats 節點、進行端到端測試。

# 「上帝視角」專案：當前狀態與下一步行動報告

**報告日期**：2026年3月15日
**報告作者**：Manus AI

---

## 總結

本報告旨在全面盤點「上帝視角」專案的當前狀態。透過檢閱 n8n 的工作流程（Workflows）、資料表（DataTables），以及 Cloudflare 的雲端資源，我們已對系統的整體架構、資料流程與潛在問題有了清晰的掌握。

目前系統的核心功能——**廣告成效歸因與報表自動化**——已基本建立，但存在幾個關鍵的資料缺口與設定問題，導致歸因鏈路中斷，報表無法正確產出。下一步的行動將聚焦於補全這些關鍵設定、修復已知邏輯錯誤，並與您一同驗證完整的資料流程。

---

## 1. 系統現況分析

### 1.1 n8n 平台

n8n 是本專案的自動化中樞，負責處理資料串接、邏輯運算與報表生成。

| 資產類型 | 數量 | 關鍵項目與狀態 | 說明與分析 |
| :--- | :--- | :--- | :--- |
| Workflows | 9 | Token Attribution System（啟用）、Sheets Report（啟用）、廣告數據自動化追蹤（停用） | 歸因與報表是兩個獨立但串連的啟用中流程 |
| DataTables | 9 | manus_memory、manus_credentials、godview_events、ad_config、line_config | ad_config 的 Pixel ID 與 CAPI Token 欄位為空值（嚴重問題） |

### 1.2 Cloudflare 平台

| 資產類型 | 數量 | 關鍵項目與狀態 | 說明與分析 |
| :--- | :--- | :--- | :--- |
| Workers | 1 | line-redirect | 綁定 freshpathlab.com 下 23 個子域名 |
| DNS Zones | 9 | freshpathlab.com（主要使用） | 唯一與本專案直接相關的域名 |
| KV / D1 | 0 | 無 | 所有結構化資料儲存在 n8n DataTables |

<boundaries id="report-date-scope">

> **注意**：此報告撰寫於 2026-03-15，部分資訊可能已過時。自 v1.10 起，系統已新增 D1 資料庫（cloak_logs、clicks 表）和多個 Workers（shadow-cloak、cloak-admin-api）。請參照 [`.ai/memory.md`](../../.ai/memory.md) 的「系統狀態快照」取得最新狀態。

</boundaries>

---

## 2. 核心問題與下一步行動

### 核心問題

<rule id="critical-data-gap">

1. **歸因數據鏈路中斷**：`ad_config` 資料表中缺乏 Meta Pixel ID 與 CAPI Token，導致無法將轉換事件回傳給 Meta。
2. **報表欄位邏輯待修復**：「人員」與「素材名稱」兩個欄位需改為手動維護，但 n8n 的 Calculate Stats 節點尚未更新此邏輯。

</rule>

### 下一步行動計畫

<step id="action-1">1. **向用戶確認**：取得 ad_config 中每個 code 對應的 Meta Pixel ID 和 CAPI Access Token。</step>
<step id="action-2">2. **修復 n8n 工作流程**：更新 Calculate Stats 節點，確保手動維護欄位不被覆蓋。</step>
<step id="action-3">3. **端到端測試**：完整用戶流程驗證（點擊廣告 → 加入 LINE 好友 → 觸發對話）。</step>
<step id="action-4">4. **更新專案文件**：將修改與最終架構更新至 v5 版本。</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/system-patterns.md`](../../.ai/system-patterns.md) | 系統架構模式 |
| [`data-relation-principles.md`](../../01-核心原則/project-specific-specs.md) | 數據關聯方式 |
| [`project-changelog.md`](../../08-任務追蹤/project-changelog.md) | 版本發佈紀錄 |
