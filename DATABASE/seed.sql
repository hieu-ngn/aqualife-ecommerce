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

INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Mương Hoa', 'Cá Mương Hoa có thân dài và màu sắc nổi bật, thường sống ở môi trường nước chảy. Cần nước sạch và oxy cao.', 100000, 20, 'image/products.img/fish.img/ca-muong-hoa.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Chạch Botia', 'Cá Chạch Botia là loài cá hoạt động về đêm, chuyên ăn ốc và giúp kiểm soát sinh vật gây hại trong bể.', 50000, 20, 'image/products.img/fish.img/ca-chach-botia.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Thần Tiên 3 Màu', 'Cá Thần Tiên 3 Màu có thân dẹt, vây dài và màu sắc hài hòa. Phù hợp với bể thủy sinh lớn và môi trường nước ổn định.', 15000, 20, 'image/products.img/fish.img/ca-than-tien-3-mau.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Kim Sơn Thái', 'Cá Kim Sơn Thái thường được nuôi để làm sạch rêu và chất bẩn trong bể. Dễ nuôi và thích nghi tốt.', 40000, 20, 'image/products.img/fish.img/ca-kim-son-thai.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Fire Red', 'Tép Fire Red là dòng tép đỏ phổ biến, dễ nuôi và phù hợp với người mới chơi thủy sinh.', 10000, 20, 'image/products.img/shirmp.img/tep-fire-red.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Rili Đỏ', 'Tép Rili Đỏ có phần thân trong suốt xen kẽ màu đỏ, tạo hiệu ứng rất đẹp trong bể.', 6000, 20, 'image/products.img/shirmp.img/tep-rili-do.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép SRC', 'Tép SRC (Super Red Cherry) là dòng tép đỏ đẹp, dễ nuôi và thích hợp cho bể thủy sinh.', 8000, 20, 'image/products.img/shirmp.img/tep-src.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tôm Bác Sĩ', 'Tôm Bác Sĩ là loài giáp xác nước mặn nổi tiếng với khả năng làm sạch ký sinh trên cá. Có màu đỏ với sọc trắng đặc trưng, phù hợp với bể reef ổn định và môi trường nước chất lượng tốt.', 250000, 20, 'image/products.img/shirmp.img/tom-bac-si.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Peppermint', 'Tép Peppermint có màu trong suốt với sọc đỏ, thường được nuôi để kiểm soát aiptasia trong bể san hô.', 2000, 20, 'image/products.img/shirmp.img/tep-mui-do.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Blood Red', 'Tép Blood Red có màu đỏ rực nổi bật, thường sống trong các hang đá và hoạt động về đêm.', 55000, 20, 'image/products.img/shirmp.img/tep-dark-blood.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Coral Banded', 'Tép Coral Banded có càng dài và màu sắc nổi bật. Có thể hơi hung dữ với các tép khác nên cần nuôi riêng.', 200000, 20, 'image/products.img/shirmp.img/tep-coral-bandal.jpeg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Amano', 'Tép Amano sống chủ yếu nước ngọt nhưng sinh sản cần môi trường nước lợ. Rất nổi tiếng trong việc ăn rêu trong bể thủy sinh.', 30000, 20, 'image/products.img/shirmp.img/tep-amano.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Tép cảnh'), 'Tép Ma', 'Tép Ma có thân trong suốt, dễ nuôi và thích nghi tốt với môi trường nước lợ hoặc nước ngọt nhẹ.', 500000, 20, 'image/products.img/shirmp.img/tep-ma.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Ốc cảnh'), 'Ốc Trochus', 'Ốc Trochus có khả năng bám kính và đá để ăn rêu, rất hữu ích trong bể san hô.', 50000, 20, 'image/products.img/snail.img/oc-trochus.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'San hô mè', 'San hô mè có đầu xúc tu tròn giống trứng ếch. Dễ nuôi hơn Torch, phù hợp người mới.', 380000, 20, 'image/products.img/sanho.img/Sanhô-mè.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'Rong đuôi chó', 'Rong đuôi chó là loại cây thủy sinh phổ biến, dễ sống và phát triển nhanh. Phù hợp cho người mới chơi và giúp cung cấp oxy cho bể.', 10000, 20, 'image/products.img/sanho.img/rong-duoi-cho.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'Dương xỉ thủy sinh', 'Dương xỉ thủy sinh là loại cây phổ biến, có thể buộc vào lũa hoặc đá. Phát triển tốt trong môi trường ánh sáng trung bình.', 50000, 20, 'image/products.img/sanho.img/duong-xi-thuy-sinh.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Thủy sinh & San hô'), 'Tiêu thảo nâu nhăn', 'Tiêu thảo nâu nhăn (Cryptocoryne) là loại cây thủy sinh có lá màu nâu với bề mặt nhăn đặc trưng. Cây phát triển chậm nhưng rất bền, không yêu cầu ánh sáng mạnh. Phù hợp trồng tiền cảnh hoặc trung cảnh trong bể thủy sinh.', 50000, 20, 'image/products.img/sanho.img/cay-tieu-thao-nau.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Nemo', 'Cá Nemo là loài cá biển phổ biến, sống cộng sinh với hải quỳ. Dễ nuôi và phù hợp cho người mới chơi bể nước mặn.', 250000, 20, 'image/products.img/fish.img/ca-nemo.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Bống Hiệp Sĩ', 'Cá bống hiệp sĩ là loài cá tầng đáy có hoa văn bắt mắt và tính cách khá linh hoạt. Phù hợp với bể nước lợ có nền cát và nhiều chỗ ẩn nấp.', 85000, 20, 'image/products.img/fish.img/ca-bong-hiep-si.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Thia Xanh (Damselfish)', 'Cá Thia Xanh là loài cá biển khỏe, dễ nuôi, phù hợp cho người mới bắt đầu chơi bể reef.', 80000, 20, 'image/products.img/fish.img/ca-thia-xanh.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Hoàng Đế (Angelfish biển)', 'Cá Hoàng Đế là loài cá biển có màu sắc rất đẹp, cần bể lớn và môi trường ổn định.', 500000, 20, 'image/products.img/fish.img/ca-hong-de.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Bướm', 'Cá Bướm là loài cá biển có thân mỏng, màu sắc đa dạng và dáng bơi thanh thoát. Phù hợp với bể biển lớn và cần được chăm sóc kỹ.', 350000, 20, 'image/products.img/fish.img/ca-dao-hoc-tro.webp', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Mập Colombia', 'Cá mập Colombia có hình dáng giống cá mập thu nhỏ, thích bơi theo nhóm và cần không gian rộng. Khi trưởng thành sẽ phát triển tốt trong môi trường nước lợ ổn định.', 180000, 20, 'image/products.img/fish.img/caamap-colombia.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Bảy Màu', 'Cá bảy màu rất phổ biến nhờ màu sắc đa dạng và khả năng sinh sản tốt. Có thể sống ở nước ngọt nhưng cũng thích nghi tốt với môi trường nước lợ nhẹ.', 15000, 20, 'image/products.img/fish.img/ca-7-mau.jpg', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Bống Rồng', 'Cá bống rồng có thân hình thuôn dài, màu sắc đẹp và thường hoạt động sát đáy bể. Phù hợp cho bể nước lợ sạch, có nền mịn và dòng chảy nhẹ.', 95000, 20, 'image/products.img/fish.img/ca-bong-rong.JPG', 'active');
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES ((SELECT id FROM categories WHERE name = 'Cá cảnh'), 'Cá Trạng Nguyên', 'Cá Trạng Nguyên là loài cá biển có màu sắc sặc sỡ và hoa văn rất bắt mắt. Loài này khá khó nuôi, cần môi trường nước ổn định, bể trưởng thành và nguồn thức ăn phù hợp.', 600000, 20, 'image/products.img/fish.img/ca-trang-nguyen.webp', 'active');

