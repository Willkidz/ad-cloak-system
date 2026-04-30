---
title: "斗影知識專案索引"
category: project
priority: high
applicable_tools: all
last_updated: "2026-03-31"
summary: "斗影知識（抖音內容研究與知識管理）系統的專案索引，包含系統架構說明、逐字稿方案研究、VPS 部署記錄、AI 摘要流程與前端頁面文件。"
id: "20260331-DYK-IDX"
type: index
tags: [douyin-knowledge, data-collection, automation, api, architecture, index]
status: active
created: "2026-03-31"
updated: "2026-03-31"
---
> **TL;DR**: 本目錄是「斗影知識」系統的完整知識庫索引。系統已於 2026-03-31 完成從 Cloudflare Pages / Workers / D1 遷移至 Contabo VPS + Nginx + FastAPI + SQLite 架構，正式入口為 `https://tuvral.store`。本目錄存放所有相關技術文件，包含系統架構說明、逐字稿解決方案研究、部署流程、API 規格與資料管理記錄。

# 斗影知識 專案索引

本目錄存放斗影知識（抖音內容研究與知識管理）系統的所有文件。

---

## 文件清單（3 個文件）

| 文件 | 說明 |
| :--- | :--- |
| [douyin-knowledge-system.md](douyin-knowledge-system.md) | 斗影知識系統完整架構說明：TikHub Douyin Search API V2、AI 摘要流程、VPS 部署、Nginx + FastAPI + SQLite 架構、DNS/SSL 設定與當前服務狀態 |
| [transcript-solutions-research.md](transcript-solutions-research.md) | 抖音逐字稿解決方案整合研究：整合上游品質分析、TikHub 原生字幕實測與 V1/V2 方案調查，提出分層逐字稿策略 |
| [_index.md](_index.md) | 本索引文件 |

---

## 系統概覽

| 項目 | 說明 |
| :--- | :--- |
| 正式網址 | `https://tuvral.store` |
| 架構 | Cloudflare CDN + Contabo VPS + Nginx + FastAPI + SQLite |
| VPS | `109.123.230.100`（日本機房，4 vCPU / 8GB RAM） |
| 資料規模 | 107 支影片、107 份逐字稿、107 份摘要、7 個關鍵字 |
| 原始碼 | [05-原始碼/抖影知識/](../../05-原始碼/抖影知識/) |

---

## 統計

| 項目 | 數量 |
| :--- | :--- |
| 文件數 | 3（含 _index.md） |
| 最後更新 | 2026-03-31 |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`07-配置與環境/service-list-config.md`](../../07-配置與環境/service-list-config.md) | 抖影知識正式站服務狀態與 VPS 設定 |
| [`05-原始碼/抖影知識/`](../../05-原始碼/抖影知識/) | 系統相關原始碼 |
| [`.ai/decision-log.md`](../../.ai/decision-log.md) | ADR-005：D1 遷移至 VPS SQLite 的決策記錄 |
