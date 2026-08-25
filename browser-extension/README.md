# Visayatri Assistant (Browser Extension)

Chrome extension (Manifest V3) that assists admins/agents filling out
official government visa portals with data already captured in a
Visayatri application — **maximum safe automation only**. It never
completes a CAPTCHA, OTP, payment, or biometric step, and it never
clicks a final submit button on your behalf.

## Status: Pilot — Vietnam eVisa only

This is a first pilot covering one portal
(`evisa.xuatnhapcanh.gov.vn`) to prove out the architecture. Adding
another country means adding one entry to `portal-mappings.js` — no
other code changes needed.

## ⚠️ Before you rely on this for real applications

The Vietnam field selectors in `portal-mappings.js` are **best-guess
placeholders**, written without being able to open the real portal in
a browser. They were not verified against the live DOM. Expect the
"Assist Application" button to report most fields as "not found" the
first time you try it on the real site — that's the extension's
portal-change-detection working correctly (it refuses to guess), not
a bug.

**To make it actually work on Vietnam's real form:**

1. Load the extension (steps below) and open
   `https://evisa.xuatnhapcanh.gov.vn` and get to the actual
   application form.
2. Right-click each field (First Name, Passport Number, Date of
   Birth, etc.) → **Inspect**.
3. Note its `name` or `id` attribute (prefer these over CSS classes,
   which change whenever the portal's frontend framework rebuilds).
4. Open `portal-mappings.js`, find the matching `visayatriField`
   entry, and replace `selector` with what you found.
5. Once every field on the real form is mapped and tested, flip
   `verified: false` to `verified: true` for that portal entry.

## Loading the extension in Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `browser-extension/` folder
5. Pin the "Visayatri Assistant" icon to your toolbar

## Using it

1. Click the extension icon → log in with your Visayatri admin/agent
   account (this uses the same backend as the main dashboard —
   `POST /api/auth/login`).
2. Search for the application by ID or applicant name, click it.
3. Switch to the configured portal tab (Vietnam eVisa) — a floating
   "Visayatri Assistant" panel appears top-right.
4. Click **Assist Application** to fill in the fields it recognises.
5. Fields it couldn't find are listed as a warning — fill those in
   yourself, and consider updating the mapping (see above).
6. If a CAPTCHA, OTP, payment, or biometric step appears, the panel
   stops and tells you to complete it yourself on the official site.
7. **You** review everything and click the official portal's own
   submit button — the extension never does this for you.

## Architecture

- `manifest.json` — Manifest V3, `host_permissions` and
  `content_scripts.matches` restrict injection to configured domains
  only (defense in depth: `content.js` re-checks this itself too).
- `portal-mappings.js` — the **only** place field selectors and
  per-portal stop-condition overrides live. Never hard-code a
  selector anywhere else.
- `background.js` — service worker; owns the auth token
  (`chrome.storage.local`) and proxies all Visayatri API calls. Content
  scripts never call the API directly.
- `content.js` — injected on matched domains. Detects stop-conditions,
  fills fields, renders the floating panel, reports what it did.
- `popup.js` / `popup.html` — toolbar popup: login, search
  applications, select one to hand off to the active tab's content
  script.

## What's NOT built yet

- Only one portal is mapped (Vietnam). The other 35 researched
  countries need the same inspect-and-map treatment.
- No real audit-log backend endpoint yet — `LOG_EVENT` messages
  currently just `console.info` rather than persisting anywhere (see
  the comment in `background.js`).
- No Firefox build (Manifest V3 support differs); Chrome/Edge only
  for now.
- Icons are placeholder solid-color squares, not real branded icons.
