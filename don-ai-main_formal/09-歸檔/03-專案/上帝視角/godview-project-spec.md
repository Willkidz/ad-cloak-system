---
title: "上帝視角 — 專案說明文件"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "**更新日期：2026年3月15日**"
status: "archived"
archived_reason: "歸檔：舊版專案說明文件，已由最新版本取代"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

# 上帝視角 — 專案說明文件

**更新日期：2026年3月15日**
**作者：Manus AI**

---

## 1. 整體架構

本專案「上帝視角 (GodView)」是一套廣告歸因與數據追蹤系統，由以下三大組件構成：

| 組件 | 用途 | 技術 |
|:---|:---|:---|
| **Cloudflare Worker** | 落地頁跳轉中繼、Token 生成、歸因追蹤 | JavaScript (Worker) |
| **n8n 自動化** | Token 比對歸因、CAPI 回傳、LINE Webhook 處理 | n8n Cloud |
| **Google Sheets** | 廣告消耗記錄、成效分析、鏈結管理 | Google Sheets |

### 數據流向

```text
FB廣告 → 火鳥落地頁 → freshpathlab Worker(生成Token) → LINE oaMessage
                                                              ↓
                                                    用戶加LINE好友
                                                              ↓
                                                    LINE Webhook → n8n
                                                              ↓
                                                    Token比對歸因 → CAPI回傳
                                                              ↓
                                                    Google Sheets(添加數據)
```

---

## 2. n8n DataTable 結構

### `ad_config`（精簡版，ID: ICxZmq8e0vPZHX5j）

純歸因用途，只有 3 個欄位：

| 欄位 | 說明 | 範例 |
|:---|:---|:---|
| `code` | 廣告代號，放在鏈結 `?a=` 後面 | 01, 02 |
| `pixel` | Facebook Pixel ID | 1234567890 |
| `token` | CAPI Access Token | EAA... |

### `line_config`（ID: aL6JTLjrpNXf8aKM）

LINE 帳號設定，24 筆資料：

| 欄位 | 說明 | 範例 |
|:---|:---|:---|
| `tag` | 子域名標籤 | cx, jx, bf, n20 |
| `line` | LINE 帳號 ID | @697jsdma |
| `name` | LINE 帳號名稱 | 獨角仙AI算牌系統 |
| `who` | 負責人 | C, J, L, M |
| `msg` | 自訂歡迎訊息 | (空=使用預設) |

### `godview_events`（ID: 9TFf8tCRvfXRstrS）

事件記錄表，記錄所有歸因事件。

### `project_config`（ID: WVkaID8U6NtKrIvT）

專案設定表（與 line_config 功能部分重疊，待評估是否保留）。

---

## 3. Google Sheets 報表結構

**文件名稱**：廣告數據追蹤
**URL**：https://docs.google.com/spreadsheets/d/1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I

### 分頁 1：`3月消耗`（sheetId=100）

水平日期展開的消耗記錄表。每月一個分頁。

| 欄位 | 說明 | 填寫方式 |
|:---|:---|:---|
| code | 廣告代號（與 n8n ad_config 的 code 一致） | 一次性填寫 |
| 廣告帳戶ID | Facebook 廣告帳戶 ID | 一次性填寫 |
| 素材名稱 | 廣告素材名稱 | 一次性填寫 |
| 人員 | 負責人代號 | 一次性填寫 |
| 類型 | 廣告類型 | 一次性填寫 |
| 落地頁 | 火鳥落地頁域名 | 一次性填寫 |
| ads | 指紋瀏覽器編號 | 一次性填寫 |
| BM ID | Business Manager ID | 一次性填寫 |
| 卡 | 卡號/卡別 | 一次性填寫 |
| 狀態 | 進行中/暫停/已封存/帳號停用 | 下拉選單 |
| 本月合計 | 自動加總（SUM 公式） | 自動計算 |
| 3/1 ~ 3/31 | 每日消耗金額(USD) | **每日手動填寫** |

