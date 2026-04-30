---
title: "Ant Design Pro Modal Layout Practices"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Ant Design Pro Modal Layout Practices"
type: "guide"
tags: [changelog, reference]
status: "archived"
---

## H2：方案一：設定 ModalForm 寬度

這是最直接的方法，透過 `width` 屬性可以快速增加 Modal 的寬度。

### H3：基礎寬度設定

<rule id="modal-width-basic">
直接給 `width` 屬性設定一個固定的像素值。

<example>
```tsx
import { ModalForm } from '@ant-design/pro-components';

export default function EditCampaignModal() {
  return (
    <ModalForm
      title="編輯廣告活動"
      trigger={<button type="primary">編輯</button>}
      width={1000}  // 直接設定 Modal 寬度為 1000px
      onFinish={async (values) => {
        console.log(values);
        return true;
      }}
    >
      {/* 表單內容 */}
    </ModalForm>
  );
}
```
</example>
</rule>

### H3：響應式寬度設定（推薦）

<rule id="modal-width-responsive">
為了在不同尺寸的螢幕上都有良好的表現，推薦使用 Ant Design 的 `Grid.useBreakpoint()` Hook 來實現響應式寬度。

<example>
```tsx
import { ModalForm } from '@ant-design/pro-components';
import { Grid } from 'antd';

export default function EditCampaignModal() {
  const screens = Grid.useBreakpoint();

  const getModalWidth = () => {
    if (screens.lg) return 1200;  // 大螢幕：1200px
    if (screens.md) return 900;   // 中等螢幕：900px
    if (screens.sm) return 700;   // 小螢幕：700px
    return '90vw';                // 超小螢幕：90% 視口寬度
  };

  return (
    <ModalForm
      title="編輯廣告活動"
      width={getModalWidth()}
      // ... 其他屬性
    >
      {/* 表單內容 */}
    </ModalForm>
  );
}
```
</example>
</rule>

### H3：不同寬度單位對比

| 方式 | 程式碼範例 | 優點 | 缺點 |
| :--- | :--- | :--- | :--- |
| **固定 px** | `width={1000}` | 精確控制，所見即所得 | 在小螢幕上可能出現水平滾動條 |
| **百分比 %** | `width="80%"` | 相對於父容器自適應 | 若父容器寬度不確定，佈局可能混亂 |
| **視口寬度 vw** | `width="90vw"` | 相對於視口，響應式效果好 | 在超大螢幕上可能過寬 |
| **`useBreakpoint`** | 見上方範例 | **最佳實踐**，兼顧精確控制與響應式 | 需要編寫額外的邏輯 |

---

## H2：方案二：ProForm Grid 多欄排列（核心方案）

當表單欄位較多時，單純加寬 Modal 是不夠的，需要將欄位進行多欄排列。`ProForm` 提供了強大的 `grid` 模式來實現此功能。

<rule id="proform-grid-mode">
將 `ModalForm` 的 `grid` 屬性設為 `true`，即可啟用基於 Ant Design 24 欄格線系統的響應式佈局。

### H3：啟用 Grid 模式 - 兩欄排列

<example>
```tsx
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';

export default function EditCampaignModal() {
  return (
    <ModalForm
      title="編輯廣告活動"
      width={1200}
      grid={true}  // 啟用格線化佈局
      rowProps={{
        gutter: [16, 16],  // 行和列的間距
      }}
      colProps={{
        xs: 24,    // 超小螢幕：佔滿一行 (1欄)
        sm: 24,    // 小螢幕：佔滿一行 (1欄)
        md: 12,    // 中等螢幕：兩欄（每欄佔 12/24）
        lg: 12,    // 大螢幕：兩欄
      }}
      // ... 其他屬性
    >
      {/* 左欄 */}
      <ProFormText name="campaignName" label="活動名稱" />
      <ProFormSelect name="country" label="允許國家" mode="multiple" />

      {/* 右欄 */}
      <ProFormText name="budget" label="預算" />
      <ProFormSelect name="language" label="允許語言" mode="multiple" />
    </ModalForm>
  );
}
```
</example>
</rule>

### H3：個別欄位寬度覆蓋

<rule id="proform-grid-override">
有時某些特定欄位（如「詳細描述」）需要佔據整行。可以在該欄位上單獨設定 `colProps` 來覆蓋全局設定。

<example>
```tsx
<ModalForm
  title="編輯廣告活動"
  width={1200}
  grid={true}
  colProps={{ md: 12, lg: 12 }} // 全局默認兩欄
>
  {/* 正常兩欄 */}
  <ProFormText name="campaignName" label="活動名稱" />
  <ProFormText name="budget" label="預算" />

  {/* 這個欄位單獨佔滿一行 */}
  <ProFormText
    name="description"
    label="詳細描述"
    colProps={{
      xs: 24, sm: 24, md: 24, lg: 24, // 在所有尺寸下都佔滿 24 欄
    }}
  />

  {/* 繼續兩欄 */}
  <ProFormText name="startDate" label="開始日期" />
  <ProFormText name="endDate" label="結束日期" />
</ModalForm>
```
</example>
</rule>

### H3：Ant Design 24 欄系統速查表

| 欄數 | `span` 值 | 說明 |
| :--- | :--- | :--- |
| **1 欄** | `24` | 佔滿 100% 寬度 |
| **2 欄** | `12` | 各佔 50% 寬度 |
| **3 欄** | `8` | 各佔 33.33% 寬度 |
| **4 欄** | `6` | 各佔 25% 寬度 |
| **6 欄** | `4` | 各佔 16.67% 寬度 |

