const { sql, getPool, nextSqlCode, toISODate, todayISO } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

function mapBooking(r) {
  return {
    ...r,
    NgayDat: toISODate(r.NgayDat),
    NgayNhan: toISODate(r.NgayNhan),
    NgayTra: toISODate(r.NgayTra),
    TongGia: Number(r.TongGia),
  };
}

function calcDays(from, to) {
  const diff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

async function createBooking(maKH, { MaMauXe, NgayNhan, NgayTra }) {
  const today = todayISO();
  if (!NgayNhan || !NgayTra || NgayNhan < today || NgayTra <= NgayNhan) {
    throw new AppError('Thời gian nhận/trả xe không hợp lệ.', 400);
  }

  const pool = await getPool();
  const khRes = await pool.request().input('MaKH', sql.VarChar(10), maKH).query('SELECT * FROM KHACH_HANG WHERE MaKH = @MaKH');
  const customer = khRes.recordset[0];
  const hanGplx = toISODate(customer?.HanGPLX);
  if (!customer?.GiayPhepLaiXe || (hanGplx && hanGplx < today)) {
    throw new AppError('Giấy phép lái xe trong hồ sơ thiếu hoặc đã hết hiệu lực.', 400);
  }

  const modelRes = await pool.request().input('MaMauXe', sql.VarChar(10), MaMauXe).query('SELECT * FROM MAU_XE WHERE MaMauXe = @MaMauXe');
  const model = modelRes.recordset[0];
  if (!model) throw new AppError('Mẫu xe không tồn tại.', 404);

  const carRes = await pool
    .request()
    .input('MaMauXe', sql.VarChar(10), MaMauXe)
    .query("SELECT COUNT(*) AS ReadyCount FROM XE WHERE MaMauXe = @MaMauXe AND TrangThai = N'Sẵn sàng'");
  if (carRes.recordset[0].ReadyCount === 0) {
    throw new AppError('Hiện không có xe sẵn sàng thuộc mẫu đã chọn.', 409);
  }

  const dupRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .input('MaMauXe', sql.VarChar(10), MaMauXe)
    .input('NgayNhan', sql.Date, NgayNhan)
    .input('NgayTra', sql.Date, NgayTra)
    .query(`
      SELECT MaDD FROM DON_DAT_XE
      WHERE MaKH = @MaKH AND MaMauXe = @MaMauXe
        AND TrangThai IN (N'Chờ xác nhận', N'Đã xác nhận')
        AND NOT (NgayTra <= @NgayNhan OR NgayNhan >= @NgayTra)
    `);
  if (dupRes.recordset.length > 0) {
    throw new AppError(`Bạn đã có đơn ${dupRes.recordset[0].MaDD} còn hiệu lực cho mẫu xe và khoảng thời gian này.`, 409);
  }

  const days = calcDays(NgayNhan, NgayTra);
  const tongGia = Number(model.GiaThueNgay) * days;
  const maDD = await nextSqlCode(pool, 'DD', 'DON_DAT_XE', 'MaDD', 3);

  await pool
    .request()
    .input('MaDD', sql.VarChar(10), maDD)
    .input('NgayDat', sql.Date, today)
    .input('NgayNhan', sql.Date, NgayNhan)
    .input('NgayTra', sql.Date, NgayTra)
    .input('TongGia', sql.Decimal(15, 2), tongGia)
    .input('MaKH', sql.VarChar(10), maKH)
    .input('MaMauXe', sql.VarChar(10), MaMauXe)
    .query(`
      INSERT INTO DON_DAT_XE (MaDD, NgayDat, NgayNhan, NgayTra, TongGia, TrangThai, LyDo, MaKH, MaMauXe, MaNV)
      VALUES (@MaDD, @NgayDat, @NgayNhan, @NgayTra, @TongGia, N'Chờ xác nhận', N'', @MaKH, @MaMauXe, NULL)
    `);

  return {
    MaDD: maDD,
    MaKH: maKH,
    MaMauXe: MaMauXe,
    MaNV: null,
    NgayDat: today,
    NgayNhan,
    NgayTra,
    TongGia: tongGia,
    TrangThai: 'Chờ xác nhận',
    LyDo: '',
  };
}

async function listBookings(user) {
  const pool = await getPool();
  const req = pool.request();
  let where = '';
  if (user.VaiTro === 'Khách hàng') {
    req.input('MaKH', sql.VarChar(10), user.MaKH);
    where = 'WHERE MaKH = @MaKH';
  }
  const res = await req.query(`SELECT * FROM DON_DAT_XE ${where} ORDER BY NgayDat DESC, MaDD DESC`);
  return res.recordset.map(mapBooking);
}

async function cancelBooking(maDD, user) {
  const pool = await getPool();
  const res = await pool.request().input('MaDD', sql.VarChar(10), maDD).query('SELECT * FROM DON_DAT_XE WHERE MaDD = @MaDD');
  const booking = res.recordset[0];
  if (!booking) throw new AppError('Không tìm thấy đơn đặt xe.', 404);
  if (user.VaiTro === 'Khách hàng' && booking.MaKH !== user.MaKH) {
    throw new AppError('Bạn không có quyền hủy đơn đặt xe này.', 403);
  }
  if (!['Chờ xác nhận', 'Đã xác nhận'].includes(booking.TrangThai)) {
    throw new AppError('Chỉ được hủy đơn đang ở trạng thái Chờ xác nhận hoặc Đã xác nhận.', 409);
  }

  const lyDo = `Hủy lúc ${todayISO()}`;
  await pool
    .request()
    .input('MaDD', sql.VarChar(10), maDD)
    .input('LyDo', sql.NVarChar(255), lyDo)
    .query("UPDATE DON_DAT_XE SET TrangThai = N'Đã hủy', LyDo = @LyDo WHERE MaDD = @MaDD");

  return { ...mapBooking(booking), TrangThai: 'Đã hủy', LyDo: lyDo };
}

async function processBooking(maDD, maNV, { action, lyDo = '' }) {
  const pool = await getPool();
  const res = await pool.request().input('MaDD', sql.VarChar(10), maDD).query('SELECT * FROM DON_DAT_XE WHERE MaDD = @MaDD');
  const booking = res.recordset[0];
  if (!booking) throw new AppError('Không tìm thấy đơn đặt xe.', 404);
  if (booking.TrangThai !== 'Chờ xác nhận') {
    throw new AppError('Đơn đặt xe đã được xử lý trước đó.', 409);
  }

  if (action === 'approve') {
    const carRes = await pool
      .request()
      .input('MaMauXe', sql.VarChar(10), booking.MaMauXe)
      .query("SELECT COUNT(*) AS ReadyCount FROM XE WHERE MaMauXe = @MaMauXe AND TrangThai = N'Sẵn sàng'");
    if (carRes.recordset[0].ReadyCount === 0) {
      throw new AppError('Mẫu xe hiện không có xe sẵn sàng.', 409);
    }
    await pool
      .request()
      .input('MaDD', sql.VarChar(10), maDD)
      .input('MaNV', sql.VarChar(10), maNV)
      .query("UPDATE DON_DAT_XE SET TrangThai = N'Đã xác nhận', MaNV = @MaNV, LyDo = N'' WHERE MaDD = @MaDD");
    return { ...mapBooking(booking), TrangThai: 'Đã xác nhận', MaNV: maNV, LyDo: '' };
  }

  if (action === 'reject') {
    if (!String(lyDo).trim()) throw new AppError('Vui lòng nhập lý do từ chối.', 400);
    await pool
      .request()
      .input('MaDD', sql.VarChar(10), maDD)
      .input('MaNV', sql.VarChar(10), maNV)
      .input('LyDo', sql.NVarChar(255), String(lyDo).trim())
      .query("UPDATE DON_DAT_XE SET TrangThai = N'Từ chối', MaNV = @MaNV, LyDo = @LyDo WHERE MaDD = @MaDD");
    return { ...mapBooking(booking), TrangThai: 'Từ chối', MaNV: maNV, LyDo: String(lyDo).trim() };
  }

  throw new AppError('Hành động xử lý không hợp lệ.', 400);
}

async function requestBookingExtension(maDD, maKH, { NgayTraMoi, LyDo = '' }) {
  const pool = await getPool();
  const res = await pool.request().input('MaDD', sql.VarChar(10), maDD).query('SELECT * FROM DON_DAT_XE WHERE MaDD = @MaDD');
  const booking = res.recordset[0];
  if (!booking || booking.MaKH !== maKH) throw new AppError('Không tìm thấy đơn đặt xe phù hợp.', 404);
  if (!['Chờ xác nhận', 'Đã xác nhận'].includes(booking.TrangThai)) {
    throw new AppError('Đơn đặt xe ở trạng thái hiện tại không thể gia hạn.', 409);
  }
  const curNgayTra = toISODate(booking.NgayTra);
  if (!NgayTraMoi || NgayTraMoi <= curNgayTra) {
    throw new AppError('Ngày trả mới phải sau ngày trả hiện tại.', 400);
  }

  const pend = await pool
    .request()
    .input('MaDoiTuong', sql.VarChar(10), maDD)
    .query("SELECT MaYC FROM YEU_CAU_GIA_HAN WHERE LoaiYeuCau = N'Gia hạn đặt chỗ' AND MaDoiTuong = @MaDoiTuong AND TrangThai = N'Chờ xét duyệt'");
  if (pend.recordset.length > 0) {
    throw new AppError('Đơn đặt xe này đã có yêu cầu gia hạn đang chờ duyệt.', 409);
  }

  const maYC = await nextSqlCode(pool, 'YC', 'YEU_CAU_GIA_HAN', 'MaYC', 3);
  const today = todayISO();
  const reason = String(LyDo).trim() || 'Khách hàng yêu cầu gia hạn thời gian trả xe';

  await pool
    .request()
    .input('MaYC', sql.VarChar(10), maYC)
    .input('MaDoiTuong', sql.VarChar(10), maDD)
    .input('MaKH', sql.VarChar(10), maKH)
    .input('Goi', sql.NVarChar(100), NgayTraMoi)
    .input('LyDo', sql.NVarChar(255), reason)
    .input('NgayGui', sql.Date, today)
    .query(`
      INSERT INTO YEU_CAU_GIA_HAN (MaYC, LoaiYeuCau, MaDoiTuong, MaKH, GoiHoacNgayDeNghi, LyDo, NgayGui, TrangThai, LyDoTuChoi)
      VALUES (@MaYC, N'Gia hạn đặt chỗ', @MaDoiTuong, @MaKH, @Goi, @LyDo, @NgayGui, N'Chờ xét duyệt', N'')
    `);

  return {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn đặt chỗ',
    MaDoiTuong: maDD,
    MaKH: maKH,
    GoiHoacNgayDeNghi: NgayTraMoi,
    LyDo: reason,
    NgayGui: today,
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
}

module.exports = {
  createBooking,
  listBookings,
  cancelBooking,
  processBooking,
  requestBookingExtension,
};