### 分頁 2：`成效`（sheetId=200）

成效儀表板，用於分析各廣告的投放效果。

| 欄位 | 說明 |
|:---|:---|
| code | 廣告代號 |
| 廣告帳戶ID | 廣告帳戶 |
| 素材名稱 | 素材名稱 |
| 狀態 | 廣告狀態 |
| 區間消耗 | 選定日期範圍內的總消耗 |
| 區間成果 | 人員手動填寫的 FB 廣告成果數 |
| 區間添加 | n8n 自動寫入的真實 LINE 添加數 |
| 區間流失 | 成果 - 添加 |
| 添加占比 | 添加 / 成果 |
| 單次添加 | 消耗 / 添加 |
| 單次成果 | 消耗 / 成果 |

### 分頁 3：`鏈結產生器`（sheetId=300）

方便上廣告時快速複製鏈結。

| 欄位 | 說明 |
|:---|:---|
| LINE帳號 | LINE 帳號 ID |
| LINE名稱 | LINE 帳號名稱 |
| tag | 子域名標籤 |
| code | 廣告代號 |
| 產生的鏈結 | `https://{tag}.freshpathlab.com/?a={code}` |

---

## 4. 重要決策與原因

| 決策 | 原因 |
|:---|:---|
| n8n 只保留歸因必要欄位 | 保持系統單純，避免維護複雜度 |
| `code` 用數字編號（01, 02...） | 簡短好記，適合大量廣告帳戶 |
| 消耗表用水平日期展開 | 沿用團隊習慣，每日只需填一個數字 |
| 每月一個消耗分頁 | 避免列數爆炸，保持表格可讀性 |
| `code` 作為 n8n 和 Excel 的唯一橋樑 | 統一識別碼，簡化數據串接 |
| 成效表用垂直 + 篩選器 | 支持 50+ 廣告帳戶的排序和篩選 |

---

## 5. 已完成任務清單

- [x] Cloudflare Worker 部署（Token 歸因系統）
- [x] n8n Token Attribution System 工作流程
- [x] n8n Config API 工作流程
- [x] n8n DNS Auto-Sync 工作流程
- [x] line_config DataTable（24 筆 LINE 帳號）
- [x] ad_config DataTable 精簡版（code, pixel, token）
- [x] Google Sheets「3月消耗」分頁（含 2 筆範例數據）
- [x] Google Sheets「成效」分頁（標題行已建立）
- [x] Google Sheets「鏈結產生器」分頁（含所有 LINE x code 組合）

---

## 6. 待辦事項

- [ ] 修復 Token Attribution System 中 `Save Token Match Event` 的 `project` 欄位 bug
- [ ] 建立 n8n 定時工作流程：每日從 godview_events 抓取添加數寫入成效分頁
- [ ] 建立 n8n 定時工作流程：每月自動建立新的消耗分頁
- [ ] 填入 ad_config 的 pixel 和 token 欄位
- [ ] 評估是否保留 project_config DataTable
- [ ] 清理 godview_conversion_report 和 godview_ad_status（空表）
- [ ] 成效分頁的日期範圍篩選功能實作

---

## 7. 關鍵細節與注意事項

1. **ad_config 的 code 欄位**：必須與 Google Sheets 消耗表的 code 欄位完全一致，這是串接的唯一橋樑。
2. **鏈結格式**：`https://{tag}.freshpathlab.com/?a={code}`，tag 來自 line_config，code 來自 ad_config。
3. **火鳥落地頁**：由第三方廠商提供，我們無法干涉落地頁參數，只能新增代碼。
4. **廣告帳戶死亡後**：落地頁鏈結可能被轉移到其他廣告帳戶使用，code 不變但背後的 ad_account 會換。
5. **n8n DataTable API**：不支援刪除欄位（DELETE column 回傳 404），需要建新表遷移。
6. **n8n DataTable 插入行**：必須使用 `{"data": [...]}` 格式。
