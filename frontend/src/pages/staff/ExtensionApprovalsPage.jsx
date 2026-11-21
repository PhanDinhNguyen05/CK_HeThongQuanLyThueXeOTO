import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rentalApi } from '../../api/endpoints';
import { formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

export default function ExtensionApprovalsPage() {
  const { currentUser } = useAuth();
  const {
    extensionRequests,
    customers,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState('Gia hạn thành viên');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const list = extensionRequests.filter((r) => r.LoaiYeuCau === tab);

  const handleApprove = async (req) => {
    if (req.TrangThai !== 'Chờ xét duyệt') {
      showToast('Yêu cầu này đã được xử lý trước đó.', 'warning');
      return;
    }
    try {
      await rentalApi.reviewExtension(req.MaYC, { action: 'approve' });
      await refreshForUser(currentUser);
      showToast(`Đã phê duyệt yêu cầu ${req.MaYC} (${req.LoaiYeuCau}).`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối.', 'error');
      return;
    }
    try {
      await rentalApi.reviewExtension(rejectTarget.MaYC, {
        action: 'reject',
        lyDoTuChoi: rejectReason.trim(),
      });
      await refreshForUser(currentUser);
      showToast(`Đã từ chối yêu cầu ${rejectTarget.MaYC}.`, 'info');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">XÉT DUYỆT GIA HẠN</span>
          <h1>Xét duyệt yêu cầu gia hạn</h1>
          <p>Phê duyệt hoặc từ chối yêu cầu gia hạn thành viên, gia hạn hợp đồng và gia hạn đặt chỗ.</p>
        </div>
      </div>

      <div className="tabs-bar">
        {['Gia hạn thành viên', 'Gia hạn hợp đồng', 'Gia hạn đặt chỗ'].map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t} ({extensionRequests.filter((r) => r.LoaiYeuCau === t && r.TrangThai === 'Chờ xét duyệt').length})
          </button>
        ))}
      </div>

      <div className="card">
        {list.length === 0 ? (
          <EmptyState title={`Không có yêu cầu ${tab.toLowerCase()} nào`} />
        ) : (
          <div className="table-wrap">
            <table className="auk-table">
              <thead>
                <tr>
                  <th>Mã YC</th>
                  <th>Khách hàng</th>
                  <th>Đối tượng</th>
                  <th>Đề nghị mới</th>
                  <th>Lý do</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => {
                  const kh = customers.find((c) => c.MaKH === r.MaKH);
                  const tv = members.find((m) => m.MaTV === r.MaDoiTuong);
                  const hd = contracts.find((c) => c.MaHD === r.MaDoiTuong);
                  const dd = bookings.find((b) => b.MaDD === r.MaDoiTuong);
                  return (
                    <tr key={r.MaYC}>
                      <td><strong>{r.MaYC}</strong></td>
                      <td>{kh?.HoVaTen || r.MaKH}</td>
                      <td>
                        <strong>{r.MaDoiTuong}</strong>
                        <div style={{ fontSize: 11.5, color: '#77766e' }}>
                          {tv && `Hạn cũ: ${formatDate(tv.NgayHetHan)}`}
                          {hd && `Trả cũ: ${formatDate(hd.NgayTra)}`}
                          {dd && `Trả cũ: ${formatDate(dd.NgayTra)}`}
                        </div>
                      </td>
                      <td>{r.GoiHoacNgayDeNghi}</td>
                      <td>{r.LyDo || '—'}</td>
                      <td>{formatDate(r.NgayGui)}</td>
                      <td>
                        <StatusBadge status={r.TrangThai} />
                        {r.LyDoTuChoi && <div style={{ fontSize: 11.5, color: '#c93b3b' }}>{r.LyDoTuChoi}</div>}
                      </td>
                      <td>
                        {r.TrangThai === 'Chờ xét duyệt' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="button button-gold button-sm"
                              onClick={() => handleApprove(r)}
                            >
                              Phê duyệt
                            </button>
                            <button
                              type="button"
                              className="button button-danger button-sm"
                              onClick={() => {
                                setRejectTarget(r);
                                setRejectReason('');
                              }}
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#77766e' }}>Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(rejectTarget)}
        title={`Từ chối yêu cầu ${rejectTarget?.MaYC}`}
        confirmText="Xác nhận từ chối"
        danger
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTarget(null)}
      >
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Lý do từ chối <em>*</em></span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối yêu cầu gia hạn..."
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
