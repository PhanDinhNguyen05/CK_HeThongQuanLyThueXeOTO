const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool, nextSqlCode } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, MAX_LOGIN_ATTEMPTS, ROLES } = require('../config/env');
const { AppError } = require('../middleware/error.middleware');
const {
  isValidEmail,
  isValidPhone,
  isValidCCCD,
  isValidLicense,
  isValidPassword,
} = require('../middleware/validate.middleware');

async function register(payload) {
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

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const dupUser = await new sql.Request(tx)
      .input('TenDN', sql.VarChar(50), String(TenDN).trim())
      .query('SELECT TenDN FROM TAI_KHOAN WHERE LOWER(TenDN) = LOWER(@TenDN)');
    if (dupUser.recordset.length > 0) {
      throw new AppError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.', 409);
    }

    const dupCccd = await new sql.Request(tx)
      .input('SoDinhDanh', sql.VarChar(20), String(SoDinhDanh).trim())
      .query('SELECT MaKH FROM KHACH_HANG WHERE SoDinhDanh = @SoDinhDanh');
    if (dupCccd.recordset.length > 0) {
      throw new AppError('Số định danh đã tồn tại trong hệ thống.', 409);
    }

    const dupLic = await new sql.Request(tx)
      .input('GiayPhepLaiXe', sql.VarChar(20), String(GiayPhepLaiXe).trim())
      .query('SELECT MaKH FROM KHACH_HANG WHERE GiayPhepLaiXe = @GiayPhepLaiXe');
    if (dupLic.recordset.length > 0) {
      throw new AppError('Số giấy phép lái xe đã tồn tại trong hệ thống.', 409);
    }

    const maKH = await nextSqlCode(tx, 'KH', 'KHACH_HANG', 'MaKH', 2);

    await new sql.Request(tx)
      .input('MaKH', sql.VarChar(10), maKH)
      .input('HoVaTen', sql.NVarChar(100), String(HoVaTen).trim())
      .input('GioiTinh', sql.NVarChar(10), String(GioiTinh).trim())
      .input('DienThoai', sql.VarChar(15), String(DienThoai).trim())
      .input('SoDinhDanh', sql.VarChar(20), String(SoDinhDanh).trim())
      .input('GiayPhepLaiXe', sql.VarChar(20), String(GiayPhepLaiXe).trim())
      .input('HanGPLX', sql.Date, '2030-12-31')
      .input('email', sql.VarChar(100), String(email).trim())
      .input('DiaChi', sql.NVarChar(255), String(DiaChi).trim())
      .query(
        `INSERT INTO KHACH_HANG (MaKH, HoVaTen, GioiTinh, DienThoai, SoDinhDanh, GiayPhepLaiXe, HanGPLX, email, DiaChi, BiCamThue)
         VALUES (@MaKH, @HoVaTen, @GioiTinh, @DienThoai, @SoDinhDanh, @GiayPhepLaiXe, @HanGPLX, @email, @DiaChi, 0)`
      );

    await new sql.Request(tx)
      .input('TenDN', sql.VarChar(50), String(TenDN).trim())
      .input('MatKhau', sql.VarChar(255), bcrypt.hashSync(MatKhau, 8))
      .input('VaiTro', sql.NVarChar(30), ROLES.CUSTOMER)
      .input('MaKH', sql.VarChar(10), maKH)
      .query(
        `INSERT INTO TAI_KHOAN (TenDN, MatKhau, TrangThaiTaiKhoan, SoLanDangNhapSai, VaiTro, MaKH, MaNV)
         VALUES (@TenDN, @MatKhau, N'Hoạt động', 0, @VaiTro, @MaKH, NULL)`
      );

    await tx.commit();
    return { MaKH: maKH, TenDN: String(TenDN).trim(), VaiTro: ROLES.CUSTOMER };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function login(tenDN, matKhau) {
  const username = String(tenDN || '').trim();
  const password = String(matKhau || '');

  if (!username || !password) {
    throw new AppError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 400);
  }

  const pool = await getPool();
  const accRes = await pool
    .request()
    .input('TenDN', sql.VarChar(50), username)
    .query('SELECT * FROM TAI_KHOAN WHERE LOWER(TenDN) = LOWER(@TenDN)');

  const acc = accRes.recordset[0];
  if (!acc) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
  }
  if (acc.TrangThaiTaiKhoan === 'Vô hiệu hóa') {
    throw new AppError('Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa.', 403);
  }
  if (acc.TrangThaiTaiKhoan === 'Tạm khóa') {
    throw new AppError('Tài khoản đã bị tạm khóa do nhập sai quá 5 lần. Vui lòng liên hệ bộ phận hỗ trợ.', 403);
  }

  const valid = bcrypt.compareSync(password, acc.MatKhau);
  if (!valid) {
    const nextFails = acc.SoLanDangNhapSai + 1;
    const shouldLock = nextFails >= MAX_LOGIN_ATTEMPTS;
    await pool
      .request()
      .input('TenDN', sql.VarChar(50), acc.TenDN)
      .input('SoLan', sql.Int, nextFails)
      .input('TrangThai', sql.NVarChar(30), shouldLock ? 'Tạm khóa' : acc.TrangThaiTaiKhoan)
      .query(
        'UPDATE TAI_KHOAN SET SoLanDangNhapSai = @SoLan, TrangThaiTaiKhoan = @TrangThai WHERE TenDN = @TenDN'
      );

    if (shouldLock) {
      throw new AppError('Bạn đã nhập sai mật khẩu 5 lần. Tài khoản đã bị tạm khóa, vui lòng liên hệ hỗ trợ.', 403);
    }
    throw new AppError(`Tên đăng nhập hoặc mật khẩu không đúng (còn ${MAX_LOGIN_ATTEMPTS - nextFails} lần thử).`, 401);
  }

  await pool
    .request()
    .input('TenDN', sql.VarChar(50), acc.TenDN)
    .query('UPDATE TAI_KHOAN SET SoLanDangNhapSai = 0 WHERE TenDN = @TenDN');

  let hoTen = acc.TenDN;
  if (acc.VaiTro === ROLES.CUSTOMER && acc.MaKH) {
    const kh = await pool
      .request()
      .input('MaKH', sql.VarChar(10), acc.MaKH)
      .query('SELECT HoVaTen FROM KHACH_HANG WHERE MaKH = @MaKH');
    hoTen = kh.recordset[0]?.HoVaTen || acc.TenDN;
  } else if (acc.MaNV) {
    const nv = await pool
      .request()
      .input('MaNV', sql.VarChar(10), acc.MaNV)
      .query('SELECT HoTen FROM NHAN_VIEN WHERE MaNV = @MaNV');
    hoTen = nv.recordset[0]?.HoTen || acc.TenDN;
  }

  const user = {
    TenDN: acc.TenDN,
    VaiTro: acc.VaiTro,
    MaKH: acc.MaKH,
    MaNV: acc.MaNV,
    HoTen: hoTen,
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user };
}

module.exports = { register, login };
