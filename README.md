# CP Majan — Portfolio

A two-track portfolio site (Work = academic/industrial networking, Lab = generative
video) implementing the `Portfolio Mockups v4.dc.html` design exported from Claude
Design (see `chats/chat1.md` for the design conversation, `project/` for the original
mockup bundle).

- `client/` — React + Vite front end
- `server/` — Express API: SQLite storage, admin auth, real video upload + ffmpeg
  transcode + poster-frame extraction

## Requirements

- Node.js 20+
- **ffmpeg and ffprobe on PATH** (used for real video transcoding and poster-frame
  extraction — `apt-get install ffmpeg` on Debian/Ubuntu, `brew install ffmpeg` on
  macOS)

## Setup

```bash
cd server
npm install
cp .env.example .env   # edit JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
npm run seed            # populates the two tracks with the content from the design chat
npm run dev              # http://localhost:4000

cd ../client
npm install
npm run dev              # http://localhost:5173 (proxies /api and /uploads to :4000)
```

Without `ADMIN_PASSWORD_HASH` set, the server falls back to a dev-only password
(`changeme`) so it boots out of the box — set a real hash before deploying:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## What's real vs. mocked

Everything in the admin flow is a real, working feature, not a prototype fake:

- Admin auth is a real bcrypt + JWT httpOnly-cookie session (single admin account).
- Uploading a video runs it through actual `ffmpeg` — H.264/AAC transcode, real
  progress reported back to the browser, and three real extracted poster-frame
  candidates to choose from.
- Publishing, unpublishing, editing and deleting entries persist to a real SQLite
  database (`server/data/portfolio.sqlite`).
- The public Work/Lab/Entry/About pages read live data from the API; nothing is
  hardcoded in the front end.

The only intentional placeholders are images/video for entries that haven't had
media uploaded yet — those render as plain empty slots rather than fake content,
per the project's design decision to ship without stock media.

## Design fidelity notes

The original mockup (`project/Portfolio Mockups v4.dc.html`) is a Claude Design
prototype (`x-dc`/`sc-if`/`sc-for` custom elements, not portable markup) — this repo
recreates its visual system (Instrument Serif + JetBrains Mono, paper/ink palette,
vermilion accent, dark Lab masthead) in ordinary React + CSS rather than copying its
internal structure, per the handoff `README.md`'s own instructions. A few small,
deliberate deviations from the static mockup, made necessary by having a real
backend instead of fake state:

- The mockup's Visitor/Admin *preview toggle* is replaced by real sign-in/sign-out.
- The Entry page's video area plays a real `<video>` element when footage exists
  (with chapter markers that seek the video) instead of a static progress-bar graphic.
- The mockup's two-still "stills" grid on the Entry page isn't backed by a schema
  concept, so it was dropped rather than faked.
