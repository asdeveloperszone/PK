// ================================================================
// ASTUBE - App Functions
// ================================================================

// ── Videos ──────────────────────────────────────────────────────

async function loadAllVideos() {
  try {
    const snap = await db.ref('videos').once('value');
    if (!snap.exists()) return [];
    const raw = snap.val(); // plain JS object: { videoId: {...}, videoId2: {...} }
    const arr = Object.entries(raw)
      .filter(([, v]) => v && typeof v === 'object')
      .map(([id, v]) => ({ id, ...v }));
    // Sort newest first; videos missing addedAt go to end
    arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return arr;
  } catch(e) { console.error('[ASTUBE] loadAllVideos error:', e); return []; }
}

async function getVideo(id) {
  try {
    const snap = await db.ref(`videos/${id}`).once('value');
    return snap.exists() ? { id, ...snap.val() } : null;
  } catch(e) { return null; }
}

async function incrementViews(id) {
  try { await db.ref(`videos/${id}/views`).transaction(v => (v || 0) + 1); } catch(e) {}
}

// ── History ──────────────────────────────────────────────────────

async function addToHistory(videoId) {
  const user = auth.currentUser;
  if (!user) return;
  try { await db.ref(`users/${user.uid}/history/${videoId}`).set(Date.now()); } catch(e) {}
}

async function getUserHistory(uid) {
  try {
    const snap = await db.ref(`users/${uid}/history`).orderByValue().once('value');
    if (!snap.exists()) return [];
    const arr = [];
    snap.forEach(c => arr.push({ videoId: c.key, watchedAt: c.val() }));
    return arr.reverse();
  } catch(e) { return []; }
}

async function removeFromHistory(videoId) {
  const user = auth.currentUser;
  if (!user) return;
  try { await db.ref(`users/${user.uid}/history/${videoId}`).remove(); } catch(e) {}
}

async function clearHistory() {
  const user = auth.currentUser;
  if (!user) return;
  try { await db.ref(`users/${user.uid}/history`).remove(); } catch(e) {}
}

// ── Users ────────────────────────────────────────────────────────

// Get full user record from DB
async function getUserData(uid) {
  try {
    const snap = await db.ref(`users/${uid}`).once('value');
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}

// Called on every login/signup.
// IMPORTANT: never overwrites photoUrl — that is managed only by profile page.
async function createUserRecord(user) {
  try {
    const snap = await db.ref(`users/${user.uid}`).once('value');
    if (!snap.exists()) {
      // Brand new user — seed record
      await db.ref(`users/${user.uid}`).set({
        name:      user.displayName || 'ASTUBEr',
        email:     user.email       || '',
        photoUrl:  user.photoURL    || '',   // seeded from Google on first login; user can change later
        createdAt: Date.now()
      });
    }
    // Existing user — do NOT touch photoUrl (user may have set a custom one)
    // We also don't overwrite name so custom names survive re-login
  } catch(e) { console.error('createUserRecord error:', e); }
}

// ── Backend calls ─────────────────────────────────────────────────


async function getVideoFormats(ytId) {
  if (!window.BACKEND_URL) throw new Error('Backend offline');
  const res = await fetch(`${window.BACKEND_URL}/get-formats?ytId=${ytId}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to get formats');
  }
  return res.json();
}

async function getVideoInfo(ytId) {
  if (!window.BACKEND_URL) throw new Error('Backend offline');
  const res = await fetch(`${window.BACKEND_URL}/get-info?ytId=${ytId}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to get video info');
  }
  return res.json();
}
