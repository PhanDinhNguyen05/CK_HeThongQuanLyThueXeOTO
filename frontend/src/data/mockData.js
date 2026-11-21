// Dữ liệu mô phỏng đồng bộ theo 17 bảng ERD trong PTUD_TKSCDL.vpp & BaiTapNhom.pdf

export const INITIAL_BRANDS = [
  { MaHang: 'HANG01', TenHang: 'Toyota', QuocGia: 'Nhật Bản' },
  { MaHang: 'HANG02', TenHang: 'Honda', QuocGia: 'Nhật Bản' },
  { MaHang: 'HANG03', TenHang: 'Mazda', QuocGia: 'Nhật Bản' },
  { MaHang: 'HANG04', TenHang: 'Kia', QuocGia: 'Hàn Quốc' },
  { MaHang: 'HANG05', TenHang: 'Hyundai', QuocGia: 'Hàn Quốc' },
  { MaHang: 'HANG06', TenHang: 'Mercedes-Benz', QuocGia: 'Đức' },
];

export const INITIAL_SEGMENTS = [
  { MaPhanKhuc: 'PK01', TenPhanKhuc: 'Sedan', MoTa: 'Xe 4-5 chỗ thanh lịch, tiết kiệm nhiên liệu' },
  { MaPhanKhuc: 'PK02', TenPhanKhuc: 'SUV', MoTa: 'Xe gầm cao 5-7 chỗ đa dụng' },
  { MaPhanKhuc: 'PK03', TenPhanKhuc: 'MPV', MoTa: 'Xe 7 chỗ rộng rãi cho gia đình' },
  { MaPhanKhuc: 'PK04', TenPhanKhuc: 'Luxury', MoTa: 'Xe hạng sang phục vụ doanh nhân & sự kiện' },
];

export const INITIAL_CAR_MODELS = [
  {
    MaMauXe: 'MX01',
    TenMauXe: 'Toyota Vios 2024',
    MaPhanKhuc: 'PK01',
    MaHang: 'HANG01',
    GiaThueNgay: 700000,
    SoChoNgoi: 5,
    HopSo: 'Số tự động (CVT)',
    NhienLieu: 'Xăng',
    DongCo: '1.5L Dual VVT-i',
    MoTa: 'Mẫu xe sedan phổ thông, vận hành êm ái, tiết kiệm nhiên liệu, phù hợp di chuyển gia đình và công tác.',
    NoiDungQuangBa: 'Toyota Vios – Lựa chọn tin cậy trên mọi hành trình.',
    AnhPoster: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&auto=format&fit=crop',
  },
  {
    MaMauXe: 'MX02',
    TenMauXe: 'Honda City RS 2024',
    MaPhanKhuc: 'PK01',
    MaHang: 'HANG02',
    GiaThueNgay: 800000,
    SoChoNgoi: 5,
    HopSo: 'Số tự động (CVT)',
    NhienLieu: 'Xăng',
    DongCo: '1.5L i-VTEC',
    MoTa: 'Thiết kế thể thao, khoang lái rộng rãi và trang bị an toàn Honda Sensing hiện đại.',
    NoiDungQuangBa: 'Honda City RS – Mạnh mẽ và tinh tế từng chi tiết.',
    AnhPoster: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop',
  },
  {
    MaMauXe: 'MX03',
    TenMauXe: 'Mazda 3 Luxury 2024',
    MaPhanKhuc: 'PK01',
    MaHang: 'HANG03',
    GiaThueNgay: 900000,
    SoChoNgoi: 5,
    HopSo: 'Số tự động 6 cấp',
    NhienLieu: 'Xăng',
    DongCo: '1.5L SkyActiv-G',
    MoTa: 'Ngôn ngữ thiết kế KODO sang trọng, nội thất cao cấp, cảm giác lái đầm chắc.',
    NoiDungQuangBa: 'Mazda 3 – Đẳng cấp phong cách Nhật Bản.',
    AnhPoster: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&auto=format&fit=crop',
  },
  {
    MaMauXe: 'MX04',
    TenMauXe: 'Kia Seltos Premium',
    MaPhanKhuc: 'PK02',
    MaHang: 'HANG04',
    GiaThueNgay: 1100000,
    SoChoNgoi: 5,
    HopSo: 'Ly hợp kép 7 cấp',
    NhienLieu: 'Xăng',
    DongCo: '1.4L Turbo',
    MoTa: 'SUV đô thị gầm cao linh hoạt, phù hợp các chuyến đi xa cuối tuần.',
    NoiDungQuangBa: 'Kia Seltos – Tự tin chinh phục mọi cung đường.',
    AnhPoster: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&auto=format&fit=crop',
  },
  {
    MaMauXe: 'MX05',
    TenMauXe: 'Hyundai SantaFe 2024',
    MaPhanKhuc: 'PK02',
    MaHang: 'HANG05',
    GiaThueNgay: 1450000,
    SoChoNgoi: 7,
    HopSo: 'Số tự động 8 cấp',
    NhienLieu: 'Dầu (Diesel)',
    DongCo: '2.2L Smartstream',
    MoTa: 'SUV 7 chỗ rộng rãi, cửa sổ trời toàn cảnh, phù hợp gia đình đông người.',
    NoiDungQuangBa: 'Hyundai SantaFe – Tiện nghi chuẩn hạng sang cho cả gia đình.',
    AnhPoster: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&auto=format&fit=crop',
  },
  {
    MaMauXe: 'MX06',
    TenMauXe: 'Mercedes-Benz C300 AMG',
    MaPhanKhuc: 'PK04',
    MaHang: 'HANG06',
    GiaThueNgay: 2800000,
    SoChoNgoi: 5,
    HopSo: '9G-TRONIC',
    NhienLieu: 'Xăng',
    DongCo: '2.0L Turbo EQ Boost',
    MoTa: 'Sedan hạng sang phục vụ đón tiễn VIP, sự kiện và trải nghiệm lái đẳng cấp.',
    NoiDungQuangBa: 'Mercedes-Benz C300 – Khẳng định vị thế thượng lưu.',
    AnhPoster: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&auto=format&fit=crop',
  },
];

