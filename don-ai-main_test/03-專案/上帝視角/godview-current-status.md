---
title: "上帝視角系統當前運行狀態報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "彙整「上帝視角」系統的最新運行數據（日均 1.5 萬點擊，94% 歸因率）與健康指標，識別當前存在的技術債（ad_config 配置污染）與待修復項（Lead 事件缺失）。"
id: "20260328-godview-status"
type: report
tags: [advertising, cloudflare-d1, cloudflare-workers, godview, monitoring, n8n]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 系統主體架構穩健，日均處理點擊量約 1.5 萬次，歸因成功率穩定在 94.2%。當前最緊急問題為 **Meta CAPI Lead 事件缺失**，根源在於 `ad_config` 表中存在過時記錄（ID 3, 4），導致 Worker 抓取了錯誤的像素資訊且 CAPI Token 為空。已完成本地端 Worker 程式碼優化（fbc 自動生成、destination 補全），待確認線上部署狀態。

# 上帝視角系統當前運行狀態報告

## 核心運行指標 (24H)

<boundaries id="performance-metrics">

| 指標 | 數值 | 狀態 | 趨勢 |
| :--- | :--- | :--- | :--- |
| **總點擊量 (Clicks)** | 15,420 | <span style="color:green">正常</span> | ↑ 5% |
| **歸因成功率** | 94.2% | <span style="color:orange">待優化</span> | → 0% |
| **CAPI 回傳延遲** | 1.2s | <span style="color:green">優異</span> | ↓ 0.2s |
| **錯誤率 (Error Rate)** | 2.1% | <span style="color:green">正常</span> | ↓ 0.5% |

</boundaries>

---

## 當前主要問題：Lead 事件缺失

<rule id="status-issue-lead">

**現象描述**：Meta 廣告後台顯示 `Lead` 事件回傳量遠低於實際加好友人數。

**根源分析**：
1. **配置污染**：`ad_config` 表中存在過時記錄（ID 3, 4），導致 Worker 抓取了錯誤的像素資訊。
2. **Token 缺失**：部分配置的 CAPI Token 為空，造成發送鏈路中斷。
3. **數據傳遞失敗**：Worker 在建立 `token_mapping` 記錄時，未能將 `pixels` 陣列正確傳遞，導致 `aid` 欄位為空。

</rule>

---

## Worker 程式碼開發進度 (2026-03-27)

<step id="worker-dev-status">

**已完成功能 (本地端)**：
- **fbc 自動生成**：於程式碼第 177 行新增邏輯，當 URL query 中缺少 `fbc` 參數時，利用 `fbclid` 自動生成。
- **destination 參數補全**：於程式碼第 199 行從 `lineInfo` 讀取 `destination`，並於第 211 行將其寫入 D1 資料庫。
- **後備路由表更新**：已將 `config.js` 中 `FALLBACK_LINE_MAP` (第 52-82 行) 的所有 `destination` 欄位補充完整。

**待辦事項**：
- **[待確認]** 需確認上述本地端程式碼的修改是否已同步部署至 Cloudflare 線上環境。

</step>

---

## 緊急修復行動 (Action Plan)

<step id="status-fix-1">

**清理配置**：刪除 `ad_config` 中的無效記錄（ID 3, 4），僅保留正確的像素配置（ID 5, 6）。

</step>

<step id="status-fix-2">

**手動驗證**：使用 Postman 直接調用 Meta CAPI，確認像素 ID 與 Token 的有效性。

</step>

<step id="status-fix-3">

**鏈路重啟**：重新部署 CF Worker，強制刷新快取以加載最新配置。

</step>

---

## 結論

系統主體架構穩健，但「配置污染」嚴重影響了數據準確性。完成上述修復後，預計 `Lead` 事件回傳率將恢復至 95% 以上。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | 系統總綱 v3 |
| [`godview-capi-current.md`](godview-capi-current.md) | CAPI 現況分析 |
| [`godview-diagnosis.md`](godview-diagnosis.md) | CAPI Lead 事件缺失診斷報告 |
| [`godview-cf-worker-deploy-verify.md`](godview-cf-worker-deploy-verify.md) | Worker 部署驗證報告 |
| [`godview-status-next-analysis.md`](godview-status-next-analysis.md) | 歷史狀態與下一步行動分析 |
