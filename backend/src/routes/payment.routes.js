const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate, authorize(ROLES.CUSTOMER));

// UC09 - Thanh toán
router.get('/unpaid', paymentController.getUnpaid);
router.get('/history', paymentController.getHistory);
router.post('/pay', validateRequired(['itemId', 'phuongThuc']), paymentController.pay);

module.exports = router;
