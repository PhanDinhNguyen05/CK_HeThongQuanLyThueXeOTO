-- =====================================================================
-- HỆ THỐNG QUẢN LÝ THUÊ XE Ô TÔ (AUK CAR RENTAL)
-- DỮ LIỆU MẪU KIỂM THỬ (MICROSOFT SQL SERVER)
-- Mật khẩu mặc định của các tài khoản mẫu: 12345678 (đã hash bcrypt)
-- =====================================================================

USE AUK_CarRental;
GO

INSERT INTO PHAN_KHUC_XE (MaPhanKhuc, TenPhanKhuc, MoTa) VALUES
('PK01', N'Sedan',  N'Xe 4-5 chỗ thanh lịch, tiết kiệm nhiên liệu'),
('PK02', N'SUV',    N'Xe gầm cao 5-7 chỗ đa dụng'),
('PK03', N'MPV',    N'Xe 7 chỗ rộng rãi cho gia đình'),
('PK04', N'Luxury', N'Xe hạng sang phục vụ doanh nhân & sự kiện');
GO

INSERT INTO HANG_XE (MaHang, TenHang, QuocGia) VALUES
('HANG01', N'Toyota',        N'Nhật Bản'),
('HANG02', N'Honda',         N'Nhật Bản'),
('HANG03', N'Mazda',         N'Nhật Bản'),
('HANG04', N'Kia',           N'Hàn Quốc'),
('HANG05', N'Hyundai',       N'Hàn Quốc'),
('HANG06', N'Mercedes-Benz', N'Đức');
GO

