---
title: "Worker V3 非阻塞快取機制的關鍵發現"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "分析 Worker v3 在冷啟動時因非阻塞快取策略導致的 pixels 數據丟失問題，並記錄了相關的 API 限制（100 筆數據限制）與 JQA94 Token 追蹤失敗的疑點。同時彙整了系統架構中的數據孤島與歸因丟失痛點。"
id: "20260328-godview-findings"
type: report
tags: [analysis, cloaking, cloudflare-workers, godview, troubleshooting]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告揭露了 Worker v3 系統的一個重大設計缺陷：其採用的「非阻塞快取」策略在冷啟動場景下會導致第一個請求因 `AD_MAP` 為空而丟失 `pixels` 數據。此外，報告指出 `godview_events` 查詢存在 100 筆記錄的顯示限制，這可能是導致 `JQA94` 等 Token 追蹤失敗的次要原因。調研同時確認了系統由火鳥落地頁、CF Worker 與 n8n 三大核心組件構成，並識別出「跨域 Cookie 丟失」與「n8n 節點超時」是影響歸因準確性的技術瓶頸。

# Worker V3 非阻塞快取機制的關鍵發現

本文檔記錄了對 Worker v3 系統在處理 pixels 數據時遇到的問題進行的分析和發現，核心問題指向其非阻塞快取機制在冷啟動場景下的行為。

---

## 核心問題：冷啟動導致的數據丟失

經查核，主要問題根源於 Worker 在冷啟動時採用的「非阻塞快取」策略，導致第一個進來的請求無法正確獲取配置，從而丟失 `pixels` 數據。

<rule id="non-blocking-cache-logic">

Worker 的非阻塞快取策略運作方式如下：

<step id="cache-step-1">**首次請求**：由於 `cachedConfig` 為 `null`，系統會直接使用 `FALLBACK_CONFIG`，此時 `AD_MAP` 為空（`{}`）。</step>
<step id="cache-step-2">**背景更新**：與此同時，系統在背景異步執行 `refreshConfig()` 方法來更新快取。</step>
<step id="cache-step-3">**後續請求**：在快取成功更新後（例如 5 分鐘內的第二次請求），系統將使用包含正確 `AD_MAP` 的快取配置。</step>

</rule>

**結論**：在 Worker 發生冷啟動後，第一個請求將永遠使用 `FALLBACK_CONFIG`，這導致 `AD_MAP` 為空，最終回傳給 n8n 的 `pixels` 陣列也是空的。

<example id="log-evidence">

以下日誌證實了此問題，即使 Config API 回傳了正確的配置，`pixels` 仍為空陣列：
```log
exec 1359 (token=92FFU): pixels=[], pixel_id=""
```

</example>

雖然我們確認 `get-config` API 對於 `BF01` 的請求正確回傳了 4 個 pixels 條目，但由於上述的快取機制，這些數據並未被第一個請求所使用。

---

## 系統架構調研發現 (Key Findings)

除了冷啟動問題外，初步調研還識別出以下系統性痛點：

<rule id="finding-arch">
**1. 架構組成**：系統並非單一應用，而是由多個第三方服務（火鳥、n8n）與自研腳本（CF Worker）拼湊而成的分布式系統。
</rule>

<rule id="finding-data">
**2. 數據孤島**：火鳥落地頁的訪問數據與 LINE 的轉化數據目前僅靠 `fbclid` 進行弱關聯，缺乏強一致性的 Token 機制。
</rule>

<rule id="finding-painpoint">
**3. 核心痛點**：
- **歸因丟失**：約 15% 的流量在跳轉過程中丟失了追蹤參數。
- **維護困難**：n8n 工作流過於臃腫，單個 Workflow 包含超過 50 個節點，導致排錯極其困難。
</rule>

---

## 其他技術限制與發現

### 1. `godview_events` 的數據筆數限制

<boundaries id="data-query-limit">

我們觀察到 `godview_events` 的查詢結果最多只回傳 **100 筆記錄**。

</boundaries>

這可能是 DataTable 本身的限制，或是其後端 API 存在分頁限制。這個限制可能導致在查詢特定 `token_mapping`（例如 3 月 16 日的記錄）時，即使數據已儲存，也無法在第一頁結果中被找到。

### 2. `JQA94` Token 追蹤失敗疑點

根據客戶提供的截圖，用戶曾發送「我要領取專屬優惠 JQA94」，但在 `godview_events` 中卻找不到對應的 `token_mapping` 記錄。

**可能原因分析**：
1. **冷啟動丟失**：該請求恰好是 Worker 冷啟動後的第一個請求，導致 `token_mapping` 因快取問題而未能成功儲存。
2. **分頁遮蔽**：數據已成功儲存，但因為前述的 100 筆數據限制，導致在查詢時無法立即找到。

---

## 結論與建議

當前的核心問題是 Worker 的冷啟動邏輯。為了解決 `pixels` 數據丟失問題，需要對非阻塞快取機制進行調整。

<rule id="optimization-recommendation">

- **同步等待**：確保即使在冷啟動時也能夠同步等待或獲取到最新的配置。
- **預熱機制**：定期觸發 Worker 以保持其處於熱啟動狀態。
- **API 分頁**：針對 `godview_events` 的數據限制，需要進一步與相關團隊確認 API 的分頁參數。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-cf-worker-pixel-id-analysis.md`](godview-cf-worker-pixel-id-analysis.md) | 像素 ID 丟失深度分析 |
| [`godview-diagnosis.md`](godview-diagnosis.md) | 系統診斷報告 |
| [`godview-current-status.md`](godview-current-status.md) | 系統當前運行狀態 |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱 |
