-- ============================================================
-- Aqualife - Seed data for development/testing
-- Run AFTER schema.sql:
--   psql -U postgres -d aqualife -f schema/schema.sql
--   psql -U postgres -d aqualife -f seed/seed.sql
--
-- TEST CREDENTIALS (development only - do not use in production):
--   Admin:    admin@aqualife.com    / Admin@123
--   Customer: khach1@aqualife.com   / Customer@123
--   Customer: khach2@aqualife.com   / Customer@123
--   Customer: khach3@aqualife.com   / Customer@123
-- ============================================================

-- ------------------------------------------------------------
-- users
-- Password hashes below were generated with:
--   werkzeug.security.generate_password_hash()
-- ------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, status, phone, address) VALUES
('Aqualife Admin', 'admin@aqualife.com',
 'scrypt:32768:8:1$aToyOty6hg0yc9S3$29de4cdb051b625d1ae5c6826633c37902672dd2b95068712234f54e403f3560cef4ee60a58d8e007fbc94f701af5a4516b590f1c8beb0b5c9b80d442b185724',
 'admin', 'active', '0900000000', 'Aqualife HQ, Ha Noi'),

('Nguyen Van Khach', 'khach1@aqualife.com',
 'scrypt:32768:8:1$fSXjC4CZ6ojtaiFt$54f50488134ce971f1eec828bb3c0fcd21071cedbd0e6cf950ec161554bd884b581122110c163df9c8adae90c9af46570e806f96afdea6dc6b9ff2882fdaa059',
 'customer', 'active', '0901111111', '12 Nguyen Trai, Ha Noi'),

('Tran Thi Bich', 'khach2@aqualife.com',
 'scrypt:32768:8:1$fSXjC4CZ6ojtaiFt$54f50488134ce971f1eec828bb3c0fcd21071cedbd0e6cf950ec161554bd884b581122110c163df9c8adae90c9af46570e806f96afdea6dc6b9ff2882fdaa059',
 'customer', 'active', '0902222222', '45 Le Loi, Da Nang'),

('Le Van Cuong', 'khach3@aqualife.com',
 'scrypt:32768:8:1$fSXjC4CZ6ojtaiFt$54f50488134ce971f1eec828bb3c0fcd21071cedbd0e6cf950ec161554bd884b581122110c163df9c8adae90c9af46570e806f96afdea6dc6b9ff2882fdaa059',
 'customer', 'inactive', '0903333333', '78 Tran Hung Dao, TP HCM');

-- ------------------------------------------------------------
-- categories (matches existing FRONTEND product species groupings)
-- ------------------------------------------------------------
INSERT INTO categories (name, description, status) VALUES
('Cá cảnh', 'Các loại cá cảnh nước ngọt và nước mặn', 'active'),
('Tép cảnh', 'Các loại tép cảnh trang trí bể thủy sinh', 'active'),
('Ốc cảnh', 'Các loại ốc dọn bể, ốc cảnh', 'active'),
('Thủy sinh & San hô', 'Cây thủy sinh và san hô trang trí', 'active'),
('Thức ăn', 'Thức ăn cho cá, tép, ốc', 'active'),
('Bể & Thiết bị', 'Bể kính, máy lọc, đèn, sủi oxy', 'active');

-- ------------------------------------------------------------
-- products (generated from existing FRONTEND/json/products.json)
-- ------------------------------------------------------------
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Vàng Đầu Lân', 'Cá Vàng Đầu Lân là giống cá vàng có phần đầu u đặc trưng, thân tròn và bơi chậm. Phù hợp với bể nhỏ và người mới chơi. Nhiệt độ thích hợp từ 18-24°C.', 30000, 5, 'image/products.img/fish.img/ca-vang-dau-ki-lan.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Piranha', 'Cá Piranha là loài cá săn mồi nổi tiếng với hàm răng sắc và tập tính ăn thịt. Cần nuôi trong bể riêng và chăm sóc cẩn thận.', 90000, 0, 'image/products.img/fish.img/ca-piranha.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Chuột Lùn', 'Cá Chuột Lùn là loài cá sống tầng đáy, tính hiền và thường được nuôi theo đàn trong bể thủy sinh. Loài này giúp dọn thức ăn thừa và phù hợp với bể cộng đồng.', 25000, 15, 'image/products.img/fish.img/ca-chuot-lun.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Chuột', 'Cá Chuột là loài cá tầng đáy phổ biến, hoạt động linh hoạt và giúp dọn thức ăn thừa trong bể. Phù hợp với bể thủy sinh cộng đồng và khá dễ chăm sóc.', 20000, 12, 'image/products.img/fish.img/ca-chuot.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Longfin Vàng', 'Cá Longfin Vàng có màu vàng bắt mắt cùng bộ vây dài mềm mại. Loài này thường được nuôi để tăng tính thẩm mỹ và hỗ trợ giữ bể sạch hơn.', 120000, 12, 'image/products.img/fish.img/ca-longfin-vang.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Blue Mahseer', 'Cá Blue Mahseer là loài cá kích thước lớn, có màu xanh ánh kim đẹp. Cần bể rộng và hệ thống lọc tốt.', 300000, 8, 'image/products.img/fish.img/ca-blue-masheer.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Su La', 'Tép Su La là dòng tép cảnh cao cấp nổi bật với màu sắc tương phản đẹp mắt và giá trị sưu tầm cao. Phù hợp với người chơi có kinh nghiệm và môi trường nước ổn định.', 40000, 5, 'image/products.img/shirmp.img/teo-su-lai.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Ong Đỏ', 'Tép Ong Đỏ PRL có màu đỏ trắng đặc trưng, rất được ưa chuộng trong bể thủy sinh. Cần môi trường nước ổn định.', 20000, 60, 'image/products.img/shirmp.img/tep-ong-do.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Vàng Thái', 'Tép Vàng Thái có màu vàng rực rỡ, dễ nuôi và thích hợp với nhiều loại bể thủy sinh.', 10000, 5, 'image/products.img/shirmp.img/tep-vang-thai-1.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Vàng Đài', 'Tép Vàng Đài có thân hình thon dài và màu vàng đặc trưng. Dễ nuôi, phù hợp người mới.', 15000, 30, 'image/products.img/shirmp.img/tep-vang-dai.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Socola', 'Tép Socola có màu nâu đậm độc đáo, giúp bể thủy sinh thêm đa dạng màu sắc.', 15000, 0, 'image/products.img/shirmp.img/tep-socola.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Blue Dream', 'Tép Blue Dream có màu xanh dương đậm đẹp mắt, rất được ưa chuộng trong bể thủy sinh.', 15000, 0, 'image/products.img/shirmp.img/tep-blue-dream.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Nerita', 'Ốc Nerita là loài ốc phổ biến trong bể thủy sinh, chuyên ăn rêu hại. Không sinh sản trong nước ngọt nên dễ kiểm soát số lượng.', 15000, 5, 'image/products.img/snail.img/oc-nerita.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Táo (Ốc Apple)', 'Ốc Táo có kích thước lớn, dễ nuôi và có nhiều màu sắc như vàng, xanh, tím. Có thể ăn cây thủy sinh mềm.', 10000, 12, 'image/products.img/snail.img/oc-tao.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Ramshorn', 'Ốc Ramshorn có vỏ xoắn hình sừng cừu, giúp dọn thức ăn thừa trong bể.', 5000, 12, 'image/products.img/snail.img/oc-ramshorn.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Nerite gai', 'Ốc Nerite có thể thích nghi môi trường nước lợ và thường sinh sản trong điều kiện này.', 20000, 60, 'image/products.img/snail.img/oc-nerita-gai.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Mặt Trăng (Moon Snail)', 'Ốc Mặt Trăng là loài ốc biển có vỏ tròn nhẵn, thường sống trong cát và giúp làm sạch nền.', 80000, 0, 'image/products.img/snail.img/oc-mat-trang.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Turbo', 'Ốc Turbo là loài ốc biển phổ biến trong bể reef, giúp loại bỏ rêu tảo hiệu quả.', 60000, 60, 'image/products.img/snail.img/oc-turbo.JPG', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô não', 'San hô não có cấu trúc uốn lượn giống não bộ, phù hợp cho người mới chơi reef. Cần ánh sáng trung bình và dòng nước vừa phải.', 320000, 12, 'image/products.img/sanho.img/sanho-nao.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô Xo (Xenia)', 'San hô Xo có khả năng ''đập tay'' liên tục rất đặc trưng. Phát triển nhanh, phù hợp người mới.', 180000, 60, 'image/products.img/sanho.img/sanho-xo(xenia).jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô da Toadstool', 'San hô Toadstool có hình dạng giống cây nấm, rất dễ nuôi và thích hợp cho bể reef cơ bản.', 250000, 30, 'image/products.img/sanho.img/sanho-da-Toadstool.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô Zoanthid', 'Zoanthid là loại san hô phổ biến với nhiều màu sắc đẹp, dễ lan và phù hợp cho bể san hô nhỏ.', 150000, 12, 'image/products.img/sanho.img/Sanhô-Zoanthid.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô Hammer', 'San hô Hammer có đầu xúc tu hình búa đặc trưng, cần ánh sáng trung bình và dòng chảy nhẹ.', 400000, 40, 'image/products.img/sanho.img/Sanhô-Hammer.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô Torch', 'San hô Torch có xúc tu dài và chuyển động mềm mại. Cần môi trường ổn định và ánh sáng tốt.', 500000, 15, 'image/products.img/sanho.img/Sanhô-Torch.jpeg', 'active');

