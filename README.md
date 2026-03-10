# ASTUBE - Setup Guide

## What You Have Built
A complete YouTube-like platform where:
- Any logged-in user can add YouTube videos by pasting a URL
- yt-dlp fetches full metadata (title, description, thumbnail, duration)
- Videos play with zero YouTube UI in a custom HTML5 player
- Everything is free: Firebase + GitHub Pages + Termux

---

## File Structure
```
astube/
├── frontend/          ← Deploy to GitHub Pages
│   ├── index.html     ← Home feed
│   ├── search.html    ← Search
│   ├── player.html    ← Custom video player
│   ├── add-video.html ← Add YouTube URL
│   ├── profile.html   ← Profile + history
│   ├── login.html     ← Auth
│   ├── config.js      ← Firebase config (already filled)
│   ├── app.js         ← Shared functions
│   └── style.css      ← AMOLED black + red theme
│
├── backend/           ← Copy to Termux
│   ├── setup.sh       ← Run once to install everything
│   ├── server.py      ← Flask + yt-dlp server
│   ├── save_url.py    ← Saves tunnel URL to Firebase
│   └── start.sh       ← Start everything (run daily)
│
├── firebase-rules.json  ← Paste into Firebase console
└── README.md
```

---

## Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **astube-asdeveloper**
3. Enable **Realtime Database**:
   - Build → Realtime Database → Create database
   - Start in **test mode** (we'll add rules next)
4. Paste database rules:
   - Realtime Database → Rules tab
   - Replace all content with contents of `firebase-rules.json`
   - Publish
5. Enable **Authentication**:
   - Build → Authentication → Get started
   - Enable **Google** provider
   - Enable **Email/Password** provider
6. Add GitHub Pages domain to authorized domains:
   - Authentication → Settings → Authorized domains
   - Add: `YOUR_USERNAME.github.io`

---

## Step 2: GitHub Pages Setup

1. Create a new GitHub repository named `astube` (or any name)
2. Upload ALL files from the `frontend/` folder to the repo root
3. Go to: Settings → Pages → Source: **Deploy from branch → main**
4. Your site will be live at: `https://YOUR_USERNAME.github.io/astube`

---

## Step 3: Termux Backend Setup

Install [Termux](https://f-droid.org/en/packages/com.termux/) from F-Droid (NOT Google Play).

Copy all files from `backend/` to Termux home directory, then:

```bash
# Run once to install everything
bash setup.sh
```

---

## Step 4: Start the Backend (Daily)

Every time you want ASTUBE to work:

```bash
bash start.sh
```

This will:
1. Start Flask server on port 5000
2. Start Cloudflare tunnel → get random URL
3. Auto-save URL to Firebase
4. Your GitHub Pages site connects automatically

**Keep Termux open and screen on** while serving.

---

## Daily Usage

```
Morning:
  Open Termux → bash start.sh → done!

Evening:
  Close Termux when not needed
```

---

## How Videos Work

**Adding a video:**
1. Go to Add Video page
2. Paste any YouTube URL
3. ASTUBE fetches title, thumbnail, duration via yt-dlp
4. Select category → Add
5. Saved to Firebase forever

**Playing a video:**
1. Click any video card
2. Player requests fresh .mp4 URL from Termux
3. Termux runs yt-dlp (or returns 5-hour cached URL)
4. Video plays in custom HTML5 player

---

## Troubleshooting

**"Backend offline" banner showing:**
- Run `bash start.sh` on Termux
- Check Termux has internet access

**Video won't play:**
- Make sure Termux is running and tunnel is active
- Try refreshing the page (new tunnel URL is auto-fetched from Firebase)

**Can't sign in with Google:**
- Add your GitHub Pages domain to Firebase Auth authorized domains

**yt-dlp fails:**
- Update yt-dlp: `pip install -U yt-dlp`
- YouTube sometimes changes their API; updating yt-dlp fixes it
