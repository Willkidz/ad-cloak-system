---
title: "Telegram Bot「上帝視角監控」推送失敗診斷報告"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "診斷 Telegram Bot 推送失敗的根本原因為 Cloudflare D1 API Token 失效（401 錯誤），並提供 Token 更新與 Sheets Report 工作流啟用的修復步驟。"
version: "v1.0"
id: "20260325-cloak-diag-telegram"
type: analysis
tags: [cloudflare-d1, credentials, godview, monitoring, n8n, telegram]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 2026-03-24 18:00–20:00 UTC 期間，Telegram Bot「上帝視角監控」停止推送。根本原因是 N8N 工作流中寫死的 Cloudflare D1 API Token 失效，導致「CAPI Health Check」連續 3 小時返回 `401 Authentication error`（錯誤碼 10000），「Time Attribution」也因同一 Token 失敗。此外，「上帝視角_Sheets Report」工作流處於 Inactive 狀態，每日三次的定時報告從未執行。修復方案：立即將舊 Token `cfut_xAy...` 更新為新 Token `cfut_2tx...`，並啟用 Sheets Report 工作流。長期建議使用 N8N Credentials 集中管理 Token 並建立失敗告警機制。

# Telegram Bot「上帝視角監控」推送失敗診斷報告

## 執行摘要

- **診斷日期：** 2026-03-25
- **問題時間：** 2026-03-24 18:00 - 20:00 UTC
- **問題描述：** Telegram Bot「上帝視角監控」在指定時間內未推送監控數據。
- **根本原因：** Cloudflare D1 API 認證失敗（401 Authentication Error），導致多個關鍵工作流程無法訪問數據庫。
- **修復建議：** 立即更新 N8N 工作流程中寫死的 Cloudflare D1 API Token，並啟用被停用的「上帝視角_Sheets Report」工作流程。

---

## 詳細診斷

### Workflow 狀態總覽

下表總結了相關 N8N 工作流程的狀態與問題：

| Workflow 名稱 | ID | 狀態 | 最後更新 | 備註 |
| :--- | :--- | :--- | :--- | :--- |
| 上帝視角_Sheets Report | Jbca1gwN6pGDnjhJ | **Inactive** | 2026-03-23 21:24 | 未啟用，無執行紀錄 |
| 上帝視角_Admin API | TBJgFC9TmFnK8eyG | Active | 2026-03-23 21:24 | 無執行紀錄 |
| 上帝視角_Time Attribution | dqbdnCN3xdJAahYQ | Active | 2026-03-24 18:10 | **有錯誤執行** |
| 系統監控 | ecnSO9T2NLWZKApl | Active | 2026-03-23 23:51 | 正常運行 |
| 上帝視角_CAPI Health Check | uQFTrGvbMHY1TYUX | Active | 2026-03-23 23:51 | **多次失敗** |

### 上帝視角_CAPI Health Check 執行分析

- **執行統計：** 總共 20 次執行中，有 3 次失敗，失敗率為 15%。
- **失敗時間線：**

| 執行 ID | 時間 | 狀態 | 錯誤 |
| :--- | :--- | :--- | :--- |
| 1511 | 2026-03-24 20:00:16 UTC | Error | 401 - Authentication error |
| 1500 | 2026-03-24 19:00:16 UTC | Error | 401 - Authentication error |
| 1491 | 2026-03-24 18:00:16 UTC | Error | 401 - Authentication error |

- **錯誤模式：** 於 18:00、19:00、20:00 連續 3 小時失敗，最後一次成功執行是在 2026-03-24 17:00:16 UTC。

### 上帝視角_Time Attribution 執行分析

- **執行統計：** 最近 15 次執行中，有 1 次失敗。
- **失敗詳情：**

| 執行 ID | 時間 | 狀態 | 節點 | 錯誤 |
| :--- | :--- | :--- | :--- | :--- |
| 1503 | 2026-03-24 19:25:26 UTC | Error | Query Recent Clicks | 401 - Authentication error |

- **錯誤信息：**

<example id="d1-auth-error-response">

```json
{
  "result": null,
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error"
    }
  ],
  "messages": []
}
```

</example>

### 上帝視角_Sheets Report 狀態

此工作流程處於 **未啟用 (Inactive)** 狀態，因此其排定的每日三次（台北時間 06:00、10:00、14:00）推送任務從未執行。

### 系統監控 Workflow

此工作流程狀態正常，每 15 分鐘執行一次，所有執行均成功，最後一次執行時間為 2026-03-24 20:15:53 UTC。

---

## 根本原因分析

### 問題 1：Cloudflare D1 API 認證失敗

<rule id="root-cause-auth-failure">

