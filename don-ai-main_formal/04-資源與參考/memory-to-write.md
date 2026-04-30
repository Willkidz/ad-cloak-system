---
title: "待寫入的記憶體項目清單"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "彙總從各處收集的待辦記憶項目，包含需要新增的 TAG 對照表、事件處理邏輯、以及待修正的 API 錯誤清單。"
id: "20260325-memory-to-write"
type: spec
tags: [changelog, knowledge-base, memory, todo]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本文件作為臨時記錄，用於追蹤需正式歸檔至知識庫的記憶項目。核心包含：1. **已歸檔回顧**：涵蓋 Worker 雙模組架構、D1 數據丟失等已解決問題；2. **待處理清單**：重點在於建立完整 TAG 對照表、明確 Contact 事件由前端觸發、以及修正 Config API 的 `pixel_id` 錯誤。

# 待寫入的記憶體項目清單

本文件用於整理從各種來源（如截圖、筆記）提取的記憶項目，確保重要決策與發現被整合進正式文件。

---

## 一、待處理核心記憶 (重點關注)

此區塊包含需要進一步整理、驗證並寫入正式文件的新增項目。

<step id="pending-memory-tasks">

1.  **建立完整 TAG 對照表**
    - **內容**：需包含 `tag`, `line_id`, `line名稱`, `廣告像素`, `BC像素`, `子域名`, `事件前綴` 等。
    - **目標**：建立一個易於查找的全局參考表。

2.  **Contact 事件處理規範**
    - <rule id="contact-event-handling">
      **最終決定**：Worker 不再發送 `Contact` 事件。此事件改由落地頁前端 JS 透過呼叫 `/bc-event?e=Contact&t={tag}` 端點觸發。
      </rule>

3.  **落地頁 SEO 策略**
    - <rule id="seo-strategy">
      **結論**：付費流量落地頁不需要 SEO 優化，過度優化可能有害，應避免投入資源。
      </rule>

4.  **Config API `pixel_id` 錯誤修正**
    - **問題**：AB, BF, AX, N14, N18, N22 等項目的 `pixel_id` 末位數值有誤，需整理完整錯誤清單。

5.  **Worker 功能變更**
    - **更新**：Worker 已移除 `Contact` 事件發送，僅保留 `Lead` 事件。

</step>

---

## 二、已歸檔記憶 (歷史參考)

以下項目已確認整合進知識庫，不需重複處理。

| 項目名稱 | 說明 | 參考編號 |
| :--- | :--- | :--- |
| **Worker 雙模組架構** | 實施雙模組隔離 | Ref: 217/206 |
| **FALLBACK_LINE_MAP 缺失** | 補齊 Line ID 映射鍵值 | Ref: 218/204 |
| **D1 click 資料丟失** | 修復資料庫寫入問題 | Ref: 219 |
| **fbclid 參數轉換** | 自動轉換為 fbc 參數 | Ref: 221 |
| **BC 像素觸發邏輯** | 規範事件觸發流程 | Ref: 222 |
| **落地頁 JS 缺失** | 發現並記錄 gotolink 缺失問題 | Ref: 227 |

---

## 三、結論與後續行動

完成「待處理記憶」的歸檔對知識庫完整性至關重要。特別是 **Contact 事件處理方式** 與 **SEO 策略**，需同步給所有開發人員。完成後應將項目移至「已歸檔」區塊。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`.ai/memory.md`](../.ai/memory.md) | 核心記憶歸檔目標文件 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 定義記憶持久化規範 |
| [`landingpage-tracking-analysis.md`](./landingpage-tracking-analysis.md) | 落地頁追蹤實施細節 |
