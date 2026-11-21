const adminService = require('../services/admin.service');
const { asyncHandler } = require('../middleware/error.middleware');

const getOverview = asyncHandler(async (req, res) => {
  const data = await adminService.getOverview();
  res.json({ success: true, data });
});

const listEmployees = asyncHandler(async (req, res) => {
  const data = await adminService.listEmployees(req.query.keyword);
  res.json({ success: true, data });
});

const createEmployee = asyncHandler(async (req, res) => {
  const data = await adminService.createEmployee(req.body);
  res.status(201).json({ success: true, message: 'Thêm nhân viên thành công.', data });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const data = await adminService.updateEmployee(req.params.maNV, req.body);
  res.json({ success: true, message: 'Cập nhật nhân viên thành công.', data });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const data = await adminService.deleteEmployee(req.params.maNV);
  res.json({
    success: true,
    message: data.softDeleted
      ? 'Nhân viên có dữ liệu liên quan, đã chuyển sang Ngừng hoạt động.'
      : 'Xóa nhân viên thành công.',
    data,
  });
});

module.exports = {
  getOverview,
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
