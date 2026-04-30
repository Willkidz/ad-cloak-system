---
title: "Tag 配置狀態總表（lb→n23 合併後）"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-04-05"
summary: "整理 lb→n23 合併後的 Tag、LINE OA、LIFF 與相關配置檔案更新狀態。"
version: "v1.0"
id: "20260406-TAG-STATUS"
type: project-doc
tags: [cloak-admin, liff, line-config, tag-management]
status: active
created: "2026-04-06"
updated: "2026-04-06"
---
# Tag 配置狀態總表（lb→n23 合併後）

> 更新日期：2026-04-06

## 一、本次修改摘要

### 修改的檔案

| 檔案 | 修改內容 |
|:-----|:---------|
| `05-原始碼/上帝視角/line-redirect.js` | 刪除 lb，新增 n23 到 LINE_MAP、TAG_PREFIX_MAP、MASTER_PIXEL_MAP |
| `05-原始碼/斗篷管理後台/cloak-admin-api.js` | 同步 FALLBACK_TAG_PREFIX_MAP 和 FALLBACK_LINE_MAP（lb→n23） |
| `07-配置與環境/auth-info-config.md` | 更新 Pixel 表、LINE OA 表、LIFF 完整清單（lb→n23） |
| `03-專案/斗篷管理後台/liff-group-selection-spec.md` | 新增：前端 LIFF 分組選擇功能規格 |
| `03-專案/斗篷管理後台/tag-status-after-merge.md` | 新增：本文件 |

### lb → n23 合併詳情

| 項目 | 舊（lb） | 新（n23） |
|:-----|:---------|:----------|
| LINE OA | @bn58 | @604yogby |
| 名稱 | 莊家剋星-百家GPT | 莊家剋星-百家GPT（不變） |
| 分組 | AB | AB（不變） |
| LIFF ID | （無） | `2009664169-l7pOctNZ` |
| 負責人 | L | L（不變） |
| Destination | `Uf14f0347a9cc140e441ab83e22847efe` | `Uf14f0347a9cc140e441ab83e22847efe`（不變） |
| Pixel | `2030344604527767` | `2030344604527767`（不變） |

## 二、修改後完整狀態對照表（23 個有效 Tag）

| Tag | 分組 | LINE OA | 名稱 | LIFF ID | line_config | LINE_MAP | LIFF_MAP | PIXEL_MAP | 狀態 |
|:----|:---:|:--------|:------|:--------|:---:|:---:|:---:|:---:|:-----|
| bf | BF | @678eohsd | 博富 BOFU | `2009663969-IhPVLFKy` | ✅ | ✅ | ✅ | ✅ | 完整 |
| jb | AB | @448nzdkf | 莊家剋星-百家專家 | `2009664206-5BXVdqiL` | ✅ | ✅ | ✅ | ✅ | 完整 |
| cb | AB | @181pgtlc | 莊家剋星-百家殺手 | `2009664250-4BLc8ACL` | ✅ | ✅ | ✅ | ✅ | 完整 |
| mb | AB | @734xzzse | 莊家剋星-百家打莊姬 | `2009664180-r6eOVZ0D` | ✅ | ✅ | ✅ | ✅ | 完整 |
| n23 | AB | @604yogby | 莊家剋星-百家GPT | `2009664169-l7pOctNZ` | ❌ | ✅ | ✅ | ✅ | **缺 D1 line_config** |
| js | AS | @935bicyi | 爆分王-電子打法秘笈 | `2009664189-W61JHYEk` | ✅ | ✅ | ✅ | ✅ | 完整 |
| cs | AS | @999hqlmk | 爆分王-電子訊號程式 | `2009664226-30WBtSHr` | ✅ | ✅ | ✅ | ✅ | 完整 |
| ms | AS | @001qlmgf | 爆分王-電子打法訊號 | `2009664174-m2cwlShg` | ✅ | ✅ | ✅ | ✅ | 完整 |
| ls | AS | @849rldxt | 爆分王-24H訊號打法 | `2009664186-7yVDrKDn` | ✅ | ✅ | ✅ | ✅ | 完整 |
| jx | AX | @652ahjmy | 獨角仙AI算牌程式 | `2009664145-Bm1nTzuI` | ✅ | ✅ | ✅ | ✅ | 完整 |
| cx | AX | @697jsdma | 獨角仙AI算牌系統 | `2009664141-OyQVNAp8` | ✅ | ✅ | ✅ | ✅ | 完整 |
| mx | AX | @525euwsy | 獨角仙AI預測系統 | `2009664163-FloR5xP4` | ✅ | ✅ | ✅ | ✅ | 完整 |
| lx | AX | @128hxyvp | 獨角仙AI預測程式 | `2009664152-SUm42s6z` | ✅ | ✅ | ✅ | ✅ | 完整 |
| jd | BF | @520ufhmw | 兩斤炭吉 | `2009664200-1T7vs2Kg` | ✅ | ✅ | ✅ | ✅ | 完整 |
| n14 | N14 | @416nbqjl | 洪金豹 | `2009664103-Rot7yQE1` | ✅ | ✅ | ✅ | ✅ | 完整 |
| n15 | N15 | @745jaffa | 開版歪歪熊 | `2009664113-eUkzVtfO` | ✅ | ✅ | ✅ | ❌ | 缺 ad_config |
| n16 | N16 | @751tggmd | 晴兒 | `2009664113-eUkzVtfO` | ✅ | ✅ | ✅ | ❌ | 缺 ad_config |
| n17 | N17 | @106tndmh | 郝士多 | `2009664115-5jvKickJ` | ✅ | ✅ | ✅ | ❌ | 缺 ad_config |
| n18 | N18 | @013rgbjl | 電子蕭甘丹 | `2009664124-VJz09CpT` | ✅ | ✅ | ✅ | ✅ | 完整 |
| n19 | N19 | @536uhfpf | 開版歪熊 | `2009664132-5wcSZilB` | ✅ | ✅ | ✅ | ❌ | 缺 ad_config |
| n20 | N20 | @348ikfwm | 蘇主金 | `2009664135-dXsbiajG` | ✅ | ✅ | ✅ | ✅ | 完整 |
| n21 | N21 | @075cocov | 武狀元 | `2009129136-BEXGdu4X` | ✅ | ✅ | ✅ | ❌ | 缺 ad_config |
| n22 | N22 | @659jgxlp | 阿奇說球 | `2009664170-HW4ExLY7` | ✅ | ✅ | ✅ | ✅ | 完整 |

