---
title: "修改指令 v1.7：添加廣告頁面完整功能邏輯（域名選單、像素、斗篷規則、黑名單）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "定義斗篷管理後台「添加廣告」頁面的完整前後端功能邏輯：推廣域名改為從 Cloudflare API 動態拉取的下拉選單（已占用顯示灰色）、Money Page 兩級國家/模板選單、LINE 鏈結多行輸入支援 random/round_robin/ip_hash 三種路由策略、多種像素（TK/FB/GA/Google Ad）多筆輸入、黑名單規則（IP/ASN/UA）、6 項斗篷過濾規則，以及安全頁模板/自定義切換。"
version: "v1.0"
id: "20260325-v1-7-ad-logic"
type: cmd
tags: [advertising, backend, cloak-admin, cloudflare, frontend, pixel]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: v1.7 為「添加廣告」頁面定義完整功能邏輯。推廣域名從輸入框改為下拉選單，後端新增 `GET /api/v1/domains` 透過 Cloudflare API 列出綁定 `shadow-cloak` Worker 的域名，已被其他廣告占用的域名顯示灰色不可選。LINE 鏈結支援多行輸入與批量貼上，提供 random / round_robin / ip_hash 三種路由策略。像素設定支援 TK、FB、GA、Google Ad+Conv 四類，每類均可多筆輸入。黑名單規則支援 IP 等於 / ASN 等於 / UA 包含三種條件。斗篷規則包含語言、OS、OS 版本、國家、省州、流量來源 6 項過濾。安全頁分為模板選擇與自定義兩種模式。所有資料以 JSON 格式存入 `campaigns` 表的 TEXT 欄位。

# 修改指令 v1.7：添加廣告頁面完整功能邏輯

本文件旨在為「添加廣告」頁面撰寫完整的功能邏輯，讓技術組能將各功能區塊的邏輯串接起來。

## 1. 目標說明

為斗篷管理後台的「添加廣告」頁面提供完整的前後端功能邏輯，確保開發團隊可以依此實作。前端 UI 介面已由 B 規劃組完成，本文件將詳細說明每個功能的邏輯描述、API 格式、前端行為、後端 API 變更、以及相關的資料庫欄位。

## 2. 相關檔案

| 專案 | 檔案路徑 | 說明 |
| :--- | :--- | :--- |
| 前端 | `src/pages/CampaignEdit/index.tsx` | 實作表單邏輯與 API 串接 |
| 前端 | `src/api/index.ts` | 新增與修改相關 API 呼叫函式 |
| 後端 | `src/routes/campaigns.ts` | 處理廣告資料的儲存與讀取 |
| 後端 | `src/routes/domains.ts` | 新增取得可用推廣域名的 API |

## 3. 功能邏輯詳解

### 3.1. 推廣域名（鏈結）

<step id="domain-logic-1">
將原本的輸入框改為下拉選單，從後端 API 動態拉取可用的推廣域名。後端需呼叫 Cloudflare API 列出帳號下所有 zones，然後查詢每個 zone 的 Workers routes，只列出綁定了 `shadow-cloak` Worker 的域名。
</step>

<step id="domain-logic-2">
一個廣告只能綁定一個域名。後端需檢查 `campaigns` 表中是否已有其他廣告綁定了該域名（`theme` 欄位）。如果已被占用，前端下拉選單中應顯示為灰色並附加「(已占用)」文字，且不可選取。在編輯模式下，若該域名綁定的是當前廣告，則可正常選取。
</step>

<rule id="domain-api">
後端需新增 `GET /api/v1/domains` API，用以獲取所有可用的推廣域名及其綁定狀態。

<example id="domain-api-response">
**API 回傳格式範例：**
```json
{
  "success": true,
  "data": {
    "domains": [
      { "domain": "fyntro.lol", "bindedCampaignId": null },
      { "domain": "kravdo.lol", "bindedCampaignId": "xxx-xxx" }
    ]
  }
}
```
</example>
</rule>

