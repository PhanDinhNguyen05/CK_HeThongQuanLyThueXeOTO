const { sql, getPool, nextSqlCode, toISODate, todayISO } = require('../config/db');
const { AppError } = require('../middleware/error.middleware');
const { isValidPhone, isValidLicense } = require('../middleware/validate.middleware');

function calcDays(from, to) {
  const diff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function mapContract(c) {
  return {
    ...c,
    NgayLap: toISODate(c.NgayLap),
    NgayBatDau: toISODate(c.NgayBatDau),
    NgayTra: toISODate(c.NgayTra),
    NgayTraThucTe: toISODate(c.NgayTraThucTe),
    TongTien: Number(c.TongTien),
    TienDatCoc: Number(c.TienDatCoc),
    TienDaThu: Number(c.TienDaThu),
    TienConNo: Number(c.TienConNo),
  };
}

function mapPenalty(p) {
  return {
    ...p,
    SoTienPhat: Number(p.SoTienPhat),
    NgayPhat: toISODate(p.NgayPhat),
  };
}

function mapExtension(r) {
  return {
    ...r,
    NgayGui: toISODate(r.NgayGui),
  };
}

async function listRentalHistory(user, { status = 'Tất cả', from = '', to = '' }) {
  if (from && to && from > to) {
    throw new AppError('Khoảng thời gian lọc không hợp lệ (Từ ngày sau Đến ngày).', 400);
  }
  const pool = await getPool();
  const req = pool.request();
  let where = 'WHERE 1=1';
  if (user.VaiTro === 'Khách hàng') {
    req.input('MaKH', sql.VarChar(10), user.MaKH);
    where += ' AND MaKH = @MaKH';
  }
  if (status && status !== 'Tất cả') {
    req.input('Status', sql.NVarChar(30), status);
    where += ' AND TrangThaiHopDong = @Status';
  }
  if (from) {
    req.input('From', sql.Date, from);
    where += ' AND NgayBatDau >= @From';
  }
  if (to) {
    req.input('To', sql.Date, to);
    where += ' AND NgayBatDau <= @To';
  }

  const res = await req.query(`SELECT * FROM HOP_DONG_THUE ${where} ORDER BY NgayLap DESC, MaHD DESC`);
  return res.recordset.map(mapContract);
}

async function getContractDetail(maHD, user) {
  const pool = await getPool();
  const res = await pool.request().input('MaHD', sql.VarChar(10), maHD).query('SELECT * FROM HOP_DONG_THUE WHERE MaHD = @MaHD');
  const hd = res.recordset[0];
  if (!hd) throw new AppError('Không tìm thấy hợp đồng phù hợp.', 404);
  if (user.VaiTro === 'Khách hàng' && hd.MaKH !== user.MaKH) {
    throw new AppError('Không tìm thấy hợp đồng phù hợp.', 404);
  }
  return mapContract(hd);
}

async function createRentalContract(maNV, payload) {
  const {
    MaDD = null,
    MaXe,
    MaKH = null,
    walkin = null,
    NgayNhan,
    NgayTra,
    TienDatCoc = 3000000,
    NoiDung = '',
    PhuongThuc = 'Tiền mặt',
  } = payload;

  if (!NgayNhan || !NgayTra || NgayTra <= NgayNhan) {
    throw new AppError('Ngày nhận và ngày trả xe không hợp lệ.', 400);
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const carRes = await new sql.Request(tx).input('MaXe', sql.VarChar(10), MaXe).query('SELECT * FROM XE WHERE MaXe = @MaXe');
    const car = carRes.recordset[0];
    if (!car || car.TrangThai !== 'Sẵn sàng') {
      throw new AppError('Xe được chọn không tồn tại hoặc không ở trạng thái Sẵn sàng.', 409);
    }

    const modelRes = await new sql.Request(tx)
      .input('MaMauXe', sql.VarChar(10), car.MaMauXe)
      .query('SELECT * FROM MAU_XE WHERE MaMauXe = @MaMauXe');
    const model = modelRes.recordset[0];

    let khId = MaKH;
    if (khId) {
      const khRes = await new sql.Request(tx)
        .input('MaKH', sql.VarChar(10), khId)
        .query('SELECT * FROM KHACH_HANG WHERE MaKH = @MaKH');
      const customer = khRes.recordset[0];
      if (!customer) throw new AppError('Không tìm thấy khách hàng.', 404);
      if (customer.BiCamThue) {
        throw new AppError('Khách hàng thuộc danh sách bị cấm thuê, không thể lập hợp đồng.', 403);
      }
      const han = toISODate(customer.HanGPLX);
      if (!customer.GiayPhepLaiXe || (han && han < todayISO())) {
        throw new AppError('Giấy phép lái xe của khách hàng thiếu hoặc đã hết hiệu lực.', 400);
      }
      const debtRes = await new sql.Request(tx)
        .input('MaKH', sql.VarChar(10), khId)
        .query("SELECT COUNT(*) AS DebtCount FROM KHOAN_PHAT WHERE MaKH = @MaKH AND TrangThaiThanhToan = N'Chưa thanh toán'");
      if (debtRes.recordset[0].DebtCount > 0) {
        throw new AppError('Khách hàng còn khoản nợ chưa thanh toán. Vui lòng thu nợ trước.', 409);
      }
    } else if (walkin) {
      if (!walkin.HoVaTen || !isValidPhone(walkin.DienThoai) || !isValidLicense(walkin.GiayPhepLaiXe)) {
        throw new AppError('Thông tin khách vãng lai (Tên, SĐT 10 số, GPLX) không hợp lệ.', 400);
      }
      khId = await nextSqlCode(tx, 'KH', 'KHACH_HANG', 'MaKH', 2);
      await new sql.Request(tx)
        .input('MaKH', sql.VarChar(10), khId)
        .input('HoVaTen', sql.NVarChar(100), String(walkin.HoVaTen).trim())
        .input('DienThoai', sql.VarChar(15), String(walkin.DienThoai).trim())
        .input('SoDinhDanh', sql.VarChar(20), String(walkin.SoDinhDanh || `VL-${khId}`).trim())
        .input('GiayPhepLaiXe', sql.VarChar(20), String(walkin.GiayPhepLaiXe).trim())
        .input('HanGPLX', sql.Date, '2030-12-31')
        .query(`
          INSERT INTO KHACH_HANG (MaKH, HoVaTen, GioiTinh, DienThoai, SoDinhDanh, GiayPhepLaiXe, HanGPLX, email, DiaChi, BiCamThue)
          VALUES (@MaKH, @HoVaTen, N'Khác', @DienThoai, @SoDinhDanh, @GiayPhepLaiXe, @HanGPLX, '', N'Khách vãng lai', 0)
        `);
      await new sql.Request(tx)
        .input('MaKH', sql.VarChar(10), khId)
        .query('INSERT INTO KHACH_VANG_LAI (MaKH) VALUES (@MaKH)');
    } else {
      throw new AppError('Vui lòng cung cấp khách hàng hoặc thông tin khách vãng lai.', 400);
    }

    const days = calcDays(NgayNhan, NgayTra);
    const total = Number(model?.GiaThueNgay || 0) * days;
    const maHD = await nextSqlCode(tx, 'HD', 'HOP_DONG_THUE', 'MaHD', 3);
    const soHD = `AUK-2026-${maHD.replace(/\D/g, '')}`;
    const today = todayISO();
    const content = String(NoiDung).trim() || `Thuê xe ${model?.TenMauXe} (${car.BienSo}) - ${days} ngày (${PhuongThuc})`;

    await new sql.Request(tx)
      .input('MaHD', sql.VarChar(10), maHD)
      .input('SoHD', sql.VarChar(20), soHD)
      .input('NgayLap', sql.Date, today)
      .input('NgayBatDau', sql.Date, NgayNhan)
      .input('NgayTra', sql.Date, NgayTra)
      .input('TongTien', sql.Decimal(15, 2), total)
      .input('TienDatCoc', sql.Decimal(15, 2), Number(TienDatCoc) || 0)
      .input('TienDaThu', sql.Decimal(15, 2), total)
      .input('NoiDung', sql.NVarChar(500), content)
      .input('MaDD', sql.VarChar(10), MaDD)
      .input('MaXe', sql.VarChar(10), MaXe)
      .input('MaNV', sql.VarChar(10), maNV || 'NV001')
      .input('MaKH', sql.VarChar(10), khId)
      .query(`
        INSERT INTO HOP_DONG_THUE (MaHD, SoHD, NgayLap, NgayBatDau, NgayTra, NgayTraThucTe, TongTien, TienDatCoc, TienDaThu, TienConNo, NoiDung, TrangThaiHopDong, MucNhienLieuGiao, MaDD, MaXe, MaNV, MaKH)
        VALUES (@MaHD, @SoHD, @NgayLap, @NgayBatDau, @NgayTra, NULL, @TongTien, @TienDatCoc, @TienDaThu, 0, @NoiDung, N'Đang thuê', N'Đầy bình (100%)', @MaDD, @MaXe, @MaNV, @MaKH)
      `);

    await new sql.Request(tx)
      .input('MaXe', sql.VarChar(10), MaXe)
      .query("UPDATE XE SET TrangThai = N'Đang thuê' WHERE MaXe = @MaXe");

    if (MaDD) {
      await new sql.Request(tx)
        .input('MaDD', sql.VarChar(10), MaDD)
        .query("UPDATE DON_DAT_XE SET TrangThai = N'Đã thực hiện' WHERE MaDD = @MaDD");
    }

    await tx.commit();
    return {
      MaHD: maHD,
      SoHD: soHD,
      MaDD,
      MaXe,
      MaNV: maNV || 'NV001',
      MaKH: khId,
      NgayLap: today,
      NgayBatDau: NgayNhan,
      NgayTra,
      NgayTraThucTe: null,
      TongTien: total,
      TienDatCoc: Number(TienDatCoc) || 0,
      TienDaThu: total,
      TienConNo: 0,
      NoiDung: content,
      TrangThaiHopDong: 'Đang thuê',
      MucNhienLieuGiao: 'Đầy bình (100%)',
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function processReturnCar(maHD, { NgayTraThucTe, MucNhienLieu, TinhTrangXe, GhiChu = '' }) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const hdRes = await new sql.Request(tx)
      .input('MaHD', sql.VarChar(10), maHD)
      .query('SELECT * FROM HOP_DONG_THUE WHERE MaHD = @MaHD');
    const hd = hdRes.recordset[0];
    if (!hd || hd.TrangThaiHopDong !== 'Đang thuê') {
      throw new AppError('Không tìm thấy hợp đồng đang thuê phù hợp.', 404);
    }

    const returnDate = NgayTraThucTe || todayISO();
    const curNgayTra = toISODate(hd.NgayTra);
    const nextNoiDung = GhiChu ? `${hd.NoiDung} | Trả xe: ${GhiChu}` : hd.NoiDung;
    const nextCarStatus = TinhTrangXe === 'Hư hỏng' ? 'Bảo trì' : 'Sẵn sàng';

    await new sql.Request(tx)
      .input('MaHD', sql.VarChar(10), maHD)
      .input('NgayTraThucTe', sql.Date, returnDate)
      .input('NoiDung', sql.NVarChar(500), nextNoiDung)
      .query("UPDATE HOP_DONG_THUE SET TrangThaiHopDong = N'Hoàn tất', NgayTraThucTe = @NgayTraThucTe, NoiDung = @NoiDung WHERE MaHD = @MaHD");

    await new sql.Request(tx)
      .input('MaXe', sql.VarChar(10), hd.MaXe)
      .input('TrangThai', sql.NVarChar(30), nextCarStatus)
      .query('UPDATE XE SET TrangThai = @TrangThai WHERE MaXe = @MaXe');

    const generatedPenalties = [];
    const lateDays = returnDate > curNgayTra ? calcDays(curNgayTra, returnDate) : 0;
    if (lateDays > 0) {
      generatedPenalties.push({
        LoaiViPham: 'Trả xe trễ hạn',
        MoTa: `Trễ ${lateDays} ngày so với hạn trả ${curNgayTra}`,
        SoTienPhat: lateDays * 300000,
      });
    }
    if (MucNhienLieu && MucNhienLieu !== 'Đầy bình (100%)') {
      generatedPenalties.push({
        LoaiViPham: 'Thiếu nhiên liệu',
        MoTa: `Mức nhiên liệu khi trả: ${MucNhienLieu}`,
        SoTienPhat: 250000,
      });
    }
    if (TinhTrangXe && TinhTrangXe !== 'Bình thường') {
      generatedPenalties.push({
        LoaiViPham: 'Hư hỏng xe',
        MoTa: `Tình trạng thực tế: ${TinhTrangXe}${GhiChu ? ` (${GhiChu})` : ''}`,
        SoTienPhat: TinhTrangXe === 'Hư hỏng' ? 1500000 : 400000,
      });
    }

    const insertedPenalties = [];
    for (const item of generatedPenalties) {
      const maPhat = await nextSqlCode(tx, 'PH', 'KHOAN_PHAT', 'MaKhoanPhat', 3);
      await new sql.Request(tx)
        .input('MaKhoanPhat', sql.VarChar(10), maPhat)
        .input('MaHD', sql.VarChar(10), hd.MaHD)
        .input('MaKH', sql.VarChar(10), hd.MaKH)
        .input('LoaiViPham', sql.NVarChar(100), item.LoaiViPham)
        .input('MoTa', sql.NVarChar(255), item.MoTa)
        .input('SoTienPhat', sql.Decimal(15, 2), item.SoTienPhat)
        .input('NgayPhat', sql.Date, returnDate)
        .query(`
          INSERT INTO KHOAN_PHAT (MaKhoanPhat, MaHD, MaKH, LoaiViPham, MoTa, SoTienPhat, NgayPhat, TrangThaiThanhToan)
          VALUES (@MaKhoanPhat, @MaHD, @MaKH, @LoaiViPham, @MoTa, @SoTienPhat, @NgayPhat, N'Chưa thanh toán')
        `);
      insertedPenalties.push({
        MaKhoanPhat: maPhat,
        MaHD: hd.MaHD,
        MaKH: hd.MaKH,
        ...item,
        NgayPhat: returnDate,
        TrangThaiThanhToan: 'Chưa thanh toán',
      });
    }

    await tx.commit();
    return {
      contract: {
        ...mapContract(hd),
        TrangThaiHopDong: 'Hoàn tất',
        NgayTraThucTe: returnDate,
        NoiDung: nextNoiDung,
      },
      carStatus: nextCarStatus,
      generatedPenalties: insertedPenalties,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function listPenalties() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT * FROM KHOAN_PHAT ORDER BY NgayPhat DESC, MaKhoanPhat DESC');
  return res.recordset.map(mapPenalty);
}

async function createPenalty({ MaHD, LoaiViPham, MoTa, SoTienPhat }) {
  const amount = Number(SoTienPhat);
  if (Number.isNaN(amount) || amount <= 0) throw new AppError('Mức phạt phải là số dương hợp lệ.', 400);

  const pool = await getPool();
  const hdRes = await pool.request().input('MaHD', sql.VarChar(10), MaHD).query('SELECT MaHD, MaKH FROM HOP_DONG_THUE WHERE MaHD = @MaHD');
  const hd = hdRes.recordset[0];
  if (!hd) throw new AppError('Không tìm thấy hợp đồng thuê xe.', 404);

  const maPhat = await nextSqlCode(pool, 'PH', 'KHOAN_PHAT', 'MaKhoanPhat', 3);
  const today = todayISO();

  await pool
    .request()
    .input('MaKhoanPhat', sql.VarChar(10), maPhat)
    .input('MaHD', sql.VarChar(10), hd.MaHD)
    .input('MaKH', sql.VarChar(10), hd.MaKH)
    .input('LoaiViPham', sql.NVarChar(100), LoaiViPham)
    .input('MoTa', sql.NVarChar(255), String(MoTa).trim())
    .input('SoTienPhat', sql.Decimal(15, 2), amount)
    .input('NgayPhat', sql.Date, today)
    .query(`
      INSERT INTO KHOAN_PHAT (MaKhoanPhat, MaHD, MaKH, LoaiViPham, MoTa, SoTienPhat, NgayPhat, TrangThaiThanhToan)
      VALUES (@MaKhoanPhat, @MaHD, @MaKH, @LoaiViPham, @MoTa, @SoTienPhat, @NgayPhat, N'Chưa thanh toán')
    `);

  return {
    MaKhoanPhat: maPhat,
    MaHD: hd.MaHD,
    MaKH: hd.MaKH,
    LoaiViPham,
    MoTa: String(MoTa).trim(),
    SoTienPhat: amount,
    NgayPhat: today,
    TrangThaiThanhToan: 'Chưa thanh toán',
  };
}

async function requestContractExtension(maHD, maKH, { NgayTraDeNghi, LyDo = '' }) {
  const pool = await getPool();
  const hdRes = await pool.request().input('MaHD', sql.VarChar(10), maHD).query('SELECT * FROM HOP_DONG_THUE WHERE MaHD = @MaHD');
  const hd = hdRes.recordset[0];
  if (!hd || hd.MaKH !== maKH) throw new AppError('Không tìm thấy hợp đồng phù hợp.', 404);
  if (hd.TrangThaiHopDong !== 'Đang thuê') {
    throw new AppError('Chỉ được gia hạn hợp đồng đang ở trạng thái Đang thuê.', 409);
  }
  const curNgayTra = toISODate(hd.NgayTra);
  if (!NgayTraDeNghi || NgayTraDeNghi <= curNgayTra) {
    throw new AppError('Ngày trả đề nghị phải sau ngày trả hiện tại.', 400);
  }

  const debtRes = await pool
    .request()
    .input('MaHD', sql.VarChar(10), maHD)
    .query("SELECT COUNT(*) AS Unpaid FROM KHOAN_PHAT WHERE MaHD = @MaHD AND TrangThaiThanhToan = N'Chưa thanh toán'");
  if (Number(hd.TienConNo) > 0 || debtRes.recordset[0].Unpaid > 0) {
    throw new AppError('Hợp đồng còn khoản chưa thanh toán. Vui lòng thanh toán trước khi gia hạn.', 400);
  }

  const pendRes = await pool
    .request()
    .input('MaDoiTuong', sql.VarChar(10), maHD)
    .query("SELECT MaYC FROM YEU_CAU_GIA_HAN WHERE LoaiYeuCau = N'Gia hạn hợp đồng' AND MaDoiTuong = @MaDoiTuong AND TrangThai = N'Chờ xét duyệt'");
  if (pendRes.recordset.length > 0) {
    throw new AppError('Hợp đồng này đã có yêu cầu gia hạn đang chờ xét duyệt.', 409);
  }

  const maYC = await nextSqlCode(pool, 'YC', 'YEU_CAU_GIA_HAN', 'MaYC', 3);
  const today = todayISO();
  const reason = String(LyDo).trim() || 'Gia hạn hợp đồng đang thuê';

  await pool
    .request()
    .input('MaYC', sql.VarChar(10), maYC)
    .input('MaDoiTuong', sql.VarChar(10), maHD)
    .input('MaKH', sql.VarChar(10), maKH)
    .input('Goi', sql.NVarChar(100), NgayTraDeNghi)
    .input('LyDo', sql.NVarChar(255), reason)
    .input('NgayGui', sql.Date, today)
    .query(`
      INSERT INTO YEU_CAU_GIA_HAN (MaYC, LoaiYeuCau, MaDoiTuong, MaKH, GoiHoacNgayDeNghi, LyDo, NgayGui, TrangThai, LyDoTuChoi)
      VALUES (@MaYC, N'Gia hạn hợp đồng', @MaDoiTuong, @MaKH, @Goi, @LyDo, @NgayGui, N'Chờ xét duyệt', N'')
    `);

  return {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn hợp đồng',
    MaDoiTuong: maHD,
    MaKH: maKH,
    GoiHoacNgayDeNghi: NgayTraDeNghi,
    LyDo: reason,
    NgayGui: today,
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
}

async function listExtensionRequests() {
  const pool = await getPool();
  const res = await pool.request().query('SELECT * FROM YEU_CAU_GIA_HAN ORDER BY NgayGui DESC, MaYC DESC');
  return res.recordset.map(mapExtension);
}

async function reviewExtensionRequest(maYC, { action, lyDoTuChoi = '' }) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const reqRes = await new sql.Request(tx)
      .input('MaYC', sql.VarChar(10), maYC)
      .query('SELECT * FROM YEU_CAU_GIA_HAN WHERE MaYC = @MaYC');
    const reqItem = reqRes.recordset[0];
    if (!reqItem) throw new AppError('Không tìm thấy yêu cầu gia hạn.', 404);
    if (reqItem.TrangThai !== 'Chờ xét duyệt') {
      throw new AppError('Yêu cầu gia hạn này đã được xử lý trước đó.', 409);
    }

    if (action === 'approve') {
      if (reqItem.LoaiYeuCau === 'Gia hạn thành viên') {
        const tvRes = await new sql.Request(tx)
          .input('MaTV', sql.VarChar(10), reqItem.MaDoiTuong)
          .query('SELECT * FROM THANH_VIEN WHERE MaTV = @MaTV');
        const mem = tvRes.recordset[0];
        if (mem) {
          const d = new Date(toISODate(mem.NgayHetHan));
          const months = reqItem.GoiHoacNgayDeNghi.includes('6 Tháng')
            ? 6
            : reqItem.GoiHoacNgayDeNghi.includes('2 Năm')
            ? 24
            : 12;
          d.setMonth(d.getMonth() + months);
          await new sql.Request(tx)
            .input('MaTV', sql.VarChar(10), reqItem.MaDoiTuong)
            .input('NgayHetHan', sql.Date, d.toISOString().slice(0, 10))
            .query("UPDATE THANH_VIEN SET NgayHetHan = @NgayHetHan, TinhTrang = N'Hoạt động' WHERE MaTV = @MaTV");
        }
      } else if (reqItem.LoaiYeuCau === 'Gia hạn hợp đồng') {
        await new sql.Request(tx)
          .input('MaHD', sql.VarChar(10), reqItem.MaDoiTuong)
          .input('NgayTra', sql.Date, reqItem.GoiHoacNgayDeNghi)
          .query('UPDATE HOP_DONG_THUE SET NgayTra = @NgayTra WHERE MaHD = @MaHD');
      } else if (reqItem.LoaiYeuCau === 'Gia hạn đặt chỗ') {
        const bkRes = await new sql.Request(tx)
          .input('MaDD', sql.VarChar(10), reqItem.MaDoiTuong)
          .query(`
            SELECT d.*, m.GiaThueNgay FROM DON_DAT_XE d
            JOIN MAU_XE m ON m.MaMauXe = d.MaMauXe
            WHERE d.MaDD = @MaDD
          `);
        const bk = bkRes.recordset[0];
        if (bk) {
          const days = calcDays(toISODate(bk.NgayNhan), reqItem.GoiHoacNgayDeNghi);
          const newTotal = days > 0 ? Number(bk.GiaThueNgay) * days : Number(bk.TongGia);
          await new sql.Request(tx)
            .input('MaDD', sql.VarChar(10), reqItem.MaDoiTuong)
            .input('NgayTra', sql.Date, reqItem.GoiHoacNgayDeNghi)
            .input('TongGia', sql.Decimal(15, 2), newTotal)
            .query('UPDATE DON_DAT_XE SET NgayTra = @NgayTra, TongGia = @TongGia WHERE MaDD = @MaDD');
        }
      }

      await new sql.Request(tx)
        .input('MaYC', sql.VarChar(10), maYC)
        .query("UPDATE YEU_CAU_GIA_HAN SET TrangThai = N'Đã phê duyệt' WHERE MaYC = @MaYC");
      await tx.commit();
      return { ...mapExtension(reqItem), TrangThai: 'Đã phê duyệt' };
    }

    if (action === 'reject') {
      if (!String(lyDoTuChoi).trim()) throw new AppError('Vui lòng nhập lý do từ chối.', 400);
      await new sql.Request(tx)
        .input('MaYC', sql.VarChar(10), maYC)
        .input('LyDoTuChoi', sql.NVarChar(255), String(lyDoTuChoi).trim())
        .query("UPDATE YEU_CAU_GIA_HAN SET TrangThai = N'Từ chối', LyDoTuChoi = @LyDoTuChoi WHERE MaYC = @MaYC");
      await tx.commit();
      return { ...mapExtension(reqItem), TrangThai: 'Từ chối', LyDoTuChoi: String(lyDoTuChoi).trim() };
    }

    throw new AppError('Hành động không hợp lệ.', 400);
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = {
  listRentalHistory,
  getContractDetail,
  createRentalContract,
  processReturnCar,
  listPenalties,
  createPenalty,
  requestContractExtension,
  listExtensionRequests,
  reviewExtensionRequest,
};
