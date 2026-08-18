import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function MyAppointments() {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 11) return alert('Введите 11 цифр');
    setLoading(true);
    try {
      const res = await api.getMyAppointments(clean);
      setAppointments(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="back" onClick={() => navigate('/')}>←</div>
        <div className="header-title">Мои записи</div>
      </div>
      <div className="content">
        <div className="form-group">
          <label className="form-label">Введите телефон</label>
          <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9 (999) 999-99-99" />
        </div>
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'Поиск...' : 'Найти'}
        </button>
        {appointments !== null && appointments.length === 0 && (
          <div style={{ marginTop: 24, color: '#888', textAlign: 'center' }}>Записей не найдено</div>
        )}
        {appointments?.map(a => (
          <div key={a.id} style={{ background: '#fafafa', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 500 }}>{a.service_name}</div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
              {a.date} в {a.start_time?.slice(0,5)} — {a.status === 'done' ? 'Выполнено' : 'Ожидается'}
            </div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{a.price_at_moment} ₽</div>
          </div>
        ))}
      </div>
    </div>
  );
}