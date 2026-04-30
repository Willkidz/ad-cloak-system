---
title: "line-redirect-staging Worker 測試記錄與解析邏輯"
category: "project"
priority: "low"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "記錄 line-redirect-staging Worker 的 ad_code 解析邏輯（支援 pathname 與 query string）、正則表達式過濾規則、測試端點驗證結果及部署至正式版的標準流程。"
id: "20260328-godview-line-staging-log"
type: "log"
tags: [advertising, cloudflare-workers, deployment, godview, testing]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: 本文件記錄了 `line-redirect-staging` Worker 的核心解析邏輯更新。Worker 現在優先從 URL `pathname` 讀取 `ad_code`（如 `/CX06`），並保留對舊有 `?a=CX06` 格式的向後兼容性。解析過程受正則表達式 `/^[A-Z]{1,6}\d{1,4}$/` 嚴格過濾，以防止誤判 `/bc-event` 或 `/favicon.ico` 等路徑。Staging 環境已通過 8 項自動化測試案例，驗證了解析優先級與過濾規則的正確性。

# line-redirect-staging Worker 測試記錄

## 基本資訊

| 項目 | 值 |
| :--- | :--- |
| Worker 名稱 | line-redirect-staging |
| 測試版 URL | `https://line-redirect-staging.laoqin1689.workers.dev` |
| D1 綁定 | godview-clicks (`3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c`) |
| 部署日期 | 2026-03-27 |
| Version ID | `d5a9bad6-ce35-492c-ba41-d464ebc4ebbc` |

---

## 修改內容

### ad_code 讀取邏輯

<rule id="ad-code-logic">
修改後，`ad_code` 的讀取邏輯具備向後兼容性，支援以下兩種格式：

1.  **新格式（優先）**：從 URL `pathname` 讀取，例如 `/CX06` 會解析出 `ad_code = "CX06"`。
2.  **舊格式（Fallback）**：從 `?a=` query string 讀取，例如 `?a=CX06` 會解析出 `ad_code = "CX06"`。
3.  如果兩者皆無，則 `ad_code` 為空字串 `""`。
</rule>

### Pathname 過濾規則

<rule id="pathname-filter">
只有符合正則表達式 `/^[A-Z]{1,6}\d{1,4}$/` 的 `pathname` 才會被視為 `ad_code`。條件如下：

-   開頭為 1-6 個大寫英文字母。
-   結尾為 1-4 個數字。
-   範例：`CX06`、`BF01`、`N2001`、`MS05`。

以下路徑不會被誤判為 `ad_code`：
-   `/` (根路徑)
-   `/go` (全小寫)
-   `/bc-event` (包含連字號)
-   `/favicon.ico` (包含點號)
</rule>

### 新增測試端點

為了方便驗證 `ad_code` 的解析邏輯，僅在 staging 環境新增了 `GET /test-adcode` 端點，此端點不會將數據寫入 D1 資料庫。

**參數：**
-   `path`：模擬的 URL pathname (例如：`/CX06`)
-   `a`：模擬的 query string ad_code (例如：`CX06`)

---

## 測試方法與結果

### 使用測試端點驗證

<example id="curl-test-cases">
透過 `curl` 指令向 `/test-adcode` 端點發送請求，以驗證各種情況下的 `ad_code` 解析是否正確。

```bash
# 測試 1: 新格式 /CX06 (pathname)
curl -s "https://line-redirect-staging.laoqin1689.workers.dev/test-adcode?path=/CX06"
# 預期：resolved_ad_code = "CX06", method = "pathname"

# 測試 2: 舊格式 ?a=CX06 (query string)
curl -s "https://line-redirect-staging.laoqin1689.workers.dev/test-adcode?path=/&a=CX06"
# 預期：resolved_ad_code = "CX06", method = "query_string"

# 測試 8: 兩種格式並存 (新格式優先)
curl -s "https://line-redirect-staging.laoqin1689.workers.dev/test-adcode?path=/CX06&a=BF01"
# 預期：resolved_ad_code = "CX06", method = "pathname"
```
</example>

### 測試結果總表

所有 8 項測試案例均已通過 (2026-03-27)。

| 測試案例 | 輸入 | 預期 ad_code | 實際 ad_code | 解析方法 | 結果 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 新格式 /CX06 | `path=/CX06` | CX06 | CX06 | pathname | ✅ |
| 舊格式 ?a=CX06 | `path=/&a=CX06` | CX06 | CX06 | query_string | ✅ |
| 新格式 /BF01 | `path=/BF01` | BF01 | BF01 | pathname | ✅ |
| 非 ad_code /go | `path=/go` | "" | "" | none | ✅ |
| 根路徑 / | `path=/` | "" | "" | none | ✅ |
| /bc-event | `path=/bc-event` | "" | "" | none | ✅ |
| N 系列 /N2001 | `path=/N2001` | N2001 | N2001 | pathname | ✅ |
| 兩者都有 | `path=/CX06&a=BF01` | CX06 | CX06 | pathname | ✅ |

---

## 部署至正式版標準流程

確認 staging 環境測試無誤後，必須按照以下步驟部署至正式版：

<step id="remove-test-endpoint">
1. **移除測試端點**：從 staging 源碼中移除 `/test-adcode` 相關邏輯。
</step>

<step id="deploy-to-production">
2. **部署正式版**：將代碼部署到正式版 `line-redirect` Worker。
</step>

<step id="update-knowledge-base">
3. **同步知識庫**：更新 `05-原始碼/上帝視角/line-redirect-current.js` 文件。
</step>

<step id="update-versioning">
4. **版本更新**：更新版本號並在 `CHANGELOG.md` 中記錄改動。
</step>

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-redirect-worker-verify.md](godview-line-redirect-worker-verify.md) | 正式版 Worker 自動測試報告 |
| [godview-line-config-spec.md](godview-line-config-spec.md) | line_config D1 表維護規範 |
| [godview-link-format.md](godview-link-format.md) | 鏈結產生器格式規範 |
