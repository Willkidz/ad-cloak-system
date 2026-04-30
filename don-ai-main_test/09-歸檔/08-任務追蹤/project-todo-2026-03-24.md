---
title: "全專案待辦清單（2026-03-24 16:00 更新）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-27"
summary: "全專案待辦清單，含 P0~P3 優先級分類、隱者斗篷開發進度與系統優化項目。"
status: "archived"
archived_reason: "已整合至 08-任務追蹤/todo.md"
archived_date: "2026-03-27"
merged_into: "08-任務追蹤/todo.md"
id: "20260325-024356"
type: "task"
tags: [cloaking, todo]
created: 2026-03-25
updated: 2026-03-27
activation_glob: null
---

# 全專案待辦清單（2026-03-24 16:00 更新）

> 全專案待辦清單，含 P0~P3 優先級分類、隱者斗篷開發進度與系統優化項目。


---

## P0 — 緊急 / 阻礙核心流程

| 編號 | 項目 | 負責 | 狀態 | 說明 |
|:---:| :--- |:---:|:---:| :--- |
| 1 | 端對端真實測試 | 技術組 | ⏳ 待執行 | 用真手機走完整流程：FB 廣告 → 落地頁 → LINE 加好友 → 歸因 → CAPI CompleteRegistration 回傳到 Meta |
| 2 | 確認 CAPI CompleteRegistration 正常回傳 | 技術組 | ⏳ 待驗證 | require('crypto') 已修、token 已更新，但尚未有真實事件驗證 |

---

## P1 — 重要 / 影響數據品質

| 編號 | 項目 | 負責 | 狀態 | 說明 |
|:---:| :--- |:---:|:---:| :--- |
| 3 | 5 個 OA Token 重新授權 | 老闆 | ⏳ 待執行 | LINE OA 的 Channel Access Token 需要重新產生 |
| 4 | ad_config 重構（type 命名 + BC 像素納入） | 技術組 | ⏳ 待執行 | type=master 改為 type=ad，並納入 BC 像素 |
| 5 | 追蹤火鳥 fbclid 傳遞修復 | 火鳥廠商 | ⏳ 外部等待 | 火鳥落地頁 gotolink() 不帶 fbclid，影響歸因匹配率 |
| 6 | 獨角仙用發送訊息廣告測試、剋星用表單廣告測試 | 廣為人知 | ⏳ 待執行 | 比較 Lead 質量 |
| 7 | 補上 5 個缺少像素的 OA（n15/n16/n17/n19/n21） | 技術組 | ⏳ 待執行 | |

---

## P2 — 隱者斗篷開發

### 已完成
- [x] 斗篷技術研究（28,000 字完整報告）
- [x] 斗篷架構設計（Cloudflare Workers 反向代理方案）
- [x] 開發路線圖（Phase 0-6，7 個階段）
- [x] 完整功能清單（70+ 功能，9 大類）
- [x] UI 介面規劃
- [x] Phase 0 骨架部署（shadow-cloak Worker + DNS + SSL + 路由）
- [x] Phase 1 核心過濾引擎（ASN + UA + Geo）
- [x] 安全頁 v1.0 上線（raxnto.shop — 悅康健康生活平台）
- [x] 推廣頁 v1.0 上線（money-page Worker）
- [x] 522 錯誤已解決
- [x] 65 家斗篷廠商清單搜集完成
- [x] 博弈類安全頁模板清單搜集完成

### 待完成

**第一批：核心補強**

| 步驟 | 功能 | 目標版本 | 說明 |
|:---:| :--- |:---:| :--- |
| 1 | Referer 驗證 | shadow-cloak v1.2 | 檢查流量是否來自 FB/Google 廣告點擊 |
| 2 | 自訂落地頁按鈕連結替換 | money-page v1.1 | 等確認目標網址後執行 |
| 3 | 多落地頁支援 | shadow-cloak v1.3 | 不同路徑對應不同產品線的落地頁 |

**第二批：分流與操作工具**

