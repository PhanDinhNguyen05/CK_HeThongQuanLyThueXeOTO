const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { AppError } = require('./error.middleware');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return next(new AppError('Phiên đăng nhập không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập.', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return next(new AppError('Token xác thực không hợp lệ hoặc đã hết hạn.', 401));
  }
}

module.exports = { authenticate };
