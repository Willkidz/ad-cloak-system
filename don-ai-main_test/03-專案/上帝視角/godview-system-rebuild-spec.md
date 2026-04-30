---
title: "「上帝視角」系統改造計畫書 (v5 架構)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "闡述「上帝視角」系統升級至 v5 架構的改造計畫，核心是將 code 的定義與生成權交還給用戶，並以 Google Sheets 作為新的營運儀表板。"
id: "20260325-024356"
type: "spec"
tags: [advertising, attribution, godview, google-sheets, n8n]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本計畫書定義了系統升級至 v5 架構的藍圖。核心目標是將 `code` 的定義權交還給用戶（例如使用 `AS01` 格式），使 n8n 退回純粹的「後台」角色，並讓 Google Sheets 成為「前台」營運儀表板。改造涉及：(1) 重寫 n8n `Sheets Report` 流程中的 `Calculate Stats` 節點，移除補零邏輯與自動填寫欄位；(2) 簡化 `Token Attribution` 流程，停用自動回覆；(3) 調整 Sheets `成效` 分頁結構，新增「偵測率」計算區。Cloudflare Worker 無需修改即可支援新格式。

# 「上帝視角」系統改造計畫書 (v5 架構)

**文件日期：** 2026年3月15日
**文件作者：** Manus AI

---

## 總體目標

根據我們達成的共識，本次改造旨在將系統升級至 v5 架構。核心目標是：**將 `code` 的定義與生成權完全交還給您，使 n8n 退回純粹的「後台」角色，並讓 Google Sheets 成為更直觀、更易於操作的「前台」營運儀表板。**

---

## 變動項目總覽

為達成上述目標，我們需要對以下三個核心組件進行修改：

| 組件 | 變動項目 | 影響範圍 |
| :--- | :--- | :--- |
| **n8n 工作流程** | `上帝視角_Sheets Report - Daily Stats` | **高** (核心計算邏輯需重寫) |
| | `godview - Token Attribution System` | **中** (移除自動回覆，簡化邏輯) |
| **Google Sheets** | `成效` 分頁 | **高** (欄位結構需大幅調整) |
| | `消耗` 分頁 | **低** (僅作為純數據源，不再提供人員等資訊) |
| **n8n DataTable** | `ad_config` | **中** (需清空並用新的 `AS01` 格式填充) |

Cloudflare Worker (`line-redirect`) 目前的設計非常有彈性，**無需任何修改**，它可以直接處理新的 `AS01` 格式的 `code`。

---

## n8n 工作流程改造方案

### `上帝視角_Sheets Report - Daily Stats` (報表工作流)

這是本次改造的核心，其中 `Calculate Stats` 節點的程式碼需要大幅修改。

| 變動項目 | 變動原因 |
| :--- | :--- |
| **移除 `code` 補零邏輯** | <rule id="n8n-rule-1">舊設計會將 `1` 補成 `01`。必須移除此邏輯，才能直接處理 `AS01` 這種文字格式的 `code`。</rule> |
| **移除自動填寫欄位** | <rule id="n8n-rule-2">移除從 `消耗` 分頁讀取並填寫「廣告帳戶ID」、「人員」的邏輯。這些欄位將完全由您在前台手動維護。</rule> |
| **簡化數據來源** | <rule id="n8n-rule-3">工作流程將不再需要 `project`、`material` 等描述性欄位，因為這些資訊已經包含在 `code` 本身或由您手動維護。</rule> |
| **新增「偵測率」計算區** | <rule id="n8n-rule-4">在寫入 Sheets 前，增加一個區塊，讀取您在 `成效` 分頁手動填寫的「真實添加數」，與 n8n 抓到的「歸因添加數」進行計算，然後將「偵測率」寫入報表上方的指定儲存格。</rule> |

### `godview - Token Attribution System` (歸因工作流)

這個流程的變動相對簡單，主要是為了符合「安靜的歸因記錄器」這一定位。

