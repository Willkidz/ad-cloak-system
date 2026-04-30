---
title: "LINE Login 測試環境部署指南"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "說明如何部署 LINE Login 測試環境並串接 bot_prompt 自動加好友流程。"
version: "v1.0"
---
# LINE Login 測試環境部署指南

本指南說明如何部署和測試 LINE Login + `bot_prompt`（自動加好友）的完整流程。

## 📁 包含的文件

1. `line-login-test-landing.html`：模擬落地頁，包含觸發 LINE Login 的按鈕
2. `line-login-callback.js`：Cloudflare Worker，負責接收授權碼、交換 Token、記錄綁定關係

---

## 🚀 部署步驟

### 步驟 1：準備 LINE Login Channel

1. 登入 [LINE Developers Console](https://developers.line.biz/console/)
2. 建立或選擇一個 Provider
3. 點擊 **Create a new channel**，選擇 **LINE Login**
4. 填寫必要資訊並建立 Channel
5. 在 **Basic settings** 中找到：
   - `Channel ID`
   - `Channel secret`
6. 在 **LINE Login** 頁籤中，啟用 **Web app**
7. 暫時將 **Callback URL** 設為 `http://localhost/callback`（後續會更新）

### 步驟 2：設定 LINE OA 連動 (bot_prompt 關鍵)

1. 在 LINE Developers Console 的 Channel 設定中，切換到 **Basic settings**
2. 找到 **Linked LINE Official Account**
3. 點擊 Edit，選擇你要讓用戶加為好友的 LINE OA
4. 這個步驟非常重要，沒有綁定 OA，`bot_prompt` 參數將不會生效

### 步驟 3：部署 Callback Worker

1. 在 Cloudflare Dashboard 建立一個新的 Worker，命名為 `line-login-callback`
2. 將 `line-login-callback.js` 的內容貼上並部署
3. 綁定 D1 資料庫（名稱必須為 `D1_DATABASE`，選擇 `godview-clicks`）
4. 設定以下環境變數：
   - `LINE_LOGIN_CHANNEL_ID` = 你的 Channel ID
   - `LINE_LOGIN_CHANNEL_SECRET` = 你的 Channel Secret
   - `LINE_LOGIN_CALLBACK_URL` = `https://<你的Worker域名>/line-login/callback`

### 步驟 4：更新 Callback URL

1. 回到 LINE Developers Console
2. 將 **LINE Login** 頁籤中的 **Callback URL** 更新為 Worker 的實際 URL：
   `https://<你的Worker域名>/line-login/callback`

### 步驟 5：準備測試頁面

1. 開啟 `line-login-test-landing.html`
2. 將代碼中的 `{LINE_LOGIN_CHANNEL_ID}` 替換為你的 Channel ID
3. 將代碼中的 `{LINE_LOGIN_CALLBACK_URL}` 替換為 Worker 的 Callback URL
4. 可以將此 HTML 部署到 Cloudflare Pages，或直接在本地瀏覽器打開

---

## 🧪 測試流程

1. 打開 `line-login-test-landing.html` 頁面
2. 點擊 **🔄 生成 VID** 按鈕（模擬落地頁生成的 Visitor ID）
3. 點擊 **聯絡我們** 按鈕
4. 頁面將跳轉至 LINE 授權畫面
5. **關鍵點**：授權畫面下方應該會出現「**將 xxx 加入好友**」的選項（預設打勾）
6. 點擊同意後，將跳轉回 Callback Worker
7. 頁面將顯示「✅ 授權成功」，並列出你的 LINE User ID 和剛才生成的 VID
8. 去 D1 資料庫的 `line_user_bindings` 表檢查，應該能看到這筆綁定記錄

---

## 🛠️ 整合到現有系統

測試成功後，可以將此邏輯整合到隱者系統：

1. **money-page.js 修改**：
   將原來的 `gotolink()` 跳轉邏輯，改為跳轉到 LINE Login 授權 URL。
   
2. **N8N 工作流修改**：
   Webhook 收到 `followEvent` 時，用 `event.source.userId` 查詢 `line_user_bindings` 表，獲取 `vid`，然後繼續原來的 CAPI 發送流程。
