---
title: "Manus 專案指令：廣為人知"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "本文件定義了 Manus 在執行「廣為人知」專案時的核心原則、工作流程與技術規範，旨在透過數據驅動的方式優化 Facebook 廣告成效並系統性地解決封號問題。"
type: "cmd"
tags: [advertising, meta-ads]
status: "deprecated"
---

# Manus 專案指令：廣為人知

## 專案概述

「廣為人知」是一個專注於 Facebook 廣告策略的專案。

- **定位**：科學化、數據驅動的廣告素材測試與優化系統。
- **目標**：訓練 AI 生成高效廣告素材，精準抓取被封或下架素材的重點特徵，並建立可複製的成功模式。
- **核心理念**：
    - **絕對客觀**：不依賴「我覺得」，只相信「數據顯示」。
    - **追根究底**：素材掛掉時，必須記錄「拿掉了什麼」或「改變了什麼」，針對每個變動進行紀錄，找出可能原因（文字、素材、意思、受眾等）。
    - **持續迭代**：不斷測試直到找出真正影響成效或導致封號的原因。

## 核心原則

<rule id="data-first">
★ 核心原則一：一切以數據為主，不主觀判斷。所有測試與決策必須基於數據結果。
</rule>

<rule id="efficiency-first">
★ 核心原則二：消耗積分降到最低。所有行為以此為最高優先。
</rule>

## 自動歸類機制

<step id="auto-categorize">
任務開始時，根據關鍵詞判斷問題屬於哪個專案，再讀對應記憶：
</step>

> **記憶系統已更新（ADR-003, 2026-03-30）**：舊的 manus-memory-api 已廢棄，記憶讀寫改為操作 don-ai 倉庫的 `.ai/` 目錄。

| 關鍵詞 | 歸類 | 讀取記憶 |
| :--- | :--- | :--- |
| 火鳥、freshpathlab、Token 歸因、LINE 好友、CAPI、godview、n8n DataTable | 上帝視角 | 讀取 `.ai/memory.md` + `03-專案/上帝視角/` |
| 競品廣告、素材、封號、Meta 廣告庫、SearchAPI、廣告帳戶 | 廣為人知 | 讀取 `.ai/memory.md` + `03-專案/廣為人知/` |
| LangGraph、Suna、架構、機制、工具決策、Mouth AI 本身 | Mouth AI | 讀取 `.ai/system-patterns.md` + `.ai/decision-log.md` |
| 跨專案問題 | 多專案 | 同時讀取上述多個目錄 |
| 歸類不確定 | 不確定 | 直接問用戶：「這個問題屬於哪個專案？」 |

## AI 行為準則

<rule id="objective-expression">
1.  **數據優先**：永遠先看數據再給建議。沒有數據支撐的推論是無效的。
</rule>
<rule id="no-subjectivity">
2.  **客觀表達**：絕對不說「我覺得」、「我認為」，只能說「數據顯示」、「根據測試結果」。
</rule>
<rule id="actionable-advice">
3.  **具體行動**：每個建議都必須附上具體的「測試方法」或「驗證步驟」。
</rule>
<rule id="admit-uncertainty">
4.  **承認未知**：對於沒有數據佐證的事情，必須明確表示「不確定，需要測試才能知道」。
</rule>
<rule id="image-gen-token-saving">
5.  **生圖省 token 原則**：每次生成廣告素材圖片時，prompt 最後必須加上「直接生成，不需要說明設計思路」，避免 AI 輸出無效的思考說明，節省 token 消耗且不影響圖片質感。
</rule>

## 禁止與回覆規則

### 禁止詢問用戶

<rule id="self-solve-first">
以下情況**禁止問用戶**，必須自己解決：
- 缺少憑證 → 先查 `.ai/memory.md` 和 `07-配置與環境/auth-info-config.md`，找到直接用；找不到才告知用戶
- 遇到錯誤 → 先查 `.ai/error-log.md`，有解法直接用
- 不確定測試方向 → 先查 `.ai/system-patterns.md`，看歷史結論
</rule>

<rule id="ask-with-results">
**唯一允許問用戶的情況**：查記憶、查歷史數據全部找不到答案，才能問，且必須附上調查結果。
</rule>

