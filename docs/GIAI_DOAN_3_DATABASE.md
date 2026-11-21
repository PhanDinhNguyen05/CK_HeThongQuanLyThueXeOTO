# BÁO CÁO THIẾT KẾ CSDL MICROSOFT SQL SERVER (GIAI ĐOẠN 3)

**Database:** `AUK_CarRental`  
**Scripts:**
- [01_create_database_and_tables.sql](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/database/01_create_database_and_tables.sql)
- [02_seed_data.sql](file:///d:/HK1_2026/MonCoTrang/CK_HeThongQuanLyThueXeOTO/database/02_seed_data.sql)

---

## 1. Danh sách 18 bảng (đối chiếu `PTUD_TKSCDL.vpp` & `BaiTapNhom.pdf`)

| Nhóm | Tên bảng | Khóa chính (PK) | Khóa ngoại (FK) chính | Ràng buộc nổi bật |
|---|---|---|---|---|
| Người dùng | `KHACH_HANG` | `MaKH` | — | `UNIQUE(SoDinhDanh)`, `UNIQUE(GiayPhepLaiXe)` |
| Người dùng | `THANH_VIEN` | `MaTV` | `MaKH` → `KHACH_HANG` | `UNIQUE(MaKH)`, `CHECK(DiemTichLuy >= 0)` |
| Người dùng | `KHACH_VANG_LAI` | `MaKH` | `MaKH` → `KHACH_HANG` | Kế thừa từ `KHACH_HANG` |
| Người dùng | `NHAN_VIEN` | `MaNV` | — | `TrangThai` mặc định `Đang làm việc` |
| Người dùng | `TAI_KHOAN` | `TenDN` | `MaKH` → `KHACH_HANG`, `MaNV` → `NHAN_VIEN` | `CHECK(SoLanDangNhapSai >= 0)`, `CHK_TAI_KHOAN_OWNER` |
| Danh mục xe | `PHAN_KHUC_XE` | `MaPhanKhuc` | — | — |
| Danh mục xe | `HANG_XE` | `MaHang` | — | — |
| Danh mục xe | `MAU_XE` | `MaMauXe` | `MaPhanKhuc`, `MaHang` | `CHECK(GiaThueNgay > 0)` |
| Danh mục xe | `THONG_SO_MAU_XE` | `MaMauXe` | `MaMauXe` → `MAU_XE` | Quan hệ 1-1 với `MAU_XE` |
| Danh mục xe | `XE` | `MaXe` | `MaMauXe` → `MAU_XE` | `UNIQUE(BienSo, SoKhung, SoMay, MaVach)`, `CHECK(SoKmHienTai >= 0)` |
| Nghiệp vụ thuê | `DON_DAT_XE` | `MaDD` | `MaKH`, `MaMauXe`, `MaNV` (NULL) | `CHECK(NgayTra > NgayNhan)` |
| Nghiệp vụ thuê | `CHI_TIET_DAT_XE` | `(MaDD, MaXe)` | `MaDD` → `DON_DAT_XE`, `MaXe` → `XE` | PK kết hợp |
| Nghiệp vụ thuê | `HOP_DONG_THUE` | `MaHD` | `MaDD` (NULL), `MaXe`, `MaNV`, `MaKH` | `UNIQUE(SoHD)` |
| Tài chính | `KHOAN_PHAT` | `MaKhoanPhat` | `MaHD`, `MaKH` | `CHECK(SoTienPhat > 0)` |
| Tài chính | `GIAO_DICH_THANH_TOAN` | `MaGiaoDich` | `MaHD` (NULL), `MaKhoanPhat` (NULL), `MaKH` | `CHECK(SoTien > 0)` (không lưu số thẻ/CVV) |
| Gia hạn | `YEU_CAU_GIA_HAN` | `MaYC` | `MaKH` → `KHACH_HANG` | `TrangThai` mặc định `Chờ xét duyệt` |
| Vận hành | `BAO_DUONG` | `MaBaoDuong` | `MaXe`, `MaNV` | `CHECK(PhiBaoDuong >= 0)` |
| Vận hành | `SU_CO` | `MaSuCo` | `MaHD`, `MaXe` | `ChuyenPhapChe BIT` |

---

## 2. Giải trình các điểm điều chỉnh nhỏ so với tài liệu gốc
1. **Bảng `TAI_KHOAN` (trang 79 PDF):** Tài liệu PDF chỉ thiết kế `MaKH NOT NULL`, nhưng ở `UC10` (Đăng nhập) hệ thống có 3 vai trò (`Khách hàng`, `Nhân viên`, `Quản trị viên`). Do đó cột `MaKH` được cho phép `NULL` và bổ sung cột `MaNV NULL` kèm ràng buộc `CHK_TAI_KHOAN_OWNER` để mỗi tài khoản thuộc về đúng 1 Khách hàng hoặc 1 Nhân viên/Quản trị viên.
2. **Bảng `KHACH_HANG`:** Bổ sung `HanGPLX DATE NULL` (phục vụ kiểm tra hiệu lực bằng lái ở `UC08`, `UC27`) và `BiCamThue BIT NOT NULL DEFAULT 0` (phục vụ kiểm tra điều kiện thuê ở `UC12`, `UC32`).
