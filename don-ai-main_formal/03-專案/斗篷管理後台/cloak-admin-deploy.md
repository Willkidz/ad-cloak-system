---
title: "Cloak Admin GitHub Actions 部署流程修復"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "修復 cloak-admin 前台部署流程，實現 Manus runtime 腳本自動移除與 CI/CD 自動化部署。"
version: "v1.0"
id: "20260325-deploy-fix"
type: deploy
tags: [ci-cd, cloak-admin, cloudflare-pages, deployment, github-actions, manus]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件指導如何修復 `cloak-admin` 前台部署流程。核心挑戰在於移除生產環境中的 **`manus-runtime`** 腳本。方案選擇 **GitHub Actions (方案 B)**，在部署前執行 Python 腳本清理 `index.html`。修復包含：解決 `antd` v6 與 `pro-components` 的 **peer dependency 衝突**（使用 `--legacy-peer-deps`）與修正 `deploy.yml` 縮排錯誤。目前已通過 Run #15 成功部署至 `admin.bexnua.store`。

# Cloak Admin GitHub Actions 部署流程修復

- **日期**：2026-03-25
- **專案**：cloak-admin（廣告斗篷後台）
- **部署狀態**：已通過 GitHub Actions Run #15 成功部署
- **部署地址**：[https://admin.bexnua.store](https://admin.bexnua.store)

## 一、背景與問題

Cloak Admin 是廣告斗篷系統的管理後台，部署於 Cloudflare Pages。在部署過程中，遇到了 Manus runtime 腳本污染和部署方案選擇的挑戰。

### 1. Manus Runtime 腳本污染

<rule id="script-pollution">
生產環境的 HTML 文件不應包含任何開發或偵錯用途的腳本。如此次案例中的 `manus-runtime`、`debug-collector` 和 `manus-analytics` 腳本，它們會將內部工具（如偵錯工具列）暴露給外部用戶，構成潛在的安全風險。
</rule>

### 2. 部署方案選擇困境

在解決腳本污染問題時，我們評估了兩種部署方案：
- **方案 A**：Cloudflare Pages 直接連接 GitHub Repo。此方案設定簡單，但無法在構建過程中執行自訂腳本來移除 Manus runtime。
- **方案 B**：使用 GitHub Actions 建立 CI/CD 流程。此方案允許在部署前執行自訂的清理腳本，從而解決腳本污染問題。

**最終決策**：我們選擇了方案 B，透過 GitHub Actions 建立完整的 CI/CD 流程，以確保部署過程的靈活性和安全性。

## 二、技術問題解決方案

在實施方案 B 的過程中，我們解決了以下四個關鍵技術問題：

### 1. 自動移除 Manus Runtime 腳本

<step id="strip-scripts">
我們編寫了一個 Python 腳本，在 CI/CD 流程的構建步驟之後、部署步驟之前執行，使用正則表達式自動從 `index.html` 文件中移除三個指定的腳本標籤。
</step>

<example>
```python
import re
# 讀取構建後的 HTML 文件
with open('dist/public/index.html', 'r+') as f:
    html = f.read()
    # 使用正則表達式移除三個 Manus 相關腳本
    html = re.sub(r'<script id="manus-runtime">.*?</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<script src="/__manus__/debug-collector\.js" defer></script>', '', html)
    html = re.sub(r'<script\s+defer\s+src="https://manus-analytics\.com/umami"[^>]*></script>', '', html)
    # 將清理後的內容寫回文件
    f.seek(0)
    f.write(html)
    f.truncate()
```
</example>

### 2. 解決 npm 依賴衝突

<step id="fix-npm-conflict">
由於 `antd` v6 與 `@ant-design/pro-components` 之間存在 peer dependency 衝突，我們在 `npm install` 命令中加入了 `--legacy-peer-deps` 標誌以繞過此問題。
</step>

### 3. 修正 deploy.yml 語法錯誤

<step id="fix-yaml-indent">
我們修正了 `.github/workflows/deploy.yml` 文件中因 YAML 縮排錯誤而導致的解析失敗問題，確保了工作流程的正常執行。
</step>

## 三、最終部署工作流程 (deploy.yml)

以下是經過優化後的 `deploy.yml` 核心配置：

<example>
```yaml
- name: Install Dependencies
  run: npm install --legacy-peer-deps

- name: Build Project
  run: npm run build

- name: Strip Manus Runtime Scripts
  run: |
    python3 -c "
    import re
    file_path = 'dist/public/index.html'
    with open(file_path, 'r+') as f:
        html = f.read()
        html = re.sub(r'<script id=\"manus-runtime\">.*?</script>', '', html, flags=re.DOTALL)
        html = re.sub(r'<script src=\"/__manus__/debug-collector\.js\" defer></script>', '', html)
        html = re.sub(r'<script\\s+defer\\s+src=\"https://manus-analytics\\.com/umami\"[^>]*></script>', '', html)
        f.seek(0)
        f.write(html)
        f.truncate()
    "

- name: Deploy to Cloudflare Pages
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy dist/public --project-name=cloak-admin-frontend --commit-dirty=true
```
</example>

## 四、webdev 與 GitHub 同步問題 (2026-03-25)

### 問題背景

`cloak-admin` 前端進行了多項功能更新，但線上版本仍顯示舊版 UI。根本原因是 **`webdev` 開發專案和 GitHub repo 是兩個完全獨立的 git 倉庫**，兩者之間沒有自動同步。

| 倉庫 | Remote | 用途 | 部署目標 |
| :--- | :--- | :--- | :--- |
| `webdev` 專案 | S3 | `webdev_save_checkpoint` 推送到 S3 | Manus webdev 預覽 |
| GitHub repo | `github.com/laoqin1689/cloak-admin` | 手動 `git push` | Cloudflare Pages → `admin.bexnua.store` |

### 正確部署流程 (SOP)

<rule id="frontend-deployment-sop">
1. 在 `webdev` 環境中修改代碼。
2. 保存開發進度到 S3 (`webdev_save_checkpoint`)。
3. 手動將修改後的文件從 `webdev` 目錄複製到本地的 GitHub repo 目錄。
4. 提交並推送代碼到 GitHub (`git push origin main`)。
5. Cloudflare Pages 將自動觸發 build 和部署。
6. 清除瀏覽器快取後，在 `admin.bexnua.store` 上驗證更新。
</rule>

## 五、v1.14.0 功能規格確認

### 多鏈接策略 UI
- **分配策略**：使用 RadioGroup 提供「隨機打開」和「輪替打開」單選，兩者互斥。
- **IP 固定**：提供獨立的 Checkbox，可單獨勾選，與分配策略無關。

### Cloak 過濾條件
- **UI 實現**：提供四個 MultiSelect 多選下拉框，分別對應：允許國家、允許瀏覽器語言、允許作業系統、允許流量來源。
- **核心邏輯**：若某個過濾條件為空，則視為允許所有；若有選擇，則僅當訪客滿足所有已選條件時才會打開推廣頁。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [deploy-sop.md](../../06-SOP流程/deploy-sop.md) | 標準部署流程 |
| [CHANGELOG.md](../../CHANGELOG.md) | 全域變更日誌 |
