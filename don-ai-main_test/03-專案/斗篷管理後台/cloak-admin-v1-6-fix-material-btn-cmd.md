---
title: "修改指令 v1.6：素材中心操作按鈕修復（圖標→文字 + API 串接）"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "v1.6 版修復素材中心列表的五個操作按鈕（編輯源碼、複製、預覽、編輯、刪除），從圖標改為文字形式，並實作對應的 getTemplate / updateTemplate / deleteTemplate / createTemplate API 串接邏輯。"
version: "v1.0"
id: "20260325-024356"
type: cmd
tags: [api, cloak-admin, frontend, landing-page, react]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: v1.6 版將素材中心列表的操作欄從圖標按鈕全面改為文字按鈕（編輯源碼、複製、預覽、編輯、刪除），並實作完整的 API 串接邏輯。「編輯源碼」透過 `GET /api/v1/templates/:id` 載入 HTML 後開啟 CodeMirror 彈窗；「複製」呼叫 `POST /api/v1/templates` 建立名稱加「-副本」的新素材；「預覽」在新分頁直接 `document.write` 渲染 HTML；「編輯」以 `prompt` 修改名稱與國家後呼叫 `PUT`；「刪除」以 `window.confirm` 確認後呼叫 `DELETE`。若後端缺少 `PUT` 和 `DELETE` 端點，需在 `src/routes/templates.ts` 補充。

# 修改指令 v1.6：素材中心操作按鈕修復

**目標**：修復素材中心列表的五個操作按鈕，全部改為文字按鈕（不用圖標），並實作對應的 API 呼叫邏輯。

## 1. 需求分析

根據 v1.6 的需求，素材中心列表的操作按鈕需要進行以下調整：

- **風格統一**：將原有的圖標按鈕全部替換為文字按鈕，以提升介面的一致性和可讀性。
- **功能實現**：確保「編輯源碼」、「複製」、「預覽」、「編輯」、「刪除」五個按鈕的功能與後端 API 正確對接。

## 2. 實作方案

### 2.1. 修改目標文件

主要的修改集中在前端的素材管理頁面：
- `src/pages/Templates/index.tsx`：負責修改表格操作欄位與按鈕的點擊事件邏輯。

### 2.2. 程式碼範例

<example id="templates-index-tsx">
以下為 `src/pages/Templates/index.tsx` 文件的完整替換程式碼，包含了更新後的 UI 和功能邏輯。

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import AddTemplateModal from './AddTemplateModal';
import SourceEditorModal from './SourceEditorModal';
import { fetchTemplates, getTemplate, updateTemplate, deleteTemplate, createTemplate } from '@/api';

