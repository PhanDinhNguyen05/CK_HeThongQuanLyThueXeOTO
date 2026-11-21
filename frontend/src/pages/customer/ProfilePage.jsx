import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { customerApi } from '../../api/endpoints';
import { validateEmail, validatePhone } from '../../utils/formatters';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { customers, refreshForUser } = useData();
  const { showToast } = useToast();

  const customer = customers.find((c) => c.MaKH === currentUser?.MaKH);

  const [dienThoai, setDienThoai] = useState(customer?.DienThoai || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [diaChi, setDiaChi] = useState(customer?.DiaChi || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setDienThoai(customer.DienThoai || '');
      setEmail(customer.email || '');
      setDiaChi(customer.DiaChi || '');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validatePhone(dienThoai)) {
      setErrorMsg('Số điện thoại phải gồm đúng 10 chữ số.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg('Email không đúng định dạng hoặc đang để trống.');
      return;
    }

    setSaving(true);
    try {
      const res = await customerApi.updateProfile({
        DienThoai: dienThoai.trim(),
        email: email.trim(),
        DiaChi: diaChi.trim(),
      });
      await refreshForUser(currentUser);
      showToast(res.message || 'Cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDienThoai(customer.DienThoai || '');
    setEmail(customer.email || '');
    setDiaChi(customer.DiaChi || '');
    setErrorMsg('');
    showToast('Đã hủy chỉnh sửa, giữ nguyên thông tin cũ.', 'info');
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="card">
          <span className="eyebrow">QUẢN LÝ THÔNG TIN CÁ NHÂN</span>
          <h1 style={{ margin: '6px 0 6px', fontSize: 26 }}>Thông tin khách hàng ({customer.MaKH})</h1>
          <p style={{ marginTop: 0, color: '#77766e', fontSize: 13.5 }}>
            Xem và cập nhật số điện thoại, email, địa chỉ. Họ tên, CCCD và GPLX là thông tin định danh cố định.
          </p>

          {errorMsg && <div className="form-message error">{errorMsg}</div>}

          <form onSubmit={handleSave}>
            <div className="register-grid" style={{ marginTop: 14 }}>
              <label className="field">
                <span>Họ và tên (Không thể chỉnh sửa)</span>
                <input type="text" value={customer.HoVaTen} readOnly />
              </label>

              <label className="field">
                <span>Số CCCD (Không thể chỉnh sửa)</span>
                <input type="text" value={customer.SoDinhDanh} readOnly />
              </label>

              <label className="field">
                <span>Số giấy phép lái xe (Không thể chỉnh sửa)</span>
                <input type="text" value={customer.GiayPhepLaiXe} readOnly />
              </label>

              <label className="field">
                <span>Số điện thoại <em>*</em></span>
                <input
                  type="text"
                  value={dienThoai}
                  onChange={(e) => setDienThoai(e.target.value)}
                />
              </label>

              <label className="field wide">
                <span>Email <em>*</em></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="field wide">
                <span>Địa chỉ</span>
                <textarea
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                />
              </label>
            </div>

            <div className="register-actions">
              <button type="button" className="button button-muted" onClick={handleCancel}>
                Hủy thao tác
              </button>
              <button type="submit" className="button button-gold">
                Lưu thông tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
