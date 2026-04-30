---
title: "版本紀錄"
category: "project"
priority: "medium"
last_updated: "2026-04-10"
summary: "斗篷管理後台（Cloak Admin）的完整版本發佈紀錄，已更新至 v1.12.1。"
version: "v1.12.1"
---

# B 規劃組 — 版本紀錄

**專案**：斗篷管理後台（Cloak Admin）
**後台網址**：https://admin.bexnua.store
**組別**：B 規劃組
**紀錄更新日期**：2026-04-10（v1.12.1 pixel-groups CRUD 補齊 + campaign cloak 更新修補 + Cloudflare API 直傳部署）

---

## 版本命名規範

<rule id="version-naming">
格式為 v1.X，統一遞增流水號。A 和 B 規劃組共用同一條版本線 v1.x，流水號只增不減。每個版本紀錄必須標明「規劃組 / 版本號 / 功能名稱」。同一個功能模組同時間只會分配給一個規劃組，不會重複。新版本號以目前最大號 +1 為準，不回頭補號。
</rule>

| 版本號 | 歸屬 |
| :--- | :--- |
| v1.0~v1.7 | A 規劃組 |
| v1.8 | B 規劃組 |
| v1.9 | A 規劃組（下一個可用） |
| v1.10 | B 規劃組（visitor_id 串接） |
| v1.11.0 | B 規劃組（像素庫重構 pixel_groups + 域名動態 NS + CAPI 像素統一來源 + 素材中心升級） |
| v1.12.0 | B 規劃組（全域認證保護 + 操作日誌全面啟用 + 日誌系統可視化） |
| v1.12.1 | B 規劃組（pixel-groups CRUD 補齊 + campaign cloak 更新修補 + Cloudflare API 直傳部署） |

---

## B 規劃組版本（v1.8 起)

### v1.12.1 — pixel-groups CRUD 補齊 + campaign cloak 更新修補 + Cloudflare API 直傳部署

**狀態**：已完成 | **完成日期**：2026-04-10

#### 前端 (cloak-admin)
1. **前端維持既有介面**：本次未修改像素庫或 Campaign 編輯 UI，維持既有呼叫方式不變。
2. **相容既有 payload**：確認前端送出的 cloak 更新欄位可由修補後後端正確接受與持久化。

#### 後端 (cloak-admin-api)
1. **pixel-groups 完整 CRUD**：補齊 `/api/v1/pixel-groups` 的建立、列表、更新、刪除，以及 `/status` 狀態切換端點，對應 `pixel_groups` 與 `pixel_group_ads`。
2. **campaign cloak 更新修補**：修正 campaign 更新流程中的 cloak 欄位合併與寫回，讓 `cloak_country`、`cloak_region`、`cloak_lang`、`cloak_os`、`cloak_os_version`、`cloak_traffic_source` 與 `require_fbclid` 可在 live 環境穩定持久化。
3. **部署方式調整**：改以 Cloudflare Workers Script API 直接覆蓋部署 production Worker，避開互動式登入流程並保留既有 D1 / KV bindings。

#### Production 驗證
1. **pixel-groups live CRUD**：已於 production 建立、更新、切換狀態、刪除臨時測試群組並確認查詢結果同步變化。
2. **campaign live update**：已對既有 campaign `dd98e961-f2bf-4560-ac51-bdc9503bdbb8` 執行 cloak 欄位更新，回讀確認 `cloak_region` 等欄位已持久化。
3. **詳細紀錄**：請參閱 [`03-專案/斗篷管理後台/cloak-admin-v1-12-1-pixel-groups-cloak-fix.md`](../03-專案/斗篷管理後台/cloak-admin-v1-12-1-pixel-groups-cloak-fix.md)。

---

### v1.12.0 — 全域認證保護 + 操作日誌全面啟用 + 日誌系統可視化

**狀態**：已完成 | **完成日期**：2026-04-10

#### 前端 (cloak-admin)
1. **日誌可視化頁面**：新增 `Decisions.tsx`，提供雙 Tab 介面檢視 `decisions`（決策日誌）與 `interaction_events`（互動事件）。
2. **API 認證支援**：在 `api.ts` 的 axios 實例中加入 `X-API-Key` header，確保前端呼叫 API 時具備認證。
3. **導航更新**：在 `AppLayout.tsx` 中新增「日誌管理」選單，包含「決策審計」連結。

#### 後端 (cloak-admin-api)
1. **全域認證中間件**：在所有 `/api/*` 端點前加入 `X-API-Key` 驗證，使用 KV 中的 `admin_api_key` 作為密鑰。
2. **操作日誌 (Content API Logs)**：新增 `logContentChange()` 通用函數，全面覆蓋 Campaigns, Pixels, Domains, Shortlinks 等 20 個寫入端點，記錄操作人、資源類型、操作類型及變更詳情。
3. **日誌查詢 API**：
   - `GET /api/v1/decisions`：支援分頁、篩選與關鍵字搜索。
   - `GET /api/v1/interaction-events`：支援分頁與關鍵字搜索。

---

### v1.11.0 — 像素庫重構 pixel_groups + CAPI 像素統一來源 + 域名動態 NS + 素材中心升級

**狀態**：已完成 | **完成日期**：2026-04-07~08

（...內容省略...）

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [`CHANGELOG.md`](../CHANGELOG.md) | 根目錄的全局變更日誌 |
| [`01-核心原則/deploy-and-version-spec.md`](../01-核心原則/deploy-and-version-spec.md) | 版本號格式和 CHANGELOG 更新規範 |
| [`.ai/active-context.md`](../.ai/active-context.md) | 當前任務狀態（任務狀態唯一來源） |
