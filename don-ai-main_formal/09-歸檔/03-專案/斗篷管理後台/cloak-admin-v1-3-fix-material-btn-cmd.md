---
title: "修復指令：素材中心操作按鈕 v1.3"
category: "project"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）修復指令：素材中心操作按鈕 v1.3"
type: "cmd"
tags: [cloak-admin, cloaking]
status: "archived"
---

# 修復指令：素材中心操作按鈕 v1.3

本文檔旨在指導開發者修復斗篷管理後台「素材中心」列表頁面的操作按鈕，確保編輯源碼、複製、預覽、編輯和刪除功能恢復正常。

## 問題描述

目前素材中心列表頁面的操作欄位有五個圖標按鈕，全部點擊後均無反應。需要修復的按鈕如下：

-   `<>` 編輯源碼
-   `📄` 複製
-   `👁️` 預覽
-   `✏️` 編輯
-   `🗑️` 刪除

## 涉及檔案

修復此功能需要修改以下三個前端檔案：

-   `src/pages/Templates/index.tsx`：主要列表頁面，將在此處添加核心操作邏輯。
-   `src/pages/Templates/SourceEditorModal.tsx`：源碼編輯器彈窗組件。
-   `src/api/index.ts`：API 請求函式庫。

## 修復步驟

請依照以下步驟進行修復。

### <step id="1">第一步：確認後端 API 支援</step>

<rule id="api-endpoints">
首先，需確認後端已部署且支援以下 API 端點。這些端點是操作按鈕功能的基礎。

```bash
# 取得單一素材源碼
GET /api/v1/templates/:id

# 更新素材
PUT /api/v1/templates/:id

# 刪除素材
DELETE /api/v1/templates/:id

# 複製素材（透過新增一筆實現）
POST /api/v1/templates
```

如果 `PUT` 和 `DELETE` 端點缺失，請在後端路由檔案 `src/routes/templates.ts` 中補充以下程式碼：

<example>
```typescript
// PUT /api/v1/templates/:id - 更新素材
templates.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
  if (body.country !== undefined) { fields.push('country = ?'); values.push(body.country); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content); }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.prepare(
    `UPDATE templates SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();
  
  return c.json({ success: true, data: { id } });
});

// DELETE /api/v1/templates/:id - 刪除素材
templates.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  await db.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
  
  return c.json({ success: true, data: { id } });
});
```
</example>

完成後，請重新部署後端服務：

```bash
cd cloak-admin-api
npx wrangler deploy
```
</rule>

### <step id="2">第二步：補充前端 API 函式</step>

<rule id="frontend-api-functions">
接著，在前端的 `src/api/index.ts` 檔案中，確保包含以下用於與後端 API 互動的函式。如果不存在，請將其補全。

<example>
```typescript
// 取得單一素材
export const getTemplate = async (id: string) => {
  const res = await api.get(`/templates/${id}`);
  return res.data;
};

// 更新素材（含源碼）
export const updateTemplate = async (id: string, data: any) => {
  const res = await api.put(`/templates/${id}`, data);
  return res.data;
};

// 刪除素材
export const deleteTemplate = async (id: string) => {
  const res = await api.delete(`/templates/${id}`);
  return res.data;
};

// 複製素材
export const copyTemplate = async (data: any) => {
  const res = await api.post('/templates', data);
  return res.data;
};
```
</example>
</rule>

### <step id="3">第三步：修改素材中心主頁面</step>

<rule id="main-page-logic">
在 `src/pages/Templates/index.tsx` 中整合操作按鈕的邏輯。這包括狀態管理、事件處理函式以及渲染操作按鈕。

<example>
```tsx
// 引入必要的 hooks 和組件
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Code, Copy, Eye, Edit, Trash2 } from 'lucide-react';
import { getTemplates, getTemplate, updateTemplate, deleteTemplate, copyTemplate } from '../../api';
import SourceEditorModal from './SourceEditorModal';

