---
title: "LIFF 授權行為調研結果"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-03-28"
summary: "LIFF 在 LINE App 內的授權機制：首次使用免登入但必須經過 Channel Consent Screen 同意授權、後續使用免授權。LINE MINI App 的 Channel Consent Simplification 僅限日本/台灣且需 LINE 審核。"
id: "20260328-godview-liff-auth"
type: "analysis"
tags: [godview, line]
status: "active"
created: "2026-03-25"
updated: "2026-03-28"
---

> **TL;DR**: LIFF 在 LINE App 內的授權行為：首次使用時 LIFF SDK 自動獲取登入狀態（免輸入帳密），但仍必須顯示「Channel Consent Screen」要求用戶同意分享 LINE Profile 資料；後續使用同一 LIFF App 則不再顯示授權畫面。LINE 官方文件原文：「在 LINE App 之中開啟網頁可以省去『登入』的程序」——省去的是「登入」而非「授權」。LINE MINI App 提供「Channel Consent Simplification」可簡化流程，但僅限日本/台灣地區且需通過 LINE 官方審核。

# LIFF 授權行為調研結果

本文旨在探討 LINE Front-end Framework (LIFF) 在 LINE App 內的授權機制與使用者體驗。

---

## 核心發現

<rule id="liff-first-time-consent">

在 LINE App 中開啟 LIFF 頁面時，雖然使用者已登入 LINE，無需再次輸入帳號密碼，但**首次**使用該 LIFF App 仍必須經過「授權畫面 (Channel Consent Screen)」，同意開發者存取其個人資料。

</rule>

### LINE App 內的首次授權流程

- **自動登入**：當使用者在 LINE App 內開啟 LIFF 連結時，LIFF SDK 會自動獲取其登入狀態，免去手動登入的步驟。
- **首次授權**：然而，對於每一個 LIFF App，使用者在第一次開啟時都會看到授權畫面，要求同意分享其 LINE Profile 資料。
- **後續使用**：一旦使用者授權過一次，未來再次開啟同一個 LIFF App 時，將不再顯示授權畫面，實現無縫體驗。

### LINE MINI App 的特殊情況

- LINE MINI App 作為 LIFF 的一種特殊應用形式，提供了「管道同意簡化 (Channel Consent Simplification)」功能，可能可以進一步簡化授權流程。
- **適用限制**：此功能目前僅限於日本及台灣地區，且需要通過 LINE 官方的審核，不適用於一般 LIFF App。

---

## 相關佐證

### 官方文件佐證

> LINE 官方文件明確指出：「在 LINE App 之中開啟網頁可以省去『登入』的程序」。

<rule id="login-vs-consent">

這段話的關鍵在於，省去的是「登入 (Login)」步驟，而非「授權 (Consent)」。因此，首次使用的授權步驟依然是必要的。

</rule>

### 第三方資料佐證

> 一篇關於 LIFF 的部落格文章也提到：「點擊 LIFF 連結後需要先經過 LINE 的認證許可，要求你授權部分資料。」

此說法再次確認了 LIFF 首次使用時需要使用者授權。

---

## 結論

綜合以上發現，LIFF 解決方案在 LINE App 內的授權行為總結如下：

- **首次使用**：必須顯示授權畫面，使用者點擊「同意」即可完成，無需輸入帳號密碼。
- **後續使用**：不再需要授權，可直接進入應用程式。

因此，雖然無法完全避免首次的授權畫面，但在 LINE App 內的流程已相當簡化，提供了流暢的使用者體驗。

---

## 相關文件

| 文件 | 關係 |
| :--- | :--- |
| [godview-line-config-spec.md](godview-line-config-spec.md) | LINE 配置規範 |
| [godview-line-attr-final.md](godview-line-attr-final.md) | LINE 歸因最終方案 |
