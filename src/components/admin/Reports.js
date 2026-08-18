import React, { useState } from 'react';
import { api } from '../../api';

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);

  const load = () => {
    api.getReport(month).then(setData).catch(console.error);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="form-input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        <button className="btn btn-primary btn-small" onClick={load}>Показать</button>
      </div>
      
      {data && (
        <>
          <div className="stat-card">
            <div className="stat-number">{data.total_earnings.toLocaleString()} ₽</div>
            <div className="stat-label">Заработок</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-number">{data.total_count}</div>
              <div className="stat-label">Записей</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{Math.round(data.average_check).toLocaleString()} ₽</div>
              <div className="stat-label">Средний чек</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="detail-section-title">По дням</div>
            {data.breakdown_by_day.map(d => (
              <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 14 }}>
                <span>{d.date}</span>
                <span>{d.count} записей — {Math.round(d.earnings).toLocaleString()} ₽</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}