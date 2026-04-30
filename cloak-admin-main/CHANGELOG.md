## v2.6.3 — 分組輪替 UI 修復（2026-04-24）
### 修復
- 修復分配策略選「IP+UA 固定」時「分組輪替」選項消失的 bug（RadioGroup value 未正確處理 _ip_ua_sticky 後綴）

## v2.6.2 — 模板效果歸因欄位 + 單一模板重置（2026-04-24）
### 新增
- 模板效果 TAB 新增「歸因數」和「歸因率」欄位，完整顯示曝光→點擊→歸因漏斗
- 測試模板列表每個模板旁邊加入單獨「重置」按鈕（只在有數據時顯示，帶確認提示）
- 後端新增 POST /campaigns/:cid/variants/:vid/reset 單一 variant 重置端點
- api.ts 新增 resetSingleVariant 函數
- 後端新增 POST /v1/callback Webhook 代理路由

## v2.6.1 — 落地頁 A/B 測試 Bug 修復（2026-04-24）
### Bug 修復
- 修復推廣頁模板下拉與測試策略衝突：策略為 weight/thompson 時隱藏下拉，顯示「由下方測試模板決定」提示
- 修復已選模板可重複加入：已選模板顯示「✓ 已選」且 disabled
- 修復模板效果 TAB 的 UV 顯示「-」：API 返回 uv/clicks，前端錯用 unique_visitors/unique_clicks
- 修復 CTR 顯示遏輯：CTR 是字串如 "19.8%"，前端用 parseFloat 比較，不再重複加 %
- 新增重置計數器按鈕（帶確認提示，不可逆）
- api.ts 新增 resetVariants 函數數

## v2.6.0 — 落地頁 A/B 測試 UI（2026-04-24）

### 新增功能
- 首頁新增「模板效果」TAB：按 7/14/30 天查看所有推廣頁模板的 UV、點擊、CTR 排行
- Campaign 編輯表單新增「落地頁測試策略」區塊：
  - 關閉（使用主要模板）
  - 權重分配（手動設定）
  - 自動優化（Thompson Sampling）
- 測試模板管理：可新增/移除測試模板，顯示即時曝光、點擊、CTR 數據
- api.ts 新增 5 個 API 函數：fetchTemplateStats、fetchCampaignVariants、createVariant、updateVariant、deleteVariant
- Campaign interface 新增 page_test_strategy 欄位
- 風險值：0（純新增 UI，不影響現有功能）

# Changelog

## [v2.5.0] - 2026-04-23

### Changed
- 「IP 固定」改為「固定分配」勾選框
- 勾選後出現下拉選單：IP 固定 / IP+UA 固定
- 支援 ip_sticky 和 ip_ua_sticky 兩種固定分配模式


## [1.17.2] - 2026-04-15

### Bug Fix
- 修復 Campaigns.tsx 選擇安全頁國家時會連動清空已選安全頁模板（formSafePageId）的問題
- 修復 handleEdit 載入廣告資料時未根據 safe_page_id 反查初始化 formSafeCountry 的問題
- 原則：改什麼就更新什麼，欄位之間不應有連動清空邏輯

## [1.17.1] - 2026-04-15

### Bug Fix
- 修復 Campaigns.tsx 遺漏 fetchTemplates、fetchDomains、deleteCampaign 的 import，導致廣告設定頁面下拉選單空白

## [1.17.0] - 2026-04-10

### Fixed
- 修正所有 Tab 的 API 欄位名稱映射錯誤，確保數據正確顯示
- 修正前端 Tab 名稱與後端 API 的對應（promo_page→money_page, promo_button→money_page_button, safe_button→safe_page_button）
- 修正「全部日誌」Tab 的欄位映射（visit_time/device/status/log_detail vs timestamp/ua/verdict/reason）
- 修正互動事件 Tab 的欄位映射（created_at, ip vs ip_address）
- 修正判定標籤顏色：放行用綠色（emerald）而非藍色
- 使用 getField() 多欄位名容錯機制，自動適配不同 Tab 的 API 返回格式
- 統一使用單一 items 狀態，避免多個數據源狀態不同步

