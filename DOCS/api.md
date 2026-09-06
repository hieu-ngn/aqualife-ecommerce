# Aqualife - REST API Specification

Base URL:

```text
http://localhost:5000/api
```

## 1. Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "An error occurred"
}
```

Common status codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

## 2. Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## 3. Customer APIs

### Profile

```text
GET /api/users/me
PUT /api/users/me
```

### Products

```text
GET /api/products
GET /api/products/:id
```

Query examples:

```text
GET /api/products?search=betta
GET /api/products?category=fish
GET /api/products?min_price=100000&max_price=500000
GET /api/products?sort=price_asc
GET /api/products?page=1&limit=20
```

### Categories

```text
GET /api/categories
GET /api/categories/:id
```

### Cart

Authentication required:

```text
GET    /api/cart
POST   /api/cart
PUT    /api/cart/:id
DELETE /api/cart/:id
DELETE /api/cart
```

### Orders

Authentication required:

```text
POST  /api/orders
GET   /api/orders
GET   /api/orders/:id
PATCH /api/orders/:id/cancel
```

### Reviews

```text
GET    /api/products/:product_id/reviews
POST   /api/products/:product_id/reviews
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

## 4. Admin APIs

Every `/api/admin/*` endpoint requires:

```text
authenticated = true
role = admin
```

### Dashboard

```text
GET /api/admin/dashboard
```

Suggested response:

```json
{
  "success": true,
  "data": {
    "total_revenue": 0,
    "today_revenue": 0,
    "monthly_revenue": 0,
    "total_orders": 0,
    "completed_orders": 0,
    "total_customers": 0,
    "active_products": 0,
    "low_stock_products": 0
  }
}
```

### Revenue

```text
GET /api/admin/revenue
```

Optional filters:

```text
GET /api/admin/revenue?from=2026-01-01&to=2026-01-31
GET /api/admin/revenue?group_by=day
GET /api/admin/revenue?group_by=month
```

Revenue should follow the business rule defined in the database specification, normally using completed orders.

### Admin Product Management

```text
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
PATCH  /api/admin/products/:id/status
PATCH  /api/admin/products/:id/stock
```

Example create request:

```json
{
  "name": "Betta Fancy",
  "category_id": 1,
  "description": "Ornamental fish",
  "price": 150000,
  "stock": 20,
  "image": "/image/betta.jpg"
}
```

### Admin Categories

```text
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
PATCH  /api/admin/categories/:id/status
```

### Admin Orders

```text
GET   /api/admin/orders
GET   /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
```

Filters can include:

```text
status
customer
date range
```

### Admin Customers

```text
GET   /api/admin/users
GET   /api/admin/users/:id
PATCH /api/admin/users/:id/status
```

Do not return password hashes.

## 5. Frontend-to-API Mapping

```text
Customer
index.html
  -> GET /api/products

products.html
  -> GET /api/products

product-detail.html
  -> GET /api/products/:id
  -> GET /api/products/:id/reviews

cart.html
  -> GET/POST/PUT/DELETE /api/cart

checkout.html
  -> POST /api/orders

orders.html
  -> GET /api/orders

profile.html
  -> GET/PUT /api/users/me
```

Admin:

```text
admin/index.html
  -> GET /api/admin/dashboard
  -> GET /api/admin/revenue

admin/products.html
  -> GET/POST/PUT/DELETE /api/admin/products

admin/categories.html
  -> GET/POST/PUT/DELETE /api/admin/categories

admin/orders.html
  -> GET/PATCH /api/admin/orders

admin/customers.html
  -> GET/PATCH /api/admin/users
```

## 6. Security Rules

- Backend must enforce authentication.
- Backend must enforce admin authorization.
- Never rely only on hiding admin pages/buttons.
- Never trust frontend product prices.
- Never trust frontend stock values.
- Validate all request data.
- Hash passwords.
- Do not expose password hashes.
- Protect admin APIs from unauthorized users.
- Use transactions for checkout.

## 7. Error Examples

Insufficient stock:

```json
{
  "success": false,
  "message": "Insufficient stock"
}
```

Unauthorized:

```json
{
  "success": false,
  "message": "Authentication required"
}
```

Forbidden:

```json
{
  "success": false,
  "message": "Admin access required"
}
```

Product not found:

```json
{
  "success": false,
  "message": "Product not found"
}
```
