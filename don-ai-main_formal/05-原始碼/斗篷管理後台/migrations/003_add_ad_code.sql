-- 003: 新增廣告代號（ad_code）欄位
-- 用途：追蹤每條廣告的表現（例如 n2101、n2102）
-- 日期：2026-04-03

ALTER TABLE campaigns ADD COLUMN ad_code TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN ad_code TEXT DEFAULT '';
ALTER TABLE line_user_bindings ADD COLUMN ad_code TEXT DEFAULT '';
