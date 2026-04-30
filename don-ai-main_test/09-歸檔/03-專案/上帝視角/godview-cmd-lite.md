---
title: "上帝視角指令（精簡版）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "★ 核心原則：積分消耗最低。所有行為以此為最高優先"
status: "archived"
archived_reason: "歸檔：精簡版指令已整合至最新版本的指令文件"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [attribution, godview]
created: 2026-03-25
updated: "2026-03-27"
---

# 上帝視角指令（精簡版）

★ 核心原則：積分消耗最低。所有行為以此為最高優先。

## 任務開始
立即執行：GET https://manus-memory-api.laoqin1689.workers.dev/memory?project=上帝視角&limit=20 讀取記憶，從記憶取得架構/憑證/解法，直接開始。

## 禁止問用戶
- 缺憑證 → 查記憶 category=credentials，找不到才告知
- 遇錯誤 → 查記憶 category=issue_resolved，有解法直接用
- 不確定架構 → 查記憶 category=architecture
- 唯一可問：查記憶+程式碼+logs 全找不到，且附上調查結果

## 回覆規則
禁止：說「我現在要做什麼」、重複用戶說過的內容、客套話、貼完整程式碼（只貼 diff）

## Worker 改動規則（最重要）
任何 Worker 改動前，必須先輸出：
- 改動內容 / 影響路由 / 影響邏輯 / 影響像素 / 不影響範圍
等用戶確認後才動手。禁止發現問題直接改。

Change Budget：每次最多改 2 個檔案、30 行，禁止引入新依賴、禁止重命名、禁止邊修 bug 邊重構。超過預算必須先告知用戶。

**部署後強制驗證**：每次部署完成後，必須立刻用實際請求驗證結果是否符合預期（例：跳轉是否正確、D1 是否有寫入、事件是否發送）。不能只說「部署成功」。驗證失敗必須自行查明原因並修復，不得要求用戶自行測試。
**CAPI 驗證特別規則**：API 回傳 200 不等於事件有效。驗證 CAPI 必須同時確認：查 D1 有寫入記錄、查 Worker log 有發送記錄。不能只看 API 回傳碼就說成功。

## 高風險操作（需確認）
UPDATE / DELETE / 批量操作 → 必須先列影響範圍等確認
絕對禁止直接修改：TAG與LINE ID對應、token_mapping、像素ID與廣告帳號綁定、n8n workflow trigger

## 記錄點規則
對話中用戶確認任何資訊時，立刻寫入記憶，不等任務結束。
任務結束必須寫入：解決錯誤、新架構資訊、新增/修改 Worker 或 workflow。
POST https://manus-memory-api.laoqin1689.workers.dev/memory
{"project":"上帝視角","category":"issue_resolved","title":"","content":"","tags":""}
category：architecture / credentials / workflow / issue_resolved / convention / context

## 修改等級
L1 樣式 → 看畫面確認
L2 邏輯 → 看行為+查D1
L3 數據流 → 逐欄位驗D1
L4 架構 → 全流程端對端測試
禁止沒有明確目標就「全面檢查」

## 版本管理
重大改動前先 git commit。回版用 git revert，不重寫程式碼。

## 調查規則
先查記憶，找到就停。工具順序：記憶 → n8n API → Cloudflare REST API → MCP（MCP常超時，最後用）

## 省TOKEN技巧
- 查TAG/廣告設定：Admin API curl -X POST https://godview.app.n8n.cloud/webhook/admin-api -d '{"resource":"line_config","action":"list"}'
- 查Worker跳轉：python requests.get(allow_redirects=False)
- n8n workflow：已知ID直接GET，不用列表搜尋
- 記憶API回應key是 memories，不是 data
- MCP超時3次就放棄，改用curl

## 已知防呆
- D1 binding metadata用 id 不是 database_id
- godview-clicks D1 ID：3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c
- Cloudflare Account ID：61f1eb800e48d2cf41ed9ddacf01581b
- n8n webhook節點必須有 webhookId 屬性
- n8n DataTable UPDATE：PATCH /data-tables/{id}/rows/update（不是/rows/{rowId}）
- LIFF外部瀏覽器參數在 liff.state 中，需先解析
- 火鳥gotolink()不帶fbclid，等廠商更新
- 所有客服連結格式：{prefix}.freshpathlab.com/?a={CODE}，不用lin.ee

## 子域名對應
js/cs/ms/ls → AS（爆分王）
mb/lb/jb/cb → AB（莊家剋星）
jx/lx/cx/mx → AX（獨角仙）
bf → BF（博富）

## 已知Workflow ID
Config API：UCRZ0YDp4ZERmgqk
Admin API：VUMAiZXjG826mUDd
Time Attribution：biEtJWKGcnmqYjgW
DNS Auto-Sync：Mydz6vj7T7dw5Ugj
CAPI Health Check：ZVKJokmqh3GUbZio
Sheets Report：dqbdnCN3xdJAahYQ
Token Mapping Standalone：aOCq55FbKzCXA8C9（webhook path: token-mapping-v2）

## Worker 部署目標
所有子域名路由（freshpathlab.com 子域名跳轉邏輯）綁定的是 **line-redirect** Worker。
改動跳轉邏輯、D1 寫入、BC 像素事件，必須部署到 **line-redirect**，不是 godview-clicks。
godview-clicks 是舊 Worker，不再使用。
