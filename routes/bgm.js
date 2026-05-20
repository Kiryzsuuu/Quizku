const router    = require('express').Router();
const BGMTrack  = require('../models/BGMTrack');
const auth      = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

// Public — any logged-in user can browse the bank
router.get('/', auth, async (req, res) => {
  try {
    const tracks = await BGMTrack.find().sort('-createdAt').lean();
    res.json(tracks);
  } catch {
    res.status(500).json({ message: 'Gagal memuat bank BGM' });
  }
});

// Admin only — add track
router.post('/', adminAuth, async (req, res) => {
  try {
    const { label, url } = req.body;
    if (!label || !url) return res.status(400).json({ message: 'Label dan URL wajib diisi' });
    const track = await BGMTrack.create({ label, url, addedBy: req.user.id });
    res.status(201).json(track);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Gagal menambahkan BGM' });
  }
});

// Admin only — delete track
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await BGMTrack.findByIdAndDelete(req.params.id);
    res.json({ message: 'BGM dihapus' });
  } catch {
    res.status(500).json({ message: 'Gagal menghapus BGM' });
  }
});

module.exports = router;
