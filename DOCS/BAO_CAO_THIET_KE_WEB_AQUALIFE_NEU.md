<div align="center">

### ĐẠI HỌC KINH TẾ QUỐC DÂN
### TRƯỜNG CÔNG NGHỆ
**--------□□&□□--------**

![Logo Đại học Kinh tế Quốc dân](C:/Users/hieud/.gemini/antigravity/brain/46e24952-c547-4184-8153-7cc6ec3adce4/neu_logo.jpeg)

# BÁO CÁO BÀI TẬP LỚN
## HỌC PHẦN: THIẾT KẾ WEB

### ĐỀ TÀI:
# XÂY DỰNG HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ KINH DOANH SINH VẬT CẢNH VÀ PHỤ KIỆN THỦY SINH AQUALIFE E-COMMERCE

</div>

<br/>

| Thông tin | Chi tiết |
| :--- | :--- |
| **Nhóm sinh viên thực hiện** | 1. **Nguyễn Minh Hiếu** |
| | 2. **Trần Xuân Dương** |
| | 3. **Trần Anh Tuấn** |
| | 4. **Nguyễn Thị Hồng Diệp** |
| **Học phần** | Thiết kế Web |
| **Giảng viên hướng dẫn** | **Phạm Hồng Thảo** |

<div align="center">

**Hà Nội, 10/2026**

</div>

---

<div align="center">

### ĐẠI HỌC KINH TẾ QUỐC DÂN
### TRƯỜNG CÔNG NGHỆ
**--------□□&□□--------**

![Logo Đại học Kinh tế Quốc dân](C:/Users/hieud/.gemini/antigravity/brain/46e24952-c547-4184-8153-7cc6ec3adce4/neu_logo.jpeg)

# BÁO CÁO ĐỒ ÁN MÔN HỌC THIẾT KẾ WEB
## XÂY DỰNG HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ KINH DOANH SINH VẬT CẢNH VÀ PHỤ KIỆN THỦY SINH AQUALIFE E-COMMERCE

</div>

* **Nhóm sinh viên thực hiện**:
  1. **Nguyễn Minh Hiếu** — Mã SV: `1123....`
  2. **Trần Xuân Dương** — Mã SV: `1123....`
  3. **Trần Anh Tuấn** — Mã SV: `1123....`
  4. **Nguyễn Thị Hồng Diệp** — Mã SV: `1123....`
* **Lớp học phần**: Thiết kế Web
* **Ngành**: Công nghệ thông tin
* **Khoa**: Công nghệ thông tin — Trường Công nghệ
* **Giảng viên hướng dẫn**: **Phạm Hồng Thảo**

<br/>

<div align="right">

*(Chữ ký Giảng viên hướng dẫn)*

</div>

<div align="center">

**Hà Nội, 10/2026**

</div>

---

# MỤC LỤC

* **MỤC LỤC** ................................................................................................................................. i
* **LỜI CAM ĐOAN** ................................................................................................................... iii
* **LỜI CẢM ƠN** ........................................................................................................................ iv
* **DANH MỤC CÁC TỪ VIẾT TẮT** ....................................................................................... v
* **DANH MỤC BẢNG** .............................................................................................................. vi
* **DANH MỤC HÌNH** ............................................................................................................. vii
* **MỞ ĐẦU** ................................................................................................................................ 1
* **CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI** ................................................................................... 2
  * 1.1. Đặt vấn đề ......................................................................................................................... 2
  * 1.2. Mục tiêu nghiên cứu .......................................................................................................... 3
    * 1.2.1. Mục tiêu tổng quát ..................................................................................................... 3
    * 1.2.2. Mục tiêu cụ thể .......................................................................................................... 3
  * 1.3. Đối tượng nghiên cứu ....................................................................................................... 4
  * 1.4. Phạm vi nghiên cứu .......................................................................................................... 5
    * 1.4.1. Phạm vi đối tượng sử dụng và phạm vi triển khai .................................................... 5
    * 1.4.2. Phạm vi chức năng ..................................................................................................... 5
    * 1.4.3. Phạm vi phi chức năng .............................................................................................. 6
    * 1.4.4. Các vấn đề ngoài phạm vi nghiên cứu ...................................................................... 7
  * 1.5. Đóng góp của đề tài và Phân công nhiệm vụ nhóm ......................................................... 7
* **CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ LIÊN QUAN** ........................... 9
  * 2.1. Tổng quan về Thương mại điện tử và số hóa kinh doanh sinh vật cảnh thủy sinh ........... 9
    * 2.1.1. Thực trạng và sự cần thiết của việc chuẩn hóa thông tin sinh태 học thủy sinh ....... 9
    * 2.1.2. Xu hướng thiết kế trải nghiệm thương mại điện tử chuyên biệt (Curated E-commerce) .. 9
  * 2.2. Cơ sở lý thuyết về công nghệ phát triển Giao diện người dùng (Frontend) ................... 10
    * 2.2.1. Tiêu chuẩn HTML5 ngữ nghĩa (Semantic HTML5) và CSS3 hiện đại .................. 10
    * 2.2.2. Lập trình bất đồng bộ với Vanilla JavaScript (ES6+ Fetch API) ............................ 10
    * 2.2.3. Ngôn ngữ thiết kế "The Oceanic Curator" trong quản trị hệ sinh thái .................... 11
  * 2.3. Cơ sở lý thuyết về Kiến trúc phần mềm Máy chủ (Backend) ......................................... 11
    * 2.3.1. Kiến trúc phân tầng (3-Tier Architecture: Routes – Controllers – Services) ......... 11
    * 2.3.2. Dịch vụ web chuẩn RESTful API và phân quyền theo vai trò RBAC ..................... 12
    * 2.3.3. Cơ chế xác thực phiên (Session-based Authentication) và mã hóa mật khẩu Bcrypt 12
  * 2.4. Hệ quản trị cơ sở dữ liệu PostgreSQL và Giao dịch toàn vẹn ACID ............................. 13
    * 2.4.1. Hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL và Connection Pooling ................ 13
    * 2.4.2. Cơ chế khóa bi quan (`SELECT ... FOR UPDATE`) chống xung đột tồn kho ....... 13
* **CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG** ............................................... 14
  * 3.1. Phân tích hệ thống .......................................................................................................... 14
    * 3.1.1. Phân tích chức năng ................................................................................................ 14
      * 3.1.1.1. Biểu đồ Use Case tổng quát và phân rã ........................................................... 14
      * 3.1.1.2. Biểu đồ hoạt động (Activity Diagrams) — Chi tiết các luồng nghiệp vụ ....... 16
    * 3.1.2. Phân tích cấu trúc (Sơ đồ ERD & Biểu đồ Lớp Class Diagram) .......................... 20
      * 3.1.2.1. Sơ đồ thực thể quan hệ (ERD) ......................................................................... 20
      * 3.1.2.2. Biểu đồ lớp (Class Diagram) mức phân tích ................................................... 22
    * 3.1.3. Từ điển dữ liệu (Data Dictionary) .......................................................................... 23
    * 3.1.4. Phân tích hành vi (Biểu đồ tuần tự — Sequence Diagrams) .................................. 27
      * 3.1.4.1. Biểu đồ tuần tự chức năng Đăng nhập, Xác thực và Phân luồng Vai trò ....... 27
      * 3.1.4.2. Biểu đồ tuần tự chức năng Thêm vào giỏ hàng và Kiểm tra tồn kho .............. 28
      * 3.1.4.3. Biểu đồ tuần tự chức năng Đặt hàng và Giao dịch ACID (`SELECT FOR UPDATE`) 29
      * 3.1.4.4. Biểu đồ tuần tự chức năng Đánh giá sản phẩm Xác thực mua hàng (Verified Purchase) 30
      * 3.1.4.5. Biểu đồ tuần tự chức năng Quản trị đơn hàng và Hoàn kho tự động ............. 31
* **CHƯƠNG 4. KẾT QUẢ TRIỂN KHAI VÀ ĐÁNH GIÁ** ................................................ 32
  * 4.1. Môi trường cài đặt và kiến trúc triển khai hợp nhất (Unified Server) ........................... 32
  * 4.2. Kết quả triển khai các phân hệ chức năng ..................................................................... 33
    * 4.2.1. Phân hệ Khách hàng (Storefront — M01 đến M09) .............................................. 33
    * 4.2.2. Phân hệ Quản trị "Aqualife Admin — The Oceanic Curator" (M10 đến M12) .... 35
  * 4.3. Kết quả kiểm thử tự động và đánh giá thực nghiệm ...................................................... 36
    * 4.3.1. Kịch bản kiểm thử tự động End-to-End với Pytest ................................................ 36
    * 4.3.2. Đánh giá hiệu năng và tính toàn vẹn dữ liệu .......................................................... 38
* **KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN** ......................................................................... 39
* **TÀI LIỆU THAM KHẢO** ................................................................................................... 40
* **PHỤ LỤC** ............................................................................................................................. 41

---

# LỜI CAM ĐOAN

Chúng tôi xin cam đoan rằng báo cáo bài tập lớn học phần **Thiết kế Web** với đề tài **"Xây dựng Hệ thống Thương mại Điện tử Kinh doanh Sinh vật Cảnh và Phụ kiện Thủy sinh Aqualife E-commerce"** là công trình nghiên cứu, thiết kế và lập trình của tập thể nhóm 4 thành viên (**Nguyễn Minh Hiếu, Trần Xuân Dương, Trần Anh Tuấn, Nguyễn Thị Hồng Diệp**), được thực hiện dưới sự hướng dẫn tận tình và khoa học của giảng viên **Phạm Hồng Thảo**.

Toàn bộ mã nguồn Frontend (`HTML5`, `CSS3`, `Vanilla JavaScript`), Backend (`Python Flask`), cấu trúc cơ sở dữ liệu (`PostgreSQL`), kịch bản kiểm thử tự động (`Pytest`) và các nội dung phân tích thiết kế trình bày trong báo cáo này là kết quả làm việc nghiêm túc của nhóm. Các số liệu, kết quả thực nghiệm và nội dung phân tích trong báo cáo là hoàn toàn trung thực, không sao chép từ bất kỳ công trình nào mà không có trích dẫn rõ ràng. Nhóm chúng tôi xin chịu hoàn toàn trách nhiệm về tính trung thực và chính xác của các nội dung trong báo cáo này.

<div align="right">

*Hà Nội, ngày 18 tháng 10 năm 2026*  
**Đại diện Nhóm Sinh viên thực hiện**  
*(Ký và ghi rõ họ tên)*  
<br/>
**Nguyễn Minh Hiếu — Trần Xuân Dương**  
**Trần Anh Tuấn — Nguyễn Thị Hồng Diệp**

</div>

---

# LỜI CẢM ƠN

Để hoàn thành tốt báo cáo và sản phẩm phần mềm của học phần **Thiết kế Web**, bên cạnh sự nỗ lực làm việc nhóm không ngừng nghỉ của các thành viên, chúng tôi đã nhận được sự dìu dắt, chỉ bảo và tạo điều kiện thuận lợi rất lớn từ quý thầy cô trong Khoa Công nghệ thông tin — Trường Công nghệ, Đại học Kinh tế Quốc dân.

Trước hết, nhóm chúng tôi xin gửi lời cảm ơn chân thành và sâu sắc nhất tới giảng viên **Phạm Hồng Thảo** — người đã trực tiếp giảng dạy, truyền đạt những kiến thức nền tảng lẫn thực tiễn quý báu về kiến trúc ứng dụng Web, giao thức HTTP/RESTful API, thiết kế giao diện người dùng hiện đại và tận tình định hướng, góp ý cho nhóm trong suốt quá trình phân tích, thiết kế và hoàn thiện hệ thống **Aqualife E-commerce**.

Xin cảm ơn các thầy cô trong Khoa Công nghệ thông tin, Trường Công nghệ — Đại học Kinh tế Quốc dân đã xây dựng chương trình đào tạo bài bản, giúp chúng tôi trang bị tư duy kỹ thuật phần mềm vững chắc.

Mặc dù nhóm đã dành nhiều tâm huyết để hoàn thiện đầy đủ 12 phân hệ từ trang cửa hàng cho khách hàng đến cổng quản trị chuyên sâu cho Admin, song do thời gian và kinh nghiệm thực tế còn nhất định, báo cáo không tránh khỏi những thiếu sót. Nhóm chúng tôi kính mong nhận được sự nhận xét, chỉ dẫn và góp ý của giảng viên **Phạm Hồng Thảo** cùng các bạn sinh viên để sản phẩm và báo cáo được hoàn thiện hơn nữa.

---

# DANH MỤC CÁC TỪ VIẾT TẮT

| Từ viết tắt | Tiếng Anh | Ý nghĩa tiếng Việt |
| :--- | :--- | :--- |
| **ACID** | Atomicity, Consistency, Isolation, Durability | 4 thuộc tính đảm bảo tính toàn vẹn của giao dịch cơ sở dữ liệu |
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **COD** | Cash On Delivery | Thanh toán tiền mặt khi nhận hàng |
| **CORS** | Cross-Origin Resource Sharing | Cơ chế chia sẻ tài nguyên giữa các nguồn (origin) khác nhau |
| **CRUD** | Create, Read, Update, Delete | Bốn thao tác cơ bản: Tạo mới, Đọc, Cập nhật, Xóa dữ liệu |
| **CSS** | Cascading Style Sheets | Ngôn ngữ định kiểu giao diện trang web |
| **CSV** | Comma-Separated Values | Định dạng tệp văn bản lưu bảng dữ liệu phân tách bằng dấu phẩy |
| **DOM** | Document Object Model | Mô hình đối tượng tài liệu HTML trên trình duyệt |
| **ERD** | Entity-Relationship Diagram | Sơ đồ thực thể mối quan hệ trong cơ sở dữ liệu |
| **HTML** | HyperText Markup Language | Ngôn ngữ đánh dấu siêu văn bản |
| **HTTP** | HyperText Transfer Protocol | Giao thức truyền tải siêu văn bản |
| **JSON** | JavaScript Object Notation | Định dạng trao đổi dữ liệu nhẹ dựa trên văn bản |
| **KPI** | Key Performance Indicator | Chỉ số đo lường hiệu quả hoạt động cốt lõi |
| **RBAC** | Role-Based Access Control | Cơ chế kiểm soát truy cập dựa trên vai trò người dùng |
| **REST** | Representational State Transfer | Kiến trúc thiết kế dịch vụ web phi trạng thái |
| **SKU** | Stock Keeping Unit | Mã định danh đơn vị lưu kho sản phẩm |
| **SQL** | Structured Query Language | Ngôn ngữ truy vấn có cấu trúc |
| **UI/UX** | User Interface / User Experience | Giao diện người dùng / Trải nghiệm người dùng |

---

# DANH MỤC BẢNG

* **Bảng 1.1**: Phân rã 12 phân hệ chức năng cốt lõi (M01 – M12) của hệ thống Aqualife E-commerce
* **Bảng 1.2**: Bảng phân công nhiệm vụ chi tiết của 4 thành viên trong nhóm thực hiện
* **Bảng 3.1**: Đặc tả tổng hợp các Use Case theo nhóm tác nhân hệ thống
* **Bảng 3.2**: Từ điển dữ liệu Bảng `users` — Quản lý người dùng và phân quyền
* **Bảng 3.3**: Từ điển dữ liệu Bảng `categories` — Danh mục sinh vật cảnh và phụ kiện
* **Bảng 3.4**: Từ điển dữ liệu Bảng `products` — Sản phẩm thủy sinh và phân loại môi trường nước (`water_type`)
* **Bảng 3.5**: Từ điển dữ liệu Bảng `cart_items` — Giỏ hàng lưu trữ bền vững trên máy chủ
* **Bảng 3.6**: Từ điển dữ liệu Bảng `orders` — Đơn đặt hàng và trạng thái vận chuyển
* **Bảng 3.7**: Từ điển dữ liệu Bảng `order_items` — Chi tiết từng mặt hàng và bản chụp giá tại thời điểm mua
* **Bảng 3.8**: Từ điển dữ liệu Bảng `reviews` — Đánh giá sản phẩm có xác thực mua hàng
* **Bảng 4.1**: Thống kê phân bố 56 sản phẩm thực tế theo Danh mục và Môi trường nước trên PostgreSQL
* **Bảng 4.2**: Kết quả thực thi 9 kịch bản kiểm thử tự động End-to-End bằng bộ công cụ `Pytest`
* **Bảng A.1**: Danh mục 28 RESTful API Endpoints của hệ thống Aqualife E-commerce

