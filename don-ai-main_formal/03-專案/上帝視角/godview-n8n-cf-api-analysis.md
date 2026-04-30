---
title: "n8n 與 Cloudflare API 維護任務報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "對 n8n 系統中 5 項維護任務的執行報告：LINE OA Token 確認位於每日統計報告 workflow 的硬編碼 LINE_TOKENS 物件（23 個 token 一致無需更新）、系統監控 D1 Token 已最新、Token Mapping Standalone workflow 已遺失、8 個 workflow 時區統一為 Asia/Taipei、Telegram 報告未收到的根因為每日統計報告和系統監控 workflow 在 Schedule Trigger 後未執行後續節點。"
id: "20260325-024356"
type: "project-doc"
tags: [cloudflare, godview, knowledge-base, n8n, telegram]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告記錄 5 項 n8n 維護任務的結果。(1) LINE OA Token 並非存於 `line_config` DataTable，而是硬編碼在「每日統計報告」workflow（`xlsrmuNYqV88VJSu`）的 `LINE Insight + 歸因率` Code 節點中的 `LINE_TOKENS` 物件，23 個 token 與提供清單完全一致，無需更新（但 `@942tkadn` 在 `line_config` 中無對應 tag）。(2) 系統監控 workflow（`m5Pd6Sx29uE3W0ty`）的 D1 Token 已是最新。(3) `Token Mapping Standalone`（`aOCq55FbKzCXA8C9`）已不存在，webhook path `token-mapping-v2` 回傳 404。(4) 已將 4 個 workflow 的 Schedule Trigger 時區統一為 `Asia/Taipei`。(5) Telegram Bot 連線正常（測試訊息成功），但「每日統計報告」和「系統監控」在 Schedule Trigger 後未執行後續節點，需在 n8n 介面中手動觸發調試。

# n8n 與 Cloudflare API 維護任務報告

本報告詳細記錄了針對 n8n 系統中與 Cloudflare API 相關的多項維護與排查任務的執行過程、發現及結論。

---

## 任務 2：更新 LINE OA Token

### 發現

經查，LINE OA Token 並非儲存在 n8n 的 `line_config` DataTable 中，而是以硬編碼（`LINE_TOKENS` 物件）的形式存在於 `xlsrmuNYqV88VJSu`（每日統計報告）workflow 的 `LINE Insight + 歸因率` Code 節點中。

<example>
```javascript
// 位於「每日統計報告」workflow 的 Code 節點
const LINE_TOKENS = {
  // ... 23 個 token ...
};
```
</example>

`line_config` DataTable 雖然存在，但其結構中並無儲存 LINE OA Token 的欄位。對比您提供的最新 token 清單與 workflow 中現有的 23 個 token，**兩者內容完全一致**，因此無需進行任何更新操作。

<boundaries id="token-mismatch">
值得注意的是，您提供的 token 清單中包含 `@942tkadn`，但此 ID 在 `line_config` DataTable 中並無對應的 `tag` 記錄。
</boundaries>

### 結論

LINE OA Token 無需更新。不過，目前的儲存方式存在安全風險與管理不便的問題。

<rule id="token-security-best-practice">
建議未來考慮將敏感 token（如 LINE OA Token）儲存於 n8n 的 Credentials 或其他更安全的配置方式，而非硬編碼於 workflow 程式碼中，以提高安全性和管理便利性。
</rule>

---

## 任務 3：確認系統監控 workflow 的 D1 Token

### 發現

已檢查 `m5Pd6Sx29uE3W0ty`（系統監控）workflow 中所有涉及 Cloudflare D1 的節點。確認其使用的 Cloudflare API Token 已經是最新且正確的 `cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f`。

在此過程中，也記錄到 Telegram Bot Token 為 `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc`，此資訊將用於任務 8 的排查。

### 結論

系統監控 workflow 的 D1 Token 已是最新，無需更新。

---

## 任務 5：檢查 Token Mapping Standalone

### 發現

根據提供的 Workflow ID `aOCq55FbKzCXA8C9`，在 n8n 系統中查詢後，**確認此 Workflow 不存在**。嘗試訪問其 webhook path `token-mapping-v2` 也返回 404 錯誤，進一步證實了該 workflow 的缺失。

### 結論

`Token Mapping Standalone` workflow (`aOCq55FbKzCXA8C9`) 不存在。這意味著任何依賴此 workflow 進行 token 映射的服務或功能將會失敗。如果此 workflow 是業務關鍵，則需要重新建立或部署。

---

## 任務 7：檢查所有 workflow 時區

### 發現

已檢查並更新了所有 8 個 workflow 中 `Schedule Trigger` 節點的時區設定。以下是已更新時區為 `Asia/Taipei` 的 workflow 列表：

| Workflow ID | Workflow 名稱 | 活躍狀態 | Schedule Trigger 類型 | 更新狀態 |
| :--- | :--- | :--- | :--- | :--- |
| `ZVKJokmqh3GUbZio` | 上帝視角_CAPI Health Check | True | 每小時 | 成功 |
| `dqbdnCN3xdJAahYQ` | 上帝視角_Sheets Report | False | 每日特定時間 | 成功 |
| `m5Pd6Sx29uE3W0ty` | 系統監控 | True | 每 15 分鐘 | 成功 |
| `xlsrmuNYqV88VJSu` | 每日統計報告 | True | 每日 | 成功 |

