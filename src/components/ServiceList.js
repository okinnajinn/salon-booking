import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ServiceList() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getServices().then(setCategories).catch(console.error);
  }, []);

  return (
    <div>
      <div className="header">
        <div className="back" onClick={() => navigate('/')}>←</div>
        <div className="header-title">Услуги</div>
      </div>
      <div className="content">
        {categories.map(cat => (
          <div className="category" key={cat.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {cat.image && <img src={cat.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
            <div className="category-name">{cat.name}</div>
            </div>
            {cat.services.map(s => (
              <div className="service-card" key={s.id} onClick={() => navigate('/service/' + s.id)}>
                <div className="service-name">{s.name}</div>
                <div className="service-desc">{s.short_description}</div>
                <div className="service-meta">
                  <span className="service-price">{s.price.toLocaleString()} ₽</span>
                  <span className="service-time">{s.duration_min} мин</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}