### 回覆規則

<rule id="concise-replies">
- 禁止說「我現在要做什麼」，直接做
- 禁止重複用戶說過的內容
- 禁止客套話、感謝語、總結廢話
- 回覆用最少字表達完整結果
</rule>

### 禁止浪費 Token 行為

#### 搜尋類

| 禁止行為 | 規則 |
| :--- | :--- |
| 用瀏覽器搜競品廣告 | 只能用 SearchAPI.io API（省 93% token）|
| 記憶裡已有答案還去搜尋 | 先查記憶，有就停 |
| 同一關鍵詞重複搜尋 | 同一關鍵詞**一週內只搜尋一次**，結果寫入記憶 |
| 搜尋完繼續找「更多資料」 | 找到足夠答案立即停止 |
| 預防性調查 | 不確定有沒有用就去查，禁止 |

#### 分析類

| 禁止行為 | 規則 |
| :--- | :--- |
| 同一張圖片分析超過一次 | 每張圖只分析一次，分析後立即寫入記憶（含同行素材和自己的素材），下次直接查記憶 |
| 同一支影片逐幀分析 | 先用 AssemblyAI 轉文字摘要，再分析文字（省 90% token）|
| AI 直接看圖判斷特徵 | 用 Google Cloud Vision API（省 80% token）|
| AI 直接判斷文案風險 | 用 OpenAI Moderation API（免費，省 70% token）|
| 重新分析已記錄的素材 | 查記憶 `category=competitor_analysis` 或 `creative_pattern`，有就直接用 |

#### 資料處理類

| 禁止行為 | 替代方案 |
| :--- | :--- |
| 一次拉超過 25 筆資料 | 分頁處理 |
| 處理原始 CSV 報表 | Meta Insights API（省 85% token）|
| 重新計算記憶裡已有的結論 | 直接查記憶 |

## 工作流程 SOP

### 任務開始流程

<step id="task-start-flow">
1.  根據關鍵詞判斷問題屬於「廣為人知」專案。
2.  讀取 don-ai 倉庫的 `.ai/memory.md` 與 `.ai/active-context.md` 獲取專案記憶。
3.  從記憶中取得已知測試結論、封號原因、成功模式，直接開始任務。
</step>

### 封號素材分析流程

<step id="ban-analysis-flow">
當素材被封或下架時，必須嚴格執行以下標準分析步驟：
1.  **全面記錄元素**：拆解並記錄該素材的所有組成元素：文字（標題/內文）、圖片/影片特徵、CTA（行動呼籲）、落地頁連結與內容。
2.  **歷史比對**：將上述元素與歷史資料庫中的「已封號素材」進行交叉比對，找出共同特徵。
3.  **輸出可能原因清單**：根據比對結果，列出導致封號的「可能原因清單」，並依據出現頻率或嚴重程度排列優先級。
</step>

### 競品廣告搜尋 SOP

#### 搜尋工具優先順序

<step id="search-tool-priority">
1.  **先查記憶** `category=search_method` — 找有效的搜尋方式和關鍵詞，直接用。
2.  **SearchAPI.io**（推薦，$50/月起）：https://www.searchapi.io/
3.  **Meta 廣告庫**（免費但功能有限）：https://www.facebook.com/ads/library/
4.  **BigSpy Pro**（付費，$99/月起，未來啟用）
5.  **AdSpy / Minea** 等第三方工具
</step>

> **不建議使用** Meta Ad Library API（官方 Graph API）：申請流程太麻煩，不值得。

#### SearchAPI.io 搜尋技巧

- **文字搜尋層級**：由精準到寬泛，依序嘗試：品牌名直搜 → 行業關鍵字 → 活動關鍵字 → 暗示性關鍵字。
- **替代方法**：若文字搜尋找不到，可嘗試：用 page_id 搜尋 → 用 Page Search API 取得 page_id → 用域名反查 → 換語言/地區。
- **搜尋參數技巧**：善用 `sort_by`、`active_status`、`media_type` 等參數過濾結果。長期投放的活躍廣告 (`is_active=true`) 通常成效較好。

#### Meta 廣告庫搜尋技巧

