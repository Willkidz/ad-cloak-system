---
title: "全專案交接文件"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "廣告投放系統多角色協作專案的完整交接指南，含全局基礎設施、角色區塊、API 金鑰與協作規範。"
id: "20260325-024356"
type: "task"
tags: [ai-agent, collaboration, todo]
status: "deprecated"
created: "2026-03-25"
updated: "2026-03-29"
activation_glob: null
---

> **⚠️ DEPRECATED (2026-03-29)**：本文件部分狀態已過期（基於 2026-03-24 的資料），最新系統狀態請以 `.ai/active-context.md` 和 `.ai/memory.md` 為準。

> **TL;DR**: 本文件為廣告投放系統多角色協作專案的完整交接指南。包含 2026-03-24 完成的 7 項核心修復、全局基礎設施（Cloudflare/n8n/Telegram/GitHub API 金鑰）、四大產品線像素對應表，以及規劃組與上帝視角技術組的專屬開場指令與協作規範。本文件旨在讓新接手的 AI Agent 透過複製對應角色的「開場指令」即可無縫接軌任務。

# 全專案交接文件

> **最後更新**：2026-03-25 11:00
> **文件用途**：本文件為廣告投放系統多角色協作專案的完整交接指南，旨在讓新接手的 AI Agent 能夠無縫接軌各項任務。
> **重要**：每次專案有變更時，規劃組會更新本文件。請始終使用最新版本。

---

## 第一部分：近期完成的修復（2026-03-24）

<rule id="recent-fixes-20260324">

| 項目 | 內容 | 根因 / 說明 |
| :--- | :--- | :--- |
| Meta CAPI Token | 更新為 `EAAeahovhP0cBRKZAjLv...` | 舊 token 已失效（OAuthException code 190） |
| n8n crypto 修復 | `require('crypto')` 改為 `$helpers.crypto` | n8n v2.12.3 Code 節點不支援 `require()` |
| n8n Workflow URL | 指向舊雲端 URL 已改為自架 D1/n8n | 遷移至自架環境後的端點修正 |
| 記憶大掃除 | 刪除 40 筆過時記憶，更新 3 筆 | 減少 Token 消耗，總數降至 260 |
| Cloudflare Token | 更新為 `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` | 舊 token 已失效 |
| D1 Database ID | 修正 godview-clicks、manus-memory、shadow-cloak-logs ID | 確保資料庫存取路徑正確 |
| n8n API Key | 已更新為自架版本最新 Key | 遷移後的認證更新 |

</rule>

---

## 第二部分：如何使用本文件

本文件的核心目的是為了讓老闆能夠輕鬆管理多個負責不同專案的 AI Agent 角色。每個角色都有其專屬的職責與工作範圍。

使用方式非常簡單：老闆只需複製對應角色的「開場指令」，並貼給新的 AI Agent，該 Agent 就能立即了解自己的身分、職責、所需 API 金鑰以及當前任務狀態，進而接手工作。每個角色區塊都是獨立且自包含的。Agent 在接手任務時，只需要閱讀自己的專屬區塊以及「全局基礎設施」區塊，即可獲取所有必要資訊，無需額外查閱其他文件。

---

## 第三部分：全局基礎設施（所有角色共用）

本區塊包含所有專案共用的基礎設施資訊與 API 金鑰。請各角色依據自身需求取用。

### 1. Cloudflare 帳號資訊

