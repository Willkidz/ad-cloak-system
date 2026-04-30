---
title: "前端 LIFF 分組選擇功能規格"
category: "project"
priority: "medium"
applicable_tools: "all"
last_updated: "2026-04-05"
summary: "定義 LIFF 分組一鍵選擇功能的前後端資料需求、操作流程與實作規格。"
version: "v1.0"
id: "20260406-LIFF-GROUP-SEL"
type: project-doc
tags: [cloak-admin, frontend, liff, group]
status: pending
created: "2026-04-06"
updated: "2026-04-06"
---
# 前端 LIFF 分組選擇功能規格

## 背景

目前在「分流鏈結」頁面的 LIFF 區塊中，使用者只能逐一選擇 TAG 來新增 LIFF 連結。用戶希望能夠像 AS 分組一樣，一鍵選擇整個分組（如 AB 莊家剋星），自動帶入該分組下所有 TAG 的 LIFF 連結。

## 現有架構（已支援）

後端 `/api/v1/liff-options` 端點已回傳每個選項的 `group_name` 欄位：

```json
{
  "id": "tag-jb",
  "tag": "jb",
  "name": "莊家剋星-百家專家",
  "label": "jb - 莊家剋星-百家專家",
  "liff_id": "2009664206-5BXVdqiL",
  "line_oa_id": "448nzdkf",
  "group_name": "AB 莊家劁星"
}
```

後端 `/api/v1/groups` 端點回傳完整的分組清單：

```json
{
  "success": true,
  "data": [
    { "prefix": "AS", "name": "爆分王", "label": "AS 爆分王", "tags": ["js", "cs", "ms", "ls"] },
    { "prefix": "AB", "name": "莊家剋星", "label": "AB 莊家剋星", "tags": ["jb", "cb", "mb", "n23"] },
    { "prefix": "AX", "name": "獨角仙", "label": "AX 獨角仙", "tags": ["jx", "cx", "mx", "lx"] },
    { "prefix": "BF", "name": "博富", "label": "BF 博富", "tags": ["bf", "jd"] }
  ]
}
```

`campaigns` 表的 `liff_links` 欄位是 JSON 陣列，已支援存儲多個 LIFF 連結。`shadow-cloak.js` 的輪替邏輯（Random / Round-robin / IP Hash）也已支援多連結。

**結論：後端和資料庫完全不需要修改。**

## 前端修改方案

### 修改位置

前端 React 源碼不在 `don-ai` 倉庫中，位於 cloak-admin 的獨立前端倉庫（透過 GitHub Actions 自動部署到 Cloudflare Pages）。修改檔案為 `Campaigns.tsx`。

### 修改內容

#### 1. 在 LIFF 區塊新增「依分組套用」下拉選單

在現有的「LINE LIFF 連結」區塊（綠色背景）的標題列旁邊，新增一個下拉選單：

```tsx
// 從 /api/v1/groups 取得分組清單
const [groups, setGroups] = useState<Group[]>([]);

useEffect(() => {
  fetch('/api/v1/groups')
    .then(res => res.json())
    .then(data => {
      if (data.success) setGroups(data.data.filter(g => g.tags.length > 0));
    });
}, []);

// 下拉選單 UI
<select onChange={(e) => handleGroupSelect(e.target.value)}>
  <option value="">依分組套用 LIFF...</option>
  {groups.map(g => (
    <option key={g.prefix} value={g.prefix}>
      {g.label}（{g.tags.length} 個）
    </option>
  ))}
</select>
```

#### 2. 實作 handleGroupSelect 函數

```tsx
const handleGroupSelect = (groupPrefix: string) => {
  if (!groupPrefix) return;
  
  // 找出該分組下所有 TAG 的 LIFF 連結
  const group = groups.find(g => g.prefix === groupPrefix);
  if (!group) return;
  
  const newLinks: string[] = [];
  for (const tag of group.tags) {
    const option = liffOptions.find(o => o.tag === tag);
    if (option && option.liff_id) {
      const url = `https://liff.line.me/${option.liff_id}`;
      // 避免重複加入
      if (!liffLinks.includes(url)) {
        newLinks.push(url);
      }
    }
  }
  
  setLiffLinks([...liffLinks, ...newLinks]);
};
```

#### 3. 顯示效果

選擇「AB 莊家剋星（4 個）」後，自動新增以下 4 個 LIFF 連結到列表中：
- `https://liff.line.me/2009664206-5BXVdqiL`（jb 莊家剋星-百家專家）
- `https://liff.line.me/2009664250-4BLc8ACL`（cb 莊家剋星-百家殺手）
- `https://liff.line.me/2009664180-r6eOVZ0D`（mb 莊家剋星-百家打莊姬）
- `https://liff.line.me/2009664169-l7pOctNZ`（n23 莊家剋星-百家GPT）

### 注意事項

1. 已存在的連結不會重複加入
2. 使用者仍可手動刪除不需要的連結
3. 分組套用後，分配策略（隨機/輪替/IP固定）沿用現有設定
4. N 系列每個 TAG 是獨立分組，選擇後只會加入 1 個連結

## 部署方式

修改 cloak-admin 前端倉庫的 `Campaigns.tsx`，push 後由 GitHub Actions 自動部署到 Cloudflare Pages。
