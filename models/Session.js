const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  optionIndex: Number,
  correct: Boolean,
  timeMs: Number,
  points: Number
});

const participantSchema = new mongoose.Schema({
  socketId:      String,
  name:          { type: String, required: true },
  userId:        mongoose.Schema.Types.ObjectId,
  score:         { type: Number, default: 0 },
  answers:       [answerSchema],
  isActive:      { type: Boolean, default: true },
  currentStreak: { type: Number, default: 0 }
});

const sessionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  currentQuestion: { type: Number, default: -1 },
  participants: [participantSchema],
  questionStartTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
