import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.login({ login, password });
      localStorage.setItem('token', res.token);
      navigate('/admin/calendar');
    } catch (e) {
      alert('Неверный логин или пароль');
    }
  };

  return (
    <div className="landing">
      <div className="logo" style={{ marginBottom: 40 }}>Вход для мастера</div>
      <div className="form-group" style={{ width: '100%' }}>
        <label className="form-label">Логин</label>
        <input className="form-input" value={login} onChange={e => setLogin(e.target.value)} />
      </div>
      <div className="form-group" style={{ width: '100%' }}>
        <label className="form-label">Пароль</label>
        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={handleLogin}>Войти</button>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>← Назад</button>
    </div>
  );
}