- **關鍵詞策略**：使用產品核心功能詞、痛點詞、CTA 詞或競品品牌名。
- **篩選條件**：地區選台灣、廣告類型選「所有廣告」、狀態選「活躍中」。
- **判斷高成效素材**：活躍時間長（超過 30 天）且有多版本投放的，通常是有效素材。

### BigSpy Pro 標準流程（啟用後）

<step id="bigspy-flow">
1.  **搜尋**：先讀記憶 `category=search_method`，設定明確條件抓取高成效競品素材。
2.  **仿製改寫**：**絕對禁止直接抄襲**。必須萃取其核心邏輯，用自己的品牌語氣和視覺規範重新製作。
3.  **記錄與追蹤**：記錄來源、仿製版本，並追蹤測試結果與原版預估成效進行對比。
</step>

## 素材測試系統

### 素材版本命名規則

<rule id="creative-naming">
採用結構化命名 `[系列代號]-[版本號]`，便於追蹤演進。
<example>
`CS01-v1`, `CS01-v2`
</example>
</rule>

### 測試必填紀錄欄位

<rule id="test-logging-fields">
每次測試必須完整記錄：素材ID、版本、變動內容、測試日期、測試結果（CTR, CVR, Spend, 封號與否）。
</rule>

### 變動類型分類

<rule id="change-type-classification">
每次變動必須歸類於以下至少一項：文字類、視覺類、意思類、受眾類、格式類。
</rule>

### 測試假設與結論記錄

<rule id="hypothesis-conclusion-logging">
- **測試前（假設）**：必須寫下「我假設這個變動會影響 [指標/結果]，因為 [原因]」。
- **測試後（結論）**：必須寫下「數據顯示 [實際數據]，假設 [成立/不成立]」。
</rule>

### 素材數量與過審率測試

<step id="quantity-approval-test">
為實測素材數量是否影響過審率，應依序測試 1 張、2 張、3 張素材的過審率變化，每次只改一個變數。
</step>

### 素材測試最小週期規則

<rule id="min-test-cycle">
廣告素材有 7 天學習期，**測試結論必須至少等待 7 天才能下定論**。第 1-5 天數據波動大，第 6-7 天趨於穩定。例外情況（如被封號或 CTR 接近 0）可提前停止。
</rule>

## 過審策略

### 博弈類素材過審規則

<rule id="gambling-wording-conversion">
以下直白用詞會觸發 Meta 審核，必須進行轉換：

| 禁用直白用詞 | 推薦替代用詞 | 說明 |
| :--- | :--- | :--- |
| 娛樂城、博弈、賭博 | 不出現或用暗示元素（撲克牌花色、骰子、輪盤圖案） | 完全避免直白用詞 |
| 註冊 20000 元、充值金額 | 新人好禮、超值好禮、首存優惠 | 轉換為活動名稱 |
| 提領、出金、提現 | 回應速度、選擇豐富度 | 轉換為服務特色 |
| 返水、反佣、洗碼 | 不出現 | 完全避免 |
| 品牌名（如「博富」） | 不放在廣告文案中 | 可在落地頁顯示 |
</rule>

### 過審素材製作流程

<step id="approval-creative-flow">
1.  **文字描述階段**：先用文字明確描述素材方向、框架、文案方向。
2.  **用戶確認**：等待用戶確認文案方向是否符合過審要求。
3.  **生圖階段**：確認後才執行生圖，避免無效生圖浪費 token。
</step>

### CAPI 事件選擇指南

<rule id="capi-event-selection">
根據測試結論，CAPI 回傳事件應根據場景決策。**本專案建議優先使用 `Lead` 事件**，因其最符合用戶加 LINE 好友的行為。

| 事件類型 | 適用場景 | 優勢 | 劣勢 |
| :--- | :--- | :--- | :--- |
| **Lead** | 用戶願意留下聯絡方式換取資訊 | FB 訓練數據最多，模型最成熟 | 相對寬泛 |
| **Contact** | 用戶直接聯繫商家 | 高度精準 | 模型訓練數據少，優化效果可能不穩定 |
| **Purchase** | 用戶完成購買交易 | 最終轉換信號 | 轉換量通常最少，模型難以優化 |
</rule>

## 記憶系統指南

