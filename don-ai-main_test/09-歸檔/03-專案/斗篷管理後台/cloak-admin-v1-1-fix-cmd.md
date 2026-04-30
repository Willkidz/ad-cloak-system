---
title: "修復指令-斗篷後台v1.1(1)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "body.cloak_lang, body.cloak_country, id"
status: "archived"
archived_reason: "歸檔：v1.1 修復指令已完成執行，後台功能已修復"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [cloak-admin, cloaking]
created: 2026-03-25
updated: "2026-03-27"
---

# 修復指令-斗篷後台v1.1(1)

    body.cloak_lang, body.cloak_country, id
  );
  
  await stmt.run();
  return c.json({ success: true, data: { id } });
});

// 路由：刪除廣告
app.delete('/api/v1/campaigns/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// 路由：獲取素材列表
app.get('/api/v1/templates', async (c) => {
  const { type, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = 'SELECT * FROM templates';
  let countQuery = 'SELECT COUNT(*) as total FROM templates';
  const params: any[] = [];
  
  if (type) {
    query += ' WHERE type = ?';
    countQuery += ' WHERE type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const totalResult = await c.env.DB.prepare(countQuery).bind(...(type ? [type] : [])).first();
  
  return c.json({
    success: true,
    data: {
      items: results,
      total: totalResult?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// 路由：新增素材
app.post('/api/v1/templates', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  const stmt = c.env.DB.prepare(`
    INSERT INTO templates (id, type, country, name, identifier, status, content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, body.type, body.country || '中國台灣', body.name, body.identifier, 
    body.status || 'active', body.content || ''
  );
  
  await stmt.run();
  return c.json({ success: true, data: { id } });
});

// 路由：刪除素材
app.delete('/api/v1/templates/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});
```text

同時，在前端 `src/api/index.ts` 中補充對應的請求函式：

```typescript
// ... 原有程式碼保留 ...

export const fetchCampaign = async (id: string) => {
  const { data } = await api.get(`/campaigns/${id}`);
  return data.data;
};

export const updateCampaign = async (id: string, payload: any) => {
  const { data } = await api.put(`/campaigns/${id}`, payload);
  return data;
};

export const deleteCampaign = async (id: string) => {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data;
};

export const fetchTemplates = async (params: any) => {
  const { data } = await api.get('/templates', { params });
  return data.data;
};

export const createTemplate = async (payload: any) => {
  const { data } = await api.post('/templates', payload);
  return data;
};

export const deleteTemplate = async (id: string) => {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
};
```

**驗收標準**：
1. 後端 API 支援 `GET /api/v1/campaigns/:id`, `PUT /api/v1/campaigns/:id`, `DELETE /api/v1/campaigns/:id`。
2. 後端 API 支援 `GET /api/v1/templates`, `POST /api/v1/templates`, `DELETE /api/v1/templates/:id`。
3. 前端 `api/index.ts` 包含所有對應的請求函式，供組件呼叫。
