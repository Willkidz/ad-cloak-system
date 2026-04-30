-- 用途：將 LIFF_MAP 從程式硬編碼移入 D1 line_config，供 cloak-admin-api / line-redirect 動態讀取
-- 日期：2026-04-10
-- 說明：
-- 1. 若 tag 已存在，更新 liff_id 與 updatedAt
-- 2. 若 tag 不存在，插入最小可用資料（tag / line / liff_id）

UPDATE line_config SET line = '@678eohsd', liff_id = '2009663969-IhPVLFKy', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'bf';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'bf', '@678eohsd', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009663969-IhPVLFKy'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'bf');

UPDATE line_config SET line = '@416nbqjl', liff_id = '2009664103-Rot7yQE1', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n14';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n14', '@416nbqjl', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664103-Rot7yQE1'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n14');

UPDATE line_config SET line = '@745jaffa', liff_id = '2009664113-eUkzVtfO', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n15';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n15', '@745jaffa', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664113-eUkzVtfO'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n15');

UPDATE line_config SET line = '@751tggmd', liff_id = '2009664113-eUkzVtfO', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n16';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n16', '@751tggmd', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664113-eUkzVtfO'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n16');

UPDATE line_config SET line = '@106tndmh', liff_id = '2009664115-5jvKickJ', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n17';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n17', '@106tndmh', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664115-5jvKickJ'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n17');

UPDATE line_config SET line = '@013rgbjl', liff_id = '2009664124-VJz09CpT', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n18';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n18', '@013rgbjl', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664124-VJz09CpT'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n18');

UPDATE line_config SET line = '@536uhfpf', liff_id = '2009664132-5wcSZilB', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n19';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n19', '@536uhfpf', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664132-5wcSZilB'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n19');

UPDATE line_config SET line = '@348ikfwm', liff_id = '2009664135-dXsbiajG', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n20';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n20', '@348ikfwm', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664135-dXsbiajG'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n20');

UPDATE line_config SET line = '@075cocov', liff_id = '2009129136-BEXGdu4X', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n21';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n21', '@075cocov', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009129136-BEXGdu4X'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n21');

UPDATE line_config SET line = '@697jsdma', liff_id = '2009664141-OyQVNAp8', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'cx';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'cx', '@697jsdma', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664141-OyQVNAp8'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'cx');

UPDATE line_config SET line = '@652ahjmy', liff_id = '2009664145-Bm1nTzuI', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'jx';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'jx', '@652ahjmy', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664145-Bm1nTzuI'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'jx');

UPDATE line_config SET line = '@128hxyvp', liff_id = '2009664152-SUm42s6z', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'lx';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'lx', '@128hxyvp', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664152-SUm42s6z'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'lx');

UPDATE line_config SET line = '@525euwsy', liff_id = '2009664163-FloR5xP4', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'mx';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'mx', '@525euwsy', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664163-FloR5xP4'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'mx');

UPDATE line_config SET line = '@659jgxlp', liff_id = '2009664170-HW4ExLY7', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'n22';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'n22', '@659jgxlp', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664170-HW4ExLY7'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'n22');

UPDATE line_config SET line = '@520ufhmw', liff_id = '2009664200-1T7vs2Kg', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'jd';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'jd', '@520ufhmw', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664200-1T7vs2Kg'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'jd');

UPDATE line_config SET line = '@999hqlmk', liff_id = '2009664226-30WBtSHr', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'cs';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'cs', '@999hqlmk', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664226-30WBtSHr'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'cs');

UPDATE line_config SET line = '@001qlmgf', liff_id = '2009664174-m2cwlShg', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'ms';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'ms', '@001qlmgf', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664174-m2cwlShg'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'ms');

UPDATE line_config SET line = '@935bicyi', liff_id = '2009664189-W61JHYEk', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'js';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'js', '@935bicyi', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664189-W61JHYEk'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'js');

UPDATE line_config SET line = '@849rldxt', liff_id = '2009664186-7yVDrKDn', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'ls';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'ls', '@849rldxt', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664186-7yVDrKDn'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'ls');

UPDATE line_config SET line = '@448nzdkf', liff_id = '2009664206-5BXVdqiL', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'jb';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'jb', '@448nzdkf', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664206-5BXVdqiL'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'jb');

UPDATE line_config SET line = '@181pgtlc', liff_id = '2009664250-4BLc8ACL', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'cb';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'cb', '@181pgtlc', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664250-4BLc8ACL'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'cb');

UPDATE line_config SET line = '@734xzzse', liff_id = '2009664180-r6eOVZ0D', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'mb';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'mb', '@734xzzse', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664180-r6eOVZ0D'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'mb');

UPDATE line_config SET line = '@604yogby', liff_id = '2009664169-l7pOctNZ', updatedAt = CURRENT_TIMESTAMP WHERE LOWER(tag) = 'lb';
INSERT INTO line_config (tag, line, name, who, msg, destination, createdAt, updatedAt, customer_links, routing_strategy, liff_id)
SELECT 'lb', '@604yogby', '', '', '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '[]', 'random', '2009664169-l7pOctNZ'
WHERE NOT EXISTS (SELECT 1 FROM line_config WHERE LOWER(tag) = 'lb');
