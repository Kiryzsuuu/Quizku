const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text:     { type: String, default: '' },
  isCorrect:{ type: Boolean, default: false },
  imageUrl: { type: String, default: '' }
});

const matchPairSchema = new mongoose.Schema({
  left:  { type: String, required: true },
  right: { type: String, required: true }
});

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pilihan_ganda','pilihan_kartu','benar_salah','pilihan_gambar','cocokkan'],
    default: 'pilihan_ganda'
  },
  text:       { type: String, required: true },
  imageUrl:   { type: String, default: '' },
  videoUrl:   { type: String, default: '' },
  options:    { type: [optionSchema], default: [] },
  matchPairs: { type: [matchPairSchema], default: [] },
  timeLimit:  { type: Number, default: 20, min: 5, max: 120 },
  points:     { type: Number, default: 1000 }
});

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions:   [questionSchema],
  isPublic:    { type: Boolean, default: false },
  coverColor:  { type: String, default: '#FF8AAE' },
  bgmUrl:      { type: String, default: '' },
  bgmLabel:    { type: String, default: '' },
  streakBonus: {
    enabled:     { type: Boolean, default: false },
    streakCount: { type: Number, default: 3 },
    multiplier:  { type: Number, default: 1.5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