<boundaries id="domain-cf-config">
**Cloudflare API 資訊：** API 金鑰不應寫死於程式碼中，必須改為環境變數。
- Account ID: `61f1eb800e48d2cf41ed9ddacf01581b`
- 列出 zones: `GET https://api.cloudflare.com/client/v4/zones?account.id={account_id}&per_page=50`
- 列出 zone 的 worker routes: `GET https://api.cloudflare.com/client/v4/zones/{zone_id}/workers/routes`
</boundaries>

### 3.2. 廣告落地頁（Money Page）

<step id="money-page-logic">
前端介面為兩級下拉選單。左側下拉選單為國家分類，右側為該國家下的模板名稱。前端需呼叫既有 API `GET /api/v1/templates?type=money_page` 獲取所有推廣頁模板，並在前端按 `country` 欄位進行分組。當用戶選擇國家後，右側下拉選單動態過濾並顯示對應的模板列表。
</step>

### 3.3. LINE 鏈結設定

<step id="line-links-logic-1">
支援多行輸入 LINE 鏈結。預設顯示一個輸入框，每個輸入框右側有刪除按鈕 (X)。使用者可透過「+ 新增一行」按鈕新增輸入框，或使用「+ 批量」按鈕在彈出視窗中貼上多筆鏈結（以逗號或換行分隔）。
</step>

<step id="line-links-logic-2">
提供三種多鏈結開啟策略的選項：隨機打開 (random)、輪詢打開 (round_robin)、同一個 IP 固定訪問同一個鏈接 (ip_hash)。其中「同一個IP固定訪問同一個鏈接」為可選 checkbox，能與前兩種策略搭配使用。
</step>

### 3.4. 允許客戶端

<step id="allowed-clients-logic">
提供兩個 checkbox：「電腦端」與「移動版 (手機、iPad)」，使用者至少需勾選一項。另提供一個獨立的 checkbox：「僅允許住宅IP」，用以過濾機房或代理 IP。
</step>

### 3.5. 像素設定

<step id="pixel-settings-logic">
支援多種像素 ID 的設定，且每種像素均支援多筆輸入。
- **TK 像素 ID**：每行一個輸入框，右側有 [+] 新增和 [-] 刪除按鈕。
- **FB 像素 ID**：同上。
- **Google Analytics ID**：同上。
- **Google 廣告 ID/轉化 ID**：每行包含「廣告 ID」和「轉化 ID」兩個輸入框，右側有 [+] 和 [-] 按鈕。
</step>

### 3.6. 廣告狀態

<step id="status-logic">
提供 radio 選項設定廣告狀態：上架 (active) 或下架 (inactive)。
</step>

### 3.7. 黑名單規則

<step id="blacklist-logic">
支援設定多條件的黑名單規則。每條規則包含一個類型下拉選單（IP 等於、ASN 等於、UA 包含）和一個對應值的輸入框。使用者可透過「+ 添加條件」按鈕新增規則，並可刪除既有規則。
</step>

### 3.8. 斗篷規則（右欄）

<step id="cloak-rules-logic-1">
提供 6 個過濾規則的輸入框，留空表示不進行限制，包含：允許瀏覽器語言、允許訪客操作系統、允許操作系統版本、允許國家、允許省州、允許流量來源。
</step>

<step id="cloak-rules-logic-2">
安全頁類型分為「模板 (template)」和「自定義 (custom)」。選擇模板時，顯示兩級下拉選單讓用戶選擇安全頁模板；選擇自定義時，安全頁將直接跳轉至用戶指定的鏈結。
</step>

<step id="cloak-rules-logic-3">
安全頁面點擊行為分為「顯示內容 (show)」和「安全鏈接 (redirect)」。選擇顯示內容時，提供富文本編輯器；選擇安全鏈接時，提供 URL 輸入框。
</step>

## 4. 資料庫欄位對應

