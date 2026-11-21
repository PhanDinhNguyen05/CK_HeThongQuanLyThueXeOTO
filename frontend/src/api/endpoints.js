import { apiRequest } from './client';

export const authApi = {
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
  me: () => apiRequest('/auth/me'),
};

export const vehicleApi = {
  getMeta: () => apiRequest('/vehicles/meta'),
  searchModels: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const query = qs.toString();
    return apiRequest(`/vehicles/models${query ? `?${query}` : ''}`);
  },
  getModelDetail: (maMauXe) => apiRequest(`/vehicles/models/${maMauXe}`),
  createModel: (body) => apiRequest('/vehicles/models', { method: 'POST', body }),
  updateModel: (maMauXe, body) => apiRequest(`/vehicles/models/${maMauXe}`, { method: 'PUT', body }),
  deleteModel: (maMauXe) => apiRequest(`/vehicles/models/${maMauXe}`, { method: 'DELETE' }),
  listCars: (keyword = '') =>
    apiRequest(`/vehicles/cars${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  createCar: (body) => apiRequest('/vehicles/cars', { method: 'POST', body }),
  updateCar: (maXe, body) => apiRequest(`/vehicles/cars/${maXe}`, { method: 'PUT', body }),
  deleteCar: (maXe) => apiRequest(`/vehicles/cars/${maXe}`, { method: 'DELETE' }),
};

export const customerApi = {
  list: () => apiRequest('/customers'),
  getProfile: () => apiRequest('/customers/profile'),
  updateProfile: (body) => apiRequest('/customers/profile', { method: 'PUT', body }),
  registerMembership: () => apiRequest('/customers/membership', { method: 'POST' }),
  extendMembership: (body) => apiRequest('/customers/membership/extend', { method: 'POST', body }),
};

export const bookingApi = {
  list: () => apiRequest('/bookings'),
  create: (body) => apiRequest('/bookings', { method: 'POST', body }),
  cancel: (maDD) => apiRequest(`/bookings/${maDD}/cancel`, { method: 'PATCH' }),
  process: (maDD, body) => apiRequest(`/bookings/${maDD}/process`, { method: 'PATCH', body }),
  requestExtension: (maDD, body) => apiRequest(`/bookings/${maDD}/extend`, { method: 'POST', body }),
};

export const rentalApi = {
  listContracts: () => apiRequest('/rentals/contracts'),
  getContract: (maHD) => apiRequest(`/rentals/contracts/${maHD}`),
  createContract: (body) => apiRequest('/rentals/contracts', { method: 'POST', body }),
  returnCar: (maHD, body) => apiRequest(`/rentals/contracts/${maHD}/return`, { method: 'POST', body }),
  requestExtension: (maHD, body) => apiRequest(`/rentals/contracts/${maHD}/extend`, { method: 'POST', body }),
  listPenalties: () => apiRequest('/rentals/penalties'),
  createPenalty: (body) => apiRequest('/rentals/penalties', { method: 'POST', body }),
  listExtensions: () => apiRequest('/rentals/extensions'),
  reviewExtension: (maYC, body) => apiRequest(`/rentals/extensions/${maYC}/review`, { method: 'PATCH', body }),
};

export const paymentApi = {
  getUnpaid: () => apiRequest('/payments/unpaid'),
  getHistory: () => apiRequest('/payments/history'),
  pay: (body) => apiRequest('/payments/pay', { method: 'POST', body }),
};

export const operationsApi = {
  listMaintenance: () => apiRequest('/operations/maintenance'),
  createMaintenance: (body) => apiRequest('/operations/maintenance', { method: 'POST', body }),
  listIncidents: () => apiRequest('/operations/incidents'),
  createIncident: (body) => apiRequest('/operations/incidents', { method: 'POST', body }),
};

export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  listEmployees: (keyword = '') =>
    apiRequest(`/admin/employees${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}`),
  createEmployee: (body) => apiRequest('/admin/employees', { method: 'POST', body }),
  updateEmployee: (maNV, body) => apiRequest(`/admin/employees/${maNV}`, { method: 'PUT', body }),
  deleteEmployee: (maNV) => apiRequest(`/admin/employees/${maNV}`, { method: 'DELETE' }),
};
