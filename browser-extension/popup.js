const root = document.getElementById('app-root');

function send(type, payload) {
  return new Promise(resolve => chrome.runtime.sendMessage({ type, payload }, resolve));
}

async function renderLogin(error) {
  root.innerHTML = `
    <p class="muted">Log in with your Visayatri admin/agent account to search applications.</p>
    <input id="email" type="email" placeholder="Email">
    <input id="password" type="password" placeholder="Password">
    <button id="login-btn">Log In</button>
    ${error ? `<p class="error">${error}</p>` : ''}
  `;
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const res = await send('LOGIN', { email, password });
    if (res.ok) renderSearch(res.user);
    else renderLogin(res.error || 'Login failed');
  });
}

async function renderSearch(user) {
  root.innerHTML = `
    <div class="user-row">
      <span class="muted">${user.name} (${user.role})</span>
      <span class="logout-link" id="logout-link">Log out</span>
    </div>
    <input id="search" type="text" placeholder="Search Application ID or name...">
    <div id="results"></div>
  `;
  document.getElementById('logout-link').addEventListener('click', async () => {
    await send('LOGOUT');
    renderLogin();
  });

  const searchInput = document.getElementById('search');
  const resultsEl = document.getElementById('results');

  const doSearch = async () => {
    const res = await send('SEARCH_APPLICATIONS', { query: searchInput.value });
    if (!res.ok) { resultsEl.innerHTML = `<p class="error">${res.error}</p>`; return; }
    if (!res.apps.length) { resultsEl.innerHTML = `<p class="muted">No matching applications.</p>`; return; }
    resultsEl.innerHTML = res.apps.slice(0, 15).map(a => `
      <div class="app-item" data-id="${a._id}">
        <strong>${a.applicationId}</strong><br>
        <span class="muted">${a.applicantName} — ${a.visaId?.country || ''}</span>
      </div>
    `).join('');
    resultsEl.querySelectorAll('.app-item').forEach(el => {
      el.addEventListener('click', () => selectApplication(el.dataset.id));
    });
  };

  searchInput.addEventListener('input', doSearch);
  doSearch();
}

async function selectApplication(id) {
  const res = await send('GET_APPLICATION', { id });
  if (!res.ok) { alert(res.error); return; }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'SET_ACTIVE_APPLICATION', app: res.app }, () => {
    // If the content script isn't running here, chrome.runtime.lastError
    // is set — this just means the current tab isn't a configured portal.
    void chrome.runtime.lastError;
    root.innerHTML = `<p class="muted">Application <strong>${res.app.applicationId}</strong> selected. Switch to a configured official portal tab to see the assist panel.</p>`;
  });
}

(async function init() {
  const session = await send('GET_SESSION');
  if (session.ok && session.loggedIn) renderSearch(session.user);
  else renderLogin();
})();
