const { getStore, nextCode, todayISO } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');

function listMaintenance(maXe = '') {
  const list = getStore().baoDuong;
  return maXe ? list.filter((b) => b.MaXe === maXe) : list;
}

function createMaintenance(maNV, { MaXe, NoiDungBaoDuong, PhiBaoDuong, SoChungTu = '' }) {
  const store = getStore();
  if (!store.xe.some((x) => x.MaXe === MaXe)) {
    throw new AppError('Không tìm thấy xe.', 404);
  }
  const fee = Number(PhiBaoDuong);
  if (Number.isNaN(fee) || fee < 0) {
    throw new AppError('Phí bảo dưỡng không hợp lệ.', 400);
  }
  const code = nextCode('BD', 'baoDuong', 'MaBaoDuong');
  const item = {
    MaBaoDuong: code,
    MaXe,
    MaNV: maNV,
    NgayBaoDuong: todayISO(),
    NoiDungBaoDuong: String(NoiDungBaoDuong).trim(),
    PhiBaoDuong: fee,
    SoChungTu: SoChungTu ? String(SoChungTu).trim() : `CT-${code}`,
  };
  store.baoDuong.unshift(item);
  return item;
}

function listIncidents() {
  return getStore().suCo;
}

function createIncident({ MaHD, LoaiSuCo, MoTa, ViTri, ChiPhiPhatSinh = 0, ChuyenPhapChe = false }) {
  const store = getStore();
  const hd = store.hopDongThue.find((c) => c.MaHD === MaHD);
  if (!hd) throw new AppError('Không tìm thấy hợp đồng thuê xe.', 404);

  const code = nextCode('SC', 'suCo', 'MaSuCo');
  const item = {
    MaSuCo: code,
    MaHD,
    MaXe: hd.MaXe,
    LoaiSuCo,
    MoTa: String(MoTa).trim(),
    ViTri: String(ViTri).trim(),
    ChiPhiPhatSinh: Number(ChiPhiPhatSinh) || 0,
    ChuyenPhapChe: Boolean(ChuyenPhapChe),
    NgayGhiNhan: todayISO(),
    TrangThai: ChuyenPhapChe ? 'Đã chuyển Phòng Pháp chế' : 'Đã ghi nhận',
  };
  store.suCo.unshift(item);

  if (LoaiSuCo === 'Tai nạn / Hư hỏng nghiêm trọng') {
    const car = store.xe.find((x) => x.MaXe === hd.MaXe);
    if (car) car.TrangThai = 'Bảo trì';
  }
  return item;
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/maintenance.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
      listMaintenance,
      createMaintenance,
      listIncidents,
      createIncident,
    };