### 已刪除的 Tag

| Tag | 原 LINE OA | 原因 |
|:----|:-----------|:-----|
| lb | @bn58 | 已合併至 n23/@604yogby |

## 三、待用戶補充的項目

### 優先級 1：影響功能運作

| 項目 | Tag | 缺失內容 | 需要的操作 |
|:-----|:----|:---------|:-----------|
| n23 的 D1 line_config | n23 | D1 資料庫中沒有 n23 的記錄 | 需執行 SQL：`INSERT INTO line_config (tag, line, name, who, msg, destination) VALUES ('n23', '@604yogby', '莊家剋星-百家GPT', 'L', '我要領取程式', 'Uf14f0347a9cc140e441ab83e22847efe')` |
| lb 的 D1 line_config | lb | D1 資料庫中仍有 lb 的舊記錄 | 需執行 SQL：`DELETE FROM line_config WHERE tag = 'lb'` |

### 優先級 2：缺少像素配置

| Tag | 名稱 | 缺失內容 | 影響 |
|:----|:------|:---------|:-----|
| n15 | 開版歪歪熊 | ad_config（Facebook Pixel） | 無法追蹤廣告轉換 |
| n16 | 晴兒 | ad_config（Facebook Pixel） | 無法追蹤廣告轉換 |
| n17 | 郝士多 | ad_config（Facebook Pixel） | 無法追蹤廣告轉換 |
| n19 | 開版歪熊 | ad_config（Facebook Pixel） | 無法追蹤廣告轉換 |
| n21 | 武狀元 | ad_config（Facebook Pixel） | 無法追蹤廣告轉換 |

> 需用戶提供這 5 個 TAG 的 Facebook Pixel ID，才能補齊 ad_config 和 MASTER_PIXEL_MAP。

### 優先級 3：完全缺失

| Tag | 缺失內容 | 備註 |
|:----|:---------|:-----|
| sz | LINE OA、LIFF ID、line_config、LIFF_MAP | 目前只有 ad_config（Pixel）和 LINE_MAP 中的跳轉設定。需用戶提供完整的 LINE OA 資訊和 LIFF App 資訊。 |

## 四、部署注意事項

本次修改僅更新了 Git 倉庫中的源碼檔案。要讓修改生效，還需要：

1. **line-redirect Worker**：需重新部署到 Cloudflare Workers（使用修改後的 `line-redirect.js`）
2. **cloak-admin-api Worker**：需重新部署到 Cloudflare Workers（使用修改後的 `cloak-admin-api.js`）
3. **D1 資料庫**：需手動執行上述 SQL 語句（INSERT n23、DELETE lb）
4. **前端**：LIFF 分組選擇功能需在 cloak-admin 前端倉庫中實作（參見 `liff-group-selection-spec.md`）
