# AGENT GUIDELINES & PROJECT MEMORY: AQUALIFE E-COMMERCE

Tài liệu này ghi nhớ toàn bộ bối cảnh, kiến trúc phân tầng, quy tắc bảo mật – toàn vẹn dữ liệu, đặc tả API/Database và lộ trình hoàn thiện các phân hệ của dự án **Aqualife E-commerce** phục vụ cho Agent và các thành viên nhóm trong suốt quá trình phát triển.

---

## 1. Mục tiêu & Tổng quan Dự án

**Aqualife** là hệ thống website thương mại điện tử Full-stack chuyên cung cấp cá cảnh, tép cảnh, ốc cảnh, cây thủy sinh – san hô, thức ăn và phụ kiện bể cá.

Hệ thống gồm 2 phân khu chính:
1. **Customer Website (Khách hàng)**:
   - Đăng ký, đăng nhập, đăng xuất, quản lý phiên làm việc (`GET /api/auth/me`).
   - Duyệt danh mục, tìm kiếm, lọc (theo loài, môi trường nước, khoảng giá, tình trạng kho) và sắp xếp sản phẩm.
   - Xem chi tiết sản phẩm, số lượng tồn kho thực tế và sản phẩm liên quan.
   - Quản lý giỏ hàng (thêm, tăng/giảm số lượng, xóa từng món, xóa toàn bộ) có kiểm tra tồn kho.
   - Đặt hàng & Thanh toán (Checkout Transaction an toàn với PostgreSQL).
   - Xem lịch sử đơn hàng, chi tiết đơn hàng và hủy đơn hàng khi đủ điều kiện.
   - Quản lý hồ sơ cá nhân và đánh giá sản phẩm (1–5 sao) sau khi mua hàng.
2. **Owner / Admin Dashboard (Quản trị viên)**:
   - Thống kê tổng quan kinh doanh (doanh thu tổng, hôm nay, tháng này, tổng đơn, đơn hoàn thành, sản phẩm sắp hết hàng, sản phẩm bán chạy).
   - Biểu đồ & báo cáo doanh thu theo ngày/tháng/khoảng thời gian (chỉ tính trên các đơn `completed`).
   - Quản lý sản phẩm (CRUD, cập nhật giá, tồn kho, trạng thái `active`/`inactive`).
   - Quản lý danh mục (CRUD, chỉ xóa khi không làm gãy tham chiếu sản phẩm).
   - Quản lý đơn hàng (xem, lọc, cập nhật trạng thái đơn hàng) và quản lý khách hàng (khóa/mở khóa tài khoản).

---

## 2. Công nghệ & Kiến trúc Hệ thống

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (`fetch` API). **Bắt buộc giữ nguyên giao diện trực quan (visual style) hiện có**, không chuyển đổi sang React/Vue/Angular/Next.js.
- **Backend**: Python 3 + Flask REST API (`Blueprint` theo từng domain), kiến trúc phân tầng:
  ```text
  Routes (routes/*_routes.py)
    -> Controllers (controllers/*_controller.py)
      -> Services (services/*_service.py)
        -> PostgreSQL Connection Pool (config/database.py - psycopg3 dict_row)
  ```
- **Database**: PostgreSQL (`aqualife`), quản lý qua **pgAdmin 4** và kết nối qua `DATABASE_URL` trong `BACKEND/.env`.

### Cấu trúc thư mục chuẩn

