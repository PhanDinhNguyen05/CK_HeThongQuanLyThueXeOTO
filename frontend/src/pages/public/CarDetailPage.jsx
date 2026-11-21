import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Users, Cog, Fuel, Tag, Building2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';

export default function CarDetailPage() {
  const { maMauXe } = useParams();
  const { carModels, brands, segments, cars } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const model = carModels.find((m) => m.MaMauXe === maMauXe);

  if (!model) {
    return (
      <section className="section section-soft">
        <div className="wrap card">
          <EmptyState title="Mẫu xe không tồn tại" description="Mẫu xe có thể đã bị xóa khỏi danh mục." />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button type="button" className="button button-dark" onClick={() => navigate('/xe')}>
              <ArrowLeft size={16} /> Quay lại danh sách mẫu xe
            </button>
          </div>
        </div>
      </section>
    );
  }

  const brand = brands.find((b) => b.MaHang === model.MaHang);
  const seg = segments.find((s) => s.MaPhanKhuc === model.MaPhanKhuc);
  const readyCars = cars.filter((c) => c.MaMauXe === model.MaMauXe && c.TrangThai === 'Sẵn sàng');

  const handleBookClick = () => {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập tài khoản khách hàng để đặt thuê xe.', 'warning');
      navigate('/dang-nhap');
      return;
    }
    if (currentUser.VaiTro !== 'Khách hàng') {
      showToast('Chỉ tài khoản Khách hàng mới có thể đặt thuê xe online.', 'warning');
      return;
    }
    navigate('/khach-hang/dat-xe', { state: { maMauXe: model.MaMauXe } });
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap">
        <button
          type="button"
          className="button button-muted button-sm"
          onClick={() => navigate('/xe')}
          style={{ marginBottom: 18 }}
        >
          <ArrowLeft size={15} /> Quay lại danh sách
        </button>

        <div className="card">
          <span className="eyebrow">CHI TIẾT MẪU XE ({model.MaMauXe})</span>
          <h1 style={{ margin: '6px 0 20px', fontSize: 28 }}>{model.TenMauXe}</h1>

          <div className="grid-2" style={{ alignItems: 'start', gap: 28 }}>
            <div>
              <div style={{ borderRadius: 5, overflow: 'hidden', border: '1px solid #e8e3d9', background: '#faf8f4' }}>
                <img
                  src={model.AnhPoster}
                  alt={model.TenMauXe}
                  style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
                />
              </div>
              {model.NoiDungQuangBa && (
                <div className="form-message info" style={{ marginTop: 14, marginBottom: 0 }}>
                  {model.NoiDungQuangBa}
                </div>
              )}
            </div>

            <div>
              <div className="detail-kv" style={{ marginBottom: 20 }}>
                <div className="detail-kv-item">
                  <label><Building2 size={13} /> Hãng sản xuất</label>
                  <div>{brand?.TenHang || '—'}</div>
                </div>
                <div className="detail-kv-item">
                  <label><Tag size={13} /> Phân khúc</label>
                  <div>{seg?.TenPhanKhuc || '—'}</div>
                </div>
                <div className="detail-kv-item">
                  <label><Users size={13} /> Số chỗ ngồi</label>
                  <div>{model.SoChoNgoi} chỗ</div>
                </div>
                <div className="detail-kv-item">
                  <label><Cog size={13} /> Hộp số &amp; Động cơ</label>
                  <div>{model.HopSo} · {model.DongCo}</div>
                </div>
                <div className="detail-kv-item">
                  <label><Fuel size={13} /> Nhiên liệu</label>
                  <div>{model.NhienLieu}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Tình trạng xe sẵn sàng</label>
                  <div style={{ color: readyCars.length > 0 ? '#287d4f' : '#c93b3b' }}>
                    {readyCars.length} xe sẵn sàng cho thuê
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, background: '#fbfaf7', border: '1px solid #e8e3d9', borderRadius: 4, marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: '#77766e', fontWeight: 600 }}>Giá thuê tham khảo</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#947849' }}>
                  {formatCurrency(model.GiaThueNgay)} <span style={{ fontSize: 14, fontWeight: 500, color: '#77766e' }}>/ ngày</span>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Mô tả chi tiết</strong>
                <p style={{ margin: 0, color: '#555349', lineHeight: 1.75 }}>{model.MoTa}</p>
              </div>

              <button type="button" className="button button-gold full" onClick={handleBookClick}>
                <CalendarCheck size={17} /> Thuê xe này (Đặt thuê xe online)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
