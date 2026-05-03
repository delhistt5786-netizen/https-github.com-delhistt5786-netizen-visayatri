# 🌍 Visayatri — Production Visa Services Platform

**Fast & Trusted Visa Services**

| | |
|---|---|
| 📞 WhatsApp | +91 9717743876 |
| 📧 Email | visa.stt5786@gmail.com |
| 🏗️ Stack | Next.js 14 + Node.js + MongoDB |

---

## 🚀 Local Setup (5 Minutes)

### Step 1 — Backend

```bash
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI and Razorpay keys (see below)

# Seed database (creates all 39 visas + demo accounts)
npm run seed

# Start server
npm run dev
# ✅ API running at http://localhost:5000
```

### Step 2 — Frontend

```bash
cd frontend
npm install

# Setup environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL is already set to http://localhost:5000/api

# Start app
npm run dev
# ✅ App running at http://localhost:3000
```

### Step 3 — Test

| Role | Email | Password |
|---|---|---|
| Admin | admin@visayatri.com | Admin@123 |
| Agent | agent@visayatri.com | Agent@123 |
| User | user@visayatri.com | User@123 |

---

## 🌐 Deploy to Production

### Database → MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Create free M0 cluster (choose Mumbai/Singapore region)
3. Database Access → Add user → username + password
4. Network Access → Add IP → `0.0.0.0/0` (allow all)
5. Connect → Drivers → copy connection string
6. Replace `<username>` and `<password>` in the string
7. Set as `MONGODB_URI` in backend `.env`

### Backend → Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: Singapore
5. **Environment Variables** (add all from `.env.example`):
   - `MONGODB_URI` = your Atlas URI
   - `JWT_SECRET` = run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` 
   - `RAZORPAY_KEY_ID` = from Razorpay dashboard
   - `RAZORPAY_KEY_SECRET` = from Razorpay dashboard
   - `FRONTEND_URL` = https://your-app.vercel.app
   - `NODE_ENV` = production
6. Deploy → copy the URL (e.g. `https://visayatri-api.onrender.com`)
7. **Run seed:** Open Render Shell → `npm run seed`

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. **Settings:**
   - Framework: Next.js
   - Root Directory: `frontend`
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://visayatri-api.onrender.com/api`
   - `NEXT_PUBLIC_WHATSAPP` = `919717743876`
   - `NEXT_PUBLIC_RAZORPAY_KEY` = your Razorpay key ID
5. Deploy → your app is live!

### Custom Domain

In Vercel → Settings → Domains → add your domain

```
DNS Records to add at your domain registrar:
A     @    76.76.19.19
CNAME www  cname.vercel-dns.com
```

---

## 💳 Razorpay Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Settings → API Keys → Generate Test Key
3. Copy `Key ID` → set as `RAZORPAY_KEY_ID` (backend) and `NEXT_PUBLIC_RAZORPAY_KEY` (frontend)
4. Copy `Key Secret` → set as `RAZORPAY_KEY_SECRET` (backend only, never frontend)

**Test Cards:**
```
Card:  4111 1111 1111 1111
CVV:   any 3 digits
Expiry: any future date
UPI:   success@razorpay
```

**Webhook (optional but recommended):**
- Razorpay Dashboard → Settings → Webhooks → Add URL:
  `https://your-api.onrender.com/api/payments/webhook`
- Select event: `payment.captured`
- Copy Webhook Secret → set as `RAZORPAY_WEBHOOK_SECRET`

---

## 📁 Project Structure

