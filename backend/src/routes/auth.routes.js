const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validateRequired } = require('../middleware/validate.middleware');

const router = express.Router();

// UC01 - Đăng ký tài khoản
router.post(
  '/register',
  validateRequired([
    'HoVaTen',
    'GioiTinh',
    'DienThoai',
    'SoDinhDanh',
    'GiayPhepLaiXe',
    'email',
    'TenDN',
    'MatKhau',
  ]),
  authController.register
);

// UC10 - Đăng nhập
router.post('/login', validateRequired(['TenDN', 'MatKhau']), authController.login);

// Thông tin phiên hiện tại
router.get('/me', authenticate, authController.me);

module.exports = router;
