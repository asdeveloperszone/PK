// ================================================================
// ASTUBE - Firebase Config & Shared Utilities
// ================================================================

const firebaseConfig = {
  apiKey:            "AIzaSyD_2Ma7FdXVAmEjRXXvfPNb9Vvvl3FJLzc",
  authDomain:        "astube-asdeveloper.firebaseapp.com",
  databaseURL:       "https://astube-asdeveloper-default-rtdb.firebaseio.com",
  projectId:         "astube-asdeveloper",
  storageBucket:     "astube-asdeveloper.firebasestorage.app",
  messagingSenderId: "511365641957",
  appId:             "1:511365641957:web:a246b5590e3753e5b7460c",
  measurementId:     "G-KKBPXDL8JD"
};

firebase.initializeApp(firebaseConfig);

// ── YouTube Data API v3 key ──────────────────────────────────────
// Add your key here: https://console.cloud.google.com → APIs → YouTube Data API v3
window.YT_API_KEY = 'AIzaSyAdnJhHuZe4c0BRPhEyKb-TxN2lDK41ZXA';
const db             = firebase.database();
const auth           = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

window.BACKEND_URL    = null;
window.BACKEND_STATUS = 'checking';

// ================================================================
// BACKEND STATUS
// ================================================================

function isLocalhost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

