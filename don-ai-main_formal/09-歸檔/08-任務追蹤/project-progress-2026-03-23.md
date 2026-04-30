---
title: "全專案進度報告（2026-03-23）"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "基於 D1 manus-memory 298 筆記憶，結合 n8n workflow 與 Cloudflare 資源盤點，彙整所有專案的完整進度。"
status: "archived"
archived_reason: "過時的進度報告（2026-03-23），已有更新的交接文件和待辦清單取代"
archived_date: "2026-03-27"
id: "20260325-024356"
type: "task"
tags: [planning, todo]
created: 2026-03-25
updated: 2026-03-27
activation_glob: null
---

# 全專案進度報告（2026-03-23）

本報告基於 Cloudflare D1 manus-memory 資料庫 298 筆記憶，結合 n8n workflow 狀態與 Cloudflare 資源盤點，彙整所有專案的完整進度。

---

## 一、上帝視角（175 筆記憶）— 核心技術系統

> 負責 FB 廣告歸因系統的技術開發與維護，涵蓋 Cloudflare Worker、n8n、D1 資料庫、Meta CAPI。

### 系統架構現況

| 組件 | 名稱 | 狀態 |
| :--- | :--- | :--- |
| Cloudflare Worker | line-redirect | ✅ 運行中（主力，處理所有子域名流量） |
| Cloudflare Worker | manus-memory-api | ✅ 運行中（AI 記憶 API） |
| D1 資料庫 | godview-clicks（598KB） | ✅ 445 筆點擊，匹配率 43% |
| D1 資料庫 | manus-memory（381KB） | ✅ 298 筆有效記憶 |
| 網域 | freshpathlab.com + 8 個輔助域名 | ✅ 全部 active |
| DNS 紀錄 | 25 筆（22 AAAA + 1 A + 1 CNAME） | ✅ 正常 |

### n8n Workflow 狀態

| Workflow | 狀態 | 用途 |
| :--- | :--- | :--- |
| Config API | ✅ 啟用 | 提供 LINE/廣告配置 API |
| Admin API | ✅ 啟用 | 管理後台 |
| Time Attribution | ✅ 啟用（最活躍） | 即時歸因匹配（webhook） |
| DNS Auto-Sync | ✅ 啟用（⚠️ 舊 Token 失效） | DNS 自動同步 |
| CAPI Health Check | ✅ 啟用 | 每小時歸因報告 + 健康檢查 |
| 系統監控 | ✅ 啟用 | 每 15 分鐘 D1 + workflow 監控 |
| 每日統計報告 | ✅ 啟用 | 每日 Telegram 統計日報 |
| Sheets Report | ❌ 停用（3/17 起） | Google Sheets 報告（已棄用） |

### 已完成的里程碑

1. **Worker 雙模組架構**（3/20）：拆分為 config.js + index.js，部署到 line-redirect
2. **BC 受眾像素整合**（3/20）：/bc-event 端點支援 GET/POST，Lead 自動發送
3. **Bot 過濾**（3/21）：解決 FB 爬蟲觸發假 Lead 問題
4. **fbc 自動生成**（3/20）：fbclid → fbc 格式轉換
5. **歸因系統驗證**（3/22）：1:1 匹配正確，時區修正後爆分王歸因率 104%
6. **系統清理**（3/22）：刪除廢棄 Worker/Workflow，合併監控
7. **ad_config 修正**（3/22）：5 筆 pixel ID 修正 + 新增 sz
8. **每小時歸因報告修正**（3/22）：統計區間從 24 小時改為當日

### 待辦事項

| 優先級 | 項目 | 狀態 |
| :--- | :--- | :--- |
| P0 | DNS Auto-Sync 更新新 Cloudflare Token | ⏳ 新 Token 已取得，待更新 |
| P1 | ad_config 重構（type=master → type=ad，納入 BC 像素） | ⏳ 待執行 |
| P1 | 5 個 OA Token 權限重新授權（jd/n14/n18/n20/n22） | ⏳ 待處理 |
| P1 | 補上 5 個缺少像素的 OA（n15/n16/n17/n19/n21） | ⏳ 待處理 |
| P2 | 05 系列 ad_code UTM 錯亂確認 | ⏳ 待確認 FB 後台 |
| P2 | 莊家剋星空 ad_code 比例過高 | ⏳ 待確認 |

---

## 二、斗篷（Cloaker）自建項目 — 研究完成，開發未啟動

> 取代火鳥斗篷，整合到現有 line-redirect Worker，實現流量過濾 + 動態路由 + 無縫參數傳遞。

### 六階段計畫

| Phase | 內容 | 狀態 |
| :--- | :--- | :--- |
| Phase 0 | 基礎設施（cloak_logs D1 table + CLOAKER_CONFIG KV） | ❌ 未開始 |
| Phase 1 | ASN 過濾（Meta 32934+63293, Google 15169）→ 安全頁 | ❌ 未開始 |
| Phase 2 | UA/Referrer 檢查，規則從 KV 讀取 | ❌ 未開始 |
| Phase 3 | fbclid 等參數完整傳遞 + 端對端測試 | ❌ 未開始 |
| Phase 4 | JS 指紋挑戰（WebGL + AudioContext + WebGPU 多信號評分） | ❌ 未開始 |
| Phase 5 | Reverse Proxy 無縫透傳 | ❌ 未開始 |

### 已完成的研究

- ✅ 自建方案研究報告（Memory #301）
- ✅ 火鳥 + 15 家廠商對比（Memory #302）
- ✅ 技術 + 審核官分工文件（Memory #303）
- ✅ Meta AI 反偵測機制研究（Memory #311）
- ✅ 安全頁設計指南（Memory #312）
- ✅ Round-Robin OA 分配需求確認（Memory #310）
- ✅ 遺漏檢查報告（Memory #321）
- ✅ 5 條斗篷專屬 Convention 規則

