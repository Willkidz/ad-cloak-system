---
title: "全行銷網站動態表單欄位功能報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-31"
version: "v1.0"
summary: "根據 SMM Panel 同行研究（HDZ Bulk、777fans、MarketerPanel），實現根據服務類型動態顯示不同下單表單欄位的功能。涵蓋 9 種服務類型的欄位定義、前後端修改清單（14 個文件、1,537 行新增）、D1 資料庫遷移腳本、前端動態渲染邏輯與後端驗證流程。"
id: "20260331-ail-dynamic-form-fields"
type: analysis
tags: [smm-panel, frontend, backend, api, database]
status: active
created: "2026-03-31"
updated: "2026-03-31"
---

> **TL;DR**: 本報告記錄了全行銷網站動態表單欄位功能的完整實作。根據 SMM Panel 行業標準，為 9 種服務類型定義了專屬的下單表單欄位（如 Comments 需要留言內容、Google Reviews 需要星級評分、Votes 需要選項編號）。修改了 14 個文件，新增 1,537 行程式碼，已 push 到 main 分支。

# 全行銷網站 - 動態表單欄位功能更新報告

## 一、任務摘要

根據 SMM Panel 同行網站（HDZ Bulk、777fans、KsD Shop、MarketerPanel）的研究，為全行銷網站實現了**根據服務類型動態顯示不同下單表單欄位**的功能。已成功 push 到 GitHub main 分支，Cloudflare 將自動部署。

---

## 二、同行研究結果

通過研究 HDZ Bulk (hdzbulk.com)、777fans.com 和 MarketerPanel 的 API 參數文檔，確認了 SMM Panel 行業標準的表單欄位模式：

| 服務類型 | 行業標準欄位 | 說明 |
|---------|------------|------|
| Followers / Likes / Views / Shares / Saves | link + quantity | 基本模式，填連結選數量 |
| Comments | link + comments | 需要提供留言內容（每行一條） |
| Reviews (Google Maps) | link + comments + rating | 商家連結 + 評論內容 + 星級（1-5） |
| Votes (投票) | link + quantity + answer_number | 投票連結 + 數量 + 選項編號 |
| Mentions (提及/標記) | link + quantity + usernames | 貼文連結 + 用戶名列表 |
| Posts (貼文代發) | link + comments | 帳號連結 + 貼文內容 |
| Accounts (帳號) | quantity | 只需要數量 |
| Packages (套餐) | link | 只需要連結 |
| Live Viewers / Traffic | link + quantity | 連結 + 數量（持續時間/國家已內建在服務名稱中） |

---

## 三、修改的文件清單

### 後端（apps/api）

| 文件 | 修改內容 |
|------|---------|
| `src/db/schema.sql` | categories 表新增 `required_fields TEXT` 欄位 |
| `src/db/migrate_v3.sql` | **新增** 遷移腳本，ALTER TABLE + 批量 UPDATE |
| `src/db/seed.sql` | 所有 662 條 INSERT 語句加入 `required_fields` 值 |
| `src/types/index.ts` | Category 新增 `required_fields`、OrderItem 新增 `extra_data`、CreateOrderRequest items 新增動態欄位 |
| `src/routes/categories.ts` | 所有 3 個 SELECT 查詢加入 `required_fields` |
| `src/routes/orders.ts` | 新增動態欄位驗證邏輯 + extra_data 儲存 + N8N payload 轉發 |
| `src/routes/webhooks.ts` | payment webhook 的 N8N payload 加入 `extra_data` |

### 前端（apps/web）

| 文件 | 修改內容 |
|------|---------|
| `src/lib/api.ts` | ServiceItem 新增 `required_fields` 屬性 |
| `src/lib/cart.ts` | 新增 `CartItemExtraData` 介面、`parseRequiredFields()` 函數 |
| `src/lib/constants.ts` | 新增 `FIELD_DEFINITIONS`（欄位定義）、`SERVICE_TYPE_LINK_LABELS`（連結標籤） |
| `src/components/OrderModal.tsx` | 完全重寫，根據 `required_fields` 動態渲染表單欄位 |
| `src/components/ServiceCatalog.tsx` | 完全重寫，內聯訂購表單支援動態欄位 |
| `src/app/checkout/page.tsx` | 更新 orderData 傳送 per-item extra data + 顯示留言/星級 |

