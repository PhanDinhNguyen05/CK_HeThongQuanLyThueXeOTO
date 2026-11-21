const { sql, getPool, nextSqlCode, toISODate, todayISO } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');
const { isValidEmail, isValidPhone } = require('../middleware/validate.middleware');

function mapCustomer(row) {
  return {
    ...row,
    HanGPLX: toISODate(row.HanGPLX),
    BiCamThue: Boolean(row.BiCamThue),
  };
}

async function listCustomers() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT * FROM KHACH_HANG ORDER BY MaKH');
  return res.recordset.map(mapCustomer);
}

async function getProfile(maKH) {
  const pool = await getPool();
  const khRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT * FROM KHACH_HANG WHERE MaKH = @MaKH');
  const customer = khRes.recordset[0];
  if (!customer) throw new AppError('Không tìm thấy hồ sơ khách hàng.', 404);

  const tvRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT * FROM THANH_VIEN WHERE MaKH = @MaKH');
  const member = tvRes.recordset[0]
    ? {
        ...tvRes.recordset[0],
        NgayBatDau: toISODate(tvRes.recordset[0].NgayBatDau),
        NgayHetHan: toISODate(tvRes.recordset[0].NgayHetHan),
      }
    : null;

  return { ...mapCustomer(customer), thanhVien: member };
}

async function updateProfile(maKH, { DienThoai, email, DiaChi }) {
  if (!isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại phải gồm đúng 10 chữ số.', 400);
  }
  if (!isValidEmail(email)) {
    throw new AppError('Email không hợp lệ.', 400);
  }

  const pool = await getPool();
  const dupPhone = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .input('DienThoai', sql.VarChar(15), String(DienThoai).trim())
    .query('SELECT MaKH FROM KHACH_HANG WHERE MaKH <> @MaKH AND DienThoai = @DienThoai');
  if (dupPhone.recordset.length > 0) {
    throw new AppError('Số điện thoại đã được sử dụng bởi khách hàng khác.', 409);
  }

  const dupEmail = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .input('email', sql.VarChar(100), String(email).trim())
    .query('SELECT MaKH FROM KHACH_HANG WHERE MaKH <> @MaKH AND LOWER(email) = LOWER(@email)');
  if (dupEmail.recordset.length > 0) {
    throw new AppError('Email đã được sử dụng bởi khách hàng khác.', 409);
  }

  const req = pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .input('DienThoai', sql.VarChar(15), String(DienThoai).trim())
    .input('email', sql.VarChar(100), String(email).trim());

  if (DiaChi !== undefined) {
    req.input('DiaChi', sql.NVarChar(255), String(DiaChi).trim());
    await req.query('UPDATE KHACH_HANG SET DienThoai = @DienThoai, email = @email, DiaChi = @DiaChi WHERE MaKH = @MaKH');
  } else {
    await req.query('UPDATE KHACH_HANG SET DienThoai = @DienThoai, email = @email WHERE MaKH = @MaKH');
  }

  const updated = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT * FROM KHACH_HANG WHERE MaKH = @MaKH');
  if (!updated.recordset[0]) throw new AppError('Không tìm thấy hồ sơ khách hàng.', 404);
  return mapCustomer(updated.recordset[0]);
}

async function registerMembership(maKH) {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT MaTV FROM THANH_VIEN WHERE MaKH = @MaKH');
  if (existing.recordset.length > 0) {
    throw new AppError('Khách hàng đã là thành viên của hệ thống.', 409);
  }

  const maTV = await nextSqlCode(pool, 'TV', 'THANH_VIEN', 'MaTV', 3);
  const today = todayISO();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const expiry = nextYear.toISOString().slice(0, 10);

  await pool
    .request()
    .input('MaTV', sql.VarChar(10), maTV)
    .input('MaKH', sql.VarChar(10), maKH)
    .input('NgayBatDau', sql.Date, today)
    .input('NgayHetHan', sql.Date, expiry)
    .query(
      `INSERT INTO THANH_VIEN (MaTV, MaKH, TinhTrang, NgayBatDau, NgayHetHan, DiemTichLuy)
       VALUES (@MaTV, @MaKH, N'Hoạt động', @NgayBatDau, @NgayHetHan, 0)`
    );

  return { MaTV: maTV, MaKH: maKH, TinhTrang: 'Hoạt động', NgayBatDau: today, NgayHetHan: expiry, DiemTichLuy: 0 };
}