### 開發前待辦

- 住宅代理選購（推薦 Decodo $4/GB）
- 安全頁製作（需與廣告素材語義一致）
- 域名準備（每 2-4 週輪換，新域名預熱 4-14 天）

---

## 三、廣為人知（48 筆記憶）— 廣告素材與投放策略

> 負責 FB 廣告素材製作、競品分析、過審策略、投放結構優化。

### 素材庫現況（博富 BF 系列）

| 素材 | 主題 | 過審 | 風險 |
| :--- | :--- | :--- | :--- |
| BF-01 | 戰神賽特（競品仿製） | ✅ 過審 | 低 |
| BF-02 | 美女遊戲 | ⏳ 未測 | 低 |
| BF-03~06 | BF-01/02 的 4:5 和 9:16 版 | ⏳ 未測 | 低 |
| BF-07~09 | 雷神之錘 1:1/4:5/9:16 | ❌ 被拒 | 極高 |
| BF-10~12 | 魔龍傳奇/麻將胡了/幸運拉霸 | ⏳ 未測 | 高（文字同 BF-07） |

### 競品情報

- 已記錄 **11 家信用版同行**（金富翁、誠運坊、八方來財、Kipo、天碩等）
- 關鍵發現：品牌名可直搜 Meta 廣告庫
- 有效搜尋策略：遊戲名 + 行動詞 > 品牌名直搜 > 行業通用詞
- 工具：SearchAPI.io（API Key 已設定）

### 投放策略要點

- 活用型廣告創意 1-2-2 結構（1 主文 + 2 標題 + 2 說明 + 單素材）
- 廣告目標：「聯絡」> 「Lead」（人群匹配度更好）
- 優化目標：「按鈕點擊」> 「CAPI 添加好友」（因 fbclid 捕獲率僅 36%）
- Meta 描述受眾功能已開始測試

### 待辦

- 測試 BF-02~06 過審率
- 素材數量 vs 過審率 A/B 測試
- 爆分王專屬素材製作

---

## 四、廣告策略（15 筆記憶）— 投放規則與數據分析

> 負責廣告投放策略制定、效果分析、預算分配，與上帝視角配合。

### 核心規則

- 必須使用 META 活用型廣告創意（Dynamic Creative）
- 素材風險評估：博富極高、爆分王中高、莊家剋星/獨角仙中低
- 分析原則：不主觀判斷，一切以實際測試數據說話
- 文案規範：主文 25 字內、標題 15 字內、每行開頭 1 個 emoji

### 四大產品線

| 產品 | 代號 | 類型 | 像素 |
| :--- | :--- | :--- | :--- |
| 博富 | BF | 信用版娛樂城 | 2153779865162232 |
| 爆分王 | AS（js/cs/ms/ls） | 電子遊戲 AI 預測 | 1296143099239936 |
| 莊家剋星 | AB（jb/cb/mb/lb） | 百家樂 AI 算牌 | 2030344604527768 |
| 獨角仙 | AX（jx/cx/mx/lx） | 百家樂 AI 預測（網頁版） | 4353746171539948 |

---

## 五、特助（9 筆記憶）— AI Agent 協調與品質管理

> 負責協調「上帝視角」和「廣為人知」，確保專案方向正確、記憶不遺失。

### 系統架構

- **v2 已完成**：五層記憶架構 + GPA 評分 + Boot/Shutdown 交接 + 事前/事後審核
- 記憶分類：state / convention / architecture / issue_resolved / context
- 指令系統：每次新對話自動讀取 Memory API 恢復上下文

### 待辦追蹤

| 優先級 | 項目 | 狀態 |
| :--- | :--- | :--- |
| P1 | 追蹤火鳥修復 fbclid 傳遞問題（捕獲率 36%） | ⏳ 進行中 |
| P1 | ad_config 重構 | ⏳ 待執行 |
| P2 | 斗篷 Phase 0 開發啟動 | ⏳ 待啟動 |

---

## 六、競品監控系統（4 筆記憶）— 早期階段

> 使用 CHRLINE（非官方 LINE API）監控競品 LINE OA 好友人數變化。

- 技術方案已確定：CHRLINE + n8n 自動化
- n8n workflow 前綴：競品監控_
- **目前無活躍 workflow**，尚未進入開發

---

## 七、Mouth AI（1 筆記憶）— 競品搜尋 SOP

- 僅有 1 筆記憶：競品搜尋 SOP（記錄廣告網址 + 投放行為 + 品牌 tag）
- 與廣為人知的競品分析功能有重疊

---

## 八、全局待辦優先排序

| 排序 | 項目 | 所屬專案 | 優先級 |
| :--- | :--- | :--- | :--- |
| 1 | 更新 Cloudflare Token 到 n8n DNS Auto-Sync | 上帝視角 | P0 |
| 2 | 5 個 OA Token 重新授權 | 上帝視角 | P1 |
| 3 | ad_config 重構（type 命名 + BC 像素納入） | 上帝視角 | P1 |
| 4 | 追蹤火鳥 fbclid 傳遞修復 | 特助 | P1 |
| 5 | 斗篷 Phase 0 基礎設施 | 斗篷 | P2 |
| 6 | 博富素材 BF-02~06 過審測試 | 廣為人知 | P2 |
| 7 | 競品監控系統開發 | 競品監控 | P3 |
| 8 | 補上 5 個缺少像素的 OA | 上帝視角 | P2 |
