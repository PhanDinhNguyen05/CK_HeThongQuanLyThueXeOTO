const { sql, getPool, nextSqlCode, toISODate, todayISO } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

async function listMaintenance(maXe = '') {
  const pool = await getPool();
  const req = pool.request();
  let where = '';
  if (maXe) {
    req.input('MaXe', sql.VarChar(10), maXe);
    where = 'WHERE MaXe = @MaXe';
  }
  const res = await req.query(`SELECT * FROM BAO_DUONG ${where} ORDER BY NgayBaoDuong DESC, MaBaoDuong DESC`);
  return res.recordset.map((m) => ({
    ...m,
    NgayBaoDuong: toISODate(m.NgayBaoDuong),
    PhiBaoDuong: Number(m.PhiBaoDuong),
  }));
}

async function createMaintenance(maNV, { MaXe, NoiDungBaoDuong, PhiBaoDuong, SoChungTu = '' }) {
  const pool = await getPool();
  const carRes = await pool.request().input('MaXe', sql.VarChar(10), MaXe).query('SELECT MaXe FROM XE WHERE MaXe = @MaXe');
  if (!carRes.recordset.length) throw new AppError('Không tìm thấy xe.', 404);

  const fee = Number(PhiBaoDuong);
  if (Number.isNaN(fee) || fee < 0) throw new AppError('Phí bảo dưỡng không hợp lệ.', 400);

  const maBD = await nextSqlCode(pool, 'BD', 'BAO_DUONG', 'MaBaoDuong', 3);
  const today = todayISO();
  const chungTu = String(SoChungTu).trim() || `CT-${maBD}`;

  await pool
    .request()
    .input('MaBaoDuong', sql.VarChar(10), maBD)
    .input('MaXe', sql.VarChar(10), MaXe)
    .input('MaNV', sql.VarChar(10), maNV || 'NV001')
    .input('NgayBaoDuong', sql.Date, today)
    .input('NoiDungBaoDuong', sql.NVarChar(255), String(NoiDungBaoDuong).trim())
    .input('PhiBaoDuong', sql.Decimal(15, 2), fee)
    .input('SoChungTu', sql.VarChar(50), chungTu)
    .query(`
      INSERT INTO BAO_DUONG (MaBaoDuong, MaXe, MaNV, NgayBaoDuong, NoiDungBaoDuong, PhiBaoDuong, SoChungTu)
      VALUES (@MaBaoDuong, @MaXe, @MaNV, @NgayBaoDuong, @NoiDungBaoDuong, @PhiBaoDuong, @SoChungTu)
    `);

  return {
    MaBaoDuong: maBD,
    MaXe,
    MaNV: maNV || 'NV001',
    NgayBaoDuong: today,
    NoiDungBaoDuong: String(NoiDungBaoDuong).trim(),
    PhiBaoDuong: fee,
    SoChungTu: chungTu,
  };
}

async function listIncidents() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT * FROM SU_CO ORDER BY NgayGhiNhan DESC, MaSuCo DESC');
  return res.recordset.map((s) => ({
    ...s,
    ChiPhiPhatSinh: Number(s.ChiPhiPhatSinh),
    ChuyenPhapChe: Boolean(s.ChuyenPhapChe),
    NgayGhiNhan: toISODate(s.NgayGhiNhan),
  }));
}

async function createIncident({ MaHD, LoaiSuCo, MoTa, ViTri, ChiPhiPhatSinh = 0, ChuyenPhapChe = false }) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const hdRes = await new sql.Request(tx)
      .input('MaHD', sql.VarChar(10), MaHD)
      .query('SELECT MaHD, MaXe FROM HOP_DONG_THUE WHERE MaHD = @MaHD');
    const hd = hdRes.recordset[0];
    if (!hd) throw new AppError('Không tìm thấy hợp đồng thuê xe.', 404);

    const maSC = await nextSqlCode(tx, 'SC', 'SU_CO', 'MaSuCo', 3);
    const today = todayISO();
    const trangThai = ChuyenPhapChe ? 'Đã chuyển Phòng Pháp chế' : 'Đã ghi nhận';

    await new sql.Request(tx)
      .input('MaSuCo', sql.VarChar(10), maSC)
      .input('MaHD', sql.VarChar(10), hd.MaHD)
      .input('MaXe', sql.VarChar(10), hd.MaXe)
      .input('LoaiSuCo', sql.NVarChar(100), LoaiSuCo)
      .input('MoTa', sql.NVarChar(500), String(MoTa).trim())
      .input('ViTri', sql.NVarChar(200), String(ViTri).trim())
      .input('ChiPhiPhatSinh', sql.Decimal(15, 2), Number(ChiPhiPhatSinh) || 0)
      .input('ChuyenPhapChe', sql.Bit, ChuyenPhapChe ? 1 : 0)
      .input('NgayGhiNhan', sql.Date, today)
      .input('TrangThai', sql.NVarChar(50), trangThai)
      .query(`
        INSERT INTO SU_CO (MaSuCo, MaHD, MaXe, LoaiSuCo, MoTa, ViTri, ChiPhiPhatSinh, ChuyenPhapChe, NgayGhiNhan, TrangThai)
        VALUES (@MaSuCo, @MaHD, @MaXe, @LoaiSuCo, @MoTa, @ViTri, @ChiPhiPhatSinh, @ChuyenPhapChe, @NgayGhiNhan, @TrangThai)
      `);

    if (LoaiSuCo === 'Tai nạn / Hư hỏng nghiêm trọng') {
      await new sql.Request(tx)
        .input('MaXe', sql.VarChar(10), hd.MaXe)
        .query("UPDATE XE SET TrangThai = N'Bảo trì' WHERE MaXe = @MaXe");
    }

    await tx.commit();
    return {
      MaSuCo: maSC,
      MaHD: hd.MaHD,
      MaXe: hd.MaXe,
      LoaiSuCo,
      MoTa: String(MoTa).trim(),
      ViTri: String(ViTri).trim(),
      ChiPhiPhatSinh: Number(ChiPhiPhatSinh) || 0,
      ChuyenPhapChe: Boolean(ChuyenPhapChe),
      NgayGhiNhan: today,
      TrangThai: trangThai,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = {
  listMaintenance,
  createMaintenance,
  listIncidents,
  createIncident,
};
