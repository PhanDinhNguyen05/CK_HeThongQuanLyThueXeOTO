const bookingService = require('../services/booking.service');
const { asyncHandler } = require('../middleware/error.middleware');

const createBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.user.MaKH, req.body);
  res.status(201).json({ success: true, message: 'Đặt thuê xe thành công.', data });
});

const listBookings = asyncHandler(async (req, res) => {
  const data = await bookingService.listBookings(req.user);
  res.json({ success: true, data });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelBooking(req.params.maDD, req.user);
  res.json({ success: true, message: 'Hủy đơn đặt xe thành công.', data });
});

const processBooking = asyncHandler(async (req, res) => {
  const data = await bookingService.processBooking(req.params.maDD, req.user.MaNV, req.body);
  res.json({ success: true, message: 'Xử lý đơn đặt xe thành công.', data });
});

const requestExtension = asyncHandler(async (req, res) => {
  const data = await bookingService.requestBookingExtension(req.params.maDD, req.user.MaKH, req.body);
  res.status(201).json({ success: true, message: 'Đã gửi yêu cầu gia hạn đặt chỗ.', data });
});

module.exports = {
  createBooking,
  listBookings,
  cancelBooking,
  processBooking,
  requestExtension,
};
