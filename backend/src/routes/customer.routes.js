const express = require('express');
const customerController = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate);

// Danh sách khách hàng (Nhân viên)
router.get('/', authorize(ROLES.STAFF), customerController.listCustomers);

// UC03 - Quản lý thông tin cá nhân
router.get('/profile', authorize(ROLES.CUSTOMER), customerController.getProfile);
router.put('/profile', authorize(ROLES.CUSTOMER), validateRequired(['DienThoai', 'email']), customerController.updateProfile);

// UC02 - Đăng ký thành viên
router.post('/membership', authorize(ROLES.CUSTOMER), customerController.registerMembership);

// UC12 - Yêu cầu gia hạn thành viên
router.post(
  '/membership/extend',
  authorize(ROLES.CUSTOMER),
  validateRequired(['GoiGiaHan']),
  customerController.requestMembershipExtension
);

module.exports = router;
