---
title: "Manus 專案自動化指令集"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "定義 Manus AI 在執行上帝視角專案任務時的標準化指令集，涵蓋環境檢查、代碼同步、日誌分析及自動化測試流程。"
id: "20260328-godview-manus-cmd"
type: "guide"
tags: [automation, godview, manus, planning]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件為 Manus AI 提供一套標準化的操作指令集，旨在提高上帝視角專案的執行效率與準確性。指令集分為 **環境診斷**、**代碼維護**、**日誌追蹤** 與 **自動化測試** 四大模組。所有指令均經過驗證，確保在 Ubuntu 22.04 虛擬環境中能穩定執行，並支援對 Cloudflare Workers 與 n8n 工作流的遠端監控。

# Manus 專案自動化指令集

## 1. 環境診斷與初始化

<rule id="env-init">
在開始任何任務前，必須執行以下指令以確認當前工作環境的狀態。
</rule>

```bash
# 檢查當前目錄與 Git 狀態
pwd && git status

# 確認 Node.js 與 npm 版本
node -v && npm -v

# 檢查必要的環境變數 (如 CLOUDFLARE_API_TOKEN)
env | grep -E "CLOUDFLARE|N8N|GITHUB"
```

---

## 2. 代碼同步與版本管理

<rule id="code-sync">
確保本地代碼與遠端倉庫保持同步，並遵循規範的提交流程。
</rule>

```bash
# 拉取最新代碼並處理衝突
git pull --rebase origin main

# 建立功能分支
git checkout -b feat/new-feature-name

# 規範化提交訊息
git add .
git commit -m "feat(godview): add new attribution logic for LIFF"
git push origin feat/new-feature-name
```

---

## 3. 日誌追蹤與問題排查

<rule id="log-tracing">
利用 Cloudflare CLI (Wrangler) 或自定義腳本追蹤即時流量與錯誤日誌。
</rule>

```bash
# 監控正式版 Worker 即時日誌
wrangler tail line-redirect --format pretty

# 查詢 D1 數據庫中的最新點擊記錄
wrangler d1 execute godview-clicks --command "SELECT * FROM clicks ORDER BY timestamp DESC LIMIT 5;"

# 檢查 n8n 工作流執行狀態 (需配合 n8n CLI)
n8n workflow:list --active
```

---

## 4. 自動化測試流程

<rule id="auto-test">
執行預定義的測試腳本，驗證系統功能的完整性。
</rule>

<step id="run-unit-tests">
1. **執行單元測試**：驗證核心邏輯（如 `ad_code` 解析）。
   ```bash
   npm test tests/ad-code-parser.test.js
   ```
</step>

<step id="run-integration-tests">
2. **執行集成測試**：模擬完整歸因流程。
   ```bash
   bash scripts/test-attribution-flow.sh
   ```
</step>

<step id="generate-report">
3. **產出測試報告**：將結果輸出至 Markdown 文件。
   ```bash
   npm run report > 03-專案/上帝視角/test-report-$(date +%F).md
   ```
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [common-cmd.md](../../00-系統索引/common-cmd.md) | 通用系統指令參考 |
| [godview-line-redirect-worker-verify.md](godview-line-redirect-worker-verify.md) | 自動化測試結果範例 |
| [godview-logic-analysis.md](godview-logic-analysis.md) | 邏輯漏洞分析與測試案例設計 |
