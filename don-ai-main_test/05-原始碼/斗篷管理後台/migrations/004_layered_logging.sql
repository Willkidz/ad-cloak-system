-- 004: 分層日誌重構
-- 新增 interaction_events、decisions、rules 三張表
-- 日期：2026-04-09

-- 1. interaction_events 表：記錄頁面層互動事件
CREATE TABLE IF NOT EXISTS interaction_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,          -- 關聯入口層請求
  visitor_id TEXT NOT NULL,          -- 訪客 ID
  session_id TEXT DEFAULT '',        -- 會話 ID
  event_type TEXT NOT NULL,          -- 事件類型：fp_check / interaction_detect / cta_click / form_submit / no_interaction
  event_data TEXT DEFAULT '{}',      -- JSON：包含 fp_score, fp_details, interaction_count, time_on_page 等
  result TEXT NOT NULL,              -- passed / blocked / pending
  ip TEXT DEFAULT '',
  ua TEXT DEFAULT '',
  country TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  campaign_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. decisions 表：記錄每次最終決策
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,          -- 關聯入口層請求（與 cloak_logs 的同一次請求）
  visitor_id TEXT NOT NULL,
  session_id TEXT DEFAULT '',
  decision TEXT NOT NULL,            -- allowed / blocked / safe_page / money_page
  decision_layer TEXT NOT NULL,      -- 在哪一層做出決策：entry / page / action
  matched_rules TEXT DEFAULT '[]',   -- JSON 陣列：命中的規則 ID 列表
  reason TEXT DEFAULT '',            -- 決策原因摘要
  safe_page_id TEXT DEFAULT '',      -- 如果導向安全頁，用了哪個模板
  money_page_id TEXT DEFAULT '',     -- 如果導向金錢頁，用了哪個模板
  target_url TEXT DEFAULT '',        -- 最終跳轉目標
  ip TEXT DEFAULT '',
  ua TEXT DEFAULT '',
  country TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  campaign_id TEXT DEFAULT '',
  processing_time_ms INTEGER DEFAULT 0,  -- 處理耗時（毫秒）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. rules 表：規則配置化管理
-- 注意：舊版預設 rules seed INSERT 已移除，因 rules 表已退出 runtime 判定；此 migration 僅保留建表與索引。
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                -- 規則名稱（如 "台灣地區限定"、"Bot UA 過濾"）
  description TEXT DEFAULT '',       -- 規則說明
  rule_type TEXT NOT NULL,           -- 規則類型：country / bot / os / language / referer / traffic_source / fbclid / vpn / blacklist / fingerprint / interaction / custom
  layer TEXT NOT NULL,               -- 適用層級：entry / page / action
  priority INTEGER DEFAULT 100,      -- 優先級（數字越小越先執行）
  conditions TEXT NOT NULL,          -- JSON：規則條件 {"field": "country", "operator": "in", "value": ["TW","HK"]}
  action TEXT NOT NULL,              -- 命中後動作：block / allow / redirect / log_only
  action_params TEXT DEFAULT '{}',   -- JSON：動作參數（如 redirect URL）
  enabled INTEGER DEFAULT 1,         -- 是否啟用
  campaign_id TEXT DEFAULT '',       -- 綁定特定 campaign（空 = 全局規則）
  hit_count INTEGER DEFAULT 0,       -- 命中次數統計
  last_hit_at DATETIME,              -- 最後命中時間
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_interaction_events_request ON interaction_events(request_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_visitor ON interaction_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_interaction_events_type ON interaction_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_request ON decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_decisions_visitor ON decisions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_decisions_layer ON decisions(decision_layer, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(rule_type, enabled);
CREATE INDEX IF NOT EXISTS idx_rules_layer ON rules(layer, priority);
CREATE INDEX IF NOT EXISTS idx_rules_campaign ON rules(campaign_id, enabled);

-- 在 cloak_logs 表新增 request_id 欄位（如果不存在）
-- 注意：SQLite ALTER TABLE 不支援 IF NOT EXISTS，需要由執行端逐條容錯處理
ALTER TABLE cloak_logs ADD COLUMN request_id TEXT DEFAULT '';
ALTER TABLE cloak_logs ADD COLUMN session_id TEXT DEFAULT '';
ALTER TABLE cloak_logs ADD COLUMN processing_time_ms INTEGER DEFAULT 0;