---

# DANH MỤC HÌNH

* **Hình 2.1**: Mô hình kiến trúc phân tầng 3 lớp (3-Tier Architecture) của hệ thống Aqualife E-commerce
* **Hình 3.1**: Biểu đồ Use Case tổng quát của hệ thống Aqualife E-commerce
* **Hình 3.2**: Biểu đồ hoạt động (Activity Diagram) chức năng Đăng nhập và Tự động phân luồng Admin / Khách hàng
* **Hình 3.3**: Biểu đồ hoạt động (Activity Diagram) quy trình Đặt hàng và Giao dịch ACID với khóa `SELECT FOR UPDATE`
* **Hình 3.4**: Biểu đồ hoạt động (Activity Diagram) chức năng Đánh giá sản phẩm có xác thực mua hàng (Verified Purchase)
* **Hình 3.5**: Biểu đồ hoạt động (Activity Diagram) chức năng Quản trị sản phẩm và Phân loại môi trường nước (`water_type`)
* **Hình 3.6**: Sơ đồ thực thể quan hệ (ERD) cơ sở dữ liệu PostgreSQL của hệ thống Aqualife (7 bảng)
* **Hình 3.7**: Biểu đồ lớp (Class Diagram) mức phân tích của hệ thống Aqualife E-commerce
* **Hình 3.8**: Biểu đồ tuần tự (Sequence Diagram) chức năng Đăng nhập, Xác thực phiên và Phân luồng Vai trò
* **Hình 3.9**: Biểu đồ tuần tự (Sequence Diagram) chức năng Thêm vào giỏ hàng và Kiểm tra tồn kho
* **Hình 3.10**: Biểu đồ tuần tự (Sequence Diagram) chức năng Đặt hàng và Giao dịch ACID
* **Hình 3.11**: Biểu đồ tuần tự (Sequence Diagram) chức năng Đánh giá sản phẩm Xác thực mua hàng
* **Hình 3.12**: Biểu đồ tuần tự (Sequence Diagram) chức năng Quản trị đơn hàng và Hoàn kho tự động khi hủy đơn

---

# MỞ ĐẦU

Trong kỷ nguyên chuyển đổi số mạnh mẽ hiện nay, Thương mại điện tử (E-commerce) đã trở thành kênh giao dịch chủ đạo trong hầu hết các ngành hàng bán lẻ tại Việt Nam. Tuy nhiên, đối với lĩnh vực kinh doanh sinh vật cảnh thủy sinh (cá cảnh, tép cảnh, ốc cảnh, cây thủy sinh, san hô biển) và thiết bị hồ cá, hoạt động mua bán trực tuyến vẫn đang đối mặt với nhiều rào cản đặc thù. Khác với các mặt hàng tiêu dùng thông thường, mỗi loài sinh vật thủy sinh đòi hỏi những điều kiện sống nghiêm ngặt về **môi trường nước** (*nước ngọt, nước mặn/biển, nước lợ*), thông số nhiệt độ, độ pH, độ mặn và mức độ tương thích sinh học giữa các loài trong cùng một bể nuôi.

Trên thực tế, phần lớn các cửa hàng cá cảnh hiện nay vẫn vận hành theo phương thức bán hàng thủ công qua mạng xã hội hoặc các trang web giới thiệu tĩnh thiếu gắn kết với cơ sở dữ liệu tồn kho thực tế. Người mua gặp khó khăn khi tra cứu loài cá phù hợp với môi trường bể hiện có (ví dụ: mua nhầm cá nước mặn hoặc cá nước lợ thả vào bể thủy sinh nước ngọt gây thiệt hại sinh vật). Ở chiều ngược lại, chủ cửa hàng gặp nhiều bất cập trong việc kiểm soát số lượng tồn kho theo thời gian thực, dễ xảy ra tình trạng bán vượt số lượng tồn kho (*overselling*) khi nhiều khách hàng cùng đặt mua một dòng cá quý hiếm, hoặc thiếu công cụ điều chỉnh giá bán, cập nhật tồn kho hàng loạt và thống kê doanh thu chính xác theo từng phân hệ sinh thái.

Xuất phát từ thực tiễn đó, nhóm 4 sinh viên chúng tôi đã lựa chọn và thực hiện đề tài **"Xây dựng Hệ thống Thương mại Điện tử Kinh doanh Sinh vật Cảnh và Phụ kiện Thủy sinh Aqualife E-commerce"** trong khuôn khổ học phần **Thiết kế Web** dưới sự hướng dẫn của giảng viên **Phạm Hồng Thảo**.

Hệ thống **Aqualife E-commerce** được nghiên cứu và phát triển thành một nền tảng web toàn diện (*Full-stack Web Application*), kết hợp giữa giao diện cửa hàng trực quan dành cho người chơi thủy sinh và cổng quản trị chuyên sâu mang ngôn ngữ thiết kế **"Aqualife Admin — The Oceanic Curator"** dành cho nhà quản lý. Hệ thống không chỉ giải quyết bài toán tìm kiếm, phân loại sinh vật theo **Danh mục loài** và **Hệ môi trường nước** (`Nước ngọt`, `Nước mặn`, `Nước lợ`, `Đa môi trường`), mà còn đảm bảo tính toàn vẹn dữ liệu tuyệt đối trong giỏ hàng và thanh toán thông qua cơ chế giao dịch **ACID Transaction** với khóa bản ghi bi quan (`SELECT ... FOR UPDATE`) trên hệ quản trị cơ sở dữ liệu **PostgreSQL**. Bên cạnh đó, cơ chế **Đánh giá xác thực mua hàng (Verified Purchase Review)** giúp xây dựng cộng đồng người chơi thủy sinh minh bạch, chỉ cho phép khách hàng đã nhận hàng thành công (`completed`) gửi đánh giá chất lượng sinh vật.

---

# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

## 1.1. Đặt vấn đề

Thú chơi thủy sinh và cá cảnh nghệ thuật (Aquascaping & Reef Keeping) đang phát triển nhanh chóng tại các đô thị lớn, kéo theo nhu cầu tìm mua đa dạng các dòng cá cảnh nước ngọt, cá biển rạn san hô (Reef), tép cảnh, ốc vệ sinh bể và trang thiết bị lọc, chiếu sáng chuyên dụng. Tuy nhiên, khảo sát thực tế hoạt động kinh doanh của các cửa hàng thủy sinh hiện nay cho thấy 4 nhóm vấn đề cốt lõi cần được giải quyết bằng công nghệ Web:

1. **Thiếu hệ thống phân loại đa chiều theo môi trường sinh thái nước**: Người mới chơi thủy sinh thường nhầm lẫn giữa các loài sống ở *Nước ngọt* (như Cá Neon Vua, Tép Fire Red), *Nước lợ* (như Cá Nóc Số 8, Cá Bắn Nước, Tép Mũi Đỏ) và *Nước mặn / Biển* (như Cá Hề Ocellaris, Cá Blue Tang, San hô Torch). Các website bán hàng thông thường chỉ phân loại theo nhóm hàng (Cá, Tép, Ốc) mà thiếu bộ lọc và nhãn sinh thái môi trường nước (`water_type`), khiến người mua mất nhiều thời gian tra cứu và dễ chọn sai loài.
2. **Rủi ro sai lệch tồn kho và xung đột đơn hàng trong giao dịch trực tuyến**: Sinh vật cảnh là mặt hàng tươi sống có số lượng tồn kho giới hạn theo từng đợt nhập. Nếu giỏ hàng chỉ lưu tạm ở trình duyệt (`localStorage`) mà không đồng bộ với cơ sở dữ liệu máy chủ, hoặc quy trình đặt hàng không được bọc trong một giao dịch nguyên tử (*Atomic Transaction*), hệ thống rất dễ gặp lỗi trừ âm kho khi hai khách hàng cùng đặt mua những cá thể cuối cùng, hoặc không tự động hoàn trả tồn kho khi đơn hàng bị hủy.
3. **Vấn nạn đánh giá ảo làm giảm niềm tin của người mua sinh vật sống**: Đối với mặt hàng cá cảnh và san hô sống, uy tín về sức khỏe sinh vật và quy cách đóng gói vận chuyển oxy đóng vai trò quyết định. Nếu bất kỳ tài khoản nào cũng có thể đăng bình luận mà không kiểm chứng lịch sử mua hàng, hệ thống sẽ xuất hiện các đánh giá thiếu khách quan.
4. **Hạn chế trong công cụ quản trị vận hành của chủ cửa hàng**: Quản trị viên cửa hàng thủy sinh cần một không gian làm việc riêng biệt ngay sau khi đăng nhập để theo dõi tức thời các chỉ số sức khỏe kho hàng (tổng số loài, tỷ lệ đang bán, cảnh báo loài sắp hết hàng $\le 5$ cá thể, loài đã hết hàng), lọc theo môi trường nước, cập nhật giá/tồn kho hàng loạt (*Bulk Action*), xuất/nhập dữ liệu CSV/JSON và kiểm soát chặt chẽ máy trạng thái đơn hàng.

Từ những vấn đề cấp thiết nêu trên, việc xây dựng hệ thống **Aqualife E-commerce** theo kiến trúc Web hiện đại (Frontend `HTML5/CSS3/Vanilla JS` kết hợp Backend `Python Flask` và CSDL `PostgreSQL`) là giải pháp thiết thực nhằm chuẩn hóa toàn bộ quy trình từ trưng bày, tư vấn thông số môi trường nước, đặt hàng an toàn giao dịch cho tới quản trị hệ sinh thái cửa hàng.

## 1.2. Mục tiêu nghiên cứu

### 1.2.1. Mục tiêu tổng quát
Xây dựng hoàn chỉnh hệ thống Thương mại Điện tử **Aqualife E-commerce** phục vụ hoạt động trưng bày, tra cứu sinh thái, mua sắm trực tuyến và quản trị kinh doanh sinh vật cảnh thủy sinh. Hệ thống hướng tới trải nghiệm người dùng mượt mà, thẩm mỹ đại dương hiện đại, đảm bảo tính toàn vẹn dữ liệu giao dịch trên PostgreSQL và cung cấp bộ công cụ quản trị chuyên sâu **"The Oceanic Curator"** cho người quản lý.

### 1.2.2. Mục tiêu cụ thể
Để hiện thực hóa mục tiêu tổng quát, nhóm đề ra 8 mục tiêu cụ thể tương ứng với 12 phân hệ chức năng (M01 – M12):
* **Phân tích và thiết kế kiến trúc hệ thống**: Xác định đầy đủ các tác nhân, biểu đồ Use Case, biểu đồ hoạt động (Activity Diagram), biểu đồ tuần tự (Sequence Diagram), biểu đồ lớp (Class Diagram) và sơ đồ thực thể quan hệ (ERD) gồm 7 bảng chuẩn hóa 3NF trên PostgreSQL.
* **Xây dựng danh mục sinh vật cảnh đa chiều và phân loại môi trường nước**: Quản lý và hiển thị 56+ sản phẩm thuộc 6 danh mục (*Cá cảnh, Tép cảnh, Ốc cảnh, Thủy sinh & San hô, Thức ăn, Bể & Thiết bị*) kết hợp phân loại rõ 4 hệ môi trường nước (*Nước ngọt, Nước mặn, Nước lợ, Đa môi trường*) cùng bảng thông số kỹ thuật hồ nuôi (nhiệt độ, độ pH, kích thước, tập tính).
* **Phát triển hệ thống xác thực và phân luồng giao diện thông minh theo vai trò**: Hỗ trợ đăng ký, đăng nhập bảo mật bằng `bcrypt` và `Flask Session`; tự động nhận diện vai trò tài khoản khi đăng nhập để đưa Khách hàng về trang cửa hàng và đưa Quản trị viên (`role = 'admin'`) chuyển thẳng vào giao diện **Aqualife Admin — The Oceanic Curator**.
* **Xây dựng giỏ hàng đồng bộ máy chủ và quy trình thanh toán ACID**: Lưu trữ giỏ hàng bền vững trong bảng `cart_items`, kết hợp cơ chế khóa bản ghi `SELECT ... FOR UPDATE` khi tạo đơn hàng nhằm kiểm tra tồn kho, trừ kho nguyên tử và lưu bản chụp giá (`unit_price`, `product_name`) vào `order_items`.
* **Quản lý vòng đời đơn hàng và hoàn kho tự động**: Hỗ trợ khách hàng theo dõi lịch sử đơn hàng và tự hủy đơn khi đang ở trạng thái chờ xử lý (`pending`), đồng thời tự động cộng trả lại số lượng tồn kho cho từng sản phẩm.
* **Xây dựng cơ chế Đánh giá xác thực mua hàng (Verified Purchase Reviews)**: Ràng buộc quy tắc nghiệp vụ tại tầng Backend chỉ cho phép khách hàng có ít nhất một đơn hàng hoàn tất (`status = 'completed'`) chứa sản phẩm đó mới được phép gửi đánh giá sao và nhận xét.
* **Phát triển cổng quản trị độc lập "Aqualife Admin — The Oceanic Curator"**: Thiết kế giao diện quản trị chuyên biệt bằng thuần `HTML5, CSS3, Vanilla JS` với 4 thẻ KPI tồn kho, bộ lọc đa tiêu chí (từ khóa SKU, danh mục, môi trường nước, khoảng giá, trạng thái tồn kho), thanh tác vụ hàng loạt (*Bulk Action Bar*), xuất báo cáo CSV, nhập dữ liệu JSON và biểu đồ phân tích doanh thu.
* **Kiểm thử tự động hóa và triển khai máy chủ hợp nhất (Unified Server)**: Xây dựng bộ kiểm thử tự động `Pytest` bao phủ toàn bộ các luồng nghiệp vụ và cấu hình Flask phục vụ đồng thời cả Frontend và RESTful API trên cùng một cổng mạng, hỗ trợ truy cập qua mạng LAN và Public Tunnel.

## 1.3. Đối tượng nghiên cứu

Đối tượng nghiên cứu của đề tài tập trung vào 4 mảng chính:
1. **Quy trình nghiệp vụ Thương mại Điện tử chuyên ngành sinh vật cảnh**: Quy trình phân loại sản phẩm theo danh mục và môi trường nước, quản lý thông số kỹ thuật chăm sóc sinh vật, quản lý giỏ hàng, thanh toán đơn hàng, kiểm soát tồn kho tươi sống và xác thực đánh giá sau mua.
2. **Công nghệ phát triển Giao diện Web chuẩn W3C (Frontend Engineering)**: Cấu trúc tài liệu `HTML5` ngữ nghĩa, hệ thống bố cục `CSS3 Grid & Flexbox`, biến giao diện `CSS Custom Properties`, thiết kế đáp ứng đa thiết bị (*Responsive Web Design*) và lập trình tương tác DOM bất đồng bộ bằng `Vanilla JavaScript (ES6+ Fetch API)` không phụ thuộc vào các thư viện nặng nề.
3. **Kiến trúc ứng dụng Web phía máy chủ (Backend Architecture)**: Mô hình phân tầng `Routes – Controllers – Services` trên nền tảng `Python Flask`, thiết kế RESTful API trả về định dạng JSON chuẩn hóa, cơ chế xác thực phiên làm việc (`HTTP Session Cookie`) và phân quyền dựa trên vai trò (`RBAC` qua Decorator `@login_required`, `@admin_required`).
4. **Kỹ thuật quản trị Cơ sở dữ liệu quan hệ và Giao dịch đồng thời**: Thiết kế lược đồ cơ sở dữ liệu `PostgreSQL`, kỹ thuật quản lý hồ kết nối (`ThreadedConnectionPool` trong `psycopg2`), ràng buộc toàn vẹn tham chiếu và xử lý tranh chấp đồng thời bằng khóa bi quan (`SELECT ... FOR UPDATE`).