```
visayatri/
├── backend/
│   ├── middleware/
│   │   ├── auth.js         # JWT protect + role guard
│   │   └── upload.js       # Multer file upload
│   ├── models/
│   │   ├── User.js         # User + Agent (wallet, commission)
│   │   ├── Visa.js         # Triple-tier pricing
│   │   ├── Application.js  # Full lifecycle
│   │   ├── Transaction.js  # Wallet ledger
│   │   └── Payment.js      # Razorpay records
│   ├── routes/
│   │   ├── auth.js         # Login, register, profile
│   │   ├── visas.js        # CRUD + role-aware pricing
│   │   ├── applications.js # Apply, upload, status
│   │   ├── agents.js       # Wallet, commission, approval
│   │   ├── admin.js        # Dashboard, users, stats
│   │   ├── payments.js     # Razorpay order + verify + webhook
│   │   └── pdf.js          # Invoice generation
│   ├── utils/
│   │   ├── wallet.js       # Credit/debit with ledger
│   │   ├── whatsapp.js     # WA deep-link messages
│   │   └── seed.js         # 39 visas + demo users
│   └── server.js
│
└── frontend/
    ├── app/
    │   ├── page.js                    # Homepage
    │   ├── visa/page.js               # Visa listing
    │   ├── visa/[slug]/page.js        # Visa detail + apply
    │   ├── apply/page.js              # Razorpay checkout
    │   ├── auth/login/page.js
    │   ├── auth/register/page.js
    │   ├── dashboard/user/page.js     # User dashboard
    │   ├── dashboard/agent/page.js    # Agent portal + wallet
    │   └── dashboard/admin/page.js    # Admin CRM
    ├── components/
    │   ├── layout/  Navbar, Footer
    │   ├── ui/      Loading, Modal, ErrorBanner, EmptyState, StatusBadge, WhatsAppButton
    │   └── visa/    VisaCard
    └── lib/
        ├── api.js        # All API calls (axios)
        ├── auth.js       # Token helpers
        └── whatsapp.js   # WA deep-links
```

---

## 🔑 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | - | Register user or agent |
| POST | /api/auth/login | - | Login, returns JWT |
| GET  | /api/auth/me | JWT | Current user info |
| GET  | /api/visas | Optional | All visas (role-filtered prices) |
| GET  | /api/visas/:slug | Optional | Visa details |
| POST | /api/visas | Admin | Create visa |
| PUT  | /api/visas/:id | Admin | Update visa |
| POST | /api/applications | JWT | Submit application |
| GET  | /api/applications/my | JWT | My applications |
| POST | /api/applications/:id/documents | JWT | Upload docs |
| PUT  | /api/applications/:id/status | Admin/Agent | Update status |
| PUT  | /api/applications/:id | Admin | Edit application |
| GET  | /api/agents/dashboard | Agent | Agent stats + wallet |
| GET  | /api/agents/wallet | Agent | Wallet + transactions |
| POST | /api/agents/wallet/credit | Admin | Credit agent wallet |
| GET  | /api/agents/list | Admin | All agents |
| PUT  | /api/agents/:id/approve | Admin | Approve/suspend agent |
| PUT  | /api/agents/:id | Admin | Edit agent (commission etc.) |
| GET  | /api/admin/dashboard | Admin | Full CRM dashboard |
| GET  | /api/admin/users | Admin | All users |
| POST | /api/payments/create-order | JWT | Razorpay order |
| POST | /api/payments/verify | JWT | Verify payment |
| POST | /api/payments/webhook | - | Razorpay webhook |
| GET  | /api/pdf/invoice/:appId | JWT | Download PDF invoice |
| GET  | /api/health | - | API health check |

---

## 💡 Business Logic

### Triple-Tier Visa Pricing
```
Base Price  = Internal cost (admin only)
Agent Price = Base × 1.08  → agents pay from wallet
Public Price = Base × 1.20  → B2C customers pay this

Example — Oman 30 Days:
  Base:   ₹5,400
  Agent:  ₹5,832   (agent pays)
  Public: ₹6,480   (customer pays)
  Agent profit per client: ₹648
```

### Wallet Flow
```
Admin credits agent wallet → Transaction logged (credit)
Agent applies for client  → Wallet debited instantly → Transaction logged (debit)
Application approved      → Commission credited to agent wallet → Transaction logged (credit)
```

### WhatsApp Messages
Every application generates a pre-filled WhatsApp message with:
visa name, plan, price, applicant name, passport, nationality, travel date, return date

---

## 🔐 Security
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Role-based middleware on every protected route
- File uploads restricted to JPEG/PNG/PDF, max 5MB
- Razorpay payments verified with HMAC-SHA256 signature
- CORS restricted to configured frontend URL

