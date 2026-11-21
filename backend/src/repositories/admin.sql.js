const { sql, getPool } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');
const { isValidPhone } = require('../middleware/validate.middleware');

async function getOverview() {
  const pool = await getPool();
  const [accRes, statsRes] = await Promise.all([
    pool.request().query('SELECT TenDN, TrangThaiTaiKhoan, SoLanDangNhapSai, VaiTro, MaKH, MaNV FROM TAI_KHOAN'),
    pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM XE) AS totalCars,
        (SELECT COUNT(*) FROM HOP_DONG_THUE) AS totalContracts,
        (SELECT COUNT(*) FROM KHACH_HANG) AS totalCustomers
    `),
  ]);
  return {
    accounts: accRes.recordset,
    ...statsRes.recordset[0],
  };
}

async function listEmployees(keyword = '') {
  const pool = await getPool();
  const kw = String(keyword).trim();
  const req = pool.request();
  let where = '';
  if (kw) {
    req.input('kw', sql.NVarChar(100), `%${kw}%`);
    where = 'WHERE MaNV LIKE @kw OR HoTen LIKE @kw OR DienThoai LIKE @kw';
  }
  const res = await req.query(`SELECT * FROM NHAN_VIEN ${where} ORDER BY MaNV`);
  return res.recordset;
}

async function createEmployee({ MaNV, HoTen, DienThoai, MoTa = '' }) {
  const code = String(MaNV).trim().toUpperCase();
  if (!isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số).', 400);
  }
  const pool = await getPool();
  const dup = await pool
    .request()
    .input('MaNV', sql.VarChar(10), code)
    .query('SELECT MaNV FROM NHAN_VIEN WHERE LOWER(MaNV) = LOWER(@MaNV)');
  if (dup.recordset.length) throw new AppError('Mã nhân viên đã tồn tại.', 409);

  await pool
    .request()
    .input('MaNV', sql.VarChar(10), code)
    .input('HoTen', sql.NVarChar(100), String(HoTen).trim())
    .input('DienThoai', sql.VarChar(15), String(DienThoai).trim())
    .input('MoTa', sql.NVarChar(255), String(MoTa).trim() || 'Nhân viên')
    .query(
      `INSERT INTO NHAN_VIEN (MaNV, HoTen, DienThoai, MoTa, TrangThai)
       VALUES (@MaNV, @HoTen, @DienThoai, @MoTa, N'Đang làm việc')`
    );

  return { MaNV: code, HoTen: String(HoTen).trim(), DienThoai: String(DienThoai).trim(), MoTa: String(MoTa).trim() || 'Nhân viên', TrangThai: 'Đang làm việc' };
}

async function updateEmployee(maNV, { HoTen, DienThoai, MoTa }) {
  if (DienThoai !== undefined && !isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại không hợp lệ.', 400);
  }
  const pool = await getPool();
  const cur = await pool.request().input('MaNV', sql.VarChar(10), maNV).query('SELECT * FROM NHAN_VIEN WHERE MaNV = @MaNV');
  const emp = cur.recordset[0];
  if (!emp) throw new AppError('Không tìm thấy nhân viên.', 404);

  const nextHoTen = HoTen !== undefined ? String(HoTen).trim() : emp.HoTen;
  const nextPhone = DienThoai !== undefined ? String(DienThoai).trim() : emp.DienThoai;
  const nextMoTa = MoTa !== undefined ? String(MoTa).trim() : emp.MoTa;

  await pool
    .request()
    .input('MaNV', sql.VarChar(10), maNV)
    .input('HoTen', sql.NVarChar(100), nextHoTen)
    .input('DienThoai', sql.VarChar(15), nextPhone)
    .input('MoTa', sql.NVarChar(255), nextMoTa)
    .query('UPDATE NHAN_VIEN SET HoTen = @HoTen, DienThoai = @DienThoai, MoTa = @MoTa WHERE MaNV = @MaNV');

  return { ...emp, HoTen: nextHoTen, DienThoai: nextPhone, MoTa: nextMoTa };
}

async function deleteEmployee(maNV) {
  const pool = await getPool();
  const cur = await pool.request().input('MaNV', sql.VarChar(10), maNV).query('SELECT * FROM NHAN_VIEN WHERE MaNV = @MaNV');
  const emp = cur.recordset[0];
  if (!emp) throw new AppError('Không tìm thấy nhân viên.', 404);

  const ref = await pool
    .request()
    .input('MaNV', sql.VarChar(10), maNV)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM DON_DAT_XE WHERE MaNV = @MaNV) +
        (SELECT COUNT(*) FROM HOP_DONG_THUE WHERE MaNV = @MaNV) +
        (SELECT COUNT(*) FROM BAO_DUONG WHERE MaNV = @MaNV) AS RefCount
    `);

  if (ref.recordset[0].RefCount > 0) {
    await pool
      .request()
      .input('MaNV', sql.VarChar(10), maNV)
      .query("UPDATE NHAN_VIEN SET TrangThai = N'Ngừng hoạt động' WHERE MaNV = @MaNV");
    return { softDeleted: true, employee: { ...emp, TrangThai: 'Ngừng hoạt động' } };
  }

  await pool.request().input('MaNV', sql.VarChar(10), maNV).query('DELETE FROM NHAN_VIEN WHERE MaNV = @MaNV');
  return { softDeleted: false, employee: emp };
}

module.exports = {
  getOverview,
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