-- A few extra non-fish products so every category has stock
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES
((SELECT id FROM categories WHERE name = 'Thức ăn'), 'Cám Tôm Cá Nhật Bản', 'Cám dinh dưỡng cao cho cá và tép, gói 100g.', 45000, 100, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Thức ăn'), 'Trùn Chỉ Đông Lạnh', 'Trùn chỉ đông lạnh giàu đạm cho cá.', 20000, 50, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Bể Kính 60x30x35cm', 'Bể kính cường lực, phù hợp bể thủy sinh mini.', 550000, 10, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Máy Lọc Nước Mini', 'Máy lọc treo công suất nhỏ cho bể dưới 60cm.', 280000, 15, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Đèn LED Thủy Sinh', 'Đèn LED chuyên dụng cho cây thủy sinh.', 320000, 0, NULL, 'inactive');

-- ------------------------------------------------------------
-- sample completed order for khach1 (so dashboard/revenue has data)
-- ------------------------------------------------------------
INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_phone, shipping_address, payment_method, created_at)
VALUES (
    (SELECT id FROM users WHERE email = 'khach1@aqualife.com'),
    150000, 'completed', 'Nguyen Van Khach', '0901111111', '12 Nguyen Trai, Ha Noi', 'cod',
    NOW() - INTERVAL '3 days'
);

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
SELECT o.id, p.id, p.name, p.price, 2, p.price * 2
FROM orders o, products p
WHERE o.user_id = (SELECT id FROM users WHERE email = 'khach1@aqualife.com')
  AND p.name = 'Cá Vàng Đầu Lân'
LIMIT 1;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
SELECT o.id, p.id, p.name, p.price, 3, p.price * 3
FROM orders o, products p
WHERE o.user_id = (SELECT id FROM users WHERE email = 'khach1@aqualife.com')
  AND p.name = 'Cá Chuột Lùn'
LIMIT 1;

-- a pending order for khach2 (should NOT count toward revenue)
INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_phone, shipping_address, payment_method)
VALUES (
    (SELECT id FROM users WHERE email = 'khach2@aqualife.com'),
    90000, 'pending', 'Tran Thi Bich', '0902222222', '45 Le Loi, Da Nang', 'bank_transfer'
);

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
SELECT o.id, p.id, p.name, p.price, 1, p.price
FROM orders o, products p
WHERE o.user_id = (SELECT id FROM users WHERE email = 'khach2@aqualife.com')
  AND p.name = 'Cá Piranha'
LIMIT 1;

-- ------------------------------------------------------------
-- sample review
-- ------------------------------------------------------------
INSERT INTO reviews (user_id, product_id, rating, comment)
SELECT (SELECT id FROM users WHERE email = 'khach1@aqualife.com'), p.id, 5, 'Cá khỏe, giao hàng nhanh, đóng gói cẩn thận.'
FROM products p WHERE p.name = 'Cá Vàng Đầu Lân' LIMIT 1;

select * from products
