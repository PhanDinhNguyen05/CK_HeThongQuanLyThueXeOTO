import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { vehicleApi } from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';

const EMPTY_MODEL = {
  TenMauXe: '',
  GiaThueNgay: '',
  MaPhanKhuc: 'PK01',
  MaHang: 'HANG01',
  SoChoNgoi: 5,
  HopSo: 'Số tự động',
  NhienLieu: 'Xăng',
  DongCo: '',
  MoTa: '',
  NoiDungQuangBa: '',
  AnhPoster: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&auto=format&fit=crop',
};

export default function CarModelsPage() {
  const { currentUser } = useAuth();
  const {
    carModels,
    brands,
    segments,
    cars,
    bookings,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_MODEL);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = carModels.filter(
    (m) =>
      !keyword.trim() ||
      m.TenMauXe.toLowerCase().includes(keyword.trim().toLowerCase()) ||
      m.MaMauXe.toLowerCase().includes(keyword.trim().toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_MODEL);
    setFormOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.MaMauXe);
    setForm({ ...m });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.TenMauXe.trim() || !form.DongCo.trim() || !form.GiaThueNgay) {
      showToast('Vui lòng nhập đầy đủ Tên mẫu xe, Giá thuê và Động cơ.', 'error');
      return;
    }
    const price = Number(form.GiaThueNgay);
    if (Number.isNaN(price) || price <= 0) {
      showToast('Giá thuê ngày phải là số dương hợp lệ.', 'error');
      return;
    }

    try {
      const payload = {
        ...form,
        TenMauXe: form.TenMauXe.trim(),
        DongCo: form.DongCo.trim(),
        GiaThueNgay: price,
        SoChoNgoi: Number(form.SoChoNgoi) || 5,
      };
      if (editingId) {
        const res = await vehicleApi.updateModel(editingId, payload);
        showToast(res.message || `Cập nhật mẫu xe ${editingId} thành công!`, 'success');
      } else {
        const res = await vehicleApi.createModel(payload);
        showToast(res.message || 'Thêm mẫu xe mới thành công!', 'success');
      }
      await refreshForUser(currentUser);
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await vehicleApi.deleteModel(deleteTarget.MaMauXe);
      await refreshForUser(currentUser);
      showToast(res.message || `Đã xóa mẫu xe ${deleteTarget.TenMauXe} khỏi danh mục.`, 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">QUẢN LÝ MẪU XE</span>
          <h1>Danh mục mẫu xe</h1>
          <p>Thêm mới, cập nhật thông số kỹ thuật, hình ảnh poster và xóa mẫu xe khi không còn tham chiếu.</p>
        </div>
        <button type="button" className="button button-gold" onClick={openAdd}>
          <Plus size={16} /> Thêm mẫu xe mới
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <label className="field">
            <span>Tìm kiếm mẫu xe</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập mã hoặc tên mẫu xe..."
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy mẫu xe nào" />
        ) : (
          <div className="table-wrap">
            <table className="auk-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Mẫu xe</th>
                  <th>Phân khúc</th>
                  <th>Hãng</th>
                  <th>Động cơ</th>
                  <th>Giá / ngày</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.MaMauXe}>
                    <td><strong>{m.MaMauXe}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={m.AnhPoster}
                          alt={m.TenMauXe}
                          style={{ width: 54, height: 36, objectFit: 'cover', borderRadius: 3 }}
                        />
                        <strong>{m.TenMauXe}</strong>
                      </div>
                    </td>
                    <td>{segments.find((s) => s.MaPhanKhuc === m.MaPhanKhuc)?.TenPhanKhuc}</td>
                    <td>{brands.find((b) => b.MaHang === m.MaHang)?.TenHang}</td>
                    <td>{m.DongCo}</td>
                    <td><strong>{formatCurrency(m.GiaThueNgay)}</strong></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="button button-dark button-sm" onClick={() => openEdit(m)}>
                        <Pencil size={14} /> Sửa
                      </button>
                      <button type="button" className="button button-danger button-sm" onClick={() => setDeleteTarget(m)}>
                        <Trash2 size={14} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={formOpen}
        title={editingId ? `Cập nhật mẫu xe ${editingId}` : 'Thêm mẫu xe mới'}
        confirmText={editingId ? 'Lưu cập nhật' : 'Thêm mẫu xe'}
        onConfirm={handleSave}
        onCancel={() => setFormOpen(false)}
      >
        <div className="register-grid" style={{ marginTop: 0 }}>
          <label className="field">
            <span>Tên mẫu xe <em>*</em></span>
            <input
              type="text"
              value={form.TenMauXe}
              onChange={(e) => setForm({ ...form, TenMauXe: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Giá thuê/ngày (VNĐ) <em>*</em></span>
            <input
              type="number"
              value={form.GiaThueNgay}
              onChange={(e) => setForm({ ...form, GiaThueNgay: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Phân khúc <em>*</em></span>
            <select value={form.MaPhanKhuc} onChange={(e) => setForm({ ...form, MaPhanKhuc: e.target.value })}>
              {segments.map((s) => (
                <option key={s.MaPhanKhuc} value={s.MaPhanKhuc}>{s.TenPhanKhuc}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Hãng / Nhà cung cấp <em>*</em></span>
            <select value={form.MaHang} onChange={(e) => setForm({ ...form, MaHang: e.target.value })}>
              {brands.map((b) => (
                <option key={b.MaHang} value={b.MaHang}>{b.TenHang}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Động cơ <em>*</em></span>
            <input
              type="text"
              value={form.DongCo}
              onChange={(e) => setForm({ ...form, DongCo: e.target.value })}
              placeholder="Ví dụ: 1.5L Dual VVT-i"
            />
          </label>
          <label className="field">
            <span>Số chỗ ngồi</span>
            <input
              type="number"
              value={form.SoChoNgoi}
              onChange={(e) => setForm({ ...form, SoChoNgoi: Number(e.target.value) })}
            />
          </label>
          <label className="field wide">
            <span>Link ảnh poster</span>
            <input
              type="text"
              value={form.AnhPoster}
              onChange={(e) => setForm({ ...form, AnhPoster: e.target.value })}
            />
          </label>
          <label className="field wide">
            <span>Nội dung quảng bá</span>
            <input
              type="text"
              value={form.NoiDungQuangBa}
              onChange={(e) => setForm({ ...form, NoiDungQuangBa: e.target.value })}
            />
          </label>
          <label className="field wide" style={{ marginBottom: 0 }}>
            <span>Mô tả</span>
            <textarea
              value={form.MoTa}
              onChange={(e) => setForm({ ...form, MoTa: e.target.value })}
            />
          </label>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa mẫu xe"
        message={`Bạn có chắc chắn muốn xóa mẫu xe "${deleteTarget?.TenMauXe}" khỏi hệ thống không?`}
        confirmText="Xác nhận xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
