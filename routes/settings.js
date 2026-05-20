const router = require('express').Router();
const SiteSettings = require('../models/SiteSettings');

// Public endpoint — return non-sensitive settings
router.get('/', async (req, res) => {
  try {
    const s = await SiteSettings.getSettings();
    res.json({
      siteName:         s.siteName,
      tagline:          s.tagline,
      siteIcon:         s.siteIcon,
      heroTitle:        s.heroTitle,
      heroSubtitle:     s.heroSubtitle,
      heroDescription:  s.heroDescription,
      heroCTA1:         s.heroCTA1,
      heroCTA2:         s.heroCTA2,
      primaryColor:     s.primaryColor,
      secondaryColor:   s.secondaryColor,
      accentColor:      s.accentColor,
      bgColor:          s.bgColor,
      announcementText:   s.announcementText,
      announcementActive: s.announcementActive,
      announcementColor:  s.announcementColor,
      enableComments:   s.enableComments,
      enableBGM:        s.enableBGM,
      enableRegister:   s.enableRegister,
      maintenanceMode:  s.maintenanceMode,
      footerText:       s.footerText
    });
  } catch {
    res.status(500).json({ message: 'Gagal memuat pengaturan' });
  }
});

module.exports = router;
