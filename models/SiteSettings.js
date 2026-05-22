const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  _key: { type: String, default: 'global', unique: true },

  // Branding
  siteName:    { type: String, default: 'Quizku' },
  tagline:     { type: String, default: 'Quiz Seru, Siapa Juara？' },
  siteIcon:    { type: String, default: '学' },
  chipText:    { type: String, default: 'Platform Kuis Bergaya Manga！' },

  // Hero section
  heroTitle:       { type: String, default: 'Quizku' },
  heroSubtitle:    { type: String, default: 'Quiz Seru, Siapa Juara？' },
  heroDescription: { type: String, default: 'Buat kuis pilihan ganda, tantang teman, dan nikmati sesi quiz live yang penuh semangat! Cocok untuk pelajaran apa saja.' },
  heroCTA1:        { type: String, default: '始 Mulai Gratis' },
  heroCTA2:        { type: String, default: '参 Gabung Kuis' },

  // Primary colors (CSS variable overrides)
  primaryColor:   { type: String, default: '' },
  secondaryColor: { type: String, default: '' },
  accentColor:    { type: String, default: '' },
  bgColor:        { type: String, default: '' },

  // Extended theme colors
  heroBgColor:       { type: String, default: '' },
  navbarBg:          { type: String, default: '' },
  navbarAccentColor: { type: String, default: '' },
  ctaBgColor:        { type: String, default: '' },
  footerBg:          { type: String, default: '' },
  featuresBg:        { type: String, default: '' },

  // Announcement banner
  announcementText:   { type: String, default: '' },
  announcementActive: { type: Boolean, default: false },
  announcementColor:  { type: String, default: '#FFD700' },

  // Feature toggles
  enableComments:  { type: Boolean, default: true },
  enableBGM:       { type: Boolean, default: true },
  enableRegister:  { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },

  // Footer
  footerText: { type: String, default: '勉強 Terus Belajar · 学習 Terus Berlatih' }
}, { timestamps: true });

siteSettingsSchema.statics.getSettings = async function () {
  let s = await this.findOne({ _key: 'global' });
  if (!s) s = await this.create({ _key: 'global' });
  return s;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