---

## H2：方案三：調整 Modal 內部樣式與分組

即使使用了多欄佈局，如果欄位過多，Modal 的高度也可能成為瓶頸。同時，合理的視覺分組可以讓表單更清晰。

### H3：增加 Modal 內部高度與滾動

<rule id="modal-bodystyle">
透過 `modalProps.bodyStyle` 可以自訂 Modal 內容區域的樣式，例如設定最大高度並啟用垂直滾動條。

<example>
```tsx
<ModalForm
  title="編輯廣告活動"
  width={1200}
  modalProps={{
    destroyOnClose: true,
    bodyStyle: {
      maxHeight: '70vh',  // 最大高度為視口高度的 70%
      overflowY: 'auto',  // 內容超出時顯示垂直滾動條
    },
  }}
>
  {/* 大量表單欄位 */}
</ModalForm>
```
</example>
</rule>

### H3：使用 ProForm.Group 進行視覺分組

<rule id="proform-grouping">
對於邏輯上相關的欄位，使用 `ProFormGroup` 進行分組，可以增加 `title` 和 `collapsible`（可折疊）屬性，讓複雜表單更有條理。

<example>
```tsx
import { ModalForm, ProFormText, ProFormGroup } from '@ant-design/pro-components';

<ModalForm /* ... */ >
  <ProFormGroup title="基本資訊" collapsible>
    <ProFormText name="campaignName" label="活動名稱" />
    <ProFormText name="description" label="描述" />
  </ProFormGroup>

  <ProFormGroup title="地理和語言設定" collapsible>
    <ProFormSelect name="country" label="允許國家" mode="multiple" />
    <ProFormSelect name="language" label="允許語言" mode="multiple" />
  </ProFormGroup>
</ModalForm>
```
</example>
</rule>

---

## H2：方案四：使用 Drawer 替代 Modal（最佳空間利用）

<rule id="use-drawer-for-complex-forms">
**對於包含大量欄位（例如超過 15 個）的編輯表單，強烈推薦使用 `DrawerForm` 替代 `ModalForm`。** Drawer 從側面滑出，可以利用整個螢幕的高度，提供了更寬敞的佈局空間，是處理複雜表單的最佳實踐。

### H3：基礎 DrawerForm 用法

`DrawerForm` 的 API 與 `ModalForm` 高度相似，遷移成本很低。

<example>
```tsx
import { DrawerForm, ProFormText } from '@ant-design/pro-components';

export default function EditCampaignDrawer() {
  return (
    <DrawerForm
      title="編輯廣告活動"
      trigger={<button type="primary">編輯</button>}
      width={800} // Drawer 寬度
      drawerProps={{
        destroyOnClose: true,
      }}
      onFinish={async (values) => {
        console.log(values);
        return true;
      }}
    >
      {/* 表單欄位 */}
    </DrawerForm>
  );
}
```
</example>
</rule>

### H3：Drawer vs Modal 場景對比

| 特性 | Modal (彈出式對話框) | Drawer (抽屜) |
| :--- | :--- | :--- |
| **適用場景** | 簡短表單、操作確認、訊息提示 | **複雜表單**、多步驟流程、詳情展示 |
| **空間利用** | 垂直和水平空間都有限 | **垂直空間充足**，水平空間可調 |
| **上下文干擾** | 中斷用戶當前心流，覆蓋頁面中心 | 保留了頁面主體的可見性，干擾較小 |
| **可調整大小** | ❌ 不支援 | ✅ 支援 (v5.17.0+) |
| **推薦欄位數** | < 10 個 | **10+ 個** |

> [待確認] Drawer 的 `resizable` 功能需要 Ant Design v5.17.0 或更高版本。請在使用前確認專案依賴版本。

---

## H2：結論與最終建議

針對 Ant Design Pro 中複雜表單的排版問題，我們總結出一個漸進式的最佳實踐路徑：

1.  **起點**：從 `ModalForm` 開始，使用 `width` 屬性配合 `useBreakpoint` Hook 設定一個合理的響應式寬度。
2.  **核心佈局**：啟用 `grid={true}` 模式，並設定 `colProps` 為 `{ md: 12 }`，實現基礎的兩欄佈局。對需要單獨佔一行的欄位，覆蓋其 `colProps` 為 `{ md: 24 }`。
3.  **處理溢出**：當欄位過多導致 Modal 高度不足時，為 `modalProps.bodyStyle` 增加 `maxHeight` 和 `overflowY: 'auto'`。
4.  **終極方案**：如果表單極其複雜（欄位超過 15 個或分組繁多），應果斷放棄 `ModalForm`，**重構為 `DrawerForm`**。這是解決此類問題最優雅、用戶體驗最好的方案。

遵循以上步驟，可以系統性地解決 Ant Design Pro 中從簡單到複雜的各類表單排版挑戰。

## H2：相關文件

| 文件 | 關係 |
| :--- | :--- |
| [Ant Design Pro Components: ProForm](https://procomponents.ant.design/components/form) | 官方 ProForm 文件，提供所有 API 細節 |
| [Ant Design: Grid](https://ant.design/components/grid) | 官方格線系統文件，解釋 24 欄佈局原理 |
| [Ant Design: Drawer](https://ant.design/components/drawer) | 官方 Drawer 元件文件 |
