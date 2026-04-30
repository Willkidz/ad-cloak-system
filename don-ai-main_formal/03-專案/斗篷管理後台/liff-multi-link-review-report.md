---
title: "LIFF 多連結輪替與廣告代號雙支援 — 獨立複查報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-04-05"
summary: "獨立複查 LIFF 多連結 IP Hash 輪替、廣告代號雙支援功能的完整驗證報告。涵蓋資料庫、後端 API、前台、shadow-cloak、端到端資料流、邏輯一致性六大面向，全部通過，未發現功能性 Bug。"
id: "20260405-liff-multi-link-review"
type: "project-doc"
tags: [cloak-admin, shadow-cloak, cloudflare-d1, testing, line]
status: "active"
created: "2026-04-05"
updated: "2026-04-05"
version: "v1.0"
---

# LIFF 多連結輪替與廣告代號雙支援 — 獨立複查報告

**複查時間**：2026-04-05
**複查範圍**：LIFF 多連結 IP Hash 輪替、廣告代號路徑解析雙支援功能的全鏈路驗證
**複查方式**：獨立下載線上程式碼、直接查詢 D1 資料庫、模擬端到端資料流
**複查結論**：**全部通過，未發現功能性 Bug**

---

## 複查總覽

| 驗證項目 | 結果 | 說明 |
| :--- | :--- | :--- |
| 資料庫 campaigns 表 liff_links 欄位 | **通過** | cid=53, TEXT, 預設值 '[]' |
| 後端 API POST INSERT 語句 | **通過** | liff_links 在 INSERT 欄位列表和 bind 參數中 |
| 後端 API PUT UPDATE 語句 | **通過** | liff_links = ? 在 UPDATE SET 子句中 |
| 後端 API GET 返回資料 | **通過** | JSON.parse(row.liff_links) 正確解析 |
| 前台 Cloudflare Pages 部署 | **通過** | 2026-04-05T05:32:49, status: success |
| 前台頁面載入 | **通過** | admin.bexnua.store 正常載入，LIFF 管理導航項存在 |
| shadow-cloak 廣告代號正則 | **通過** | /^[A-Za-z]{1,4}\d{1,4}$/ 存在 |
| shadow-cloak djb2 IP Hash | **通過** | 完整的 djb2 hash 輪替邏輯存在 |
| shadow-cloak liff_links 讀取 | **通過** | SELECT 語句和 safeJsonParse 解析正確 |
| shadow-cloak → money-page 參數傳遞 | **通過** | liff_id 參數名一致 |
| money-page liff_id 讀取 | **通過** | url.searchParams.get("liff_id") 正確讀取 |
| 端到端資料插入和讀取 | **通過** | liff_links JSON 陣列正確存取 |
| IP Hash 固定性 | **通過** | 同 IP 100 次計算結果一致 |
| IP Hash 分佈均勻性 | **通過** | 3 個 LIFF 各 33.3% |
| 路徑代號優先級 | **通過** | 7/7 測試案例全部通過 |
| 欄位名一致性 | **通過** | API 寫入和 shadow-cloak 讀取的欄位名一致 |
| 參數名一致性 | **通過** | shadow-cloak 傳出和 money-page 讀取的參數名一致 |
| Fallback 邏輯 | **通過** | 空陣列、單一連結、null 值均有正確 fallback |

---

## 1. 資料庫驗證

透過 D1 API 執行 `PRAGMA table_info(campaigns)`，確認 campaigns 表結構。

**liff_links 欄位資訊**：

| 屬性 | 值 |
| :--- | :--- |
| cid | 53 |
| name | liff_links |
| type | TEXT |
| notnull | 0 |
| dflt_value | '[]' |
| pk | 0 |

campaigns 表共 54 個欄位，liff_links 是最後一個欄位（cid=53），預設值為空 JSON 陣列字串 `'[]'`，設計合理。

---

## 2. 後端 API（cloak-admin-api）驗證

透過 Cloudflare Workers API 下載線上實際運行的 cloak-admin-api 程式碼進行驗證。

**POST /api/v1/campaigns**（INSERT 語句）：liff_links 出現在 INSERT 欄位列表中，bind 參數使用 `JSON.stringify(body.liff_links || [])`，確保即使前端未傳送 liff_links 也不會報錯。

**PUT /api/v1/campaigns/:id**（UPDATE 語句）：liff_links = ? 出現在 UPDATE SET 子句中，bind 參數使用 `mJson("liff_links", existing.liff_links)`，支援部分更新（未傳送時保留既有值）。

**GET /api/v1/campaigns 和 GET /api/v1/campaigns/:id**：返回資料中包含 `liff_links: JSON.parse(row.liff_links || "[]")`，正確將資料庫中的 JSON 字串解析為陣列。

---

## 3. 前台（cloak-admin）驗證

**Cloudflare Pages 部署狀態**：

| 項目 | 值 |
| :--- | :--- |
| 專案名稱 | cloak-admin-frontend |
| 部署時間 | 2026-04-05T05:32:49.574268Z |
| 部署狀態 | success |
| 綁定域名 | admin.bexnua.store |

訪問 https://admin.bexnua.store 確認頁面正常載入，側邊欄包含「LIFF 管理」導航項，主內容區正常渲染。

