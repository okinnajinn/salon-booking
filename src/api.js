const API = process.env.REACT_APP_API_URL || '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(API + url, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

export const api = {
  getServices: () => request('/services'),
  getService: (id) => request('/services/' + id),
  getSlots: (date) => request('/slots?date=' + date),
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  getMyAppointments: (phone) => request('/appointments/my', { method: 'POST', body: JSON.stringify({ phone }) }),

  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getAppointments: (from, to) => request(`/appointments?from=${from}&to=${to}`),
  cancelAppointment: (id) => request('/appointments/' + id + '/cancel', { method: 'PUT' }),
  completeAppointment: (id) => request('/appointments/' + id + '/complete', { method: 'PUT' }),
  
  getClients: (search) => request('/clients' + (search ? '?search=' + search : '')),
  getClient: (id) => request('/clients/' + id),
  updateNotes: (id, notes) => request('/clients/' + id + '/notes', { method: 'PUT', body: JSON.stringify({ notes }) }),
  
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request('/categories/' + id, { method: 'DELETE' }),
  
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request('/services/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  toggleService: (id) => request('/services/' + id + '/toggle', { method: 'PUT' }),
  deleteService: (id) => request('/services/' + id, { method: 'DELETE' }),
  
  generateSlots: (data) => request('/slots/generate', { method: 'POST', body: JSON.stringify(data) }),
  blockSlot: (id) => request('/slots/' + id + '/block', { method: 'PUT' }),
  unblockSlot: (id) => request('/slots/' + id + '/unblock', { method: 'PUT' }),
  
  getReport: (month) => request('/reports?month=' + month),
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadImages: (id, formData) => fetch(API + '/services/' + id + '/images', {
  method: 'POST',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  body: formData
  }).then(r => r.json()),
  deleteImage: (id, index) => request('/services/' + id + '/images/' + index, { method: 'DELETE' }),
};