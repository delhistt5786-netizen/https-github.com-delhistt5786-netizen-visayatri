import axios from 'axios';
import * as mockData from './mockData';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
// Uploaded files (passport scans, photos) are served statically from the
// backend root, not under /api — strip the /api suffix to build their URLs.
export const uploadsOrigin = BASE.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: BASE, timeout: 5000 });

// ── Development mock mode ─────────────────────────────────
// Only ever used for local frontend-only work (NEXT_PUBLIC_USE_MOCK=true) or
// during SSR (no real user session to fetch with yet). A live backend that
// briefly errors must surface that error to the UI, not silently swap in
// fake data — see withMock() below.
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || typeof window === 'undefined';

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

// Helper: Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Mock response wrapper
const mockResponse = async (data) => {
  if (USE_MOCK) await delay(300); // Simulate network latency
  return Promise.resolve({ data });
};

// Helper: try the real call; only fall back to mock data when mock mode is
// explicitly on (or during SSR). A real production error is rethrown so
// callers' own error handling (toasts, ErrorBanner, etc.) runs — never
// silently masked behind fake data.
const withMock = async (call, mockFn) => {
  try {
    return await call();
  } catch (err) {
    if (!USE_MOCK) throw err;
    console.warn('⚠️  API error, using mock data:', err.code || err.message);
    return mockResponse(mockFn());
  }
};

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => withMock(
    () => api.post('/auth/register', data),
    () => {
      const newUser = { _id: 'mock_' + Date.now(), ...data, role: data.role || 'user' };
      if (typeof window !== 'undefined') {
        localStorage.setItem('visayatri_user', JSON.stringify(newUser));
        localStorage.setItem('visayatri_token', 'mock_token_' + Date.now());
      }
      return { user: newUser, token: 'mock_token' };
    },
  ),
  login: (data) => withMock(
    () => api.post('/auth/login', data),
    () => {
      const mockUser = data.email.includes('admin') ? mockData.MOCK_ADMIN :
                       data.email.includes('priya') ? mockData.MOCK_AGENT :
                       mockData.MOCK_USER;
      if (typeof window !== 'undefined') {
        localStorage.setItem('visayatri_user', JSON.stringify(mockUser));
        localStorage.setItem('visayatri_token', 'mock_token_' + Date.now());
      }
      return { user: mockUser, token: 'mock_token' };
    },
  ),
  me: () => withMock(() => api.get('/auth/me'), () => mockData.MOCK_USER),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ── Visas ─────────────────────────────────────────────────
export const visaRuleAPI = {
  getByCountry: (countrySlug) => api.get(`/visa-rules/${countrySlug}`),
};

export const visaAPI = {
  getAll: (params) => withMock(
    () => api.get('/visas', { params }),
    () => params?.region ? mockData.MOCK_VISAS.filter(v => v.region === params.region) : mockData.MOCK_VISAS,
  ),
  getBySlug: (slug) => withMock(
    () => api.get(`/visas/${slug}`),
    () => mockData.MOCK_VISAS.find(v => v.slug === slug) || mockData.MOCK_VISAS[0],
  ),
  // Admin methods for visa management
  create: (data) => api.post('/admin/visas', data),
  update: (id, data) => api.put(`/admin/visas/${id}`, data),
  delete: (id) => api.delete(`/admin/visas/${id}`),
  toggleStatus: (id) => api.patch(`/admin/visas/${id}/toggle`),
};

// ── Countries ─────────────────────────────────────────────
export const countryAPI = {
  getAll: () => withMock(() => api.get('/countries'), () => mockData.MOCK_COUNTRIES || []),
  create: (data) => api.post('/countries', data),
  update: (id, data) => api.put(`/countries/${id}`, data),
  delete: (id) => api.delete(`/countries/${id}`),
};

