---
title: "Code 設計方案：結構化廣告代碼命名規範"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "提出結構化 code 命名方案 [項目代號]_[導向標籤]_[廣告序號]（如 X_CX_01 = 獨角仙專案給 C 人員的第 1 條廣告），取代無業務語義的純數字序號，搭配 Google Sheets 前台定義 + n8n ad_config 後台配置的 SOP。"
id: "20260328-godview-code-spec"
type: spec
tags: [advertising, attribution, documentation, godview, google-sheets, known]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 為解決舊版純數字 `code`（如 `01`、`02`）無法傳達業務資訊的問題，提出結構化命名方案 `[項目代號]_[導向標籤]_[廣告序號]`。例如 `X_CX_01` 表示「獨角仙專案（X）給 C 人員導向（CX）的第 1 條廣告」，`G_AX_05` 表示「廣為人知專案（G）給 A 人員的第 5 條」。操作流程：(1) 在 Google Sheets「成效」分頁手動填寫 code，Sheets 公式自動生成追蹤鏈結 `https://cx.freshpathlab.com/?code=X_CX_01`；(2) 在 n8n `ad_config` 表同步新增該 code 對應的 Pixel ID 和 CAPI Token；(3) 系統自動根據 code 執行 CAPI 回傳與報表匯總。此方案將業務邏輯定義權交由前台掌控，後台僅執行自動化。

# Code 設計方案：結構化廣告代碼命名規範

**文件日期：** 2026 年 3 月 15 日

---

## 背景問題

針對「我需要知道，這是哪個項目、導向哪裡、第幾條廣告？」這個核心問題，現有的 `code` 設計（例如單純使用 `01` 或 `02` 的數字序號）無法提供足夠的業務資訊，導致在 Google Sheets 等前台工具中難以直觀地分辨數據的真實商業意義。舊設計忽略了日常營運的直覺性與便利性需求。

---

## 全新 Code 結構提案

採用由三部分組成的結構化 `code`，取代目前單純的數字序號。

<rule id="code-structure">

核心格式定義：

```
[項目代號]_[導向標籤]_[廣告序號]
```

- **項目代號**：如 `X`（獨角仙AI算牌）、`G`（廣為人知）。
- **導向標籤**：如 `CX`（C 人員導向 X 項目的 LINE 帳號）。
- **廣告序號**：兩位數字，如 `01`、`02`。

</rule>

<example id="code-example">

以 `X_CX_01` 為例，各部分解讀如下：

| 結構 | 範例 | 代表意義 | 解答的問題 |
| :--- | :--- | :--- | :--- |
| **項目代號** | `X` | 代表「獨角仙AI算牌」專案 | 這是哪個項目？ |
| **導向標籤** | `CX` | 代表導向給「C 人員」在「X 項目」的 LINE 帳號 | 導向哪裡？ |
| **廣告序號** | `01` | 代表 `X_CX` 這個組合下的第 1 條廣告鏈結 | 這是第幾條廣告？ |

</example>

---

## 運作流程

<step id="create-link">

**1. 在 Google Sheets（前台）創建鏈結**

當要為「獨角仙項目」的「C 人員」創建新的廣告鏈結時，在「成效」分頁的 `code` 欄位手動填寫 `X_CX_01`。接著，利用 Sheets 公式自動生成對應的追蹤鏈結，例如 `https://cx.freshpathlab.com/?code=X_CX_01`，並將此鏈結直接用於廣告後台。

</step>

<step id="configure-backend">

**2. 在 n8n（後台）進行配置**

在 n8n 的 `ad_config` 資料表（DataTable ID: `ICxZmq8e0vPZHX5j`）中新增一筆記錄，其中 `code` 欄位填寫 `X_CX_01`，並在相應欄位填入此廣告對應的 **Pixel ID** 和 **CAPI Token**。

</step>

<step id="auto-attribution">

**3. 自動歸因與報表生成**

當用戶點擊鏈結，n8n 會接收到 `code = 'X_CX_01'` 的資訊，並利用此 `code` 執行以下操作：
- 在 `ad_config` 表中查找對應的 Pixel 和 Token，以完成 CAPI 事件回傳。
- 在「上帝視角_Sheets Report - Daily Stats」流程中，將所有相關的廣告花費與成效數據，準確地匯總至 Google Sheets 中 `code` 為 `X_CX_01` 的對應列。

</step>

---

## 新設計的優勢

| 優勢 | 說明 |
| :--- | :--- |
| **一目了然** | 任何人看到 `X_CX_01`，即可立即理解其業務背景，無需對照其他表格 |
| **職責清晰** | code 的創建與業務意義的賦予完全在前台（Google Sheets）掌控，n8n 後台僅根據 code 執行自動化任務 |
| **無限擴展** | 未來若有新的「Z 項目」或新的「P 人員」，只需遵循 `Z_PZ_01` 的格式創建新 code，系統無需任何修改即可自動適應 |

---

## 結論與下一步

此 `code` 設計方案將業務邏輯的定義權完全交還給營運端，使系統運作更貼近業務直覺，同時保持後台自動化的強大能力。

若確認採納 `[項目代號]_[導向標籤]_[廣告序號]` 的新 code 結構，後續步驟如下：

<step id="next-steps">

1. 正式確認將「廣告帳戶ID」欄位從 n8n 流程中移除，改為純手動管理欄位。
2. 著手修改 n8n 的相關設定，使其能夠處理新的 `code` 格式。
3. 重新請求歸因所需的 Pixel ID 與 CAPI Token，以便使用新的 `code` 結構完成系統配置與測試。

</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-attr-code-analysis.md`](godview-ad-attr-code-analysis.md) | ad_code 從 URL 到 D1 的完整傳遞鏈路分析 |
| [`godview-gsheets-ad-tracking-spec.md`](godview-gsheets-ad-tracking-spec.md) | Google Sheets 儀表板規格（工作表結構） |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統 v3 架構總綱（含鏈結格式定義） |
| [`godview-mapping-spec.md`](godview-mapping-spec.md) | ad_code 與 Meta 像素/CAPI Token 的映射規範 |
