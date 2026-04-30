---
title: "修改指令 v1.5：添加廣告頁面重構"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "重構「添加廣告」頁面，採用左右分欄設計並優化使用者介面與提交流程，旨在將介面風格與功能完全對齊「火鳥廣告系統」。"
version: "v1.0"
id: "20260325-v1-5-add-ad-page"
type: cmd
tags: [advertising, api, cloak-admin, firebird, frontend, react]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令定義了「添加廣告」頁面的全面重構規範。目標是將原有介面更新為 **左右分欄佈局**，以提升操作體驗並對齊火鳥系統。核心內容包括：(1) **左欄**：包含基本資訊、分流設置、像素設置，標題為紫色；(2) **右欄**：包含斗篷規則、安全頁設置，標題為紫色；(3) **流程指引**：左側顯示 5 步靜態流程指引；(4) **技術細節**：整合 `Select` 下拉選單載入 `templates` 數據，並實作 `handleSubmit` 提交邏輯。

# 修改指令 v1.5：添加廣告頁面重構

本文檔說明「斗篷管理後台」中「添加廣告」頁面的重構計畫，主要目標是將原有介面更新為左右分欄的佈局，以提升使用者操作體驗與資訊清晰度。

---

## 一、頁面佈局規格 (Layout Spec)

<rule id="page-layout">

頁面應採用左右分欄設計，背景色為淺灰色 (`#f8fafc`)，內容區塊為純白色卡片。

- **左側欄 (Left Column)**:
    - **流程指引**: 顯示 5 步靜態流程指引文字（僅顯示，不可點擊）。
    - **基本資訊**: 包含廣告名稱、推廣域名、短鏈後綴。
    - **分流設置**: 包含多個 LINE 連結輸入框、分流策略（隨機、輪詢、IP 哈希）。
    - **像素設置**: 包含 TK/FB/GA/Google 像素 ID 填寫。
- **右側欄 (Right Column)**:
    - **斗篷規則**: 包含國家、語言、OS、黑名單等過濾條件。
    - **安全頁設置**: 包含安全頁類型（模板/連結）、模板選擇、彈出內容編輯。

</rule>

---

## 二、核心程式碼實作

<step id="frontend-implementation">
修改 `src/pages/CampaignEdit/index.tsx`，實作左右分欄佈局與表單狀態管理。
</step>

<example id="ui-implementation">

```tsx
<div className="grid grid-cols-12 gap-6">
  {/* 左欄: 8 欄位 */}
  <div className="col-span-8 space-y-6">
    <section className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-purple-600 font-semibold mb-4">基本資訊</h3>
      {/* 表單欄位... */}
    </section>
    <section className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-purple-600 font-semibold mb-4">分流設置</h3>
      {/* 表單欄位... */}
    </section>
  </div>

  {/* 右欄: 4 欄位 */}
  <div className="col-span-4 space-y-6">
    <section className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-purple-600 font-semibold mb-4">斗篷規則</h3>
      {/* 表單欄位... */}
    </section>
    <section className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-purple-600 font-semibold mb-4">安全頁設置</h3>
      <div className="space-y-4">
        <Label>安全頁類型</Label>
        <RadioGroup 
          value={formData.safe_page_type} 
          onValueChange={v => setFormData({...formData, safe_page_type: v})}
          className="flex space-x-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="template" id="sp-template" />
            <Label htmlFor="sp-template">安全落地頁模板</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id="sp-link" />
            <Label htmlFor="sp-link">安全頁鏈接</Label>
          </div>
        </RadioGroup>
        {/* 模板選擇與內容編輯... */}
      </div>
    </section>
  </div>
</div>

{/* 底部按鈕 */}
<div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
  <div className="text-sm text-gray-500">溫馨提示：請確認所有必填欄位已填寫完畢。</div>
  <div className="flex space-x-4">
    <Button variant="outline" onClick={() => navigate('/campaigns')}>取消</Button>
    <Button className="bg-primary hover:bg-primary-hover text-white" onClick={handleSubmit}>提交保存</Button>
  </div>
</div>
```

</example>

---

## 三、部署指令

<step id="deploy-frontend">
完成程式碼修改後，請執行以下指令進行前端專案的建置與部署：

```bash
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```
</step>

---

## 四、驗收標準 (Acceptance Criteria)

<rule id="acceptance-criteria">

1. **佈局驗證**: 進入添加廣告頁面，版面應呈現左右分欄設計。
2. **流程指引**: 左側應有 5 步流程指引文字（僅為靜態顯示，不可點擊）。
3. **標題顏色**: 左欄與右欄各區塊標題必須為紫色。
4. **數據載入**: 廣告落地頁與安全落地頁模板皆為下拉選單，能正確載入並顯示 `templates` 數據。
5. **按鈕樣式**: 頁面底部應有「溫馨提示」文字、一個「取消」按鈕與一個紫色的「提交保存」按鈕。
6. **提交驗證**: 完整填寫表單並點擊提交後，應能成功呼叫後端 API，並在操作成功後自動返回活動列表頁。
7. **建置驗證**: 前端專案建置（`npm run build`）過程應無任何錯誤訊息。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-v1-7-add-ad-logic-cmd.md](cloak-admin-v1-7-add-ad-logic-cmd.md) | 添加廣告業務邏輯與 API 映射 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範與設計 Token |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
