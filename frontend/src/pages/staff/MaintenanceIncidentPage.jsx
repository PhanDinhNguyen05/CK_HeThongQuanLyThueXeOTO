import React, { useState } from 'react';
import { Wrench, ShieldAlert } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { operationsApi } from '../../api/endpoints';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

export default function MaintenanceIncidentPage() {
  const { currentUser } = useAuth();
  const {
    cars,
    carModels,
    contracts,
    maintenanceLogs,
    incidents,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState('maintenance'); // 'maintenance' | 'incident'

  // UC19 - Bảo dưỡng
  const [bdXe, setBdXe] = useState(cars[0]?.MaXe || '');
  const [bdNoiDung, setBdNoiDung] = useState('');
  const [bdPhi, setBdPhi] = useState('');
  const [bdChungTu, setBdChungTu] = useState('');

  // UC18 - Sự cố
  const [scHD, setScHD] = useState(contracts[0]?.MaHD || '');
  const [scLoai, setScLoai] = useState('Mất chìa khóa');
  const [scMoTa, setScMoTa] = useState('');
  const [scViTri, setScViTri] = useState('');
  const [scChiPhi, setScChiPhi] = useState('');

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    if (!bdXe) {
      showToast('Vui lòng chọn xe bảo dưỡng.', 'error');
      return;
    }
    if (!bdNoiDung.trim()) {
      showToast('Vui lòng nhập nội dung bảo dưỡng.', 'error');
      return;
    }
    const fee = Number(bdPhi);
    if (Number.isNaN(fee) || fee < 0) {
      showToast('Phí bảo dưỡng không hợp lệ.', 'error');
      return;
    }

    try {
      const res = await operationsApi.createMaintenance({
        MaXe: bdXe,
        NoiDungBaoDuong: bdNoiDung.trim(),
        PhiBaoDuong: fee,
        SoChungTu: bdChungTu.trim(),
      });
      await refreshForUser(currentUser);
      setBdNoiDung('');
      setBdPhi('');
      setBdChungTu('');
      showToast(`Ghi nhận bảo dưỡng ${res.data?.MaBaoDuong} thành công!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveIncident = async (transferLegal = false) => {
    const hd = contracts.find((c) => c.MaHD === scHD);
    if (!hd) {
      showToast('Không tìm thấy hợp đồng thuê xe.', 'error');
      return;
    }
    if (!scMoTa.trim() || !scViTri.trim()) {
      showToast('Vui lòng nhập đầy đủ Mô tả và Vị trí xảy ra sự cố.', 'error');
      return;
    }

    try {
      const res = await operationsApi.createIncident({
        MaHD: hd.MaHD,
        LoaiSuCo: scLoai,
        MoTa: scMoTa.trim(),
        ViTri: scViTri.trim(),
        ChiPhiPhatSinh: Number(scChiPhi) || 0,
        ChuyenPhapChe: transferLegal,
      });
      await refreshForUser(currentUser);
      setScMoTa('');
      setScViTri('');
      setScChiPhi('');
      showToast(
        transferLegal
          ? `Đã ghi nhận sự cố ${res.data?.MaSuCo} và chuyển hồ sơ sang Phòng Pháp chế.`
          : `Ghi nhận sự cố ${res.data?.MaSuCo} thành công!`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const selectedCarHistory = maintenanceLogs.filter((m) => m.MaXe === bdXe);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">BẢO DƯỠNG &amp; SỰ CỐ</span>
          <h1>Quản lý bảo dưỡng &amp; Xử lý sự cố</h1>
          <p>Ghi nhận lịch sử bảo dưỡng xe và tiếp nhận, phân loại sự cố phát sinh khi thuê xe.</p>
        </div>
      </div>

      <div className="tabs-bar">
        <button
          type="button"
          className={`tab-btn${tab === 'maintenance' ? ' active' : ''}`}
          onClick={() => setTab('maintenance')}
        >
          <Wrench size={15} style={{ verticalAlign: 'middle' }} /> Quản lý bảo dưỡng
        </button>
        <button
          type="button"
          className={`tab-btn${tab === 'incident' ? ' active' : ''}`}
          onClick={() => setTab('incident')}
        >
          <ShieldAlert size={15} style={{ verticalAlign: 'middle' }} /> Xử lý sự cố khi thuê xe
        </button>
      </div>

      {tab === 'maintenance' ? (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <form className="card" onSubmit={handleSaveMaintenance}>
            <h3 className="card-title">Ghi nhận bảo dưỡng xe</h3>
            <label className="field">
              <span>Chọn xe bảo dưỡng <em>*</em></span>
              <select value={bdXe} onChange={(e) => setBdXe(e.target.value)}>
                {cars.map((c) => (
                  <option key={c.MaXe} value={c.MaXe}>
                    {c.BienSo} — {carModels.find((m) => m.MaMauXe === c.MaMauXe)?.TenMauXe}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Nội dung bảo dưỡng <em>*</em></span>
              <textarea
                value={bdNoiDung}
                onChange={(e) => setBdNoiDung(e.target.value)}
                placeholder="VD: Thay dầu định kỳ, kiểm tra phanh..."
              />
            </label>
            <label className="field">
              <span>Phí bảo dưỡng (VNĐ) <em>*</em></span>
              <input
                type="number"
                value={bdPhi}
                onChange={(e) => setBdPhi(e.target.value)}
                placeholder="500000"
              />
            </label>
            <label className="field">
              <span>Mã / Số chứng từ</span>
              <input
                type="text"
                value={bdChungTu}
                onChange={(e) => setBdChungTu(e.target.value)}
                placeholder="VD: CT-BD-002"
              />
            </label>
            <button type="submit" className="button button-gold full">
              Lưu thông tin bảo dưỡng
            </button>
          </form>

          <div className="card">
            <h3 className="card-title">Lịch sử bảo dưỡng của xe ({selectedCarHistory.length})</h3>
            {selectedCarHistory.length === 0 ? (
              <EmptyState title="Xe này chưa có lịch sử bảo dưỡng" />
            ) : (
              <div className="table-wrap">
                <table className="auk-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Ngày</th>
                      <th>Nội dung</th>
                      <th>Chi phí</th>
                      <th>Chứng từ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCarHistory.map((m) => (
                      <tr key={m.MaBaoDuong}>
                        <td><strong>{m.MaBaoDuong}</strong></td>
                        <td>{formatDate(m.NgayBaoDuong)}</td>
                        <td>{m.NoiDungBaoDuong}</td>
                        <td>{formatCurrency(m.PhiBaoDuong)}</td>
                        <td>{m.SoChungTu}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 className="card-title">Ghi nhận sự cố xe</h3>
            <label className="field">
              <span>Hợp đồng thuê xe liên quan <em>*</em></span>
              <select value={scHD} onChange={(e) => setScHD(e.target.value)}>
                {contracts.map((c) => {
                  const car = cars.find((x) => x.MaXe === c.MaXe);
                  return (
                    <option key={c.MaHD} value={c.MaHD}>
                      {c.MaHD} · Biển số {car?.BienSo}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="field">
              <span>Loại sự cố <em>*</em></span>
              <select value={scLoai} onChange={(e) => setScLoai(e.target.value)}>
                <option value="Mất chìa khóa">Mất chìa khóa</option>
                <option value="Va quẹt nhẹ">Va quẹt nhẹ</option>
                <option value="Tai nạn / Hư hỏng nghiêm trọng">Tai nạn / Hư hỏng nghiêm trọng</option>
                <option value="Sự cố kỹ thuật khác">Sự cố kỹ thuật khác</option>
              </select>
            </label>
            <label className="field">
              <span>Vị trí xảy ra sự cố <em>*</em></span>
              <input
                type="text"
                value={scViTri}
                onChange={(e) => setScViTri(e.target.value)}
                placeholder="VD: Quận 1, TP.HCM"
              />
            </label>
            <label className="field">
              <span>Mô tả chi tiết sự cố <em>*</em></span>
              <textarea
                value={scMoTa}
                onChange={(e) => setScMoTa(e.target.value)}
                placeholder="Nhập nguyên nhân, tình trạng thực tế..."
              />
            </label>
            <label className="field">
              <span>Chi phí phát sinh dự kiến (VNĐ)</span>
              <input
                type="number"
                value={scChiPhi}
                onChange={(e) => setScChiPhi(e.target.value)}
                placeholder="0"
              />
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-gold"
                onClick={() => handleSaveIncident(false)}
              >
                Ghi nhận sự cố
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={() => handleSaveIncident(true)}
              >
                Chuyển Phòng Pháp chế
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Danh sách sự cố đã ghi nhận ({incidents.length})</h3>
            {incidents.length === 0 ? (
              <EmptyState title="Chưa có sự cố nào được ghi nhận" />
            ) : (
              <div className="table-wrap">
                <table className="auk-table">
                  <thead>
                    <tr>
                      <th>Mã SC</th>
                      <th>HĐ</th>
                      <th>Loại sự cố</th>
                      <th>Chi phí</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((s) => (
                      <tr key={s.MaSuCo}>
                        <td><strong>{s.MaSuCo}</strong></td>
                        <td>{s.MaHD}</td>
                        <td>
                          <div>{s.LoaiSuCo}</div>
                          <small style={{ color: '#77766e' }}>{s.ViTri} · {s.MoTa}</small>
                        </td>
                        <td>{formatCurrency(s.ChiPhiPhatSinh)}</td>
                        <td><StatusBadge status={s.TrangThai} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
