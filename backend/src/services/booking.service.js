const { getStore, nextCode, todayISO, calcDays } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');

function createBooking(maKH, { MaMauXe, NgayNhan, NgayTra }) {
  const store = getStore();
  const customer = store.khachHang.find((c) => c.MaKH === maKH);
  const model = store.mauXe.find((m) => m.MaMauXe === MaMauXe);
  if (!model) throw new AppError('Mẫu xe không tồn tại.', 404);
  if (NgayNhan < todayISO()) throw new AppError('Ngày nhận xe không được trước ngày hiện tại.', 400);
  if (NgayTra <= NgayNhan) throw new AppError('Ngày trả xe phải sau ngày nhận xe.', 400);
  if (!customer?.GiayPhepLaiXe || (customer.HanGPLX && customer.HanGPLX < todayISO())) {
    throw new AppError('Giấy phép lái xe trong hồ sơ thiếu hoặc đã hết hiệu lực.', 400);
  }

  const hasReady = store.xe.some((x) => x.MaMauXe === MaMauXe && x.TrangThai === 'Sẵn sàng');
  if (!hasReady) {
    throw new AppError('Không có xe thuộc mẫu đã chọn đáp ứng khoảng thời gian thuê.', 409);
  }

  const dup = store.donDatXe.find(
    (b) =>
      b.MaKH === maKH &&
      b.MaMauXe === MaMauXe &&
      ['Chờ xác nhận', 'Đã xác nhận'].includes(b.TrangThai) &&
      !(b.NgayTra <= NgayNhan || b.NgayNhan >= NgayTra)
  );
  if (dup) {
    throw new AppError(`Bạn đã có đơn ${dup.MaDD} còn hiệu lực trùng mẫu xe và khoảng thuê.`, 409);
  }

  const days = calcDays(NgayNhan, NgayTra);
  const maDD = nextCode('DD', 'donDatXe', 'MaDD');
  const booking = {
    MaDD: maDD,
    MaKH: maKH,
    MaMauXe,
    MaNV: null,
    NgayDat: todayISO(),
    NgayNhan,
    NgayTra,
    TongGia: days * model.GiaThueNgay,
    TrangThai: 'Chờ xác nhận',
    LyDo: '',
  };
  store.donDatXe.unshift(booking);
  return booking;
}

function listBookings(user) {
  const store = getStore();
  if (user.VaiTro === 'Khách hàng') {
    return store.donDatXe.filter((b) => b.MaKH === user.MaKH);
  }
  return store.donDatXe;
}

function cancelBooking(maDD, user) {
  const store = getStore();
  const bk = store.donDatXe.find((b) => b.MaDD === maDD);
  if (!bk) throw new AppError('Không tìm thấy đơn đặt xe.', 404);
  if (user.VaiTro === 'Khách hàng' && bk.MaKH !== user.MaKH) {
    throw new AppError('Bạn không có quyền hủy đơn đặt xe của người khác.', 403);
  }
  if (!['Chờ xác nhận', 'Đã xác nhận'].includes(bk.TrangThai)) {
    throw new AppError('Đơn đặt xe không đủ điều kiện hủy tại thời điểm hiện tại.', 409);
  }
  bk.TrangThai = 'Đã hủy';
  bk.LyDo = `Hủy lúc ${todayISO()}`;
  return bk;
}

function processBooking(maDD, maNV, { action, lyDo = '' }) {
  const store = getStore();
  const bk = store.donDatXe.find((b) => b.MaDD === maDD);
  if (!bk) throw new AppError('Không tìm thấy đơn đặt xe.', 404);
  if (bk.TrangThai !== 'Chờ xác nhận') {
    throw new AppError('Đơn đặt xe đã được xử lý trước đó.', 409);
  }

  if (action === 'approve') {
    const ready = store.xe.some((x) => x.MaMauXe === bk.MaMauXe && x.TrangThai === 'Sẵn sàng');
    if (!ready) throw new AppError('Xe không khả dụng, không thể xác nhận đơn.', 409);
    bk.TrangThai = 'Đã xác nhận';
    bk.MaNV = maNV;
  } else if (action === 'reject') {
    if (!String(lyDo).trim()) throw new AppError('Vui lòng nhập lý do từ chối.', 400);
    bk.TrangThai = 'Từ chối';
    bk.MaNV = maNV;
    bk.LyDo = String(lyDo).trim();
  } else {
    throw new AppError('Hành động xử lý không hợp lệ.', 400);
  }
  return bk;
}

function requestBookingExtension(maDD, maKH, { NgayTraMoi, LyDo = '' }) {
  const store = getStore();
  const bk = store.donDatXe.find((b) => b.MaDD === maDD && b.MaKH === maKH);
  if (!bk) throw new AppError('Không tìm thấy đơn đặt xe phù hợp.', 404);
  if (!['Chờ xác nhận', 'Đã xác nhận'].includes(bk.TrangThai)) {
    throw new AppError('Đơn hàng không đủ điều kiện gia hạn.', 409);
  }
  if (!NgayTraMoi || NgayTraMoi <= bk.NgayTra) {
    throw new AppError('Ngày trả mới phải sau ngày trả hiện tại.', 400);
  }
  const hasPending = store.yeuCauGiaHan.some(
    (r) => r.LoaiYeuCau === 'Gia hạn đặt chỗ' && r.MaDoiTuong === maDD && r.TrangThai === 'Chờ xét duyệt'
  );
  if (hasPending) throw new AppError('Đơn đặt xe đã có yêu cầu gia hạn đang chờ duyệt.', 409);

  const maYC = nextCode('YC', 'yeuCauGiaHan', 'MaYC');
  const reqItem = {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn đặt chỗ',
    MaDoiTuong: maDD,
    MaKH: maKH,
    GoiHoacNgayDeNghi: NgayTraMoi,
    LyDo: String(LyDo).trim(),
    NgayGui: todayISO(),
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
  store.yeuCauGiaHan.unshift(reqItem);
  return reqItem;
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/booking.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
      createBooking,
      listBookings,
      cancelBooking,
      processBooking,
      requestBookingExtension,
    };
