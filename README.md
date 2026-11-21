# HỆ THỐNG QUẢN LÝ THUÊ XE Ô TÔ (AUK CAR RENTAL)

Dự án môn học xây dựng hệ thống quản lý thuê xe ô tô theo kiến trúc **React + Vite → Node.js + Express (RESTful API) → Microsoft SQL Server**.

---

## 1. Công nghệ sử dụng

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, CSS (AUK Luxury Gold & Charcoal theme)
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `mssql`, `cors`, `dotenv`
- **Database**: Microsoft SQL Server (17 bảng chuẩn hóa từ mô hình ERD)

---

## 2. Cấu trúc thư mục

```text
CK_HeThongQuanLyThueXeOTO/
├── backend/                 # RESTful API (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Cấu hình môi trường & Connection Pool SQL Server
│   │   ├── controllers/     # Tiếp nhận request / trả response
│   │   ├── middleware/      # Xác thực JWT, phân quyền RBAC, validate, error handler
│   │   ├── repositories/    # Truy vấn T-SQL (*.sql.js) cho SQL Server
│   │   ├── routes/          # Định tuyến API
│   │   ├── services/        # Xử lý nghiệp vụ (hỗ trợ cả mssql và memory)
│   │   └── server.js        # Điểm khởi chạy Express server
│   ├── test/                # Bộ kiểm thử tự động (node --test)
│   └── .env.example         # File mẫu biến môi trường Backend
├── frontend/                # Giao diện người dùng (React + Vite)
│   ├── src/
│   │   ├── api/             # Fetch API client & endpoints
│   │   ├── components/      # Thành phần dùng chung (StatusBadge, ConfirmModal, EmptyState)
│   │   ├── context/         # AuthContext, DataContext, ToastContext
│   │   ├── layouts/         # PublicLayout, DashboardLayout
│   │   └── pages/           # Trang Công khai, Khách hàng, Nhân viên, Quản trị
│   └── .env.example         # File mẫu biến môi trường Frontend
├── database/                # Script Microsoft SQL Server
│   ├── 01_create_database_and_tables.sql
│   └── 02_seed_data.sql
└── docs/                    # Báo cáo phân tích, thiết kế CSDL & kiểm thử
```

---

## 3. Hướng dẫn cài đặt & chạy dự án (dành cho thành viên nhóm sau khi `git clone`)

### Yêu cầu môi trường
- **Node.js** >= 18
- **Microsoft SQL Server** & **SQL Server Management Studio (SSMS)**

---

### Bước 1: Khởi tạo Database trên SQL Server
1. Mở **SSMS**, kết nối vào SQL Server trên máy.
2. Mở và chạy (**Execute / F5**) lần lượt 2 file trong thư mục `database/`:
   - `database/01_create_database_and_tables.sql` (tạo DB `AUK_CarRental` và 17 bảng)
   - `database/02_seed_data.sql` (nạp dữ liệu mẫu)
3. Đảm bảo SQL Server đã bật **Mixed Mode (SQL Server and Windows Authentication)** và bật giao thức **TCP/IP cổng `1433`**:
   *(Nếu chưa bật TCP/IP, mở **PowerShell với quyền Administrator** và chạy lệnh sau)*:
   ```powershell
   $tcp = (Get-Item "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp").PSPath
   Set-ItemProperty -Path $tcp -Name Enabled -Value 1
   Set-ItemProperty -Path "$tcp\IPAll" -Name TcpDynamicPorts -Value ""
   Set-ItemProperty -Path "$tcp\IPAll" -Name TcpPort -Value "1433"
   Restart-Service MSSQLSERVER -Force
   ```
   *(Lưu ý: Nếu máy bạn dùng SQL Server Express `SQLEXPRESS`, thay `MSSQLSERVER` bằng `SQLEXPRESS` trong đường dẫn/tên service hoặc cấu hình trong **SQL Server Configuration Manager**).*

---

### Bước 2: Cài đặt & chạy Backend
```powershell
cd backend
npm install
```
Tạo file `backend/.env` (copy từ `backend/.env.example`) và điền thông tin tài khoản SQL Server của máy bạn:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=auk-car-rental-dev-secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=*

DB_MODE=mssql
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_INSTANCE=
DB_NAME=AUK_CarRental
DB_USER=sa
DB_PASSWORD=MatKhauSQLCuaBan
DB_ENCRYPT=false
DB_TRUST_CERT=true
```
> **Mẹo**: Nếu chỉ muốn chạy thử nhanh không cần cài SQL Server, đổi `DB_MODE=memory` trong `backend/.env`.

Khởi động Backend:
```powershell
npm run dev
```
Kiểm tra tại `http://localhost:5000/health` → hiển thị `"status": "UP"`, `"dbMode": "mssql"`.

---

### Bước 3: Cài đặt & chạy Frontend
Mở một terminal mới:
```powershell
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:5173`

---

## 4. Tài khoản đăng nhập mẫu

| Vai trò | Tên đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| Khách hàng / Thành viên | `khach01` | `12345678` |
| Khách hàng | `khach02` | `12345678` |
| Nhân viên | `nv01` | `12345678` |
| Quản trị viên | `admin` | `12345678` |

---

## 5. Kiểm thử tự động (Backend)
```powershell
cd backend
npm test
```

---

## 6. Lưu ý khi làm việc nhóm với GitHub
- **Không commit** file `.env` và thư mục `node_modules/` (đã được cấu hình chặn sẵn trong `.gitignore`).
- Trước khi code phần mới, luôn kéo code mới nhất về:
  ```bash
  git pull origin main
  ```
- Sau khi sửa code xong, kiểm tra và đẩy lên GitHub:
  ```bash
  git status
  git add .
  git commit -m "Mô tả ngắn gọn phần bạn vừa làm"
  git push origin main
  ```
