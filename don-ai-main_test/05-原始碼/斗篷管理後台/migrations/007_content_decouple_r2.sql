-- 007: 內容與風險系統解耦 + R2 素材管理
-- 日期：2026-04-09

-- assets 表：R2 素材索引
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_key TEXT NOT NULL UNIQUE,         -- R2 object key（如 "templates/safe/img1.jpg"）
  filename TEXT NOT NULL,                  -- 原始檔名
  content_type TEXT DEFAULT '',            -- MIME type
  size_bytes INTEGER DEFAULT 0,            -- 檔案大小
  r2_bucket TEXT DEFAULT 'cloak-assets',   -- R2 bucket 名稱
  category TEXT DEFAULT 'general',         -- 分類：template_image / template_css / template_js / general
  campaign_id TEXT DEFAULT '',             -- 關聯 campaign
  template_id INTEGER DEFAULT 0,           -- 關聯 template
  tags TEXT DEFAULT '[]',                  -- JSON 標籤陣列
  uploaded_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- content_api_logs 表：內容 API 操作日誌（解耦用）
CREATE TABLE IF NOT EXISTS content_api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,                 -- create / update / delete / rollback / upload
  resource_type TEXT NOT NULL,             -- template / variant / asset / flag
  resource_id TEXT DEFAULT '',
  operator TEXT DEFAULT 'system',
  details TEXT DEFAULT '{}',               -- JSON 操作詳情
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_key ON assets(asset_key);
CREATE INDEX IF NOT EXISTS idx_assets_campaign ON assets(campaign_id, category);
CREATE INDEX IF NOT EXISTS idx_assets_template ON assets(template_id);
CREATE INDEX IF NOT EXISTS idx_content_api_logs_op ON content_api_logs(operation, resource_type, created_at DESC);
