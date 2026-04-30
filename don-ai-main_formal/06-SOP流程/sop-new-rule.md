---
title: "新規則建立與發佈 SOP"
category: "sop"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "詳細說明如何從零建立一條新規則的完整 SOP 流程，包含人工新增與 AI 自動提煉的不同路徑、檔案命名、YAML 規範、索引更新及金絲雀試用期流轉。"
type: "sop"
tags: [sop, rules, learning, canary, documentation]
status: "active"
created: "2026-03-29"
updated: "2026-03-29"
---

> **TL;DR**: 本 SOP 定義了在 don-ai 專案中建立新規則的標準流程。規則來源分為「人工新增」（直接進入 `01-核心原則/`）與「AI 自動提煉」（先進入 `.ai/pending-rules.md` 經 7 天金絲雀試用後轉入 `.ai/error-log.md`）。所有新規則文件必須遵循 kebab-case 命名、包含標準 YAML frontmatter，並同步更新 `_index.md` 與 `common-cmd.md` 的動態載入映射表。

# 新規則建立與發佈 SOP

本文件詳細說明「如何從零建立一條新規則」的完整標準作業流程（SOP），確保所有新規則的建立、驗證與發佈都符合 don-ai 的系統規範。

---

## 1. 規則來源與存放目錄

建立新規則的路徑分為兩種，根據來源不同，存放的目錄與流轉過程也不同：

<rule id="rule-paths">

### 路徑 A：人工新增 (Human-Authored)
- **適用場景**：由人類開發者主動制定的系統架構、業務邏輯或全局規範。
- **存放目錄**：直接建立為 `01-核心原則/` 下的獨立 Markdown 文件（或合併至現有文件）。
- **生效時間**：立即生效。

### 路徑 B：AI 自動提煉 (AI-Extracted)
- **適用場景**：AI 在 Debug 或執行任務後，從錯誤經驗中提煉出的防護型規則。
- **存放目錄**：必須先以草稿形式存入 `.ai/pending-rules.md`。
- **生效時間**：需經過 7 天「金絲雀試用期」驗證，確認無負面影響後，轉移至 `.ai/error-log.md` 的「已驗證規則」區塊。

</rule>

---

## 2. 檔案命名與格式規範

若新規則需要建立獨立文件（如路徑 A），必須嚴格遵守以下規範：

### 2.1 檔案命名規範

- **全小寫英文**：使用 kebab-case（連字號 `-` 分隔），禁止使用空格、底線或中文字元。
- **語義前置**：最具區分度的主題詞放在最前面。
- **標準後綴**：必須以 `-rules.md` 或 `-spec.md` 結尾。
- **長度限制**：控制在 3~5 個詞段，總長度不超過 40 字元。

<example type="naming">
- 正確：`api-security-rules.md`
- 錯誤：`API安全規範.md`、`api_security_rules.md`、`new-api-security-guidelines-for-backend.md`
</example>

### 2.2 YAML Frontmatter 必填欄位

文件頂部必須包含完整的 YAML frontmatter：

```yaml
---
title: "規則的中文完整標題"
category: "principle"
priority: "critical" # 或 high, medium, low
applicable_tools: "all" # 或 manus, cursor, claude
last_updated: "YYYY-MM-DD"
activation_glob: null # 可選，如 "*.tsx"
summary: "一句話摘要，說明這個規則的用途和核心內容。"
type: "rule" # 或 spec
tags: [tag1, tag2, tag3] # 3~8 個全小寫英文標籤
status: "active"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---
```

---

## 3. 索引與映射表更新

新規則文件建立後，必須同步更新以下兩個核心索引，否則 AI 將無法在適當時機載入該規則。

<step id="update-index">

### 步驟 1：更新 `01-核心原則/_index.md`
在 `## 文件清單` 的表格中新增一行，填入文件連結、標題、優先級與摘要。並在 `## 變更記錄` 中記錄本次新增，最後更新 `文件數量` 與 `最後更新` 日期。

### 步驟 2：更新 `00-系統索引/common-cmd.md`
在 `<conditional_loading>` 區塊的「條件式動態載入映射表」中，評估新規則的適用場景。
- 若屬於現有操作類型，將新文件路徑加入對應的「應載入的文件」欄位。
- 若屬於全新的操作類型，則新增一行映射關係。

</step>

---

## 4. AI 自動提煉規則的狀態流轉

對於「路徑 B：AI 自動提煉」的規則，必須嚴格執行以下狀態流轉與金絲雀試用期：

### 4.1 規則草稿提煉 (Pending)
AI 在 Offboarding 階段將錯誤經驗提煉為規則草稿，寫入 `.ai/pending-rules.md`。草稿必須包含：觸發條件、錯誤現象、正確做法、來源與信心等級。
- 狀態標記：`[Pending]`

### 4.2 金絲雀試用期 (Canary Trial)
- **觸發條件**：信心等級為「高/中」可直接進入試用；「低」則需等待人工批准。
- **執行方式**：將狀態改為 `[Trial: YYYY-MM-DD]`。在接下來的 7 天內，AI 僅在**低風險任務**中參考此規則。
- **目的**：限制潛在錯誤規則的爆炸半徑，觀察是否會引發回歸錯誤。

### 4.3 轉正或淘汰 (Verified / Rejected)
- **轉正 (Verified)**：7 天後若無負面影響，將規則從 `.ai/pending-rules.md` 移除，並正式寫入 `.ai/error-log.md` 頂部的「已驗證規則 (Verified Rules)」區塊。
- **淘汰 (Rejected)**：若試用期間引發新問題，立即停止使用，將狀態改為 `[Rejected: 具體原因]`，並保留在 `.ai/pending-rules.md` 中作為負面教材，防止未來重複提煉。

---

## 5. 完整執行 Checklist

在提交新規則前，請確認以下事項：

- [ ] 確認規則來源（人工新增 vs AI 提煉），並選擇正確的存放路徑。
- [ ] （若為獨立文件）檔名符合 kebab-case 與標準後綴。
- [ ] （若為獨立文件）包含完整的 YAML frontmatter 與 TL;DR 區塊。
- [ ] （若為獨立文件）已更新 `01-核心原則/_index.md`。
- [ ] （若為獨立文件）已更新 `00-系統索引/common-cmd.md` 的動態載入映射表。
- [ ] （若為 AI 提煉）已按標準格式寫入 `.ai/pending-rules.md` 並標記狀態。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/doc-standards-spec.md` | 檔案命名與 YAML frontmatter 的詳細規範 |
| `01-核心原則/quality-and-testing-rules.md` | 防護型自動學習迴圈與金絲雀試用期的詳細定義 |
| `.ai/pending-rules.md` | AI 提煉規則的暫存與試用區 |
| `.ai/error-log.md` | 試用通過後的已驗證規則存放區 |
| `00-系統索引/common-cmd.md` | 條件式動態載入映射表所在位置 |
