---
title: "火鳥落地頁源碼分析"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "分析火鳥系統產生的落地頁源碼，揭示 gotolink() 函數、Meta Pixel 和 [conftpl] 佔位符均由後端動態注入的機制。"
id: "20260328-firebird-page-analysis"
type: "analysis"
tags: [firebird, godview, landing-page, pixel, reference]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 火鳥落地頁（`kogane.online/0906-2-2/`）的源碼分析揭示了三個關鍵機制：(1) 主按鈕的 `gotolink()` 函數未在前端定義，由後端動態注入；(2) Meta Pixel 區塊僅有空的 HTML 註解，實際追蹤碼同樣由後端注入；(3) 源碼第 108 行的 `[conftpl]` 佔位符是火鳥的全局配置注入點。頁面本質上是一個高度依賴後端動態腳本注入的 LINE 加好友引流頁，所有追蹤與轉換邏輯（含 FB `Purchase` 事件）均在 `gotolink()` 內部處理。

# 火鳥落地頁源碼分析

---

## 關鍵發現

1.  **主要按鈕**:
    -   HTML 屬性: `onclick="gotolink()"`
    -   位置: 第 123 行
    -   CSS class: `elementor-button-wrapper`
    -   按鈕文字: 「無須掃碼點擊加入」

2.  **核心函數 `gotolink()`**:
    -   此函數未在頁面源碼中直接定義。
    -   推斷是由火鳥系統在後端動態注入的隱藏 JavaScript，用於處理點擊事件。

3.  **Meta Pixel Code**:
    -   位置: 第 83 行。
    -   源碼中僅有 HTML 註解 `<!-- Meta Pixel Code --><!-- End Meta Pixel Code -->`。
    -   實際的 Pixel 追蹤碼同樣由火鳥系統隱藏並動態注入。

4.  **全局配置注入**:
    -   源碼第 108 行出現 `[conftpl]` 佔位符。
    -   火鳥系統使用此佔位符來注入全局配置，其中可能包含 Meta Pixel 代碼及其他動態腳本。

5.  **URL 結構**:

<example id="url-structure">

    -   範例: `https://kogane.online/0906-2-2/?utm_medium=paid&utm_source=fb&utm_id=...`
    -   包含完整的 UTM 追蹤參數，用於廣告活動成效分析。

</example>

6.  **Google Tag Manager (GTM)**:
    -   源碼中存在 GTM 的 `dataLayer`，但未找到實際加載 GTM 容器的腳本。

7.  **CSS 動畫**:
    -   `.gotolink` 和 `.btnswitch` 兩個 class 均應用了 CSS 動畫效果（如呼吸效果），以吸引用戶點擊。

---

## 結論

-   此落地頁的核心功能是引導用戶點擊按鈕（`gotolink`）來添加 LINE 好友，頁面上沒有獨立的「購買」或「聯絡我們」等其他轉換目標。
-   所有的關鍵追蹤與轉換邏輯，例如觸發 Facebook 的 `Purchase` 事件，都是由火鳥系統在後端注入的 `gotolink()` 函數內部處理，前端源碼無法直接看到完整實現。
-   本質上，這是一個結構簡單但高度依賴後端動態腳本注入的 LINE 加好友引流頁面。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-firebird-pixel-code-notes.md](godview-firebird-pixel-code-notes.md) | 像素注入與 gotolink() 完整流程分析 |
| [godview-firebird-complete-analysis.md](godview-firebird-complete-analysis.md) | 火鳥系統完整分析 |
| [godview-landing-page-analysis.md](godview-landing-page-analysis.md) | 落地頁追蹤腳本分析 |
