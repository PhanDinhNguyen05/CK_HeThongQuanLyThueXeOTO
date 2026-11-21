const { getStore, nextCode } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');

function searchCarModels({ keyword = '', maPhanKhuc = '', maxPrice = '' }) {
  const store = getStore();
  const kw = String(keyword).trim().toLowerCase();
  return store.mauXe
    .filter((m) => {
      const matchName = !kw || m.TenMauXe.toLowerCase().includes(kw) || m.MaMauXe.toLowerCase().includes(kw);
      const matchSeg = !maPhanKhuc || m.MaPhanKhuc === maPhanKhuc;
      const matchPrice = !maxPrice || Number(m.GiaThueNgay) <= Number(maxPrice);
      return matchName && matchSeg && matchPrice;
    })
    .map((m) => ({
      ...m,
      TenPhanKhuc: store.phanKhucXe.find((s) => s.MaPhanKhuc === m.MaPhanKhuc)?.TenPhanKhuc || '',
      TenHang: store.hangXe.find((h) => h.MaHang === m.MaHang)?.TenHang || '',
      SoXeSanSang: store.xe.filter((x) => x.MaMauXe === m.MaMauXe && x.TrangThai === 'Sẵn sàng').length,
    }));
}

function getCarModelById(maMauXe) {
  const store = getStore();
  const model = store.mauXe.find((m) => m.MaMauXe === maMauXe);
  if (!model) throw new AppError('Mẫu xe không tồn tại.', 404);
  return {
    ...model,
    TenPhanKhuc: store.phanKhucXe.find((s) => s.MaPhanKhuc === model.MaPhanKhuc)?.TenPhanKhuc || '',
    TenHang: store.hangXe.find((h) => h.MaHang === model.MaHang)?.TenHang || '',
    SoXeSanSang: store.xe.filter((x) => x.MaMauXe === model.MaMauXe && x.TrangThai === 'Sẵn sàng').length,
  };
}

function createCarModel(payload) {
  const store = getStore();
  const { TenMauXe, GiaThueNgay, MaPhanKhuc, MaHang, DongCo } = payload;
  const price = Number(GiaThueNgay);
  if (Number.isNaN(price) || price <= 0) {
    throw new AppError('Giá thuê ngày phải là số dương hợp lệ.', 400);
  }
  if (!store.phanKhucXe.some((s) => s.MaPhanKhuc === MaPhanKhuc)) {
    throw new AppError('Phân khúc xe không hợp lệ.', 400);
  }
  if (!store.hangXe.some((h) => h.MaHang === MaHang)) {
    throw new AppError('Hãng xe / Nhà cung cấp không hợp lệ.', 400);
  }
  const duplicate = store.mauXe.some(
    (m) =>
      m.TenMauXe.toLowerCase() === String(TenMauXe).trim().toLowerCase() &&
      m.MaHang === MaHang &&
      m.DongCo.toLowerCase() === String(DongCo).trim().toLowerCase()
  );
  if (duplicate) {
    throw new AppError('Mẫu xe với cấu hình nhận diện này đã tồn tại.', 409);
  }

  const maMauXe = nextCode('MX', 'mauXe', 'MaMauXe');
  const item = {
    MaMauXe: maMauXe,
    TenMauXe: String(TenMauXe).trim(),
    MaPhanKhuc,
    MaHang,
    GiaThueNgay: price,
    SoChoNgoi: Number(payload.SoChoNgoi) || 5,
    HopSo: payload.HopSo || 'Số tự động',
    NhienLieu: payload.NhienLieu || 'Xăng',
    DongCo: String(DongCo).trim(),
    MoTa: payload.MoTa || '',
    NoiDungQuangBa: payload.NoiDungQuangBa || '',
    AnhPoster: payload.AnhPoster || '',
  };
  store.mauXe.unshift(item);
  return item;
}

function updateCarModel(maMauXe, payload) {
  const store = getStore();
  const model = store.mauXe.find((m) => m.MaMauXe === maMauXe);
  if (!model) throw new AppError('Không tìm thấy mẫu xe.', 404);

  if (payload.GiaThueNgay !== undefined) {
    const price = Number(payload.GiaThueNgay);
    if (Number.isNaN(price) || price <= 0) throw new AppError('Giá thuê không hợp lệ.', 400);
    model.GiaThueNgay = price;
  }
  Object.assign(model, {
    TenMauXe: payload.TenMauXe ? String(payload.TenMauXe).trim() : model.TenMauXe,
    MaPhanKhuc: payload.MaPhanKhuc || model.MaPhanKhuc,
    MaHang: payload.MaHang || model.MaHang,
    DongCo: payload.DongCo || model.DongCo,
    SoChoNgoi: payload.SoChoNgoi ? Number(payload.SoChoNgoi) : model.SoChoNgoi,
    MoTa: payload.MoTa !== undefined ? payload.MoTa : model.MoTa,
    NoiDungQuangBa: payload.NoiDungQuangBa !== undefined ? payload.NoiDungQuangBa : model.NoiDungQuangBa,
    AnhPoster: payload.AnhPoster !== undefined ? payload.AnhPoster : model.AnhPoster,
  });
  return model;
}

