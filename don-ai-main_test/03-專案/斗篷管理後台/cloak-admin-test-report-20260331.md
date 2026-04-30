---
title: "斗篷管理後台測試報告（2026-03-31）"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "彙整 2026-03-31 斗篷管理後台各項 BUG 修復、部署與 API 驗證結果。"
version: "v1.0"
---
# 斗篷管理後台測試報告（2026-03-31）

> 測試日期：2026-03-31
> 測試環境：Sandbox（AWS us-east-1, IP: 34.207.84.162）
> API 端點：https://admin-api.bexnua.store

---

## 項目一：BUG-004 — ip_pinning 欄位

**狀態：已完成**

D1 campaigns 表已確認有 ip_pinning 欄位（cid=46），無需 ALTER TABLE。

cloak-admin-api 的 `src/index.ts` 已更新，在 POST 和 PUT `/api/v1/campaigns` 路由中加入 `ip_pinning`、`ad_code`、`group_name` 三個欄位的讀寫支援。

| 操作 | 結果 |
|------|------|
| GitHub Push | cloak-admin-api commit ea115b5 |
| Wrangler Deploy | Version ID: ef218721-e059-4941-a8b4-3132193b8ae8 |
| API 驗證（T-03 ip_pinning=1） | 寫入成功，GET 回傳 ip_pinning: 1 |

---

## 項目二：line-redirect 部署

**狀態：已完成**

從 `laoqin1689/shadow-cloak-backup` 讀取最新 `line-redirect.js`（commit 970d210，BUG-010 修復：改用 URL 路徑讀取 ad_code）。

| 操作 | 結果 |
|------|------|
| Node.js 語法檢查 | 通過（無語法錯誤） |
| Cloudflare Workers API 部署 | 成功（deployment_id: d473af2f88494b109a991e0b4cad867b） |
| D1 Binding | DB → 3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c |

---

## 項目三：BUG-001 驗證

**狀態：驗證通過**

建立測試 campaign（id: 38c94241），設定多個欄位後，用 PUT 只傳 `{"name":"BUG001-RENAMED"}`，確認其他欄位完整保留。

| 欄位 | 修改前 | 修改後 | 結果 |
|------|--------|--------|------|
| name | BUG001-TEST | BUG001-RENAMED | 正確更新 |
| theme | bug001test.example.com | bug001test.example.com | 保留 |
| ad_code | BT01 | BT01 | 保留 |
| cloak_country | TW | TW | 保留 |
| cloak_traffic_source | facebook | facebook | 保留 |
| require_fbclid | 1 | 1 | 保留 |
| line_links | ["https://line.me/ti/p/bug001test"] | ["https://line.me/ti/p/bug001test"] | 保留 |
| ad_pixels | [{"type":"fb","pixel_id":"111","token":"test"}] | [{"type":"fb","pixel_id":"111","token":"test"}] | 保留 |

**結論：BUG-001 修復有效，PUT 只更新傳入的欄位，未傳入的欄位完整保留。**

測試 campaign 已清理（DELETE 成功）。

---

## 項目四：建立 4 個測試廣告並執行功能測試

### 建立結果

| 編號 | 名稱 | Theme | ad_code | Campaign ID | 狀態 |
|------|------|-------|---------|-------------|------|
| T-01 | 過濾測試 | mopliv.site | T01 | 0e443a68-6e83-4e33-8f49-d0b923fbfe25 | active |
| T-02 | 分流輪替測試 | raxnto.shop | T02 | ab608606-1101-4ec4-a6ad-f6139ccd9d65 | active |
| T-03 | 固定IP測試 | zuntek.site | T03 | 83521049-b209-4794-bf65-c1e68caa0505 | active |
| T-04 | 像素多綁定測試 | velphi.shop | T04 | b4264399-f2af-47e7-b873-bbd03e7de423 | active |

舊 TEST campaigns（TEST-02, TEST-03, TEST-05）已暫停（status: paused），避免 theme 衝突。

### API 欄位驗證

| 測試項 | 預期 | 實際 | 結果 |
|--------|------|------|------|
| T-02 link_strategy | round_robin | round_robin | 通過 |
| T-03 ip_pinning | 1 | 1 | 通過 |
| T-04 ad_pixels | [{"type":"fb","pixel_id":"123456789","token":"test_token"}] | 一致 | 通過 |

### 功能測試結果

**T-01 過濾測試（mopliv.site）**

| 測試 | HTTP 狀態 | 結果 | 說明 |
|------|-----------|------|------|
| 無 fbclid | 200 (safe page) | 正確 | 缺少 fbclid，被過濾到 safe page |
| 有 fbclid | 200 (safe page) | 正確 | Sandbox IP 為 AWS datacenter（34.207.84.162），非台灣住宅 IP，被 cloak 阻擋 |

cloak_logs 確認：domain=mopliv.site, verdict=blocked, campaign_id=0e443a68（正確匹配 T-01）。

**T-02 分流測試（raxnto.shop）**

| 測試 | HTTP 狀態 | 結果 | 說明 |
|------|-----------|------|------|
| 連續請求 | 200 (safe page) | 正確 | Sandbox IP 被 cloak 阻擋，無法觸發 redirect |

cloak_logs 確認：domain=raxnto.shop, verdict=blocked, campaign_id=ab608606（正確匹配 T-02）。分流輪替邏輯需在真實環境（台灣住宅 IP + 手機 UA）下測試。

**T-04 像素測試（velphi.shop）**

| 測試 | 結果 | 說明 |
|------|------|------|
| HTML grep pixel/fbq/ttq | 無匹配 | 正確：被 cloak 到 safe page，safe page 不注入像素 |

cloak_logs 確認：domain=velphi.shop, verdict=blocked, campaign_id=b4264399（正確匹配 T-04）。像素注入僅在 verdict=allowed 時觸發。

### 測試總結

所有 4 個測試廣告的 **API 層面功能完全正常**：建立、讀取、欄位寫入（ip_pinning、ad_pixels、link_strategy、line_links）均正確。

shadow-cloak 的 **campaign 匹配邏輯正確**：所有域名都正確匹配到對應的 campaign_id。

由於 Sandbox 環境限制（AWS datacenter IP），所有請求的 verdict 均為 blocked（safe page），這是 **cloak 的正確行為**。分流輪替和像素注入需在真實環境下驗證。

---

## 環境限制說明

Sandbox 測試環境（AWS us-east-1, IP: 34.207.84.162）屬於 datacenter IP，會被 shadow-cloak 的 IP 信譽檢查阻擋。以下功能需在真實環境（台灣住宅 IP + 手機 Facebook App UA）下完整驗證：

1. **分流輪替**：需多次請求觀察 round_robin 是否正確輪替 3 個 LINE 連結
2. **IP 固定**：需同一 IP 多次請求，確認始終分配到同一個 LINE 連結
3. **像素注入**：需通過 cloak 後查看 money page HTML 是否包含 fbq 像素代碼
