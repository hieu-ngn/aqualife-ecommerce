# aqualife-ecommerce
A full-stack e-commerce website for buying and selling ornamental fish, featuring product management, user authentication, shopping cart, and order management.


## Dữ liệu demo cho dashboard BI (tùy chọn, chỉ môi trường dev)

`DATABASE/seed.sql` chỉ có vài đơn hàng. Để dashboard **Báo cáo doanh thu** có dữ liệu 12 tháng:

```bash
cd BACKEND
python scripts/seed_bi_demo.py          # tạo ~45 khách + ~800 đơn demo (email *@demo.aqualife.test)
python scripts/seed_bi_demo.py --clean  # xóa dữ liệu demo
```

Chạy lại script sẽ làm mới mốc thời gian theo ngày hiện tại. Mật khẩu khách demo: `Demo@12345`.
Chạy test: `cd BACKEND && python -m pytest tests -q`.
