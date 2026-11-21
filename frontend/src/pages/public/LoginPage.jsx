import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [roleHint, setRoleHint] = useState('Khách hàng');
  const [tenDN, setTenDN] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = (role) => {
    setRoleHint(role);
    setErrorMsg('');
    if (role === 'Khách hàng') {
      setTenDN('khach01');
      setMatKhau('12345678');
    } else if (role === 'Nhân viên') {
      setTenDN('nv01');
      setMatKhau('12345678');
    } else {
      setTenDN('admin');
      setMatKhau('12345678');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    const res = await login(tenDN, matKhau);
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, 'error');
      return;
    }

    showToast(`Đăng nhập thành công (${res.user.VaiTro})`, 'success');
    if (res.user.VaiTro === 'Quản trị viên') {
      navigate('/quan-tri');
    } else if (res.user.VaiTro === 'Nhân viên') {
      navigate('/nhan-vien');
    } else {
      navigate('/khach-hang/don-dat-xe');
    }
  };

  return (
    <section className="auth-bg">
      <div className="wrap auth-layout">
        <div className="auth-aside">
          <span className="eyebrow">CỔNG XÁC THỰC AUK</span>
          <h1>Chào mừng trở lại hệ thống AUK</h1>
          <p>
            Đăng nhập để truy cập các chức năng dành cho Khách hàng / Thành viên, Nhân viên cửa hàng hoặc Quản trị viên.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            🚘
          </div>
        </div>

        <div className="auth-card">
          <span className="eyebrow">ĐĂNG NHẬP HỆ THỐNG</span>
          <h2>Đăng nhập tài khoản</h2>
          <p>Chọn nhanh tài khoản mẫu theo vai trò hoặc nhập thông tin đăng nhập của bạn.</p>

          <div className="role-picker">
            {['Khách hàng', 'Nhân viên', 'Quản trị viên'].map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="roleHint"
                  checked={roleHint === r}
                  onChange={() => fillDemo(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {errorMsg && <div className="form-message error">{errorMsg}</div>}

          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>
                Tên đăng nhập <em>*</em>
              </span>
              <input
                type="text"
                value={tenDN}
                onChange={(e) => setTenDN(e.target.value)}
                placeholder="Nhập tên đăng nhập (vd: khach01, nv01, admin)"
              />
            </label>

            <label className="field">
              <span>
                Mật khẩu <em>*</em>
              </span>
              <input
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="button button-gold full">
                <KeyRound size={16} /> ĐĂNG NHẬP
              </button>
              <button
                type="button"
                className="button button-muted"
                onClick={() => {
                  setTenDN('');
                  setMatKhau('');
                  setErrorMsg('');
                }}
              >
                Hủy
              </button>
            </div>
          </form>

          <div className="auth-bottom">
            Chưa có tài khoản khách hàng? <Link to="/dang-ky">Đăng ký ngay</Link>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#898477', textAlign: 'center' }}>
            Lưu ý bảo mật: Nhập sai mật khẩu 5 lần liên tiếp sẽ tự động tạm khóa tài khoản.
          </div>
        </div>
      </div>
    </section>
  );
}
