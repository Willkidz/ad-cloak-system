---
title: "Meta 廣告版位最佳素材尺寸對應表 (2026 版)"
category: "project"
priority: "medium"
applicable_tools: ["Photoshop", "Canva", "Meta Ads Manager"]
last_updated: "2026-03-28"
summary: "整理 2026 年 Meta 廣告各主要版位的最佳圖片與影片尺寸要求，確保素材在不同裝置上完美呈現。"
id: "20260328-known-placement-sizes"
type: "spec"
tags: [ad-creative, meta-ads]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本規範定義了 Meta 廣告素材的標準尺寸體系。核心要求：**1:1 (1080x1080)** 用於 Feed 版位，**9:16 (1080x1920)** 用於 Reels 與 Stories。規範強調了「安全區域」的概念，避免關鍵資訊被介面元素遮擋。對於影片素材，建議長度控制在 15-30 秒內，並確保檔案大小不超過 4GB。

# Meta 廣告版位最佳素材尺寸對應表 (2026 版)

## 1. 核心尺寸規範

為確保廣告在所有版位都能獲得最佳曝光，必須準備以下兩種核心比例的素材：

<example id="core-sizes">
| 比例 | 建議解析度 | 適用版位 | 備註 |
| :--- | :--- | :--- | :--- |
| **1:1 (正方形)** | 1080 x 1080 px | FB/IG Feed, 右欄, 搜尋結果 | **最通用**，必須準備。 |
| **9:16 (全螢幕直式)** | 1080 x 1920 px | Reels, Stories, 插播影片 | **流量紅利區**，轉化效果佳。 |
| **1.91:1 (橫式)** | 1200 x 628 px | 部分 Audience Network | 非必要，演算法可由 1:1 自動裁切。 |
</example>

---

## 2. 影片素材技術要求

<rule id="video-spec-rule">
- **格式**：建議使用 MP4 或 MOV。
- **編碼**：H.264。
- **音訊**：AAC 128kbps+。
- **長度**：
    - **Reels/Stories**：建議 15-30 秒（上限 60 秒）。
    - **Feed**：建議 30-60 秒。
- **檔案大小**：上限 4GB。
</rule>

---

## 3. 視覺安全區域 (Safe Zones)

在設計 9:16 素材時，必須避開頂部與底部的介面遮擋區。

<boundaries id="safe-zone-spec">
- **頂部安全區**：保留上方 **14% (約 250px)**，避免被粉專頭像與資訊遮擋。
- **底部安全區**：保留下方 **20% (約 380px)**，避免被行動呼籲 (CTA) 按鈕與文字遮擋。
- **核心內容**：所有關鍵文案與視覺焦點應集中在中間 **66%** 的區域內。
</boundaries>

---

## 4. 結論與設計建議

<step id="design-action-steps">
1.  **優先製作 1:1 與 9:16**：這兩個尺寸可覆蓋 95% 以上的高價值流量。
2.  **文字佔比檢查**：雖然 Meta 已取消 20% 文字限制，但過多文字仍會降低曝光權重，建議保持簡潔。
3.  **高對比度設計**：在手機小螢幕上，高對比度的配色（如黑底金字）更容易抓住用戶注意力。
</step>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-meta-placement-strategy-analysis.md`](known-meta-placement-strategy-analysis.md) | 版位優化策略分析 |
| [`known-fb-ad-material-strategy-analysis.md`](known-fb-ad-material-strategy-analysis.md) | 素材策略分析 |
