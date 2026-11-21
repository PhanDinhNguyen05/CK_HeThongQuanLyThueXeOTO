const { getStore, nextCode, todayISO, calcDays } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');
const { isValidPhone, isValidLicense } = require('../middleware/validate.middleware');

function listRentalHistory(user, { status = 'Tất cả', from = '', to = '' }) {
  const store = getStore();
  if (from && to && from > to) {
    throw new AppError('Khoảng thời gian lọc không hợp lệ (Từ ngày sau Đến ngày).', 400);
  }
  return store.hopDongThue.filter((c) => {
    const matchOwner = user.VaiTro !== 'Khách hàng' || c.MaKH === user.MaKH;
    const matchStatus = status === 'Tất cả' || c.TrangThaiHopDong === status;
    const matchFrom = !from || c.NgayBatDau >= from;
    const matchTo = !to || c.NgayBatDau <= to;
    return matchOwner && matchStatus && matchFrom && matchTo;
  });
}

function getContractDetail(maHD, user) {
  const store = getStore();
  const hd = store.hopDongThue.find((c) => c.MaHD === maHD);
  if (!hd) throw new AppError('Không tìm thấy hợp đồng phù hợp.', 404);
  if (user.VaiTro === 'Khách hàng' && hd.MaKH !== user.MaKH) {
    throw new AppError('Không tìm thấy hợp đồng phù hợp.', 404);
  }
  return hd;
}

function createRentalContract(maNV, payload) {
  const store = getStore();
  const { MaXe, MaDD = null, MaKH = null, walkin = null, NgayNhan, NgayTra, TienDatCoc = 3000000, NoiDung = '' } = payload;

  const car = store.xe.find((x) => x.MaXe === MaXe);
  if (!car || car.TrangThai !== 'Sẵn sàng') {
    throw new AppError('Xe không tồn tại hoặc không ở trạng thái Sẵn sàng.', 409);
  }
  if (!NgayNhan || !NgayTra || NgayTra <= NgayNhan) {
    throw new AppError('Thời gian thuê không hợp lệ.', 400);
  }

  let customerId = MaKH;
  if (walkin) {
    if (!walkin.HoVaTen || !isValidPhone(walkin.DienThoai) || !isValidLicense(walkin.GiayPhepLaiXe)) {
      throw new AppError('Thông tin khách vãng lai (Họ tên, SĐT 10 số, GPLX) không hợp lệ.', 400);
    }
    customerId = nextCode('KH', 'khachHang', 'MaKH');
    store.khachHang.push({
      MaKH: customerId,
      HoVaTen: String(walkin.HoVaTen).trim(),
      GioiTinh: 'Khác',
      DienThoai: String(walkin.DienThoai).trim(),
      SoDinhDanh: walkin.SoDinhDanh || `VL-${customerId}`,
      GiayPhepLaiXe: String(walkin.GiayPhepLaiXe).trim(),
      HanGPLX: '2030-12-31',
      email: '',
      DiaChi: 'Khách vãng lai',
      BiCamThue: false,
    });
  } else {
    const kh = store.khachHang.find((c) => c.MaKH === customerId);
    if (!kh) throw new AppError('Không tìm thấy hồ sơ khách hàng.', 404);
    if (kh.BiCamThue) throw new AppError('Khách hàng đang bị cấm thuê.', 403);
    if (!kh.GiayPhepLaiXe || (kh.HanGPLX && kh.HanGPLX < todayISO())) {
      throw new AppError('Giấy phép lái xe không hợp lệ hoặc đã hết hạn.', 400);
    }
    const hasDebt =
      store.hopDongThue.some((c) => c.MaKH === customerId && c.TienConNo > 0) ||
      store.khoanPhat.some((p) => p.MaKH === customerId && p.TrangThaiThanhToan === 'Chưa thanh toán');
    if (hasDebt) {
      throw new AppError('Khách hàng còn khoản nợ chưa thanh toán.', 409);
    }
  }

  const model = store.mauXe.find((m) => m.MaMauXe === car.MaMauXe);
  const days = calcDays(NgayNhan, NgayTra);
  const total = (model?.GiaThueNgay || 0) * days;
  const maHD = nextCode('HD', 'hopDongThue', 'MaHD');

  const contract = {
    MaHD: maHD,
    SoHD: `AUK-2026-${maHD.replace(/\D/g, '')}`,
    MaDD,
    MaXe,
    MaNV: maNV,
    MaKH: customerId,
    NgayLap: todayISO(),
    NgayBatDau: NgayNhan,
    NgayTra,
    NgayTraThucTe: null,
    TongTien: total,
    TienDatCoc: Number(TienDatCoc) || 0,
    TienDaThu: total,
    TienConNo: 0,
    NoiDung: NoiDung || `Thuê xe ${model?.TenMauXe} (${car.BienSo}) - ${days} ngày`,
    TrangThaiHopDong: 'Đang thuê',
    MucNhienLieuGiao: 'Đầy bình (100%)',
  };

  store.hopDongThue.unshift(contract);
  car.TrangThai = 'Đang thuê';
  if (MaDD) {
    const bk = store.donDatXe.find((b) => b.MaDD === MaDD);
    if (bk) bk.TrangThai = 'Đã thực hiện';
  }
  return contract;
}

