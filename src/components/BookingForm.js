import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function BookingForm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!state) return navigate('/');

  const handleSubmit = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) return alert('Введите телефон полностью');
    if (!name.trim()) return alert('Введите имя');
    
    setLoading(true);
    try {
      await api.createAppointment({ name, phone: cleanPhone, service_id: state.serviceId, slot_id: state.slotId });
      navigate('/success', { state: { date: state.date, time: state.time } });
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="back" onClick={() => navigate(-1)}>←</div>
        <div className="header-title">Контакты</div>
      </div>
      <div className="content">
        <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#888' }}>Запись на</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{state.date}, {state.time}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Ваше имя</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Анна" />
        </div>
        <div className="form-group">
          <label className="form-label">Телефон</label>
          <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9 (999) 999-99-99" type="tel" />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Сохранение...' : 'Подтвердить запись'}
        </button>
      </div>
    </div>
  );
}