import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Удалить' }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }}>
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, maxWidth: 360, width: '90%' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Отмена</button>
          <button className="btn btn-primary" style={{ flex: 1, background: '#ff4444' }} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}