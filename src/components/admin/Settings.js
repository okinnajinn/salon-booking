import React, { useEffect, useState } from 'react';
import { api } from '../../api';

export default function Settings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const save = () => {
    api.updateSettings({ sms_enabled: settings.master.sms_enabled, smsru_api_key: settings.master.smsru_api_key })
      .then(() => alert('Сохранено')).catch(console.error);
  };

  if (!settings) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="detail-section-title" style={{ marginBottom: 12 }}>Уведомления клиентам</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
        <span>SMS-напоминания</span>
        <button className="btn btn-small" style={{ width: 'auto', background: settings.master.sms_enabled ? '#1a1a1a' : '#f0f0f0', color: settings.master.sms_enabled ? '#fff' : '#1a1a1a' }}
          onClick={() => setSettings({...settings, master: {...settings.master, sms_enabled: !settings.master.sms_enabled}})}>
          {settings.master.sms_enabled ? 'Включены' : 'Выключены'}
        </button>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <div className="detail-section-title">Режим SMS</div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
          {settings.sms_mode === 'platform' ? 'SMS оплачивает владелец сайта' : 'Каждый мастер сам'}
        </div>
        <div className="form-group">
          <label className="form-label">API-ключ SMS.ru (если индивидуальный режим)</label>
          <input className="form-input" value={settings.master.smsru_api_key || ''} 
            onChange={e => setSettings({...settings, master: {...settings.master, smsru_api_key: e.target.value}})} />
        </div>
        <button className="btn btn-primary" onClick={save}>Сохранить</button>
      </div>
    </div>
  );
}