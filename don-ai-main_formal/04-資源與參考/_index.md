---
title: "資源與參考索引"
category: index
priority: high
applicable_tools: all
last_updated: 2026-03-31
summary: "外部資源、工具報告與參考資料索引。部分工具/資源類文件已遷移至 don-tools 倉庫。"
id: "20260328-resources-index"
type: index
tags: [index, knowledge-base, reference]
status: active
created: 2026-03-28
updated: 2026-03-31
---

> **TL;DR**: 本目錄為 `04-資源與參考/` 的核心索引。**2026-03-29 起，工具選型與通用資源類文件已遷移至 [don-tools](https://github.com/laoqin1689/don-tools) 倉庫**，本目錄保留專案相關的技術參考與研究報告。**2026-03-31 起，抖影知識/ 子目錄已遷移至 [03-專案/斗影知識/](../03-專案/斗影知識/)，sms_platforms_all.txt 已遷移至 [don-tools/08-數據與知識庫/](https://github.com/laoqin1689/don-tools/blob/main/08-數據與知識庫/sms_platforms_all.txt)**，6 個空殼指引文件已清除。AI 代理請優先閱讀 [資源摘要總覽.md](resources-summary.md) 以快速獲取全局精華。

# 資源與參考索引

本目錄彙整了專案開發、廣告投放、AI 技術研究及基礎設施相關的外部資源與內部研究報告。

---

## 一、核心總覽與快速入口

| 文件 | 說明 |
| :--- | :--- |
| **[資源摘要總覽.md](resources-summary.md)** | **核心入口**：每篇文件的精華摘要卡片，AI 任務前置必讀。 |
| **[待寫入記憶清單.md](memory-to-write.md)** | 臨時記錄區，存放尚未歸檔至正式文件的零散記憶。 |

---

## 二、已遷移至 don-tools 的文件

> 以下文件已遷移至 [don-tools](https://github.com/laoqin1689/don-tools)，原位置的空殼指引已於 2026-03-31 清除。**AI 需要這些資源時，請直接前往 don-tools 查閱。**

| 原文件 | 遷移目標 |
| :--- | :--- |
| ~~AI 工具與市場趨勢~~ | [don-tools/01-AI工具/ai-tools-market-trends.md](https://github.com/laoqin1689/don-tools/blob/main/01-AI工具/ai-tools-market-trends.md) |
| ~~AI Agent 框架評估~~ | [don-tools/01-AI工具/ai-agent-framework-evaluation.md](https://github.com/laoqin1689/don-tools/blob/main/01-AI工具/ai-agent-framework-evaluation.md) |
| ~~FB 廣告與 Agent 研究~~ | [don-tools/01-AI工具/fb-ad-and-agent-tools.md](https://github.com/laoqin1689/don-tools/blob/main/01-AI工具/fb-ad-and-agent-tools.md) |
| ~~GitHub 工具與行銷整合~~ | [don-tools/04-源碼資源/github-opensource-marketing-tools.md](https://github.com/laoqin1689/don-tools/blob/main/04-源碼資源/github-opensource-marketing-tools.md) |
| ~~前端開發與 UI 框架~~ | [don-tools/05-開發工具/frontend-ui-framework-guide.md](https://github.com/laoqin1689/don-tools/blob/main/05-開發工具/frontend-ui-framework-guide.md) |
| ~~博弈娛樂城工具地圖~~ | [don-tools/05-開發工具/manus-ai-dev-toolmap.md](https://github.com/laoqin1689/don-tools/blob/main/05-開發工具/manus-ai-dev-toolmap.md) |
| ~~SMS 號碼平台清單~~ | [don-tools/08-數據與知識庫/sms_platforms_all.txt](https://github.com/laoqin1689/don-tools/blob/main/08-數據與知識庫/sms_platforms_all.txt) |

---

## 三、本目錄保留的主題整合文件

以下文件與專案實作高度相關，保留於 don-ai。

| 主題分類 | 核心文件 | 涵蓋內容 |
| :--- | :--- | :--- |
| **記憶系統研究** | [AI 記憶系統架構](ai-memory-sys-arch.md) | 業界方案對比 (Mem0/Letta)、反思機制、配置模板。 |
| **Agent 開發** | [AI Agent 開發實踐](ai-agent-dev-practices.md) | 防回歸策略、指令設計、品質驗證 (CoVe)。 |
| **廣告與 Meta** | [Meta 廣告整合分析](fb-meta-ad-integration-analysis.md) | 投放策略、CAPI 整合、VeryFB 資訊搜集。 |
| **流量與安全** | [斗篷系統與流量過濾](cloak-traffic-filter-analysis.md) | Cloaking 原理、防禦策略、開源工具搜集。 |
| **落地頁技術** | [落地頁追蹤與 AI 生成](landingpage-tracking-analysis.md) | JS 追蹤部署、ad_code 規範、AI 自動化生成。 |

---

## 四、獨立參考文件

| 文件 | 說明 |
| :--- | :--- |
| [API Schema 同步規範](api-schema-sync-spec.md) | Zod + TypeScript 共用型別與防錯策略。 |
| [跨專案規則自動 PR 工作流設計](cross-project-pr-workflow-design.md) | n8n 自動化工作流架構：接收外部 AI 規則提交、自動建立分支、修改 pending-rules.md 並發起 Pull Request。 |
| [Cloudflare 技術規格](cloudflare-reference.md) | D1, Workers, KV, Pages 的限制與最佳實踐。 |
| [AI 商業模式分析](ai-agent-business-model-analysis.md) | 定價策略、Token 成本估算與學習曲線效應。 |
| [網站分析報告](website-analysis.md) | game9898.top/php2/ 模板演示平台深度剖析。 |
| [專案交付報告](project-delivery-analysis.md) | Manus Memory API 專案交付成果總結。 |

---

## 五、統計與維護資訊

<data_point>

- **文件總數**：13 (1 索引 + 1 總覽 + 5 整合 + 5 獨立 + 1 待寫入)（2026-03-31 清除 6 個空殼指引文件、1 個重複子目錄 douyin-knowledge-system.md、1 個業務數據文件 sms_platforms_all.txt）
- **已遷移至 don-tools**：7 篇（工具選型、通用資源類及業務數據）
- **已遷移至 03-專案/**：抖影知識/ 子目錄（已於 2026-03-31 遷移至 03-專案/斗影知識/）
- **原始文件歸檔**：43 篇已移至 `09-歸檔/04-資源與參考/`
- **最後更新日期**：2026-03-31
- **維護規範**：工具/資源類新增請放 don-tools；專案相關研究放本目錄；抖影知識相關文件請放 03-專案/斗影知識/；業務數據（如 SMS 平台清單）請放 don-tools/08-數據與知識庫/。

</data_point>

---

## 相關目錄

| 目錄 | 說明 |
| :--- | :--- |
| [`00-系統索引/`](../00-系統索引/) | 全局指令與規範 |
| [`01-核心原則/`](../01-核心原則/) | 元數據與命名標準 |
| [`09-歸檔/`](../09-歸檔/) | 歷史原始文件存放處 |
| **[don-tools](https://github.com/laoqin1689/don-tools)** | **工具選型與通用資源（已遷移文件的新家）** |
