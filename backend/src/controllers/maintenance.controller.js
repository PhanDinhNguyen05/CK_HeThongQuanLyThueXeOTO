const maintenanceService = require('../services/maintenance.service');
const { asyncHandler } = require('../middleware/error.middleware');

const listMaintenance = asyncHandler(async (req, res) => {
  const data = await maintenanceService.listMaintenance(req.query.maXe);
  res.json({ success: true, data });
});

const createMaintenance = asyncHandler(async (req, res) => {
  const data = await maintenanceService.createMaintenance(req.user.MaNV, req.body);
  res.status(201).json({ success: true, message: 'Ghi nhận bảo dưỡng thành công.', data });
});

const listIncidents = asyncHandler(async (req, res) => {
  const data = await maintenanceService.listIncidents();
  res.json({ success: true, data });
});

const createIncident = asyncHandler(async (req, res) => {
  const data = await maintenanceService.createIncident(req.body);
  res.status(201).json({ success: true, message: 'Ghi nhận sự cố thành công.', data });
});

module.exports = {
  listMaintenance,
  createMaintenance,
  listIncidents,
  createIncident,
};