export const INITIAL_CARS = [
  { MaXe: 'XE01', BienSo: '51H-12345', MaMauXe: 'MX01', MauSac: 'Trắng', SoKhung: 'RL4B123456789001', SoMay: '2NR-110001', NamSanXuat: 2024, SoKmHienTai: 18500, TrangThai: 'Sẵn sàng', MaVach: 'BC-XE01' },
  { MaXe: 'XE02', BienSo: '51H-67890', MaMauXe: 'MX01', MauSac: 'Đen', SoKhung: 'RL4B123456789002', SoMay: '2NR-110002', NamSanXuat: 2024, SoKmHienTai: 24200, TrangThai: 'Đang thuê', MaVach: 'BC-XE02' },
  { MaXe: 'XE03', BienSo: '51K-24680', MaMauXe: 'MX02', MauSac: 'Xám', SoKhung: 'MRHGM123456789003', SoMay: 'L15Z-220003', NamSanXuat: 2024, SoKmHienTai: 12100, TrangThai: 'Sẵn sàng', MaVach: 'BC-XE03' },
  { MaXe: 'XE04', BienSo: '51K-13579', MaMauXe: 'MX03', MauSac: 'Đỏ', SoKhung: 'JM7BP123456789004', SoMay: 'PE-330004', NamSanXuat: 2023, SoKmHienTai: 31000, TrangThai: 'Sẵn sàng', MaVach: 'BC-XE04' },
  { MaXe: 'XE05', BienSo: '51L-55588', MaMauXe: 'MX04', MauSac: 'Vàng cát', SoKhung: 'KNAE123456789005', SoMay: 'G4LD-440005', NamSanXuat: 2023, SoKmHienTai: 28900, TrangThai: 'Bảo trì', MaVach: 'BC-XE05' },
  { MaXe: 'XE06', BienSo: '51L-88899', MaMauXe: 'MX05', MauSac: 'Trắng', SoKhung: 'KMHS123456789006', SoMay: 'D4HE-550006', NamSanXuat: 2024, SoKmHienTai: 14300, TrangThai: 'Sẵn sàng', MaVach: 'BC-XE06' },
  { MaXe: 'XE07', BienSo: '51A-99999', MaMauXe: 'MX06', MauSac: 'Đen', SoKhung: 'W1K20612345678907', SoMay: 'M254-660007', NamSanXuat: 2024, SoKmHienTai: 9200, TrangThai: 'Sẵn sàng', MaVach: 'BC-XE07' },
];

