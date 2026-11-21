const { AppError } = require('./error.middleware');

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực người dùng.', 401));
    }
    if (!allowedRoles.includes(req.user.VaiTro)) {
      return next(
        new AppError(
          `Vai trò [${req.user.VaiTro}] không có quyền thực hiện chức năng này.`,
          403
        )
      );
    }
    return next();
  };
}

module.exports = { authorize };