| 步驟 | 功能 | 目標版本 | 說明 |
|:---:| :--- |:---:| :--- |
| 4 | 輪替分流 | shadow-cloak v1.4 | 按比例分流到不同 tag，攜帶 fbclid |
| 5 | 廣告連結生成器 | 新 Worker 或頁面 | 輸入產品線＋廣告編號，自動生成斗篷連結 |

**第三批：監控與日誌**

| 步驟 | 功能 | 目標版本 | 說明 |
|:---:| :--- |:---:| :--- |
| 6 | 請求日誌 | shadow-cloak v1.5 | 每次請求記錄到 D1 資料庫 |
| 7 | 告警 | n8n 工作流 | 機器人比例突升、Meta 爬蟲訪問 → Telegram 通知 |
| 8 | 每日報告 | n8n 工作流 | 每日自動發送流量摘要 |

**第四批：JS 自動化**

| 步驟 | 功能 | 目標版本 | 說明 |
|:---:| :--- |:---:| :--- |
| 9 | BC 像素注入 | shadow-cloak v1.6 | Worker 代理時自動注入 BC 像素 JS |
| 10 | gotolink 改寫 | shadow-cloak v1.6 | 按鈕跳轉改為走 Worker 分流端點 |

**暫緩項目**

| 項目 | 原因 |
| :--- | :--- |
| 按鈕目標連結替換 | 等歸因系統裝好再弄 |
| 域名管理（E1-E6） | 等核心功能穩定後再做 |
| UI 管理介面 | 等第三批完成後再規劃 |
| 白頁模板庫（F1-F4） | 優先級低 |

---

## P2 — 系統優化

| 編號 | 項目 | 負責 | 狀態 | 說明 |
|:---:| :--- |:---:|:---:| :--- |
| 8 | 博富素材 BF-02~06 過審測試 | 廣為人知 | ⏳ 待執行 | |
| 9 | 火鳥域名 DNS 移到 Cloudflare | 技術組 | ⏳ 暫緩 | 待隱者斗篷測試穩定後 |
| 10 | 確認 05 系列 ad_code UTM 錯亂問題 | 技術組 | ⏳ 待查 | |
| 11 | 調查莊家剋星空 ad_code 比例過高問題 | 技術組 | ⏳ 待查 | |
| 12 | 歸因率功能整合到 CAPI Health Check | 技術組 | ⏳ 待執行 | |

---

## P3 — 中長期規劃

| 編號 | 項目 | 說明 |
|:---:| :--- |------|
| 13 | Mouth AI — 自建 AI Agent 系統 | 平替 Manus，研究 Suna/Open WebUI 等開源框架 |
| 14 | 競品監控系統開發 | 與廣為人知的競品分析功能可能合併 |
| 15 | AD_MAP 開發 | ad_config 各 ad_code 的廣告像素目前全空 |
| 16 | 記憶系統改用交接文件取代 Memory API | 記憶清理已完成（298→260），下一步用交接文件啟動 Agent |

---

## 今日已完成（2026-03-24）

- [x] 記憶大掃除：刪除 40 筆過時記憶，更新 3 筆（298→260）
- [x] Meta CAPI Token 更新：D1 全部 20 筆 + Worker fallback
- [x] n8n require('crypto') 修復：5 處改 $helpers.crypto
- [x] CAPI Health Check + 系統監控 workflow URL 修復（指向自架 n8n）
- [x] event_source_url 確認正確（freshpathlab.com）+ 提取為 DEFAULT_DOMAIN 常數
- [x] 交接文件補完（新增協作規範、修復紀錄、待辦更新）
- [x] 開源 AI Agent 比較報告（10 個框架）
- [x] 憑證記錄更新（新 Cloudflare token、新 n8n API Key、正確 D1 ID）
- [x] 65 家斗篷廠商清單搜集
- [x] 博弈類安全頁模板清單搜集

---

> **文件版本**：v2.0 | 2026-03-24 16:00 | Manus 規劃組
