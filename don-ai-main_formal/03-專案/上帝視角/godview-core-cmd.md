---
title: "上帝視角｜核心指令與操作規範（精簡版）"
category: project
priority: critical
applicable_tools: all
last_updated: 2026-03-30
summary: "定義「上帝視角」專案的核心指令、系統架構、關鍵憑證（Google Sheets ID, n8n Workflow ID, DataTable ID）及 AI 操作守則，旨在以最低 token 消耗實現高效率自動化。"
id: "20260328-godview-core-cmd"
type: cmd
tags: [architecture, cloudflare-workers, credentials, godview, n8n]
status: active
created: 2026-03-25
updated: 2026-03-30
---

> **TL;DR**: 本文件是 AI Agent 在「上帝視角」專案中的最高行動指南。核心原則為「**消耗積分降到最低**」與「**數據為王**」。啟動任務時必須先讀取 don-ai `.ai/memory.md` 與 `.ai/active-context.md` 獲取專案記憶。嚴禁詢問用戶已知憑證或已解決問題。關鍵憑證包括：Google Sheets ID `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I`、n8n 核心 Workflow ID `dqbdnCN3xdJAahYQ`、及多個 DataTable ID（如 `ad_config`: `ICxZmq8e0vPZHX5j`）。

# 上帝視角｜核心指令（精簡版）

## 啟動程序

<step id="initialization">

任務開始時，立即讀取以下文件以獲取專案的已知資訊，包括結論、憑證和解決方案，從而直接展開工作，避免重複探索。

1. `.ai/memory.md` — 專案核心記憶與架構決策
2. `.ai/active-context.md` — 當前任務狀態與進度日誌
3. `.ai/error-log.md` — 已解決問題與錯誤模式

</step>

---

## 系統架構概覽

<boundaries id="system-architecture">

系統數據流如下：
`FB廣告 → 火鳥落地頁 → shadow-cloak Worker（記錄點擊、生成Token）→ D1 clicks 表 → LINE oaMessage → LINE Webhook → line-redirect Worker（CAPI回傳）→ D1 clicks 表（歸因匹配）`

| 組件 | 技術 | 職責 |
| :--- | :--- | :--- |
| **火鳥落地頁** | 第三方服務 | 廣告流量入口，負責嵌入追蹤腳本。 |
| **shadow-cloak Worker** | Cloudflare Workers | 根據訪問域名（hostname）識別廣告，記錄點擊日誌至 D1 clicks 表，生成歸因 Token，並透過 302 重定向將用戶導向 LINE。 |
| **D1 clicks 表** | Cloudflare D1 | 存儲所有點擊日誌，支援 Worker 直接讀寫。 |
| **line-redirect Worker** | Cloudflare Workers | 接收 LINE Webhook，執行 Token 比對歸因（45秒窗口），回傳 CAPI 事件至 Facebook，並更新 D1 clicks 表。 |
| **N8N 工作流** | N8N Cloud | 系統監控、CAPI Health Check、Config API 等輔助任務（非核心歸因路徑）。 |

</boundaries>

---

## 關鍵憑證快速查詢

<rule id="quick-reference-credentials">

| 項目 | 值 |
| :--- | :--- |
| **Google Sheets ID** | `1Zs1bZf7tOL7clOK-qQUQ8HeNqjlMwUV9ZzqXV4N0f1I` |
| **n8n 上帝視角_Time Attribution ID** | `dqbdnCN3xdJAahYQ` |
| **Cloudflare 歸因域名** | `*.freshpathlab.com` |
| **廣告識別方式** | 透過 hostname（域名）識別，查詢 campaigns 表 `WHERE theme = hostname AND status = 'active'` |
| **n8n ad_config DataTable ID** | `ICxZmq8e0vPZHX5j` |
| **n8n line_config DataTable ID** | `aL6JTLjrpNXf8aKM` |
| **D1 clicks 表** | 存儲所有點擊日誌與歸因結果 |
| **歸因鏈結格式** | `https://{tag}.freshpathlab.com/?a={code}`（舊格式，已改為 hostname 識別） |

</rule>

---

## AI 行為準則與禁止事項

<rule id="prohibited-actions">

**核心原則**：消耗積分降到最低。

| 禁止行為 | 替代方案 |
| :--- | :--- |
| **詢問用戶已知憑證** | 優先查詢 `.ai/memory.md` 或 `07-配置與環境/auth-info-config.md`。 |
| **詢問用戶已解決的問題** | 優先查詢 `.ai/error-log.md`。 |
| **使用客套話或冗言贅字** | 直接輸出具體結果，禁止回報「我現在要做什麼」。 |
| **刪除 n8n DataTable 欄位** | 建立新表並進行數據遷移（因 DELETE column 操作會回傳 404 錯誤）。 |
| **重複搜尋相同問題** | 優先查詢記憶庫。 |

</rule>

---

## 工具決策優先級

<rule id="tool-decision-priority">

| 任務 | 優先工具 | 預期效益 |
| :--- | :--- | :--- |
| **查詢廣告數據** | Meta Insights API | 節省 85% token，避免處理原始 CSV。 |
| **查詢 n8n 設定** | n8n API (`GET /api/v1/workflows/{id}`) | 直接獲取結構化 JSON。 |
| **查詢 Google Sheets** | gws CLI | 避免瀏覽器開啟，速度提升 300%。 |
| **查詢已知問題/憑證** | 查詢 don-ai `.ai/` 目錄 | 節省 100% token。 |

</rule>

---

## 記憶寫入機制

<rule id="memory-write-triggers">

> **已更新（ADR-003, 2026-03-30）**：記憶系統已從 manus-memory-api 遷移至 don-ai `.ai/` 目錄。

在以下情況發生時，必須立即將資訊寫入對應的 `.ai/` 文件：
- **解決新問題** → 追加到 `.ai/error-log.md`
- **發現新工具/更優方法** → 追加到 `.ai/system-patterns.md`
- **更新憑證或設定** → 更新 `07-配置與環境/auth-info-config.md`
- **系統架構變動** → 更新 `.ai/memory.md` 和 `.ai/system-patterns.md`
- **重要決策** → 追加到 `.ai/decision-log.md`

</rule>

---

## 任務結束自我覺察

<step id="self-reflection">

每次任務結束時，必須輸出以下內容：
```text
【自覺】
發現：[主動發現的問題或可優化點]
建議：[具體改善方法]
已更新 .ai/ 文件：是 / 否
建議更新指令：是 / 否
主動工具推薦：[工具名稱+省幾%+費用+建議環節]
```

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 詳細架構文件 v3 |
| [`godview-manus-project-cmd.md`](godview-manus-project-cmd.md) | Manus 專案專屬指令 |
| [`godview-api-tools-notes.md`](godview-api-tools-notes.md) | API 工具使用筆記 |
| [`07-配置與環境/auth-info-config.md`](../../07-配置與環境/auth-info-config.md) | 完整憑證清單 |
