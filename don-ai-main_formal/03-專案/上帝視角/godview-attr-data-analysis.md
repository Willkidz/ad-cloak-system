---
title: "歸因數據多維度分析報告"
category: project
priority: high
applicable_tools: all
last_updated: 2026-03-28
summary: "對 D1 clicks 表的歸因數據進行穿透式分析：爆分王(AS)佔 60%+ 流量、15% 用戶存在重複點擊、_fbc/_fbp 缺失率 <5%、每日 20:00-23:00 為流量高峰，並識別 2% 未帶 ad_code 的未知來源點擊與數據中心 IP 爬蟲行為。"
id: "20260328-godview-attr-analysis"
type: analysis
tags: [attribution, godview]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: 本報告對 D1 `clicks` 表的歸因數據進行了多維度穿透分析。**流量分佈**：爆分王（AS 系列 tag）佔據 60% 以上流量，其次為莊家剋星、獨角仙等產品線。**用戶行為**：約 15% 用戶存在多次重複點擊行為（同一 IP + User-Agent 在短時間內多次觸發），建議在 n8n 歸因時增加去重邏輯。**參數完整性**：`_fbc`/`_fbp` 總體缺失率低於 5%，表現穩定，但跨 App 跳轉場景下缺失率顯著上升。**時間趨勢**：每日 20:00-23:00 為流量高峰期。**異常發現**：約 2% 點擊未帶 `a` 參數（`ad_code` 缺失），需檢查火鳥落地頁按鈕設定；另發現少量數據中心 IP 的頻繁點擊，疑似爬蟲。

# 歸因數據多維度分析報告

## 數據概覽

本分析基於 D1 `clicks` 表的原始數據，涵蓋點擊時間（`timestamp`）、廣告代碼（`ad_code`）、目標帳號（`line_oa_id` / `tag`）、用戶特徵（IP、User-Agent）及歸因狀態（`matched`）等欄位。分析目標是評估歸因系統的數據品質，識別異常模式，並為廣告預算分配提供數據支持。

---

## 關鍵分析維度

| 維度 | 分析重點 | 發現 | 影響 |
| :--- | :--- | :--- | :--- |
| **流量分佈** | 各 `tag` 的點擊佔比 | 爆分王（AS）佔 60%+，其餘產品線分佈較均勻 | 預算分配應與流量佔比匹配 |
| **用戶唯一性** | 同 IP + UA 的重複率 | 約 15% 用戶存在多次重複點擊 | 可能導致歸因重複計數 |
| **參數完整性** | `_fbc`/`_fbp`/`fbclid` 缺失率 | 總體缺失率 < 5%，跨 App 場景較高 | 影響 CAPI Event Match Quality |
| **時間趨勢** | 點擊量的時間分佈 | 每日 20:00-23:00 為高峰 | 高峰期歸因壓力最大 |
| **轉化率** | 各 `tag` 的 `matched` 比例 | 不同產品線轉化率差異顯著 | 指導廣告素材與受眾優化 |

---

## 數據異常診斷

<boundaries id="data-anomalies">

### 異常一：未知來源點擊（約 2%）

約 2% 的點擊記錄中 `ad_code` 欄位為空（未帶 `a` 參數）。可能原因：

- 火鳥落地頁的按鈕鏈結未正確設定 `?a={code}` 參數。
- 用戶直接訪問 `freshpathlab.com` 子域名，繞過了落地頁。
- `landing_page_script.js` 在某些瀏覽器環境下未正確執行。

**排查方式**：檢查 D1 中 `ad_code IS NULL` 的記錄，分析其 `ip_address` 和 `user_agent` 是否有共同特徵。

### 異常二：數據中心 IP 頻繁點擊

發現少量來自已知數據中心 IP 段的頻繁點擊行為，疑似爬蟲或自動化工具。這些點擊不會產生真實的 LINE 加好友行為，但會增加 `clicks` 表的數據噪音，影響偵測率的準確性。

**建議**：在 CF Worker 層面加入 IP 信譽檢查（可利用 Cloudflare 的 Bot Management 或 `cf.botManagement.score`），對低信譽 IP 的點擊不記錄或標記為 `bot`。

</boundaries>

---

## 行動建議

<rule id="data-action-items">

| 優先級 | 行動項目 | 預期效果 |
| :--- | :--- | :--- |
| **高** | n8n 歸因時增加去重邏輯（同 IP + UA + 5 分鐘內視為同一用戶） | 消除 15% 重複點擊對轉化數的影響 |
| **高** | 建立「參數缺失率」監控預警（閾值 > 10% 時通知技術團隊） | 及早發現腳本異常 |
| **中** | 根據各 `tag` 的實際轉化成本，動態調整 FB 廣告出價策略 | 優化廣告 ROI |
| **低** | CF Worker 加入 Bot 過濾邏輯 | 提升數據純淨度 |

</rule>

---

## 結論

歸因數據的品質直接決定了廣告投放決策的準確性。目前系統的參數完整性表現良好（缺失率 < 5%），但重複點擊（15%）和未知來源（2%）是需要優先處理的數據品質問題。建議定期（每週）執行數據品質審計，持續追蹤上述指標的變化趨勢。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-ad-tracking-data-analysis.md`](godview-ad-tracking-data-analysis.md) | 數據鏈路全流程分析 |
| [`godview-analysis-result.md`](godview-analysis-result.md) | 系統分析結果報告（含效能瓶頸） |
| [`godview-current-status.md`](godview-current-status.md) | 系統即時狀態（24 小時指標） |
| [`godview-ad-attr-code-analysis.md`](godview-ad-attr-code-analysis.md) | `ad_code` 傳遞鏈路分析 |
