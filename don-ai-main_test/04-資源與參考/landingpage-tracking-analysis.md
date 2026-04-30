---
title: "落地頁追蹤與 AI 生成技術整合指南"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "整合落地頁 JavaScript 追蹤技術實施細節、ad_code 規範及 AI 自動生成推廣頁工具方案。"
id: "20260328-lp-tracking-ai"
type: analysis
tags: [advertising, ai-agent, automation, javascript, landing-page, pixel]
status: active
created: 2026-03-28
updated: 2026-03-28
merged_from:
  - "落地頁JS修改操作指南.md"
  - "落地頁JavaScript邏輯分析報告.md"
  - "ad_code格式規範.md"
  - "AI全自動生成推廣頁工具報告.md"
---

> **TL;DR**: 本指南提供落地頁管理的全方位策略。核心包含：1. **JS 追蹤部署**：針對不同產品線（S/B/X/BF 系列）提供統一的 BC 像素與 fbclid 傳遞腳本；2. **邏輯修復**：診斷並解決 Meta Pixel 缺失、gotolink 定義不全等一級問題；3. **ad_code 規範**：定義標準化廣告代碼格式以實現精準歸因；4. **AI 自動化**：介紹利用 AI 工具快速生成高轉化率推廣頁的流程。

# 落地頁追蹤與 AI 生成技術整合指南

本文件旨在確保廣告追蹤的準確性、提升落地頁轉換效率，並透過 AI 技術加速內容生產。

---

## 一、落地頁 JavaScript 追蹤部署

正確部署追蹤腳本是廣告歸因的基石。每個產品線共用一個主題，僅需修改一次即可生效。

### 1.1 BC 像素與 fbclid 傳遞規範

<rule id="lp-js-deployment">

- **核心目標**：確保 `PageView` 與 `Contact` 事件正確發送，並攜帶 `fbclid` 參數。
- **部署位置**：腳本應插入在 `</body>` 標籤前。
- **分流邏輯**：目前 `tag` 暫用產品線代表值（如 cs/cb/cx/bf），斗篷系統上線後需改為動態判斷。

</rule>

<example title="爆分王 (S 系列) 追蹤腳本範例">

```javascript
(function(){
  var fc=new URLSearchParams(location.search).get('fbclid');
  // 發送 PageView 事件
  new Image().src='https://cs.freshpathlab.com/bc-event?e=PageView&t=cs&fbclid='+(fc||'')+'&_='+Date.now();
  // 監聽點擊事件發送 Contact
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if((el.getAttribute('href')||'').indexOf('gotolink')!==-1){
        new Image().src='https://cs.freshpathlab.com/bc-event?e=Contact&t=cs&fbclid='+(fc||'')+'&_='+Date.now();
        break;
      }
      el=el.parentElement;
    }
  },true);
})();
```

</example>

---

## 二、核心問題診斷與修復

### 2.1 Meta Pixel 缺失 (一級問題)

<rule id="missing-meta-pixel">

所有產品線均存在 HTML 中 Meta Pixel 代碼為空的問題。這導致無法進行轉換追蹤與優化。必須補齊標準初始化腳本。

</rule>

### 2.2 gotolink 函數定義不全

<rule id="gotolink-fix">

部分頁面缺少 `gotolink` 函數，導致用戶點擊按鈕無反應。應確保該函數能正確處理跳轉並保留 URL 參數。

</rule>

---

## 三、ad_code 廣告代碼規範

<boundaries id="ad-code-spec">

標準格式：`{Channel}_{Product}_{Campaign}_{AdSet}_{Ad}_{Date}`
- **Channel**：fb (Facebook), tt (TikTok), gg (Google)。
- **Product**：cs (爆分王), cb (剋星), cx (獨角仙)。
- **範例**：`fb_cs_spring_sale_01_20260328`

</boundaries>

---

## 四、AI 自動生成推廣頁方案

利用 AI 工具（如 GPT-4o-mini 結合網頁模板）實現全自動化內容生產。

<step id="ai-lp-generation">

1. **需求分析**：AI 提取產品賣點與受眾痛點。
2. **文案生成**：AI 產出符合 AIDA 模型（注意、興趣、慾望、行動）的文案。
3. **結構填充**：將文案自動填充至預設的 HTML/Tailwind 模板。
4. **自動部署**：透過 API 將生成的頁面部署至 Cloudflare Pages。

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`fb-meta-ad-integration-analysis.md`](./fb-meta-ad-integration-analysis.md) | Meta 廣告投放與數據追蹤策略 |
| [`ai-agent-dev-practices.md`](./ai-agent-dev-practices.md) | AI Agent 開發最佳實踐 |
| [`06-SOP流程/deploy-sop.md`](../06-SOP流程/deploy-sop.md) | 落地頁檢查與發布標準流程 |
