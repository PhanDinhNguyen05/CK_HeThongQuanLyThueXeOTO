import React, { useState } from 'react';
import { Award, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { customerApi } from '../../api/endpoints';
import { formatDate, todayISO } from '../../utils/formatters';
import StatusBadge from '../../components/StatusBadge';

export default function MembershipPage() {
  const { currentUser } = useAuth();
  const {
    members,
    extensionRequests,
    refreshForUser,
  } = useData();
  const { showToast } = useToast();

  const member = members.find((m) => m.MaKH === currentUser?.MaKH);

  const [packageChoice, setPackageChoice] = useState('Gia hạn 1 Năm (900.000đ)');

  const handleRegisterMember = async () => {
    if (member) {
      showToast('Bạn đã là thành viên của hệ thống.', 'info');
      return;
    }
    try {
      const res = await customerApi.registerMembership();
      await refreshForUser(currentUser);
      showToast(`Đăng ký thành viên thành công! Mã thành viên của bạn là ${res.data?.MaTV}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRequestExtend = async (e) => {
    e.preventDefault();
    if (!member) return;
    try {
      const res = await customerApi.extendMembership({ GoiGiaHan: packageChoice });
      await refreshForUser(currentUser);
      showToast(res.message || 'Đã tiếp nhận yêu cầu gia hạn thành viên.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const myMemberRequests = extensionRequests.filter(
    (r) => r.MaKH === currentUser?.MaKH && r.LoaiYeuCau === 'Gia hạn thành viên'
  );

  return (
    <section className="section section-soft" style={{ paddingTop: 36, paddingBottom: 60 }}>
      <div className="wrap" style={{ maxWidth: 840 }}>
        <div className="page-header">
          <div>
            <span className="eyebrow">THÀNH VIÊN AUK</span>
            <h1>Quản lý thành viên</h1>
            <p>Đăng ký trở thành thành viên để tích lũy điểm hoặc gửi yêu cầu gia hạn thẻ.</p>
          </div>
        </div>

        {!member ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f5f0e6', display: 'grid', placeItems: 'center', color: '#947849' }}>
                <Award size={26} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Thành viên AUK CAR RENTAL</h3>
                <p style={{ margin: 0, color: '#77766e', fontSize: 13.5 }}>
                  Đăng ký thành viên miễn phí để bắt đầu tích lũy điểm theo chính sách của hệ thống.
                </p>
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div style={{ padding: 14, background: '#fbfaf7', border: '1px solid #e8e3d9', borderRadius: 4 }}>
                <strong><Check size={15} /> Tích lũy điểm thưởng</strong>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#77766e' }}>
                  Tích điểm sau mỗi giao dịch thuê xe hợp lệ (khách vãng lai không được tích điểm).
                </p>
              </div>
              <div style={{ padding: 14, background: '#fbfaf7', border: '1px solid #e8e3d9', borderRadius: 4 }}>
                <strong><Check size={15} /> Quản lý &amp; gia hạn trực tuyến</strong>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#77766e' }}>
                  Theo dõi thời hạn thẻ thành viên và gửi yêu cầu gia hạn ngay trên hệ thống.
                </p>
              </div>
            </div>
            <button type="button" className="button button-gold" onClick={handleRegisterMember}>
              Đăng ký thành viên ngay
            </button>
          </div>
        ) : (
          <>
            <div className="card">
              <h3 className="card-title">Thẻ thành viên của bạn</h3>
              <div className="detail-kv" style={{ marginBottom: 20 }}>
                <div className="detail-kv-item">
                  <label>Mã thành viên</label>
                  <div>{member.MaTV}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Tình trạng</label>
                  <div><StatusBadge status={member.TinhTrang} /></div>
                </div>
                <div className="detail-kv-item">
                  <label>Ngày bắt đầu</label>
                  <div>{formatDate(member.NgayBatDau)}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Ngày hết hạn</label>
                  <div>{formatDate(member.NgayHetHan)}</div>
                </div>
                <div className="detail-kv-item">
                  <label>Điểm tích lũy</label>
                  <div style={{ color: '#947849', fontSize: 18 }}>{member.DiemTichLuy} điểm</div>
                </div>
              </div>

              <form onSubmit={handleRequestExtend} style={{ borderTop: '1px solid #e8e3d9', paddingTop: 18 }}>
                <h4 style={{ marginTop: 0, marginBottom: 12 }}>Yêu cầu gia hạn thành viên</h4>
                <label className="field">
                  <span>Chọn gói gia hạn mong muốn</span>
                  <select value={packageChoice} onChange={(e) => setPackageChoice(e.target.value)}>
                    <option value="Gia hạn 6 Tháng (500.000đ)">Gia hạn 6 Tháng (500.000đ)</option>
                    <option value="Gia hạn 1 Năm (900.000đ)">Gia hạn 1 Năm (900.000đ)</option>
                    <option value="Gia hạn 2 Năm (1.600.000đ)">Gia hạn 2 Năm (1.600.000đ)</option>
                  </select>
                </label>
                <button type="submit" className="button button-gold">
                  Gửi yêu cầu gia hạn
                </button>
              </form>
            </div>

            {myMemberRequests.length > 0 && (
              <div className="card">
                <h3 className="card-title">Lịch sử yêu cầu gia hạn thành viên</h3>
                <div className="table-wrap">
                  <table className="auk-table">
                    <thead>
                      <tr>
                        <th>Mã yêu cầu</th>
                        <th>Gói đề nghị</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myMemberRequests.map((r) => (
                        <tr key={r.MaYC}>
                          <td><strong>{r.MaYC}</strong></td>
                          <td>{r.GoiHoacNgayDeNghi}</td>
                          <td>{formatDate(r.NgayGui)}</td>
                          <td><StatusBadge status={r.TrangThai} /></td>
                          <td>{r.LyDoTuChoi || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
