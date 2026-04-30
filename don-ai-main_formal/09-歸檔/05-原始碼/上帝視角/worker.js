export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /memory - 讀取記憶
      if (path === '/memory' && method === 'GET') {
        const project = url.searchParams.get('project');
        const category = url.searchParams.get('category');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        if (!project) {
          return jsonResponse({ error: 'project parameter is required' }, 400, corsHeaders);
        }

        let sql = 'SELECT * FROM memories WHERE project = ?';
        let params = [project];

        if (category) {
          sql += ' AND category = ?';
          params.push(category);
        }

        sql += ' ORDER BY updated_at DESC LIMIT ?';
        params.push(limit);

        const result = await env.DB.prepare(sql).bind(...params).all();
        return jsonResponse({ memories: result.results, count: result.results.length }, 200, corsHeaders);
      }

      // GET /memory/search - 搜尋記憶
      if (path === '/memory/search' && method === 'GET') {
        const project = url.searchParams.get('project');
        const q = url.searchParams.get('q');

        if (!project || !q) {
          return jsonResponse({ error: 'project and q parameters are required' }, 400, corsHeaders);
        }

        const sql = `SELECT * FROM memories WHERE project = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY updated_at DESC LIMIT 20`;
        const searchTerm = '%' + q + '%';
        const result = await env.DB.prepare(sql).bind(project, searchTerm, searchTerm, searchTerm).all();
        return jsonResponse({ memories: result.results, count: result.results.length }, 200, corsHeaders);
      }

      // POST /memory - 寫入記憶
      if (path === '/memory' && method === 'POST') {
        const body = await request.json();
        const { project, category, title, content, tags } = body;

        if (!project || !category || !title || !content) {
          return jsonResponse({ error: 'project, category, title, content are required' }, 400, corsHeaders);
        }

        const validCategories = ['architecture', 'credentials', 'workflow', 'issue_resolved', 'convention', 'context'];
        if (!validCategories.includes(category)) {
          return jsonResponse({ error: 'Invalid category. Valid: ' + validCategories.join(', ') }, 400, corsHeaders);
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const sql = `INSERT INTO memories (project, category, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const result = await env.DB.prepare(sql).bind(project, category, title, content, tags || null, now, now).run();

        return jsonResponse({ success: true, id: result.meta.last_row_id }, 201, corsHeaders);
      }

      // DELETE /memory/:id - 刪除記憶
      const deleteMatch = path.match(/^\/memory\/(\d+)$/);
      if (deleteMatch && method === 'DELETE') {
        const id = parseInt(deleteMatch[1]);
        const result = await env.DB.prepare('DELETE FROM memories WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, changes: result.meta.changes }, 200, corsHeaders);
      }

      // PUT /memory/:id - 更新記憶
      const updateMatch = path.match(/^\/memory\/(\d+)$/);
      if (updateMatch && method === 'PUT') {
        const id = parseInt(updateMatch[1]);
        const body = await request.json();
        const { title, content, tags, category } = body;

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let updates = [];
        let params = [];

        if (title) { updates.push('title = ?'); params.push(title); }
        if (content) { updates.push('content = ?'); params.push(content); }
        if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
        if (category) { updates.push('category = ?'); params.push(category); }
        updates.push('updated_at = ?');
        params.push(now);
        params.push(id);

        const sql = `UPDATE memories SET ${updates.join(', ')} WHERE id = ?`;
        const result = await env.DB.prepare(sql).bind(...params).run();
        return jsonResponse({ success: true, changes: result.meta.changes }, 200, corsHeaders);
      }

      // GET / - Health check
      if (path === '/' && method === 'GET') {
        return jsonResponse({
          service: 'manus-memory-api',
          status: 'ok',
          endpoints: [
            'GET /memory?project=xxx&category=yyy&limit=20',
            'GET /memory/search?project=xxx&q=keyword',
            'POST /memory',
            'PUT /memory/:id',
            'DELETE /memory/:id'
          ]
        }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (err) {
      return jsonResponse({ error: err.message }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