```text
aqualife-ecommerce/
├── agent.md                      # Tài liệu đặc tả & bộ nhớ dự án cho Agent
├── README.md                     # Giới thiệu dự án
├── WORKFLOW.md                   # Quy tắc làm việc với Git/GitHub của nhóm
├── DOCS/                         # Tài liệu đặc tả gốc
│   ├── requirements.md
│   ├── architecture.md
│   ├── api.md
│   └── database.md
├── DATABASE/
│   ├── schema.sql                # DDL khởi tạo 8 bảng, constraints, indexes, triggers
│   └── seed.sql                  # Dữ liệu mẫu (users, categories, products, orders, reviews)
├── BACKEND/
│   ├── .env.example              # Mẫu cấu hình biến môi trường
│   ├── app.py                    # Flask Application Factory & Blueprint registration
│   ├── requirements.txt          # Dependencies (Flask, flask-cors, psycopg, pytest...)
│   ├── config/
│   │   └── database.py           # psycopg_pool ConnectionPool & get_db_cursor(commit=...)
│   ├── middleware/
│   │   ├── auth.py               # @login_required
│   │   └── admin.py              # @admin_required
│   ├── routes/                   # Khai báo URL endpoints
│   │   ├── auth_routes.py
│   │   ├── category_routes.py
│   │   ├── product_routes.py
│   │   ├── cart_routes.py
│   │   └── order_routes.py
│   ├── controllers/              # Parse request, validate input, trả JSON response
│   │   ├── auth_controller.py
│   │   ├── category_controller.py
│   │   ├── product_controller.py
│   │   ├── cart_controller.py
│   │   └── order_controller.py
│   ├── services/                 # Business logic & SQL transactions
│   │   ├── auth_service.py
│   │   ├── product_service.py
│   │   ├── cart_service.py
│   │   └── order_service.py
│   ├── utils/
│   │   └── responses.py          # success(data, status), error(message, status)
│   └── tests/                    # Bộ kiểm thử tự động pytest
│       └── test_m08_shop_orders.py
└── FRONTEND/
    ├── index.html                # Redirect về html/home.html
    ├── css/                      # Stylesheets (base.css, home.css, products.css, cart.css...)
    ├── html/                     # Các trang giao diện khách hàng
    │   ├── home.html
    │   ├── products.html
    │   ├── product-detail.html
    │   ├── cart.html
    │   ├── pay.html
    │   ├── orders.html           # Lịch sử & chi tiết đơn hàng của khách
    │   ├── auth.html
    │   ├── register.html
    │   ├── about.html
    │   └── contact.html
    ├── js/                       # Logic Frontend kết nối REST API
    │   ├── common.js             # API client (apiFetch), Auth nav, Products loader, Cart sync
    │   ├── home.js
    │   ├── products.js
    │   ├── product-detail.js
    │   ├── cart.js
    │   ├── pay.js
    │   ├── orders.js
    │   ├── auth.js
    │   └── register.js
    └── json/
        └── products.json         # Metadata bổ trợ giao diện (species, waterType, shortDescription)
```

---

## 3. Quy tắc Kỹ thuật & Nghiệp vụ Cốt lõi (Bắt buộc tuân thủ)

### 3.1. Chuẩn định dạng REST API Response
Mọi API trả về JSON thống nhất qua `utils/responses.py`:
- **Thành công**: `{"success": true, "data": ...}` (HTTP `200`, `201`).
- **Thất bại**: `{"success": false, "message": "..."}` (HTTP `400`, `401`, `403`, `404`, `409`, `422`, `500`).

### 3.2. Bảo mật & Phân quyền
- Mật khẩu bắt buộc băm bằng `werkzeug.security.generate_password_hash` / `check_password_hash`.
- **Tuyệt đối không** trả trường `password_hash` trong bất kỳ API response nào.
- Các API giỏ hàng (`/api/cart/*`) và đơn hàng (`/api/orders/*`) bắt buộc có `@login_required`.
- Khách hàng chỉ được xem và hủy đơn hàng của chính mình (`order.user_id == g.current_user['id']`).
- Mọi API quản trị (`/api/admin/*`) bắt buộc kiểm tra `@admin_required` (`role == 'admin'`).

### 3.3. Tính toàn vẹn Giá, Tồn kho & Giao dịch Đặt hàng (Checkout Transaction)
- **Backend là nguồn chân lý duy nhất (Single Source of Truth)** về giá sản phẩm (`price`), tồn kho (`stock`), trạng thái sản phẩm (`status`) và tổng tiền đơn hàng (`total_amount`). Không bao giờ tin giá hoặc tổng tiền do Frontend gửi lên.
- Quy trình `POST /api/orders` bắt buộc thực hiện trong **1 Database Transaction (`get_db_cursor(commit=True)`)**:
  1. Đọc danh sách sản phẩm từ giỏ hàng của khách (hoặc đồng bộ từ danh sách items gửi lên). Nếu rỗng $\rightarrow$ báo lỗi `400`.
  2. Khóa các dòng sản phẩm liên quan bằng `SELECT ... FROM products WHERE id = ANY(%s) ORDER BY id FOR UPDATE` để chống tranh chấp đồng thời (race condition).
  3. Kiểm tra từng sản phẩm: phải tồn tại, `status = 'active'`, và `stock >= quantity`. Nếu bất kỳ sản phẩm nào không đủ tồn kho $\rightarrow$ `ROLLBACK` toàn bộ và trả `400 Insufficient stock`.
  4. Tính `subtotal = price * quantity` và `total_amount` từ đơn giá `products.price` trong DB.
  5. Tạo bản ghi `orders` (`status = 'pending'`, `payment_method` thuộc `['cod', 'bank_transfer']`).
  6. Tạo các bản ghi `order_items` kèm **historical snapshot** (`product_name`, `unit_price`, `quantity`, `subtotal`) để lịch sử đơn hàng không bị sai lệch khi giá/tên sản phẩm thay đổi về sau.
  7. Trừ tồn kho: `UPDATE products SET stock = stock - %s WHERE id = %s`.
  8. Làm trống giỏ hàng của khách (`DELETE FROM cart_items WHERE cart_id = %s`).
  9. `COMMIT` transaction.