## 1.4. Phạm vi nghiên cứu

### 1.4.1. Phạm vi đối tượng sử dụng và phạm vi triển khai
Hệ thống phục vụ 3 nhóm tác nhân chính:
* **Khách vãng lai (Guest)**: Duyệt trang chủ, tìm kiếm sản phẩm, lọc theo danh mục và môi trường nước (`Nước ngọt`, `Nước mặn`, `Nước lợ`), xem chi tiết thông số sinh học của từng loài, đọc đánh giá của người mua trước và gửi biểu mẫu liên hệ tư vấn.
* **Khách hàng thành viên (Customer)**: Thực hiện đầy đủ chức năng của khách vãng lai; ngoài ra được quản lý hồ sơ cá nhân, đổi mật khẩu, thêm/sửa/xóa sản phẩm trong giỏ hàng đồng bộ máy chủ, đặt hàng thanh toán (`COD` hoặc `Chuyển khoản ngân hàng`), theo dõi trạng thái đơn hàng, hủy đơn hàng khi đang chờ xử lý và viết đánh giá cho sản phẩm đã mua thành công.
* **Quản trị viên hệ thống (Admin — The Oceanic Curator)**: Đăng nhập và làm việc trên giao diện quản trị độc lập (`/html/admin.html`), quản lý toàn diện danh mục, sản phẩm (bao gồm phân loại môi trường nước `water_type`, SKU, ảnh, giá, tồn kho), thực hiện thao tác hàng loạt (*Bulk Price/Stock/Status*), xuất/nhập dữ liệu CSV/JSON, duyệt và chuyển trạng thái đơn hàng theo quy trình chuẩn, quản lý tài khoản người dùng và phân tích báo cáo doanh thu.

### 1.4.2. Phạm vi chức năng
Hệ thống bao gồm 12 phân hệ chức năng (từ `M01` đến `M12`) được trình bày tổng hợp trong **Bảng 1.1**:

**Bảng 1.1: Phân rã 12 phân hệ chức năng cốt lõi (M01 – M12) của hệ thống Aqualife E-commerce**

| Mã phân hệ | Tên phân hệ chức năng | Đối tượng sử dụng | Mô tả chi tiết các chức năng thành phần |
| :---: | :--- | :--- | :--- |
| **M01** | Trang chủ & Khám phá hệ sinh thái | Guest, Customer | Banner đại dương, danh mục nổi bật, sản phẩm bán chạy, bộ lọc nhanh và điều hướng thông minh. |
| **M02** | Danh mục & Bộ lọc môi trường nước | Guest, Customer | Tìm kiếm từ khóa, lọc kết hợp theo Danh mục loài, Môi trường nước (`Nước ngọt`, `Nước mặn`, `Nước lợ`), khoảng giá và sắp xếp. |
| **M03** | Chi tiết sản phẩm & Thông số sinh học | Guest, Customer | Hiển thị ảnh, giá, tồn kho thực tế, nhãn môi trường nước, bảng thông số hồ nuôi (nhiệt độ, pH, kích thước) và sản phẩm tương tự. |
| **M04** | Xác thực & Phân luồng tài khoản | Guest, Customer, Admin | Đăng ký, đăng nhập (`bcrypt`), đăng xuất, tự động chuyển hướng Admin sang giao diện *The Oceanic Curator*. |
| **M05** | Giỏ hàng đồng bộ máy chủ | Customer | Thêm vào giỏ, tăng/giảm số lượng có kiểm tra trần tồn kho PostgreSQL, xóa từng món hoặc làm trống giỏ. |
| **M06** | Thanh toán & Giao dịch ACID | Customer | Nhập thông tin giao hàng, chọn phương thức thanh toán (`COD` / `Bank Transfer`), khóa tồn kho `SELECT FOR UPDATE` và tạo đơn. |
| **M07** | Liên hệ & Tư vấn chăm sóc bể | Guest, Customer | Gửi yêu cầu tư vấn thiết kế bể thủy sinh, tra cứu thông tin cửa hàng và câu hỏi thường gặp (FAQ). |
| **M08** | Quản lý lịch sử đơn hàng cá nhân | Customer | Xem danh sách đơn đã đặt, lọc theo trạng thái, xem chi tiết mặt hàng và hủy đơn `pending` (tự động hoàn kho). |
| **M09** | Hồ sơ cá nhân & Đánh giá xác thực | Customer | Cập nhật thông tin cá nhân, đổi mật khẩu bảo mật; đăng/sửa/xóa đánh giá sao cho sản phẩm thuộc đơn hàng `completed`. |
| **M10** | Quản trị Sản phẩm & Danh mục (*Oceanic Curator*) | Admin | 4 thẻ KPI kho hàng, CRUD sản phẩm kèm phân loại môi trường nước (`water_type`), tạo mã SKU, Bulk Update, xuất CSV, nhập JSON. |
| **M11** | Quản trị Đơn hàng & Điều phối tồn kho | Admin | Kiểm soát máy trạng thái đơn hàng (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `shipping` $\rightarrow$ `completed` / `cancelled`), tự động hoàn kho khi hủy. |
| **M12** | Quản trị Người dùng & Báo cáo Doanh thu | Admin | Quản lý danh sách khách hàng/admin, khóa/mở khóa tài khoản, phân quyền vai trò, thống kê doanh thu theo ngày/tháng/danh mục. |

### 1.4.3. Phạm vi phi chức năng
* **Tính toàn vẹn dữ liệu giao dịch (ACID Compliance)**: Mọi thao tác đặt hàng và hủy đơn hàng đều được thực thi trong một giao dịch cơ sở dữ liệu duy nhất (`commit=True`). Nếu bất kỳ sản phẩm nào trong giỏ không đủ tồn kho, toàn bộ giao dịch sẽ tự động quay lui (`ROLLBACK`), tuyệt đối không sinh dữ liệu rác.
* **Bảo mật ứng dụng Web**: Mật khẩu người dùng được băm một chiều bằng thuật toán `bcrypt` với muối ngẫu nhiên (`salt`); chống tấn công SQL Injection thông qua truy vấn tham số hóa (`Parameterized Queries` của `psycopg2`); chống XSS trên giao diện thông qua hàm làm sạch chuỗi HTML (`esc()`); bảo vệ các đường dẫn tĩnh chống tấn công duyệt thư mục (`Path Traversal Protection`).
* **Tính khả dụng và thẩm mỹ giao diện**: Giao diện người dùng tuân thủ thiết kế Responsive trên cả máy tính để bàn, máy tính bảng và điện thoại di động. Đặc biệt, giao diện Admin được thiết kế theo phong cách biên tập hiện đại (*Editorial Oceanic Curator*) giúp giảm mỏi mắt và tối ưu tốc độ thao tác quản trị.
* **Khả năng chia sẻ và triển khai linh hoạt**: Máy chủ Flask được cấu hình lắng nghe trên `0.0.0.0:5000` và tự động nhận diện `window.location.origin`, cho phép truy cập trực tiếp qua mạng nội bộ LAN hoặc qua đường truyền Public Tunnel (VS Code DevTunnels / Cloudflare Tunnel) mà không cần cấu hình lại mã nguồn.

### 1.4.4. Các vấn đề ngoài phạm vi nghiên cứu
Để tập trung hoàn thiện chiều sâu kiến trúc và nghiệp vụ cốt lõi của học phần Thiết kế Web, đề tài không triển khai các hạng mục sau:
* Không tích hợp cổng thanh toán trực tuyến tự động thu tiền thật qua thẻ ngân hàng quốc tế (Stripe/VNPay Webhook thực tế) mà mô phỏng quy trình xác nhận chuyển khoản ngân hàng và thanh toán khi nhận hàng (`COD`).
* Không tích hợp hệ thống cảm biến IoT đo nhiệt độ/độ pH trực tiếp từ bể cá phần cứng.

## 1.5. Đóng góp của đề tài và Phân công nhiệm vụ nhóm

### Đóng góp của đề tài
1. **Về mặt học thuật và kỹ thuật thiết kế Web**: Minh họa rõ nét cách xây dựng một ứng dụng Web Full-stack hoàn chỉnh chỉ sử dụng các công nghệ nền tảng cốt lõi (`HTML5`, `CSS3`, `Vanilla JS ES6+`, `Python Flask`, `PostgreSQL`) mà vẫn đạt được kiến trúc phân tầng sạch sẽ, giao diện hiện đại và độ tin cậy giao dịch cao.
2. **Về mặt thực tiễn nghiệp vụ thủy sinh**: Giải quyết bài toán phân loại sinh vật theo **hệ môi trường nước (`water_type`)** đồng bộ xuyên suốt từ cơ sở dữ liệu PostgreSQL đến bộ lọc cửa hàng và bảng quản trị Admin, kết hợp công cụ quản trị hàng loạt (*Bulk Actions*) giúp tiết kiệm thời gian vận hành cửa hàng.

### Phân công nhiệm vụ nhóm 4 thành viên

**Bảng 1.2: Bảng phân công nhiệm vụ chi tiết của 4 thành viên trong nhóm thực hiện**

| STT | Họ và tên sinh viên | Vai trò | Nhiệm vụ phụ trách chính trong dự án | Mức độ hoàn thành |
| :-: | :--- | :---: | :--- | :---: |
| 1 | **Nguyễn Minh Hiếu** | Nhóm trưởng / Full-stack & Database | Thiết kế kiến trúc tổng thể, lược đồ CSDL PostgreSQL (`schema.sql`, `seed.sql`), phát triển Backend luồng Giỏ hàng – Thanh toán ACID (`M05`, `M06`, `M08`), cổng quản trị **Aqualife Admin — The Oceanic Curator** (`M10–M12`), tích hợp phân loại môi trường nước (`water_type`) và kiểm thử tự động `Pytest`. | 100% |
| 2 | **Trần Xuân Dương** | Backend & Auth / Security | Xây dựng hệ thống Xác thực người dùng (`M04`: Đăng ký, Đăng nhập, Đăng xuất, Middleware phân quyền `@login_required`, `@admin_required`), API Hồ sơ cá nhân & Đổi mật khẩu (`M09a`), API Đánh giá xác thực mua hàng (`M09b`). | 100% |
| 3 | **Trần Anh Tuấn** | Frontend Storefront & Catalog | Thiết kế và lập trình giao diện Trang chủ (`M01`), Trang Danh mục & Bộ lọc sản phẩm đa tiêu chí (`M02`), Trang Chi tiết sản phẩm & Thông số sinh học (`M03`), chuẩn hóa dữ liệu hình ảnh 56 loài sinh vật cảnh. | 100% |
| 4 | **Nguyễn Thị Hồng Diệp** | Frontend Checkout, Contact & UI/UX | Thiết kế và lập trình giao diện Giỏ hàng (`cart.html`), Thanh toán (`pay.html`), Lịch sử đơn hàng (`orders.html`), Hồ sơ cá nhân (`profile.html`), hoàn thiện Trang Liên hệ (`contact.html` – `M07`) và biên soạn tài liệu báo cáo. | 100% |

---

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ LIÊN QUAN

## 2.1. Tổng quan về Thương mại điện tử và số hóa kinh doanh sinh vật cảnh thủy sinh

### 2.1.1. Thực trạng và sự cần thiết của việc chuẩn hóa thông tin sinh thái học thủy sinh
Trong lĩnh vực kinh doanh sinh vật cảnh dưới nước, mỗi sản phẩm không đơn thuần là một mặt hàng thương mại có tên và giá bán, mà là một cá thể sống gắn liền với hệ sinh thái đặc thù. Một hệ thống thương mại điện tử chuyên nghiệp cho ngành thủy sinh bắt buộc phải chuẩn hóa và cung cấp đầy đủ hai lớp thông tin:
* **Phân loại nhóm sinh vật / thiết bị (`category_id`)**: Giúp người dùng định vị nhóm đối tượng cần mua như *Cá cảnh*, *Tép cảnh*, *Ốc cảnh*, *Thủy sinh & San hô*, *Thức ăn* hay *Bể & Thiết bị*.
* **Phân loại hệ môi trường nước (`water_type`)**: Xác định rõ môi trường sống bắt buộc của sinh vật gồm *Nước ngọt (Freshwater)*, *Nước mặn / Biển (Saltwater / Reef)*, *Nước lợ (Brackish)* hoặc *Đa môi trường (Multi-environment)* cho thiết bị và vật tư dùng chung.

Việc số hóa và tách bạch trường `water_type` ngay từ tầng cơ sở dữ liệu giúp hệ thống vừa hỗ trợ khách hàng lọc chính xác loài phù hợp với bể nuôi hiện tại, vừa giúp người quản trị thống kê cơ cấu sinh vật theo từng hệ sinh thái.

### 2.1.2. Xu hướng thiết kế trải nghiệm thương mại điện tử chuyên biệt (Curated E-commerce)
Thay vì sử dụng các bố cục bảng biểu thô cứng truyền thống, xu hướng thiết kế web hiện đại hướng tới việc cá nhân hóa trải nghiệm thị giác theo đặc trưng ngành hàng. Trong đề tài này, nhóm áp dụng phong cách thiết kế **"The Oceanic Curator"** (Người giám tuyển đại dương): sử dụng bảng màu xanh đại dương sâu (`#003d5b`, `#006493`, `#0096c7`) kết hợp nền sáng độ tương phản cao (`#f6fafe`), thẻ bo tròn mềm mại, huy hiệu trạng thái sinh thái (*Eco-status Badges*) và bố cục bất đối xứng trực quan giúp nâng tầm giá trị thẩm mỹ của các loài sinh vật cảnh.

## 2.2. Cơ sở lý thuyết về công nghệ phát triển Giao diện người dùng (Frontend)

### 2.2.1. Tiêu chuẩn HTML5 ngữ nghĩa (Semantic HTML5) và CSS3 hiện đại
Hệ thống giao diện của **Aqualife E-commerce** được xây dựng hoàn toàn bằng chuẩn **HTML5** và **CSS3** thuần túy:
* **Semantic HTML5**: Sử dụng đúng ngữ nghĩa các thẻ cấu trúc như `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` giúp tối ưu khả năng tiếp cận (*Accessibility*), hỗ trợ công cụ tìm kiếm (SEO) và giúp mã nguồn rõ ràng, dễ bảo trì.
* **CSS3 Flexbox & CSS Grid**: Tổ chức lưới sản phẩm tự động co giãn theo kích thước màn hình (`grid-template-columns: repeat(auto-fill, minmax(...))`), bố cục bảng điều khiển Admin cố định thanh bên (*Fixed Sidebar Navigation*) kết hợp thanh tiêu đề mờ kính (*Glassmorphism Topbar* với `backdrop-filter: blur(16px)`).
* **CSS Variables (Custom Properties)**: Định nghĩa tập trung các biến màu sắc, độ bo góc và đổ bóng tại `:root`, đảm bảo tính nhất quán thị giác trên toàn bộ 11 trang HTML của hệ thống.

### 2.2.2. Lập trình bất đồng bộ với Vanilla JavaScript (ES6+ Fetch API)
Toàn bộ logic tương tác phía trình duyệt được viết bằng **JavaScript chuẩn ES6+** theo mô hình lập trình bất đồng bộ (`async / await`):
* **Hàm giao tiếp API trung tâm (`apiFetch`)**: Được đóng gói trong tệp [`FRONTEND/js/common.js`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/js/common.js), tự động đính kèm thông tin xác thực phiên (`credentials: "include"`), thiết lập tiêu đề `Content-Type: application/json` và chuẩn hóa xử lý lỗi tập trung.
* **Cơ chế tự động nhận diện nguồn máy chủ (`Dynamic API_BASE`)**: Hệ thống tự động phát hiện giao thức và cổng mạng hiện tại (`window.location.origin`), cho phép giao diện hoạt động trơn tru cả khi chạy qua Live Server cổng `5500`, máy chủ hợp nhất Flask cổng `5000`, mạng nội bộ LAN hay đường truyền Public Tunnel.

