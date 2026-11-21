-- =====================================================================
-- HỆ THỐNG QUẢN LÝ THUÊ XE Ô TÔ (AUK CAR RENTAL)
-- GIAI ĐOẠN 3: SCRIPT TẠO DATABASE & BẢNG (MICROSOFT SQL SERVER / T-SQL)
-- Đối chiếu: PTUD_TKSCDL.vpp (17 bảng ERD) & BaiTapNhom.pdf
-- =====================================================================

IF DB_ID(N'AUK_CarRental') IS NULL
BEGIN
    CREATE DATABASE AUK_CarRental;
END
GO

USE AUK_CarRental;
GO

-- =====================================================================
-- 1. NHÓM KHÁCH HÀNG, THÀNH VIÊN, NHÂN VIÊN & TÀI KHOẢN
-- =====================================================================

CREATE TABLE KHACH_HANG (
    MaKH           VARCHAR(10)   NOT NULL PRIMARY KEY,
    HoVaTen        NVARCHAR(100) NOT NULL,
    GioiTinh       NVARCHAR(10)  NOT NULL,
    DienThoai      VARCHAR(15)   NOT NULL,
    SoDinhDanh     VARCHAR(20)   NOT NULL UNIQUE,
    GiayPhepLaiXe  VARCHAR(20)   NOT NULL UNIQUE,
    HanGPLX        DATE          NULL,
    email          VARCHAR(100)  NULL,
    DiaChi         NVARCHAR(255) NULL,
    BiCamThue      BIT           NOT NULL DEFAULT 0
);
GO

CREATE TABLE THANH_VIEN (
    MaTV        VARCHAR(10)  NOT NULL PRIMARY KEY,
    MaKH        VARCHAR(10)  NOT NULL UNIQUE,
    TinhTrang   NVARCHAR(30) NOT NULL DEFAULT N'Hoạt động',
    NgayBatDau  DATE         NOT NULL,
    NgayHetHan  DATE         NOT NULL,
    DiemTichLuy INT          NOT NULL DEFAULT 0,
    CONSTRAINT FK_THANH_VIEN_KHACH_HANG FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT CHK_THANH_VIEN_DIEM CHECK (DiemTichLuy >= 0)
);
GO

CREATE TABLE KHACH_VANG_LAI (
    MaKH VARCHAR(10) NOT NULL PRIMARY KEY,
    CONSTRAINT FK_KHACH_VANG_LAI_KHACH_HANG FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH)
);
GO

CREATE TABLE NHAN_VIEN (
    MaNV      VARCHAR(10)   NOT NULL PRIMARY KEY,
    HoTen     NVARCHAR(100) NOT NULL,
    DienThoai VARCHAR(15)   NOT NULL,
    MoTa      NVARCHAR(255) NULL,
    TrangThai NVARCHAR(30)  NOT NULL DEFAULT N'Đang làm việc'
);
GO

CREATE TABLE TAI_KHOAN (
    TenDN             VARCHAR(50)  NOT NULL PRIMARY KEY,
    MatKhau           VARCHAR(255) NOT NULL,
    TrangThaiTaiKhoan NVARCHAR(30) NOT NULL DEFAULT N'Hoạt động',
    SoLanDangNhapSai  INT          NOT NULL DEFAULT 0,
    VaiTro            NVARCHAR(30) NOT NULL,
    MaKH              VARCHAR(10)  NULL,
    MaNV              VARCHAR(10)  NULL,
    CONSTRAINT FK_TAI_KHOAN_KHACH_HANG FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT FK_TAI_KHOAN_NHAN_VIEN  FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT CHK_TAI_KHOAN_SAI CHECK (SoLanDangNhapSai >= 0),
    CONSTRAINT CHK_TAI_KHOAN_OWNER CHECK (
        (MaKH IS NOT NULL AND MaNV IS NULL) OR (MaKH IS NULL AND MaNV IS NOT NULL)
    )
);
GO

