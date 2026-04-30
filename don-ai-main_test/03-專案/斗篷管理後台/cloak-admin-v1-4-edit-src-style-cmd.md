---
title: "修改指令-v1.4：編輯源碼樣式升級"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "將素材中心的「編輯源碼」彈窗從基本文本框升級為具備語法高亮與深色主題的 CodeMirror 編輯器，以對齊火鳥廣告系統的樣式。"
version: "v1.0"
id: "20260325-v1-4-edit-src-style"
type: cmd
tags: [cloak-admin, frontend, landing-page, react, typescript]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令定義了素材中心「編輯源碼」彈窗的技術升級方案。目標是將傳統的 `<textarea>` 替換為功能強大的 **CodeMirror** 編輯器，實現與火鳥系統一致的開發體驗。核心改動包括：(1) 引入 `@uiw/react-codemirror`；(2) 啟用 **One Dark** 深色主題與 HTML 語法高亮；(3) 顯示程式碼行號、括號匹配與活動行高亮。升級後需通過 `npm run build` 驗證並部署至 Cloudflare Pages。

# 修改指令-v1.4：編輯源碼樣式升級

本文件旨在說明如何將素材中心的「編輯源碼」彈窗從傳統的 `<textarea>` 升級為功能更強大的 CodeMirror 編輯器。此次升級將引入程式碼行號、語法高亮以及深色主題，使其樣式與火鳥廣告系統保持一致，從而提升開發者體驗。

---

## 一、需要修改的檔案

- `package.json`：用於安裝新的前端套件。
- `src/pages/Templates/SourceEditorModal.tsx`：源碼編輯器的主元件（或可能位於 `src/components/SourceEditorModal.tsx`）。

---

## 二、安裝套件

<step id="install-packages">
請在前端專案的根目錄下執行以下指令，以安裝 CodeMirror 相關的套件：

```bash
cd cloak-admin-frontend
npm install @uiw/react-codemirror @codemirror/lang-html @codemirror/theme-one-dark
```
</step>

---

## 三、完整程式碼實作

<step id="replace-code">
請找到 `SourceEditorModal.tsx` 元件檔案，並使用以下完整程式碼替換其全部內容。這將實現一個包含標題、可關閉按鈕、CodeMirror 編輯區及操作按鈕的現代化彈窗。
</step>

<example id="codemirror-implementation">

```tsx
import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';

interface SourceEditorModalProps {
  isOpen: boolean;
  content: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

const SourceEditorModal = ({ isOpen, content, onSave, onClose }: SourceEditorModalProps) => {
  const [code, setCode] = useState(content);

  useEffect(() => {
    setCode(content);
  }, [content]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[900px] max-h-[85vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">編輯源碼</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* 程式碼編輯區 */}
        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={code}
            height="500px"
            theme={oneDark}
            extensions={[html()]}
            onChange={(value) => setCode(value)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
              autocompletion: false,
            }}
          />
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => onSave(code)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceEditorModal;
```

</example>

---

## 四、部署指令

<step id="deploy-frontend">
完成程式碼修改後，請執行以下指令進行前端專案的建置與部署：

```bash
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```
</step>

---

## 五、驗收標準 (Acceptance Criteria)

<rule id="acceptance-criteria">

1. **開啟驗證**: 點擊「編輯源碼」按鈕後，彈窗應能正常開啟。
2. **主題驗證**: 編輯器應呈現深色背景（One Dark 主題）。
3. **行號驗證**: 編輯器左側應顯示程式碼行號。
4. **高亮驗證**: HTML 語法應有高亮效果（標籤紫色、屬性綠色、字串黃色）。
5. **儲存驗證**: 點擊「保存」按鈕後，修改的內容應成功儲存至 D1 資料庫。
6. **取消驗證**: 點擊「取消」或關閉按鈕後，彈窗應能正常關閉。
7. **建置驗證**: 前端專案建置過程（`npm run build`）不應出現任何錯誤。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-v1-2-resource-expand-cmd.md](cloak-admin-v1-2-resource-expand-cmd.md) | 素材中心功能擴充指令 |
| [cloak-admin-tech-dev-spec.md](cloak-admin-tech-dev-spec.md) | 技術開發規格書 |
| [cloak-admin-soul.md](cloak-admin-soul.md) | 專案核心總覽 |