### 2.2.3. Ngôn ngữ thiết kế "The Oceanic Curator" trong quản trị hệ sinh thái
Giao diện quản trị [`FRONTEND/html/admin.html`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/html/admin.html) được thiết kế tách biệt hoàn toàn với giao diện mua hàng của khách. Ngay khi tài khoản có vai trò `admin` đăng nhập tại trang [`login.html`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/html/login.html), hệ thống tự động điều hướng thẳng tới không gian làm việc **Aqualife Admin — The Oceanic Curator**, cung cấp thanh điều hướng 5 phân khu (*Quản lý Sản phẩm, Quản lý Danh mục, Đơn hàng, Khách hàng, Báo cáo Doanh thu*) cùng thanh công cụ xử lý hàng loạt (*Floating Bulk Action Bar*).

## 2.3. Cơ sở lý thuyết về Kiến trúc phần mềm Máy chủ (Backend)

### 2.3.1. Kiến trúc phân tầng (3-Tier Architecture: Routes – Controllers – Services)
Ứng dụng máy chủ sử dụng **Python Flask** và được tổ chức chặt chẽ theo kiến trúc phân tầng nhằm tách biệt rõ trách nhiệm giữa các lớp (*Separation of Concerns*):

```mermaid
flowchart LR
    subgraph Client["Tầng Giao diện (Frontend - Trình duyệt)"]
        UI["11 Trang HTML5 + CSS3\n(Storefront & Oceanic Curator Admin)"]
        JS["Vanilla JS (ES6+ Fetch API)\ncommon.js / admin.js / cart.js"]
    end

    subgraph Server["Tầng Ứng dụng Máy chủ (Python Flask Backend)"]
        Routes["Tầng Định tuyến (Routes)\n8 Blueprints + Auth Middleware"]
        Controllers["Tầng Điều khiển (Controllers)\nKiểm tra HTTP Request & Chuẩn hóa JSON"]
        Services["Tầng Nghiệp vụ (Services)\nLogic đặt hàng ACID, التồn kho, Doanh thu"]
        Pool["Quản lý Kết nối\nThreadedConnectionPool (psycopg2)"]
    end

    subgraph DB["Tầng Cơ sở dữ liệu (PostgreSQL)"]
        Tables[("CSDL aqualife\n7 Bảng chuẩn hóa 3NF")]
    end

    UI --> JS
    JS <-->|"HTTP/JSON (RESTful API)\nSession Cookie"| Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Pool
    Pool <-->|"SQL (Parameterized)\nSELECT FOR UPDATE"| Tables
```
*Hình 2.1: Mô hình kiến trúc phân tầng 3 lớp (3-Tier Architecture) của hệ thống Aqualife E-commerce*

1. **Tầng Định tuyến (`BACKEND/routes/`)**: Định nghĩa các đường dẫn URI (Blueprints) và gắn các Middleware kiểm tra quyền truy cập (`@login_required`, `@admin_required`).
2. **Tầng Điều khiển (`BACKEND/controllers/`)**: Tiếp nhận dữ liệu đầu vào từ `request.get_json()` hoặc `request.args`, gọi tầng Service tương ứng, bắt các ngoại lệ nghiệp vụ (`ValueError`, `PermissionError`, `LookupError`) và đóng gói phản hồi theo cấu trúc JSON thống nhất `{"success": true/false, "data": ..., "message": ...}`.
3. **Tầng Dịch vụ Nghiệp vụ (`BACKEND/services/`)**: Chứa toàn bộ quy tắc nghiệp vụ cốt lõi và thực thi các câu lệnh truy vấn SQL thông qua hồ kết nối cơ sở dữ liệu.

### 2.3.2. Dịch vụ web chuẩn RESTful API và phân quyền theo vai trò RBAC
Hệ thống cung cấp **28 RESTful API Endpoints** tuân thủ đúng ngữ nghĩa của các phương thức HTTP:
* `GET`: Truy vấn danh sách hoặc chi tiết tài nguyên (sản phẩm, danh mục, giỏ hàng, đơn hàng, báo cáo).
* `POST`: Khởi tạo tài nguyên mới (đăng ký, thêm giỏ hàng, tạo đơn hàng, tạo sản phẩm, gửi đánh giá).
* `PUT` / `PATCH`: Cập nhật toàn bộ hoặc một phần tài nguyên (cập nhật số lượng giỏ hàng, đổi trạng thái đơn hàng, sửa sản phẩm).
* `DELETE`: Xóa tài nguyên hoặc ẩn mềm sản phẩm (`soft-delete`).

Cơ chế **RBAC (Role-Based Access Control)** được thực thi tại [`BACKEND/middleware/auth.py`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/middleware/auth.py): mọi yêu cầu gọi tới nhánh `/api/admin/*` đều được kiểm tra trực tiếp trạng thái `status = 'active'` và `role = 'admin'` của người dùng trong cơ sở dữ liệu trước khi cho phép thực thi.

### 2.3.3. Cơ chế xác thực phiên (Session-based Authentication) và mã hóa mật khẩu Bcrypt
Mật khẩu người dùng không bao giờ được lưu dưới dạng văn bản thuần (*plaintext*) mà được băm bằng thuật toán **Bcrypt** (`bcrypt.hashpw` và `bcrypt.checkpw`). Sau khi xác thực thành công, định danh người dùng được lưu vào phiên làm việc có chữ ký mật mã (`Signed Session Cookie`) của Flask với khóa bí mật `SECRET_KEY`.

## 2.4. Hệ quản trị cơ sở dữ liệu PostgreSQL và Giao dịch toàn vẹn ACID

### 2.4.1. Hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL và Connection Pooling
**PostgreSQL** được lựa chọn làm hệ quản trị cơ sở dữ liệu chính nhờ độ tin cậy cao, hỗ trợ đầy đủ các ràng buộc kiểm tra (`CHECK constraints`), khóa ngoại tự động (`ON DELETE CASCADE`, `ON DELETE RESTRICT`) và kiểu dữ liệu số chính xác (`NUMERIC(12,2)` cho tiền tệ). Để tối ưu hiệu năng khi có nhiều yêu cầu HTTP đồng thời, hệ thống sử dụng `ThreadedConnectionPool` (từ 1 đến 10 kết nối tái sử dụng) thông qua trình quản lý ngữ cảnh `get_db_cursor(commit=...)` tại [`BACKEND/config/database.py`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/config/database.py).

### 2.4.2. Cơ chế khóa bi quan (`SELECT ... FOR UPDATE`) chống xung đột tồn kho
Trong nghiệp vụ đặt hàng thương mại điện tử, nếu hai khách hàng cùng bấm thanh toán một sản phẩm chỉ còn 1 cá thể trong kho vào cùng một thời điểm, việc đọc thông thường (`SELECT stock FROM products`) sẽ dẫn đến lỗi *Race Condition* (cả hai cùng thấy `stock = 1` và cùng trừ kho). Hệ thống **Aqualife E-commerce** giải quyết triệt để bài toán này bằng câu lệnh khóa dòng bi quan trong PostgreSQL:
```sql
SELECT id, name, price, stock, status
FROM products
WHERE id = %s
FOR UPDATE;
```
Câu lệnh `FOR UPDATE` khóa các bản ghi sản phẩm đang nằm trong đơn hàng cho tới khi giao dịch hiện tại `COMMIT` hoặc `ROLLBACK`, buộc giao dịch thứ hai phải đợi và đọc đúng số lượng tồn kho mới nhất sau khi giao dịch thứ nhất hoàn tất.

---

# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. Phân tích hệ thống

### 3.1.1. Phân tích chức năng

#### 3.1.1.1. Biểu đồ Use Case tổng quát và phân rã

Hệ thống **Aqualife E-commerce** bao gồm 3 tác nhân chính (*Khách vãng lai - Guest*, *Khách hàng thành viên - Customer*, và *Quản trị viên - Admin*) tương tác với 18 Use Case nghiệp vụ cốt lõi như được biểu diễn trong **Hình 3.1**:

```mermaid
flowchart LR
    Guest["👤 Khách vãng lai\n(Guest)"]
    Customer["🛒 Khách hàng thành viên\n(Customer)"]
    Admin["🛡️ Quản trị viên\n(Admin - Oceanic Curator)"]

    subgraph System["Hệ thống Thương mại Điện tử Aqualife E-commerce"]
        subgraph PublicUC["Nhóm Use Case Công khai & Khám phá"]
            UC01(["UC-01: Xem trang chủ & Khám phá hệ sinh thái"])
            UC02(["UC-02: Tìm kiếm & Lọc sản phẩm theo Danh mục / Môi trường nước"])
            UC03(["UC-03: Xem chi tiết sản phẩm, thông số hồ nuôi & đánh giá"])
            UC04(["UC-04: Gửi yêu cầu liên hệ & tư vấn bể thủy sinh"])
            UC05(["UC-05: Đăng ký & Đăng nhập tài khoản"])
        end

        subgraph CustomerUC["Nhóm Use Case Mua sắm & Cá nhân (Customer)"]
            UC06(["UC-06: Quản lý Giỏ hàng đồng bộ máy chủ"])
            UC07(["UC-07: Đặt hàng & Thanh toán giao dịch ACID"])
            UC08(["UC-08: Theo dõi lịch sử đơn hàng & Hủy đơn hoàn kho"])
            UC09(["UC-09: Quản lý hồ sơ cá nhân & Đổi mật khẩu"])
            UC10(["UC-10: Đánh giá sản phẩm xác thực mua hàng (Verified Review)"])
        end

        subgraph AdminUC["Nhóm Use Case Quản trị (Aqualife Admin - The Oceanic Curator)"]
            UC11(["UC-11: Giám sát Dashboard KPI & Cảnh báo tồn kho"])
            UC12(["UC-12: Quản lý Sản phẩm & Phân loại Môi trường nước (water_type)"])
            UC13(["UC-13: Tác vụ hàng loạt (Bulk Price/Stock/Status) & Xuất/Nhập CSV, JSON"])
            UC14(["UC-14: Quản lý Danh mục hệ sinh thái"])
            UC15(["UC-15: Điều phối trạng thái Đơn hàng & Hoàn kho tự động"])
            UC16(["UC-16: Quản lý Người dùng, Phân quyền & Khóa tài khoản"])
            UC17(["UC-17: Phân tích Báo cáo Doanh thu theo Thời gian & Danh mục"])
        end
    end

    Guest --> UC01
    Guest --> UC02
    Guest --> UC03
    Guest --> UC04
    Guest --> UC05

    Customer -.->|"Kế thừa"| Guest
    Customer --> UC06
    Customer --> UC07
    Customer --> UC08
    Customer --> UC09
    Customer --> UC10

    Admin --> UC05
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
```
*Hình 3.1: Biểu đồ Use Case tổng quát của hệ thống Aqualife E-commerce*

Chi tiết đặc tả các nhóm Use Case theo từng tác nhân được trình bày trong **Bảng 3.1**:

**Bảng 3.1: Đặc tả tổng hợp các Use Case theo nhóm tác nhân hệ thống**

| Mã UC | Tên Use Case | Tác nhân | Điều kiện tiên quyết (Pre-conditions) | Kết quả đầu ra (Post-conditions) |
| :---: | :--- | :--- | :--- | :--- |
| **UC-01** | Xem trang chủ & Khám phá | Guest, Customer | Truy cập hệ thống qua trình duyệt | Hiển thị danh mục, sản phẩm nổi bật, số lượng giỏ hàng. |
| **UC-02** | Tìm kiếm & Lọc theo môi trường nước | Guest, Customer | Truy cập trang sản phẩm (`products.html`) | Trả về danh sách sinh vật khớp từ khóa, danh mục, môi trường (`Nước ngọt`/`Nước mặn`/`Nước lợ`) và giá. |
| **UC-03** | Xem chi tiết sản phẩm & thông số | Guest, Customer | Chọn một sản phẩm bất kỳ | Hiển thị thông số sinh học, tồn kho, đánh giá sao và sản phẩm liên quan. |
| **UC-05** | Đăng ký & Đăng nhập phân luồng | Guest, Customer, Admin | Có thông tin email và mật khẩu | Khởi tạo phiên làm việc; tự động đưa Admin vào `admin.html` và Customer vào `home.html`. |
| **UC-06** | Quản lý Giỏ hàng đồng bộ | Customer | Đã đăng nhập tài khoản | Cập nhật bảng `cart_items`, đảm bảo số lượng không vượt `products.stock`. |
| **UC-07** | Đặt hàng & Thanh toán ACID | Customer | Giỏ hàng có sản phẩm hợp lệ | Tạo bản ghi `orders`, `order_items`, trừ `products.stock` và xóa `cart_items` trong 1 transaction. |
| **UC-08** | Xem lịch sử & Hủy đơn hàng | Customer | Đã đăng nhập; đơn hàng ở trạng thái `pending` | Chuyển đơn sang `cancelled` và cộng hoàn trả lại `products.stock`. |
| **UC-09** | Quản lý hồ sơ & Đổi mật khẩu | Customer | Đã đăng nhập tài khoản | Cập nhật `full_name`, `phone`, `address` hoặc `password_hash` mới. |
| **UC-10** | Đánh giá sản phẩm đã mua | Customer | Có đơn hàng `completed` chứa sản phẩm đó | Lưu đánh giá (`1–5 sao`, nhận xét) vào bảng `reviews`. |
| **UC-12** | Quản lý Sản phẩm & Môi trường nước | Admin | Đăng nhập với `role = 'admin'` | Thêm/sửa/ẩn sản phẩm cùng phân loại `water_type` (`Nước ngọt`, `Nước mặn`, `Nước lợ`, `Đa môi trường`). |
| **UC-13** | Tác vụ hàng loạt & Xuất/Nhập dữ liệu | Admin | Đăng nhập với `role = 'admin'` | Cập nhật giá/tồn kho/trạng thái nhiều sản phẩm cùng lúc; xuất tệp `.csv` hoặc nhập `.json`. |
| **UC-15** | Điều phối trạng thái Đơn hàng | Admin | Đăng nhập với `role = 'admin'` | Chuyển trạng thái đơn theo luồng hợp lệ; hoàn kho nếu chuyển sang `cancelled`. |
| **UC-16** | Quản lý Người dùng & Phân quyền | Admin | Đăng nhập với `role = 'admin'` | Khóa/mở khóa tài khoản hoặc cấp quyền Admin (bảo vệ không tự khóa chính mình). |
| **UC-17** | Phân tích Báo cáo Doanh thu | Admin | Đăng nhập với `role = 'admin'` | Thống kê doanh thu thực thu từ các đơn `completed` theo ngày, tháng và danh mục. |

---

#### 3.1.1.2. Biểu đồ hoạt động (Activity Diagrams) — Chi tiết các luồng nghiệp vụ

##### Sơ đồ 1: Biểu đồ hoạt động Đăng nhập xác thực và Tự động phân luồng giao diện Admin / Khách hàng

