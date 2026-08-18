import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Success() {
  const { state } = useLocation();
  const navigate = useNavigate();
  if (!state) return navigate('/');

  return (
    <div className="success-screen">
      <div style={{ fontSize: 64 }}>✓</div>
      <div className="logo" style={{ fontSize: 22 }}>Вы записаны!</div>
      <div className="subtitle" style={{ lineHeight: 1.6 }}>
        {state.date} в {state.time}<br />
        Ждем вас!
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/')}>На главную</button>
    </div>
  );
}