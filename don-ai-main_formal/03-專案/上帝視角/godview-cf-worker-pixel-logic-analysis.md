---
title: "Cloudflare Worker 像素邏輯分析：BC 像素 vs 廣告像素"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "分析 Worker line-redirect 中 BC 像素（MASTER_PIXEL_MAP）與廣告像素（AD_MAP）的優先級邏輯。現況：DataTable 19 筆全為 type=master，AD_MAP 始終為空，所有請求均寫入 BC 像素。修正方式為在 DataTable 新增 type=ad 記錄，無需改 Worker 程式碼。"
id: "20260325-024356"
type: analysis
tags: [cloudflare-d1, cloudflare-workers, godview, line-redirect, pixel]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: Worker `line-redirect` 的像素分配採用「廣告像素優先，BC 像素保底」策略——先從 `AD_MAP[ad_code]` 取廣告專屬像素，若無則從 `MASTER_PIXEL_MAP[tag]` 取 BC 像素。但目前 n8n DataTable（ID: `vILi9V1mv3ouo6EM`）全部 19 筆資料的 type 均為 `master`，**無任何 `type=ad` 或 `type=group` 記錄**，導致 Config API 回傳的 `AD_MAP` 始終為空物件 `{}`，所有請求均寫入 BC 像素。這是配置問題而非程式碼缺陷——只需在 DataTable 新增 `type=ad` 的記錄（如 `code: CS01, pixel: 您的像素ID`），Worker 即自動切換為使用廣告像素。

# Cloudflare Worker 像素邏輯分析：BC 像素 vs 廣告像素

本報告釐清 Worker `line-redirect` 中「BC 像素」與「廣告像素」的區別，並分析目前寫入 D1 資料庫的邏輯是否正確。

---

## 像素定義與對應關係

根據 n8n Config API（Workflow ID: `UCRZ0YDp4ZERmgqk`）的邏輯，系統中存在兩種層級的像素：

### BC 像素（主要像素 / Master Pixel）

| 屬性 | 說明 |
| :--- | :--- |
| **來源** | n8n DataTable 中 `type="master"` 的資料 |
| **對應關係** | 與 `tag`（即子域名，如 `cs`, `js`, `ms`, `ls`）綁定 |
| **變數名稱** | Config API 中稱為 `MASTER_PIXEL_MAP` |
| **用途** | 作為該組別的預設或共用像素 |

### 廣告像素（Ad Pixel）

| 屬性 | 說明 |
| :--- | :--- |
| **來源** | n8n DataTable 中 `type="ad"` 或 `type="group"` 的資料 |
| **對應關係** | 與具體的 `ad_code`（如 `CS01`, `MS05`）綁定 |
| **變數名稱** | Config API 中稱為 `AD_MAP` |
| **用途** | 用於追蹤特定廣告活動的專屬像素 |

---

## DataTable 現況分析

經過查詢 n8n DataTable（ID: `vILi9V1mv3ouo6EM`），目前的資料狀況如下：

<boundaries id="datatable-status">

- **總筆數**：19 筆
- **資料分佈**：全部 19 筆資料的 `type` 都是 `"master"`
- **缺失資料**：**沒有任何一筆 `type="ad"` 或 `type="group"` 的資料**

此狀況導致 Config API 回傳的 `AD_MAP` 是一個空物件 `{}`。這並非系統錯誤，而是因為目前尚未在 DataTable 中配置任何廣告專屬的像素。

</boundaries>

---

## Worker 寫入 D1 邏輯分析

在 Worker 程式碼中，決定寫入哪個 `pixel_id` 的邏輯規則如下：

<rule id="pixel-priority-logic">

```javascript
// 1. 嘗試取得廣告像素 (AD_MAP)
const adInfo = adCode ? AD_MAP[adCode] || null : null;
const adPixels = adInfo && adInfo.pixels ? [...adInfo.pixels] : [];

// 2. 取得 BC 像素 (MASTER_PIXEL_MAP)
const masterPixel = MASTER_PIXEL_MAP[tag] || null;

// 3. 合併像素（廣告像素優先）
if (masterPixel && masterPixel.pixel) {
  const alreadyExists = adPixels.some((p) => p.pixel === masterPixel.pixel);
  if (!alreadyExists) {
    adPixels.push(masterPixel);
  }
}

// 4. 取第一個像素寫入 D1
const pixels = adPixels;
const firstPixel = pixels.length > 0 ? pixels[0] : { pixel: "", token: "" };
```

**優先級順序**：
1. **第一優先**：`AD_MAP[ad_code]`（廣告像素）
2. **第二優先**：`MASTER_PIXEL_MAP[tag]`（BC 像素）

</rule>

### 目前實際執行結果

由於 `AD_MAP` 為空，`adPixels` 初始為空陣列。程式會接著將 `masterPixel`（BC 像素）加入陣列中。最終，`firstPixel` 取到的**永遠是 BC 像素**。因此，目前寫入 D1 的 `pixel_id` 都是 BC 像素。

---

## 結論與修正建議

### 結論

Worker 的程式碼邏輯是**正確的**。它已經具備了「優先使用廣告像素，若無則退而使用 BC 像素」的機制。目前所有請求都寫入 BC 像素，是因為 n8n DataTable 中尚未配置任何廣告像素。

### 修正步驟

若希望特定 `ad_code`（例如 `CS01`, `MS05`）使用專屬的廣告像素，**不需要修改 Worker 程式碼**，只需在 n8n DataTable 中新增資料：

<step id="add-ad-pixel">

1. 進入 n8n DataTable（ID: `vILi9V1mv3ouo6EM`）。
2. 新增資料列，格式如下：

<example id="ad-pixel-record">

| 欄位 | 值 |
| :--- | :--- |
| `code` | `CS01` |
| `type` | `ad` |
| `pixel` | 您的廣告像素 ID |
| `token` | 您的廣告 CAPI Token |

</example>

3. 新增完成後，Config API 會自動將這些資料編入 `AD_MAP`。
4. Worker 在處理帶有 `?a=CS01` 的請求時，就會優先抓取並寫入這個廣告像素。

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-cf-worker-pixel-id-analysis.md`](godview-cf-worker-pixel-id-analysis.md) | Pixel ID 遺失問題調查（冷啟動競態條件） |
| [`godview-cf-worker-deploy-verify.md`](godview-cf-worker-deploy-verify.md) | Worker 部署驗證報告（含 BC 像素併入 D1 修復） |
| [`godview-capi-current.md`](godview-capi-current.md) | CAPI 回傳現況與像素合併方案 |
| [`godview-mapping-spec.md`](godview-mapping-spec.md) | ad_code 與 Meta 像素/CAPI Token 的映射規範 |
