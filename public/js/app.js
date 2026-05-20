/* ================================================================
   KAJI.IN — SHARED UTILITIES
   ================================================================ */

// ── TOAST ──────────────────────────────────────────────────────
const Toast = {
  _get() {
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
    return c;
  },
  show(message, type = 'info', duration = 3500) {
    const icons = { success: '花', error: '誤', warning: '警', info: '報' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    this._get().appendChild(el);
    setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 280); }, duration);
  },
  success: (m,d) => Toast.show(m,'success',d),
  error:   (m,d) => Toast.show(m,'error',d),
  warning: (m,d) => Toast.show(m,'warning',d),
  info:    (m,d) => Toast.show(m,'info',d)
};

// ── AUTH ────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('kaji_token'),
  getUser() {
    try { const u = localStorage.getItem('kaji_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem('kaji_token', token);
    localStorage.setItem('kaji_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('kaji_token');
    localStorage.removeItem('kaji_user');
  },
  isLoggedIn: () => !!localStorage.getItem('kaji_token'),
  requireAuth(redirect = '/login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirect + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      return false;
    }
    return true;
  },
  isAdmin() { const u = this.getUser(); return u?.role === 'admin'; },
  isTeacher() { const u = this.getUser(); return u?.role === 'teacher' || u?.role === 'admin'; },
  logout() { this.clearSession(); window.location.href = '/'; }
};

// ── API ─────────────────────────────────────────────────────────
const api = {
  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api' + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { Auth.clearSession(); window.location.href = '/login.html'; throw new Error('Sesi berakhir'); }
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  },
  get:    (p)    => api.request('GET',    p),
  post:   (p, b) => api.request('POST',   p, b),
  put:    (p, b) => api.request('PUT',    p, b),
  delete: (p)    => api.request('DELETE', p)
};

// ── SITE SETTINGS ───────────────────────────────────────────────
window.SITE = {};

