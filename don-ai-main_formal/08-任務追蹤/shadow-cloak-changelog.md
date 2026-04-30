---
title: "隱者斗篷（Shadow Cloak）— 版本紀錄"
category: "project"
priority: "medium"
last_updated: "2026-04-10"
summary: "隱者斗篷系統的完整版本發佈紀錄，已更新至 v1.9.0。v1.9 重大更新：Verified Bot 判定順序優化、CAPI 日誌實體寫入。"
version: "v1.9.0"
---

# 隱者斗篷（Shadow Cloak）— 版本紀錄

**最後更新**：2026-04-10
**維護單位**：Manus 規劃組

---

## 協作規則

<rule id="shadow-cloak-collaboration">
**規劃組（Manus）與技術組（隱者斗篷）之間，統一用版本號溝通。**
1. 規劃組出指令時，標明目標版本號（如 v1.2）。
2. 技術組照做，完成後回報：「v1.2 已部署」＋測試結果（通過/失敗）。
3. 規劃組收到後，只在版本紀錄新增一行摘要，不需要讀完整報告。
</rule>

---

## 版本紀錄總覽

| 版本 | 日期 | 階段 | 說明 | 執行單位 |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 | 2026-03-23 | Phase 1 | 初始部署：shadow-cloak Worker + DNS + SSL + 路由 | 隱者斗篷技術組 |
| v1.8 | 2026-04-07 | CAPI 統一 | CAPI 像素解析統一由 D1 pixel_groups 驅動、VID 傳遞修復、CAPI 日誌寫入 | Manus 規劃組 |
| v1.8.1 | 2026-04-08 | 修復 | Tag 轉換邏輯修復（getProductPrefix），clicks 表 pixels 欄位正確寫入 | Manus 規劃組 |
| v1.9.0 | 2026-04-10 | 核心優化 | Verified Bot 順序修正 + CAPI 日誌寫入邏輯 | Manus 規劃組 |

---

## v1.9.0 — Verified Bot 順序修正 + CAPI 日誌寫入邏輯

**部署時間**：2026-04-10 | **執行單位**：Manus 規劃組

v1.9.0 是 shadow-cloak Worker 的核心邏輯優化版本，旨在提高日誌準確性與 CAPI 監控完整性。

### 變更內容

1. **Verified Bot 判定順序優化**：將 Verified Bot Allowlist 檢查移至國家過濾（Country Filter）之前。解決了 Googlebot 等合法爬蟲因其 IP 國家不在允許列表而被提前攔截（標記為 `country_blocked`）的問題，現在會正確標記為 `verified_bot` 並允許進入安全頁。
2. **CAPI 日誌寫入邏輯**：在 `sendCAPIPageView()` 函數中補齊了 `capi_logs` 的實體寫入，記錄 `pixel_id`、`group_id`、`group_name`、`pixel_tag`、`status_code` 及回應內容。
3. **D1 Binding 統一**：將程式碼中所有的 `env.D1` 引用統一修改為 `env.DB`，以與 `cloak-admin-api` 組件的命名規範對齊。

### 部署狀態

| 項目 | 狀態 | 備註 |
| :--- | :--- | :--- |
| shadow-cloak Worker 部署 | ✅ | 已部署至 Staging 與 Production |
| Verified Bot 順序測試 | ✅ | Googlebot 請求正確標記為 verified_bot |
| CAPI 日誌寫入測試 | ✅ | 成功寫入 capi_logs 表 |

### 程式碼檔案

| 檔案名稱 | 版本 | 說明 |
| :--- | :--- | :--- |
| `05-原始碼/斗篷管理後台/shadow-cloak.js` | v1.9.0 | 順序優化 + CAPI 寫入 + Binding 統一 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`CHANGELOG.md`](../CHANGELOG.md) | 根目錄的全局變更日誌 |
| [`01-核心原則/deploy-and-version-spec.md`](../01-核心原則/deploy-and-version-spec.md) | 版本號格式和 CHANGELOG 更新規範 |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前任務狀態（任務狀態唯一來源） |
