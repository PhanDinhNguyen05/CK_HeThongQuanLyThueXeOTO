const { sql, getPool, nextSqlCode } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');

async function getVehicleMeta() {
  const pool = await getPool();
  const [brandsRes, segsRes, carsRes] = await Promise.all([
    pool.request().query('SELECT * FROM HANG_XE ORDER BY MaHang'),
    pool.request().query('SELECT * FROM PHAN_KHUC_XE ORDER BY MaPhanKhuc'),
    pool.request().query('SELECT MaXe, MaMauXe, TrangThai FROM XE ORDER BY MaXe'),
  ]);
  return {
    brands: brandsRes.recordset,
    segments: segsRes.recordset,
    cars: carsRes.recordset,
  };
}

async function searchCarModels({ keyword = '', maPhanKhuc = '', maxPrice = '' }) {
  const pool = await getPool();
  const req = pool.request();
  let where = 'WHERE 1=1';
  if (String(keyword).trim()) {
    req.input('kw', sql.NVarChar(120), `%${String(keyword).trim()}%`);
    where += ' AND (m.TenMauXe LIKE @kw OR m.MaMauXe LIKE @kw)';
  }
  if (maPhanKhuc) {
    req.input('pk', sql.VarChar(10), maPhanKhuc);
    where += ' AND m.MaPhanKhuc = @pk';
  }
  if (maxPrice) {
    req.input('maxPrice', sql.Decimal(15, 2), Number(maxPrice));
    where += ' AND m.GiaThueNgay <= @maxPrice';
  }

  const res = await req.query(`
    SELECT m.*, ts.SoChoNgoi, ts.HopSo, ts.NhienLieu, ts.DongCo,
           pk.TenPhanKhuc, hx.TenHang,
           (SELECT COUNT(*) FROM XE x WHERE x.MaMauXe = m.MaMauXe AND x.TrangThai = N'Sẵn sàng') AS SoXeSanSang
    FROM MAU_XE m
    LEFT JOIN THONG_SO_MAU_XE ts ON ts.MaMauXe = m.MaMauXe
    LEFT JOIN PHAN_KHUC_XE pk ON pk.MaPhanKhuc = m.MaPhanKhuc
    LEFT JOIN HANG_XE hx ON hx.MaHang = m.MaHang
    ${where}
    ORDER BY m.MaMauXe
  `);
  return res.recordset.map((r) => ({ ...r, GiaThueNgay: Number(r.GiaThueNgay) }));
}

async function getCarModelById(maMauXe) {
  const pool = await getPool();
  const res = await pool
    .request()
    .input('MaMauXe', sql.VarChar(10), maMauXe)
    .query(`
      SELECT m.*, ts.SoChoNgoi, ts.HopSo, ts.NhienLieu, ts.DongCo,
             pk.TenPhanKhuc, hx.TenHang,
             (SELECT COUNT(*) FROM XE x WHERE x.MaMauXe = m.MaMauXe AND x.TrangThai = N'Sẵn sàng') AS SoXeSanSang
      FROM MAU_XE m
      LEFT JOIN THONG_SO_MAU_XE ts ON ts.MaMauXe = m.MaMauXe
      LEFT JOIN PHAN_KHUC_XE pk ON pk.MaPhanKhuc = m.MaPhanKhuc
      LEFT JOIN HANG_XE hx ON hx.MaHang = m.MaHang
      WHERE m.MaMauXe = @MaMauXe
    `);
  if (!res.recordset[0]) throw new AppError('Mẫu xe không tồn tại.', 404);
  return { ...res.recordset[0], GiaThueNgay: Number(res.recordset[0].GiaThueNgay) };
}

