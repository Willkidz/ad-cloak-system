---
title: "n8n HTTPS 設定完成報告"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "自架 n8n（n8n.bexnua.store，VPS IP 5.189.150.66）的 HTTPS 設定完整記錄：Cloudflare DNS A 記錄 → Nginx 反向代理（含 WebSocket）→ Let's Encrypt SSL 憑證（有效至 2026-06-21）→ Webhook 端點驗證通過。"
id: "20260324-https-setup"
type: "log"
tags: [dns, godview, n8n]
status: "active"
created: "2026-03-24"
updated: "2026-03-28"
---

> **TL;DR**: 為自架 n8n 服務（`n8n.bexnua.store`，VPS IP `5.189.150.66`）完成 HTTPS 部署的完整記錄。流程五步驟：(1) Cloudflare DNS 設定 A 記錄指向 VPS（暫時 DNS only 以通過 HTTP-01 驗證）；(2) Ubuntu 22.04 安裝 Nginx + Certbot；(3) Nginx 反向代理至 `localhost:5678`（含 WebSocket 支援，對 n8n 至關重要）；(4) Let's Encrypt 憑證簽發（E8，有效至 2026-06-21，自動續約已設定）；(5) 驗證通過（`/webhook/get-config` 和 `/webhook/line-follow` 均回傳 HTTP 200，TLSv1.3）。

# n8n HTTPS 設定完成報告

## 總覽

本文件記錄為自架 n8n (n8n.bexnua.store) 服務成功設定 HTTPS 的完整流程。設定範圍涵蓋 Cloudflare DNS 記錄配置、VPS 環境準備、Nginx 反向代理設定，以及透過 Certbot 申請與安裝 Let's Encrypt SSL 憑證。最終，所有相關的 HTTPS 連線與功能均已通過驗證，服務正常上線。

| 項目 | 狀態 |
| :--- | :--- |
| 任務完成日期 | 2026-03-24 |
| 整體狀態 | 全部完成 |

---

## 設定流程

### 步驟一：Cloudflare DNS 記錄配置

<step id="dns-config">
第一步是為 `n8n.bexnua.store` 域名設定 A 記錄，將其指向 VPS 的 IP 位址 `5.189.150.66`。為配合 Let's Encrypt 的 HTTP-01 驗證，Proxy 狀態需暫時設為 "DNS only"。
</step>

| 項目 | 詳情 |
| :--- | :--- |
| 域名 | n8n.bexnua.store |
| 記錄類型 | A 記錄 |
| 指向 IP | 5.189.150.66 |
| Proxy 狀態 | DNS only (proxied=false) |

<example>
以下為用於建立此 DNS 記錄的 API 請求：
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/3d18bc84f1840bb4423a39030f5fc10b/dns_records" \
  -H "Authorization: Bearer cfut_xAy57a8x6pmDzCM8BGi5A0nWkrvYjVJfodWB8teV4f64c32f" \ # [待確認：API 金鑰疑似外洩，建議立即撤銷並更換]
  -H "Content-Type: application/json" \
  -d '{"type":"A","name":"n8n.bexnua.store","content":"5.189.150.66","ttl":1,"proxied":false}'