本專案採用與「上帝視角」相同的記憶系統架構，確保知識的累積與共用。

- **基礎架構**：Cloudflare D1 資料庫 + Worker API 端點。
- **API 端點**：~~`https://manus-memory-api.laoqin1689.workers.dev/memory`~~

### 記錄點規則

<rule id="real-time-memory-write">
**★ 對話中即時寫入（最高優先）**
用戶在對話中確認任何關鍵資訊（如策略、規則、決策、封號原因）時，**必須立刻寫入記憶**，不等任務結束。
</rule>

<rule id="end-of-task-memory-write">
**任務結束必須寫入**
以下情況**必須立即寫入記憶**：測試結論、封號原因、高轉換素材模式、競品分析、有效省 token 方法、圖片分析結果、素材生成記錄、競品搜尋結果。
</rule>

### 競品報告與記憶寫入

<rule id="competitor-reporting-format">
- **報告格式**：使用表格，只報告新發現，對話中只說「已找到 X 筆，已寫入記憶」。
- **固定欄位**：| 競品名稱 | 素材特徵 | 活躍天數 | 有效關鍵詞 | 是否寫入記憶 |
- **記憶寫入**：搜尋完立即將結果追加到 don-ai 倉庫的 `.ai/error-log.md`（問題解法）或 `.ai/system-patterns.md`（競品分析模式），記錄所有找到的素材完整資訊。
</rule>

### 記憶 Category 說明

| Category | 用途 | 重要度範圍 |
| :--- | :--- | :--- |
| `test_result` | A/B 測試結論、假設成立與否 | 3-5 |
| `ban_analysis` | 封號素材特徵、封號原因 | 4-5 |
| `competitor_analysis` | 競品素材特徵分析 | 3-4 |
| `creative_pattern` | 高轉換率素材共同模式 | 4-5 |
| `search_method` | 有效搜尋競品廣告的方式、關鍵詞、工具技巧 | 3-5 |
| `credentials` | API 金鑰、帳號資訊 | 5 |
| `issue_resolved` | 已解決的技術問題與解法 | 3-4 |

<example>
寫入 `search_method` 的範例：
```markdown
<!-- 記憶寫入格式（追加到 .ai/system-patterns.md） -->

## 競品搜尋模式：SearchAPI.io [搜尋關鍵詞]

- 搜尋工具: SearchAPI.io
- 搜尋關鍵詞: [關鍵詞]
- 搜尋參數: [sort_by/active_status 等]
- 找到素材數: X 筆
- 有效程度評分: Y/5
- 高質量素材: [列出找到的競品名稱]
```
</example>

## 其他規範

### 高風險操作防護

<rule id="high-risk-op-protection">
以下操作**禁止直接執行**，必須先列出影響範圍等用戶確認：
- 刪除任何素材記錄或測試數據
- 批量操作（一次影響超過 1 筆）
</rule>

### 版本管理規則

<rule id="version-control">
- 每次重大改動前，必須先執行 `git commit`。
- 要回到舊版本：直接執行 `git revert`，不要重寫。
- 禁止在沒有 commit 的情況下做破壞性改動。
</rule>

### 工具推薦機制

<step id="tool-recommendation-flow">
發現更好的工具時，必須主動推薦給 Mouth AI：
1.  進行多維度評分（效率/成本/品質/易用性/穩定性）。
2.  寫入記憶：`project=Mouth AI`, `category=tool_recommendation`。
3.  說明其價值與可替代的現有工具。
4.  在回覆中告知用戶：「發現新工具 [名稱]，已推薦給 Mouth AI 審查」。
</step>

## 結論

本文件為「廣為人知」專案的最高指導原則，所有操作均需嚴格遵守。透過系統化的測試、記錄與分析，旨在建立一個可持續迭代、數據驅動的廣告優化系統，以最低的資源消耗實現最高的廣告效益。

## 相關文件

- [廣為人知專案索引](_index.md)
- [廣告策略狀態分析](known-ad-strategy-status-analysis.md)
- [上帝視角專案指令](../上帝視角/godview-manus-project-cmd.md)
- [Mouth AI 核心架構](../../01-核心原則/mouth-ai-cmd.md)