export const INITIAL_CUSTOMERS = [
  {
    MaKH: 'KH01',
    HoVaTen: 'Nguyễn Văn An',
    GioiTinh: 'Nam',
    DienThoai: '0912345678',
    SoDinhDanh: '079123456789',
    GiayPhepLaiXe: 'B2-790123456',
    HanGPLX: '2029-12-31',
    email: 'an.nguyen@gmail.com',
    DiaChi: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    BiCamThue: false,
  },
  {
    MaKH: 'KH02',
    HoVaTen: 'Trần Thị Bình',
    GioiTinh: 'Nữ',
    DienThoai: '0987654321',
    SoDinhDanh: '079987654321',
    GiayPhepLaiXe: 'B2-790987654',
    HanGPLX: '2028-08-15',
    email: 'binh.tran@gmail.com',
    DiaChi: '45 Lê Lợi, Quận 1, TP.HCM',
    BiCamThue: false,
  },
];

export const INITIAL_MEMBERS = [
  {
    MaTV: 'TV001',
    MaKH: 'KH01',
    TinhTrang: 'Hoạt động',
    NgayBatDau: '2025-12-01',
    NgayHetHan: '2026-12-01',
    DiemTichLuy: 320,
  },
];

export const INITIAL_EMPLOYEES = [
  { MaNV: 'NV001', HoTen: 'Nguyễn Minh Hoàng', DienThoai: '0901234567', MoTa: 'Trợ lý tại cửa hàng - Xử lý đặt xe & giao nhận', TrangThai: 'Đang làm việc' },
  { MaNV: 'NV002', HoTen: 'Lê Thị Thu Hà', DienThoai: '0902345678', MoTa: 'Nhân viên kiểm tra xe & bảo dưỡng', TrangThai: 'Đang làm việc' },
  { MaNV: 'NV003', HoTen: 'Phạm Quốc Bảo', DienThoai: '0903456789', MoTa: 'Quản trị viên hệ thống AUK', TrangThai: 'Đang làm việc' },
];

export const INITIAL_ACCOUNTS = [
  { TenDN: 'khach01', MatKhau: '12345678', TrangThaiTaiKhoan: 'Hoạt động', SoLanDangNhapSai: 0, VaiTro: 'Khách hàng', MaKH: 'KH01', MaNV: null },
  { TenDN: 'khach02', MatKhau: '12345678', TrangThaiTaiKhoan: 'Hoạt động', SoLanDangNhapSai: 0, VaiTro: 'Khách hàng', MaKH: 'KH02', MaNV: null },
  { TenDN: 'nv01', MatKhau: '12345678', TrangThaiTaiKhoan: 'Hoạt động', SoLanDangNhapSai: 0, VaiTro: 'Nhân viên', MaKH: null, MaNV: 'NV001' },
  { TenDN: 'admin', MatKhau: '12345678', TrangThaiTaiKhoan: 'Hoạt động', SoLanDangNhapSai: 0, VaiTro: 'Quản trị viên', MaKH: null, MaNV: 'NV003' },
];

export const INITIAL_BOOKINGS = [
  {
    MaDD: 'DD001',
    MaKH: 'KH01',
    MaMauXe: 'MX01',
    MaNV: null,
    NgayDat: '2026-11-18',
    NgayNhan: '2026-11-25',
    NgayTra: '2026-11-27',
    TongGia: 1400000,
    TrangThai: 'Chờ xác nhận',
    LyDo: '',
  },
  {
    MaDD: 'DD002',
    MaKH: 'KH01',
    MaMauXe: 'MX02',
    MaNV: 'NV001',
    NgayDat: '2026-11-10',
    NgayNhan: '2026-11-22',
    NgayTra: '2026-11-24',
    TongGia: 1600000,
    TrangThai: 'Đã xác nhận',
    LyDo: '',
  },
  {
    MaDD: 'DD003',
    MaKH: 'KH02',
    MaMauXe: 'MX03',
    MaNV: 'NV001',
    NgayDat: '2026-11-05',
    NgayNhan: '2026-11-12',
    NgayTra: '2026-11-14',
    TongGia: 1800000,
    TrangThai: 'Đã thực hiện',
    LyDo: '',
  },
];

