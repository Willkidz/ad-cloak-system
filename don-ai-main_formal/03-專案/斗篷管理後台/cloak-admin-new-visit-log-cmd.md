---
title: "新專案指令：訪問日誌頁面"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "訪問日誌頁面開發規格：D1 cloak_logs 表結構（2100+ 筆）、API 端點 /api/v1/logs（支援 verdict/country/search 篩選）、前端五 Tab 佈局、攔截原因中文轉換規則與 10 項驗收標準。"
version: "v1.0"
id: "20260325-024356"
type: cmd
tags: [api, cloak-admin, cloaking, cloudflare-d1, frontend, react]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本文件定義了「訪問日誌」頁面的完整開發規格。資料來源為 D1 `cloak_logs` 表（2100+ 筆真實數據，13 個欄位含 id/timestamp/ip/asn/country/ua/verdict/reason/path 等）。API 端點為 `GET /api/v1/logs`，支援 `page`/`limit`/`verdict`/`country`/`search` 五個查詢參數。前端設計包含 5 個 Tab（全部日誌/訪問日誌/按鈕點擊/安全內頁點擊/斗篷攔截），表格 8 欄（序號/訪問時間/訪問路徑/國家ASN/IP/設備UA/狀態/攔截原因），攔截原因自動中文轉換（`geo_filter_FR` → `地區過濾: FR`、`blocked_asn_8075` → `ASN 封鎖: 8075`），狀態標籤 `blocked` → 紅色「斗篷攞截」、`allowed` → 綠色「已放行」。含完整前端 React 組件與後端 Hono API 實作程式碼。驗收標準 10 項，包括 2100+ 筆數據可見、Tab 篩選正確、分頁正常、攔截原因中文顯示等。

# 新專案指令：訪問日誌頁面

本專案旨在建立一個獨立的訪問日誌頁面，用於直接讀取並展示 D1 資料庫中 `cloak_logs` 的真實數據。

---

## 現有數據結構

D1 資料庫中的 `cloak_logs` 表儲存了所有訪問日誌，目前已有超過 2100 筆真實數據。其欄位結構定義如下：

| 欄位 | 類型 | 說明 | 範例值 |
| :--- | :--- | :--- | :--- |
| id | INTEGER | 自增主鍵 | 2100 |
| timestamp | TEXT | 訪問時間 | 2026-03-24T14:01:33.136Z |
| ip | TEXT | 訪客IP | unknown |
| asn | INTEGER | ASN編號 | 132203 |
| country | TEXT | 國家代碼 | JP, FR, US, TW |
| ua | TEXT | User-Agent | Mozilla/5.0... |
| verdict | TEXT | 判定結果 | blocked（被攞截顯示安全頁）或 allowed（放行） |
| reason | TEXT | 攔截原因 | geo_filter_FR, blocked_asn_8075 |
| path | TEXT | 訪問路徑 | /, /contact?t=health |
| referer | TEXT | 來源 | （多數為空） |
| visitor_id | TEXT | 訪客ID | null（目前未填充） |
| language | TEXT | 語言 | null（目前未填充） |
| domain | TEXT | 訪問域名 | null（目前未填充） |

**數據分佈概況**：

| 攔截原因 | 筆數 |
| :--- | :--- |
| `geo_filter_FR` | 1936 |
| `geo_filter_US` | 77 |
| `geo_filter_NL` | 26 |
| `blocked_asn_8075` | 6 |
| `blocked_asn_15169` | 4 |
| 其他國家 | 零星分佈 |

---

## API 端點設計

為前端提供數據的 API 端點已部署，其規格如下。

| 項目 | 值 |
| :--- | :--- |
| URL | `https://admin-api.bexnua.store/api/v1/logs` |
| Method | `GET` |

**Query 參數**：

| 參數 | 說明 | 預設值 |
| :--- | :--- | :--- |
| `page` | 頁碼 | `1` |
| `limit` | 每頁筆數 | `20` |
| `verdict` | 根據判定結果篩選（`all` 或 `blocked`） | — |
| `country` | 根據國家代碼篩選 | — |
| `search` | 針對 `ip`、`ua`、`reason` 欄位進行關鍵字搜索 | — |

---

## 前端頁面需求

前端頁面設計參考了火鳥系統的廣告日誌頁面，包含頂部操作按鈕、Tab 切換、數據表格和分頁四個主要部分。

### 頁面佈局

<step id="layout-top">

**1. 頂部操作區**
- 左側：「← 返回」按鈕，點擊後返回廣告活動列表頁面。
- 右側：「刷新」按鈕，點擊後重新獲取最新日誌數據。

</step>

<step id="layout-tabs">

**2. Tab 切換列**

提供 5 個 Tab 以快速篩選不同類型的日誌：
- **全部日誌**：顯示所有日誌，不進行任何篩選。
- **訪問日誌**：顯示所有 `verdict` 的正常訪問記錄。
- **按鈕點擊**：預留功能，目前無數據。
- **安全內頁點擊**：預留功能，目前無數據。
- **斗篷攞截**：僅顯示 `verdict = blocked` 的記錄，即被攞截並導向安全頁面的訪問。

