const { getStore } = require('../models/base.model');
const { AppError } = require('../middleware/error.middleware');
const { isValidPhone } = require('../middleware/validate.middleware');

function listEmployees(keyword = '') {
  const kw = String(keyword).trim().toLowerCase();
  const list = getStore().nhanVien;
  if (!kw) return list;
  return list.filter(
    (e) =>
      e.MaNV.toLowerCase().includes(kw) ||
      e.HoTen.toLowerCase().includes(kw) ||
      e.DienThoai.toLowerCase().includes(kw)
  );
}

function createEmployee({ MaNV, HoTen, DienThoai, MoTa = '' }) {
  const store = getStore();
  const code = String(MaNV).trim().toUpperCase();
  if (!isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số).', 400);
  }
  if (store.nhanVien.some((e) => e.MaNV.toLowerCase() === code.toLowerCase())) {
    throw new AppError('Mã nhân viên đã tồn tại.', 409);
  }
  const emp = {
    MaNV: code,
    HoTen: String(HoTen).trim(),
    DienThoai: String(DienThoai).trim(),
    MoTa: String(MoTa).trim() || 'Nhân viên',
    TrangThai: 'Đang làm việc',
  };
  store.nhanVien.push(emp);
  return emp;
}

function updateEmployee(maNV, { HoTen, DienThoai, MoTa }) {
  const emp = getStore().nhanVien.find((e) => e.MaNV === maNV);
  if (!emp) throw new AppError('Không tìm thấy nhân viên.', 404);
  if (DienThoai !== undefined && !isValidPhone(DienThoai)) {
    throw new AppError('Số điện thoại không hợp lệ.', 400);
  }
  if (HoTen !== undefined) emp.HoTen = String(HoTen).trim();
  if (DienThoai !== undefined) emp.DienThoai = String(DienThoai).trim();
  if (MoTa !== undefined) emp.MoTa = String(MoTa).trim();
  return emp;
}

function deleteEmployee(maNV) {
  const store = getStore();
  const idx = store.nhanVien.findIndex((e) => e.MaNV === maNV);
  if (idx === -1) throw new AppError('Không tìm thấy nhân viên.', 404);

  const hasRelated =
    store.donDatXe.some((b) => b.MaNV === maNV) ||
    store.hopDongThue.some((c) => c.MaNV === maNV) ||
    store.baoDuong.some((m) => m.MaNV === maNV);

  if (hasRelated) {
    store.nhanVien[idx].TrangThai = 'Ngừng hoạt động';
    return { softDeleted: true, employee: store.nhanVien[idx] };
  }
  const [removed] = store.nhanVien.splice(idx, 1);
  return { softDeleted: false, employee: removed };
}

function getOverview() {
  const store = getStore();
  return {
    accounts: store.taiKhoan.map(({ MatKhau, ...rest }) => rest),
    totalCars: store.xe.length,
    totalContracts: store.hopDongThue.length,
    totalCustomers: store.khachHang.length,
  };
}

const { isMssql } = require('../config/env');
const sqlRepo = require('../repositories/admin.sql');

module.exports = isMssql()
  ? sqlRepo
  : {
      getOverview,
      listEmployees,
      createEmployee,
      updateEmployee,
      deleteEmployee,
    };
