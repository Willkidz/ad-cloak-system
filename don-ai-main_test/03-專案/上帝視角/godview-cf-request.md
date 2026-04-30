---
title: "Cloudflare Worker request.cf 屬性詳解與應用指南"
category: project
priority: medium
applicable_tools: all
last_updated: 2026-03-28
summary: "詳列 CF Worker 中 request.cf 物件的可用屬性，區分免費方案（country/city/timezone/asn/asOrganization/tlsVersion）與付費 Bot Management 方案（botManagement.score 1-99、ja3Hash/ja4 指紋），並規劃在上帝視角系統中的三大應用場景：ASN 過濾數據中心無效點擊、timezone 校準歸因時間戳、botManagement.score 自動攔截刷單流量。"
id: "20260328-godview-cf-request"
type: reference
tags: [cloudflare-workers, godview]
status: active
created: 2026-03-25
updated: 2026-03-28
---

> **TL;DR**: `request.cf` 是 Cloudflare Worker 中每個請求自動攜帶的元數據物件，提供了豐富的訪客上下文資訊。**免費方案**可用的屬性包括：`country`（國家代碼）、`city`（城市名）、`latitude`/`longitude`（經緯度）、`timezone`（時區，如 `Asia/Taipei`）、`asn`（自治系統號碼）、`asOrganization`（ISP 名稱）、`tlsVersion`。**付費 Bot Management 方案**額外提供：`botManagement.score`（1-99，分數越低越可能是機器人）與 `ja3Hash`/`ja4`（TLS 客戶端指紋，用於精準識別惡意客戶端）。在上帝視角系統中的三大應用場景：(1) 利用 `asn` + `asOrganization` 過濾來自數據中心（如 AWS、GCP）的無效點擊；(2) 利用 `timezone` 校準用戶點擊時間戳，確保 Google Sheets 報表的時間一致性；(3) 若遭受大規模刷單攻擊，可升級至 Bot Management 方案，利用 `botManagement.score < 30` 自動攔截機器人流量。

# Cloudflare Worker request.cf 屬性詳解與應用指南

## 屬性分類概覽

`request.cf` 物件由 Cloudflare 邊緣網路自動填充，無需開發者手動採集。它提供的資訊可分為四大類別：地理位置、網路特徵、安全特徵與指紋識別。這些資訊是實現精準歸因、流量過濾與安全防護的基礎數據來源。

---

## 方案功能對比

| 屬性類別 | 屬性名稱 | 免費方案 | 付費 (Bot Management) | 數據範例 |
| :--- | :--- | :--- | :--- | :--- |
| **地理位置** | `country` | 可用 | 可用 | `TW`、`JP` |
| | `city` | 可用 | 可用 | `Taipei`、`Tokyo` |
| | `latitude` / `longitude` | 可用 | 可用 | `25.0330` / `121.5654` |
| | `timezone` | 可用 | 可用 | `Asia/Taipei` |
| **網路特徵** | `asn` | 可用 | 可用 | `16509`（AWS）、`3462`（HiNet） |
| | `asOrganization` | 可用 | 可用 | `AMAZON-02`、`Data Communication Business Group` |
| **安全特徵** | `tlsVersion` | 可用 | 可用 | `TLSv1.3` |
| | `botManagement.score` | 不可用 | **可用（1-99）** | `2`（機器人）、`85`（真人） |
| | `botManagement.verified_bot` | 不可用 | **可用** | `true`（已知搜尋引擎爬蟲） |
| **指紋識別** | `ja3Hash` | 不可用 | **可用** | `e7d705a3286e19ea42f587b344ee6865` |
| | `ja4` | 不可用 | **可用** | `t13d1516h2_8daaf6152771_02713d6af862` |

---

## 在上帝視角系統中的應用

<rule id="cf-usage-applications">

### 應用一：ASN 過濾無效點擊（免費方案即可）

利用 `asn` 與 `asOrganization` 識別來自數據中心的請求。已知的數據中心 ASN 包括：

| ASN | 組織 | 說明 |
| :--- | :--- | :--- |
| `16509` | AMAZON-02 | AWS |
| `15169` | GOOGLE | GCP |
| `8075` | MICROSOFT-CORP-MSN-AS-BLOCK | Azure |
| `13335` | CLOUDFLARENET | Cloudflare 自身 |

當 Worker 偵測到請求來自上述 ASN 時，可選擇不記錄該點擊（不寫入 D1），或標記為 `bot = 1`，避免污染歸因數據。

### 應用二：時區校準（免費方案即可）

利用 `timezone` 屬性校準用戶的實際點擊時間。目前系統使用 UTC 時間戳，但 Google Sheets 報表以 `Asia/Taipei`（UTC+8）為基準。在 Worker 端記錄 `timezone` 後，n8n 可在寫入 Sheets 時自動轉換時區，避免跨時區用戶的數據被歸入錯誤的日期。

### 應用三：Bot Management 自動攔截（需付費方案）

若廣告遭受大規模刷單攻擊，建議升級至 Bot Management 方案。設定攔截規則：

```javascript
if (request.cf.botManagement && request.cf.botManagement.score < 30) {
    return new Response('Blocked', { status: 403 });
}
```

`botManagement.score` 低於 30 表示高度疑似機器人行為，直接攔截可有效保護歸因數據的純淨度。

</rule>

---

## 結論

充分利用 `request.cf` 提供的原生數據能顯著提升系統的健壯性，且大部分應用場景在免費方案下即可實現。建議優先實施 ASN 過濾（成本為零，效果立竿見影），並在遭受攻擊時再評估 Bot Management 方案的升級需求。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`godview-cf-worker-pixel-logic-analysis.md`](godview-cf-worker-pixel-logic-analysis.md) | Worker 中繼站邏輯分析，`request.cf` 的使用位置 |
| [`godview-attr-sys-diagnosis.md`](godview-attr-sys-diagnosis.md) | 故障診斷指南，Bot 流量可能導致的偵測率異常 |
| [`godview-attr-data-analysis.md`](godview-attr-data-analysis.md) | 歸因數據分析，識別數據中心 IP 的異常點擊 |
| [`godview-line-redirect-worker-verify.md`](godview-line-redirect-worker-verify.md) | Worker 自動測試報告 |
