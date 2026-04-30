---
title: "系統硬事實對照表"
tags: [system-index, truth-table]
version: "v1.9"
last_verified: "2026-03-31"
status: active
---

> **⚠️ 最高優先級事實來源 — 修改前必讀**
> 
> 此表為系統最高優先級的單一事實來源（Single Source of Truth）。
> 
> **修改規則：**
> 1. 修改前**必須**執行全局 `grep` 評估影響範圍，確認所有引用此事實的文件都能同步更新
> 2. 表格中的 Key（第一欄）**必須唯一**，嚴禁重複定義
> 3. 修改後**必須**遞增 version 欄位
> 4. 如有矛盾，以此表為最終裁定依據（優先級：truth-table.md > common-cmd.md > 其他文件）

# 系統硬事實對照表

本文件記錄不可爭議的系統硬事實。當任何文件之間存在矛盾時，**無條件以本表為準**。

---

| 項目 | 真實值 | 驗證來源 |
| :--- | :--- | :--- |
| shadow-cloak 版本號 | 源碼中無定義（歷史註解 v5.1/v5.2） | shadow-cloak.js 源碼 |
| cloak-admin 版本號 | 1.0.0（package.json）/ 口頭 v1.10.9 | package.json |
| verdict 合法值 | blocked / allowed | shadow-cloak 源碼 |
| AS 產品線 | 爆分王 | D1 line_config |
| AX 產品線 | 獨角仙 | D1 line_config |
| AB 產品線 | 莊家剋星 | D1 line_config |
| BF 產品線 | 博富 | D1 line_config |
| Worker 總數 | 7 個 | Cloudflare Dashboard |
| Worker 列表 | shadow-cloak, cloak-admin-api, safe-page, line-redirect, line-redirect-staging, money-page, preview-page | wrangler.toml |
| D1 資料庫（godview-clicks） | 斗篷系統與上帝視角 Worker 共用（ID: 3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c） | wrangler.toml |
| D1 資料庫（douyin-knowledge） | 抖影知識系統（ID: 26616dfa-cd47-421f-baee-7212625a1d25），含 4 張表 | Cloudflare Dashboard |
| D1 資料庫（manus-memory） | — 已廢棄（ADR-003, 2026-03-30），原 ID: 915bd7ab-34a1-415b-b716-16995bccb978 | 歷史記錄 |
| 歸因匹配邏輯 | 純時間 + destination（45秒窗口） | time_attribution_modified.json |
| 分組數量 | 13 個分組（AS/AB/AX/BF/JD/SZ + N 系列），實際包含 23–24 個独立標籤（tag） | D1 line_config / service-list-config.md |
| N8N 帳號 | admin@bexnua.store | N8N 設定 |
| N8N 網址 | https://n8n.bexnua.store/ | 線上驗證 |
| API Base URL | admin-api.bexnua.store 和 cloak-admin-api.laoqin1689.workers.dev 皆可用 | curl 驗證 |
| CAPI API 版本 | v25.0 | line-redirect 源碼 |
| sync-check 頻率 | 每日 UTC 00:00（台灣 08:00）+ 支援手動觸發 | .github/workflows/sync-check.yml |
| sync-check 比對策略 | 源碼 diff 比對（從 Cloudflare API 下載源碼，與 Git repo 比對，非時間戳） | .github/workflows/sync-check.yml L88-131 |
| sync-check 檢查範圍 | 6 個 production Worker（不含 line-redirect-staging 和已廢棄的 manus-memory-api） | .github/workflows/sync-check.yml L40 |
| campaigns 表資料筆數 | 0 筆（隱者系統尚未建立任何廣告活動） | D1 SELECT COUNT(*) 驗證 (2026-03-31) |
| clicks 表資料筆數 | 2,043 筆（全部來自火鳥系統，無隱者記錄） | D1 SELECT COUNT(*) 驗證 (2026-03-31) |
| 隱者系統運作狀態 | 完全癱瘓（campaigns 表為空，getCampaignConfigByHostname 永遠回傳 null） | 部署 Worker 源碼 + D1 驗證 (2026-03-31) |
| 火鳥像素來源 | N8N Config API 的 MASTER_PIXEL_MAP（非 campaigns 表），AD_MAP 為空 | N8N /webhook/get-config 回應驗證 (2026-03-31) |
| line_config 欄位數 | 11 欄（id, tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy），無 campaign_id | D1 PRAGMA table_info 驗證 (2026-03-31) |
| clicks 表欄位數 | 47 欄（含 visitor_id, target_link, routing_strategy 等），無 hostname/source 欄位 | D1 PRAGMA table_info 驗證 (2026-03-31) |
| TAG_PREFIX_MAP 覆蓋範圍 | js/cs/ms/ls/jb/cb/mb/lb/jx/cx/mx/lx/bf/jd/n20-n30（缺 n14-n19） | N8N Prepare CAPI Events 節點源碼 (2026-03-31) |
| N8N CAPI event_source_url | 寫死為 freshpathlab.com（火鳥正確，隱者錯誤） | N8N Prepare CAPI Events 節點源碼 (2026-03-31) |
| 前端網址 | https://admin.bexnua.store/ | 線上驗證 |

> **動態狀態請查閱 `.ai/active-context.md`**：隱者路徑狀態、火鳥路徑狀態等隨時變動的資訊已移至 active-context.md 的「重要注意事項」章節。
