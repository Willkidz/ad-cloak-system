---
title: "專案名稱：Don AI"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）專案名稱：Don AI"
type: "guide"
tags: [ai-agent, changelog]
status: "archived"
---

## 防止代碼回歸的四層防護策略

為了系統性地解決上述問題，我們提出一個包含四層防護的綜合策略，從系統級約束、任務級限制、架構級隔離到流程級自動化，全面降低 AI 引入回歸錯誤的風險。

### 第一層：系統級約束 (`CLAUDE.md` 文件)

<rule id="system-constraints">
在專案根目錄下建立一個名為 `CLAUDE.md`（或類似的 AI 指導文件），讓 AI 在每次啟動會話時自動讀取。此文件作為系統級的最高指令，定義了專案的核心架構、關鍵指令和絕對禁止的行為。

<example>
```markdown
# 專案名稱：Don AI

## 核心架構
- **前端**: React + TypeScript
- **後端**: Cloudflare Workers (Node.js)
- **資料庫**: Cloudflare D1 (PostgreSQL)
- **部署**: Docker on Cloudflare Workers

## 關鍵指令
- `npm run dev`: 啟動開發伺服器
- `npm test`: 運行完整測試套件
- `npm run lint`: 執行代碼風格檢查

## 🚨 關鍵規則 (CRITICAL RULES)
- ❌ **絕對禁止**刪除或重寫現有測試，除非被明確指示。
- ❌ **絕對禁止**在未經確認的情況下刪除文件。
- ✅ **必須**在任何代碼變更後運行 `npm test`。
- ✅ **必須**在進行大規模重構前建立 Git 檢查點。
- ✅ 一次只專注於一個核心任務，避免同時進行多個不相關的改動。
- ✅ 如果不確定，**必須**提問，而不是猜測。

## 工作風格
- **計劃優先，代碼其次**：在開始編碼前，必須先提出計劃並獲得確認。
- **小步提交 (Small Diff)**：遵循「一個文件 → 測試 → 下一個文件」的模式。
- **即時反饋**：每次改動後，立即運行測試並展示結果。
- **使用子代理 (Subagents)**：對於複雜任務，先使用 `planner` 子代理研究代碼庫。
```
</example>

> **效果**：根據 SFEIR 的研究，高達 60% 的 Claude Code 常見問題可以透過一個簡單而明確的 `CLAUDE.md` 文件來預防。
</rule>

### 第二層：改動預算提示 (Change Budget Prompt)

<rule id="change-budget">
在每一次向 AI 發出修改請求時，明確定義其「改動預算」。這是防止範疇潛變最有效的方法。

#### 預算限制模板

<example>
```
任務: <具體要求>

改動預算:
- 最多只能接觸 <N> 個文件。
- 最多只能改動 <N> 行程式碼（不包含格式化）。
- 不允許引入新的外部依賴。
- 不允許重命名現有變數或函數。
- 必須保持現有函數簽名穩定。

輸出格式:
1. 簡要計劃 (2-4 點)
2. 程式碼變更 (Diff)
3. 解釋為何變更在預算範圍內
4. 測試方法 (包含執行的命令與關鍵場景)
```
</example>

#### 實際案例

**修復 Bug，禁止重構**

<example>
```
任務: 修復 `/api/users/:id` 在用戶不存在時返回 500 錯誤的問題，應改為返回 404。

改動預算:
- 最多 1 個文件
- 最多 12 行改動
- 不允許新依賴
- 不允許重命名

輸出: 程式碼變更 (Diff) + 測試命令
```
</example>

> **效果**：研究顯示，引入「改動預算」能將 AI 生成的平均程式碼變更量從 150+ 行降低到 20-30 行，回歸率隨之下降 60%。
</rule>

### 第三層：子代理隔離上下文 (Subagents)

<rule id="subagents-isolation">
將複雜任務分解，並指派給專職的子代理（Subagents）。每個子代理在各自獨立的上下文視窗中運行，僅將最終的摘要結果返回給主會話，從而避免主會話的上下文被污染。

#### 三個核心子代理

