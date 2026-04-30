---
title: "上帝視角 (GodView) 專案索引"
category: project
priority: high
applicable_tools: all
last_updated: 2026-04-03
summary: "「上帝視角」廣告歸因系統的文檔導航索引，涵蓋系統架構、數據追蹤、n8n 工作流、CAPI 回傳、LINE 歸因及 Google Sheets 儀表板等完整文檔體系。"
id: "20260328-godview-index"
type: index
tags: [attribution, capi, cloudflare-workers, godview, google-sheets, index]
status: active
created: 2026-03-25
updated: 2026-04-03
---

> **TL;DR**: 本索引導航至「上帝視角」系統的所有技術與業務文檔。該系統是專為博弈廣告設計的歸因解決方案，核心流程為：FB 廣告 → 火鳥落地頁 → `freshpathlab.com` CF Worker（記錄點擊）→ LINE 加好友 → n8n 以 45 秒時間窗口匹配歸因 → Meta CAPI 回傳 `CompleteRegistration` → Google Sheets 報表。文檔體系分為系統架構、數據分析、操作指南與技術日誌四大板塊。

# 上帝視角 (GodView) 專案索引

## 核心系統文檔

以下文檔定義了系統的整體架構、數據流向與操作規範，是理解整個歸因系統的必讀資料。

| 文件 | 說明 | 優先級 |
| :--- | :--- | :--- |
| [`godview-core-cmd.md`](godview-core-cmd.md) | **操作指令**：啟動程序、關鍵憑證、工具決策與記憶寫入規範 | ★★★ |
| [`godview-ad-tracking-sys-spec.md`](godview-ad-tracking-sys-spec.md) | **系統總綱**：v3 架構、四大組件職責與端到端歸因流程 | ★★★ |
| [`godview-ad-tracking-data-analysis.md`](godview-ad-tracking-data-analysis.md) | **數據邏輯**：採集→中繼→處理→展示的全鏈路數據流轉與偵測率計算 | ★★★ |
| [`godview-time-attr-spec.md`](godview-time-attr-spec.md) | **歸因設計**：時間歸因方案，D1 `clicks` 表結構與 45 秒匹配窗口 | ★★★ |
| [`godview-code-link-design-spec.md`](godview-code-link-design-spec.md) | **鏈結規範**：`ad_code` 格式與 TAG 命名規則 | ★★☆ |
| [`godview-gsheets-ad-tracking-spec.md`](godview-gsheets-ad-tracking-spec.md) | **儀表板指南**：Google Sheets 各分頁功能與 n8n 讀寫路徑 | ★★☆ |

---

## 技術分析與診斷

<rule id="diagnosis-logic">
當追蹤數據出現偏差時，應依照以下順序排查：

1. **歸因系統診斷**：[`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) — 歸因匹配失敗、時間窗口問題、`ad_config` 配置異常等常見問題排查。
2. **CAPI 回傳狀態**：[`godview-capi-current.md`](godview-capi-current.md) — Meta CAPI 回傳成功率、Token 有效性與像素狀態監控。
3. **中繼站邏輯**：[`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) — CF Worker 的點擊記錄、參數傳遞與重定向邏輯深度解析。
</rule>

---

## 歸因與追蹤分析

| 文件 | 說明 |
| :--- | :--- |
| [`godview-ad-attr-code-analysis.md`](godview-ad-attr-code-analysis.md) | `ad_code` 從 URL 參數到 D1 資料庫的完整傳遞鏈路 |
| [`godview-attr-data-analysis.md`](godview-attr-data-analysis.md) | 歸因數據的統計分析與匹配率指標 |
| [`godview-analysis-result.md`](godview-analysis-result.md) | 系統分析結論與改善建議 |
| [`godview-mapping-spec.md`](godview-mapping-spec.md) | `ad_code` 與 Meta 像素/CAPI Token 的映射規範 |

---

## n8n 工作流與 API

| 文件 | 說明 |
| :--- | :--- |
| [`godview-n8n-workflow-list.md`](godview-n8n-workflow-list.md) | 全部 n8n Workflow 清單（6 個 Active、5 個 Inactive、1 個 Deleted） |
| [`godview-api-tools-notes.md`](godview-api-tools-notes.md) | API 工具使用筆記與整合方式 |
| [`godview-n8n-api-key-analysis.md`](godview-n8n-api-key-analysis.md) | n8n API Key 權限與安全性分析 |

---

## 外部整合

<boundaries id="external-integration">

以下文檔涉及與外部服務的整合，修改時需特別注意不要破壞跨系統的介面契約。

| 文件 | 說明 |
| :--- | :--- |
| [`firebird-domain-page-notes.md`](firebird-domain-page-notes.md) | 火鳥落地頁域名管理、腳本嵌入與按鈕鏈結設定 |
| [`godview-line-attr-final.md`](godview-line-attr-final.md) | LINE LIFF SDK 歸因方案研究（未來方向） |
| [`n21-liff-redirect-fix-log.md`](n21-liff-redirect-fix-log.md) | **n21 火鳥歸因鏈路修復記錄（2026-04-02）**：BUG-008 雙重 @ 修復 + 中間頁 Universal Link 修復，含完整跳轉流程圖 |
| [`godview-bc-pixel-events.md`](godview-bc-pixel-events.md) | BC（商業中心）像素事件追蹤 |

</boundaries>

---

## 驗證報告（2026-04-03）

以下報告基於線上實際部署的 Worker 程式碼與 N8N 工作流，對系統進行深度驗證。

| 文件 | 說明 |
| :--- | :--- |
| [`godview-data-flow-analysis.md`](godview-data-flow-analysis.md) | **資料流向分析**：vid、event_id、user_id、fbclid 四個關鍵資料在各環節的產生、存儲與傳遞邏輯（基於線上程式碼） |
| [`godview-e2e-test-report.md`](godview-e2e-test-report.md) | **端到端功能測試**：實際走一遍完整流程，9/9 項鏈路完整性驗證全部通過 |

---

## 結論

「上帝視角」系統的穩定性直接影響廣告投放的決策品質。請務必確保所有改動均同步更新至對應的技術文檔中，並遵循 [`godview-core-cmd.md`](godview-core-cmd.md) 中的操作規範。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-core-cmd.md`](godview-core-cmd.md) | 上帝視角操作指令與關鍵憑證 |
| [`godview-current-status.md`](godview-current-status.md) | 系統即時狀態報告 |
| [`../../.ai/memory.md`](../../.ai/memory.md) | 專案核心記憶 |
