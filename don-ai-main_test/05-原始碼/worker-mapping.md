---
title: "Cloudflare Worker 源碼映射表"
category: "config"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "記錄每個 Cloudflare Worker 名稱與 don-ai Git 源碼路徑的對應關係，供 GitOps 自動部署使用。"
id: "20260327-worker-mapping"
type: "config"
tags: [cloudflare, cloudflare-workers, github-actions, reference]
status: "active"
created: "2026-03-27"
updated: "2026-03-30"
---

# Cloudflare Worker 源碼映射表

本文件記錄每個 Cloudflare Worker 在 don-ai 知識庫中的源碼位置。
GitHub Actions 自動部署（deploy-workers.yml）和每日同步檢查（sync-check.yml）只涵蓋此映射表中的 6 個 production Worker（不含 line-redirect-staging 和已廢棄的 manus-memory-api）。Worker 列表硬編碼在各 workflow 中，並非動態讀取本映射表。

## 映射表

| Worker 名稱 | Git 源碼路徑 | 類別 | D1 綁定 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| cloak-admin-api | 05-原始碼/斗篷管理後台/cloak-admin-api.js | 斗篷管理後台 | godview-clicks | 斗篷管理後台 API |
| line-redirect | 05-原始碼/上帝視角/line-redirect.js | 上帝視角 | godview-clicks | LINE 跳轉 + 歸因追蹤 |
| line-redirect-staging | 05-原始碼/上帝視角/line-redirect-staging.js | 上帝視角 | godview-clicks | LINE 跳轉測試版 |
| ~~manus-memory-api~~ | 05-原始碼/其他/manus-memory-api.js | 其他 | ~~manus-memory~~ | **已廢棄**（ADR-003, 2026-03-30）— 記憶系統已遷移至 don-ai `.ai/` 目錄 |
| money-page | 05-原始碼/上帝視角/money-page.js | 上帝視角 | - | 推廣頁 Worker |
| preview-page | 05-原始碼/上帝視角/preview-page.js | 上帝視角 | - | 預覽頁 Worker |
| safe-page | 05-原始碼/斗篷管理後台/safe-page.js | 斗篷管理後台 | - | 安全頁 Worker |
| shadow-cloak | 05-原始碼/斗篷管理後台/shadow-cloak.js | 斗篷管理後台 | godview-clicks | 斗篷核心 Worker |

## 注意事項

<rule id="worker-mapping-rules">

1. **以線上版本為準**：如果 Git 和線上有差異，以線上版本為準更新 Git
2. **部署順序**：修改 Git → PR 審核 → 合併到 main → GitHub Actions 自動部署
3. **D1 綁定**：有 D1 綁定的 Worker 需要在 wrangler.toml 中配置 database_id
4. **staging Worker**：line-redirect-staging 是測試版，不應該自動部署到正式環境


</rule>
