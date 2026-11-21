import React, { useState } from 'react';
import { CreditCard, Landmark, Smartphone, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { paymentApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

export default function PaymentPage() {
  const { currentUser } = useAuth();
  const {
    unpaidPayments,
    payments,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const unpaidItems = Array.isArray(unpaidPayments) ? unpaidPayments : [];
  const [selectedId, setSelectedId] = useState(unpaidItems[0]?.id || '');
  const [method, setMethod] = useState('Thẻ tín dụng');
  const [bank, setBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  const selectedItem = unpaidItems.find((i) => i.id === selectedId) || null;
  const myPayments = payments.filter((p) => p.MaKH === currentUser?.MaKH);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      showToast('Vui lòng chọn khoản cần thanh toán.', 'error');
      return;
    }
    if (!method) {
      showToast('Vui lòng chọn phương thức thanh toán.', 'error');
      return;
    }

    if (method === 'Thẻ tín dụng') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (!/^\d{12,19}$/.test(cleanCard)) {
        showToast('Số thẻ tín dụng không hợp lệ (12-19 chữ số).', 'error');
        return;
      }
      if (!cardHolder.trim()) {
        showToast('Vui lòng nhập tên chủ thẻ.', 'error');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
        showToast('Ngày hết hạn thẻ phải theo định dạng MM/YY.', 'error');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        showToast('Mã CVV không hợp lệ (3-4 chữ số).', 'error');
        return;
      }
    }

    if (method === 'Ngân hàng' && !bank) {
      showToast('Vui lòng chọn ngân hàng thanh toán.', 'error');
      return;
    }

    try {
      const res = await paymentApi.pay({
        itemId: selectedItem.id,
        phuongThuc: method,
        nganHang: bank,
        cardInfo:
          method === 'Thẻ tín dụng'
            ? { cardNumber, cardHolder, expiry: cardExpiry, cvv: cardCvv }
            : null,
      });
      await refreshForUser(currentUser);
      setLastReceipt(res.data);
      setCardNumber('');
      setCardCvv('');
      setSelectedId('');
      showToast(`Thanh toán thành công! Mã giao dịch: ${res.data?.MaGiaoDich}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap" style={{ maxWidth: 920 }}>
        <div className="page-header">
          <div>
            <span className="eyebrow">THANH TOÁN</span>
            <h1>Thanh toán khoản phí</h1>
            <p>Chọn khoản chưa thanh toán và phương thức phù hợp để hoàn tất giao dịch.</p>
          </div>
        </div>

        {lastReceipt && (
          <div className="form-message success" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} />
            <span>
              Giao dịch <strong>{lastReceipt.MaGiaoDich}</strong> ({formatCurrency(lastReceipt.SoTien)}) đã được ghi nhận thành công!
            </span>
          </div>
        )}

        <div className="card">
          <h3 className="card-title">1. Chọn khoản cần thanh toán</h3>
          {unpaidItems.length === 0 ? (
            <EmptyState title="Không có khoản cần thanh toán" description="Tất cả hợp đồng và khoản phạt của bạn đã được thanh toán." />
          ) : (
            <form onSubmit={handlePay}>
              <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
                {unpaidItems.map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 16px',
                      border: selectedId === item.id ? '1.5px solid #b69a65' : '1px solid #e8e3d9',
                      background: selectedId === item.id ? '#fbfaf7' : '#fff',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="radio"
                        name="unpaidItem"
                        checked={selectedId === item.id}
                        onChange={() => setSelectedId(item.id)}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#77766e' }}>Mã tham chiếu: {item.ref}</div>
                      </div>
                    </div>
                    <strong style={{ color: '#947849', fontSize: 16 }}>{formatCurrency(item.amount)}</strong>
                  </label>
                ))}
              </div>

              <h3 className="card-title">2. Chọn phương thức thanh toán</h3>
              <div className="role-picker" style={{ marginBottom: 18 }}>
                <label>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'Thẻ tín dụng'}
                    onChange={() => setMethod('Thẻ tín dụng')}
                  />
                  <span><CreditCard size={14} style={{ verticalAlign: 'middle' }} /> Thẻ tín dụng</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'Ngân hàng'}
                    onChange={() => setMethod('Ngân hàng')}
                  />
                  <span><Landmark size={14} style={{ verticalAlign: 'middle' }} /> Ngân hàng</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'Ví điện tử'}
                    onChange={() => setMethod('Ví điện tử')}
                  />
                  <span><Smartphone size={14} style={{ verticalAlign: 'middle' }} /> Ví điện tử</span>
                </label>
              </div>

              {method === 'Thẻ tín dụng' && (
                <div className="register-grid" style={{ marginTop: 0 }}>
                  <label className="field">
                    <span>Số thẻ tín dụng <em>*</em></span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </label>
                  <label className="field">
                    <span>Tên chủ thẻ <em>*</em></span>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="NGUYEN VAN AN"
                    />
                  </label>
                  <label className="field">
                    <span>Ngày hết hạn (MM/YY) <em>*</em></span>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                    />
                  </label>
                  <label className="field">
                    <span>CVV <em>*</em></span>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                    />
                  </label>
                </div>
              )}

              {method === 'Ngân hàng' && (
                <label className="field">
                  <span>Chọn ngân hàng được hỗ trợ <em>*</em></span>
                  <select value={bank} onChange={(e) => setBank(e.target.value)}>
                    <option value="">-- Chọn ngân hàng --</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="ACB">ACB</option>
                  </select>
                </label>
              )}

              {method === 'Ví điện tử' && (
                <div className="form-message info">
                  Hệ thống sẽ chuyển tiếp yêu cầu thanh toán qua cổng Ví điện tử (MoMo / ZaloPay) để xác nhận.
                </div>
              )}

              <div className="register-actions">
                <button type="submit" className="button button-gold">
                  Xác nhận thanh toán
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Lịch sử giao dịch thanh toán</h3>
          {myPayments.length === 0 ? (
            <EmptyState title="Chưa có giao dịch thanh toán nào" />
          ) : (
            <div className="table-wrap">
              <table className="auk-table">
                <thead>
                  <tr>
                    <th>Mã GD</th>
                    <th>Mã tham chiếu</th>
                    <th>Loại khoản</th>
                    <th>Phương thức</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayments.map((p) => (
                    <tr key={p.MaGiaoDich}>
                      <td><strong>{p.MaGiaoDich}</strong></td>
                      <td>{p.MaThamChieu}</td>
                      <td>{p.LoaiKhoan}</td>
                      <td>{p.PhuongThuc}</td>
                      <td><strong>{formatCurrency(p.SoTien)}</strong></td>
                      <td>{formatDate(p.NgayThanhToan)}</td>
                      <td><StatusBadge status={p.TrangThai} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
