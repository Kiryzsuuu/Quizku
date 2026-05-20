const router = require('express').Router();
const Comment = require('../models/Comment');
const Quiz    = require('../models/Quiz');
const auth    = require('../middleware/auth');

// GET comments for a quiz (public if quiz is public)
router.get('/:quizId', async (req, res) => {
  try {
    const comments = await Comment.find({ quiz: req.params.quizId })
      .sort('-createdAt')
      .limit(100)
      .lean();
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Gagal memuat komentar' });
  }
});

// POST a comment (requires auth)
router.post('/:quizId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
    if (text.trim().length > 500) return res.status(400).json({ message: 'Komentar maksimal 500 karakter' });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Kuis tidak ditemukan' });

    const comment = await Comment.create({
      quiz:       req.params.quizId,
      user:       req.user.id,
      userName:   req.user.name,
      userAvatar: req.user.avatar || '学',
      userRole:   req.user.role,
      text:       text.trim()
    });
    res.status(201).json(comment);
  } catch {
    res.status(500).json({ message: 'Gagal mengirim komentar' });
  }
});

// DELETE a comment (own comment, or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Tidak diizinkan menghapus komentar ini' });
    }
    await comment.deleteOne();
    res.json({ message: 'Komentar dihapus' });
  } catch {
    res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
});

module.exports = router;
