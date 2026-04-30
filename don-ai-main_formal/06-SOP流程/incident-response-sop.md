---
title: "生產事故等級劃分與響應流程 SOP"
category: "sop"
priority: "critical"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "定義生產事故的三級等級劃分（P1/P2/P3）及對應的響應流程，包含通知對象、處理時限、溝通頻率與回滾決策標準。"
type: "sop"
tags: [collaboration, deployment, incident]
status: "active"
created: "2026-03-29"
updated: "2026-03-29"
activation_glob: null
---

> **TL;DR**: 生產事故分為 P1（服務中斷）、P2（核心功能受損）、P3（次要功能受損）。P1 事故必須在 15 分鐘內響應，每 30 分鐘更新進度，若 30 分鐘內無法修復則強制回滾。所有事故處理後必須進行事後檢討。本 SOP 是 `deploy-sop.md` 中「緊急回滾流程」的延伸。

# 生產事故等級劃分與響應流程 SOP

## 1. 為什麼需要這個規則

缺乏事故等級劃分和響應流程可能導致在生產事故發生時，無法快速判斷嚴重性，延誤處理時機，或處理方式不一致。這個規則確保在緊急情況下，AI 和人類開發者能有條不紊地協作，將損失降到最低。

---

## 2. 事故等級劃分

<rule id="incident-levels">

| 等級 | 名稱 | 定義 | 典型場景 | 響應時限 | 溝通頻率 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **P1** | 嚴重事故 | 核心服務完全中斷，所有用戶受影響 | shadow-cloak 掛了、D1 資料庫無法連線 | 15 分鐘 | 每 30 分鐘 |
| **P2** | 重要事故 | 核心功能部分受損，或特定區域用戶受影響 | 廣告歸因失效、後台 API 報 500 錯誤 | 30 分鐘 | 每 1 小時 |
| **P3** | 一般事故 | 次要功能受損，不影響核心業務流程 | 報表顯示延遲、UI 樣式跑版、文檔錯誤 | 4 小時 | 每 4 小時 |

</rule>

---

## 3. 響應流程

<rule id="incident-process">

### 3.1 發現與確認 (Detection)

- AI 監控到異常（如 `acceptance-checklist.md` 驗收失敗）或收到用戶報告。
- 立即評估事故等級（P1/P2/P3）。

### 3.2 立即通知 (Notification)

- **P1/P2**：立即使用 `message` 工具通知用戶，說明事故等級、受影響範圍及初步處理方案。
- **P3**：記錄到 `TODO.md` 並在下次進度回報時告知。

### 3.3 止血與修復 (Mitigation)

- **優先止血**：如果修復時間超過 30 分鐘（P1）或 1 小時（P2），**強制執行回滾**（參考 `deploy-sop.md` 第 6.2 節）。
- **保留現場**：在回滾或修復前，匯出錯誤日誌、截圖或保留異常數據。

### 3.4 驗證與恢復 (Recovery)

- 修復或回滾後，執行 `acceptance-checklist.md` 進行全面驗證。
- 確認恢復後，通知用戶事故已解決。

</rule>

---

## 4. 溝通規範

<rule id="incident-communication">

- **透明度**：誠實回報事故原因和進度，不要隱瞞。
- **簡潔性**：緊急溝通應簡潔明瞭，避免冗長解釋。
- **行動導向**：每次更新進度時，必須包含「下一步行動」。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/deploy-sop.md`](deploy-sop.md) | 包含緊急回滾的具體指令 |
| [`06-SOP流程/acceptance-checklist.md`](acceptance-checklist.md) | 事故發現與恢復驗證的標準 |
| [`06-SOP流程/post-mortem-sop.md`](post-mortem-sop.md) | 事故解決後的檢討流程 |
| [`01-核心原則/workflow-and-communication-rules.md`](../01-核心原則/workflow-and-communication-rules.md) | 溝通語氣指南 |
