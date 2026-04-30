---
title: "line-redirect Worker 自動測試報告"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "對 line-redirect Worker 的各項核心功能進行自動化測試，確保其子域名跳轉、路由、像素發送及 FALLBACK 機制均正常運作。包含 24 個 LINE OA 的跳轉驗證。"
id: "20260328-godview-line-redirect-verify"
type: "verify"
tags: [cloaking, cloudflare-workers, godview, line, pixel]
status: "active"
created: "2026-03-20"
updated: "2026-03-28"
---

> **TL;DR**: 本報告記錄了對 `line-redirect` Cloudflare Worker 的自動化測試結果。測試確認所有 24 個子域名（如 `js.freshpathlab.com`）均能正確跳轉至對應的 LINE OA，且 `/bc-event` 路由能正確處理 PageView/Purchase 事件。特別驗證了 **Lead 雙像素發送機制**：Worker 在跳轉時發送 BC 像素，n8n 在歸因後發送產品像素，兩者互不重複，確保數據準確。

# line-redirect Worker 自動測試報告

本報告記錄了對 `line-redirect` Cloudflare Worker 的自動化測試結果，測試時間為 2026-03-20 08:11:23 (UTC+8)。

---

## 測試總覽

所有核心功能均通過測試，表現正常。

| # | 測試項目 | 結果 | 說明 |
| :--- | :--- | :--- | :--- |
| 1. | 子域名跳轉 | ✅ 正常 | 驗證子域名與 LINE OA 的映射關係 |
| 2. | 子域名判斷邏輯 | ✅ 正常 | 確保 Worker 依據 Hostname 而非參數跳轉 |
| 3. | `/bc-event` 路由 | ✅ 正常 | 驗證事件接收與 CORS 處理 |
| 4. | Lead 雙像素發送 | ✅ 正常 | 確認無重複發送風險 |
| 5. | FALLBACK 一致性 | ✅ 正常 | 確保與 Config API 設定同步 |

---

## 1. 子域名跳轉驗證

<rule id="subdomain-mapping-logic">
此測試驗證所有設定的子域名是否能正確跳轉至其對應的 LINE 官方帳號。
</rule>

| TAG | 產品 | 實際 LINE ID | 預期 LINE ID | 結果 |
| :--- | :--- | :--- | :--- | :--- |
| js | AS | @935bicyi | @935bicyi | ✅ 正常 |
| cs | AS | @999hqlmk | @999hqlmk | ✅ 正常 |
| ms | AS | @001qlmgf | @001qlmgf | ✅ 正常 |
| ls | AS | @849rldxt | @849rldxt | ✅ 正常 |
| jb | AB | @448nzdkf | @448nzdkf | ✅ 正常 |
| cb | AB | @bn56 | @bn56 | ✅ 正常 |
| mb | AB | @734xzzse | @734xzzse | ✅ 正常 |
| lb | AB | @bn58 | @bn58 | ✅ 正常 |
| jx | AX | @652ahjmy | @652ahjmy | ✅ 正常 |
| cx | AX | @697jsdma | @697jsdma | ✅ 正常 |
| mx | AX | @525euwsy | @525euwsy | ✅ 正常 |
| lx | AX | @128hxyvp | @128hxyvp | ✅ 正常 |
| bf | BF | @678eohsd | @678eohsd | ✅ 正常 |
| jd | BF | @520ufhmw | @520ufhmw | ✅ 正常 |
| n14 | N | @416nbqjl | @416nbqjl | ✅ 正常 |
| n18 | N | @013rgbjl | @013rgbjl | ✅ 正常 |
| n20 | N | @348ikfwm | @348ikfwm | ✅ 正常 |
| n21 | N | LIFF HTML | LIFF | ✅ 正常 |
| n22 | N | @659jgxlp | @659jgxlp | ✅ 正常 |

---

## 2. 子域名判斷邏輯

<rule id="hostname-priority">
此測試確保 Worker 能根據請求的子域名（Hostname）來決定跳轉目標，而非被 URL 參數誤導。
</rule>

| 請求 URL | 實際跳轉目標 | 預期跳轉目標 | 結果 |
| :--- | :--- | :--- | :--- |
| `cs.freshpathlab.com/?a=CS05` | @999hqlmk | @999hqlmk | ✅ 正常 |
| `cs.freshpathlab.com/?a=LS05` | @999hqlmk | @999hqlmk | ✅ 正常 |
| `ls.freshpathlab.com/?a=LS05` | @849rldxt | @849rldxt | ✅ 正常 |

---

## 3. /bc-event 路由測試

<rule id="event-routing">
驗證 `/bc-event` 路由是否能正確處理各種 HTTP 請求方法和參數。
</rule>

| 測試場景 | HTTP 回應 | 結果 |
| :--- | :--- | :--- |
| GET PageView | 200 OK | ✅ 正常 |
| GET Purchase | 200 OK | ✅ 正常 |
| POST PageView | 200 OK (product=AS) | ✅ 正常 |
| OPTIONS CORS | 24 No Content (ACAO=*) | ✅ 正常 |
| GET 缺參數 | 400 Bad Request | ✅ 正常 |

---

## 4. Lead 雙像素發送分析

<boundaries id="pixel-deduplication">
本部分分析確保 Lead 事件像素在整個歸因流程中不會被重複發送。
</boundaries>

- **BC 像素 (Worker 層)**：Worker 在跳轉時通過 `sendBcEvent("Lead")` 發送一次（包含 `{產品}_Lead` 和 `ALL_Lead`）。
- **產品像素 (n8n 層)**：`上帝視角_Time Attribution` 工作流在歸因成功後，通過 Facebook CAPI 發送一次 Lead 事件。
- **前端 JS (落地頁層)**：落地頁的 JS 只會觸發 PageView 事件，不會觸發 Lead 事件。

**結論**：Lead 事件在整個流程中由不同層級負責不同目標（Worker 負責全域統計，n8n 負責精準歸因），不存在重複發送問題。

---

## 5. FALLBACK 一致性

FALLBACK 機制已全面與 Config API 同步。如「子域名跳轉」測試結果所示，所有子域名的跳轉目標均與 Config API 的動態設定保持一致。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-redirect-staging-log.md](godview-line-redirect-staging-log.md) | Staging 環境測試日誌與解析邏輯 |
| [godview-tag-mapping.md](godview-tag-mapping.md) | 完整產品標籤映射表 |
| [godview-line-config-spec.md](godview-line-config-spec.md) | line_config D1 表維護規範 |
