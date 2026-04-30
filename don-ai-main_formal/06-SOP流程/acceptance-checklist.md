---
title: "部署驗收 Checklist"
category: "sop"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "標準化的部署前與部署後驗收清單，確保每次發佈的品質與穩定性。"
id: "20260325-102900"
type: "sop"
tags: [checklist, deployment, testing]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: 本文件是生產環境部署的標準化驗收清單。部署前需確認 7 項準備工作（程式碼審查、自動化測試、環境變數、依賴套件、回滾計畫、影響評估、Pre-commit 自檢）。部署後需進行核心功能驗證（流量判定、歸因追蹤、跳轉功能、後台 API、ad_code 讀取）及系統健康度檢查（錯誤日誌、效能指標、外部整合、資料庫）。發現異常時應立即評估嚴重性並執行回滾。

# 部署驗收 Checklist

本文件提供標準化的部署驗收清單。每次進行生產環境部署時，負責的工程師或 AI 代理必須逐項確認，以確保系統穩定性並降低線上事故的風險。

---

## 1. 部署前準備（Pre-deployment）

<step id="verify-pre-deploy">

在執行部署指令或合併程式碼至主分支前，必須完成以下確認：

| 檢查項目 | 說明 | 狀態 |
| :--- | :--- | :--- |
| 程式碼審查 | 所有變更已通過 Code Review，無遺留的除錯程式碼（如 `console.log`） | [ ] |
| 自動化測試 | 單元測試與整合測試全數通過（CI 綠燈） | [ ] |
| 環境變數 | 確認新功能所需的環境變數已在 Cloudflare Dashboard 或 Secrets 中設定 | [ ] |
| 依賴套件 | `package.json` 與 `package-lock.json` 已同步，無未知的重大版本更新 | [ ] |
| 回滾計畫 | 已確認若部署失敗，如何快速切換回上一個穩定版本 | [ ] |
| 影響評估 | 已評估此次變更對現有資料庫結構（D1）或外部服務（N8N、Facebook API）的影響 | [ ] |
| Pre-commit 自檢 | 已完成 [`pre-commit-checklist.md`](pre-commit-checklist.md) 的所有檢查項目 | [ ] |

</step>

---

## 2. 部署後驗證（Post-deployment）

部署完成後，必須立即在生產環境進行以下驗證（Smoke Testing）。

### 2.1 核心功能驗證（Critical Paths）

<step id="verify-critical">

| 檢查項目 | 說明 | 狀態 |
| :--- | :--- | :--- |
| 流量判定 | 測試 `shadow-cloak` 是否能正確攔截或放行流量，並寫入 `cloak_logs` | [ ] |
| 歸因追蹤 | 測試 `line-redirect` 是否能正確記錄點擊資料至 `clicks` 表 | [ ] |
| 跳轉功能 | 確認點擊廣告連結後，能正確 302 重定向至對應的 LINE 官方帳號 | [ ] |
| 後台 API | 登入管理後台，確認資料列表能正常載入，無 500 錯誤 | [ ] |
| ad_code 讀取 | 確認新格式（/CX06）和舊格式（?a=CX06）都能正確讀取 ad_code | [ ] |

</step>

### 2.2 系統健康度檢查

<step id="verify-health">

| 檢查項目 | 說明 | 狀態 |
| :--- | :--- | :--- |
| 錯誤日誌 | 檢查 Cloudflare Workers 的即時日誌（Tail），確認無異常的 Exception 或 Error | [ ] |
| 效能指標 | 觀察 Worker 的 CPU 時間與記憶體使用量是否在正常範圍內 | [ ] |
| 外部整合 | 確認 N8N Webhook 接收正常，且 Facebook CAPI 事件發送成功率未下降 | [ ] |
| 資料庫 | 隨機抽查 D1 資料庫的最新紀錄，確認欄位資料（如 IP、visitor_id）格式正確 | [ ] |

</step>

---

## 3. 異常處理與回報

<step id="verify-exception">

若在驗收過程中發現任何一項未通過，應立即採取以下行動：

1. **評估嚴重性**：若影響核心歸因功能或導致服務不可用，立即執行回滾（Rollback）
2. **保留現場**：在回滾前，盡可能截圖或匯出錯誤日誌，以供後續分析
3. **記錄問題**：將發現的問題記錄至 [`.ai/error-log.md`](../.ai/error-log.md) 和 [`.ai/active-context.md`](../.ai/active-context.md)
4. **通知相關人員**：若問題影響到廣告投放或數據追蹤，應及時通知相關負責人
5. **更新決策日誌**：若涉及架構決策，記錄至 [`.ai/decision-log.md`](../.ai/decision-log.md)

</step>

---

## 4. 驗收簽核紀錄

<example>

每次重大部署後，請複製以下模板並填寫紀錄：

```markdown
### 部署驗收紀錄：[版本號或功能名稱]

- **部署時間**：YYYY-MM-DD HH:MM
- **執行者**：[姓名或 AI 代理]
- **驗收結果**：[通過 / 部分通過 / 失敗回滾]
- **備註說明**：[如有異常請簡述]
```

</example>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/deploy-sop.md`](deploy-sop.md) | 部署流程的完整 SOP |
| [`06-SOP流程/pre-commit-checklist.md`](pre-commit-checklist.md) | 提交前自檢清單（部署前準備的前置步驟） |
| [`01-核心原則/quality-and-testing-rules.md`](../01-核心原則/quality-and-testing-rules.md) | 品質評分標準 |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | 安全護欄規則 |
| [`.ai/error-log.md`](../.ai/error-log.md) | 錯誤記錄文件 |
| [`.ai/decision-log.md`](../.ai/decision-log.md) | 決策日誌 |
