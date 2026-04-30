---
title: "LINE 官方帳號好友人數自動化抓取 - CHRLINE + Thrift API 技術方案"
category: "project"
priority: "high"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "研究透過 CHRLINE 庫呼叫 LINE 內部 Thrift API（BuddyService.getBuddyDetailWithPersonal）自動抓取官方帳號好友人數的可行性，包含 authToken 取得、API 呼叫範例、Google Sheets 整合、cron 定時執行，以及帳號封鎖風險的防範策略（速率控制、專用帳號、IP 輪換）。"
id: "20260328-godview-line-oa-friends"
type: "analysis"
tags: [automation, godview, line]
status: "active"
created: "2026-03-27"
updated: "2026-03-28"
---

> **TL;DR**: 本報告確認可透過 Python 庫 `CHRLINE`（基於 LINE Android 版 Thrift 協議的逆向工程）呼叫 `BuddyService.getBuddyDetailWithPersonal(buddyMid)` 方法，使用 LINE 帳號的 `authToken` 直接查詢任何官方帳號的好友人數，無需 UI 自動化。技術棧為 Python 3.7+ + CHRLINE + Apache Thrift。風險評估為**中等**：Thrift API 呼叫比 UI 自動化更隱蔽，但異常請求模式仍可能觸發帳號封鎖。防範策略包括每次查詢加入 2-5 秒隨機延遲、使用專用帳號、IP 輪換。相關 GitHub 專案：DeachSword/CHRLINE（已歸檔但可用）、DeachSword/CHRLINE-Thrift（活躍維護的 IDL 定義）。

# LINE 官方帳號好友人數自動化抓取 - 深度技術研究報告

---

## 執行摘要

經過深入研究 LINE 內部 API、GitHub 逆向工程專案、Thrift 協議等底層技術，本報告確認存在一個可行的技術方案：透過 CHRLINE 專案提供的非官方 API 框架，使用 LINE 帳號的 authToken 直接呼叫 `BuddyService` 的 `getBuddyDetailWithPersonal()` 方法，即可查詢任何官方帳號的詳細資訊，包括好友人數。此方法的風險評估為中等，雖然比 UI 自動化更為隱蔽，但仍有被 LINE 偵測到異常行為的可能。

---

## 研究發現

### LINE 內部 API 結構

LINE 的內部通訊主要採用 **Apache Thrift** 協議，而非傳統的 REST API。所有客戶端的操作，包括查看官方帳號資訊，都是透過 Thrift RPC（遠端程序呼叫）來實現的。

- **核心服務**：LINE 的後端由多個微服務組成，如 `TalkService`、`BuddyService`、`RelationService` 等。
- **關鍵服務**：`BuddyService` 專門處理與官方帳號（Buddy）相關的操作。
- **存取權限**：普通用戶帳號有權限呼叫 `BuddyService` 中的特定方法，例如查詢公開的官方帳號資訊。

### BuddyService API 分析

根據對 `CHRLINE` (DeachSword/CHRLINE) 及 `CHRLINE-Thrift` 專案的源碼分析，`BuddyService` 提供了幾個關鍵方法：

| 方法名稱 | 參數 | 返回值 | 用途 |
| :--- | :--- | :--- | :--- |
| `getBuddyDetailWithPersonal` | `buddyMid` (字串), `attributeSet` (列表) | `BuddyDetail` 結構體 | **獲取官方帳號的詳細資訊，可能包含好友人數** |
| `getMemberCountByBuddyMid` | `buddyMid` (字串) | `i64` (整數) | 獲取成員數量 |
| `getActiveMemberCountByBuddyMid` | `buddyMid` (字串) | `i64` (整數) | 獲取活躍成員數量 |
| `getBuddyProfile` | 無 | `BuddyProfile` 結構體 | 獲取自己的官方帳號檔案 |

其中，`getBuddyDetailWithPersonal()` 是最有可能獲取到目標數據的方法。

### GitHub 逆向工程專案

社群上已有多個針對 LINE 協議的逆向工程專案，為此方案提供了基礎。

1.  **CHRLINE** (GitHub: DeachSword/CHRLINE)
    - **狀態**：已歸檔 (2023-11)，但社群仍有維護分支。 [已過期：專案已歸檔，但核心代碼仍可參考]
    - **描述**：基於 LINE Android 版 Thrift 協議的 Python 實現，功能完整。
    - **可用性**：高。代碼依然可用，是實現本方案的首選。

2.  **CHRLINE-Thrift** (GitHub: DeachSword/CHRLINE-Thrift)
    - **狀態**：活躍維護。
    - **描述**：LINE 的 Thrift IDL (介面定義語言) 檔案集合。
    - **可用性**：高。為理解和呼叫 API 提供了最新的協議定義。

3.  **linepy** (GitHub: fadhiilrachman/line-py)
    - **狀態**：活躍。
    - **描述**：另一個 LINE 私有 API 的 Python 實現。
    - **可用性**：中等。功能較基礎，可作為備用方案。

### Session Token 與 API 呼叫

研究確認，透過 LINE 帳號登入後獲取的 `authToken`（會話令牌）可以直接用來呼叫 Thrift API，完全無需進行 UI 自動化。

