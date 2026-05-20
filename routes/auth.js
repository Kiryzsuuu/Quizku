const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const TEACHER_AVATARS = ['師', '先', '賢', '導', '識'];
const STUDENT_AVATARS = ['生', '童', '若', '新', '士'];

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email sudah terdaftar' });

    const pool = role === 'teacher' ? TEACHER_AVATARS : STUDENT_AVATARS;
    const avatar = pool[Math.floor(Math.random() * pool.length)];

    const user = await User.create({ name, email, password, role: role || 'student', avatar });
    res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email atau password salah' });
    res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
