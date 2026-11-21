const { getStore, nextCode, todayISO } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');
const { isValidEmail, isValidPhone } = require('../middleware/validate.middleware');

function getProfile(maKH) {
  const store = getStore();
  const customer = store.khachHang.find((c) => c.MaKH === maKH);
  if (!customer) throw new AppError('Không tìm thấy hồ sơ khách hàng.', 404);
  const member = store.thanhVien.find((m) => m.MaKH === maKH) || null;
  return { ...customer, thanhVien: member };
}

function updateProfile(maKH, { DienThoai, email, DiaChi }) {
  const store = getStore();
  const customer = store.khachHang.find((c) => c.MaKH === maKH);
  if (!customer) throw new AppError('Không tìm thấy hồ sơ khách hàng.', 404);

  if (!isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại phải gồm đúng 10 chữ số.', 400);
  }
  if (!isValidEmail(email)) {
    throw new AppError('Email không hợp lệ.', 400);
  }
  if (store.khachHang.some((c) => c.MaKH !== maKH && c.DienThoai === String(DienThoai).trim())) {
    throw new AppError('Số điện thoại đã được sử dụng bởi khách hàng khác.', 409);
  }
  if (
    store.khachHang.some(
      (c) => c.MaKH !== maKH && c.email.toLowerCase() === String(email).trim().toLowerCase()
    )
  ) {
    throw new AppError('Email đã được sử dụng bởi khách hàng khác.', 409);
  }

  customer.DienThoai = String(DienThoai).trim();
  customer.email = String(email).trim();
  if (DiaChi !== undefined) customer.DiaChi = String(DiaChi).trim();
  return customer;
}

function registerMembership(maKH) {
  const store = getStore();
  const existing = store.thanhVien.find((m) => m.MaKH === maKH);
  if (existing) {
    throw new AppError('Khách hàng đã là thành viên của hệ thống.', 409);
  }
  const maTV = nextCode('TV', 'thanhVien', 'MaTV');
  const today = todayISO();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const member = {
    MaTV: maTV,
    MaKH: maKH,
    TinhTrang: 'Hoạt động',
    NgayBatDau: today,
    NgayHetHan: nextYear.toISOString().slice(0, 10),
    DiemTichLuy: 0,
  };
  store.thanhVien.push(member);
  return member;
}

function requestMembershipExtension(maKH, { GoiGiaHan }) {
  const store = getStore();
  const customer = store.khachHang.find((c) => c.MaKH === maKH);
  const member = store.thanhVien.find((m) => m.MaKH === maKH);
  if (!member) {
    throw new AppError('Khách hàng chưa đăng ký thành viên.', 400);
  }
  if (customer?.BiCamThue) {
    throw new AppError('Thành viên đang bị cấm thuê, không thể gia hạn.', 403);
  }
  const hasDebt =
    store.hopDongThue.some((c) => c.MaKH === maKH && c.TienConNo > 0) ||
    store.khoanPhat.some((p) => p.MaKH === maKH && p.TrangThaiThanhToan === 'Chưa thanh toán');
  if (hasDebt) {
    throw new AppError('Thành viên còn khoản chưa thanh toán. Vui lòng thanh toán trước.', 400);
  }
  const daysLeft = Math.ceil((new Date(member.NgayHetHan) - new Date(todayISO())) / (1000 * 60 * 60 * 24));
  if (daysLeft > 30) {
    throw new AppError('Chưa đến thời điểm được phép gia hạn (chỉ gia hạn khi còn <= 30 ngày hoặc đã hết hạn).', 400);
  }
  const hasPending = store.yeuCauGiaHan.some(
    (r) =>
      r.LoaiYeuCau === 'Gia hạn thành viên' &&
      r.MaDoiTuong === member.MaTV &&
      r.TrangThai === 'Chờ xét duyệt'
  );
  if (hasPending) {
    throw new AppError('Đã có yêu cầu gia hạn thành viên đang chờ xét duyệt.', 409);
  }

  const maYC = nextCode('YC', 'yeuCauGiaHan', 'MaYC');
  const reqItem = {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn thành viên',
    MaDoiTuong: member.MaTV,
    MaKH: maKH,
    GoiHoacNgayDeNghi: GoiGiaHan,
    LyDo: 'Gia hạn thẻ thành viên AUK',
    NgayGui: todayISO(),
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
  store.yeuCauGiaHan.unshift(reqItem);
  return reqItem;
}

function listCustomers() {
  return getStore().khachHang;
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/customer.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
      listCustomers,
      getProfile,
      updateProfile,
      registerMembership,
      requestMembershipExtension,
    };
