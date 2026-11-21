import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rentalApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function PenaltiesPage() {
  const { currentUser } = useAuth();
  const { contracts, customers, penalties, refreshForUser } = useData();
  const { showToast } = useToast();

  const [maHD, setMaHD] = useState(contracts[0]?.MaHD || '');
  const [loaiViPham, setLoaiViPham] = useState('Trả xe trễ hạn');
  const [moTa, setMoTa] = useState('');
  const [soTien, setSoTien] = useState('500000');

  const selectedContract = contracts.find((c) => c.MaHD === maHD);
  const relatedCustomer = selectedContract
    ? customers.find((c) => c.MaKH === selectedContract.MaKH)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContract) {
      showToast('Không xác định được hợp đồng thuê xe.', 'error');
      return;
    }
    if (!moTa.trim()) {
      showToast('Vui lòng nhập mô tả căn cứ vi phạm.', 'error');
      return;
    }
    const amount = Number(soTien);
    if (Number.isNaN(amount) || amount <= 0) {
      showToast('Mức phạt phải là số dương hợp lệ.', 'error');
      return;
    }

    try {
      const res = await rentalApi.createPenalty({
        MaHD: selectedContract.MaHD,
        LoaiViPham: loaiViPham,
        MoTa: moTa.trim(),
        SoTienPhat: amount,
      });
      await refreshForUser(currentUser);
      setMoTa('');
      showToast(
        `Đã lập khoản phạt ${res.data?.MaKhoanPhat} (${formatCurrency(amount)}) với trạng thái Chưa thanh toán.`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">LẬP KHOẢN PHẠT</span>
          <h1>Quản lý &amp; Lập khoản phạt</h1>
          <p>Xác định, thông báo và ghi nhận khoản phạt hoặc phí phát sinh liên quan đến hợp đồng thuê xe.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={handleSubmit}>
          <h3 className="card-title">Lập khoản phạt mới</h3>
          <label className="field">
            <span>Chọn hợp đồng thuê xe <em>*</em></span>
            <select value={maHD} onChange={(e) => setMaHD(e.target.value)}>
              {contracts.map((c) => (
                <option key={c.MaHD} value={c.MaHD}>
                  {c.MaHD} ({c.SoHD}) — {customers.find((x) => x.MaKH === c.MaKH)?.HoVaTen}
                </option>
              ))}
            </select>
          </label>

          {relatedCustomer && (
            <div style={{ marginBottom: 14, fontSize: 13, color: '#555349' }}>
              Khách hàng: <strong>{relatedCustomer.HoVaTen}</strong> ({relatedCustomer.DienThoai})
            </div>
          )}

          <label className="field">
            <span>Loại vi phạm / Phí phát sinh <em>*</em></span>
            <select value={loaiViPham} onChange={(e) => setLoaiViPham(e.target.value)}>
              <option value="Trả xe trễ hạn">Trả xe trễ hạn</option>
              <option value="Thiếu nhiên liệu">Thiếu nhiên liệu</option>
              <option value="Hư hỏng nội thất / xe">Hư hỏng nội thất / xe</option>
              <option value="Mất chìa khóa">Mất chìa khóa</option>
              <option value="Vi phạm giao thông">Vi phạm giao thông</option>
            </select>
          </label>

          <label className="field">
            <span>Mô tả / Căn cứ tính phạt <em>*</em></span>
            <textarea
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="Ví dụ: Trễ hạn 2 ngày, thiếu 5 lít xăng..."
            />
          </label>

          <label className="field">
            <span>Mức phạt (VNĐ) <em>*</em></span>
            <input
              type="number"
              value={soTien}
              onChange={(e) => setSoTien(e.target.value)}
              min="1000"
            />
          </label>

          <button type="submit" className="button button-gold full">
            <PlusCircle size={16} /> Lập khoản phạt
          </button>
        </form>

        <div className="card">
          <h3 className="card-title">Danh sách khoản phạt ({penalties.length})</h3>
          {penalties.length === 0 ? (
            <EmptyState title="Chưa có khoản phạt nào" />
          ) : (
            <div className="table-wrap">
              <table className="auk-table">
                <thead>
                  <tr>
                    <th>Mã phạt</th>
                    <th>Hợp đồng</th>
                    <th>Loại vi phạm</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map((p) => (
                    <tr key={p.MaKhoanPhat}>
                      <td><strong>{p.MaKhoanPhat}</strong></td>
                      <td>{p.MaHD}</td>
                      <td>
                        <div>{p.LoaiViPham}</div>
                        <small style={{ color: '#77766e' }}>{p.MoTa}</small>
                      </td>
                      <td><strong>{formatCurrency(p.SoTienPhat)}</strong></td>
                      <td>{formatDate(p.NgayPhat)}</td>
                      <td><StatusBadge status={p.TrangThaiThanhToan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
