import React, { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.getClients(search).then(setClients).catch(console.error);
  };

  const openClient = (id) => {
    api.getClient(id).then(setSelected).catch(console.error);
  };

  const saveNotes = () => {
    api.updateNotes(selected.id, selected.notes).then(() => alert('Сохранено')).catch(console.error);
  };

  if (selected) return (
    <div>
      <div className="header">
        <div className="back" onClick={() => setSelected(null)}>←</div>
        <div className="header-title">{selected.name}</div>
      </div>
      <div className="content">
        <div style={{ color: '#888', marginBottom: 16 }}>{selected.phone}</div>
        <div className="form-group">
          <label className="form-label">Заметки мастера</label>
          <textarea value={selected.notes || ''} onChange={e => setSelected({...selected, notes: e.target.value})} />
        </div>
        <button className="btn btn-primary" onClick={saveNotes}>Сохранить заметки</button>
        <div style={{ marginTop: 24 }}>
          <div className="detail-section-title">История</div>
          {selected.history?.map(h => (
            <div key={h.id} style={{ padding: 8, borderBottom: '1px solid #eee', fontSize: 14 }}>
              {h.date} {h.start_time?.slice(0,5)} — {h.service_name} ({h.price_at_moment} ₽)
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <input className="form-input" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16 }} onKeyPress={e => e.key === 'Enter' && load()} />
      {clients.map(c => (
        <div className="client-row" key={c.id} onClick={() => openClient(c.id)}>
          <div>
            <div style={{ fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: '#888' }}>{c.phone}</div>
          </div>
        </div>
      ))}
    </div>
  );
}