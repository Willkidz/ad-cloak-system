---
title: "火鳥廣告系統 UI 功能分析與對應報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "對火鳥廣告系統的 UI 進行逐頁分析，拆解其核心功能模組（運營準備、廣告執行、運營復盤），並與我方現有 Cloudflare Workers 系統進行功能對應比較，識別出管理後台與斗篷規則靈活性的差距。"
id: "20260328-godview-firebird-ui-analysis"
type: report
tags: [cloaking, firebird, godview, security, ui-ux]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告深度分析了「火鳥廣告系統」的 UI 設計與功能架構。火鳥系統提供了一個高度整合的圖形化介面，涵蓋了從域名管理、素材採集、斗篷規則配置到詳細日誌分析的全流程。相比之下，我方系統目前更依賴於手動配置和分離的 Worker 部署，在**統一管理後台**、**素材快速採集**與**斗篷規則靈活性**方面存在明顯差距。

# 火鳥廣告系統 UI 功能分析

## 核心功能模組概覽

火鳥廣告系統的整體功能圍繞廣告生命週期設計，主要分為四大模組：

| 模組 | 主要功能 |
| :--- | :--- |
| **運營準備** | 域名/短鏈管理、素材中心（落地頁與安全頁）、快捷導航 |
| **廣告執行** | 廣告製作、廣告投放、斗篷規則配置 |
| **運營復盤** | 廣告日誌分析（訪問、點擊、攔截等） |
| **系統設置** | 全局參數配置 |

---

## 功能分區詳解

### 1. 素材中心 (Material Center)
素材中心是管理廣告落地頁（主題）和安全頁的核心場所，支持多種創建方式。

- **新增主題方式**：
  1. **採集新增**：輸入目標鏈接，系統自動分析採集頁面內容。
  2. **ZIP 上傳**：上傳包含頁面資源的 ZIP 檔案。
  3. **自定義新增**：手動編寫頁面代碼。
- **源碼編輯規範**：
  <step id="ui-edit-1">頭部需引入 `[conftp]` 全局配置文件。</step>
  <step id="ui-edit-2">需刪除原主題引入的 Facebook、Google 等像素追蹤腳本。</step>
  <step id="ui-edit-3">需將點擊按鈕的 class 加入 `gotolink` 或使用 `onclick="gotolink()"` 方法。</step>

### 2. 廣告執行模組 (Ad Execution)
火鳥系統採用「左右分欄」的介面設計，將核心流程與進階設定分離。
- **新增/編輯廣告流程**：
  <step id="ad-creation-flow">①選擇模版 → ②添加分流 → ③創建斗篷 → ④廣告投放 → ⑤提交信息。</step>
- **進階過濾邏輯**：
  | 過濾維度 | 說明 | 應用場景 |
  | :--- | :--- | :--- |
  | **瀏覽器語言** | 僅允許特定語言訪客 | 排除跨國爬蟲 |
  | **操作系統** | 限制 iOS 或 Android 版本 | 針對性投放 |
  | **安全頁模式** | 模板展示或 URL 跳轉 | 應對廣告平台審核 |

### 3. 運營復盤模組 (Analytics)
提供詳細的日誌記錄，分為五類 Tab 頁：全部日誌、訪問日誌、按鈕點擊、安全內頁點擊、斗篷攔截。
- **關鍵發現**：「斗篷攔截」日誌會明確標示攔截原因，例如「瀏覽器語言不允許」，這對優化過濾規則至關重要。

---

## 與我方系統功能對應分析

<boundaries id="system-comparison">

| 火鳥功能 | 我方對應方案 | 狀態與備註 |
| :--- | :--- | :--- |
| **域名管理** | Cloudflare Workers 路由 | 手動配置，缺乏 UI。 |
| **落地頁管理** | `money-page` Worker | 手動部署。 |
| **廣告製作 (斗篷)** | `shadow-cloak` Worker | 規則為硬編碼，缺乏靈活性。 |
| **廣告日誌** | D1 `cloak_logs` | 待建立。 |
| **多鏈接分流** | `line-redirect` Worker | 部分實現。 |
| **FB 像素** | Meta CAPI via n8n | 已實現。 |

</boundaries>

---

## 結論與優化方向

火鳥系統的核心優勢在於**高度整合的流程**與**精細化的斗篷規則配置**。我方系統雖然在底層實現了類似功能，但操作效率有較大提升空間。

<rule id="optimization-focus">

1. **建立統一後台**：減少對手動部署 Worker 的依賴。
2. **靈活斗篷配置**：將硬編碼的過濾規則轉移至 D1 或 KV，實現動態調整。
3. **素材採集工具**：開發或整合自動化頁面採集工具，提升落地頁製作效率。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-firebird-analysis.md`](../../09-歸檔/03-專案/上帝視角/godview-firebird-analysis.md) | 火鳥斗篷系統功能深度分析（已歸檔） |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱 |
| [`godview-current-status.md`](godview-current-status.md) | 系統當前運行狀態 |
| [`godview-firebird-campaign-edit-notes.md`](godview-firebird-campaign-edit-notes.md) | 編輯頁截圖記錄 |
