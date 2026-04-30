---
title: "n8n API Key 安全審計與更新報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "針對 n8n 實例進行 API Key 使用情況掃描，識別出硬編碼舊 Key 的風險位置，並提供 Cloudflare Worker 與 n8n 工作流的更新建議。"
id: "20260328-n8n-api-key-analysis"
type: "analysis"
tags: [cloudflare-workers, credentials, godview, n8n, security]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本次審計確認 `Config API` 工作流中存在兩處硬編碼的舊 n8n API Key，必須立即更新以維持系統運作。同時識別出 `shadow-cloak` Worker 可能存在潛在風險。報告區分了 n8n API Key 與 Cloudflare Bearer Token，後者目前無需更新。建議未來全面採用 n8n 的 **Credentials 系統** 以取代硬編碼方式。

# n8n API Key 安全審計報告

## 審計摘要

針對 `https://godview.app.n8n.cloud` 實例中的 11 個工作流進行全面掃描，旨在識別舊 API Key 的殘留位置並評估更新風險。

---

## 關鍵發現：需要更新的位置

<rule id="hardcoded-api-key">
在 `Config API` 工作流中發現了明確的硬編碼舊 Key，這將導致配置同步失效。
</rule>

| 工作流名稱 | 工作流 ID | 節點名稱 | 具體位置 | 風險等級 |
| :--- | :--- | :--- | :--- | :--- |
| **Config API** | `UCRZ0YDp4ZERmgqk` | Build Config | Code 節點 (jsCode) - 呼叫 Data Tables API | **高 (立即更新)** |
| **Config API** | `UCRZ0YDp4ZERmgqk` | Build Config | Code 節點 (jsCode) - 獲取數據表資料 | **高 (立即更新)** |

---

## 排除項目：無需更新的 API Token

審計過程中識別出以下 Token，經確認為 Cloudflare 專用，不屬於本次 n8n API Key 更新範疇。

| 工作流名稱 | 節點名稱 | 認證類型 | 用途 |
| :--- | :--- | :--- | :--- |
| Shadow Cloak G5 | Query Crawlers | Cloudflare Bearer Token | 查詢爬蟲黑名單 |
| Shadow Cloak G4 | Query D1 | Cloudflare Bearer Token | 查詢 D1 點擊數據 |

---

## Cloudflare Worker (`shadow-cloak`) 風險評估

<boundaries id="worker-security-boundary">
由於無法直接訪問 Cloudflare 原始碼，我們基於數據流向進行推測性分析。
</boundaries>

1.  **數據寫入**：若 Worker 透過 Webhook 寫入數據，通常不需要 API Key。
2.  **數據讀取**：若 Worker 需要主動從 n8n 讀取歸因結果，則其代碼或環境變數中必然包含 `N8N_API_KEY`。
3.  **建議**：管理員應立即檢查 Cloudflare 儀表板中 `shadow-cloak` 的 **Environment Variables**。

---

## 建議行動方案

<step id="update-n8n-workflow">
1. **更新 n8n 工作流**：進入 `Config API` 工作流，將 `Build Config` 節點中兩處 `X-N8N-API-KEY` 替換為新產生的 Key。
</step>

<step id="verify-worker-env">
2. **驗證 Worker 環境**：同步更新 Cloudflare Worker 的環境變數，並重新部署以生效。
</step>

<step id="credential-refactoring">
3. **憑證重構 (長期)**：將所有硬編碼的 API Key 遷移至 n8n 的 `Header Auth` 憑證類型，實現集中化管理。
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-n8n-workflow-list.md](godview-n8n-workflow-list.md) | 受影響的工作流詳細清單 |
| [godview-n8n-api-notes.md](godview-n8n-api-notes.md) | Data Tables API 調用規範 |
