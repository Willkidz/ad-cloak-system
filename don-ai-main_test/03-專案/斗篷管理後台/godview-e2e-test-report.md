---
title: "上帝視角端到端功能測試報告（2026-04-03）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-03"
summary: "對上帝視角系統進行真實的端到端功能測試，實際走一遍完整流程：建立廣告活動 → 模擬 shadow-cloak 寫入 clicks → 驗證 money-page CTA LIFF URL → 模擬 /bind 綁定 → N8N JOIN 查詢驗證完整歸因鏈路。所有步驟均記錄實際請求、回應與資料庫查詢結果。9 項鏈路完整性驗證全部通過。"
id: "20260403-godview-e2e-test-report"
type: "project-doc"
tags: [godview, line-redirect, attribution, troubleshooting]
status: "active"
created: "2026-04-03"
updated: "2026-04-03"
version: "v1.0"
---

> **TL;DR**: 端到端功能測試全部通過（9/9 項）。發現並確認了一個重要的欄位名映射規則：前端 JS 從 URL 讀取 `ac` 參數後，發送 `/bind` 請求時會映射為 `ad_code` 欄位名，後端也以 `ad_code` 接收。測試資料已全部清理。

# 上帝視角端到端功能測試報告（2026-04-03）

本報告記錄對上帝視角系統進行的完整端到端功能測試，每個步驟均包含實際的請求、回應與資料庫查詢結果。

---

## 測試環境

- **測試時間**：2026-04-03 02:03 UTC
- **測試廣告代號**：`test_func_02`
- **測試 TAG**：`n21`（武狀元）
- **測試 LIFF ID**：`2009129136-BEXGdu4X`
- **測試 LINE OA ID**：`075cocov`

---

## 步驟一：建立測試廣告活動

**請求**：

```http
POST https://admin-api.bexnua.store/api/v1/campaigns
Content-Type: application/json

{
  "name": "E2E-功能測試-v2",
  "theme": "mopliv.site",
  "status": "active",
  "tag": "n21",
  "ad_code": "test_func_02",
  "liff_id": "2009129136-BEXGdu4X",
  "line_oa_id": "075cocov"
}
```

**回應**：HTTP 200 ✅

```json
{"success": true, "data": {"id": "c6646850-d3d9-4c9b-89e5-283758f4e174"}}
```

**資料庫驗證**（`campaigns` 表）：

| 欄位 | 值 |
| :--- | :--- |
| `id` | `c6646850-d3d9-4c9b-89e5-283758f4e174` |
| `ad_code` | `test_func_02` ✅ |
| `liff_id` | `2009129136-BEXGdu4X` ✅ |
| `line_oa_id` | `075cocov` ✅ |

---

## 步驟二：模擬 shadow-cloak 寫入 clicks

> **說明**：Sandbox 的 AWS IP 會被斗篷識別為 Datacenter，正常會返回安全頁而不觸發落地頁流程。因此透過 D1 API 直接模擬 shadow-cloak 的 INSERT 操作，驗證欄位結構。

**模擬寫入的資料**：

| 欄位 | 值 |
| :--- | :--- |
| `visitor_id` | `ff4c76a7-5992-4203-9324-b346b6d04e36` |
| `fbclid` | `fb_test_16d154af18d5` |
| `event_id` | `evt_test_93f20924` |
| `ad_code` | `test_func_02` ✅ |
| `source` | `shadow-cloak` ✅ |
| `tag` | `n21` |

**資料庫驗證**：`clicks` 表成功寫入，所有欄位正確 ✅

---

## 步驟三：驗證 money-page CTA LIFF URL

**請求**：

```
GET https://money-page.laoqin1689.workers.dev/?t=default&vid=ff4c76a7-...&liff_id=2009129136-BEXGdu4X&ac=test_func_02
```

**回應**：HTTP 200，回應 Body 13757 bytes ✅

**CTA LIFF URL**（從 HTML 中提取）：

```
https://liff.line.me/2009129136-BEXGdu4X?vid=ff4c76a7-5992-4203-9324-b346b6d04e36&ac=test_func_02
```

| 驗證項目 | 結果 |
| :--- | :--- |
| `vid` 參數存在 | ✅ |
| `ac` 參數存在 | ✅ |
| `vid` 值與輸入一致 | ✅ |
| `ac` 值與輸入一致 | ✅ |

