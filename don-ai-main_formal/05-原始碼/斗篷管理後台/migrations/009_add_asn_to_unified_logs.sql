-- 009: 在 unified_logs 加入 ASN 欄位
-- 日期：2026-04-12
-- 說明：新增 asn 欄位用於記錄訪客的自治系統號碼（Autonomous System Number）
--       資料來源：Cloudflare Workers 的 request.cf.asn

ALTER TABLE unified_logs ADD COLUMN asn TEXT DEFAULT '';

-- 索引（方便按 ASN 過濾查詢）
CREATE INDEX IF NOT EXISTS idx_unified_logs_asn ON unified_logs(asn);
