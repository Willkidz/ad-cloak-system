---
title: "斗篷前台到 CAPI 回傳：端到端自動化完整規劃"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-02"
summary: "規劃從斗篷前台上架廣告到臉書 CAPI 自動回傳的完整端到端流程，涵蓋前台操作、系統自動化環節、已完成與待辦事項清單。"
version: "v1.0"
id: "20260402-end-to-end"
type: project-doc
tags: [cloak-admin, shadow-cloak, automation, facebook-capi, n8n]
status: active
created: "2026-04-02"
updated: "2026-04-02"
---
> **TL;DR**: 本文件定義了從「斗篷管理後台」上架廣告到「臉書 CAPI」自動回傳的完整端到端流程。目標是實現用戶在前台完成設定後，整條鏈路全自動運行，無需手動修改程式碼。目前底層系統（Shadow Cloak、Money Page、LIFF Callback、N8N、D1）已全面打通並實施了資料隔離，唯一的斷點在於前台 UI 尚未提供 `liff_id` 和 `line_oa_id` 的輸入介面，以及需要將廣告域名（theme）與這兩個 ID 綁定。

# 斗篷前台到 CAPI 回傳：端到端自動化完整規劃

本文檔詳細規劃了廣告活動從上架到轉換回傳的每一個環節，確保整條鏈路順暢無阻。

---

## 一、 用戶前台操作完整流程（目標狀態）

為實現零代碼操作，用戶只需在斗篷管理後台（`https://admin.bexnua.store`）執行以下步驟：

1. **新增域名**：在「域名管理」頁面新增廣告域名（例如 `kogane.online`），系統自動在 Cloudflare 建立 DNS 紀錄並綁定至 `shadow-cloak` Worker。
2. **新增廣告活動**：在「廣告活動」頁面點擊新增。
3. **填寫基本資訊**：選擇剛新增的域名作為「鏈接」，設定標題。
4. **設定落地頁與歸因**：選擇廣告落地頁模板，填寫 Facebook 像素 ID。
5. **填寫 LINE 歸因參數（待開發）**：在表單中填寫該廣告對應的 `liff_id` 與 `line_oa_id`（目前前台缺少此輸入框）。
6. **設定斗篷規則**：在右欄設定允許的國家、設備、語言等過濾條件，並選擇安全頁。
7. **提交上架**：點擊提交，系統將設定寫入 D1 `campaigns` 表，廣告即刻生效。

---

## 二、 系統自動化執行鏈路

當訪客點擊廣告（例如 `https://kogane.online/?fbclid=123`）後，系統將自動執行以下流程：

### 1. 隱者斗篷 (Shadow Cloak) 過濾與記錄
- 訪客請求進入 `shadow-cloak` Worker。
- 系統根據 `hostname`（即 `theme` 欄位）從 `campaigns` 表取得設定，包含 `liff_id` 與 `line_oa_id`。
- 執行斗篷過濾規則（國家、設備、IP、指紋等）。
- 若判定為真實訪客（`money`），將訪客資訊、`fbclid`、生成的 `vid` 與 `event_id` 寫入 `clicks` 表，並標記 `source = 'shadow-cloak'`（實現與火鳥系統的資料隔離）。
- 將請求轉發至 `money-page`，並在 URL 帶上 `vid` 與 `liff_id`。

### 2. 落地頁 (Money Page) 渲染與 CTA 注入
- `money-page` 接收請求，讀取 `vid` 與 `liff_id`。
- 使用 `HTMLRewriter` 動態將落地頁上的 CTA 按鈕（原本指向 `freshpathlab.com`）替換為直連 LIFF 的網址：`https://liff.line.me/{liff_id}?vid={vid}`。
- 訪客點擊 CTA 按鈕，直接喚醒 LINE APP 並開啟 LIFF 頁面。

### 3. LIFF 授權與回調 (Line Login Callback)
- 訪客在 LINE 中授權 LIFF 應用程式。
- LIFF 頁面載入 `line-login-callback`，取得訪客的 LINE `userId`，並從 URL 提取 `vid`。
- 透過 `/bind` 端點將 `vid` 與 `userId` 寫入 `line_user_bindings` 表。
- 同步更新 `clicks` 表，將該 `vid` 的記錄標記為已匹配（`matched = 1`）。
- 頁面自動跳轉至對應的 LINE 官方帳號（去除 `@` 前綴避免雙重符號錯誤），訪客點擊加好友。