// 在 TemplatesPage 組件內部加入以下 state 和 handlers
const TemplatesPage = () => {
  const queryClient = useQueryClient();
  
  const [sourceEditorOpen, setSourceEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // 1. 編輯源碼
  const handleEditSource = async (id: string) => {
    try {
      const res = await getTemplate(id);
      setEditingTemplate(res.data);
      setSourceEditorOpen(true);
    } catch (err) {
      alert('無法載入源碼');
    }
  };

  const handleSaveSource = async (content: string) => {
    if (!editingTemplate) return;
    try {
      await updateTemplate(editingTemplate.id, { content });
      setSourceEditorOpen(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('源碼已保存');
    } catch (err) {
      alert('保存失敗');
    }
  };

  // 2. 複製
  const handleCopy = async (template: any) => {
    try {
      await copyTemplate({
        name: `${template.name}-副本`,
        type: template.type,
        country: template.country,
        status: template.status,
        content: template.content || '',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('已複製');
    } catch (err) {
      alert('複製失敗');
    }
  };

  // 3. 預覽
  const handlePreview = async (id: string) => {
    try {
      const res = await getTemplate(id);
      const content = res.data.content || '<p>無內容</p>';
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(content);
        win.document.close();
      }
    } catch (err) {
      alert('無法載入預覽');
    }
  };

  // 4. 編輯（基本資訊）
  const handleEdit = async (id: string) => {
    try {
      const res = await getTemplate(id);
      const t = res.data;
      const newName = prompt('名稱', t.name);
      if (newName === null) return;
      const newCountry = prompt('國家', t.country);
      if (newCountry === null) return;
      await updateTemplate(id, { name: newName, country: newCountry });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('已更新');
    } catch (err) {
      alert('更新失敗');
    }
  };

  // 5. 刪除
  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此素材嗎？刪除後無法恢復。')) return;
    try {
      await deleteTemplate(id);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('已刪除');
    } catch (err) {
      alert('刪除失敗');
    }
  };

  // 表格操作欄渲染
  const renderActions = (template: any) => (
    <td className="border-b border-gray-200 py-3 px-4">
      <div className="flex items-center gap-2">
        <button onClick={() => handleEditSource(template.id)} title="編輯源碼">
          <Code size={16} />
        </button>
        <button onClick={() => handleCopy(template)} title="複製">
          <Copy size={16} />
        </button>
        <button onClick={() => handlePreview(template.id)} title="預覽">
          <Eye size={16} />
        </button>
        <button onClick={() => handleEdit(template.id)} title="編輯">
          <Edit size={16} />
        </button>
        <button onClick={() => handleDelete(template.id)} title="刪除">
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  );

  // 在 return 的 JSX 中加入源碼編輯彈窗
  /*
  <SourceEditorModal
    isOpen={sourceEditorOpen}
    content={editingTemplate?.content || ''}
    onSave={handleSaveSource}
    onClose={() => { setSourceEditorOpen(false); setEditingTemplate(null); }}
  />
  */
};
```
</example>
</rule>

### <step id="4">第四步：確認 SourceEditorModal 組件</step>

<rule id="modal-component">
最後，確認 `src/pages/Templates/SourceEditorModal.tsx` 組件存在且其 props 介面符合以下定義。

```typescript
interface SourceEditorModalProps {
  isOpen: boolean;
  content: string;
  onSave: (content: string) => void;
  onClose: () => void;
}
```

若組件不存在或 props 不符，可使用以下完整程式碼進行替換：

<example>
```tsx
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

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
      <div className="bg-white rounded-lg w-[900px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">編輯源碼</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl'>&times;</button>
        </div>
        <div className="flex-1 min-h-[400px]">
          <Editor
            height="400px"
            defaultLanguage="html"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
            }}
          />
        </div>
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
</rule>

## 驗收標準

完成上述步驟並重新部署前端（`npm run build`）後，所有操作按鈕應符合以下預期行為：

| 按鈕 | 預期行為 |
| :--- | :--- |
| `<>` 編輯源碼 | 彈出 Monaco 暗色編輯器，顯示 HTML 源碼，可編輯後保存。 |
| 複製 | 列表新增一筆「名稱-副本」的素材，並刷新列表。 |
| 預覽 | 在新的瀏覽器分頁中顯示素材的 HTML 內容。 |
| 編輯 | 彈出 `prompt` 對話框，可修改素材的名稱和國家。 |
| 刪除 | 彈出 `confirm` 確認框，確認後刪除該素材並刷新列表。 |

## 結論

遵循本文件中的步驟，應可完整修復素材中心的操作按鈕功能。若在過程中遇到 API 問題，請優先與後端開發者確認服務狀態。前端修改完成後，務必進行完整測試以確保所有功能符合驗收標準。
'''
