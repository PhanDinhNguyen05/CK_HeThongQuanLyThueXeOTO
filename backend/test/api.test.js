const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/server');
const { resetStore } = require('../src/data/store');

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test.before(async () => {
  resetStore();
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /health returns UP', async () => {
  const res = await request('GET', '/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'UP');
});

test('UC01 Register validates BR10/BR11 and succeeds with valid data', async () => {
  const badPhone = await request('POST', '/api/auth/register', {
    HoVaTen: 'Test User',
    GioiTinh: 'Nam',
    DienThoai: '09123',
    SoDinhDanh: '079111222333',
    GiayPhepLaiXe: 'B2-111222',
    email: 'test@gmail.com',
    TenDN: 'testuser1',
    MatKhau: '12345678',
  });
  assert.equal(badPhone.status, 400);

  const ok = await request('POST', '/api/auth/register', {
    HoVaTen: 'Test User',
    GioiTinh: 'Nam',
    DienThoai: '0911223344',
    SoDinhDanh: '079111222333',
    GiayPhepLaiXe: 'B2-111222',
    email: 'testuser1@gmail.com',
    TenDN: 'testuser1',
    MatKhau: '12345678',
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.success, true);
});

test('UC10 Login + RBAC authorization + Lock after 5 failed attempts', async () => {
  const loginKh = await request('POST', '/api/auth/login', { TenDN: 'khach01', MatKhau: '12345678' });
  assert.equal(loginKh.status, 200);
  const khToken = loginKh.data.data.token;

  // Customer cannot access Admin or Staff endpoints
  const forbiddenAdmin = await request('GET', '/api/admin/employees', null, khToken);
  assert.equal(forbiddenAdmin.status, 403);

  const forbiddenStaff = await request('GET', '/api/vehicles/cars', null, khToken);
  assert.equal(forbiddenStaff.status, 403);

  // Unauthenticated gets 401
  const unauth = await request('GET', '/api/bookings');
  assert.equal(unauth.status, 401);

  // Lock account khach02 after 5 wrong attempts
  for (let i = 0; i < 4; i++) {
    const fail = await request('POST', '/api/auth/login', { TenDN: 'khach02', MatKhau: 'wrongpass' });
    assert.equal(fail.status, 401);
  }
  const locked = await request('POST', '/api/auth/login', { TenDN: 'khach02', MatKhau: 'wrongpass' });
  assert.equal(locked.status, 403);
});

test('UC05 Vehicle search, UC08 Booking, UC06 Staff approve, UC27 Contract, UC25 Return, UC09 Payment', async () => {
  const search = await request('GET', '/api/vehicles/models?keyword=Vios');
  assert.equal(search.status, 200);
  assert.ok(search.data.data.length >= 1);

  const khLogin = await request('POST', '/api/auth/login', { TenDN: 'khach01', MatKhau: '12345678' });
  const khToken = khLogin.data.data.token;

  const nvLogin = await request('POST', '/api/auth/login', { TenDN: 'nv01', MatKhau: '12345678' });
  const nvToken = nvLogin.data.data.token;

  // Customer creates booking on MX03
  const bk = await request(
    'POST',
    '/api/bookings',
    { MaMauXe: 'MX03', NgayNhan: '2026-12-01', NgayTra: '2026-12-03' },
    khToken
  );
  assert.equal(bk.status, 201);
  const maDD = bk.data.data.MaDD;

  // Staff approves booking
  const proc = await request('PATCH', `/api/bookings/${maDD}/process`, { action: 'approve' }, nvToken);
  assert.equal(proc.status, 200);
  assert.equal(proc.data.data.TrangThai, 'Đã xác nhận');

  // Customer has unpaid penalty PH001 -> creating contract should return 409
  const blockedContract = await request(
    'POST',
    '/api/rentals/contracts',
    { MaXe: 'XE04', MaDD: maDD, MaKH: 'KH01', NgayNhan: '2026-12-01', NgayTra: '2026-12-03' },
    nvToken
  );
  assert.equal(blockedContract.status, 409);

  // Customer pays unpaid penalty PH001
  const pay = await request(
    'POST',
    '/api/payments/pay',
    { itemId: 'PH:PH001', phuongThuc: 'Ngân hàng', nganHang: 'Vietcombank' },
    khToken
  );
  assert.equal(pay.status, 201);
  assert.equal(pay.data.data.TrangThai, 'Thành công');

  // Now staff creates contract on XE04 (MX03)
  const contract = await request(
    'POST',
    '/api/rentals/contracts',
    { MaXe: 'XE04', MaDD: maDD, MaKH: 'KH01', NgayNhan: '2026-12-01', NgayTra: '2026-12-03' },
    nvToken
  );
  assert.equal(contract.status, 201);
  const maHD = contract.data.data.MaHD;

  // Staff cannot delete XE04 while Đang thuê (BR08)
  const delBusy = await request('DELETE', '/api/vehicles/cars/XE04', null, nvToken);
  assert.equal(delBusy.status, 409);

  // Staff processes return car
  const ret = await request(
    'POST',
    `/api/rentals/contracts/${maHD}/return`,
    { NgayTraThucTe: '2026-12-03', MucNhienLieu: 'Đầy bình (100%)', TinhTrangXe: 'Bình thường' },
    nvToken
  );
  assert.equal(ret.status, 200);
  assert.equal(ret.data.data.contract.TrangThaiHopDong, 'Hoàn tất');
});

test('UC14-UC17 Admin Employee CRUD', async () => {
  const adminLogin = await request('POST', '/api/auth/login', { TenDN: 'admin', MatKhau: '12345678' });
  const adminToken = adminLogin.data.data.token;

  const createEmp = await request(
    'POST',
    '/api/admin/employees',
    { MaNV: 'NV009', HoTen: 'Lê Văn Test', DienThoai: '0909888777', MoTa: 'Nhân viên mới' },
    adminToken
  );
  assert.equal(createEmp.status, 201);

  const searchEmp = await request('GET', '/api/admin/employees?keyword=NV009', null, adminToken);
  assert.equal(searchEmp.status, 200);
  assert.equal(searchEmp.data.data.length, 1);

  const delEmp = await request('DELETE', '/api/admin/employees/NV009', null, adminToken);
  assert.equal(delEmp.status, 200);
  assert.equal(delEmp.data.data.softDeleted, false);
});

test('UC02, UC03 Profile & Membership validation and persistence', async () => {
  const login = await request('POST', '/api/auth/login', { TenDN: 'testuser1', MatKhau: '12345678' });
  assert.equal(login.status, 200);
  const token = login.data.data.token;

  const badProfile = await request(
    'PUT',
    '/api/customers/profile',
    { DienThoai: '123', email: 'bad-email' },
    token
  );
  assert.equal(badProfile.status, 400);

  const okProfile = await request(
    'PUT',
    '/api/customers/profile',
    { DienThoai: '0988776655', email: 'testuser1.updated@gmail.com', DiaChi: 'Quận 1, TP.HCM' },
    token
  );
  assert.equal(okProfile.status, 200);
  assert.equal(okProfile.data.data.DienThoai, '0988776655');

  const regMem = await request('POST', '/api/customers/membership', {}, token);
  assert.equal(regMem.status, 201);
  assert.equal(regMem.data.data.TinhTrang, 'Hoạt động');

  const dupMem = await request('POST', '/api/customers/membership', {}, token);
  assert.equal(dupMem.status, 409);
});

test('UC04 Cancel booking, UC34/UC07/UC20 Extension workflow & UC26 Penalty payment', async () => {
  const khLogin = await request('POST', '/api/auth/login', { TenDN: 'khach01', MatKhau: '12345678' });
  const khToken = khLogin.data.data.token;
  const nvLogin = await request('POST', '/api/auth/login', { TenDN: 'nv01', MatKhau: '12345678' });
  const nvToken = nvLogin.data.data.token;

  // Create booking and cancel it (UC04)
  const b1 = await request(
    'POST',
    '/api/bookings',
    { MaMauXe: 'MX01', NgayNhan: '2026-12-10', NgayTra: '2026-12-12' },
    khToken
  );
  assert.equal(b1.status, 201);
  const cancelRes = await request('PATCH', `/api/bookings/${b1.data.data.MaDD}/cancel`, {}, khToken);
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.data.data.TrangThai, 'Đã hủy');

  // Create booking and request extension (UC34 -> UC20)
  const b2 = await request(
    'POST',
    '/api/bookings',
    { MaMauXe: 'MX02', NgayNhan: '2026-12-15', NgayTra: '2026-12-17' },
    khToken
  );
  assert.equal(b2.status, 201);
  const extReq = await request(
    'POST',
    `/api/bookings/${b2.data.data.MaDD}/extend`,
    { NgayTraMoi: '2026-12-19', LyDo: 'Gia hạn thêm 2 ngày' },
    khToken
  );
  assert.equal(extReq.status, 201);

  const approveExt = await request(
    'PATCH',
    `/api/rentals/extensions/${extReq.data.data.MaYC}/review`,
    { action: 'approve' },
    nvToken
  );
  assert.equal(approveExt.status, 200);
  assert.equal(approveExt.data.data.TrangThai, 'Đã phê duyệt');

  // Staff creates penalty on an existing contract (UC26) and customer pays it (UC09)
  const contractsRes = await request('GET', '/api/rentals/contracts', null, nvToken);
  const khContract = contractsRes.data.data.find((c) => c.MaKH === 'KH01');
  const penalty = await request(
    'POST',
    '/api/rentals/penalties',
    { MaHD: khContract.MaHD, LoaiViPham: 'Thiếu nhiên liệu', MoTa: 'Thiếu 1/4 bình xăng', SoTienPhat: 200000 },
    nvToken
  );
  assert.equal(penalty.status, 201);
  const payPen = await request(
    'POST',
    '/api/payments/pay',
    { itemId: `PH:${penalty.data.data.MaKhoanPhat}`, phuongThuc: 'Tiền mặt' },
    khToken
  );
  assert.equal(payPen.status, 201);
  assert.equal(payPen.data.data.TrangThai, 'Thành công');
});

test('UC18/UC19 Maintenance & Incident + UC21-UC23/UC28-UC30 Vehicle CRUD + Strict RBAC', async () => {
  const nvLogin = await request('POST', '/api/auth/login', { TenDN: 'nv01', MatKhau: '12345678' });
  const nvToken = nvLogin.data.data.token;
  const adminLogin = await request('POST', '/api/auth/login', { TenDN: 'admin', MatKhau: '12345678' });
  const adminToken = adminLogin.data.data.token;
  const khLogin = await request('POST', '/api/auth/login', { TenDN: 'testuser1', MatKhau: '12345678' });
  const khToken = khLogin.data.data.token;

  const contractsRes = await request('GET', '/api/rentals/contracts', null, nvToken);
  const hdId = contractsRes.data.data[0].MaHD;

  // Strict RBAC checks
  assert.equal((await request('GET', '/api/admin/overview', null, nvToken)).status, 403);
  assert.equal((await request('GET', '/api/vehicles/cars', null, adminToken)).status, 403);
  assert.equal((await request('GET', `/api/rentals/contracts/${hdId}`, null, khToken)).status, 404);

  // Vehicle model & car CRUD + duplicate plate check
  const newModel = await request(
    'POST',
    '/api/vehicles/models',
    { TenMauXe: 'VinFast VF8 Eco', GiaThueNgay: 1500000, MaPhanKhuc: 'PK02', MaHang: 'HANG01', DongCo: 'Electric 260kW' },
    nvToken
  );
  assert.equal(newModel.status, 201);

  const newCar = await request(
    'POST',
    '/api/vehicles/cars',
    { BienSo: '51K-999.88', MaMauXe: newModel.data.data.MaMauXe, MauSac: 'Đen', SoKhung: 'VF8SK999', SoMay: 'VF8SM999' },
    nvToken
  );
  assert.equal(newCar.status, 201);

  const dupPlate = await request(
    'POST',
    '/api/vehicles/cars',
    { BienSo: '51K-999.88', MaMauXe: newModel.data.data.MaMauXe, MauSac: 'Trắng', SoKhung: 'VF8SK998', SoMay: 'VF8SM998' },
    nvToken
  );
  assert.equal(dupPlate.status, 409);

  // Maintenance & Incident
  const maint = await request(
    'POST',
    '/api/operations/maintenance',
    { MaXe: newCar.data.data.MaXe, NoiDungBaoDuong: 'Kiểm tra pin định kỳ', PhiBaoDuong: 350000 },
    nvToken
  );
  assert.equal(maint.status, 201);

  const inc = await request(
    'POST',
    '/api/operations/incidents',
    { MaHD: hdId, LoaiSuCo: 'Mất chìa khóa', MoTa: 'Khách làm rơi chìa khóa', ViTri: 'Quận 7', ChiPhiPhatSinh: 500000 },
    nvToken
  );
  assert.equal(inc.status, 201);
});
