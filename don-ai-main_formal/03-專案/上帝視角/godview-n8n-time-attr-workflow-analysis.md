---
title: "N8N Time Attribution Workflow 分析報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 Time Attribution workflow 的 10 節點流程（LINE Webhook → D1 45 秒窗口查詢 → 指紋匹配 → CAPI 發送），定位 is_bc 判斷導致 BC 像素不發送標準 CompleteRegistration 事件的問題。"
id: "20260325-time-attr-analysis"
type: "analysis"
tags: [attribution, capi, cloudflare-d1, conversion, godview, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 「上帝視角_Time Attribution」workflow 由 10 個節點組成，核心流程為：LINE Follow Webhook 接收 → Extract Follow Data 提取 user ID/IP/UA → Is Follow Event 判斷 → Query Recent Clicks 從 D1 查詢 `destination` 匹配且 `matched = 0` 的 45 秒內點擊（LIMIT 10）→ Fingerprint Match 時間+指紋比對（回傳 `time_unique` 或 `time_nearest`）→ Mark Click Matched 標記 → Prepare CAPI Events 構造事件 → Send CAPI 發送至 Graph API v25.0。問題根源：Prepare CAPI Events 節點中，`is_bc === true` 的像素只發送 `{prefix}_CompleteRegistration` 和 `ALL_CompleteRegistration`，**不發送**標準 `CompleteRegistration`，導致 Facebook 後台該事件為 0。修復建議：在 BC 像素的 `eventNames` 陣列中加入 `'CompleteRegistration'`。

# N8N Time Attribution Workflow 分析報告

## 背景與問題

根據使用者回報，Facebook Pixel 儀表板顯示 `CompleteRegistration` 事件的接收數量為 0，然而其他相關事件如 `Purchase`、`Contact` 與 `PageView` 均有正常數據。此現象表明 Facebook Conversions API (CAPI) 的基本連線與授權是正常的，問題極可能源於 N8N 的「上帝視角_Time Attribution」Workflow 在特定條件下，未發送標準的 `CompleteRegistration` 事件名稱。

本報告旨在深度分析此 Workflow 的內部邏輯，以精準定位問題根源，並提出具體的程式碼修改建議。

---

## Workflow 流程分析

此 Workflow 全名為「上帝視角_Time Attribution」，由 10 個節點組成，其核心任務是將 LINE 的 `follow` 事件歸因到特定的廣告點擊，並將轉換事件發送至 Facebook CAPI。

<step id="workflow-summary">
以下是其主要處理流程的摘要：

| 步驟 | 節點名稱 | 節點類型 | 說明 |
| :--- | :--- | :--- | :--- |
| 1 | LINE Follow Webhook | `n8n-nodes-base.webhook` | 接收 LINE 的 webhook 事件（`POST /webhook/line-follow`） |
| 2 | Extract Follow Data | `n8n-nodes-base.set` | 提取 `line_user_id`、`line_id`、事件類型、時間戳記、IP、User-Agent |
| 3 | Is Follow Event? | `n8n-nodes-base.if` | 判斷是否為 `follow` 事件 |
| 4 | Query Recent Clicks | `n8n-nodes-base.httpRequest` | 從 Cloudflare D1 查詢 `clicks` 表，條件：`destination` 匹配、`matched = 0`、45 秒時間窗口內、LIMIT 10 |
| 5 | Fingerprint Match | `n8n-nodes-base.code` | 進行時間與指紋比對，回傳 `match_level: 'time_unique'` 或 `'time_nearest'`，並解析 `pixels` 陣列 |
| 6 | Matched? | `n8n-nodes-base.if` | 判斷是否成功匹配 |
| 7 | Mark Click Matched | `n8n-nodes-base.httpRequest` | 更新 D1，將該點擊的 `matched` 欄位設為 `1` |
| 8 | **Prepare CAPI Events** | `n8n-nodes-base.code` | **準備發送給 Facebook CAPI 的事件資料（關鍵節點）** |
| 9 | Has Pixel? | `n8n-nodes-base.if` | 判斷是否有有效的 Pixel ID |
| 10 | Send CAPI | `n8n-nodes-base.httpRequest` | 實際發送 HTTP POST 請求至 Facebook Graph API v25.0 |

</step>

---

## CAPI 事件名稱分析

問題的核心在於第 8 個節點 **Prepare CAPI Events**。深入分析其 JavaScript 程式碼後，發現事件名稱的生成邏輯是問題的關鍵。

### 問題根源

<rule id="event-name-logic">
節點中的程式碼會根據一個名為 `is_bc` 的布林值來決定發送的事件名稱。如果 `is_bc` 為 `true`，系統將發送帶有特殊前綴的事件（如 `AS_CompleteRegistration`）或 `ALL_CompleteRegistration`，而**不會**發送 Facebook 所期望的標準 `CompleteRegistration` 事件。追查發現，`is_bc` 的值來自於資料庫中儲存的像素設定，這意味著只要像素被標記為 BC 像素，標準事件就會被遺漏。

<example>
以下是導致此行為的程式碼片段：

```javascript
// 判斷是否為 BC 像素
const isBcPixel = px.is_bc === true;

// 根據是否為 BC 像素決定事件名稱
let eventNames = [];
if (isBcPixel && productPrefix) {
  // BC 像素：發送帶產品前綴的事件 + ALL_CompleteRegistration
  eventNames = [
    `${productPrefix}_CompleteRegistration`,
    'ALL_CompleteRegistration'
  ];
} else if (isBcPixel) {
  // BC 像素但沒有產品前綴：只發送 ALL_CompleteRegistration
  eventNames = ['ALL_CompleteRegistration'];
} else {
  // 一般像素：發送標準 CompleteRegistration 事件
  eventNames = ['CompleteRegistration'];
}
```
</example>
</rule>

由於使用者的像素很可能都被設定為 BC 像素，這便解釋了為何 Facebook 後台無法接收到任何 `CompleteRegistration` 事件。

<boundaries id="is-bc-impact">
**影響範圍**：所有被標記為 `is_bc = true` 的像素（即 BC 像素）都不會發送標準 `CompleteRegistration` 事件。一般像素（`is_bc = false`）不受影響。

**前綴映射規則**（`TAG_PREFIX_MAP`）：`js/cs/ms/ls` → `AS`、`jb/cb/mb/lb` → `AB`、`jx/cx/mx/lx` → `AX`、`bf` → `BF`、`jd` → `JD`、`n20-n30` → `N20-N30`。
</boundaries>

---

## 結論與修改建議

為了解決此問題，我們必須修改 **Prepare CAPI Events** 節點的程式碼，確保無論像素類型為何，標準的 `CompleteRegistration` 事件都會被發送。

<step id="fix-procedure">
**修改步驟：**

1.  在 N8N Editor 中，找到名為「上帝視角_Time Attribution」的 Workflow（ID: `dqbdnCN3xdJAahYQ`）。
2.  定位到 **Prepare CAPI Events** 節點（節點 ID: `5b745428-c1a5-4cb3-8cc5-555db86092bd`）。
3.  將其內部的 JavaScript 程式碼修改如下，在 `isBcPixel` 為 `true` 的兩種情況下，都額外加入 `'CompleteRegistration'`。

<example>
**建議修改後的程式碼：**

```javascript
  // 根據是否為 BC 像素決定事件名稱
  let eventNames = [];
  if (isBcPixel && productPrefix) {
    // BC 像素：發送帶產品前綴的事件 + ALL_CompleteRegistration + 標準事件
    eventNames = [
      `${productPrefix}_CompleteRegistration`,
      'ALL_CompleteRegistration',
      'CompleteRegistration' // 新增此行
    ];
  } else if (isBcPixel) {
    // BC 像素但沒有產品前綴：發送 ALL_CompleteRegistration + 標準事件
    eventNames = [
      'ALL_CompleteRegistration',
      'CompleteRegistration' // 新增此行
    ];
  } else {
    // 一般像素：發送標準 CompleteRegistration 事件
    eventNames = ['CompleteRegistration'];
  }
```
</example>
</step>

此修改可確保 `CompleteRegistration` 事件在所有情況下都會發送，從而解決 Facebook Pixel 儀表板的數據遺失問題。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [Time Attribution Bug 修復指令](godview-n8n-time-attr-fix-cmd.md) | 包含完整修復程式碼（含 sha256hex 純 JS 實現） |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [D1 pixels 欄位分析](godview-pixels-analysis.md) | pixels 欄位組成與 is_bc 標記的來源 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與已知問題 |
| [Workflow JSON 原始檔](../../07-配置與環境/time_attribution_modified.json) | Time Attribution workflow 的完整 JSON 匯出 |
