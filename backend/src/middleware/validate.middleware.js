const { AppError } = require('./error.middleware');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const CCCD_RE = /^\d{9,12}$/;

function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const val = req.body[f];
      return val === undefined || val === null || String(val).trim() === '';
    });
    if (missing.length > 0) {
      return next(new AppError(`Thiếu thông tin bắt buộc: ${missing.join(', ')}`, 400));
    }
    return next();
  };
}

function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

function isValidPhone(phone) {
  return PHONE_RE.test(String(phone || '').trim());
}

function isValidCCCD(cccd) {
  return CCCD_RE.test(String(cccd || '').trim());
}

function isValidLicense(gplx) {
  return String(gplx || '').trim().length >= 6;
}

function isValidPassword(pw) {
  return String(pw || '').length >= 8;
}

module.exports = {
  validateRequired,
  isValidEmail,
  isValidPhone,
  isValidCCCD,
  isValidLicense,
  isValidPassword,
};
