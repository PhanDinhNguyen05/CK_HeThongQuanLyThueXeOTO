const express = require('express');
const rentalController = require('../controllers/rental.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate);

// UC11 - Xem lịch sử thuê xe
router.get('/contracts', authorize(ROLES.CUSTOMER, ROLES.STAFF), rentalController.listHistory);
router.get('/contracts/:maHD', authorize(ROLES.CUSTOMER, ROLES.STAFF), rentalController.getDetail);

// UC27 & UC32 - Thuê xe & Lập hợp đồng thuê xe (Nhân viên)
router.post(
  '/contracts',
  authorize(ROLES.STAFF),
  validateRequired(['MaXe', 'NgayNhan', 'NgayTra']),
  rentalController.createContract
);

// UC25 - Xử lý trả xe (Nhân viên)
router.post(
  '/contracts/:maHD/return',
  authorize(ROLES.STAFF),
  validateRequired(['MucNhienLieu', 'TinhTrangXe']),
  rentalController.returnCar
);

// UC13 - Khách hàng yêu cầu gia hạn hợp đồng
router.post(
  '/contracts/:maHD/extend',
  authorize(ROLES.CUSTOMER),
  validateRequired(['NgayTraDeNghi']),
  rentalController.requestExtension
);

// UC26 - Lập & xem khoản phạt (Nhân viên)
router.get('/penalties', authorize(ROLES.STAFF), rentalController.listPenalties);
router.post(
  '/penalties',
  authorize(ROLES.STAFF),
  validateRequired(['MaHD', 'LoaiViPham', 'MoTa', 'SoTienPhat']),
  rentalController.createPenalty
);

// UC07, UC20, UC33 - Xét duyệt yêu cầu gia hạn (Nhân viên)
router.get('/extensions', authorize(ROLES.STAFF), rentalController.listExtensions);
router.patch(
  '/extensions/:maYC/review',
  authorize(ROLES.STAFF),
  validateRequired(['action']),
  rentalController.reviewExtension
);

module.exports = router;
