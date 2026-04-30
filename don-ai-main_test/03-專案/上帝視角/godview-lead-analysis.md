---
title: "D1 Clicks 與 BC 像素 Lead 追蹤對比分析"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "D1 點擊記錄（128次）與 BC 像素 Lead 事件（226次）的差異分析：BC Lead 為 D1 Clicks 的 1.77 倍，AX 產品在 D1 中完全無記錄卻有 17 個 Lead，可能原因為舊版 Worker 數據或歸因邏輯差異。"
id: "20260328-godview-lead-analysis"
type: "analysis"
tags: [attribution, cloudflare-d1, godview, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: D1 數據庫記錄了 128 次點擊，但 BC 像素追蹤到 226 個 Lead 事件（1.77 倍差距）。按產品分：AS 46→93（2x）、BF 30→50（1.7x）、AB 24→36（1.5x）、N20 28→30（接近）、**AX 0→17（D1 完全無記錄）**。差異可能源於：舊版 Worker 仍在運行但未寫入 D1、用戶透過直接訪問/書籤等非追蹤路徑觸發 Lead、D1 點擊歸因邏輯與 BC 像素觸發條件不一致。AX 的追蹤遺漏是最嚴重的問題，需立即排查其事件追蹤代碼。

# D1 Clicks 與 BC 像素 Lead 追蹤對比分析

---

## 數據對比

下表比較了不同產品在 D1 數據庫中記錄的點擊數與通過 BC 像素追蹤到的 Lead 事件數量。

| 產品 | D1 Clicks 總數 | BC Lead 數量 | 差異分析 |
| :--- | :--- | :--- | :--- |
| AS (js+cs+ms+ls) | 46 | 93 | BC Lead 數量約為 D1 Clicks 的 2 倍 |
| BF (bf) | 30 | 50 | BC Lead 數量約為 D1 Clicks 的 1.7 倍 |
| AB (jb+cb+mb+lb) | 24 | 36 | BC Lead 數量約為 D1 Clicks 的 1.5 倍 |
| N20 | 28 | 30 | 數量接近 |
| AX | 0 | 17 | D1 中完全沒有點擊記錄 |
| **總計** | **128** | **226** | **BC Lead 總數約為 D1 Clicks 的 1.77 倍** |

---

## 關鍵發現與分析

<step id="1">

**數據差異**：D1 數據庫總共只記錄了 128 次點擊，但 BC 追蹤到的 Lead 事件總數為 226 次，兩者相差 98 次。這表明有大量的 Lead 事件並非由當前版本的 Worker 點擊觸發。

</step>

<step id="2">

**追蹤遺漏**：最顯著的差異來自 **AX** 產品，它在 D1 中完全沒有點擊記錄，卻產生了 17 個 Lead 事件。這是一個嚴重的追蹤遺漏問題。

</step>

<step id="3">

**潛在原因**：

<rule id="potential-causes">

數據差異可能源於以下幾種情況：
- **舊版 Worker 數據**：部分 Lead 可能由仍在運行的舊版 Worker 或其他後端服務觸發，這些點擊並未記錄在 D1 中。 [待確認]
- **其他用戶行為**：用戶可能通過其他入口（例如，直接訪問、書籤）觸發了 Lead 事件，而這些路徑沒有經過 D1 點擊追蹤。
- **歸因邏輯差異**：D1 的點擊歸因邏輯可能與 BC 像素的觸發條件不完全一致。

</rule>

</step>

---

## 結論與建議

數據顯示，當前基於 D1 Clicks 的歸因分析存在明顯的數據缺口，無法完全解釋所有 Lead 的來源。特別是 AX 產品的追蹤遺漏問題需要立即處理。

建議後續進行以下排查：
1.  檢查 AX 產品的事件追蹤代碼，確保所有相關點擊都被正確記錄到 D1。
2.  全面審計所有可能觸發 Lead 事件的用戶路徑和後端服務，找出未被 D1 追蹤到的來源。
3.  考慮引入更全面的歸因模型，以整合來自不同來源的數據，構建更完整的用戶行為視圖。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-ad-tracking-sys-spec.md](godview-ad-tracking-sys-spec.md) | 系統總綱 |
| [godview-bc-pixel-chain-js-analysis.md](godview-bc-pixel-chain-js-analysis.md) | BC 像素鏈 JS 分析 |
