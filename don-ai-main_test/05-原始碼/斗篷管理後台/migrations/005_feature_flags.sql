-- 005: Feature Flags 與規則路由化
-- 日期：2026-04-09

-- feature_flags 表：動態功能開關
CREATE TABLE IF NOT EXISTS feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_key TEXT NOT NULL UNIQUE,        -- 功能標識（如 "enable_fingerprint", "enable_action_verify"）
  flag_value TEXT NOT NULL DEFAULT '1', -- 值（可以是 "1"/"0" 或 JSON）
  description TEXT DEFAULT '',           -- 說明
  scope TEXT DEFAULT 'global',           -- 適用範圍：global / campaign:{id}
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- routing_rules 表：頁面路由規則
CREATE TABLE IF NOT EXISTS routing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- 規則名稱
  campaign_id TEXT DEFAULT '',           -- 綁定 campaign（空 = 全局）
  priority INTEGER DEFAULT 100,          -- 優先級
  conditions TEXT NOT NULL DEFAULT '{}', -- JSON 條件：{"country":"TW","os":"android","hour_range":"9-22"}
  action_type TEXT NOT NULL,             -- 動作類型：serve_template / redirect / block / pass
  action_params TEXT NOT NULL DEFAULT '{}', -- JSON 參數：{"template_id":"xxx","redirect_url":"xxx"}
  enabled INTEGER DEFAULT 1,
  hit_count INTEGER DEFAULT 0,
  last_hit_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key, scope);
CREATE INDEX IF NOT EXISTS idx_routing_rules_campaign ON routing_rules(campaign_id, priority, enabled);
