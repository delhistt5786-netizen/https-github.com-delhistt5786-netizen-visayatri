const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file

// Registration happens before a user exists (no req.user yet), so files are
// keyed by a per-submission folder rather than a user id.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!req._kycFolder) req._kycFolder = 'reg-' + Date.now() + '-' + Math.round(Math.random() * 1e6);
    const folder = path.join(__dirname, '..', 'uploads', 'agent-kyc', req._kycFolder);
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) cb(null, true);
  else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Only JPEG, PNG and PDF files are allowed. Got: ${file.mimetype}`));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES, files: 4 } });

const KYC_FIELDS = [
  { name: 'panCard', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
];

// Only kicks in for multipart requests (agent registration with files) —
// a plain JSON registration (traveler role) passes straight through, since
// multer no-ops when the request isn't multipart/form-data.
const handleAgentKycUpload = (req, res, next) => {
  upload.fields(KYC_FIELDS)(req, res, err => {
    if (!err) return next();
    let message = 'File upload error.';
    if (err instanceof multer.MulterError) {
      message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Max 5 MB per document.' : err.message;
    }
    res.status(400).json({ success: false, message });
  });
};

module.exports = { handleAgentKycUpload };
