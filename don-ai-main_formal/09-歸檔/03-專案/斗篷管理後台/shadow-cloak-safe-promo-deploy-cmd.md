---
title: "隱者斗篷 — 安全頁 & 推廣頁部署指令"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "提供隱者斗篷系統中，安全頁與推廣頁的詳細部署指令與技術要求。"
type: "cmd"
tags: [cloaking, deployment, shadow-cloak]
status: "archived"
archived_reason: "已整合至 03-專案/斗篷管理後台/隱者斗篷—安全頁與推廣頁部署指令.md"
archived_date: "2026-03-27"
merged_into: "03-專案/斗篷管理後台/隱者斗篷—安全頁與推廣頁部署指令.md"
---

# 隱者斗篷 — 安全頁 & 推廣頁部署指令

> 本文件由 Manus 規劃組產出，交由隱者斗篷技術組執行。

## 系統架構總覽

| 角色 | 域名 | Worker 名稱 | 說明 |
| :--- | :--- | :--- | :--- |
| **廣告入口** | bexnua.store | shadow-cloak | 偵測訪客身份，機器人→安全頁，真人→推廣頁 |
| **安全頁** | raxnto.shop | safe-page | 給 FB/Google 爬蟲看的白頁 |
| **推廣頁** | （內嵌於 shadow-cloak 或獨立 Worker） | money-page | 給真人用戶看的落地頁 |

## Cloudflare API 資訊

<example>
```yaml
API Token:    cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f
Account ID:   b2471e0c307123945bdf1ce1b025563f
raxnto.shop Zone ID:  fe971e900ef0af475d98ad6f9b866d4e
bexnua.store Zone ID: 3d18bc84f1840bb4423a39030f5fc10b
```
</example>

## 任務一：升級安全頁 (safe-page)

### 現狀

- safe-page Worker 已部署在 `raxnto.shop`，DNS 已設定（AAAA 100::, proxied）。
- 路由 `raxnto.shop/*` 已綁定。
- 目前已有一版升級頁面在運行。

### 設計要求

<rule id="safe-page-design">
- **白底**，乾淨專業的現代設計。
- 看起來像正規的**數位娛樂 / 休閒遊戲平台**官網。
- **絕對禁止**出現的詞：博弈、賭、賭場、賭博、casino、gambling、betting。
- **可以使用**的詞：遊戲平台、數位娛樂、休閒遊戲、互動體驗、娛樂平台。
</rule>

### 頁面結構

<step id="safe-page-structure-1">**1. 頂部 Hero 區塊**
   - 平台名稱（通用的，如「樂享娛樂」或類似）。
   - 副標題：「探索全新遊戲體驗」。
   - 簡潔的視覺裝飾（CSS 漸層或 SVG icon）。
</step>
<step id="safe-page-structure-2">**2. 平台介紹**
   - 1-2 段文字，描述這是一個提供多元遊戲體驗的平台。
   - 強調安全、公平、便捷。
</step>
<step id="safe-page-structure-3">**3. 特色區塊**（3-4 個卡片）
   - 🎮 豐富遊戲選擇
   - 🎁 新手專屬福利
   - 🔒 安全保障
   - ⚡ 快速便捷
</step>
<step id="safe-page-structure-4">**4. 加入流程**
   - 簡單 3 步驟說明。
</step>
<step id="safe-page-structure-5">**5. CTA 按鈕**
   - 文字：「馬上開始」。
   - 連結：`#`（佔位，之後替換）。
</step>
<step id="safe-page-structure-6">**6. 頁腳**
   - 隱私權政策、服務條款連結（可連到 `#` 佔位頁面）。
   - © 2026 版權聲明。
</step>

### 技術要求

<rule id="safe-page-tech">
- 純 HTML + CSS，內嵌在 Worker 中。
- 響應式設計（手機優先）。
- Meta 標籤安全（title、description 不含敏感詞）。
- 不依賴外部資源（圖片、字體、CDN）。
- 用 CSS 漸層、SVG、emoji 做視覺效果。
</rule>

### 部署方式

<example>
```bash
# 更新 safe-page Worker
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/safe-page" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @safe-page.js
```
</example>

## 任務二：建立推廣頁 (money-page)

### 設計要求

<rule id="money-page-design">
- **深色 + 金色 + 綠色**配色，奢華感、視覺衝擊力強。
- 主題：**博富娛樂城**。
- 手機優先（主要流量來自手機廣告）。
</rule>

### 頁面結構

<step id="money-page-structure-1">**1. 頂部 Hero 區塊**
   - 大標題：「博富娛樂城」。
   - 副標題：「注冊就送 20000」。
   - 背景：深色漸層 + 金色光效（CSS 實現）。
</step>
<step id="money-page-structure-2">**2. 賣點區塊**
   - 💰 大額無憂
   - ⚡ 出款秒到
   - 🔥 全網最高返水
   - 每個賣點用卡片或圖標呈現。
</step>
<step id="money-page-structure-3">**3. 限時優惠 / 緊迫感**
   - 倒計時效果（CSS/JS 動畫）。
   - 「限時活動」「名額有限」等文案。
