import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Calendar from './Calendar';
import Clients from './Clients';
import ServicesAdmin from './ServicesAdmin';
import Reports from './Reports';
import Settings from './Settings';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname.split('/')[2] || 'calendar';

  const tabs = [
    { id: 'calendar', label: 'Календарь' },
    { id: 'clients', label: 'Клиенты' },
    { id: 'services', label: 'Услуги' },
    { id: 'reports', label: 'Отчёт' },
    { id: 'settings', label: 'Настройки' },
  ];

  return (
    <div>
      <div className="admin-nav">
        {tabs.map(t => (
          <div key={t.id} className={`admin-nav-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => navigate('/admin/' + t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="admin-content">
        <Routes>
          <Route path="calendar" element={<Calendar />} />
          <Route path="clients" element={<Clients />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </div>
      <div style={{ padding: 20, borderTop: '1px solid #eee' }}>
        <button className="btn btn-secondary" onClick={() => { localStorage.removeItem('token'); navigate('/'); }}>
          Выйти
        </button>
      </div>
    </div>
  );
}