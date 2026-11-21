import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  validateCCCD,
  validateEmail,
  validateLicense,
  validatePassword,
  validatePhone,
} from '../../utils/formatters';

const INITIAL_FORM = {
  HoVaTen: '',
  GioiTinh: '',
  DienThoai: '',
  SoDinhDanh: '',
  GiayPhepLaiXe: '',
  email: '',
  DiaChi: '',
  TenDN: '',
  MatKhau: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateAll = () => {
    const next = {};
    if (!form.HoVaTen.trim()) next.HoVaTen = 'Vui lòng nhập họ và tên.';
    if (!form.GioiTinh) next.GioiTinh = 'Vui lòng chọn giới tính.';
    if (!validatePhone(form.DienThoai)) {
      next.DienThoai = 'Số điện thoại phải gồm đúng 10 chữ số và không chứa ký tự chữ.';
    }
    if (!validateCCCD(form.SoDinhDanh)) {
      next.SoDinhDanh = 'Số định danh (CCCD) không hợp lệ (9-12 chữ số).';
    }
    if (!validateLicense(form.GiayPhepLaiXe)) {
      next.GiayPhepLaiXe = 'Số giấy phép lái xe phải có ít nhất 6 ký tự.';
    }
    if (!validateEmail(form.email)) {
      next.email = 'Email không được để trống và phải đúng định dạng.';
    }
    if (!form.TenDN.trim()) {
      next.TenDN = 'Vui lòng nhập tên đăng nhập.';
    }
    if (!validatePassword(form.MatKhau)) {
      next.MatKhau = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setBanner({ type: 'error', text: 'Vui lòng kiểm tra và chỉnh sửa các trường thông tin chưa hợp lệ.' });
      return;
    }

    setSubmitting(true);
    const res = await register({
      HoVaTen: form.HoVaTen.trim(),
      GioiTinh: form.GioiTinh,
      DienThoai: form.DienThoai.trim(),
      SoDinhDanh: form.SoDinhDanh.trim(),
      GiayPhepLaiXe: form.GiayPhepLaiXe.trim(),
      email: form.email.trim(),
      DiaChi: form.DiaChi.trim(),
      TenDN: form.TenDN.trim(),
      MatKhau: form.MatKhau,
    });
    setSubmitting(false);

    if (!res.success) {
      setBanner({ type: 'error', text: res.message });
      showToast(res.message, 'error');
      return;
    }

    showToast('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.', 'success');
    navigate('/dang-nhap');
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setBanner({ type: 'info', text: 'Đã hủy thao tác và xóa dữ liệu vừa nhập.' });
  };

  return (
    <section className="auth-bg">
      <div className="wrap">
        <div className="register-card">
          <span className="eyebrow">ĐĂNG KÝ TÀI KHOẢN</span>
          <h1>Đăng ký tài khoản khách hàng</h1>
          <p>
            Vui lòng nhập đầy đủ thông tin cá nhân để tạo tài khoản trên hệ thống AUK Car Rental.
          </p>

          {banner && <div className={`form-message ${banner.type}`}>{banner.text}</div>}

          <form onSubmit={handleSubmit} className="register-grid" noValidate>
            <label className="field">
              <span>
                Họ và tên <em>*</em>
              </span>
              <input
                type="text"
                value={form.HoVaTen}
                onChange={(e) => handleChange('HoVaTen', e.target.value)}
                placeholder="Nhập họ và tên"
              />
              {errors.HoVaTen && <span className="field-error">{errors.HoVaTen}</span>}
            </label>

            <label className="field">
              <span>
                Giới tính <em>*</em>
              </span>
              <select value={form.GioiTinh} onChange={(e) => handleChange('GioiTinh', e.target.value)}>
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              {errors.GioiTinh && <span className="field-error">{errors.GioiTinh}</span>}
            </label>

            <label className="field">
              <span>
                Số điện thoại <em>*</em>
              </span>
              <input
                type="text"
                value={form.DienThoai}
                onChange={(e) => handleChange('DienThoai', e.target.value)}
                placeholder="10 chữ số (vd: 0912345678)"
              />
              {errors.DienThoai && <span className="field-error">{errors.DienThoai}</span>}
            </label>

            <label className="field">
              <span>
                Số định danh (CCCD) <em>*</em>
              </span>
              <input
                type="text"
                value={form.SoDinhDanh}
                onChange={(e) => handleChange('SoDinhDanh', e.target.value)}
                placeholder="Nhập số định danh"
              />
              {errors.SoDinhDanh && <span className="field-error">{errors.SoDinhDanh}</span>}
            </label>

            <label className="field">
              <span>
                Giấy phép lái xe <em>*</em>
              </span>
              <input
                type="text"
                value={form.GiayPhepLaiXe}
                onChange={(e) => handleChange('GiayPhepLaiXe', e.target.value)}
                placeholder="Nhập số giấy phép lái xe"
              />
              {errors.GiayPhepLaiXe && <span className="field-error">{errors.GiayPhepLaiXe}</span>}
            </label>

            <label className="field">
              <span>
                Email <em>*</em>
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@gmail.com"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>

            <label className="field wide">
              <span>Địa chỉ</span>
              <input
                type="text"
                value={form.DiaChi}
                onChange={(e) => handleChange('DiaChi', e.target.value)}
                placeholder="Nhập địa chỉ liên hệ"
              />
            </label>

            <label className="field">
              <span>
                Tên đăng nhập <em>*</em>
              </span>
              <input
                type="text"
                value={form.TenDN}
                onChange={(e) => handleChange('TenDN', e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
              {errors.TenDN && <span className="field-error">{errors.TenDN}</span>}
            </label>

            <label className="field">
              <span>
                Mật khẩu <em>*</em>
              </span>
              <input
                type="password"
                value={form.MatKhau}
                onChange={(e) => handleChange('MatKhau', e.target.value)}
                placeholder="Ít nhất 8 ký tự"
              />
              {errors.MatKhau && <span className="field-error">{errors.MatKhau}</span>}
            </label>

            <div className="wide register-actions">
              <button type="button" className="button button-muted" onClick={handleReset}>
                Hủy
              </button>
              <button type="submit" className="button button-gold">
                Đăng ký
              </button>
            </div>
          </form>

          <div className="auth-bottom">
            Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
