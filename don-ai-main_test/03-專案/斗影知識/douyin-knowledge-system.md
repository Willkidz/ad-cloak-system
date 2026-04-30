---
title: "抖影知識系統說明"
category: "project-doc"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "抖影知識自動化系統的完整說明，更新為遷移後的 VPS + Nginx + FastAPI + SQLite 架構，包含 TikHub Douyin Search API V2、AI 摘要流程、資料遷移結果、前端頁面、DNS/SSL 與目前服務狀態。"
id: "20260330-DYK-001"
type: "guide"
tags: [douyin-knowledge, data-collection, automation, api, architecture, python]
status: "active"
created: "2026-03-30"
updated: "2026-03-31"
---

> **TL;DR**: 抖影知識系統已於 2026-03-31 完成從 **Cloudflare Pages / Workers / D1** 到 **Contabo VPS + Nginx + FastAPI + SQLite** 的架構遷移。正式入口為 `https://tuvral.store`，由 Cloudflare CDN 代理到 VPS `109.123.230.100`。目前前端採白底藍色資訊圖形風格，API 由 FastAPI 提供，資料已從 D1 完整匯出到本地 SQLite，累積資料達 **107 支影片**、**107 份逐字稿**、**107 份摘要**、**7 個關鍵字**。

# 抖影知識系統說明

## 1. 系統現況概覽

抖影知識系統是一套針對抖音內容研究、逐字稿抓取、AI 摘要整理與搜尋管理的自動化系統。系統第一階段先完成 TikHub Douyin Search API V2 的可行性評估與關鍵字批量抓取，第二階段完成 AI 摘要品質優化與舊資料回填，第三階段則將原本部署在 Cloudflare 的靜態與 API 架構遷移至 Contabo VPS，以解決首頁載入與 API 響應偏慢的問題。

| 項目 | 當前狀態 |
| :--- | :--- |
| 正式網址 | `https://tuvral.store` |
| Cloudflare 模式 | CDN 代理 + Strict SSL |
| VPS | Contabo，日本機房，`109.123.230.100` |
| Web 伺服器 | Nginx |
| API 框架 | FastAPI |
| 本地資料庫 | SQLite |
| Python 環境 | Python 3.12，路徑 `/opt/douyin-knowledge/` |
| 前端風格 | 白底藍色資訊圖形風格 |
| 服務狀態 | 已完成端到端測試並上線 |

## 2. 工作歷程

### 2.1 Phase 1-2：研究與 VPS 設置（2026-03-30）

第一階段重點是驗證資料來源與建立處理環境。系統先評估 **TikHub Douyin Search API V2** 的搜尋能力，並研究關鍵字搜尋後的影片去重策略，避免同一支影片因不同關鍵字重複入庫。基礎設施方面，已開通 Contabo VPS，規格為 **4 vCPU / 8GB RAM / 日本機房**，並在 `/opt/douyin-knowledge/` 完成 Python 3.12 執行環境配置。隨後以 **AI、GitHub、N8N、工作流、AI工具** 五個關鍵字進行初始批量影片抓取。

### 2.2 Phase 3：AI 摘要優化（2026-03-30）

第二階段聚焦於提升摘要品質。Prompt 被重新設計為優先提取影片中出現的**具體工具名稱、功能說明、使用步驟與操作細節**，並盡量消除「多種工具」、「某些方法」等模糊措辭。完成新 Prompt 後，系統啟動 **106 筆舊摘要** 的批量回填，讓既有資料與新資料保持相同的摘要標準。

### 2.3 Phase 4：架構遷移 Cloudflare → VPS（2026-03-31）

第三階段處理正式上線架構。遷移的直接原因是原首頁載入偏慢，實測約 **10.3 秒**，HTML 體積約 **360KB**，API 回應約 **2–3 秒**。為降低延遲與簡化資料路徑，系統由 **Cloudflare Pages / Workers / D1** 遷移為 **Nginx + FastAPI + SQLite** 的單機部署架構。

在資料層面，原 D1 資料已完整匯出並落地到本地 SQLite，包括 **106 支影片、106 份逐字稿、106 份摘要、253 條搜尋日誌、6 個關鍵字**。在服務層面，FastAPI 提供 `/api/dashboard`、`/api/videos`、`/api/keywords`、`/api/submit`、`/api/search` 等端點，前端則改為白底藍色資訊圖形風格，共 5 個頁面。系統同時建立 `douyin-api.service` 以 systemd 開機自啟，並將 `tuvral.store` 的 A 記錄切換到 `109.123.230.100`。

### 2.4 Phase 5：效能優化與 SSL 升級（2026-03-31）

遷移完成後，系統進一步進行傳輸與快取優化。前端移除 Google Fonts，減少第三方請求；Nginx 補強 gzip 壓縮；靜態 CSS / JS 設定 **7 天快取**。憑證層面則在 VPS 安裝 **Let's Encrypt**，並將 Cloudflare SSL 模式由 **Flexible** 升級為 **Strict**，形成完整的端到端 HTTPS 鏈路。最終以「即夢AI」關鍵字完成端到端測試，確認資料庫已更新至 **107 支影片、7 個關鍵字**。

## 3. 當前系統架構

```text
用戶 → https://tuvral.store → Cloudflare CDN (Strict SSL) → Nginx (VPS 109.123.230.100)
  ├─ / → 靜態前端 (/var/www/douyin-knowledge/)
  └─ /api/* → FastAPI (127.0.0.1:8000) → SQLite
搜尋流程：FastAPI → TikHub API V2 → process_video.py → Apify + OpenRouter/Gemini → SQLite
```