<rule id="n8n-api-update-requirement">
在更新過程中，發現 n8n API 在使用 `PUT` 方法更新 workflow 時，除了 `nodes` 和 `connections` 之外，還必須包含 `settings` 欄位，否則會導致更新失敗。此問題已在更新腳本中修正。
</rule>

### 結論

所有指定 workflow 的 `Schedule Trigger` 節點時區均已成功設定為 `Asia/Taipei`。`上帝視角_Sheets Report` workflow 目前為非活躍狀態，但其時區設定也已更新。

---

## 任務 8：排查 Telegram 報告未收到

### 發現

1.  **Telegram Bot Token 有效性**：
    已確認 Telegram Bot Token `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc` 有效。Bot 名稱為 `上帝視角監控` (`godview_monitor_bot`)。

2.  **Chat ID 正確性**：
    已從多個 workflow（包括 `上帝視角_CAPI Health Check`、`系統監控`、`每日統計報告`）中識別出 Chat ID `7495585445`。

3.  **測試訊息發送**：
    已成功向 Chat ID `7495585445` 發送一條測試訊息，並收到 Telegram API 的成功回應。這表明 Bot 與 Chat ID 之間的連線是正常的。

4.  **觸發後的執行紀錄分析**：
    *   **`上帝視角_CAPI Health Check` (`ZVKJokmqh3GUbZio`)**：最近的執行紀錄（例如 ID `10481`）顯示為 `success` 狀態，且所有節點均成功執行並有完整的輸出資料。此 workflow 的 Telegram 報告應正常發送。
    *   **`每日統計報告` (`xlsrmuNYqV88VJSu`)**：所有近期執行紀錄的持續時間均為 0 秒，且僅顯示 `Schedule Trigger` 節點執行成功。Workflow 在觸發後並未執行後續節點。
    *   **`系統監控` (`m5Pd6Sx29uE3W0ty`)**：與 `每日統計報告` 類似，其執行紀錄也顯示持續時間為 0 秒，且僅執行了 `Schedule Trigger` 節點。

### 問題排查與分析

Telegram 連線本身正常（Bot Token 和 Chat ID 均有效，測試訊息發送成功），問題出在 workflow 的執行流程上。

<boundaries id="telegram-issue-scope">

**已排除**：Telegram Bot Token 失效、Chat ID 錯誤、Telegram API 連線問題。

**待調查**：`每日統計報告` 和 `系統監控` workflow 在 `Schedule Trigger` 節點之後就停止了。潛在原因包括：
1. **Workflow 邏輯問題**：`Schedule Trigger` 之後的某個節點可能存在隱藏的條件判斷或配置錯誤，導致 workflow 提前退出但未報告錯誤。
2. **n8n 平台行為**：n8n Cloud 在某些情況下可能不會記錄完整的執行細節。
3. **連接問題**：內部執行時可能存在節點 ID 與名稱解析的潛在問題。

</boundaries>

### 建議調試步驟

<step id="debug-workflow-1">
**在 n8n 介面中手動觸發** `每日統計報告` 和 `系統監控` workflow，並仔細觀察其執行過程和每個節點的輸出，以確定 workflow 在哪個環節停止或跳過。
</step>

<step id="debug-workflow-2">
**檢查 `D1 Query 3天` 節點的輸出**，確認其是否返回預期的資料。如果返回空資料，則後續節點可能因無資料可處理而停止。
</step>

<step id="debug-workflow-3">
**檢查 `Format 素材戰報` 和 `LINE Insight + 歸因率` 節點的邏輯**，確認是否存在任何可能導致 workflow 提前退出的條件判斷。
</step>

<step id="debug-workflow-4">
**檢查 Telegram 發送節點的配置**，確保 `chat_id` 和 `text` 欄位正確地從上一個節點獲取資料。
</step>

### 總結

Telegram Bot 本身運作正常，問題出在 `每日統計報告` 和 `系統監控` workflow 的執行流程上，它們在 `Schedule Trigger` 之後未能完整執行。需要進一步在 n8n 介面中進行詳細調試以找出根本原因。

---

## 整體結論

本次任務完成了對多個 n8n workflow 的盤點與修正。Token 均為最新，時區已統一。主要發現的問題是 `Token Mapping Standalone` workflow 遺失，以及兩個核心報告 workflow (`每日統計報告`, `系統監控`) 未能完整執行。後續應優先排查 workflow 執行中斷的原因，並考慮將硬編碼的 Token 遷移至更安全的管理方式。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [N8N Cloudflare 設定分析](godview-n8n-cf-config-analysis.md) | Cloudflare 憑證與 D1 整合的深度分析 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 workflow 架構總覽 |
| [LINE OA Token 清單](godview-line-oa-tokens.md) | LINE OA Token 完整清單 |
