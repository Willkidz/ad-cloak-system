---
title: "部署流程與 CI/CD SOP（完整版）"
category: "sop"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "定義 cloak-admin 前端和 cloak-admin-api 後端的完整部署流程，涵蓋測試版/正式版環境架構、CI/CD 設定、Vitest 自動化測試、緊急回滾及部署前檢查清單。"
id: "20260326-deploy-001"
type: "sop"
tags: [ci-cd, cloudflare, deployment, sop, workflow]
status: "active"
created: "2026-03-25"
updated: "2026-03-30"
activation_glob: null
merged_from: [01-核心原則/部署流程規範.md, 06-SOP流程/部署流程SOP.md]
---

> **TL;DR**: 本文件是斗篷管理後台（Cloak Admin）的完整部署 SOP。部署流程分三階段：開發與測試版部署 → 用戶確認 → 正式版部署。前端透過 Cloudflare Pages 部署，後端透過 Cloudflare Workers 部署，測試版與正式版使用完全獨立的 D1 資料庫（staging 使用 godview-clicks-staging，production 使用 godview-clicks）。自動化測試採用 Vitest + `@cloudflare/vitest-pool-workers`，CI/CD 透過 GitHub Actions 實現。五大核心原則：測試版優先驗證、版本更新記錄、禁止 Staging 直接覆蓋正式版、部署前同步正式版源碼、修改完成後同步回 Git。

# 部署流程與 CI/CD SOP（完整版）

本文件定義了斗篷管理後台（Cloak Admin）的完整部署流程，涵蓋環境架構、手動部署步驟、自動化測試與 CI/CD 管道的設定規範。透過標準化流程，可以確保每次部署的穩定性，並降低人為錯誤的風險。所有代碼修改必須遵循「開發 → 測試版部署 → 用戶確認 → 正式版部署」的流程。

---

## 1. 部署環境架構

### 前端（cloak-admin）

| 環境 | 域名 | Pages 項目 | 用途 |
| :--- | :--- | :--- | :--- |
| 測試版 | `staging.admin.bexnua.store` | `cloak-admin-staging` | 開發者和用戶測試新功能 |
| 正式版 | `admin.bexnua.store` | `cloak-admin-frontend` | 生產環境，用戶日常使用 |

### 後端（cloak-admin-api）

| 環境 | Worker 名稱 | API 域名 | 用途 |
| :--- | :--- | :--- | :--- |
| 測試版 | `cloak-admin-api-staging` | `cloak-admin-api-staging.laoqin1689.workers.dev` | 測試版前端調用 |
| 正式版 | `cloak-admin-api` | `admin-api.bexnua.store` | 正式版前端調用 |

### 資料庫

- **D1 資料庫**：測試版和正式版使用完全獨立的 D1 資料庫
  - staging 使用 `godview-clicks-staging`（ID: `594f8569-ad3c-40c0-ac7c-8b691f9d7885`）
  - production 使用 `godview-clicks`（ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`）
  - 此設計確保測試數據不污染正式環境

---

## 2. 自動化測試方案（Vitest）

為了確保 Cloudflare Workers 的穩定性，我們採用官方推薦的 `@cloudflare/vitest-pool-workers` 進行測試。此方案允許測試直接在 Workers 執行環境中運行，並提供對 D1、KV 等綁定資源的直接存取能力 [1]。

### 2.1 測試環境設定

<step id="deploy-test-setup">

安裝必要的依賴套件：

```bash
npm i -D vitest@^4.1.0 @cloudflare/vitest-pool-workers
```

建立 `vitest.config.ts` 檔案，設定 `cloudflareTest` 插件（自動讀取 `wrangler.jsonc` 中的環境變數與綁定設定）：

```typescript
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
});
```

</step>

### 2.2 單元測試與整合測試規範

<rule id="deploy-test-types">

- **單元測試**：針對單一函數或模組進行測試。透過匯入 Worker 模組，使用 `createExecutionContext()` 建立執行上下文，直接呼叫 `fetch` 處理常式進行測試。
- **整合測試**：驗證整個 Worker 的端到端行為。使用 `cloudflare:workers` 提供的 `exports` 物件，模擬真實的 HTTP 請求並驗證回應結果。

</rule>

---

## 3. 手動部署流程

### 階段 1：開發與測試版部署

<step id="deploy-stage1-1">

**步驟 1 — 代碼修改**：在本地開發分支修改代碼，遵循「版本更新記錄規範」更新 `CHANGELOG.md`。

</step>

<step id="deploy-stage1-2">

**步驟 2 — 測試版前端部署**：

```bash
cd /home/ubuntu/cloak-admin
pnpm run build
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deploy dist/public --project-name=cloak-admin-staging
```

部署後訪問 `https://staging.admin.bexnua.store` 驗證。

</step>

<step id="deploy-stage1-3">

