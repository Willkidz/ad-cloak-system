---
title: "修改指令 v1.7：新增廣告活動頁面對齊火鳥系統"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "詳細說明為了與「火鳥」系統後台對齊，「上帝視角」v1.7 版本在廣告活動建立與編輯頁面所需進行的前端修改，涵蓋 UI/UX 樣式調整、元件開發、資料處理邏輯及最終的驗收標準。"
id: "20260325-024356"
type: "cmd"
tags: [advertising, firebird, frontend, godview, react, ui-ux]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本指令定義了「上帝視角」前端與「火鳥」系統對齊的 v1.7 修改方案。核心任務：(1) UI/UX 調整：調整 `ReactQuill` 樣式（ gray-200 邊框、250px 最小高度）、新增底部固定橘色提示文字、對齊 26 個欄位的 Placeholder 與標籤文字；(2) 元件開發：新增「批量添加鏈接」彈窗元件；(3) 資料處理：實現 `customer_links` 與 `blacklist_rules` 的 JSON 序列化提交與反序列化載入邏輯。此舉旨在降低用戶學習成本，確保兩套系統操作體驗一致。

# 修改指令 v1.7：新增廣告活動頁面對齊火鳥系統

本文檔詳細說明為了與「火鳥」系統後台對齊，「上帝視角」v1.7 版本在廣告活動建立與編輯頁面所需進行的前端修改，涵蓋 UI/UX 樣式調整、元件開發、資料處理邏輯及最終的驗收標準。

---

## UI/UX 調整項目

為求使用者體驗一致，需調整以下使用者介面細節。

### 富文本編輯器樣式

<step id="quill-style-adjustment">
調整 `ReactQuill` 富文本編輯器的 CSS 樣式，使其外觀與火鳥系統中的樣式統一，主要包含邊框顏色、圓角及最小高度。
</step>

<example id="quill-css">

```css
/* 自定義 ReactQuill 樣式 */
.ql-toolbar.ql-snow {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  border-color: #e5e7eb; /* gray-200 */
}
.ql-container.ql-snow {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
  border-color: #e5e7eb;
  min-height: 250px;
}
```

</example>

### 新增底部橘色提示文字

<step id="add-bottom-warning">
在頁面底部的固定操作欄中，於「取消」和「提交」按鈕左側新增提示文字，提醒使用者投放前應注意事項。
</step>

> **設計說明：** 火鳥系統的底部操作欄左側為帶有警告圖示的橘色提示文字，右側為按鈕組。需複製此佈局。

### Placeholder 與描述文字對齊

<rule id="placeholder-alignment">
此為最終檢查項，確保所有輸入框的 `placeholder`、標籤文字、按鈕文字皆與火鳥系統完全一致。
</rule>

| 欄位 | 標籤文字 | Placeholder |
| :--- | :--- | :--- |
| `short_codes` | 鏈接 * | 請填入，不可重複使用相同鏈接 |
| `name` | 標題 * | 請輸入內容 |
| `money_page_id` | * 廣告落地頁 | 選擇國家/分類 / 選擇模板 |
| `customer_links` | Line鏈接、Whatsapp、其他鏈接 | 請輸入內容 |
| `pixel_fb` | FB像素ID ⓘ | 請輸入內容 |
| `blacklist_rules` | 黑名單 | （動態列表，各條件有對應 placeholder） |

---

## 元件程式碼

### 批量添加鏈接彈窗

<step id="batch-add-links-dialog">
為方便使用者操作，需開發一個「批量添加鏈接」的彈窗元件。使用者可以在文本框中輸入多個鏈接（以換行或逗號分隔），確認後自動填入表單。
</step>

<example id="batch-add-links-code">

```tsx
// 批量添加鏈接邏輯
const handleConfirm = () => {
  const links = linksText
    .split(/[\n,]+/)
    .map(l => l.trim())
    .filter(Boolean);
  onConfirm(links);
  setLinksText("");
  onClose();
};
```

</example>

---

## 資料處理

### 表單提交時的資料轉換

<rule id="data-conversion">
提交表單時，需將前端 state 轉換為後端 API 要求的格式，特別是陣列和物件類型需要序列化為 JSON 字串。
</rule>

**提交轉換邏輯：**

| 前端 State | API 欄位 | 轉換方式 |
| :--- | :--- | :--- |
| `customerLinks: string[]` | `customer_links` | `JSON.stringify(customerLinks.filter(Boolean))` |
| `blacklistRules: Array<{type, value}>` | `blacklist_rules` | `JSON.stringify(blacklistRules.filter(r => r.value))` |

---

## 驗收標準

<rule id="acceptance-criteria">
技術組完成開發後，請根據以下清單逐項檢查，確保所有功能與 UI 細節均與火鳥系統完全對齊。
</rule>

| 檢查項目 | 驗收標準 |
| :--- | :--- |
| **頁面整體佈局** | 左側步驟導航 + 左欄 + 右欄三區域，比例與火鳥一致 |
| **Line鏈接** | 動態多行輸入 + 批量彈窗功能正常 |
| **像素 ⓘ 圖標** | 5 個像素欄位都有 tooltip，hover 顯示說明 |
| **表單提交** | 所有欄位正確序列化並送至 API |
| **主色一致** | 所有互動元素使用 `#7c3aed`，hover 使用 `#6d28d9` |

---

## 結論

本次 v1.7 的修改核心在於**提升使用者體驗的細膩度與一致性**。透過對齊火鳥系統的各項 UI/UX 細節，可以降低使用者在不同系統間切換的學習成本。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-v1-10-2-cta-attr-cmd.md`](./godview-v1-10-2-cta-attr-cmd.md) | 後續 CTA 歸因串接指令 |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | 系統設計分析 |
| [`godview-tag-mapping.md`](./godview-tag-mapping.md) | 完整 TAG 對照表 |
