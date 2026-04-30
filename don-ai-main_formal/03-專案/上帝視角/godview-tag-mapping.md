---
title: "上帝視角 — 完整 TAG 對照表"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "提供「上帝視角」專案中所有產品線（AS/AB/AX/BF/JD/N）的 TAG、LINE 帳號、廣告像素、事件前綴及 CAPI 事件追蹤邏輯的完整對照表。"
id: "20260325-024356"
type: "reference"
tags: [attribution, capi, godview, line, pixel]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件定義了系統歸因與追蹤的核心對照關係。包含：(1) 全局設定：BC 像素 `7831...` 與共用 CAPI Token。(2) 產品線對照：AS（爆分王）、AB（莊家剋星）、AX（獨角仙）、BF（博富）、JD（兩斤炭吉）及 N 系列，每項包含 Pixel ID、事件前綴、LINE ID、負責人及子域名。(3) 事件追蹤邏輯：BC 像素發送 `{prefix}_Lead` + `ALL_Lead` 等自定義事件；廣告像素透過 n8n CAPI 發送標準 `Lead` 事件。歸因依賴 `destination` (LINE UID)、`ad_code`、`fbclid` 及 5 碼隨機 `token`。

# 上帝視角 — 完整 TAG 對照表

本文件提供「上帝視角」專案中，所有產品線的 TAG、LINE 帳號、廣告像素 ID、事件前綴及相關設定的完整對照，作為歸因與追蹤的技術參考依據。

---

## 全局設定

### BC 像素（全產品共用）

| 項目 | 值 |
| :--- | :--- |
| BC Pixel ID | 783186198187359 |
| BC Access Token | 與廣告像素共用同一個 System User Token |

### CAPI Access Token

| 欄位 | 說明 |
| :--- | :--- |
| capi_token | 所有 TAG 共用同一個 CAPI Access Token |

---

## 產品線 TAG 對照表

### AS 系列（爆分王）

| 項目 | 值 |
| :--- | :--- |
| 廣告像素 | 1296143099239936 |
| 事件前綴 | AS |

| TAG | LINE ID | LINE 名稱 | 負責人 | 預設訊息 | 子域名 | 跳轉連結 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| js | @935bicyi | 爆分王-電子打法秘笈 | J | 我要領取程式 | js.freshpathlab.com | `https://line.me/R/oaMessage/@935bicyi/?我要領取程式` |
| cs | @999hqlmk | 爆分王-電子訊號程式 | C | 我要領取程式 | cs.freshpathlab.com | `https://line.me/R/oaMessage/@999hqlmk/?我要領取程式` |
| ms | @001qlmgf | 爆分王-電子打法訊號 | M | 我要領取程式 | ms.freshpathlab.com | `https://line.me/R/oaMessage/@001qlmgf/?我要領取程式` |
| ls | @849rldxt | 爆分王-24H訊號打法 | L | 我要領取程式 | ls.freshpathlab.com | `https://line.me/R/oaMessage/@849rldxt/?我要領取程式` |

### AB 系列（莊家剋星）

| 項目 | 值 |
| :--- | :--- |
| 廣告像素 | 2030344604527767 |
| 事件前綴 | AB |

| TAG | LINE ID | LINE 名稱 | 負責人 | 預設訊息 | 子域名 | 跳轉連結 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| jb | @448nzdkf | 莊家剋星-百家專家 | J | 我要領取程式 | jb.freshpathlab.com | `https://line.me/R/oaMessage/@448nzdkf/?我要領取程式` |
| cb | @bn56 | 莊家剋星-百家殺手 | C | 我要領取程式 | cb.freshpathlab.com | `https://line.me/R/oaMessage/@bn56/?我要領取程式` |
| mb | @734xzzse | 莊家剋星-百家打莊姬 | M | 我要領取程式 | mb.freshpathlab.com | `https://line.me/R/oaMessage/@734xzzse/?我要領取程式` |
| lb | @bn58 | 莊家剋星-百家GPT | L | 我要領取程式 | lb.freshpathlab.com | `https://line.me/R/oaMessage/@bn58/?我要領取程式` |

### AX 系列（獨角仙）

| 項目 | 值 |
| :--- | :--- |
| 廣告像素 | 4353746171539948 |
| 事件前綴 | AX |

| TAG | LINE ID | LINE 名稱 | 負責人 | 預設訊息 | 子域名 | 跳轉連結 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| jx | @652ahjmy | 獨角仙AI算牌程式 | J | 我要領取程式 | jx.freshpathlab.com | `https://line.me/R/oaMessage/@652ahjmy/?我要領取程式` |
| cx | @697jsdma | 獨角仙AI算牌系統 | C | 我要領取程式 | cx.freshpathlab.com | `https://line.me/R/oaMessage/@697jsdma/?我要領取程式` |
| mx | @525euwsy | 獨角仙AI預測系統 | M | 我要領取程式 | mx.freshpathlab.com | `https://line.me/R/oaMessage/@525euwsy/?我要領取程式` |
| lx | @128hxyvp | 獨角仙AI預測程式 | L | 我要領取程式 | lx.freshpathlab.com | `https://line.me/R/oaMessage/@128hxyvp/?我要領取程式` |

### BF（博富）與 JD（兩斤炭吉）

| 項目 | BF 值 | JD 值 |
| :--- | :--- | :--- |
| 廣告像素 | 2153779865162231 | 2153779865162231 |
| 事件前綴 | BF | JD |

