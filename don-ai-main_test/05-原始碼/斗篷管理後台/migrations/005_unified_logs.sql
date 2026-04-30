-- 005: 日誌表統一合併
-- 將 cloak_logs + decisions + interaction_events 合併為 unified_logs
-- 日期：2026-04-11

-- 1. 建立 unified_logs 表
CREATE TABLE IF NOT EXISTS unified_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 基礎識別
  request_id TEXT NOT NULL DEFAULT '',
  visitor_id TEXT NOT NULL DEFAULT '',
  session_id TEXT DEFAULT '',

  -- 事件分類
  event_type TEXT NOT NULL,
  -- 可選值：visit, cloak_block, money_page_served, safe_page_served,
  --         button_click, safe_page_button, money_page_button,
  --         fp_check, interaction_detect, jwt_passed, jwt_expired,
  --         bot_blocked, country_blocked, verified_bot, redirect_to_link

  -- 結果與原因
  verdict TEXT NOT NULL DEFAULT '',
  reason TEXT DEFAULT '',
  decision_layer TEXT DEFAULT '',
  matched_rules TEXT DEFAULT '[]',
  result TEXT DEFAULT '',

  -- 頁面資訊
  safe_page_id TEXT DEFAULT '',
  money_page_id TEXT DEFAULT '',
  target_url TEXT DEFAULT '',
  path TEXT DEFAULT '',

  -- 訪客資訊
  ip TEXT DEFAULT '',
  ua TEXT DEFAULT '',
  country TEXT DEFAULT '',
  language TEXT DEFAULT '',
  referer TEXT DEFAULT '',
  domain TEXT DEFAULT '',

  -- 歸因資訊（新增）
  tag TEXT DEFAULT '',
  ad_code TEXT DEFAULT '',
  fbclid TEXT DEFAULT '',
  fbc TEXT DEFAULT '',
  fbp TEXT DEFAULT '',
  pixel_id TEXT DEFAULT '',

  -- 廣告活動
  campaign_id TEXT DEFAULT '',

  -- 事件詳情
  event_data TEXT DEFAULT '{}',

  -- 性能
  processing_time_ms INTEGER DEFAULT 0,

  -- 時間
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_unified_logs_event_type ON unified_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_unified_logs_created_at ON unified_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_unified_logs_type_time ON unified_logs(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_unified_logs_campaign ON unified_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_unified_logs_visitor ON unified_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_unified_logs_ip ON unified_logs(ip);
CREATE INDEX IF NOT EXISTS idx_unified_logs_domain ON unified_logs(domain);
