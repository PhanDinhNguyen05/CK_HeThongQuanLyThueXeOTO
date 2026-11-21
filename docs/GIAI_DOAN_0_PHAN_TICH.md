# BÁO CÁO PHÂN TÍCH HỆ THỐNG QUẢN LÝ THUÊ XE Ô TÔ (GIAI ĐOẠN 0)

**Tên hệ thống:** Hệ thống Quản lý Thuê Xe Ô Tô (**AUK Car Rental**)  
**Nguồn tài liệu đối chiếu:**
- `BaiTapNhom.pdf` (326 trang – Nhóm 8-DHHTTT19ATT)
- `PTUD_TKSCDL.vpp` (Visual Paradigm: 75 biểu đồ gồm Use Case, Activity, Sequence, Class, Domain, ERD)
- Bộ giao diện mẫu: `index.php`, `assets.rar` (`assets/css/style.css`, `assets/js/main.js`), `includes.rar` (`includes/header.php`, `includes/footer.php`)
- Dự án tham khảo kiến trúc: `tuyenSinh10System-main`

---

## 1. Tổng quan hệ thống

Hệ thống **AUK Car Rental** nhằm tin học hóa toàn bộ nghiệp vụ quản lý và cho thuê xe ô tô tại cửa hàng và trực tuyến, gồm:
- Quản lý tài khoản, thông tin cá nhân khách hàng, thành viên (tích điểm, gia hạn) và khách vãng lai.
- Tra cứu mẫu xe, xem chi tiết mẫu xe, đặt thuê xe online, theo dõi trạng thái đặt xe, hủy đặt xe, gia hạn đặt chỗ.
- Xử lý đơn đặt xe, lập hợp đồng thuê xe, giao/trả xe (hỗ trợ mã vạch), tính phí phát sinh và lập khoản phạt.
- Thanh toán trực tuyến (Thẻ tín dụng, Ngân hàng, Ví điện tử).
- Quản lý mẫu xe, xe, bảo dưỡng xe, xử lý sự cố khi thuê xe (chuyển Phòng Pháp chế nếu nghiêm trọng).
- Quản lý nhân viên (thêm, cập nhật, xóa, tìm kiếm).

### 11 Quy trình nghiệp vụ (BP01 – BP11)
| Mã | Quy trình nghiệp vụ |
|---|---|
| BP01 | Quản lý tài khoản và thông tin cá nhân |
| BP02 | Quản lý thành viên |
| BP03 | Tra cứu và lựa chọn mẫu xe |
| BP04 | Quản lý đặt xe |
| BP05 | Thuê xe và lập hợp đồng |
| BP06 | Trả xe và xử lý phí |
| BP07 | Thanh toán và xử lý công nợ |
| BP08 | Quản lý lịch sử thuê xe |
| BP09 | Quản lý nhân viên |
| BP10 | Quản lý mẫu xe và xe |
| BP11 | Quản lý bảo dưỡng và sự cố |

### 12 Quy tắc nghiệp vụ (BR01 – BR12)
- **BR01**: Mỗi thành viên có mã thành viên riêng và được quản lý trong hệ thống.
- **BR02**: Xe phải ở trạng thái `Sẵn sàng` mới được cho thuê; nhân viên phải xác minh thông tin khách hàng và kiểm tra bằng lái xe hợp lệ.
- **BR03**: Chỉ thành viên mới được tích lũy điểm; khách vãng lai không được tích điểm.
- **BR04**: Yêu cầu đặt xe phải được kiểm tra tính hợp lệ và tình trạng xe trước khi chấp nhận.
- **BR05**: Nếu yêu cầu đặt chỗ chưa được đáp ứng sau 7 ngày, nhân viên liên hệ khách hàng xác nhận gia hạn thêm 7 ngày (chỉ gia hạn khi khách đồng ý).
- **BR06**: Khi trả xe, nhân viên phải kiểm tra thời hạn trả, mức nhiên liệu và tình trạng thực tế của xe.
- **BR07**: Trả xe quá hạn, thiếu nhiên liệu hoặc vi phạm phải được ghi nhận và tính phí/tiền phạt tương ứng.
- **BR08**: Không được xóa xe khi xe đang ở trạng thái `Đang thuê`.
- **BR09**: Biển số xe không được trùng trong hệ thống.
- **BR10**: Kiểm tra email (không trống, đúng định dạng), số điện thoại (đúng 10 chữ số, không chứa chữ), số CCCD hợp lệ, giấy phép lái xe hợp lệ.
- **BR11**: Mật khẩu phải có ít nhất 8 ký tự.
- **BR12**: Đảm bảo tính toàn vẹn giao dịch CSDL (rollback khi lỗi, không lưu dữ liệu dở dang).

