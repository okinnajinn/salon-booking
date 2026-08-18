import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);

  useEffect(() => {
    api.getService(id).then(setService).catch(console.error);
  }, [id]);

  if (!service) return <div className="content">Загрузка...</div>;

  return (
    <div>
      <div className="header">
        <div className="back" onClick={() => navigate('/services')}>←</div>
        <div className="header-title">Услуга</div>
      </div>
      <div className="content">
        <div className="detail-image">📷</div>
        <div className="detail-name">{service.name}</div>
        <div className="detail-meta">
          <span>⏱ {service.duration_min} мин</span>
          <span> {service.price.toLocaleString()} ₽</span>
        </div>
        <div className="detail-section">
          <div className="detail-section-title">Описание</div>
          <div className="detail-text">{service.full_description || service.short_description}</div>
        </div>
        {service.purpose && (
          <div className="detail-section">
            <div className="detail-section-title">Для чего</div>
            <div className="detail-text">{service.purpose}</div>
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/booking/' + id)}>
          Выбрать дату и время
        </button>
      </div>
    </div>
  );
}