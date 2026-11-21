const paymentService = require('../services/payment.service');
const { asyncHandler } = require('../middleware/error.middleware');

const getUnpaid = asyncHandler(async (req, res) => {
  const data = await paymentService.getUnpaidItems(req.user.MaKH);
  res.json({ success: true, data });
});

const getHistory = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentHistory(req.user.MaKH);
  res.json({ success: true, data });
});

const pay = asyncHandler(async (req, res) => {
  const data = await paymentService.payItem(req.user.MaKH, req.body);
  res.status(201).json({ success: true, message: 'Thanh toán thành công.', data });
});

module.exports = { getUnpaid, getHistory, pay };