---

## 2. Danh sách tác nhân (Actors)

Theo `PTUD_TKSCDL.vpp` (`QLOTO_USECASE`) và `BaiTapNhom.pdf`:
1. **Khách hàng** (khái quát hóa cho **Thành viên** và **Khách vãng lai**)
2. **Thành viên** (kế thừa từ Khách hàng)
3. **Khách vãng lai** (kế thừa từ Khách hàng)
4. **Nhân viên** (Trợ lý tại cửa hàng)
5. **Quản trị viên**
6. **Cổng thanh toán** (Actor phụ / Bên thứ ba xử lý thanh toán)

*(Ngoài ra trong mô tả bài toán có nhắc tới Phòng Thu hồi nợ, Phòng Pháp chế là bộ phận tiếp nhận hồ sơ chuyển tiếp khi có sự cố nghiêm trọng / nợ xấu).*

---

## 3. Danh sách Use Case & Phân quyền theo Tác nhân (UC01 – UC34)

### Nhóm Khách hàng / Thành viên
| Mã UC | Tên Use Case | Ghi chú |
|---|---|---|
| UC01 | Đăng ký tài khoản | Validate BR10, BR11, kiểm tra trùng tên đăng nhập |
| UC02 | Đăng ký thành viên | Yêu cầu đã đăng nhập, chưa là thành viên |
| UC03 | Quản lý thông tin cá nhân | Xem & sửa SĐT, email, địa chỉ (không sửa Họ tên, CCCD, GPLX) |
| UC04 | Hủy đặt xe | Hủy đơn khi còn đủ điều kiện hủy, có xác nhận |
| UC05 | Tìm kiếm mẫu xe | Tìm theo tên, phân khúc/loại xe, giá tối đa; hỗ trợ Làm mới |
| UC08 | Đặt thuê xe online | Tự điền hồ sơ khách hàng, chọn ngày nhận/trả, kiểm tra xe trống & trùng đơn |
| UC09 | Thanh toán | Thanh toán khoản chưa thanh toán qua Thẻ tín dụng / Ngân hàng / Ví điện tử |
| UC10 | Đăng nhập | Chung cho Khách hàng / Nhân viên / Quản trị viên; khóa sau 5 lần sai |
| UC11 | Xem lịch sử thuê xe | Lọc theo trạng thái & khoảng ngày; xem chi tiết hợp đồng |
| UC12 | Yêu cầu gia hạn thành viên | Chọn gói gia hạn (còn <= 30 ngày hoặc đã hết hạn, không nợ, không bị cấm) |
| UC13 | Yêu cầu gia hạn hợp đồng | Chọn hợp đồng Đang thuê, đề nghị ngày trả mới |
| UC24 | Xem trạng thái đặt xe | Tra cứu trạng thái đơn đặt xe |
| UC31 | Xem thông tin chi tiết mẫu xe | Xem thông số kỹ thuật, giá, mô tả chi tiết mẫu xe |
| UC34 | Khách hàng yêu cầu gia hạn đặt xe | Đề nghị kéo dài thời gian cho đơn đặt xe đang hiệu lực |