```
</example>

### 步驟二：VPS 環境設定

<step id="vps-setup">
在 Ubuntu 22.04 伺服器上安裝 Nginx 作為網頁伺服器與反向代理，並安裝 Certbot 及其 Nginx 插件以自動化申請 SSL 憑證。
</step>

| 項目 | 詳情 |
| :--- | :--- |
| VPS IP | 5.189.150.66 |
| 作業系統 | Ubuntu 22.04 |
| 已安裝套件 | nginx, certbot, python3-certbot-nginx |

<example>
執行以下命令完成安裝：
```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
```
</example>

### 步驟三：Nginx 反向代理配置

<step id="nginx-config">
設定 Nginx 將來自 `n8n.bexnua.store` 的 HTTP 請求反向代理至本機運行的 n8n 服務 (http://localhost:5678)。此配置同時包含對 WebSocket 的支援，這對 n8n 的正常運作至關重要。
</step>

**配置文件位置**：`/etc/nginx/sites-available/n8n`

<example>
配置內容如下：
```nginx
server {
    listen 80;
    server_name n8n.bexnua.store;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```
</example>

<step id="nginx-activation">
建立符號連結以啟用站點，並重新載入 Nginx 使配置生效。
```bash
ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```
</step>

### 步驟四：申請 Let's Encrypt SSL 憑證

<step id="ssl-request">
使用 Certbot 工具為 `n8n.bexnua.store` 域名自動申請 SSL 憑證，並讓 Certbot 自動修改 Nginx 配置以啟用 HTTPS。
</step>

| 項目 | 詳情 |
| :--- | :--- |
| 域名 | n8n.bexnua.store |
| 憑證簽發者 | Let's Encrypt (E8) |
| 簽發日期 | 2026-03-24 |
| 有效期至 | 2026-06-21 |

<example>
申請憑證的命令如下：
```bash
certbot --nginx -d n8n.bexnua.store --non-interactive --agree-tos -m admin@bexnua.store # [待確認：電子郵件地址公開，可能增加垃圾郵件風險]
```
申請成功後，Certbot 會自動設定定時任務以確憑證在到期前自動續約。
</example>

### 步驟五：HTTPS 連接驗證

<step id="https-validation">
完成上述所有設定後，進行一系列驗證以確保 HTTPS 連接正常且安全。
</step>

#### 測試 1：Webhook 端點連線測試

- **GET /webhook/get-config**：`curl -s -o /dev/null -w "%{http_code}" https://n8n.bexnua.store/webhook/get-config` -> **結果：HTTP 200**
- **POST /webhook/line-follow**：`curl -s -X POST https://n8n.bexnua.store/webhook/line-follow -H "Content-Type: application/json" -d '{"test":true}' -o /dev/null -w "%{http_code}"` -> **結果：HTTP 200**

#### 測試 2：SSL/TLS 憑證驗證

使用 `openssl` 命令驗證伺服器回傳的憑證是否正確。

- **主體 (Subject)**：CN = n8n.bexnua.store
- **簽發者 (Issuer)**：C = US, O = Let's Encrypt, CN = E8
- **TLS 版本**：TLSv1.3
- **結果**：憑證有效且正確配置

---

## 結論

本次任務已成功為 n8n 服務器 `n8n.bexnua.store` 部署了完整的 HTTPS 解決方案。從 DNS 設定到 SSL 憑證安裝及最終驗證，所有步驟均順利完成。服務目前已透過加密連線對外提供，且憑證已設定自動續約，確保了服務的長期穩定與安全。

---

## 維護與參考

<rule id="ssl-renewal">
**SSL 憑證自動續約**：已由 Certbot 自動設定，無需手動介入。可使用 `sudo certbot renew --dry-run` 進行測試。
</rule>

<rule id="nginx-websocket">
**Nginx 配置**：目前配置已包含對 WebSocket 的支援，若未來 n8n 功能更新需要額外設定，需同步更新此處配置。
</rule>

<rule id="cloudflare-proxy">
**Cloudflare Proxy**：在憑證成功申請後，可將 Cloudflare 的 Proxy 狀態改回 "Proxied" (橘色雲朵)，以啟用 CDN 和其他安全功能。
</rule>

### 可用端點

| 端點 | URL |
| :--- | :--- |
| 基礎 URL | `https://n8n.bexnua.store` |
| Config 查詢 | `https://n8n.bexnua.store/webhook/get-config` |
| LINE Follow | `https://n8n.bexnua.store/webhook/line-follow` |

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [N8N 工作流清單](godview-n8n-workflow-list.md) | 所有 workflow 的完整清單與節點說明 |
| [N8N 工作流結構](../../07-配置與環境/n8n-workflow-arch.md) | N8N 伺服器配置與 Webhook 端點總覽 |
| [N8N Cloudflare 設定分析](godview-n8n-cf-config-analysis.md) | Cloudflare 憑證與 D1 整合的深度分析 |
