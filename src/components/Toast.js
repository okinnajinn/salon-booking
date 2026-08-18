import React, { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: '#1a1a1a', color: '#fff', padding: '16px 24px', borderRadius: 12,
      fontSize: 15, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center'
    }}>
      {message}
    </div>
  );
}