```mermaid
flowchart TD
    Start((Bắt đầu)) --> Input["Người dùng nhập Email & Mật khẩu\ntrên trang login.html"]
    Input --> ValidateUI{"Kiểm tra rỗng\ntại trình duyệt?"}
    ValidateUI -- "Thiếu thông tin" --> ShowErrUI["Hiển thị cảnh báo:\n'Vui lòng nhập email và mật khẩu'"]
    ShowErrUI --> Input
    ValidateUI -- "Hợp lệ" --> SendReq["Gửi POST /api/auth/login\n(kèm credentials: include)"]
    SendReq --> QueryDB["Backend truy vấn bảng users\ntheo email (LOWER)"]
    QueryDB --> CheckUser{"Tồn tại user &\nbcrypt.checkpw đúng?"}
    CheckUser -- "Sai" --> Ret401["Trả về HTTP 401:\n'Email hoặc mật khẩu không đúng'"]
    Ret401 --> ShowErrUI
    CheckUser -- "Đúng" --> CheckStatus{"Kiểm tra\nuser.status == 'active'?"}
    CheckStatus -- "status == 'locked'" --> Ret403["Trả về HTTP 403:\n'Tài khoản đã bị khóa'"]
    Ret403 --> ShowErrUI
    CheckStatus -- "Đang hoạt động" --> SaveSession["Lưu session['user_id'] & session['role']\nTrả về HTTP 200 kèm thông tin user"]
    SaveSession --> CheckRole{"Kiểm tra vai trò\nuser.role == 'admin'?"}
    CheckRole -- "Admin" --> RedirectAdmin["Chuyển hướng thẳng tới cổng quản trị\n/html/admin.html (The Oceanic Curator)"]
    CheckRole -- "Customer" --> RedirectStore["Chuyển hướng tới trang cửa hàng\n/html/home.html (hoặc trang ?next=)"]
    RedirectAdmin --> End((Kết thúc))
    RedirectStore --> End
```
*Hình 3.2: Biểu đồ hoạt động (Activity Diagram) chức năng Đăng nhập và Tự động phân luồng Admin / Khách hàng*

---

##### Sơ đồ 2: Biểu đồ hoạt động Quy trình Đặt hàng và Giao dịch ACID với khóa `SELECT FOR UPDATE`

```mermaid
flowchart TD
    Start((Bắt đầu)) --> FillForm["Khách hàng nhập Họ tên, SĐT (10-11 số),\nĐịa chỉ & Phương thức thanh toán tại pay.html"]
    FillForm --> SubmitOrder["Nhấn 'Hoàn tất đặt hàng'\nGửi POST /api/orders"]
    SubmitOrder --> ValidateShip{"Kiểm tra thông tin\ngiao hàng & phương thức?"}
    ValidateShip -- "Không hợp lệ" --> Err400["Trả về HTTP 400:\nThông báo lỗi dữ liệu đầu vào"]
    ValidateShip -- "Hợp lệ" --> BeginTx["Mở Giao dịch PostgreSQL\nget_db_cursor(commit=True)"]
    BeginTx --> ReadCart["Đọc danh sách sản phẩm từ bảng cart_items\n(hoặc danh sách items gửi lên)"]
    ReadCart --> LockRows["Thực thi SELECT id, name, price, stock, status\nFROM products WHERE id = %s FOR UPDATE\n(Khóa bi quan từng dòng sản phẩm)"]
    LockRows --> CheckStock{"Tất cả sản phẩm đều\nactive & stock >= quantity?"}
    CheckStock -- "Không đủ tồn kho\nhoặc ngừng bán" --> RollbackTx["Tự động ROLLBACK toàn bộ giao dịch\nTrả về HTTP 400 báo tên sản phẩm thiếu kho"]
    CheckStock -- "Đủ tồn kho" --> InsertOrder["INSERT bản ghi mới vào bảng orders\n(status = 'pending', total_amount)"]
    InsertOrder --> LoopItems["INSERT chi tiết vào bảng order_items\n(Lưu bản chụp product_name, unit_price, subtotal)"]
    LoopItems --> DeductStock["UPDATE products SET stock = stock - quantity\ncho từng sản phẩm trong đơn"]
    DeductStock --> ClearCart["DELETE FROM cart_items\nWHERE user_id = current_user"]
    ClearCart --> CommitTx["COMMIT giao dịch thành công\nTrả về HTTP 201 kèm mã đơn hàng"]
    Err400 --> End((Kết thúc))
    RollbackTx --> End
    CommitTx --> RedirectSuccess["Hiển thị màn hình Đặt hàng thành công\n& Mã đơn hàng #ID"] --> End
```
*Hình 3.3: Biểu đồ hoạt động (Activity Diagram) quy trình Đặt hàng và Giao dịch ACID với khóa `SELECT FOR UPDATE`*

---

##### Sơ đồ 3: Biểu đồ hoạt động Đánh giá sản phẩm có xác thực mua hàng (Verified Purchase)

```mermaid
flowchart TD
    Start((Bắt đầu)) --> OpenDetail["Khách hàng mở trang chi tiết sản phẩm\nproduct-detail.html?id={product_id}"]
    OpenDetail --> WriteRev["Chọn số sao (1-5) & nhập nhận xét\nNhấn 'Gửi đánh giá'"]
    WriteRev --> SendPost["Gửi POST /api/products/{id}/reviews"]
    SendPost --> CheckAuth{"Đã đăng nhập\nphiên hợp lệ?"}
    CheckAuth -- "Chưa đăng nhập" --> Err401["Trả về HTTP 401:\nYêu cầu đăng nhập"]
    CheckAuth -- "Đã đăng nhập" --> CheckPurchase["Truy vấn kiểm tra đơn hàng:\nSELECT 1 FROM orders o JOIN order_items oi\nWHERE o.user_id = %s AND oi.product_id = %s\nAND o.status = 'completed'"]
    CheckPurchase --> HasBought{"Đã mua & nhận hàng\nthành công (completed)?"}
    HasBought -- "Chưa mua hoặc đơn\nchưa hoàn tất" --> Err403["Trả về HTTP 403:\n'Bạn chỉ có thể đánh giá sản phẩm sau khi\nđã mua và nhận hàng thành công'"]
    HasBought -- "Đã mua hợp lệ" --> CheckDup{"Đã đánh giá sản phẩm\nnày trước đó chưa?"}
    CheckDup -- "Đã tồn tại" --> Err409["Trả về HTTP 409:\n'Bạn đã đánh giá sản phẩm này rồi'"]
    CheckDup -- "Chưa đánh giá" --> InsertRev["INSERT vào bảng reviews\nTính lại điểm trung bình average_rating"]
    InsertRev --> RenderUI["Cập nhật danh sách đánh giá & số sao\ntrực tiếp trên giao diện"]
    Err401 --> End((Kết thúc))
    Err403 --> End
    Err409 --> End
    RenderUI --> End
```
*Hình 3.4: Biểu đồ hoạt động (Activity Diagram) chức năng Đánh giá sản phẩm có xác thực mua hàng (Verified Purchase)*

---

##### Sơ đồ 4: Biểu đồ hoạt động Quản trị sản phẩm và Phân loại môi trường nước (`water_type`)

```mermaid
flowchart TD
    Start((Bắt đầu)) --> OpenAdmin["Admin truy cập bảng điều khiển\nAqualife Admin - The Oceanic Curator"]
    OpenAdmin --> ClickAdd["Nhấn '+ Thêm sản phẩm mới'\nhoặc nút 'Chỉnh sửa' trên dòng sản phẩm"]
    ClickAdd --> FillModal["Nhập Tên loài, Danh mục hệ (category_id),\nMôi trường nước (water_type: Nước ngọt / Nước mặn / Nước lợ / Đa môi trường),\nGiá bán, Tồn kho, Ảnh & Mô tả sinh học"]
    FillModal --> SubmitForm["Nhấn 'Lưu sản phẩm'\nGửi POST / PUT tới /api/admin/products"]
    SubmitForm --> ValidateAdmin["Backend kiểm tra quyền @admin_required\n& chuẩn hóa trường water_type"]
    ValidateAdmin --> CheckValid{"Tên, Giá >= 0, Tồn kho >= 0\n& Danh mục hợp lệ?"}
    CheckValid -- "Không hợp lệ" --> Ret400["Trả về HTTP 400 kèm thông báo lỗi"]
    CheckValid -- "Hợp lệ" --> SaveDB["Lưu vào bảng products trên PostgreSQL\n(cập nhật cột water_type, price, stock, status)"]
    SaveDB --> RefreshKPI["Cập nhật 4 thẻ KPI tồn kho\n& hiển thị huy hiệu Môi trường nước trên bảng"]
    RefreshKPI --> SyncStore["Đồng bộ tức thời với bộ lọc\nNước ngọt / Nước lợ / Nước mặn tại trang Cửa hàng"]
    Ret400 --> End((Kết thúc))
    SyncStore --> End
```
*Hình 3.5: Biểu đồ hoạt động (Activity Diagram) chức năng Quản trị sản phẩm và Phân loại môi trường nước (`water_type`)*

---

### 3.1.2. Phân tích cấu trúc (Sơ đồ ERD & Biểu đồ Lớp Class Diagram)

Hệ thống cơ sở dữ liệu của **Aqualife E-commerce** được thiết kế xoay quanh 3 nhóm thực thể chính:
1. **Nhóm Quản lý Người dùng & Phân quyền (`users`)**: Lưu trữ thông tin định danh, thông tin liên hệ giao hàng mặc định, mật khẩu băm `bcrypt`, vai trò (`customer`, `admin`) và trạng thái tài khoản (`active`, `locked`).
2. **Nhóm Danh mục Sinh thái, Sản phẩm & Đánh giá (`categories`, `products`, `reviews`)**: Quản lý phân loại danh mục, thông tin chi tiết sinh vật cảnh kèm phân loại môi trường nước (`water_type`), số lượng tồn kho và đánh giá của người mua.
3. **Nhóm Giao dịch Giỏ hàng & Đơn đặt hàng (`cart_items`, `orders`, `order_items`)**: Quản lý giỏ hàng lưu trữ bền vững theo từng người dùng, thông tin đơn đặt hàng và chi tiết từng dòng sản phẩm trong đơn.

#### 3.1.2.1. Sơ đồ thực thể quan hệ (ERD)

Toàn bộ hệ thống gồm **7 bảng thực thể** liên kết chặt chẽ với nhau qua hệ thống khóa ngoại (`Foreign Keys`) như minh họa trong **Hình 3.6**:

```mermaid
erDiagram
    USERS {
        SERIAL id PK
        VARCHAR_100 full_name "NOT NULL"
        VARCHAR_120 email "NOT NULL, UNIQUE"
        VARCHAR_255 password_hash "NOT NULL"
        VARCHAR_20 phone
        TEXT address
        VARCHAR_20 role "DEFAULT 'customer' (customer|admin)"
        VARCHAR_20 status "DEFAULT 'active' (active|locked)"
        TIMESTAMP created_at
    }

    CATEGORIES {
        SERIAL id PK
        VARCHAR_100 name "NOT NULL, UNIQUE"
        TEXT description
        VARCHAR_20 status "DEFAULT 'active' (active|inactive)"
        TIMESTAMP created_at
    }

    PRODUCTS {
        SERIAL id PK
        INTEGER category_id FK "NOT NULL -> categories(id)"
        VARCHAR_150 name "NOT NULL"
        TEXT description
        NUMERIC_12_2 price "NOT NULL, CHECK >= 0"
        INTEGER stock "NOT NULL, DEFAULT 0, CHECK >= 0"
        VARCHAR_255 image
        VARCHAR_20 status "DEFAULT 'active' (active|inactive)"
        VARCHAR_50 water_type "DEFAULT 'Nước ngọt' (Nước ngọt|Nước mặn|Nước lợ|Đa môi trường)"
        TIMESTAMP created_at
    }

    CART_ITEMS {
        SERIAL id PK
        INTEGER user_id FK "NOT NULL -> users(id) ON DELETE CASCADE"
        INTEGER product_id FK "NOT NULL -> products(id) ON DELETE CASCADE"
        INTEGER quantity "NOT NULL, CHECK > 0"
        TIMESTAMP created_at
    }

    ORDERS {
        SERIAL id PK
        INTEGER user_id FK "NOT NULL -> users(id) ON DELETE RESTRICT"
        NUMERIC_12_2 total_amount "NOT NULL, CHECK >= 0"
        VARCHAR_20 status "DEFAULT 'pending' (pending|confirmed|shipping|completed|cancelled)"
        VARCHAR_100 shipping_name "NOT NULL"
        VARCHAR_20 shipping_phone "NOT NULL"
        TEXT shipping_address "NOT NULL"
        VARCHAR_30 payment_method "DEFAULT 'cod' (cod|bank_transfer)"
        TEXT note
        TIMESTAMP created_at
    }

    ORDER_ITEMS {
        SERIAL id PK
        INTEGER order_id FK "NOT NULL -> orders(id) ON DELETE CASCADE"
        INTEGER product_id FK "NOT NULL -> products(id) ON DELETE RESTRICT"
        VARCHAR_150 product_name "NOT NULL (Snapshot)"
        NUMERIC_12_2 unit_price "NOT NULL, CHECK >= 0 (Snapshot)"
        INTEGER quantity "NOT NULL, CHECK > 0"
        NUMERIC_12_2 subtotal "NOT NULL, CHECK >= 0"
    }

    REVIEWS {
        SERIAL id PK
        INTEGER user_id FK "NOT NULL -> users(id) ON DELETE CASCADE"
        INTEGER product_id FK "NOT NULL -> products(id) ON DELETE CASCADE"
        SMALLINT rating "NOT NULL, CHECK BETWEEN 1 AND 5"
        TEXT comment
        TIMESTAMP created_at
    }

    USERS ||--o{ CART_ITEMS : "sở hữu giỏ hàng"
    USERS ||--o{ ORDERS : "đặt đơn hàng"
    USERS ||--o{ REVIEWS : "viết đánh giá"
    CATEGORIES ||--o{ PRODUCTS : "phân loại"
    PRODUCTS ||--o{ CART_ITEMS : "nằm trong giỏ"
    PRODUCTS ||--o{ ORDER_ITEMS : "được đặt mua"
    PRODUCTS ||--o{ REVIEWS : "nhận đánh giá"
    ORDERS ||--|{ ORDER_ITEMS : "bao gồm chi tiết"
```
*Hình 3.6: Sơ đồ thực thể quan hệ (ERD) cơ sở dữ liệu PostgreSQL của hệ thống Aqualife (7 bảng)*

> [!NOTE]
> **Lưu ý thiết kế cơ sở dữ liệu quan trọng**:
> 1. **Kỹ thuật lưu bản chụp lịch sử giá (`Historical Snapshot`) tại bảng `order_items`**: Bảng `order_items` lưu trực tiếp `product_name` và `unit_price` tại thời điểm khách đặt hàng. Nhờ đó, khi Admin thay đổi giá bán hoặc đổi tên sản phẩm trong tương lai, hóa đơn lịch sử và báo cáo doanh thu của các đơn hàng cũ vẫn giữ nguyên độ chính xác tuyệt đối.
> 2. **Ràng buộc khóa ngoại bảo vệ dữ liệu kế toán (`ON DELETE RESTRICT`)**: Các liên kết từ `orders.user_id` và `order_items.product_id` sử dụng `ON DELETE RESTRICT` để ngăn chặn việc xóa nhầm sản phẩm hoặc tài khoản đã phát sinh giao dịch tài chính. Thay vào đó, hệ thống sử dụng cơ chế ẩn mềm (`status = 'inactive'` cho sản phẩm và `status = 'locked'` cho người dùng).

---

#### 3.1.2.2. Biểu đồ lớp (Class Diagram) mức phân tích

Ở mức phân tích hướng đối tượng (*Analysis-level Class Diagram*), hệ thống mô hình hóa sự kế thừa giữa lớp cơ sở `User` và hai lớp vai trò `Customer`, `Admin`, đồng thời thể hiện rõ mối quan hệ hợp thành (*Composition*) giữa `Order` và `OrderItem` như trong **Hình 3.7**:

