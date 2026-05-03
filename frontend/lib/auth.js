'use client';

export const setAuth = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('visayatri_token', token);
  localStorage.setItem('visayatri_user', JSON.stringify(user));
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('visayatri_user') || 'null'); }
  catch { return null; }
};

export const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem('visayatri_token');

export const isAuthenticated = () => !!getToken();

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('visayatri_token');
  localStorage.removeItem('visayatri_user');
  window.location.href = '/auth/login';
};

export const dashboardPath = (role) =>
  ({ admin: '/dashboard/admin', agent: '/dashboard/agent', user: '/dashboard/user' }[role] || '/');