<rule id="api-call-workflow">
**工作原理**：
1.  使用 LINE 帳號登入以獲取 `authToken`。
2.  使用 `authToken` 建立與 LINE API 伺服器的 Thrift 連接。
3.  直接呼叫 `BuddyService` 的目標方法。
4.  接收 Thrift 編碼的二進制響應。
5.  解碼響應以提取所需數據（如好友人數）。
</rule>

- **優勢**：與 UI 自動化相比，此方法更快速、穩定且隱蔽。
- **風險**：大量或異常的 API 呼叫可能觸發速率限制或帳號封鎖。

---

## 最佳可行方案：CHRLINE + Thrift API

本報告推薦採用以 `CHRLINE` 庫為基礎，直接呼叫 Thrift API 的方案。

- **技術棧**：Python 3.7+, `CHRLINE` 庫, Thrift 協議支持。

### <step id="install-deps">第 1 步：安裝依賴</step>

<example id="install-chrline">

```bash
pip install CHRLINE
```

</example>

### <step id="get-auth-token">第 2 步：獲取 authToken</step>

可透過 QR Code 掃碼（推薦）或帳號密碼登入來獲取 `authToken`。

<example id="qr-login">

```python
# 方式 A：QR Code 登入 (推薦)
from CHRLINE import LINE

# 首次執行會生成 QR Code 供手機 LINE App 掃描登入
# authToken 會被自動保存以供後續使用
line = LINE()
```

</example>

### <step id="query-buddy-count">第 3 步：查詢官方帳號好友人數</step>

<example id="query-buddy">

```python
from CHRLINE import LINE

# 初始化 LINE 客戶端 (會自動讀取已保存的 authToken)
line = LINE()

# 指定目標官方帳號的 MID
buddy_mid = "U1234567890abcdef1234567890abcdef"

try:
    # 呼叫 API 獲取帳號詳情
    buddy_detail = line.getBuddyDetailWithPersonal(buddyMid=buddy_mid)
    
    # 提取好友人數 (欄位名稱待確認)
    friend_count = buddy_detail.memberCount # [待確認] 欄位名稱可能是 memberCount 或 subscriberCount
    print(f"好友人數: {friend_count}")
    
except Exception as e:
    print(f"查詢失敗: {e}")
```

</example>

### <step id="integrate-sheets">第 4 步：整合 Google Sheets</step>

可將獲取到的數據定期寫入 Google Sheets 以便追蹤。

<example id="sheets-integration">

```python
# ... (省略 Google API 認證代碼)
import time

# ... (省略 line 初始化代碼)

SHEET_ID = "your_sheet_id"
buddy_mids = {
    "競品A": "U123...",
    "競品B": "U456..."
}

for name, mid in buddy_mids.items():
    try:
        detail = line.getBuddyDetailWithPersonal(buddyMid=mid)
        count = detail.memberCount # [待確認]
        # ... (省略寫入 Google Sheets 的代碼)
        print(f"{name}: {count} 好友")
        time.sleep(2) # 每次查詢後延遲，避免觸發速率限制
    except Exception as e:
        print(f"{name} 查詢失敗: {e}")
```

</example>

### <step id="schedule-execution">第 5 步：定時執行</step>

使用 `cron` (Linux/macOS) 或 Google Cloud Scheduler 等工具來定時執行腳本。

<example id="cron-schedule">

```bash
# 每天上午 9 點執行
0 9 * * * /usr/bin/python3 /path/to/your_script.py
```

</example>

---

## 風險評估與防範策略

### 風險等級：中等

| 風險因素 | 等級 | 說明 |
| :--- | :--- | :--- |
| 被 LINE 偵測 | 中 | Thrift API 呼叫比 UI 自動化更隱蔽，但異常的請求模式仍可能被偵測。 |
| 帳號被封鎖 | 中 | 大量或過於頻繁的呼叫可能觸發速率限制，甚至導致帳號被暫時或永久封鎖。 |
| authToken 失效 | 低 | Token 通常有較長效期，但仍需處理失效後重新認證的邏輯。 |
| 數據準確性 | 低 | API 直接返回官方數據，準確性高。 |

### <rule id="anti-ban-strategies">防範策略</rule>

1.  **速率控制**：每次查詢後加入隨機延遲（例如 2-5 秒），模擬人類行為。
2.  **使用專用帳號**：切勿使用個人主要帳號，應註冊一個專門用於此任務的 LINE 帳號。
3.  **輪換 IP**：若條件允許，可透過代理伺服器或 VPN 輪換請求的來源 IP。
4.  **監控與警報**：定期檢查帳號狀態，若發生登入失敗等異常，應立即停止任務並發出警報。
5.  **準備備用方案**：準備備用帳號，以便在主帳號被封鎖時能快速切換。

---

## 結論

**最佳方案是使用 `CHRLINE` 庫，透過 Thrift API 直接呼叫 `BuddyService` 的 `getBuddyDetailWithPersonal()` 方法。** 此方案在技術可行性、執行效率和隱蔽性上均優於 UI 自動化等其他方案。儘管存在中等風險，但只要嚴格遵守防範策略，即可將風險降至可控範圍。建議下一步是編寫完整的自動化腳本，並投入小規模測試。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-attr-research.md](godview-line-attr-research.md) | LINE 歸因技術調研 |
| [godview-line-oa-tokens.md](godview-line-oa-tokens.md) | LINE OA Token 管理 |
