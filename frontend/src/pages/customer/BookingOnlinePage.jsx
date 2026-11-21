import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../api/endpoints';
import { calcDays, formatCurrency, todayISO } from '../../utils/formatters';

export default function BookingOnlinePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { carModels, customers, refreshForUser } = useData();
  const { showToast } = useToast();

  const customer = customers.find((c) => c.MaKH === currentUser?.MaKH);

  const [maMauXe, setMaMauXe] = useState(state?.maMauXe || carModels[0]?.MaMauXe || '');
  const [ngayNhan, setNgayNhan] = useState(state?.ngayNhan || todayISO());
  const [ngayTra, setNgayTra] = useState(state?.ngayTra || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);

  const selectedModel = carModels.find((m) => m.MaMauXe === maMauXe);
  const days = calcDays(ngayNhan, ngayTra);
  const estimatedTotal = selectedModel && days > 0 ? selectedModel.GiaThueNgay * days : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedModel) {
      setErrorMsg('Mẫu xe không còn tồn tại trong hệ thống. Vui lòng chọn lại.');
      return;
    }
    if (!ngayNhan || !ngayTra) {
      setErrorMsg('Vui lòng chọn đầy đủ ngày nhận xe và ngày trả xe.');
      return;
    }
    if (ngayNhan < todayISO()) {
      setErrorMsg('Ngày nhận xe không được trước ngày hiện tại.');
      return;
    }
    if (ngayTra <= ngayNhan) {
      setErrorMsg('Ngày trả xe phải sau ngày nhận xe.');
      return;
    }

    try {
      const res = await bookingApi.create({
        MaMauXe: maMauXe,
        NgayNhan: ngayNhan,
        NgayTra: ngayTra,
      });
      setCreatedOrder(res.data);
      await refreshForUser(currentUser);
      showToast(`Đặt thuê xe thành công! Mã đơn của bạn là ${res.data?.MaDD}.`, 'success');
    } catch (err) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    }
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="card">
          <span className="eyebrow">ĐẶT THUÊ XE ONLINE</span>
          <h1 style={{ margin: '6px 0 6px', fontSize: 26 }}>Đặt thuê xe trực tuyến</h1>
          <p style={{ marginTop: 0, color: '#77766e', fontSize: 13.5 }}>
            Chọn mẫu xe, ngày nhận và ngày trả. Thông tin cá nhân được tự điền từ hồ sơ khách hàng.
          </p>

          {errorMsg && <div className="form-message error">{errorMsg}</div>}
          {createdOrder && (
            <div className="form-message success">
              Đặt thuê xe thành công! Mã đơn: <strong>{createdOrder.MaDD}</strong> · Trạng thái:{' '}
              <strong>{createdOrder.TrangThai}</strong>.{' '}
              <button
                type="button"
                className="button button-dark button-sm"
                style={{ marginLeft: 10 }}
                onClick={() => navigate('/khach-hang/don-dat-xe')}
              >
                Xem đơn đặt xe
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-grid" style={{ marginTop: 12 }}>
              <label className="field wide">
                <span>Mẫu xe đã chọn <em>*</em></span>
                <select value={maMauXe} onChange={(e) => setMaMauXe(e.target.value)}>
                  {carModels.map((m) => (
                    <option key={m.MaMauXe} value={m.MaMauXe}>
                      {m.TenMauXe} — {formatCurrency(m.GiaThueNgay)}/ngày
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Ngày nhận xe <em>*</em></span>
                <input
                  type="date"
                  value={ngayNhan}
                  min={todayISO()}
                  onChange={(e) => setNgayNhan(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Ngày trả xe <em>*</em></span>
                <input
                  type="date"
                  value={ngayTra}
                  min={ngayNhan || todayISO()}
                  onChange={(e) => setNgayTra(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Họ và tên (từ hồ sơ)</span>
                <input type="text" value={customer?.HoVaTen || ''} readOnly />
              </label>

              <label className="field">
                <span>Số điện thoại (từ hồ sơ)</span>
                <input type="text" value={customer?.DienThoai || ''} readOnly />
              </label>

              <label className="field wide">
                <span>Số giấy phép lái xe (từ hồ sơ)</span>
                <input type="text" value={customer?.GiayPhepLaiXe || ''} readOnly />
              </label>
            </div>

            {estimatedTotal > 0 && (
              <div style={{ padding: 14, background: '#fbfaf7', border: '1px solid #e8e3d9', borderRadius: 4, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, color: '#555349' }}>
                  Dự kiến thuê <strong>{days} ngày</strong> × {formatCurrency(selectedModel?.GiaThueNgay)}
                </span>
                <strong style={{ fontSize: 18, color: '#947849' }}>{formatCurrency(estimatedTotal)}</strong>
              </div>
            )}

            <div className="register-actions">
              <button type="button" className="button button-muted" onClick={() => navigate('/xe')}>
                Hủy
              </button>
              <button type="submit" className="button button-gold">
                <CalendarCheck size={16} /> Xác nhận đặt thuê
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
