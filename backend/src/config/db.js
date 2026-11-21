const sql = require('mssql');
const { DB_CONFIG } = require('./env');

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(DB_CONFIG).catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
}

function toISODate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function nextSqlCode(poolOrTx, prefix, tableName, colName, pad = 3) {
  const req = new sql.Request(poolOrTx);
  const res = await req.query(`SELECT ${colName} FROM ${tableName}`);
  const nums = res.recordset
    .map((row) => parseInt(String(row[colName] || '').replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

module.exports = {
  sql,
  getPool,
  closePool,
  toISODate,
  todayISO,
  nextSqlCode,
};
