---
title: "修改指令-v1.3-訪問日誌頁面"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "**目標**：實作訪問日誌頁面，從 D1 讀取真實的 `cloak_logs` 數據並顯示，包含分頁、Tab 篩選與狀態標籤"
status: "archived"
archived_reason: "歸檔：v1.3 訪問日誌頁面修改指令已完成執行"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "project-doc"
tags: [cloak-admin, cloaking]
created: 2026-03-25
updated: "2026-03-27"
---

# 修改指令-v1.3-訪問日誌頁面

**目標**：實作訪問日誌頁面，從 D1 讀取真實的 `cloak_logs` 數據並顯示，包含分頁、Tab 篩選與狀態標籤。

---

## 一、需要修改的檔案

1. `src/pages/Logs/index.tsx` (前端頁面)
2. `src/routes/logs.ts` (後端 API，確認支援 `verdict` 篩選)

---

## 二、完整程式碼

### 1. 前端頁面 (`src/pages/Logs/index.tsx`)

請將 `src/pages/Logs/index.tsx` 的內容替換為以下程式碼：

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../api';

const TABS = [
  { key: 'all', label: '全部日誌' },
  { key: 'visit', label: '訪問日誌' },
  { key: 'click', label: '按鈕點擊' },
  { key: 'safe_click', label: '安全內頁點擊' },
  { key: 'cloak_block', label: '斗篷攔截' },
];

function formatReason(reason: string): string {
  if (!reason) return '-';
  if (reason.startsWith('geo_filter_')) return `地區過濾: ${reason.replace('geo_filter_', '')}`;
  if (reason.startsWith('blocked_asn_')) return `ASN 封鎖: ${reason.replace('blocked_asn_', '')}`;
  return reason;
}

function formatTime(ts: string): string {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('zh-TW', { hour12: false });
}

function truncate(str: string, max: number): string {
  if (!str) return '-';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export default function LogsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      // Tab 篩選
      if (activeTab === 'cloak_block') params.verdict = 'safe';
      
      const res = await api.get('/logs', { params });
      setLogs(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, page, limit]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* 頂部 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
      </div>

      {/* Tab */}
      <div className="flex border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-medium">
              <th className="py-3 px-4 text-left">序號</th>
              <th className="py-3 px-4 text-left">訪問時間</th>
              <th className="py-3 px-4 text-left">訪問路徑</th>
              <th className="py-3 px-4 text-left">國家/ASN</th>
              <th className="py-3 px-4 text-left">IP</th>
              <th className="py-3 px-4 text-left">設備(UA)</th>
              <th className="py-3 px-4 text-left">狀態</th>
              <th className="py-3 px-4 text-left">攔截原因</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{log.id}</td>
                <td className="py-3 px-4">{formatTime(log.timestamp)}</td>
                <td className="py-3 px-4">{log.path || '/'}</td>
                <td className="py-3 px-4">{log.country} / AS{log.asn}</td>
                <td className="py-3 px-4">{log.ip}</td>
                <td className="py-3 px-4" title={log.ua}>
                  {truncate(log.ua, 40)}
                </td>
                <td className="py-3 px-4">
                  {log.verdict === 'safe' ? (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">斗篷攔截</span>
                  ) : (
                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">已放行</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">{formatReason(log.reason)}</td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr><td colSpan={8} className="py-8 text-center text-gray-400">暫無數據</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">共 {total} 條記錄</span>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={20}>20條/頁</option>
            <option value={50}>50條/頁</option>
            <option value={100}>100條/頁</option>
          </select>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            上一頁
          </button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. 後端 API (`src/routes/logs.ts`)

請確認或修改 `src/routes/logs.ts`，確保支援 `verdict` 篩選參數：

```typescript
import { Hono } from 'hono';

const logs = new Hono<{ Bindings: { DB: D1Database } }>();

logs.get('/', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const verdict = c.req.query('verdict');
  const offset = (page - 1) * limit;

  let where = '';
  const params: any[] = [];

  if (verdict && verdict !== 'all') {
    where = 'WHERE verdict = ?';
    params.push(verdict);
  }

  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM cloak_logs ${where}`
  ).bind(...params).first();

  const items = await db.prepare(
    `SELECT * FROM cloak_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: {
      items: items.results,
      total: countResult?.total || 0,
      page,
      limit,
    },
  });
});

export default logs;
```

---

## 三、部署指令

### 前端部署
```bash
cd cloak-admin-frontend
npm run build
npx wrangler pages deploy dist --project-name=cloak-admin
```

### 後端部署
```bash
cd cloak-admin-api
npx wrangler deploy
```

---

## 四、驗收標準

1. 打開訪問日誌頁面，能看到真實數據。
2. 「全部日誌」Tab 顯示所有記錄。
3. 「斗篷攔截」Tab 只顯示 `verdict=safe` 的記錄。
4. 分頁正常：切換頁碼、切換每頁筆數。
5. 刷新按鈕能重新載入數據。
6. 返回按鈕能回到廣告列表。
7. 狀態欄顯示紅色「斗篷攔截」或綠色「已放行」標籤。
8. 攔截原因顯示中文（如：地區過濾: FR、ASN 封鎖: 8075）。
9. UA 欄位截斷顯示，hover 能看到完整內容。
10. build 零錯誤。
