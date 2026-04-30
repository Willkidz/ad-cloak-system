---
title: "認證資訊彙整"
category: "config"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "所有服務的完整認證資訊：Cloudflare Account/API Token、D1 Database IDs、Facebook CAPI Token、Pixel IDs（10 個 ADS + 1 個 BC）、LINE OA 對應表（24 個含 Destination）、N8N API Key、Telegram Bot Token、GitHub PAT。"
id: "20260325-110100"
type: "config"
tags: [cloudflare, credentials, facebook, line, n8n, telegram]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件匯整所有服務的完整認證資訊，包括 Cloudflare API Token 與 D1 ID、Facebook CAPI Token 與 11 個 Pixel ID、24 個 LINE OA 的 Tag/ID/Destination 對應表、N8N API Key、GitHub PAT、Telegram Bot Token 與 Chat ID。本文件存放於 private repo，絕對禁止外洩或硬編碼至公開程式碼中。

# 認證資訊彙整

本文件匯整所有服務的完整認證資訊，供 AI 工作時查詢使用，避免重複詢問。

> **安全提示**：本文件存放於 private repo，僅供 AI 工作使用。絕對禁止將本文件內容外洩或硬編碼至公開程式碼中。操作前請確認已讀取 [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) 中的機密洩漏防護規則。

**最後更新**：2026-03-27（已更新 GitHub PAT，驗證有效）

---

## 一、Cloudflare

<rule id="cloudflare-credentials">

| 項目 | 值 |
| :--- | :--- |
| Account ID | `61f1eb800e48d2cf41ed9ddacf01581b` |
| API Token | `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` |

</rule>

### D1 資料庫 ID

| 資料庫名稱 | Database ID | 用途 |
| :--- | :--- | :--- |
| `godview-clicks` | `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` | 點擊日誌、cloak_logs、line_config、ad_config |
| `manus-memory（已廢棄）` | `915bd7ab-34a1-415b-b716-16995bccb978` | AI 系統記憶 |

---

## 二、Facebook CAPI

所有產品線共用同一個 CAPI Token，存放在 line-redirect Worker 環境變數中。

<rule id="facebook-capi-credentials">

| 項目 | 值 |
| :--- | :--- |
| CAPI Token | `EAAeahovhP0cBQ7DLruPWR3fcDRZAnvWCPi9SiFcA90cX5kcAZCxVcNFHth0VrAwBoItuK6kq10f9jJV7U45HxV4zEOC8hVpSrjScxYMQTngUHAaHZCW9lQEHLEEaOe0q40brrGffiyLkS8Wt7w8h1993PoxWt9PXqnQZB7ViXUBH548eNcWWRZBZBZCfVwvfejqbQZDZD` |
| Graph API 版本 | v25.0（最新） |
| CAPI Endpoint | `POST https://graph.facebook.com/v25.0/{pixel_id}/events` |

</rule>

### Pixel ID 對應表（10 個 ADS 像素 + 1 個 BC 像素）

| Tag | ADS Pixel ID | PREFIX | 產品線 | 狀態 |
| :--- | :--- | :--- | :--- | :--- |
| js/cs/ms/ls | `1296143099239936` | AS | 爆分王 | 正常 |
| jb/cb/mb/lb | `2030344604527767` | AB | 莊家剋星 | 正常 |
| jx/cx/mx/lx | `4353746171539948` | AX | 獨角仙 | 正常 |
| bf | `2153779865162231` | BF | 博富 | 正常 |
| jd | `867887526267694` | JD | 兩斤炭吉 | 正常 |
| n14 | `3441258769365705` | N14 | 洪金豹 | 正常 |
| n18 | `735170192897322` | N18 | 電子蕭甘丹 | 正常 |
| n20 | `1339967038176681` | N20 | 蘇主金 | [待確認] 曾回傳 400 |
| n22 | `962140406204890` | N22 | 阿奇說球 | 正常 |
| sz | `1701026614201171` | SZ | — | 正常 |

**BC 像素（全域共用）**：

