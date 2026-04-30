---
title: "上帝視角數據流與前綴映射架構升級規劃 (v2)"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "上帝視角數據流與前綴映射架構升級規劃 (v2)"
version: "v1.0"
tags: [cloaking, cloak-admin, godview]
status: "active"
---
# 上帝視角數據流與前綴映射架構升級規劃 (v2)

## 1. 現狀分析：修正後的完整數據流架構

經過深入的源碼與 D1 資料庫穿透調查，我們釐清了「上帝視角」系統真實的數據流架構，並確認 D1 資料庫已具備完整的映射能力。

### 1.1 核心資料來源 (Single Source of Truth)
- **D1 `line_config` 表 (23 筆)**：包含所有 TAG 的完整映射（`tag`, `line`, `name`, `who`, `destination`），涵蓋 AS(爆分王)、AB(莊家剋星)、AX(獨角仙)、BF(博富) 及 N 系列。這是系統最真實的配置來源。
- **D1 `ad_config` 表 (20 筆)**：專責 CAPI 像素配置（`code`, `type`, `pixel`, `token`）。

### 1.2 數據流轉路徑
1. **n8n Config API**：n8n 的 `Config API` workflow 從 D1 `ad_config` 與 `line_config` 表讀取數據，組裝成 JSON 配置。
2. **line-redirect Worker**：啟動後透過 `https://n8n.bexnua.store/webhook/get-config` 背景拉取配置，並每 30 分鐘更新。Worker 依此配置處理跳轉並將點擊寫入 D1 `clicks` 表。（註：冷啟動期間使用 `config.js` 內的 `FALLBACK_LINE_MAP`）。
3. **Telegram 歸因報告**：n8n 的 `CAPI Health Check` workflow 直接透過 Cloudflare REST API 查詢 D1 `clicks` 表，統計今日各 tag 的 click 與 matched 數量。
4. **Time Attribution**：接收 LINE follow 事件後，直接查詢 D1 `clicks` 表進行 45 秒時間窗口匹配。
5. **斗篷管理後台 (cloak-admin-api)**：目前分組列表（`GROUP_PREFIX_MAP`）在程式碼中**硬編碼**，尚未與 D1 同步。

### 1.3 發現的異常與不一致
- **文件與代碼矛盾**：原 `godview-mapping-spec.md` 記載 AS=獨角仙、AX=爆分王，與實際 Worker 代碼及 D1 數據（AS=爆分王、AX=獨角仙）完全相反。
- **配置不對齊**：`ad_config` 存在 `sz` 前綴，但 `line_config` 無此記錄（疑似已停用）；`line_config` 中的 `n15, n16, n17, n19, n21` 在 `ad_config` 中無對應像素配置（不會發送 CAPI）。

---

## 2. 方案設計

為解決後台硬編碼問題並實現全系統單一真理來源，提出以下三個方案：

### 方案一：後台直連 D1 `line_config` (推薦)
**說明**：廢棄 `cloak-admin-api` 內的硬編碼 `GROUP_PREFIX_MAP`，改為啟動時或定期查詢 D1 `line_config` 表，動態生成分組映射。
- **優點**：
  - 真正實現 Single Source of Truth，所有組件（Worker, n8n, Admin）皆以 D1 為準。
  - 架構最簡潔，無需新增資料表。
  - 新增 TAG 或分組時，只需在 D1 新增記錄，後台自動生效。
- **缺點**：需要修改後台 API 的啟動邏輯與快取機制。
- **風險**：若 D1 查詢失敗，後台分組功能可能短暫失效（需實作 Fallback）。

### 方案二：透過 n8n Config API 中轉
**說明**：`cloak-admin-api` 不直接查 D1，而是呼叫現有的 `https://n8n.bexnua.store/webhook/get-config` 獲取配置。
- **優點**：復用現有 API，減少 D1 直接連線數。
- **缺點**：增加對 n8n 服務的依賴，若 n8n 停機則後台分組失效；Config API 目前的結構主要為 Worker 設計，可能需調整以適應後台需求。
- **風險**：n8n API 速率限制可能影響後台效能。