export default function Templates() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  
  // 編輯源碼狀態
  const [sourceEditorOpen, setSourceEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['templates', typeFilter],
    queryFn: () => fetchTemplates({ type: typeFilter === 'all' ? undefined : typeFilter, page: 1, limit: 20 })
  });

  const templates = data?.items || [];

  // ===== 1. 編輯源碼 =====
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

  // ===== 2. 複製 =====
  const handleCopy = async (template: any) => {
    try {
      await createTemplate({
        name: template.name + '-副本',
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

  // ===== 3. 預覽 =====
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

  // ===== 4. 編輯（基本資訊） =====
  const handleEdit = async (id: string) => {
    try {
      const res = await getTemplate(id);
      const t = res.data;
      const newName = prompt('請輸入新名稱', t.name);
      if (newName === null) return;
      const newCountry = prompt('請輸入新國家', t.country);
      if (newCountry === null) return;
      
      await updateTemplate(id, { name: newName, country: newCountry });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('已更新');
    } catch (err) {
      alert('更新失敗');
    }
  };

  // ===== 5. 刪除 =====
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('確定要刪除此素材嗎？刪除後無法恢復。');
    if (!confirmed) return;
    try {
      await deleteTemplate(id);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      alert('已刪除');
    } catch (err) {
      alert('刪除失敗');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="landing">落地頁管理</TabsTrigger>
          <TabsTrigger value="templates">素材中心</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex space-x-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="money_page">主題</SelectItem>
                  <SelectItem value="safe_page">安全頁</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary-hover text-white">
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
            </div>
            <Button 
              className="bg-success hover:bg-success-hover text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              新增主題
            </Button>
          </div>

          {/* 數據表格 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead>名稱</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>國家</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4">載入中...</TableCell></TableRow>
                ) : templates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4">暫無數據</TableCell></TableRow>
                ) : (
                  templates.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <Badge className={row.type === 'safe_page' ? 'bg-success-light text-success' : 'bg-primary-light text-primary'}>
                          {row.type === 'safe_page' ? '安全頁' : '主題'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>
                        <Badge className="bg-success-light text-success">可用</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleEditSource(row.id)} className="text-primary hover:text-primary-hover text-sm font-medium">編輯源碼</button>
                          <button onClick={() => handleCopy(row)} className="text-primary hover:text-primary-hover text-sm font-medium">複製</button>
                          <button onClick={() => handlePreview(row.id)} className="text-primary hover:text-primary-hover text-sm font-medium">預覽</button>
                          <button onClick={() => handleEdit(row.id)} className="text-primary hover:text-primary-hover text-sm font-medium">編輯</button>
                          <button onClick={() => handleDelete(row.id)} className="text-danger hover:text-red-700 text-sm font-medium">刪除</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AddTemplateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setIsAddModalOpen(false);
          refetch();
        }}
      />

      <SourceEditorModal
        isOpen={sourceEditorOpen}
        content={editingTemplate?.content || ''}
        onSave={handleSaveSource}
        onClose={() => { setSourceEditorOpen(false); setEditingTemplate(null); }}
      />
    </div>
  );
}
```
</example>

## 3. 部署與驗收

### 3.1. 部署步驟

<step id="deploy-frontend">
完成程式碼修改後，執行以下指令進行前端應用的構建與部署：

```bash
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```
</step>

### 3.2. 驗收標準

<rule id="v1-6-acceptance-criteria">

1. 素材列表的操作欄按鈕全部變為文字（編輯源碼、複製、預覽、編輯、刪除），不再使用圖標。
2. 點擊「編輯源碼」能打開 CodeMirror 彈窗並載入 HTML。
3. 點擊「複製」會呼叫 API 建立新素材（名稱加「-副本」），並刷新列表。
4. 點擊「預覽」會開新分頁顯示素材的 HTML 內容。
5. 點擊「編輯」會彈出 prompt 可修改名稱和國家，保存後刷新列表。
6. 點擊「刪除」會彈出確認框，確認後刪除並刷新列表。
7. `npm run build` 過程無錯誤。

</rule>

## 4. 結論

本次修改統一了素材中心的操作按鈕風格，並確保了各項功能的正常運作。透過將圖標替換為文字按鈕，提升了用戶界面的清晰度和易用性。部署前請務必根據驗收標準逐一確認，以保證上線品質。

## 附錄 A：後端 API 端點實作（源自 v1.3）

<rule id="api-endpoints">
以下後端 API 端點是操作按鈕功能的基礎，需確認後端已部署且支援：

```
GET    /api/v1/templates/:id    # 取得單一素材源碼
PUT    /api/v1/templates/:id    # 更新素材
DELETE /api/v1/templates/:id    # 刪除素材
POST   /api/v1/templates        # 複製素材（透過新增一筆實現）
```

如果 `PUT` 和 `DELETE` 端點缺失，請在後端路由檔案 `src/routes/templates.ts` 中補充以下程式碼：

<example id="backend-put-delete">

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

## 附錄 B：前端 API 函式（源自 v1.3）

<example id="frontend-api-functions">
在前端的 `src/api/index.ts` 檔案中，確保包含以下用於與後端 API 互動的函式：

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

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-v1-3-visit-log-cmd.md](cloak-admin-v1-3-visit-log-cmd.md) | v1.3 版日誌頁面指令，API 函式源自此版本 |
| [cloak-admin-v1-4-edit-src-style-cmd.md](cloak-admin-v1-4-edit-src-style-cmd.md) | v1.4 版源碼編輯器樣式調整 |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 規範 |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 通用環境指令 |
