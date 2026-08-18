import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function BookingCalendar() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const today = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  useEffect(() => {
    if (selectedDate) {
      api.getSlots(selectedDate).then(setSlots).catch(console.error);
    }
  }, [selectedDate]);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const handleContinue = () => {
    if (!selectedSlot) return;
    navigate('/booking/confirm', { state: { serviceId, slotId: selectedSlot.id, date: selectedDate, time: selectedSlot.start_time } });
  };

  return (
    <div>
      <div className="header">
        <div className="back" onClick={() => navigate(-1)}>←</div>
        <div className="header-title">Выберите дату</div>
      </div>
      <div className="content">
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20 }}>
          {days.map(d => {
            const dateStr = formatDate(d);
            const isSelected = selectedDate === dateStr;
            return (
              <div key={dateStr} onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                style={{ minWidth: 60, padding: 12, borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: isSelected ? '#1a1a1a' : '#fafafa', color: isSelected ? '#fff' : '#1a1a1a' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase' }}>{d.toLocaleDateString('ru', { weekday: 'short' })}</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>Свободное время</div>
            {slots.length === 0 ? <div style={{ color: '#888' }}>Нет свободных слотов</div> : (
              <div className="slots-grid">
                {slots.map(s => (
                  <div key={s.id} className={`slot ${selectedSlot?.id === s.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(s)}>
                    {s.start_time.slice(0, 5)}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleContinue} disabled={!selectedSlot}>
              Продолжить
            </button>
          </>
        )}
      </div>
    </div>
  );
}