| 功能 | 欄位名稱 | 格式/範例 |
| :--- | :--- | :--- |
| 推廣域名 | `campaigns.theme` | `fyntro.lol` |
| 廣告落地頁 | `campaigns.money_page_id` | `template_id_xxx` |
| LINE 鏈結 | `campaigns.customer_links` | JSON `["https://line.me/xxx","https://line.me/yyy"]` |
| 鏈結策略 | `campaigns.routing_strategy` | `random` / `round_robin` / `ip_hash` |
| 允許客戶端 | `campaigns.allowed_devices` | JSON `["desktop","mobile"]` |
| 住宅 IP | `campaigns.require_residential` | Boolean `1` 或 `0` |
| TK 像素 | `campaigns.pixel_tk` | JSON `["id1","id2"]` |
| FB 像素 | `campaigns.pixel_fb` | JSON `["940592681819066"]` |
| GA 像素 | `campaigns.pixel_ga` | JSON `["GA-xxx","GA-yyy"]` |
| Google 廣告 | `campaigns.pixel_google_ad` | JSON `[{"ad_id":"5","conv_id":"6"}]` |
| 廣告狀態 | `campaigns.status` | `active` / `inactive` |
| 黑名單規則 | `campaigns.blacklist_rules` | JSON `[{"type":"ip_equals","value":"1.2.3.4"}]` |
| 斗篷規則 | `campaigns.cloak_*` | `cloak_lang`, `cloak_os`, `cloak_os_version`, `cloak_country`, `cloak_region`, `cloak_traffic_source` |
| 安全頁類型 | `campaigns.safe_page_type` | `template` / `custom` |
| 安全頁 ID | `campaigns.safe_page_id` | `template_id_yyy` |
| 安全頁行為 | `campaigns.safe_page_action` | `show` / `redirect` |
| 安全頁內容 | `campaigns.safe_page_content` | HTML 或 URL |

## 5. 提交流程

<rule id="submit-logic">
提交時需驗證必填欄位：推廣域名 (`theme`)、廣告標題 (`name`)、廣告落地頁 (`money_page_id`)。將所有欄位組裝成 JSON 物件，呼叫 `POST /api/v1/campaigns` (新增) 或 `PUT /api/v1/campaigns/:id` (編輯)。後端在儲存時需將 JSON 物件轉換為字串存入 `TEXT` 類型的欄位。
</rule>

## 6. 驗收標準

<rule id="v1-7-acceptance-criteria">

1.  **推廣域名**：下拉選單能動態載入，已占用的域名顯示為灰色且不可選。
2.  **廣告落地頁**：兩級下拉選單能按國家正確分類並顯示模板。
3.  **LINE 鏈結**：支援多行輸入、批量新增及刪除功能。
4.  **多鏈結設置**：三種路由策略可正常切換與組合。
5.  **允許客戶端**：Checkbox 功能正常。
6.  **像素設定**：所有像素類型均支援多行新增與刪除。
7.  **廣告狀態**：上架/下架狀態可正常切換。
8.  **黑名單**：可新增、刪除多條件規則。
9.  **斗篷規則**：右欄的 6 個過濾規則功能正常，留空代表不限制。
10. **安全頁**：類型 (模板/自定義) 與點擊行為 (顯示內容/安全鏈接) 切換正常。
11. **資料儲存**：表單提交後，所有資料（包含 JSON 格式）能正確存入資料庫。
12. **編輯模式**：能正確載入並回填已儲存的廣告資料。
13. **部署**：程式碼 build 無錯誤，部署後線上功能一切正常。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-v1-5-add-ad-page-cmd.md](cloak-admin-v1-5-add-ad-page-cmd.md) | v1.5 版添加廣告頁面 UI 指令 |
| [cloak-admin-v1-9-domain-shortlink-cmd.md](cloak-admin-v1-9-domain-shortlink-cmd.md) | v1.9 版域名短鏈功能（擴展域名管理） |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 通用環境指令 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範 |
