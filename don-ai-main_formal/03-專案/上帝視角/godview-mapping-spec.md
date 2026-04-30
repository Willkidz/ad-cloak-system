---
title: "上帝視角產品標籤與 LINE ID 映射規範"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "定義上帝視角系統中產品標籤 (Tag)、產品名稱與 LINE 官方帳號 ID 的映射關係。此映射表為 Worker 跳轉邏輯與 n8n 歸因流程的核心依據。"
id: "20260328-godview-mapping-spec"
type: "spec"
tags: [attribution, godview, line, reference]
status: "active"
created: "2026-03-20"
updated: "2026-03-29"
---

> **TL;DR**: 本文件定義了系統核心的映射關係表。**嚴禁隨意修改**，因為任何變動都會直接影響 `line-redirect` Worker 的跳轉目標以及 `Time Attribution` 工作流的歸因準確性。目前涵蓋 AS、AB、AX、BF、N 五大產品線，共 24 個標籤。新增產品時必須同步更新 Cloudflare DNS 與 D1 `line_config` 表。

# 產品標籤與 LINE ID 映射規範

## 核心映射表

<rule id="mapping-consistency">
所有系統組件（Worker, n8n, D1）必須以此表為唯一真理來源 (Single Source of Truth)。
</rule>

| 產品線 | 標籤 (Tag) | 產品名稱 | LINE 官方帳號 ID |
| :--- | :--- | :--- | :--- |
| **AS (爆分王)** | `js` | 爆分王-金 | `@935bicyi` |
| | `cs` | 爆分王-木 | `@999hqlmk` |
| | `ms` | 爆分王-水 | `@001qlmgf` |
| | `ls` | 爆分王-火 | `@849rldxt` |
| **AB (莊家剋星)** | `jb` | 莊家剋星-金 | `@448nzdkf` |
| | `cb` | 莊家剋星-木 | `@bn56` |
| | `mb` | 莊家剋星-水 | `@734xzzse` |
| | `lb` | 莊家剋星-火 | `@bn58` |
| **AX (獨角仙)** | `jx` | 獨角仙-金 | `@652ahjmy` |
| | `cx` | 獨角仙-木 | `@697jsdma` |
| | `mx` | 獨角仙-水 | `@525euwsy` |
| | `lx` | 獨角仙-火 | `@128hxyvp` |
| **BF (博富)** | `bf` | 博富 BOFU | `@678eohsd` |
| | `jd` | 博富-金 | `@520ufhmw` |
| **N (系列)** | `n14` | N14 | `@416nbqjl` |
| | `n18` | N18 | `@013rgbjl` |
| | `n20` | N20 | `@348ikfwm` |
| | `n21` | N21 | `LIFF_ID_PLACEHOLDER` |
| | `n22` | N22 | `@659jgxlp` |

---

## 維護流程

<step id="add-new-product">
1. **更新映射表**：在此文件中新增產品標籤與 LINE ID。
</step>

<step id="update-d1-config">
2. **同步 D1 資料庫**：在 `line_config` 表中插入對應記錄。
   ```sql
   INSERT INTO line_config (tag, line_id, product_name) VALUES ('new_tag', '@new_id', 'New Product');
   ```
</step>

<step id="dns-setup">
3. **DNS 設定**：在 Cloudflare 為新標籤建立 CNAME 指向 Worker 域名。
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-config-spec.md](godview-line-config-spec.md) | D1 表結構與維護規範 |
| [godview-link-format.md](godview-link-format.md) | 廣告鏈結產生格式 |
| [godview-line-redirect-worker-verify.md](godview-line-redirect-worker-verify.md) | 映射跳轉自動化測試報告 |
