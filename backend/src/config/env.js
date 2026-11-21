require('dotenv').config();

const DB_MODE = (process.env.DB_MODE || 'memory').toLowerCase();

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'auk-car-rental-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DB_MODE,
  isMssql: () => DB_MODE === 'mssql',
  DB_CONFIG: {
    server: process.env.DB_SERVER || 'localhost',
    port: process.env.DB_INSTANCE ? undefined : Number(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME || 'AUK_CarRental',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
      ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
  ROLES: {
    CUSTOMER: 'Khách hàng',
    STAFF: 'Nhân viên',
    ADMIN: 'Quản trị viên',
  },
  MAX_LOGIN_ATTEMPTS: 5,
};
