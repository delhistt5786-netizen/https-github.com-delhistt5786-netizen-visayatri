const path   = require('path');
const router = require('express').Router();
const { verifyFileToken } = require('../utils/fileSignature');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

/* ── GET /api/files/serve/:token ───────────────────────────
   Streams a file identified by a short-lived signed token (see
   utils/fileSignature.js). No Authorization header needed — the token
   itself proves the caller was authorized when it was minted, and it
   expires in 10 minutes. Replaces the old public express.static('/uploads')
   mount, which had no access control at all beyond an unguessable filename. */
router.get('/serve/:token', (req, res) => {
  try {
    const absolutePath = verifyFileToken(req.params.token);

    // Defence in depth: even with a valid signature, refuse to serve
    // anything outside the uploads directory.
    const resolved = path.resolve(absolutePath);
    if (!resolved.startsWith(UPLOADS_ROOT)) {
      return res.status(403).json({ success: false, message: 'Invalid file path.' });
    }

    res.sendFile(resolved, err => {
      if (err && !res.headersSent) res.status(404).json({ success: false, message: 'File not found.' });
    });
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'This link has expired.' : 'Invalid or expired link.';
    res.status(401).json({ success: false, message: msg });
  }
});

module.exports = router;