### 4. N8N 精準匹配與 CAPI 回傳
- 訪客加好友後，LINE Webhook 觸發 N8N 的 Time Attribution 工作流。
- N8N 提取 `userId`，透過 SQL 精準匹配：
  ```sql
  SELECT c.* FROM line_user_bindings b 
  JOIN clicks c ON b.vid = c.visitor_id 
  WHERE b.line_user_id = ? AND c.matched = 0 AND c.source = 'shadow-cloak'
  ```
- 成功匹配後，取得 `fbclid`、`event_id` 等參數，並透過 Facebook CAPI 發送轉換事件。

---

## 三、 各組件修改與設定清單

以下列出實現上述流程，各組件需要或已經完成的改動。

### 1. 前台 UI 與 API (Cloak Admin)
- **待辦**：在「添加廣告」表單（左欄）新增 `liff_id` 與 `line_oa_id` 輸入框。
- **待辦**：修改 `cloak-admin-api.js`，確保 `POST` 與 `PUT /api/v1/campaigns` 端點能接收並儲存這兩個欄位。
- **待辦**：確保前端提交的 `theme` 欄位正確對應廣告的 `hostname`，以便 Shadow Cloak 查詢。

### 2. 隱者斗篷 (Shadow Cloak)
- **已完成**：SQL 查詢加入 `liff_id` 與 `line_oa_id`。
- **已完成**：新增寫入 `clicks` 表的邏輯，並加入 `source = 'shadow-cloak'` 欄位以隔離火鳥資料。
- **已完成**：轉發 `money-page` 時，在 URL 附加 `liff_id`。

### 3. 落地頁 (Money Page)
- **已完成**：CTA 按鈕自動替換為 `https://liff.line.me/{liff_id}?vid={vid}`，實現一鍵直達 LINE。
- **已完成**：保留 BC 像素的 PageView、Contact、Purchase 事件追蹤。

### 4. 回調程式 (Line Login Callback)
- **已完成**：簡化 `/bind` 邏輯，僅處理 `vid` 與 `userId` 綁定。
- **已完成**：修復跳轉 OA 時的「雙重 `@`」錯誤（`@@075cocov`）。
- **已完成**：移除中間頁手動按鈕，改為 LIFF 授權後自動跳轉 OA。

### 5. N8N 工作流
- **已完成**：在 Time Attribution 工作流的 `Query Exact Click` 節點加入 `AND c.source = 'shadow-cloak'` 過濾條件。
- **已完成**：修正 `Prepare CAPI Events` 節點引用錯誤（將 `Fingerprint Match` 修正為 `Exact Match`）。
- **已確認**：工作流已原生支援基於 `vid` 的精準匹配。

### 6. 資料庫 (D1)
- **已完成**：`clicks` 表新增 `source` 欄位（預設 `firebird`）。
- **已完成**：`campaigns` 表新增 `liff_id` 與 `line_oa_id` 欄位。
- **已完成**：從 N8N DataTable 同步 23 筆 TAG 資料至 `campaigns` 表。

### 7. 域名設定 (Cloudflare)
- **待辦**：每新增一個廣告，需在 Cloudflare 綁定自訂網域，並設定 Worker 路由指向 `shadow-cloak`。此步驟目前可透過斗篷前台的「域名管理」自動完成。

### 8. LINE 與 Facebook 設定
- **待辦**：每次建立新專案，需在 LINE Developers 建立 Login Channel 並取得 LIFF ID。
- **待辦**：需在 Facebook Events Manager 取得 Pixel ID 與 Access Token，並設定於斗篷前台與 N8N。

---

## 四、 總結：目前狀態與下一步

**目前已完成 90% 的自動化鏈路**。底層的資料庫、Worker 腳本、N8N 工作流皆已修改並部署完畢，資料隔離方案也已生效。

**最後的 10%（下一步行動）**：
1. **修改前台原始碼**：在 React 前端加入 `liff_id` 與 `line_oa_id` 的輸入框。
2. **修改後端 API**：更新 `cloak-admin-api.js` 以處理這兩個新欄位。
3. **資料綁定**：在資料庫中，將廣告的 `theme`（域名）與對應的 `liff_id` / `line_oa_id` 正確關聯。目前同步的 23 筆資料是以 `tag` 為主鍵，需要更新為對應的域名。
