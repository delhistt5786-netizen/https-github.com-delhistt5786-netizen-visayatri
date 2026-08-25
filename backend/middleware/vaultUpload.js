const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Vault files are keyed by user, not by application — req.user is set by
// `protect`, which always runs before this middleware in the route chain.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = path.join(__dirname, '..', 'uploads', 'vault', String(req.user._id));
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = 'doc-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) cb(null, true);
  else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Only JPEG, PNG and PDF files are allowed. Got: ${file.mimetype}`));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES, files: 1 } });

const handleVaultUpload = (req, res, next) => {
  upload.single('document')(req, res, err => {
    if (!err) return next();
    let message = 'File upload error.';
    if (err instanceof multer.MulterError) {
      message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 5 MB.' : err.message;
    }
    res.status(400).json({ success: false, message });
  });
};

module.exports = { handleVaultUpload };
