# Aqualife - Requirements Specification

## 1. Overview

Aqualife is a full-stack e-commerce website for selling ornamental fish, aquatic plants, fish food, aquariums, and aquarium accessories.

The system has two main user areas:

- **Customer website**: browse products, manage cart, checkout, orders, reviews, profile.
- **Owner/Admin dashboard**: monitor revenue and business performance, manage products/categories, manage orders and customers.

The existing frontend visual design should be preserved unless a redesign is explicitly requested.

## 2. Technology

- Frontend: HTML5, CSS3, Vanilla JavaScript, Fetch API
- Backend: Python + Flask REST API
- Database: PostgreSQL
- Development: Git, GitHub, VS Code, Python virtual environment
- Docker/Compose may be used when required
- Do not migrate to React/Vue/Angular/Next.js unless explicitly requested

## 3. Roles

### Customer

- Register/login/logout
- Browse, search, filter and sort products
- View product details
- Add/update/remove cart items
- Checkout
- View order history and order details
- Update profile
- Review products after eligible purchases

### Owner/Admin

- Login to admin dashboard
- View business overview
- View revenue statistics
- View sales/orders statistics
- View best-selling products
- Manage products
- Manage categories
- Manage inventory/stock
- Manage orders and order statuses
- Manage customers
- View business reports

## 4. Customer Functional Requirements

### Home

- Navigation
- Hero/banner
- Introduction
- Featured/popular products
- Product categories
- Promotions
- Footer
- Preserve the supplied visual style

### Product Listing

- Search by product name
- Filter by category
- Filter by price range
- Filter by availability
- Sort by price, newest, name
- Show image, name, price and stock status

### Product Detail

- Product image
- Name
- Description
- Price
- Category
- Available stock
- Quantity selector
- Add to cart
- Related products
- Reviews

The backend must prevent purchasing more than available stock.

### Authentication

- Register with name, email, password and confirmation
- Unique email
- Secure password hashing
- Backend validation
- Login/logout
- `GET /api/auth/me`

### Profile

- View/update personal information
- View order history
- Users cannot access another customer's private information

### Cart

- View cart
- Add product
- Update quantity
- Remove item
- Clear cart
- Calculate subtotal

The backend is authoritative for price, product status and stock.

### Checkout

- Shipping name
- Shipping phone
- Shipping address
- Payment method
- Backend validates current prices and stock
- Create order and order items
- Decrease inventory
- Clear cart
- Commit transaction
- Roll back on failure

### Orders

Statuses:

`pending -> confirmed -> processing -> shipping -> completed`

or

`pending/confirmed/processing/shipping -> cancelled`

Customers can only view their own orders.

### Reviews

- Rating from 1 to 5
- Comment
- Only eligible customers may review
- Customers can edit/delete their own reviews

## 5. Owner/Admin Dashboard

### Dashboard Overview

The admin dashboard is a separate protected area.

It should display:

- Total revenue
- Revenue today
- Revenue this month
- Number of orders
- Number of completed orders
- Number of customers
- Number of active products
- Low-stock products
- Best-selling products
- Recent orders

### Revenue Analytics

Provide:

- Revenue by day
- Revenue by month
- Revenue over a selected date range
- Number of orders by period
- Average order value
- Completed/cancelled order statistics
- Revenue chart

**Revenue should normally be calculated from completed/valid orders, not merely carts or cancelled orders.**

### Product Management

Admin can:

- View product list
- Search products
- Filter by category/status
- Add product
- Edit product
- Delete/deactivate product
- Change price
- Change stock quantity
- Upload/change product image
- Change description
- Assign category
- Activate/deactivate product

Prefer soft deletion/deactivation for products that appear in historical orders.

### Category Management

Admin can:

- Add category
- Edit category
- Activate/deactivate category
- Delete category only when it does not break existing product references

### Inventory

Admin can:

- View current stock
- Update stock
- Identify low-stock products
- See out-of-stock products

### Order Management

Admin can:

- View all orders
- Search/filter orders
- View order details
- View customer/shipping information
- Update order status
- Cancel orders when business rules allow
- View order total and items

### Customer Management

Admin can:

- View customer list
- Search customers
- View customer order statistics
- Activate/deactivate accounts

Admin must not expose password hashes or other sensitive authentication data.

## 6. Suggested Pages

### Customer

```text
frontend/
├── index.html
├── about.html
├── products.html
├── product-detail.html
├── cart.html
├── checkout.html
├── login.html
├── register.html
├── profile.html
├── orders.html
├── order-detail.html
├── contact.html
└── ...
```

### Admin

```text
frontend/admin/
├── index.html              # Dashboard
├── products.html           # Product management
├── product-form.html       # Add/edit product
├── categories.html         # Category management
├── orders.html             # Order management
├── order-detail.html
├── customers.html          # Customer management
└── ...
```

## 7. Non-functional Requirements

- Authentication and authorization enforced by backend
- Passwords must be hashed
- Validate all important input on backend
- Do not trust frontend price/stock values
- Use database transactions for checkout
- Avoid exposing sensitive information
- Keep frontend/backend responsibilities separated
- Keep code modular and maintainable
- Do not introduce unnecessary microservices/Kubernetes complexity

## 8. Definition of Done

A feature is complete when:

- UI works with the supplied design
- Backend API works
- Database operations work
- Validation works
- Authentication/authorization works
- Error handling exists
- Customer/admin permissions are enforced
- Main success and failure cases are tested
