const { getStore } = require('../data/store');

function nextCode(prefix, collectionKey, idField) {
  const list = getStore()[collectionKey] || [];
  const nums = list
    .map((item) => parseInt(String(item[idField] || '').replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function calcDays(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

module.exports = {
  getStore,
  nextCode,
  todayISO,
  calcDays,
};
