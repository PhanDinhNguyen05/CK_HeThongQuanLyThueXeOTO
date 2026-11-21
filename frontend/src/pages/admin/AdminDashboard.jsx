import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const { employees, accounts, adminStats } = useData();

  const activeEmployees = employees.filter((e) => e.TrangThai === 'Đang làm việc').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">CỔNG QUẢN TRỊ VIÊN AUK</span>
          <h1>Tổng quan hệ thống</h1>
          <p>Quản lý nhân sự, tài khoản truy cập và theo dõi quy mô vận hành của AUK Car Rental.</p>
        </div>
        <Link to="/quan-tri/nhan-vien" className="button button-gold button-sm">
          Quản lý nhân viên
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Nhân viên đang làm việc</div>
          <div className="stat-value">{activeEmployees} / {employees.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tài khoản hệ thống</div>
          <div className="stat-value">{accounts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Khách hàng đăng ký</div>
          <div className="stat-value">{adminStats.totalCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng số xe / Hợp đồng</div>
          <div className="stat-value">{adminStats.totalCars} / {adminStats.totalContracts}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Danh sách tài khoản hệ thống</h3>
        <div className="table-wrap">
          <table className="auk-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Mã liên kết</th>
                <th>Số lần sai</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.TenDN}>
                  <td><strong>{a.TenDN}</strong></td>
                  <td>{a.VaiTro}</td>
                  <td>{a.MaKH || a.MaNV || '—'}</td>
                  <td>{a.SoLanDangNhapSai}</td>
                  <td><StatusBadge status={a.TrangThaiTaiKhoan} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