function processReturnCar(maHD, { NgayTraThucTe, MucNhienLieu, TinhTrangXe, GhiChu = '' }) {
  const store = getStore();
  const hd = store.hopDongThue.find((c) => c.MaHD === maHD);
  if (!hd) throw new AppError('Không tìm thấy hợp đồng thuê xe.', 404);
  if (hd.TrangThaiHopDong !== 'Đang thuê') {
    throw new AppError('Hợp đồng không ở trạng thái Đang thuê.', 409);
  }
  const car = store.xe.find((x) => x.MaXe === hd.MaXe);
  hd.TrangThaiHopDong = 'Hoàn tất';
  hd.NgayTraThucTe = NgayTraThucTe || todayISO();
  if (GhiChu) hd.NoiDung = `${hd.NoiDung} | Trả xe: ${GhiChu}`;

  if (car) {
    car.TrangThai = TinhTrangXe === 'Hư hỏng' ? 'Bảo trì' : 'Sẵn sàng';
  }

  const createdPenalties = [];
  if (hd.NgayTraThucTe > hd.NgayTra) {
    const lateDays = calcDays(hd.NgayTra, hd.NgayTraThucTe);
    const p = {
      MaKhoanPhat: nextCode('PH', 'khoanPhat', 'MaKhoanPhat'),
      MaHD: hd.MaHD,
      MaKH: hd.MaKH,
      LoaiViPham: 'Trả xe trễ hạn',
      MoTa: `Trễ ${lateDays} ngày`,
      SoTienPhat: lateDays * 300000,
      NgayPhat: hd.NgayTraThucTe,
      TrangThaiThanhToan: 'Chưa thanh toán',
    };
    store.khoanPhat.unshift(p);
    createdPenalties.push(p);
  }
  if (MucNhienLieu && MucNhienLieu !== 'Đầy bình (100%)') {
    const p = {
      MaKhoanPhat: nextCode('PH', 'khoanPhat', 'MaKhoanPhat'),
      MaHD: hd.MaHD,
      MaKH: hd.MaKH,
      LoaiViPham: 'Thiếu nhiên liệu',
      MoTa: `Mức nhiên liệu khi trả: ${MucNhienLieu}`,
      SoTienPhat: 250000,
      NgayPhat: hd.NgayTraThucTe,
      TrangThaiThanhToan: 'Chưa thanh toán',
    };
    store.khoanPhat.unshift(p);
    createdPenalties.push(p);
  }
  if (TinhTrangXe && TinhTrangXe !== 'Bình thường') {
    const p = {
      MaKhoanPhat: nextCode('PH', 'khoanPhat', 'MaKhoanPhat'),
      MaHD: hd.MaHD,
      MaKH: hd.MaKH,
      LoaiViPham: 'Hư hỏng xe',
      MoTa: `Tình trạng: ${TinhTrangXe}`,
      SoTienPhat: TinhTrangXe === 'Hư hỏng' ? 1500000 : 400000,
      NgayPhat: hd.NgayTraThucTe,
      TrangThaiThanhToan: 'Chưa thanh toán',
    };
    store.khoanPhat.unshift(p);
    createdPenalties.push(p);
  }

  return { contract: hd, car, createdPenalties };
}

function createPenalty({ MaHD, LoaiViPham, MoTa, SoTienPhat }) {
  const store = getStore();
  const hd = store.hopDongThue.find((c) => c.MaHD === MaHD);
  if (!hd) throw new AppError('Không xác định được hợp đồng thuê xe.', 404);
  const amount = Number(SoTienPhat);
  if (Number.isNaN(amount) || amount <= 0) throw new AppError('Mức phạt phải là số dương.', 400);

  const p = {
    MaKhoanPhat: nextCode('PH', 'khoanPhat', 'MaKhoanPhat'),
    MaHD,
    MaKH: hd.MaKH,
    LoaiViPham,
    MoTa: String(MoTa).trim(),
    SoTienPhat: amount,
    NgayPhat: todayISO(),
    TrangThaiThanhToan: 'Chưa thanh toán',
  };
  store.khoanPhat.unshift(p);
  return p;
}

