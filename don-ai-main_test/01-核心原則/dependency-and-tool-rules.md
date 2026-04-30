---
title: "依賴管理與工具評估規範"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "整合專案依賴（npm/PyPI）的版本控制、更新策略，以及引入外部工具與套件的評估流程。"
type: "rule"
tags: [analysis, changelog, knowledge-base, security]
status: "active"
activation_glob: null
version: "v1.0"
---

<!-- Merged from dependency-management-rules.md -->
> **TL;DR**: 專案依賴必須明確版本號（禁止使用 `*` 或 `latest`），優先使用 `package-lock.json` 鎖定版本。AI 應定期執行 `npm audit` 檢查安全漏洞，並在更新依賴前進行相容性評估與回歸測試。本規則是 `dependency-and-tool-rules.md` 的後續管理規範。

# 依賴管理策略與規範

## 1. 為什麼需要這個規則

隨著專案發展，依賴套件會越來越多。如果沒有明確的管理策略，可能會出現版本衝突、安全漏洞（舊版本依賴）、維護困難，甚至在部署時因為依賴版本變動導致系統崩潰。

---

## 2. 版本控制規範

<rule id="dep-versioning">

### 2.1 明確版本號

在 `package.json` 中，依賴必須明確版本號：

- **禁止**使用 `*` 或 `latest`。
- **建議**使用 `^`（相容次版本更新）或 `~`（相容修補版本更新）。
- 對於核心框架（如 `wrangler`、`vitest`），建議使用固定版本號（不帶前綴）。

### 2.2 鎖定文件

必須提交 `package-lock.json`（或 `pnpm-lock.yaml`）到 Git 倉庫。AI 在安裝依賴時應優先使用 `npm ci` 或 `pnpm install --frozen-lockfile` 確保環境一致。

</rule>

---

## 3. 更新與維護策略

<rule id="dep-update">

### 3.1 定期安全檢查

AI 在執行 SOP 4（Offboarding）或準備部署前，應執行：

```bash
npm audit
```

如果發現中級（Medium）或以上風險的漏洞，必須向用戶回報並提出修復建議。

### 3.2 依賴更新流程

在更新任何依賴前，必須遵循以下流程：

1. **評估更新內容**：查看 ChangeLog，確認是否有破壞性變更（Breaking Changes）。
2. **本地測試**：在本地環境更新並執行所有自動化測試（`npm test`）。
3. **回歸測試**：手動驗證受影響的功能模組。
4. **提交變更**：在 Commit 訊息中明確說明更新了哪些依賴及其原因。

</rule>

---

## 4. 衝突處理規範

<rule id="dep-conflict">

當出現依賴衝突（如兩個套件要求不同版本的同一個依賴）時：

1. **優先升級**：嘗試將相關套件都升級到最新版本，看是否能解決衝突。
2. **使用 Overrides**：在 `package.json` 中使用 `overrides`（npm）或 `resolutions`（pnpm）強制指定版本，但必須在註釋中說明原因。
3. **尋找替代方案**：如果衝突無法解決且影響穩定性，考慮更換其中一個套件。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/dependency-and-tool-rules.md`](dependency-and-tool-rules.md) | 引入新依賴前的評估規範 |
| [`01-核心原則/ai-work-spec.md`](ai-work-spec.md) | 幻覺防護規則中的「依賴真實性驗證」 |
| [`06-SOP流程/acceptance-checklist.md`](../06-SOP流程/acceptance-checklist.md) | 部署前檢查清單中的依賴同步確認 |


<!-- Merged from external-tool-evaluation-rules.md -->
> **TL;DR**: 引入任何新的外部工具、npm 套件或 API 服務前，必須完成五項評估（真實性、安全性、相容性、成本、替代方案），並向用戶提交評估摘要取得同意。小型工具類套件（如 lodash 的單一函數）可走簡化流程，但仍需確認真實性。本規則是 `ai-work-spec.md` 中「幻覺防護規則」的延伸。

# 外部工具與套件引入評估規範

## 1. 為什麼需要這個規則

AI 在解決問題時很容易建議引入新的套件或工具，但每多一個外部依賴，就多一個潛在的安全風險、維護負擔和成本。這個規則確保每次引入都是經過深思熟慮的決定，而不是「剛好想到就加了」。

---

## 2. 評估流程

<rule id="eval-full-process">

### 2.1 完整評估（適用於框架、核心依賴、付費服務）

在引入以下類型的外部依賴前，必須完成完整評估：

- 新的 npm 套件（非 devDependency 的工具類套件）
- 新的 API 服務或 SaaS 平台
- 新的 CI/CD 工具或 GitHub Action
- 任何需要 API Key 或付費的服務

**五項評估標準：**

| 評估項目 | 具體要求 | 不通過的後果 |
| :--- | :--- | :--- |
| **1. 真實性驗證** | 確認套件在 npm/PyPI 等官方註冊表中真實存在，檢查發布者、下載量、最近更新時間 | 可能引入惡意套件（供應鏈攻擊） |
| **2. 安全性評估** | 檢查是否有已知漏洞（npm audit）、是否要求過多權限、是否有可疑的 postinstall 腳本 | 可能引入安全漏洞 |
| **3. 相容性確認** | 確認與現有技術棧（Node.js 版本、Cloudflare Workers 環境、TypeScript 版本）相容 | 可能導致建置失敗或執行時錯誤 |
| **4. 成本評估** | 確認免費額度是否足夠、付費方案的價格、是否有用量限制 | 可能產生意外費用 |
| **5. 替代方案比較** | 列出至少一個替代方案（包括「自己寫」），比較優缺點 | 可能錯過更好的選擇 |

### 2.2 評估摘要格式

完成評估後，向用戶提交以下摘要：

```markdown
### 引入評估：[工具/套件名稱]

- **用途**：解決什麼問題
- **真實性**：npm 週下載量 XX 萬、最近更新 YYYY-MM-DD、維護者 XXX
- **安全性**：npm audit 無已知漏洞 / 有 X 個低風險漏洞
- **相容性**：與 Cloudflare Workers 環境相容 / 需要 Node.js polyfill
- **成本**：免費 / 每月 $XX（免費額度 XX 次）
- **替代方案**：方案 B 是 XXX，但缺點是 YYY
- **建議**：引入 / 不引入，原因是 ZZZ
```

**必須等用戶明確同意後才能引入。**

</rule>

<rule id="eval-simplified">

### 2.3 簡化評估（適用於小型工具套件）

以下情況可走簡化流程（只需確認真實性 + 口頭告知用戶）：

- devDependency 的開發工具（如 prettier plugin）
- 專案 `package.json` 中已存在的套件的子模組
- Cloudflare 官方推薦的套件

簡化流程：確認套件在 npm 上真實存在 → 告知用戶「我要引入 XXX 來做 YYY」→ 引入。

</rule>

---

## 3. 禁止事項

<rule id="eval-forbidden">

- **禁止**未經評估就在 `package.json` 中加入新依賴。
- **禁止**引入超過 6 個月未更新的套件（除非是穩定的工具類套件，如 lodash）。
- **禁止**引入需要 API Key 的服務而不告知用戶。
- **禁止**同時引入功能重疊的多個套件。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`01-核心原則/ai-work-spec.md`](ai-work-spec.md) | 幻覺防護規則中的「依賴真實性驗證」（本文的前置規則） |
| [`01-核心原則/dependency-and-tool-rules.md`](dependency-and-tool-rules.md) | 依賴管理策略（引入後的持續管理） |
| [`01-核心原則/cost-performance-optimization-rules.md`](cost-performance-optimization-rules.md) | 成本優化規則（評估成本的參考標準） |
