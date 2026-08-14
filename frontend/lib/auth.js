'use client';

// Fired whenever auth state changes (login/logout/profile update) so
// components mounted outside the page that triggered the change — like the
// persistent Navbar — can re-sync instead of showing stale Login/Logout state.
const AUTH_EVENT = 'visayatri:auth-change';

export const setAuth = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('visayatri_token', token);
  localStorage.setItem('visayatri_user', JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const onAuthChange = (callback) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
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
  window.dispatchEvent(new Event(AUTH_EVENT));
  window.location.href = '/auth/login';
};

export const dashboardPath = (role) =>
  ({ admin: '/dashboard/admin', agent: '/dashboard/agent', user: '/dashboard/user' }[role] || '/');
