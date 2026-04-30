export default {
  async fetch(request: Request, env: any) {
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
      // GET /memory - 讀取記憶（已升級：支援 min_importance 過濾，更新訪問統計）
      if (path === '/memory' && method === 'GET') {
        const project = url.searchParams.get('project');
        const category = url.searchParams.get('category');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const minImportance = parseInt(url.searchParams.get('min_importance') || '1');

        if (!project) {
          return jsonResponse({ error: 'project parameter is required' }, 400, corsHeaders);
        }

        // 驗證 min_importance 範圍
        if (minImportance < 1 || minImportance > 5) {
          return jsonResponse({ error: 'min_importance must be between 1 and 5' }, 400, corsHeaders);
        }

        let sql = 'SELECT * FROM memories WHERE project = ? AND importance_score >= ?';
        let params: any[] = [project, minImportance];

        if (category) {
          sql += ' AND category = ?';
          params.push(category);
        }

        // 按重要性評分降序，再按最後訪問時間降序排序
        sql += ' ORDER BY importance_score DESC, last_accessed_at DESC LIMIT ?';
        params.push(limit);

        const result = await env.DB.prepare(sql).bind(...params).all();

        // 更新每個記憶的訪問統計
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        for (const memory of result.results) {
          await env.DB.prepare(
            'UPDATE memories SET last_accessed_at = ?, access_count = access_count + 1 WHERE id = ?'
          ).bind(now, memory.id).run();
        }

        return jsonResponse({ memories: result.results, count: result.results.length }, 200, corsHeaders);
      }

      // GET /memory/stats - 新增：記憶統計端點
      if (path === '/memory/stats' && method === 'GET') {
        const project = url.searchParams.get('project');

        if (!project) {
          return jsonResponse({ error: 'project parameter is required' }, 400, corsHeaders);
        }

        // 取得總數
        const totalResult = await env.DB.prepare(
          'SELECT COUNT(*) as total FROM memories WHERE project = ?'
        ).bind(project).first();

        // 按 category 統計
        const categoryResult = await env.DB.prepare(
          'SELECT category, COUNT(*) as count FROM memories WHERE project = ? GROUP BY category'
        ).bind(project).all();

        // 取得最高分記憶
        const topResult = await env.DB.prepare(
          'SELECT id, title, importance_score, access_count FROM memories WHERE project = ? ORDER BY importance_score DESC LIMIT 5'
        ).bind(project).all();

        // 取得最近訪問的記憶
        const recentResult = await env.DB.prepare(
          'SELECT id, title, last_accessed_at, access_count FROM memories WHERE project = ? AND last_accessed_at IS NOT NULL ORDER BY last_accessed_at DESC LIMIT 5'
        ).bind(project).all();

        const stats = {
          project,
          total: totalResult?.total || 0,
          by_category: categoryResult?.results || [],
          top_importance: topResult?.results || [],
          recently_accessed: recentResult?.results || [],
          timestamp: new Date().toISOString()
        };

        return jsonResponse(stats, 200, corsHeaders);
      }

      // GET /memory/search - 搜尋記憶
      if (path === '/memory/search' && method === 'GET') {
        const project = url.searchParams.get('project');
        const q = url.searchParams.get('q');

        if (!project || !q) {
          return jsonResponse({ error: 'project and q parameters are required' }, 400, corsHeaders);
        }

        const sql = `SELECT * FROM memories WHERE project = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY importance_score DESC, updated_at DESC LIMIT 20`;
        const searchTerm = '%' + q + '%';
        const result = await env.DB.prepare(sql).bind(project, searchTerm, searchTerm, searchTerm).all();

        // 更新訪問統計
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        for (const memory of result.results) {
          await env.DB.prepare(
            'UPDATE memories SET last_accessed_at = ?, access_count = access_count + 1 WHERE id = ?'
          ).bind(now, memory.id).run();
        }

        return jsonResponse({ memories: result.results, count: result.results.length }, 200, corsHeaders);
      }

      // POST /memory - 寫入記憶（已升級：支援 importance_score 和 summary）
      if (path === '/memory' && method === 'POST') {
        const body = await request.json();
        const { project, category, title, content, tags, importance_score, summary } = body;

        if (!project || !category || !title || !content) {
          return jsonResponse({ error: 'project, category, title, content are required' }, 400, corsHeaders);
        }

        const validCategories = ['architecture', 'credentials', 'workflow', 'issue_resolved', 'convention', 'context'];
        if (!validCategories.includes(category)) {
          return jsonResponse({ error: 'Invalid category. Valid: ' + validCategories.join(', ') }, 400, corsHeaders);
        }

        // 驗證 importance_score
        let score = 3; // 預設值
        if (importance_score !== undefined) {
          const parsedScore = parseInt(importance_score);
          if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
            return jsonResponse({ error: 'importance_score must be between 1 and 5' }, 400, corsHeaders);
          }
          score = parsedScore;
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const sql = `INSERT INTO memories (project, category, title, content, tags, importance_score, summary, created_at, updated_at, last_accessed_at, access_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const result = await env.DB.prepare(sql).bind(
          project, category, title, content, tags || null, score, summary || null, now, now, now, 0
        ).run();

        return jsonResponse({ success: true, id: result.meta.last_row_id }, 201, corsHeaders);
      }

      // DELETE /memory/:id - 刪除記憶
      const deleteMatch = path.match(/^\/memory\/(\d+)$/);
      if (deleteMatch && method === 'DELETE') {
        const id = parseInt(deleteMatch[1]);
        const result = await env.DB.prepare('DELETE FROM memories WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, changes: result.meta.changes }, 200, corsHeaders);
      }

      // DELETE /memory/cleanup - 新增：自動清理端點
      if (path === '/memory/cleanup' && method === 'DELETE') {
        const project = url.searchParams.get('project');

        if (!project) {
          return jsonResponse({ error: 'project parameter is required' }, 400, corsHeaders);
        }

        // 計算 30 天前的日期
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().replace('T', ' ').substring(0, 19);

        // 刪除 importance_score=1 且超過 30 天未訪問的記憶
        const result = await env.DB.prepare(
          'DELETE FROM memories WHERE project = ? AND importance_score = 1 AND (last_accessed_at IS NULL OR last_accessed_at < ?)'
        ).bind(project, cutoffDate).run();

        return jsonResponse({
          success: true,
          deleted: result.meta.changes,
          message: `Deleted ${result.meta.changes} memories with importance_score=1 not accessed for 30 days`
        }, 200, corsHeaders);
      }

      // PUT /memory/:id - 更新記憶（已升級：支援 importance_score 和 summary）
      const updateMatch = path.match(/^\/memory\/(\d+)$/);
      if (updateMatch && method === 'PUT') {
        const id = parseInt(updateMatch[1]);
        const body = await request.json();
        const { title, content, tags, category, importance_score, summary } = body;

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let updates = [];
        let params: any[] = [];

        if (title) { updates.push('title = ?'); params.push(title); }
        if (content) { updates.push('content = ?'); params.push(content); }
        if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
        if (category) { updates.push('category = ?'); params.push(category); }
        if (importance_score !== undefined) {
          const parsedScore = parseInt(importance_score);
          if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
            return jsonResponse({ error: 'importance_score must be between 1 and 5' }, 400, corsHeaders);
          }
          updates.push('importance_score = ?');
          params.push(parsedScore);
        }
        if (summary !== undefined) { updates.push('summary = ?'); params.push(summary); }

        updates.push('updated_at = ?');
        params.push(now);
        params.push(id);

        const sql = `UPDATE memories SET ${updates.join(', ')} WHERE id = ?`;
        const result = await env.DB.prepare(sql).bind(...params).run();
        return jsonResponse({ success: true, changes: result.meta.changes }, 200, corsHeaders);
      }

      // GET / - Health check（已升級：更新端點列表）
      if (path === '/' && method === 'GET') {
        return jsonResponse({
          service: 'manus-memory-api',
          status: 'ok',
          version: '2.0',
          endpoints: [
            'GET /memory?project=xxx&category=yyy&limit=20&min_importance=3',
            'GET /memory/search?project=xxx&q=keyword',
            'GET /memory/stats?project=xxx',
            'POST /memory (with importance_score, summary)',
            'PUT /memory/:id (with importance_score, summary)',
            'DELETE /memory/:id',
            'DELETE /memory/cleanup?project=xxx'
          ]
        }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data: any, status: number, corsHeaders: any) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
