import React, { useState } from 'react';
import { ScanBarcode, Search, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rentalApi } from '../../api/endpoints';
import { calcDays, formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function ReturnCarPage() {
  const { currentUser } = useAuth();
  const {
    contracts,
    cars,
    carModels,
    customers,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedContractId, setSelectedContractId] = useState(
    contracts.find((c) => c.TrangThaiHopDong === 'Đang thuê')?.MaHD || ''
  );
  const [actualReturnDate, setActualReturnDate] = useState(todayISO());
  const [fuelLevel, setFuelLevel] = useState('Đầy bình (100%)');
  const [carCondition, setCarCondition] = useState('Bình thường');
  const [note, setNote] = useState('');

  const activeContracts = contracts.filter((c) => c.TrangThaiHopDong === 'Đang thuê');

  const handleLookup = (e) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const found = activeContracts.find((c) => {
      const car = cars.find((x) => x.MaXe === c.MaXe);
      return (
        c.MaHD.toLowerCase() === q ||
        c.SoHD.toLowerCase() === q ||
        c.MaXe.toLowerCase() === q ||
        (car?.BienSo || '').toLowerCase() === q ||
        (car?.MaVach || '').toLowerCase() === q
      );
    });
    if (!found) {
      showToast('Không tìm thấy giao dịch thuê đang hiệu lực phù hợp với thông tin vừa nhập.', 'error');
      return;
    }
    setSelectedContractId(found.MaHD);
    showToast(`Đã nhận diện giao dịch ${found.MaHD}.`, 'success');
  };

  const selectedContract = activeContracts.find((c) => c.MaHD === selectedContractId) || null;
  const selectedCar = selectedContract ? cars.find((x) => x.MaXe === selectedContract.MaXe) : null;
  const selectedModel = selectedCar ? carModels.find((m) => m.MaMauXe === selectedCar.MaMauXe) : null;
  const selectedCustomer = selectedContract
    ? customers.find((c) => c.MaKH === selectedContract.MaKH)
    : null;

  const lateDays =
    selectedContract && actualReturnDate > selectedContract.NgayTra
      ? calcDays(selectedContract.NgayTra, actualReturnDate)
      : 0;
  const hasFuelIssue = fuelLevel !== 'Đầy bình (100%)';
  const hasDamage = carCondition !== 'Bình thường';

  const handleCompleteReturn = async (e) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (!actualReturnDate) {
      showToast('Vui lòng nhập thời điểm trả xe.', 'error');
      return;
    }

    try {
      const res = await rentalApi.returnCar(selectedContract.MaHD, {
        NgayTraThucTe: actualReturnDate,
        MucNhienLieu: fuelLevel,
        TinhTrangXe: carCondition,
        GhiChu: note.trim(),
      });
      await refreshForUser(currentUser);
      const genCount = res.data?.generatedPenalties?.length || 0;
      const nextStatus = res.data?.carStatus || (carCondition === 'Hư hỏng' ? 'Bảo trì' : 'Sẵn sàng');
      showToast(
        `Đã hoàn tất trả xe ${selectedCar?.BienSo}. Xe chuyển sang "${nextStatus}".${
          genCount ? ` Đã ghi nhận ${genCount} khoản phát sinh.` : ''
        }`,
        'success'
      );
      setSelectedContractId('');
      setNote('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">XỬ LÝ TRẢ XE</span>
          <h1>Tiếp nhận &amp; Xử lý trả xe</h1>
          <p>Quét mã vạch (hoặc nhập biển số / mã hợp đồng), đối chiếu tình trạng xe và hoàn tất giao dịch.</p>
        </div>
      </div>

      <form className="card" onSubmit={handleLookup}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <label className="field">
            <span>Quét mã vạch / Nhập biển số / Mã hợp đồng</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ví dụ: BC-XE02, 51H-67890, HD001..."
            />
          </label>
          <button type="submit" className="button button-gold">
            <Search size={16} /> Tra cứu giao dịch
          </button>
          <button
            type="button"
            className="button button-dark"
            onClick={() => {
              if (activeContracts[0]) {
                setQuery('BC-XE02');
                setSelectedContractId(activeContracts[0].MaHD);
                showToast(`Đã quét mã vạch xe cho hợp đồng ${activeContracts[0].MaHD}.`, 'info');
              } else {
                showToast('Hiện không có xe nào đang thuê để quét.', 'warning');
              }
            }}
          >
            <ScanBarcode size={16} /> Mô phỏng quét mã vạch
          </button>
        </div>
      </form>

      {activeContracts.length === 0 ? (
        <div className="card">
          <EmptyState title="Không có giao dịch thuê xe nào đang hiệu lực" description="Tất cả xe đang thuê đã được trả." />
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 className="card-title">Giao dịch đang thuê ({activeContracts.length})</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {activeContracts.map((c) => {
                const car = cars.find((x) => x.MaXe === c.MaXe);
                const kh = customers.find((x) => x.MaKH === c.MaKH);
                return (
                  <div
                    key={c.MaHD}
                    onClick={() => setSelectedContractId(c.MaHD)}
                    style={{
                      padding: 14,
                      borderRadius: 4,
                      border: selectedContractId === c.MaHD ? '1.5px solid #b69a65' : '1px solid #e8e3d9',
                      background: selectedContractId === c.MaHD ? '#fbfaf7' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{c.MaHD} · {car?.BienSo}</strong>
                      <StatusBadge status={c.TrangThaiHopDong} />
                    </div>
                    <div style={{ fontSize: 13, color: '#555349' }}>Khách: {kh?.HoVaTen}</div>
                    <div style={{ fontSize: 12, color: '#77766e' }}>
                      Hạn trả dự kiến: {formatDate(c.NgayTra)} · Mã vạch: {car?.MaVach}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedContract && (
            <form className="card" onSubmit={handleCompleteReturn}>
              <h3 className="card-title">Kiểm tra &amp; Đối chiếu trả xe ({selectedContract.MaHD})</h3>
              <div className="detail-kv" style={{ marginBottom: 18, padding: 12, background: '#fbfaf7', borderRadius: 4 }}>
                <div className="detail-kv-item">
                  <label>Khách hàng</label>
                  <div>{selectedCustomer?.HoVaTen}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Xe / Mẫu xe</label>
                  <div>{selectedCar?.BienSo} · {selectedModel?.TenMauXe}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Hạn trả hợp đồng</label>
                  <div>{formatDate(selectedContract.NgayTra)}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Nhiên liệu lúc giao</label>
                  <div>{selectedContract.MucNhienLieuGiao}</div>
                </div>
              </div>

              <label className="field">
                <span>Thời điểm trả thực tế <em>*</em></span>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Mức nhiên liệu khi trả <em>*</em></span>
                <select value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)}>
                  <option value="Đầy bình (100%)">Đầy bình (100%)</option>
                  <option value="3/4 bình">3/4 bình (Thiếu nhiên liệu)</option>
                  <option value="1/2 bình">1/2 bình (Thiếu nhiên liệu)</option>
                  <option value="Dưới 1/4 bình">Dưới 1/4 bình (Thiếu nhiên liệu)</option>
                </select>
              </label>

              <label className="field">
                <span>Tình trạng thực tế của xe <em>*</em></span>
                <select value={carCondition} onChange={(e) => setCarCondition(e.target.value)}>
                  <option value="Bình thường">Bình thường</option>
                  <option value="Trầy xước nhẹ">Trầy xước nhẹ</option>
                  <option value="Hư hỏng">Hư hỏng (Cần bảo trì)</option>
                </select>
              </label>

              <label className="field">
                <span>Ghi chú kiểm tra</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi nhận tình trạng thực tế (nếu có)..."
                />
              </label>

              {(lateDays > 0 || hasFuelIssue || hasDamage) && (
                <div className="form-message error">
                  <strong>Phát hiện phát sinh:</strong>{' '}
                  {[
                    lateDays > 0 ? `Quá hạn ${lateDays} ngày` : '',
                    hasFuelIssue ? 'Thiếu nhiên liệu' : '',
                    hasDamage ? carCondition : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  . Hệ thống sẽ tự động ghi nhận khoản phạt chưa thanh toán.
                </div>
              )}

              <button type="submit" className="button button-gold full">
                <CheckCircle2 size={16} /> Xác nhận hoàn tất trả xe
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