### Nhóm Nhân viên
| Mã UC | Tên Use Case | Ghi chú |
|---|---|---|
| UC05 | Tìm kiếm mẫu xe | Dùng chung với Khách hàng |
| UC06 | Xử lý đơn đặt xe | Xác nhận hoặc Từ chối (kèm lý do) đơn đặt xe |
| UC07 | Xét phê duyệt gia hạn thành viên | Phê duyệt (+1 năm / theo gói) hoặc Từ chối (kèm lý do) |
| UC10 | Đăng nhập | Xác thực vai trò Nhân viên |
| UC18 | Xử lý sự cố khi thuê xe | Ghi nhận sự cố (mất chìa khóa, va quẹt, tai nạn...); chuyển Phòng Pháp chế nếu nghiêm trọng |
| UC19 | Quản lý bảo dưỡng | Xem lịch sử bảo dưỡng và ghi nhận bảo dưỡng mới cho xe |
| UC20 | Xét duyệt yêu cầu gia hạn hợp đồng | Phê duyệt hoặc Từ chối yêu cầu gia hạn |
| UC21 | Thêm mẫu xe | Thêm mẫu xe, giá, phân khúc, nhà cung cấp, động cơ, mô tả, poster |
| UC22 | Cập nhật mẫu xe | Chỉnh sửa thông tin mẫu xe |
| UC23 | Xóa mẫu xe | Chỉ xóa khi không còn đơn đặt / hợp đồng tham chiếu |
| UC25 | Xử lý trả xe | Quét mã vạch/nhập tay, đối chiếu hạn trả, nhiên liệu, tình trạng xe |
| UC26 | Lập khoản phạt | Tính và ghi nhận khoản phạt (quá hạn, thiếu nhiên liệu, hư hỏng...) |
| UC27 | Lập hợp đồng thuê xe | Lập hợp đồng từ hồ sơ lưu & mẫu xe đã chọn |
| UC28 | Thêm xe mới | Khai báo biển số, mẫu xe, màu, số khung, số máy, năm SX (mặc định Sẵn sàng) |
| UC29 | Cập nhật thông tin xe | Chỉnh sửa thông tin xe (chặn nếu xe đang thuê) |
| UC30 | Xóa xe | Soft delete -> Ngừng hoạt động (chặn nếu xe đang thuê - BR08) |
| UC32 | Thuê xe | Hỗ trợ cả Thành viên và Khách vãng lai, gợi ý xe thay thế, xử lý nợ cũ |
| UC33 | Xét duyệt gia hạn đặt xe | Kiểm tra trùng lịch, Phê duyệt hoặc Từ chối yêu cầu gia hạn đặt chỗ |

### Nhóm Quản trị viên
| Mã UC | Tên Use Case | Ghi chú |
|---|---|---|
| UC10 | Đăng nhập | Xác thực vai trò Quản trị viên |
| UC14 | Thêm nhân viên | Thêm MaNV, HoTen, DienThoai, MoTa |
| UC15 | Cập nhật nhân viên | Cập nhật HoTen, DienThoai, MoTa |
| UC16 | Xóa nhân viên | Kiểm tra dữ liệu liên quan; chuyển Ngừng hoạt động nếu có lịch sử |
| UC17 | Tìm kiếm nhân viên | Tìm theo mã NV, họ tên, số điện thoại |

---

## 4. Những điểm chưa rõ hoặc mâu thuẫn trong tài liệu

1. **Mâu thuẫn về Actor tương tác trực tiếp (trang 17 vs phần còn lại):**
   - Trang 17 ghi: *"Khách hàng/Thành viên/Khách vãng lai không tương tác trực tiếp với hệ thống; Trợ lý là actor chính."*
   - Tuy nhiên, sơ đồ Use Case tổng quát (trang 16), đặc tả UC01–UC05, UC08–UC13, UC24, UC31, UC34 và bộ giao diện mẫu (`header.php`, `index.php`) đều cho phép **Khách hàng / Thành viên** đăng ký, đăng nhập và tương tác trực tiếp.
   - *Phương án xử lý ở Giai đoạn 1:* Hỗ trợ giao diện đầy đủ cho cả Khách hàng/Thành viên, Nhân viên và Quản trị viên đúng theo Use Case & giao diện mẫu.
