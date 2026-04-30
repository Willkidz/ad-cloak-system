---
title: "LINE 加好友歸因技術調研：四種方案比較"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "對比 LIFF+LINE Login、Rich Menu Postback、OA 後台追蹤參數、LIFF 中間頁四種 LINE 加好友歸因方案，最終推薦 LIFF 中間頁方案，因其能在用戶無感下透過 liff.getProfile() 取得 userId 完成精準歸因。"
id: "20260328-godview-line-attr-research"
type: "analysis"
tags: [attribution, godview, line, webhook]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本調研報告對比了四種 LINE 加好友歸因方案：(1) LIFF + LINE Login `bot_prompt` 一步完成授權加好友、(2) Rich Menu Postback 依賴用戶主動點擊、(3) OA 後台追蹤參數僅供統計無法 API 層級追蹤、(4) LIFF 中間頁透過 `liff.getProfile()` 無感取得 userId。核心發現：LINE `follow` 事件 Webhook 的 payload **不包含任何自定義參數**，因此必須在加好友之前透過 LIFF 或 LINE Login 預先取得 userId 並與廣告點擊（如 `fbclid`）關聯。最終推薦**方案四：LIFF 中間頁**，因其在用戶體驗與歸因準確性之間取得最佳平衡。

# LINE 加好友歸因技術調研

本文旨在研究並比較不同的 LINE 用戶加好友歸因技術方案，以找出最佳實踐。

---

## 方案一：LIFF 結合 LINE Login (bot_prompt)

此方案利用 LINE Login 的 `bot_prompt` 參數，在授權頁面直接顯示「加入好友」的選項，簡化用戶流程。

<step id="liff-login-flow">
廣告點擊 → Worker 帶 fbclid → LIFF 頁面 (觸發 LINE Login 授權) → 自動取用用戶 ID 並引導加好友 → Callback 帶 `friendship_status_changed=true` → 完成歸因。
</step>

- **實現方式**: 在 LIFF 中使用 `liff.getProfile()` 獲取用戶 ID，並透過 `liff.getFriendship()` 檢查好友狀態。
- **必要條件**: 需要設定一個 LINE Login Channel，並將其與 Messaging API Channel 建立在同一個 Provider 之下。
- **優點**: 一步完成加好友、獲取用戶 ID 及歸因，提供流暢的用戶體驗。
- **缺點**: 需要額外設定 LINE Login Channel。

---

## 方案二：Rich Menu Postback

用戶加好友後，自動顯示預設的 Rich Menu，用戶點擊菜單按鈕後觸發 postback 事件，並夾帶用戶 ID 以供追蹤。

- **優點**: 設置相對簡單。
- **缺點**: 歸因依賴用戶的主動點擊，無法保證每個用戶都會觸發，導致追蹤不完全。

---

## 方案三：LINE OA 後台追蹤參數

LINE Official Account Manager 後台提供「加入好友管道」功能，可以為不同來源產生專屬的 QR Code 或連結，用於統計分析。

- **優點**: 無需開發即可使用。
- **缺點**: 此功能主要為後台統計分析設計，並非 API 層級的精準追蹤。在 `follow` 事件的 webhook 中，無法獲取任何自定義的來源參數，因此無法將新好友與具體的廣告活動關聯起來。

---

## 方案四：LIFF 中間頁（最推薦）

此方案透過一個 LIFF 中間頁，在用戶無感的情況下完成歸因資訊的收集。

<step id="liff-intermediate-flow">
廣告點擊 → Worker (記錄 fbclid 與其他 TAG) → LIFF 頁面 → `liff.init()` → `liff.getProfile()` 獲取用戶 ID → 將用戶 ID、fbclid 與 TAG 送回後端 → 自動跳轉至 LINE 加好友頁面。
</step>

- **核心優勢**: 用戶無需進行任何額外授權或點擊動作，體驗無縫。
- **運作邏輯**: 當 LIFF 頁面在 LINE App 內被打開時，可自動獲取用戶 ID；若在外部瀏覽器打開，則會先要求用戶進行 LINE Login 授權。

---

## 方案比較總表

| 方案 | 歸因準確性 | 用戶體驗 | 實現複雜度 | 核心限制 |
| :--- | :--- | :--- | :--- | :--- |
| LIFF + LINE Login | 高 (100%) | 中（首次需授權） | 中 | 需設定 LINE Login Channel |
| Rich Menu Postback | 低 | 高（無額外步驟） | 低 | 依賴用戶主動點擊 |
| OA 後台追蹤參數 | 低 | 高 | 極低 | 僅供統計，無法 API 追蹤 |
| **LIFF 中間頁** | **高 (100%)** | **高（用戶無感）** | **中** | **外部瀏覽器需 LINE Login** |

---

## Follow 事件 Webhook 結構

<boundaries id="follow-webhook-limitation">
不論使用何種方案，當用戶加好友時，LINE 平台會發送一個 `follow` 事件的 webhook。值得注意的是，此事件的 payload **不包含任何自定義參數**，這正是需要透過 LIFF 預先取得 userId 的根本原因。
</boundaries>

<example id="follow-webhook-payload">

```json
{
  "type": "follow",
  "source": {
    "type": "user",
    "userId": "Uxxxxxxxxxxxxxx"
  },
  "follow": {
    "isUnblocked": false
  },
  "timestamp": 1705891467176
}
```

</example>

---

## 結論

綜合比較以上四種方案，**方案四：LIFF 中間頁** 是最推薦的歸因方法。它在用戶體驗、數據準確性和實現複雜度之間取得了最佳平衡，能夠在不打擾用戶的情況下，可靠地完成好友歸因，特別適用於廣告投放等需要精準追蹤成效的場景。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-attr-final.md](godview-line-attr-final.md) | LIFF SDK 中間頁方案的最終架構設計 |
| [godview-line-follow-research.md](godview-line-follow-research.md) | Follow 事件歸因方案深入調研 |
| [godview-line-attr.md](godview-line-attr.md) | LINE 加好友歸因方案完整調研 |
