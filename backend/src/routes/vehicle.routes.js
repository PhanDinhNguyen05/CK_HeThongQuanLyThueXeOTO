const express = require('express');
const vehicleController = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

// UC05 & UC31 - Tìm kiếm và xem chi tiết mẫu xe (Public)
router.get('/meta', vehicleController.getMeta);
router.get('/models', vehicleController.searchModels);
router.get('/models/:maMauXe', vehicleController.getModelDetail);

// UC21, UC22, UC23 - Quản lý mẫu xe (Nhân viên)
router.post(
  '/models',
  authenticate,
  authorize(ROLES.STAFF),
  validateRequired(['TenMauXe', 'GiaThueNgay', 'MaPhanKhuc', 'MaHang', 'DongCo']),
  vehicleController.createModel
);
router.put('/models/:maMauXe', authenticate, authorize(ROLES.STAFF), vehicleController.updateModel);
router.delete('/models/:maMauXe', authenticate, authorize(ROLES.STAFF), vehicleController.deleteModel);

// UC28, UC29, UC30 - Quản lý xe (Nhân viên)
router.get('/cars', authenticate, authorize(ROLES.STAFF), vehicleController.listCars);
router.post(
  '/cars',
  authenticate,
  authorize(ROLES.STAFF),
  validateRequired(['BienSo', 'MaMauXe', 'MauSac', 'SoKhung', 'SoMay']),
  vehicleController.createCar
);
router.put('/cars/:maXe', authenticate, authorize(ROLES.STAFF), vehicleController.updateCar);
router.delete('/cars/:maXe', authenticate, authorize(ROLES.STAFF), vehicleController.deleteCar);

module.exports = router;