抖影知識系統現在採用「Cloudflare 做 CDN 與 SSL 邊界、VPS 處理應用邏輯與資料儲存」的模式。這種做法保留了 Cloudflare 在 DNS、CDN 與 TLS 上的優勢，同時避免 Cloudflare Workers / D1 在此類內容型應用中的多跳延遲與資料庫操作限制。

| 層級 | 組件 | 職責 |
| :--- | :--- | :--- |
| 邊界層 | Cloudflare CDN + DNS | 提供網域入口、快取與 Strict SSL |
| Web 層 | Nginx | 靜態檔案服務、反向代理 `/api/*` |
| 應用層 | FastAPI | 儀表板、影片列表、搜尋提交、關鍵字管理 |
| 處理層 | `process_video.py` | 串接搜尋、逐字稿抓取、摘要生成、資料入庫 |
| AI / 擷取 | TikHub API V2、Apify、OpenRouter / Gemini | 搜尋影片、抓逐字稿、生成摘要 |
| 資料層 | SQLite | 本地持久化儲存 |

## 4. API 與處理流程

### 4.1 對外 API

| 端點 | 用途 |
| :--- | :--- |
| `/api/dashboard` | 儀表板統計資料 |
| `/api/videos` | 影片清單與明細查詢 |
| `/api/keywords` | 已追蹤關鍵字清單 |
| `/api/submit` | 手動提交關鍵字或任務 |
| `/api/search` | 啟動搜尋與處理流程 |

### 4.2 搜尋與摘要流程

系統使用者在前端提交關鍵字後，FastAPI 會先呼叫 TikHub Douyin Search API V2 取得影片結果，並執行去重判斷。對於尚未處理的影片，系統接著調用 `process_video.py`，由該腳本串接 Apify 擷取逐字稿與影片 metadata，再呼叫 OpenRouter / Gemini 生成結構化摘要，最後寫入 SQLite。

| 步驟 | 動作 | 主要輸出 |
| :--- | :--- | :--- |
| 1 | 前端提交關鍵字或搜尋請求 | 搜尋任務 |
| 2 | FastAPI 呼叫 TikHub API V2 | 影片候選清單 |
| 3 | 去重策略過濾 | 待處理影片 |
| 4 | `process_video.py` 執行逐字稿抓取 | transcript + metadata |
| 5 | AI 生成摘要 | summary + key points |
| 6 | 寫入 SQLite | videos / transcripts / summaries / search_logs |

## 5. 資料狀態與遷移結果

架構遷移前，Cloudflare D1 中的資料已先完整匯出，再導入 SQLite。本次遷移確保既有研究成果沒有遺失，並在效能優化完成後新增了一筆新的「即夢AI」測試資料，使整體資料量由 106 筆推進到 107 筆。

| 類型 | D1 匯出時數量 | 遷移完成後數量 |
| :--- | :--- | :--- |
| 影片 | 106 | 107 |
| 逐字稿 | 106 | 107 |
| 摘要 | 106 | 107 |
| 搜尋日誌 | 253 | 253+ |
| 關鍵字 | 6 | 7 |

## 6. 前端與效能優化

新版前端採用白底藍色資訊圖形風格，目標是讓內容型知識站在閱讀性、資料密度與速度之間取得平衡。除了頁面視覺重構之外，效能優化也集中在減少外部阻塞資源與提升靜態檔案快取效率。

| 優化項目 | 內容 |
| :--- | :--- |
| 字體優化 | 移除 Google Fonts |
| 壓縮 | Nginx 啟用 / 補強 gzip |
| 靜態快取 | CSS / JS 設定 7 天快取 |
| SSL | VPS 安裝 Let's Encrypt |
| Cloudflare SSL 模式 | 從 Flexible 升級至 Strict |

## 7. VPS 與部署資訊

| 項目 | 值 |
| :--- | :--- |
| VPS 供應商 | Contabo |
| IP | `109.123.230.100` |
| 機房 | 日本 |
| 規格 | 4 vCPU / 8GB RAM |
| Python 工作目錄 | `/opt/douyin-knowledge/` |
| 靜態前端目錄 | `/var/www/douyin-knowledge/` |
| FastAPI 綁定位址 | `127.0.0.1:8000` |
| 服務管理 | `douyin-api.service`（systemd） |
| DNS | `tuvral.store` A 記錄指向 `109.123.230.100` |

## 8. 與舊架構的差異

| 面向 | 舊架構 | 新架構 |
| :--- | :--- | :--- |
| 前端託管 | Cloudflare Pages | VPS Nginx 靜態服務 |
| API | Cloudflare Workers | FastAPI |
| 資料庫 | Cloudflare D1 | SQLite |
| 主入口 | Webhook / Cloudflare 路由 | `https://tuvral.store` |
| SSL | Flexible | Strict |
| 主要痛點 | 首頁慢、API 回應偏慢 | 已優化為單機本地資料路徑 |

## 9. 目前判斷

目前抖影知識系統已不再是單純的資料抓取腳本，而是具備正式入口、前端資訊展示、搜尋工作流、摘要處理與本地資料庫持久化的完整知識系統。若後續需要持續擴展，可優先從三個方向演進：第一，補強搜尋任務佇列與重試機制；第二，增加 SQLite 備份與定期快照；第三，建立更清晰的關鍵字去重與摘要版本追蹤機制。

## 10. 相關文件

| 文件 | 位置 |
| :--- | :--- |
| N8N 舊工作流定義 | `05-原始碼/抖影知識/douyin-knowledge-workflow.json` |
| 主處理腳本 | `05-原始碼/抖影知識/process_video.py` |
| 服務入口配置 | `07-配置與環境/service-list-config.md` |
| 架構決策與記憶 | `.ai/memory.md`、`.ai/decision-log.md` |
