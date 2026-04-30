---
title: "API Schema 同步與防錯策略"
category: reference
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "闡述在前後端分離架構中，解決 API Schema 不匹配問題的最佳實踐，以 Zod 結合 TypeScript 共用型別為核心建議。"
id: "20260325-api-schema-sync"
type: concept
tags: [api, backend, frontend, typescript]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 在前後端分離架構中，API Schema 不匹配常導致執行期錯誤。本文件比較了 OpenAPI 驅動、Monorepo 共用型別與 Zod Schema 共用三種策略。**推薦方案**為採用 **Zod Schema 共用**，結合靜態型別推導與執行期驗證，實現「單一真實來源」。針對本專案（Hono + React），建議整合 `@hono/zod-openapi` 以自動生成規格並確保全端型別安全。

# API Schema 同步與防錯策略

在前後端分離架構中，API 規格（Schema）的不匹配是導致系統執行期錯誤的常見原因。當後端修改資料結構而前端未同步更新時，會引發資料解析失敗或應用程式崩潰。

---

## 一、核心問題分析

<boundaries id="api-sync-issues">

傳統開發模式下，前端與後端各自維護型別定義，會帶來以下風險：
- **型別漂移 (Type Drift)**：後端變更後前端未及時更新，導致型別定義過時。
- **驗證邏輯不一致**：前端表單規則與後端接收規則衝突，損害用戶體驗。
- **錯誤發現延遲**：不匹配問題通常在整合測試或生產環境才暴露。

</boundaries>

---

## 二、解決方案比較

| 策略 | 核心原理 | 優點 | 缺點 |
| :--- | :--- | :--- | :--- |
| **OpenAPI (Swagger)** | API 優先，透過 YAML/JSON 定義規格並生成程式碼。 | 語言無關，適合多語言團隊；規格與實作同步。 | 學習曲線陡峭，維護規格文件繁瑣。 |
| **TypeScript Monorepo** | 透過 Monorepo (如 pnpm workspaces) 建立 `shared` 套件存放共用型別。 | 實作簡單，編譯期捕捉型別錯誤。 | 僅解決靜態檢查，無法處理執行期資料驗證。 |
| **Zod Schema 共用** | **(推薦)** 定義一次 Zod Schema，同時用於驗證與型別推導。 | **單一真實來源**；兼顧靜態安全與執行期驗證。 | 高度依賴 TS 生態，不適用混合語言專案。 |

---

## 三、建議實作方式：Hono + Zod OpenAPI

針對本專案（前端 React + TS，後端 Hono on Cloudflare Workers），建議採納 **Zod Schema 共用策略**。

### 實作步驟

<step id="api-sync-implementation">

1. **建立共用 Schema 目錄**：在 `shared/schemas` 中集中定義所有 Zod Schemas。
2. **後端整合驗證**：使用 `@hono/zod-openapi` 中介軟體，自動驗證請求並生成 OpenAPI 3.0 規格。
3. **前端整合驗證與型別**：透過 `z.infer<typeof MySchema>` 推導型別，並將 Schema 傳遞給 `react-hook-form` 進行客戶端驗證。

</step>

### 程式碼範例

<example title="共用 Schema 定義 (shared/schemas/user.ts)">

```typescript
import { z } from 'zod';

// 定義 Zod Schema，包含驗證規則
export const UserCreateSchema = z.object({
  name: z.string().min(2, "名稱至少需要 2 個字元"),
  email: z.string().email("無效的 Email 格式"),
  role: z.enum(["admin", "user"]).default("user"),
});

// 從 Zod Schema 自動推導出 TypeScript 型別，供全端共用
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
```

</example>

---

## 四、結論

採用以 Zod 為中心的 Schema 共享策略，能以最低維護成本實現靜態型別安全與執行期資料驗證。這不僅提升了開發效率，更顯著增強了系統的穩定性與可靠性。

---

## 參考資料

- [1] Giacomo Folli. "Stop Breaking Your API: How Shared Types Eliminate Frontend-Backend Bugs". Level Up Coding.
- [2] Jussi Nevavuori. "End-to-end Typesafe APIs with TypeScript and shared Zod schemas". DEV Community.
