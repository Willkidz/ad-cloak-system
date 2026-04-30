---
title: "斗篷系統功能測試清單 (T-01~T-04)"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-31"
summary: "列出真實環境下驗證斗篷系統核心功能與 BUG 修復的測試前提、步驟與預期結果。"
version: "v1.0"
date: "2026-03-31"
status: "pending"
---
# 斗篷系統功能測試清單

本測試清單用於在真實環境（台灣住宅 IP + 手機 UA）下驗證斗篷系統的核心功能，確保 BUG-001~010 修復後系統運作正常。

## 測試環境要求

- **網路環境**：台灣真實住宅 IP（不可使用 VPN、機房 IP 或代理）
- **設備要求**：真實手機（iOS/Android）或使用 Chrome DevTools 模擬真實手機 User-Agent
- **操作要求**：進入頁面後必須有真實的滑鼠滑動、點擊或螢幕觸控行為（通過 3 秒互動檢測）

---

## 測試項目一：T-01 過濾測試 (mopliv.site)

**測試目標**：驗證 `require_fbclid` 和 `cloak_country` 過濾條件是否正常運作。

### 步驟 1.1：無 fbclid 測試
1. **操作**：在瀏覽器訪問 [https://mopliv.site/](https://mopliv.site/)。
2. **預期結果**：頁面顯示 Safe Page（安全頁/健康頁），不顯示 Money Page（推廣頁）。
3. **驗證方式**：
   - 視覺確認頁面內容為安全頁。
   - 查詢 D1 `cloak_logs` 表，確認 `verdict = 'blocked'` 且 `reason` 包含 `Missing fbclid`。

### 步驟 1.2：有 fbclid 測試
1. **操作**：在瀏覽器訪問 [https://mopliv.site/?fbclid=test_tw_001](https://mopliv.site/?fbclid=test_tw_001)。
2. **預期結果**：頁面顯示 Money Page（推廣頁），並且頁面上的按鈕/連結被替換為 LINE 連結。
3. **驗證方式**：
   - 視覺確認頁面內容為推廣頁。
   - 點擊頁面上的 CTA 按鈕，應跳轉至 [https://line.me/ti/p/test](https://line.me/ti/p/test)。
   - 查詢 D1 `cloak_logs` 表，確認 `verdict = 'allowed'`。

---

## 測試項目二：T-02 分流輪替測試 (raxnto.shop)

**測試目標**：驗證 `link_strategy = 'round_robin'` 是否能正確平均分配流量到多個 LINE 連結。

### 步驟 2.1：多次點擊測試
1. **操作**：
   - 開啟無痕視窗，訪問 [https://raxnto.shop/?fbclid=test_rr_001](https://raxnto.shop/?fbclid=test_rr_001)。
   - 點擊頁面上的 CTA 按鈕，記錄跳轉的 LINE URL。
   - 關閉無痕視窗。
   - 重複上述步驟 3 次。
2. **預期結果**：3 次點擊應該分別跳轉到不同的 LINE 連結（順序可能不固定，但分佈應均勻）。
   - 連結 A：[https://line.me/ti/p/test1](https://line.me/ti/p/test1)
   - 連結 B：[https://line.me/ti/p/test2](https://line.me/ti/p/test2)
   - 連結 C：[https://line.me/ti/p/test3](https://line.me/ti/p/test3)
3. **驗證方式**：
   - 記錄每次跳轉的最終 URL。
   - 查詢 D1 `clicks` 表，確認 3 筆記錄的 `target_link` 分別對應上述 3 個不同的 URL。

---

## 測試項目三：T-03 固定 IP 測試 (zuntek.site)

**測試目標**：驗證 `ip_pinning = 1` 是否能確保同一 IP 多次訪問時，始終分配到同一個 LINE 連結。

### 步驟 3.1：同一 IP 多次訪問
1. **操作**：
   - 在當前網路環境下，開啟無痕視窗訪問 [https://zuntek.site/?fbclid=test_ip_001](https://zuntek.site/?fbclid=test_ip_001)。
   - 點擊 CTA 按鈕，記錄跳轉的 LINE URL（例如：test1）。
   - 關閉無痕視窗，重新開啟無痕視窗（確保不共用 Cookie，但保持相同 IP）。
   - 再次訪問 [https://zuntek.site/?fbclid=test_ip_002](https://zuntek.site/?fbclid=test_ip_002)。
   - 點擊 CTA 按鈕，記錄跳轉的 LINE URL。
2. **預期結果**：兩次點擊必須跳轉到**完全相同**的 LINE 連結。
3. **驗證方式**：
   - 比對兩次跳轉的 URL 是否一致。
   - 查詢 D1 `clicks` 表，確認這兩筆記錄的 `ip_address` 相同，且 `target_link` 也相同。

---

## 測試項目四：T-04 像素多綁定測試 (velphi.shop)

**測試目標**：驗證 `ad_pixels` 設定是否能正確將 Facebook Pixel 程式碼注入到放行的 HTML 中。

### 步驟 4.1：檢查 HTML 原始碼
1. **操作**：
   - 在瀏覽器訪問 [https://velphi.shop/?fbclid=test_px_001](https://velphi.shop/?fbclid=test_px_001) 並訪問。
   - 按下 `F12` 開啟開發者工具，切換到 `Elements` (元素) 面板。
   - 搜尋關鍵字 `fbq('init'` 或 `123456789`。
2. **預期結果**：HTML 的 `<head>` 區塊內必須包含 Facebook Pixel 的初始化程式碼，且 Pixel ID 為 `123456789`。
3. **驗證方式**：
   - 確認原始碼中存在 `<script>` 標籤包含 Pixel 注入邏輯。
   - 使用 Facebook Pixel Helper 擴充功能，確認頁面載入時有觸發 `PageView` 事件，且發送到 ID `123456789`。

---

## 測試報告填寫

測試完成後，請將結果更新至本文件，將 `status` 改為 `completed`，並在每個步驟後方註記：
- ✅ **Pass**：符合預期結果
- ❌ **Fail**：不符合預期結果（請附上錯誤截圖或 D1 查詢結果）
