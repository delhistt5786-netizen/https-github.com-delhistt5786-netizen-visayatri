const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const path        = require('path');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
require('dotenv').config();

const app = express();

/* ── Security headers ─────────────────────────────────────────
   crossOriginResourcePolicy must allow cross-origin — the frontend
   (visayatri.com) loads uploaded images/PDFs from this API's own
   origin (onrender.com), which is a different origin from Helmet's
   default same-origin policy. contentSecurityPolicy is for HTML pages;
   this is a JSON+file API, so it's disabled rather than fighting a
   default that doesn't apply here. */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/* ── Rate limiting ─────────────────────────────────────────────
   General API traffic gets a generous cap; auth endpoints (login,
   register, password reset) get a much tighter one since those are
   the ones brute-force/credential-stuffing attacks actually target. */
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
}));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
}));

/* ── CORS ──────────────────────────────────────────────────── */
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim());
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
}

app.use(cors({
  origin: (origin, cb) => {
    // Exact match only — startsWith() would let "https://visayatri.com.evil.com"
    // pass for an allowed origin of "https://visayatri.com".
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

/* ── Raw body for Razorpay webhook (must be before json parser) ── */
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));

/* ── Body parsers ─────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── Static uploads ───────────────────────────────────────── */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Routes ───────────────────────────────────────────────── */
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/countries',    require('./routes/countries'));
app.use('/api/visas',        require('./routes/visas'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/agents',       require('./routes/agents'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/pdf',          require('./routes/pdf'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/visa-rules',   require('./routes/visaRules'));
app.use('/api/documents',    require('./routes/documents'));

/* ── Health ───────────────────────────────────────────────── */
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', brand: 'Visayatri', version: '3.0.0', ts: new Date().toISOString() })
);

/* ── 404 ──────────────────────────────────────────────────── */
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
);

/* ── Global error handler ─────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.message?.startsWith('CORS')) return res.status(403).json({ success: false, message: err.message });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

/* ── DB + Start ───────────────────────────────────────────── */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Visayatri API v3 running → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB error:', err.message); process.exit(1); });
