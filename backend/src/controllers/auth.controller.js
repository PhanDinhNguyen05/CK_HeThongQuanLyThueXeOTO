const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản khách hàng thành công.',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { TenDN, MatKhau } = req.body;
  const data = await authService.login(TenDN, MatKhau);
  res.json({
    success: true,
    message: 'Đăng nhập thành công.',
    data,
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { register, login, me };
