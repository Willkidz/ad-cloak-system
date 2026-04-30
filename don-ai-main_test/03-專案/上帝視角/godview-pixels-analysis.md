---
title: "D1 pixels 欄位分析"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析 D1 clicks 表中 pixels JSON 欄位的組成邏輯：Worker 自動合併廣告像素（如 BF01 的 1425742365409547）與主資料庫像素（943527751701905），Prepare CAPI Events 遍歷全部像素發送事件。BF03-BF05 已補上廣告像素 1259161412843235。"
id: "20260325-pixels-analysis"
type: "analysis"
tags: [advertising, capi, cloudflare-d1, cloudflare-workers, godview, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: D1 `clicks` 表的 `pixels` 欄位是一個 JSON 陣列，由 Worker 在寫入時自動合併兩類像素：(1) 廣告像素（來自 `ad_config` 表，每個 tag 專屬，如 BF01 的 `1425742365409547`）；(2) 主資料庫像素（共用，ID `943527751701905`）。如果 tag 不在 `ad_config` 中（如之前的 BF03），則只有主資料庫像素。「Prepare CAPI Events」節點會遍歷 `pixels` 陣列，對每個像素都發送 CAPI 事件，因此 CAPI 回傳邏輯無需修改。已為 BF03-BF05 新增廣告像素 `1259161412843235`，未來新點擊將自動包含兩組像素。

# D1 pixels 欄位分析

本文件分析 Cloudflare D1 資料庫中 `clicks` 表的 `pixels` JSON 欄位的組成邏輯，以及 Cloudflare Worker 如何處理不同專案的廣告像素和主資料庫像素。

---

## 各專案 pixels 欄位組成

<example>
**BF01 的 pixels 欄位（已包含兩組）**
1.  廣告像素: `1425742365409547` + BF01 專屬 token
2.  主資料庫像素: `943527751701905` + 共用 token
</example>

<example>
**BF03 的 pixels 欄位（原先只有一組）**
1.  主資料庫像素: `943527751701905`（因為 BF03 之前不在 `ad` 資料表中，故無廣告像素）
</example>

---

## 處理邏輯

<rule id="pixel-writing">
Worker 在寫入 D1 時，會自動將廣告像素和主資料庫像素合併寫入 `pixels` JSON 欄位。具體來說，Worker 會從 Config API 取得該 tag 的 `adPixels`（來自 `AD_MAP`）和 `MASTER_PIXEL_MAP[tag]`，然後合併為一個陣列寫入。
</rule>

<rule id="capi-event-sending">
「Prepare CAPI Events」節點會遍歷 `pixels` 陣列，對每個像素都發送 CAPI 事件，因此 CAPI 的回傳邏輯不需修改。每個像素物件包含 `pixel`（像素 ID）、`token`（CAPI Token）和 `is_bc`（是否為 BC 像素）三個欄位。
</rule>

<boundaries id="pixel-missing-scenario">
如果某個 tag 在 `ad_config` 表中沒有對應的廣告像素記錄（即 `type=master` 但無 `type=ad`），則 Worker 只會寫入主資料庫像素。此外，Worker 冷啟動時若 `cachedConfig` 為 null，`FALLBACK_CONFIG.MASTER_PIXEL_MAP` 預設為空物件 `{}`，可能導致首次請求寫入空的 `pixel_id`。
</boundaries>

---

## 結論與後續

核心邏輯在於，只要 `ad_config` 資料表中有正確的廣告像素，Worker 就會自動將其與主資料庫像素一起寫入 D1。

針對 BF03 至 BF05，已新增廣告像素 `1259161412843235`。未來新的點擊事件將會自動包含兩組像素，無需額外調整。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [Time Attribution Workflow 分析](godview-n8n-time-attr-workflow-analysis.md) | Prepare CAPI Events 節點如何遍歷 pixels 陣列 |
| [Worker Pixel ID 分析](godview-cf-worker-pixel-id-analysis.md) | Worker 冷啟動導致 pixel_id 遺失的問題分析 |
| [Worker Pixel 邏輯分析](godview-cf-worker-pixel-logic-analysis.md) | Worker 中 pixels 合併邏輯的完整分析 |
| [BC Pixel 事件分析](godview-bc-pixel-events.md) | BC 像素的事件名稱與發送邏輯 |