| Pixel ID | 狀態 |
| :--- | :--- |
| `940592681819066` | 使用中 |
| `783186198187359` | [已過期：已替換為 940592681819066] |

---

## 三、LINE OA 對應表（24 個，含 Destination）

資料來源：D1 `godview-clicks` 資料庫的 `line_config` 表。

### 爆分王（AS 系列）

| Tag | LINE OA ID | 名稱 | Destination（User ID） |
| :--- | :--- | :--- | :--- |
| js | @935bicyi | 爆分王-電子打法秘笈 | `U94f93d9d3d607c1efe2f4154eccbf332` |
| cs | @999hqlmk | 爆分王-電子訊號程式 | `Uba79c3207e5da050001c777c2c5717ca` |
| ms | @001qlmgf | 爆分王-電子打法訊號 | `U7aada3e19a682beaf1d28ecc165b73c6` |
| ls | @849rldxt | 爆分王-24H訊號打法 | `U09f2161774085c17f2bfe57ef37effb6` |

### 莊家剋星（AB 系列）

| Tag | LINE OA ID | 名稱 | Destination（User ID） |
| :--- | :--- | :--- | :--- |
| jb | @448nzdkf | 莊家剋星-百家專家 | `Ua4b409d9374fcf2a2edeb474983cf3a8` |
| cb | @181pgtlc | 莊家剋星-百家殺手 | `U9eb938b30e48e102e36eff24696832da` |
| mb | @734xzzse | 莊家剋星-百家打莊姬 | `U0b8cc70ffd50f1644e67d0a6487b0c54` |
| lb | @604yogby | 莊家剋星-百家GPT | `Uf14f0347a9cc140e441ab83e22847efe` | LINE OA 已從 @bn58 更新為 @604yogby |

### 獨角仙（AX 系列）

| Tag | LINE OA ID | 名稱 | Destination（User ID） |
| :--- | :--- | :--- | :--- |
| jx | @652ahjmy | 獨角仙AI算牌程式 | `Ufc7b06eedb75a1fb69a56265f235448e` |
| cx | @697jsdma | 獨角仙AI算牌系統 | `U5717d3ae4604d92bb02671b4323f73ef` |
| mx | @525euwsy | 獨角仙AI預測系統 | `Ufef3e77c05a8aa7ecd1d0cce796c3f8c` |
| lx | @128hxyvp | 獨角仙AI預測程式 | `Udc2caab6aa6751d207a8369abc71564f` |

### 其他帳號

| Tag | LINE OA ID | 名稱 | Destination（User ID） |
| :--- | :--- | :--- | :--- |
| bf | @678eohsd | 博富 BOFU | `U0cdeed609619a3ea8f8027b01d216f0f` |
| jd | @520ufhmw | 兩斤炭吉 | `U6400f19a0d56f688b4997c2fffebb7c4` |
| n14 | @416nbqjl | 洪金豹 | `U0d18d0ef85a7200968002ad98333feda` |
| n15 | @745jaffa | 開版歪歪熊 | `U454703dd1ed39d71332747a69a134556` |
| n16 | @751tggmd | 晴兒 | `U7a4a33ecbcf38fa50d2d0727ea12ec8a` |
| n17 | @106tndmh | 郝士多 | `U3e09fe40176b71674bf5eae8e77a9d2e` |
| n18 | @013rgbjl | 電子蕭甘丹 | `Ud4569f5351c03a556e19729a8a3c2711` |
| n19 | @536uhfpf | 開版歪熊 | `U9aa3a89e3ea6a0af910290e941a1c47d` |
| n20 | @348ikfwm | 蘇主金 | `U822bb6807f10db0ec822086078a45fb4` |
| n21 | @075cocov | 費狀元-蕃薯地薯條 | `Uf5fc4eaa9fbbd5fbdd42ed8102abeba4` |
| n22 | @659jgxlp | 阿奇說球 | `Uc3278ae505836cfa1d73547f9bdbde15` |
| cb（舊） | @bn56 | 莊家剋星-百家殺手（舊） | `U9eb938b30e48e102e36eff24696832da` |
| sz | — | — | — |

