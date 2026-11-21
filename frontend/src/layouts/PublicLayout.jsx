import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, User, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { members } = useData();
  const navigate = useNavigate();

  const member = currentUser?.MaKH
    ? members.find((m) => m.MaKH === currentUser.MaKH)
    : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span>⌖ &nbsp;HỆ THỐNG THUÊ XE Ô TÔ AUK</span>
          <span>Hỗ trợ khách hàng &amp; nhân viên · Giao diện mô phỏng</span>
        </div>
      </div>

      <header className="brand-header">
        <div className="wrap brand-row">
          <Link to="/" className="brand">
            <span className="brand-symbol">✺</span>
            <span>
              AUK <b>CAR RENTAL</b>
              <small>ĐỒNG HÀNH TRÊN MỌI HÀNH TRÌNH</small>
            </span>
          </Link>
          <div className="brand-center">
            <strong>THUÊ XE TỰ LÁI · ĐẶT XE THUẬN TIỆN</strong>
            <span>Hệ thống quản lý thuê xe ô tô chuyên nghiệp</span>
          </div>
          <div className="brand-icon" aria-hidden="true">
            🚘
          </div>
        </div>
      </header>

      <nav className="main-nav" aria-label="Điều hướng chính">
        <div className="wrap nav-row">
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰ &nbsp; DANH MỤC
          </button>

          <div className={`nav-items${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
            <NavLink to="/" end>
              TRANG CHỦ
            </NavLink>
            <a href="/#gioi-thieu">GIỚI THIỆU</a>
            <NavLink to="/xe">DANH MỤC XE</NavLink>
            <a href="/#quy-trinh">QUY TRÌNH THUÊ XE</a>
            <a href="/#lien-he">LIÊN HỆ</a>
          </div>

          <div className="nav-auth">
            {!currentUser ? (
              <>
                <NavLink to="/dang-nhap">ĐĂNG NHẬP</NavLink>
                <NavLink to="/dang-ky" className="nav-register">
                  ĐĂNG KÝ
                </NavLink>
              </>
            ) : (
              <>
                {currentUser.VaiTro === 'Nhân viên' && (
                  <Link to="/nhan-vien">CỔNG NHÂN VIÊN</Link>
                )}
                {currentUser.VaiTro === 'Quản trị viên' && (
                  <Link to="/quan-tri">CỔNG QUẢN TRỊ</Link>
                )}
                {currentUser.VaiTro === 'Khách hàng' && (
                  <Link to="/khach-hang/ho-so">
                    <User size={14} /> {currentUser.HoTen}
                  </Link>
                )}
                <button type="button" className="nav-link-btn" onClick={handleLogout}>
                  <LogOut size={14} /> ĐĂNG XUẤT
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {currentUser?.VaiTro === 'Khách hàng' && (
        <div className="portal-bar">
          <div className="wrap portal-bar-inner">
            <div className="portal-tabs">
              <NavLink to="/xe">Tìm kiếm mẫu xe</NavLink>
              <NavLink to="/khach-hang/dat-xe">Đặt thuê xe online</NavLink>
              <NavLink to="/khach-hang/don-dat-xe">Đơn đặt xe của tôi</NavLink>
              <NavLink to="/khach-hang/lich-su-thue">Lịch sử thuê xe</NavLink>
              <NavLink to="/khach-hang/thanh-toan">Thanh toán</NavLink>
              <NavLink to="/khach-hang/thanh-vien">Thành viên</NavLink>
              <NavLink to="/khach-hang/ho-so">Thông tin cá nhân</NavLink>
            </div>
            <div style={{ fontSize: 12.5, color: '#80673d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={15} />
              {member ? `Thành viên ${member.MaTV} · ${member.DiemTichLuy} điểm` : 'Khách hàng chưa đăng ký thành viên'}
            </div>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer id="lien-he" className="footer">
        <div className="wrap footer-grid">
          <div>
            <div className="footer-brand">
              AUK <span>CAR RENTAL</span>
            </div>
            <p>
              Hệ thống quản lý thuê xe ô tô AUK dành cho khách hàng, thành viên, nhân viên và quản trị viên.
            </p>
          </div>
          <div>
            <h3>Liên kết</h3>
            <Link to="/">Trang chủ</Link>
            <Link to="/xe">Danh mục xe</Link>
            <a href="/#quy-trinh">Quy trình thuê xe</a>
          </div>
          <div>
            <h3>Tài khoản</h3>
            <Link to="/dang-nhap">Đăng nhập khách hàng / nhân viên</Link>
            <Link to="/dang-ky">Đăng ký khách hàng</Link>
          </div>
        </div>
        <div className="wrap footer-bottom">
          © {new Date().getFullYear()} AUK Car Rental · Giai đoạn 1 (Frontend mô phỏng · Chưa kết nối SQL Server)
        </div>
      </footer>
    </div>
  );
}
