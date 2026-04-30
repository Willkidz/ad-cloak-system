---
title: "Facebook CAPI IP 地址處理研究"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "研究 Facebook CAPI 對 client_ip_address 的處理規則：支援 IPv4/IPv6、偏好 IPv6、不需 hash、必須真實 IP。後續排查方向為比對 Pixel 端與 CAPI 端的 IP 一致性。"
id: "20260328-godview-ip-research"
type: "analysis"
tags: [attribution, godview]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: Facebook 官方文件明確規定 `client_ip_address` 欄位支援 IPv4 和 IPv6，且對已啟用 IPv6 的用戶偏好接收 IPv6 地址（"IPv6 is preferable over IPv4 for IPv6-enabled users"）。IP 地址不需 hash，必須為用戶真實 IP。若歸因問題持續，排查方向不在 IP 格式選擇，而在確認 Pixel（瀏覽器端）與 CAPI（伺服器端）傳送的 IP 是否一致。

# Facebook CAPI IP 地址處理研究

---

## Facebook 官方文件規範

根據 Facebook 官方文件，關於 `client_ip_address` 欄位的處理規則如下：

<rule id="ip-format">支援 IPv4 和 IPv6 兩種格式。</rule>
<rule id="ipv6-preference">針對已啟用 IPv6 的用戶，Facebook 偏好接收 IPv6 地址（IPv6 is preferable over IPv4 for IPv6-enabled users）。</rule>
<rule id="no-hashing">IP 地址不需要進行雜湊（hash）處理。</rule>
<rule id="real-ip">必須提供用戶真實的 IP 地址。</rule>

---

## 核心發現

文件的關鍵結論是 Facebook 明確偏好接收 IPv6 地址。這表示 Facebook 的系統會記錄並利用 IPv6 進行歸因。因此，當我們透過 Conversion API (CAPI) 傳送 IPv6 地址時，此作法是符合官方建議且正確的。

---

## 後續調查方向

若歸因問題仍然存在，可能的原因並非 IP 格式（IPv4/IPv6）的選擇，而是在於數據的一致性。建議循以下步驟進一步確認：

<step id="check-pixel-ip">確認 Facebook Pixel（瀏覽器端）在用戶事件中記錄的 IP 地址為何。</step>
<step id="check-capi-ip">確認我們透過 CAPI（伺服器端）傳送的 IP 地址為何。</step>
<step id="compare-ips">比對上述兩者是否一致，以確保歸因信號的連續性。</step>

---

## 結論

本研究確認了向 Facebook CAPI 傳送 IPv6 地址的正確性。未來的問題排查應專注於確保瀏覽器端（Pixel）與伺服器端（CAPI）所傳送的用戶 IP 地址一致，以解決潛在的歸因問題。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-ipv6-findings.md](godview-ipv6-findings.md) | IPv6 歸因環境調研 |
| [godview-cf-request.md](godview-cf-request.md) | CF Request 屬性詳解 |
