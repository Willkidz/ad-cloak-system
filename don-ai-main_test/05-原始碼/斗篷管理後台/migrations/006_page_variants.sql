-- 006: Page Variants 與模板版本治理
-- 日期：2026-04-09

-- page_variants 表：頁面變體管理
CREATE TABLE IF NOT EXISTS page_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL,              -- 所屬 campaign
  variant_name TEXT NOT NULL,             -- 變體名稱（如 "safe_v1", "money_v2_tw"）
  page_type TEXT NOT NULL,                -- 頁面類型：safe_page / money_page
  template_id INTEGER,                    -- 關聯 templates 表的 ID
  conditions TEXT DEFAULT '{}',           -- JSON 條件：{"country":["TW"],"os":"android","hour_range":"9-22","weight":50}
  weight INTEGER DEFAULT 100,             -- A/B 測試權重（0-100）
  enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 100,           -- 優先級（數字越小越先匹配）
  impression_count INTEGER DEFAULT 0,     -- 曝光次數
  click_count INTEGER DEFAULT 0,          -- 點擊次數
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- template_versions 表：模板版本歷史
CREATE TABLE IF NOT EXISTS template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,           -- 關聯 templates 表的 ID
  version INTEGER NOT NULL DEFAULT 1,     -- 版本號
  content TEXT NOT NULL,                  -- 該版本的完整 HTML 內容
  change_note TEXT DEFAULT '',            -- 變更說明
  created_by TEXT DEFAULT 'system',       -- 建立者
  is_active INTEGER DEFAULT 0,            -- 是否為當前啟用版本
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 在 templates 表新增版本相關欄位
ALTER TABLE templates ADD COLUMN current_version INTEGER DEFAULT 1;
ALTER TABLE templates ADD COLUMN version_count INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_page_variants_campaign ON page_variants(campaign_id, page_type, enabled);
CREATE INDEX IF NOT EXISTS idx_page_variants_priority ON page_variants(priority, weight);
CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_template_versions_active ON template_versions(template_id, is_active);