> **備註**：cb 有新舊兩個 LINE OA ID（@181pgtlc 為新、@bn56 為舊），Destination 相同。sz 的 LINE OA 資訊待補充。

---

## 四、LINE Login

<rule id="line-login-credentials">

| 項目 | 值 | 用途 |
| :--- | :--- | :--- |
| Channel ID | `2009461354` | 斗篷系統 LINE Login 授權（bot_prompt） |
| Channel Secret | `ff76b1ae704b9ecc841808f57aeadd9a` | 斗篷系統 LINE Login 授權（bot_prompt） |
| Callback URL | `https://line-login-callback.laoqin1689.workers.dev/line-login/callback` | 接收授權碼的 Worker 端點 |

</rule>

---

## 五、N8N

<rule id="n8n-credentials">

| 項目 | 值 |
| :--- | :--- |
| 伺服器 | 5.189.150.66:5678 |
| 域名 | n8n.bexnua.store |
| 版本 | 2.12.3 |
| API Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g` |
| Admin API 認證 | `x-admin-key: godview2026` |

</rule>

---

## 五、GitHub

### GitHub Personal Access Token (PAT)

<rule id="github-credentials">

| 項目 | 值 | 權限 |
| :--- | :--- | :--- |
| Personal Access Token (PAT) | `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` | repo + workflow |
| 用途 | cloak-admin repo 部署、workflow 文件修改 | 已驗證 |

</rule>

### GitHub Actions Secrets（don-ai 專案）

| Secret 名稱 | 值 | 用途 | 狀態 |
| :--- | :--- | :--- | :--- |
| `CF_API_TOKEN` | `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` | Cloudflare API 認證（部署 Workers） | 已設定 |
| `CF_ACCOUNT_ID` | `61f1eb800e48d2cf41ed9ddacf01581b` | Cloudflare Account ID | 已設定 |
| `TELEGRAM_BOT_TOKEN` | `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc` | Telegram Bot 認證（sync-check 通知） | 已設定 |
| `TELEGRAM_CHAT_ID` | `7495585445` | Telegram Chat ID（接收通知） | 已設定 |

---

## 六、Telegram

<rule id="telegram-credentials">

| 項目 | 值 |
| :--- | :--- |
| Bot 名稱 | godview_monitor_bot（上帝視角監控） |
| Bot ID | 8676944081 |
| Bot Token | `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc` |
| Chat ID | 7495585445 |
| Chat 所有者 | 多恩 Don (@don5168) |
| 用途 | N8N 系統監控告警、CAPI Health Check 通知、GitHub Actions Worker 同步警告 |

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [服務清單.md](service-list-config.md) | 服務帳號設定清單（不含 Token），與本文件互補 |
| [N8N工作流結構.md](n8n-workflow-arch.md) | N8N 工作流的詳細結構與 Webhook 路徑 |
| [`09-歸檔/02-動態記憶/d1-kb-export-memory.md`](../09-歸檔/02-動態記憶/d1-kb-export-memory.md) | D1 匯出資料中的 credentials 分類，包含更多歷史認證記錄（已歸檔） |
| [`01-核心原則/security-and-safety-rules.md`](../01-核心原則/security-and-safety-rules.md) | 安全護欄規則，操作認證資訊前必讀 |

### LINE LIFF 完整清單（23 個 TAG）

> 更新日期：2026-04-06。lb 的 LINE OA 已從 @bn58 更新為 @604yogby。

| Tag | 分組 | LINE OA | 名稱 | LIFF ID | LIFF URL | 狀態 |
|:----|:---:|:--------|:------|:--------|:---------|:-----|
| bf | BF | @678eohsd | 博富 BOFU | `2009663969-IhPVLFKy` | https://liff.line.me/2009663969-IhPVLFKy | ✅ |
| jb | AB | @448nzdkf | 莊家剋星-百家專家 | `2009664206-5BXVdqiL` | https://liff.line.me/2009664206-5BXVdqiL | ✅ |
| cb | AB | @181pgtlc | 莊家剋星-百家殺手 | `2009664250-4BLc8ACL` | https://liff.line.me/2009664250-4BLc8ACL | ✅ |
| mb | AB | @734xzzse | 莊家剋星-百家打莊姬 | `2009664180-r6eOVZ0D` | https://liff.line.me/2009664180-r6eOVZ0D | ✅ |
| lb | AB | @604yogby | 莊家剋星-百家GPT | `2009664169-l7pOctNZ` | https://liff.line.me/2009664169-l7pOctNZ | ✅ |
| js | AS | @935bicyi | 爆分王-電子打法秘笈 | `2009664189-W61JHYEk` | https://liff.line.me/2009664189-W61JHYEk | ✅ |
| cs | AS | @999hqlmk | 爆分王-電子訊號程式 | `2009664226-30WBtSHr` | https://liff.line.me/2009664226-30WBtSHr | ✅ |
| ms | AS | @001qlmgf | 爆分王-電子打法訊號 | `2009664174-m2cwlShg` | https://liff.line.me/2009664174-m2cwlShg | ✅ |
| ls | AS | @849rldxt | 爆分王-24H訊號打法 | `2009664186-7yVDrKDn` | https://liff.line.me/2009664186-7yVDrKDn | ✅ |
| jx | AX | @652ahjmy | 獨角仙AI算牌程式 | `2009664145-Bm1nTzuI` | https://liff.line.me/2009664145-Bm1nTzuI | ✅ |
| cx | AX | @697jsdma | 獨角仙AI算牌系統 | `2009664141-OyQVNAp8` | https://liff.line.me/2009664141-OyQVNAp8 | ✅ |
| mx | AX | @525euwsy | 獨角仙AI預測系統 | `2009664163-FloR5xP4` | https://liff.line.me/2009664163-FloR5xP4 | ✅ |
| lx | AX | @128hxyvp | 獨角仙AI預測程式 | `2009664152-SUm42s6z` | https://liff.line.me/2009664152-SUm42s6z | ✅ |
| jd | BF | @520ufhmw | 兩斤炭吉 | `2009664200-1T7vs2Kg` | https://liff.line.me/2009664200-1T7vs2Kg | ✅ |
| n14 | N14 | @416nbqjl | 洪金豹 | `2009664103-Rot7yQE1` | https://liff.line.me/2009664103-Rot7yQE1 | ✅ |
| n15 | N15 | @745jaffa | 開版歪歪熊 | `2009664113-eUkzVtfO` | https://liff.line.me/2009664113-eUkzVtfO | ✅ |
| n16 | N16 | @751tggmd | 晴兒 | `2009664113-eUkzVtfO` | https://liff.line.me/2009664113-eUkzVtfO | ✅ 與 n15 共用 |
| n17 | N17 | @106tndmh | 郝士多 | `2009664115-5jvKickJ` | https://liff.line.me/2009664115-5jvKickJ | ✅ |
| n18 | N18 | @013rgbjl | 電子蕭甘丹 | `2009664124-VJz09CpT` | https://liff.line.me/2009664124-VJz09CpT | ✅ |
| n19 | N19 | @536uhfpf | 開版歪熊 | `2009664132-5wcSZilB` | https://liff.line.me/2009664132-5wcSZilB | ✅ |
| n20 | N20 | @348ikfwm | 蘇主金 | `2009664135-dXsbiajG` | https://liff.line.me/2009664135-dXsbiajG | ✅ |
| n21 | N21 | @075cocov | 武狀元 | `2009129136-BEXGdu4X` | https://liff.line.me/2009129136-BEXGdu4X | ✅ |
| n22 | N22 | @659jgxlp | 阿奇說球 | `2009664170-HW4ExLY7` | https://liff.line.me/2009664170-HW4ExLY7 | ✅ |

### 待補 LIFF 的 Tag

| Tag | LINE OA | 名稱 | 缺失項目 | 備註 |
|:----|:--------|:------|:---------|:-----|
| sz | — | — | LINE OA、LIFF ID、line_config | 需用戶提供完整資訊 |

LIFF Endpoint URL（所有 LIFF 共用）：
https://line-login-callback.laoqin1689.workers.dev/line-login/callback

