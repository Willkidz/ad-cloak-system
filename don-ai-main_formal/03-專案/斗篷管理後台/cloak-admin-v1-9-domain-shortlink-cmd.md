---
title: "修改指令 v1.9：域名/短鏈頁面實作（解析、管理、防封短鏈）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "實作斗篷管理後台 v1.9 版「域名/短鏈」頁面，包含三個核心 Tab：域名解析（Cloudflare Zone/DNS/Worker 綁定）、域名管理（綁定/解綁、安全偵測）、防封短鏈（302 導向、隨機/自定義短碼）。"
version: "v1.0"
id: "20260328-cloak-v1-9-domain"
type: cmd
tags: [cloak-admin, cloudflare, cloudflare-workers, dns]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: v1.9 實作 `/domains` 頁面的三大功能。**域名解析**：透過 Cloudflare API 自動新增 Zone、設定 DNS A 記錄（指向 `5.104.83.138`）及 AAAA 記錄，並綁定 `shadow-cloak` Worker 路由。**域名管理**：管理已解析域名，支援「綁定/解綁」廣告活動及 Google Safe Browsing 安全偵測。**防封短鏈**：建立 302 導向短網址，支援隨機生成或自定義短碼，資料存儲於 D1 `short_links` 表。

# 修改指令：v1.9 域名短鏈頁面

## 1. 背景與目標

目前斗篷管理後台的「域名/短鏈」頁面（路由 `/domains`）為 v1.6 版建立的空白佔位頁面。本次任務目標是將其完整功能實作出來，包含三個主要功能分頁：**域名解析**、**域名管理**、**防封短鏈**。

<rule id="ui-style-v1-9">
頁面所有 UI 風格、顏色、尺寸等，皆需完全遵循火鳥系統的設計規範。詳細規範請參考通用環境指令。
</rule>

## 2. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 通用環境指令，定義開發環境與規範 |
| [cloak-admin-v1-7-add-ad-logic-cmd.md](cloak-admin-v1-7-add-ad-logic-cmd.md) | v1.7 版廣告邏輯，引用此處的域名管理數據 |

## 3. 檔案修改清單

| 專案 | 檔案路徑 | 說明 |
| :--- | :--- | :--- |
| 前端 | `src/pages/Domains/index.tsx` | 域名/短鏈頁面主組件，實作三個 Tab 的 UI 與邏輯。 |
| 前端 | `src/api/index.ts` | 新增域名和短鏈相關的 API 呼叫函式。 |
| 後端 | `src/routes/domains.ts` | 修改或擴充域名相關 API，包含 Cloudflare API 串接。 |
| 後端 | `src/routes/shortlinks.ts` | 新增短鏈的 CRUD API。 |
| 後端 | `src/index.ts` | 註冊新的後端路由。 |

## 4. 資料庫結構變更

請於 D1 資料庫中執行以下 SQL 指令，以建立 `domains` 與 `short_links` 兩個新資料表。

### 4.1. `domains` 表（域名管理）