- **API Token**: `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920`
- **Account ID**: `b2471e0c307123945bdf1ce1b025563f`
- **D1 Database (godview-clicks) ID**: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`

**9 個 Zone 清單與 Zone ID：**

| 網域 | Zone ID | 狀態 |
| :--- | :--- | :--- |
| freshpathlab.com | `3558fb741de4523d04af78db910e7376` | active |
| bexnua.store | `3d18bc84f1840bb4423a39030f5fc10b` | active |
| fyntro.lol | `b5afdca55dc4c4d36e67a820ef6985b5` | active |
| kravdo.lol | `181854ab87188e9df52c3d7b27266a6b` | active |
| mopliv.site | `fe617bfee6e045cb0cbe2d02d829d17a` | active |
| raxnto.shop | `fe971e900ef0af475d98ad6f9b866d4e` | active |
| tuvral.store | `103c0dfe078db961b282ff27e0999763` | active |
| velphi.shop | `e577749851d99334fcea33eaa1a5b09d` | active |
| zuntek.site | `5e9dc7451c2214b116b4a6e6b44481e5` | active |

### 2. n8n 系統資訊

遷移已全面完成，自架 n8n 已取代雲端。雲端訂閱待端對端測試通過後取消。

- **n8n 雲端（即將取消訂閱）**
  - URL: `https://godview.app.n8n.cloud`
  - API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzIyYjczMy01Yzc4LTRjNTktODI5MS1kODQzZjA1MDk2YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWMyNTRiNDgtOWE4Ni00OTY1LWI5NjctNDA5ZTJkMzJiODUwIiwiaWF0IjoxNzc0MjQ4MzIyfQ.aq0uVY3i2H6_IFnCxtnykpfm9q4g5vGFVQFXhJ6UfqA`
- **n8n 自架（已完成部署與設定）**
  - VPS 供應商: Contabo | VPS IP: `5.189.150.66` | Root 密碼: `b7dXD2h1O1ZF4`
  - n8n 登入網址: `https://n8n.bexnua.store`（已設定 SSL + nginx 反向代理）
  - 直接 IP 存取: `http://5.189.150.66:5678`
  - 管理員帳號: `admin@bexnua.store` | 管理員密碼: `ShadowCloak2026!`
  - API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZjEzNjZiMC0wMTEwLTQxYTEtYWY3OS1jNWI3YjkyNmZmMGEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYmY2MWFiNjAtMDA3MS00OTBkLWE3OWUtOGM1Zjc1NzdjMTI1IiwiaWF0IjoxNzc0MzAzNDkyfQ.xwfKixuFkMTz-U4n-noV_UPabEx_f9Rn6SJPEgVlG-g`

**n8n 遷移進度（已完成）：**
- ✅ 11 個工作流已匯入，6 個核心工作流已啟用
- ✅ DataTables 遷移到 D1：ad_config 20 筆、line_config 24 筆
- ✅ Config API 工作流已改為讀取 D1
- ✅ line-redirect Worker 的 CONFIG_API_URL 和 N8N_WEBHOOK_TOKEN 已改指向自架 n8n
- ✅ SSL 憑證已安裝（Let's Encrypt + nginx 反向代理）
- ✅ 所有 LINE OA 的 Webhook URL 已改為 `https://n8n.bexnua.store/webhook/line-follow`
- ✅ Time Attribution 工作流 Credential 已修復（Cloudflare D1 Auth）
- ✅ CAPI 回傳事件從 Lead 改為 CompleteRegistration（v3.1 事件架構調整）
- ✅ line-redirect Worker 已補齊裝置/地理資訊欄位
- ⏳ 端對端真實測試待執行；測試通過後即可取消雲端 n8n 訂閱

### 3. Telegram Bot

- **Bot Name**: godview_monitor_bot
- **Token**: `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc`
- **Chat ID**: `7495585445`

### 4. GitHub 資訊

- **PAT (Personal Access Token)**: `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`
- **Private Repo**: `shadow-cloak-backup`

### 5. 四大產品線與像素一覽表

| 產品線 | 代號 | 類型 | 像素 ID |
| :--- | :--- | :--- | :--- |
| 博富 | BF | 信用版娛樂城 | `2153779865162232` |
| 爆分王 | AS (js/cs/ms/ls) | 電子遊戲 AI 預測 | `1296143099239936` |
| 莊家剋星 | AB (jb/cb/mb/lb) | 百家樂 AI 算牌 | `2030344604527768` |
| 獨角仙 | AX (jx/cx/mx/lx) | 百家樂 AI 預測（網頁版） | `4353746171539948` |

- **BC 受眾像素**: `940592681819066`

---

## 第四部分：角色區塊

本部分為各個 AI Agent 角色的專屬工作區塊。老闆只需複製對應的「開場指令」給新的 Agent，即可讓其接手工作。

### 角色 1：規劃組

**職責**：統籌所有專案、協調各技術組、品質管理、進度追蹤。

**特助系統記憶（v2 五層記憶架構）**：
- **state**: 當前系統狀態與進度。
- **convention**: 專案協作與開發規範。
- **architecture**: 系統架構與設計文件。
- **issue_resolved**: 已解決的問題與經驗總結。
- **context**: 專案背景與上下文資訊。
- **機制**: 包含 GPA 評分機制、Boot/Shutdown 交接流程、事前/事後審核。

**協作規則**：
- 與技術組溝通統一使用版本號（如 v1.2）。
- 技術組回報格式需精簡，僅包含版本、狀態與測試結果。
- 嚴格遵守檔案命名規則，減少不必要的 token 消耗。

**全專案待辦優先排序**：
1. [P0] 端對端測試通過後取消雲端 n8n 訂閱。
2. [P1] 5 個 OA Token 重新授權。
3. [P1] ad_config 重構（type 命名 + BC 像素納入）。
4. [P1] 追蹤火鳥 fbclid 傳遞修復。
5. [P1] 獨角仙用發送訊息廣告測試、剋星用表單廣告測試（比較 Lead 質量）。
6. [P2] 隱者斗篷測試（用剋星和獨角仙跑）。
7. [P2] 博富素材 BF-02~06 過審測試。
8. [P2] 火鳥域名 DNS 移到 Cloudflare（待隱者斗篷測試穩定後）。
9. [P2] 補上 5 個缺少像素的 OA。
10. [P3] 競品監控系統開發。
11. [P3] 管理後台 UI 重做（Google Stitch + UI UX Pro Max）。

