---
title: "IPv6 研究關鍵發現"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "探討雙棧（Dual-Stack）網路環境下 IPv4/IPv6 切換對歸因的影響：Facebook 偏好 IPv6（唯一性高於 NAT 後的 IPv4）、CF Worker 僅能取得單次連線 IP、前端可透過 ipv6.icanhazip.com 主動獲取 IPv6、伺服器端應記錄 CF-Connecting-IP + X-Forwarded-For + Pseudo-IPv4 三種標頭。"
id: "20260328-godview-ipv6-findings"
type: "analysis"
tags: [attribution, cloudflare-workers, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 台灣用戶普遍處於雙棧（Dual-Stack）環境，瀏覽器會自動在 IPv4/IPv6 間切換（如 FB App 內用 IPv4、跳轉外部瀏覽器後切 IPv6），導致 Pixel 端與 CAPI 端 IP 不一致。Facebook 偏好 IPv6 是因為每個設備有獨立 IPv6 地址（IPv4 常被 NAT 共用）。CF Worker 僅能透過 `CF-Connecting-IP` 取得當次連線的單一 IP。前端解決方案：透過 JS 呼叫 `ipv6.icanhazip.com` 或 `api6.ipify.org` 主動獲取 IPv6。伺服器端應同時記錄 `CF-Connecting-IP`、`X-Forwarded-For`、`Pseudo-IPv4` 三種標頭，建立更完整的用戶身份輪廓。

# IPv6 研究關鍵發現

---

## Facebook 偏好 IPv6 的原因

- **唯一性**：IPv6 能提供更唯一的設備標識，而不僅僅是網路標識。
- **精準度**：相較之下，IPv4 地址常位於 NAT 路由器後，導致多個設備共用同一個 IP。每個設備擁有獨立的 IPv6 地址，因此歸因配對更為精準。

---

## 核心挑戰：雙棧（Dual-Stack）用戶

- **普遍現象**：許多台灣用戶的網路環境為雙棧（Dual-Stack），即同時擁有 IPv4 和 IPv6 地址。
- **協議選擇**：連線協議（使用 IPv4 或 IPv6）由用戶端的瀏覽器決定。
- **情境切換**：用戶在 Facebook App 內瀏覽時可能使用 IPv4，跳轉至外部瀏覽器後可能切換為 IPv6，反之亦然。這導致同一次互動中出現不同的 IP 地址。

---

## 伺服器端的限制

<rule id="server-ip-retrieval">

伺服器端無法在單次請求中同時取得 IPv4 和 IPv6 兩個地址。例如，Cloudflare Worker 只會記錄用戶當前連線所使用的 IP 地址（`CF-Connecting-IP`）。如果用戶透過 IPv6 連線，後端就只能獲取到 IPv6 地址。

</rule>

---

## 前端解決方案

<rule id="client-side-ipv6-fetch">

若要確保能取得用戶的 IPv6 地址，可在自己控制的網頁前端透過 JavaScript 呼叫僅支援 IPv6 的 IP 查詢服務（如 `ipv6.icanhazip.com` 或 `api6.ipify.org`）。如果用戶具備 IPv6 連線能力，此方法便能成功獲取其 IPv6 地址。

</rule>

---

## 對歸因系統的影響

主要問題在於，用戶在前端（例如觸發 Facebook Pixel 的落地頁）的 IP，與後端 Worker 接收到的 IP 可能不一致。這是因為在多次跳轉過程中，瀏覽器可能會根據網路狀況自動切換 IPv4/IPv6 協議。

---

## 伺服器端可行的改善措施

<step id="log-cf-connecting-ip">

**記錄 `CF-Connecting-IP`**：這是 Cloudflare 傳遞的用戶真實 IP，為最基本的步驟（目前已在執行）。

</step>

<step id="log-x-forwarded-for">

**記錄 `X-Forwarded-For` 標頭**：此標頭可能包含代理鏈路上的多個 IP，有助於追溯來源。

</step>

<step id="log-pseudo-ipv4">

**記錄 `Pseudo-IPv4`**：如果 Cloudflare 提供此功能，應一併記錄，以獲得一個代表 IPv6 地址的 IPv4 格式地址。

</step>

---

## 結論

在雙棧網路環境下，單純依賴後端收到的單一 IP 進行用戶歸因存在風險。最佳實踐是結合前端與後端，盡可能收集多種 IP 標頭資訊（`CF-Connecting-IP`, `X-Forwarded-For`, `Pseudo-IPv4`），並在前端透過 JS 獲取用戶的 IPv6 地址，以建立更完整的用戶身份輪廓，提高歸因的準確性。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-ip-research.md](godview-ip-research.md) | Facebook CAPI IP 地址處理研究 |
| [godview-cf-request.md](godview-cf-request.md) | CF Request 屬性詳解 |
