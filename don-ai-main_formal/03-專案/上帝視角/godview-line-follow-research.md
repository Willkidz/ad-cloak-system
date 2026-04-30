---
title: "LINE Follow Event 歸因調研：五種間接方案比較"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "研究 LINE follow 事件 Webhook payload 不含來源參數的限制，並比較五種間接歸因方案：LIFF 中間頁（最精準，需首次授權）、時間窗口匹配（1-5 分鐘窗口，高併發易誤判）、OA 預設訊息（依賴用戶主動發送）、Cookie + Webhook 時間匹配（折衷方案）、Account Link（需會員綁定）。"
id: "20260325-024356"
type: "analysis"
tags: [attribution, conversion, godview, line, webhook]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: LINE `follow` 事件的 Webhook payload 僅包含 `type`、`timestamp`、`source.userId`、`follow.isUnblocked`，**完全不含任何自定義來源參數或 referral 資訊**，因此無法直接歸因。本文比較五種間接方案：(1) LIFF 中間頁透過 `liff.getProfile()` 取得 userId 實現 100% 精準歸因，但首次需 LINE Login 授權；(2) 時間窗口匹配（1-5 分鐘）不打擾用戶但高併發易誤判；(3) OA 預設訊息（現行方案）完全依賴用戶主動發送，成功率極低；(4) Cookie + Webhook 時間匹配為折衷方案；(5) Account Link 需用戶完成會員綁定，門檻最高。最終推薦 **LIFF 中間頁**方案。

# LINE Follow Event 歸因調研

本文旨在探討 LINE Follow（好友加入）事件的歸因方法，解決無法直接從 Webhook 得知用戶來源的問題。

---

## 核心問題

<boundaries id="follow-event-limitation">
根據 LINE 官方文件，Follow 事件的 Webhook Payload 僅包含 `type`, `timestamp`, `source(userId)`, `follow.isUnblocked` 等基本資訊，完全不包含任何可用於追蹤來源的自訂參數或 `referral` 資訊。這導致我們無法直接判斷用戶是透過哪個廣告或行銷管道加入好友的。
</boundaries>

---

## 現有發現

- **區分新舊好友**：Follow 事件中的 `isUnblocked` 屬性可用於區分用戶是「新加入的好友」還是「解除封鎖的好友」。此發現於 2024 年 2 月確認，但對於來源追蹤沒有直接幫助。

---

## 五種間接歸因方案

為了解決此問題，目前研究出以下幾種可行的間接歸因方案：

### 方案一：LIFF 中間頁（最推薦）

<rule id="liff-intermediate-page">
在用戶點擊加入好友連結後，先導向一個 LIFF（LINE Front-end Framework）頁面。此頁面會觸發 LINE Login 授權（僅需首次），從而獲取用戶的 Profile，並將來源參數與用戶身份綁定。這是最精準的方案，但多一個授權步驟可能會影響轉換率。
</rule>

### 方案二：時間窗口匹配

<rule id="time-window-matching">
在後端（例如 Worker）記錄用戶點擊廣告帶有來源參數的時間戳。當收到 Follow 事件時，在一個極短的時間窗口內（例如 1-5 分鐘）將此 Follow 事件與最近的點擊記錄進行匹配。此方案不打擾用戶，但可能因時間延遲或多用戶並發而出錯。
</rule>

### 方案三：官方帳號預設訊息（現行方案）

<rule id="default-oa-message">
此為現行方案，引導用戶加入好友後，主動發送一則帶有來源標籤的預設訊息。此方法極度依賴用戶的主動操作，因此歸因成功率很低。
</rule>

### 方案四：中間頁 Cookie + Webhook 時間匹配

<rule id="cookie-webhook-matching">
結合方案一和二，用戶點擊後先導向一個中間頁，該頁面不要求 LINE Login，而是用 Cookie 記錄來源資訊與時間。接著在收到 Follow Webhook 時，比對時間戳來完成歸因。此方案比純時間匹配更可靠，但仍非 100% 精準。
</rule>

### 方案五：LINE Account Link

<rule id="account-link">
引導用戶將 LINE 帳號與我們服務的會員系統進行綁定（Account Link）。一旦綁定，即可在後續的任何互動中識別用戶身份與其初次來源。此方案歸因精準，但前置要求最高，需要用戶已是服務會員並完成綁定流程。
</rule>

---

## 方案比較總表

| 方案 | 歸因準確性 | 用戶體驗影響 | 實現複雜度 | 核心風險 |
| :--- | :--- | :--- | :--- | :--- |
| LIFF 中間頁 | 100% | 首次需授權 | 中 | 可能影響轉換率 |
| 時間窗口匹配 | 中 | 無感 | 低 | 高併發誤判 |
| OA 預設訊息 | 極低 | 需用戶主動操作 | 極低 | 用戶不發送即失敗 |
| Cookie + Webhook | 中高 | 無感 | 中 | 跨裝置失效 |
| Account Link | 100% | 需完成會員綁定 | 高 | 門檻過高 |

---

## 結論

目前尚無任何方法可以直接從 LINE Follow 事件中直接獲取歸因來源。所有可行的方案都需要透過中間頁、時間匹配或用戶互動等間接手段來實現。其中，**LIFF 中間頁** 是最為平衡且相對精準的方案，但需評估額外授權步驟對用戶體驗的影響。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-attr-final.md](godview-line-attr-final.md) | LIFF SDK 中間頁方案的最終架構設計 |
| [godview-line-attr.md](godview-line-attr.md) | LIFF vs Redirect 方案完整調研 |
| [godview-line-attr-research.md](godview-line-attr-research.md) | 四種歸因方案初步調研 |