**步驟 3 — 測試版後端部署**（如有 API 修改）：

```bash
cd /home/ubuntu/cloak-admin-api
CLOUDFLARE_API_TOKEN="<token>" npx wrangler deploy --name cloak-admin-api-staging
```

測試 API：`curl https://cloak-admin-api-staging.laoqin1689.workers.dev/api/v1/campaigns`

</step>

<step id="deploy-stage1-4">

**步驟 4 — 本地功能測試**：在測試版網站實際操作新功能，驗證前端 UI 和後端 API 正常運作，記錄測試結果到 `.ai/error-log.md`。

</step>

### 階段 2：用戶確認

<step id="deploy-stage2-1">

**步驟 1 — 通知用戶**：告知用戶新功能已在測試版上線，提供測試版 URL `https://staging.admin.bexnua.store`，並列出新功能清單和測試重點。

</step>

<step id="deploy-stage2-2">

**步驟 2 — 用戶測試反饋**：用戶在測試版進行功能驗證，收集反饋和問題報告。根據反饋修復問題，重複部署到測試版。

</step>

<step id="deploy-stage2-3">

**步驟 3 — 用戶確認完成**：用戶確認所有功能正常，簽核同意部署到正式版。

</step>

### 階段 3：正式版部署

<step id="deploy-stage3-1">

**步驟 1 — 正式版前端部署**：

```bash
cd /home/ubuntu/cloak-admin
pnpm run build
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deploy dist/public --project-name=cloak-admin-frontend
```

部署後訪問 `https://admin.bexnua.store` 驗證。

</step>

<step id="deploy-stage3-2">

**步驟 2 — 正式版後端部署**（如有 API 修改）：

```bash
cd /home/ubuntu/cloak-admin-api
CLOUDFLARE_API_TOKEN="<token>" npx wrangler deploy --name cloak-admin-api
```

測試 API：`curl https://admin-api.bexnua.store/api/v1/campaigns`

</step>

<step id="deploy-stage3-3">

**步驟 3 — 部署驗證**：在正式版網站再次驗證功能，檢查 API 回應正常，確認沒有引入新的錯誤。

</step>

<step id="deploy-stage3-4">

**步驟 4 — 部署記錄**：更新 `.ai/memory.md` 的「系統狀態快照」，記錄部署時間、版本號、修改內容，更新 `.ai/active-context.md` 記錄任務完成狀態。

</step>

---

## 4. CI/CD 部署流程（GitHub Actions）

使用 GitHub Actions 搭配官方的 `wrangler-action` 來實現自動化部署。只有通過測試的程式碼才會被部署到生產環境 [2]。

### 4.1 前置準備：設定 Secrets

<step id="deploy-secrets">

在 GitHub 儲存庫的 Settings > Secrets and variables > Actions 中，必須設定以下環境變數：

| 變數名稱 | 說明 | 取得方式 |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳號 ID | 從 Cloudflare Dashboard 的網址或 API 區域取得 |
| `CF_API_TOKEN` | 部署專用的 API Token（實際工作流使用的 Secret 名稱） | 使用「Edit Cloudflare Workers」模板建立，權限限制在特定帳號與區域 |

</step>

### 4.2 GitHub Actions 工作流設定

<step id="deploy-workflow">

在專案根目錄建立 `.github/workflows/deploy.yml`。此工作流在推送到 `main` 或 `staging` 分支時觸發（兩個分支都會觸發部署），先執行自動化測試，測試通過後才進行部署：

