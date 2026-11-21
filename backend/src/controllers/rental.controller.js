const rentalService = require('../services/rental.service');
const { asyncHandler } = require('../middleware/error.middleware');

const listHistory = asyncHandler(async (req, res) => {
  const data = await rentalService.listRentalHistory(req.user, req.query);
  res.json({ success: true, data });
});

const getDetail = asyncHandler(async (req, res) => {
  const data = await rentalService.getContractDetail(req.params.maHD, req.user);
  res.json({ success: true, data });
});

const createContract = asyncHandler(async (req, res) => {
  const data = await rentalService.createRentalContract(req.user.MaNV, req.body);
  res.status(201).json({ success: true, message: 'Lập hợp đồng thuê xe thành công.', data });
});

const returnCar = asyncHandler(async (req, res) => {
  const data = await rentalService.processReturnCar(req.params.maHD, req.body);
  res.json({ success: true, message: 'Xử lý trả xe thành công.', data });
});

const listPenalties = asyncHandler(async (req, res) => {
  const data = await rentalService.listPenalties();
  res.json({ success: true, data });
});

const createPenalty = asyncHandler(async (req, res) => {
  const data = await rentalService.createPenalty(req.body);
  res.status(201).json({ success: true, message: 'Lập khoản phạt thành công.', data });
});

const requestExtension = asyncHandler(async (req, res) => {
  const data = await rentalService.requestContractExtension(req.params.maHD, req.user.MaKH, req.body);
  res.status(201).json({ success: true, message: 'Đã gửi yêu cầu gia hạn hợp đồng.', data });
});

const listExtensions = asyncHandler(async (req, res) => {
  const data = await rentalService.listExtensionRequests();
  res.json({ success: true, data });
});

const reviewExtension = asyncHandler(async (req, res) => {
  const data = await rentalService.reviewExtensionRequest(req.params.maYC, req.body);
  res.json({ success: true, message: 'Xử lý yêu cầu gia hạn thành công.', data });
});

module.exports = {
  listHistory,
  getDetail,
  createContract,
  returnCar,
  listPenalties,
  createPenalty,
  requestExtension,
  listExtensions,
  reviewExtension,
};
