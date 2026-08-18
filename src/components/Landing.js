import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div className="logo">NAIL STUDIO</div>
        <div className="subtitle">Онлайн-запись на процедуры</div>
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/services')}>📝 Записаться</button>
      <button className="btn btn-secondary" onClick={() => navigate('/my')}>📋 Мои записи</button>
      <button className="btn btn-secondary" onClick={() => navigate('/admin/login')}>🔐 Вход для мастера</button>
    </div>
  );
}