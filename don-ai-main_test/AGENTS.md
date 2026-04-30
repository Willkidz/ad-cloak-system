---
title: "常用命令（Frequently Used Commands）"
category: "reference"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-30"
summary: "以下為本專案中最常用的終端機命令，AI 助手應優先使用這些精確命令，避免猜測或試錯。"
type: "spec"
tags: [guidelines, reference]
status: "active"
version: "v1.1"
---

<commands>

# 常用命令（Frequently Used Commands）

以下為本專案中最常用的終端機命令，AI 助手應優先使用這些精確命令，避免猜測或試錯。

## 🛠️ 核心資源檢索（優先查閱）
> **當你需要選擇工具、技術方案、工作流模板、程式碼參考時，必須先查閱 don-tools 倉庫。**
> **倉庫地址：[https://github.com/laoqin1689/don-tools](https://github.com/laoqin1689/don-tools)**
> **原則：不要自己從零搜索，先看我們已經整理好的資源。**

## don-ai 知識庫操作
```bash
# Clone 知識庫
git clone https://github.com/laoqin1689/don-ai.git

# 提交變更
git add -A && git commit -m "簡述更新內容" && git push
```

## cloak-admin 前端（admin.bexnua.store）
```bash
# 安裝依賴
pnpm install

# 啟動本地開發伺服器
pnpm run dev

# 建構生產版本
pnpm run build

# 部署到 Cloudflare Pages（測試版）
npx wrangler pages deploy dist/public --project-name=cloak-admin-frontend --branch=staging

# 部署到 Cloudflare Pages（正式版）
npx wrangler pages deploy dist/public --project-name=cloak-admin-frontend
```

## Cloudflare Workers
```bash
# 本地開發測試
npx wrangler dev

# 部署 Worker（測試版）
npx wrangler deploy --env staging

# 部署 Worker（正式版）
npx wrangler deploy

# 查看 Worker 日誌
npx wrangler tail <worker-name>
```

## 測試與驗證
```bash
# API 測試範例
curl -s https://line-redirect-staging.laoqin1689.workers.dev/test | jq .

# 檢查 Worker 部署狀態
curl -s https://<worker-name>.laoqin1689.workers.dev/ -o /dev/null -w "%{http_code}"
```

</commands>

<boundaries>

# 三層邊界摘要（Boundaries Summary）

> 完整版請參見 [`00-系統索引/common-cmd.md`](00-%E7%B3%BB%E7%B5%B1%E7%B4%A2%E5%BC%95/common-cmd.md) 的 `<boundaries>` 區塊。

- **Always do**：TypeScript 嚴格模式、修改後實際測試並提供證據、結束前更新 CHANGELOG.md、結束前更新 memory 相關文件
- **Ask first**：修改 D1 表結構前、變更核心路由邏輯前、可能導致服務中斷的部署前、刪除任何文件前
- **Never do**：硬編碼密碼或 API Token、繞過測試直接宣稱完成、刪除 `.ai/` 歷史記錄、只改 UI 樣式時修改功能邏輯

</boundaries>

# 項目上下文與 AI 協作規範

## 1. 項目概述

這是一個基於 Cloudflare Workers、D1、N8N 和 React/Vite 的 AI 共用知識庫與自動化系統控制中心。核心目標是管理斗篷系統、上帝視角歸因系統及相關自動化工作流，並作為 AI 助手的持久化記憶庫。

## 2. 技術棧與環境

| 類別 | 技術 |
| :--- | :--- |
| 邊緣計算 | Cloudflare Workers |
| 資料庫 | Cloudflare D1 |
| 自動化 | N8N（自架於 n8n.bexnua.store） |
| 前端 | React 19、Vite、TailwindCSS v4、shadcn/ui |
| CI/CD | GitHub Actions |

## 3. 代碼與文檔規範

<rule id="code-standards">

- 嚴格使用 TypeScript，避免使用 `any`
- 變數命名使用 `camelCase`，組件命名使用 `PascalCase`
- 所有新增的 Markdown 文件必須包含 YAML frontmatter
- 新建 Markdown 文件必須遵循 [`01-核心原則/doc-standards-spec.md`](01-核心原則/doc-standards-spec.md) 定義的標準 YAML frontmatter 格式（包含 title、category、priority、applicable_tools、last_updated、summary 等欄位）
- 遵循 `01-核心原則/` 中的所有規範
</rule>

### TypeScript 代碼範例

<example type="bad">

```typescript
// Bad: 使用 any 類型，缺乏類型安全
const data: any = await response.json();
const result = data.verdict;

// Bad: 硬編碼假設 API 返回值
if (result === 'safe') {
  // 錯誤假設：實際 API 返回的是 'blocked' 而非 'safe'
}

// Bad: 客戶端過濾（浪費頻寬）
const allTemplates = await fetchTemplates();
const filtered = allTemplates.filter(t => t.type === targetType);
```

</example>

<example type="good">

```typescript
// Good: 明確定義介面，類型安全
interface CloakVerdict {
  verdict: 'blocked' | 'allowed';
  reason?: string;
  country?: string;
}
const data = await response.json() as CloakVerdict;

// Good: 根據實際 API 行為判斷
if (data.verdict === 'blocked') {
  const translatedReason = reasonMap[data.reason ?? 'unknown'] ?? '未知原因';
}

// Good: 使用後端參數過濾（節省頻寬）
const templates = await fetchTemplates({ type: targetType });
```

</example>

## 4. 強制記憶與變更記錄工作流

<rule id="memory-workflow">
為了保持跨 session 和跨 Agent 的記憶同步，你必須嚴格遵守以下工作流：

1. **任務開始前**：
   - 讀取 `.ai/active-context.md` 了解當前焦點與最近進度
   - 讀取 `.ai/memory.md` 和 `.ai/error-log.md` 獲取全局架構和歷史錯誤經驗
   - 如遇矛盾資訊，以 `truth-table.md`（若存在）為最高優先級參考

2. **代碼修改中**：
   - 每次修改代碼後，必須運行測試確保代碼可用
   - 遵循「多假設推理」與「反思機制」

3. **部署流程**：
   - 所有修改必須先在測試版驗證無誤，才能部署到正式版
   - 詳見 `01-核心原則/deploy-and-version-spec.md`

4. **版本更新**：
   - 每次部署到正式版前必須更新版本號和 CHANGELOG.md
   - 詳見 `01-核心原則/deploy-and-version-spec.md`

5. **任務完成後（必須執行）**：
   - 打開 `CHANGELOG.md`，在文件頂部追加本次修改的詳細記錄
   - 更新 `.ai/active-context.md` 中的任務狀態
   - 確保所有新知識已更新至對應的 Markdown 文件及 `_index.md`
</rule>

### CHANGELOG 記錄格式

<example>

```markdown
## [v版本號] - YYYY-MM-DD
- **修改文件**：[列出修改的文件路徑]
- **變更內容**：[詳細說明改了什麼，為什麼這樣改]
- **架構決策**：[如果有架構層面的決定，記錄在這裡]
- **測試狀態**：[是否已通過測試，是否有已知的限制]
```
</example>

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `00-系統索引/sys-overview.md` | 新 Agent 必讀的系統全貌與快速上手指南 |
| `00-系統索引/common-cmd.md` | 完整版邊界規則和 SOP 流程 |
| `01-核心原則/doc-standards-spec.md` | YAML frontmatter 標準 |
| `01-核心原則/deploy-and-version-spec.md` | 部署流程規範 |
| `01-核心原則/deploy-and-version-spec.md` | 版本號和 CHANGELOG 規範 |
| `.ai/memory.md` | 系統狀態快照 |
| `.ai/error-log.md` | 錯誤學習日誌 |
| `.ai/active-context.md` | 當前工作上下文（Append-Only 日誌格式） |
| `truth-table.md` | 矛盾解決的最高優先級參考（若存在） |

## 5. 跨專案規則提交機制

<rule id="cross-project-rule-submission">
當你在本專案或其他專案中發現值得全域共享的新規則、防錯經驗或最佳實踐時，必須主動將其提交至 don-ai 知識庫。

1. **提交流程**：在任務結束（Offboarding）階段，若有新規則，請將其整理為標準 JSON 格式，並透過 POST 請求發送至 n8n Webhook (`https://n8n.bexnua.store/webhook/submit-ai-rule`)。
2. **JSON 格式**：
   ```json
   {
     "rule_title": "規則簡述",
     "trigger_condition": "觸發條件",
     "error_symptom": "錯誤現象",
     "correct_practice": "正確做法",
     "source_project": "來源專案名稱",
     "confidence_level": "high | medium | low"
   }
   ```
3. **後續處理**：提交後，系統會自動在 don-ai 建立 PR 並將規則寫入 `.ai/pending-rules.md` 進入金絲雀試用期。
4. **詳細規範**：請參閱 `01-核心原則/cross-project-rule-submission-spec.md`。
</rule>
