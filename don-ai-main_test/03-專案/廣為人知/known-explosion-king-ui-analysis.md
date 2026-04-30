---
title: "爆分王產品介面 (UI) 與交互邏輯分析"
category: "project"
priority: "medium"
applicable_tools: ["Figma", "LINE Flex Message Simulator"]
last_updated: "2026-03-28"
summary: "深度拆解「爆分王」LINE 機器人的介面設計、交互流程與用戶引導邏輯。"
id: "20260328-known-explosion-ui"
type: "analysis"
tags: [conversion, line, ui-ux]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告分析了「爆分王」如何利用 LINE Flex Message 打造流暢的產品體驗。核心亮點：**橫向滑動的遊戲卡片**與**模擬運算的進度條**。這些設計不僅提升了產品的專業感，還巧妙地利用了用戶的心理預期。報告建議在同類產品中採納其「簡單三步」的交互邏輯，以降低用戶的操作門檻。

# 爆分王產品介面 (UI) 與交互邏輯分析

## 1. 核心交互流程

「爆分王」的設計核心在於「極簡化」。

<step id="interaction-flow">
1.  **入口引導**：巨大的綠色「選桌分析」按鈕，明確告知用戶下一步操作。
2.  **遊戲選擇**：採用 Flex Message 的橫向滑動卡片，視覺豐富且操作直觀。
3.  **模擬運算**：在顯示結果前加入 3-5 秒的「偵測中」進度條，增加預測結果的可信度。
4.  **結果呈現**：醒目的紅色攻略卡片，直接給出具體參數（如：旋轉次數、建議倍率）。
</step>

---

## 2. UI 視覺特徵分析

<example id="visual-features">
| 元素 | 設計特徵 | 心理效應 |
| :--- | :--- | :--- |
| **配色方案** | 綠色（行動）、紅色（結果）、金色（財富）。 | 引導注意力，建立情緒連結。 |
| **卡片設計** | 高解析度遊戲原畫 + 圓角設計。 | 提升產品檔次，增加信任感。 |
| **動態反饋** | 點擊後的即時氣泡回覆。 | 確認操作有效，減少焦慮。 |
</example>

---

## 3. 交互設計的亮點與啟示

<rule id="ui-ux-rule">
- **利用原生組件**：完全基於 LINE 原生組件開發，無需跳轉外部瀏覽器，轉化路徑最短。
- **創造專業感**：透過「數據加載」動畫，將隨機結果包裝成「科學預測」。
- **強化行動呼籲**：在結果頁面底部直接加入「已中獎回報」按鈕，形成閉環互動。
</rule>

---

## 4. 結論

「爆分王」的 UI/UX 設計是博弈類 LINE 機器人的標竿。它成功地將複雜的後端邏輯轉化為簡單、直觀且具備心理暗示的交互流程。

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-explosion-king-video-analysis.md`](known-explosion-king-video-analysis.md) | 影片動態展示分析 |
| [`known-explosion-score-analysis.md`](known-explosion-score-analysis.md) | 靜態截圖細節分析 |
