---
title: "Shadow Cloak 專案進度與決策記錄 (2026-03-25)"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "記錄 Shadow Cloak 專案於 2026-03-25 的功能決策、已完成修復、待辦事項、測試結果與後續建議，涵蓋多連結策略、IP 固定邏輯及 Bot 偵測開關等核心變更。"
version: "v1.0"
id: "20260325-progress-log"
type: project-doc
tags: [planning, shadow-cloak, testing]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件記錄了 Shadow Cloak 專案在 2026-03-25 的重大進展。核心決策包括將「多連結策略」改為單選 RadioGroup、新增三種 IP 固定識別方式（IP/UA/Cookie）、並將過濾邏輯優先序設定為高於 IP 固定。目前已完成 42 個後端 API 欄位修復、Hostname 廣告識別機制及 0ms 中間頁跳轉優化。測試顯示台灣 IP 多次訪問與返回鍵重定向功能均正常。

# Shadow Cloak 專案進度與決策記錄 (2026-03-25)

**記錄日期**：2026-03-25  
**版本**：v1.0

---

## 1. 功能決策 (Decision Log)

本節記錄今日會議中針對 Shadow Cloak 功能所做的最終決定。

<rule id="feature-decisions">

| 功能模組 | 決策內容 | 狀態 | 說明 |
| :--- | :--- | :--- | :--- |
| **多連結策略 UI** | 「隨機/輪替」改為 RadioGroup 單選，「IP 固定」為獨立 Checkbox。 | 待實施 | 優化互斥與組合關係的清晰度。 |
| **術語統一** | 統一將「輪詢打開」修改為「輪替打開」。 | ✅ 已完成 | 符合功能描述及中文語境。 |
| **IP 固定識別** | 新增「依 IP 固定」、「依 UA 固定」、「依 Cookie 固定」三個獨立 Checkbox。 | 待實施 | 提供更靈活的訪客識別機制。 |
| **過濾優先序** | 過濾條件（國家、Bot 等）優先級永遠高於 IP 固定。 | ✅ 已實施 | 確保核心過濾規則先執行。 |
| **Bot 偵測開關** | 廣告設定頁面增加「Bot 偵測」開關，預設為關閉。 | 待實施 | 平衡防禦效果與誤判風險。 |
| **條件多選** | 「允許國家/語言/OS/來源」全部改為可多選的下拉選單。 | 待實施 | 增加設定靈活性，後端需更新為 JSON 陣列。 |
| **跳轉延遲** | 中間頁跳轉延遲設定為 0 毫秒。 | ✅ 已部署 | 經測試不影響返回鍵重定向功能。 |

</rule>

---

## 2. 已完成事項 (Completed Tasks)

本節記錄截至今日已完成並部署的修復與功能。

<step id="completed-tasks">

1.  **後端 API 欄位完整性修復**：確保全部 42 個欄位都能正確寫入 D1 資料庫。
2.  **Hostname 廣告識別機制**：`shadow-cloak` Worker 新增 `getCampaignConfigByHostname()`，可直接透過域名識別廣告。
3.  **核心過濾與分流邏輯**：補齊了流量來源過濾、黑名單規則及多連結分流的核心邏輯。
4.  **攔截流程優化**：所有攔截點統一呼叫 `serveSafePage()` 回傳 HTTP 200，優化搜尋引擎友好度。
5.  **JWT 驗證邏輯優化**：將過期處理改為「允許並重新簽發」，解決台灣 IP 二次訪問被誤擋問題。
6.  **推廣頁載入與腳本注入**：實現從 `money-page` 取得內容並注入返回鍵重定向、離開意圖彈窗等腳本。

</step>

---

## 3. 測試結果 (Testing Report)

| 測試場景 | 預期結果 | 實際結果 | 狀態 |
| :--- | :--- | :--- | :--- |
| **非台灣 IP + 一般瀏覽器** | 導向安全頁 | ✅ 成功導向 | 通過 |
| **使用 curl (模擬 Bot)** | 導向安全頁 | ✅ 成功導向 | 通過 |
| **訪問未綁定廣告的域名** | Pass-through (404) | ✅ 正常顯示 404 | 通過 |
| **台灣 IP 多次訪問** | 每次都正常訪問 | ✅ 成功 (JWT 邏輯修復) | 通過 |
| **中間頁返回鍵** | 重定向至指定 URL | ✅ 功能正常 | 通過 |

---

## 4. 部署狀態 (Deployment Status)

| Worker 名稱 | 最新 Version ID | 部署日期 | 主要功能 |
| :--- | :--- | :--- | :--- |
| `shadow-cloak` | `09c1b768-ab8f-4a9f-8ab8-9cb9c51c2c4b` | 2026-03-25 | Hostname 識別、0ms 跳轉、JWT 快速通行證 |
| `safe-page` | - | - | 安全頁模板渲染 |
| `money-page` | - | - | 推廣頁面模板渲染 |

---

## 5. 結論與後續建議

根據今日進度，後續開發應聚焦於完成前端介面的調整，並對關鍵過濾邏輯（特別是 FBCLID、VPN/TOR 及黑名單）進行深度測試。同時，應將本次更新內容同步至 `systemPatterns.md` 與 `projectbrief.md` 文件中。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-feature-ui-spec.md](shadow-cloak-feature-ui-spec.md) | 功能與 UI 規範 |
| [shadow-cloak-remaining-todo.md](shadow-cloak-remaining-todo.md) | 剩餘待辦事項 |
| [cloak-admin-system-patterns.md](cloak-admin-system-patterns.md) | 系統架構模式 |

---
## 隱者系統深度分析結果（2026-03-31）

### 系統狀態：完全癱瘓

經深度分析確認，隱者系統目前完全無法運作。根本原因是 D1 `campaigns` 表為空（0 筆資料），導致 shadow-cloak Worker 的 `getCampaignConfigByHostname` 查詢永遠回傳 null，整個流程在第一步就中斷。

### 待修復問題

| 優先級 | 問題 | 狀態 |
|--------|------|------|
| P0 | campaigns 表為空 | 待修復 |
| P1 | /track 路由強制清空 ad_code | 待修復 |
| P1 | 跨域 XHR 導致 referer 遺失 | 待修復 |
| P1 | N8N event_source_url 寫死為 freshpathlab.com | 待修復 |
| P2 | TAG_PREFIX_MAP 缺少 n14-n19 | 待修復 |

### 修正原則

所有修正遵循 ADR-004「火鳥零影響原則」：只修改隱者專用路徑，絕不動火鳥主路由邏輯。詳見 `.ai/decision-log.md`。
