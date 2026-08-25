const fs   = require('fs');
const router = require('express').Router();
const DocumentVaultItem = require('../models/DocumentVaultItem');
const { protect } = require('../middleware/auth');
const { handleVaultUpload } = require('../middleware/vaultUpload');

/* ── GET /api/documents ────────────────────────────────────
   List the logged-in user's vault documents. */
router.get('/', protect, async (req, res) => {
  try {
    const docs = await DocumentVaultItem.find({ owner: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: docs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── POST /api/documents ───────────────────────────────────
   Upload a document into the vault. */
router.post('/', protect, handleVaultUpload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file received.' });
    const { documentType, expiryDate } = req.body;
    if (!documentType) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'documentType is required.' });
    }

    const doc = await DocumentVaultItem.create({
      owner: req.user._id,
      documentType,
      originalName: req.file.originalname,
      storedName:   req.file.filename,
      path:         req.file.path,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      expiryDate:   expiryDate || undefined,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── DELETE /api/documents/:id ─────────────────────────────
   Remove a document from the vault (secure deletion, section 40). */
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await DocumentVaultItem.findOne({ _id: req.params.id, owner: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    fs.unlink(doc.path, () => {}); // best-effort — DB record removal is the source of truth
    await doc.deleteOne();

    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
