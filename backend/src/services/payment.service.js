const { getStore, nextCode, todayISO } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');

function getUnpaidItems(maKH) {
  const store = getStore();
  const contracts = store.hopDongThue
    .filter((c) => c.MaKH === maKH && c.TienConNo > 0)
    .map((c) => ({
      id: `HD:${c.MaHD}`,
      ref: c.MaHD,
      type: 'Tiền thuê xe',
      title: c.NoiDung,
      amount: c.TienConNo,
    }));

  const penalties = store.khoanPhat
    .filter((p) => p.MaKH === maKH && p.TrangThaiThanhToan === 'Chưa thanh toán')
    .map((p) => ({
      id: `PH:${p.MaKhoanPhat}`,
      ref: p.MaKhoanPhat,
      type: p.LoaiViPham,
      title: `${p.LoaiViPham} (${p.MoTa})`,
      amount: p.SoTienPhat,
    }));

  return [...contracts, ...penalties];
}

function getPaymentHistory(maKH) {
  return getStore().giaoDichThanhToan.filter((g) => g.MaKH === maKH);
}

function payItem(maKH, { itemId, phuongThuc, nganHang = '', cardInfo = null }) {
  const store = getStore();
  if (!itemId || !phuongThuc) {
    throw new AppError('Vui lòng chọn khoản cần thanh toán và phương thức thanh toán.', 400);
  }

  if (phuongThuc === 'Thẻ tín dụng') {
    const cleanNum = String(cardInfo?.cardNumber || '').replace(/\s+/g, '');
    if (!/^\d{12,19}$/.test(cleanNum) || !cardInfo?.cardHolder || !/^\d{3,4}$/.test(String(cardInfo?.cvv || ''))) {
      throw new AppError('Thông tin thẻ tín dụng chưa đầy đủ hoặc sai định dạng.', 400);
    }
  }
  if (phuongThuc === 'Ngân hàng' && !nganHang) {
    throw new AppError('Vui lòng chọn ngân hàng thanh toán.', 400);
  }

  let amount = 0;
  let ref = '';
  let loai = '';

  if (String(itemId).startsWith('HD:')) {
    ref = itemId.slice(3);
    const hd = store.hopDongThue.find((c) => c.MaHD === ref && c.MaKH === maKH);
    if (!hd || hd.TienConNo <= 0) {
      throw new AppError('Khoản tiền hợp đồng không tồn tại hoặc đã thanh toán.', 409);
    }
    amount = hd.TienConNo;
    loai = 'Tiền thuê xe';
    hd.TienDaThu += amount;
    hd.TienConNo = 0;
  } else if (String(itemId).startsWith('PH:')) {
    ref = itemId.slice(3);
    const ph = store.khoanPhat.find((p) => p.MaKhoanPhat === ref && p.MaKH === maKH);
    if (!ph || ph.TrangThaiThanhToan === 'Đã thanh toán') {
      throw new AppError('Khoản phạt không tồn tại hoặc đã được thanh toán.', 409);
    }
    amount = ph.SoTienPhat;
    loai = ph.LoaiViPham;
    ph.TrangThaiThanhToan = 'Đã thanh toán';
  } else {
    throw new AppError('Mã khoản thanh toán không hợp lệ.', 400);
  }

  // Không lưu số thẻ và CVV (theo đặc tả UC09)
  const payment = {
    MaGiaoDich: nextCode('GD', 'giaoDichThanhToan', 'MaGiaoDich'),
    MaThamChieu: ref,
    LoaiKhoan: loai,
    MaKH: maKH,
    SoTien: amount,
    PhuongThuc: phuongThuc === 'Ngân hàng' ? `Ngân hàng (${nganHang})` : phuongThuc,
    NgayThanhToan: todayISO(),
    TrangThai: 'Thành công',
  };
  store.giaoDichThanhToan.unshift(payment);
  return payment;
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/payment.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
      getUnpaidItems,
      getPaymentHistory,
      payItem,
    };