-- =====================================================================
-- 2. NHÓM DANH MỤC MẪU XE, THÔNG SỐ & XE
-- =====================================================================

CREATE TABLE PHAN_KHUC_XE (
    MaPhanKhuc  VARCHAR(10)   NOT NULL PRIMARY KEY,
    TenPhanKhuc NVARCHAR(50)  NOT NULL,
    MoTa        NVARCHAR(255) NULL
);
GO

CREATE TABLE HANG_XE (
    MaHang  VARCHAR(10)  NOT NULL PRIMARY KEY,
    TenHang NVARCHAR(80) NOT NULL,
    QuocGia NVARCHAR(50) NULL
);
GO

CREATE TABLE MAU_XE (
    MaMauXe       VARCHAR(10)    NOT NULL PRIMARY KEY,
    TenMauXe      NVARCHAR(120)  NOT NULL,
    MaPhanKhuc    VARCHAR(10)    NOT NULL,
    MaHang        VARCHAR(10)    NOT NULL,
    GiaThueNgay   DECIMAL(15, 2) NOT NULL,
    MoTa          NVARCHAR(500)  NULL,
    NoiDungQuangBa NVARCHAR(300) NULL,
    AnhPoster     VARCHAR(500)   NULL,
    CONSTRAINT FK_MAU_XE_PHAN_KHUC FOREIGN KEY (MaPhanKhuc) REFERENCES PHAN_KHUC_XE(MaPhanKhuc),
    CONSTRAINT FK_MAU_XE_HANG_XE   FOREIGN KEY (MaHang)     REFERENCES HANG_XE(MaHang),
    CONSTRAINT CHK_MAU_XE_GIA CHECK (GiaThueNgay > 0)
);
GO

CREATE TABLE THONG_SO_MAU_XE (
    MaMauXe   VARCHAR(10)  NOT NULL PRIMARY KEY,
    SoChoNgoi INT          NOT NULL DEFAULT 5,
    HopSo     NVARCHAR(50) NOT NULL,
    NhienLieu NVARCHAR(50) NOT NULL,
    DongCo    NVARCHAR(80) NOT NULL,
    CONSTRAINT FK_THONG_SO_MAU_XE FOREIGN KEY (MaMauXe) REFERENCES MAU_XE(MaMauXe) ON DELETE CASCADE
);
GO

CREATE TABLE XE (
    MaXe        VARCHAR(10)  NOT NULL PRIMARY KEY,
    BienSo      VARCHAR(20)  NOT NULL UNIQUE,
    MaMauXe     VARCHAR(10)  NOT NULL,
    MauSac      NVARCHAR(30) NOT NULL,
    SoKhung     VARCHAR(50)  NOT NULL UNIQUE,
    SoMay       VARCHAR(50)  NOT NULL UNIQUE,
    NamSanXuat  INT          NOT NULL,
    SoKmHienTai INT          NOT NULL DEFAULT 0,
    TrangThai   NVARCHAR(30) NOT NULL DEFAULT N'Sẵn sàng',
    MaVach      VARCHAR(30)  NOT NULL UNIQUE,
    CONSTRAINT FK_XE_MAU_XE FOREIGN KEY (MaMauXe) REFERENCES MAU_XE(MaMauXe),
    CONSTRAINT CHK_XE_KM CHECK (SoKmHienTai >= 0)
);
GO

-- =====================================================================
-- 3. NHÓM ĐẶT XE, HỢP ĐỒNG THUÊ, PHẠT, THANH TOÁN & GIA HẠN
-- =====================================================================