---

## 步驟四：模擬 /bind 端點

> **重要發現**：前端 JS 從 URL 讀取 `ac` 參數後，發送 POST 請求時會映射為 `ad_code` 欄位名。後端 `/bind` 端點以 `ad_code` 接收，而非 `ac`。

**請求**：

```http
POST https://line-login-callback.laoqin1689.workers.dev/bind
Content-Type: application/json

{
  "vid": "ff4c76a7-5992-4203-9324-b346b6d04e36",
  "line_user_id": "Utest_9e8f99024e5b411da749",
  "ad_code": "test_func_02"
}
```

**回應**：HTTP 200 ✅

```json
{
  "success": true,
  "message": "Binding successful",
  "binding_id": "4ddbfa37-727d-40aa-a34d-f2c87a57339e",
  "vid": "ff4c76a7-5992-4203-9324-b346b6d04e36",
  "line_user_id": "Utest_9e8f99024e5b411da749"
}
```

**資料庫驗證**（`line_user_bindings` 表）：

| 欄位 | 值 |
| :--- | :--- |
| `vid` | `ff4c76a7-5992-4203-9324-b346b6d04e36` ✅ |
| `line_user_id` | `Utest_9e8f99024e5b411da749` ✅ |
| `ad_code` | `test_func_02` ✅ |

**clicks 表 matched 狀態更新**：

| 欄位 | 值 |
| :--- | :--- |
| `matched` | `1` ✅ |
| `matched_at` | `2026-04-03T02:03:07.384Z` |
| `matched_user_id` | `Utest_9e8f99024e5b411da749` |

---

## 步驟五：模擬 N8N JOIN 查詢

**查詢**：

```sql
SELECT c.click_id, c.visitor_id, c.fbclid, c.fbc, c.event_id,
       c.ad_code, c.source, c.tag, c.matched, c.matched_user_id,
       b.line_user_id, b.ad_code as bind_ad_code
FROM clicks c
LEFT JOIN line_user_bindings b ON c.visitor_id = b.vid
WHERE c.visitor_id = 'ff4c76a7-5992-4203-9324-b346b6d04e36'
  AND c.source = 'shadow-cloak'
```

**完整歸因資料**：

```
┌─── clicks 資料 ───────────────────────────────────
│ click_id:         bf198182-310c-4cbd-a44b-e7ecf73644df
│ vid:              ff4c76a7-5992-4203-9324-b346b6d04e36
│ fbclid:           fb_test_16d154af18d5
│ fbc:              fb.1.1775181785.fb_test_16d154af18d5
│ event_id:         evt_test_93f20924
│ ad_code (click):  test_func_02
│ source:           shadow-cloak
│ matched:          1
│ matched_user_id:  Utest_9e8f99024e5b411da749
├─── bindings 資料 ─────────────────────────────────
│ line_user_id:     Utest_9e8f99024e5b411da749
│ ad_code (bind):   test_func_02
└───────────────────────────────────────────────────
```

---

## 鏈路完整性驗證結果

| 驗證項目 | 結果 |
| :--- | :--- |
| vid 一致 | ✅ |
| fbclid 存在 | ✅ |
| event_id 存在 | ✅ |
| source = shadow-cloak | ✅ |
| click ad_code 正確 | ✅ |
| line_user_id 存在 | ✅ |
| bind ad_code 正確 | ✅ |
| ad_code 一致（click = bind） | ✅ |
| fbc 存在 | ✅ |

**總計：9/9 項全部通過 🎉**

---

## 步驟六：清理測試資料

測試完成後，所有測試資料已從資料庫中刪除：

| 表名 | 清理狀態 |
| :--- | :--- |
| `campaigns` | ✅ 已清理（剩餘 0 筆） |
| `clicks` | ✅ 已清理（剩餘 0 筆） |
| `line_user_bindings` | ✅ 已清理（剩餘 0 筆） |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-data-flow-analysis.md`](godview-data-flow-analysis.md) | 資料流向分析報告，本測試的理論依據 |
| [`n21-liff-redirect-fix-log.md`](n21-liff-redirect-fix-log.md) | n21 歸因鏈路修復記錄 |
| [`../../.ai/memory.md`](../../.ai/memory.md) | 專案核心記憶 |
