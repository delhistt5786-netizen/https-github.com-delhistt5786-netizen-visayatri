const mongoose = require('mongoose');
const app      = require('./app');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Visayatri API v3 running → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ DB error:', err.message); process.exit(1); });
