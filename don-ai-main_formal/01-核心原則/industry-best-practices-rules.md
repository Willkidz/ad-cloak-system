---
title: "業界最佳實踐規則"
category: "principle"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "整合 Google、Microsoft、OpenAI 與 Cursor 等業界頂尖 AI 系統的最佳實踐，涵蓋自動化回滾、複合身份追蹤、動態模型調度與規則文件模組化。"
type: "rule"
tags: [deployment, guidelines]
status: "active"
activation_glob: null
version: "v1.0"
---

> **TL;DR**: 本文件整合了業界頂尖 AI 系統的四項最佳實踐：(1) 自動化回滾（Google 大紅鈕）：異常時自動回滾不需人工確認；(2) 複合身份追蹤（Microsoft/Google）：每個 AI 操作需有唯一身份標記；(3) 動態模型調度（OpenAI）：依任務複雜度自動切換模型以優化成本；(4) 規則文件模組化（Cursor）：將規則拆分為可按需載入的小模組。

# 業界最佳實踐規則

本文件整合了來自 Google、Microsoft、OpenAI 與 Cursor 等業界頂尖 AI 系統的最佳實踐，旨在提升 Don AI 系統的穩定性、可追溯性、成本效益與上下文管理效率。

---

## 1. 自動化回滾規則 (Automated Rollback)

<rule id="best-practice-rollback">
**來源**：Google 的「大紅鈕」概念

**核心原則**：當系統偵測到異常或部署失敗時，必須立即觸發自動化回滾機制，將系統恢復到上一個穩定版本，**不需等待人工確認**。

**實踐指南**：
- 在 CI/CD 流程中配置健康檢查（Health Checks）。
- 部署後若關鍵指標（如錯誤率、延遲）超過閾值，自動執行回滾腳本。
- 回滾完成後，再發送通知給開發人員進行事後分析。
</rule>

---

## 2. 複合身份追蹤 (Composite Identity Tracking)

<rule id="best-practice-identity">
**來源**：Microsoft / Google

**核心原則**：每個 AI 代理的操作與決策都必須帶有**唯一身份標記**，確保在多代理協作或長期運行的系統中，能夠精確追蹤「是哪個 AI 在什麼時間點做了什麼決策」。

**實踐指南**：
- 在日誌、Commit 訊息與資料庫變更記錄中，附加 AI 代理的 ID、版本與任務上下文。
- 避免使用通用的「AI 修改」描述，應具體標明如 `[Manus-Planner-v1.2]`。
</rule>

---

## 3. 動態模型調度 (Dynamic Model Routing)

<rule id="best-practice-routing">
**來源**：OpenAI

**核心原則**：根據任務的複雜度與重要性，自動選擇最適合的 LLM 模型，以在效能與成本之間取得最佳平衡。

**實踐指南**：
- **簡單任務**（如日誌分析、格式轉換、簡單查詢）：使用成本較低、速度較快的模型（如 `gpt-4.1-mini` 或 `gemini-2.5-flash`）。
- **複雜任務**（如架構設計、複雜除錯、核心邏輯編寫）：使用推理能力最強的模型（如 `gpt-4.1-nano` 或同等級的高階模型）。
- 系統應具備自動評估任務難度並切換模型的能力。
</rule>

---

## 4. 規則文件模組化 (Modular Rule Documents)

<rule id="best-practice-modular-rules">
**來源**：Cursor

**核心原則**：將龐大的全局規則文件拆解為**可按需載入的小型模組**，避免每次對話都載入無關的規則，從而節省 Token 並提高 AI 的指令遵循度。

**實踐指南**：
- 根據主題（如安全、效能、特定框架）建立獨立的規則文件。
- 使用條件式載入（Conditional Loading）或 Glob 模式（如 `*.tsx` 觸發 React 規則），僅在相關任務中讀取對應模組。
- 保持每個規則模組簡短、專注且具備明確的觸發條件。
</rule>