async function requestMembershipExtension(maKH, { GoiGiaHan }) {
  const pool = await getPool();
  const khRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT BiCamThue FROM KHACH_HANG WHERE MaKH = @MaKH');
  const tvRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query('SELECT * FROM THANH_VIEN WHERE MaKH = @MaKH');

  const member = tvRes.recordset[0];
  if (!member) throw new AppError('Khách hàng chưa đăng ký thành viên.', 400);
  if (khRes.recordset[0]?.BiCamThue) {
    throw new AppError('Thành viên đang bị cấm thuê, không thể gia hạn.', 403);
  }

  const debtRes = await pool
    .request()
    .input('MaKH', sql.VarChar(10), maKH)
    .query(
      `SELECT
        (SELECT COUNT(*) FROM HOP_DONG_THUE WHERE MaKH = @MaKH AND TienConNo > 0) +
        (SELECT COUNT(*) FROM KHOAN_PHAT WHERE MaKH = @MaKH AND TrangThaiThanhToan = N'Chưa thanh toán') AS DebtCount`
    );
  if (debtRes.recordset[0].DebtCount > 0) {
    throw new AppError('Thành viên còn khoản chưa thanh toán. Vui lòng thanh toán trước.', 400);
  }

  const expiry = toISODate(member.NgayHetHan);
  const daysLeft = Math.ceil((new Date(expiry) - new Date(todayISO())) / (1000 * 60 * 60 * 24));
  if (daysLeft > 30) {
    throw new AppError('Chưa đến thời điểm được phép gia hạn (chỉ gia hạn khi còn <= 30 ngày hoặc đã hết hạn).', 400);
  }

  const pendRes = await pool
    .request()
    .input('MaDoiTuong', sql.VarChar(10), member.MaTV)
    .query(
      `SELECT MaYC FROM YEU_CAU_GIA_HAN
       WHERE LoaiYeuCau = N'Gia hạn thành viên' AND MaDoiTuong = @MaDoiTuong AND TrangThai = N'Chờ xét duyệt'`
    );
  if (pendRes.recordset.length > 0) {
    throw new AppError('Đã có yêu cầu gia hạn thành viên đang chờ xét duyệt.', 409);
  }

  const maYC = await nextSqlCode(pool, 'YC', 'YEU_CAU_GIA_HAN', 'MaYC', 3);
  const today = todayISO();
  await pool
    .request()
    .input('MaYC', sql.VarChar(10), maYC)
    .input('MaDoiTuong', sql.VarChar(10), member.MaTV)
    .input('MaKH', sql.VarChar(10), maKH)
    .input('Goi', sql.NVarChar(100), String(GoiGiaHan))
    .input('NgayGui', sql.Date, today)
    .query(
      `INSERT INTO YEU_CAU_GIA_HAN (MaYC, LoaiYeuCau, MaDoiTuong, MaKH, GoiHoacNgayDeNghi, LyDo, NgayGui, TrangThai, LyDoTuChoi)
       VALUES (@MaYC, N'Gia hạn thành viên', @MaDoiTuong, @MaKH, @Goi, N'Gia hạn thẻ thành viên AUK', @NgayGui, N'Chờ xét duyệt', N'')`
    );

  return {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn thành viên',
    MaDoiTuong: member.MaTV,
    MaKH: maKH,
    GoiHoacNgayDeNghi: String(GoiGiaHan),
    LyDo: 'Gia hạn thẻ thành viên AUK',
    NgayGui: today,
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
}

module.exports = {
  listCustomers,
  getProfile,
  updateProfile,
  registerMembership,
  requestMembershipExtension,
};