async function createCarModel(payload) {
  const { TenMauXe, GiaThueNgay, MaPhanKhuc, MaHang, DongCo } = payload;
  const price = Number(GiaThueNgay);
  if (Number.isNaN(price) || price <= 0) {
    throw new AppError('Giá thuê ngày phải là số dương hợp lệ.', 400);
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const pkCheck = await new sql.Request(tx)
      .input('pk', sql.VarChar(10), MaPhanKhuc)
      .query('SELECT MaPhanKhuc FROM PHAN_KHUC_XE WHERE MaPhanKhuc = @pk');
    if (!pkCheck.recordset.length) throw new AppError('Phân khúc xe không hợp lệ.', 400);

    const hxCheck = await new sql.Request(tx)
      .input('hx', sql.VarChar(10), MaHang)
      .query('SELECT MaHang FROM HANG_XE WHERE MaHang = @hx');
    if (!hxCheck.recordset.length) throw new AppError('Hãng xe / Nhà cung cấp không hợp lệ.', 400);

    const dup = await new sql.Request(tx)
      .input('TenMauXe', sql.NVarChar(120), String(TenMauXe).trim())
      .input('MaHang', sql.VarChar(10), MaHang)
      .input('DongCo', sql.NVarChar(80), String(DongCo).trim())
      .query(`
        SELECT m.MaMauXe FROM MAU_XE m
        JOIN THONG_SO_MAU_XE ts ON ts.MaMauXe = m.MaMauXe
        WHERE LOWER(m.TenMauXe) = LOWER(@TenMauXe) AND m.MaHang = @MaHang AND LOWER(ts.DongCo) = LOWER(@DongCo)
      `);
    if (dup.recordset.length) throw new AppError('Mẫu xe với cấu hình nhận diện này đã tồn tại.', 409);

    const maMauXe = await nextSqlCode(tx, 'MX', 'MAU_XE', 'MaMauXe', 2);

    await new sql.Request(tx)
      .input('MaMauXe', sql.VarChar(10), maMauXe)
      .input('TenMauXe', sql.NVarChar(120), String(TenMauXe).trim())
      .input('MaPhanKhuc', sql.VarChar(10), MaPhanKhuc)
      .input('MaHang', sql.VarChar(10), MaHang)
      .input('GiaThueNgay', sql.Decimal(15, 2), price)
      .input('MoTa', sql.NVarChar(500), payload.MoTa || '')
      .input('NoiDungQuangBa', sql.NVarChar(300), payload.NoiDungQuangBa || '')
      .input('AnhPoster', sql.VarChar(500), payload.AnhPoster || '')
      .query(`
        INSERT INTO MAU_XE (MaMauXe, TenMauXe, MaPhanKhuc, MaHang, GiaThueNgay, MoTa, NoiDungQuangBa, AnhPoster)
        VALUES (@MaMauXe, @TenMauXe, @MaPhanKhuc, @MaHang, @GiaThueNgay, @MoTa, @NoiDungQuangBa, @AnhPoster)
      `);

    await new sql.Request(tx)
      .input('MaMauXe', sql.VarChar(10), maMauXe)
      .input('SoChoNgoi', sql.Int, Number(payload.SoChoNgoi) || 5)
      .input('HopSo', sql.NVarChar(50), payload.HopSo || 'Số tự động')
      .input('NhienLieu', sql.NVarChar(50), payload.NhienLieu || 'Xăng')
      .input('DongCo', sql.NVarChar(80), String(DongCo).trim())
      .query(`
        INSERT INTO THONG_SO_MAU_XE (MaMauXe, SoChoNgoi, HopSo, NhienLieu, DongCo)
        VALUES (@MaMauXe, @SoChoNgoi, @HopSo, @NhienLieu, @DongCo)
      `);

    await tx.commit();
    return getCarModelById(maMauXe);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function updateCarModel(maMauXe, payload) {
  const pool = await getPool();
  const existing = await getCarModelById(maMauXe);
  if (payload.GiaThueNgay !== undefined) {
    const price = Number(payload.GiaThueNgay);
    if (Number.isNaN(price) || price <= 0) {
      throw new AppError('Giá thuê ngày phải là số dương hợp lệ.', 400);
    }
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx)
      .input('MaMauXe', sql.VarChar(10), maMauXe)
      .input('TenMauXe', sql.NVarChar(120), payload.TenMauXe !== undefined ? String(payload.TenMauXe).trim() : existing.TenMauXe)
      .input('GiaThueNgay', sql.Decimal(15, 2), payload.GiaThueNgay !== undefined ? Number(payload.GiaThueNgay) : existing.GiaThueNgay)
      .input('MaPhanKhuc', sql.VarChar(10), payload.MaPhanKhuc || existing.MaPhanKhuc)
      .input('MaHang', sql.VarChar(10), payload.MaHang || existing.MaHang)
      .input('MoTa', sql.NVarChar(500), payload.MoTa !== undefined ? payload.MoTa : existing.MoTa)
      .input('NoiDungQuangBa', sql.NVarChar(300), payload.NoiDungQuangBa !== undefined ? payload.NoiDungQuangBa : existing.NoiDungQuangBa)
      .input('AnhPoster', sql.VarChar(500), payload.AnhPoster !== undefined ? payload.AnhPoster : existing.AnhPoster)
      .query(`
        UPDATE MAU_XE
        SET TenMauXe = @TenMauXe, GiaThueNgay = @GiaThueNgay, MaPhanKhuc = @MaPhanKhuc, MaHang = @MaHang,
            MoTa = @MoTa, NoiDungQuangBa = @NoiDungQuangBa, AnhPoster = @AnhPoster
        WHERE MaMauXe = @MaMauXe
      `);

    await new sql.Request(tx)
      .input('MaMauXe', sql.VarChar(10), maMauXe)
      .input('SoChoNgoi', sql.Int, payload.SoChoNgoi !== undefined ? Number(payload.SoChoNgoi) : existing.SoChoNgoi)
      .input('HopSo', sql.NVarChar(50), payload.HopSo || existing.HopSo)
      .input('NhienLieu', sql.NVarChar(50), payload.NhienLieu || existing.NhienLieu)
      .input('DongCo', sql.NVarChar(80), payload.DongCo || existing.DongCo)
      .query(`
        UPDATE THONG_SO_MAU_XE
        SET SoChoNgoi = @SoChoNgoi, HopSo = @HopSo, NhienLieu = @NhienLieu, DongCo = @DongCo
        WHERE MaMauXe = @MaMauXe
      `);

    await tx.commit();
    return getCarModelById(maMauXe);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function deleteCarModel(maMauXe) {
  const pool = await getPool();
  const refRes = await pool
    .request()
    .input('MaMauXe', sql.VarChar(10), maMauXe)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM XE WHERE MaMauXe = @MaMauXe) +
        (SELECT COUNT(*) FROM DON_DAT_XE WHERE MaMauXe = @MaMauXe) AS RefCount
    `);
  if (refRes.recordset[0].RefCount > 0) {
    throw new AppError('Không thể xóa mẫu xe đang được tham chiếu bởi xe hoặc đơn đặt xe.', 409);
  }
  const del = await pool
    .request()
    .input('MaMauXe', sql.VarChar(10), maMauXe)
    .query('DELETE FROM MAU_XE OUTPUT DELETED.* WHERE MaMauXe = @MaMauXe');
  if (!del.recordset[0]) throw new AppError('Không tìm thấy mẫu xe.', 404);
  return del.recordset[0];
}

async function listCars(keyword = '') {
  const pool = await getPool();
  const kw = String(keyword).trim();
  const req = pool.request();
  let where = '';
  if (kw) {
    req.input('kw', sql.NVarChar(120), `%${kw}%`);
    where = 'WHERE x.BienSo LIKE @kw OR x.MaXe LIKE @kw OR m.TenMauXe LIKE @kw';
  }
  const res = await req.query(`
    SELECT x.* FROM XE x
    LEFT JOIN MAU_XE m ON m.MaMauXe = x.MaMauXe
    ${where}
    ORDER BY x.MaXe
  `);
  return res.recordset;
}

async function createCar(payload) {
  const { BienSo, MaMauXe, MauSac, SoKhung, SoMay, NamSanXuat = 2024, SoKmHienTai = 0 } = payload;
  if (Number(SoKmHienTai) < 0) throw new AppError('Số km hiện tại không được là số âm.', 400);

  const pool = await getPool();
  const dup = await pool
    .request()
    .input('BienSo', sql.VarChar(20), String(BienSo).trim())
    .query('SELECT MaXe FROM XE WHERE LOWER(BienSo) = LOWER(@BienSo)');
  if (dup.recordset.length) throw new AppError('Biển số xe đã tồn tại trong hệ thống.', 409);

  const maXe = await nextSqlCode(pool, 'XE', 'XE', 'MaXe', 2);
  await pool
    .request()
    .input('MaXe', sql.VarChar(10), maXe)
    .input('BienSo', sql.VarChar(20), String(BienSo).trim())
    .input('MaMauXe', sql.VarChar(10), MaMauXe)
    .input('MauSac', sql.NVarChar(30), String(MauSac).trim())
    .input('SoKhung', sql.VarChar(50), String(SoKhung).trim())
    .input('SoMay', sql.VarChar(50), String(SoMay).trim())
    .input('NamSanXuat', sql.Int, Number(NamSanXuat))
    .input('SoKmHienTai', sql.Int, Number(SoKmHienTai) || 0)
    .input('MaVach', sql.VarChar(30), `BC-${maXe}`)
    .query(`
      INSERT INTO XE (MaXe, BienSo, MaMauXe, MauSac, SoKhung, SoMay, NamSanXuat, SoKmHienTai, TrangThai, MaVach)
      VALUES (@MaXe, @BienSo, @MaMauXe, @MauSac, @SoKhung, @SoMay, @NamSanXuat, @SoKmHienTai, N'Sẵn sàng', @MaVach)
    `);

  const created = await pool.request().input('MaXe', sql.VarChar(10), maXe).query('SELECT * FROM XE WHERE MaXe = @MaXe');
  return created.recordset[0];
}

async function updateCar(maXe, payload) {
  const pool = await getPool();
  const curRes = await pool.request().input('MaXe', sql.VarChar(10), maXe).query('SELECT * FROM XE WHERE MaXe = @MaXe');
  const car = curRes.recordset[0];
  if (!car) throw new AppError('Không tìm thấy xe.', 404);
  if (car.TrangThai === 'Đang thuê') {
    throw new AppError('Xe đang được xử lý cho thuê, không thể cập nhật lúc này.', 409);
  }
  if (payload.BienSo) {
    const dup = await pool
      .request()
      .input('MaXe', sql.VarChar(10), maXe)
      .input('BienSo', sql.VarChar(20), String(payload.BienSo).trim())
      .query('SELECT MaXe FROM XE WHERE MaXe <> @MaXe AND LOWER(BienSo) = LOWER(@BienSo)');
    if (dup.recordset.length) throw new AppError('Biển số xe đã tồn tại trong hệ thống.', 409);
  }
  if (payload.SoKmHienTai !== undefined && Number(payload.SoKmHienTai) < 0) {
    throw new AppError('Số km hiện tại không được là số âm.', 400);
  }

  await pool
    .request()
    .input('MaXe', sql.VarChar(10), maXe)
    .input('BienSo', sql.VarChar(20), payload.BienSo ? String(payload.BienSo).trim() : car.BienSo)
    .input('MaMauXe', sql.VarChar(10), payload.MaMauXe || car.MaMauXe)
    .input('MauSac', sql.NVarChar(30), payload.MauSac || car.MauSac)
    .input('SoKhung', sql.VarChar(50), payload.SoKhung || car.SoKhung)
    .input('SoMay', sql.VarChar(50), payload.SoMay || car.SoMay)
    .input('NamSanXuat', sql.Int, payload.NamSanXuat !== undefined ? Number(payload.NamSanXuat) : car.NamSanXuat)
    .input('SoKmHienTai', sql.Int, payload.SoKmHienTai !== undefined ? Number(payload.SoKmHienTai) : car.SoKmHienTai)
    .input('TrangThai', sql.NVarChar(30), payload.TrangThai || car.TrangThai)
    .query(`
      UPDATE XE
      SET BienSo = @BienSo, MaMauXe = @MaMauXe, MauSac = @MauSac, SoKhung = @SoKhung,
          SoMay = @SoMay, NamSanXuat = @NamSanXuat, SoKmHienTai = @SoKmHienTai, TrangThai = @TrangThai
      WHERE MaXe = @MaXe
    `);

  const updated = await pool.request().input('MaXe', sql.VarChar(10), maXe).query('SELECT * FROM XE WHERE MaXe = @MaXe');
  return updated.recordset[0];
}

async function deleteCar(maXe) {
  const pool = await getPool();
  const curRes = await pool.request().input('MaXe', sql.VarChar(10), maXe).query('SELECT * FROM XE WHERE MaXe = @MaXe');
  const car = curRes.recordset[0];
  if (!car) throw new AppError('Không tìm thấy xe.', 404);
  if (car.TrangThai === 'Đang thuê') {
    throw new AppError('Không được xóa xe khi đang ở trạng thái Đang thuê.', 409);
  }
  await pool
    .request()
    .input('MaXe', sql.VarChar(10), maXe)
    .query("UPDATE XE SET TrangThai = N'Ngừng hoạt động' WHERE MaXe = @MaXe");
  return { ...car, TrangThai: 'Ngừng hoạt động' };
}

module.exports = {
  getVehicleMeta,
  searchCarModels,
  getCarModelById,
  createCarModel,
  updateCarModel,
  deleteCarModel,
  listCars,
  createCar,
  updateCar,
  deleteCar,
};
