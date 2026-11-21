import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, todayISO } from '../../utils/formatters';

export default function HomePage() {
  const { carModels, segments, cars } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedModel, setSelectedModel] = useState(carModels[0]?.MaMauXe || '');
  const [ngayNhan, setNgayNhan] = useState(todayISO());
  const [ngayTra, setNgayTra] = useState('');

  const handleQuickBooking = (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Vui lòng đăng nhập tài khoản khách hàng để đặt thuê xe online.', 'warning');
      navigate('/dang-nhap');
      return;
    }
    if (currentUser.VaiTro !== 'Khách hàng') {
      showToast('Chức năng đặt xe online dành cho tài khoản Khách hàng.', 'warning');
      return;
    }
    navigate('/khach-hang/dat-xe', {
      state: { maMauXe: selectedModel, ngayNhan, ngayTra },
    });
  };

  return (
    <>
      <section className="hero">
        <div className="wrap hero-content">
          <div className="hero-label">AUK CAR RENTAL SYSTEM</div>
          <h1>ĐẶT XE NHANH CHÓNG</h1>
          <h2>TRẢI NGHIỆM HÀNH TRÌNH ĐẲNG CẤP</h2>
          <p>
            Hệ thống quản lý thuê xe ô tô AUK hỗ trợ tra cứu mẫu xe, đặt xe trực tuyến,
            quản lý hợp đồng thuê, trả xe và thanh toán minh bạch.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/xe" className="button button-gold">
              KHÁM PHÁ DANH MỤC XE
            </Link>
            <Link to="/dang-ky" className="button button-muted">
              ĐĂNG KÝ KHÁCH HÀNG
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap booking-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ĐẶT XE TRỰC TUYẾN</span>
            <h2>Tra cứu &amp; Đặt thuê xe nhanh</h2>
          </div>
          <span className="demo-note">Hỗ trợ khách hàng &amp; thành viên AUK</span>
        </div>
        <form className="booking-grid" onSubmit={handleQuickBooking}>
          <label>
            Mẫu xe mong muốn
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {carModels.map((m) => (
                <option key={m.MaMauXe} value={m.MaMauXe}>
                  {m.TenMauXe} ({formatCurrency(m.GiaThueNgay)}/ngày)
                </option>
              ))}
            </select>
          </label>
          <label>
            Ngày nhận xe
            <input
              type="date"
              value={ngayNhan}
              min={todayISO()}
              onChange={(e) => setNgayNhan(e.target.value)}
            />
          </label>
          <label>
            Ngày trả xe
            <input
              type="date"
              value={ngayTra}
              min={ngayNhan || todayISO()}
              onChange={(e) => setNgayTra(e.target.value)}
            />
          </label>
          <button type="submit" className="button button-gold booking-submit">
            TIẾP TỤC ĐẶT XE
          </button>
        </form>
      </section>

      <section id="gioi-thieu" className="section">
        <div className="wrap">
          <div className="section-heading">
            <span className="eyebrow">VỀ HỆ THỐNG AUK</span>
            <h2>Dịch vụ thuê xe chuẩn mực &amp; minh bạch</h2>
            <p>
              Quản lý đồng bộ từ khâu đặt chỗ, kiểm tra bằng lái, giao nhận xe bằng mã vạch
              đến bảo dưỡng định kỳ và chăm sóc thành viên.
            </p>
          </div>
          <div className="feature-grid">
            <div className="feature">
              <span>🚘</span>
              <h3>Đội xe đa dạng, kiểm định kỹ</h3>
              <p>
                Từ Sedan tiết kiệm đến SUV 7 chỗ và Luxury hạng sang, bảo dưỡng định kỳ trước mỗi chuyến đi.
              </p>
            </div>
            <div className="feature">
              <span>🛡️</span>
              <h3>Hợp đồng &amp; chi phí rõ ràng</h3>
              <p>
                Mọi điều khoản thuê, tiền cọc, phí phát sinh và lịch sử giao dịch được ghi nhận minh bạch.
              </p>
            </div>
            <div className="feature">
              <span>⭐</span>
              <h3>Ưu đãi Thành viên AUK</h3>
              <p>
                Thành viên được tích lũy điểm sau mỗi giao dịch hợp lệ và gia hạn thẻ thuận tiện.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="xe" className="section section-soft">
        <div className="wrap">
          <div className="section-heading">
            <span className="eyebrow">DANH MỤC MẪU XE NỔI BẬT</span>
            <h2>Lựa chọn chiếc xe phù hợp với bạn</h2>
            <p>Xem thông số kỹ thuật chi tiết và tình trạng xe sẵn sàng tại cửa hàng.</p>
          </div>
          <div className="category-grid">
            {carModels.slice(0, 6).map((m) => {
              const seg = segments.find((s) => s.MaPhanKhuc === m.MaPhanKhuc);
              const readyCount = cars.filter(
                (c) => c.MaMauXe === m.MaMauXe && c.TrangThai === 'Sẵn sàng'
              ).length;
              return (
                <div key={m.MaMauXe} className="category">
                  <div className="category-art">
                    <img src={m.AnhPoster} alt={m.TenMauXe} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="badge badge-muted">{seg?.TenPhanKhuc || 'Ô tô'}</span>
                    <span style={{ fontSize: 12, color: readyCount > 0 ? '#287d4f' : '#c93b3b', fontWeight: 600 }}>
                      {readyCount > 0 ? `${readyCount} xe sẵn sàng` : 'Tạm hết xe'}
                    </span>
                  </div>
                  <h3>{m.TenMauXe}</h3>
                  <p style={{ marginBottom: 14 }}>{m.MoTa}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#947849', fontSize: 16 }}>
                      {formatCurrency(m.GiaThueNgay)} <small style={{ fontWeight: 400, color: '#77766e' }}>/ ngày</small>
                    </strong>
                    <Link to={`/xe/${m.MaMauXe}`} className="button button-dark button-sm">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link to="/xe" className="button button-gold">
              XEM TẤT CẢ MẪU XE &amp; TÌM KIẾM
            </Link>
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="section">
        <div className="wrap">
          <div className="section-heading">
            <span className="eyebrow">QUY TRÌNH THUÊ XE</span>
            <h2>3 bước đơn giản cùng AUK Car Rental</h2>
            <p>Quy trình chuẩn hóa giúp khách hàng và nhân viên phối hợp nhanh gọn.</p>
          </div>
          <div className="steps">
            <div>
              <b>01</b>
              <strong>Tìm xe &amp; Đặt chỗ online</strong>
              <span>Tra cứu mẫu xe phù hợp, chọn ngày nhận – trả và gửi đơn đặt xe trực tuyến.</span>
            </div>
            <div>
              <b>02</b>
              <strong>Xác nhận &amp; Lập hợp đồng</strong>
              <span>Nhân viên kiểm tra xe trống, xác minh GPLX và lập hợp đồng thuê xe minh bạch.</span>
            </div>
            <div>
              <b>03</b>
              <strong>Nhận xe, Trả xe &amp; Thanh toán</strong>
              <span>Nhận xe đúng hẹn, kiểm tra đối chiếu khi trả xe và thanh toán thuận tiện.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