export const INITIAL_CONTRACTS = [
  {
    MaHD: 'HD001',
    SoHD: 'AUK-2026-001',
    MaDD: null,
    MaXe: 'XE02',
    MaNV: 'NV001',
    MaKH: 'KH01',
    NgayLap: '2026-11-19',
    NgayBatDau: '2026-11-19',
    NgayTra: '2026-11-22',
    NgayTraThucTe: null,
    TongTien: 2100000,
    TienDatCoc: 3000000,
    TienDaThu: 2100000,
    TienConNo: 0,
    NoiDung: 'Thuê xe Toyota Vios 51H-67890 (3 ngày)',
    TrangThaiHopDong: 'Đang thuê',
    MucNhienLieuGiao: 'Đầy bình (100%)',
  },
  {
    MaHD: 'HD002',
    SoHD: 'AUK-2026-002',
    MaDD: 'DD003',
    MaXe: 'XE04',
    MaNV: 'NV001',
    MaKH: 'KH02',
    NgayLap: '2026-11-12',
    NgayBatDau: '2026-11-12',
    NgayTra: '2026-11-14',
    NgayTraThucTe: '2026-11-14',
    TongTien: 1800000,
    TienDatCoc: 3000000,
    TienDaThu: 1800000,
    TienConNo: 0,
    NoiDung: 'Thuê xe Mazda 3 51K-13579 (2 ngày)',
    TrangThaiHopDong: 'Hoàn tất',
    MucNhienLieuGiao: 'Đầy bình (100%)',
  },
];

export const INITIAL_PENALTIES = [
  {
    MaKhoanPhat: 'PH001',
    MaHD: 'HD001',
    MaKH: 'KH01',
    LoaiViPham: 'Phí dịch vụ phát sinh',
    MoTa: 'Vệ sinh nội thất đặc biệt',
    SoTienPhat: 200000,
    NgayPhat: '2026-11-20',
    TrangThaiThanhToan: 'Chưa thanh toán',
  },
];

export const INITIAL_PAYMENTS = [
  {
    MaGiaoDich: 'GD001',
    MaThamChieu: 'HD002',
    LoaiKhoan: 'Tiền thuê xe',
    MaKH: 'KH02',
    SoTien: 1800000,
    PhuongThuc: 'Thẻ tín dụng',
    NgayThanhToan: '2026-11-12',
    TrangThai: 'Thành công',
  },
];

export const INITIAL_EXTENSION_REQUESTS = [
  {
    MaYC: 'YC001',
    LoaiYeuCau: 'Gia hạn thành viên',
    MaDoiTuong: 'TV001',
    MaKH: 'KH01',
    GoiHoacNgayDeNghi: 'Gia hạn 1 Năm (900.000đ)',
    LyDo: 'Tiếp tục sử dụng ưu đãi tích điểm',
    NgayGui: '2026-11-20',
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  },
  {
    MaYC: 'YC002',
    LoaiYeuCau: 'Gia hạn đặt chỗ',
    MaDoiTuong: 'DD002',
    MaKH: 'KH01',
    GoiHoacNgayDeNghi: '2026-11-26',
    LyDo: 'Kéo dài chuyến công tác thêm 2 ngày',
    NgayGui: '2026-11-20',
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  },
];

export const INITIAL_MAINTENANCE = [
  {
    MaBaoDuong: 'BD001',
    MaXe: 'XE05',
    MaNV: 'NV002',
    NgayBaoDuong: '2026-11-15',
    NoiDungBaoDuong: 'Thay dầu định kỳ và kiểm tra hệ thống phanh',
    PhiBaoDuong: 1250000,
    SoChungTu: 'CT-BD-001',
  },
];

export const INITIAL_INCIDENTS = [
  {
    MaSuCo: 'SC001',
    MaHD: 'HD001',
    MaXe: 'XE02',
    LoaiSuCo: 'Va quẹt nhẹ',
    MoTa: 'Trầy xước nhẹ cản sau bên phải',
    ViTri: 'Quận 3, TP.HCM',
    ChiPhiPhatSinh: 500000,
    ChuyenPhapChe: false,
    NgayGhiNhan: '2026-11-20',
    TrangThai: 'Đã ghi nhận',
  },
];