- **Hủy đơn hàng (`PATCH /api/orders/:id/cancel`)**:
  - Khách hàng chỉ được hủy đơn hàng của mình khi trạng thái đang ở `pending` hoặc `confirmed`.
  - Khi chuyển trạng thái sang `cancelled`, bắt buộc **hoàn lại số lượng tồn kho (`stock = stock + quantity`)** cho các sản phẩm trong đơn trong cùng một transaction.

### 3.4. Quy tắc tính Doanh thu (Revenue Rule)
- Doanh thu (`revenue`) trên Dashboard chỉ được tính từ các đơn hàng có `status = 'completed'`. Đơn `pending` hoặc `cancelled` không được tính vào doanh thu thực tế.

---

## 4. Lộ trình Hoàn thiện Dự án theo Module (Đã hoàn thành 100%)

- **M01 – M07 (Đã hoàn thành)**: Thiết kế CSDL PostgreSQL (`schema.sql`, `seed.sql`), cấu hình Connection Pool, xây dựng hệ thống Xác thực (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`) và tích hợp giao diện Đăng nhập/Đăng ký.
- **M08 – Mua sắm, Giỏ hàng, Thanh toán & Đơn hàng (Đã hoàn thành)**:
  - Đồng bộ toàn bộ sản phẩm từ `products.json` vào PostgreSQL (`seed.sql` - 56 sản phẩm).
  - Xây dựng API Danh mục (`/api/categories`) và Sản phẩm (`/api/products`, `/api/products/:id`).
  - Xây dựng API Giỏ hàng (`/api/cart` GET/POST/PUT/DELETE).
  - Xây dựng API Đặt hàng, Lịch sử đơn hàng & Hủy đơn (`/api/orders`, `/api/orders/:id`, `/api/orders/:id/cancel`).
  - Kết nối Frontend (`common.js`, `home.js`, `products.js`, `product-detail.js`, `cart.js`, `pay.js`, `orders.html`, `orders.js`) với Backend API.
- **M09 – Hồ sơ Khách hàng & Đánh giá Sản phẩm (Đã hoàn thành)**:
  - API `GET/PUT /api/users/me`, `PUT /api/users/me/password` và `GET/POST /api/products/:id/reviews`, `PUT/DELETE /api/reviews/:id` (kiểm tra khách đã mua hàng mới được đánh giá).
  - Giao diện `profile.html` (`profile.js`) và mục đánh giá khách hàng trong `product-detail.html`.
- **M10 – M12 – Admin Dashboard & Quản trị Hệ thống (Đã hoàn thành)**:
  - API `/api/admin/dashboard`, `/api/admin/products`, `/api/admin/categories`, `/api/admin/orders`, `/api/admin/users`.
  - Giao diện quản trị toàn diện tại `FRONTEND/html/admin.html` (`FRONTEND/admin/index.html`, `admin.css`, `admin.js`).
- **Trang Liên hệ & Unified Web Server (Đã hoàn thành)**:
  - Hoàn thiện trang `contact.html` (`contact.css`, `contact.js`).
  - Cấu hình `BACKEND/app.py` phục vụ trực tiếp cả Frontend lẫn REST API tại `http://localhost:5000`.
  - Kiểm thử tự động toàn bộ dự án bằng `pytest` (`9 passed` trên `test_m08_shop_orders.py` và `test_full_project.py`).