INSERT INTO MAU_XE (MaMauXe, TenMauXe, MaPhanKhuc, MaHang, GiaThueNgay, MoTa, NoiDungQuangBa, AnhPoster) VALUES
('MX01', N'Toyota Vios 2024',       'PK01', 'HANG01', 700000,  N'Mẫu xe sedan phổ thông, vận hành êm ái, tiết kiệm nhiên liệu.', N'Toyota Vios – Lựa chọn tin cậy trên mọi hành trình.', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&auto=format&fit=crop'),
('MX02', N'Honda City RS 2024',     'PK01', 'HANG02', 800000,  N'Thiết kế thể thao, khoang lái rộng rãi và Honda Sensing.', N'Honda City RS – Mạnh mẽ và tinh tế từng chi tiết.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop'),
('MX03', N'Mazda 3 Luxury 2024',    'PK01', 'HANG03', 900000,  N'Ngôn ngữ thiết kế KODO sang trọng, nội thất cao cấp.', N'Mazda 3 – Đẳng cấp phong cách Nhật Bản.', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&auto=format&fit=crop'),
('MX04', N'Kia Seltos Premium',     'PK02', 'HANG04', 1100000, N'SUV đô thị gầm cao linh hoạt, phù hợp các chuyến đi xa.', N'Kia Seltos – Tự tin chinh phục mọi cung đường.', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&auto=format&fit=crop'),
('MX05', N'Hyundai SantaFe 2024',   'PK02', 'HANG05', 1450000, N'SUV 7 chỗ rộng rãi, cửa sổ trời toàn cảnh.', N'Hyundai SantaFe – Tiện nghi chuẩn hạng sang cho cả gia đình.', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&auto=format&fit=crop'),
('MX06', N'Mercedes-Benz C300 AMG', 'PK04', 'HANG06', 2800000, N'Sedan hạng sang phục vụ đón tiễn VIP và sự kiện.', N'Mercedes-Benz C300 – Khẳng định vị thế thượng lưu.', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&auto=format&fit=crop');
GO

INSERT INTO THONG_SO_MAU_XE (MaMauXe, SoChoNgoi, HopSo, NhienLieu, DongCo) VALUES
('MX01', 5, N'Số tự động (CVT)',  N'Xăng',         N'1.5L Dual VVT-i'),
('MX02', 5, N'Số tự động (CVT)',  N'Xăng',         N'1.5L i-VTEC'),
('MX03', 5, N'Số tự động 6 cấp',  N'Xăng',         N'1.5L SkyActiv-G'),
('MX04', 5, N'Ly hợp kép 7 cấp',  N'Xăng',         N'1.4L Turbo'),
('MX05', 7, N'Số tự động 8 cấp',  N'Dầu (Diesel)', N'2.2L Smartstream'),
('MX06', 5, N'9G-TRONIC',         N'Xăng',         N'2.0L Turbo EQ Boost');
GO

INSERT INTO XE (MaXe, BienSo, MaMauXe, MauSac, SoKhung, SoMay, NamSanXuat, SoKmHienTai, TrangThai, MaVach) VALUES
('XE01', '51H-12345', 'MX01', N'Trắng',    'RL4B123456789001',  '2NR-110001',  2024, 18500, N'Sẵn sàng',  'BC-XE01'),
('XE02', '51H-67890', 'MX01', N'Đen',      'RL4B123456789002',  '2NR-110002',  2024, 24200, N'Đang thuê', 'BC-XE02'),
('XE03', '51K-24680', 'MX02', N'Xám',      'MRHGM123456789003', 'L15Z-220003', 2024, 12100, N'Sẵn sàng',  'BC-XE03'),
('XE04', '51K-13579', 'MX03', N'Đỏ',       'JM7BP123456789004', 'PE-330004',   2023, 31000, N'Sẵn sàng',  'BC-XE04'),
('XE05', '51L-55588', 'MX04', N'Vàng cát', 'KNAE123456789005',  'G4LD-440005', 2023, 28900, N'Bảo trì',   'BC-XE05'),
('XE06', '51L-88899', 'MX05', N'Trắng',    'KMHS123456789006',  'D4HE-550006', 2024, 14300, N'Sẵn sàng',  'BC-XE06'),
('XE07', '51A-99999', 'MX06', N'Đen',      'W1K20612345678907', 'M254-660007', 2024, 9200,  N'Sẵn sàng',  'BC-XE07');
GO

INSERT INTO KHACH_HANG (MaKH, HoVaTen, GioiTinh, DienThoai, SoDinhDanh, GiayPhepLaiXe, HanGPLX, email, DiaChi, BiCamThue) VALUES
('KH01', N'Nguyễn Văn An',  N'Nam', '0912345678', '079123456789', 'B2-790123456', '2029-12-31', 'an.nguyen@gmail.com',  N'123 Nguyễn Văn Cừ, Quận 5, TP.HCM', 0),
('KH02', N'Trần Thị Bình',  N'Nữ',  '0987654321', '079987654321', 'B2-790987654', '2028-08-15', 'binh.tran@gmail.com',  N'45 Lê Lợi, Quận 1, TP.HCM',         0);
GO

INSERT INTO THANH_VIEN (MaTV, MaKH, TinhTrang, NgayBatDau, NgayHetHan, DiemTichLuy) VALUES
('TV001', 'KH01', N'Hoạt động', '2025-12-01', '2026-12-01', 320);
GO

INSERT INTO NHAN_VIEN (MaNV, HoTen, DienThoai, MoTa, TrangThai) VALUES
('NV001', N'Nguyễn Minh Hoàng', '0901234567', N'Trợ lý tại cửa hàng - Xử lý đặt xe & giao nhận', N'Đang làm việc'),
('NV002', N'Lê Thị Thu Hà',     '0902345678', N'Nhân viên kiểm tra xe & bảo dưỡng',             N'Đang làm việc'),
('NV003', N'Phạm Quốc Bảo',     '0903456789', N'Quản trị viên hệ thống AUK',                    N'Đang làm việc');
GO

INSERT INTO TAI_KHOAN (TenDN, MatKhau, TrangThaiTaiKhoan, SoLanDangNhapSai, VaiTro, MaKH, MaNV) VALUES
('khach01', '$2a$08$efWg2LG3oSv5QvDpkuryae1aRk98gLEv2a3dV17zW3DOp61i1Tuwi', N'Hoạt động', 0, N'Khách hàng',    'KH01', NULL),
('khach02', '$2a$08$efWg2LG3oSv5QvDpkuryae1aRk98gLEv2a3dV17zW3DOp61i1Tuwi', N'Hoạt động', 0, N'Khách hàng',    'KH02', NULL),
('nv01',    '$2a$08$efWg2LG3oSv5QvDpkuryae1aRk98gLEv2a3dV17zW3DOp61i1Tuwi', N'Hoạt động', 0, N'Nhân viên',     NULL,   'NV001'),
('admin',   '$2a$08$efWg2LG3oSv5QvDpkuryae1aRk98gLEv2a3dV17zW3DOp61i1Tuwi', N'Hoạt động', 0, N'Quản trị viên', NULL,   'NV003');
GO

INSERT INTO DON_DAT_XE (MaDD, NgayDat, NgayNhan, NgayTra, TongGia, TrangThai, LyDo, MaKH, MaMauXe, MaNV) VALUES
('DD001', '2026-11-18', '2026-11-25', '2026-11-27', 1400000, N'Chờ xác nhận', NULL, 'KH01', 'MX01', NULL),
('DD002', '2026-11-10', '2026-11-22', '2026-11-24', 1600000, N'Đã xác nhận',  NULL, 'KH01', 'MX02', 'NV001'),
('DD003', '2026-11-05', '2026-11-12', '2026-11-14', 1800000, N'Đã thực hiện', NULL, 'KH02', 'MX03', 'NV001');
GO

INSERT INTO HOP_DONG_THUE (MaHD, SoHD, NgayLap, NgayBatDau, NgayTra, NgayTraThucTe, TongTien, TienDatCoc, TienDaThu, TienConNo, NoiDung, TrangThaiHopDong, MucNhienLieuGiao, MaDD, MaXe, MaNV, MaKH) VALUES
('HD001', 'AUK-2026-001', '2026-11-19', '2026-11-19', '2026-11-22', NULL,         2100000, 3000000, 2100000, 0, N'Thuê xe Toyota Vios 51H-67890 (3 ngày)', N'Đang thuê', N'Đầy bình (100%)', NULL,    'XE02', 'NV001', 'KH01'),
('HD002', 'AUK-2026-002', '2026-11-12', '2026-11-12', '2026-11-14', '2026-11-14', 1800000, 3000000, 1800000, 0, N'Thuê xe Mazda 3 51K-13579 (2 ngày)',     N'Hoàn tất',  N'Đầy bình (100%)', 'DD003', 'XE04', 'NV001', 'KH02');
GO

INSERT INTO KHOAN_PHAT (MaKhoanPhat, MaHD, MaKH, LoaiViPham, MoTa, SoTienPhat, NgayPhat, TrangThaiThanhToan) VALUES
('PH001', 'HD001', 'KH01', N'Phí dịch vụ phát sinh', N'Vệ sinh nội thất đặc biệt', 200000, '2026-11-20', N'Chưa thanh toán');
GO

INSERT INTO GIAO_DICH_THANH_TOAN (MaGiaoDich, MaHD, MaKhoanPhat, MaKH, LoaiKhoan, SoTien, PhuongThuc, NgayThanhToan, TrangThai) VALUES
('GD001', 'HD002', NULL, 'KH02', N'Tiền thuê xe', 1800000, N'Thẻ tín dụng', '2026-11-12', N'Thành công');
GO

INSERT INTO YEU_CAU_GIA_HAN (MaYC, LoaiYeuCau, MaDoiTuong, MaKH, GoiHoacNgayDeNghi, LyDo, NgayGui, TrangThai, LyDoTuChoi) VALUES
('YC001', N'Gia hạn thành viên', 'TV001', 'KH01', N'Gia hạn 1 Năm (900.000đ)', N'Tiếp tục sử dụng ưu đãi tích điểm', '2026-11-20', N'Chờ xét duyệt', NULL),
('YC002', N'Gia hạn đặt chỗ',    'DD002', 'KH01', '2026-11-26',                 N'Kéo dài chuyến công tác thêm 2 ngày', '2026-11-20', N'Chờ xét duyệt', NULL);
GO

INSERT INTO BAO_DUONG (MaBaoDuong, MaXe, MaNV, NgayBaoDuong, NoiDungBaoDuong, PhiBaoDuong, SoChungTu) VALUES
('BD001', 'XE05', 'NV002', '2026-11-15', N'Thay dầu định kỳ và kiểm tra hệ thống phanh', 1250000, 'CT-BD-001');
GO

INSERT INTO SU_CO (MaSuCo, MaHD, MaXe, LoaiSuCo, MoTa, ViTri, ChiPhiPhatSinh, ChuyenPhapChe, NgayGhiNhan, TrangThai) VALUES
('SC001', 'HD001', 'XE02', N'Va quẹt nhẹ', N'Trầy xước nhẹ cản sau bên phải', N'Quận 3, TP.HCM', 500000, 0, '2026-11-20', N'Đã ghi nhận');
GO
