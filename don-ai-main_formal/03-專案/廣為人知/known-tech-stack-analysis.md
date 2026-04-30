---
title: "博弈推廣專案技術棧分析：從前端開發到數據採集"
category: "project"
priority: "medium"
applicable_tools: ["React", "Node.js", "Python", "n8n"]
last_updated: "2026-03-28"
summary: "總結博弈推廣專案（如「博富」、「爆分王」）所涉及的技術棧，涵蓋前端互動、後端邏輯與自動化數據採集工具。"
id: "20260328-known-tech-stack"
type: "analysis"
tags: [automation, data-collection, line, python, react]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本報告梳理了博弈推廣專案的核心技術架構。前端採用 **React + Tailwind CSS** 實現響應式介面，並利用 **LINE Flex Message** 進行原生互動。後端與自動化層面，使用 **Python** 進行數據採集（結合 SearchAPI.io），並透過 **n8n** 串接工作流。報告強調了技術棧的靈活性與快速迭代能力，以應對多變的廣告政策與市場需求。

# 博弈推廣專案技術棧分析

## 1. 前端開發與互動層

<rule id="frontend-stack">
- **Web 應用**：採用 **React** 框架結合 **Vite** 進行快速開發。使用 **Tailwind CSS** 確保介面在不同行動裝置上的適配性。
- **LINE 機器人**：利用 **LINE Messaging API** 與 **Flex Message** 構建類原生 APP 的互動體驗（如「爆分王」的選桌流程）。
- **落地頁優化**：強調加載速度與轉化路徑的簡潔性，常使用靜態站點生成 (SSG) 技術。
</rule>

---

## 2. 數據採集與分析層

<example id="data-stack">
| 功能維度 | 推薦工具/技術 | 應用場景 |
| :--- | :--- | :--- |
| **廣告監控** | **SearchAPI.io** | 自動化採集 Meta Ad Library 競品數據。 |
| **網頁爬蟲** | **Python (Playwright/BeautifulSoup)** | 抓取競品官網優惠與遊戲數據。 |
| **數據處理** | **Pandas** | 清洗與分析採集到的結構化數據。 |
| **自動化工作流** | **n8n** | 串接 API 採集、數據過濾與通知推送（如 Slack/Telegram）。 |
</example>

---

## 3. 後端與基礎設施

<step id="backend-infrastructure">
1.  **API 開發**：使用 **Node.js (Express)** 或 **Python (FastAPI)** 構建輕量級後端服務。
2.  **數據庫**：採用 **PostgreSQL** 或 **MongoDB** 存儲用戶行為數據與競品歷史記錄。
3.  **部署與運維**：利用 **Docker** 容器化部署，並結合 **GitHub Actions** 實現 CI/CD 自動化流程。
</step>

---

## 4. 技術選型核心考量

<boundaries id="tech-considerations">
- **快速迭代**：博弈市場變化極快，技術棧必須支持「一週一版本」的開發節奏。
- **隱蔽性與抗封鎖**：前端代碼需進行混淆處理，後端採集需具備完善的代理與反偵測機制。
- **跨平台兼容**：核心邏輯應盡量解耦，以便快速遷移至 Telegram 或其他社交平台。
</boundaries>

---

## 5. 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`known-searchapi-analysis.md`](known-searchapi-analysis.md) | 數據採集工具分析 |
| [`known-meta-ad-library-api-notes.md`](known-meta-ad-library-api-notes.md) | API 技術細節筆記 |