CREATE TABLE DON_DAT_XE (
    MaDD      VARCHAR(10)    NOT NULL PRIMARY KEY,
    NgayDat   DATE           NOT NULL,
    NgayNhan  DATE           NOT NULL,
    NgayTra   DATE           NOT NULL,
    TongGia   DECIMAL(15, 2) NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(30)   NOT NULL DEFAULT N'Chờ xác nhận',
    LyDo      NVARCHAR(255)  NULL,
    MaKH      VARCHAR(10)    NOT NULL,
    MaMauXe   VARCHAR(10)    NOT NULL,
    MaNV      VARCHAR(10)    NULL,
    CONSTRAINT FK_DON_DAT_XE_KHACH_HANG FOREIGN KEY (MaKH)    REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT FK_DON_DAT_XE_MAU_XE     FOREIGN KEY (MaMauXe) REFERENCES MAU_XE(MaMauXe),
    CONSTRAINT FK_DON_DAT_XE_NHAN_VIEN  FOREIGN KEY (MaNV)    REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT CHK_DON_DAT_XE_NGAY CHECK (NgayTra > NgayNhan)
);
GO

CREATE TABLE CHI_TIET_DAT_XE (
    MaDD   VARCHAR(10)   NOT NULL,
    MaXe   VARCHAR(10)   NOT NULL,
    GhiChu NVARCHAR(255) NULL,
    PRIMARY KEY (MaDD, MaXe),
    CONSTRAINT FK_CT_DAT_XE_DON FOREIGN KEY (MaDD) REFERENCES DON_DAT_XE(MaDD),
    CONSTRAINT FK_CT_DAT_XE_XE  FOREIGN KEY (MaXe) REFERENCES XE(MaXe)
);
GO

CREATE TABLE HOP_DONG_THUE (
    MaHD             VARCHAR(10)    NOT NULL PRIMARY KEY,
    SoHD             VARCHAR(20)    NOT NULL UNIQUE,
    NgayLap          DATE           NOT NULL,
    NgayBatDau       DATE           NOT NULL,
    NgayTra          DATE           NOT NULL,
    NgayTraThucTe    DATE           NULL,
    TongTien         DECIMAL(15, 2) NOT NULL DEFAULT 0,
    TienDatCoc       DECIMAL(15, 2) NOT NULL DEFAULT 0,
    TienDaThu        DECIMAL(15, 2) NOT NULL DEFAULT 0,
    TienConNo        DECIMAL(15, 2) NOT NULL DEFAULT 0,
    NoiDung          NVARCHAR(500)  NULL,
    TrangThaiHopDong NVARCHAR(30)   NOT NULL DEFAULT N'Đang thuê',
    MucNhienLieuGiao NVARCHAR(50)   NULL,
    MaDD             VARCHAR(10)    NULL,
    MaXe             VARCHAR(10)    NOT NULL,
    MaNV             VARCHAR(10)    NOT NULL,
    MaKH             VARCHAR(10)    NOT NULL,
    CONSTRAINT FK_HD_DON_DAT_XE FOREIGN KEY (MaDD) REFERENCES DON_DAT_XE(MaDD),
    CONSTRAINT FK_HD_XE         FOREIGN KEY (MaXe) REFERENCES XE(MaXe),
    CONSTRAINT FK_HD_NHAN_VIEN  FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT FK_HD_KHACH_HANG FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH)
);
GO

CREATE TABLE KHOAN_PHAT (
    MaKhoanPhat        VARCHAR(10)    NOT NULL PRIMARY KEY,
    MaHD               VARCHAR(10)    NOT NULL,
    MaKH               VARCHAR(10)    NOT NULL,
    LoaiViPham         NVARCHAR(100)  NOT NULL,
    MoTa               NVARCHAR(255)  NOT NULL,
    SoTienPhat         DECIMAL(15, 2) NOT NULL,
    NgayPhat           DATE           NOT NULL,
    TrangThaiThanhToan NVARCHAR(30)   NOT NULL DEFAULT N'Chưa thanh toán',
    CONSTRAINT FK_KHOAN_PHAT_HD FOREIGN KEY (MaHD) REFERENCES HOP_DONG_THUE(MaHD),
    CONSTRAINT FK_KHOAN_PHAT_KH FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT CHK_KHOAN_PHAT_TIEN CHECK (SoTienPhat > 0)
);
GO