-- A few extra non-fish products so every category has stock
INSERT INTO products (category_id, name, description, price, stock, image, status) VALUES
((SELECT id FROM categories WHERE name = 'Thức ăn'), 'Cám Tôm Cá Nhật Bản', 'Cám dinh dưỡng cao cho cá và tép, gói 100g.', 45000, 100, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Thức ăn'), 'Trùn Chỉ Đông Lạnh', 'Trùn chỉ đông lạnh giàu đạm cho cá.', 20000, 50, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Bể Kính 60x30x35cm', 'Bể kính cường lực, phù hợp bể thủy sinh mini.', 550000, 10, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Máy Lọc Nước Mini', 'Máy lọc treo công suất nhỏ cho bể dưới 60cm.', 280000, 15, NULL, 'active'),
((SELECT id FROM categories WHERE name = 'Bể & Thiết bị'), 'Đèn LED Thủy Sinh', 'Đèn LED chuyên dụng cho cây thủy sinh.', 320000, 0, NULL, 'inactive');

-- Phân loại môi trường nước (water_type) cho các dòng Nước mặn & Nước lợ
UPDATE products SET water_type = 'Nước mặn' WHERE name IN (
    'Cá Hề Ocellaris', 'Cá Blue Tang', 'Cá Tang Vàng', 'Cá Mao Tiên',
    'Cá Bống Cờ Lửa (Firefish)', 'Tép Vũ Công (Sexy Shrimp)', 'Ốc Turbo', 'Ốc Nassarius',
    'San hô Nấm Đỏ (Mushroom)', 'San hô da Toadstool', 'San hô Zoanthid', 'San hô Hammer',
    'San hô Torch', 'Tôm Bác Sĩ', 'Tép Peppermint', 'Tép Blood Red', 'Tép Coral Banded',
    'Ốc Trochus', 'San hô mè', 'Cá Nemo', 'Cá Thia Xanh (Damselfish)',
    'Cá Hoàng Đế (Angelfish biển)', 'Cá Bướm', 'Cá Trạng Nguyên'
) OR description ILIKE '%cá biển%' OR description ILIKE '%nước mặn%' OR description ILIKE '%bể reef%' OR description ILIKE '%bể san hô%';

UPDATE products SET water_type = 'Nước lợ' WHERE name IN (
    'Cá Nóc Da Beo', 'Cá Nóc Số 8', 'Cá Bắn Nước', 'Cá Hói (Scat)',
    'Tép Mũi Đỏ', 'Ốc Nerita', 'Tép Amano', 'Tép Ma',
    'Cá Bống Hiệp Sĩ', 'Cá Mập Colombia', 'Cá Bảy Màu', 'Cá Bống Rồng'
) OR description ILIKE '%nước lợ%';

-- Phân loại Kích thước & Giá từng kích thước (sizes JSONB) cho toàn bộ sản phẩm mẫu
UPDATE products p
SET sizes = jsonb_build_array(
    jsonb_build_object('size', 'Size S - Nhỏ (2 - 3cm)', 'price', p.price:: bigint),
    jsonb_build_object('size', 'Size M - Trung (4 - 6cm)', 'price', (ROUND((p.price * 1.4) / 5000.0) * 5000)::bigint),
    jsonb_build_object('size', 'Size L - Trưởng thành (7 - 10cm)', 'price', (ROUND((p.price * 1.85) / 5000.0) * 5000)::bigint)
)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Cá cảnh');

UPDATE products p
SET sizes = jsonb_build_array(
    jsonb_build_object('size', 'Size Nhỏ / Baby (0.8 - 1.2cm)', 'price', p.price::bigint),
    jsonb_build_object('size', 'Size Trung (1.5 - 1.8cm)', 'price', (ROUND((p.price * 1.35) / 1000.0) * 1000)::bigint),
    jsonb_build_object('size', 'Size Trưởng thành (2.0 - 2.5cm)', 'price', (ROUND((p.price * 1.75) / 1000.0) * 1000)::bigint)
)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Tép cảnh');

UPDATE products p
SET sizes = jsonb_build_array(
    jsonb_build_object('size', 'Size S - Nhỏ (1.0 - 1.5cm)', 'price', p.price::bigint),
    jsonb_build_object('size', 'Size M - Trung (2.0 - 2.5cm)', 'price', (ROUND((p.price * 1.35) / 1000.0) * 1000)::bigint),
    jsonb_build_object('size', 'Size L - Lớn (3.0cm+)', 'price', (ROUND((p.price * 1.7) / 1000.0) * 1000)::bigint)
)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Ốc cảnh');

UPDATE products p
SET sizes = jsonb_build_array(
    jsonb_build_object('size', 'Frag / Nhánh Nhỏ (Tiêu chuẩn)', 'price', p.price::bigint),
    jsonb_build_object('size', 'Bụi Trung (3 - 4 đầu)', 'price', (ROUND((p.price * 1.45) / 5000.0) * 5000)::bigint),
    jsonb_build_object('size', 'Colony / Bụi Lớn (5+ đầu)', 'price', (ROUND((p.price * 2.0) / 5000.0) * 5000)::bigint)
)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Thủy sinh & San hô');

UPDATE products p
SET sizes = jsonb_build_array(
    jsonb_build_object('size', 'Bản Nhỏ / Tiêu chuẩn', 'price', p.price::bigint),
    jsonb_build_object('size', 'Bản Trung', 'price', (ROUND((p.price * 1.5) / 5000.0) * 5000)::bigint),
    jsonb_build_object('size', 'Bản Lớn / Cao cấp', 'price', (ROUND((p.price * 2.1) / 5000.0) * 5000)::bigint)
)
WHERE sizes = '[]'::jsonb;

-- ------------------------------------------------------------
-- sample completed order for khach1 (so dashboard/revenue has data)
-- ------------------------------------------------------------
INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_phone, shipping_address, payment_method, created_at)
VALUES (
    (SELECT id FROM users WHERE email = 'khach1@aqualife.com'),
    135000, 'completed', 'Nguyen Van Khach', '0901111111', '12 Nguyen Trai, Ha Noi', 'cod',
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
-- sample reviews (sorted by highest rating first, earliest first)
-- ------------------------------------------------------------
INSERT INTO users (name, email, password_hash, phone, address, role) VALUES
('Anh Hoàng Dương', 'hoangduong@aqualife.com', 'scrypt:32768:8:1$seed$seed', '0901112233', 'Quận 1, TP.HCM', 'customer'),
('Chị Hồng Diệp', 'hongdiep@aqualife.com', 'scrypt:32768:8:1$seed$seed', '0902223344', 'Cầu Giấy, Hà Nội', 'customer'),
('Anh Minh Tuấn', 'minhtuan@aqualife.com', 'scrypt:32768:8:1$seed$seed', '0903334455', 'Hải Châu, Đà Nẵng', 'customer'),
('Chị Thanh Thảo', 'thanhthao@aqualife.com', 'scrypt:32768:8:1$seed$seed', '0904445566', 'Tây Hồ, Hà Nội', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
SELECT (SELECT id FROM users WHERE email = 'hoangduong@aqualife.com'), p.id, 5, 'Chưa bao giờ tôi nhận được những chú cá khỏe mạnh và màu sắc tuyệt vời như vậy khi mua online. Aqualife thực sự là nơi uy tín nhất.', NOW() - INTERVAL '10 days'
FROM products p WHERE p.name = 'Cá Hề Ocellaris' LIMIT 1;

INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
SELECT (SELECT id FROM users WHERE email = 'hongdiep@aqualife.com'), p.id, 5, 'Dịch vụ thiết kế bể cá biển của Aqualife đã biến phòng khách của tôi thành một thủy cung thu nhỏ đầy nghệ thuật. Đội ngũ kỹ thuật rất tận tâm.', NOW() - INTERVAL '9 days'
FROM products p WHERE p.name = 'San hô Torch' LIMIT 1;

INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
SELECT (SELECT id FROM users WHERE email = 'khach1@aqualife.com'), p.id, 5, 'Cá khỏe, giao hàng nhanh, đóng gói cẩn thận.', NOW() - INTERVAL '7 days'
FROM products p WHERE p.name = 'Cá Vàng Đầu Lân' LIMIT 1;

INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
SELECT (SELECT id FROM users WHERE email = 'minhtuan@aqualife.com'), p.id, 5, 'Cá Blue Tang về bể bơi rất sung, ăn cám ngay ngày đầu tiên. Đóng gói oxy 3 lớp cực kỳ chuyên nghiệp!', NOW() - INTERVAL '5 days'
FROM products p WHERE p.name = 'Cá Blue Tang' LIMIT 1;

INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
SELECT (SELECT id FROM users WHERE email = 'thanhthao@aqualife.com'), p.id, 4, 'Tôm Bác Sĩ rất chăm dọn ký sinh, màu đỏ trắng nổi bật trong bể reef. Sẽ tiếp tục ủng hộ shop!', NOW() - INTERVAL '2 days'
FROM products p WHERE p.name = 'Tôm Bác Sĩ' LIMIT 1;

