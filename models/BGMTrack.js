const mongoose = require('mongoose');

const bgmTrackSchema = new mongoose.Schema({
  label:   { type: String, required: true, trim: true },
  url:     { type: String, required: true, trim: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('BGMTrack', bgmTrackSchema);