**開場指令**：
<example>
你是「規劃組」。負責統籌所有專案、協調各技術組、品質管理與進度追蹤。你需要維護 v2 五層記憶架構，執行 GPA 評分機制、Boot/Shutdown 交接流程。

API 金鑰：
- Cloudflare: `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` / `b2471e0c307123945bdf1ce1b025563f`
- n8n 自架: `https://n8n.bexnua.store` / `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Telegram: `8676944081:AAFmbZj9urvewQ8CWZpf3MSrR6yx_nQk3Kc` / `7495585445`
- GitHub: `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`

當前狀態：n8n 遷移已完成，自架環境運行中。上帝視角系統已完成 BC 像素鏈路修復，隱者斗篷系統已完成 v2.5。
待辦：[P0] 取消雲端 n8n 訂閱；[P1] OA Token 重新授權；[P1] ad_config 重構。
</example>

---

### 角色 2：上帝視角技術組

**職責**：FB 廣告歸因系統的技術開發與維護。

**系統架構**：
- **Cloudflare Worker**: `line-redirect`（主力 Worker，處理所有子域名流量）。
- **D1 Database**: `godview-clicks`。
- **n8n Workflows**：Config API、上帝視角_Admin API、上帝視角_Time Attribution（核心歸因）、DNS Auto-Sync、上帝視角_CAPI Health Check、系統監控。
- **歸因邏輯**：LINE Webhook follow → 45 秒內 D1 匹配 → Meta CAPI CompleteRegistration 回傳。
- **事件架構（v3.1 更新）**：落地頁廣告（PageView → Contact → CompleteRegistration）、表單廣告（Lead → CompleteRegistration）。

**開場指令**：
<example>
你是「上帝視角技術組」。負責 FB 廣告歸因系統的技術開發與維護，涵蓋 Cloudflare Worker (line-redirect)、n8n Workflows、D1 資料庫與 Meta CAPI 的整合。

API 金鑰：
- Cloudflare: `cfut_2txZqzDurNUnWLissHBu48MGvxmFkNms85wqBqSTd36be920` / `b2471e0c307123945bdf1ce1b025563f`
- D1 Database ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`
- n8n 自架: `https://n8n.bexnua.store` / `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

當前架構：主力 Worker 為 line-redirect，資料庫為 godview-clicks。歸因邏輯基於 LINE Webhook 與 D1 匹配。
</example>

---

## 第五部分：LINE OA Token 完整清單

| Tag | LINE OA ID | 名稱 | Destination（User ID） | Token |
| :--- | :--- | :--- | :--- | :--- |
| js | @935bicyi | 爆分王-電子打法秘笈 | `U94f93d9d3d607c1efe2f4154eccbf332` | `WA0AAyabp495wh0FGa+O0hyCKxu24SIFfUdvYq+XCvYRWS+2mYHobHGBxRyvo+wh+ddEVMOjTacypAulP4b9l/qb4KxdfJnE9IYw1Hp0w/g3vpY9C0yDAT2ypGtARctnM1sp3+9TB0H1Ky1ltDoPtwdB04t89/1O/w1cDnyilFU=` |
| cs | @999hqlmk | 爆分王-電子訊號程式 | `Uba79c3207e5da050001c777c2c5717ca` | `dvEdEP8a80tGP4wdobKmsv//MZoBJJjYwsu99R167MirrJSto6xdSzJTy8ybQSnFqjewl1wDArf8woZRpjULhsKWZryIcoid2bvMVu0diPb7tWcwzs4kMLTnl8ftNeW/tr1nFJu1vvJqGyDZXxoqpwdB04t89/1O/w1cDnyilFU=` |
| ms | @001qlmgf | 爆分王-電子打法訊號 | `U7aada3e19a682beaf1d28ecc165b73c6` | `0+1SDnFis1yWjkeHMk6+F/s71U8wJryGRTGKMOdRN/vRAsAap3IzngaVTqs4e0cELDENZmSHfaDOwBYGbbzg5CTmyCIfhYw09mbr1nSeQIcgqKflOk+dt41H5RZzk4hSYwli4jCsaYzBKxxbm9iHqAdB04t89/1O/w1cDnyilFU=` |
| ls | @849rldxt | 爆分王-24H訊號打法 | `U09f2161774085c17f2bfe57ef37effb6` | `vQqd7yTXJvJ0lr1GE6jIybygry6MKp8FU+/X3fqolqzyL3th9vjYrmaxgJzhUz5zuKuwlK77Nke6q9pfJ3wmmGTPlaNx+oXC5CYgQn9CthPA4GYlDSvTtCPzn6wViZnCHJgHuFTU/utlKoX07H/KogdB04t89/1O/w1cDnyilFU=` |
| jb | @448nzdkf | 莊家剋星-百家專家 | `Ua4b409d9374fcf2a2edeb474983cf3a8` | `X3yyU+FyGAMNz7XFZIJz7KvoFtlrlVLT61TI9g9nXK2m6V8RAlsT8LR8XyVv6hbw0s5v04d7xOAv8q2i4Peb2FSLa5PzRa/XGF36R6GNAI8EzND2DxudimpWtZ0xCmCq0Pl0Gx7TishapqKfKe5kMAdB04t89/1O/w1cDnyilFU=` |
| cb | @181pgtlc | 莊家剋星-百家殺手 | `U9eb938b30e48e102e36eff24696832da` | `WlRCzUPD+Y0Hda25W0T7GOOHczo6Po5icJHcp+auugiwrYQn+ZPzNKJwHZhoaonsbY2+kRDV3c108FPLpinNrPwIFY9Iz3XpueDHypnEeUoUH8kkqbIAiDGgS4dvH9qWIlIUAPETn9f4WZp/xW/CFwdB04t89/1O/w1cDnyilFU=` |
| mb | @734xzzse | 莊家剋星-百家打莊姬 | `U0b8cc70ffd50f1644e67d0a6487b0c54` | `NB+/nMgRv8sIocIFk5qN7n5dwoeiLb0X7B6zidMvDJPun8yB6jOTx42OcejwsVgO8y8Gwk/ddQ8HViADMu4/rMyHxJ6kmObbQr5dt0wn6cEXO1Bxm+WZ/8W3yuiSgfAszddfGk5kC+XrqDuOTt0A/gdB04t89/1O/w1cDnyilFU=` |
| lb | @bn58 | 莊家剋星-百家GPT | `Uf14f0347a9cc140e441ab83e22847efe` | `PTq4JsnqaY2Iv6YsQGlJ8Scm7RuXwS/r5rKOdVxLPLjfm0CqYCA5Uz0+6AIuNrgqVVjGZItFq00TM3rFE5eRKMbpv9EN4D1SCH9Z5d44oX9VWzHoUiafpxF9k0C7kOfIBOd4F5U3e6/sCwzrXJjfkQdB04t89/1O/w1cDnyilFU=` |
| jx | @652ahjmy | 獨角仙AI算牌程式 | `Ufc7b06eedb75a1fb69a56265f235448e` | `xQpu++MOLLvQRks0CV5XEKGJTbYIeZSi5RJkNCyoOuwaHt96tBehoKurIEh/S2BzAl7rfflsuqgS6TcAwyiAO1hDhHpHZC+mOEnVc5vmy4fI4KSd8TwYPk2Te8QsyW1Ls8sOu29tJM/LQf1MzJ0GbgdB04t89/1O/w1cDnyilFU=` |
| cx | @697jsdma | 獨角仙AI算牌系統 | `U5717d3ae4604d92bb02671b4323f73ef` | `vMpjLiPbA4kVm5rczKAODQReWrajOcaZWqOEYTwMzgI/16H/ieJqnXY/mlxXkW5GoAgHlD0VsXAiyPHeeUxM+ZK/gDaExmjKEjTsol9bqmilS4Y3gfdF3lh9Ll7SfcjGjvjSmnJzBORoEiF49pDbaQdB04t89/1O/w1cDnyilFU=` |

