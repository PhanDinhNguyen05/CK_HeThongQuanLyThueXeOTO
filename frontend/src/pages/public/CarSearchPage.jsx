import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';

export default function CarSearchPage() {
  const { carModels, segments, brands, cars } = useData();

  const [keyword, setKeyword] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [applied, setApplied] = useState({ keyword: '', segmentId: '', maxPrice: '' });

  const filtered = carModels.filter((m) => {
    const matchName =
      !applied.keyword.trim() ||
      m.TenMauXe.toLowerCase().includes(applied.keyword.trim().toLowerCase());
    const matchSeg = !applied.segmentId || m.MaPhanKhuc === applied.segmentId;
    const matchPrice =
      !applied.maxPrice || Number(m.GiaThueNgay) <= Number(applied.maxPrice);
    return matchName && matchSeg && matchPrice;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setApplied({ keyword, segmentId, maxPrice });
  };

  const handleReset = () => {
    setKeyword('');
    setSegmentId('');
    setMaxPrice('');
    setApplied({ keyword: '', segmentId: '', maxPrice: '' });
  };

  return (
    <section className="section section-soft" style={{ paddingTop: 42, paddingBottom: 60 }}>
      <div className="wrap">
        <div className="section-heading" style={{ marginBottom: 26 }}>
          <span className="eyebrow">TÌM KIẾM MẪU XE</span>
          <h2>Tìm chiếc xe phù hợp với bạn</h2>
          <p>Khám phá các mẫu xe hiện có theo tên xe, phân khúc và mức giá tối đa mỗi ngày.</p>
        </div>

        <form className="card" onSubmit={handleSearch}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <label className="field">
              <span>Tên mẫu xe</span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập tên xe, ví dụ: Toyota Vios..."
              />
            </label>
            <label className="field">
              <span>Loại xe / Phân khúc</span>
              <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
                <option value="">Tất cả loại xe</option>
                {segments.map((s) => (
                  <option key={s.MaPhanKhuc} value={s.MaPhanKhuc}>
                    {s.TenPhanKhuc}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Giá tối đa / ngày</span>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                <option value="">Tất cả mức giá</option>
                <option value="800000">Tối đa 800.000đ / ngày</option>
                <option value="1000000">Tối đa 1.000.000đ / ngày</option>
                <option value="1500000">Tối đa 1.500.000đ / ngày</option>
                <option value="3000000">Tối đa 3.000.000đ / ngày</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="button button-gold">
                <Search size={16} /> Tìm kiếm
              </button>
              <button type="button" className="button button-muted" onClick={handleReset}>
                <RotateCcw size={16} /> Làm mới
              </button>
            </div>
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Danh sách mẫu xe</h3>
          <span style={{ fontSize: 13, color: '#77766e' }}>
            Tìm thấy <strong>{filtered.length}</strong> mẫu xe
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Không có mẫu xe phù hợp với tiêu chí tìm kiếm"
              description="Vui lòng thay đổi từ khóa, loại xe hoặc nhấn Làm mới để xem toàn bộ danh mục."
            />
          </div>
        ) : (
          <div className="category-grid">
            {filtered.map((m) => {
              const seg = segments.find((s) => s.MaPhanKhuc === m.MaPhanKhuc);
              const brand = brands.find((b) => b.MaHang === m.MaHang);
              const readyCount = cars.filter(
                (c) => c.MaMauXe === m.MaMauXe && c.TrangThai === 'Sẵn sàng'
              ).length;
              return (
                <div key={m.MaMauXe} className="category">
                  <div className="category-art">
                    <img src={m.AnhPoster} alt={m.TenMauXe} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="badge badge-muted">
                      {seg?.TenPhanKhuc} · {brand?.TenHang}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: readyCount > 0 ? '#287d4f' : '#c93b3b' }}>
                      {readyCount > 0 ? `${readyCount} xe sẵn sàng` : 'Hết xe trống'}
                    </span>
                  </div>
                  <h3>{m.TenMauXe}</h3>
                  <p style={{ marginBottom: 14 }}>
                    {m.SoChoNgoi} chỗ · {m.HopSo} · {m.NhienLieu}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#947849', fontSize: 16 }}>
                      {formatCurrency(m.GiaThueNgay)} <small style={{ fontWeight: 400, color: '#77766e' }}>/ ngày</small>
                    </strong>
                    <Link to={`/xe/${m.MaMauXe}`} className="button button-dark button-sm">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
