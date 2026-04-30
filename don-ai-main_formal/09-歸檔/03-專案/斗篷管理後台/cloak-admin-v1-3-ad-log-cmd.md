---
title: "1. 後端（加 search 參數）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "cd cloak-admin-api"
status: "archived"
archived_reason: "歸檔：v1.3 廣告日誌頁面修改指令已完成執行"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [cloak-admin, cloaking]
created: 2026-03-25
updated: "2026-03-27"
---

```bash
# 1. 後端（加 search 參數）
cd cloak-admin-api
npx wrangler deploy

# 2. 前端
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```

---

## 九、驗收標準

| # | 驗收項目 | 預期結果 |
| :--- | :--- | :--- |
| 1 | 打開廣告日誌頁面 | 顯示「廣告日誌」標題 + 5 個 Tab |
| 2 | 「全部日誌」Tab | 顯示所有記錄，有序號欄，每頁 20 筆 |
| 3 | 「訪問日誌」Tab | 目前顯示「暫無數據」（沒有 money 記錄） |
| 4 | 「按鈕點擊」Tab | 顯示「按鈕點擊數據來源為火鳥系統，暫無數據」 |
| 5 | 「安全內頁點擊」Tab | 顯示「安全內頁點擊數據來源為火鳥系統，暫無數據」 |
| 6 | 「斗篷攔截」Tab | 顯示 verdict=safe 的記錄，狀態欄紅色「斗篷攔截」標籤 |
| 7 | 攔截原因 | 顯示中文，如「瀏覽器語言不允許:FR」、「ASN黑名單攔截:8075」 |
| 8 | 搜索框 | 輸入 IP 可搜索，按 Enter 或點搜索按鈕觸發 |
| 9 | 分頁 | 底部顯示「共 XX 條記錄」+ 頁碼按鈕 + 跳頁輸入框 |
| 10 | 刷新按鈕 | 點擊可重新載入數據 |
| 11 | 表格 9 欄 | 序號、訪問時間、訪問域名/訪問來源、國家/訪問IP、訪客ID、語言、設備(UA)、狀態、日誌(攔截原因) |
| 12 | build 零錯誤 | `npm run build` 無 error |
