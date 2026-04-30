---
title: "待辦清單"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "所有待辦事項、已完成項目和已知問題的追蹤清單。2026-03-28 全面驗證後更新：新增 8 項未解決問題（含根本原因），標記 5 項已驗證完成。"
id: "20260325-102400"
type: "log"
tags: [cloak-admin, todo]
status: "deprecated"
created: "2026-03-25"
updated: "2026-03-29"
activation_glob: null
---

> **⚠️ DEPRECATED (2026-03-29)**：本文件部分狀態已過期，以 `.ai/active-context.md` 和 `.ai/memory.md` 為準。具體過期項目：#26 TEST-07 已修復、#27 安全頁已修復、#30 line-redirect staging 已合並。

> **TL;DR**: 本文件追蹤所有待辦事項的狀態。2026-03-28 全面驗證後更新：8 項未解決（含源碼確認的根本原因）、3 項待調查（A1~A3 已有驗證結果）、20 項已完成。另有 5 個已知但不影響運作的問題。

# 待辦事項

**最後更新**：2026-03-28（系統狀態全面驗證後更新）

---

## 未完成項目

| # | 項目 | 優先度 | 說明 | 狀態 | 根本原因（已驗證） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 26 | TEST-07 黑頻：allow_desktop/allow_mobile 過濾無效 | P1 | `getCampaignConfigByHostname` SQL SELECT 未包含 `allow_desktop, allow_mobile`，傳入 `checkOSWithConfig` 的值永遠是 `undefined` | **待修復** | 源碼確認：2026-03-28 |
| 27 | 安全頁三種類型未完整實作 | P1 | 源碼只讀 `safe_page_id`，`safe_page_type` 和 `safe_page_action` 欄位雖存在但未被讀取；Redirect/Iframe 類型未實作 | **待修復** | 源碼確認：2026-03-28 |
| 31 | CAPI API 版本升級 v21.0 → v25.0 | P1 | Time Attribution 和 CAPI Health Check 兩個 N8N workflow 都使用 v21.0 | **✅ 已完成（2026-03-31）** | 源碼全面升級，N8N Code 節點需手動更新 |
| 18 | fbp 覆蓋率 0% | P1 | 今日 148 筆 clicks 中 `fbp` 全為空（`fbclid`/`fbc` 覆蓋率 79.7%），影響 CAPI 配對品質 | **待調查** | D1 查詢確認：2026-03-28 |
| 32 | n20 Pixel Token 回傳 Missing perms | P2 | Graph API 回傳 `(#100) Missing perms`，無論使用 n20 專屬 Token 或共用 CAPI Token | **待調查** | Graph API 測試確認：2026-03-28 |
| 30 | line-redirect staging 修改未合併到正式版 | P2 | staging 移除了 `toUpperCase()` 並新增 `/test-adcode`，正式版尚未更新 | **待確認** | 源碼比對確認：2026-03-28 |
| 28 | Bot 偵測無管理後台開關 | P2 | `isBot()` 函式寫死在主流程中強制執行，無法從 UI 控制 | **待規劃** | 源碼確認：2026-03-28 |
| 29 | IP 識別只有 residential_only，無其他選項 | P2 | 源碼只有呼叫 `ipinfo.app` 的 VPN 偵測，無其他識別模式 | **待規劃** | 源碼確認：2026-03-28 |
| 2 | 監控新流量 CAPI 發送 | P1 | 等白天有流量驗證 follow → CAPI 完整鏈路 | 待驗證 | — |
| 13 | 測試安全頁 Bug 修復 | P1 | 使用者實際測試選擇模板與重定向 URL，確認 fyntro.lol 用日本 IP 測試 | 待測試 | — |
| 14 | 完整測試 7 個廣告功能 | P1 | 使用者依照 cloak_test_guide.md 完整測試 7 個廣告的所有功能 | 待測試 | — |
| 15 | 修復測試發現的問題 | P1 | 若測試發現問題，繼續修復直到所有功能確認 OK | 待處理 | — |
| 9 | 允許條件改為多選下拉框 | P2 | 允許國家、語言、OS、流量來源改為多選下拉框 | 待處理 | — |
| 10 | FBCLID 和 VPN/TOR 底層測試 | P2 | 驗證 FBCLID 傳遞與 VPN/TOR 偵測準確性 | 待處理 | — |
| 11 | 黑名單功能測試 | P2 | 驗證黑名單規則是否正確執行 | 待處理 | — |
| 3 | token-mapping-v2 workflow 決策 | P2 | 是否在 N8N 建立對應 workflow，或永久移除程式碼 | 待決策 | — |
| 4 | visitor_id 在 line-redirect 自行生成 | P2 | 提升匹配率，不依賴 shadow-cloak | 待評估 | — |
| 5 | 歷史 198 筆缺 pixel_id 的 clicks | P3 | 集中在 3/18~3/23，可手動補但不影響新流量 | 待決策 | — |
| 6 | Telegram Bot 報告數據差異 | P3 | Bot click 數（151）> clicks 表今日數據（100），差 51 筆（已知原因：N8N 用 UTC+8 + is_bot=0 過濾） | 已解釋 | D1 + N8N 查詢確認 |

