#!/usr/bin/env bash
set -euo pipefail

AUTH_FILE="/home/ubuntu/don-ai/07-配置與環境/auth-info-config.md"
ACCOUNT_ID="$(grep -m1 'Account ID' "$AUTH_FILE" | sed -E 's/.*`([^`]+)`.*/\1/')"
DB_ID="$(grep -m1 'godview-clicks' "$AUTH_FILE" | sed -E 's/.*`([^`]+)`.*/\1/')"
API_TOKEN="$(grep -m1 '| API Token |' "$AUTH_FILE" | sed -E 's/.*`([^`]+)`.*/\1/')"
API_URL="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query"

statements=(
  "CREATE TABLE IF NOT EXISTS feature_flags ( id INTEGER PRIMARY KEY AUTOINCREMENT, flag_key TEXT NOT NULL UNIQUE, flag_value TEXT NOT NULL DEFAULT '1', description TEXT DEFAULT '', scope TEXT DEFAULT 'global', enabled INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP )"
  "CREATE TABLE IF NOT EXISTS routing_rules ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, campaign_id TEXT DEFAULT '', priority INTEGER DEFAULT 100, conditions TEXT NOT NULL DEFAULT '{}', action_type TEXT NOT NULL, action_params TEXT NOT NULL DEFAULT '{}', enabled INTEGER DEFAULT 1, hit_count INTEGER DEFAULT 0, last_hit_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP )"
  "CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key, scope)"
  "CREATE INDEX IF NOT EXISTS idx_routing_rules_campaign ON routing_rules(campaign_id, priority, enabled)"
)

for sql in "${statements[@]}"; do
  payload=$(printf '{"sql":"%s"}' "$(printf '%s' "$sql" | sed 's/"/\\"/g')")
  response=$(curl -sS "$API_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H 'Content-Type: application/json' \
    --data "$payload")
  printf '%s\n' "$response"
  printf '%s\n' "$response" | grep '"success":true' >/dev/null
  echo "__OK__"
done
