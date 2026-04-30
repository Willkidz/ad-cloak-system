---
title: "shadow-cloak D1 Binding 修復技術指令"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-29"
summary: "提供修復 `shadow-cloak` Worker 因無法使用 D1 Binding 而導致日誌記錄不全問題的技術指令。"
version: "v1.0"
id: "20260328-d1-binding-fix"
type: cmd
tags: [cloak-admin, cloudflare-d1, cloudflare-workers, javascript, shadow-cloak, troubleshooting]
status: active
created: "2026-03-25"
updated: "2026-03-29"
---
> **TL;DR**: 本指令修復 `shadow-cloak` Worker 的核心 Bug：因使用舊版 Service Worker 格式無法存取 `env` 導致必須透過 REST API 寫入 D1，進而造成 **IP 顯示為 unknown**（subrequest 遺失標頭）與 **visitor_id 為 null**。修復方案為將代碼重構為 **ES Module** 格式，並在 Cloudflare 控制台新增名為 `DB` 的 D1 Binding（ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`），改用原生 `env.DB.prepare()` 寫入。

# shadow-cloak D1 Binding 修復技術指令

## 問題診斷摘要

目前 `shadow-cloak` Worker 在寫入 `cloak_logs` 資料表時，遭遇 IP 顯示為 "unknown" 以及 `visitor_id` 為 null 的問題。此問題影響了共 2440 筆記錄，導致無法有效追蹤訪客行為。

### 問題根因

*   **架構限制**: 舊有的 Service Worker 格式 (`addEventListener('fetch', ...)`) 無法直接存取環境變數（`env`），因此無法使用原生的 D1 Binding。
*   **REST API 副作用**: 為繞過限制而採用的 D1 REST API 呼叫，因屬於 Worker 發出的 subrequest，無法正確傳遞 `CF-Connecting-IP` 標頭，導致 IP 記錄為 "unknown"。同時，`visitor_id` 也可能在 JSON payload 傳遞過程中遺失。
*   **安全風險**: 舊代碼中硬編碼了 Cloudflare Account ID 與 API Token，存在嚴重安全隱患。

### Bindings 狀態對比

| Worker 名稱 | KV Binding | D1 Binding | 狀態 |
| :--- | :--- | :--- | :--- |
| `line-redirect` | (視設定而定) | `DB` (ID: `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`) | 正常運作 |
| `shadow-cloak` | `SHADOW_CLOAK_KV` | **無** | **異常** (使用 REST API) |

---

## 修復步驟

為了解決此問題，需要將 Worker 升級為 ES Module 格式，並啟用 D1 Binding。

### 步驟一：為 shadow-cloak 新增 D1 Binding

<step id="add-d1-binding">
請選擇以下任一方式為 `shadow-cloak` Worker 新增 D1 Binding。

**方法 A：透過 Cloudflare Dashboard (推薦)**
1.  登入 Cloudflare Dashboard。
2.  導覽至 **Workers & Pages** → 選擇 **shadow-cloak**。
3.  點擊 **Settings** 標籤頁 → 選擇 **Bindings**。
4.  點擊 **Add** → 選擇 **D1 Database**。
5.  設定以下參數：
    *   **Variable name**: `DB`
    *   **D1 Database**: 選擇 ID 為 `3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c` 的資料庫。
6.  儲存設定。

**方法 B：透過 Wrangler CLI**
在 `wrangler.toml` 中加入：
```toml
[[d1_databases]]
binding = "DB"
database_name = "godview-clicks"
database_id = "3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
```
</step>

### 步驟二：更新 shadow-cloak 程式碼 (v5.2)

<step id="update-code">
請將 `shadow-cloak` 的程式碼更新為 ES Module 格式。關鍵改動在於使用 `request.headers.get('CF-Connecting-IP')` 獲取真實 IP，並透過 `env.DB` 寫入日誌。

<example>
```javascript
export default {
  async fetch(request, env, ctx) {
    const visitorId = crypto.randomUUID();
    const url = new URL(request.url);
    const cf = request.cf || {};

    const verdict = determineVerdict(cf, request);
    const reason = getVerdictReason(cf, request, verdict);

    const logData = {
      visitor_id: visitorId,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      asn: cf.asn || 0,
      country: cf.country || 'unknown',
      ua: request.headers.get('user-agent') || 'unknown',
      verdict,
      reason,
      path: url.pathname + url.search,
      referer: request.headers.get('referer') || ''
    };

    ctx.waitUntil(logToDB(env, logData));
    // ... 後續 Proxy 邏輯 ...
  }
};
```
</example>
</step>

## 驗證方法

<step id="verification">
部署完成後，執行以下 SQL 查詢檢查最新記錄：
<example>
```sql
SELECT id, timestamp, ip, visitor_id, verdict 
FROM cloak_logs 
ORDER BY timestamp DESC LIMIT 5;
```
</example>
**預期結果**：`ip` 應顯示真實位址，`visitor_id` 應為有效 UUID，回應標頭 `X-Shadow-Cloak` 應為 `v5.2`。
</step>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [cloak-admin-b-team-v1-10-dataflow-verify.md](cloak-admin-b-team-v1-10-dataflow-verify.md) | 數據流驗證報告 |
| [cloak-admin-troubleshoot.md](cloak-admin-troubleshoot.md) | 故障診斷紀錄 |
