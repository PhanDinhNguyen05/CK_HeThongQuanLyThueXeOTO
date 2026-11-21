import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../api/endpoints';
import { validatePhone } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';

export default function EmployeesPage() {
  const { currentUser } = useAuth();
  const { employees, refreshForUser } = useData();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState('');
  const [appliedKw, setAppliedKw] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaNV, setEditingMaNV] = useState(null);
  const [form, setForm] = useState({ MaNV: '', HoTen: '', DienThoai: '', MoTa: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = employees.filter((e) => {
    const q = appliedKw.trim().toLowerCase();
    if (!q) return true;
    return (
      e.MaNV.toLowerCase().includes(q) ||
      e.HoTen.toLowerCase().includes(q) ||
      e.DienThoai.toLowerCase().includes(q)
    );
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedKw(keyword);
  };

  const handleReset = () => {
    setKeyword('');
    setAppliedKw('');
  };

  const openAdd = () => {
    setEditingMaNV(null);
    setForm({ MaNV: '', HoTen: '', DienThoai: '', MoTa: '' });
    setFormOpen(true);
  };

  const openEdit = (emp) => {
    setEditingMaNV(emp.MaNV);
    setForm({ MaNV: emp.MaNV, HoTen: emp.HoTen, DienThoai: emp.DienThoai, MoTa: emp.MoTa });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.MaNV.trim() || !form.HoTen.trim() || !form.DienThoai.trim()) {
      showToast('Vui lòng nhập đầy đủ Mã nhân viên, Họ tên và Số điện thoại.', 'error');
      return;
    }
    if (!validatePhone(form.DienThoai)) {
      showToast('Số điện thoại không hợp lệ (phải gồm đúng 10 chữ số).', 'error');
      return;
    }

    try {
      if (editingMaNV) {
        const res = await adminApi.updateEmployee(editingMaNV, {
          HoTen: form.HoTen.trim(),
          DienThoai: form.DienThoai.trim(),
          MoTa: form.MoTa.trim(),
        });
        showToast(res.message || `Cập nhật nhân viên ${editingMaNV} thành công!`, 'success');
      } else {
        const res = await adminApi.createEmployee({
          MaNV: form.MaNV.trim().toUpperCase(),
          HoTen: form.HoTen.trim(),
          DienThoai: form.DienThoai.trim(),
          MoTa: form.MoTa.trim() || 'Nhân viên',
        });
        showToast(res.message || 'Thêm nhân viên mới thành công!', 'success');
      }
      await refreshForUser(currentUser);
      setFormOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminApi.deleteEmployee(deleteTarget.MaNV);
      await refreshForUser(currentUser);
      showToast(
        res.message || `Đã xử lý xóa nhân viên ${deleteTarget.MaNV} thành công!`,
        res.data?.softDeleted ? 'warning' : 'success'
      );
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
          <span className="eyebrow">QUẢN LÝ NHÂN VIÊN</span>
          <h1>Quản lý nhân viên</h1>
          <p>Tìm kiếm, thêm mới, cập nhật và xóa / ngừng hoạt động hồ sơ nhân viên.</p>
        </div>
        <button type="button" className="button button-gold" onClick={openAdd}>
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      <form className="card" onSubmit={handleSearch}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <label className="field">
            <span>Từ khóa tìm kiếm (Mã NV, Họ tên hoặc SĐT)</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập Mã NV, Họ tên hoặc Số điện thoại..."
            />
          </label>
          <button type="submit" className="button button-gold">
            <Search size={16} /> Tìm kiếm
          </button>
          <button type="button" className="button button-muted" onClick={handleReset}>
            <RotateCcw size={16} /> Làm mới
          </button>
        </div>
      </form>

      <div className="card">
        <h3 className="card-title">Danh sách nhân viên ({filtered.length})</h3>
        {filtered.length === 0 ? (
          <EmptyState title="Không có nhân viên phù hợp" description="Vui lòng thử từ khóa khác hoặc nhấn Làm mới." />
        ) : (
          <div className="table-wrap">
            <table className="auk-table">
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ và tên</th>
                  <th>Số điện thoại</th>
                  <th>Mô tả / Ghi chú</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.MaNV}>
                    <td><strong>{emp.MaNV}</strong></td>
                    <td>{emp.HoTen}</td>
                    <td>{emp.DienThoai}</td>
                    <td>{emp.MoTa}</td>
                    <td><StatusBadge status={emp.TrangThai} /></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="button button-dark button-sm" onClick={() => openEdit(emp)}>
                        <Pencil size={14} /> Cập nhật
                      </button>
                      {emp.TrangThai !== 'Ngừng hoạt động' && (
                        <button type="button" className="button button-danger button-sm" onClick={() => setDeleteTarget(emp)}>
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
        title={editingMaNV ? `Cập nhật nhân viên ${editingMaNV}` : 'Thêm nhân viên mới'}
        confirmText={editingMaNV ? 'Lưu cập nhật' : 'Thêm nhân viên'}
        onConfirm={handleSave}
        onCancel={() => setFormOpen(false)}
      >
        <label className="field">
          <span>Mã nhân viên <em>*</em></span>
          <input
            type="text"
            value={form.MaNV}
            readOnly={Boolean(editingMaNV)}
            onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
            placeholder="Ví dụ: NV004"
          />
        </label>
        <label className="field">
          <span>Họ và tên <em>*</em></span>
          <input
            type="text"
            value={form.HoTen}
            onChange={(e) => setForm({ ...form, HoTen: e.target.value })}
            placeholder="Nhập họ tên nhân viên"
          />
        </label>
        <label className="field">
          <span>Số điện thoại <em>*</em></span>
          <input
            type="text"
            value={form.DienThoai}
            onChange={(e) => setForm({ ...form, DienThoai: e.target.value })}
            placeholder="10 chữ số"
          />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Mô tả / Ghi chú</span>
          <textarea
            value={form.MoTa}
            onChange={(e) => setForm({ ...form, MoTa: e.target.value })}
            placeholder="Nhập mô tả công việc..."
          />
        </label>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa nhân viên"
        message={`Bạn có chắc chắn muốn xóa nhân viên ${deleteTarget?.MaNV} - ${deleteTarget?.HoTen} không?`}
        confirmText="Xác nhận xóa"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
