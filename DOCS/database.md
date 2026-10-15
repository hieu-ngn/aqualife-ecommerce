# Aqualife - Database Specification

## 1. Database

Database: `aqualife`

DBMS: PostgreSQL

## 2. Connect with pgAdmin 4 and the backend

Register the local PostgreSQL server in pgAdmin 4 using the host, port, and
credentials configured for your PostgreSQL installation. Create a database
named `aqualife` if it does not already exist.

Set `DATABASE_URL` in `BACKEND/.env` to:

```text
postgresql://<username>:<password>@localhost:5432/aqualife
```

Use the PostgreSQL role password (not the pgAdmin password). URL-encode any
special characters in the username or password. The backend loads this file
when started from either the repository root or the `BACKEND` directory.

The schema is in `DATABASE/schema.sql`. Run it in pgAdmin's Query Tool only
when initializing an empty database: the script drops and recreates the
project tables and therefore deletes existing table data.

Start the API from `BACKEND` with `venv\Scripts\python.exe app.py` on Windows.
Check `http://localhost:5000/api/health`; a successful response includes
`"db": "connected"`.

## 3. Main Entities

- users
- categories
- products
- cart
- cart_items
- orders
- order_items
- reviews

## 4. users

```text
id              BIGSERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
role            VARCHAR(20) NOT NULL DEFAULT 'customer'
status          VARCHAR(20) NOT NULL DEFAULT 'active'
phone           VARCHAR(30)
address         TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Allowed role:

```text
customer
admin
```

Allowed status:

```text
active
inactive
```

## 5. categories

```text
id              BIGSERIAL PRIMARY KEY
name            VARCHAR(100) UNIQUE NOT NULL
description     TEXT
status          VARCHAR(20) DEFAULT 'active'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## 6. products

```text
id              BIGSERIAL PRIMARY KEY
category_id     BIGINT REFERENCES categories(id)
name            VARCHAR(255) NOT NULL
description     TEXT
price           NUMERIC(12,2) NOT NULL
stock           INTEGER NOT NULL DEFAULT 0
image           TEXT
status          VARCHAR(20) DEFAULT 'active'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Constraints:

```text
price >= 0
stock >= 0
```

Recommended statuses:

```text
active
inactive
```

## 7. cart

```text
id              BIGSERIAL PRIMARY KEY
user_id         BIGINT UNIQUE REFERENCES users(id)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Each customer has at most one active cart.

## 8. cart_items

```text
id              BIGSERIAL PRIMARY KEY
cart_id         BIGINT REFERENCES cart(id) ON DELETE CASCADE
product_id      BIGINT REFERENCES products(id)
quantity        INTEGER NOT NULL
```

Constraints:

```text
quantity > 0
UNIQUE(cart_id, product_id)
```

## 9. orders

```text
id                BIGSERIAL PRIMARY KEY
user_id           BIGINT REFERENCES users(id)
total_amount      NUMERIC(12,2) NOT NULL
status            VARCHAR(30) NOT NULL
shipping_name     VARCHAR(100) NOT NULL
shipping_phone    VARCHAR(30) NOT NULL
shipping_address  TEXT NOT NULL
payment_method    VARCHAR(30) NOT NULL
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

Order statuses:

```text
pending
confirmed
processing
shipping
completed
cancelled
```

Payment methods:

```text
cod
bank_transfer
```

## 10. order_items

```text
id              BIGSERIAL PRIMARY KEY
order_id        BIGINT REFERENCES orders(id) ON DELETE CASCADE
product_id      BIGINT REFERENCES products(id)
product_name    VARCHAR(255) NOT NULL
unit_price      NUMERIC(12,2) NOT NULL
quantity        INTEGER NOT NULL
subtotal        NUMERIC(12,2) NOT NULL
```

Store `product_name` and `unit_price` as historical snapshots so old orders remain correct after a product is edited.

## 11. reviews

```text
id              BIGSERIAL PRIMARY KEY
user_id         BIGINT REFERENCES users(id)
product_id      BIGINT REFERENCES products(id)
rating          INTEGER NOT NULL
comment         TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Constraint:

```text
rating BETWEEN 1 AND 5
```

Optionally:

```text
UNIQUE(user_id, product_id)
```

## 12. Relationships

```text
users 1---1 cart
cart 1---N cart_items
products 1---N cart_items

categories 1---N products

users 1---N orders
orders 1---N order_items
products 1---N order_items

users 1---N reviews
products 1---N reviews
```

## 13. Admin Dashboard Queries

Dashboard should derive its metrics from orders/products/users.

Examples:

### Total revenue

Use completed orders:

```sql
SELECT COALESCE(SUM(total_amount), 0)
FROM orders
WHERE status = 'completed';
```

### Revenue by day

```sql
SELECT DATE(created_at) AS day,
       SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY day;
```

### Revenue by month

```sql
SELECT DATE_TRUNC('month', created_at) AS month,
       SUM(total_amount) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

### Best-selling products

Aggregate `order_items` belonging to completed orders.

### Low-stock products

Filter products where `stock` is below a configurable threshold.

## 14. Important Indexes

Recommended:

```text
users(email)
products(category_id)
products(status)
products(name)
orders(user_id)
orders(status)
orders(created_at)
order_items(order_id)
order_items(product_id)
reviews(product_id)
```

## 15. Checkout Transaction

```text
BEGIN

1. Read current cart
2. Lock/check relevant products
3. Validate stock
4. Read current prices
5. Calculate totals
6. Insert order
7. Insert order_items
8. Decrease product stock
9. Clear cart

COMMIT
```

On any critical error:

```text
ROLLBACK
```

## 16. Data Integrity

- Never allow negative stock.
- Never allow negative prices.
- Never trust frontend totals.
- Use database transactions for checkout.
- Do not physically delete products that are required by historical orders; deactivate them instead where appropriate.
- Never return `password_hash` through normal API responses.
