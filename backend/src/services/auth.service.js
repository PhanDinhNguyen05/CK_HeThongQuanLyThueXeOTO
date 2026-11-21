const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, MAX_LOGIN_ATTEMPTS, ROLES } = require('../config/env');
const { getStore, nextCode } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');
const {
  isValidEmail,
  isValidPhone,
  isValidCCCD,
  isValidLicense,
  isValidPassword,
} = require('../middleware/validate.middleware');

function register(payload) {
  const store = getStore();
  const {
    HoVaTen,
    GioiTinh,
    DienThoai,
    SoDinhDanh,
    GiayPhepLaiXe,
    email,
    DiaChi = '',
    TenDN,
    MatKhau,
  } = payload;

  if (!isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại phải gồm đúng 10 chữ số và không chứa ký tự chữ.', 400);
  }
  if (!isValidCCCD(SoDinhDanh)) {
    throw new AppError('Số định danh (CCCD) không hợp lệ.', 400);
  }
  if (!isValidLicense(GiayPhepLaiXe)) {
    throw new AppError('Số giấy phép lái xe không hợp lệ.', 400);
  }
  if (!isValidEmail(email)) {
    throw new AppError('Email không được để trống và phải đúng định dạng.', 400);
  }
  if (!isValidPassword(MatKhau)) {
    throw new AppError('Mật khẩu phải có ít nhất 8 ký tự.', 400);
  }

  if (store.taiKhoan.some((a) => a.TenDN.toLowerCase() === String(TenDN).trim().toLowerCase())) {
    throw new AppError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.', 409);
  }
  if (store.khachHang.some((c) => c.SoDinhDanh === String(SoDinhDanh).trim())) {
    throw new AppError('Số định danh đã tồn tại trong hệ thống.', 409);
  }
  if (store.khachHang.some((c) => c.GiayPhepLaiXe === String(GiayPhepLaiXe).trim())) {
    throw new AppError('Số giấy phép lái xe đã tồn tại trong hệ thống.', 409);
  }

  const maKH = nextCode('KH', 'khachHang', 'MaKH');
  const customer = {
    MaKH: maKH,
    HoVaTen: String(HoVaTen).trim(),
    GioiTinh: String(GioiTinh).trim(),
    DienThoai: String(DienThoai).trim(),
    SoDinhDanh: String(SoDinhDanh).trim(),
    GiayPhepLaiXe: String(GiayPhepLaiXe).trim(),
    HanGPLX: '2030-12-31',
    email: String(email).trim(),
    DiaChi: String(DiaChi).trim(),
    BiCamThue: false,
  };

  const account = {
    TenDN: String(TenDN).trim(),
    MatKhau: bcrypt.hashSync(MatKhau, 8),
    TrangThaiTaiKhoan: 'Hoạt động',
    SoLanDangNhapSai: 0,
    VaiTro: ROLES.CUSTOMER,
    MaKH: maKH,
    MaNV: null,
  };

  store.khachHang.push(customer);
  store.taiKhoan.push(account);

  return { MaKH: maKH, TenDN: account.TenDN, VaiTro: account.VaiTro };
}

function login(tenDN, matKhau) {
  const store = getStore();
  const username = String(tenDN || '').trim();
  const password = String(matKhau || '');

  if (!username || !password) {
    throw new AppError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 400);
  }

  const acc = store.taiKhoan.find((a) => a.TenDN.toLowerCase() === username.toLowerCase());
  if (!acc) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }
  if (acc.TrangThaiTaiKhoan === 'Vô hiệu hóa') {
    throw new AppError('Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa.', 403);
  }
  if (acc.TrangThaiTaiKhoan === 'Tạm khóa') {
    throw new AppError('Tài khoản tạm khóa. Vui lòng liên hệ bộ phận hỗ trợ.', 403);
  }

  const matched = bcrypt.compareSync(password, acc.MatKhau);
  if (!matched) {
    acc.SoLanDangNhapSai += 1;
    if (acc.SoLanDangNhapSai >= MAX_LOGIN_ATTEMPTS) {
      acc.TrangThaiTaiKhoan = 'Tạm khóa';
      throw new AppError('Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần.', 403);
    }
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }

  acc.SoLanDangNhapSai = 0;

  const profile =
    acc.VaiTro === ROLES.CUSTOMER
      ? store.khachHang.find((c) => c.MaKH === acc.MaKH)
      : store.nhanVien.find((e) => e.MaNV === acc.MaNV);

  const userPayload = {
    TenDN: acc.TenDN,
    VaiTro: acc.VaiTro,
    MaKH: acc.MaKH,
    MaNV: acc.MaNV,
    HoTen: profile?.HoVaTen || profile?.HoTen || acc.TenDN,
  };

  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: userPayload };
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/auth.sql');

module.exports = isMssql() ? sqlRepo : { register, login };
