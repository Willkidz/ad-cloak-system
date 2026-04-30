-- ============================================================
-- 010_sync_schema.sql
-- 補齊 D1 中已存在但缺少 Migration 檔案的表與欄位
-- 此檔案僅用於文件補齊與新環境部署，不會在現有線上 D1 執行
-- 建立日期：2026-04-15
-- ============================================================

-- ─── 新增表：pixel_groups（像素組）─────────────────────────────────
CREATE TABLE IF NOT EXISTS pixel_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bm_id TEXT,
  bm_name TEXT,
  capi_token TEXT NOT NULL DEFAULT '',
  bc_pixel_id TEXT,
  bc_pixel_name TEXT,
  note TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── 新增表：pixel_group_ads（像素組下的廣告像素）──────────────────
CREATE TABLE IF NOT EXISTS pixel_group_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  tag TEXT NOT NULL DEFAULT '',
  pixel_id TEXT NOT NULL DEFAULT '',
  pixel_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES pixel_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pixel_group_ads_group_id ON pixel_group_ads(group_id);
CREATE INDEX IF NOT EXISTS idx_pixel_group_ads_tag ON pixel_group_ads(tag);

-- ─── 新增表：pixels_library（像素庫）──────────────────────────────
CREATE TABLE IF NOT EXISTS pixels_library (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  pixel_id TEXT DEFAULT '',
  token TEXT DEFAULT '',
  type TEXT DEFAULT 'AD',
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── 新增表：line_groups（LINE 產品組）─────────────────────────────
CREATE TABLE IF NOT EXISTS line_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  code TEXT,
  tags TEXT DEFAULT '',
  ad_prefixes TEXT DEFAULT '[]',
  description TEXT DEFAULT '',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ─── 新增表：capi_logs（CAPI 發送日誌）────────────────────────────
CREATE TABLE IF NOT EXISTS capi_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER,
  group_name TEXT DEFAULT '',
  tag TEXT DEFAULT '',
  pixel_id TEXT DEFAULT '',
  status_code INTEGER DEFAULT 0,
  success INTEGER DEFAULT 0,
  error_message TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_capi_logs_tag ON capi_logs(tag);
CREATE INDEX IF NOT EXISTS idx_capi_logs_created_at ON capi_logs(created_at);

-- ─── campaigns 表缺少的欄位 ───────────────────────────────────────
ALTER TABLE campaigns ADD COLUMN ad_pixels TEXT DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN bc_pixels TEXT DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN group_name TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN ip_pinning INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN liff_links TEXT DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN details_id TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN details_url TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN cloak_province TEXT DEFAULT '';

-- ─── line_config 表缺少的欄位 ─────────────────────────────────────
ALTER TABLE line_config ADD COLUMN channel_id TEXT DEFAULT '';
ALTER TABLE line_config ADD COLUMN channel_token TEXT DEFAULT '';
ALTER TABLE line_config ADD COLUMN group_name TEXT DEFAULT '';
ALTER TABLE line_config ADD COLUMN line_oa_id TEXT DEFAULT '';
