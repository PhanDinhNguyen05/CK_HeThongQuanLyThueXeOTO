import React from 'react';

const STATUS_MAP = {
  'Sẵn sàng': 'badge-success',
  'Hoạt động': 'badge-success',
  'Đang làm việc': 'badge-success',
  'Hoàn tất': 'badge-success',
  'Đã thanh toán': 'badge-success',
  'Thành công': 'badge-success',
  'Đã phê duyệt': 'badge-success',
  'Đã xác nhận': 'badge-info',
  'Đã thực hiện': 'badge-info',
  'Đã ghi nhận': 'badge-info',
  'Đang thuê': 'badge-warning',
  'Chờ xác nhận': 'badge-warning',
  'Chờ xử lý': 'badge-warning',
  'Chờ xét duyệt': 'badge-warning',
  'Chờ duyệt': 'badge-warning',
  'Bảo trì': 'badge-warning',
  'Chưa thanh toán': 'badge-danger',
  'Quá hạn': 'badge-danger',
  'Từ chối': 'badge-danger',
  'Tạm khóa': 'badge-danger',
  'Đã khóa': 'badge-danger',
  'Đã hủy': 'badge-muted',
  'Ngừng hoạt động': 'badge-muted',
  'Vô hiệu hóa': 'badge-muted',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
}
