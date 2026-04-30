-- 融合方案：為 campaigns 表新增 LIFF 和 LINE OA 相關欄位
-- 用途：shadow-cloak 從 campaigns 表讀取 liff_id 和 line_oa_id，
--       傳遞給 money-page 用於組裝 CTA 按鈕的 LIFF 連結
-- 日期：2026-04-03

ALTER TABLE campaigns ADD COLUMN liff_id TEXT DEFAULT '';
ALTER TABLE campaigns ADD COLUMN line_oa_id TEXT DEFAULT '';
