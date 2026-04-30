---
title: "新增域名操作手冊"
category: "sop"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "指導如何將新購買的域名（無論是在 Cloudflare 或其他註冊商購買）新增並綁定至斗篷系統，包含 DNS 設定、Worker Route 綁定與資料庫記錄新增的完整步驟。"
id: "20260328-SOP-002"
type: "sop"
tags: [cloudflare, cloudflare-d1, cloudflare-workers, dns, sop]
status: "active"
created: "2026-03-28"
updated: "2026-03-28"
activation_glob: null
---

> **TL;DR**: 本手冊說明如何將新域名接入斗篷系統（`shadow-cloak` Worker）。分兩種情況：Cloudflare 購買的域名可直接設定；其他註冊商購買的域名需先更改 Nameserver 至 Cloudflare。核心步驟為三步：設定 DNS 記錄並開啟 Proxied 代理 → 綁定 Worker Route 指向 `shadow-cloak` → 在 D1 資料庫 `campaigns` 表新增對應記錄（`theme` 欄位必須與域名完全一致）。

# 新增域名操作手冊

本手冊詳細說明如何將新購買的域名新增至斗篷系統（綁定 `shadow-cloak` Worker），確保流量能正確經過斗篷邏輯過濾。

---

## 情況一：在 Cloudflare 購買的域名

如果您直接在 Cloudflare 購買域名，該域名會自動加入您的 Cloudflare 帳號，無需手動更改 Nameserver。請按照以下步驟設定：

### 步驟 1：設定 DNS 記錄（開啟代理）

<step id="domain-cf-dns">

為了讓 Cloudflare Worker 能夠攔截並處理該域名的流量，必須確保域名的 DNS 記錄有開啟 Cloudflare 代理（橘色雲朵圖示）。

1. 登入 Cloudflare Dashboard，選擇您的域名。
2. 進入左側選單的 **DNS** -> **Records**。
3. 新增或修改以下兩筆記錄：
   - **Type**: `A` (或 `AAAA`)
   - **Name**: `@` (代表根域名，如 `example.com`)
   - **Content**: `192.0.2.1` (如果是 A 記錄，可填入任意佔位 IP，因為 Worker 會攔截請求；或填寫 `100::` 作為 AAAA 記錄)
   - **Proxy status**: **Proxied** (橘色雲朵必須開啟)
4. （可選）為 `www` 子域名新增相同的記錄，同樣開啟 **Proxied**。

</step>

### 步驟 2：綁定 Worker Route

<step id="domain-cf-route">

將域名的所有流量導向斗篷系統的核心 Worker (`shadow-cloak`)。

1. 在 Cloudflare Dashboard 左側選單，進入 **Workers Routes**。
2. 點擊 **Add route**。
3. 填寫以下資訊：
   - **Route**: `example.com/*` (將 `example.com` 替換為您的域名)
   - **Worker**: 選擇 `shadow-cloak`
4. 點擊 **Save**。
5. （可選）如果需要支援 `www`，請再新增一條 Route：`www.example.com/*`，同樣指向 `shadow-cloak`。

</step>

### 步驟 3：在 D1 資料庫新增 Campaign 記錄

<step id="domain-cf-d1">

斗篷系統需要知道這個域名的存在，否則會嘗試將請求轉發回源站（導致 522 錯誤）。

1. 進入 Cloudflare Dashboard 左側選單的 **Workers & Pages** -> **D1**。
2. 選擇資料庫 `godview-clicks`。
3. 進入 **Console** 標籤頁。
4. 執行以下 SQL 語法（請將 `example.com` 替換為您的域名）：

```sql
INSERT INTO campaigns (
    id, name, theme, status, country, cloak_country,
    customer_links, routing_strategy, allowed_devices,
    require_residential, residential_only, require_fbclid,
    allow_desktop, allow_mobile,
    back_redirect_url, exit_popup_text,
    short_codes, line_links, whatsapp_links, other_links,
    blacklist_rules, link_strategy,
    safe_page_id, money_page_id,
    pixel_tk, pixel_fb, pixel_ga, pixel_google_ad, pixel_google_conv,
    cloak_lang, cloak_os, cloak_os_version, cloak_region, cloak_traffic_source,
    safe_page_type, safe_page_action, safe_page_content,
    title, link, template_id
) VALUES (
    lower(hex(randomblob(16))), 'example.com 斗篷', 'example.com', 'active', 'TW', 'TW',
    '[]', 'random', '[]',
    0, 0, 0,
    1, 1,
    '', '',
    '[]', '[]', '[]', '[]',
    '[]', 'random',
    'health', '',
    '', '', '', '', '',
    '', '', '', '', '',
    '', '', '',
    'example.com 斗篷', '', ''
);
```

</step>

<rule id="domain-theme-match">