| 變動項目 | 變動原因 |
| :--- | :--- |
| **停用「Reply to LINE User」節點** | <rule id="n8n-rule-5">根據我們的共識，n8n 不再需要自動回覆訊息。停用此節點，讓客服人員可以無干擾地與客戶互動。</rule> |
| **簡化 `Save Token Match Event` 節點** | <rule id="n8n-rule-6">在儲存 `token_matched` 事件到 `godview_events` 時，`project` 欄位將直接儲存完整的 `AS01`，不再需要其他轉換。</rule> |

---

## Google Sheets 結構調整方案

`成效` 分頁將從一個半自動化的表格，轉變為一個以您手動輸入為主的儀表板。

### 建議的新 `成效` 分頁欄位結構

<example id="new-sheets-structure">

| 欄位名稱 | 數據來源 | 備註 |
| :--- | :--- | :--- |
| **`code`** | **手動輸入** | **(核心)** 您將在此處填寫 `AS01`, `AS02` 等。 |
| `鏈結` | 公式自動生成 | `=HYPERLINK("https://as.freshpathlab.com/?code="&A2, "複製")` |
| `狀態` | 手動輸入 | 進行中、暫停、已結束等。 |
| `素材說明` | 手動輸入 | 方便您自己備註這是哪個素材。 |
| `廣告帳戶ID` | 手動輸入 | 您可以自行決定是否需要此欄位。 |
| `累計消耗` | n8n 自動更新 | | 
| `累計添加` | n8n 自動更新 | | 
| `累計CPA` | n8n 自動更新 | | 
| `區間消耗` | n8n 自動更新 | | 
| `區間添加` | n8n 自動更新 | | 
| `區間CPA` | n8n 自動更新 | | 

</example>

**需要移除的舊欄位：** `人員`, `項目`, `類型` 等，因為它們的功能已被新的 `code` 結構或手動欄位取代。

**新增的「偵測率驗證區」：**
我會在報表的最上方（例如 `A1:F5` 範圍內）建立一個新的區域，讓您可以填寫各個人員的「真實添加數」，n8n 會自動填入「歸因添加數」並計算出「偵測率」。

---

## 下一步行動計畫

<step id="action-1">**1. 清空與準備**：我會先將 `ad_config` DataTable 清空，為新的 `code` 格式做準備。</step>
<step id="action-2">**2. 系統改造**：我將依照上述方案，修改 n8n 的兩個核心工作流程。</step>
<step id="action-3">**3. 交付與配置**：改造完成後，我會向您交付修改後的系統。屆時，需要請您：
  * 在 Google Sheets 中按照新的結構調整您的 `成效` 分頁。
  * 提供至少一組用於測試的 `code`（例如 `AS01`）及其對應的 **Meta Pixel ID** 和 **CAPI Access Token**，讓我填入新的 `ad_config` 中。</step>
<step id="action-4">**4. 端到端測試**：我們將一起進行一次完整的端到端測試，確保從鏈結點擊到報表生成的每一環節都正確無誤。</step>

---

## 結論

本計畫書旨在闡明「上帝視角」系統 v5 架構的改造藍圖，透過將控制權交還給您，並簡化後台系統，期望能打造一個更靈活、透明且易於操作的歸因與分析平台。若您同意此計畫，我將立即開始執行。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-system-design-analysis.md`](./godview-system-design-analysis.md) | 職責劃分與 code 用意的深度解析 |
| [`godview-new-columns-arch.md`](./godview-new-columns-arch.md) | 詳細的 Google Sheets 14 欄位架構規範 |
| [`godview-rebuild-log.md`](./godview-rebuild-log.md) | 重構執行過程中的具體 DataTable 與 Workflow ID 變更紀錄 |
| [`data-relation-principles.md`](../../01-核心原則/project-specific-specs.md) | 數據關聯原則 |
