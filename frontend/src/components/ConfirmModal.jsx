import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'Xác nhận thao tác',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false,
  onConfirm,
  onCancel,
  children,
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-box">
        <div className="modal-head">
          <h3>{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 0, color: '#77766e' }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {message && <p style={{ marginTop: 0, color: '#4c493f' }}>{message}</p>}
          {children}
        </div>
        <div className="modal-foot">
          <button type="button" className="button button-muted" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`button ${danger ? 'button-danger' : 'button-gold'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
