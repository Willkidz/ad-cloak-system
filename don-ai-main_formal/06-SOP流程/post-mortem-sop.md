---
title: "事後檢討 (Post-mortem) 規範 SOP"
category: "sop"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-29"
summary: "定義重大生產事故（P1/P2）解決後的檢討流程，包含事故報告撰寫、根本原因分析 (RCA) 及改進措施追蹤。"
type: "sop"
tags: [analysis, incident]
status: "active"
created: "2026-03-29"
updated: "2026-03-29"
activation_glob: null
---

> **TL;DR**: 針對 P1/P2 級事故，必須在事故解決後 24 小時內啟動事後檢討流程。核心內容包括：事故時間線、影響範圍、根本原因（RCA）、解決方案、預防措施和責任人。檢討報告應存入 `09-歸檔/08-任務追蹤/` 並更新 `.ai/error-log.md`。

# 事後檢討 (Post-mortem) 規範 SOP

## 1. 為什麼需要這個規則

缺乏事後檢討流程可能導致同類事故重複發生，無法從根本上解決問題，影響系統的長期穩定性。這個規則確保我們能從每次失敗中學習，將事故轉化為系統改進的動力。

---

## 2. 檢討流程

<rule id="pm-process">

### 2.1 啟動條件

- 發生過 P1 或 P2 級生產事故。
- 用戶明確要求進行檢討的 P3 級事故。

### 2.2 執行時限

- 事故解決後 **24 小時內** 啟動檢討。
- 事故解決後 **48 小時內** 完成檢討報告並提交用戶。

### 2.3 參與人員

- 負責處理該事故的 AI 代理。
- 相關模組的開發者（AI 或人類）。
- 用戶（作為審閱者）。

</rule>

---

## 3. 檢討報告模板

<rule id="pm-template">

檢討報告應包含以下內容：

```markdown
# 事後檢討報告：[事故名稱]

- **事故等級**：P1 / P2
- **事故時間**：YYYY-MM-DD HH:MM - HH:MM
- **影響範圍**：哪些服務、多少用戶、什麼功能受影響
- **解決狀態**：已修復 / 已回滾 / 臨時規避

## 1. 事故時間線 (Timeline)
- [HH:MM] 事故發生（原因：XXX）
- [HH:MM] 監控發現異常 / 用戶回報
- [HH:MM] AI 介入處理，判定等級為 PX
- [HH:MM] 執行止血操作（回滾/修復）
- [HH:MM] 驗證通過，服務恢復

## 2. 根本原因分析 (RCA)
- 使用「五個為什麼」(5 Whys) 方法找出根本原因。
- 為什麼發生？因為 A。為什麼 A 發生？因為 B...

## 3. 解決方案與預防措施 (Action Items)
| 類別 | 具體行動 | 責任人 | 截止日期 |
| :--- | :--- | :--- | :--- |
| **短期修復** | 立即修復代碼漏洞 | AI | 已完成 |
| **長期預防** | 增加監控指標、優化 SOP | AI/人類 | YYYY-MM-DD |
| **流程改進** | 更新 `acceptance-checklist.md` | AI | YYYY-MM-DD |

## 4. 經驗教訓 (Lessons Learned)
- 這次我們做得好的地方？
- 這次我們做得不好的地方？
- 未來如何避免同類問題？
```

</rule>

---

## 4. 知識沉澱

<rule id="pm-knowledge">

- **更新錯誤日誌**：將 RCA 結果和預防措施更新至 [`.ai/error-log.md`](../.ai/error-log.md)。
- **提煉規則**：如果事故源於規則缺失，應遵循 [`failure-learning-spec.md`](../01-核心原則/quality-and-testing-rules.md) 提煉新規則。
- **報告歸檔**：將檢討報告存入 `09-歸檔/08-任務追蹤/` 目錄。

</rule>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/incident-response-sop.md`](incident-response-sop.md) | 事故響應流程（檢討的前置步驟） |
| [`01-核心原則/quality-and-testing-rules.md`](../01-核心原則/quality-and-testing-rules.md) | 失敗學習迴圈（規則提煉的標準） |
| [`.ai/error-log.md`](../.ai/error-log.md) | 錯誤記錄與已驗證規則的存放位置 |