| 子代理 | 職責 | 輸出 | 使用時機 |
| :--- | :--- | :--- | :--- |
| **Planner** | 研究代碼庫，編寫詳細的實現計劃（不產出任何程式碼）。 | 計劃文件，保存至 `./plans/` 目錄。 | 任何複雜任務開始前。 |
| **Tester** | 編寫新測試，並運行**完整**的測試套件（不僅是新測試），報告回歸錯誤。 | 測試結果與回歸錯誤報告。 | 任何程式碼變更後。 |
| **Code-Reviewer** | 檢查程式碼是否存在回歸風險、安全漏洞或違反設計模式。 | 包含嚴重性評級的審查報告，並標明文件與行號。 | 提交（Commit）程式碼前。 |
</rule>

### 第四層：自動化安全網 (Hooks)

<rule id="automated-hooks">
在 AI 開發工具（如 Claude Code）的配置中設定 Hooks，使其在執行關鍵操作（如 `git commit`）前自動觸發預設的檢查命令。這是一道無法繞過的自動化安全網。

#### 關鍵 Hook：阻止包含失敗測試的提交

<example>
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git commit*)',
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --run || (echo '{\"block\": true, \"message\": \"測試失敗，請在提交前修復所有問題。\"}' 1>&2 && exit 2)",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```
</example>

> **效果**：此設定將徹底阻止 AI 提交任何會破壞測試的程式碼。這種強制性的反饋循環會迫使 AI 在推進任務前，必須先解決其引入的回歸問題。
</rule>

---

## AI Agent 指令設計最佳實踐

### 原則一：提供上下文，而非程序指令

<rule id="context-over-instructions">
與其給予生硬的步驟指令，不如提供豐富的上下文資訊。

**❌ 錯誤方式 (TDD Prompting)**
```
請遵循 TDD 流程：先寫測試，再寫程式碼，最後重構。
```

**✅ 正確方式 (提供上下文)**
```
請修改 `validateEmail()` 函數。
相關的測試位於 `tests/validators.test.ts` 文件中。
修改後，請運行測試並確保以下測試案例仍然通過：
- `test("valid emails pass")`
- `test("invalid emails fail")`
- `test("edge cases handled")`
```
</rule>

### 原則二：明確定義「不改什麼」

<rule id="define-negative-constraints">
明確的負面約束有助於防止不必要的修改。

| 改動類型 | 指令範例 |
| :--- | :--- |
| **不修改 API** | "Keep function signatures stable unless explicitly required." |
| **不刪除功能** | "Do not remove functionality; preserve existing branches and logic." |
| **不改動格式** | "Do not change formatting or rename variables unless necessary." |
| **不改變行為** | "Behavior must remain identical; include a small test matrix to verify." |

</rule>

### 原則三：結構化 System Prompt

<rule id="structured-prompt">
使用 Markdown 或 XML 標籤來組織 System Prompt，使其清晰且易於解析。

<example>
```markdown
## 背景資訊
<你的專案背景>

## 指令
<具體要做什麼>

## 工具指導
<如何使用可用工具>

## 輸出描述
<期望的輸出格式>

## 限制
<不能做什麼>
```
</example>
</rule>

### 原則四：內容最小化但求完整

<rule id="minimal-yet-complete">
Prompt 的內容應該同時滿足**最小化**（只包含必要資訊）和**完整性**（足以指導 AI 的行為）。

- **應避免**：冗長的理論說明、重複的指令、假設 AI 共享隱含的上下文。
- **應包含**：清晰的結構、具體的範例、明確的邊界條件。
</rule>

---

## Cloudflare Worker 測試與部署

### 測試策略

<rule id="worker-testing-strategy">
官方推薦使用 **Vitest** 進行 Cloudflare Worker 的測試，它提供了最全面的功能支持。

| 功能 | Vitest | `unstable_startWorker()` | Miniflare |
| :--- | :--- | :--- | :--- |
| 單元測試 | ✅ | ❌ | ❌ |
| 整合測試 | ✅ | ✅ | ✅ |
| 載入 Wrangler 配置 | ✅ | ✅ | ❌ |
| 直接使用 Bindings | ✅ | ❌ | ✅ |
| 隔離的測試儲存 | ✅ | ❌ | ❌ |
| 模擬出站請求 | ✅ | ❌ | ✅ |
| Durable Objects 直接訪問 | ✅ | ❌ | ❌ |

