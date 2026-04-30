CREATE TABLE ad_config (
  id INTEGER PRIMARY KEY,
  name TEXT,
  lineid TEXT,
  code TEXT,
  pixel TEXT,
  token TEXT,
  type TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE campaigns ( id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT, status TEXT DEFAULT 'active', safe_page_id TEXT, money_page_id TEXT, customer_links TEXT, short_codes TEXT, routing_strategy TEXT DEFAULT 'random', allowed_devices TEXT, require_residential BOOLEAN DEFAULT 0, pixel_tk TEXT, pixel_fb TEXT, pixel_ga TEXT, pixel_google_ad TEXT, pixel_google_conv TEXT, cloak_lang TEXT, cloak_os TEXT, cloak_os_version TEXT, cloak_country TEXT, cloak_region TEXT, cloak_traffic_source TEXT, safe_page_type TEXT, safe_page_action TEXT, safe_page_content TEXT, blacklist_rules TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP , title TEXT, link TEXT, country TEXT, template_id TEXT, line_links TEXT, whatsapp_links TEXT, other_links TEXT, link_strategy TEXT DEFAULT 'random', allow_desktop INTEGER DEFAULT 1, allow_mobile INTEGER DEFAULT 1, residential_only INTEGER DEFAULT 0, require_fbclid INTEGER DEFAULT 0, back_redirect_url TEXT DEFAULT '', exit_popup_text TEXT DEFAULT '', approved_at DATETIME DEFAULT NULL);

CREATE TABLE clicks (click_id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, tag TEXT NOT NULL, ad_code TEXT DEFAULT "", line_oa_id TEXT NOT NULL, ip_address TEXT DEFAULT "", user_agent TEXT DEFAULT "", accept_language TEXT DEFAULT "", ip_country TEXT DEFAULT "", ip_asn TEXT DEFAULT "", fbclid TEXT DEFAULT "", fbc TEXT DEFAULT "", fbp TEXT DEFAULT "", pixel_id TEXT DEFAULT "", capi_token TEXT DEFAULT "", pixels TEXT DEFAULT "[]", matched INTEGER DEFAULT 0, matched_at TEXT, matched_user_id TEXT, destination TEXT DEFAULT '', ip_city TEXT DEFAULT '', cf_colo TEXT DEFAULT '', tls_version TEXT DEFAULT '', http_protocol TEXT DEFAULT '', ip_region TEXT, ip_region_code TEXT, ip_postal_code TEXT, ip_timezone TEXT, ip_asn_org TEXT, os TEXT, os_version TEXT, device_model TEXT, device_brand TEXT, browser TEXT, browser_version TEXT, source_app TEXT, screen_resolution TEXT, is_bot INTEGER DEFAULT 0, referer TEXT, latitude TEXT, longitude TEXT, continent TEXT, client_tcp_rtt TEXT, visitor_id TEXT, routing_strategy TEXT, link_index INTEGER, target_link TEXT);

CREATE TABLE cloak_logs ( id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, ip TEXT, asn INTEGER, country TEXT, ua TEXT, verdict TEXT NOT NULL, reason TEXT, path TEXT, referer TEXT , visitor_id TEXT, language TEXT, domain TEXT, campaign_id TEXT);

CREATE TABLE domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  zone_id TEXT,
  status TEXT DEFAULT 'active',
  ssl_status TEXT,
  note TEXT,
  safety_status TEXT,
  safety_checked_at TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE line_config (
  id INTEGER PRIMARY KEY,
  tag TEXT,
  line TEXT,
  name TEXT,
  who TEXT,
  msg TEXT,
  destination TEXT,
  createdAt TEXT,
  updatedAt TEXT
, customer_links TEXT, routing_strategy TEXT DEFAULT 'random');

CREATE TABLE round_robin_state (tag TEXT PRIMARY KEY, current_index INTEGER DEFAULT 0);

CREATE TABLE scraped_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  mode TEXT DEFAULT 'fast',
  error_message TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  code TEXT NOT NULL,
  target_links TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(domain, code)
);

CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    country TEXT NOT NULL,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    content TEXT,
    thumbnail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);

CREATE INDEX idx_clicks_attribution ON clicks (line_oa_id, matched, timestamp DESC);

CREATE INDEX idx_clicks_dest ON clicks (destination, matched, timestamp DESC);

CREATE INDEX idx_clicks_ip ON clicks (ip_address, matched);

CREATE INDEX idx_templates_type ON templates(type);