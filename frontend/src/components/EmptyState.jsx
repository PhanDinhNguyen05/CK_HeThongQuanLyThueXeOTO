import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Không có dữ liệu', description = '' }) {
  return (
    <div className="empty-state">
      <Inbox size={38} strokeWidth={1.5} color="#a28753" />
      <h3>{title}</h3>
      {description && <p style={{ margin: 0, fontSize: 13.5 }}>{description}</p>}
    </div>
  );
}
