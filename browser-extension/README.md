# Visayatri Assistant (Browser Extension)

Chrome extension (Manifest V3) that assists admins/agents filling out
official government visa portals with data already captured in a
Visayatri application — **maximum safe automation only**. It never
completes a CAPTCHA, OTP, payment, or biometric step, and it never
clicks a final submit button on your behalf.

## Status: Architecture complete for 33 of 36 countries — ZERO verified

`portal-mappings.js` now has an entry for every researched country
that has a genuine online self-serve form (33 of 36 — see "Not
included" below for the other 3 and why). Adding a country beyond
that means adding one entry — no other code changes needed.

## ⚠️ Before you rely on this for real applications — READ THIS

**None of the 33 entries have been verified against a live portal.**
Every `selector` in `portal-mappings.js` is a guess at common
government-form field-naming conventions (`name="firstName"`,
`#passportNumber`, etc.), written without ever opening any of these
33 sites in a browser. Treat every entry as a TODO, not a finished
integration — Vietnam included, despite being the original "worked
example" pilot; it was never actually checked against the live DOM
either.

Expect the "Assist Application" button to report most fields as "not
found" the first time you try it on any real site — that's the
extension's portal-change-detection working correctly (it refuses to
guess), not a bug. Work through them one country at a time, starting
with whichever you process the most applications for.

**To make a country's mapping actually work on its real form:**

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

## Not included (3 countries)

- **Japan** — visa is submitted via VFS Japan in person/by courier,
  not a self-serve web form; nothing for a form-fill extension to do.
- **Singapore** — submitted through an authorized visa agent network
  (VFS Global / IVS Global), not a direct government form.
- **Cuba** — no official government portal could be confidently
  identified during research; add an entry once one is found.

## What's NOT built yet

- **All 33 mapped portals need a real inspect-and-map pass** — see
  the warning above. This is the actual bulk of remaining work.
- No real audit-log backend endpoint yet — `LOG_EVENT` messages
  currently just `console.info` rather than persisting anywhere (see
  the comment in `background.js`).
- No Firefox build (Manifest V3 support differs); Chrome/Edge only
  for now.
- Icons are placeholder solid-color squares, not real branded icons.