async function loadSiteSettings() {
  try {
    const s = await fetch('/api/settings').then(r => r.json());
    window.SITE = s;

    // Apply CSS variable overrides
    const root = document.documentElement;
    if (s.primaryColor)      root.style.setProperty('--sakura',         s.primaryColor);
    if (s.secondaryColor)    root.style.setProperty('--sky',            s.secondaryColor);
    if (s.accentColor)       root.style.setProperty('--honey',          s.accentColor);
    if (s.bgColor)           root.style.setProperty('--bg',             s.bgColor);
    if (s.heroBgColor)       root.style.setProperty('--hero-bg',        s.heroBgColor);
    if (s.navbarBg)          root.style.setProperty('--navbar-bg',      s.navbarBg);
    if (s.navbarAccentColor) root.style.setProperty('--navbar-accent',  s.navbarAccentColor);
    if (s.ctaBgColor)        root.style.setProperty('--cta-bg',         s.ctaBgColor);
    if (s.footerBg)          root.style.setProperty('--footer-bg',      s.footerBg);
    if (s.featuresBg)        root.style.setProperty('--features-bg',    s.featuresBg);

    // Update site name in elements
    document.querySelectorAll('[data-site-name]').forEach(el => {
      el.textContent = s.siteName || 'Kaji.in';
    });

    // Announcement banner
    if (s.announcementActive && s.announcementText) {
      showAnnouncement(s.announcementText, s.announcementColor);
    }

    // Maintenance mode
    if (s.maintenanceMode && !Auth.isAdmin()) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;
          background:var(--bg);flex-direction:column;gap:1rem;text-align:center;padding:2rem;">
          <div style="font-family:var(--font-display);font-size:5rem;color:var(--sakura);">工</div>
          <h2 style="font-family:var(--font-display);font-size:1.8rem;">Sedang dalam Perawatan</h2>
          <p style="color:var(--text-mid);">Kaji.in sedang dalam pemeliharaan. Silakan kembali nanti.</p>
        </div>`;
    }

    document.dispatchEvent(new CustomEvent('siteSettingsLoaded', { detail: s }));
  } catch { /* Use CSS defaults */ }
}

function showAnnouncement(text, color = '#FF8AAE') {
  const existing = document.getElementById('announcement-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'announcement-banner';
  banner.className = 'announcement-banner';
  banner.style.background = color;
  banner.innerHTML = `<span>${text}</span><button class="close-btn" onclick="this.parentElement.remove()">×</button>`;
  const navbar = document.querySelector('.navbar') || document.body.firstChild;
  if (navbar) document.body.insertBefore(banner, navbar);
  else document.body.prepend(banner);
}

// ── AVATAR ──────────────────────────────────────────────────────
function renderAvatar(char, sizeClass = '', colorClass = '') {
  return `<span class="avatar ${sizeClass} ${colorClass}">${char || '学'}</span>`;
}

// ── FORMAT ──────────────────────────────────────────────────────
function fmtNumber(n) { return (n || 0).toLocaleString('id-ID'); }
function fmtDate(d)   { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); }
function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)    return `${diff}d lalu`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)}j lalu`;
  return `${Math.floor(diff/86400)} hari lalu`;
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── NAVBAR ──────────────────────────────────────────────────────
function initNavbar() {
  const navbar  = document.querySelector('.navbar');
  if (!navbar) return;
  const toggle  = navbar.querySelector('.navbar-toggle');
  const links   = navbar.querySelector('.navbar-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    document.addEventListener('click', e => { if (!navbar.contains(e.target)) links.classList.remove('open'); });
  }
  const user     = Auth.getUser();
  const userSlot = document.getElementById('nav-user-slot');
  if (userSlot && user) {
    const colorMap = { admin:'avatar-lavender', teacher:'avatar-pink', student:'' };
    userSlot.innerHTML = `
      <span style="width:1px;height:20px;background:var(--border-color);margin:0 0.25rem;"></span>
      ${renderAvatar(user.avatar, 'avatar-sm', colorMap[user.role] || '')}
      <span class="hide-mobile" style="font-size:0.85rem;color:var(--text);">${user.name}</span>
      ${user.role==='admin' ? `<a href="/admin.html" style="font-size:0.78rem;background:var(--lavender-light);color:var(--lavender);padding:0.2rem 0.5rem;border-radius:var(--radius-full);font-family:var(--font-display);font-weight:700;">管 Admin</a>` : ''}
      <button class="nav-logout" onclick="Auth.logout()">出</button>`;
  }
}

// ── LOADING HELPERS ─────────────────────────────────────────────
function showLoadingIn(el, text = 'Memuat...') {
  if (!el) return;
  el.innerHTML = `<div class="loading-screen"><div class="spinner spinner-lg"></div>
    <p style="font-family:var(--font-display);font-size:0.82rem;color:var(--text-soft);">${text}</p></div>`;
}
function showErrorIn(el, text = 'Gagal memuat data.') {
  if (!el) return;
  el.innerHTML = `<div class="empty-state"><div class="empty-icon">誤</div><h3>${text}</h3>
    <button class="btn btn-outline btn-sm mt-2" onclick="location.reload()">Coba Lagi</button></div>`;
}

// ── COMMENTS WIDGET ─────────────────────────────────────────────
async function renderComments(quizId, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  showLoadingIn(el, 'Memuat komentar...');
  try {
    const comments = await fetch('/api/comments/' + quizId).then(r => r.json());
    if (!comments.length) {
      el.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-soft);">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;">言</div>
        <div style="font-family:var(--font-display);font-size:0.85rem;">Belum ada komentar. Jadilah yang pertama!</div></div>`;
      return;
    }
    const user = Auth.getUser();
    el.innerHTML = comments.map(c => `
      <div class="comment-item">
        ${renderAvatar(c.userAvatar, 'avatar-sm', c.userRole==='teacher'?'avatar-pink':c.userRole==='admin'?'avatar-lavender':'')}
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-name">${escHtml(c.userName)}</span>
            ${c.userRole !== 'student' ? `<span class="badge badge-${c.userRole==='admin'?'lavender':'pink'}" style="font-size:0.65rem;">${c.userRole==='admin'?'管 Admin':'師 Guru'}</span>` : ''}
            <span class="comment-time">${timeAgo(c.createdAt)}</span>
            ${user && (user.id === c.user || user.role === 'admin') ?
              `<button class="comment-delete" onclick="deleteComment('${c._id}','${containerId}','${quizId}')">削</button>` : ''}
          </div>
          <div class="comment-text">${escHtml(c.text)}</div>
        </div>
      </div>`).join('');
  } catch {
    showErrorIn(el, 'Gagal memuat komentar');
  }
}

async function deleteComment(id, containerId, quizId) {
  if (!confirm('Hapus komentar ini?')) return;
  try {
    await api.delete('/comments/' + id);
    renderComments(quizId, containerId);
  } catch (err) { Toast.error(err.message); }
}

async function postComment(quizId, text, containerId) {
  if (!text?.trim()) { Toast.warning('Komentar tidak boleh kosong'); return false; }
  try {
    await api.post('/comments/' + quizId, { text });
    await renderComments(quizId, containerId);
    return true;
  } catch (err) { Toast.error(err.message); return false; }
}

// ── AUTO INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  initNavbar();
});