</step>

<step id="layout-table">

**3. 數據表格**

表格需展示以下欄位，並按指定格式處理：

| 欄位 | 對應 DB 欄位 | 顯示方式 |
| :--- | :--- | :--- |
| 序號 | id | 數字 |
| 訪問時間 | timestamp | 格式化為 `YYYY-MM-DD HH:mm:ss` |
| 訪問路徑 | path | 文字 |
| 國家/ASN | country + asn | 組合顯示，如 "FR / AS132203" |
| IP | ip | 文字 |
| 設備(UA) | ua | 預設截斷顯示，滑鼠懸停時顯示完整內容 |
| 狀態 | verdict | 使用標籤樣式，`verdict=blocked` 顯示紅色「斗篷攞截」 |
| 攔截原因 | reason | 將原因代碼轉換為中文，如 `geo_filter_FR` 顯示為 "地區過濾:FR" |

</step>

<step id="layout-pagination">

**4. 分頁**
- 位於頁面底部，包含上一頁、下一頁、頁碼指示器。
- 提供每頁顯示筆數的選項（20/50/100）。
- 顯示「共 X 條記錄」的總數統計。

</step>

### 攔截原因格式化規則

<rule id="reason-formatting">

前端需根據 `reason` 欄位的內容，將其轉換為更易讀的中文描述。

<example id="format-reason-code">

```typescript
function formatReason(reason: string): string {
  if (reason.startsWith('geo_filter_')) {
    return `地區過濾: ${reason.replace('geo_filter_', '')}`;
  }
  if (reason.startsWith('blocked_asn_')) {
    return `ASN 封鎖: ${reason.replace('blocked_asn_', '')}`;
  }
  if (reason.includes('語言不允許')) {
    return reason; // 已是中文
  }
  return reason;
}
```

</example>

</rule>

### 狀態標籤樣式規則

<rule id="status-styling">

根據 `verdict` 欄位的值，為「狀態」提供不同的視覺樣式。

<example id="status-css">

```css
/* verdict = "blocked" (被攞截) -> 紅色標籤「斗篷攞截」 */
.status-blocked {
  background-color: #fee2e2; /* bg-red-100 */
  color: #dc2626; /* text-red-600 */
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  border-radius: 0.25rem; /* rounded */
  font-size: 0.75rem; /* text-xs */
}

/* verdict = "allowed" (放行) -> 綠色標籤「已放行」 */
.status-allowed {
  background-color: #dcfce7; /* bg-green-100 */
  color: #16a34a; /* text-green-600 */
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  border-radius: 0.25rem; /* rounded */
  font-size: 0.75rem; /* text-xs */
}
```

</example>

</rule>

---

## 實作程式碼參考

以下提供了前端組件和後端 API 的核心程式碼實作參考。

### 前端組件：`src/pages/Logs/index.tsx`

<example id="frontend-component">

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
      if (activeTab === 'cloak_block') params.verdict = 'blocked';
      
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
                  {log.verdict === 'blocked' ? (
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

</example>

### 後端 API：`src/routes/logs.ts`

<example id="backend-api">

```typescript
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
```

</example>

---

## 驗收標準

<rule id="acceptance-criteria">

完成開發後，須通過以下 10 項驗收標準：

1. 打開訪問日誌頁面，能看到 2100+ 筆真實數據。
2. 「全部日誌」Tab 顯示所有記錄。
3. 「斗篷攞截」Tab 只顯示 `verdict=blocked` 的記錄。
4. 分頁功能正常，包括切換頁碼和每頁筆數。
5. 「刷新」按鈕能成功重新載入數據。
6. 「返回」按鈕能正確導航回廣告列表頁面。
7. 狀態欄能根據 `verdict` 的值顯示對應的紅色「斗篷攔截」標籤。
8. 攔截原因能根據規則正確顯示為中文（例如：「地區過濾: FR」、「ASN 封鎖: 8075」）。
9. UA 欄位能截斷顯示，且滑鼠懸停時顯示完整內容。
10. 專案 `build` 過程無任何錯誤。

</rule>

---

## 結論

本文件完整定義了「訪問日誌頁面」的開發需求與實作細節。開發完成後，應嚴格按照驗收標準進行測試，確保所有功能符合預期。後續可考慮擴充篩選條件與圖表分析功能。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-frontend-ui.md](cloak-admin-frontend-ui.md) | 前端 UI 設計規範（含廣告日誌頁面 Tab 設計） |
| [cloak-admin-full-verify-analysis.md](cloak-admin-full-verify-analysis.md) | 全面測試報告（含廣告日誌表格佈局問題） |
| [cloak-admin-env-cmd.md](cloak-admin-env-cmd.md) | 環境資訊與 API 端點 |
