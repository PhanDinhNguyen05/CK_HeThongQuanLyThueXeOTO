const { sql, getPool, nextSqlCode, toISODate, todayISO } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

async function getUnpaidItems(maKH) {
  const pool = await getPool();
  const [hdRes, phRes] = await Promise.all([
    pool
      .request()
      .input('MaKH', sql.VarChar(10), maKH)
      .query('SELECT MaHD, NoiDung, TienConNo FROM HOP_DONG_THUE WHERE MaKH = @MaKH AND TienConNo > 0'),
    pool
      .request()
      .input('MaKH', sql.VarChar(10), maKH)
      .query("SELECT MaKhoanPhat, LoaiViPham, MoTa, SoTienPhat FROM KHOAN_PHAT WHERE MaKH = @MaKH AND TrangThaiThanhToan = N'Chưa thanh toán'"),
  ]);

  const contracts = hdRes.recordset.map((c) => ({
    id: `HD:${c.MaHD}`,
    ref: c.MaHD,
    type: 'Tiền thuê xe',
    title: c.NoiDung,
    amount: Number(c.TienConNo),
  }));

  const penalties = phRes.recordset.map((p) => ({
    id: `PH:${p.MaKhoanPhat}`,
    ref: p.MaKhoanPhat,
    type: p.LoaiViPham,
    title: `${p.LoaiViPham} (${p.MoTa})`,
    amount: Number(p.SoTienPhat),
  }));

  return [...contracts, ...penalties];
}

async function getPaymentHistory(maKH) {
  const pool = await getPool();
  const res = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT * FROM GIAO_DICH_THANH_TOAN WHERE MaKH = @MaKH ORDER BY NgayThanhToan DESC, MaGiaoDich DESC');
  return res.recordset.map((g) => ({
    ...g,
    MaThamChieu: g.MaHD || g.MaKhoanPhat,
    SoTien: Number(g.SoTien),
    NgayThanhToan: toISODate(g.NgayThanhToan),
  }));
}

async function payItem(maKH, { itemId, phuongThuc, nganHang = '', cardInfo = null }) {
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

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    let amount = 0;
    let loaiKhoan = '';
    let maHD = null;
    let maKhoanPhat = null;

    if (String(itemId).startsWith('HD:')) {
      const ref = itemId.slice(3);
      const res = await new sql.Request(tx)
        .input('MaHD', sql.VarChar(10), ref)
        .input('MaKH', sql.VarChar(10), maKH)
        .query('SELECT * FROM HOP_DONG_THUE WHERE MaHD = @MaHD AND MaKH = @MaKH AND TienConNo > 0');
      const hd = res.recordset[0];
      if (!hd) throw new AppError('Không tìm thấy khoản hợp đồng cần thanh toán.', 404);

      amount = Number(hd.TienConNo);
      loaiKhoan = 'Tiền thuê xe';
      maHD = hd.MaHD;

      await new sql.Request(tx)
        .input('MaHD', sql.VarChar(10), hd.MaHD)
        .input('Amount', sql.Decimal(15, 2), amount)
        .query('UPDATE HOP_DONG_THUE SET TienDaThu = TienDaThu + @Amount, TienConNo = 0 WHERE MaHD = @MaHD');
    } else if (String(itemId).startsWith('PH:')) {
      const ref = itemId.slice(3);
      const res = await new sql.Request(tx)
        .input('MaKhoanPhat', sql.VarChar(10), ref)
        .input('MaKH', sql.VarChar(10), maKH)
        .query("SELECT * FROM KHOAN_PHAT WHERE MaKhoanPhat = @MaKhoanPhat AND MaKH = @MaKH AND TrangThaiThanhToan = N'Chưa thanh toán'");
      const ph = res.recordset[0];
      if (!ph) throw new AppError('Không tìm thấy khoản phạt cần thanh toán.', 404);

      amount = Number(ph.SoTienPhat);
      loaiKhoan = ph.LoaiViPham;
      maKhoanPhat = ph.MaKhoanPhat;

      await new sql.Request(tx)
        .input('MaKhoanPhat', sql.VarChar(10), ph.MaKhoanPhat)
        .query("UPDATE KHOAN_PHAT SET TrangThaiThanhToan = N'Đã thanh toán' WHERE MaKhoanPhat = @MaKhoanPhat");
    } else {
      throw new AppError('Mã khoản thanh toán không hợp lệ.', 400);
    }

    const maGD = await nextSqlCode(tx, 'GD', 'GIAO_DICH_THANH_TOAN', 'MaGiaoDich', 3);
    const today = todayISO();
    const methodLabel = phuongThuc === 'Ngân hàng' ? `Ngân hàng (${nganHang})` : phuongThuc;

    await new sql.Request(tx)
      .input('MaGiaoDich', sql.VarChar(10), maGD)
      .input('MaHD', sql.VarChar(10), maHD)
      .input('MaKhoanPhat', sql.VarChar(10), maKhoanPhat)
      .input('MaKH', sql.VarChar(10), maKH)
      .input('LoaiKhoan', sql.NVarChar(100), loaiKhoan)
      .input('SoTien', sql.Decimal(15, 2), amount)
      .input('PhuongThuc', sql.NVarChar(50), methodLabel)
      .input('NgayThanhToan', sql.Date, today)
      .query(`
        INSERT INTO GIAO_DICH_THANH_TOAN (MaGiaoDich, MaHD, MaKhoanPhat, MaKH, LoaiKhoan, SoTien, PhuongThuc, NgayThanhToan, TrangThai)
        VALUES (@MaGiaoDich, @MaHD, @MaKhoanPhat, @MaKH, @LoaiKhoan, @SoTien, @PhuongThuc, @NgayThanhToan, N'Thành công')
      `);

    await tx.commit();
    return {
      MaGiaoDich: maGD,
      MaThamChieu: maHD || maKhoanPhat,
      LoaiKhoan: loaiKhoan,
      MaKH: maKH,
      SoTien: amount,
      PhuongThuc: methodLabel,
      NgayThanhToan: today,
      TrangThai: 'Thành công',
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { getUnpaidItems, getPaymentHistory, payItem };
