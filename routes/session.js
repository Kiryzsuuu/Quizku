const router = require('express').Router();
const Session = require('../models/Session');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

router.post('/', auth, async (req, res) => {
  try {
    const { quizId } = req.body;
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin ? { _id: quizId } : { _id: quizId, creator: req.user.id };
    const quiz = await Quiz.findOne(query);
    if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    if (!quiz.questions.length) return res.status(400).json({ message: 'Tambahkan pertanyaan terlebih dahulu' });

    let code, attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 20) return res.status(500).json({ message: 'Gagal membuat kode sesi' });
    } while (await Session.findOne({ code, status: { $ne: 'ended' } }));

    const session = await Session.create({ quiz: quizId, host: req.user.id, code });
    res.status(201).json({ session, code });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ host: req.user.id })
      .populate('quiz', 'title coverColor')
      .sort('-createdAt')
      .limit(20)
      .lean();
    res.json(sessions);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code.toUpperCase() })
      .populate('quiz', 'title questions coverColor')
      .populate('host', 'name avatar')
      .lean();
    if (!session) return res.status(404).json({ message: 'Sesi tidak ditemukan' });
    res.json(session);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
