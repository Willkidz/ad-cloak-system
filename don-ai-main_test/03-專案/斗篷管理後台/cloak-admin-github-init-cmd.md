---
title: "指令：GitHub 版本管理初始化"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "一次性指令：將斗篷後台前端（cloak-admin, React+Vite）與後端 API（cloak-admin-api, Cloudflare Worker）分別建立 GitHub 私有倉庫，從 Cloudflare 拉取 v1.10.2 程式碼並推送，建立標準 Git 工作流。"
version: "v1.0"
id: "20260325-github-init"
type: cmd
tags: [cloak-admin, cloudflare-pages, cloudflare-workers, deployment, github, version-control]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件為一次性初始化指令，目標是將斗篷管理後台的前端（`cloak-admin`，React + Vite，部署於 Cloudflare Pages）與後端（`cloak-admin-api`，Cloudflare Worker）分別建立 GitHub 私有倉庫（帳號 `laoqin1689`），從 Cloudflare 拉取 v1.10.2 上線版本程式碼並推送為初始 commit。四個步驟：(1) 用 `gh repo create --private` 建立 `cloak-admin` 和 `cloak-admin-api` 兩個倉庫；(2) 從 Cloudflare Pages Dashboard 下載前端或用 `wrangler pages download` 拉取後端；(3) `git init` → `git push` 推送初始版本；(4) 備份 `shadow-cloak`、`money-page`、`line-redirect` 等 Worker 腳本。完成後所有開發須遵循 pull → commit → push 流程，commit 訊息格式為 `類型: 簡要描述`。

# 指令：GitHub 版本管理初始化

本文件旨在說明如何將「斗篷管理後台」專案的現有程式碼，完整地遷移至 GitHub 進行版本管理。此為一次性的初始化指令，建議在開始進行新的錯誤修復或功能開發前完成，以確保所有後續變更都納入版本控制。

---

## 目標

將斗篷後台的所有前端與後端程式碼，分別建立獨立的 GitHub 版本庫（Repository），並將現有程式碼作為初始版本推送上去。此後，所有程式碼的修改都必須遵循 Git 工作流程。

---

## GitHub 帳號資訊

| 項目 | 值 |
| :--- | :--- |
| 帳號 | `laoqin1689` |
| 相關版本庫 | `shadow-cloak-backup`、`godview-system` |

---

## 執行步驟

<step id="1">

### 步驟一：建立 GitHub 版本庫

在 GitHub 上建立以下兩個私有（Private）版本庫。

| 版本庫名稱 | 內容描述 |
| :--- | :--- |
| `cloak-admin` | 後台前端專案（React + Vite），將部署於 Cloudflare Pages。 |
| `cloak-admin-api` | 後台 API 專案（Cloudflare Worker）。 |

<example id="gh-create-repos">

可使用 GitHub CLI 快速建立：

```bash
gh repo create Willkidz/ad-cloak-system --private
gh repo create Willkidz/ad-cloak-system-api --private
```

</example>

</step>

<step id="2">

### 步驟二：從 Cloudflare 拉取現有程式碼

#### 前端專案 (cloak-admin)

Cloudflare Pages 的原始碼可透過以下方式取得：

- **方法一**：若本地仍保留專案開發目錄，可直接使用。
- **方法二**：從 Cloudflare 儀表板下載最新部署的版本。路徑：`Workers & Pages` → `cloak-admin` → `Deployments` → 選擇最新的部署 → `View deployment` → `Download deployment`。

#### 後端 API (cloak-admin-api)

<example id="download-worker">

可使用 `wrangler` 或 `curl` 下載 Worker 腳本。

- **方法一（建議）**：使用 Wrangler CLI

```bash
npx wrangler pages download cloak-admin-api
```

- **方法二**：使用 cURL [已過期：API 金鑰可能已失效，請使用最新的金鑰或改用 wrangler 指令]

```bash
# 注意：下方的 Account ID 與 Bearer Token 需要替換成有效金鑰
curl -s "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/cloak-admin-api" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -o cloak-admin-api.js
```

</example>

</step>

<step id="3">

### 步驟三：推送程式碼至 GitHub

#### 前端專案

<example id="push-frontend">

```bash
cd cloak-admin
git init
git remote add origin https://github.com/Willkidz/ad-cloak-system.git
git add .
git commit -m "init: Initial commit of production frontend code (v1.10.2)"
git branch -M main
git push -u origin main
```

</example>

#### 後端 API

<example id="push-backend">

```bash
mkdir cloak-admin-api && cd cloak-admin-api
# 將下載的 Worker 程式碼 (cloak-admin-api.js) 移入此目錄
git init
git remote add origin https://github.com/Willkidz/ad-cloak-system-api.git
git add .
git commit -m "init: Initial commit of production API code (v1.10.2)"
git branch -M main
git push -u origin main
```

</example>

</step>

<step id="4">

### 步驟四：備份其他 Worker 腳本

建議將以下相關的 Worker 腳本也備份至 GitHub，可存放於現有或新建的版本庫中。

| Worker 名稱 | 建議版本庫 |
| :--- | :--- |
| `shadow-cloak` | `shadow-cloak-backup`（已存在） |
| `money-page` | 新建版本庫或存放於 `godview-system` |
| `line-redirect` | 新建版本庫或存放於 `godview-system` |

</step>

---

## 後續工作流程

<rule id="git-workflow">

完成初始化後，所有開發工作應遵循以下 Git 流程：

1. **開始修改前**：執行 `git pull` 拉取最新程式碼。
2. **完成修改後**：執行 `git add .` 與 `git commit -m "描述改動"` 提交變更。
3. **部署上線後**：執行 `git push` 將本地變更推送到遠端版本庫。
4. **Commit 訊息規範**：建議格式為 `類型: 簡要描述`，例如 `feat: CTA 連結與 TAG 歸因串接` 或 `fix: 素材中心預覽修復`。

</rule>

---

## 完成確認

- [ ] `cloak-admin` 版本庫已建立，且 v1.10.2 上線版本程式碼已推送。
- [ ] `cloak-admin-api` 版本庫已建立，且 v1.10.2 上線版本程式碼已推送。
- [ ] 其他相關 Worker 程式碼已完成備份。

---

## 結論

完成上述步驟後，斗篷管理後台的前後端程式碼已成功納入 GitHub 版本管理。這為團隊協作、版本追蹤和持續整合（CI/CD）奠定了基礎，所有後續開發都應基於此流程進行。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [cloak-admin-deploy-config.md](cloak-admin-deploy-config.md) | 部署配置詳情 |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 環境資訊與 Cloudflare 帳號 |
