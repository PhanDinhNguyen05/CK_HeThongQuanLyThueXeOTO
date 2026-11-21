export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function calcDays(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// BR10 & BR11 validators
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function validatePhone(phone) {
  return /^\d{10}$/.test(String(phone || '').trim());
}

export function validateCCCD(cccd) {
  return /^\d{9,12}$/.test(String(cccd || '').trim());
}

export function validateLicense(gplx) {
  return String(gplx || '').trim().length >= 6;
}

export function validatePassword(pw) {
  return String(pw || '').length >= 8;
}
