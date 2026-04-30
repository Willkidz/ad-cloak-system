---
title: "Meta CAPI 回傳現況分析與像素合併方案"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "診斷 CAPI 流程中主資料庫像素缺失問題：n8n Prepare CAPI Events 節點的 matchData.pixels 陣列原先僅含廣告像素，導致主帳號（如 943527751701905）無法接收轉化信號。修復方案為引入 MASTER_PIXEL_MAP 環境變數，Worker 在寫入 D1 時自動合併廣告像素與主像素至 pixels JSON 欄位，Prepare CAPI Events 遍歷該陣列逐一發送。BF03-BF05 已補齊廣告像素 1259161412843235。"
id: "20260328-godview-capi-analysis"
type: analysis
tags: [capi, cloudflare-d1, godview, n8n, pixel]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告揭示並解決了 CAPI 回傳流程中的一個重大缺陷。**問題**：n8n 的 `Prepare CAPI Events` 節點在構建 CAPI 請求時，`matchData.pixels` 陣列僅包含從 D1 讀取的廣告像素（如 `1425742365409547`），而遺漏了主資料庫像素（如 `943527751701905`），導致主帳號無法接收到完整的轉化信號，影響廣告優化的全局視角。**修復方案**：(1) 在 n8n 環境變數中定義 `MASTER_PIXEL_MAP`，存儲各 `tag` 對應的主像素 ID 與 Token；(2) Worker 在寫入 D1 時，自動將廣告像素與主資料庫像素合併寫入 `pixels` JSON 欄位；(3) `Prepare CAPI Events` 遍歷 `pixels` 陣列，對每個像素都發送 CAPI 事件，無需修改回傳邏輯。**已完成修復**：BF03-BF05 已補齊廣告像素 `1259161412843235`，新的點擊事件將自動包含兩組像素配置。

# Meta CAPI 回傳現況分析與像素合併方案

## 問題診斷

<boundaries id="pixel-missing-issue">

### 缺陷描述

在修復前的 CAPI 回傳流程中，`Prepare CAPI Events` 節點從 D1 `clicks` 表讀取歸因成功的記錄時，`pixels` 欄位僅包含廣告像素。這意味著 CAPI 事件只會發送至廣告帳號的像素，而主資料庫像素（用於全局數據彙總）被遺漏。

### 影響範圍

- 主帳號的 Meta Events Manager 中看不到完整的轉化數據。
- 廣告優化僅基於單一帳號的數據，缺乏全局視角。
- 跨帳號的 ROI 對比分析不準確。

### 根因

Worker 在寫入 D1 時，僅查詢了 `ad_config` 表中的廣告像素配置，未查詢主資料庫像素。部分產品線（如 BF03-BF05）在 `ad_config` 表中甚至沒有廣告像素記錄，導致 `pixels` 欄位僅包含主資料庫像素的單一配置。

</boundaries>

---

## 修復方案：像素合併 (Pixel Merge)

<step id="capi-fix-1">

**1. 引入主像素映射表**

在 n8n 環境變數中定義 `MASTER_PIXEL_MAP`，存儲各產品線對應的主資料庫像素 ID 與 CAPI Token。Worker 在處理點擊事件時，根據 `tag` 查詢此映射表，取得主像素配置。

</step>

<step id="capi-fix-2">

**2. Worker 端像素合併**

修改 `line-redirect` Worker 的 D1 寫入邏輯。在構建 `pixels` JSON 欄位時，將廣告像素（來自 `ad_config`）與主資料庫像素（來自 `MASTER_PIXEL_MAP`）合併為一個陣列：

<example id="pixels-field-example">

**BF01 的 `pixels` 欄位（合併後）**：
1. 廣告像素：`1425742365409547` + BF01 專屬 CAPI Token
2. 主資料庫像素：`943527751701905` + 共用 CAPI Token

**BF03 的 `pixels` 欄位（修復前僅一組，修復後兩組）**：
1. 廣告像素：`1259161412843235` + BF03 專屬 CAPI Token（新增）
2. 主資料庫像素：`943527751701905` + 共用 CAPI Token

</example>

</step>

<step id="capi-fix-3">

**3. CAPI 回傳邏輯（無需修改）**

`Prepare CAPI Events` 節點的現有邏輯已經會遍歷 `pixels` 陣列，對每個像素配置都構建並發送一個獨立的 CAPI 事件。因此，只要 Worker 端正確合併了像素，CAPI 回傳邏輯無需任何修改。

</step>

---

## 修復狀態

<rule id="fix-status">

| 產品線 | 修復前狀態 | 修復後狀態 | 備註 |
| :--- | :--- | :--- | :--- |
| BF01 | 已包含廣告像素 + 主像素 | 無需修改 | — |
| BF03-BF05 | 僅主像素（缺廣告像素） | 已補齊廣告像素 `1259161412843235` | 新點擊自動包含兩組 |
| AS 系列 | 已包含廣告像素 + 主像素 | 無需修改 | — |
| 其他產品線 | 需逐一確認 | — | 建議執行全面審計 |

</rule>

---

## 結論

修復主資料庫像素缺失問題是提升廣告投放 ROI 分析準確性的關鍵。目前 BF 系列的修復已完成，建議對所有產品線執行一次像素配置全面審計，確保每個 `tag` 的 D1 `pixels` 欄位都同時包含廣告像素與主資料庫像素。修復後應進行為期 3 天的數據對比驗證，確認主帳號的 Events Manager 能正確接收到轉化事件。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-bc-pixel-events.md`](godview-bc-pixel-events.md) | BC 像素事件定義與規範 |
| [`godview-pixels-analysis.md`](godview-pixels-analysis.md) | D1 `pixels` 欄位組成分析 |
| [`godview-cf-worker-pixel-id-analysis.md`](godview-cf-worker-pixel-id-analysis.md) | Worker 像素選擇邏輯（AD_MAP vs MASTER_PIXEL_MAP） |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | n8n Workflow 清單 |