function deleteCarModel(maMauXe) {
  const store = getStore();
  const idx = store.mauXe.findIndex((m) => m.MaMauXe === maMauXe);
  if (idx === -1) throw new AppError('Không tìm thấy mẫu xe.', 404);
  if (store.xe.some((x) => x.MaMauXe === maMauXe) || store.donDatXe.some((d) => d.MaMauXe === maMauXe)) {
    throw new AppError('Không thể xóa mẫu xe đang được tham chiếu bởi xe hoặc đơn đặt xe.', 409);
  }
  store.mauXe.splice(idx, 1);
  return { deleted: maMauXe };
}

function listCars(keyword = '') {
  const store = getStore();
  const kw = String(keyword).trim().toLowerCase();
  return store.xe.filter((c) => {
    const modelName = store.mauXe.find((m) => m.MaMauXe === c.MaMauXe)?.TenMauXe || '';
    return (
      !kw ||
      c.BienSo.toLowerCase().includes(kw) ||
      c.MaXe.toLowerCase().includes(kw) ||
      modelName.toLowerCase().includes(kw)
    );
  });
}

function createCar(payload) {
  const store = getStore();
  const { BienSo, MaMauXe, MauSac, SoKhung, SoMay, NamSanXuat, SoKmHienTai = 0 } = payload;
  if (!store.mauXe.some((m) => m.MaMauXe === MaMauXe)) {
    throw new AppError('Mẫu xe không tồn tại.', 400);
  }
  if (store.xe.some((x) => x.BienSo.toLowerCase() === String(BienSo).trim().toLowerCase())) {
    throw new AppError('Biển số xe đã tồn tại trong hệ thống.', 409);
  }
  if (Number(SoKmHienTai) < 0) {
    throw new AppError('Số km hiện tại không được âm.', 400);
  }
  const maXe = nextCode('XE', 'xe', 'MaXe');
  const car = {
    MaXe: maXe,
    BienSo: String(BienSo).trim(),
    MaMauXe,
    MauSac: String(MauSac).trim(),
    SoKhung: String(SoKhung).trim(),
    SoMay: String(SoMay).trim(),
    NamSanXuat: Number(NamSanXuat) || 2024,
    SoKmHienTai: Number(SoKmHienTai) || 0,
    TrangThai: 'Sẵn sàng',
    MaVach: `BC-${maXe}`,
  };
  store.xe.unshift(car);
  return car;
}

function updateCar(maXe, payload) {
  const store = getStore();
  const car = store.xe.find((x) => x.MaXe === maXe);
  if (!car) throw new AppError('Không tìm thấy xe.', 404);
  if (car.TrangThai === 'Đang thuê') {
    throw new AppError('Xe đang được xử lý cho thuê, không thể cập nhật lúc này.', 409);
  }
  if (payload.SoKmHienTai !== undefined && Number(payload.SoKmHienTai) < 0) {
    throw new AppError('Số km hiện tại không được âm.', 400);
  }
  if (
    payload.BienSo &&
    store.xe.some((x) => x.MaXe !== maXe && x.BienSo.toLowerCase() === String(payload.BienSo).trim().toLowerCase())
  ) {
    throw new AppError('Biển số xe bị trùng.', 409);
  }
  Object.assign(car, {
    BienSo: payload.BienSo ? String(payload.BienSo).trim() : car.BienSo,
    MauSac: payload.MauSac || car.MauSac,
    SoKmHienTai: payload.SoKmHienTai !== undefined ? Number(payload.SoKmHienTai) : car.SoKmHienTai,
    TrangThai: payload.TrangThai || car.TrangThai,
  });
  return car;
}

function deleteCar(maXe) {
  const store = getStore();
  const car = store.xe.find((x) => x.MaXe === maXe);
  if (!car) throw new AppError('Không tìm thấy xe.', 404);
  if (car.TrangThai === 'Đang thuê') {
    throw new AppError('Không được xóa xe khi đang ở trạng thái Đang thuê.', 409);
  }
  car.TrangThai = 'Ngừng hoạt động';
  return car;
}

function getVehicleMeta() {
  const store = getStore();
  return {
    brands: store.hangXe,
    segments: store.phanKhucXe,
    cars: store.xe.map((x) => ({
      MaXe: x.MaXe,
      MaMauXe: x.MaMauXe,
      TrangThai: x.TrangThai,
    })),
  };
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/vehicle.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
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
