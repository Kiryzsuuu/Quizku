const router = require('express').Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.user.id }).sort('-createdAt').lean();
    res.json(quizzes);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, questions, isPublic, coverColor, bgmUrl, bgmLabel, streakBonus } = req.body;
    if (!title) return res.status(400).json({ message: 'Judul kuis wajib diisi' });
    const quiz = await Quiz.create({
      title, description, questions: questions || [],
      isPublic: !!isPublic, coverColor, bgmUrl, bgmLabel,
      streakBonus, creator: req.user.id
    });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Terjadi kesalahan server' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('creator', 'name').lean();
    if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    if (quiz.creator._id.toString() !== req.user.id && !quiz.isPublic)
      return res.status(403).json({ message: 'Akses ditolak' });
    res.json(quiz);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, creator: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    const { title, description, questions, isPublic, coverColor, bgmUrl, bgmLabel, streakBonus } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = questions;
    if (isPublic !== undefined) quiz.isPublic = isPublic;
    if (coverColor !== undefined) quiz.coverColor = coverColor;
    if (bgmUrl !== undefined) quiz.bgmUrl = bgmUrl;
    if (bgmLabel !== undefined) quiz.bgmLabel = bgmLabel;
    if (streakBonus !== undefined) quiz.streakBonus = streakBonus;
    await quiz.save();
    res.json(quiz);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, creator: req.user.id });
    if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });
    res.json({ message: 'Kuis berhasil dihapus' });
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
