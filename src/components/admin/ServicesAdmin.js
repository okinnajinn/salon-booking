import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import Toast from '../Toast';
import ConfirmDialog from '../ConfirmDialog';

const formatDuration = (min) => {
  if (!min || min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
};

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [form, setForm] = useState({ name: '', price: '', duration_min: 60, short_description: '', full_description: '', purpose: '', category_id: '' });
  const [catForm, setCatForm] = useState({ name: '', image: '' });

  useEffect(() => { load(); }, []);

  const load = () => {
    api.getServices().then(data => {
      const all = [];
      data.forEach(c => all.push(...c.services));
      setServices(all);
    }).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
  };

  const ask = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: () => { action(); setConfirm(c => ({ ...c, open: false })); } });
  };

  const handleCreate = async () => {
    if (!form.category_id) return setToast('Выберите категорию');
    if (!form.name.trim()) return setToast('Введите название');
    if (!form.price || Number(form.price) <= 0) return setToast('Введите цену');
    await api.createService({ ...form, price: Number(form.price), duration_min: Number(form.duration_min), category_id: form.category_id, sort_order: 0 });
    setShowForm(false);
    setForm({ name: '', price: '', duration_min: 60, short_description: '', full_description: '', purpose: '', category_id: '' });
    load();
    setToast('Услуга создана');
  };

  const handleCreateCategory = async () => {
    if (!catForm.name.trim()) return setToast('Введите название');
    await api.createCategory(catForm);
    setShowCategoryForm(false);
    setCatForm({ name: '', image: '' });
    load();
    setToast('Категория создана');
  };

  const toggle = (id) => api.toggleService(id).then(() => { load(); setToast('Статус изменён'); }).catch(console.error);

  const remove = (id) => ask('Удалить услугу?', 'Это нельзя отменить. Услуга с записями в истории не удалится.', () => {
    api.deleteService(id).then(() => { load(); setToast('Услуга удалена'); }).catch(e => setToast(e.message));
  });

  const removeCategory = (id) => ask('Удалить категорию?', 'Все услуги внутри должны быть удалены заранее.', () => {
    api.deleteCategory(id).then(() => { load(); setToast('Категория удалена'); }).catch(e => setToast(e.message));
  });

  const activeServices = services.filter(s => s.is_active !== 0);
  const archiveServices = services.filter(s => s.is_active === 0);

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <ConfirmDialog isOpen={confirm.open} title={confirm.title} message={confirm.message}
        onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary btn-small" style={{ flex: 1 }} onClick={() => setShowForm(true)}>+ Услуга</button>
        <button className="btn btn-secondary btn-small" style={{ flex: 1 }} onClick={() => setShowCategoryForm(true)}>+ Категория</button>
      </div>

      {showCategoryForm && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Название категории</label><input className="form-input" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">URL фото категории</label><input className="form-input" value={catForm.image} onChange={e => setCatForm({...catForm, image: e.target.value})} placeholder="https://..." /></div>
          <button className="btn btn-primary" onClick={handleCreateCategory}>Создать</button>
          <button className="btn btn-secondary" onClick={() => setShowCategoryForm(false)} style={{ marginTop: 8 }}>Отмена</button>
        </div>
      )}

      {categories.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Категории</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(c => (
              <div key={c.id} style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.image && <img src={c.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
                <span>{c.name}</span>
                <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => removeCategory(c.id)}>×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Категория *</label>
            <select className="form-input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">Выберите</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Название *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Цена *</label><input className="form-input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Длительность (мин) *</label><input className="form-input" type="number" value={form.duration_min} onChange={e => setForm({...form, duration_min: e.target.value})} placeholder="60" /></div>
          <div className="form-group"><label className="form-label">Короткое описание</label><input className="form-input" value={form.short_description} onChange={e => setForm({...form, short_description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Полное описание</label><textarea value={form.full_description} onChange={e => setForm({...form, full_description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Для чего</label><textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} /></div>
          <button className="btn btn-primary" onClick={handleCreate}>Сохранить</button>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ marginTop: 8 }}>Отмена</button>
        </div>
      )}

      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Активные ({activeServices.length})</div>
      {activeServices.length === 0 && <div style={{ color: '#888', padding: '20px 0' }}>Нет активных услуг</div>}
      {activeServices.map(s => (
        <div className="service-card" key={s.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div className="service-name">{s.name}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>✓ Активна · {formatDuration(s.duration_min)}</div></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-small" style={{ width: 'auto', fontSize: 12, padding: '6px 10px', background: '#f0f0f0' }} onClick={() => toggle(s.id)}>Скрыть</button>
              <button className="btn btn-small" style={{ width: 'auto', fontSize: 12, padding: '6px 10px', background: '#ff4444', color: '#fff' }} onClick={() => remove(s.id)}>Удалить</button>
            </div>
          </div>
          <div className="service-meta" style={{ marginTop: 8 }}><span className="service-price">{s.price.toLocaleString()} ₽</span><span className="service-time">{formatDuration(s.duration_min)}</span></div>
        </div>
      ))}

      <div style={{ marginTop: 24, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Архив ({archiveServices.length})</div>
        <button className="btn btn-small" style={{ width: 'auto' }} onClick={() => setShowArchive(!showArchive)}>{showArchive ? 'Скрыть' : 'Показать'}</button>
      </div>
      {showArchive && archiveServices.map(s => (
        <div className="service-card" key={s.id} style={{ opacity: 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div className="service-name">{s.name}</div><div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Скрыта · {formatDuration(s.duration_min)}</div></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-small" style={{ width: 'auto', fontSize: 12, padding: '6px 10px', background: '#1a1a1a', color: '#fff' }} onClick={() => toggle(s.id)}>Восстановить</button>
              <button className="btn btn-small" style={{ width: 'auto', fontSize: 12, padding: '6px 10px', background: '#ff4444', color: '#fff' }} onClick={() => remove(s.id)}>Удалить</button>
            </div>
          </div>
          <div className="service-meta" style={{ marginTop: 8 }}><span className="service-price">{s.price.toLocaleString()} ₽</span><span className="service-time">{formatDuration(s.duration_min)}</span></div>
        </div>
      ))}
    </div>
  );
}