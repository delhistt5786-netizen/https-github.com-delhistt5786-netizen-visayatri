import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// ── Attach JWT from localStorage ─────────────────────────
api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('visayatri_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ── Global response handler ───────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    // Token expired → clear storage & redirect
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const msg = err.response.data?.message || '';
      if (msg.includes('expired') || msg.includes('Invalid token')) {
        localStorage.removeItem('visayatri_token');
        localStorage.removeItem('visayatri_user');
        window.location.href = '/auth/login?expired=1';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register:       (data)     => api.post('/auth/register', data),
  login:          (data)     => api.post('/auth/login', data),
  me:             ()         => api.get('/auth/me'),
  updateProfile:  (data)     => api.put('/auth/profile', data),
  changePassword: (data)     => api.put('/auth/change-password', data),
};

// ── Visas ─────────────────────────────────────────────────
export const visaAPI = {
  getAll:    (params)     => api.get('/visas', { params }),
  getBySlug: (slug)       => api.get(`/visas/${slug}`),
  create:    (data)       => api.post('/visas', data),
  update:    (id, data)   => api.put(`/visas/${id}`, data),
  remove:    (id)         => api.delete(`/visas/${id}`),
};

// ── Applications ──────────────────────────────────────────
export const appAPI = {
  create:       (data)         => api.post('/applications', data),
  getMy:        (params)       => api.get('/applications/my', { params }),
  getById:      (id)           => api.get(`/applications/${id}`),
  uploadDocs:   (id, formData) => api.post(`/applications/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStatus: (id, data)     => api.put(`/applications/${id}/status`, data),
  getAll:       (params)       => api.get('/applications', { params }),
  edit:         (id, data)     => api.put(`/applications/${id}`, data),
};

// ── Agents ────────────────────────────────────────────────
export const agentAPI = {
  getDashboard:   ()              => api.get('/agents/dashboard'),
  getWallet:      (params)        => api.get('/agents/wallet', { params }),
  topUpRequest:   (amount)        => api.post('/agents/wallet/topup-request', { amount }),
  creditWallet:   (data)          => api.post('/agents/wallet/credit', data),   // admin
  getList:        (params)        => api.get('/agents/list', { params }),        // admin
  approve:        (id, isApproved)=> api.put(`/agents/${id}/approve`, { isApproved }),
  setCommission:  (id, rate)      => api.put(`/agents/${id}/commission`, { commissionRate: rate }),
  getTransactions:(id)            => api.get(`/agents/${id}/transactions`),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: ()       => api.get('/admin/dashboard'),
  getStats:     ()       => api.get('/admin/stats'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  toggleUser:   (id)     => api.put(`/admin/users/${id}/toggle`),
  getTransactions:(params)=> api.get('/admin/transactions', { params }),
  getSettings:  ()       => api.get('/admin/settings'),
  updateSettings:(data)  => api.put('/admin/settings', data),
};

// ── Payments ──────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify:      (data) => api.post('/payments/verify', data),
};

// ── PDF ───────────────────────────────────────────────────
export const pdfURL = (appId) => `${BASE}/pdf/invoice/${appId}`;

export default api;
