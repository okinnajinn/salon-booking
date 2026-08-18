import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Toast from '../Toast';
import ConfirmDialog from '../ConfirmDialog';

export default function Calendar() {
  const [slots, setSlots] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [form, setForm] = useState({
    date_from: new Date().toISOString().split('T')[0],
    time_from: '10:00', time_to: '20:00', step_min: 30,
    days: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 0: false }
  });

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + weekOffset * 7);
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); days.push(d.toISOString().split('T')[0]); }
  const from = days[0], to = days[6];

  useEffect(() => { load(); }, [weekOffset]);

  const load = () => {
    const API = process.env.REACT_APP_API_URL || '/api';
    fetch(`${API}/slots/week?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    .then(r => r.json()).then(setSlots).catch(console.error);
  };

  const getSlotsForDay = (date) => slots.filter(s => s.date === date).sort((a,b) => a.start_time.localeCompare(b.start_time));
  const isPast = (dateStr) => new Date(dateStr) < new Date(today.toISOString().split('T')[0]);

  const handleGenerate = () => {
    const daysOfWeek = Object.entries(form.days).filter(([_,v]) => v).map(([d]) => Number(d));
    if (daysOfWeek.length === 0) return setToast('Выберите день');
    api.generateSlots({ date_from: form.date_from, days_of_week: daysOfWeek, time_from: form.time_from, time_to: form.time_to, step_min: Number(form.step_min) })
    .then(res => { setToast(`Создано: ${res.created}`); setShowForm(false); load(); }).catch(e => setToast(e.message));
  };

  const toggleBlock = (id, status) => { if (status === 'occupied') return; const action = status === 'blocked' ? api.unblockSlot(id) : api.blockSlot(id); action.then(() => load()).catch(console.error); };

  const ask = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: () => { action(); setConfirm(c => ({ ...c, open: false })); } });
  };

  const cancelApp = (appId, clientName) => ask(
    'Отменить запись клиента?',
    clientName ? `Запись клиента «${clientName}» будет отменена. Это нельзя отменить.` : 'Это нельзя отменить.',
    () => {
      api.cancelAppointment(appId).then(() => { load(); setToast('Запись отменена'); }).catch(e => setToast(e.message));
    }
  );

  const weekDays = [{ key: 1, label: 'Пн' }, { key: 2, label: 'Вт' }, { key: 3, label: 'Ср' }, { key: 4, label: 'Чт' }, { key: 5, label: 'Пт' }, { key: 6, label: 'Сб' }, { key: 0, label: 'Вс' }];

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <ConfirmDialog isOpen={confirm.open} title={confirm.title} message={confirm.message}
        onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>{new Date(from).toLocaleDateString('ru', { month: 'long' })} {new Date(from).getDate()} — {new Date(to).getDate()}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-small btn-secondary" onClick={() => setWeekOffset(w => w - 1)}>←</button>
          <button className="btn btn-small btn-secondary" onClick={() => setWeekOffset(0)}>Сегодня</button>
          <button className="btn btn-small btn-secondary" onClick={() => setWeekOffset(w => w + 1)}>→</button>
        </div>
      </div>
      <button className="btn btn-secondary btn-small" style={{ marginBottom: 16 }} onClick={() => setShowForm(!showForm)}>{showForm ? 'Отмена' : '+ Сгенерировать слоты'}</button>

      {showForm && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Начиная с</label><input className="form-input" type="date" value={form.date_from} onChange={e => setForm({...form, date_from: e.target.value})} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Шаг</label><select className="form-input" value={form.step_min} onChange={e => setForm({...form, step_min: e.target.value})}><option value={15}>15 мин</option><option value={30}>30 мин</option><option value={60}>60 мин</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">С</label><input className="form-input" type="time" value={form.time_from} onChange={e => setForm({...form, time_from: e.target.value})} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">До</label><input className="form-input" type="time" value={form.time_to} onChange={e => setForm({...form, time_to: e.target.value})} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Рабочие дни</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {weekDays.map(d => (
                <label key={d.key} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: form.days[d.key] ? '#1a1a1a' : '#f0f0f0', color: form.days[d.key] ? '#fff' : '#1a1a1a', userSelect: 'none' }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={form.days[d.key]} onChange={() => setForm({...form, days: {...form.days, [d.key]: !form.days[d.key]}})} />{d.label}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate}>Создать слоты</button>
        </div>
      )}

      {days.map(date => {
        if (isPast(date)) return null;
        return (
          <div key={date} style={{ marginBottom: 20, border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#fafafa', padding: '12px 16px', fontWeight: 500, fontSize: 14, borderBottom: '1px solid #eee' }}>{new Date(date).toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div style={{ padding: 8 }}>
              {getSlotsForDay(date).length === 0 ? <div style={{ color: '#888', fontSize: 13, padding: 12 }}>Нет слотов</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
                  {getSlotsForDay(date).map(s => (
                    <div key={s.id} onClick={() => toggleBlock(s.id, s.status)} style={{ padding: '10px 6px', borderRadius: 8, fontSize: 12, textAlign: 'center', cursor: s.status === 'occupied' ? 'default' : 'pointer', background: s.status === 'occupied' ? '#1a1a1a' : s.status === 'blocked' ? '#ddd' : '#f5f5f5', color: s.status === 'occupied' ? '#fff' : '#1a1a1a', textDecoration: s.status === 'blocked' ? 'line-through' : 'none', border: s.status === 'free' ? '1px solid #e0e0e0' : 'none' }}>
                      <div style={{ fontWeight: 600 }}>{s.start_time?.slice(0,5)}</div>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{s.status === 'occupied' ? (s.client_name || 'Занят') : s.status === 'blocked' ? 'Блок' : 'Свободен'}</div>
                      {s.status === 'occupied' && (
                      <>
                      <div style={{ fontSize: 10, marginTop: 2, fontWeight: 500 }}>{s.client_name || 'Клиент'}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{s.service_name || ''}</div>
                      <div style={{ fontSize: 10, marginTop: 4, color: '#ff6b6b', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); cancelApp(s.app_id, s.client_name); }}>Отменить</div>
                      </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}