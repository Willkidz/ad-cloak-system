---
title: "斗篷管理後台部署流程與進度追蹤"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "記錄一次因 webdev 環境與 GitHub 倉庫未同步，導致 Cloudflare Pages 部署失敗的事件，並確立了正確的前端部署流程與多項功能規格。"
id: "20260325-101300"
type: deploy
tags: [cloak-admin, cloudflare-pages, deployment, github-actions]
status: archived
created: "2026-03-25"
updated: "2026-03-29"
---

> **TL;DR**: 本文件記錄 2026-03-25 部署失敗事件。核心問題在於 **`webdev` 開發環境與 GitHub 倉庫未同步**，導致 `admin.bexnua.store` 持續部署舊版 `v1.13.1`。修復方案為手動同步 20 個文件並升級至 **`v1.14.0`**。此版本成功實現了 **MultiSelect**、**RadioGroup**（隨機/輪替策略）及 **IP 固定 Checkbox**。

# 斗篷管理後台部署流程與進度追蹤 (2026-03-25)

本文檔記錄了在斗篷管理後台（cloak-admin）開發過程中，一次關鍵的部署問題及其解決方案，並同步更新了相關的功能規格與待辦事項。核心問題在於開發環境 (`webdev`) 與正式部署觸發源（GitHub Repo）之間缺乏同步機制，導致前端更新無法正確部署。

## 部署流程問題與修復

### 問題背景

在 2026 年 3 月 25 日，`cloak-admin` 前端進行了多項功能更新，但在多次部署後，線上版本 (`admin.bexnua.store`) 仍顯示舊版 UI。經過排查，根本原因被確認為 **`webdev` 開發專案和 `Willkidz/ad-cloak-system` GitHub repo 是兩個完全獨立的 git 倉庫**，兩者之間沒有自動同步。

### 技術細節

開發與部署流程涉及兩個不同的代碼倉庫，其用途和目標各不相同，這是導致問題的核心。

| 倉庫 | Remote | 用途 | 部署目標 |
| :--- | :--- | :--- | :--- |
| `webdev` 專案 (`/home/ubuntu/cloak-admin`) | `s3://vida-prod-gitrepo/webdev-git/...` | `webdev_save_checkpoint` 推送到 S3 | Manus webdev 預覽 |
| GitHub repo (`Willkidz/ad-cloak-system`) | `https://github.com/Willkidz/ad-cloak-system.git` | 手動 `git push` | Cloudflare Pages → `admin.bexnua.store` |

### 關鍵發現

- `webdev_save_checkpoint` **只會將代碼推送到 S3，並不會推送到 GitHub**。
- Cloudflare Pages 的部署流程由 GitHub repo 的 `main` branch 自動觸發 build，最終部署到 `admin.bexnua.store`。
- 所有在 `webdev` 環境中完成的修改（如 MultiSelect、RadioGroup、IP 固定 Checkbox 等）都只存在於 S3，從未同步到 GitHub。
- **結果**：Cloudflare Pages 持續部署舊的 `v1.13.1` 版本，導致新功能無法在線上環境生效。

### 正確部署流程 (SOP)

<rule id="frontend-deployment-sop">
為了確保 `webdev` 環境的修改能正確部署到生產環境，必須嚴格遵循以下手動同步流程：
1.  在 `webdev` 環境中修改代碼。
2.  保存開發進度到 S3 (`webdev_save_checkpoint`)。
3.  手動將修改後的文件從 `webdev` 目錄複製到本地的 GitHub repo 目錄。
4.  提交並推送代碼到 GitHub (`git push origin main`)。
5.  Cloudflare Pages 將自動觸發 build 和部署。
6.  清除瀏覽器快取後，在 `admin.bexnua.store` 上驗證更新。
</rule>

### 修復動作

<step id="fix-20260325-deployment">
1.  手動將 `webdev` 專案中的 20 個已修改文件複製到本地的 GitHub repo。
2.  將 commit 標記為 `v1.14.0` 並推送到 GitHub `main` branch。
3.  等待 Cloudflare Pages 自動完成重新部署。
4.  **驗證結果**：成功。新的 JS bundle hash 為 `assets/index-DR4e5G9r.js`，頁面中已包含 `ip_sticky`、`隨機打開`、`輪替打開` 等新功能。
</step>

## 功能規格確認

### 多鏈接策略 UI
- **分配策略**：使用 RadioGroup 提供「隨機打開」和「輪替打開」單選，兩者互斥。
- **IP 固定**：提供獨立的 Checkbox，可單獨勾選，與分配策略無關。

### Cloak 過濾條件
- **UI 實現**：提供四個 MultiSelect 多選下拉框，分別對應以下過濾維度：
    - **允許國家**：TW, JP, US, KR, HK, SG, MY, TH, VN, ID, PH, AU, GB, CA, DE, FR
    - **允許瀏覽器語言**：zh-TW, zh-CN, ja, ko, en, th, vi, id
    - **允許作業系統**：Android, iOS, Windows, macOS, Linux
    - **允許流量來源**：facebook.com, instagram.com, tiktok.com, google.com, youtube.com, line.me, twitter.com, whatsapp.com, direct
- **核心邏輯**：若某個過濾條件為空，則視為允許所有（通用）；若有選擇，則僅當訪客滿足所有已選條件時，才會打開推廣頁。

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-deploy.md](cloak-admin-deploy.md) | GitHub Actions 部署修復 |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 |
| [CHANGELOG.md](../../CHANGELOG.md) | 全域變更日誌 |