### 待調查項目（已有驗證結果）

| # | 項目 | 優先度 | 說明 | 狀態 | 驗證結果（2026-03-28） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | CAPI Health Check API 版本升級 | P1 | N8N workflow 目前使用 v21.0，需升級至 v25.0 | **✅ 已完成（2026-03-31）** | 源碼全面升級至 v25.0，N8N Code 節點需手動更新 |
| A2 | 確認 Facebook CAPI 端點格式 | P1 | 確認是否需從 `/{pixel_id}/events` 改為 `/{dataset_id}/events` | 待調查 | 尚未調查 |
| A3 | n20 Pixel ID 400 錯誤調查 | P2 | n20 Pixel ID (1339967038176681) 回傳 400 錯誤，需調查原因 | **已確認** | 回傳 `(#100) Missing perms`，Token 無權限存取該 Pixel，需聯繫廣告主 |

---

## 已完成項目

| # | 項目 | 完成版本 | 完成日期 | 驗證方式 |
| :--- | :--- | :--- | :--- | :--- |
| — | shadow-cloak D1 Binding 修復 | v1.10.1 | 2026-03-25 | — |
| — | CAPI 事件回傳修復（DNS + 重試 + 補發） | v1.10.2 | 2026-03-25 | — |
| — | line-redirect Webhook URL 修復 | v1.10.3 | 2026-03-25 | — |
| — | BC 像素前端追蹤嵌入 | v1.10.3 | 2026-03-25 | — |
| — | token-mapping 無用 fetch 註解 | v1.10.3 | 2026-03-25 | — |
| — | BC 像素更新 940592681819066 | v1.10.4 | 2026-03-25 | — |
| — | 添加廣告頁面對齊火鳥 | v1.8 | 2026-03-24 | — |
| — | 廣告日誌優化 | v1.8 | 2026-03-25 | — |
| — | visitor_id 全鏈路串接 | v1.10 | 2026-03-24 | — |
| — | 新增廣告功能修復（5/5 成功） | v1.10.5 | 2026-03-25 | — |
| — | shadow-cloak 改用域名識別廣告 | v1.10.5 | 2026-03-25 | — |
| — | 國家/流量來源/黑名單過濾實施 | v1.10.5 | 2026-03-25 | — |
| — | 被攔截顯示安全頁功能 | v1.10.5 | 2026-03-25 | — |
| — | JWT 驗證修復（快速通行證） | v1.10.5 | 2026-03-25 | — |
| — | 中間頁跳轉 0ms 及返回鍵重定向 | v1.10.5 | 2026-03-25 | — |
| 1 | money-page CTA tag 動態化 | — | 2026-03-28 | **源碼驗證**：shadow-cloak 放行時帶 `?tag={tag}&vid={vid}`，HTMLRewriter 正確替換 CTA 連結 |
| — | Time Attribution `$helpers` Bug 修復 | — | 2026-03-28 | **N8N API 驗證**：`sha256hex` 函式已替換，最近 50 次執行 100% 成功 |
| — | BC 像素 CompleteRegistration 修復 | — | 2026-03-28 | **N8N API 驗證**：eventNames 已包含 `CompleteRegistration` 標準事件 |
| 12 | 驗證 GitHub Actions 部署流程 | — | 2026-03-28 | **源碼驗證**：`deploy-workers.yml` + `sync-check.yml` 正常運作，含 Telegram 告警 |
| — | Dashboard API 統計端點確認 | — | 2026-03-28 | **源碼驗證**：`/api/v1/campaigns/stats` 是真實 D1 查詢，非 Mock 數據 |

---

## 已知問題（不影響運作）

| # | 問題 | 說明 |
| :--- | :--- | :--- |
| 1 | 預覽靜態資源 | Cloudflare Pages 無法直接 serve 上傳的 HTML/圖片 |
| 2 | 系統主題無內容 | 素材中心 3 個預設模板卡片無實際內容 |
| 3 | 按鈕點擊/安全內頁點擊 Tab 永遠為空 | cloak_logs 不記錄用戶行為事件 |
| 4 | 36.6% clicks 缺 fbclid | 用戶行為或 ini.html 跳轉丟失 |
| 5 | 99% clicks 缺 visitor_id | 火鳥流程架構限制 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [project-handoff.md](project-handoff.md) | 全專案交接文件 |
| [project-changelog.md](project-changelog.md) | 版本紀錄，記錄已完成項目的詳細變更 |
| [`.ai/memory.md`](../.ai/memory.md) | 4.10 節含 33 個已驗證事實的完整快照 |
| [`03-專案/斗篷管理後台/_index.md`](../03-專案/斗篷管理後台/_index.md) | 斗篷管理後台專案索引 |
| [`07-配置與環境/auth-info-config.md`](../07-配置與環境/auth-info-config.md) | 認證資訊彙整，待調查項目 A3 涉及的 Pixel ID 資訊 |
