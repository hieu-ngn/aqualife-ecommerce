import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from app import create_app
from config.database import get_db_cursor

app = create_app()

with get_db_cursor(commit=True) as cur:
    cur.execute("SELECT id, name FROM products ORDER BY id;")
    prods = {row["name"]: row["id"] for row in cur.fetchall()}
    print(f"Total products: {len(prods)}")
    
    # Check key fish
    target_prods = ["Cá Nemo", "Cá Hoàng Đế (Angelfish biển)", "San hô Torch", "Cá Thần Tiên 3 Màu", "Tép Blue Dream"]
    for tp in target_prods:
        print(f"Product '{tp}': {prods.get(tp)}")

    cur.execute("""
        INSERT INTO users (name, email, password_hash, role)
        VALUES 
            ('Anh Hoàng Dương', 'hoangduong@aqualife.com', 'scrypt:32768:8:1$seed$seed', 'customer'),
            ('Chị Hồng Diệp', 'hongdiep@aqualife.com', 'scrypt:32768:8:1$seed$seed', 'customer'),
            ('Anh Minh Tuấn', 'minhtuan@aqualife.com', 'scrypt:32768:8:1$seed$seed', 'customer'),
            ('Chị Thanh Thảo', 'thanhthao@aqualife.com', 'scrypt:32768:8:1$seed$seed', 'customer')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
    """)

    sample_reviews = [
        (
            'hoangduong@aqualife.com',
            prods.get('Cá Nemo') or 1,
            5,
            'Chưa bao giờ tôi nhận được những chú cá khỏe mạnh và màu sắc tuyệt vời như vậy khi mua online. Aqualife thực sự là nơi uy tín nhất.',
            '30 days'
        ),
        (
            'hongdiep@aqualife.com',
            prods.get('San hô Torch') or 2,
            5,
            'Dịch vụ thiết kế bể cá biển của Aqualife đã biến phòng khách của tôi thành một thủy cung thu nhỏ đầy nghệ thuật. Đội ngũ kỹ thuật rất tận tâm.',
            '29 days'
        ),
        (
            'minhtuan@aqualife.com',
            prods.get('Cá Hoàng Đế (Angelfish biển)') or 3,
            5,
            'Cá hoàng đế về thích nghi rất nhanh, bơi khoẻ và màu sắc óng ánh tuyệt đẹp. Đóng gói oxy 3 lớp cực kỳ chu đáo!',
            '20 days'
        ),
        (
            'thanhthao@aqualife.com',
            prods.get('Tép Blue Dream') or 4,
            4,
            'Tép Blue Dream màu xanh đậm rất bắt mắt, thả bể là chịu khó đi lùng rêu ngay. Sẽ tiếp tục ủng hộ shop!',
            '10 days'
        )
    ]

    for email, prod_id, rating, comment, interval in sample_reviews:
        cur.execute(f"""
            INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
            SELECT u.id, %s, %s, %s, NOW() - INTERVAL '{interval}'
            FROM users u WHERE u.email = %s
            ON CONFLICT (user_id, product_id) DO UPDATE 
            SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = EXCLUDED.created_at;
        """, (prod_id, rating, comment, email))

    print("Sample reviews seeded successfully.")

    from services.review_service import list_featured_reviews
    reviews = list_featured_reviews(limit=10)
    print(f"Total featured reviews returned: {len(reviews)}")
    for idx, r in enumerate(reviews, 1):
        print(f"{idx}. [{r['rating']}*] {r['user_name']} - Product: {r['product_name']}: {r['comment'][:60]}...")
