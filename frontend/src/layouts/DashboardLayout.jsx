import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus2,
  RotateCcw,
  AlertTriangle,
  Clock,
  Car,
  Layers,
  Wrench,
  Users,
  LogOut,
  Menu,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.VaiTro === 'Quản trị viên';

  const handleLogout = () => {
    logout();
    navigate('/dang-nhap');
  };

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="dash-brand">
          <span className="brand-symbol" style={{ width: 38, height: 38, fontSize: 20 }}>
            ✺
          </span>
          <div>
            <div className="dash-brand-title">
              AUK <span>CAR RENTAL</span>
            </div>
            <div className="dash-brand-sub">
              {isAdmin ? 'Cổng Quản trị viên' : 'Cổng Nhân viên'}
            </div>
          </div>
        </div>

        <nav className="dash-nav" onClick={() => setSidebarOpen(false)}>
          {isAdmin ? (
            <>
              <div className="dash-nav-group">Quản trị hệ thống</div>
              <NavLink to="/quan-tri" end>
                <LayoutDashboard size={17} /> Tổng quan quản trị
              </NavLink>
              <NavLink to="/quan-tri/nhan-vien">
                <Users size={17} /> Quản lý nhân viên
              </NavLink>
            </>
          ) : (
            <>
              <div className="dash-nav-group">Điều hành</div>
              <NavLink to="/nhan-vien" end>
                <LayoutDashboard size={17} /> Tổng quan
              </NavLink>

              <div className="dash-nav-group">Đặt xe &amp; Thuê / Trả</div>
              <NavLink to="/nhan-vien/don-dat-xe">
                <ClipboardList size={17} /> Xử lý đơn đặt xe
              </NavLink>
              <NavLink to="/nhan-vien/thue-xe">
                <FilePlus2 size={17} /> Thuê xe &amp; Lập hợp đồng
              </NavLink>
              <NavLink to="/nhan-vien/tra-xe">
                <RotateCcw size={17} /> Xử lý trả xe
              </NavLink>
              <NavLink to="/nhan-vien/khoan-phat">
                <AlertTriangle size={17} /> Lập khoản phạt
              </NavLink>
              <NavLink to="/nhan-vien/gia-han">
                <Clock size={17} /> Xét duyệt gia hạn
              </NavLink>

              <div className="dash-nav-group">Kho xe &amp; Bảo dưỡng</div>
              <NavLink to="/nhan-vien/mau-xe">
                <Layers size={17} /> Quản lý mẫu xe
              </NavLink>
              <NavLink to="/nhan-vien/xe">
                <Car size={17} /> Quản lý xe
              </NavLink>
              <NavLink to="/nhan-vien/bao-duong-su-co">
                <Wrench size={17} /> Bảo dưỡng &amp; Sự cố
              </NavLink>
            </>
          )}

          <div className="dash-nav-group">Khác</div>
          <Link to="/">
            <Home size={17} /> Về trang chủ
          </Link>
        </nav>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={() => setSidebarOpen((o) => !o)}
              style={{ display: 'inline-flex' }}
              aria-label="Mở menu"
            >
              <Menu size={16} />
            </button>
            <span style={{ fontSize: 13.5, color: '#77766e' }}>
              Xin chào, <strong style={{ color: '#292923' }}>{currentUser?.HoTen}</strong> ({currentUser?.VaiTro})
            </span>
          </div>

          <button type="button" className="button button-muted button-sm" onClick={handleLogout}>
            <LogOut size={15} /> Đăng xuất
          </button>
        </header>

        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
