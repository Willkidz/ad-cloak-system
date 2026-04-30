---
title: "N8N CAPI Health Check Workflow 檢查報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "CAPI Health Check workflow（ID: ZVKJokmqh3GUbZio）因 N8N Execution Limit 達上限導致 37% 執行失敗，建議升級方案或降低頻率。"
id: "20260325-capi-health-check-verify"
type: "verify"
tags: [capi, godview, n8n, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 「上帝視角_CAPI Health Check」workflow（ID: `ZVKJokmqh3GUbZio`）的 100 次執行中有 37 次失敗（37%），根本原因是 N8N 雲端帳戶的 Execution Limit 已達上限（Execution ID 11304 錯誤訊息：`Execution limit reached`）。該 workflow 每小時自動觸發一次，包含 8 個節點（Fetch Ad Config → Build Check List → Test CAPI → Build Report → Query D1 → Build Attribution Report → Telegram 通知），配額耗盡後所有自動檢查與 Telegram 命令觸發均被阻斷。首要建議是升級 N8N 方案或將頻率從每小時降至每 4 小時。**注意**：此報告基於舊版雲端 N8N，系統後來已遷移至自架版（n8n.bexnua.store），Execution Limit 問題已不存在。

# N8N CAPI Health Check Workflow - 檢查報告

**報告生成時間**: 2026-03-25

---

## Workflow 基本信息

| 項目 | 值 |
| :--- | :--- |
| **Workflow ID** | `ZVKJokmqh3GUbZio` |
| **Workflow 名稱** | 上帝視角_CAPI Health Check |
| **狀態** | Active |
| **建立時間** | 2026-03-16T22:20:56.407Z |
| **最後更新** | 2026-03-23T10:24:12.639Z |

---

## Workflow 結構

### Triggers

- **每小時自動觸發 (scheduleTrigger)**: 每小時自動觸發一次。
- **手動測試 (manualTrigger)**: 用於手動執行測試。
- **Telegram 命令 (webhook)**: 透過 Telegram 命令觸發。

### 主要節點

<step id="fetch-config">**1. Fetch Ad Config** - 從 Admin API 取得廣告配置。</step>
<step id="build-checklist">**2. Build Check List** - 構建要檢查的 token 列表。</step>
<step id="test-capi">**3. Test CAPI** - 測試 Meta Conversions API。</step>
<step id="build-report">**4. Build Report** - 生成檢查報告。</step>
<step id="query-d1">**5. Query D1 Attribution** - 查詢 D1 Attribution 數據。</step>
<step id="build-attribution-report">**6. Build Attribution Report** - 生成 Attribution 報告。</step>
<step id="send-result">**7. Telegram Send Result** - 發送結果到 Telegram。</step>
<step id="send-attribution">**8. Telegram Send Attribution** - 發送 Attribution 到 Telegram。</step>

---

## Execution 統計

| 指標 | 數值 | 百分比 |
| :--- | :--- | :--- |
| **總 Executions** | 100 | 100% |
| **成功** | 63 | 63.0% |
| **失敗** | 37 | 37.0% |

### 時間範圍

- **最早 Execution**: 2026-03-21T03:00:57.125Z [待確認]
- **最新 Execution**: 2026-03-25T04:00:56.075Z [待確認]

---

## 錯誤分析

### 根本原因

**EXECUTION LIMIT REACHED**

最新的 Execution (ID: 11304) 失敗，原因是 N8N 帳戶的執行次數已達上限。

<example>
```
Execution limit reached. Consider upgrading your plan
```
</example>

### 錯誤詳情

| 項目 | 詳情 |
| :--- | :--- |
| **Execution ID** | 11304 |
| **狀態** | Error |
| **模式** | trigger |
| **開始時間** | 2026-03-25T04:00:56.075Z |
| **結束時間** | 2026-03-25T04:00:56.108Z |
| **執行時間** | ~33ms |
| **最後執行節點** | Every 1 Hour |

---

## 問題分析

### 問題：Execution Limit 達到上限

**嚴重程度**: Critical

**描述**: N8N 當前計劃已達到執行次數上限，導致所有新的 workflow executions 都被拒絕。

<boundaries id="execution-limit-impact">

**影響範圍**:
- CAPI Health Check workflow 無法正常執行。
- 每小時的自動檢查被中斷。
- 無法通過 Telegram 命令手動觸發檢查。

**原因**:
- N8N 計劃的月度/年度執行次數限制已滿。
- 自動化 workflow（每小時執行一次）持續消耗執行配額。

</boundaries>

### 解決方案

<rule id="n8n-limit-solutions">
以下為解決 N8N 執行次數上限問題的建議方案：

<step id="upgrade-plan">**1. 升級 N8N 計劃 (推薦)**
   - 前往 [N8N 帳戶後台](https://app.n8n.cloud/account/change-plan) 升級到更高的計劃以增加執行配額。
</step>

<step id="reset-counter">**2. 等待重置執行計數**
   - 檢查 N8N 計劃的重置週期，等待月度或年度計數重置。
</step>

<step id="optimize-workflow">**3. 優化 Workflow 執行**
   - **降低頻率**: 將執行頻率從每小時改為每 4 小時。
   - **增加條件**: 添加執行條件以避免不必要的運行。
   - **善用內建功能**: 考慮使用 N8N 的 "Skip on empty" 功能。
</step>

<step id="setup-monitoring">**4. 建立監控與告警**
   - 當執行配額接近上限時，設置自動告警。
   - 定期檢查執行用量統計。
</step>

</rule>

---

## 建議行動

### 立即行動

<step id="action-upgrade">1. **升級 N8N 計劃**：立即增加執行配額以恢復服務。</step>
<step id="action-verify-plan">2. **檢查計劃用量**：確認當前計劃的執行限制和使用情況。</step>
<step id="action-verify-workflow">3. **驗證恢復狀態**：升級後，驗證 workflow 是否恢復正常執行。</step>

### 短期行動

<step id="action-monitor-success">1. **監控成功率**：監控 workflow 的執行成功率。</step>
<step id="action-setup-alerts">2. **設置配額告警**：建立執行配額接近上限時的告警機制。</step>
<step id="action-optimize-frequency">3. **優化執行頻率**：評估並調整 workflow 的執行頻率以節省資源。</step>

### 長期行動

<step id="action-evaluate-plan">1. **評估高級計劃**：評估是否需要更高級的 N8N 計劃以滿足長期需求。</step>
<step id="action-implement-control">2. **精細化控制**：實施更精細的執行控制策略，例如只在特定時間段運行。</step>
<step id="action-create-dashboard">3. **建立監控儀表板**：建立 N8N 資源使用的專屬監控儀表板。</step>

---

## 結論

此報告確認「上帝視角_CAPI Health Check」workflow 因 N8N 執行次數達到上限而中斷服務。**根本原因**是當前方案的配額不足以支撐每小時一次的自動檢查。建議的**首要行動**是立即升級 N8N 計劃以恢復核心功能，並在短期內建立監控告警機制、優化執行頻率。長期來看，應評估更高級的方案並建立全面的資源監控儀表板，以確保系統的穩定與可擴展性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 workflow 架構總覽 |
