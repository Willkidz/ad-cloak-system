---
title: "跨專案規則提交 n8n 自動化 PR 工作流設計"
category: "reference"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "詳細設計用於接收外部 AI 規則提交、自動建立 GitHub 分支、修改 pending-rules.md 並發起 Pull Request 的 n8n 工作流架構。"
id: "20260329-N8N-PR-001"
type: "arch"
tags: [n8n, workflow, github, pr, automation, rules]
status: "active"
created: "2026-03-29"
updated: "2026-03-29"
---

> **TL;DR**: 本文件描述了「跨專案 AI 規則提交機制」背後的 n8n 自動化工作流架構。該工作流透過 Webhook 接收外部 AI 提交的 JSON 規則，利用 GitHub API 自動建立分支、獲取並更新 `.ai/pending-rules.md` 文件、發起 Pull Request，最後透過 Telegram Bot 通知維護者審核，實現完全自動化的跨專案知識匯集。

# 跨專案規則提交 n8n 自動化 PR 工作流設計

為了支援 [跨專案 AI 規則提交機制指南](../01-核心原則/cross-project-rule-submission-spec.md)，我們需要在 n8n 伺服器（`n8n.bexnua.store`）上建立一個全新的自動化工作流。本文件詳細定義了該工作流的節點設計與執行邏輯。

---

## 1. 工作流基本資訊

- **工作流名稱**：`跨專案規則自動 PR 提交`
- **觸發方式**：Webhook (`POST /webhook/submit-ai-rule`)
- **依賴憑證**：
  - `GitHub API Token` (具備 `repo` 讀寫權限)
  - `Telegram Bot Token` (用於發送審核通知)

---

## 2. 節點架構與執行流程

整個工作流分為六個主要階段，按順序執行：

### 階段一：接收與驗證 (Webhook & Validation)

1. **Webhook 節點**：
   - 方法：`POST`
   - 路徑：`/webhook/submit-ai-rule`
   - 認證：可選（建議加入簡單的 Bearer Token 驗證以防濫用）
2. **Code 節點 (資料驗證)**：
   - 檢查傳入的 JSON 是否包含必填欄位：`rule_title`, `trigger_condition`, `error_symptom`, `correct_practice`, `source_project`, `confidence_level`。
   - 若驗證失敗，返回 `400 Bad Request` 及錯誤訊息。

### 階段二：GitHub 分支建立 (Branch Creation)

3. **HTTP Request 節點 (Get Main SHA)**：
   - 呼叫 GitHub API 獲取 `laoqin1689/don-ai` 倉庫 `main` 分支的最新 Commit SHA。
   - `GET https://api.github.com/repos/laoqin1689/don-ai/git/refs/heads/main`
4. **HTTP Request 節點 (Create Branch)**：
   - 根據來源專案與時間戳生成分支名稱，例如：`auto-rule/cloak-admin-1711680000`。
   - 呼叫 GitHub API 建立新分支。
   - `POST https://api.github.com/repos/laoqin1689/don-ai/git/refs`

### 階段三：文件讀取與內容生成 (File Processing)

5. **HTTP Request 節點 (Get File Content)**：
   - 獲取 `.ai/pending-rules.md` 的當前內容與 `sha` 值。
   - `GET https://api.github.com/repos/laoqin1689/don-ai/contents/.ai/pending-rules.md?ref={new_branch}`
6. **Code 節點 (Markdown 生成)**：
   - 將 Base64 解碼為原始 Markdown 文本。
   - 根據傳入的 JSON 數據，套用標準模板生成新的規則區塊：
     ```markdown
     ### [Pending] {{ rule_title }}
     
     - **觸發條件**：{{ trigger_condition }}
     - **錯誤現象**：{{ error_symptom }}
     - **正確做法**：{{ correct_practice }}
     - **來源**：{{ source_project }}
     - **信心等級**：{{ confidence_level }}
     ```
   - 將新區塊附加到文件末尾，並重新進行 Base64 編碼。

### 階段四：提交變更 (Commit Changes)

7. **HTTP Request 節點 (Update File)**：
   - 將更新後的 Base64 內容提交到新分支。
   - `PUT https://api.github.com/repos/laoqin1689/don-ai/contents/.ai/pending-rules.md`
   - Payload 包含：`message` ("Add new rule from {source_project}"), `content`, `sha`, `branch`。

### 階段五：發起 Pull Request (Create PR)

8. **HTTP Request 節點 (Create PR)**：
   - 呼叫 GitHub API 發起 Pull Request。
   - `POST https://api.github.com/repos/laoqin1689/don-ai/pulls`
   - Payload：
     ```json
     {
       "title": "[Auto Rule] 來自 {{ source_project }} 的新規則提交",
       "body": "此 PR 由 n8n 自動生成。\n\n**規則標題**：{{ rule_title }}\n**信心等級**：{{ confidence_level }}\n\n請維護者審核後合併，合併後將進入金絲雀試用期。",
       "head": "{{ new_branch }}",
       "base": "main"
     }
     ```

### 階段六：通知維護者 (Notification)

9. **Telegram 節點**：
   - 向指定的群組或維護者發送通知。
   - 訊息內容：「🤖 **新 AI 規則提交**\n專案：{{ source_project }}\n規則：{{ rule_title }}\nPR 連結：{{ pr_url }}\n請前往審核！」

---

## 3. 錯誤處理與重試機制

- **API 速率限制**：GitHub API 節點應設定適當的重試機制（Retry On Fail），處理可能的 `403 Rate Limit Exceeded`。
- **文件衝突**：若在獲取 SHA 與提交更新之間發生衝突（`409 Conflict`），工作流應捕獲錯誤並透過 Telegram 發送失敗告警，提示人工介入。
- **Webhook 回應**：無論後續流程是否成功，Webhook 節點應在接收並驗證資料後立即返回 `202 Accepted`，避免阻塞外部 AI 的執行流程。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/cross-project-rule-submission-spec.md` | 本工作流實作的業務邏輯與 JSON 格式規範 |
| `07-配置與環境/n8n-workflow-arch.md` | 現有 N8N 伺服器配置與工作流清單 |