async function pingBackend(url) {
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res   = await fetch(`${url}/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch (e) { return false; }
}

async function initBackendUrl() {
  setBackendStatus('checking');
  let url = null;

  if (isLocalhost()) {
    url = 'http://localhost:5000';
  } else {
    try {
      const snap = await db.ref('config/backendUrl').once('value');
      url = snap.val();
    } catch (e) { console.error('Firebase read error:', e); }
  }

  if (!url) { setBackendStatus('offline'); return; }

  const alive = await pingBackend(url);
  if (alive) {
    window.BACKEND_URL = url;
    setBackendStatus('online');
  } else {
    window.BACKEND_URL = null;
    setBackendStatus('offline');
  }
}

function setBackendStatus(status) {
  window.BACKEND_STATUS = status;
  const dot    = document.getElementById('backend-dot');
  const label  = document.getElementById('backend-label');
  const banner = document.getElementById('offline-banner');
  if (dot)    dot.className    = 'backend-dot bk-' + status;
  if (label)  label.textContent = { checking: 'Checking server…', online: 'Server Online', offline: 'Server Offline' }[status] || '';
  if (banner) banner.style.display = (status === 'offline') ? 'flex' : 'none';
}

function startStatusPoller() {
  setInterval(async () => {
    if (window.BACKEND_URL) {
      const alive = await pingBackend(window.BACKEND_URL);
      if (!alive) { window.BACKEND_URL = null; setBackendStatus('offline'); }
      else setBackendStatus('online');
    } else {
      await initBackendUrl();
    }
  }, 30000);
}

// ================================================================
// UTILITIES
// ================================================================

function formatCount(n) {
  n = parseInt(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

function formatDuration(s) {
  s = Math.floor(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function timeAgo(ts) {
  if (!ts) return '';
  const d    = Date.now() - ts;
  const mins = Math.floor(d / 60000),    hrs  = Math.floor(d / 3600000),
        days = Math.floor(d / 86400000), wks  = Math.floor(d / 604800000),
        mos  = Math.floor(d / 2592000000), yrs = Math.floor(d / 31536000000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs  < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  if (days < 7)  return `${days} day${days > 1 ? 's' : ''} ago`;
  if (wks  < 4)  return `${wks} week${wks > 1 ? 's' : ''} ago`;
  if (mos  < 12) return `${mos} month${mos > 1 ? 's' : ''} ago`;
  return `${yrs} year${yrs > 1 ? 's' : ''} ago`;
}

function extractVideoId(input) {
  if (!input) return null;
  input = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Avatar helper ────────────────────────────────────────────────
// Sets any element to show a photo or an initial letter fallback
function setAvatarEl(el, photoUrl, fallbackName) {
  const initial = (fallbackName || 'U').charAt(0).toUpperCase();
  el.innerHTML  = '';
  if (photoUrl) {
    const img   = document.createElement('img');
    img.src     = photoUrl;
    img.alt     = '';
    img.onerror = () => { el.innerHTML = ''; el.textContent = initial; };
    el.appendChild(img);
  } else {
    el.textContent = initial;
  }
}

// ── Video card renderer ──────────────────────────────────────────
function renderVideoCard(videoId, v) {
  const thumb   = v.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const dur     = v.durationFormatted || formatDuration(v.duration);
  const name    = v.addedByName || v.channel || 'Unknown';
  const photo   = v.addedByPhotoUrl || '';
  // Avatar: img tag if we have a URL, else initial letter
  const avHtml  = photo
    ? `<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'">`
    : name.charAt(0).toUpperCase();
  // Escape single-quotes for onclick string params
  const titleE  = (v.title || 'video').replace(/'/g, "\\'");
  const nameE   = name.replace(/'/g, "\\'");

  return `
  <div class="video-card" onclick="location.href='player.html?v=${videoId}'">
    <div class="card-thumb">
      <img src="${thumb}" alt="" loading="lazy"
        onerror="this.src='https://i.ytimg.com/vi/${videoId}/hqdefault.jpg'"/>
      ${dur ? `<span class="dur-badge">${dur}</span>` : ''}
    </div>
    <div class="card-info">
      <div class="card-avatar">${avHtml}</div>
      <div class="card-meta">
        <p class="card-title">${v.title || 'Untitled'}</p>
        <p class="card-ch">${name}</p>
        <p class="card-stats">${formatCount(v.views)} views · ${timeAgo(v.addedAt)}</p>
      </div>
    </div>
  </div>`;
}

// ── Toast notifications ──────────────────────────────────────────
function showToast(msg, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t       = document.createElement('div');
  t.className   = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

// ── Fetch log (add-video page) ───────────────────────────────────
function addLog(containerId, message, type = 'info') {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.style.display = 'block';
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', loading: '⏳' };
  const line  = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.innerHTML = `<span>${icons[type] || '•'}</span><span>${message}</span>`;
  c.appendChild(line);
  c.scrollTop = c.scrollHeight;
}

function clearLog(containerId) {
  const c = document.getElementById(containerId);
  if (c) { c.innerHTML = ''; c.style.display = 'none'; }
}

// ── Auth helpers ─────────────────────────────────────────────────
async function requireAuth() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      if (!user) location.href = 'login.html?redirect=' + encodeURIComponent(location.href);
      else resolve(user);
    });
  });
}

// Updates the header avatar on every page.
// Priority: custom photoUrl stored in DB > Google Auth photo > initial letter
function updateHeaderAuth(user) {
  const btn = document.getElementById('sign-in-btn');
  const av  = document.getElementById('user-avatar');
  if (user) {
    if (btn) btn.style.display = 'none';
    if (av) {
      av.style.display = 'flex';
      const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
      // Step 1 — show Auth photo instantly (no DB wait)
      setAvatarEl(av, user.photoURL || null, user.displayName || user.email || 'U');
      // Step 2 — override with custom DB photo if user has set one
      db.ref(`users/${user.uid}/photoUrl`).once('value')
        .then(snap => {
          if (snap.exists() && snap.val()) {
            setAvatarEl(av, snap.val(), user.displayName || user.email || 'U');
          }
        })
        .catch(() => {});
    }
  } else {
    if (btn) btn.style.display = 'flex';
    if (av)  av.style.display  = 'none';
  }
}

// Auto-init on every page load
window._backendReadyPromise = (async () => {
  await initBackendUrl();
  startStatusPoller();
  auth.onAuthStateChanged(updateHeaderAuth);
})();