| TAG | LINE ID | LINE 名稱 | 負責人 | 預設訊息 | 子域名 | 跳轉連結 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| bf | @678eohsd | 博富 BOFU | - | 我要開版 | bf.freshpathlab.com | `https://line.me/R/oaMessage/@678eohsd/?我要開版` |
| jd | @520ufhmw | 兩斤炭吉 | J | 我想了解 | jd.freshpathlab.com | `https://line.me/R/oaMessage/@520ufhmw/?我想了解` |

### N 系列（獨立產品）

| TAG | LINE ID | LINE 名稱 | 負責人 | 預設訊息 | 廣告像素 | 事件前綴 | 子域名 | 跳轉連結 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| n14 | @416nbqjl | 洪金豹 | M | 我要領取程式 | 1684363839598393 | N14 | n14.freshpathlab.com | `https://line.me/R/oaMessage/@416nbqjl/?我要領取程式` |
| n15 | @745jaffa | 開版歪歪熊 | J | 我要開版 | (無) | N15 | n15.freshpathlab.com | `https://line.me/R/oaMessage/@745jaffa/?我要開版` |
| n16 | @751tggmd | 晴兒 | - | 我想了解 | (無) | N16 | n16.freshpathlab.com | `https://line.me/R/oaMessage/@751tggmd/?我想了解` |
| n17 | @106tndmh | 郝士多 | C | 我想了解 | (無) | N17 | n17.freshpathlab.com | `https://line.me/R/oaMessage/@106tndmh/?我想了解` |
| n18 | @013rgbjl | 電子蕭甘丹 | C | 我要領取程式 | 1536783794086440 | N18 | n18.freshpathlab.com | `https://line.me/R/oaMessage/@013rgbjl/?我要領取程式` |
| n19 | @536uhfpf | 開版歪熊 | J | 我要開版 | (無) | N19 | n19.freshpathlab.com | `https://line.me/R/oaMessage/@536uhfpf/?我要開版` |
| n20 | @348ikfwm | 蘇主金 | L | 我要領取程式 | 2193730667756432 | N20 | n20.freshpathlab.com | `https://line.me/R/oaMessage/@348ikfwm/?我要領取程式` |
| n21 | @075cocov | 武狀元 | M | 我想了解 | (無) | N21 | n21.freshpathlab.com | LIFF 頁面 |
| n22 | @659jgxlp | 阿奇說球 | J | 我要領取程式 | 2038340907023537 | N22 | n22.freshpathlab.com | `https://line.me/R/oaMessage/@659jgxlp/?我要領取程式` |

---

## 事件追蹤設定

### BC 像素自定義事件

<rule id="bc-pixel-events">
每次用戶點擊跳轉時，Worker 會自動發送包含產品前綴的事件及一個全局事件到 BC 像素。
</rule>

| 事件類型 | 產品事件名 | 全局事件名 | 觸發邏輯 |
| :--- | :--- | :--- | :--- |
| Lead | `{前綴}_Lead` | `ALL_Lead` | Worker 跳轉時自動發送 |
| Contact | `{前綴}_Contact` | `ALL_Contact` | 落地頁 JS 呼叫 `/bc-event?e=Contact&t={tag}` |
| PageView | `{前綴}_PageView` | `ALL_PageView` | 落地頁 JS 呼叫 `/bc-event?e=PageView&t={tag}` |
| Purchase | `{前綴}_Purchase` | `ALL_Purchase` | 落地頁 JS 呼叫 `/bc-event?e=Purchase&t={tag}` |

**前綴對照：** AS (js/cs/ms/ls), AB (jb/cb/mb/lb), AX (jx/cx/mx/lx), BF (bf), JD (jd), N-Series (N14-N22)。

### 廣告像素 CAPI 事件

<rule id="capi-events">
當後端 n8n workflow 成功完成歸因匹配後，會透過 CAPI 發送 `Lead` 事件至對應產品線的廣告像素。
</rule>

| 觸發時機 | 事件名 | 發送目標 | 觸發邏輯 |
| :--- | :--- | :--- | :--- |
| 歸因成功 | Lead | 對應產品的廣告像素 | n8n Time Attribution workflow 歸因匹配後 CAPI 發送 |

---

## 歸因參數說明

以下為系統在歸因過程中使用的 URL 參數及內部欄位。

| 欄位 | 說明 |
| :--- | :--- |
| **destination** | LINE OA 的 bot userId（用於歸因匹配） |
| **ad_code** | 廣告碼（如 CS01、AB05），由火鳥落地頁 URL 參數 `?a=` 帶入 |
| **fbclid** | Facebook Click ID，由火鳥 gotolink 帶入 |
| **fbc** | 由 Worker 從 fbclid 自動生成（格式：`fb.1.{timestamp}.{fbclid}`） |
| **token** | Worker 生成的 5 碼隨機 token，用於歸因匹配 |
| **pixel_id** | 該 TAG 對應的廣告像素 ID |

---

## 結論

此文件是「上帝視角」專案的核心參考資料，定義了所有追蹤標籤與事件的對應關係。任何標籤或事件的修改都應同步更新此文件，以確保數據追蹤的準確性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-subdomain-mapping.md`](./godview-subdomain-mapping.md) | 子域名跳轉完整對照表 |
| [`godview-line-oa-tokens.md`](./godview-line-oa-tokens.md) | LINE OA Channel Access Token 對照表 |
| [`godview-bc-pixel-events.md`](./godview-bc-pixel-events.md) | BC 像素事件規格 |
| [`data-relation-principles.md`](../../01-核心原則/project-specific-specs.md) | 數據關聯原則 |