---

## 四、資料庫變更

### 新增欄位

```sql
-- categories 表
ALTER TABLE categories ADD COLUMN required_fields TEXT DEFAULT '["link","quantity"]';

-- order_items 表
ALTER TABLE order_items ADD COLUMN extra_data TEXT;
```

### required_fields 格式

JSON 陣列，可用的欄位名稱：

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| `link` | text | 社群連結/帳號 |
| `quantity` | number | 數量 |
| `comments` | textarea | 留言/評論內容（每行一條） |
| `rating` | select | 星級評分（1-5） |
| `answer_number` | select | 投票選項編號 |
| `usernames` | textarea | 用戶名列表（每行一個） |
| `keywords` | textarea | 關鍵字列表 |
| `country` | select | 國家/地區選擇 |

### 部署步驟

在 Cloudflare D1 執行遷移：

```bash
wrangler d1 execute quan-marketing-db --file=./apps/api/src/db/migrate_v3.sql
```

---

## 五、前端表單行為

### 動態渲染邏輯

1. API 回傳每個 category 的 `required_fields` JSON 陣列
2. 前端 `parseRequiredFields()` 解析為 string[]
3. OrderModal 和 ServiceCatalog 根據陣列內容動態渲染對應的表單欄位
4. 每個欄位的標籤、placeholder、驗證規則都在 `FIELD_DEFINITIONS` 中定義

### 不同服務類型的表單示例

**一般服務（Followers/Likes/Views）**：帳號連結 (text input) + 數量 (number input)

**留言服務（Comments）**：貼文連結 (text input) + 留言內容 (textarea, 每行一條)

**Google 評論（Reviews）**：商家連結 (text input) + 評論內容 (textarea, 每行一條) + 星級評分 (select, 1-5 星)

**投票服務（Votes）**：投票連結 (text input) + 數量 (number input) + 投票選項 (select, 選項 1-6)

### 手機端適配

所有表單欄位使用 `w-full` 全寬佈局，textarea 使用 `resize-none` 防止意外拉伸，select 使用原生下拉選單確保觸控友好。OrderModal 使用 `max-h-[90vh]` + `overflow-y-auto` 確保長表單可滾動，ServiceCatalog 內聯表單在展開時有足夠間距。

---

## 六、後端驗證邏輯

orders.ts 的驗證流程：

1. 查詢 category 的 `required_fields` 和 `service_type`
2. 解析 required_fields JSON 陣列
3. 逐一驗證必填欄位：`link` 檢查 item.link 或 body.social_account 是否有值、`comments` 檢查 item.comments 是否有值、`answer_number` 檢查 item.answer_number 是否有值、`usernames` 檢查 item.usernames 是否有值
4. 構建 `extra_data` JSON 物件
5. 儲存到 order_items.extra_data 欄位
6. N8N webhook 轉發時解析並包含 extra_data

---

## 七、Git Commit

```
commit 9ac4fc4
feat: 動態表單欄位 - 根據 service_type 顯示不同下單欄位
14 files changed, 1537 insertions(+), 849 deletions(-)
```

已 push 到 `main` 分支，Cloudflare Pages 和 Workers 將自動觸發部署。

---

## 八、部署後注意事項

1. **必須執行 D1 遷移**：`wrangler d1 execute quan-marketing-db --file=./apps/api/src/db/migrate_v3.sql`
2. **清除 KV 快取**：部署後 categories API 的快取需要 5 分鐘自動過期，或手動清除 CACHE KV
3. **未來擴展**：如需新增欄位類型，只需在 `FIELD_DEFINITIONS` 中定義，並在 `required_fields` JSON 中引用即可

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [ail-ui-design-recommendation.md](ail-ui-design-recommendation.md) | UI 設計建議（下單流程相關） |
| [ail-delivery-report.md](ail-delivery-report.md) | 系統部署報告（前端頁面清單） |
| [ail-supplier-routing-table.md](ail-supplier-routing-table.md) | 供應商路由表（662 條服務對應） |
