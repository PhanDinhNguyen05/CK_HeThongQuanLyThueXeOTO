const vehicleService = require('../services/vehicle.service');
const { asyncHandler } = require('../middleware/error.middleware');

const getMeta = asyncHandler(async (req, res) => {
  const data = await vehicleService.getVehicleMeta();
  res.json({ success: true, data });
});

const searchModels = asyncHandler(async (req, res) => {
  const data = await vehicleService.searchCarModels(req.query);
  res.json({ success: true, data });
});

const getModelDetail = asyncHandler(async (req, res) => {
  const data = await vehicleService.getCarModelById(req.params.maMauXe);
  res.json({ success: true, data });
});

const createModel = asyncHandler(async (req, res) => {
  const data = await vehicleService.createCarModel(req.body);
  res.status(201).json({ success: true, message: 'Thêm mẫu xe thành công.', data });
});

const updateModel = asyncHandler(async (req, res) => {
  const data = await vehicleService.updateCarModel(req.params.maMauXe, req.body);
  res.json({ success: true, message: 'Cập nhật mẫu xe thành công.', data });
});

const deleteModel = asyncHandler(async (req, res) => {
  const data = await vehicleService.deleteCarModel(req.params.maMauXe);
  res.json({ success: true, message: 'Xóa mẫu xe thành công.', data });
});

const listCars = asyncHandler(async (req, res) => {
  const data = await vehicleService.listCars(req.query.keyword);
  res.json({ success: true, data });
});

const createCar = asyncHandler(async (req, res) => {
  const data = await vehicleService.createCar(req.body);
  res.status(201).json({ success: true, message: 'Thêm xe mới thành công.', data });
});

const updateCar = asyncHandler(async (req, res) => {
  const data = await vehicleService.updateCar(req.params.maXe, req.body);
  res.json({ success: true, message: 'Cập nhật thông tin xe thành công.', data });
});

const deleteCar = asyncHandler(async (req, res) => {
  const data = await vehicleService.deleteCar(req.params.maXe);
  res.json({ success: true, message: 'Đã chuyển xe sang trạng thái Ngừng hoạt động.', data });
});

module.exports = {
  getMeta,
  searchModels,
  getModelDetail,
  createModel,
  updateModel,
  deleteModel,
  listCars,
  createCar,
  updateCar,
  deleteCar,
};