```yaml
name: Deploy Worker

on:
  push:
    branches:
      - main
      - staging

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build & Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

</step>

---

## 5. 核心部署原則

<rule id="deploy-principle-1">

### 原則 1：測試版優先驗證

所有修改必須先在測試版確認，再部署到正式版。測試版和正式版使用完全獨立的 D1 資料庫，確保測試數據不污染正式環境。

</rule>

<rule id="deploy-principle-2">

### 原則 2：版本更新記錄

每次修正都要做版本更新記錄（CHANGELOG）。詳見 [`01-核心原則/deploy-and-version-spec.md`](../01-核心原則/deploy-and-version-spec.md)。版本號格式：`v主版本.次版本.修補版本`（如 `v1.11.0`）。

</rule>

<rule id="deploy-principle-3">

### 原則 3：不能用 Staging 直接覆蓋正式版

**禁止**將 staging 版本的源碼直接部署到正式版。原因：staging 版本可能包含測試代碼（如 `/test-adcode` 端點）或臨時修改。正確做法：在正式版源碼上直接修改，確保部署的是生產級代碼。

</rule>

<rule id="deploy-principle-4">

### 原則 4：部署前同步正式版源碼

修改正式版前必須先從 Cloudflare 下載正式版源碼確認是最新的：

1. 用 Cloudflare API 下載正式版 Worker 源碼
2. 與 don-ai Git 知識庫中的版本比對
3. 如有差異，先同步回 Git（見原則 5）
4. 確認是最新版本後再進行修改

</rule>

<rule id="deploy-principle-5">

### 原則 5：修改完成後同步回 Git

修改完成後必須同步回 don-ai Git 知識庫：

1. 修改完成並在正式版驗證通過
2. 將修改後的源碼保存到 `05-原始碼/上帝視角/` 對應的文件
3. 更新 `CHANGELOG.md` 記錄修改內容
4. Commit 並推送到 GitHub
5. 更新 `.ai/memory.md` 的系統狀態快照

</rule>

---

## 6. 部署後驗證與回滾

### 6.1 部署後驗證

<step id="deploy-verify">

部署完成後，必須立即執行驗收流程。詳細的驗收項目請參考 [`06-SOP流程/acceptance-checklist.md`](acceptance-checklist.md)。

驗證重點：
1. 核心功能驗證（流量判定、歸因追蹤、跳轉功能、後台 API）
2. 系統健康度檢查（錯誤日誌、效能指標、外部整合、資料庫）

</step>

### 6.2 緊急回滾流程

如果正式版部署後發現嚴重問題：

<step id="rollback-1">

**步驟 1 — 立即通知**：告知用戶問題已發現。

</step>

<step id="rollback-2">

**步驟 2 — 快速修復**：在本地修復問題。

</step>

<step id="rollback-3">

**步驟 3 — 測試版驗證**：部署到測試版確認修復有效。

</step>

<step id="rollback-4">

**步驟 4 — 正式版回滾**：

```bash
# 查看部署歷史
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deployments list --project-name=cloak-admin-frontend

# 回滾到上一個版本
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages rollback --project-name=cloak-admin-frontend
```

其他回滾方式：
1. **透過 Cloudflare Dashboard 回滾**：在 Workers 頁面選擇上一個部署版本並啟用
2. **透過 Git 回滾**：`git revert` 並重新觸發 CI/CD 部署

> **注意**：回滾前應盡可能保留錯誤日誌和現場截圖，以供後續分析。回滾後應將問題記錄至 `.ai/error-log.md`。

</step>

<step id="rollback-5">

**步驟 5 — 事後檢查**：分析問題根源，更新 `.ai/error-log.md`。

</step>

---

## 7. 部署前檢查清單

部署前必須確認以下項目（詳細自檢流程見 [`06-SOP流程/pre-commit-checklist.md`](pre-commit-checklist.md)）：

- [ ] 代碼已在本地測試通過
- [ ] `CHANGELOG.md` 已更新版本號和修改內容
- [ ] 測試版部署成功，功能正常
- [ ] 用戶已確認測試版功能無誤
- [ ] 沒有未提交的代碼修改
- [ ] GitHub 上的代碼已是最新版本
- [ ] 正式版部署成功，功能驗證通過
- [ ] `.ai/memory.md` 已更新系統狀態快照

---

## 8. 常見問題

### Q: 測試版和正式版的 D1 資料庫是否獨立？

A: 是的，測試版和正式版使用完全獨立的 D1 資料庫。staging 使用 `godview-clicks-staging`，production 使用 `godview-clicks`。此設計確保測試數據不污染正式環境。如需測試真實數據情境，可將 production D1 的數據匯出後匯入 staging D1。

### Q: 如果測試版發現問題，怎麼辦？

A: 在本地修復，重新部署到測試版，直到用戶確認無誤後再部署到正式版。

### Q: 正式版部署後發現問題，怎麼辦？

A: 參考「緊急回滾流程」（第 6.2 節），立即回滾到上一個穩定版本，然後在本地修復問題。

### Q: 測試版和正式版的 API 端點不同，前端怎麼區分？

A: 前端應該有環境變數配置，根據 `NODE_ENV` 或 `VITE_API_URL` 決定調用的 API 端點。詳見前端環境配置文檔。

---

## 參考資料

[1] Cloudflare. "Vitest integration". https://developers.cloudflare.com/workers/testing/vitest-integration/

[2] Cloudflare. "GitHub Actions". https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/acceptance-checklist.md`](acceptance-checklist.md) | 部署後驗收清單 |
| [`06-SOP流程/pre-commit-checklist.md`](pre-commit-checklist.md) | 提交前自檢清單 |
| [`06-SOP流程/domain-add-sop.md`](domain-add-sop.md) | 新增域名操作手冊 |
| [`01-核心原則/deploy-and-version-spec.md`](../01-核心原則/deploy-and-version-spec.md) | CHANGELOG 的格式規範 |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | CI/CD 變更管控規則 |
| [`03-專案/斗篷管理後台/cloak-admin-deploy.md`](../03-專案/斗篷管理後台/cloak-admin-deploy.md) | 斗篷管理後台部署細節 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 通用指令中的 SOP 2 代碼修改流程 |
