---
title: "斗篷管理後台專案核心總覽 (Soul)"
category: project
priority: critical
applicable_tools: all
last_updated: "2026-03-29"
summary: "A 規劃組維護的專案管理中樞，記錄 v1.0–v1.11.0 共 20+ 版本迭代、12 筆問題排查紀錄（含根因與修復方式）、7 個 N8N Active Workflow 配置（含 ID 與觸發方式）、Token 集中管理機制、GitHub Repos、以及研究文檔索引。"
version: "v1.0"
id: "20260325-cloak-admin-soul"
type: spec
tags: [changelog, cloak-admin, credentials, n8n, planning, telegram]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文檔是斗篷管理後台的核心管理中樞（Soul），由 A 規劃組負責維護。專案採用「指令驅動開發」模式——規劃組撰寫指令文件，技術組執行。文檔記錄了從 v1.0（專案初始化、D1 建表、8 個初始指令）到 v1.11.0（36 個 Bug 全面修復、前端完整重建）的完整版本歷史，包含 12 筆問題排查紀錄（如 N8N `$helpers.crypto` 導致 CAPI 從未送出、shadow-cloak D1 binding 改用 `env.DB.prepare()`、freshpathlab.com Worker 路由缺失等）。N8N 部分記錄了 7 個 Active Workflow（CAPI Health Check / Time Attribution / 系統監控 / Config API / DNS Auto-Sync / Admin API / 一鍵更新Token）及其 ID 與觸發方式，以及 Cloudflare API Token、Telegram Bot Token（`8676944081:AAF...`）、Chat ID（`7495585445`）等憑證的集中管理機制。

# 斗篷管理後台專案核心總覽 (Soul)

## 身份與職責

<rule id="role-definition">

- **本 Manus 為 A 規劃組**，負責斗篷後台專案的規劃、指令撰寫、版本管理
- 不自己開發，撰寫指令給技術組執行
- 指令要分版本、分開給，每份指令搭配通用環境指令使用

</rule>

---

## 專案版本紀錄

### 已完成版本

| 版本 | 內容 | 規劃組 | 執行技術組 | 狀態 |
| :--- | :--- | :--- | :--- | :--- |
| v1.0 指令一~八 | 專案初始化、D1建表、全局佈局、素材中心、廣告製作、添加廣告、廣告日誌、後端API、前後端串接部署 | A規劃組 | — | ✅ 完成，上線 admin.bexnua.store |
| v1.1 | 修復六個問題（首頁儀表板、廣告編輯/複製/刪除/鏈結按鈕、新增安全頁） | A規劃組 | — | ✅ 完成 |
| v1.2 | 素材中心擴充四個Tab（採集新增、ZIP上傳、自定義新增、系統主題） | A規劃組 | — | ✅ 完成 |
| react-quill 修復 | react-quill 換成 react-quill-new（支援 React 18） | A規劃組 | — | ✅ 完成 |
| Monaco 修復 | 源碼編輯器從 Monaco 改為 textarea（避免 CDN 依賴） | A規劃組 | — | ✅ 完成 |
| v1.4 | CodeMirror 升級：textarea 升級為 CodeMirror（行號+語法高亮+深色主題） | A規劃組 | — | ✅ 完成 |
| v1.5 | 添加廣告頁面重構（對齊火鳥版面+像素設置） | A規劃組 | 技術組執行中→完成 | ✅ 完成 |
| v1.6 | 素材操作按鈕改為文字按鈕 + 域名短鏈和系統設定佔位路由 | A規劃組 | — | ✅ 完成 |
| v1.7 | 添加廣告頁面功能邏輯（8 個功能區塊串接，B規劃組已完成UI） | A規劃組 | 技術組 | ✅ 完成，已上線 |
| v1.8 | 廣告日誌頁面優化 | B規劃組 | 技術組 | ✅ 完成，已上線 |
| v1.9 | 域名短鏈頁面（3 Tab：域名解析、域名管理、防封短鏈） | A規劃組 | 技術組 | ✅ 完成，已上線 admin.bexnua.store/domains |
| bugfix | 素材中心採集與系統主題修復（採集兩階段+下載靜態資源+系統主題補HTML+清理測試數據） | A規劃組 | 技術組 | ✅ 完成，已上線 |
| v1.10 | visitor_id 新增 + line-redirect Worker 改動 | B規劃組 | 技術組 | ✅ 完成，已上線 |
| v1.10.1 | shadow-cloak D1 修復（REST API 改 env.DB.prepare + IP/visitor_id 寫入修正） | B規劃組 | 技術組 | ✅ 完成，已上線 |
| v1.10.2 | CTA 連結與 TAG 歸因串接（shadow-cloak 傳遞 tag/vid、money-page HTMLRewriter、line-redirect /go 路由+分流） | A規劃組 | 技術組 | ✅ 完成，已上線（shadow-cloak v5.3） |
| bugfix-N8N | N8N Time Attribution $helpers.crypto 修復 + BC 像素 CompleteRegistration 修復 | A規劃組 | 直接用 API 修復 | ✅ 完成，已上線 |
| bugfix-N8N-credential | N8N Cloudflare D1 Auth + API Token 憑證更新（舊 Token 失效導致 follow 事件
