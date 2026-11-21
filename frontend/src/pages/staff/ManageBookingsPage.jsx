import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

export default function ManageBookingsPage() {
  const { currentUser } = useAuth();
  const { bookings, customers, carModels, refreshForUser } = useData();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selectedId, setSelectedId] = useState(bookings[0]?.MaDD || null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = bookings.filter((b) => {
    const kh = customers.find((c) => c.MaKH === b.MaKH);
    const matchKw =
      !keyword.trim() ||
      b.MaDD.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      (kh?.HoVaTen || '').toLowerCase().includes(keyword.trim().toLowerCase());
    const matchStatus = statusFilter === 'Tất cả' || b.TrangThai === statusFilter;
    return matchKw && matchStatus;
  });

  const selected = bookings.find((b) => b.MaDD === selectedId) || null;
  const selectedCustomer = selected ? customers.find((c) => c.MaKH === selected.MaKH) : null;
  const selectedModel = selected ? carModels.find((m) => m.MaMauXe === selected.MaMauXe) : null;

  const handleApprove = async () => {
    if (!selected) return;
    try {
      const res = await bookingApi.process(selected.MaDD, { action: 'approve' });
      await refreshForUser(currentUser);
      setConfirmApprove(false);
      showToast(res.message || `Đã xác nhận đơn đặt xe ${selected.MaDD}!`, 'success');
    } catch (err) {
      setConfirmApprove(false);
      showToast(err.message, 'error');
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối đơn đặt xe.', 'error');
      return;
    }
    try {
      const res = await bookingApi.process(selected.MaDD, {
        action: 'reject',
        lyDo: rejectReason.trim(),
      });
      await refreshForUser(currentUser);
      setRejectModal(false);
      setRejectReason('');
      showToast(res.message || `Đã từ chối đơn ${selected.MaDD} và lưu lý do.`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">XỬ LÝ ĐƠN ĐẶT XE</span>
          <h1>Quản lý &amp; Xử lý đơn đặt xe</h1>
          <p>Kiểm tra tình trạng xe, điều kiện thuê và xác nhận hoặc từ chối đơn đặt xe của khách hàng.</p>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <label className="field">
            <span>Tìm kiếm mã đơn / tên khách hàng</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập mã đơn (DD001) hoặc tên khách..."
            />
          </label>
          <label className="field">
            <span>Trạng thái</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="Tất cả">Tất cả</option>
              <option value="Chờ xác nhận">Chờ xác nhận</option>
              <option value="Đã xác nhận">Đã xác nhận</option>
              <option value="Đã thực hiện">Đã thực hiện</option>
              <option value="Từ chối">Từ chối</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy đơn đặt xe nào" />
        ) : (
          <div className="table-wrap">
            <table className="auk-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Mẫu xe</th>
                  <th>Ngày đặt</th>
                  <th>Ngày nhận – trả</th>
                  <th>Giá dự kiến</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const kh = customers.find((c) => c.MaKH === b.MaKH);
                  const mx = carModels.find((m) => m.MaMauXe === b.MaMauXe);
                  return (
                    <tr key={b.MaDD}>
                      <td><strong>{b.MaDD}</strong></td>
                      <td>{kh?.HoVaTen || b.MaKH}</td>
                      <td>{mx?.TenMauXe || b.MaMauXe}</td>
                      <td>{formatDate(b.NgayDat)}</td>
                      <td>{formatDate(b.NgayNhan)} → {formatDate(b.NgayTra)}</td>
                      <td>{formatCurrency(b.TongGia)}</td>
                      <td><StatusBadge status={b.TrangThai} /></td>
                      <td>
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
              <label>Khách hàng</label>
              <div>{selectedCustomer?.HoVaTen} ({selectedCustomer?.DienThoai})</div>
            </div>
            <div className="detail-kv-item">
              <label>Giấy phép lái xe</label>
              <div>{selectedCustomer?.GiayPhepLaiXe}</div>
            </div>
            <div className="detail-kv-item">
              <label>Mẫu xe đặt</label>
              <div>{selectedModel?.TenMauXe}</div>
            </div>
            <div className="detail-kv-item">
              <label>Tổng giá đơn đặt xe</label>
              <div style={{ color: '#947849', fontSize: 17 }}>{formatCurrency(selected.TongGia)}</div>
            </div>
            <div className="detail-kv-item">
              <label>Trạng thái hiện tại</label>
              <div><StatusBadge status={selected.TrangThai} /></div>
            </div>
            <div className="detail-kv-item">
              <label>Lý do từ chối / Ghi chú</label>
              <div>{selected.LyDo || 'Không có'}</div>
            </div>
          </div>

          {selected.TrangThai === 'Chờ xác nhận' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-gold"
                onClick={() => setConfirmApprove(true)}
              >
                Xác nhận đơn
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={() => {
                  setRejectReason('');
                  setRejectModal(true);
                }}
              >
                Từ chối đơn
              </button>
              <button
                type="button"
                className="button button-muted"
                onClick={() => setSelectedId(null)}
              >
                Hủy thao tác
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmApprove}
        title="Xác nhận đơn đặt xe"
        message={`Xác nhận đơn ${selected?.MaDD} với tổng giá ${formatCurrency(selected?.TongGia)}?`}
        confirmText="Xác nhận đơn"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmModal
        open={rejectModal}
        title={`Từ chối đơn đặt xe ${selected?.MaDD}`}
        confirmText="Xác nhận từ chối"
        danger
        onConfirm={handleReject}
        onCancel={() => setRejectModal(false)}
      >
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Lý do từ chối đơn <em>*</em></span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối (vd: Xe không khả dụng trong thời gian yêu cầu)..."
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
