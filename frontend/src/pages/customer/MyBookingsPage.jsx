import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../api/endpoints';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

export default function MyBookingsPage() {
  const { currentUser } = useAuth();
  const { bookings, carModels, refreshForUser } = useData();
  const { showToast } = useToast();

  const myBookings = bookings.filter((b) => b.MaKH === currentUser?.MaKH);
  const [selectedId, setSelectedId] = useState(myBookings[0]?.MaDD || null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // UC34 - Yêu cầu gia hạn đặt chỗ
  const [extendTarget, setExtendTarget] = useState(null);
  const [newReturnDate, setNewReturnDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const selected = myBookings.find((b) => b.MaDD === selectedId) || null;
  const canCancel = (b) => ['Chờ xác nhận', 'Đã xác nhận'].includes(b.TrangThai);
  const canExtend = (b) => ['Chờ xác nhận', 'Đã xác nhận'].includes(b.TrangThai);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      const res = await bookingApi.cancel(cancelTarget.MaDD);
      await refreshForUser(currentUser);
      showToast(res.message || `Đã hủy đơn đặt xe ${cancelTarget.MaDD} thành công.`, 'success');
      setCancelTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const submitExtend = async () => {
    if (!extendTarget) return;
    if (!newReturnDate || newReturnDate <= extendTarget.NgayTra) {
      showToast('Ngày trả mới phải sau ngày trả hiện tại.', 'error');
      return;
    }
    try {
      const res = await bookingApi.requestExtension(extendTarget.MaDD, {
        NgayTraMoi: newReturnDate,
        LyDo: extendReason.trim() || 'Khách hàng yêu cầu gia hạn thời gian nhận/trả',
      });
      await refreshForUser(currentUser);
      showToast(res.message || 'Đã gửi yêu cầu gia hạn đặt chỗ.', 'success');
      setExtendTarget(null);
      setNewReturnDate('');
      setExtendReason('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap">
        <div className="page-header">
          <div>
            <span className="eyebrow">AUK CAR RENTAL</span>
            <h1>Đơn đặt xe của tôi</h1>
            <p>Theo dõi trạng thái đơn đặt xe, hủy đặt xe hoặc gửi yêu cầu gia hạn đặt chỗ.</p>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Danh sách đơn đặt xe</h3>
          {myBookings.length === 0 ? (
            <EmptyState title="Bạn chưa có đơn đặt xe nào" description="Hãy tìm kiếm mẫu xe và đặt thuê xe online." />
          ) : (
            <div className="table-wrap">
              <table className="auk-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Mẫu xe</th>
                    <th>Ngày nhận</th>
                    <th>Ngày trả</th>
                    <th>Tổng dự kiến</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((b) => {
                    const model = carModels.find((m) => m.MaMauXe === b.MaMauXe);
                    return (
                      <tr key={b.MaDD}>
                        <td><strong>{b.MaDD}</strong></td>
                        <td>{model?.TenMauXe || b.MaMauXe}</td>
                        <td>{formatDate(b.NgayNhan)}</td>
                        <td>{formatDate(b.NgayTra)}</td>
                        <td>{formatCurrency(b.TongGia)}</td>
                        <td><StatusBadge status={b.TrangThai} /></td>
                        <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="button button-dark button-sm"
                            onClick={() => setSelectedId(b.MaDD)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="card">
            <h3 className="card-title">Chi tiết đơn đặt xe {selected.MaDD}</h3>
            <div className="detail-kv" style={{ marginBottom: 18 }}>
              <div className="detail-kv-item">
                <label>Mã đơn đặt xe</label>
                <div>{selected.MaDD}</div>
              </div>
              <div className="detail-kv-item">
                <label>Mẫu xe</label>
                <div>{carModels.find((m) => m.MaMauXe === selected.MaMauXe)?.TenMauXe}</div>
              </div>
              <div className="detail-kv-item">
                <label>Ngày nhận – Ngày trả</label>
                <div>{formatDate(selected.NgayNhan)} → {formatDate(selected.NgayTra)}</div>
              </div>
              <div className="detail-kv-item">
                <label>Trạng thái đơn</label>
                <div><StatusBadge status={selected.TrangThai} /></div>
              </div>
              <div className="detail-kv-item">
                <label>Điều kiện hủy</label>
                <div>{canCancel(selected) ? 'Được phép hủy' : 'Không thể hủy'}</div>
              </div>
              <div className="detail-kv-item">
                <label>Ghi chú / Lý do</label>
                <div>{selected.LyDo || 'Không có'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {canCancel(selected) && (
                <button
                  type="button"
                  className="button button-danger button-sm"
                  onClick={() => setCancelTarget(selected)}
                >
                  Hủy đặt xe
                </button>
              )}
              {canExtend(selected) && (
                <button
                  type="button"
                  className="button button-gold button-sm"
                  onClick={() => {
                    setExtendTarget(selected);
                    setNewReturnDate('');
                    setExtendReason('');
                  }}
                >
                  Yêu cầu gia hạn đặt chỗ
                </button>
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          open={Boolean(cancelTarget)}
          title="Xác nhận hủy đơn đặt xe"
          message={`Bạn có chắc chắn muốn hủy đơn đặt xe ${cancelTarget?.MaDD} không?`}
          confirmText="Xác nhận hủy"
          danger
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />

        <ConfirmModal
          open={Boolean(extendTarget)}
          title={`Yêu cầu gia hạn đơn ${extendTarget?.MaDD}`}
          confirmText="Gửi yêu cầu gia hạn"
          onConfirm={submitExtend}
          onCancel={() => setExtendTarget(null)}
        >
          <p style={{ marginTop: 0, fontSize: 13.5, color: '#77766e' }}>
            Ngày trả dự kiến hiện tại: <strong>{formatDate(extendTarget?.NgayTra)}</strong>
          </p>
          <label className="field">
            <span>Ngày trả mới đề nghị <em>*</em></span>
            <input
              type="date"
              value={newReturnDate}
              min={extendTarget?.NgayTra || todayISO()}
              onChange={(e) => setNewReturnDate(e.target.value)}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Lý do gia hạn</span>
            <textarea
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              placeholder="Nhập lý do muốn gia hạn..."
            />
          </label>
        </ConfirmModal>
      </div>
    </section>
  );
}