function requestContractExtension(maHD, maKH, { NgayTraDeNghi }) {
  const store = getStore();
  const hd = store.hopDongThue.find((c) => c.MaHD === maHD && c.MaKH === maKH);
  if (!hd || hd.TrangThaiHopDong !== 'Đang thuê') {
    throw new AppError('Hợp đồng không tồn tại hoặc không ở trạng thái Đang thuê.', 404);
  }
  if (!NgayTraDeNghi || NgayTraDeNghi <= hd.NgayTra) {
    throw new AppError('Ngày trả đề nghị phải sau ngày trả hiện tại.', 400);
  }
  const hasDebt =
    hd.TienConNo > 0 ||
    store.khoanPhat.some((p) => p.MaHD === maHD && p.TrangThaiThanhToan === 'Chưa thanh toán');
  if (hasDebt) throw new AppError('Hợp đồng còn khoản chưa thanh toán.', 409);

  const hasPending = store.yeuCauGiaHan.some(
    (r) => r.LoaiYeuCau === 'Gia hạn hợp đồng' && r.MaDoiTuong === maHD && r.TrangThai === 'Chờ xét duyệt'
  );
  if (hasPending) throw new AppError('Hợp đồng đã có yêu cầu gia hạn đang chờ xét duyệt.', 409);

  const maYC = nextCode('YC', 'yeuCauGiaHan', 'MaYC');
  const reqItem = {
    MaYC: maYC,
    LoaiYeuCau: 'Gia hạn hợp đồng',
    MaDoiTuong: maHD,
    MaKH: maKH,
    GoiHoacNgayDeNghi: NgayTraDeNghi,
    LyDo: 'Gia hạn hợp đồng đang thuê',
    NgayGui: todayISO(),
    TrangThai: 'Chờ xét duyệt',
    LyDoTuChoi: '',
  };
  store.yeuCauGiaHan.unshift(reqItem);
  return reqItem;
}

function listExtensionRequests() {
  return getStore().yeuCauGiaHan;
}

function reviewExtensionRequest(maYC, { action, lyDoTuChoi = '' }) {
  const store = getStore();
  const reqItem = store.yeuCauGiaHan.find((r) => r.MaYC === maYC);
  if (!reqItem) throw new AppError('Không tìm thấy yêu cầu gia hạn.', 404);
  if (reqItem.TrangThai !== 'Chờ xét duyệt') {
    throw new AppError('Yêu cầu này đã được xử lý trước đó.', 409);
  }

  if (action === 'approve') {
    if (reqItem.LoaiYeuCau === 'Gia hạn thành viên') {
      const tv = store.thanhVien.find((m) => m.MaTV === reqItem.MaDoiTuong);
      if (tv) {
        const d = new Date(tv.NgayHetHan);
        const months = reqItem.GoiHoacNgayDeNghi.includes('6 Tháng')
          ? 6
          : reqItem.GoiHoacNgayDeNghi.includes('2 Năm')
          ? 24
          : 12;
        d.setMonth(d.getMonth() + months);
        tv.NgayHetHan = d.toISOString().slice(0, 10);
        tv.TinhTrang = 'Hoạt động';
      }
    } else if (reqItem.LoaiYeuCau === 'Gia hạn hợp đồng') {
      const hd = store.hopDongThue.find((c) => c.MaHD === reqItem.MaDoiTuong);
      if (hd) hd.NgayTra = reqItem.GoiHoacNgayDeNghi;
    } else if (reqItem.LoaiYeuCau === 'Gia hạn đặt chỗ') {
      const dd = store.donDatXe.find((b) => b.MaDD === reqItem.MaDoiTuong);
      if (dd) {
        dd.NgayTra = reqItem.GoiHoacNgayDeNghi;
        const model = store.mauXe.find((m) => m.MaMauXe === dd.MaMauXe);
        const days = calcDays(dd.NgayNhan, dd.NgayTra);
        if (model && days > 0) dd.TongGia = model.GiaThueNgay * days;
      }
    }
    reqItem.TrangThai = 'Đã phê duyệt';
  } else if (action === 'reject') {
    if (!String(lyDoTuChoi).trim()) throw new AppError('Vui lòng nhập lý do từ chối.', 400);
    reqItem.TrangThai = 'Từ chối';
    reqItem.LyDoTuChoi = String(lyDoTuChoi).trim();
  } else {
    throw new AppError('Hành động không hợp lệ.', 400);
  }
  return reqItem;
}

function listPenalties() {
  return getStore().khoanPhat;
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/rental.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
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
