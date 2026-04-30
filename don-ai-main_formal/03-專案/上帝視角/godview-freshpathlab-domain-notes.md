---
title: "Freshpathlab 網域與中繼站配置筆記"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "freshpathlab.com 網域架構：cx 子網域走 CF Worker 做廣告點擊中繼、api 子網域走 CF Tunnel 接 n8n Webhook、static 子網域走 CF Pages/R2 存放像素腳本。DNS 全開 Proxy，SSL 設為完整嚴格。"
id: "20260328-godview-domain-notes"
type: "notes"
tags: [cloudflare, dns, godview, infrastructure]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: freshpathlab.com 是「上帝視角」系統的流量入口與數據中繼中心，託管於 Cloudflare。子網域分配：`cx.freshpathlab.com`（廣告點擊中繼，CF Worker 處理）、`api.freshpathlab.com`（n8n Webhook 入口，CF Tunnel）、`static.freshpathlab.com`（像素追蹤腳本存放，CF Pages/R2）。所有 A 紀錄必須開啟 Cloudflare Proxy（橘色雲朵），SSL/TLS 設為「完整（嚴格）」，並開啟 HSTS。更換網域時需同步更新 Meta 廣告後台的「允許清單」。

# Freshpathlab 網域與中繼站配置筆記

---

## 網域架構概覽

freshpathlab.com 是「上帝視角」系統的流量入口與數據中繼中心。

---

## 子網域分配表

| 子網域 | 用途 | 處理程序 |
| :--- | :--- | :--- |
| `cx.freshpathlab.com` | 廣告點擊中繼 (C 項目) | CF Worker |
| `api.freshpathlab.com` | n8n Webhook 入口 | Cloudflare Tunnel |
| `static.freshpathlab.com` | 存放像素追蹤腳本 | CF Pages / R2 |

---

## 基礎設施配置 (Infrastructure)

<rule id="domain-config-rule">

- **DNS 解析**：所有 A 紀錄必須開啟 Cloudflare Proxy (橘色雲朵)，以啟用 Worker 處理能力。
- **SSL/TLS**：統一設定為「完整 (嚴格)」，確保數據傳輸全程加密。
- **HSTS**：開啟 HSTS 以強制瀏覽器使用 HTTPS 訪問，提升安全性。

</rule>

<boundaries>

- 任何 DNS 變更都可能導致廣告鏈結失效，變更前必須經過嚴格的影響評估。
- 更換網域時需同步更新 Meta 廣告後台的「允許清單」，否則廣告審核會被拒絕。

</boundaries>

---

## 結論

穩定的網域配置是系統運行的基石。子網域的職責劃分（中繼/API/靜態資源）確保了各服務的獨立性與可維護性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-cf-worker-deploy-verify.md](godview-cf-worker-deploy-verify.md) | Worker 部署指南 |
| [godview-ad-tracking-sys-spec.md](godview-ad-tracking-sys-spec.md) | 系統總綱 |
