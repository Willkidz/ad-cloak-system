---
title: "Cloudflare 技術規格參考"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "彙整 Cloudflare 關鍵技術規格，包含 D1 資料庫、Workers、KV 儲存及 Pages 的容量、效能與使用限制。"
id: "20260325-cloudflare-spec"
type: concept
tags: [backend, cloudflare, cloudflare-d1, cloudflare-kv, cloudflare-pages, cloudflare-workers]
status: verified
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本文件整理 Cloudflare 各項服務的技術限制與最佳實踐。重點包含：1. **D1 資料庫**：單庫容量上限 10GB（GA 版）；2. **Workers**：付費版 CPU 時間高達 5 分鐘，建議使用 ES Module 格式以原生綁定 D1/KV；3. **KV 儲存**：Value 上限 25MB，適合配置數據；4. **Pages**：靜態託管單一檔案上限 25MB。開發時應特別注意 Subrequest 數量限制以避免請求失敗。

# Cloudflare 技術規格參考

本文件整理開發時常用的 Cloudflare 各項服務技術規格，旨在提供快速查閱參考，避免重複搜索官方文檔。數據已於 2026-03-25 根據官方文檔驗證。

---

## 一、D1 資料庫限制

D1 已進入正式版（GA）。單一資料庫容量上限為 10GB，此上限無法透過付費方案提升。

| 限制項目 | Free Plan | Paid Plan |
| :--- | :--- | :--- |
| **單一資料庫容量** | 500MB | **10GB (不可增加)** |
| **帳戶總儲存量** | 5GB | 1TB |
| **每日讀取行數** | 500 萬 | 500 億 |
| **每日寫入行數** | 10 萬 | 500 億 |
| **單次查詢最大讀取** | 1,000,000 行 | 1,000,000 行 |

<rule id="d1-capacity-eval">

對於目前的 `cloak_logs`（約 2.5k 筆）和 `clicks`（約 700 筆）來說，10GB 容量綽綽有餘，但需持續監控數據增長率。

</rule>

---

## 二、Worker 限制與最佳實踐

付費方案提供高達 5 分鐘的 CPU 執行時間，適合複雜計算任務。

| 限制項目 | Free Plan | Paid Plan (Standard) |
| :--- | :--- | :--- |
| **每日請求數** | 100,000 | 無限制 |
| **CPU 時間** | 10ms | **5 分鐘 (預設 30s)** |
| **記憶體** | 128MB | 128MB |
| **Subrequest 上限** | 50 個/請求 | 10,000 個/請求 |
| **腳本大小 (壓縮後)** | 3MB | 10MB |

<rule id="worker-subrequest-trap">

**Subrequest 陷阱**：在 `shadow-cloak` 開發中發現，過多的 fetch 操作易觸發上限。例如在 `token-mapping-v2` 中移除不必要的 fetch 可有效降低風險。

</rule>

### 2.1 Worker 格式差異

<rule id="worker-format-choice">

**強烈推薦使用 ES Module 格式**。它支援 `env` 對象原生綁定 D1、KV，性能優於 Service Worker 格式的 REST API 訪問，且能避免 IP 地址丟失問題。

</rule>

<example title="格式遷移案例">

`shadow-cloak` 早期使用 Service Worker 格式導致 `visitor_id` 為 null。遷移至 ES Module 並使用原生綁定後，問題徹底解決。

</example>

---

## 三、KV 與 Pages 限制

### 3.1 KV 儲存

| 限制項目 | Free Plan | Paid Plan |
| :--- | :--- | :--- |
| **讀取次數** | 100K/天 | 10M/天 |
| **寫入次數** | 1K/天 | 1M/天 |
| **Value 大小** | 25MB | 25MB |

### 3.2 Pages 靜態託管

| 限制項目 | Free Plan | Paid Plan |
| :--- | :--- | :--- |
| **檔案數量上限** | 20,000 | 100,000 |
| **單一檔案大小** | 25MB | 25MB |
| **部署次數** | 500/月 | 5,000/月 |

---

## 四、結論

熟悉 D1 容量、Worker CPU 時間與 Subrequest 限制是確保應用穩定的關鍵。開發應優先選擇 **ES Module** 格式並善用原生綁定。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`api-schema-sync-spec.md`](./api-schema-sync-spec.md) | API Schema 同步與防錯策略 |
| [`03-專案/斗篷管理後台/cloak-admin-deploy-arch.md`](../03-專案/斗篷管理後台/cloak-admin-deploy-arch.md) | 實踐經驗來源專案 |
| [`03-專案/斗篷管理後台/cloak-admin-deploy-arch.md`](../03-專案/斗篷管理後台/cloak-admin-deploy-arch.md) | 部署架構參考 |
