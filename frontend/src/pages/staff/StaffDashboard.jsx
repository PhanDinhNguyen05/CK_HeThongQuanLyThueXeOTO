import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

export default function StaffDashboard() {
  const { bookings, cars, contracts, extensionRequests, penalties, customers, carModels } = useData();

  const pendingBookings = bookings.filter((b) => b.TrangThai === 'Chờ xác nhận');
  const readyCars = cars.filter((c) => c.TrangThai === 'Sẵn sàng').length;
  const activeContracts = contracts.filter((c) => c.TrangThaiHopDong === 'Đang thuê').length;
  const pendingExtensions = extensionRequests.filter((e) => e.TrangThai === 'Chờ xét duyệt').length;
  const unpaidPenalties = penalties.filter((p) => p.TrangThaiThanhToan === 'Chưa thanh toán').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">CỔNG NHÂN VIÊN AUK</span>
          <h1>Tổng quan vận hành</h1>
          <p>Theo dõi nhanh đơn đặt xe, tình trạng đội xe, hợp đồng thuê và yêu cầu gia hạn.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/nhan-vien/thue-xe" className="button button-gold button-sm">
            + Lập hợp đồng thuê xe
          </Link>
          <Link to="/nhan-vien/tra-xe" className="button button-dark button-sm">
            Xử lý trả xe
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Đơn đặt xe chờ xử lý</div>
          <div className="stat-value">{pendingBookings.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Xe sẵn sàng cho thuê</div>
          <div className="stat-value">{readyCars} / {cars.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hợp đồng đang thuê</div>
          <div className="stat-value">{activeContracts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Yêu cầu gia hạn / Phạt chưa thu</div>
          <div className="stat-value">{pendingExtensions} / {unpaidPenalties}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Đơn đặt xe cần xử lý</h3>
          <Link to="/nhan-vien/don-dat-xe" className="button button-outline button-sm">
            Xem tất cả
          </Link>
        </div>
        <div className="table-wrap">
          <table className="auk-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Mẫu xe</th>
                <th>Thời gian thuê</th>
                <th>Tổng dự kiến</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((b) => {
                const kh = customers.find((c) => c.MaKH === b.MaKH);
                const mx = carModels.find((m) => m.MaMauXe === b.MaMauXe);
                return (
                  <tr key={b.MaDD}>
                    <td><strong>{b.MaDD}</strong></td>
                    <td>{kh?.HoVaTen || b.MaKH}</td>
                    <td>{mx?.TenMauXe || b.MaMauXe}</td>
                    <td>{formatDate(b.NgayNhan)} → {formatDate(b.NgayTra)}</td>
                    <td>{formatCurrency(b.TongGia)}</td>
                    <td><StatusBadge status={b.TrangThai} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
