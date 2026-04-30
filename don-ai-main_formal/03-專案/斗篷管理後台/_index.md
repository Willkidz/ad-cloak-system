---
title: "斗篷管理後台 (Cloak Admin) 專案索引"
category: project
priority: high
applicable_tools: all
last_updated: "2026-04-03"
summary: "「隱者斗篷」系統的管理核心索引，包含 70+ 份技術文件，涵蓋架構、部署、歸因邏輯與維運指南。"
version: "v1.0"
id: "20260329-cloak-admin-index"
type: index
tags: [cloak-admin, cloaking, godview, index, security]
status: active
created: "2026-03-25"
updated: "2026-04-03"
---
> **TL;DR**: 本目錄是「隱者斗篷」管理系統的完整知識庫索引。核心內容涵蓋：基於 Cloudflare Workers 的流量過濾引擎（shadow-cloak）、Hono 框架的後端 API、React 前端管理介面，以及與 n8n 整合的「上帝視角」歸因系統。本索引提供 70 份文件的分類導航，確保開發者能快速定位部署流程、Bug 修復記錄與核心技術規格。

# 斗篷管理後台 (Cloak Admin) 專案索引

## 核心功能模組

| 模組名稱 | 功能說明 | 關鍵文件 |
| :--- | :--- | :--- |
| **流量過濾 (Cloaking)** | ASN/IP/UA 三層過濾，識別 Meta 審核機器人。 | [cloak-risk-levels-spec.md](cloak-risk-levels-spec.md) |
| **歸因系統 (Attribution)** | 45 秒窗口時間歸因，整合 LINE Webhook 與 Meta CAPI。 | [cloak-admin-attr-analysis.md](cloak-admin-attr-analysis.md) |
| **部署架構 (Deploy)** | Pages + Workers + D1 Serverless 架構，支援 GitOps。 | [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) |
| **素材中心 (Material)** | 落地頁採集、靜態資源重寫與預覽功能。 | [cloak-admin-bugfix-material-sys-cmd.md](cloak-admin-bugfix-material-sys-cmd.md) |

---

## 文件清單（精選核心）

| 文件 | 標題 | 摘要 |
| :--- | :--- | :--- |
| [cloak-admin-api-keys-list.md](cloak-admin-api-keys-list.md) | API Keys 清單 | 彙整 n8n、Cloudflare、Telegram 等服務的金鑰與連線資訊。 |
| [cloak-admin-b-team-v1-10-dataflow-verify.md](cloak-admin-b-team-v1-10-dataflow-verify.md) | v1.10 數據流驗證 | 深入分析從廣告點擊到 LINE 好友加入的完整數據流與 Worker 邏輯。 |
| [cloak-admin-b-team-v1-10-1-d1-fix-cmd.md](cloak-admin-b-team-v1-10-1-d1-fix-cmd.md) | D1 Binding 修復指令 | 修復 shadow-cloak 因無法使用 D1 Binding 導致 IP 丟失的技術指令。 |
| [cloak-admin-deploy-arch.md](cloak-admin-deploy-arch.md) | 部署架構分析 | 釐清 Pages 專案混淆問題，詳述 manus-runtime 腳本移除方案。 |
| [cloak-admin-design-plan.md](cloak-admin-design-plan.md) | 系統設計規劃 | 涵蓋系統架構、功能模組、數據庫設計與 UI 線框圖。 |
| [cloak-admin-troubleshoot.md](cloak-admin-troubleshoot.md) | 故障診斷與修復紀錄 | 彙總所有已發生的故障診斷與修復紀錄，含 BC 像素與 D1 401 錯誤。 |
| [shadow-cloak-godview-liff-fusion-plan.md](shadow-cloak-godview-liff-fusion-plan.md) | **斗篷×上帝視角 LIFF 融合方案** | Shadow Cloak 過濾 + LIFF 直連歸因的完整融合方案，含流程圖與程式修改清單。 |

> **提示**：完整 70 份文件清單請參閱歷史版本或使用 `ls` 指令。本索引僅列出當前活躍維護的核心文件。

---

## 相關目錄

| 目錄 | 關係 |
| :--- | :--- |
| [03-專案/上帝視角/](../上帝視角/) | 歸因系統核心邏輯與 LIFF 整合方案 |
| [01-核心原則/](../../01-核心原則/) | 全局數據規範、安全護欄與元數據標準 |
| [05-原始碼/](../../05-原始碼/) | Cloudflare Workers 實際運行的 JavaScript 代碼 |

### 驗證與分析報告（2026-04-03）
- [資料流向分析報告](./godview-data-flow-analysis.md) - 從廣告點擊到 LINE 綁定的完整資料流向分析
- [端到端功能測試報告](./godview-e2e-test-report.md) - 完整鏈路功能驗證結果
- [像素庫與 CAPI Token 鏈路分析報告](./cloak-admin-pixel-capi-analysis.md) - 像素設定與 CAPI 發送的斷層分析
- [像素鏈路修復報告](./pixel-pipeline-fix-report.md) - 修復三個斷點：API CRUD、D1 Token 讀取、N8N 相容性確認