### 方案三：維持現狀，建立同步 SOP
**說明**：保持 `cloak-admin-api` 的硬編碼，但建立嚴格的 SOP，規定每次更新 D1 `line_config` 時，必須同步修改後台源碼並重新部署。
- **優點**：開發成本最低，無 API 依賴風險。
- **缺點**：高度依賴人工，極易發生遺漏與資料不同步（如目前 AS/AX 命名相反的問題）。
- **風險**：長期維護成本高，系統脆弱性增加。

---

## 3. 推薦方案實施步驟 (方案一)

採用 **方案一：後台直連 D1 `line_config`**。

### 步驟一：修改 `cloak-admin-api` Worker
1. **引入 D1 Binding**：確保 `cloak-admin-api` 的 `wrangler.toml` 已正確綁定 `godview-clicks` D1 資料庫。
2. **實作動態載入邏輯**：
   - 移除原有的硬編碼 `GROUP_PREFIX_MAP` 和 `GROUP_NAME_MAP`。
   - 撰寫 `loadGroupsFromD1(env)` 函數，執行 `SELECT tag, name FROM line_config`。
   - 根據 `tag` 前綴（如 `js`, `cs` → `AS`）與 `name`（如 `爆分王-xxx` → `爆分王`）動態推導分組結構。
3. **實作快取與 Fallback**：將解析後的結果存入記憶體變數，設定 1 小時 TTL；並保留一份靜態的 Fallback 以防 D1 查詢失敗。

### 步驟二：修改前端 `Campaigns.tsx` 與 `Logs.tsx`
1. 確保前端的分組下拉選單與表格標籤完全依賴 `/api/v1/groups` 的回傳結果。
2. 移除前端任何殘留的硬編碼分組邏輯。

### 步驟三：清理與對齊現有數據
1. **清理 D1 孤立數據**：確認 `ad_config` 中的 `sz` 是否廢棄，若是則刪除；確認 `n15` 等 5 個 N 系列是否需要補齊 CAPI 像素。
2. **更新 Worker 靜態配置**：同步更新 `line-redirect` Worker 內 `config.js` 的 `FALLBACK_LINE_MAP`，確保與 D1 數據完全一致。

---

## 4. 風險管理

| 風險項目 | 發生機率 | 影響程度 | 緩解措施 |
|---------|---------|---------|---------|
| **D1 查詢超時或失敗** | 低 | 中 | 實作記憶體快取與靜態 Fallback 配置。 |
| **動態推導分組邏輯錯誤** | 中 | 中 | 在解析 `tag` 與 `name` 時加入嚴格正則表達式，若無法推導則歸入「未分類」。 |
| **N 系列命名不一致** | 高 | 低 | 統一 N 系列的解析邏輯（提取 `n` 後的數字作為子分組）。 |

---

## 5. 測試計劃

1. **單元測試**：測試 `loadGroupsFromD1` 解析邏輯，輸入模擬的 `line_config` 數據，驗證輸出的 `{prefix, name, label}` 陣列是否正確。
2. **整合測試**：部署至 staging 環境，驗證 `/api/v1/groups` 是否能正確回傳從 D1 即時抓取的分組。
3. **端到端測試**：在後台新增一個測試 Campaign，確認是否能正確關聯到動態生成的分組。

---

## 6. 部署計劃

1. **Phase 1**：部署 `cloak-admin-api` Worker 更新至正式環境。
2. **Phase 2**：部署 `cloak-admin-frontend` 前端更新至正式環境。
3. **Phase 3**：監控 Cloudflare Dashboard 的 D1 查詢次數與 Worker 錯誤日誌。

---

## 7. 後續維護

- **單一真理來源**：未來所有新增分組或 TAG 的操作，**僅需**透過 N8N Admin API 或直接寫入 D1 `line_config` 表，系統各組件將自動同步。
- **文件維護**：確保 `godview-tag-mapping.md` 等說明文件與 D1 數據保持一致，避免誤導開發者。