```sql
CREATE TABLE domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  zone_id TEXT,
  status TEXT DEFAULT 'active',    -- active (已綁定) / inactive (已解綁)
  ssl_status TEXT,                  -- SSL 證書狀態
  note TEXT,                        -- 備註
  safety_status TEXT,               -- safe / unsafe / unknown
  safety_checked_at TEXT,           -- 上次安全檢查時間
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2. `short_links` 表（防封短鏈）

```sql
CREATE TABLE short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  code TEXT NOT NULL,
  target_links TEXT,               -- JSON: 客服連結陣列
  status TEXT DEFAULT 'active',    -- active / inactive
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain, code)
);
```

## 5. 前端實作細節

請修改 `src/pages/Domains/index.tsx` 檔案，實作以下三個 Tab 的完整功能與邏輯。

### 5.1. Tab 1：域名解析

<rule id="domain-parsing-desc">
**功能說明**：此功能用於將新域名加入系統。流程包含在 Cloudflare 帳號中新增 Zone（若域名尚未加入）、設定 DNS A 記錄指向 Cloudflare Proxy，並綁定 `shadow-cloak` Worker Route。
</rule>

<step id="domain-parsing-ui-steps">

1. **頂部**：一個輸入框（Placeholder 為「請輸入域名」）與一個「解析域名」按鈕（紫色主按鈕）。
2. **表格欄位**：序號、域名、狀態（正常/未生效）、描述、操作。
3. **狀態標籤**：
   - 「正常」：綠色標籤 (`bg-green-100 text-green-600`)。
   - 「未生效」：紅色標籤 (`bg-red-100 text-red-600`)。
4. **描述顯示**：狀態為「未生效」的域名，描述應顯示「當前域名未設置正確的DNS服務器，DNS解析服務未生效」以及正確的 DNS 伺服器位址（例如 `kami.ns.cloudflare.com`、`peyton.ns.cloudflare.com`）。
5. **操作欄**：提供「檢查狀態」的藍色文字按鈕。

</step>

### 5.2. Tab 2：域名管理

<rule id="domain-management-desc">
**功能說明**：管理所有已解析的域名，使用者可透過此介面控制哪些域名能被廣告活動選用（綁定/解綁），並提供域名安全偵測功能。
</rule>

<step id="domain-management-ui-steps">

1. **頂部**：一個輸入框（Placeholder 為「請輸入域名」）與一個「綁定域名」按鈕（紫色主按鈕）。
2. **表格欄位**：序號、ID、域名、SSL證書（狀態）、備註（可編輯圖示）、狀態（已開啟/已關閉）、操作（已綁定/解綁）。
3. **「綁定域名」操作**：點擊按鈕後，應彈出下拉選單，列出在「域名解析」Tab 中已解析但尚未綁定的域名，供使用者選擇並綁定。
4. **操作欄**：
   - 若域名已綁定，則顯示綠色的「已綁定」文字與一個紅色的「解綁」按鈕。
   - 域名解綁後，不應再出現於廣告活動的連結下拉選單中。

</step>

### 5.3. Tab 3：防封短鏈

<rule id="shortlink-desc">
**功能說明**：提供短網址服務。使用者可選擇一個已綁定的域名，並設定一組短碼，以生成短鏈。此短鏈在被點擊後，會以 302 重新導向至指定的客服連結（如 LINE）。
</rule>

<example id="shortlink-modal-spec">
**新增短鏈彈窗（Modal）配置：**
- **狀態**：提供「開啟/關閉」的 Toggle 開關。
- **名稱**：必填輸入框。
- **短鏈域名**：下拉選單，列出 `domains` 表中 `status='active'` 的所有域名。
- **客服鏈接**：多行輸入框，提供「+ 批量」按鈕，且每行都有 `[+]` 和 `[-]` 按鈕以增刪欄位。
- **分隔線文字**：顯示「下面方式二選一 [隨機生成] 或 [自定義]」。
- **短鏈位數**：數字輸入框，用於設定隨機生成短碼的位數（例如輸入 4 即生成 4 位短碼）。
- **自定義短碼**：文字輸入框，用於手動指定短碼（例如 `axxx`）。
</example>

## 6. 後端 API 實作細節

### 6.1. 域名解析 API (`src/routes/domains.ts`)

<boundaries id="cloudflare-api-v1-9">
**Cloudflare API 資訊**：
- Account ID: `b2471e0c307123945bdf1ce1b025563f`
- API Token: **必須從環境變數讀取**，禁止硬編碼。
</boundaries>

<step id="domain-api-steps">

1. **`GET /api/v1/domains/zones`**：呼叫 Cloudflare API 列出 zones，排除系統域名（`bexnua.store`、`freshpathlab.com`、`raxnto.shop`），映射狀態為「正常/未生效」。
2. **`POST /api/v1/domains/zones`**：
   - 呼叫 Cloudflare API 新增 zone。
   - 自動設定 DNS A 記錄：`@` -> `5.104.83.138` (proxied: true)。
   - 自動設定 AAAA 記錄：`@` -> `100::` (proxied: true)。
   - 自動綁定 `shadow-cloak` Worker route：`domain.com/*` 與 `www.domain.com/*`。
3. **`POST /api/v1/domains/zones/:zoneId/check`**：取得最新 Cloudflare 狀態。

</step>

### 6.2. 域名管理 API (`src/routes/domains.ts`)

<step id="domain-mgmt-api-steps">

1. **`GET /api/v1/domains`**：從 `domains` 表撈取 `active` 紀錄，並標記 `campaigns` 表中的占用狀態。
2. **`POST /api/v1/domains/bind`**：在 `domains` 表新增紀錄。
3. **`PUT /api/v1/domains/:id/unbind`**：更新狀態為 `inactive`。**注意**：若廣告活動正在使用，應攔截並報錯。
4. **`POST /api/v1/domains/:id/safety-check`**：呼叫 Google Safe Browsing API 檢查域名安全性。

</step>

### 6.3. 防封短鏈 API (`src/routes/shortlinks.ts`)

<step id="shortlink-api-steps">

1. **`GET /api/v1/shortlinks`**：分頁列出短鏈。
2. **`POST /api/v1/shortlinks`**：新增短鏈。若無短碼則隨機生成。回傳格式 `https://{domain}/{code}`。
3. **`PUT /api/v1/shortlinks/:id`**：編輯短鏈。
4. **`DELETE /api/v1/shortlinks/:id`**：刪除短鏈。

</step>

## 7. 驗收標準

<rule id="v1-9-acceptance-criteria">

1. **域名解析**：輸入域名後，自動完成 Cloudflare Zone/DNS/Worker 綁定，表格顯示正確狀態。
2. **檢查狀態**：點擊按鈕能即時更新 Cloudflare 最新狀態。
3. **域名管理**：成功綁定/解綁。解綁後廣告活動下拉選單不再出現該域名。
4. **新增短鏈**：彈窗功能正常，支援隨機/自定義短碼，客服連結支援批量新增。
5. **短鏈列表**：正確顯示完整 URL，複製功能正常。
6. **部署驗證**：`npm run build` 無錯誤，前後端部署後線上功能正常。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 通用環境指令 |
| [cloak-admin-v1-7-add-ad-logic-cmd.md](cloak-admin-v1-7-add-ad-logic-cmd.md) | 廣告邏輯指令 |