#### 實施步驟

<step>1. **安裝 Vitest**</step>
```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

<step>2. **配置 `vitest.config.ts`**</step>
```typescript
import { defineConfig } from 'vitest/config';
import { getViteConfig } from '@cloudflare/workers-tsconfig';

export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'workers',
    },
  })
);
```

<step>3. **編寫測試**</step>
```typescript
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../src/index';

describe('Worker', () => {
  it('handles GET requests', async () => {
    const request = new Request('https://example.com/', { method: 'GET' });
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
  });
});
```

<step>4. **在 CI/CD 中運行**</step>
```bash
npm test -- --run
```
</rule>

### 部署最佳實踐

<rule id="worker-deployment-strategy">
採用版本管理和漸進式部署策略，確保生產環境的穩定性。

#### 版本管理與漸進式部署

| 階段 | 操作 | 檢查點 |
| :--- | :--- | :--- |
| **開發 (Development)** | 本地測試 + `wrangler dev` | 所有單元測試通過。 |
| **預發布 (Staging)** | 部署到 Staging 環境 | 整合測試通過 + 性能檢查。 |
| **金絲雀 (Canary)** | 5-10% 流量切換到新版本 | 監控錯誤率、延遲和日誌。 |
| **逐步推出 (Rollout)** | 25% → 50% → 100% | 每一步監控至少 30 分鐘。 |
| **生產 (Production)** | 完整部署 | 確認告警配置與回滾計劃。 |

#### 部署命令

```bash
# 於開發環境測試
wrangler dev

# 部署到 Staging 環境
wrangler deploy --env staging

# 部署到生產環境（通常需要二次確認）
wrangler deploy --env production
```
</rule>

---

## n8n 工作流版本控制

<rule id="n8n-version-control">
將 n8n 工作流納入 Git 版本控制，是實現自動化、可追溯和可協作的關鍵。

#### 實施步驟

<step>1. **連接 Git 倉庫**：在 n8n 的 **Settings → Source Control** 中連接您的 GitHub 或 GitLab 倉庫。</step>

<step>2. **設置環境分支**：</step>
| 環境 | 分支 | 用途 |
| :--- | :--- | :--- |
| **Development** | `develop` | 實驗、測試新工作流 |
| **Staging** | `staging` | 整合測試、UAT |
| **Production** | `main` | 實時運行的工作流 |

<step>3. **建立工作流命名與目錄規範**：</step>
<example>
```
workflows/
├── core/
│   ├── user-sync.json
│   └── payment-processing.json
├── integrations/
│   ├── slack-notifications.json
│   └── salesforce-sync.json
└── utilities/
    └── data-transformer.json
```
</example>

<step>4. **建立 CI/CD 部署管道**：使用 GitHub Actions 在 Pull Request 和 Push 事件上觸發自動化檢查與部署。</step>

<example>
```yaml
name: n8n Workflow CI/CD

