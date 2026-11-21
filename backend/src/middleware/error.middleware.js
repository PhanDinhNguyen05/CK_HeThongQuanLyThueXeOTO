class AppError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ máy chủ.',
  };
  if (err.details) {
    payload.details = err.details;
  }
  if (status >= 500) {
    console.error('[Backend Error]:', err);
  }
  res.status(status).json(payload);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
};
