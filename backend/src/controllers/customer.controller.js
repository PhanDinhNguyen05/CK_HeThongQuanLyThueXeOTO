const customerService = require('../services/customer.service');
const { asyncHandler } = require('../middleware/error.middleware');

const listCustomers = asyncHandler(async (req, res) => {
  const data = await customerService.listCustomers();
  res.json({ success: true, data });
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await customerService.getProfile(req.user.MaKH);
  res.json({ success: true, data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await customerService.updateProfile(req.user.MaKH, req.body);
  res.json({ success: true, message: 'Cập nhật thông tin cá nhân thành công.', data });
});

const registerMembership = asyncHandler(async (req, res) => {
  const data = await customerService.registerMembership(req.user.MaKH);
  res.status(201).json({ success: true, message: 'Đăng ký thành viên thành công.', data });
});

const requestMembershipExtension = asyncHandler(async (req, res) => {
  const data = await customerService.requestMembershipExtension(req.user.MaKH, req.body);
  res.status(201).json({ success: true, message: 'Đã tiếp nhận yêu cầu gia hạn thành viên.', data });
});

module.exports = {
  listCustomers,
  getProfile,
  updateProfile,
  registerMembership,
  requestMembershipExtension,
};
