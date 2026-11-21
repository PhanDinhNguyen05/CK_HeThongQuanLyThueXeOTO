const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate);

// UC24 - Xem danh sách & trạng thái đơn đặt xe (Khách hàng xem của mình, Nhân viên xem tất cả)
router.get('/', authorize(ROLES.CUSTOMER, ROLES.STAFF), bookingController.listBookings);

// UC08 - Đặt thuê xe online (Khách hàng)
router.post(
  '/',
  authorize(ROLES.CUSTOMER),
  validateRequired(['MaMauXe', 'NgayNhan', 'NgayTra']),
  bookingController.createBooking
);

// UC04 - Hủy đặt xe
router.patch('/:maDD/cancel', authorize(ROLES.CUSTOMER, ROLES.STAFF), bookingController.cancelBooking);

// UC06 - Xử lý đơn đặt xe (Nhân viên)
router.patch(
  '/:maDD/process',
  authorize(ROLES.STAFF),
  validateRequired(['action']),
  bookingController.processBooking
);

// UC34 - Khách hàng yêu cầu gia hạn đặt xe
router.post(
  '/:maDD/extend',
  authorize(ROLES.CUSTOMER),
  validateRequired(['NgayTraMoi']),
  bookingController.requestExtension
);

module.exports = router;
