---
title: "廣告素材總體分析與風險評估"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "針對「莊家剋星」、「獨角仙」和「爆分王」等博弈輔助產品的廣告素材進行深度分析，識別 Meta 平台投放的高風險元素並提供合規化建議。"
id: "20260328-known-risk-analysis"
type: analysis
tags: [ad-compliance, ad-creative, advertising, gambling, meta-ads]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---

> **TL;DR**: 本報告分析了「廣為人知」專案下多款產品（莊家剋星、獨角仙、爆分王）的素材風險。核心風險在於直接展示博弈介面與敏感字眼。報告提出「素材即定向」的應對策略，建議將素材包裝為「數據分析工具」或「遊戲攻略」，利用 7 大靜態素材框架（如「迷思 vs. 事實」）來降低封號率，並將敏感轉化路徑移至 LINE 機器人。

# 廣告素材總體分析與風險評估

## 1. 產品素材現狀分析 (Product Creative Analysis)

目前分析的素材主要來自「莊家剋星」、「獨角仙」和「爆分王」三個項目，均為產品介面的螢幕截圖或操作影片。

| 產品名稱 | 素材特徵 | 核心功能展示 |
| :--- | :--- | :--- |
| **莊家剋星** | AI 算牌系統介面 | 百家樂/龍虎鬥算牌、路單分析、投注建議。 |
| **獨角仙** | 預測程式後台截圖 | 老虎機爆分機率、遊戲即時數據、用戶獲利榜。 |
| **爆分王** | LINE 機器人對話流 | AI 選桌分析、本日好房推薦、遊戲攻略引導。 |

---

## 2. 核心風險因子識別 (Risk Identification)

<rule id="high-risk-elements">

### 2.1. 視覺元素風險
- **直接博弈畫面**：老虎機轉動、百家樂路單、戰神賽特等角色。
- **金錢誘惑**：大量現金、銀行轉帳截圖、保證獲利百分比。
- **品牌敏感度**：直接出現「博富」、「富遊」等已知博弈品牌標誌。

### 2.2. 文案關鍵字風險
- **高危詞彙**：賭博、博弈、贏錢、提現、儲值、賠率、穩賺、漏洞。
- **誘導性語言**：註冊送、開版送、翻身、致富、保證出金。

</rule>

---

## 3. 風險規避與優化策略 (Mitigation Strategy)

根據「素材即定向」的核心理論，素材內容應直接決定受眾品質，而非依賴系統標籤。

<step id="creative-repackaging">

### 3.1. 產品定位轉化
將博弈產品重新包裝為「數位娛樂輔助工具」或「大數據研究平台」。
- **莊家剋星** → 「機率統計分析助手」。
- **獨角仙** → 「電子遊戲數據監測系統」。
- **爆分王** → 「AI 遊戲攻略導航」。

</step>

<step id="static-framework-application">

### 3.2. 應用 7 大靜態素材框架
利用以下框架降低審核敏感度：
1.  **迷思 vs. 事實**：糾正玩家對老虎機機率的誤解，引入「數據分析」概念。
2.  **圖表比較**：展示「盲目投注」與「數據分析投注」的勝率曲線對比。
3.  **流程圖**：展示如何透過 3 步數據分析提升遊戲體驗，而非直接展示贏錢。

</step>

---

## 4. 結論與邊界 (Conclusion & Boundaries)

<boundaries id="compliance-boundary">

- **素材隔離**：廣告素材（Creative）僅負責吸引「對數據感興趣」的精準受眾，不提及任何博弈交易。
- **路徑隔離**：所有敏感的「開版」、「註冊」指令必須在 LINE 機器人環境下完成，嚴禁在 Meta 落地頁直接呈現。
- **動態監控**：利用 `known-competitor-line-monitor-spec.md` 定義的系統持續追蹤競品素材的封號週期，動態調整素材更新頻率。

</boundaries>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [known-fb-ad-material-strategy-analysis.md](known-fb-ad-material-strategy-analysis.md) | 2026 年素材策略研究報告 |
| [known-ad-strategy-status-analysis.md](known-ad-strategy-status-analysis.md) | 廣告策略現狀分析 |
| [known-explosion-king-ui-analysis.md](known-explosion-king-ui-analysis.md) | 爆分王產品介面分析 |
| [known-nemesis-analysis.md](known-nemesis-analysis.md) | 莊家剋星產品介面分析 |
