const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  quiz:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, required: true },
  userAvatar: { type: String, default: '学' },
  userRole:   { type: String, default: 'student' },
  text:       { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true });

commentSchema.index({ quiz: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
