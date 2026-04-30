---
title: "Ant Design Pro Modal 與 Drawer 表單寬度和排版最佳實踐"
category: "project"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Ant Design Pro Modal 與 Drawer 表單寬度和排版最佳實踐"
type: "guide"
tags: [changelog, cloaking]
status: "archived"
---
---
title: "Ant Design Pro Modal 與 Drawer 表單寬度和排版最佳實踐"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-27"
summary: "提供 Ant Design Pro 中 Modal 與 Drawer 表單的最佳寬度設定、多欄排版、響應式設計及空間利用策略，解決複雜表單擁擠問題。"

status: "archived"
archived_reason: "已整合至 04-資源與參考/Ant Design Pro Modal 表單寬度和排版最佳實踐完整指南.md"
archived_date: "2026-03-27"
merged_into: "04-資源與參考/Ant Design Pro Modal 表單寬度和排版最佳實踐完整指南.md"---

# Ant Design Pro Modal 與 Drawer 表單寬度和排版最佳實踐

## 問題背景

在「斗篷管理後台」的廣告活動編輯功能中，使用的 Modal 彈窗因寬度不足，導致大量表單欄位（如允許國家、允許語言、OS 白名單、進階設定等）全部擠在一起，造成視覺體驗不佳與操作不便。

## 方案一：設定 Modal 寬度

最直接的解決方法是調整 `ModalForm` 的寬度屬性。

### 基礎寬度設定

<rule id="modal-fixed-width">
可以直接為 `ModalForm` 設定一個固定的像素寬度，以快速解決內容擁擠問題。
</rule>

<example>
```tsx
import { ModalForm } from '@ant-design/pro-components';

export default function EditCampaignModal() {
  return (
    <ModalForm
      title="編輯廣告活動"
      width={1000} // 直接設定 Modal 寬度為 1000px
      // ...其他屬性
    >
      {/* 表單欄位 */}
    </ModalForm>
  );
}
```
</example>

### 響應式寬度設定（推薦）

<rule id="modal-responsive-width">
為了適應不同尺寸的螢幕，應使用 Ant Design 的 `Grid.useBreakpoint()` Hook 來實現響應式寬度調整。這能確保在各種裝置上都有良好的視覺效果。
</rule>

<example>
```tsx
import { ModalForm } from '@ant-design/pro-components';
import { Grid } from 'antd';

export default function EditCampaignModal() {
  const screens = Grid.useBreakpoint();

  const getModalWidth = () => {
    if (screens.lg) return 1200; // 大螢幕
    if (screens.md) return 900;  // 中等螢幕
    if (screens.sm) return 700;  // 小螢幕
    return '90vw';             // 超小螢幕
  };

  return (
    <ModalForm
      title="編輯廣告活動"
      width={getModalWidth()}
      // ...其他屬性
    >
      {/* 表單欄位 */}
    </ModalForm>
  );
}
```
</example>

### 不同寬度設定方式對比

| 方式 | 程式碼範例 | 優點 | 缺點 |
| :--- | :--- | :--- | :--- |
| **固定 px** | `width={1000}` | 精確控制，版面一致 | 在小螢幕上可能超出邊界 |
| **百分比** | `width="80%"` | 自適應父容器 | 在不同容器中寬度不固定 |
| **視口寬度 (vw)** | `width="90vw"` | 真正響應式，基於視窗 | 可能因過寬而影響佈局 |
| **useBreakpoint** | `getModalWidth()` | **最佳平衡，精準且響應** | 需要撰寫額外判斷邏輯 |

## 方案二：使用 ProForm Grid 實現多欄排版

<rule id="form-grid-layout">
對於包含大量欄位的表單，應啟用 `grid={true}` 屬性，並搭配 `colProps` 進行多欄排版，這是解決表單擁擠的核心方案。
</rule>

### 啟用 Grid 模式

<step id="enable-grid">
將 `ModalForm` 的 `grid` 屬性設為 `true`，並透過 `colProps` 設定不同螢幕尺寸下的欄位佔比。
</step>

<example>
```tsx
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';

export default function EditCampaignModal() {
  return (
    <ModalForm
      title="編輯廣告活動"
      width={1200}
      grid={true} // 啟用栅格化布局
      rowProps={{ gutter: [16, 16] }} // 設定欄位間距
      colProps={{
        xs: 24, // 超小螢幕：佔滿一行
        sm: 24, // 小螢幕：佔滿一行
        md: 12, // 中等螢幕：兩欄
        lg: 12, // 大螢幕：兩欄
      }}
      // ...其他屬性
    >
      <ProFormText name="campaignName" label="活動名稱" />
      <ProFormSelect name="country" label="允許國家" mode="multiple" />
      <ProFormText name="budget" label="預算" />
      <ProFormSelect name="language" label="允許語言" mode="multiple" />
    </ModalForm>
  );
}
```
</example>

### 覆蓋全域 colProps

<rule id="override-col-props">
若要讓特定欄位佔據整行（例如長備註欄位），可單獨為其設定 `colProps` 來覆蓋全域設定。
</rule>

<example>
```tsx
<ModalForm grid={true} colProps={{ md: 12 }}>
  {/* 正常兩欄 */}
  <ProFormText name="campaignName" label="活動名稱" />
  <ProFormText name="budget" label="預算" />

  {/* 此欄位佔滿一行 */}
  <ProFormText
    name="description"
    label="詳細描述"
    colProps={{ md: 24 }} // 在中等螢幕及以上佔滿 24 格
  />

  {/* 繼續兩欄 */}
  <ProFormText name="startDate" label="開始日期" />
  <ProFormText name="endDate" label="結束日期" />
</ModalForm>
```
</example>

## 方案三：使用 Drawer 替代 Modal

<rule id="use-drawer-for-complex-forms">
當表單欄位超過 10 個或包含複雜編輯區域時，應優先考慮使用 `DrawerForm`（抽屜）。Drawer 能利用整個螢幕高度，提供更寬裕的空間，是處理複雜表單的最佳選擇。
</rule>

### Drawer 與 Modal 的選擇

| 特性 | Modal | Drawer |
| :--- | :--- | :--- |
| **適用場景** | 簡短表單、確認對話框 | **複雜表單、多欄位編輯** |
| **空間利用** | 垂直與水平空間均受限 | 可利用整個螢幕高度和側邊寬度 |
| **可調整大小** | 否 | 是 (v5.17.0+) |
| **推薦欄位數** | < 10 個 | **10+ 個** |

### DrawerForm 實作範例

<example>
```tsx
import { DrawerForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';

export default function EditCampaignDrawer() {
  return (
    <DrawerForm
      title="編輯廣告活動"
      width={800} // Drawer 寬度可設得更寬
      drawerProps={{ destroyOnClose: true }}
      onFinish={async (values) => { /* ... */ }}
    >
      {/* 在此使用 Grid 或 Group 進行排版 */}
      <ProFormText name="campaignName" label="活動名稱" />
      <ProFormSelect name="country" label="允許國家" mode="multiple" />
      {/* ...更多欄位 */}
    </DrawerForm>
  );
}
```
</example>

## 結論與建議

<rule id="final-recommendation">
綜合以上方案，針對「廣告活動編輯」這類包含大量欄位的複雜表單，**強烈建議採用 `DrawerForm` 替代 `ModalForm`**。在 `DrawerForm` 內部，結合 `grid` 模式進行多欄排版，並使用 `Grid.useBreakpoint()` 實現響應式寬度，以達到最佳的用戶體驗和空間利用效率。
</rule>

## 相關文件

- [待補充：專案內其他 UI/UX 規範文件]
