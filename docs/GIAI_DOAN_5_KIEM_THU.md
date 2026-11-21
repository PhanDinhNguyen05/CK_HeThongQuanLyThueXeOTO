# BÁO CÁO KIỂM THỬ VÀ HOÀN THIỆN (GIAI ĐOẠN 5)
## HỆ THỐNG QUẢN LÝ THUÊ XE Ô TÔ — AUK CAR RENTAL

---

## 1. Tổng hợp kết quả kiểm thử tự động

### 1.1. Kiểm thử Backend RESTful API (`npm.cmd test`)
Bộ kiểm thử tại [api.test.js](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/backend/test/api.test.js) đã chạy **8/8 test cases đạt 100%** (`0` lỗi, thời gian `894.45ms`):

| STT | Nhóm kiểm thử | Nội dung đã xác minh | Kết quả |
| :---: | :--- | :--- | :---: |
| 1 | Health Check | `GET /health` trả về `200 UP` | Đạt |
| 2 | Đăng ký tài khoản | Kiểm tra SĐT sai định dạng (`400`), đăng ký hợp lệ (`201`) | Đạt |
| 3 | Đăng nhập & RBAC | JWT login, chặn `401` khi chưa đăng nhập, chặn `403` khi sai vai trò, khóa tài khoản sau 5 lần sai mật khẩu (`403`) | Đạt |
| 4 | Luồng thuê xe trọn vẹn | Tìm kiếm mẫu xe → Đặt xe online → Nhân viên duyệt đơn → Lập hợp đồng → Chặn xóa xe đang thuê (`409`) → Xử lý trả xe → Thanh toán | Đạt |
| 5 | Quản trị nhân viên | Thêm, tìm kiếm và xóa nhân viên (xóa vật lý khi chưa phát sinh dữ liệu) | Đạt |
| 6 | Hồ sơ & Thành viên | Cập nhật SĐT/email (chặn sai định dạng `400`), đăng ký thành viên (`201`), chặn đăng ký trùng (`409`) | Đạt |
| 7 | Hủy đơn, Gia hạn & Phạt | Hủy đơn đặt xe, gửi yêu cầu gia hạn đặt chỗ, nhân viên phê duyệt gia hạn, lập khoản phạt & thanh toán khoản phạt | Đạt |
| 8 | Bảo dưỡng, Sự cố, Xe & RBAC chặt | CRUD mẫu xe/xe, chặn trùng biển số (`409`), ghi nhận bảo dưỡng & sự cố, kiểm tra chéo quyền Nhân viên/Admin/Khách hàng (`403`/`404`) | Đạt |

### 1.2. Kiểm thử Build & Tích hợp Frontend (`npm.cmd run build`)
- Kết quả build Vite production: **Thành công** (`1533 modules transformed`, `0` lỗi cú pháp hoặc thiếu import, thời gian `2.48s`).
- Toàn bộ thao tác ở các trang Khách hàng, Nhân viên, Quản trị viên đều gọi trực tiếp API Backend qua [client.js](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/frontend/src/api/client.js) và [endpoints.js](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/frontend/src/api/endpoints.js).

---

## 2. Đối chiếu theo từng vai trò & dữ liệu

- **Khách hàng / Thành viên**: Chỉ truy cập được các trang `/khach-hang/*`, xem và sửa hồ sơ cá nhân, đăng ký/gia hạn thành viên, đặt xe, hủy/gia hạn đơn đặt, xem lịch sử thuê, thanh toán khoản nợ & khoản phạt. Không thể xem hợp đồng của khách hàng khác hoặc gọi API nhân viên/quản trị.
- **Nhân viên**: Truy cập cổng `/nhan-vien/*`, xử lý đơn đặt xe, lập hợp đồng (khách có sẵn & vãng lai), xử lý trả xe (tự động sinh khoản phạt khi trễ hạn/thiếu nhiên liệu/hư hỏng), lập khoản phạt, duyệt yêu cầu gia hạn, quản lý mẫu xe & xe, ghi nhận bảo dưỡng & sự cố. Không thể truy cập API quản trị nhân viên (`/api/admin/*`).
- **Quản trị viên**: Truy cập cổng `/quan-tri/*`, xem tổng quan hệ thống và CRUD nhân viên (tự động chuyển sang `Ngừng hoạt động` nếu nhân viên đã phát sinh nghiệp vụ liên quan).

---

## 3. Tài liệu & Mã nguồn bàn giao toàn dự án

- **Frontend (React + Vite)**: `frontend/`
- **Backend (Node.js + Express)**: `backend/`
- **Database Scripts (Microsoft SQL Server)**:
  - [01_create_database_and_tables.sql](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/database/01_create_database_and_tables.sql)
  - [02_seed_data.sql](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/database/02_seed_data.sql)
- **Tài liệu thiết kế Database**: [GIAI_DOAN_3_DATABASE.md](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/docs/GIAI_DOAN_3_DATABASE.md)
- **Báo cáo kiểm thử**: [GIAI_DOAN_5_KIEM_THU.md](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/docs/GIAI_DOAN_5_KIEM_THU.md)
