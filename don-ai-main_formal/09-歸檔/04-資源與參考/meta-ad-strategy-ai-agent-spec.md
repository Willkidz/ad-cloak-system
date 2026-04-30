---
title: "Meta Ad Strategy Ai Agent Spec"
category: "reference"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "（已歸檔）Meta Ad Strategy Ai Agent Spec"
type: "spec"
tags: [ai-agent, facebook]
status: "archived"
---

## 1. Meta 廣告素材測試框架

### 1.1 A/B 測試的科學方法

<rule id="meta-ab-test">
AI Agent 在設計測試時，必須嚴格遵守以下原則：

- **變數隔離（Variable Isolation）**：每次測試只能改變一個變數。如果同時改變多個元素，將無法判斷是哪個變數導致了成效的變化 [1]。
- **控制組（Control Elements）**：每個測試都需要一個控制組作為比較的基準。可以是目前表現最好的廣告（Champion Ad）、標準的受眾設定或典型的版位策略 [1]。
- **統計顯著性（Statistical Significance）**：AI Agent 應在達到一定的數據量（如每個廣告組合每週 50 次轉換以脫離學習階段）後，才進行成效判定 [2]。
</rule>

### 1.2 Meta 廣告審核機制與風險管理

<rule id="meta-review-risk">

| 風險類型 | 容易被拒的元素 | 安全的元素 |
| :--- | :--- | :--- |
| 內容 | 過度承諾、誤導性聲明 | 清晰明確的產品展示 |
| 素材 | 成人內容、侵犯版權 | 真實的用戶評價（UGC） |
| 定位 | 針對個人特徵的暗示 | 客觀的數據支持 |

- **素材被拒（Ad Rejected）**：AI Agent 應能自動分析被拒原因，修改該素材（替換敏感詞彙或圖片），然後重新提交審核。
- **帳號停權（Account Banned）**：需要人工介入申訴，AI Agent 應立即停止該帳號的所有自動操作，並發送警報給管理員。
</rule>

---

## 2. 廣告投放策略 AI Agent 指令設計

### 2.1 結構化 Prompt 框架

<rule id="meta-prompt-framework">
對於廣告策略 AI Agent，建議採用以下結構：

1. **角色設定（Role）**：定義 AI 為資深 Meta 廣告策略師
2. **任務目標（Task）**：明確指出需要完成的任務
3. **背景資訊（Context）**：提供產品資訊、目標受眾、歷史數據
4. **輸出格式（Output Format）**：要求以表格或特定結構輸出
5. **限制條件（Constraints）**：設定字數限制、關鍵字、Meta 廣告政策
</rule>

### 2.2 系統化廣告測試指令範例

<example>
**素材變數測試生成 Prompt**：

「你是一位資深的 Meta 廣告策略師。我們目前有一個表現最好的廣告（Control Ad），其核心元素為：[圖片描述]、[標題]、[主要文案]。

你的任務是設計一個 A/B 測試計畫，以優化點擊率（CTR）。請嚴格遵守『變數隔離』原則。

請生成 3 個測試變體（Variants），每次只改變『標題』這個變數。新的標題必須分別基於以下三種心理學觸發點：
1. 恐懼錯過（FOMO）
2. 社會認同（Social Proof）
3. 利益導向（Benefit-driven）

請以表格形式輸出，包含欄位：變體名稱、改變的變數、新標題內容、預期假設（Hypothesis）。」
</example>

### 2.3 從競品素材提取測試假設

<example>
**競品分析與假設生成 Prompt**：

「請分析以下 3 個競品的高成效廣告素材描述：[插入競品素材描述]。

你的任務是：
1. 提取這些素材中共同的成功元素
2. 基於這些元素，為我們的產品 [產品名稱] 生成 2 個可測試的廣告假設
3. 每個假設必須包含：測試目標、測試變數、預期結果，以及具體的文案/視覺建議。」
</example>

---

## 3. 素材測試的完整工作流程

### 3.1 標準工作流程

<step id="meta-workflow">
1. **發想（Ideation）**：AI 根據歷史數據和競品分析生成測試假設
2. **製作（Creation）**：AI 生成文案，並提供視覺設計的具體 Prompt
3. **上架（Launch）**：透過 API 自動建立廣告活動，設定命名規則（如 `[Test Type]_[Variable]_[Version]_[Date]`）[1]
4. **監控（Monitoring）**：AI 持續追蹤 CTR、CPA、ROAS，達到統計顯著性時發出通知
5. **分析（Analysis）**：AI 比較測試組與控制組的數據，判定勝負
6. **迭代（Iteration）**：將獲勝的變體設為新的控制組，生成下一輪測試假設
</step>

### 3.2 驗收標準

| 測試目標 | 關鍵績效指標 (KPI) | 成功標準範例 |
| :--- | :--- | :--- |
| 提升點擊率 | CTR | 測試組 CTR 高於控制組 15% 以上，且達到統計顯著性 [3] |
| 降低獲客成本 | CPA | 測試組 CPA 低於目標 CPA 10% 以上 [2] |
| 提高轉換率 | CVR | 測試組 CVR 高於控制組，且達到統計顯著性 |
| 提升投資報酬率 | ROAS | 測試組 ROAS 高於控制組，且穩定維持 3 天以上 |

### 3.3 素材版本歷史（素材族譜）

<rule id="meta-creative-ancestry">
為了避免重複測試相同的失敗概念，並追蹤創意的演進，必須建立「素材族譜（Creative Ancestry）」：

- **命名規範**：嚴格執行標準化命名，例如 `Image_Lifestyle_Blue_V2`
- **元數據標籤**：為每個素材標記屬性（顏色、人物、情感訴求、文案長度）
- **AI 追蹤系統**：維護資料庫，記錄每個素材的「父代」、「變數」以及「成效」
</rule>

---

## 4. Meta 廣告投放方式測試

### 4.1 投放方式測試標準方法

**受眾測試（Audience Testing）**：保持素材一致，測試不同受眾群體。建議使用 ABO 確保每個受眾組合獲得相同預算 [1]。

**版位測試（Placement Testing）**：驗證獲勝素材和受眾後，測試自動版位與特定版位的差異。

**出價策略測試（Bidding Strategy Testing）**：測試最高數量與成本上限或出價上限，通常在擴展階段進行。

### 4.2 最省預算的測試結構

<rule id="meta-budget">
- **80/20 預算分配**：80% 給已驗證的獲勝廣告（Scaling），20% 用於測試新概念（Testing）[2]
- **預算設定**：測試預算應設定為目標 CPA 的 1-2 倍（每日）[2]
- **及時止損**：當測試廣告花費達到目標 CPA 的 1.5 倍且沒有轉換時，自動關閉該廣告
</rule>

---

## 參考文獻

[1] AdStellar. (2026). Facebook Ad Testing Framework: Complete Guide 2026. https://www.adstellar.ai/blog/facebook-ad-testing-framework

[2] Aden's Lab. (2026). The Creative Testing Budget Split That Makes Meta Learn Faster. https://www.adenslab.com/blog/creative-testing-budget-split-meta-learn-faster

[3] Unbounce. (2024). 10 A/B testing metrics to analyze results and measure success. https://unbounce.com/a-b-testing/metrics-kpis/

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| `01-核心原則/Mouth AI 架構師指令.md` | 競品追蹤的架構師指令 |
| `01-核心原則/Mouth AI 核心執行指令.md` | 工具決策表中的搜尋競品廣告規則 |
