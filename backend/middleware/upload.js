const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const ALLOWED_MIMETYPES = ['image/jpeg','image/jpg','image/png','application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Store in uploads/<applicationId>/
    const folder = path.join(__dirname, '..', 'uploads', req.params.id || 'misc');
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext  = path.extname(file.originalname).toLowerCase();
    const safe = file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random()*1e6) + ext;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Only JPEG, PNG and PDF files are allowed. Got: ${file.mimetype}`));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE_BYTES, files: 10 } });

// Error handler wrapper for multer
const handleUpload = (fieldName, maxCount = 10) => (req, res, next) => {
  const handler = upload.array(fieldName, maxCount);
  handler(req, res, err => {
    if (!err) return next();
    let message = 'File upload error.';
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')        message = 'File too large. Max 5 MB per file.';
      else if (err.code === 'LIMIT_FILE_COUNT')  message = 'Too many files. Max 10 per upload.';
      else                                        message = err.message;
    }
    res.status(400).json({ success: false, message });
  });
};

module.exports = { handleUpload, upload };