---

## 第六部分：協作規範與版本管理

<rule id="collaboration-standards">

### 1. 規劃組與技術組的溝通規則
- 規劃組出指令時標版本號（如 v1.2）。
- 技術組回報格式：版本 + 狀態 + 測試結果。
- 不需要附完整程式碼或報告，除非主動要求。

### 2. 版本紀錄規則
- 隱者斗篷：用 v1.x 格式，每個功能模組一個版本。
- 上帝視角：用 v3.x 格式（事件架構版本）。
- 檔案命名格式：`{系統名}_{Worker名稱}_v{版本號}.js`。

</rule>

---

## 第七部分：檔案索引

| 檔案名稱 | 用途說明 |
| :--- | :--- |
| [`07-配置與環境/auth-info-config.md`](../07-配置與環境/auth-info-config.md) | 包含所有系統連線資訊、API 金鑰、Workflow 清單與 Zone 清單。 |
| [`shadow-cloak-changelog.md`](shadow-cloak-changelog.md) | 隱者斗篷系統的完整版本開發與部署紀錄。 |
| [`project-todo.md`](project-todo.md) | 全局待辦項目清單，以隱者斗篷開發為最高優先。 |
| [`project-changelog.md`](project-changelog.md) | 斗篷管理後台（Cloak Admin）的版本紀錄。 |

---

> **文件結束**
> 最後更新：2026-03-28
