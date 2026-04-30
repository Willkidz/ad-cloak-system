---
title: "隱者斗篷 — 安全頁與推廣頁部署指令"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "提供「隱者斗篷」系統中安全頁與推廣頁的部署指令、架構說明及測試驗證流程，確保系統能正確根據訪客身份派發對應頁面。"
version: "v1.0"
id: "20260325-024356"
type: project-doc
tags: [cloaking, cloudflare, deployment, money-page, safe-page, shadow-cloak]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件為「隱者斗篷」技術組的執行手冊。定義了系統架構（`shadow-cloak` 作為入口，`safe-page` 為白頁，`money-page` 為真頁），並提供 Cloudflare API 資訊與具體的 `curl` 部署指令。包含安全頁與推廣頁的設計規範（如禁用博弈詞彙、手機優先設計）及五項關鍵測試驗證流程，嚴禁出現 HTTP 522 錯誤。

# 隱者斗篷 — 安全頁與推廣頁部署指令

**文件版本**：v1.0  
**產出單位**：Manus 規劃組  
**執行單位**：隱者斗篷技術組

---

## 1. 系統架構總覽

| 角色 | 網域 | Worker 名稱 | 說明 |
| :--- | :--- | :--- | :--- |
| **廣告入口** | `bexnua.store` | `shadow-cloak` | 偵測訪客身份，機器人導向安全頁，真人導向推廣頁。 |
| **安全頁** | `raxnto.shop` | `safe-page` | 提供給 FB／Google 爬蟲檢視的白頁。 |
| **推廣頁** | （內嵌或獨立） | `money-page` | 提供給真人用戶檢視的落地頁。 |

---

## 2. Cloudflare API 資訊

<rule id="cloudflare-api-info">
請妥善保管以下 API 資訊，避免外洩。
</rule>

```text
API 權杖：    cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f
帳戶 ID：     b2471e0c307123945bdf1ce1b025563f
raxnto.shop 區域 ID：  fe971e900ef0af475d98ad6f9b866d4e
bexnua.store 區域 ID： 3d18bc84f1840bb4423a39030f5fc10b
```

---

## 3. 任務一：部署安全頁 (safe-page)

### 3.1. 設計規範
<rule id="safe-page-design-rules">

- **視覺風格**：白底、專業現代設計，呈現為「數位娛樂／休閒遊戲平台」。
- **禁用詞彙**：博弈、賭、賭場、賭博、casino、gambling、betting。
- **技術要求**：純 HTML+CSS 內嵌，不依賴外部資源，響應式設計。

</rule>

### 3.2. 部署指令
<step id="deploy-safe-page">

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/safe-page" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @safe-page.js
```

</step>

---

## 4. 任務二：部署推廣頁 (money-page)

### 4.1. 設計規範
<rule id="money-page-design-rules">

- **視覺風格**：深色+金色+綠色，奢華感與衝擊力，主題「博富娛樂城」。
- **核心文案**：註冊就送 20000。
- **技術要求**：手機優先，內嵌金幣飄落、按鈕脈衝等 CSS 動畫。

</rule>

### 4.2. 部署指令
<step id="deploy-money-page">

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/money-page" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @money-page.js
```

</step>

---

## 5. 任務三：更新 shadow-cloak (v1.1)

### 5.1. 修改方案
<rule id="shadow-cloak-solution">
將 `MONEY_PAGE_ORIGIN` 指向 `money-page.laoqin1689.workers.dev` 以解決 522 錯誤。
</rule>

### 5.2. 部署指令
<step id="deploy-shadow-cloak">

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/shadow-cloak" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @shadow-cloak.js
```

</step>

---

## 6. 測試驗證流程

| 測試項目 | 指令範例 | 預期結果 |
| :--- | :--- | :--- |
| **安全頁直連** | `curl -I https://raxnto.shop/` | HTTP 200 |
| **機器人訪問** | `curl -s https://bexnua.store/ -H "User-Agent: Googlebot/2.1"` | 回傳安全頁 HTML |
| **真人訪問** | `curl -s https://bexnua.store/ -H "User-Agent: iPhone..."` | 回傳推廣頁 HTML |
| **空 UA 訪問** | `curl -s https://bexnua.store/ -H "User-Agent: "` | 回傳安全頁 HTML |

<rule id="test-no-522">
**所有測試過程中，絕對不應出現 522 錯誤。**
</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [shadow-cloak-phase2-deploy.md](shadow-cloak-phase2-deploy.md) | 部署執行報告 |
| [shadow-cloak-tech-collab-cmd.md](shadow-cloak-tech-collab-cmd.md) | 技術協作規範 |
| [shadow-cloak-feature-ui-spec.md](shadow-cloak-feature-ui-spec.md) | 完整功能規劃 |