CREATE TABLE GIAO_DICH_THANH_TOAN (
    MaGiaoDich    VARCHAR(10)    NOT NULL PRIMARY KEY,
    MaHD          VARCHAR(10)    NULL,
    MaKhoanPhat   VARCHAR(10)    NULL,
    MaKH          VARCHAR(10)    NOT NULL,
    LoaiKhoan     NVARCHAR(100)  NOT NULL,
    SoTien        DECIMAL(15, 2) NOT NULL,
    PhuongThuc    NVARCHAR(50)   NOT NULL,
    NgayThanhToan DATE           NOT NULL,
    TrangThai     NVARCHAR(30)   NOT NULL DEFAULT N'Thành công',
    CONSTRAINT FK_GDTT_HD FOREIGN KEY (MaHD) REFERENCES HOP_DONG_THUE(MaHD),
    CONSTRAINT FK_GDTT_PH FOREIGN KEY (MaKhoanPhat) REFERENCES KHOAN_PHAT(MaKhoanPhat),
    CONSTRAINT FK_GDTT_KH FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT CHK_GDTT_TIEN CHECK (SoTien > 0)
);
GO

CREATE TABLE YEU_CAU_GIA_HAN (
    MaYC              VARCHAR(10)   NOT NULL PRIMARY KEY,
    LoaiYeuCau        NVARCHAR(50)  NOT NULL,
    MaDoiTuong        VARCHAR(10)   NOT NULL,
    MaKH              VARCHAR(10)   NOT NULL,
    GoiHoacNgayDeNghi NVARCHAR(100) NOT NULL,
    LyDo              NVARCHAR(255) NULL,
    NgayGui           DATE          NOT NULL,
    TrangThai         NVARCHAR(30)  NOT NULL DEFAULT N'Chờ xét duyệt',
    LyDoTuChoi        NVARCHAR(255) NULL,
    CONSTRAINT FK_YCGH_KHACH_HANG FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH)
);
GO

-- =====================================================================
-- 4. NHÓM BẢO DƯỠNG & SỰ CỐ XE
-- =====================================================================

CREATE TABLE BAO_DUONG (
    MaBaoDuong      VARCHAR(10)    NOT NULL PRIMARY KEY,
    MaXe            VARCHAR(10)    NOT NULL,
    MaNV            VARCHAR(10)    NOT NULL,
    NgayBaoDuong    DATE           NOT NULL,
    NoiDungBaoDuong NVARCHAR(255)  NOT NULL,
    PhiBaoDuong     DECIMAL(15, 2) NOT NULL DEFAULT 0,
    SoChungTu       VARCHAR(50)    NULL,
    CONSTRAINT FK_BAO_DUONG_XE FOREIGN KEY (MaXe) REFERENCES XE(MaXe),
    CONSTRAINT FK_BAO_DUONG_NV FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT CHK_BAO_DUONG_PHI CHECK (PhiBaoDuong >= 0)
);
GO

CREATE TABLE SU_CO (
    MaSuCo         VARCHAR(10)    NOT NULL PRIMARY KEY,
    MaHD           VARCHAR(10)    NOT NULL,
    MaXe           VARCHAR(10)    NOT NULL,
    LoaiSuCo       NVARCHAR(100)  NOT NULL,
    MoTa           NVARCHAR(500)  NOT NULL,
    ViTri          NVARCHAR(200)  NOT NULL,
    ChiPhiPhatSinh DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ChuyenPhapChe  BIT            NOT NULL DEFAULT 0,
    NgayGhiNhan    DATE           NOT NULL,
    TrangThai      NVARCHAR(50)   NOT NULL DEFAULT N'Đã ghi nhận',
    CONSTRAINT FK_SU_CO_HD FOREIGN KEY (MaHD) REFERENCES HOP_DONG_THUE(MaHD),
    CONSTRAINT FK_SU_CO_XE FOREIGN KEY (MaXe) REFERENCES XE(MaXe)
);
GO
