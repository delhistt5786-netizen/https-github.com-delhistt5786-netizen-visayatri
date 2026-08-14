import axios from 'axios';
import * as mockData from './mockData';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
// Uploaded files (passport scans, photos) are served statically from the
// backend root, not under /api — strip the /api suffix to build their URLs.
export const uploadsOrigin = BASE.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: BASE, timeout: 5000 });

// ── Development mock mode ─────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || typeof window === 'undefined';

// ── Attach JWT from localStorage ─────────────────────────
api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('visayatri_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ── Global response handler with mock fallback ───────────
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
    // Let connection errors bubble up so individual API methods can handle with specific mock data
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

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: async (data) => {
    try {
      return await api.post('/auth/register', data);
    } catch {
      // Mock registration
      const newUser = { _id: 'mock_' + Date.now(), ...data, role: data.role || 'user' };
      if (typeof window !== 'undefined') {
        localStorage.setItem('visayatri_user', JSON.stringify(newUser));
        localStorage.setItem('visayatri_token', 'mock_token_' + Date.now());
      }
      return mockResponse({ user: newUser, token: 'mock_token' });
    }
  },
  login: async (data) => {
    try {
      return await api.post('/auth/login', data);
    } catch {
      // Mock login
      const mockUser = data.email.includes('admin') ? mockData.MOCK_ADMIN : 
                       data.email.includes('priya') ? mockData.MOCK_AGENT : 
                       mockData.MOCK_USER;
      if (typeof window !== 'undefined') {
        localStorage.setItem('visayatri_user', JSON.stringify(mockUser));
        localStorage.setItem('visayatri_token', 'mock_token_' + Date.now());
      }
      return mockResponse({ user: mockUser, token: 'mock_token' });
    }
  },
  me: async () => {
    try {
      return await api.get('/auth/me');
    } catch {
      const user = mockData.MOCK_USER;
      return mockResponse(user);
    }
  },
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Visas ─────────────────────────────────────────────────
export const visaAPI = {
  getAll: async (params) => {
    try {
      return await api.get('/visas', { params });
    } catch (err) {
      console.warn('⚠️  Visa API error, using mock data:', err.code || err.message);
      // Filter mock data by region if provided
      let filtered = mockData.MOCK_VISAS;
      if (params?.region) {
        filtered = filtered.filter(v => v.region === params.region);
      }
      return mockResponse(filtered);
    }
  },
  getBySlug: async (slug) => {
    try {
      return await api.get(`/visas/${slug}`);
    } catch (err) {
      console.warn('⚠️  Visa detail API error, using mock data:', err.code || err.message);
      const visa = mockData.MOCK_VISAS.find(v => v.slug === slug) || mockData.MOCK_VISAS[0];
      return mockResponse(visa);
    }
  },
  // Admin methods for visa management
  create: (data) => api.post('/admin/visas', data),
  update: (id, data) => api.put(`/admin/visas/${id}`, data),
  delete: (id) => api.delete(`/admin/visas/${id}`),
  toggleStatus: (id) => api.patch(`/admin/visas/${id}/toggle`),
};

// ── Countries ─────────────────────────────────────────────
export const countryAPI = {
  getAll: async () => {
    try {
      return await api.get('/countries');
    } catch (err) {
      console.warn('⚠️  Country API error, using mock data:', err.code || err.message);
      return mockResponse(mockData.MOCK_COUNTRIES || []);
    }
  },
  create: (data) => api.post('/countries', data),
  update: (id, data) => api.put(`/countries/${id}`, data),
  delete: (id) => api.delete(`/countries/${id}`),
};

// ── Applications ──────────────────────────────────────────
export const appAPI = {
  create: (data) => api.post('/applications', data),
  getMy: async (params) => {
    try {
      return await api.get('/applications/my', { params });
    } catch {
      return mockResponse(mockData.MOCK_APPLICATIONS);
    }
  },
  getMyAvatar: async () => {
    try {
      return await api.get('/applications/my/avatar');
    } catch {
      return mockResponse({ avatarUrl: null });
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/applications/${id}`);
    } catch {
      const app = mockData.MOCK_APPLICATIONS.find(a => a._id === id) || mockData.MOCK_APPLICATIONS[0];
      return mockResponse(app);
    }
  },
  uploadDocs: (id, formData) => api.post(`/applications/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  uploadVisaDocument: (id, formData) => api.post(`/applications/${id}/visa-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  requestDocuments: (id, data) => api.post(`/applications/${id}/request-documents`, data),
  getAll: async (params) => {
    try {
      return await api.get('/applications', { params });
    } catch {
      return mockResponse({ data: mockData.MOCK_APPLICATIONS });
    }
  },
  edit: (id, data) => api.put(`/applications/${id}`, data),
};

// ── Agents ────────────────────────────────────────────────
export const agentAPI = {
  getDashboard: async () => {
    try {
      return await api.get('/agents/dashboard');
    } catch {
      return mockResponse(mockData.MOCK_AGENT_DATA);
    }
  },
  getWallet: async (params) => {
    try {
      return await api.get('/agents/wallet', { params });
    } catch {
      return mockResponse(mockData.MOCK_AGENT_DATA.wallet);
    }
  },
  topUpRequest: (amount) => api.post('/agents/wallet/topup-request', { amount }),
  myTopUpRequests: async () => {
    try {
      return await api.get('/agents/wallet/requests');
    } catch {
      return mockResponse({ data: [] });
    }
  },
  creditWallet: (data) => api.post('/agents/wallet/credit', data),
  getTopUpRequests: async (params) => {
    try {
      return await api.get('/agents/wallet-requests', { params });
    } catch {
      return mockResponse({ data: [] });
    }
  },
  approveTopUpRequest: (id) => api.put(`/agents/wallet-requests/${id}/approve`),
  rejectTopUpRequest: (id, note) => api.put(`/agents/wallet-requests/${id}/reject`, { note }),
  getList: async (params) => {
    try {
      return await api.get('/agents/list', { params });
    } catch {
      return mockResponse({ data: [mockData.MOCK_AGENT] });
    }
  },
  approve: (id, isApproved) => api.put(`/agents/${id}/approve`, { isApproved }),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  getTransactions: async (id) => {
    try {
      return await api.get(`/agents/${id}/transactions`);
    } catch {
      return mockResponse(mockData.MOCK_AGENT_DATA.transactions);
    }
  },
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: async () => {
    try {
      return await api.get('/admin/dashboard');
    } catch {
      return mockResponse(mockData.MOCK_ADMIN_DATA);
    }
  },
  getStats: async () => {
    try {
      return await api.get('/admin/stats');
    } catch {
      return mockResponse(mockData.MOCK_ADMIN_DATA.stats);
    }
  },
  getUsers: async (params) => {
    try {
      return await api.get('/admin/users', { params });
    } catch {
      return mockResponse({ data: [mockData.MOCK_USER, mockData.MOCK_AGENT] });
    }
  },
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  getTransactions: async (params) => {
    try {
      return await api.get('/admin/transactions', { params });
    } catch {
      return mockResponse({ data: mockData.MOCK_AGENT_DATA.transactions });
    }
  },
  getSettings: async () => {
    try {
      return await api.get('/admin/settings');
    } catch {
      return mockResponse({ data: { serviceFeeEnabled: true, serviceFeePercent: 5 } });
    }
  },
  updateSettings: (data) => api.put('/admin/settings', data),
};

// ── Payments ──────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

// ── PDF ───────────────────────────────────────────────────
export const pdfURL = (appId) => `${BASE}/pdf/invoice/${appId}`;

export default api;