// ── Applications ──────────────────────────────────────────
export const appAPI = {
  create: (data) => api.post('/applications', data),
  getMy: (params) => withMock(() => api.get('/applications/my', { params }), () => mockData.MOCK_APPLICATIONS),
  getMyAvatar: () => withMock(() => api.get('/applications/my/avatar'), () => ({ avatarUrl: null })),
  getById: (id) => withMock(
    () => api.get(`/applications/${id}`),
    () => mockData.MOCK_APPLICATIONS.find(a => a._id === id) || mockData.MOCK_APPLICATIONS[0],
  ),
  uploadDocs: (id, formData) => api.post(`/applications/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  uploadVisaDocument: (id, formData) => api.post(`/applications/${id}/visa-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  requestDocuments: (id, data) => api.post(`/applications/${id}/request-documents`, data),
  getAll: (params) => withMock(() => api.get('/applications', { params }), () => ({ data: mockData.MOCK_APPLICATIONS })),
  edit: (id, data) => api.put(`/applications/${id}`, data),
  track: (applicationId, email) => api.get('/applications/track', { params: { applicationId, email } }),
};

// ── Agents ────────────────────────────────────────────────
export const agentAPI = {
  getDashboard: () => withMock(() => api.get('/agents/dashboard'), () => mockData.MOCK_AGENT_DATA),
  getWallet: (params) => withMock(() => api.get('/agents/wallet', { params }), () => mockData.MOCK_AGENT_DATA.wallet),
  topUpRequest: (amount) => api.post('/agents/wallet/topup-request', { amount }),
  myTopUpRequests: () => withMock(() => api.get('/agents/wallet/requests'), () => ({ data: [] })),
  creditWallet: (data) => api.post('/agents/wallet/credit', data),
  getTopUpRequests: (params) => withMock(() => api.get('/agents/wallet-requests', { params }), () => ({ data: [] })),
  approveTopUpRequest: (id) => api.put(`/agents/wallet-requests/${id}/approve`),
  rejectTopUpRequest: (id, note) => api.put(`/agents/wallet-requests/${id}/reject`, { note }),
  getList: (params) => withMock(() => api.get('/agents/list', { params }), () => ({ data: [mockData.MOCK_AGENT] })),
  approve: (id, isApproved) => api.put(`/agents/${id}/approve`, { isApproved }),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  getTransactions: (id) => withMock(() => api.get(`/agents/${id}/transactions`), () => mockData.MOCK_AGENT_DATA.transactions),
  getLeaderboard: () => api.get('/agents/leaderboard'),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => withMock(() => api.get('/admin/dashboard'), () => mockData.MOCK_ADMIN_DATA),
  getStats: () => withMock(() => api.get('/admin/stats'), () => mockData.MOCK_ADMIN_DATA.stats),
  getUsers: (params) => withMock(() => api.get('/admin/users', { params }), () => ({ data: [mockData.MOCK_USER, mockData.MOCK_AGENT] })),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getTransactions: (params) => withMock(() => api.get('/admin/transactions', { params }), () => ({ data: mockData.MOCK_AGENT_DATA.transactions })),
  getSettings: () => withMock(() => api.get('/admin/settings'), () => ({ data: { serviceFeeEnabled: true, serviceFee: 599 } })),
  updateSettings: (data) => api.put('/admin/settings', data),
  getVisaRules: () => api.get('/admin/visa-rules'),
  updateVisaRule: (id, data) => api.put(`/admin/visa-rules/${id}`, data),
  verifyVisaRule: (id) => api.patch(`/admin/visa-rules/${id}/verify`),
  unpublishVisaRule: (id) => api.patch(`/admin/visa-rules/${id}/unpublish`),
};

// ── Payments ──────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

// ── Document Vault ────────────────────────────────────────
export const docAPI = {
  getMine: () => api.get('/documents'),
  upload: (formData) => api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/documents/${id}`),
};

// ── PDF ───────────────────────────────────────────────────
export const pdfURL = (appId) => `${BASE}/pdf/invoice/${appId}`;

// Auth-protected downloads can't use a plain <a href> (no way to attach the
// JWT to a browser navigation) — fetch as a blob via axios instead, then
// hand the browser a local object URL to save.
async function downloadBlob(url, filename) {
  const res = await api.get(url, { responseType: 'blob', timeout: 30000 });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const downloadInvoice = (appId, applicationId) =>
  downloadBlob(`/pdf/invoice/${appId}`, `visayatri-${applicationId}.pdf`);

export const downloadApplicationPack = (appId, applicationId) =>
  downloadBlob(`/pdf/pack/${appId}`, `VY-${applicationId}-Documents.zip`);

export default api;