**主要症狀**是多個工作流程在試圖訪問 Cloudflare D1 數據庫時，均收到 `401 Unauthorized` 錯誤，錯誤代碼為 `10000`。這影響了「CAPI Health Check」中的 "Fetch Ad Config" 節點和「Time Attribution」中的 "Query Recent Clicks" 節點。

**核心原因**是 N8N 工作流程中使用的 Cloudflare API Token 已失效。這可能是因為 Token 過期或已被手動撤銷。

<example id="token-old-vs-new">

舊的、已失效的 Token：
```
cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f
```

新的、應使用的 Token：
```
cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920
```

</example>

</rule>

### 問題 2：「上帝視角_Sheets Report」未啟用

<rule id="root-cause-inactive-workflow">

**主要症狀**是「上帝視角_Sheets Report」工作流程的狀態為 **Inactive**，導致其無法根據排程觸發執行。

**直接影響**是每日的定時歸因報告（台北時間 06:00、10:00、14:00）無法生成和推送，導致用戶無法收到報告。

</rule>

---

## 修復方案

### 立即行動

<step id="update-token">

**1. 更新 Cloudflare D1 API Token**

在以下兩個工作流程的指定節點中，將舊的 API Token 更新為新的有效 Token：

- **上帝視角_CAPI Health Check**
    - **節點：** Fetch Ad Config
    - **參數：** Authorization Header
- **上帝視角_Time Attribution**
    - **節點：** Query Recent Clicks
    - **參數：** Authorization Header

</step>

<step id="activate-workflow">

**2. 啟用「上帝視角_Sheets Report」**

登入 N8N 管理介面，找到「上帝視角_Sheets Report」工作流程，並點擊「Activate」按鈕將其啟用。同時，需確認其觸發器設定正確（每日 06:00、10:00、14:00 台北時間）。

</step>

### 驗證步驟

<step id="validation-manual-run">

**1. 手動執行驗證**

更新 Token 後，手動執行一次「CAPI Health Check」工作流程，確認其執行狀態為 `success`。

</step>

<step id="validation-monitor-run">

**2. 監控自動執行**

等待下一個排定的工作流程自動執行，並驗證 Telegram Bot 是否成功推送了監控消息。

</step>

### 長期建議

<rule id="long-term-token-management">

**1. Token 管理**

- **集中管理：** 使用 N8N 的 Credentials 管理功能來儲存和管理 API Token，避免直接寫死在工作流程中。
- **定期輪換：** 建立 Token 過期提醒機制，並建議每 90 天定期輪換 API Token，以增強安全性。

</rule>

<rule id="long-term-monitoring">

**2. 監控與告警**

- **失敗告警：** 設定自動告警機制，當關鍵工作流程連續失敗超過 3 次時，能即時發送通知給維運人員。
- **定期審查：** 定期檢查工作流程的執行日誌，以及早發現潛在問題。

</rule>

<rule id="long-term-backup">

**3. 備份與手動機制**

- **備用觸發器：** 為關鍵工作流程配置備用觸發器，以應對主觸發器失效的情況。
- **手動預案：** 建立清晰的手動觸發 SOP，確保在自動化流程失敗時，能由人工介入完成任務。

</rule>

---

## 時間軸

| 時間 | 事件 |
| :--- | :--- |
| 2026-03-24 17:00 UTC | 「CAPI Health Check」最後一次成功執行。 |
| 2026-03-24 18:00 UTC | 「CAPI Health Check」因 401 認證錯誤開始失敗。 |
| 2026-03-24 19:25 UTC | 「Time Attribution」因同樣的 401 錯誤而失敗。 |
| 2026-03-24 20:00 UTC | 「CAPI Health Check」第三次連續失敗。 |
| 2026-03-25 | 用戶回報未收到 Telegram 推送。 |

---

## 結論

本次「上帝視角監控」Telegram Bot 推送失敗事件，根本原因為 **Cloudflare D1 API Token 失效**，加上**關鍵報告工作流程處於未啟用狀態**，兩者共同導致了服務中斷。此事件凸顯了在自動化流程中，對憑證管理、狀態監控和錯誤告警的重要性。

立即修復步驟是更新 API Token 並重新啟用相關工作流程。長期來看，應建立更完善的憑證管理與監控告警機制，以避免類似問題再次發生。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-n8n-workflow.md](cloak-admin-n8n-workflow.md) | N8N 工作流設定與配置 |
| [cloak-admin-api-keys-list.md](cloak-admin-api-keys-list.md) | API Keys 與憑證清單 |
| [cloak-admin-troubleshoot.md](cloak-admin-troubleshoot.md) | 故障診斷與修復紀錄 |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 環境資訊與 Cloudflare 帳號 |