```mermaid
classDiagram
    class User {
        +int id
        +string fullName
        +string email
        +string passwordHash
        +string phone
        +string address
        +string role
        +string status
        +login(email, password)
        +logout()
        +updateProfile(data)
        +changePassword(currentPwd, newPwd)
    }

    class Customer {
        +addToCart(productId, quantity)
        +updateCartItem(itemId, quantity)
        +checkout(shippingInfo, paymentMethod)
        +cancelOrder(orderId)
        +submitVerifiedReview(productId, rating, comment)
    }

    class Admin {
        +getDashboardStats()
        +createProduct(payload)
        +updateProduct(productId, payload)
        +bulkUpdateProducts(productIds, action)
        +advanceOrderStatus(orderId, newStatus)
        +updateUserStatusOrRole(userId, status, role)
        +getRevenueReport(fromDate, toDate)
    }

    class Category {
        +int id
        +string name
        +string description
        +string status
        +int productCount
    }

    class Product {
        +int id
        +int categoryId
        +string name
        +string waterType
        +decimal price
        +int stock
        +string image
        +string status
        +generateSku()
        +checkStockAvailability(qty)
    }

    class CartItem {
        +int id
        +int userId
        +int productId
        +int quantity
        +decimal subtotal
    }

    class Order {
        +int id
        +int userId
        +decimal totalAmount
        +string status
        +string shippingName
        +string shippingPhone
        +string shippingAddress
        +string paymentMethod
        +validateStateTransition(nextStatus)
        +restoreStockOnCancel()
    }

    class OrderItem {
        +int id
        +int orderId
        +int productId
        +string productName
        +decimal unitPrice
        +int quantity
        +decimal subtotal
    }

    class Review {
        +int id
        +int userId
        +int productId
        +int rating
        +string comment
        +verifyCompletedPurchase(userId, productId)
    }

    User <|-- Customer
    User <|-- Admin
    Category "1" --> "*" Product : phân loại
    Customer "1" *-- "*" CartItem : quản lý
    Product "1" --> "*" CartItem : tham chiếu
    Customer "1" --> "*" Order : khởi tạo
    Order "1" *-- "1..*" OrderItem : hợp thành (Composition)
    Product "1" --> "*" OrderItem : lưu bản chụp
    Customer "1" --> "*" Review : viết
    Product "1" *-- "*" Review : nhận đánh giá
```
*Hình 3.7: Biểu đồ lớp (Class Diagram) mức phân tích của hệ thống Aqualife E-commerce*

---

### 3.1.3. Từ điển dữ liệu (Data Dictionary)

Phần này trình bày chi tiết cấu trúc vật lý của toàn bộ **7 bảng dữ liệu** trong tệp [`DATABASE/schema.sql`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/DATABASE/schema.sql) trên hệ quản trị cơ sở dữ liệu PostgreSQL.

#### Bảng 3.2: Từ điển dữ liệu Bảng `users` — Quản lý người dùng và phân quyền
Lưu trữ thông tin tài khoản của cả Khách hàng (`customer`) và Quản trị viên (`admin`).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh tự tăng duy nhất của người dùng. |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Họ và tên đầy đủ của người dùng. |
| `email` | `VARCHAR(120)` | `NOT NULL, UNIQUE` | Địa chỉ email dùng làm tên đăng nhập duy nhất. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Chuỗi mật khẩu đã mã hóa một chiều bằng `bcrypt`. |
| `phone` | `VARCHAR(20)` | `NULL` | Số điện thoại liên hệ (tự động điền khi thanh toán). |
| `address` | `TEXT` | `NULL` | Địa chỉ nhận hàng mặc định của người dùng. |
| `role` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'customer', CHECK IN ('customer', 'admin')` | Vai trò phân quyền truy cập hệ thống. |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'active', CHECK IN ('active', 'locked')` | Trạng thái tài khoản (`locked` = bị khóa truy cập). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm đăng ký tài khoản. |

---

#### Bảng 3.3: Từ điển dữ liệu Bảng `categories` — Danh mục sinh vật cảnh và phụ kiện
Lưu trữ 6 nhóm danh mục chính của cửa hàng (*Cá cảnh, Tép cảnh, Ốc cảnh, Thủy sinh & San hô, Thức ăn, Bể & Thiết bị*).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh danh mục. |
| `name` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Tên danh mục sản phẩm (duy nhất). |
| `description` | `TEXT` | `NULL` | Mô tả đặc điểm nhóm sinh vật hoặc phụ kiện. |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'active', CHECK IN ('active', 'inactive')` | Trạng thái hiển thị của danh mục trên cửa hàng. |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm khởi tạo danh mục. |

---

#### Bảng 3.4: Từ điển dữ liệu Bảng `products` — Sản phẩm thủy sinh và phân loại môi trường nước (`water_type`)
Lưu trữ thông tin chi tiết của 56+ loài sinh vật cảnh và thiết bị thủy sinh.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh sản phẩm (dùng để sinh mã SKU `AQ-{CAT}-{ID}`). |
| `category_id` | `INTEGER` | `NOT NULL, FK -> categories(id) ON DELETE RESTRICT` | Khóa ngoại trỏ tới danh mục sản phẩm. |
| `name` | `VARCHAR(150)` | `NOT NULL` | Tên loài sinh vật cảnh hoặc tên thiết bị. |
| `description` | `TEXT` | `NULL` | Mô tả đặc điểm hình thái, tập tính và cách chăm sóc. |
| `price` | `NUMERIC(12, 2)` | `NOT NULL, CHECK (price >= 0)` | Giá bán đơn vị tính bằng VNĐ. |
| `stock` | `INTEGER` | `NOT NULL, DEFAULT 0, CHECK (stock >= 0)` | Số lượng tồn kho thực tế hiện có tại cửa hàng. |
| `image` | `VARCHAR(255)` | `NULL` | Đường dẫn tương đối hoặc URL hình ảnh sản phẩm. |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'active', CHECK IN ('active', 'inactive')` | Trạng thái kinh doanh (`active` = đang bán, `inactive` = tạm ẩn). |
| `water_type` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'Nước ngọt'` | Phân loại hệ môi trường nước (`Nước ngọt`, `Nước mặn`, `Nước lợ`, `Đa môi trường`). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm thêm sản phẩm vào hệ thống. |

* **Chỉ mục (Indexes)**: `idx_products_category(category_id)` và `idx_products_status(status)` giúp tăng tốc độ lọc sản phẩm theo danh mục và trạng thái.

---

#### Bảng 3.5: Từ điển dữ liệu Bảng `cart_items` — Giỏ hàng lưu trữ bền vững trên máy chủ
Lưu trữ các mặt hàng khách đang chọn mua, đồng bộ trên mọi thiết bị của khách hàng đó.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh dòng giỏ hàng. |
| `user_id` | `INTEGER` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Chủ sở hữu giỏ hàng. |
| `product_id` | `INTEGER` | `NOT NULL, FK -> products(id) ON DELETE CASCADE` | Sản phẩm được thêm vào giỏ. |
| `quantity` | `INTEGER` | `NOT NULL, CHECK (quantity > 0)` | Số lượng đặt mua (luôn được kiểm tra $\le$ `products.stock`). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm thêm vào giỏ. |

* **Ràng buộc duy nhất**: `UNIQUE (user_id, product_id)` đảm bảo mỗi sản phẩm chỉ xuất hiện trên 1 dòng trong giỏ của 1 người dùng (nếu thêm trùng sẽ cộng dồn `quantity` qua `ON CONFLICT DO UPDATE`).

---

#### Bảng 3.6: Từ điển dữ liệu Bảng `orders` — Đơn đặt hàng và trạng thái vận chuyển
Lưu trữ thông tin tổng hợp của từng đơn hàng và thông tin người nhận.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã đơn hàng duy nhất (`#ID`). |
| `user_id` | `INTEGER` | `NOT NULL, FK -> users(id) ON DELETE RESTRICT` | Khách hàng đặt đơn. |
| `total_amount` | `NUMERIC(12, 2)` | `NOT NULL, CHECK (total_amount >= 0)` | Tổng giá trị thanh toán của đơn hàng (VNĐ). |
| `status` | `VARCHAR(20)` | `NOT NULL, DEFAULT 'pending', CHECK IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')` | Trạng thái trong vòng đời đơn hàng. |
| `shipping_name` | `VARCHAR(100)` | `NOT NULL` | Họ tên người nhận hàng thực tế. |
| `shipping_phone` | `VARCHAR(20)` | `NOT NULL` | Số điện thoại nhận hàng (kiểm tra Regex 10–11 chữ số). |
| `shipping_address`| `TEXT` | `NOT NULL` | Địa chỉ giao hàng chi tiết. |
| `payment_method` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'cod', CHECK IN ('cod', 'bank_transfer')` | Phương thức thanh toán (`cod` hoặc `bank_transfer`). |
| `note` | `TEXT` | `NULL` | Ghi chú giao hàng của khách (ví dụ: giờ nhận cá, đóng oxy). |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm khởi tạo đơn hàng. |

* **Chỉ mục (Indexes)**: `idx_orders_user(user_id)`, `idx_orders_status(status)`, `idx_orders_created(created_at)` phục vụ truy vấn lịch sử đơn và thống kê doanh thu theo ngày/tháng.

---

#### Bảng 3.7: Từ điển dữ liệu Bảng `order_items` — Chi tiết từng mặt hàng trong đơn
Lưu trữ từng dòng sản phẩm thuộc một đơn hàng kèm bản chụp tên và đơn giá tại thời điểm mua.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh dòng chi tiết đơn hàng. |
| `order_id` | `INTEGER` | `NOT NULL, FK -> orders(id) ON DELETE CASCADE` | Thuộc đơn hàng nào. |
| `product_id` | `INTEGER` | `NOT NULL, FK -> products(id) ON DELETE RESTRICT` | Tham chiếu tới sản phẩm gốc (dùng để hoàn kho khi hủy đơn). |
| `product_name` | `VARCHAR(150)` | `NOT NULL` | Bản chụp tên sản phẩm tại thời điểm đặt hàng. |
| `unit_price` | `NUMERIC(12, 2)` | `NOT NULL, CHECK (unit_price >= 0)` | Bản chụp đơn giá bán tại thời điểm đặt hàng. |
| `quantity` | `INTEGER` | `NOT NULL, CHECK (quantity > 0)` | Số lượng mua của mặt hàng này. |
| `subtotal` | `NUMERIC(12, 2)` | `NOT NULL, CHECK (subtotal >= 0)` | Thành tiền (`unit_price * quantity`). |

---

#### Bảng 3.8: Từ điển dữ liệu Bảng `reviews` — Đánh giá sản phẩm có xác thực mua hàng
Lưu trữ điểm đánh giá sao và nhận xét của khách hàng đã mua sản phẩm.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (`INTEGER`) | `PRIMARY KEY` | Mã định danh đánh giá. |
| `user_id` | `INTEGER` | `NOT NULL, FK -> users(id) ON DELETE CASCADE` | Người dùng viết đánh giá. |
| `product_id` | `INTEGER` | `NOT NULL, FK -> products(id) ON DELETE CASCADE` | Sản phẩm được đánh giá. |
| `rating` | `SMALLINT` | `NOT NULL, CHECK (rating BETWEEN 1 AND 5)` | Điểm số đánh giá từ 1 đến 5 sao. |
| `comment` | `TEXT` | `NULL` | Nội dung nhận xét chi tiết. |
| `created_at` | `TIMESTAMP` | `NOT NULL, DEFAULT NOW()` | Thời điểm gửi đánh giá. |

---

### 3.1.4. Phân tích hành vi (Biểu đồ tuần tự — Sequence Diagrams)

#### 3.1.4.1. Biểu đồ tuần tự chức năng Đăng nhập, Xác thực và Phân luồng Vai trò

Biểu đồ tuần tự dưới đây mô tả chi tiết luồng thông điệp trao đổi giữa Người dùng, Giao diện `login.html` (`auth.js`), `AuthController`, `AuthService` và Cơ sở dữ liệu PostgreSQL:

```mermaid
sequenceDiagram
    actor U as Người dùng (Customer / Admin)
    participant UI as Giao diện login.html (auth.js)
    participant Ctrl as AuthController
    participant Svc as AuthService
    participant DB as PostgreSQL (Bảng users)

    U->>UI: 1. Nhập email, password và nhấn "Đăng nhập"
    UI->>Ctrl: 2. POST /api/auth/login {email, password}
    Ctrl->>Svc: 3. authenticate_user(email, password)
    Svc->>DB: 4. SELECT id, full_name, email, password_hash, role, status FROM users WHERE LOWER(email) = %s
    DB-->>Svc: 5. Trả về bản ghi user
    Svc->>Svc: 6. Kiểm tra bcrypt.checkpw(password, password_hash) & status == 'active'
    alt Mật khẩu sai hoặc tài khoản bị khóa
        Svc-->>Ctrl: 7a. Trả về lỗi xác thực / PermissionError
        Ctrl-->>UI: 8a. HTTP 401 / 403 {success: false, message}
        UI-->>U: 9a. Hiển thị thông báo lỗi trên màn hình
    else Xác thực thành công
        Svc-->>Ctrl: 7b. Trả về dict thông tin User (id, role, full_name...)
        Ctrl->>Ctrl: 8b. Lưu session["user_id"] và session["role"]
        Ctrl-->>UI: 9b. HTTP 200 {success: true, data: user}
        alt user.role === "admin"
            UI-->>U: 10a. Chuyển hướng thẳng tới /html/admin.html (The Oceanic Curator)
        else user.role === "customer"
            UI-->>U: 10b. Chuyển hướng tới /html/home.html (Cửa hàng)
        end
    end
```
*Hình 3.8: Biểu đồ tuần tự (Sequence Diagram) chức năng Đăng nhập, Xác thực phiên và Phân luồng Vai trò*

---

#### 3.1.4.2. Biểu đồ tuần tự chức năng Thêm vào giỏ hàng và Kiểm tra tồn kho

```mermaid
sequenceDiagram
    actor C as Khách hàng (Customer)
    participant UI as Giao diện Cửa hàng (common.js / cart.js)
    participant Ctrl as CartController
    participant Svc as CartService
    participant DB as PostgreSQL (products, cart_items)

    C->>UI: 1. Chọn số lượng & nhấn "Thêm vào giỏ"
    UI->>Ctrl: 2. POST /api/cart/items {product_id, quantity}
    Ctrl->>Svc: 3. add_to_cart(user_id, product_id, quantity)
    Svc->>DB: 4. SELECT id, name, price, stock, status FROM products WHERE id = %s
    DB-->>Svc: 5. Trả về thông tin sản phẩm & tồn kho hiện tại
    Svc->>DB: 6. SELECT id, quantity FROM cart_items WHERE user_id = %s AND product_id = %s
    DB-->>Svc: 7. Trả về số lượng đã có trong giỏ (existing_qty)
    Svc->>Svc: 8. Kiểm tra new_qty = existing_qty + quantity <= product.stock
    alt Vượt quá số lượng tồn kho
        Svc-->>Ctrl: 9a. Ném ngoại lệ ValueError("Số lượng vượt quá tồn kho")
        Ctrl-->>UI: 10a. HTTP 400 {success: false, message}
        UI-->>C: 11a. Hiển thị Toast cảnh báo số lượng tồn kho tối đa
    else Hợp lệ
        Svc->>DB: 9b. INSERT / UPDATE cart_items SET quantity = new_qty (COMMIT)
        DB-->>Svc: 10b. Xác nhận lưu thành công
        Svc-->>Ctrl: 11b. Trả về trạng thái giỏ hàng mới (items, total_quantity, total_amount)
        Ctrl-->>UI: 12b. HTTP 200 {success: true, data: cart}
        UI-->>C: 13b. Cập nhật huy hiệu số lượng giỏ hàng trên thanh điều hướng
    end
