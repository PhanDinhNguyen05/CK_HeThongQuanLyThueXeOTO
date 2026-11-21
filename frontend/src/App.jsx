import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import CarSearchPage from './pages/public/CarSearchPage';
import CarDetailPage from './pages/public/CarDetailPage';

import BookingOnlinePage from './pages/customer/BookingOnlinePage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import RentalHistoryPage from './pages/customer/RentalHistoryPage';
import PaymentPage from './pages/customer/PaymentPage';
import MembershipPage from './pages/customer/MembershipPage';
import ProfilePage from './pages/customer/ProfilePage';

import StaffDashboard from './pages/staff/StaffDashboard';
import ManageBookingsPage from './pages/staff/ManageBookingsPage';
import CreateRentalPage from './pages/staff/CreateRentalPage';
import ReturnCarPage from './pages/staff/ReturnCarPage';
import PenaltiesPage from './pages/staff/PenaltiesPage';
import ExtensionApprovalsPage from './pages/staff/ExtensionApprovalsPage';
import CarModelsPage from './pages/staff/CarModelsPage';
import CarsPage from './pages/staff/CarsPage';
import MaintenanceIncidentPage from './pages/staff/MaintenanceIncidentPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeesPage from './pages/admin/EmployeesPage';

function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="wrap" style={{ padding: '60px 22px' }}>
        <div className="card" style={{ maxWidth: 420, margin: 'auto', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#77766e' }}>Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    );
  }
  if (!currentUser) {
    return <Navigate to="/dang-nhap" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(currentUser.VaiTro)) {
    return (
      <div className="wrap" style={{ padding: '60px 22px' }}>
        <div className="card" style={{ maxWidth: 520, margin: 'auto', textAlign: 'center' }}>
          <h2 style={{ color: '#c93b3b', marginTop: 0 }}>403 · Không có quyền truy cập</h2>
          <p style={{ color: '#77766e' }}>
            Tài khoản vai trò <strong>{currentUser.VaiTro}</strong> không được phép truy cập phân hệ này.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <Routes>
              {/* Public & Customer Portal */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/dang-nhap" element={<LoginPage />} />
                <Route path="/dang-ky" element={<RegisterPage />} />
                <Route path="/xe" element={<CarSearchPage />} />
                <Route path="/xe/:maMauXe" element={<CarDetailPage />} />

                <Route
                  path="/khach-hang/dat-xe"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <BookingOnlinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/khach-hang/don-dat-xe"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/khach-hang/lich-su-thue"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <RentalHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/khach-hang/thanh-toan"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/khach-hang/thanh-vien"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <MembershipPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/khach-hang/ho-so"
                  element={
                    <ProtectedRoute allowedRoles={['Khách hàng']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Staff Portal */}
              <Route
                path="/nhan-vien"
                element={
                  <ProtectedRoute allowedRoles={['Nhân viên']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StaffDashboard />} />
                <Route path="don-dat-xe" element={<ManageBookingsPage />} />
                <Route path="thue-xe" element={<CreateRentalPage />} />
                <Route path="tra-xe" element={<ReturnCarPage />} />
                <Route path="khoan-phat" element={<PenaltiesPage />} />
                <Route path="gia-han" element={<ExtensionApprovalsPage />} />
                <Route path="mau-xe" element={<CarModelsPage />} />
                <Route path="xe" element={<CarsPage />} />
                <Route path="bao-duong-su-co" element={<MaintenanceIncidentPage />} />
              </Route>

              {/* Admin Portal */}
              <Route
                path="/quan-tri"
                element={
                  <ProtectedRoute allowedRoles={['Quản trị viên']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="nhan-vien" element={<EmployeesPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
