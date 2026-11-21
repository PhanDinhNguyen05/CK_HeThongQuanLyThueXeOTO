const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/overview', adminController.getOverview);

// UC14, UC15, UC16, UC17 - Quản lý nhân viên
router.get('/employees', adminController.listEmployees);
router.post(
  '/employees',
  validateRequired(['MaNV', 'HoTen', 'DienThoai']),
  adminController.createEmployee
);
router.put('/employees/:maNV', adminController.updateEmployee);
router.delete('/employees/:maNV', adminController.deleteEmployee);

module.exports = router;