---

## [1.16.0] - 2026-04-10

### Changed
- 根據用戶反饋，以舊版 v4.0 格式為基礎重構訪問日誌頁面
- **保留舊版篩選器**：還原了分組篩選、廣告篩選、時間範圍、搜索框等頂部篩選區域
- **保留舊版樣式**：還原了表格樣式、判定標籤顏色（攔截-紅，放行-綠）、截斷文字 Tooltip 等
- **擴充至 7 Tab**：在保留舊版「斗篷過濾日誌（分拆為安全頁/推廣頁）」、「全部跳轉」、「已歸因」的基礎上，新增了「推廣頁按鈕」和「安全頁按鈕」Tab
- **優化欄位設計**：
  - 安全頁/推廣頁：採用舊版標準欄位（時間、IP、國家、判定、原因、域名/路徑、廣告名稱、語言、訪客ID、設備）
  - 互動事件：採用專屬欄位（時間、域名、IP、國家、訪客ID、事件類型、結果、語言、事件數據）
  - 全部跳轉/已歸因：採用舊版歸因欄位（時間、TAG、Ad Code、Visitor ID、fbclid、Event ID、Destination、歸因、歸因用戶、國家、系統、來源）

---

## [1.14.0] - 2026-04-10

### Fixed
- 修復「全部日誌」Tab 的 UNION ALL SQL 錯誤（interaction_events/clicks 表無 campaign_id 欄位）
- 修復「全部跳轉」和「已歸因」Tab 的 campaign_id 過濾條件導致 SQL 錯誤
- 修復所有 7 個 Tab 顯示「無記錄」的問題

### Changed
- 根據數據來源為各 Tab 設計最合適的欄位組合（不再強制所有 Tab 顯示相同欄位）
- 安全頁/推廣頁 Tab：序號、時間、域名/來源、國家/IP、訪客ID、語言、設備、判定、原因
- 推廣頁按鈕/安全頁按鈕 Tab：序號、時間、域名、國家/IP、訪客ID、事件類型、結果、設備、事件數據
- 全部跳轉/已歸因 Tab：序號、時間、TAG/Ad Code、國家/IP、訪客ID、fbclid、歸因、歸因用戶、系統、Destination
- 事件數據自動解析 JSON 格式，顯示指紋分數、互動次數、停留時間等中文摘要

---

## [1.13.0] - 2026-04-10

### Changed - 訪問日誌 7 Tab 完整追蹤漏斗重構
- **7 Tab 完整追蹤漏斗設計**：將訪問記錄頁面重構為全部日誌、安全頁、推廣頁、推廣頁按鈕、安全頁按鈕、全部跳轉、已歸因七個分頁，覆蓋從入口到轉換的完整鏈路
- **統一欄位與 VID/EVENT 顯示**：每個 Tab 統一顯示序號、訪問時間、訪問域名/來源、國家/IP、**訪客ID (VID)**、**事件 (EVENT)**、語言、設備、狀態、日誌
- **整合三表數據**：整合 `cloak_logs`、`interaction_events` 與 `clicks` 表的數據，修復歸因記錄缺失問題
- **全面中文化**：所有狀態欄位（status、event_type、verdict）和日誌原因（reason、log_detail、destination）均顯示中文，優化 JSON 數據解析與英文翻譯
- **後端 API 升級**：`GET /api/v1/visit-logs` 支援 7 Tab 分層查詢與三表聯查邏輯

## [1.12.0] - 2026-04-10