</step>
<step id="money-page-structure-4">**4. 信任元素**
   - 🛡️ 安全加密
   - 📞 24小時客服
   - 👥 百萬玩家信賴
   - 可以用數字滾動效果。
</step>
<step id="money-page-structure-5">**5. 主 CTA 按鈕**
   - 文字：「立即開版」。
   - 大尺寸、醒目顏色。
   - CSS 動畫（閃爍、脈衝效果）。
   - 連結：`#`（佔位，之後替換）。
</step>
<step id="money-page-structure-6">**6. 次要 CTA**
   - 頁面底部再放一次按鈕。
   - 「立即加入，開啟財富之旅」。
</step>

### 動態效果

<rule id="money-page-effects">
- 金幣飄落動畫（CSS @keyframes）。
- CTA 按鈕脈衝/閃爍效果。
- 數字滾動（玩家人數、累計獎金等）。
- 漸入動畫。
</rule>

### 技術要求

<rule id="money-page-tech">
- 純 HTML + CSS + JS，內嵌在 Worker 中。
- 不依賴外部資源。
- 用 CSS 漸層、SVG、emoji 做視覺效果。
- 頁面載入要快（所有內容內嵌）。
</rule>

### 部署方式

<example>
```bash
# 部署 money-page Worker
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/money-page" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @money-page.js
```
</example>

## 任務三：更新 shadow-cloak Worker

### 現狀問題

- shadow-cloak Worker 的 `MONEY_PAGE_ORIGIN` 目前指向 `kogane.online`（錯誤的域名，導致 522 錯誤）。
- 需要改為指向 money-page Worker。

### 修改方案

- **方案 A（推薦）：直接內嵌推廣頁**
  - 在 shadow-cloak Worker 中，當判斷為真人用戶時，直接回傳推廣頁 HTML。
  - **優點**：不需要額外的域名或 fetch，速度最快。
  - **缺點**：Worker 代碼較大。
- **方案 B：使用 Service Binding**
  - 在 shadow-cloak Worker 中綁定 money-page Worker。
  - 真人用戶訪問時，透過 Service Binding 呼叫 money-page。
  - 需要在 wrangler.toml 或 API 中設定 binding。
- **方案 C：使用 Workers 子域名 fetch**
  - money-page 部署後會有 `money-page.laoqin1689.workers.dev` 的地址。
  - shadow-cloak 的 `MONEY_PAGE_ORIGIN` 改為 `https://money-page.laoqin1689.workers.dev`。
  - **優點**：簡單直接。
  - **缺點**：多一次 fetch，稍慢。

> **結論**：建議採用方案 A 或 C。

<example>
若採用方案 C，更新 shadow-cloak Worker 時只需修改 `MONEY_PAGE_ORIGIN` 變數：
```javascript
const MONEY_PAGE_ORIGIN = 'https://money-page.laoqin1689.workers.dev';
```
</example>

### 部署方式

<example>
```bash
# 更新 shadow-cloak Worker
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/b2471e0c307123945bdf1ce1b025563f/workers/scripts/shadow-cloak" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \
  -H "Content-Type: application/javascript" \
  --data-binary @shadow-cloak.js
```
</example>

## 測試驗證

部署完成後，需執行以下測試：

<step id="test-1">**1. 安全頁直接訪問**
  - **指令**：`curl -s -o /dev/null -w "%{http_code}" https://raxnto.shop/`
  - **預期**：返回 HTTP 狀態碼 `200`。
</step>
<step id="test-2">**2. 機器人訪問入口**
  - **指令**：`curl -s https://bexnua.store/ -H "User-Agent: facebookexternalhit/1.1"`
  - **預期**：返回安全頁 HTML，包含「遊戲平台」等安全措辭。
</step>
<step id="test-3">**3. 真人訪問入口**
  - **指令**：`curl -s https://bexnua.store/ -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ..."`
  - **預期**：返回推廣頁 HTML，包含「博富娛樂城」。
</step>
<step id="test-4">**4. Google Bot 訪問入口**
  - **指令**：`curl -s https://bexnua.store/ -H "User-Agent: Googlebot/2.1"`
  - **預期**：返回安全頁 HTML。
</step>
<step id="test-5">**5. 空 User-Agent 訪問**
  - **指令**：`curl -s https://bexnua.store/ -H "User-Agent: "`
  - **預期**：返回安全頁 HTML。
</step>

<rule id="test-result">
所有測試都不應出現 522 錯誤。
</rule>

## 後續待辦

- [ ] 替換安全頁「馬上開始」按鈕的連結。
- [ ] 替換推廣頁「立即開版」按鈕的連結（博富娛樂城註冊頁）。
- [ ] 根據實際廣告素材調整安全頁內容，確保與廣告一致性。
- [ ] [已過期：此任務已由廣為人知團隊接手] 之後由廣為人知團隊升級推廣頁設計。

## 相關文件

- *本文件無其他相關文件*

---
*文件產出時間：2026-03-24 01:44 (GMT+8)*
*產出單位：Manus 規劃組*
*執行單位：隱者斗篷技術組*