on:
  pull_request:
    branches: [develop, staging, main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate workflow schema (JSON format)
        run: |
          for file in workflows/**/*.json; do
            jq empty "$file" || exit 1
          done
      - name: Check naming conventions (kebab-case)
        run: |
          for file in workflows/**/*.json; do
            basename "$file" | grep -E '^[a-z0-9-]+\.json$' || exit 1
          done
      - name: Check for undefined credentials
        run: |
          # 確保所有 credential 引用都已定義
          jq -r '.. | select(type == "object") | select(.credentialId) | .credentialId' workflows/**/*.json | sort -u > /tmp/used_creds
          # 此處應加入與已定義 credentials 比對的邏輯

  deploy-staging:
    needs: validate
    if: github.ref == 'refs/heads/develop'
    # ... 部署到 Staging 的邏輯 ...

  deploy-production:
    needs: validate
    if: github.ref == 'refs/heads/main'
    # ... 部署到 Production 的邏輯 ...
```
</example>

<step>5. **配置監控與快速回滾**：在工作流中注入 Git 提交的元數據，並利用 Git 的 `revert` 功能實現一鍵回滾。</step>
</rule>

---

## Token 成本優化策略

一個未經優化的 AI Agent 任務可能消耗 50k 到 100k 的 Tokens。以下技術可以幫助您節省高達 90% 的成本。

### 1. Prompt 緩存 (Prompt Caching)

<rule id="prompt-caching">
對於重複使用的 System Prompt，使用 API 供應商提供的緩存功能。例如，Anthropic Claude API 允許將 `cache_control` 標記為 `ephemeral`。

<example>
```python
import anthropic

client = anthropic.Anthropic()

system_prompt = """
You are a code review expert...
"""

response = client.messages.create(
    model="claude-3-5-sonnet-20240620", # [待確認] 模型版本可能已過期
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}  # 標記為可緩存
        }
    ],
    messages=[...]
)
```
</example>

> **效果**：首次請求後，後續使用相同 System Prompt 的請求成本可降低約 80-90%。
</rule>

### 2. 上下文壓縮 (Context Compression)

<rule id="context-compression">
與其將多個長文檔直接餵給大型模型，不如先用一個較小、較便宜的模型進行分層摘要，最後只將高度壓縮的摘要資訊提供給大型模型。

<example>
```python
def compress_documents(documents):
    # 第一層：使用小模型總結每個文檔
    chunk_summaries = [summarize_with_small_model(doc) for doc in documents]
    
    # 第二層：使用小模型合併所有摘要
    merged_summary = summarize_with_small_model("\n".join(chunk_summaries))
    
    return merged_summary
```
</example>
</rule>

### 3. 其他優化技術

<rule id="other-optimizations">
- **工具定義壓縮**：使用緊湊的函數簽名格式（如 `cpu_analyze(json)`) 來定義工具，而非冗長的自然語言描述。
- **對話狀態替代歷史**：不要發送完整的對話歷史，而是維護一個結構化的狀態對象（JSON），只包含當前任務的關鍵資訊。
- **模型路由**：根據任務的複雜度，使用路由器將請求發送到不同能力和成本的模型（例如，簡單分類任務使用 `gpt-4.1-mini`，複雜推理使用 `gemini-2.5-flash`）。
</rule>

---

## 結論

將 AI Agent 整合到軟體開發流程中，既帶來了前所未有的機遇，也伴隨著獨特的挑戰。本文提出的四層防護策略、指令設計原則、以及針對測試、部署和成本優化的具體實踐，共同構成了一個全面的框架。透過系統性地應用這些方法，開發團隊不僅能顯著降低由 AI 引入的代碼回歸風險，還能提升開發效率、穩定性和成本效益。

成功的關鍵在於從被動響應轉向主動預防，將質量控制和預算意識內建於 AI 協作的每一個環節。最終，一個經過良好設計和嚴格約束的 AI 開發系統，將成為團隊最可靠的夥伴，而非不穩定的變數。

---

## 參考資源

### 研究論文與官方文檔

- [TDAD: Test-Driven Agentic Development](https://arxiv.org/html/2403.17973v1) - 減少 AI Regression 的圖形分析方法
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - AI Agent 上下文管理
- [Cloudflare Workers: Testing](https://developers.cloudflare.com/workers/testing/) - Vitest 整合指南
- [n8n: Source Control & Environments](https://docs.n8n.io/source-control-environments/) - Git 集成文檔

### 實踐指南

- [Claude Code Anti-Regression Setup](https://dev.to/creatman/i-stopped-claude-code-from-breaking-my-projects-heres-the-exact-setup-1agi) - 實際配置案例
- [Change Budget Prompt](https://dev.to/novaelvaris/the-change-budget-prompt-stop-scope-creep-in-ai-assisted-coding-4jbd) - Scope Creep 防止方法
- [Token Cost Optimization](https://medium.com/@ravityuval/how-i-reduced-llm-token-costs-by-90-using-prompt-rag-and-ai-agent-optimization-f64bd1b56d9f) - 90% 成本節省技術
