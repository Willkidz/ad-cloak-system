---
title: "LIFF 多連結輪替與廣告代號雙支援需求規格"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-05"
summary: "定義 LIFF 多連結 IP Hash 輪替、廣告代號路徑解析、LIFF 管理介面的完整需求與技術規格。"
version: "v1.0"
id: "20260405-liff-multi-link-rotation"
type: spec
tags: [cloak-admin, shadow-cloak, line, cloaking, landing-page]
status: active
created: "2026-04-05"
updated: "2026-04-05"
project: cloak-admin
---
> **TL;DR**: 本需求規格定義五項核心功能：(1) 前台 LINE 連結欄位支援填入多個 LIFF 連結用於輪替分配到不同 LINE 帳號；(2) 同一 IP 用戶每次打開都跳到同一個 LINE 帳號（IP Hash 固定分配）；(3) 廣告代號雙支援（前台預設 + 路徑帶入，路徑優先）；(4) 新增 LIFF 管理介面；(5) 前台新增廣告時自動從 LIFF 連結對應 TAG、LIFF ID、LINE OA ID。

# LIFF 多連結輪替與廣告代號雙支援需求規格

---

## 一、需求背景

目前系統每個廣告（campaign）只能綁定一個 LIFF 連結，所有流量都導向同一個 LINE 帳號。為了分散風險並提高轉化率，需要支援多個 LIFF 連結輪替，讓流量分配到不同的 LINE OA（如 js、ms、cs、ls）。同時，廣告代號目前只能從前台手動填入，需要支援從臉書廣告連結路徑自動解析。

---

## 二、功能需求

### 2.1 多 LIFF 連結輪替

**需求描述**：前台廣告表單的 LINE 連結欄位改為支援填入多個 LIFF 連結，用於輪替分配到不同 LINE 帳號。

**技術規格**：

| 項目 | 規格 |
| :--- | :--- |
| 儲存方式 | campaigns 表新增 `liff_links` 欄位，JSON 陣列格式 |
| 前台 UI | 可新增/刪除多個 LIFF 連結輸入框 |
| 輪替策略 | IP Hash 固定分配（同 IP 永遠跳同一個 LIFF） |
| 向下相容 | 若 `liff_links` 為空，回退使用原有 `liff_id` 欄位 |

**IP Hash 演算法**：

```javascript
function ipHash(ip, count) {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % count;
}
```

### 2.2 廣告代號雙支援

**需求描述**：廣告代號支援兩種來源，路徑代號優先於前台預設代號。

| 方案 | 說明 | 範例 |
| :--- | :--- | :--- |
| 方案 A | 前台可以填預設廣告代號 | 在廣告表單中填入 `AS01` |
| 方案 B | 臉書廣告連結路徑可以帶廣告代號 | `https://kogane.online/AS01` |

**優先級**：路徑代號 > 前台預設代號

**路徑解析規則**：

```
URL: https://kogane.online/AS01?fbclid=xxx
pathname: /AS01
ad_code: AS01（取 pathname 第一段，去除前導斜線）
```

**判斷邏輯**：路徑第一段若匹配 `/^[A-Za-z]{1,4}\d{1,4}$/` 則視為廣告代號。

### 2.3 LIFF 管理介面

**需求描述**：前台新增 LIFF 管理頁面，顯示所有 LIFF 連結和 TAG 的對應關係。

**頁面功能**：

| 功能 | 說明 |
| :--- | :--- |
| 列表顯示 | 顯示所有 LIFF 連結、對應的 TAG、LINE OA ID、所屬組別 |
| 資料來源 | 從 `/api/v1/liff-options` 端點取得 |
| 搜尋過濾 | 支援按 TAG 或組別名稱搜尋 |

### 2.4 前台新增廣告自動對應

**需求描述**：前台新增廣告時不需要手動填 TAG、LIFF ID、LINE OA ID，這些從填入的 LIFF 連結自動對應。

**自動對應邏輯**：

1. 用戶在 LINE 連結欄位填入 LIFF URL（如 `https://liff.line.me/2009129136-BEXGdu4X`）
2. 系統從 URL 中提取 LIFF ID（`2009129136-BEXGdu4X`）
3. 查詢 `/api/v1/liff-options` 找到對應的 TAG 和 LINE OA ID
4. 自動填入表單的 `liff_id`、`line_oa_id` 欄位

---

## 三、影響範圍

### 3.1 前台（cloak-admin）

| 組件 | 變更 |
| :--- | :--- |
| `Campaigns.tsx` | LINE 連結欄位改為多 LIFF 輸入；自動對應 TAG/LIFF ID/LINE OA ID |
| `App.tsx` | 新增 LIFF 管理頁面路由 |
| `AppLayout.tsx` | 側邊欄新增 LIFF 管理導航項 |
| `pages/LiffManagement.tsx` | 新增 LIFF 管理頁面組件 |
| `lib/api.ts` | 新增 LIFF 管理相關 API 呼叫 |

### 3.2 後端 API（cloak-admin-api）

| 端點 | 變更 |
| :--- | :--- |
| `POST /api/v1/campaigns` | 支援 `liff_links` JSON 陣列欄位 |
| `PUT /api/v1/campaigns/:id` | 支援更新 `liff_links` |
| `GET /api/v1/campaigns` | 回傳包含 `liff_links` |
| `GET /api/v1/liff-options` | 已存在，無需修改 |

### 3.3 隱者斗篷（shadow-cloak）

| 功能 | 變更 |
| :--- | :--- |
| 路徑解析 | 從 pathname 解析廣告代號，優先於 campaigns 表的 `ad_code` |
| LIFF 輪替 | 從 `liff_links` 陣列中用 IP Hash 選擇一個 LIFF 連結 |
| 傳遞參數 | 把選中的 LIFF 連結傳給 money-page |

### 3.4 落地頁（money-page）

| 功能 | 變更 |
| :--- | :--- |
| CTA 按鈕 | 使用隱者斗篷傳來的 LIFF 連結（已選定的單一連結） |

### 3.5 資料庫

| 表 | 變更 |
| :--- | :--- |
| `campaigns` | 新增 `liff_links TEXT DEFAULT '[]'` 欄位 |

---

## 四、資料流程

```
用戶點擊臉書廣告 → https://kogane.online/AS01?fbclid=xxx
                         ↓
                  shadow-cloak 接收請求
                         ↓
              解析路徑 /AS01 → ad_code = "AS01"
              （若路徑無代號，使用 campaigns.ad_code）
                         ↓
              從 campaigns 取得 liff_links 陣列
              用 IP Hash 選擇一個 LIFF 連結
                         ↓
              代理 money-page，傳入選中的 liff_id 和 ad_code
                         ↓
              money-page CTA 按鈕 → https://liff.line.me/{selected_liff_id}?vid=xxx&ac=AS01
                         ↓
              用戶加入對應的 LINE OA
```

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-godview-liff-fusion-plan.md](shadow-cloak-godview-liff-fusion-plan.md) | LIFF 融合方案（本需求的基礎架構） |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書（UI 組件拆分） |
| [cloak-admin-liff-url-analysis.md](cloak-admin-liff-url-analysis.md) | LIFF URL 結構分析 |
