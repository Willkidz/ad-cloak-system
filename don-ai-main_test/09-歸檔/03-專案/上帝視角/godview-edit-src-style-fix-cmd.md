---
title: "修復指令：編輯源碼樣式（對齊火鳥系統）"
category: "project"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）修復指令：編輯源碼樣式（對齊火鳥系統）"
type: "cmd"
tags: [firebird, godview]
status: "archived"
---
---
title: "修復指令：編輯源碼樣式（對齊火鳥系統）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-27"
summary: "指導開發者如何將素材中心的「編輯源碼」彈窗升級為具有行號、語法高亮和深色主題的 CodeMirror 編輯器，以對齊火鳥廣告系統的視覺樣式。"

status: "archived"
archived_reason: "已整合至 03-專案/斗篷管理後台/修改指令-v1.4-編輯源碼樣式.md"
archived_date: "2026-03-27"
merged_into: "03-專案/斗篷管理後台/修改指令-v1.4-編輯源碼樣式.md"---

# 修復指令：編輯源碼樣式（對齊火鳥系統）

本文檔旨在指導開發者將素材中心的「編輯源碼」彈窗升級為一個功能更完善的程式碼編輯器，使其具備行號顯示、語法高亮和深色主題等特性，最終與火鳥廣告系統的介面樣式保持一致。

## 第一步：安裝相依套件

<step id="install-packages">
首先，需要進入前端專案目錄，並安裝 CodeMirror 相關的 React 套件，包括核心編輯器、HTML 語言模式以及深色主題。

```bash
cd cloak-admin-frontend
npm install @uiw/react-codemirror @codemirror/lang-html @codemirror/theme-one-dark
```
</step>

## 第二步：替換 SourceEditorModal 組件

<step id="replace-component">
接下來，使用以下程式碼完整替換 `src/pages/Templates/SourceEditorModal.tsx`（或 `src/components/SourceEditorModal.tsx`）的現有內容。新的組件整合了 CodeMirror 編輯器並配置了所需的外觀與功能。

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
</step>

## 第三步：建置與部署

<step id="build-deploy">
完成程式碼替換後，執行建置指令產生新的前端資源，並將其部署到 Cloudflare Pages。

```bash
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```
</step>

## 驗收標準

<rule id="acceptance-criteria">
部署完成後，需根據以下標準進行驗收，確保所有功能符合預期：

1.  點擊「編輯源碼」按鈕後，彈窗應能正常開啟。
2.  編輯器背景應為深色主題，與火鳥系統樣式一致。
3.  編輯器左側應顯示行號。
4.  HTML 語法應有高亮效果，不同元素（如標籤、屬性、字串）以不同顏色顯示。
5.  應能正常編輯程式碼，點擊「保存」按鈕後，修改的內容能成功儲存至 D1 資料庫。
6.  點擊「取消」按鈕或關閉圖示應能關閉彈窗。
7.  前端專案的 `build` 過程應無任何錯誤。
</rule>

## 結論

遵循以上步驟，即可將舊有的純文字編輯彈窗升級為現代化的 CodeMirror 程式碼編輯器，顯著提升開發者在後台編輯源碼時的體驗與效率。此項修改不僅統一了與火鳥廣告系統的視覺風格，也為後續可能更複雜的編輯器功能（如自動補全、程式碼摺疊）奠定了基礎。
