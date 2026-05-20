const router = require('express').Router();
const adminAuth  = require('../middleware/admin');
const User        = require('../models/User');
const Quiz        = require('../models/Quiz');
const Session     = require('../models/Session');
const Comment     = require('../models/Comment');
const SiteSettings = require('../models/SiteSettings');

// ── STATS ──────────────────────────────────────────────────────
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, quizzes, sessions, comments, teachers, students, publicQuizzes, activeSessions] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
      Session.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Quiz.countDocuments({ isPublic: true }),
      Session.countDocuments({ status: 'active' })
    ]);
    res.json({ users, quizzes, sessions, comments, teachers, students, publicQuizzes, activeSessions });
  } catch {
    res.status(500).json({ message: 'Gagal memuat statistik' });
  }
});

// ── USERS ──────────────────────────────────────────────────────
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt').limit(100).select('-password').lean();
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Gagal memuat pengguna' });
  }
});

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['teacher', 'student', 'admin'].includes(role))
      return res.status(400).json({ message: 'Role tidak valid' });
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ message: 'Role diperbarui' });
  } catch {
    res.status(500).json({ message: 'Gagal memperbarui role' });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pengguna dihapus' });
  } catch {
    res.status(500).json({ message: 'Gagal menghapus pengguna' });
  }
});

// ── QUIZZES ────────────────────────────────────────────────────
router.get('/quizzes', adminAuth, async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort('-createdAt').limit(100)
      .populate('creator', 'name email').lean();
    res.json(quizzes);
  } catch {
    res.status(500).json({ message: 'Gagal memuat kuis' });
  }
});

router.delete('/quizzes/:id', adminAuth, async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kuis dihapus' });
  } catch {
    res.status(500).json({ message: 'Gagal menghapus kuis' });
  }
});

// ── COMMENTS ──────────────────────────────────────────────────
router.get('/comments', adminAuth, async (req, res) => {
  try {
    const comments = await Comment.find().sort('-createdAt').limit(50)
      .populate('quiz', 'title').lean();
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Gagal memuat komentar' });
  }
});

router.delete('/comments/:id', adminAuth, async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Komentar dihapus' });
  } catch {
    res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
});

// ── SITE SETTINGS ─────────────────────────────────────────────
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const s = await SiteSettings.getSettings();
    res.json(s);
  } catch {
    res.status(500).json({ message: 'Gagal memuat pengaturan' });
  }
});

router.put('/settings', adminAuth, async (req, res) => {
  try {
    const allowed = [
      'siteName','tagline','siteIcon','chipText',
      'heroTitle','heroSubtitle','heroDescription','heroCTA1','heroCTA2',
      'primaryColor','secondaryColor','accentColor','bgColor',
      'heroBgColor','navbarBg','navbarAccentColor','ctaBgColor','footerBg','featuresBg',
      'announcementText','announcementActive','announcementColor',
      'enableComments','enableBGM','enableRegister','maintenanceMode','footerText'
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const s = await SiteSettings.findOneAndUpdate({ _key: 'global' }, update, { new: true, upsert: true });
    res.json(s);
  } catch {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan' });
  }
});

module.exports = router;
