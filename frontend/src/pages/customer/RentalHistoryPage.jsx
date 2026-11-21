import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rentalApi } from '../../api/endpoints';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';

export default function RentalHistoryPage() {
  const { currentUser } = useAuth();
  const {
    contracts,
    cars,
    carModels,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState({ status: 'Tất cả', from: '', to: '' });
  const [detailContract, setDetailContract] = useState(null);

  // UC13 - Yêu cầu gia hạn hợp đồng
  const [extendContract, setExtendContract] = useState(null);
  const [proposedDate, setProposedDate] = useState('');

  const myContracts = contracts.filter((c) => c.MaKH === currentUser?.MaKH);

  const filtered = myContracts.filter((c) => {
    const matchStatus = applied.status === 'Tất cả' || c.TrangThaiHopDong === applied.status;
    const matchFrom = !applied.from || c.NgayBatDau >= applied.from;
    const matchTo = !applied.to || c.NgayBatDau <= applied.to;
    return matchStatus && matchFrom && matchTo;
  });

  const handleFilter = (e) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      showToast('Khoảng thời gian lọc không hợp lệ (Từ ngày phải trước hoặc bằng Đến ngày).', 'error');
      return;
    }
    setApplied({ status: statusFilter, from: fromDate, to: toDate });
  };

  const handleExtendSubmit = async () => {
    if (!extendContract) return;
    if (!proposedDate || proposedDate <= extendContract.NgayTra) {
      showToast('Ngày trả đề nghị phải sau ngày trả hiện tại của hợp đồng.', 'error');
      return;
    }
    try {
      const res = await rentalApi.requestExtension(extendContract.MaHD, {
        NgayTraDeNghi: proposedDate,
        LyDo: 'Gia hạn hợp đồng đang thuê',
      });
      await refreshForUser(currentUser);
      showToast(res.message || 'Đã gửi yêu cầu gia hạn hợp đồng.', 'success');
      setExtendContract(null);
      setProposedDate('');
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
            <h1>Lịch sử thuê xe &amp; Gia hạn hợp đồng</h1>
            <p>Tra cứu các hợp đồng thuê xe của bạn và gửi yêu cầu gia hạn khi đang thuê.</p>
          </div>
        </div>

        <form className="card" onSubmit={handleFilter}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <label className="field">
              <span>Từ ngày</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Đến ngày</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Trạng thái</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="Tất cả">Tất cả</option>
                <option value="Đang thuê">Đang thuê</option>
                <option value="Hoàn tất">Hoàn tất</option>
                <option value="Quá hạn">Quá hạn</option>
              </select>
            </label>
            <button type="submit" className="button button-gold">
              <Filter size={15} /> Lọc
            </button>
          </div>
        </form>

        <div className="card">
          <h3 className="card-title">Danh sách hợp đồng ({filtered.length} kết quả)</h3>
          {myContracts.length === 0 ? (
            <EmptyState title="Bạn chưa có lịch sử thuê xe" />
          ) : filtered.length === 0 ? (
            <EmptyState title="Không có kết quả phù hợp" description="Vui lòng điều chỉnh bộ lọc." />
          ) : (
            <div className="table-wrap">
              <table className="auk-table">
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Mẫu xe / Biển số</th>
                    <th>Thời gian thuê</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const car = cars.find((x) => x.MaXe === c.MaXe);
                    const model = carModels.find((m) => m.MaMauXe === car?.MaMauXe);
                    return (
                      <tr key={c.MaHD}>
                        <td><strong>{c.MaHD}</strong></td>
                        <td>{model?.TenMauXe || '—'} ({car?.BienSo})</td>
                        <td>{formatDate(c.NgayBatDau)} → {formatDate(c.NgayTra)}</td>
                        <td><strong>{formatCurrency(c.TongTien)}</strong></td>
                        <td><StatusBadge status={c.TrangThaiHopDong} /></td>
                        <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="button button-dark button-sm"
                            onClick={() => setDetailContract(c)}
                          >
                            Xem chi tiết
                          </button>
                          {c.TrangThaiHopDong === 'Đang thuê' && (
                            <button
                              type="button"
                              className="button button-gold button-sm"
                              onClick={() => {
                                setExtendContract(c);
                                setProposedDate('');
                              }}
                            >
                              Gia hạn HĐ
                            </button>
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
          open={Boolean(detailContract)}
          title={`Chi tiết hợp đồng ${detailContract?.MaHD}`}
          confirmText="Đóng"
          cancelText="Quay lại"
          onConfirm={() => setDetailContract(null)}
          onCancel={() => setDetailContract(null)}
        >
          {detailContract && (
            <div className="detail-kv">
              <div className="detail-kv-item">
                <label>Số hợp đồng</label>
                <div>{detailContract.SoHD}</div>
              </div>
              <div className="detail-kv-item">
                <label>Trạng thái</label>
                <div><StatusBadge status={detailContract.TrangThaiHopDong} /></div>
              </div>
              <div className="detail-kv-item">
                <label>Tiền đặt cọc</label>
                <div>{formatCurrency(detailContract.TienDatCoc)}</div>
              </div>
              <div className="detail-kv-item">
                <label>Đã thanh toán / Còn nợ</label>
                <div>{formatCurrency(detailContract.TienDaThu)} / {formatCurrency(detailContract.TienConNo)}</div>
              </div>
              <div className="detail-kv-item wide" style={{ gridColumn: '1 / -1' }}>
                <label>Nội dung</label>
                <div>{detailContract.NoiDung}</div>
              </div>
            </div>
          )}
        </ConfirmModal>

        <ConfirmModal
          open={Boolean(extendContract)}
          title={`Yêu cầu gia hạn hợp đồng ${extendContract?.MaHD}`}
          confirmText="Gửi yêu cầu gia hạn"
          onConfirm={handleExtendSubmit}
          onCancel={() => setExtendContract(null)}
        >
          <p style={{ marginTop: 0, fontSize: 13.5, color: '#77766e' }}>
            Ngày trả hiện tại: <strong>{formatDate(extendContract?.NgayTra)}</strong>
          </p>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Gia hạn đến ngày <em>*</em></span>
            <input
              type="date"
              value={proposedDate}
              min={extendContract?.NgayTra || todayISO()}
              onChange={(e) => setProposedDate(e.target.value)}
            />
          </label>
        </ConfirmModal>
      </div>
    </section>
  );
}
