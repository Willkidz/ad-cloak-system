---
title: "LINE 加好友歸因 - 完整技術調研結果"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "基於 LIFF SDK 中間頁的 LINE 好友歸因方案：透過 liff.getProfile() 取得 User ID、liff.getFriendship() 檢查好友狀態、Webhook follow 事件匹配追蹤記錄，取代傳統時間窗口匹配法。需要 LINE Login Channel（同 Provider）+ LIFF App + 後端 API + Webhook。"
id: "20260328-godview-line-attr-final"
type: "spec"
tags: [conversion, godview, webhook]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 最佳 LINE 加好友歸因方案：建立 LIFF 中間頁（URL 格式 `https://liff.line.me/{LIFF_ID}?route=cs06&fbc=xxx`），用戶點擊後在 LINE App 內開啟，LIFF SDK 自動登入並透過 `liff.getProfile()` 取得 User ID，前端將 User ID + fbclid + 來源參數發送至後端 API，再用 `liff.getFriendship()` 檢查好友狀態並引導加入。後端 Webhook 收到 `follow` 事件時，用 User ID 匹配追蹤記錄完成精準歸因，最後透過 Meta CAPI 回傳轉換數據。此方案取代了傳統「時間窗口匹配法」（多人同時訪問時易歸因錯誤）。關鍵配置：LINE Login Channel 需與 Messaging API 同一 Provider、Bot Link 設為 aggressive 模式、Channel 必須 Published。

# LINE 加好友歸因 - 完整技術調研結果

本文件旨在探討並記錄 LINE 官方帳號加好友的歸因技術，最終提出一套基於 LIFF SDK 的最佳實作方案。

---

## 最佳方案：LIFF SDK 中間頁（2026年最新實作）

此方案整合了 Zenn 社群在 2026 年的最新分享，以及台灣 LINE API 專家戴均民先生於 2020 年提出的架構，被視為當前最穩定且精準的歸因方法。

### 完整流程

<step id="1">**建立來源路徑**：管理員在後台為不同的行銷活動建立專屬的「來源路徑」，並產生對應的 LIFF URL，例如：`https://liff.line.me/{LIFF_ID}?route=cs06&fbc=xxx`。</step>

<step id="2">**用戶點擊連結**：用戶在廣告、社群貼文等渠道點擊此 LIFF URL。</step>

<step id="3">**開啟 LIFF 頁面**：該連結會自動在 LINE 應用程式內的瀏覽器開啟 LIFF 頁面。</step>

<step id="4">**取得用戶身份**：LIFF SDK 會自動執行 LINE 登入流程，並安全地取得該用戶的 LINE User ID。</step>

<step id="5">**發送追蹤數據**：LIFF 頁面的前端腳本將 User ID 連同 URL 中的來源參數（如 `route`、`fbclid`）一同發送到後端追蹤 API。</step>

<step id="6">**檢查好友狀態**：透過 `liff.getFriendship()` API 檢查用戶是否已經是該官方帳號的好友。</step>

<step id="7">**引導加入好友**：如果用戶尚未加入好友，頁面會自動跳轉至官方帳號的加好友頁面。</step>

<step id="8">**完成歸因**：當用戶完成加好友後，後端的 Webhook 會收到 `follow` 事件。此時，系統可利用事件中的 User ID 匹配步驟 5 的追蹤記錄，從而精準完成歸因。</step>

### 歸因準確性原則

<rule id="avoid-time-window-matching">

傳統中間頁轉導的歸因方式，因無法直接取得用戶的 LINE User ID，只能依賴「時間窗口匹配法」。此方法假設在訪問中間頁後短時間內觸發的 `follow` 事件來自同一位用戶，但在多人同時訪問的場景下，極易發生歸因錯誤。LIFF 方案透過直接獲取 User ID，從根本上解決了這個問題。

</rule>

---

### 關鍵技術點

- **LINE Login Channel**：必須建立一個 LINE Login 的通道，且該通道需要與 Messaging API 通道屬於同一個 Provider。
- **取得 User ID**：使用 `liff.getProfile()` 方法來獲取用戶的個人資料，包含 User ID。
- **檢查好友關係**：利用 `liff.getFriendship()` 方法確認用戶與官方帳號之間的好友狀態。
- **自動加好友功能**：在 LINE Login Channel 中啟用 "Bot Link" 功能並設定為 "aggressive" 模式，可以在用戶登入後自動引導其加入好友，有效提升轉換率。
- **通道發布**：LINE Login Channel 必須設定為 "Published" 狀態，否則只有被授權的開發者帳號能夠使用。
- **Webhook 匹配**：後端需開發 Webhook 邏輯，用以接收 `follow` 事件，並根據事件中的 User ID 匹配追蹤資料庫中的記錄。

---

### 所需資源

| 資源 | 說明 |
| :--- | :--- |
| LINE Login Channel | 與 Messaging API 在同一 Provider 下 |
| LIFF App | 掛載於該 LINE Login Channel 之下 |
| 後端 API 端點 | 用於接收前端追蹤數據 |
| Webhook 服務 | 用於處理 `follow` 事件並執行歸因匹配 |

---

### 與現有架構的整合

<step id="integration-1">**修改轉導目標**：將現有系統（例如 Worker）的跳轉目標從 `line.me/R/oaMessage` 更改為新建立的 LIFF URL。</step>

<step id="integration-2">**數據傳遞**：LIFF 頁面在取得 User ID、fbclid 及其他來源標籤後，將這些數據發送到 n8n 的 Webhook 觸發器。</step>

<step id="integration-3">**匹配邏輯**：n8n 工作流在收到 `follow` 事件時，使用傳入的 User ID 去匹配先前收到的追蹤記錄。</step>

<step id="integration-4">**數據回傳**：歸因完成後，將轉換數據透過 Meta Conversion API (CAPI) 回傳給廣告平台。</step>

---

## 結論

採用 LIFF SDK 中間頁的方案，是目前實現 LINE 加好友歸因最為精準可靠的方法。雖然實作上需要前後端協作，但能有效避免傳統方法的弊端，為後續的行銷活動分析提供堅實的數據基礎。

---

## 參考來源

- Zenn 技術文章 (2026/02/14) [待確認：需補充具體文章連結]
- 台灣 LINE API 專家戴均民的分享 (2020) [待確認：需補充具體出處或簡報連結]

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-liff-auth-findings.md](godview-liff-auth-findings.md) | LIFF 授權行為調研 |
| [godview-line-config-spec.md](godview-line-config-spec.md) | LINE 配置規範 |
| [godview-ad-tracking-sys-spec.md](godview-ad-tracking-sys-spec.md) | 系統總綱 |
