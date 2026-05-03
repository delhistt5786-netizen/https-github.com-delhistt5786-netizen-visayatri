# 🔗 Phase 2 — Backend Integration Guide

## What Was Built / Upgraded

### Backend Changes
| File | What Changed |
|---|---|
| `models/Visa.js` | Triple-tier pricing (basePrice / agentPrice / publicPrice) + `forRole()` method |
| `models/User.js` | Added totalTopUp, totalSpent, commissionRate, totalCommission, companyName |
| `models/Transaction.js` | **NEW** — full wallet ledger with balanceBefore/After |
| `models/Application.js` | Added planLabel, pricePaid, agentCost, publicPrice, agentProfit, full status history |
| `middleware/auth.js` | Added `optionalAuth` for public+auth dual routes |
| `middleware/upload.js` | Added `handleUpload` wrapper with proper multer error messages |
| `utils/wallet.js` | **NEW** — `creditWallet` / `debitWallet` always write to Transaction ledger |
| `utils/whatsapp.js` | **NEW** — all WA deep-links built here (apply, agent apply, track, top-up) |
| `routes/visas.js` | `GET /visas` and `GET /visas/:slug` now strip prices by role |
| `routes/applications.js` | Full debit-wallet-on-apply, commission credit on approval, WA link in response |
| `routes/agents.js` | Wallet tab: balance, transactions, top-up request, admin credit |
| `routes/admin.js` | Dashboard + stats + monthly trend + transaction ledger view |
| `routes/payments.js` | Razorpay lazy-init so server doesn't crash without keys |
| `routes/pdf.js` | Full A4 branded invoice with all fields |
| `utils/seed.js` | All 39 countries with real triple-tier prices + demo accounts |

### Frontend Changes
| File | What Changed |
|---|---|
| `lib/api.js` | Complete rewrite — all endpoints, interceptors, token expiry redirect |
| `lib/whatsapp.js` | Dynamic WA messages with full context |
| `lib/auth.js` | Added `dashboardPath()` helper |
| `components/visa/VisaCard.js` | Shows agent price + profit margin for agents |
| `app/visa/[slug]/page.js` | Plan selector with agent/user price, wallet payment option, WA link |
| `app/dashboard/agent/page.js` | 3 tabs: Overview / Applications / Wallet with transaction history |
| `app/dashboard/admin/page.js` | 6 tabs + wallet credit form + transaction ledger |

---

## 🚀 Quick Start

```bash
# 1. Clone / unzip the project

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edit .env — add MONGODB_URI + Razorpay keys
npm run seed          # Seeds 39 visas + 3 demo accounts
npm run dev           # Runs on http://localhost:5000

# 3. Frontend
cd frontend
npm install
cp .env.local.example .env.local
# .env.local already points to localhost:5000 by default
npm run dev           # Runs on http://localhost:3000
```

---

## 🔑 Demo Accounts (after seed)

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@visayatri.com | Admin@123 | Full access |
| Agent | agent@visayatri.com | Agent@123 | Approved + ₹10,000 wallet |
| User  | user@visayatri.com  | User@123  | Standard B2C |

---

## 💡 Business Logic Summary

### Triple-Tier Pricing
```
basePrice   = internal cost (admin sees only)
agentPrice  = basePrice × 1.08  → agent pays this from wallet
publicPrice = basePrice × 1.20  → B2C customer pays this
```

**Example — Oman 30 Days:**
- basePrice:   ₹5,400
- agentPrice:  ₹5,832   (agent pays from wallet)
- publicPrice: ₹6,480   (public customer pays)
- Agent profit: ₹648 per client (if they charge public price)

### Wallet Flow
1. Admin credits agent wallet via `POST /api/agents/wallet/credit`
2. Every debit/credit writes to `Transaction` collection with before/after balance
3. Agent applies visa → `debitWallet()` called → balance decremented instantly
4. Application approved → `creditWallet()` called → commission credited

### WhatsApp Integration
- Every `POST /api/applications` returns a `whatsappLink` in the response
- Frontend opens this link in a new tab after form submission
- Pre-filled message includes: visa name, plan, applicant name, travel date
- Agent messages include agent code for tracking

---

## 🌐 API Reference

### Visa Endpoints (Public — price filtered by role)
```
GET  /api/visas?region=middle-east&search=oman
GET  /api/visas/:slug
POST /api/visas            (admin only)
PUT  /api/visas/:id        (admin only)
DELETE /api/visas/:id      (admin only)
```

### Application Endpoints
```
POST /api/applications                        (any auth user)
GET  /api/applications/my                     (user/agent — own apps)
GET  /api/applications/:id                    (owner/agent/admin)
POST /api/applications/:id/documents          (upload files — owner/agent)
PUT  /api/applications/:id/status             (admin/agent)
GET  /api/applications?status=pending&page=1  (admin — all)
```

### Agent Endpoints
```
GET  /api/agents/dashboard                    (agent — own)
GET  /api/agents/wallet                       (agent — own wallet + txns)
POST /api/agents/wallet/topup-request         (agent — WA link)
POST /api/agents/wallet/credit                (admin — credit agent)
GET  /api/agents/list                         (admin)
PUT  /api/agents/:id/approve                  (admin)
PUT  /api/agents/:id/commission               (admin)
GET  /api/agents/:id/transactions             (admin)
```

### Admin Endpoints
```
GET  /api/admin/dashboard      (full dashboard data)
GET  /api/admin/stats          (stats + monthly trend)
GET  /api/admin/users          (paginated user list)
PUT  /api/admin/users/:id/toggle
GET  /api/admin/transactions   (all wallet transactions)
```

### Payment Endpoints
```
POST /api/payments/create-order   (creates Razorpay order)
POST /api/payments/verify         (verifies signature, marks paid)
```

### PDF / Invoice
```
GET  /api/pdf/invoice/:appId   (downloads branded PDF)
```

---

## 🔐 Security Notes
- JWT expires in 7 days; frontend auto-redirects to login on 401
- Passwords hashed with bcrypt (12 rounds)
- File uploads validated: JPEG / PNG / PDF only, max 5MB, max 10 files
- Admin-only routes protected by `authorize('admin')` middleware
- Agent routes check `isApproved` flag
- Wallet mutations all go through `utils/wallet.js` — never direct DB update

---

## 🌐 Deployment

### Backend → Render
- Build: `npm install`
- Start: `npm start`
- Add all env vars in Render dashboard

### Frontend → Vercel
- `npx vercel --prod` from `/frontend`
- Set `NEXT_PUBLIC_API_URL` = your Render backend URL
- Set `NEXT_PUBLIC_RAZORPAY_KEY`

### Database → MongoDB Atlas
- Create free M0 cluster
- Network Access → Add IP: `0.0.0.0/0`
- Database Access → Create user
- Copy connection string → set as `MONGODB_URI`
- Run seed: `npm run seed`