```
*Hình 3.9: Biểu đồ tuần tự (Sequence Diagram) chức năng Thêm vào giỏ hàng và Kiểm tra tồn kho*

---

#### 3.1.4.3. Biểu đồ tuần tự chức năng Đặt hàng và Giao dịch ACID (`SELECT FOR UPDATE`)

```mermaid
sequenceDiagram
    actor C as Khách hàng (Customer)
    participant UI as Giao diện Thanh toán (pay.js)
    participant Ctrl as OrderController
    participant Svc as OrderService
    participant DB as PostgreSQL (Transaction ACID)

    C->>UI: 1. Nhập thông tin nhận hàng & nhấn "Hoàn tất đặt hàng"
    UI->>Ctrl: 2. POST /api/orders {shipping_name, shipping_phone, shipping_address, payment_method}
    Ctrl->>Svc: 3. create_order(user_id, payload)
    Svc->>DB: 4. BEGIN TRANSACTION
    Svc->>DB: 5. SELECT product_id, quantity FROM cart_items WHERE user_id = %s
    DB-->>Svc: 6. Danh sách mặt hàng trong giỏ
    loop Cho từng product_id (đã sắp xếp tăng dần tránh Deadlock)
        Svc->>DB: 7. SELECT id, name, price, stock, status FROM products WHERE id = %s FOR UPDATE
        DB-->>Svc: 8. Bản ghi sản phẩm đã khóa (Locked Row)
    end
    alt Có sản phẩm hết hàng hoặc không đủ tồn kho
        Svc->>DB: 9a. ROLLBACK TRANSACTION
        Svc-->>Ctrl: 10a. ValueError("Sản phẩm không đủ tồn kho")
        Ctrl-->>UI: 11a. HTTP 400 {success: false, message}
        UI-->>C: 12a. Thông báo lỗi & giữ nguyên giỏ hàng để khách điều chỉnh
    else Tất cả sản phẩm đủ tồn kho
        Svc->>DB: 9b. INSERT INTO orders (...) RETURNING id, created_at
        Svc->>DB: 10b. INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        Svc->>DB: 11b. UPDATE products SET stock = stock - quantity WHERE id = %s
        Svc->>DB: 12b. DELETE FROM cart_items WHERE user_id = %s
        Svc->>DB: 13b. COMMIT TRANSACTION
        Svc-->>Ctrl: 14b. Trả về chi tiết đơn hàng vừa tạo
        Ctrl-->>UI: 15b. HTTP 201 {success: true, data: order}
        UI-->>C: 16b. Hiển thị màn hình Xác nhận đặt hàng thành công (#Order ID)
    end
```
*Hình 3.10: Biểu đồ tuần tự (Sequence Diagram) chức năng Đặt hàng và Giao dịch ACID*

---

#### 3.1.4.4. Biểu đồ tuần tự chức năng Đánh giá sản phẩm Xác thực mua hàng (Verified Purchase)

```mermaid
sequenceDiagram
    actor C as Khách hàng (Customer)
    participant UI as Trang Chi tiết SP (product-detail.js)
    participant Ctrl as ReviewController
    participant Svc as ReviewService
    participant DB as PostgreSQL (orders, order_items, reviews)

    C->>UI: 1. Chọn số sao (1-5), viết bình luận & nhấn "Gửi đánh giá"
    UI->>Ctrl: 2. POST /api/products/{product_id}/reviews {rating, comment}
    Ctrl->>Svc: 3. create_review(user_id, product_id, rating, comment)
    Svc->>DB: 4. SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = %s AND oi.product_id = %s AND o.status = 'completed' LIMIT 1
    DB-->>Svc: 5. Kết quả kiểm tra lịch sử mua hàng
    alt Khách chưa mua hoặc đơn chưa ở trạng thái 'completed'
        Svc-->>Ctrl: 6a. PermissionError("Chỉ đánh giá sau khi đã mua và nhận hàng thành công")
        Ctrl-->>UI: 7a. HTTP 403 {success: false, message}
        UI-->>C: 8a. Hiển thị thông báo từ chối quyền đánh giá
    else Đã mua và nhận hàng thành công
        Svc->>DB: 6b. Kiểm tra trùng lặp đánh giá trong bảng reviews
        Svc->>DB: 7b. INSERT INTO reviews (user_id, product_id, rating, comment) RETURNING *
        DB-->>Svc: 8b. Bản ghi đánh giá mới
        Svc-->>Ctrl: 9b. Trả về dữ liệu đánh giá
        Ctrl-->>UI: 10b. HTTP 201 {success: true, data: review}
        UI-->>C: 11b. Hiển thị đánh giá mới và cập nhật điểm sao trung bình
    end
```
*Hình 3.11: Biểu đồ tuần tự (Sequence Diagram) chức năng Đánh giá sản phẩm Xác thực mua hàng*

---

#### 3.1.4.5. Biểu đồ tuần tự chức năng Quản trị đơn hàng và Hoàn kho tự động khi hủy đơn

```mermaid
sequenceDiagram
    actor A as Quản trị viên (Admin)
    participant UI as Giao diện Oceanic Curator (admin.js)
    participant Ctrl as AdminController
    participant Svc as DashboardService
    participant DB as PostgreSQL (orders, order_items, products)

    A->>UI: 1. Chọn trạng thái mới cho đơn hàng (VD: 'confirmed' hoặc 'cancelled')
    UI->>Ctrl: 2. PATCH /api/admin/orders/{order_id}/status {status: new_status}
    Ctrl->>Svc: 3. admin_update_order_status(order_id, new_status)
    Svc->>DB: 4. BEGIN TRANSACTION
    Svc->>DB: 5. SELECT id, status FROM orders WHERE id = %s FOR UPDATE
    DB-->>Svc: 6. Trạng thái hiện tại của đơn hàng (current_status)
    Svc->>Svc: 7. Kiểm tra quy tắc chuyển trạng thái VALID_TRANSITIONS[current_status]
    alt Chuyển trạng thái không hợp lệ (VD: từ 'completed' sang 'cancelled')
        Svc->>DB: 8a. ROLLBACK TRANSACTION
        Svc-->>Ctrl: 9a. ValueError("Không thể chuyển trạng thái...")
        Ctrl-->>UI: 10a. HTTP 400 {success: false, message}
    else Chuyển sang trạng thái 'cancelled' (Hủy đơn)
        Svc->>DB: 8b. SELECT product_id, quantity FROM order_items WHERE order_id = %s
        Svc->>DB: 9b. UPDATE products SET stock = stock + quantity WHERE id = %s (Hoàn kho)
        Svc->>DB: 10b. UPDATE orders SET status = 'cancelled' WHERE id = %s
        Svc->>DB: 11b. COMMIT TRANSACTION
        Svc-->>Ctrl: 12b. Trả về đơn hàng đã cập nhật
        Ctrl-->>UI: 13b. HTTP 200 {success: true, data: order}
        UI-->>A: 14b. Cập nhật trạng thái đơn & tự động làm mới tồn kho sản phẩm
    else Chuyển sang 'confirmed' / 'shipping' / 'completed'
        Svc->>DB: 8c. UPDATE orders SET status = new_status WHERE id = %s
        Svc->>DB: 9c. COMMIT TRANSACTION
        Svc-->>Ctrl: 10c. Trả về đơn hàng đã cập nhật
        Ctrl-->>UI: 11c. HTTP 200 {success: true, data: order}
        UI-->>A: 12c. Cập nhật bảng đơn hàng và số liệu doanh thu
    end
```
*Hình 3.12: Biểu đồ tuần tự (Sequence Diagram) chức năng Quản trị đơn hàng và Hoàn kho tự động khi hủy đơn*

---

# CHƯƠNG 4. KẾT QUẢ TRIỂN KHAI VÀ ĐÁNH GIÁ

## 4.1. Môi trường cài đặt và kiến trúc triển khai hợp nhất (Unified Server)

Hệ thống **Aqualife E-commerce** đã được triển khai hoàn chỉnh và vận hành ổn định trên môi trường thực tế với thông số kỹ thuật như sau:
* **Ngôn ngữ & Môi trường Backend**: `Python 3.14` kết hợp `Flask 3.0.3`, `Flask-CORS 4.0.1`, `psycopg2-binary 2.9.9` và `bcrypt 4.2.0`.
* **Hệ quản trị Cơ sở dữ liệu**: `PostgreSQL` (quản trị trực quan qua `pgAdmin 4`), cơ sở dữ liệu `aqualife` được khởi tạo tự động qua 2 tệp kịch bản [`DATABASE/schema.sql`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/DATABASE/schema.sql) và [`DATABASE/seed.sql`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/DATABASE/seed.sql).
* **Kiến trúc Máy chủ Hợp nhất (`Unified Static & API Server`)**: Tại [`BACKEND/app.py`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/app.py), máy chủ Flask được cấu hình phục vụ đồng thời cả các tệp tĩnh của tầng `FRONTEND/` và toàn bộ các điểm cuối `/api/*` trên cùng một cổng `5000` (`host="0.0.0.0"`). Nhờ đó:
  * Người dùng chỉ cần truy cập địa chỉ duy nhất `http://localhost:5000` là hệ thống tự động điều hướng vào trang chủ `/html/home.html`.
  * Không xảy ra lỗi chặn cookie phiên làm việc giữa các tên miền khác nhau (*Cross-Site Cookie Blocking*).
  * Hỗ trợ chia sẻ đường dẫn truy cập trực tiếp cho các máy tính khác trong cùng mạng LAN hoặc qua công cụ **Port Forwarding (Public DevTunnels)** để kiểm thử từ xa ngay lập tức.

## 4.2. Kết quả triển khai các phân hệ chức năng

### 4.2.1. Phân hệ Khách hàng (Storefront — M01 đến M09)

1. **Trang chủ (`home.html`) và Danh mục sản phẩm (`products.html`)**:
   * Hiển thị trực quan 56 sản phẩm thuộc 6 danh mục và 3 hệ môi trường nước sinh vật cảnh (*28 loài Nước ngọt, 19 loài Nước mặn, 9 loài Nước lợ*).
   * Bộ lọc đa chiều cho phép kết hợp tìm kiếm theo tên, lọc theo danh mục (*Cá cảnh, Tép cảnh, Ốc cảnh, Thủy sinh & San hô, Thức ăn, Bể & Thiết bị*), lọc theo môi trường nước (*Nước ngọt, Nước lợ, Nước mặn*), lọc theo mức giá và sắp xếp linh hoạt.

**Bảng 4.1: Thống kê phân bố 56 sản phẩm thực tế theo Danh mục và Môi trường nước trên PostgreSQL**

| Danh mục hệ sinh thái | Hệ Nước ngọt | Hệ Nước mặn / Biển | Hệ Nước lợ | Tổng số sản phẩm |
| :--- | :---: | :---: | :---: | :---: |
| **1. Cá cảnh** | 9 loài | 10 loài | 6 loài | **25** |
| **2. Tép cảnh** | 3 loài | 5 loài | 2 loài | **10** |
| **3. Ốc cảnh** | 3 loài | 3 loài | 1 loài | **7** |
| **4. Thủy sinh & San hô** | 5 loài | 6 loài | 0 loài | **11** |
| **5. Thức ăn & 6. Bể, Thiết bị** | 3 sản phẩm (Đa môi trường / Nước ngọt) | 0 | 0 | **3+** |
| **Tổng cộng trên CSDL** | **28 sản phẩm** | **19 sản phẩm** | **9 sản phẩm** | **56 sản phẩm** |

2. **Trang Chi tiết sản phẩm (`product-detail.html`) & Đánh giá xác thực (`M09b`)**:
   * Cung cấp đầy đủ hình ảnh chất lượng cao, giá bán, số lượng tồn kho thời gian thực, nhãn môi trường nước và bảng thông số kỹ thuật hồ nuôi (*Nhiệt độ khuyến nghị, Độ pH, Kích thước trưởng thành, Tập tính sinh học*).
   * Tích hợp khu vực **Đánh giá từ người mua thực tế**: Hiển thị điểm sao trung bình (`average_rating`), tổng số lượt đánh giá và biểu mẫu gửi nhận xét dành riêng cho khách hàng đã mua sản phẩm.
3. **Trang Giỏ hàng (`cart.html`), Thanh toán (`pay.html`) và Đơn hàng của tôi (`orders.html`)**:
   * Giỏ hàng đồng bộ tức thời với PostgreSQL, tự động kiểm tra số lượng tồn kho khi tăng/giảm số lượng.
   * Trang thanh toán tự động điền sẵn Họ tên, Số điện thoại và Địa chỉ từ hồ sơ người dùng, hỗ trợ chọn `Thanh toán khi nhận hàng (COD)` hoặc `Chuyển khoản ngân hàng (QR VietQR)`.
   * Trang lịch sử đơn hàng cho phép lọc đơn theo 5 trạng thái và hỗ trợ nút **"Hủy đơn hàng"** đối với các đơn đang ở trạng thái `pending` (tự động hoàn trả tồn kho).
4. **Trang Hồ sơ cá nhân (`profile.html`) và Trang Liên hệ (`contact.html`)**:
   * Cho phép cập nhật thông tin liên hệ và đổi mật khẩu bảo mật.
   * Trang Liên hệ tích hợp biểu mẫu gửi yêu cầu tư vấn thiết kế hồ thủy sinh có kiểm tra dữ liệu đầu vào và danh mục câu hỏi thường gặp (FAQ Accordion).

### 4.2.2. Phân hệ Quản trị "Aqualife Admin — The Oceanic Curator" (M10 đến M12)

Giao diện quản trị độc lập tại [`FRONTEND/html/admin.html`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/html/admin.html) (kết hợp [`FRONTEND/css/admin.css`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/css/admin.css) và [`FRONTEND/js/admin.js`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/FRONTEND/js/admin.js)) được thiết kế chuyên biệt cho nhà quản lý cửa hàng thủy sinh với các tính năng nổi bật:

1. **Tự động nhận diện và chuyển hướng khi đăng nhập**: Khi đăng nhập bằng tài khoản `admin@aqualife.com`, hệ thống chuyển thẳng tới giao diện **Aqualife Admin — The Oceanic Curator**.
2. **Hệ thống 4 thẻ KPI sức khỏe kho hàng trực quan**:
   * **Tổng sản phẩm**: Hiển thị tổng số loài và thiết bị hiện có trong danh mục.
   * **Đang bán (Active)**: Hiển thị số lượng và tỷ lệ phần trăm danh mục đang mở bán.
   * **Sắp hết hàng (Low Stock)**: Cảnh báo màu vàng cam đối với các loài có số lượng tồn kho $1 \le \text{stock} \le 5$ kèm nhãn *"Cần nhập thêm"*.
   * **Hết hàng (Out of Stock)**: Cảnh báo màu đỏ đối với các loài có $\text{stock} = 0$ kèm nhãn *"Mất doanh thu tiềm năng"*.
3. **Quản lý Sản phẩm & Phân loại Môi trường nước (`water_type`)**:
   * Bảng dữ liệu hiển thị đầy đủ ảnh thu nhỏ, tên loài, mã định danh **SKU tự động** (ví dụ: `AQ-CA-001`, `AQ-SH-014`), huy hiệu **Danh mục hệ** kết hợp huy hiệu **Môi trường nước** (`💧 Nước ngọt`, `🌊 Nước mặn`, `🌿 Nước lợ`, `🔄 Đa môi trường`), giá bán, số lượng tồn kho và trạng thái sinh thái.
   * Hộp thoại (*Modal*) Thêm / Chỉnh sửa sản phẩm tích hợp trường chọn **Môi trường nước (`#prod-form-water-type`)** lưu trực tiếp vào cột `products.water_type` trên PostgreSQL.
   * Hỗ trợ bộ lọc gộp thông minh theo cả **Phân loại Môi trường nước** và **Danh mục Sinh vật & Thiết bị**.
4. **Thanh tác vụ hàng loạt (*Floating Bulk Action Bar*) & Xuất/Nhập dữ liệu**:
   * Khi tích chọn nhiều sản phẩm trên bảng, thanh công cụ nổi ở cạnh dưới màn hình xuất hiện, cho phép **Cập nhật giá & tồn kho hàng loạt** (theo giá cố định, theo % tăng/giảm, hoặc cộng/trừ tồn kho) và **Đổi trạng thái hiển thị hàng loạt** chỉ với một thao tác.
   * Hỗ trợ **Xuất tệp báo cáo CSV** (có BOM UTF-8 hiển thị chuẩn tiếng Việt trên Microsoft Excel) và **Nhập nhanh danh sách sản phẩm từ tệp JSON**.
5. **Quản lý Danh mục, Đơn hàng, Khách hàng và Báo cáo Doanh thu**:
   * Quản lý vòng đời đơn hàng theo đúng máy trạng thái, tự động hoàn kho khi hủy đơn.
   * Biểu đồ phân tích doanh thu theo ngày/tháng và bảng tỷ trọng doanh thu theo từng danh mục sinh thái.

---

## 4.3. Kết quả kiểm thử tự động và đánh giá thực nghiệm

### 4.3.1. Kịch bản kiểm thử tự động End-to-End với Pytest

Nhóm đã xây dựng bộ kịch bản kiểm thử tích hợp tự động bằng thư viện **`pytest`** tại thư mục [`BACKEND/tests/`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/tests/) (gồm 2 tệp [`test_m08_shop_orders.py`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/tests/test_m08_shop_orders.py) và [`test_full_project.py`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/BACKEND/tests/test_full_project.py)) chạy trực tiếp trên cơ sở dữ liệu PostgreSQL thực tế. Kết quả thực thi toàn bộ **9/9 kịch bản kiểm thử đều đạt `PASSED` 100%** trong thời gian `4.03 giây`:

**Bảng 4.2: Kết quả thực thi 9 kịch bản kiểm thử tự động End-to-End bằng bộ công cụ `Pytest`**

| STT | Tên hàm kiểm thử (`Test Case`) | Phân hệ kiểm tra | Nội dung kiểm chứng thực nghiệm | Kết quả |
| :-: | :--- | :---: | :--- | :---: |
| 1 | `test_unified_static_frontend_serving` | Unified Server (`M01–M12`) | Kiểm tra điều hướng `/`, `/admin` và phục vụ toàn bộ các trang HTML tĩnh (`home`, `products`, `cart`, `pay`, `orders`, `profile`, `admin`, `contact`). | **PASSED** |
| 2 | `test_categories_and_products_endpoints` | Catalog (`M02`, `M03`) | Kiểm tra API danh mục, tìm kiếm sản phẩm, lọc theo `category_id`, khoảng giá và truy xuất chi tiết sản phẩm. | **PASSED** |
| 3 | `test_cart_requires_auth` | Auth & Cart (`M04`, `M05`) | Đảm bảo người dùng chưa đăng nhập gọi API giỏ hàng sẽ bị chặn với mã `HTTP 401 Unauthorized`. | **PASSED** |
| 4 | `test_cart_crud_and_stock_validation` | Cart (`M05`) | Kiểm tra thêm giỏ hàng, cộng dồn số lượng, chặn đặt vượt tồn kho (`HTTP 400`), xóa từng món và xóa toàn bộ giỏ. | **PASSED** |
| 5 | `test_checkout_transaction_order_history_and_cancel` | Checkout & Orders (`M06`, `M08`) | Kiểm chứng đặt hàng trừ đúng `products.stock`, xóa sạch `cart_items`, lưu lịch sử đơn và hoàn trả đúng `stock` khi hủy đơn `pending`. | **PASSED** |
| 6 | `test_checkout_rollback_and_fallback_items` | ACID Rollback (`M06`) | Kiểm chứng khi 1 sản phẩm vượt tồn kho, toàn bộ giao dịch `ROLLBACK`, không sinh đơn hàng lỗi và bảo toàn nguyên vẹn số lượng tồn kho. | **PASSED** |
| 7 | `test_m09a_profile_and_password_change` | Profile (`M09a`) | Kiểm tra cập nhật họ tên, SĐT, địa chỉ và quy trình đổi mật khẩu có xác thực mật khẩu hiện tại. | **PASSED** |
| 8 | `test_m09b_verified_purchase_reviews` | Verified Review (`M09b`) | Kiểm chứng chặn đánh giá khi đơn chưa hoàn tất (`HTTP 403`), cho phép đánh giá khi đơn đạt `completed` (`HTTP 201`), chặn đánh giá trùng (`HTTP 409`), sửa và xóa đánh giá. | **PASSED** |
| 9 | `test_m10_m11_m12_admin_dashboard_and_management` | Admin Curator (`M10–M12`) | Kiểm chứng phân quyền `@admin_required` (`HTTP 403` với khách thường), CRUD danh mục, CRUD sản phẩm kèm `water_type`, Bulk Update giá/tồn kho, điều phối đơn hàng, báo cáo doanh thu và quản lý người dùng. | **PASSED** |

### 4.3.2. Đánh giá hiệu năng và tính toàn vẹn dữ liệu
* **Thời gian phản hồi API**: Nhờ sử dụng `ThreadedConnectionPool` và hệ thống chỉ mục (`Indexes`) trên các cột khóa ngoại và trạng thái, thời gian phản hồi trung bình của các API truy vấn danh sách sản phẩm, giỏ hàng và thống kê Admin đạt dưới **50ms** trên môi trường cục bộ.
* **Độ tin cậy giao dịch**: Cơ chế `SELECT ... FOR UPDATE` kết hợp `commit=True` trong `get_db_cursor` đảm bảo 100% không xảy ra hiện tượng trừ âm tồn kho hoặc mất đồng bộ giữa trạng thái đơn hàng và số lượng sản phẩm thực tế.

---

# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 1. Kết luận
Sau quá trình nghiên cứu, phân tích, thiết kế và lập trình nghiêm túc, nhóm 4 sinh viên chúng tôi đã hoàn thành đầy đủ các mục tiêu đề ra của đề tài **"Xây dựng Hệ thống Thương mại Điện tử Kinh doanh Sinh vật Cảnh và Phụ kiện Thủy sinh Aqualife E-commerce"** thuộc học phần **Thiết kế Web**:

1. **Hoàn thiện kiến trúc Full-stack chuẩn mực**: Xây dựng thành công hệ thống tách biệt rõ ràng giữa 3 tầng `Frontend (HTML5/CSS3/Vanilla JS)` – `Backend (Python Flask RESTful API)` – `Database (PostgreSQL)` với 7 bảng dữ liệu chuẩn hóa và 28 API Endpoints.
2. **Giải quyết bài toán đặc thù ngành thủy sinh**: Tích hợp xuyên suốt hệ thống phân loại **Môi trường nước (`water_type`: Nước ngọt, Nước mặn, Nước lợ, Đa môi trường)** cùng bảng thông số kỹ thuật hồ nuôi cho 56 sản phẩm thực tế, giúp người chơi thủy sinh tra cứu và chọn mua chính xác.
3. **Đảm bảo an toàn giao dịch và minh bạch cộng đồng**: Hiện thực hóa thành công giỏ hàng đồng bộ máy chủ, giao dịch đặt hàng nguyên tử **ACID** với khóa bi quan `SELECT ... FOR UPDATE`, cơ chế hoàn kho tự động khi hủy đơn và hệ thống **Đánh giá xác thực mua hàng (Verified Purchase Reviews)**.
4. **Đột phá trải nghiệm quản trị với "Aqualife Admin — The Oceanic Curator"**: Thiết kế cổng quản trị độc lập dành riêng cho Admin với đầy đủ thẻ KPI cảnh báo tồn kho, bộ lọc môi trường nước, thanh công cụ cập nhật hàng loạt (*Bulk Actions*), xuất CSV, nhập JSON và báo cáo doanh thu trực quan.

## 2. Hướng phát triển trong tương lai
Trong giai đoạn tiếp theo, hệ thống **Aqualife E-commerce** có thể được mở rộng theo các hướng sau:
* **Tích hợp Cổng thanh toán tự động (Webhook VietQR / VNPay / MoMo)**: Tự động đối soát giao dịch chuyển khoản ngân hàng và chuyển trạng thái đơn hàng từ `pending` sang `confirmed` theo thời gian thực.
* **Công cụ "Xây dựng cấu hình bể thủy sinh thông minh" (Smart Aquarium Builder)**: Tự động kiểm tra độ tương thích sinh học giữa các loài cá, tép, san hô trong giỏ hàng (ví dụ: cảnh báo ngay nếu khách hàng chọn chung loài cá nước ngọt và cá nước mặn, hoặc chọn loài cá săn mồi chung với tép cảnh nhỏ).
* **Tích hợp Trợ lý ảo AI tư vấn chăm sóc thủy sinh**: Ứng dụng mô hình ngôn ngữ lớn (LLM) để giải đáp trực tiếp các câu hỏi về xử lý rêu hại, cân bằng chu trình Nitơ và gợi ý sản phẩm theo kích thước bể của khách hàng.

---

# TÀI LIỆU THAM KHẢO
*(Trích dẫn theo chuẩn IEEE)*

[1] M. Grinberg, *Flask Web Development: Developing Web Applications with Python*, 2nd ed. Sebastopol, CA, USA: O'Reilly Media, 2018.

[2] PostgreSQL Global Development Group, *PostgreSQL 16 Documentation — Chapter 13: Concurrency Control and Explicit Locking (SELECT FOR UPDATE)*, 2024. [Online]. Available: https://www.postgresql.org/docs/current/explicit-locking.html

[3] Mozilla Developer Network (MDN), *HTML5, CSS Grid Layout, and Fetch API Living Standards Documentation*, Mozilla Foundation, 2025. [Online]. Available: https://developer.mozilla.org/

[4] R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Dept. Information and Computer Science, Univ. of California, Irvine, CA, USA, 2000.

[5] J. Duckett, *HTML and CSS: Design and Build Websites*, 1st ed. Indianapolis, IN, USA: Wiley, 2011.

[6] D. Flanagan, *JavaScript: The Definitive Guide*, 7th ed. Sebastopol, CA, USA: O'Reilly Media, 2020.

[7] OWASP Foundation, *OWASP Top 10 Web Application Security Risks & Session Management Cheat Sheet*, 2024. [Online]. Available: https://owasp.org/

---

# PHỤ LỤC

## Phụ lục A: Danh mục 28 RESTful API Endpoints của hệ thống Aqualife E-commerce

**Bảng A.1: Danh mục toàn bộ 28 RESTful API Endpoints của hệ thống**

| Nhóm phân hệ | Phương thức | Đường dẫn Endpoint (`URI`) | Quyền truy cập | Chức năng xử lý chính |
| :--- | :---: | :--- | :---: | :--- |
| **Health & Static** | `GET` | `/api/health` | Public | Kiểm tra kết nối PostgreSQL và trạng thái máy chủ. |
| **Auth (`M04`)** | `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng mới (`bcrypt`). |
| | `POST` | `/api/auth/login` | Public | Đăng nhập, khởi tạo Session và trả về `role` phân luồng. |
| | `POST` | `/api/auth/logout` | User / Admin | Đăng xuất và xóa phiên làm việc hiện tại. |
| | `GET` | `/api/auth/me` | User / Admin | Lấy thông tin người dùng đang đăng nhập. |
| **Catalog (`M02–M03`)** | `GET` | `/api/categories` | Public | Lấy danh sách danh mục đang hoạt động kèm số sản phẩm. |
| | `GET` | `/api/products` | Public | Tìm kiếm, lọc sản phẩm theo danh mục, giá, tồn kho. |
| | `GET` | `/api/products/<id>` | Public | Xem chi tiết sản phẩm, thông số và môi trường nước. |
| **Cart (`M05`)** | `GET` | `/api/cart` | `@login_required` | Lấy toàn bộ giỏ hàng hiện tại của người dùng. |
| | `POST` | `/api/cart/items` | `@login_required` | Thêm sản phẩm vào giỏ (kiểm tra trần tồn kho). |
| | `PUT` | `/api/cart/items/<id>` | `@login_required` | Cập nhật số lượng mặt hàng trong giỏ. |
| | `DELETE` | `/api/cart/items/<id>` | `@login_required` | Xóa một mặt hàng khỏi giỏ hàng. |
| | `DELETE` | `/api/cart` | `@login_required` | Làm trống toàn bộ giỏ hàng. |
| **Orders (`M06, M08`)** | `POST` | `/api/orders` | `@login_required` | Đặt hàng với giao dịch ACID (`SELECT FOR UPDATE`). |
| | `GET` | `/api/orders` | `@login_required` | Lấy lịch sử đơn hàng của khách hàng hiện tại. |
| | `GET` | `/api/orders/<id>` | `@login_required` | Xem chi tiết đơn hàng và danh sách `order_items`. |
| | `PATCH` | `/api/orders/<id>/cancel` | `@login_required` | Khách hủy đơn hàng `pending` và hoàn trả tồn kho. |
| **Profile (`M09a`)** | `GET / PUT` | `/api/users/me` | `@login_required` | Xem và cập nhật họ tên, số điện thoại, địa chỉ. |
| | `PUT` | `/api/users/me/password` | `@login_required` | Đổi mật khẩu sau khi xác thực mật khẩu hiện tại. |
| **Reviews (`M09b`)** | `GET` | `/api/products/<id>/reviews` | Public | Lấy danh sách đánh giá và điểm sao trung bình. |
| | `POST` | `/api/products/<id>/reviews` | `@login_required` | Gửi đánh giá mới (yêu cầu đã có đơn `completed`). |
| | `PUT / DELETE`| `/api/reviews/<id>` | `@login_required` | Sửa hoặc xóa đánh giá của chính mình (hoặc Admin). |
| **Admin (`M10–M12`)** | `GET` | `/api/admin/dashboard` | `@admin_required` | Lấy số liệu tổng quan Dashboard & đơn hàng mới nhất. |
| | `GET` | `/api/admin/revenue` | `@admin_required` | Báo cáo doanh thu theo ngày, tháng và danh mục. |
| | `GET / POST` | `/api/admin/categories` | `@admin_required` | Quản lý danh sách và tạo mới danh mục hệ sinh thái. |
| | `PUT / DELETE`| `/api/admin/categories/<id>` | `@admin_required` | Cập nhật hoặc chuyển trạng thái danh mục. |
| | `GET / POST` | `/api/admin/products` | `@admin_required` | Lấy toàn bộ sản phẩm và thêm mới kèm `water_type`. |
| | `PUT / DELETE`| `/api/admin/products/<id>` | `@admin_required` | Cập nhật sản phẩm (`water_type`, giá, kho) hoặc ẩn mềm. |
| | `POST` | `/api/admin/products/bulk` | `@admin_required` | Cập nhật giá, tồn kho hoặc trạng thái hàng loạt. |
| | `GET / PATCH` | `/api/admin/orders...` | `@admin_required` | Quản lý toàn bộ đơn hàng và chuyển trạng thái đơn. |
| | `GET / PATCH` | `/api/admin/users...` | `@admin_required` | Quản lý người dùng, khóa/mở khóa và cấp quyền Admin. |

---

## Phụ lục B: Hướng dẫn cài đặt và vận hành hệ thống

1. **Khởi tạo Cơ sở dữ liệu PostgreSQL**:
   * Tạo cơ sở dữ liệu tên `aqualife` trên PostgreSQL / pgAdmin 4.
   * Chạy lần lượt [`DATABASE/schema.sql`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/DATABASE/schema.sql) và [`DATABASE/seed.sql`](file:///D:/NEU/Subject/Code%20Web/Group%20assignment/aqualife-ecommerce/DATABASE/seed.sql).
2. **Cấu hình biến môi trường `BACKEND/.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/aqualife
   SECRET_KEY=aqualife-secret-key
   FLASK_DEBUG=1
   ```
3. **Khởi chạy máy chủ hợp nhất**:
   ```powershell
   cd BACKEND
   ..\.venv\Scripts\python.exe app.py
   ```
   * Truy cập Cửa hàng & Quản trị tại: **`http://localhost:5000`**
   * Tài khoản Admin mẫu: `admin@aqualife.com` / `123456`
   * Tài khoản Khách hàng mẫu: `khach1@aqualife.com` / `123456`
