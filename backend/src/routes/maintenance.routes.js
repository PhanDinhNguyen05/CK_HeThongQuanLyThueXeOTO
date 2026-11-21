const express = require('express');
const maintenanceController = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateRequired } = require('../middleware/validate.middleware');
const { ROLES } = require('../config/env');

const router = express.Router();

router.use(authenticate, authorize(ROLES.STAFF));

// UC19 - Quản lý bảo dưỡng
router.get('/maintenance', maintenanceController.listMaintenance);
router.post(
  '/maintenance',
  validateRequired(['MaXe', 'NoiDungBaoDuong', 'PhiBaoDuong']),
  maintenanceController.createMaintenance
);

// UC18 - Xử lý sự cố khi thuê xe
router.get('/incidents', maintenanceController.listIncidents);
router.post(
  '/incidents',
  validateRequired(['MaHD', 'LoaiSuCo', 'MoTa', 'ViTri']),
  maintenanceController.createIncident
);

module.exports = router;
