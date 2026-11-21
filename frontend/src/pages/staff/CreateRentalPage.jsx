import React, { useState } from 'react';
import { FileCheck2, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rentalApi } from '../../api/endpoints';
import { calcDays, formatCurrency, todayISO, validateLicense, validatePhone } from '../../utils/formatters';

export default function CreateRentalPage() {
  const { currentUser } = useAuth();
  const {
    carModels,
    cars,
    customers,
    members,
    bookings,
    penalties,
    setPenalties,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  // Nguồn: từ đơn đặt xe hoặc tạo mới
  const confirmedBookings = bookings.filter((b) => b.TrangThai === 'Đã xác nhận');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  // Bước chọn mẫu xe & xe cụ thể
  const [maMauXe, setMaMauXe] = useState(carModels[0]?.MaMauXe || '');
  const [maXe, setMaXe] = useState('');
  const [ngayNhan, setNgayNhan] = useState(todayISO());
  const [ngayTra, setNgayTra] = useState('');

  // Chế độ khách hàng: Thành viên / Khách đã có hồ sơ / Khách vãng lai
  const [customerMode, setCustomerMode] = useState('member'); // 'member' | 'walkin'
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.MaKH || '');
  const [walkin, setWalkin] = useState({ HoVaTen: '', DienThoai: '', SoDinhDanh: '', GiayPhepLaiXe: '' });
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [deposit, setDeposit] = useState(3000000);
  const [notes, setNotes] = useState('');

  const readyCarsForModel = cars.filter((c) => c.MaMauXe === maMauXe && c.TrangThai === 'Sẵn sàng');
  const selectedModel = carModels.find((m) => m.MaMauXe === maMauXe);
  const alternativeModels = carModels.filter(
    (m) => m.MaMauXe !== maMauXe && cars.some((c) => c.MaMauXe === m.MaMauXe && c.TrangThai === 'Sẵn sàng')
  );

  const activeCustomer =
    customerMode === 'member' ? customers.find((c) => c.MaKH === selectedCustomerId) : null;
  const activeMember = activeCustomer
    ? members.find((m) => m.MaKH === activeCustomer.MaKH)
    : null;

  const customerUnpaidPenalties = activeCustomer
    ? penalties.filter((p) => p.MaKH === activeCustomer.MaKH && p.TrangThaiThanhToan === 'Chưa thanh toán')
    : [];
  const totalDebt = customerUnpaidPenalties.reduce((s, p) => s + p.SoTienPhat, 0);

  const days = calcDays(ngayNhan, ngayTra);
  const rentalFee = selectedModel && days > 0 ? selectedModel.GiaThueNgay * days : 0;

  const handleSelectBooking = (maDD) => {
    setSelectedBookingId(maDD);
    const bk = bookings.find((b) => b.MaDD === maDD);
    if (bk) {
      setMaMauXe(bk.MaMauXe);
      setNgayNhan(bk.NgayNhan);
      setNgayTra(bk.NgayTra);
      setCustomerMode('member');
      setSelectedCustomerId(bk.MaKH);
      const firstReady = cars.find((c) => c.MaMauXe === bk.MaMauXe && c.TrangThai === 'Sẵn sàng');
      setMaXe(firstReady?.MaXe || '');
    }
  };

  const handleClearDebt = () => {
    if (!activeCustomer) return;
    setPenalties((prev) =>
      prev.map((p) =>
        p.MaKH === activeCustomer.MaKH && p.TrangThaiThanhToan === 'Chưa thanh toán'
          ? { ...p, TrangThaiThanhToan: 'Đã thanh toán' }
          : p
      )
    );
    showToast(`Đã ghi nhận thanh toán khoản nợ cũ ${formatCurrency(totalDebt)} cho ${activeCustomer.HoVaTen}.`, 'success');
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();

    if (!maXe) {
      showToast('Vui lòng chọn chiếc xe cụ thể đang ở trạng thái Sẵn sàng.', 'error');
      return;
    }
    if (!ngayNhan || !ngayTra || ngayTra <= ngayNhan) {
      showToast('Ngày nhận và ngày trả xe không hợp lệ.', 'error');
      return;
    }

    if (customerMode === 'member') {
      if (!activeCustomer) {
        showToast('Vui lòng chọn khách hàng.', 'error');
        return;
      }
    } else if (!walkin.HoVaTen.trim() || !validatePhone(walkin.DienThoai) || !validateLicense(walkin.GiayPhepLaiXe)) {
      showToast('Vui lòng nhập đầy đủ Tên, SĐT (10 chữ số) và GPLX hợp lệ cho khách vãng lai.', 'error');
      return;
    }

    try {
      const res = await rentalApi.createContract({
        MaDD: selectedBookingId || null,
        MaXe: maXe,
        MaKH: customerMode === 'member' ? selectedCustomerId : null,
        walkin: customerMode === 'walkin' ? walkin : null,
        NgayNhan: ngayNhan,
        NgayTra: ngayTra,
        TienDatCoc: Number(deposit) || 0,
        NoiDung: notes.trim(),
        PhuongThuc: paymentMethod,
      });
      await refreshForUser(currentUser);
      showToast(res.message || `Lập hợp đồng thuê xe ${res.data?.MaHD} thành công!`, 'success');
      setSelectedBookingId('');
      setMaXe('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">THUÊ XE &amp; LẬP HỢP ĐỒNG</span>
          <h1>Thuê xe &amp; Lập hợp đồng thuê xe</h1>
          <p>Kiểm tra xe sẵn sàng, xác minh hồ sơ / GPLX / công nợ và tạo hợp đồng thuê xe.</p>
        </div>
      </div>

      <form onSubmit={handleCreateContract}>
        <div className="card">
          <h3 className="card-title">1. Nguồn yêu cầu &amp; Chọn xe</h3>
          <div className="register-grid" style={{ marginTop: 0 }}>
            <label className="field">
              <span>Từ đơn đặt xe đã xác nhận (tùy chọn)</span>
              <select value={selectedBookingId} onChange={(e) => handleSelectBooking(e.target.value)}>
                <option value="">-- Tạo giao dịch thuê trực tiếp tại quầy --</option>
                {confirmedBookings.map((b) => (
                  <option key={b.MaDD} value={b.MaDD}>
                    {b.MaDD} - {customers.find((c) => c.MaKH === b.MaKH)?.HoVaTen}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Mẫu xe <em>*</em></span>
              <select
                value={maMauXe}
                onChange={(e) => {
                  setMaMauXe(e.target.value);
                  setMaXe('');
                }}
              >
                {carModels.map((m) => (
                  <option key={m.MaMauXe} value={m.MaMauXe}>
                    {m.TenMauXe} ({formatCurrency(m.GiaThueNgay)}/ngày)
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Chiếc xe cụ thể (Sẵn sàng) <em>*</em></span>
              <select value={maXe} onChange={(e) => setMaXe(e.target.value)}>
                <option value="">-- Chọn biển số xe --</option>
                {readyCarsForModel.map((c) => (
                  <option key={c.MaXe} value={c.MaXe}>
                    {c.BienSo} · {c.MauSac} · SX {c.NamSanXuat}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Hình thức thanh toán</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Thẻ tín dụng">Thẻ tín dụng</option>
              </select>
            </label>

            <label className="field">
              <span>Ngày nhận xe <em>*</em></span>
              <input type="date" value={ngayNhan} onChange={(e) => setNgayNhan(e.target.value)} />
            </label>

            <label className="field">
              <span>Ngày trả xe <em>*</em></span>
              <input type="date" value={ngayTra} min={ngayNhan} onChange={(e) => setNgayTra(e.target.value)} />
            </label>
          </div>

          {readyCarsForModel.length === 0 && (
            <div className="form-message error" style={{ marginTop: 10 }}>
              <AlertCircle size={16} style={{ verticalAlign: 'middle' }} /> Mẫu xe này hiện không còn xe ở trạng thái Sẵn sàng.
              {alternativeModels.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>Gợi ý mẫu thay thế:</span>
                  {alternativeModels.slice(0, 3).map((alt) => (
                    <button
                      key={alt.MaMauXe}
                      type="button"
                      className="button button-outline button-sm"
                      onClick={() => {
                        setMaMauXe(alt.MaMauXe);
                        setMaXe('');
                      }}
                    >
                      Chọn {alt.TenMauXe}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">2. Thông tin khách hàng &amp; Kiểm tra điều kiện</h3>
          <div className="role-picker" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 420 }}>
            <label>
              <input
                type="radio"
                name="customerMode"
                checked={customerMode === 'member'}
                onChange={() => setCustomerMode('member')}
              />
              <span>Khách hàng / Thành viên đã lưu</span>
            </label>
            <label>
              <input
                type="radio"
                name="customerMode"
                checked={customerMode === 'walkin'}
                onChange={() => setCustomerMode('walkin')}
              />
              <span>Khách vãng lai</span>
            </label>
          </div>

          {customerMode === 'member' ? (
            <>
              <label className="field">
                <span>Chọn khách hàng từ hồ sơ hệ thống</span>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                  {customers.map((c) => (
                    <option key={c.MaKH} value={c.MaKH}>
                      {c.MaKH} - {c.HoVaTen} ({c.DienThoai})
                    </option>
                  ))}
                </select>
              </label>

              {activeCustomer && (
                <div className="detail-kv" style={{ padding: 14, background: '#fbfaf7', border: '1px solid #e8e3d9', borderRadius: 4 }}>
                  <div className="detail-kv-item">
                    <label>CCCD &amp; GPLX</label>
                    <div>{activeCustomer.SoDinhDanh} · {activeCustomer.GiayPhepLaiXe}</div>
                  </div>
                  <div className="detail-kv-item">
                    <label>Thẻ thành viên</label>
                    <div>{activeMember ? `${activeMember.MaTV} (${activeMember.DiemTichLuy} điểm)` : 'Chưa đăng ký thành viên'}</div>
                  </div>
                </div>
              )}

              {totalDebt > 0 && (
                <div className="form-message error" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <span>Khách hàng còn khoản nợ chưa thanh toán: <strong>{formatCurrency(totalDebt)}</strong></span>
                  <button type="button" className="button button-dark button-sm" onClick={handleClearDebt}>
                    Xác nhận thanh toán nợ cũ
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="register-grid" style={{ marginTop: 0 }}>
              <label className="field">
                <span>Họ và tên khách vãng lai <em>*</em></span>
                <input
                  type="text"
                  value={walkin.HoVaTen}
                  onChange={(e) => setWalkin({ ...walkin, HoVaTen: e.target.value })}
                  placeholder="Nhập họ tên"
                />
              </label>
              <label className="field">
                <span>Số điện thoại <em>*</em></span>
                <input
                  type="text"
                  value={walkin.DienThoai}
                  onChange={(e) => setWalkin({ ...walkin, DienThoai: e.target.value })}
                  placeholder="10 chữ số"
                />
              </label>
              <label className="field">
                <span>Số CCCD</span>
                <input
                  type="text"
                  value={walkin.SoDinhDanh}
                  onChange={(e) => setWalkin({ ...walkin, SoDinhDanh: e.target.value })}
                  placeholder="Số định danh"
                />
              </label>
              <label className="field">
                <span>Số giấy phép lái xe <em>*</em></span>
                <input
                  type="text"
                  value={walkin.GiayPhepLaiXe}
                  onChange={(e) => setWalkin({ ...walkin, GiayPhepLaiXe: e.target.value })}
                  placeholder="Nhập số GPLX"
                />
              </label>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">3. Chi phí &amp; Xác nhận lập hợp đồng</h3>
          <div className="register-grid" style={{ marginTop: 0 }}>
            <label className="field">
              <span>Tiền thuê xe ({days} ngày)</span>
              <input type="text" value={formatCurrency(rentalFee)} readOnly />
            </label>
            <label className="field">
              <span>Tiền đặt cọc (VNĐ)</span>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </label>
            <label className="field wide">
              <span>Ghi chú hợp đồng</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm (nếu có)"
              />
            </label>
          </div>
          <div className="register-actions">
            <button type="submit" className="button button-gold">
              <FileCheck2 size={16} /> Lập hợp đồng thuê xe
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
