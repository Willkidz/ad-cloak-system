#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/don-ai"
MIGRATION_FILE="$REPO_DIR/05-原始碼/斗篷管理後台/migrations/004_layered_logging.sql"
LOG_FILE="$REPO_DIR/.ai/d1-layered-logging-migration.log"
ACCOUNT_ID="b2471e0c307123945bdf1ce1b025563f"
DATABASE_ID="3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c"
API_URL="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query"

TOKEN=$(grep -o 'cfut_[A-Za-z0-9]*' "$REPO_DIR/07-配置與環境/auth-info-config.md" | head -n 1)
if [ -z "$TOKEN" ]; then
  echo "[ERROR] 無法從 auth-info-config.md 讀取 Cloudflare API Token" | tee -a "$LOG_FILE"
  exit 1
fi

: > "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 開始執行 004_layered_logging.sql" | tee -a "$LOG_FILE"

mapfile -t STATEMENTS < <(awk '
BEGIN { stmt="" }
{
  line=$0
  sub(/^[[:space:]]+/, "", line)
  if (line ~ /^--/ || line == "") next
  stmt = stmt $0 "\n"
  if ($0 ~ /;[[:space:]]*$/) {
    gsub(/[[:space:]]+$/, "", stmt)
    print stmt
    stmt=""
  }
}
END {
  if (stmt != "") {
    gsub(/[[:space:]]+$/, "", stmt)
    print stmt
  }
}
' "$MIGRATION_FILE")

index=0
for sql in "${STATEMENTS[@]}"; do
  index=$((index + 1))
  compact_sql=$(printf '%s' "$sql" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')
  echo "[SQL $index] $compact_sql" | tee -a "$LOG_FILE"

  payload=$(printf '%s' "$sql" | jq -Rs '{sql: .}')
  response=$(curl -sS -X POST "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    --data "$payload")

  printf '%s\n' "$response" >> "$LOG_FILE"

  success=$(printf '%s' "$response" | jq -r '.success // false')
  error_msg=$(printf '%s' "$response" | jq -r '.errors[0].message // .result[0].error // empty')

  if [ "$success" = "true" ]; then
    echo "[OK] SQL $index 成功" | tee -a "$LOG_FILE"
    continue
  fi

  if printf '%s' "$compact_sql" | grep -q '^ALTER TABLE cloak_logs ADD COLUMN'; then
    if printf '%s' "$error_msg" | grep -Eqi 'duplicate column name|already exists'; then
      echo "[WARN] SQL $index 欄位已存在，依規則忽略並繼續" | tee -a "$LOG_FILE"
      continue
    fi
  fi

  echo "[ERROR] SQL $index 執行失敗：${error_msg:-unknown error}" | tee -a "$LOG_FILE"
  exit 1
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 004_layered_logging.sql 全部執行完成" | tee -a "$LOG_FILE"