2. **Mâu thuẫn nội dung tại UC20:**
   - Tiêu đề & Activity/Sequence là *Xét duyệt yêu cầu gia hạn hợp đồng*, nhưng mô tả và mockup lại ghi *gia hạn Reservation chưa được đáp ứng sau 7 ngày* (trùng BR05/UC33).
   - *Phương án xử lý:* Xây dựng cả 2 luồng duyệt (Gia hạn hợp đồng & Gia hạn đặt chỗ) trong màn hình Xét duyệt gia hạn của Nhân viên để không bỏ sót chức năng nào.
3. **Mâu thuẫn Actor tại UC24 (Xem trạng thái đặt xe):**
   - Đặc tả & Activity ghi Actor chính là *Khách hàng*, nhưng ảnh phác thảo trang 227 ghi *(Nhân viên)*.
   - *Phương án xử lý:* Cung cấp tính năng xem trạng thái đặt xe ở cả phía Khách hàng và phía Nhân viên.
4. **Phương thức thanh toán ở UC09:**
   - Đặc tả chỉ nêu *Thẻ tín dụng* và *Ngân hàng*, nhưng phác thảo giao diện & Activity có thêm *Ví điện tử*. Đã tích hợp cả 3 phương thức trên giao diện.
5. **Khác biệt phong cách thiết kế giữa giao diện mẫu và các mockup rời trong PDF:**
   - Giao diện mẫu (`assets/css/style.css`, `includes/header.php`) sử dụng thương hiệu **AUK CAR RENTAL** với bảng màu Luxury Gold (`#b69a65`) & Charcoal (`#292923`, `#24241f`), nền ấm (`#f7f5f0`).
   - Một số mockup trong PDF dùng tên *AUTODRIVE* hoặc màu xanh dương.
   - *Phương án xử lý:* Thống nhất toàn bộ hệ thống theo bộ giao diện mẫu **AUK CAR RENTAL** (Luxury Gold & Charcoal) theo đúng yêu cầu đề bài.

---

## 5. Đề xuất cấu trúc thư mục Frontend (`frontend/src/`)

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   └── auk-theme.css          # Kế thừa trực tiếp design tokens từ assets/css/style.css
    ├── context/
    │   ├── AuthContext.jsx        # Quản lý phiên đăng nhập, khóa tài khoản sai 5 lần, phân quyền
    │   ├── ToastContext.jsx       # Thông báo thành công / thất bại / cảnh báo
    │   └── DataContext.jsx        # Mock state tập trung (liên kết xuyên suốt các màn hình)
    ├── data/
    │   └── mockData.js            # Dữ liệu mẫu chuẩn theo 17 bảng ERD
    ├── layouts/
    │   ├── PublicLayout.jsx       # Topbar + Brand Header + Main Nav + Footer (từ header.php/footer.php)
    │   └── DashboardLayout.jsx    # Sidebar + Topbar cho Nhân viên & Quản trị viên
    ├── components/
    │   ├── ConfirmModal.jsx       # Hộp thoại xác nhận thao tác (Hủy, Xóa, Duyệt...)
    │   ├── StatusBadge.jsx        # Nhãn trạng thái thống nhất
    │   └── EmptyState.jsx         # Trạng thái rỗng khi không có dữ liệu
    └── pages/
        ├── public/
        │   ├── HomePage.jsx
        │   ├── CarSearchPage.jsx
        │   ├── CarDetailPage.jsx
        │   ├── LoginPage.jsx
        │   └── RegisterPage.jsx
        ├── customer/
        │   ├── BookingOnlinePage.jsx
        │   ├── MyBookingsPage.jsx
        │   ├── RentalHistoryPage.jsx
        │   ├── PaymentPage.jsx
        │   ├── MembershipPage.jsx
        │   └── ProfilePage.jsx
        ├── staff/
        │   ├── StaffDashboard.jsx
        │   ├── ManageBookingsPage.jsx
        │   ├── CreateRentalPage.jsx
        │   ├── ReturnCarPage.jsx
        │   ├── PenaltiesPage.jsx
        │   ├── ExtensionApprovalsPage.jsx
        │   ├── CarModelsPage.jsx
        │   ├── CarsPage.jsx
        │   └── MaintenanceIncidentPage.jsx
        └── admin/
            ├── AdminDashboard.jsx
            └── EmployeesPage.jsx
```