**GitHub Actions 說明**：Deploy Cloudflare Workers workflow 顯示 failure，但實際的 Worker 部署步驟（Deploy Worker (production)）全部成功，失敗的僅是「Commit and push deployment record」步驟，原因是多個並行 job 同時 push 導致的 git 衝突，不影響實際部署。

---

## 4. 隱者斗篷（shadow-cloak）驗證

透過 Cloudflare Workers API 下載線上實際運行的 shadow-cloak 程式碼進行驗證。

**廣告代號路徑解析**：正則 `/^[A-Za-z]{1,4}\d{1,4}$/` 存在，路徑代號優先於 campaigns 表的預設 ad_code，邏輯正確。

**多 LIFF 連結 IP Hash 輪替**：完整的 djb2 hash 演算法存在，使用 `Math.abs(ipHashVal) % liffLinks.length` 計算索引，並有 `liffLinks[selectedIdx] || liffLinks[0]` 的 fallback。

**liff_links 讀取**：getCampaignConfigByHostname 函數的 SELECT 語句包含 liff_links 欄位，使用 safeJsonParse 安全解析。

**LIFF ID 提取**：使用正則 `/liff\.line\.me\/([\w-]+)/` 從 LIFF URL 中提取 LIFF ID，支援標準的 LINE LIFF URL 格式。

**money-page 參數傳遞**：`liff_id=${encodeURIComponent(liffId)}&ac=${encodeURIComponent(adCode)}`，參數名與 money-page 讀取的參數名完全一致。

---

## 5. 端到端資料流驗證

**測試 1 — 資料插入和讀取**：插入帶有 3 個 LIFF 連結的測試 campaign，透過 D1 API 和 cloak-admin-api 分別驗證讀取，liff_links JSON 陣列格式正確。

**測試 2 — IP Hash 固定性**：對 8 個不同 IP 進行 djb2 hash 計算，同一 IP 重複 100 次計算結果完全一致，確認 hash 的確定性。

**測試 3 — IP Hash 分佈均勻性**：對 4080 個 IP 進行測試（3 個 LIFF），分佈為 33.3% / 33.3% / 33.3%，完全均勻。

**測試 4 — 路徑代號優先級**：

| 場景 | campaign ad_code | 路徑 | 預期結果 | 實際結果 |
| :--- | :--- | :--- | :--- | :--- |
| 路徑代號覆蓋預設 | TS01 | /AS01 | AS01 | AS01 |
| 無路徑代號 | TS01 | / | TS01 | TS01 |
| 4 字母 4 數字 | TS01 | /AB1234 | AB1234 | AB1234 |
| 超長代號不匹配 | TS01 | /ABCDE12345 | TS01 | TS01 |
| 非代號路徑 | TS01 | /some-page | TS01 | TS01 |
| 無預設有路徑 | (空) | /AS01 | AS01 | AS01 |
| 無預設無路徑 | (空) | / | (空) | (空) |

全部 7/7 通過。

**測試 5 — API 讀取驗證**：透過 cloak-admin-api GET 端點讀取測試 campaign，liff_links 返回為正確的 JavaScript 陣列（非字串），確認 JSON.parse 正常工作。

---

## 6. 邏輯一致性驗證

**欄位名一致性**：cloak-admin-api 的 INSERT/UPDATE 語句使用 `liff_links`，shadow-cloak 的 SELECT 語句和 campaignConfig 物件也使用 `liff_links`，完全一致。

**參數名一致性**：shadow-cloak 傳給 money-page 的 URL 參數為 `t`, `vid`, `liff_id`, `ac`；money-page 讀取的參數為 `vid`, `liff_id`, `ac`（`t` 用於模板選擇），完全一致。

**IP Hash 範圍**：`Math.abs(ipHashVal) % liffLinks.length` 的結果範圍為 0 到 liffLinks.length-1，不會越界。

**Fallback 邏輯**：

| 場景 | liff_links | liff_id | 行為 | 最終 LIFF ID |
| :--- | :--- | :--- | :--- | :--- |
| 多連結 | [url1, url2, url3] | any | IP Hash 選擇 | 從 URL 提取 |
| 單一連結 | [url1] | any | idx=0 | 從 url1 提取 |
| 空陣列 | [] | "xxx" | 跳過 hash | xxx |
| null | null | "xxx" | fallback 到 [] | xxx |
| 全空 | [] | "" | 傳空字串 | money-page 預設值 |

所有場景都有正確的 fallback，不會出現未定義行為。

**Git 版本 vs 線上版本**：兩者的核心邏輯完全一致，差異僅為：Cloudflare 部署工具自動添加的 `__name22` 裝飾器、括號格式化差異（數學等價，已用 JavaScript 驗證）、以及註釋在線上版本被移除（正常的 build 行為）。

---

## 修復記錄

本次獨立複查**未發現任何功能性 Bug**，無需修復。

---

## 附註

**GitHub Actions Deploy Workers 失敗說明**：最近一次的 Deploy Cloudflare Workers workflow（run #23995130788）顯示 failure，但這是因為多個並行部署 job 在「Commit and push deployment record」步驟發生 git push 衝突。實際的 Worker 部署（Deploy Worker (production) 步驟）全部成功。建議在 workflow 中為 deployment record 的 push 添加重試邏輯或改為串行執行。
