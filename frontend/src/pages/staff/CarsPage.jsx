import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { vehicleApi } from '../../api/endpoints';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';

const EMPTY_CAR = {
  BienSo: '',
  MaMauXe: 'MX01',
  MauSac: 'Trắng',
  SoKhung: '',
  SoMay: '',
  NamSanXuat: 2024,
  SoKmHienTai: 0,
  TrangThai: 'Sẵn sàng',
};

export default function CarsPage() {
  const { currentUser } = useAuth();
  const { cars, carModels, refreshForUser } = useData();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CAR);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('Bán');

  const filtered = cars.filter((c) => {
    const modelName = carModels.find((m) => m.MaMauXe === c.MaMauXe)?.TenMauXe || '';
    const q = keyword.trim().toLowerCase();
    return (
      !q ||
      c.BienSo.toLowerCase().includes(q) ||
      c.MaXe.toLowerCase().includes(q) ||
      modelName.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_CAR, MaMauXe: carModels[0]?.MaMauXe || 'MX01' });
    setFormOpen(true);
  };

  const openEdit = (car) => {
    if (car.TrangThai === 'Đang thuê') {
      showToast('Xe đang được xử lý cho thuê, không thể cập nhật lúc này!', 'warning');
      return;
    }
    setEditingId(car.MaXe);
    setForm({ ...car });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.BienSo.trim() || !form.SoKhung.trim() || !form.SoMay.trim()) {
      showToast('Vui lòng nhập đầy đủ Biển số xe, Số khung và Số máy.', 'error');
      return;
    }
    if (Number(form.SoKmHienTai) < 0) {
      showToast('Số km hiện tại không được là số âm.', 'error');
      return;
    }

    try {
      const payload = {
        ...form,
        BienSo: form.BienSo.trim(),
        SoKhung: form.SoKhung.trim(),
        SoMay: form.SoMay.trim(),
        SoKmHienTai: Number(form.SoKmHienTai) || 0,
      };
      if (editingId) {
        const res = await vehicleApi.updateCar(editingId, payload);
        showToast(res.message || `Cập nhật thông tin xe ${form.BienSo} thành công!`, 'success');
      } else {
        const res = await vehicleApi.createCar(payload);
        showToast(res.message || `Thêm xe mới ${form.BienSo} thành công!`, 'success');
      }
      await refreshForUser(currentUser);
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteClick = (car) => {
    if (car.TrangThai === 'Đang thuê') {
      showToast('Không được xóa xe khi xe đang trong trạng thái Đang thuê.', 'error');
      return;
    }
    setDeleteReason('Bán');
    setDeleteTarget(car);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await vehicleApi.deleteCar(deleteTarget.MaXe);
      await refreshForUser(currentUser);
      showToast(
        res.message || `Đã chuyển xe ${deleteTarget.BienSo} sang trạng thái "Ngừng hoạt động" (Lý do: ${deleteReason}).`,
        'success'
      );
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">QUẢN LÝ XE</span>
          <h1>Quản lý danh sách xe</h1>
          <p>Khai báo xe mới, cập nhật thông số / trạng thái và ngừng hoạt động xe.</p>
        </div>
        <button type="button" className="button button-gold" onClick={openAdd}>
          <Plus size={16} /> Thêm xe mới
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <label className="field">
            <span>Tìm theo biển số, mã xe hoặc mẫu xe</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ví dụ: 51H-12345, Toyota Vios..."
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy xe phù hợp" />
        ) : (
          <div className="table-wrap">
            <table className="auk-table">
              <thead>
                <tr>
                  <th>Mã xe</th>
                  <th>Biển số</th>
                  <th>Mẫu xe</th>
                  <th>Màu sắc</th>
                  <th>Năm SX</th>
                  <th>Số km</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.MaXe}>
                    <td><strong>{c.MaXe}</strong></td>
                    <td><strong>{c.BienSo}</strong></td>
                    <td>{carModels.find((m) => m.MaMauXe === c.MaMauXe)?.TenMauXe || c.MaMauXe}</td>
                    <td>{c.MauSac}</td>
                    <td>{c.NamSanXuat}</td>
                    <td>{Number(c.SoKmHienTai).toLocaleString('vi-VN')} km</td>
                    <td><StatusBadge status={c.TrangThai} /></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="button button-dark button-sm" onClick={() => openEdit(c)}>
                        <Pencil size={14} /> Sửa
                      </button>
                      {c.TrangThai !== 'Ngừng hoạt động' && (
                        <button type="button" className="button button-danger button-sm" onClick={() => handleDeleteClick(c)}>
                          <Trash2 size={14} /> Xóa
                        </button>
                      )}
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
        title={editingId ? `Cập nhật thông tin xe ${editingId}` : 'Thêm xe mới'}
        confirmText="Lưu"
        onConfirm={handleSave}
        onCancel={() => setFormOpen(false)}
      >
        <div className="register-grid" style={{ marginTop: 0 }}>
          <label className="field">
            <span>Biển số xe <em>*</em></span>
            <input
              type="text"
              value={form.BienSo}
              onChange={(e) => setForm({ ...form, BienSo: e.target.value })}
              placeholder="VD: 51H-12345"
            />
          </label>
          <label className="field">
            <span>Mẫu xe <em>*</em></span>
            <select value={form.MaMauXe} onChange={(e) => setForm({ ...form, MaMauXe: e.target.value })}>
              {carModels.map((m) => (
                <option key={m.MaMauXe} value={m.MaMauXe}>{m.TenMauXe}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Màu xe <em>*</em></span>
            <input
              type="text"
              value={form.MauSac}
              onChange={(e) => setForm({ ...form, MauSac: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Năm sản xuất <em>*</em></span>
            <input
              type="number"
              value={form.NamSanXuat}
              onChange={(e) => setForm({ ...form, NamSanXuat: Number(e.target.value) })}
            />
          </label>
          <label className="field">
            <span>Số khung <em>*</em></span>
            <input
              type="text"
              value={form.SoKhung}
              onChange={(e) => setForm({ ...form, SoKhung: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Số máy <em>*</em></span>
            <input
              type="text"
              value={form.SoMay}
              onChange={(e) => setForm({ ...form, SoMay: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Số km hiện tại</span>
            <input
              type="number"
              value={form.SoKmHienTai}
              onChange={(e) => setForm({ ...form, SoKmHienTai: e.target.value })}
            />
          </label>
          {editingId && (
            <label className="field">
              <span>Trạng thái</span>
              <select value={form.TrangThai} onChange={(e) => setForm({ ...form, TrangThai: e.target.value })}>
                <option value="Sẵn sàng">Sẵn sàng</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
              </select>
            </label>
          )}
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Xác nhận xóa xe ${deleteTarget?.BienSo}`}
        message="Bạn có chắc chắn muốn xóa xe không? Xe sau khi xóa sẽ chuyển sang trạng thái Ngừng hoạt động và lịch sử thuê vẫn được bảo toàn."
        confirmText="Xác nhận"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Chọn lý do xóa xe</span>
          <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
            <option value="Bán">Đã bán</option>
            <option value="Thanh lý">Đã thanh lý</option>
            <option value="Hư hỏng">Hư hỏng không thể khôi phục</option>
          </select>
        </label>
      </ConfirmModal>
    </div>
  );
}