> **重要**：`theme` 欄位必須與您的域名完全一致，Worker 才能正確匹配。若 `theme` 不匹配，Worker 會找不到對應的 Campaign 配置，導致 522 錯誤。

</rule>

---

## 情況二：在其他地方購買的域名（如 GoDaddy, Namecheap）

如果域名是在其他註冊商購買的，您需要先將域名的 DNS 解析權交給 Cloudflare。

### 步驟 1：將域名加入 Cloudflare

<step id="domain-ext-add">

1. 登入 Cloudflare Dashboard。
2. 點擊右上角的 **Add a Site**。
3. 輸入您的域名（例如 `example.com`），點擊 **Continue**。
4. 選擇 **Free** 方案（免費版即可），點擊 **Continue**。
5. Cloudflare 會掃描現有的 DNS 記錄，確認無誤後點擊 **Continue**。

</step>

### 步驟 2：更改 Nameserver（名稱伺服器）

<step id="domain-ext-ns">

Cloudflare 會提供兩組 Nameserver（例如 `amy.ns.cloudflare.com` 和 `bob.ns.cloudflare.com`）。

1. 登入您購買域名的註冊商後台（如 GoDaddy, Namecheap）。
2. 找到該域名的 **DNS 管理** 或 **Nameserver 設定**。
3. 選擇「自訂 Nameserver」，並將原有的 Nameserver 替換為 Cloudflare 提供的兩組 Nameserver。
4. 儲存設定。
5. 回到 Cloudflare Dashboard，點擊 **Done, check nameservers**。

> **提示**：Nameserver 的更改可能需要幾分鐘到 24 小時不等的時間生效。當 Cloudflare 顯示域名狀態為 **Active** 時，代表接管成功。

</step>

### 步驟 3：執行後續設定

<step id="domain-ext-continue">

當域名在 Cloudflare 狀態變為 **Active** 後，請接續執行【情況一】中的三個步驟：

1. **設定 DNS 記錄（開啟代理）**：見上方步驟 1
2. **綁定 Worker Route**：見上方步驟 2
3. **在 D1 資料庫新增 Campaign 記錄**：見上方步驟 3

</step>

---

## 驗證是否新增成功

完成上述所有步驟後，請透過以下方式驗證域名是否已成功接入斗篷系統：

### 1. 瀏覽器直接訪問測試

<step id="domain-verify-browser">

1. 打開瀏覽器（建議使用無痕模式）。
2. 在網址列輸入您的域名：`https://example.com/`
3. **預期結果**：
   - 頁面應能正常載入，且 HTTP 狀態碼為 `200 OK`。
   - 由於您是直接訪問（沒有帶特定的廣告參數或 Referer），斗篷系統應將您判定為一般訪客，並顯示**安全頁面**（例如預設的 `health` 模板：悅康健康生活平台）。
   - 如果出現 `522 Connection timed out`，代表 DNS 有開啟代理且 Worker Route 有生效，但 **D1 資料庫中沒有對應的 Campaign 記錄**（Worker 找不到配置，嘗試回源失敗）。
   - 如果出現 `DNS_PROBE_FINISHED_NXDOMAIN` 或無法連線，代表 DNS 記錄未設定正確。

</step>

### 2. 終端機指令測試（進階）

<step id="domain-verify-curl">

您可以使用 `curl` 指令快速檢查 HTTP 回應狀態：

```bash
curl -I https://example.com/
```

**預期輸出**：
```text
HTTP/2 200 
date: ...
content-type: text/html; charset=utf-8
...
server: cloudflare
```

只要第一行顯示 `HTTP/2 200`，即代表斗篷系統已成功接管該域名的流量。

</step>

---

## 常見問題排除

<boundaries>

| 錯誤現象 | 可能原因 | 解決方式 |
| :--- | :--- | :--- |
| `522 Connection timed out` | D1 資料庫缺少 Campaign 記錄 | 執行步驟 3 的 SQL 插入語句 |
| `DNS_PROBE_FINISHED_NXDOMAIN` | DNS 記錄未設定或 Nameserver 未生效 | 檢查 DNS 記錄與 Nameserver 設定 |
| 頁面顯示但非安全頁面 | `theme` 欄位與域名不匹配 | 確認 D1 中 `theme` 欄位與域名完全一致 |
| Worker Route 未生效 | DNS 記錄未開啟 Proxied | 確認橘色雲朵圖示已開啟 |

</boundaries>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`06-SOP流程/deploy-sop.md`](deploy-sop.md) | 部署流程 SOP（Worker 部署相關） |
| [`06-SOP流程/acceptance-checklist.md`](acceptance-checklist.md) | 部署後驗收清單 |
| [`07-配置與環境/service-list-config.md`](../07-配置與環境/service-list-config.md) | 服務清單與域名對照 |
| [`00-系統索引/common-cmd.md`](../00-系統索引/common-cmd.md) | 常用命令參考 |
