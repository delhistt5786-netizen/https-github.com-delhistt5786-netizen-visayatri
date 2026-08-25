/**
 * Content script — injected only on domains listed in manifest.json's
 * host_permissions/content_scripts.matches AND present in
 * PORTAL_MAPPINGS (portal-mappings.js, loaded before this file).
 *
 * Responsibilities (and hard limits) per the master spec:
 *   ✓ Detect the configured portal, show a floating "Visayatri" panel
 *   ✓ Populate text/date/dropdown fields from the selected application
 *   ✓ Detect CAPTCHA / OTP / payment / biometric UI and STOP, never fill
 *     through them or attempt to bypass them
 *   ✓ Detect a missing/changed field (section 37) and warn instead of
 *     guessing where to put data
 *   ✗ NEVER auto-click any submit/continue/pay button
 *   ✗ NEVER solve or dismiss a CAPTCHA
 *   ✗ NEVER intercept or read an OTP
 */

(function () {
  const host = window.location.hostname;
  const mapping = PORTAL_MAPPINGS[host];

  // Defence in depth (section 29) — even though manifest.json's
  // content_scripts.matches already restricts injection to configured
  // domains, re-check here so this file is safe to reason about on its own.
  if (!mapping) {
    console.warn('[Visayatri Assistant] This domain is not a configured official portal — assistance disabled.');
    return;
  }

  let currentApp = null;
  let panelEl = null;

  function log(payload) {
    chrome.runtime.sendMessage({ type: 'LOG_EVENT', payload: { host, ...payload, at: new Date().toISOString() } });
  }

  /* ── Stop-condition detection ────────────────────────────── */
  const GENERIC_STOP_SELECTORS = {
    captcha: 'iframe[src*="captcha" i], iframe[src*="recaptcha" i], .g-recaptcha, [class*="captcha" i], [id*="captcha" i]',
    otp: 'input[name*="otp" i], input[id*="otp" i], input[placeholder*="otp" i], input[autocomplete="one-time-code"]',
    payment: 'iframe[src*="payment" i], iframe[src*="checkout" i], [class*="payment-form" i]',
    biometric: '[class*="biometric" i], [id*="fingerprint" i], [class*="facial" i]',
  };

  function detectStopCondition() {
    const portalOverrides = mapping.stopConditionSelectors || {};
    for (const kind of ['captcha', 'otp', 'payment', 'biometric']) {
      const selector = [GENERIC_STOP_SELECTORS[kind], portalOverrides[kind]].filter(Boolean).join(', ');
      if (selector && document.querySelector(selector)) return kind;
    }
    return null;
  }

  const STOP_MESSAGES = {
    captcha: '🔒 CAPTCHA detected. Please complete it yourself on the official website — Visayatri never solves or bypasses CAPTCHAs.',
    otp: '🔒 OTP step detected. Please enter the code sent to you — Visayatri never intercepts OTPs.',
    payment: '🔒 Payment step detected. Please complete payment directly on the official government site.',
    biometric: '🔒 Biometric step detected. Please follow the official portal\'s instructions — this cannot be automated.',
  };

  /* ── Field filling ────────────────────────────────────────── */
  function splitName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || parts[0] || '' };
  }

  function resolveValue(field, app) {
    const { firstName, lastName } = splitName(app.applicantName);
    const source = {
      firstName, lastName,
      passportNumber: app.passportNumber,
      dateOfBirth: app.dateOfBirth ? app.dateOfBirth.slice(0, 10) : '',
      passportExpiry: app.passportExpiry ? app.passportExpiry.slice(0, 10) : '',
      nationality: app.nationality,
      applicantEmail: app.applicantEmail,
      applicantPhone: app.applicantPhone,
      travelDate: app.travelDate ? app.travelDate.slice(0, 10) : '',
      purposeOfVisit: app.purposeOfVisit,
    };
    return source[field.visayatriField] ?? source[field.appField] ?? '';
  }

  function findField(field) {
    try { return document.querySelector(field.selector); }
    catch { return null; }
  }

  function fillField(el, field, value) {
    if (!value) return false;
    if (field.type === 'select') {
      const opt = Array.from(el.options || []).find(o =>
        o.textContent.trim().toLowerCase() === String(value).toLowerCase() ||
        o.value.toLowerCase() === String(value).toLowerCase());
      if (!opt) return false;
      el.value = opt.value;
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.style.outline = '2px solid #10b981';
    el.style.outlineOffset = '2px';
    return true;
  }

  function assistFill(app) {
    const stop = detectStopCondition();
    if (stop) {
      log({ event: 'stop_condition', kind: stop, applicationId: app.applicationId });
      updatePanel({ status: 'stopped', stopKind: stop });
      return;
    }

    const results = { filled: [], notFound: [], skipped: [] };
    for (const field of mapping.fields) {
      const el = findField(field);
      if (!el) { results.notFound.push(field.visayatriField); continue; }
      const value = resolveValue(field, app);
      if (!value) { results.skipped.push(field.visayatriField); continue; }
      const ok = fillField(el, field, value);
      (ok ? results.filled : results.notFound).push(field.visayatriField);
    }

    log({ event: 'assist_fill', applicationId: app.applicationId, results });
    updatePanel({ status: 'filled', results });
  }

  /* ── Floating panel UI ───────────────────────────────────── */
  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.id = 'visayatri-assist-panel';
    document.body.appendChild(panelEl);
    return panelEl;
  }

  function updatePanel(state) {
    const el = ensurePanel();
    if (!currentApp) {
      el.innerHTML = `
        <div class="vy-header">🌍 Visayatri Assistant</div>
        <div class="vy-body">
          <p>Open the extension icon and select an application to begin.</p>
        </div>`;
      return;
    }

    let statusHtml = '';
    if (state?.status === 'stopped') {
      statusHtml = `<div class="vy-stop">${STOP_MESSAGES[state.stopKind]}</div>`;
    } else if (state?.status === 'filled') {
      const { filled, notFound, skipped } = state.results;
      statusHtml = `
        <div class="vy-result">
          <p>✅ Filled: ${filled.length ? filled.join(', ') : 'none'}</p>
          ${notFound.length ? `<p class="vy-warn">⚠️ Not found on this page (mapping may need updating): ${notFound.join(', ')}</p>` : ''}
          ${skipped.length ? `<p class="vy-muted">— No data for: ${skipped.join(', ')}</p>` : ''}
        </div>`;
    }

    el.innerHTML = `
      <div class="vy-header">🌍 Visayatri Assistant</div>
      <div class="vy-body">
        <p><strong>${currentApp.applicationId}</strong> — ${currentApp.applicantName}</p>
        <p class="vy-muted">${mapping.country} · ${mapping.verified ? 'Mapping verified ✓' : '⚠️ Mapping UNVERIFIED — field selectors are best-guess, may not match this page'}</p>
        <button id="vy-assist-btn" class="vy-btn">Assist Application</button>
        ${statusHtml}
        <p class="vy-footer">Visayatri never completes CAPTCHA, OTP, payment, or biometric steps for you. Final submission is always yours.</p>
      </div>`;

    document.getElementById('vy-assist-btn')?.addEventListener('click', () => assistFill(currentApp));
  }

  /* ── Wire up messages from the popup ────────────────────── */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SET_ACTIVE_APPLICATION') {
      currentApp = msg.app;
      log({ event: 'application_selected', applicationId: currentApp?.applicationId });
      updatePanel(null);
      sendResponse({ ok: true });
    }
  });

  updatePanel(null);
  log({ event: 'portal_detected' });
})();