### Changed - 訪問日誌分層顯示重構
- **5 Tab 分層設計**：將訪問記錄頁面重構為全部日誌、訪問日誌、按鈕點擊、安全內頁點擊、斗篷攔截五個分頁，參考火鳥系統設計
- **統一欄位格式**：每個 Tab 統一顯示序號、訪問時間、訪問域名/訪問來源、國家/訪問IP、訪客ID、語言、設備、狀態、日誌
- **全面中文化**：所有狀態欄位（verdict、event_type、result）和攔截原因（reason）均顯示中文，包含 30+ 種英文狀態碼的中文映射
- **整合多表數據**：整合 cloak_logs 和 interaction_events 表的數據，支持跨表聯合查詢
- **新增 API 端點**：後端新增 `GET /api/v1/visit-logs` 統一查詢端點，支持 tab 參數分層過濾
- **新增後端端點**：新增 `GET /api/v1/decisions` 和 `GET /api/v1/interaction-events` 查詢端點
- **增強搜索**：原有 `/api/v1/logs` 端點增加 campaign_id、日期範圍、reason、visitor_id 搜索支持

---

## [1.11.0] - 2026-04-10

### Added - 素材中心全面優化
- **新增表單改為彈窗（Modal）**：頁面頂部改為「+ 新增素材」按鈕，點擊彈出居中 Modal，內含 4 個 Tab（採集新增、ZIP 上傳、自定義新增、系統主題），彈窗支援全螢幕展開
- **所有彈窗加入全螢幕按鈕**：預覽、編輯素材、編輯源碼彈窗右上角加入全螢幕展開/縮小按鈕
- **源碼編輯加入檢查機制**：底部顯示編輯規範說明（conftp 全局配置、第三方像素移除、gotolink 跳轉方法），新增「規範檢查」按鈕自動檢測
- **新增表單補齊「狀態」欄位**：採集新增、ZIP 上傳、自定義新增表單加入啟用/停用 Radio 選擇，預設為「啟用」
- **系統主題展示優化**：改為 Grid 網格排列，加入搜索框與類型/國家篩選功能，主題卡片包含縮略圖預覽
- **批量刪除功能**：前端支援多選 + 批量刪除，優先使用後端批量 API
- **iframe 縮略圖延遲載入**：使用 IntersectionObserver 實現 lazy loading，提升列表效能
- **採集 URL 輸入框改為 textarea**：支援長網址輸入

### Fixed
- **修復編輯素材彈窗 Bug**：移除有問題的「原始 HTML 內容」區域（之前顯示 `{"success":false,"error":"Missi...` 錯誤訊息）

### Changed
- **類型欄位改為 Radio 按鈕**：新增表單中的類型選擇從下拉選單（Select）改為 Radio 單選按鈕（推廣頁/安全頁），更直覺
- **表單欄位改為垂直排列**：彈窗內表單欄位不再橫向擠在一起

---

## [1.10.9] - 2026-03-29

### Fixed
- 修復分組下拉選單滾動到頂部時的抖動問題（移除與 Radix UI ScrollButton 衝突的 `overflow-y-auto`，改用 `position="popper"` 搭配內層 div 管理滾動）

### Added
- 廣告管理頁（Campaigns.tsx）分組下拉選單頂部新增搜索輸入框，支援關鍵字即時過濾分組選項
- 訪問日誌頁（Logs.tsx）分組篩選下拉選單頂部新增搜索輸入框，支援關鍵字即時過濾分組選項
- 下拉關閉時自動清空搜索框（`onOpenChange` 重置 `groupSearch` state）

---

> 歷史版本請參考 Git log

## v6.7.9 (2026-04-22)
### 新增
- 首頁新增「廣告排行」獨立 TAB
- 日期快速選擇（今天、昨天、3天、7天）+ 自訂日期範圍
- 新增欄位：推廣頁UV（不重複訪客）、不重複點擊
- 所有欄位支援點擊排序（升序/降序）
- 分組摘要顯示五項統計數據

### 改進
- 後端 ad-ranking API 支援 start_date/end_date 日期範圍查詢
- 後端新增 unified_logs 查詢取得不重複訪客數
- 視覺優化：分組卡片摘要、排序圖示、色彩分級
