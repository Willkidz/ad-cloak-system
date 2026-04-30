#!/usr/bin/env python3
import json
import re
from pathlib import Path

import requests

REPO_DIR = Path('/home/ubuntu/don-ai')
MIGRATION_FILE = REPO_DIR / '05-原始碼/斗篷管理後台/migrations/004_layered_logging.sql'
AUTH_FILE = REPO_DIR / '07-配置與環境/auth-info-config.md'
LOG_FILE = REPO_DIR / '.ai/d1-layered-logging-migration.log'
ACCOUNT_ID = 'b2471e0c307123945bdf1ce1b025563f'
DATABASE_ID = '3f7ed41d-1ec6-4519-8b0d-eda22ae9b00c'
API_URL = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DATABASE_ID}/query'


def load_token() -> str:
    content = AUTH_FILE.read_text(encoding='utf-8')
    match = re.search(r'cfut_[A-Za-z0-9]+', content)
    if not match:
        raise RuntimeError('無法從 auth-info-config.md 讀取 Cloudflare API Token')
    return match.group(0)


def split_statements(sql_text: str) -> list[str]:
    statements: list[str] = []
    buffer: list[str] = []
    for raw_line in sql_text.splitlines():
        stripped = raw_line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        buffer.append(raw_line)
        if stripped.endswith(';'):
            statement = '\n'.join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []
    if buffer:
        statement = '\n'.join(buffer).strip()
        if statement:
            statements.append(statement)
    return statements


def append_log(message: str) -> None:
    with LOG_FILE.open('a', encoding='utf-8') as fh:
        fh.write(message + '\n')


def main() -> int:
    LOG_FILE.write_text('', encoding='utf-8')
    append_log('開始執行 004_layered_logging.sql')

    token = load_token()
    sql_text = MIGRATION_FILE.read_text(encoding='utf-8')
    statements = split_statements(sql_text)
    if not statements:
        raise RuntimeError('未解析到任何 SQL statement')

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    for idx, sql in enumerate(statements, start=1):
        compact_sql = ' '.join(sql.split())
        append_log(f'[SQL {idx}] {compact_sql}')
        resp = requests.post(API_URL, headers=headers, json={'sql': sql}, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        append_log(json.dumps(data, ensure_ascii=False))

        if data.get('success') is True:
            append_log(f'[OK] SQL {idx} 成功')
            continue

        error_msg = ''
        errors = data.get('errors') or []
        if errors:
            error_msg = errors[0].get('message', '')
        if not error_msg:
            result = data.get('result') or []
            if result and isinstance(result[0], dict):
                error_msg = result[0].get('error', '')

        if compact_sql.startswith('ALTER TABLE cloak_logs ADD COLUMN') and re.search(r'duplicate column name|already exists', error_msg, re.I):
            append_log(f'[WARN] SQL {idx} 欄位已存在，忽略：{error_msg}')
            continue

        raise RuntimeError(f'SQL {idx} 執行失敗：{error_msg or "unknown error"}')

    append_log('004_layered_logging.sql 全部執行完成')
    print(str(LOG_FILE))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
