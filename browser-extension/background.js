/**
 * Background service worker — handles login/token storage and proxies API
 * calls to the Visayatri backend. Content scripts never call the API
 * directly; they message this worker, which is the one place the API base
 * URL and auth token are known.
 */
const API_BASE = 'https://https-github-com-delhistt5786-netizen.onrender.com/api';

async function getToken() {
  const { visayatriToken } = await chrome.storage.local.get('visayatriToken');
  return visayatriToken || null;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'LOGIN') {
        const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(msg.payload) });
        if (data.token) await chrome.storage.local.set({ visayatriToken: data.token, visayatriUser: data.user });
        sendResponse({ ok: true, user: data.user });
        return;
      }
      if (msg.type === 'LOGOUT') {
        await chrome.storage.local.remove(['visayatriToken', 'visayatriUser']);
        sendResponse({ ok: true });
        return;
      }
      if (msg.type === 'GET_SESSION') {
        const { visayatriToken, visayatriUser } = await chrome.storage.local.get(['visayatriToken', 'visayatriUser']);
        sendResponse({ ok: true, loggedIn: !!visayatriToken, user: visayatriUser || null });
        return;
      }
      if (msg.type === 'SEARCH_APPLICATIONS') {
        // Admins can list every application (GET /applications); agents can
        // only list their own (GET /applications/my) — same role split the
        // main dashboard uses, so an agent's extension session can't
        // enumerate other agents' or customers' applications.
        const { visayatriUser } = await chrome.storage.local.get('visayatriUser');
        const path = visayatriUser?.role === 'admin' ? '/applications?limit=50' : '/applications/my?limit=50';
        const data = await apiFetch(path);
        const q = (msg.query || '').toLowerCase();
        const apps = (data.data || []).filter(a =>
          !q || a.applicationId?.toLowerCase().includes(q) || a.applicantName?.toLowerCase().includes(q));
        sendResponse({ ok: true, apps });
        return;
      }
      if (msg.type === 'GET_APPLICATION') {
        const data = await apiFetch(`/applications/${msg.id}`);
        sendResponse({ ok: true, app: data.data });
        return;
      }
      if (msg.type === 'LOG_EVENT') {
        // Section 41 wants an audit trail of extension actions (portal
        // opened, fields filled, stop-condition hit, etc.). No backend
        // audit-log endpoint exists yet — logging to the console for now
        // so nothing is silently dropped; wire this to a real
        // POST /api/admin/audit-log once that endpoint is built.
        console.info('[Visayatri Assistant audit]', msg.payload);
        sendResponse({ ok: true });
        return;
      }
      sendResponse({ ok: false, error: 'Unknown message type' });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
  })();
  return true; // keep the message channel open for the async response
});
