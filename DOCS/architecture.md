# Aqualife - Architecture

## 1. Overall Architecture

```text
CUSTOMER / ADMIN BROWSER
        |
        | HTTP / JSON
        v
FRONTEND
HTML + CSS + Vanilla JS
        |
        | REST API
        v
BACKEND
Python + Flask
Routes -> Controllers -> Services -> Models
        |
        | SQL
        v
POSTGRESQL
```

## 2. Two Application Areas

```text
AQUALIFE
|
+-- Customer Website
|   +-- Home
|   +-- Products
|   +-- Product detail
|   +-- Cart
|   +-- Checkout
|   +-- Orders
|   +-- Profile
|   +-- Reviews
|
+-- Admin Dashboard
    +-- Dashboard / Revenue
    +-- Products
    +-- Categories
    +-- Orders
    +-- Customers
    +-- Inventory
```

## 3. Frontend Structure

```text
frontend/
├── css/
├── image/
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── home.js
│   ├── products.js
│   ├── product-detail.js
│   ├── cart.js
│   ├── checkout.js
│   ├── profile.js
│   ├── orders.js
│   └── admin/
│       ├── dashboard.js
│       ├── products.js
│       ├── categories.js
│       ├── orders.js
│       └── customers.js
├── json/
├── video/
├── admin/
└── *.html
```

The frontend should call the Flask API instead of directly accessing PostgreSQL.

## 4. Backend Structure

```text
backend/
├── app.py
├── config/
│   └── database.py
├── routes/
│   ├── auth_routes.py
│   ├── product_routes.py
│   ├── category_routes.py
│   ├── cart_routes.py
│   ├── order_routes.py
│   ├── review_routes.py
│   └── admin_routes.py
├── controllers/
│   ├── auth_controller.py
│   ├── product_controller.py
│   ├── category_controller.py
│   ├── cart_controller.py
│   ├── order_controller.py
│   ├── review_controller.py
│   └── admin_controller.py
├── services/
│   ├── auth_service.py
│   ├── product_service.py
│   ├── cart_service.py
│   ├── order_service.py
│   ├── review_service.py
│   └── dashboard_service.py
├── models/
│   ├── user.py
│   ├── category.py
│   ├── product.py
│   ├── cart.py
│   ├── order.py
│   └── review.py
├── middleware/
│   ├── auth.py
│   └── admin.py
└── utils/
```

## 5. Request Flow

### Customer

```text
Browser
 -> Route
 -> Controller
 -> Service
 -> Model/Repository
 -> PostgreSQL
 -> JSON
 -> Browser
```

### Admin

```text
Admin Browser
 -> Admin Route
 -> Authentication
 -> Admin Authorization
 -> Controller
 -> Service
 -> Database
 -> JSON
 -> Dashboard
```

## 6. Admin Authorization

There are two checks:

1. User is authenticated.
2. User has `admin` role.

Frontend route protection is useful for UX, but **backend authorization is mandatory**.

Example:

```text
GET /api/admin/dashboard
        |
        +-- authenticated? no -> 401
        |
        +-- role=admin? no -> 403
        |
        +-- allowed -> dashboard data
```

## 7. Dashboard Data Flow

```text
Admin Dashboard
      |
      +--> /api/admin/dashboard
      |
      +--> /api/admin/revenue
      |
      +--> /api/admin/products
      |
      +--> /api/admin/orders
      |
      v
PostgreSQL
```

Dashboard statistics should be calculated from order data, with revenue rules defined consistently.

## 8. Checkout Transaction

```text
BEGIN
  |
  +-- Get cart
  +-- Check products
  +-- Check stock
  +-- Read current prices
  +-- Calculate total
  +-- Create order
  +-- Create order items
  +-- Decrease stock
  +-- Clear cart
  |
COMMIT
```

Any critical failure should trigger `ROLLBACK`.

## 9. Database Relationship

```text
users
  |
  +-- cart -- cart_items -- products -- categories
  |
  +-- orders -- order_items -- products
  |
  +-- reviews -- products
```

Historical order items should store a snapshot of product name and unit price.

## 10. Configuration

Use environment variables for secrets and deployment-specific settings.

Example:

```text
DATABASE_URL=
SECRET_KEY=
FLASK_ENV=
```

Do not commit real secrets to GitHub.

## 11. Architectural Principles

- Keep the architecture simple.
- Do not put all business logic in `app.py`.
- Do not let frontend code access the database directly.
- Keep admin APIs separate from public APIs where appropriate.
- Backend is the source of truth for permissions, price, stock and order totals.
- Prefer modular code over unnecessary architectural complexity.
